import { describe, it, expect } from 'vitest';
import { topologicalSort, generateTableData } from './generationEngine';
import { ITableSchema } from '../models/Project';

describe('generationEngine tests', () => {
  it('should sort tables topologically based on foreign key references', () => {
    const tables: ITableSchema[] = [
      {
        id: 'table_users',
        name: 'users',
        fields: [
          { name: 'id', type: 'UUID', isPrimaryKey: true },
          { name: 'role_id', type: 'UUID', isForeignKey: true, referencesTable: 'table_roles', referencesField: 'id' },
        ],
        rowsCount: 10,
      } as any,
      {
        id: 'table_roles',
        name: 'roles',
        fields: [
          { name: 'id', type: 'UUID', isPrimaryKey: true },
          { name: 'name', type: 'Name' },
        ],
        rowsCount: 5,
      } as any,
    ];

    const sorted = topologicalSort(tables);
    expect(sorted[0].id).toBe('table_roles');
    expect(sorted[1].id).toBe('table_users');
  });

  it('should generate table data with the correct number of rows and properties', () => {
    const table: ITableSchema = {
      id: 'table_users',
      name: 'users',
      fields: [
        { name: 'id', type: 'UUID', isPrimaryKey: true },
        { name: 'fullName', type: 'Name' },
        { name: 'age', type: 'Number', constraints: { min: 18, max: 60 } },
        { name: 'active', type: 'Boolean' },
      ],
      rowsCount: 5,
    } as any;

    const parentData = new Map();
    const rows = generateTableData(table, parentData, 5);

    expect(rows.length).toBe(5);
    expect(rows[0]).toHaveProperty('id');
    expect(rows[0]).toHaveProperty('fullName');
    expect(rows[0]).toHaveProperty('age');
    expect(rows[0]).toHaveProperty('active');

    expect(typeof rows[0].id).toBe('string');
    expect(typeof rows[0].fullName).toBe('string');
    expect(typeof rows[0].age).toBe('number');
    expect(rows[0].age).toBeGreaterThanOrEqual(18);
    expect(rows[0].age).toBeLessThanOrEqual(60);
    expect(typeof rows[0].active).toBe('boolean');
  });

  it('should resolve foreign keys from parentData', () => {
    const usersTable: ITableSchema = {
      id: 'table_users',
      name: 'users',
      fields: [
        { name: 'id', type: 'UUID', isPrimaryKey: true },
        { name: 'role_id', type: 'UUID', isForeignKey: true, referencesTable: 'table_roles', referencesField: 'id' },
      ],
      rowsCount: 3,
    } as any;

    const parentData = new Map();
    parentData.set('table_roles', [
      { id: 'role-123', name: 'Admin' },
      { id: 'role-456', name: 'User' },
    ]);

    const rows = generateTableData(usersTable, parentData, 3);
    expect(rows.length).toBe(3);
    expect(['role-123', 'role-456']).toContain(rows[0].role_id);
    expect(['role-123', 'role-456']).toContain(rows[1].role_id);
    expect(['role-123', 'role-456']).toContain(rows[2].role_id);
  });
});
