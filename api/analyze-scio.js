// api/analyze-scio.js
// Vercel Serverless Function to analyze SCIO screenshots with Claude Vision

// Load .env.local for local development
require('dotenv').config({ path: '.env.local' });

const { callClaude } = require('./_claude.js');

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

    const responseText = await callClaude({
      maxTokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Analyze this SCIO spectrometer app screenshot and extract the nutritional values.

IMPORTANT for food identification:
- Look at the food name displayed in the app interface
- Common vegetables in Italian: "Peperone" (pepper), "Bietola" (chard), "Pomodoro" (tomato), "Zucchina" (zucchini), "Melanzana" (eggplant)
- "Peperone giallo" = yellow bell pepper (NOT papaya!)
- "Bietola da costa" or "Bietola" = Swiss chard
- If the displayed name seems wrong for the nutritional values shown, note this in confidence
- NEVER confuse tropical fruits (papaya, mango) with common Italian vegetables

Return a JSON object with these fields (use null if not found):
{
  "water": number or null (grams per 100g),
  "carbs": number or null (grams per 100g),
  "calories": number or null (kcal per 100g),
  "sugar": number or null (grams per 100g),
  "fiber": number or null (grams per 100g),
  "protein": number or null (grams per 100g),
  "fat": number or null (grams per 100g),
  "portion": number or null (grams, if specified),
  "foodName": string or null (exact name shown in the app, in Italian if that's what's displayed),
  "foodNameOriginal": string or null (raw text from the app if different from foodName),
  "scanDate": string or null (date if visible, ISO format),
  "brix": number or null (if shown, degrees Brix),
  "confidence": "high" | "medium" | "low"
}

Return ONLY the JSON object, no other text.`
            }
          ],
        }
      ],
    });

    // Parse Claude's response
    let extractedData;
    
    try {
      // Try to parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      extractedData = {
        error: 'Could not parse nutritional data',
        rawResponse: responseText,
        confidence: 'low'
      };
    }

    // Add metadata
    extractedData.analyzedAt = new Date().toISOString();
    extractedData.source = 'scio-vision';

    return res.status(200).json(extractedData);

  } catch (error) {
    console.error('Error analyzing image:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
};
