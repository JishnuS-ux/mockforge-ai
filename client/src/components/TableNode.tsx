import { Handle, Position, NodeProps } from 'reactflow';
import { Key, Link, Hash, HelpCircle, AlignLeft, User, Mail, Phone, MapPin, Calendar, CheckSquare, AlertCircle } from 'lucide-react';

interface IFieldConstraint {
  nullable?: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  regex?: string;
  defaultValue?: string;
  options?: string[];
}

interface ISchemaField {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencesTable?: string;
  referencesField?: string;
  constraints: IFieldConstraint;
}

interface ITableSchema {
  id: string;
  name: string;
  fields: ISchemaField[];
  rowsCount: number;
  statisticalContext?: string;
  position?: { x: number; y: number };
}

const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  UUID: Hash,
  Text: AlignLeft,
  Name: User,
  Email: Mail,
  Phone: Phone,
  Address: MapPin,
  Number: Hash,
  Decimal: Hash,
  Boolean: CheckSquare,
  Date: Calendar,
  DateTime: Calendar,
  Custom: HelpCircle,
};

const TYPE_BADGES: Record<string, string> = {
  UUID: 'badge-primary',
  Text: 'badge-accent',
  Name: 'badge-success',
  Email: 'badge-success',
  Phone: 'badge-success',
  Address: 'badge-success',
  Number: 'badge-warning',
  Decimal: 'badge-warning',
  Boolean: 'badge-info',
  Date: 'badge-primary',
  DateTime: 'badge-primary',
  Custom: 'badge-accent',
};

interface TableNodeData {
  table: ITableSchema;
  selected?: boolean;
}

export default function TableNode({ data }: NodeProps<TableNodeData>) {
  const { table } = data;
  const fields = table.fields || [];

  return (
    <div
      className={`glass`}
      style={{
        minWidth: 220,
        borderRadius: 'var(--radius-md)',
        border: data.selected ? '2px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: data.selected ? 'var(--shadow-glow)' : 'var(--shadow-md)',
        background: 'var(--bg-card)',
        overflow: 'hidden',
      }}
    >
      {/* Target Handle (Left) - Inputs for FK relationships */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          background: 'var(--accent)',
          width: 8,
          height: 8,
          borderRadius: '50%',
        }}
      />

      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, hsla(258,88%,66%,0.15), hsla(188,94%,53%,0.05))',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 14,
            color: 'var(--text-primary)',
          }}
        >
          {table.name}
        </span>
        <span className="badge badge-accent btn-sm" style={{ fontSize: 10, padding: '1px 6px' }}>
          {table.rowsCount || 0} rows
        </span>
      </div>

      {/* Fields List */}
      <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column' }}>
        {fields.length === 0 ? (
          <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} />
            No fields defined
          </div>
        ) : (
          fields.map((field: ISchemaField) => {
            const Icon = TYPE_ICONS[field.type] || HelpCircle;
            const badgeClass = TYPE_BADGES[field.type] || 'badge-primary';

            return (
              <div
                key={field.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  fontSize: 12,
                  borderBottom: '1px solid hsla(220, 15%, 30%, 0.1)',
                }}
              >
                {/* PK or FK icons */}
                {field.isPrimaryKey && (
                  <Key size={12} color="var(--warning)" style={{ flexShrink: 0 }} />
                )}
                {field.isForeignKey && (
                  <Link size={12} color="var(--accent)" style={{ flexShrink: 0 }} />
                )}
                {!field.isPrimaryKey && !field.isForeignKey && (
                  <Icon size={12} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                )}

                {/* Field Name */}
                <span
                  style={{
                    fontWeight: field.isPrimaryKey || field.isForeignKey ? 600 : 400,
                    color: field.isPrimaryKey || field.isForeignKey ? 'var(--text-primary)' : 'var(--text-secondary)',
                    marginRight: 'auto',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {field.name}
                </span>

                {/* Field Type Badge */}
                <span className={`badge ${badgeClass}`} style={{ fontSize: 9, padding: '1px 6px', textTransform: 'lowercase' }}>
                  {field.type}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Source Handle (Right) - Outputs for reference relationships */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: 'var(--primary)',
          width: 8,
          height: 8,
          borderRadius: '50%',
        }}
      />
    </div>
  );
}
