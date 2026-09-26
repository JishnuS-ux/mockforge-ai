export type DataType =
  | 'UUID'
  | 'Text'
  | 'Name'
  | 'Email'
  | 'Phone'
  | 'Address'
  | 'Number'
  | 'Decimal'
  | 'Boolean'
  | 'Date'
  | 'DateTime'
  | 'PAN'
  | 'GSTIN'
  | 'IFSC'
  | 'BloodGroup'
  | 'GPS'
  | 'VehicleNumber'
  | 'JSON'
  | 'Custom';

export interface FieldConstraint {
  nullable?: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  regex?: string;
  defaultValue?: string;
  options?: string[]; // for enum-like custom types
}

export interface SchemaField {
  id: string;
  name: string;
  type: DataType;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencesTable?: string;
  referencesField?: string;
  constraints: FieldConstraint;
  semanticMeaning?: string;
  confidenceScore?: number;
  reasoning?: string;
}

export interface TableSchema {
  id: string;
  name: string;
  fields: SchemaField[];
  rowsCount: number;
  statisticalContext?: string; // e.g., "Premium electronics prices from 50k to 200k", "Ages 18-35 only"
  position?: { x: number; y: number }; // React Flow position
}

export interface DatabaseSchema {
  tables: TableSchema[];
}

export interface DomainClassification {
  domain: string;
  confidence: number;
  reasoning: string;
}

export interface InferredBusinessRule {
  id: string;
  rule: string;
  expression: string;
  status: 'inferred' | 'accepted' | 'rejected' | 'user-defined';
  targetTable: string;
  explanation: string;
}

export interface EdgeCaseSettings {
  mutationPercentage: number; // 0 to 100
  mutations: {
    injectNulls?: boolean;
    injectNaNs?: boolean;
    injectNegatives?: boolean;
    injectHugeNumbers?: boolean;
    injectXSS?: boolean;
    injectSQLi?: boolean;
    injectBrokenJSON?: boolean;
    injectDuplicatePKs?: boolean;
    injectExpiredDates?: boolean;
    injectFutureDates?: boolean;
    injectInvalidPhones?: boolean;
    injectInvalidEmails?: boolean;
    injectUnicodeEmoji?: boolean;
    injectBoundaryValues?: boolean;
  };
}

export interface GenerationSettings {
  rowsCount: number;
  edgeCases: EdgeCaseSettings;
  exportFormat: 'CSV' | 'JSON' | 'SQL' | 'EXCEL' | 'ZIP' | 'PARQUET';
  locale?: string;
  seed?: number;
}

export interface JobLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0 to 100
  rowsTotal: number;
  rowsGenerated: number;
  speed?: number; // rows per second
  timeRemaining?: number; // seconds
  logs: JobLog[];
  exportPath?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  confirmationPlan?: AICopilotConfirmationPlan;
}

export interface AICopilotConfirmationPlan {
  id: string;
  domain: string;
  recordCount: number;
  locale: string;
  entities: string[];
  relationshipsCount: number;
  inferredRules: string[];
  edgeCaseCategories: string[];
  estimatedSizeMB: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'executed';
}

export interface DataQualityReport {
  overallScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  completeness: number;
  uniqueness: number;
  referentialIntegrity: number;
  businessRuleCompliance: number;
  distributionSimilarity: number;
  privacyRisk: number;
  anomalyScore: number;
  findings: Array<{
    id: string;
    level: 'info' | 'warning' | 'critical';
    message: string;
    table?: string;
    field?: string;
    suggestedFix?: string;
    action?: () => void;
  }>;
}

export interface DatasetVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  versionTag: string;
  description: string;
  rowsCount: number;
  tablesCount: number;
  seed: number;
  configSnapshot: {
    tables: TableSchema[];
    settings: GenerationSettings;
  };
  createdAt: string;
}

export interface OpenAPITestScenario {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  summary: string;
  category: 'valid' | 'boundary' | 'invalid_type' | 'missing_field' | 'security';
  requestBody?: any;
  queryParams?: Record<string, string>;
  expectedStatus: number;
}

export interface DatabaseConnectionConfig {
  id?: string;
  type: 'mongodb' | 'postgresql' | 'mysql' | 'sqlite';
  connectionString: string;
  databaseName?: string;
  ssl?: boolean;
}

export interface ActivityLog {
  id: string;
  projectId?: string;
  action: string;
  detail: string;
  timestamp: string;
  user: string;
  type: 'schema' | 'generation' | 'quality' | 'export' | 'api' | 'setting';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  link?: string;
}

