// api/_claude.js
// Shared Claude helper (underscore prefix: Vercel does not expose it as an endpoint).
// Tries the models in order: if one is retired/unavailable or refuses, moves to the next.

require('dotenv').config({ path: '.env.local' });

const Anthropic = require('@anthropic-ai/sdk');

const MODELS = (process.env.CLAUDE_MODELS || 'claude-opus-5-5,claude-sonnet-5-5,claude-haiku-4-5')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

let client = null;
function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY, timeout: 55000, maxRetries: 1 });
  }
  return client;
}

// Returns the concatenated text of the first model that answers.
async function callClaude({ messages, system, maxTokens = 4000, effort = 'low' }) {
  let lastError = null;
  for (const model of MODELS) {
    const params = { model, max_tokens: maxTokens, messages };
    if (system) params.system = system;
    // Haiku 4.5 does not accept effort
    if (!model.startsWith('claude-haiku')) params.output_config = { effort };

    try {
      const response = await getClient().messages.create(params);
      if (response.stop_reason === 'refusal') {
        lastError = new Error(`Refusal from ${model}`);
        continue;
      }
      const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('')
        .trim();
      if (!text) {
        lastError = new Error(`Empty response from ${model}`);
        continue;
      }
      return text;
    } catch (error) {
      lastError = error;
      // Model retired/unknown or request shape not accepted by this model: try the next one
      if (error instanceof Anthropic.NotFoundError || error instanceof Anthropic.BadRequestError) {
        console.warn(`Claude model ${model} unavailable: ${error.message}`);
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error('No Claude model available');
}

// Extracts the first JSON object from a model response.
function parseJson(text) {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error('No JSON found in response');
  }
}

module.exports = { callClaude, parseJson, MODELS };
