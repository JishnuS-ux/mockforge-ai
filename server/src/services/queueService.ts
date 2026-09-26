import { Server as SocketServer } from 'socket.io';
import { Job } from '../models/Job';
import { Project } from '../models/Project';
import { generateAllTableData } from './generationEngine';
import { injectEdgeCases, EdgeCaseConfig } from './edgeCaseStudio';
import { exportData } from './exportService';
import { ITableSchema } from '../models/Project';

interface GenerationRequest {
  jobId: string;
  projectId: string;
  userId: string;
  io: SocketServer;
}

async function log(jobId: string, level: 'info' | 'warn' | 'error', message: string) {
  await Job.updateOne(
    { _id: jobId },
    { $push: { logs: { timestamp: new Date(), level, message } } }
  );
}

export async function processGenerationJob(req: GenerationRequest) {
  const { jobId, projectId, userId, io } = req;

  const emit = (event: string, data: object) => {
    io.to(`user:${userId}`).emit(event, { jobId, ...data });
  };

  try {
    // ── Load project ────────────────────────────────────────────────────────────
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    await Job.updateOne({ _id: jobId }, { status: 'running' });
    emit('job:update', { status: 'running', progress: 0 });
    await log(jobId, 'info', '🚀 Generation started');

    const tables = project.tables as ITableSchema[];
    const totalRows = tables.reduce((sum, t) => sum + (t.rowsCount || 0), 0);
    let generatedSoFar = 0;
    const startTime = Date.now();

    // ── Generate data with progress updates ─────────────────────────────────────
    const generatedData = await generateAllTableData(tables, async (tableName, rowCount) => {
      generatedSoFar += rowCount;
      const progress = Math.min(Math.round((generatedSoFar / totalRows) * 80), 80); // 80% for generation
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = Math.round(generatedSoFar / Math.max(elapsed, 1));
      const timeRemaining = speed > 0 ? Math.round((totalRows - generatedSoFar) / speed) : 0;

      await Job.updateOne({ _id: jobId }, { progress, rowsGenerated: generatedSoFar, speed, timeRemaining });
      emit('job:update', { status: 'running', progress, rowsGenerated: generatedSoFar, speed, timeRemaining });
      await log(jobId, 'info', `✅ Generated ${rowCount} rows for table "${tableName}"`);
    });

    // ── Edge cases ──────────────────────────────────────────────────────────────
    const edgeCaseConfig = project.generationSettings?.edgeCases as EdgeCaseConfig;
    let finalData = generatedData;

    if (edgeCaseConfig && edgeCaseConfig.mutationPercentage > 0) {
      await log(jobId, 'info', `🧪 Injecting edge cases at ${edgeCaseConfig.mutationPercentage}% mutation rate`);
      emit('job:update', { status: 'running', progress: 85, message: 'Injecting edge cases...' });
      finalData = injectEdgeCases(
        generatedData,
        tables.map((t) => ({ id: t.id, fields: t.fields })),
        edgeCaseConfig
      );
    }

    // ── Export ──────────────────────────────────────────────────────────────────
    await log(jobId, 'info', '📦 Exporting data...');
    emit('job:update', { status: 'running', progress: 90, message: 'Packaging exports...' });

    const format = (project.generationSettings?.exportFormat || 'ZIP') as 'CSV' | 'JSON' | 'SQL' | 'EXCEL' | 'ZIP';
    const exportPath = await exportData(tables, finalData, format, jobId.toString());

    // ── Finalize ────────────────────────────────────────────────────────────────
    await Job.updateOne(
      { _id: jobId },
      { status: 'completed', progress: 100, rowsGenerated: totalRows, exportPath, completedAt: new Date() }
    );
    await Project.updateOne(
      { _id: projectId },
      { $inc: { totalRowsGenerated: totalRows, totalExports: 1 }, lastGeneratedAt: new Date() }
    );
    await log(jobId, 'info', `🎉 Generation complete! ${totalRows} rows exported.`);

    emit('job:complete', { status: 'completed', progress: 100, exportPath: `/exports/${jobId}.zip` });
  } catch (err) {
    const message = (err as Error).message;
    await Job.updateOne({ _id: jobId }, { status: 'failed', errorMessage: message });
    await log(jobId, 'error', `❌ Generation failed: ${message}`);
    emit('job:error', { status: 'failed', error: message });
  }
}

// ─── In-process queue using setImmediate (no Redis required) ──────────────────
const queue: GenerationRequest[] = [];
let isProcessing = false;

async function drainQueue() {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;
  const job = queue.shift()!;
  try {
    await processGenerationJob(job);
  } finally {
    isProcessing = false;
    setImmediate(drainQueue);
  }
}

export function enqueueGenerationJob(req: GenerationRequest) {
  queue.push(req);
  setImmediate(drainQueue);
}
