import { Router, Response } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Job } from '../models/Job';
import { Template } from '../models/Template';
import mongoose from 'mongoose';

const router = Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/stats – system overview
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const [users, projects, jobs, completedJobs] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ status: 'completed' }),
    ]);

    const rowsResult = await Job.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$rowsGenerated' } } },
    ]);
    const totalRowsGenerated = rowsResult[0]?.total || 0;

    res.json({ users, projects, jobs, completedJobs, totalRowsGenerated });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/admin/users – list all users
router.get('/users', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash -verificationToken -resetToken').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.id === req.userId) return res.status(400).json({ error: 'Cannot delete yourself' });
    await User.deleteOne({ _id: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/admin/jobs – list all jobs
router.get('/jobs', async (_req: AuthRequest, res: Response) => {
  try {
    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'name email')
      .populate('projectId', 'name');
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/admin/analytics – monthly generation trends
router.get('/analytics', async (_req: AuthRequest, res: Response) => {
  try {
    const monthly = await Job.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          jobs: { $sum: 1 },
          rows: { $sum: '$rowsGenerated' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);
    res.json({ monthly });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/admin/templates – add template
router.post('/templates', async (req: AuthRequest, res: Response) => {
  try {
    const template = await Template.create({ ...req.body, isBuiltIn: false });
    res.status(201).json({ template });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /api/admin/templates/:id
router.delete('/templates/:id', async (req: AuthRequest, res: Response) => {
  try {
    await Template.deleteOne({ _id: req.params.id });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
