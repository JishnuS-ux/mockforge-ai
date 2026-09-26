import mongoose, { Document, Schema } from 'mongoose';

export interface IJobLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface IJob extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  rowsTotal: number;
  rowsGenerated: number;
  speed: number;
  timeRemaining: number;
  logs: IJobLog[];
  exportPath?: string;
  exportFormat: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const jobSchema = new Schema<IJob>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
      default: 'queued',
    },
    progress: { type: Number, default: 0 },
    rowsTotal: { type: Number, default: 0 },
    rowsGenerated: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    timeRemaining: { type: Number, default: 0 },
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        level: { type: String, enum: ['info', 'warn', 'error'] },
        message: String,
      },
    ],
    exportPath: String,
    exportFormat: { type: String, default: 'ZIP' },
    errorMessage: String,
    completedAt: Date,
  },
  { timestamps: true }
);

export const Job = mongoose.model<IJob>('Job', jobSchema);
