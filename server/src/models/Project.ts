import mongoose, { Document, Schema } from 'mongoose';

export interface ISchemaField {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencesTable?: string;
  referencesField?: string;
  constraints: {
    nullable?: boolean;
    unique?: boolean;
    min?: number;
    max?: number;
    options?: string[];
    defaultValue?: string;
  };
}

export interface ITableSchema {
  id: string;
  name: string;
  fields: ISchemaField[];
  rowsCount: number;
  statisticalContext?: string;
  position?: { x: number; y: number };
}

export interface IProject extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  prompt?: string;
  tables: ITableSchema[];
  flowEdges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
  generationSettings: {
    rowsCount: number;
    exportFormat: string;
    edgeCases: {
      mutationPercentage: number;
      mutations: Record<string, boolean>;
    };
  };
  lastGeneratedAt?: Date;
  totalRowsGenerated: number;
  totalExports: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const schemaFieldDef = {
  id: String,
  name: String,
  type: String,
  isPrimaryKey: { type: Boolean, default: false },
  isForeignKey: { type: Boolean, default: false },
  referencesTable: String,
  referencesField: String,
  constraints: {
    nullable: Boolean,
    unique: Boolean,
    min: Number,
    max: Number,
    options: [String],
    defaultValue: String,
  },
};

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    prompt: { type: String },
    tables: { type: Schema.Types.Mixed, default: [] },
    flowEdges: { type: Schema.Types.Mixed, default: [] },
    generationSettings: {
      rowsCount: { type: Number, default: 100 },
      exportFormat: { type: String, default: 'ZIP' },
      edgeCases: {
        mutationPercentage: { type: Number, default: 0 },
        mutations: { type: Map, of: Boolean },
      },
    },
    lastGeneratedAt: Date,
    totalRowsGenerated: { type: Number, default: 0 },
    totalExports: { type: Number, default: 0 },
    tags: [String],
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProject>('Project', projectSchema);
