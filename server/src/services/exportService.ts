import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import * as XLSX from 'xlsx';
import { ITableSchema } from '../models/Project';

const EXPORTS_DIR = path.join(__dirname, '../../../exports');
if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

// ─── CSV export ───────────────────────────────────────────────────────────────
function rowsToCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const str = v === null || v === undefined ? '' : String(v);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };
  const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))];
  return lines.join('\n');
}

// ─── SQL INSERT dump ──────────────────────────────────────────────────────────
function rowsToSQL(tableName: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return v ? '1' : '0';
    return `'${String(v).replace(/'/g, "''")}'`;
  };
  const header = `-- Table: ${tableName}\n`;
  const stmts = rows
    .map((r) => `INSERT INTO \`${tableName}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${cols.map((c) => escape(r[c])).join(', ')});`)
    .join('\n');
  return header + stmts + '\n';
}

// ─── Main export function ─────────────────────────────────────────────────────
export async function exportData(
  tables: ITableSchema[],
  generatedData: Map<string, Record<string, unknown>[]>,
  format: 'CSV' | 'JSON' | 'SQL' | 'EXCEL' | 'ZIP',
  jobId: string
): Promise<string> {
  const outDir = path.join(EXPORTS_DIR, jobId);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const filePaths: string[] = [];

  for (const table of tables) {
    const rows = generatedData.get(table.id) || [];

    if (format === 'JSON' || format === 'ZIP') {
      const filePath = path.join(outDir, `${table.name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));
      filePaths.push(filePath);
    }

    if (format === 'CSV' || format === 'ZIP') {
      const filePath = path.join(outDir, `${table.name}.csv`);
      fs.writeFileSync(filePath, rowsToCSV(rows));
      filePaths.push(filePath);
    }

    if (format === 'SQL' || format === 'ZIP') {
      const filePath = path.join(outDir, `${table.name}.sql`);
      fs.writeFileSync(filePath, rowsToSQL(table.name, rows));
      filePaths.push(filePath);
    }

    if (format === 'EXCEL' || format === 'ZIP') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, table.name.substring(0, 31));
      const filePath = path.join(outDir, `${table.name}.xlsx`);
      XLSX.writeFile(wb, filePath);
      filePaths.push(filePath);
    }
  }

  // ─── ZIP everything ──────────────────────────────────────────────────────────
  const zipPath = path.join(EXPORTS_DIR, `${jobId}.zip`);
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(outDir, false);
    archive.finalize();
  });

  // Clean up individual files directory
  fs.rmSync(outDir, { recursive: true, force: true });

  return zipPath;
}

// ─── Preview helper (first 20 rows per table) ────────────────────────────────
export function getPreviewData(
  tables: ITableSchema[],
  generatedData: Map<string, Record<string, unknown>[]>,
  limit = 20
): Record<string, Record<string, unknown>[]> {
  const preview: Record<string, Record<string, unknown>[]> = {};
  for (const table of tables) {
    const rows = generatedData.get(table.id) || [];
    preview[table.name] = rows.slice(0, limit);
  }
  return preview;
}
