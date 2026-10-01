// api/dish-info.js
// Storytelling for a dish: history, curiosities, fun facts, regional variants, a greener tip.
// Only narrative content from AI: numbers (nutrition, CO2, water) always come from SWITCH.

const { callClaude, parseJson } = require('./_claude.js');

const cache = new Map();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dishName, ingredients = [], topCo2Ingredient, language = 'it' } = req.body || {};
    if (!dishName) {
      return res.status(400).json({ error: 'dishName is required' });
    }

    const cacheKey = `${dishName.toLowerCase().trim()}|${language}`;
    if (cache.has(cacheKey)) {
      return res.status(200).json(cache.get(cacheKey));
    }

    const lang = language === 'en' ? 'English' : 'Italian';
    const prompt = `You are a witty food historian talking to visitors at a public food sustainability event. The dish is: "${dishName}".
Ingredients recognised in the photo: ${ingredients.join(', ') || 'unknown'}.
${topCo2Ingredient ? `The ingredient with the highest carbon footprint in this portion is: ${topCo2Ingredient}.` : ''}

Write in ${lang}, in a light, friendly and engaging tone. Be historically accurate: if an origin story is a legend or disputed, say so ("si racconta che..."). Do not invent numbers about nutrition, CO2 or water.

Return ONLY a JSON object:
{
  "origin": "Region/city of origin, short (e.g. 'Roma, Lazio')",
  "history": "The history of the recipe in 3-4 sentences",
  "curiosities": ["3 or 4 short surprising curiosities about the dish, max 2 sentences each"],
  "funFact": "One funny anecdote or legend, 1-2 sentences",
  "variants": ["2-3 regional or traditional variants, short"],
  "greenTip": "One practical tip to make this dish more sustainable, referring to the ingredient with the highest footprint if given, 1-2 sentences",
  "emoji": "one emoji for the dish"
}`;

    const text = await callClaude({ maxTokens: 4000, messages: [{ role: 'user', content: prompt }] });
    const info = parseJson(text);
    info.curiosities = Array.isArray(info.curiosities) ? info.curiosities : [];
    info.variants = Array.isArray(info.variants) ? info.variants : [];

    cache.set(cacheKey, info);
    return res.status(200).json(info);
  } catch (error) {
    console.error('Error generating dish info:', error);
    return res.status(500).json({ error: 'Failed to generate dish info', details: error.message });
  }
};
