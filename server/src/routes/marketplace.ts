import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Template } from '../models/Template';

const router = Router();

// GET /api/marketplace – list templates
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const templates = await Template.find({ isBuiltIn: true })
      .sort({ usageCount: -1 })
      .select('name description category icon tags usageCount');
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/marketplace/:id – get template schema
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    await Template.updateOne({ _id: req.params.id }, { $inc: { usageCount: 1 } });
    res.json({ template });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
