import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'supabase/migrations');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

// Helper to get all files recursively
function getAllFiles(dir: string, extension: string[] = ['.ts', '.tsx', '.js', '.sql']): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(filePath, extension));
        } else {
            if (extension.includes(path.extname(file))) {
                results.push(filePath);
            }
        }
    });
    return results;
}

// 1. Extract Tables from Migrations
const migrationFiles = getAllFiles(MIGRATIONS_DIR, ['.sql']);
const tables = new Set<string>();

migrationFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    // Regex for CREATE TABLE public.tablename or CREATE TABLE tablename
    const createTableRegex = /CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?(\w+)/gi;
    let match;
    while ((match = createTableRegex.exec(content)) !== null) {
        tables.add(match[1]);
    }
});

console.log('Found Tables in Schema:', Array.from(tables));

// 2. Scan Source Code for Usage
const srcFiles = getAllFiles(SRC_DIR, ['.ts', '.tsx', '.js']);
const tableUsage: Record<string, number> = {};
tables.forEach(t => tableUsage[t] = 0);

srcFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    tables.forEach(table => {
        // Simple heuristic: literal string match of table name
        // e.g. .from('users') or "users"
        // We look for 'table_name' or "table_name"
        const regex = new RegExp(`['"]${table}['"]`, 'g');
        if (regex.test(content)) {
            tableUsage[table]++;
        }
    });
});

// 3. Report
console.log('\n# Schema Usage Report');
console.log('## Unused Tables (Candidates for Deletion)');

const unused = Array.from(tables).filter(t => tableUsage[t] === 0);
if (unused.length === 0) {
    console.log('None. All tables seem to be referenced in the code.');
} else {
    unused.forEach(t => {
        console.log(`- ${t}`);
    });
}

console.log('\n## Usage Counts for Verification');
Array.from(tables).forEach(t => {
    if (tableUsage[t] > 0) {
        // console.log(`- ${t}: ${tableUsage[t]} references`);
    }
});
