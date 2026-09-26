import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Project } from '../models/Project';
import { generateSchemaFromPrompt } from '../services/aiService';

const router = Router();
router.use(authenticate);

// GET /api/projects – list user's projects
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const projects = await Project.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select('name description tags totalRowsGenerated totalExports lastGeneratedAt createdAt updatedAt');
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/projects/:id – get single project
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/projects/import-sql – import project from SQL DDL script
router.post('/import-sql', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, sqlContent } = req.body;
    if (!name || !sqlContent) return res.status(400).json({ error: 'Name and sqlContent are required' });

    const { parseSQLSchemaToTables } = require('../services/sqlParserService');
    const { tables, flowEdges } = parseSQLSchemaToTables(sqlContent);

    const project = await Project.create({
      name,
      description: description || 'Imported from SQL DDL schema',
      userId: req.userId,
      tables,
      flowEdges,
      tags: ['sql-import', 'database'],
    });

    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, tags } = req.body;
    const project = await Project.create({
      name,
      description,
      userId: req.userId,
      tags: tags || [],
    });
    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PUT /api/projects/:id – update schema, settings, flow edges
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const update = { ...req.body };

    // Sanitize tables: strip any _id fields added by MongoDB when data came from templates
    if (Array.isArray(update.tables)) {
      update.tables = update.tables.map((t: any) => {
        const { _id, __v, ...table } = t;
        if (Array.isArray(table.fields)) {
          table.fields = table.fields.map((f: any) => {
            const { _id: fid, __v: fv, ...field } = f;
            return field;
          });
        }
        return table;
      });
    }

    // Sanitize flowEdges too
    if (Array.isArray(update.flowEdges)) {
      update.flowEdges = update.flowEdges.map((e: any) => {
        const { _id, __v, ...edge } = e;
        return edge;
      });
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: update },
      { new: true, runValidators: false }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await Project.deleteOne({ _id: req.params.id, userId: req.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/projects/:id/ai-schema – generate schema from prompt
router.post('/:id/ai-schema', async (req: AuthRequest, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const { tables, edges } = await generateSchemaFromPrompt(prompt);

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { tables, flowEdges: edges, prompt } },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project, tables, edges });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/projects/:id/preview – quick preview of generated data
router.post('/:id/preview', async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { generateAllTableData } = require('../services/generationEngine');
    const { getPreviewData } = require('../services/exportService');

    // Create shallow copy of tables with rowsCount limited to 10 for speed
    const previewTables = project.tables.map((t: any) => {
      const obj = t.toObject ? t.toObject() : t;
      return {
        ...obj,
        rowsCount: Math.min(10, obj.rowsCount || 10),
      };
    });

    const generatedData = await generateAllTableData(previewTables);
    const preview = getPreviewData(previewTables, generatedData, 10);
    res.json({ preview });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/projects/:id/analyze-schema – analyze schema semantic fields & domain
router.post('/:id/analyze-schema', async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { analyzeSchemaIntelligence } = require('../services/aiService');
    const analysis = analyzeSchemaIntelligence(project.tables);
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;

