import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Job } from '../models/Job';
import { Project } from '../models/Project';
import { enqueueGenerationJob } from '../services/queueService';
import { io } from '../index';

const router = Router();
router.use(authenticate);

// POST /api/generator/start – queue a generation job
router.post('/start', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const project = await Project.findOne({ _id: projectId, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const totalRows = project.tables.reduce((sum, t) => sum + (t.rowsCount || 0), 0);
    const job = await Job.create({
      projectId,
      userId: req.userId,
      status: 'queued',
      rowsTotal: totalRows,
      exportFormat: project.generationSettings?.exportFormat || 'ZIP',
    });

    enqueueGenerationJob({ jobId: String(job._id), projectId, userId: req.userId!, io });
    res.status(202).json({ jobId: job._id, status: 'queued', rowsTotal: totalRows });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/generator/jobs – list all jobs for user
router.get('/jobs', async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await Job.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('projectId status progress rowsTotal rowsGenerated exportPath exportFormat createdAt completedAt');
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/generator/jobs/:id – get single job status
router.get('/jobs/:id', async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, userId: req.userId });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /api/generator/jobs/:id – cancel queued job
router.delete('/jobs/:id', async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, userId: req.userId });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status === 'running') return res.status(400).json({ error: 'Cannot cancel a running job' });
    await Job.updateOne({ _id: req.params.id }, { status: 'cancelled' });
    res.json({ message: 'Job cancelled' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
