// api/recognize-product.js
// Vercel Serverless Function to recognize a food product or a whole dish with Claude Vision

// Load .env.local for local development
require('dotenv').config({ path: '.env.local' });

const { callClaude, parseJson } = require('./_claude.js');
const { getItemNames } = require('./_switch.js');

module.exports = async (req, res) => {
  // CORS headers
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
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Extract base64 data from data URL
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const mediaType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not configured');
      return res.status(500).json({ 
        error: 'API key not configured',
        name: 'Configurazione mancante',
        emoji: '⚠️',
        confidence: 'bassa'
      });
    }

    let switchNames = [];
    try {
      switchNames = await getItemNames();
    } catch (err) {
      console.error('Could not load SWITCH item list:', err.message);
    }

    const prompt = `Look at this photo of food. It can be either a SINGLE food product (a fruit, a vegetable, a cheese, a piece of bread...) or a prepared DISH / RECIPE (pasta alla carbonara, pizza margherita, insalata caprese, lasagna, a sandwich, a dessert...).

If it is a DISH, estimate the recipe of ONE typical Italian portion: list the main ingredients (usually 3-10, include cooking fat and cheese, skip salt/pepper/water) with realistic grams for one portion, based on the classic recipe and on what you see.

For every ingredient (and for a single product), pick the closest item from this list of the SWITCH food database and copy its name EXACTLY in "switchItem" (use null if nothing is reasonably close):
${switchNames.join(' | ')}

Return ONLY a JSON object, no other text:
{
  "type": "product" or "dish",
  "name": string (specific Italian name, e.g. "Spaghetti alla carbonara", "Mela Golden"),
  "nameEn": string (English name),
  "category": string (for a product one of "frutta", "verdura", "ortaggio", "legume", "erba aromatica", "latticino", "cereale", "proteina", "bevanda", "altro"; for a dish one of "primo", "secondo", "contorno", "piatto unico", "pizza", "dolce", "colazione", "street food", "altro"),
  "emoji": string (single emoji closest to the food, 🍽️ if none),
  "confidence": "alta" | "media" | "bassa",
  "description": string (brief description in Italian, max 20 words),
  "visualCues": string (what visual features led to this identification),
  "switchItem": string or null (product only: closest SWITCH item),
  "portionGrams": number (dish only: total grams of the portion),
  "ingredients": [ { "name": string (Italian), "switchItem": string or null, "grams": number } ] (dish only, [] for a product)
}

If you cannot identify any food, return:
{"type": "product", "name": "Non riconosciuto", "nameEn": "Not recognized", "category": "altro", "emoji": "❓", "confidence": "bassa", "description": "Impossibile identificare il prodotto nell'immagine", "visualCues": "", "switchItem": null, "ingredients": []}`;

    const responseText = await callClaude({
      maxTokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
            { type: 'text', text: prompt }
          ]
        }
      ]
    });

    let productData;
    try {
      productData = parseJson(responseText);
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      productData = {
        name: 'Errore di parsing',
        nameEn: 'Parse error',
        category: 'altro',
        emoji: '❓',
        confidence: 'bassa',
        description: 'Errore nel processare la risposta',
        rawResponse: responseText
      };
    }

    productData.isDish = productData.type === 'dish' && Array.isArray(productData.ingredients) && productData.ingredients.length > 0;
    if (!productData.isDish) productData.ingredients = [];

    // Add metadata
    productData.recognizedAt = new Date().toISOString();

    return res.status(200).json(productData);

  } catch (error) {
    console.error('Error recognizing product:', error);
    
    // Restituisci un oggetto compatibile anche in caso di errore
    return res.status(200).json({ 
      name: 'Errore di riconoscimento',
      nameEn: 'Recognition error',
      category: 'altro',
      emoji: '⚠️',
      confidence: 'bassa',
      description: error.message || 'Si è verificato un errore durante il riconoscimento',
      error: true,
      errorType: error.name || 'UnknownError'
    });
  }
};
