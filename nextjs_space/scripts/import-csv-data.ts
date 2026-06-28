import { parse as csvParse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const DB_DIR = 'C:\\Users\\luanp\\Downloads\\db';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface ImportTask {
  file: string;
  table: string;
}

const IMPORT_ORDER: ImportTask[] = [
  { file: 'data (9).csv',  table: 'users' },
  { file: 'data.csv',       table: 'accounts' },
  { file: 'data (5).csv',  table: 'professors' },
  { file: 'data (8).csv',  table: 'students' },
  { file: 'data (7).csv',  table: 'student_professor_links' },
  { file: 'data (12).csv', table: 'workout_templates' },
  { file: 'data (11).csv', table: 'workout_template_exercises' },
  { file: 'data (2).csv',  table: 'assigned_workouts' },
  { file: 'data (1).csv',  table: 'assigned_workout_exercises' },
  { file: 'data (10).csv', table: 'workout_logs' },
  { file: 'data (3).csv',  table: 'exercise_logs' },
  { file: 'data (4).csv',  table: 'pending_invites' },
  { file: 'data (6).csv',  table: 'student_evaluations' },
];

function parseJsonSafe(value: string): any {
  if (!value || value.trim() === '') return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseBooleanSafe(value: string): any {
  if (!value || value.trim() === '') return null;
  const v = value.trim().toLowerCase();
  if (v === 'true' || v === 't' || v === '1') return true;
  if (v === 'false' || v === 'f' || v === '0') return false;
  return value;
}

async function importCsv(task: ImportTask): Promise<number> {
  const filePath = path.join(DB_DIR, task.file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const records = csvParse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  });

  if (records.length === 0) return 0;

  const rows = records.map((r: any) => {
    const row: Record<string, any> = {};
    for (const [key, val] of Object.entries(r)) {
      if (val === null || val === undefined || val === '') {
        row[key] = null;
      } else {
        const v = String(val);
        row[key] = parseJsonSafe(v);
      }
    }
    // Fix boolean fields for specific tables
    if (task.table === 'assigned_workout_exercises' || task.table === 'workout_template_exercises') {
      if (row.has_warmup !== undefined && row.has_warmup !== null) {
        row.has_warmup = parseBooleanSafe(String(row.has_warmup));
      }
    }
    if (task.table === 'student_evaluations') {
      for (const field of ['health_issues', 'previous_training', 'medication', 'agreed_terms']) {
        if (row[field] !== undefined && row[field] !== null) {
          row[field] = parseBooleanSafe(String(row[field]));
        }
      }
    }
    if (task.table === 'workout_templates' || task.table === 'users' || task.table === 'student_professor_links') {
      if (row.is_personal !== undefined && row.is_personal !== null) {
        row.is_personal = parseBooleanSafe(String(row.is_personal));
      }
      if (row.email_verified !== undefined && row.email_verified !== null) {
        row.email_verified = parseBooleanSafe(String(row.email_verified));
      }
    }
    return row;
  });

  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from(task.table)
      .insert(batch)
      .select('id');

    if (error) {
      throw new Error(`Error inserting into ${task.table} batch ${i}: ${error.message}`);
    }
    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${rows.length} into ${task.table}`);
  }

  return inserted;
}

async function resetSequences() {
  const tables = IMPORT_ORDER.map(t => t.table);
  for (const table of tables) {
    const { error } = await supabase.rpc('reset_sequence', { table_name: table });
    if (error) {
      // Try raw SQL approach for sequence reset
      await supabase.from(table).select('id').limit(1);
    }
  }
}

async function main() {
  console.log('Starting CSV data import to Supabase...\n');

  let total = 0;

  for (const task of IMPORT_ORDER) {
    console.log(`\nImporting ${task.table} from ${task.file}...`);
    try {
      const count = await importCsv(task);
      console.log(`  [OK] ${count} rows inserted into ${task.table}`);
      total += count;
    } catch (err: any) {
      console.error(`  [FAIL] ${task.table}: ${err.message}`);
      process.exit(1);
    }
  }

  console.log(`\n==============================`);
  console.log(`Total: ${total} rows imported across ${IMPORT_ORDER.length} tables`);
  console.log(`==============================`);
}

main()
  .catch((e) => {
    console.error('Import failed:', e);
    process.exit(1);
  });
