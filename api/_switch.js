// api/_switch.js
// Shared SWITCH Food Explorer access: item list, matching, and dish aggregation.
// All nutritional/environmental numbers come from the SWITCH DB, never from AI.

const { IT_TO_EN } = require('./food-translations.js');

const SWITCH_URL =
  'https://api-gateway-switchproject.posti.world/api-refactoring/api/v1/bo/SWITCH_FOOD_EX/FOOD_ITEMS/';

let cachedItems = null;
let cachedAt = 0;

async function getItems() {
  if (cachedItems && Date.now() - cachedAt < 60 * 60 * 1000) return cachedItems;
  const response = await fetch(SWITCH_URL);
  if (!response.ok) throw new Error('Failed to fetch SWITCH data');
  cachedItems = await response.json();
  cachedAt = Date.now();
  return cachedItems;
}

// Display name of an item (fish/seafood often have an empty ITEM, use SUB-GROUP)
function itemName(item) {
  return (item['FOOD COMMODITY ITEM'] || item['FOOD COMMODITY SUB-GROUP'] || '').trim();
}

// Unique list of names, for the recognition prompt
async function getItemNames() {
  const items = await getItems();
  return [...new Set(items.map(itemName).filter(Boolean))];
}

function findExact(items, name) {
  if (!name) return null;
  const target = name.toLowerCase().trim();
  return items.find((item) => itemName(item).toLowerCase() === target) || null;
}

// Fuzzy match with IT→EN dictionary (same scoring as the original switch-lookup)
function findFuzzy(items, searchTerm) {
  const normalizedSearch = (searchTerm || '').toLowerCase().trim();
  if (!normalizedSearch) return { item: null, score: 0, translatedName: null };

  const translatedName = IT_TO_EN[normalizedSearch];
  const searchCandidates = [];
  if (translatedName) searchCandidates.push(translatedName.toLowerCase());
  searchCandidates.push(normalizedSearch);

  const removeWords = ['bianco', 'bianca', 'rosso', 'rossa', 'verde', 'giallo', 'gialla',
    'fresco', 'fresca', 'intero', 'intera', 'magro', 'magra', 'greco', 'greca',
    'naturale', 'scremato', 'parzialmente', 'white', 'fresh', 'whole', 'low-fat', 'greek'];
  let cleanedSearch = normalizedSearch;
  removeWords.forEach((word) => {
    cleanedSearch = cleanedSearch.replace(new RegExp(`\\b${word}\\b`, 'gi'), '').trim();
  });
  cleanedSearch = cleanedSearch.replace(/\s+/g, ' ').trim();
  if (cleanedSearch !== normalizedSearch) {
    const cleanedTranslation = IT_TO_EN[cleanedSearch];
    if (cleanedTranslation) searchCandidates.push(cleanedTranslation.toLowerCase());
    searchCandidates.push(cleanedSearch);
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const item of items) {
    const searchableName = itemName(item).toLowerCase();
    if (!searchableName) continue;

    for (const candidate of searchCandidates) {
      let score = 0;
      if (searchableName === candidate) {
        score = 100;
      } else if (searchableName.includes(candidate) && candidate.length > 2) {
        score = 90 + Math.min(9, candidate.length);
      } else if (candidate.includes(searchableName) && searchableName.length > 2) {
        score = 85;
      } else {
        const italianMatch = searchableName.match(/\(([^)]+)\)/);
        if (italianMatch) {
          const italianName = italianMatch[1].toLowerCase();
          if (italianName === normalizedSearch || normalizedSearch.includes(italianName) || italianName.includes(normalizedSearch)) {
            score = 92;
          }
        }
      }
      if (score === 0) {
        const candidateWords = candidate.split(/\s+/).filter((w) => w.length > 2);
        for (const word of candidateWords) {
          if (searchableName === word) score = Math.max(score, 80);
          else if (searchableName.startsWith(word)) score = Math.max(score, 70);
          else if (searchableName.includes(word) && word.length > 3) score = Math.max(score, 55);
        }
      }
      if (score > bestScore) {
        bestMatch = item;
        bestScore = score;
      }
      if (bestScore === 100) break;
    }
    if (bestScore === 100) break;
  }

  if (!bestMatch || bestScore < 40) return { item: null, score: bestScore, translatedName };
  return { item: bestMatch, score: bestScore, translatedName };
}

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

// Same response shape as the original switch-lookup, for a single item
function formatItem(item, extra = {}) {
  return {
    found: true,
    matchedItem: itemName(item),
    switchId: item.id,
    environmental: {
      carbonFootprint: num(item.carbonFootprint),
      carbonFootprintUnit: item.unitsCarbonFootprint || 'kg CO2e/kg',
      carbonFootprintBanding: item.carbonFootprintBanding,
      carbonFootprintImpact: item.carbonFootprintBandingImpactDescription,
      waterFootprint: num(item.waterFootprint),
      waterFootprintUnit: item.unitsWaterfootprint || 'liters/kg',
      waterFootprintBanding: item.waterFootprintBanding,
      waterFootprintImpact: item.waterFootprintBandingImpactDescription,
      environmentalScore: item.environmentalScore,
    },
    nutrition: {
      energy: num(item.energy),
      proteins: num(item.proteins),
      fat: num(item.fat),
      saturatedFat: num(item.saturatedFat),
      monounsaturatedFat: num(item.monounsaturatedFat),
      polyunsaturatedFat: num(item.polyunsaturatedFat),
      carbohydrates: num(item.carbohydrates),
      soluble: num(item.soluble),
      fiber: num(item.fiber),
    },
    category: {
      group: item['FOOD COMMODITY GROUP'],
      subGroup: item['FOOD COMMODITY SUB-GROUP'],
    },
    recommendations: {
      frequency: item.frequencyOfConsumption,
      recommendation: item.recommendation,
      sustainabilityNutritional: item.Recommendation_on_Sustainability_and_Nutritional,
    },
    ...extra,
  };
}

const round = (v, digits) => (v === null ? null : Math.round(v * 10 ** digits) / 10 ** digits);

// Dish = list of { name, switchItem, grams }. Nutrition per 100 g in SWITCH, footprints per kg.
// Returns the same shape as a single item (values per 100 g of dish / per kg of dish),
// plus per-portion totals and the per-ingredient breakdown.
async function lookupDish({ dishName, ingredients }) {
  const items = await getItems();
  const nutrientKeys = ['energy', 'proteins', 'fat', 'saturatedFat', 'carbohydrates', 'soluble', 'fiber'];

  const breakdown = ingredients
    .filter((ing) => ing && (ing.name || ing.switchItem))
    .map((ing) => {
      const grams = Math.max(0, parseFloat(ing.grams) || 0);
      const item = findExact(items, ing.switchItem) || findFuzzy(items, ing.switchItem || ing.name).item
        || (ing.switchItem ? findFuzzy(items, ing.name).item : null);
      if (!item || grams === 0) {
        return { name: ing.name, switchItem: ing.switchItem || null, grams, found: false };
      }
      const nutrition = {};
      nutrientKeys.forEach((key) => {
        const per100 = num(item[key]);
        nutrition[key] = per100 === null ? null : (per100 * grams) / 100;
      });
      const cf = num(item.carbonFootprint);
      const wf = num(item.waterFootprint);
      return {
        name: ing.name,
        grams,
        found: true,
        matchedItem: itemName(item),
        group: item['FOOD COMMODITY GROUP'],
        co2: cf === null ? null : (cf * grams) / 1000, // kg CO2e for this amount
        water: wf === null ? null : (wf * grams) / 1000, // liters for this amount
        carbonFootprintPerKg: cf,
        waterFootprintPerKg: wf,
        environmentalScore: item.environmentalScore,
        nutrition,
      };
    });

  const found = breakdown.filter((b) => b.found);
  const totalGrams = found.reduce((s, b) => s + b.grams, 0);
  const allGrams = breakdown.reduce((s, b) => s + b.grams, 0);

  if (found.length === 0 || totalGrams === 0) {
    return { found: false, isDish: true, dishName, ingredients: breakdown, message: 'No ingredient found in SWITCH database' };
  }

  const sum = (fn) => {
    const values = found.map(fn).filter((v) => v !== null && v !== undefined);
    return values.length ? values.reduce((s, v) => s + v, 0) : null;
  };

  const portion = { grams: Math.round(totalGrams) };
  nutrientKeys.forEach((key) => { portion[key] = sum((b) => b.nutrition[key]); });
  portion.co2 = sum((b) => b.co2);
  portion.water = sum((b) => b.water);

  const per100 = (v) => (v === null ? null : (v / totalGrams) * 100);
  const perKg = (v) => (v === null ? null : (v / totalGrams) * 1000);

  const totalCo2 = portion.co2 || 0;
  breakdown.forEach((b) => {
    if (b.found) b.co2Share = totalCo2 > 0 && b.co2 !== null ? Math.round((b.co2 / totalCo2) * 100) : null;
  });
  breakdown.sort((a, b) => (b.co2 || 0) - (a.co2 || 0));

  const nutritionPer100 = {};
  nutrientKeys.forEach((key) => { nutritionPer100[key] = round(per100(portion[key]), 1); });

  Object.keys(portion).forEach((key) => {
    if (key !== 'grams') portion[key] = round(portion[key], key === 'co2' ? 3 : 1);
  });
  breakdown.forEach((b) => {
    if (!b.found) return;
    b.co2 = round(b.co2, 3);
    b.water = round(b.water, 1);
    Object.keys(b.nutrition).forEach((k) => { b.nutrition[k] = round(b.nutrition[k], 1); });
  });

  return {
    found: true,
    isDish: true,
    dishName,
    matchedItem: dishName,
    matchScore: 100,
    coverage: allGrams > 0 ? Math.round((totalGrams / allGrams) * 100) : 0,
    environmental: {
      carbonFootprint: round(perKg(portion.co2), 2),
      carbonFootprintUnit: 'kg CO2e/kg',
      waterFootprint: round(perKg(portion.water), 0),
      waterFootprintUnit: 'liters/kg',
      environmentalScore: null,
    },
    nutrition: nutritionPer100,
    portion,
    ingredients: breakdown,
    category: { group: 'DISH', subGroup: null },
  };
}

module.exports = { getItems, getItemNames, itemName, findExact, findFuzzy, formatItem, lookupDish };
