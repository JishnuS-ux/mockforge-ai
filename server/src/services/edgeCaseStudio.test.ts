import { describe, it, expect } from 'vitest';
import { injectEdgeCases, EdgeCaseConfig } from './edgeCaseStudio';

describe('edgeCaseStudio tests', () => {
  it('should not mutate anything when mutationPercentage is 0', () => {
    const data = new Map<string, Record<string, any>[]>();
    data.set('table_1', [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
    ]);

    const tables = [
      {
        id: 'table_1',
        fields: [
          { name: 'id', isPrimaryKey: true },
          { name: 'name', isPrimaryKey: false },
          { name: 'email', isPrimaryKey: false },
        ],
      },
    ];

    const config: EdgeCaseConfig = {
      mutationPercentage: 0,
      mutations: {
        injectNulls: true,
      },
    };

    const mutated = injectEdgeCases(data, tables, config);
    expect(mutated.get('table_1')![0]).toEqual({ id: '1', name: 'John Doe', email: 'john@example.com' });
  });

  it('should inject nulls when injectNulls is enabled and percentage is 100', () => {
    const data = new Map<string, Record<string, any>[]>();
    data.set('table_1', [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
    ]);

    const tables = [
      {
        id: 'table_1',
        fields: [
          { name: 'id', isPrimaryKey: true },
          { name: 'name', isPrimaryKey: false },
          { name: 'email', isPrimaryKey: false },
        ],
      },
    ];

    const config: EdgeCaseConfig = {
      mutationPercentage: 100,
      mutations: {
        injectNulls: true,
      },
    };

    const mutated = injectEdgeCases(data, tables, config);
    const mutatedRow = mutated.get('table_1')![0];
    
    // Primary key 'id' should not be mutated since injectDuplicatePKs is not enabled/true.
    expect(mutatedRow.id).toBe('1');
    // Non-PK fields should have some mutations applied.
    // In our code, activeMutations includes null, NaN, XSS, etc.
    // We expect the mutated row to not be the original row.
    expect(mutatedRow.name === 'John Doe' && mutatedRow.email === 'john@example.com').toBe(false);
  });
});
