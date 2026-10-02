// src/utils/units.js
// Una sola regola per le unità, condivisa da quiz, schede e confronto.
// - PIATTI: tutto riferito alla PORZIONE (switchData.portion): kcal, g, g CO2e, litri.
// - PRODOTTI SINGOLI: basi native SWITCH: nutrienti per 100 g, CO2e e acqua per 1 kg.

export const UNITS_PORTION = 'portion';
export const UNITS_NATIVE = 'per100g_perkg';

// Etichette delle unità, identiche su tutte le schermate
export function getUnitLabels(language, isDish) {
  const en = language === 'en';
  if (isDish) {
    return {
      calories: en ? 'kcal/portion' : 'kcal/porzione',
      carbs: en ? 'g/portion' : 'g/porzione',
      protein: en ? 'g/portion' : 'g/porzione',
      co2: en ? 'g CO₂e/portion' : 'g CO₂e/porzione',
      waterFootprint: en ? 'L/portion' : 'L/porzione'
    };
  }
  return {
    calories: 'kcal per 100 g',
    carbs: 'g per 100 g',
    protein: 'g per 100 g',
    co2: 'kg CO₂e per 1 kg',
    waterFootprint: en ? 'liters per 1 kg' : 'litri per 1 kg'
  };
}

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

// Valori di riferimento SWITCH sulla base giusta (porzione per i piatti, nativa per i prodotti).
// Usati sia come "valore reale" del quiz sia come colonna "DB SWITCH" del confronto e per il punteggio.
export function getSwitchReference(switchData, isDish) {
  if (!switchData || switchData.found === false) {
    return { calories: null, carbs: null, protein: null, co2: null, waterFootprint: null };
  }
  if (isDish) {
    const p = switchData.portion || {};
    const co2Kg = num(p.co2);
    return {
      calories: num(p.energy),
      carbs: num(p.carbohydrates),
      protein: num(p.proteins),
      co2: co2Kg === null ? null : Math.round(co2Kg * 1000), // g CO2e della porzione
      waterFootprint: num(p.water) // litri della porzione
    };
  }
  const n = switchData.nutrition || {};
  const e = switchData.environmental || {};
  return {
    calories: num(n.calories ?? n.energy),
    carbs: num(n.carbohydrates),
    protein: num(n.proteins),
    co2: num(e.carbonFootprint ?? e.co2),
    waterFootprint: num(e.waterFootprint ?? e.water)
  };
}
