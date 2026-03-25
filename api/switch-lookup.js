// api/switch-lookup.js
// Lookup environmental + nutritional data from SWITCH Food Explorer API
// Uses comprehensive IT→EN dictionary for automatic translation

const { IT_TO_EN } = require('./food-translations.js');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { nameEn, name } = req.method === 'GET' ? req.query : req.body;
    const searchTerm = (nameEn || name || '').trim();

    if (!searchTerm) {
      return res.status(400).json({ error: 'No search term provided (nameEn or name)' });
    }

    // Fetch all food items from SWITCH API
    const response = await fetch(
      'https://api-gateway-switchproject.posti.world/api-refactoring/api/v1/bo/SWITCH_FOOD_EX/FOOD_ITEMS/'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch SWITCH data');
    }

    const foodItems = await response.json();
    const normalizedSearch = searchTerm.toLowerCase().trim();

    // Step 1: Check IT→EN dictionary for translation
    const translatedName = IT_TO_EN[normalizedSearch];
    
    // Step 2: Build search candidates (in priority order)
    const searchCandidates = [];
    if (translatedName) {
      searchCandidates.push(translatedName.toLowerCase());
    }
    searchCandidates.push(normalizedSearch);
    
    // Also try without common Italian adjectives
    const removeWords = ['bianco', 'bianca', 'rosso', 'rossa', 'verde', 'giallo', 'gialla',
      'fresco', 'fresca', 'intero', 'intera', 'magro', 'magra', 'greco', 'greca',
      'naturale', 'scremato', 'parzialmente', 'white', 'fresh', 'whole', 'low-fat', 'greek'];
    let cleanedSearch = normalizedSearch;
    removeWords.forEach(word => {
      cleanedSearch = cleanedSearch.replace(new RegExp(`\\b${word}\\b`, 'gi'), '').trim();
    });
    cleanedSearch = cleanedSearch.replace(/\s+/g, ' ').trim();
    
    if (cleanedSearch !== normalizedSearch) {
      // Check dictionary for cleaned version too
      const cleanedTranslation = IT_TO_EN[cleanedSearch];
      if (cleanedTranslation) {
        searchCandidates.push(cleanedTranslation.toLowerCase());
      }
      searchCandidates.push(cleanedSearch);
    }

    // Step 3: Find best match across all candidates
    let bestMatch = null;
    let bestScore = 0;

    for (const item of foodItems) {
      // Check both FOOD COMMODITY ITEM and SUB-GROUP (fish/seafood often have empty ITEM)
      const itemName = (item['FOOD COMMODITY ITEM'] || '').toLowerCase().trim();
      const subGroup = (item['FOOD COMMODITY SUB-GROUP'] || '').toLowerCase().trim();
      
      // Use itemName if available, otherwise fall back to subGroup
      const searchableName = itemName || subGroup;
      if (!searchableName) continue;

      for (const candidate of searchCandidates) {
        let score = 0;

        // Exact match (check both itemName and subGroup)
        if (searchableName === candidate) {
          score = 100;
        }
        // searchableName contains the candidate exactly
        else if (searchableName.includes(candidate) && candidate.length > 2) {
          score = 90 + Math.min(9, candidate.length);
        }
        // Candidate contains the searchableName
        else if (candidate.includes(searchableName) && searchableName.length > 2) {
          score = 85;
        }
        // Check Italian name in parentheses
        else {
          const italianMatch = searchableName.match(/\(([^)]+)\)/);
          if (italianMatch) {
            const italianName = italianMatch[1].toLowerCase();
            if (italianName === normalizedSearch || normalizedSearch.includes(italianName) || italianName.includes(normalizedSearch)) {
              score = 92;
            }
          }
        }

        // Word-level matching as fallback
        if (score === 0) {
          const candidateWords = candidate.split(/\s+/).filter(w => w.length > 2);
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

        // Early exit on exact match
        if (bestScore === 100) break;
      }
      if (bestScore === 100) break;
    }

    if (!bestMatch || bestScore < 40) {
      return res.status(200).json({
        found: false,
        searchTerm,
        translatedTo: translatedName || null,
        message: 'No matching food item found in SWITCH database'
      });
    }

    // Format response
    const result = {
      found: true,
      matchScore: bestScore,
      searchTerm,
      translatedTo: translatedName || null,
      matchedItem: bestMatch['FOOD COMMODITY ITEM'] || bestMatch['FOOD COMMODITY SUB-GROUP'],
      switchId: bestMatch.id,
      
      environmental: {
        carbonFootprint: parseFloat(bestMatch.carbonFootprint) || null,
        carbonFootprintUnit: bestMatch.unitsCarbonFootprint || 'kg CO2e/kg',
        carbonFootprintBanding: bestMatch.carbonFootprintBanding,
        carbonFootprintImpact: bestMatch.carbonFootprintBandingImpactDescription,
        waterFootprint: parseFloat(bestMatch.waterFootprint) || null,
        waterFootprintUnit: bestMatch.unitsWaterfootprint || 'liters/kg',
        waterFootprintBanding: bestMatch.waterFootprintBanding,
        waterFootprintImpact: bestMatch.waterFootprintBandingImpactDescription,
        environmentalScore: bestMatch.environmentalScore,
      },
      
      nutrition: {
        energy: parseFloat(bestMatch.energy) || null,
        proteins: parseFloat(bestMatch.proteins) || null,
        fat: parseFloat(bestMatch.fat) || null,
        saturatedFat: parseFloat(bestMatch.saturatedFat) || null,
        monounsaturatedFat: parseFloat(bestMatch.monounsaturatedFat) || null,
        polyunsaturatedFat: parseFloat(bestMatch.polyunsaturatedFat) || null,
        carbohydrates: parseFloat(bestMatch.carbohydrates) || null,
        soluble: parseFloat(bestMatch.soluble) || null,
        fiber: parseFloat(bestMatch.fiber) || null,
      },
      
      category: {
        group: bestMatch['FOOD COMMODITY GROUP'],
        subGroup: bestMatch['FOOD COMMODITY SUB-GROUP'],
      },
      
      recommendations: {
        frequency: bestMatch.frequencyOfConsumption,
        recommendation: bestMatch.recommendation,
        sustainabilityNutritional: bestMatch.Recommendation_on_Sustainability_and_Nutritional,
      }
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in switch-lookup:', error);
    return res.status(500).json({
      error: 'Failed to lookup food item',
      details: error.message
    });
  }
};
