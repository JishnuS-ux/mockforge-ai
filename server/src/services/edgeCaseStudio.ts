import { faker } from '@faker-js/faker';

export interface EdgeCaseConfig {
  mutationPercentage: number;
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
  };
}

const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '"><img src=x onerror=alert(1)>',
  "javascript:alert('XSS')",
  '<svg onload=alert(1)>',
  '"><svg/onload=alert(1)>',
  '<iframe src="javascript:alert(1)">',
];

const SQLI_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "' UNION SELECT NULL, NULL, NULL --",
  "1' AND 1=1 --",
  "admin'--",
  "' OR 1=1#",
];

const COMMAND_INJECTION_PAYLOADS = [
  '; ls -la',
  '| cat /etc/passwd',
  '`whoami`',
  '$(id)',
  '; rm -rf /',
];

function shouldMutate(percentage: number): boolean {
  return Math.random() * 100 < percentage;
}

function pickMutation(config: EdgeCaseConfig, value: unknown, fieldName: string): unknown {
  const { mutations, mutationPercentage } = config;
  if (!shouldMutate(mutationPercentage)) return value;

  const activeMutations: Array<() => unknown> = [];

  if (mutations.injectNulls)         activeMutations.push(() => null);
  if (mutations.injectNaNs)          activeMutations.push(() => 'NaN');
  if (mutations.injectNegatives)     activeMutations.push(() => -Math.abs(faker.number.int({ min: 1, max: 9999 })));
  if (mutations.injectHugeNumbers)   activeMutations.push(() => Number.MAX_SAFE_INTEGER);
  if (mutations.injectXSS)           activeMutations.push(() => faker.helpers.arrayElement(XSS_PAYLOADS));
  if (mutations.injectSQLi)          activeMutations.push(() => faker.helpers.arrayElement(SQLI_PAYLOADS));
  if (mutations.injectBrokenJSON)    activeMutations.push(() => '{broken": json, "missing": quotes}');
  if (mutations.injectExpiredDates)  activeMutations.push(() => faker.date.past({ years: 10, refDate: new Date('2000-01-01') }).toISOString());
  if (mutations.injectFutureDates)   activeMutations.push(() => faker.date.future({ years: 50 }).toISOString());
  if (mutations.injectInvalidPhones) activeMutations.push(() => faker.helpers.arrayElement(['00000000000', '999999999999999', 'NOT_A_PHONE', '+0-000-000']));
  if (mutations.injectInvalidEmails) activeMutations.push(() => faker.helpers.arrayElement(['notanemail', 'missing@', '@nodomain', 'spaces in@email.com', '']));

  // Command injection only for text fields
  if (typeof value === 'string' && (fieldName.toLowerCase().includes('name') || fieldName.toLowerCase().includes('comment'))) {
    activeMutations.push(() => faker.helpers.arrayElement(COMMAND_INJECTION_PAYLOADS));
  }

  // Unicode/Emoji mutations
  activeMutations.push(() => faker.helpers.arrayElement(['🎉🔥💀', '日本語テスト', 'مرحبا بالعالم', 'ñ ü ö ä è é', '\u0000\u0001\u0002']));

  // Long string
  activeMutations.push(() => faker.lorem.paragraphs(10));

  if (activeMutations.length === 0) return value;
  return faker.helpers.arrayElement(activeMutations)();
}

export function injectEdgeCases(
  data: Map<string, Record<string, unknown>[]>,
  tables: Array<{ id: string; fields: Array<{ name: string; isPrimaryKey: boolean }> }>,
  config: EdgeCaseConfig
): Map<string, Record<string, unknown>[]> {
  if (config.mutationPercentage === 0) return data;

  const mutated = new Map<string, Record<string, unknown>[]>();

  for (const [tableId, rows] of data.entries()) {
    const tableDef = tables.find((t) => t.id === tableId);
    const mutatedRows = rows.map((row) => {
      const newRow = { ...row };
      for (const [fieldName, value] of Object.entries(row)) {
        // Never mutate primary keys unless specifically requested
        const isPK = tableDef?.fields.find((f) => f.name === fieldName)?.isPrimaryKey;
        if (isPK && !config.mutations.injectDuplicatePKs) continue;
        if (isPK && config.mutations.injectDuplicatePKs && shouldMutate(config.mutationPercentage / 2)) {
          // Duplicate a random existing PK
          const randomRow = faker.helpers.arrayElement(rows);
          newRow[fieldName] = randomRow[fieldName];
          continue;
        }
        newRow[fieldName] = pickMutation(config, value, fieldName);
      }
      return newRow;
    });
    mutated.set(tableId, mutatedRows);
  }

  return mutated;
}
