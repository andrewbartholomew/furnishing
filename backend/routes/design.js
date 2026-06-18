import express from 'express';
import { runQuery, getOne, getAll } from '../db.js';
import { analyzeRoom, generateRecommendations, matchLibraryItems } from '../design-service.js';

const router = express.Router();

const ANALYSIS_COLS = 'id, room_slug, photos, style_tags, vibe_summary, raw_llm_analysis, created_at, updated_at';
const PROJECT_COLS = 'id, analysis_id, name, status, user_context, vibe_refined, palette, recommendations, llm_reasoning, created_at, updated_at';
const ELEMENT_COLS = 'id, analysis_id, name, type, material_tags, color_hex, style_tags, texture, pattern, formality, ai_description, status, sort_order';

// POST /analyze - Analyze room photos (Step 1)
// Accepts { room_slug, photo_urls: [...] }
router.post('/analyze', async (req, res) => {
  try {
    const { room_slug, photo_urls } = req.body;

    if (!room_slug || !photo_urls || photo_urls.length === 0) {
      return res.status(400).json({ error: 'room_slug and photo_urls are required' });
    }

    console.log(`[design] Analyzing ${photo_urls.length} photos for ${room_slug}...`);

    // Call vision model
    const { analysis, usage } = await analyzeRoom(photo_urls);

    console.log(`[design] Analysis complete. Tokens: ${usage.input_tokens} in, ${usage.output_tokens} out`);

    // Store analysis
    const result = await runQuery(
      `INSERT INTO room_analyses (room_slug, photos, style_tags, vibe_summary, raw_llm_analysis)
       VALUES (?, ?, ?, ?, ?)`,
      [
        room_slug,
        JSON.stringify(photo_urls),
        JSON.stringify(analysis.style_tags),
        analysis.vibe_summary,
        JSON.stringify(analysis),
      ]
    );

    // Store detected elements
    if (analysis.elements) {
      for (let i = 0; i < analysis.elements.length; i++) {
        const el = analysis.elements[i];
        await runQuery(
          `INSERT INTO room_elements (analysis_id, name, type, material_tags, color_hex, style_tags, texture, pattern, formality, ai_description, status, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            result.id,
            el.name,
            el.type,
            JSON.stringify(el.material_tags),
            el.color_hex,
            JSON.stringify(el.style_tags),
            el.texture,
            el.pattern,
            el.formality,
            el.ai_description,
            el.type === 'architectural' ? 'fixed' : 'keep',
            i,
          ]
        );
      }
    }

    // Return the analysis
    const saved = await getOne(`SELECT ${ANALYSIS_COLS} FROM room_analyses WHERE id = ?`, [result.id]);
    const elements = await getAll(`SELECT ${ELEMENT_COLS} FROM room_elements WHERE analysis_id = ?`, [result.id]);

    res.status(201).json({
      analysis: saved,
      elements,
      palette: analysis.palette,
      usage,
    });
  } catch (error) {
    console.error('[design] Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze room', detail: error.message });
  }
});

// GET /analyses/:roomSlug - Get most recent analysis for a room
router.get('/analyses/:roomSlug', async (req, res) => {
  try {
    const { roomSlug } = req.params;
    const analysis = await getOne(
      `SELECT ${ANALYSIS_COLS} FROM room_analyses WHERE room_slug = ? ORDER BY created_at DESC LIMIT 1`,
      [roomSlug]
    );

    if (!analysis) {
      return res.status(404).json({ error: 'No analysis found for this room' });
    }

    const elements = await getAll(
      `SELECT ${ELEMENT_COLS} FROM room_elements WHERE analysis_id = ?`,
      [analysis.id]
    );

    res.json({ analysis, elements });
  } catch (error) {
    console.error('[design] Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// PATCH /elements/:id - Update element status (keep/discard)
router.patch('/elements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['fixed', 'keep', 'discard'].includes(status)) {
      return res.status(400).json({ error: 'Status must be fixed, keep, or discard' });
    }

    await runQuery('UPDATE room_elements SET status = ? WHERE id = ?', [status, id]);
    const updated = await getOne(`SELECT ${ELEMENT_COLS} FROM room_elements WHERE id = ?`, [id]);
    res.json(updated);
  } catch (error) {
    console.error('[design] Error updating element:', error);
    res.status(500).json({ error: 'Failed to update element' });
  }
});

// POST /projects - Create a design project and generate recommendations
// Accepts { analysis_id, name, user_context, element_statuses?, anchor_items? }
router.post('/projects', async (req, res) => {
  try {
    const { analysis_id, name, user_context, anchor_items } = req.body;

    if (!analysis_id) {
      return res.status(400).json({ error: 'analysis_id is required' });
    }

    // Fetch the cached analysis
    const analysis = await getOne(
      `SELECT ${ANALYSIS_COLS} FROM room_analyses WHERE id = ?`,
      [analysis_id]
    );

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const parsedAnalysis = JSON.parse(analysis.raw_llm_analysis);

    // Fetch elements with their current statuses
    const elements = await getAll(
      `SELECT ${ELEMENT_COLS} FROM room_elements WHERE analysis_id = ?`,
      [analysis_id]
    );

    // Build structured context from element statuses
    const keptElements = elements.filter((e) => e.status === 'fixed' || e.status === 'keep');
    const discardedElements = elements.filter((e) => e.status === 'discard');

    let structuredContext = '';

    if (keptElements.length > 0) {
      structuredContext += 'KEEPING:\n' + keptElements.map((e) => `- ${e.name} (${e.type}): ${e.ai_description || ''}`).join('\n') + '\n\n';
    }
    if (discardedElements.length > 0) {
      structuredContext += 'REMOVING:\n' + discardedElements.map((e) => `- ${e.name}`).join('\n') + '\n\n';
    }
    if (anchor_items && anchor_items.length > 0) {
      structuredContext += 'ANCHOR PIECES (committed to placing in room):\n' + anchor_items.map((a) => `- ${a.title || 'Untitled'} (${a.category || 'item'}): ${a.image_url || 'no image'}`).join('\n') + '\n\n';
    }
    if (user_context) {
      structuredContext += 'ADDITIONAL NOTES:\n' + user_context;
    }

    console.log(`[design] Generating recommendations for project "${name || 'Untitled'}"...`);

    // Generate recommendations using cached analysis + structured context (Haiku)
    const { result, usage } = await generateRecommendations(parsedAnalysis, structuredContext);

    console.log(`[design] Recommendations complete. Tokens: ${usage.input_tokens} in, ${usage.output_tokens} out`);

    // Match library items against recommendations
    // Fetch candidates in two queries to avoid Turso wide-select hang
    const [candA, candB] = await Promise.all([
      getAll("SELECT id, title, image_url, category FROM items WHERE queued = 0 AND category IN ('potential_purchase', 'inspiration') AND image_url IS NOT NULL", []),
      getAll("SELECT id, room, price FROM items WHERE queued = 0 AND category IN ('potential_purchase', 'inspiration') AND image_url IS NOT NULL", []),
    ]);
    const bMap = new Map(candB.map((r) => [r.id, r]));
    const candidateItems = candA.map((a) => ({ ...a, ...bMap.get(a.id) }));

    let libraryMatches = [];
    let matchUsage = { input_tokens: 0, output_tokens: 0 };

    if (candidateItems.length > 0 && result.recommendations?.length > 0) {
      console.log(`[design] Matching ${candidateItems.length} library items against ${result.recommendations.length} recommendations...`);
      try {
        const matchResult = await matchLibraryItems(result.recommendations, candidateItems);
        libraryMatches = matchResult.matches;
        matchUsage = matchResult.usage;
        console.log(`[design] Matching complete. Tokens: ${matchUsage.input_tokens} in, ${matchUsage.output_tokens} out`);
      } catch (matchErr) {
        console.error('[design] Library matching failed (non-fatal):', matchErr.message);
      }
    }

    // Enrich matches with full item data
    const matchesWithItems = libraryMatches.map((match) => ({
      ...match,
      items: (match.item_ids || [])
        .map((id) => candidateItems.find((item) => item.id === id))
        .filter(Boolean),
    }));

    // Store the project
    const projectResult = await runQuery(
      `INSERT INTO design_projects (analysis_id, name, status, user_context, vibe_refined, palette, recommendations, llm_reasoning)
       VALUES (?, ?, 'active', ?, ?, ?, ?, ?)`,
      [
        analysis_id,
        name || `Design ${new Date().toLocaleDateString()}`,
        user_context,
        result.vibe_refined,
        JSON.stringify(result.palette),
        JSON.stringify(result.recommendations),
        JSON.stringify({ observations: result.observations, library_matches: matchesWithItems, usage, matchUsage }),
      ]
    );

    const saved = await getOne(`SELECT ${PROJECT_COLS} FROM design_projects WHERE id = ?`, [projectResult.id]);

    res.status(201).json({
      project: saved,
      library_matches: matchesWithItems,
      usage: {
        recommendations: usage,
        matching: matchUsage,
      },
    });
  } catch (error) {
    console.error('[design] Project creation error:', error);
    res.status(500).json({ error: 'Failed to create design project', detail: error.message });
  }
});

// GET /projects/:id - Get a design project
router.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await getOne(`SELECT ${PROJECT_COLS} FROM design_projects WHERE id = ?`, [id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Also fetch the parent analysis and elements
    const analysis = await getOne(
      `SELECT ${ANALYSIS_COLS} FROM room_analyses WHERE id = ?`,
      [project.analysis_id]
    );
    const elements = await getAll(
      `SELECT ${ELEMENT_COLS} FROM room_elements WHERE analysis_id = ?`,
      [project.analysis_id]
    );

    res.json({ project, analysis, elements });
  } catch (error) {
    console.error('[design] Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// GET /projects - List all design projects
router.get('/projects', async (req, res) => {
  try {
    const { room_slug } = req.query;
    let sql = `SELECT ${PROJECT_COLS} FROM design_projects`;
    const params = [];

    if (room_slug) {
      sql += ` WHERE analysis_id IN (SELECT id FROM room_analyses WHERE room_slug = ?)`;
      params.push(room_slug);
    }

    sql += ' ORDER BY created_at DESC';

    const projects = await getAll(sql, params);
    res.json(projects);
  } catch (error) {
    console.error('[design] Error listing projects:', error);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

export default router;
