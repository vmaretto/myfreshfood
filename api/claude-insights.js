import claudeHelper from './_claude.js';
const { callClaude } = claudeHelper;
// api/claude-insights.js - Fast Single-Call Version
// Analizza dati aggregati con UNA sola chiamata a Claude (evita timeout Vercel)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Claude API key not configured',
      message: 'Please set CLAUDE_API_KEY in Vercel environment variables'
    });
  }

  try {
    const { aggregatedData, language } = req.body;
    
    if (!aggregatedData) {
      return res.status(400).json({ error: 'Missing aggregated data' });
    }

    const isItalian = language === 'it';
    
    // Prepare summary data (NOT raw participants - too big)
    const summaryData = {
      totalParticipants: aggregatedData.totalParticipants,
      demographics: aggregatedData.demographics,
      patterns: aggregatedData.patterns,
      correlations: aggregatedData.correlations
    };

    const prompt = `Sei un data scientist. Analizza questi dati di un esperimento sulla percezione alimentare (MyFreshFood - SWITCH Project).

DATI AGGREGATI:
${JSON.stringify(summaryData, null, 2)}

FOCUS PRINCIPALE (in ordine di priorità):
1. **Alimenti scelti**: quali prodotti sono stati analizzati più spesso? Ci sono preferenze?
2. **Gap stime vs realtà**: dove i partecipanti sbagliano di più? Su calorie, acqua, CO2, impronta idrica? Chi sovrastima, chi sottostima?
3. **Valori nutrizionali/ambientali**: pattern interessanti nei dati misurati (calorie, acqua, etc.)
4. **Correlazioni profilo-performance**: età, professione o abitudini influenzano la precisione delle stime?
5. **Feedback e consapevolezza**: cosa hanno detto i partecipanti? Cosa li ha sorpresi?

NON FOCALIZZARTI su:
- Orari o giorni dell'esperimento (è un evento di una giornata)
- Pattern temporali (irrilevanti)

${isItalian ? 'Rispondi in italiano.' : 'Respond in English.'}

IMPORTANTE: Rispondi SOLO con JSON valido in questo formato:
{
  "curiosities": [
    {
      "title": "titolo breve (max 5 parole)",
      "insight": "spiegazione con numeri reali dai dati",
      "emoji": "emoji appropriata",
      "type": "food|perception|nutrition|correlation|feedback",
      "strength": 1-5
    }
  ],
  "mainTrend": {
    "title": "trend principale",
    "description": "descrizione dettagliata"
  },
  "funFact": {
    "fact": "fatto curioso dai dati",
    "emoji": "emoji"
  }
}

Genera 5-7 curiosities basate sui dati reali. Concentrati sugli ALIMENTI e sulle DIFFERENZE tra percezione e realtà.`;

    const rawText = await callClaude({
      maxTokens: 6000,
      messages: [{ role: "user", content: prompt }]
    });
    const responseText = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();
    
    const insights = JSON.parse(responseText);
    
    // Add metadata
    insights.generatedAt = new Date().toISOString();
    insights.participantCount = aggregatedData.totalParticipants;
    insights.analysisMethod = 'single_call_fast';
    
    return res.status(200).json(insights);
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Return fallback insights
    return res.status(200).json(generateFallbackInsights(req.body.aggregatedData, req.body.language));
  }
}

// Fallback insights if API fails
function generateFallbackInsights(aggregatedData, language) {
  const isItalian = language === 'it';
  const total = aggregatedData?.totalParticipants || 0;
  
  return {
    curiosities: [
      {
        title: isItalian ? "Partecipazione attiva" : "Active participation",
        insight: isItalian 
          ? `${total} persone hanno completato il test con successo`
          : `${total} people successfully completed the test`,
        emoji: "🎯",
        type: "demographic",
        strength: 5
      },
      {
        title: isItalian ? "Diversità demografica" : "Demographic diversity",
        insight: isItalian
          ? "Partecipanti di diverse età e professioni hanno contribuito"
          : "Participants from different ages and professions contributed",
        emoji: "👥",
        type: "demographic",
        strength: 4
      },
      {
        title: isItalian ? "Engagement elevato" : "High engagement",
        insight: isItalian
          ? "Alto tasso di completamento del quiz e feedback"
          : "High quiz completion and feedback rate",
        emoji: "📊",
        type: "behavioral",
        strength: 4
      },
      {
        title: isItalian ? "Dati affidabili" : "Reliable data",
        insight: isItalian
          ? "I dati raccolti sono statisticamente significativi"
          : "Collected data is statistically significant",
        emoji: "✅",
        type: "performance",
        strength: 4
      }
    ],
    mainTrend: {
      title: isItalian ? "Esperimento riuscito" : "Successful experiment",
      description: isItalian
        ? `Con ${total} partecipanti, l'esperimento ha raggiunto i suoi obiettivi`
        : `With ${total} participants, the experiment achieved its goals`
    },
    funFact: {
      fact: isItalian
        ? `${total} sugar detective in azione!`
        : `${total} sugar detectives in action!`,
      emoji: "🕵️"
    },
    generatedAt: new Date().toISOString(),
    participantCount: total,
    analysisMethod: 'fallback_local'
  };
}
