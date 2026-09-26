import { faker } from '@faker-js/faker';
import { ITableSchema, ISchemaField } from '../models/Project';

// ─── Topology sort – ensures parent tables are generated before child tables ───
export function topologicalSort(tables: ITableSchema[]): ITableSchema[] {
  const tableMap = new Map(tables.map((t) => [t.id, t]));
  const visited = new Set<string>();
  const sorted: ITableSchema[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const table = tableMap.get(id);
    if (!table) return;
    // Visit all referenced (parent) tables first
    for (const field of table.fields) {
      if (field.isForeignKey && field.referencesTable) {
        visit(field.referencesTable);
      }
    }
    sorted.push(table);
  }

  for (const t of tables) visit(t.id);
  return sorted;
}

// ─── Value generators per type ─────────────────────────────────────────────────
function generateValue(field: ISchemaField, context?: string): unknown {
  const { type, constraints } = field;

  // Enum / option list
  if (constraints?.options && constraints.options.length > 0) {
    return faker.helpers.arrayElement(constraints.options);
  }

  switch (type) {
    case 'UUID':       return faker.string.uuid();
    case 'Name':       return faker.person.fullName();
    case 'Email':      return faker.internet.email().toLowerCase();
    case 'Phone':      return faker.phone.number('+91 ##########');
    case 'Address':    return `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`;
    case 'Boolean':    return faker.datatype.boolean();
    case 'Date':       return faker.date.past({ years: 5 }).toISOString().split('T')[0];
    case 'DateTime':   return faker.date.past({ years: 2 }).toISOString();

    case 'Number': {
      const min = constraints?.min ?? 0;
      const max = constraints?.max ?? 1000;
      return faker.number.int({ min, max });
    }

    case 'Decimal': {
      const min = constraints?.min ?? 0;
      const max = constraints?.max ?? 10000;
      // Context-aware price ranges
      if (context && context.toLowerCase().includes('lakh')) {
        return parseFloat((faker.number.float({ min: min * 100000, max: max * 100000 }) ).toFixed(2));
      }
      return parseFloat(faker.number.float({ min, max, fractionDigits: 2 }).toFixed(2));
    }

    case 'Text': {
      // Generate based on field name heuristics
      const name = field.name.toLowerCase();
      if (name.includes('description') || name.includes('notes') || name.includes('comment')) return faker.lorem.sentence();
      if (name.includes('title') || name.includes('subject'))       return faker.lorem.words(3);
      if (name.includes('url') || name.includes('link'))            return faker.internet.url();
      if (name.includes('ip'))                                       return faker.internet.ip();
      if (name.includes('color') || name.includes('colour'))        return faker.color.human();
      if (name.includes('country'))                                  return faker.location.country();
      if (name.includes('city'))                                     return faker.location.city();
      if (name.includes('state'))                                    return faker.location.state();
      if (name.includes('zip') || name.includes('postal'))         return faker.location.zipCode();
      if (name.includes('company') || name.includes('org'))         return faker.company.name();
      if (name.includes('department') || name.includes('dept'))     return faker.commerce.department();
      if (name.includes('product') || name.includes('item'))        return faker.commerce.productName();
      if (name.includes('price') || name.includes('amount'))        return faker.commerce.price();
      if (name.includes('username') || name.includes('handle'))     return faker.internet.userName();
      if (name.includes('ifsc'))                                     return `${faker.string.alpha({ length: 4, casing: 'upper' })}0${faker.string.numeric(6)}`;
      if (name.includes('pan'))                                      return `${faker.string.alpha({ length: 5, casing: 'upper' })}${faker.string.numeric(4)}${faker.string.alpha({ length: 1, casing: 'upper' })}`;
      return faker.lorem.word();
    }

    case 'Custom': return faker.lorem.word();
    default:       return faker.lorem.word();
  }
}

// ─── Main generation function ──────────────────────────────────────────────────
export function generateTableData(
  table: ITableSchema,
  parentData: Map<string, Record<string, unknown>[]>,
  rowCount: number
): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const pkField = table.fields.find((f) => f.isPrimaryKey);
  const pkValues: unknown[] = [];

  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, unknown> = {};

    for (const field of table.fields) {
      if (field.isForeignKey && field.referencesTable && field.referencesField) {
        const parentRows = parentData.get(field.referencesTable);
        if (parentRows && parentRows.length > 0) {
          const parentRow = faker.helpers.arrayElement(parentRows);
          row[field.name] = parentRow[field.referencesField];
          continue;
        }
      }
      row[field.name] = generateValue(field, table.statisticalContext);
    }

    // Track primary key values for child tables
    if (pkField) pkValues.push(row[pkField.name]);
    rows.push(row);
  }

  return rows;
}

// ─── Full schema generation ───────────────────────────────────────────────────
export async function generateAllTableData(
  tables: ITableSchema[],
  onProgress?: (tableName: string, rowsGenerated: number) => void
): Promise<Map<string, Record<string, unknown>[]>> {
  const sorted = topologicalSort(tables);
  const generatedData = new Map<string, Record<string, unknown>[]>();

  for (const table of sorted) {
    const data = generateTableData(table, generatedData, table.rowsCount);
    generatedData.set(table.id, data);
    if (onProgress) onProgress(table.name, data.length);
  }

  return generatedData;
}
