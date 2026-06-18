// Design Advisor AI Service
// Handles Claude API calls for room analysis and recommendations
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Step 1: Analyze room photos with vision model
export async function analyzeRoom(imageUrls) {
  const imageContent = await Promise.all(
    imageUrls.map(async (url) => {
      // Fetch image and convert to base64
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const mediaType = contentType.startsWith('image/') ? contentType : 'image/jpeg';
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: buffer.toString('base64'),
        },
      };
    })
  );

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: `Analyze this room for an interior design advisor app. Return a JSON object with this exact structure:

{
  "style_tags": ["tag1", "tag2"],
  "vibe_summary": "2-3 sentence description of the room's character, architecture, and feel",
  "elements": [
    {
      "name": "descriptive name",
      "type": "architectural" or "furnishing",
      "material_tags": ["material1"],
      "color_hex": "#hex",
      "style_tags": ["style1"],
      "texture": "texture description",
      "pattern": "solid/geometric/organic/etc",
      "formality": 0.0 to 1.0,
      "ai_description": "one sentence describing this element and how it contributes to the room"
    }
  ],
  "palette": [
    { "hex": "#hex", "name": "color name", "role": "dominant/accent/neutral" }
  ]
}

Be thorough with elements — include floors, walls, ceiling details, windows, fireplace, molding, and any existing furniture. Extract 5-8 palette colors. Be specific about materials and style period.

Return ONLY the JSON, no markdown fencing or explanation.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].text;

  // Parse JSON — handle potential markdown fencing
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const analysis = JSON.parse(cleaned);

  return {
    analysis,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
}

// Steps 2-4 combined: Evaluate project and generate recommendations
export async function generateRecommendations(analysis, userContext) {
  // Build compressed room context from the analysis
  const fixedElements = analysis.elements
    .map((el) => {
      const tags = el.style_tags?.join(', ') || '';
      return `${el.name} (${el.type}, ${el.color_hex || 'no color'}, ${tags}, formality ${el.formality})`;
    })
    .join(' | ');

  const palette = analysis.palette
    .map((c) => `${c.name} ${c.hex} (${c.role})`)
    .join(', ');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `You are an interior design advisor. Given a room analysis and the user's design intentions, generate a refined palette and specific recommendations for filling gaps.

ROOM ANALYSIS:
Style: ${analysis.style_tags?.join(', ')}
Vibe: ${analysis.vibe_summary}
Elements: ${fixedElements}
Current palette: ${palette}

USER CONTEXT:
${userContext}

Return a JSON object with this exact structure:

{
  "vibe_refined": "2-3 sentences describing the design direction given the user's choices",
  "palette": [
    { "hex": "#hex", "name": "color name", "role": "dominant/accent/neutral", "source": "what element this comes from" }
  ],
  "recommendations": [
    {
      "role": "rug/accent chairs/coffee table/side tables/lighting/etc",
      "color_direction": "what colors to look for and why",
      "material_direction": "what materials and textures to look for",
      "style_direction": "era, formality, character guidance",
      "avoid": ["thing to avoid 1", "thing to avoid 2"],
      "reasoning": "why this recommendation fits the overall design"
    }
  ],
  "observations": ["key insight about how pieces interact", "tension or harmony to be aware of"]
}

Be specific and opinionated. Include negative reasoning (what NOT to do). Reference specific room elements in your reasoning. Generate 4-6 gap recommendations.

Return ONLY the JSON, no markdown fencing or explanation.`,
      },
    ],
  });

  const text = response.content[0].text;

  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const result = JSON.parse(cleaned);

  return {
    result,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
}

// Match library items against recommendation briefs
export async function matchLibraryItems(recommendations, libraryItems) {
  if (!libraryItems || libraryItems.length === 0 || !recommendations || recommendations.length === 0) {
    return { matches: [], usage: { input_tokens: 0, output_tokens: 0 } };
  }

  // Build compact item list
  const itemList = libraryItems.map((item) =>
    `ID:${item.id} "${item.title || 'Untitled'}" (${item.category || 'unknown'})`
  ).join('\n');

  // Build compact recommendation briefs
  const recBriefs = recommendations.map((rec, i) =>
    `${i}. ${rec.role}: ${rec.color_direction} | ${rec.material_direction} | ${rec.style_direction} | Avoid: ${(rec.avoid || []).join(', ')}`
  ).join('\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are matching furniture items from a user's saved library against design recommendations for a room.

RECOMMENDATIONS (by index):
${recBriefs}

LIBRARY ITEMS:
${itemList}

For each recommendation, pick the 1-3 library items that best fit the brief. Consider the item title for clues about style, color, and material. Only include items that are genuinely good matches — it's fine to return zero matches for a recommendation if nothing fits.

Return a JSON array:
[
  { "rec_index": 0, "item_ids": [12, 45], "reasoning": "brief explanation of why these items fit" },
  ...
]

Only include entries where you found matches. Return ONLY the JSON, no markdown fencing.`,
      },
    ],
  });

  const text = response.content[0].text;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const matches = JSON.parse(cleaned);

  return {
    matches,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
}
