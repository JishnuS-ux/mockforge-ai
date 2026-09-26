import { ITableSchema } from '../models/Project';

export function parseSQLSchemaToTables(sql: string): { tables: ITableSchema[]; flowEdges: Array<{ id: string; source: string; target: string }> } {
  const tables: ITableSchema[] = [];
  const flowEdges: Array<{ id: string; source: string; target: string }> = [];
  
  // Split SQL into individual statements
  const createTableRegex = /CREATE\ TABLE\s+(?:IF\ NOT\ EXISTS\s+)?`?([a-zA-Z0-9_]+)`?\s*\(([\s\S]*?)\);/gi;
  let match;
  let tableIndex = 0;

  while ((match = createTableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);

    const fields: any[] = [];
    let fieldIndex = 0;

    for (const line of lines) {
      // Ignore constraints/indexes at the end of create table
      if (line.toUpperCase().startsWith('PRIMARY KEY') || line.toUpperCase().startsWith('KEY') || line.toUpperCase().startsWith('CONSTRAINT')) {
        // Handle inline constraint foreign key
        const fkMatch = line.match(/FOREIGN\ KEY\s*\(`?([a-zA-Z0-9_]+)`?\)\s*REFERENCES\s*`?([a-zA-Z0-9_]+)`?\s*\(`?([a-zA-Z0-9_]+)`?\)/i);
        if (fkMatch) {
          const [, fkCol, refTable, refCol] = fkMatch;
          const targetField = fields.find((f) => f.name === fkCol);
          if (targetField) {
            targetField.isForeignKey = true;
            targetField.referencesTable = refTable;
            targetField.referencesField = refCol;
            flowEdges.push({
              id: `edge-${refTable}-${tableName}-${Math.random().toString(36).substr(2, 5)}`,
              source: refTable,
              target: tableName,
            });
          }
        }
        continue;
      }

      // Column pattern: col_name DATA_TYPE [CONSTRAINTS...]
      const colMatch = line.match(/^`?([a-zA-Z0-9_]+)`?\s+([a-zA-Z0-9_\(\)]+)(.*)/);
      if (colMatch) {
        const [, colName, rawType, rest] = colMatch;
        const upperType = rawType.toUpperCase();
        const upperRest = rest.toUpperCase();

        let type = 'Text';
        if (upperType.includes('UUID')) type = 'UUID';
        else if (upperType.includes('INT')) type = 'Number';
        else if (upperType.includes('DECIMAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) type = 'Decimal';
        else if (upperType.includes('DATE') || upperType.includes('TIME')) type = upperType.includes('TIME') ? 'DateTime' : 'Date';
        else if (upperType.includes('BOOL')) type = 'Boolean';
        else if (colName.toLowerCase().includes('email')) type = 'Email';
        else if (colName.toLowerCase().includes('phone')) type = 'Phone';
        else if (colName.toLowerCase().includes('name')) type = 'Name';

        const isPK = upperRest.includes('PRIMARY KEY') || colName.toLowerCase() === 'id';
        const isNullable = !upperRest.includes('NOT NULL');
        const isUnique = upperRest.includes('UNIQUE');

        fields.push({
          id: `field-${tableName}-${fieldIndex++}`,
          name: colName,
          type,
          isPrimaryKey: isPK,
          isForeignKey: false,
          constraints: {
            nullable: isNullable,
            unique: isUnique,
          },
        });
      }
    }

    // Grid layout for positions
    const colCount = 3;
    const x = (tableIndex % colCount) * 360 + 50;
    const y = Math.floor(tableIndex / colCount) * 320 + 50;
    tableIndex++;

    tables.push({
      id: tableName,
      name: tableName,
      fields,
      rowsCount: 100,
      position: { x, y },
    });
  }

  return { tables, flowEdges };
}
