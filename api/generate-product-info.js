// api/generate-product-info.js
// Generate product tips, curiosity, and seasonality using AI

// Load .env.local for local development
require('dotenv').config({ path: '.env.local' });

const { callClaude } = require('./_claude.js');

// Cache to avoid regenerating for same products
const cache = new Map();

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { productName, language = 'it' } = req.method === 'GET' ? req.query : req.body;

    if (!productName) {
      return res.status(400).json({ error: 'productName is required' });
    }

    const normalizedName = productName.toLowerCase().trim();
    const cacheKey = `${normalizedName}-${language}`;

    // Check cache first
    if (cache.has(cacheKey)) {
      return res.status(200).json(cache.get(cacheKey));
    }

    const langInstructions = language === 'it' 
      ? 'Rispondi in italiano.' 
      : 'Respond in English.';

    const prompt = `Generate product information for: "${productName}"

${langInstructions}

Return a JSON object with this exact structure:
{
  "name": "Product name (properly capitalized)",
  "emoji": "Single relevant emoji",
  "category": "Frutta" or "Verdura" or "Ortaggio" or "Legume" or "Cereale" or "Altro",
  "origin": "Typical region of origin in Italy or main production area",
  "seasonality": [array of month numbers 1-12 when in season],
  "nutrition": {
    "calories": number (kcal per 100g),
    "water": number (percentage),
    "fiber": number (g per 100g),
    "vitaminC": number (mg per 100g, or null if not significant),
    "sugar": {
      "typical": number (typical percentage),
      "min": number (minimum normal range),
      "max": number (maximum normal range)
    }
  },
  "tips": [
    "4 practical tips about storage, preparation, consumption - with emoji at start"
  ],
  "curiosity": "One interesting fact about this product (2-3 sentences)",
  "pairings": ["3-4 foods that pair well with this product"]
}

Be accurate with nutritional values. Use real data.
For seasonality, consider Italian/Mediterranean growing seasons.
Make tips practical and useful for consumers.`;

    // Extract JSON from response
    const responseText = await callClaude({
      maxTokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });
    let productInfo;

    try {
      // Try to parse directly
      productInfo = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        productInfo = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in text
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          productInfo = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error('Could not parse AI response as JSON');
        }
      }
    }

    // Validate and enhance response
    const result = {
      generated: true,
      productName: normalizedName,
      ...productInfo,
      // Ensure required fields
      emoji: productInfo.emoji || '🥬',
      category: productInfo.category || 'Altro',
      seasonality: productInfo.seasonality || [],
      tips: productInfo.tips || [],
      curiosity: productInfo.curiosity || null,
    };

    // Cache the result (for 24 hours in memory)
    cache.set(cacheKey, result);

    // Limit cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error generating product info:', error);
    return res.status(500).json({
      error: 'Failed to generate product information',
      details: error.message
    });
  }
};
