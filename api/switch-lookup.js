// api/switch-lookup.js
// Lookup environmental + nutritional data from SWITCH Food Explorer API.
// Single product: { nameEn | name, switchItem? }
// Dish: { dishName, ingredients: [{ name, switchItem, grams }] } → values summed from SWITCH ingredients

const { getItems, findExact, findFuzzy, formatItem, lookupDish } = require('./_switch.js');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = (req.method === 'GET' ? req.query : req.body) || {};

    if (Array.isArray(body.ingredients) && body.ingredients.length > 0) {
      const result = await lookupDish({ dishName: body.dishName || body.name || 'Piatto', ingredients: body.ingredients });
      return res.status(200).json(result);
    }

    const { nameEn, name, switchItem } = body;
    const searchTerm = (nameEn || name || '').trim();

    if (!searchTerm && !switchItem) {
      return res.status(400).json({ error: 'No search term provided (nameEn or name)' });
    }

    const foodItems = await getItems();

    const exact = findExact(foodItems, switchItem);
    if (exact) {
      return res.status(200).json(formatItem(exact, { matchScore: 100, searchTerm, translatedTo: null }));
    }

    const { item, score, translatedName } = findFuzzy(foodItems, searchTerm);
    if (!item) {
      return res.status(200).json({
        found: false,
        searchTerm,
        translatedTo: translatedName || null,
        message: 'No matching food item found in SWITCH database'
      });
    }

    return res.status(200).json(formatItem(item, { matchScore: score, searchTerm, translatedTo: translatedName || null }));

  } catch (error) {
    console.error('Error in switch-lookup:', error);
    return res.status(500).json({
      error: 'Failed to lookup food item',
      details: error.message
    });
  }
};
