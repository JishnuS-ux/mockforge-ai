import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  description: string;
  category: string;
  icon: string;
  tags: string[];
  tables: any[];
  flowEdges: any[];
  previewImageUrl?: string;
  usageCount: number;
  isBuiltIn: boolean;
  createdAt: Date;
}

const templateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    icon: { type: String, default: '🗄️' },
    tags: [String],
    tables: { type: Schema.Types.Mixed, default: [] },
    flowEdges: { type: Schema.Types.Mixed, default: [] },
    previewImageUrl: String,
    usageCount: { type: Number, default: 0 },
    isBuiltIn: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Template = mongoose.model<ITemplate>('Template', templateSchema);
