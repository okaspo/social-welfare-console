import fs from 'fs';
import path from 'path';

// Fix for ReferenceError: __dirname in some envs
const PROJECT_ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'supabase/migrations');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

function getAllFiles(dir: string, extension: string[]): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    // Ignore node_modules, .next, .git
    if (dir.includes('node_modules') || dir.includes('.next') || dir.includes('.git')) return [];

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

// Data Structures
interface TableDef {
    name: string;
    columns: Set<string>;
    policies: Set<string>;
}

const schema: Record<string, TableDef> = {};

// 1. Parse SQL
const sqlFiles = getAllFiles(MIGRATIONS_DIR, ['.sql']);
// Sort by name to strict chronological order might be better, but we just want full view
sqlFiles.sort();

console.log(`Parsing ${sqlFiles.length} migration files...`);

sqlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');

    // Naive Parser
    const lines = content.split('\n');
    let currentTable = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('--') || trimmed.length === 0) continue;

        // CREATE TABLE
        const createMatch = /CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?(\w+)/i.exec(trimmed);
        if (createMatch) {
            currentTable = createMatch[1];
            if (!schema[currentTable]) {
                schema[currentTable] = { name: currentTable, columns: new Set(), policies: new Set() };
            }
        }

        // ALTER TABLE (for columns or RLS)
        const alterMatch = /ALTER TABLE (?:ONLY )?(?:public\.)?(\w+)/i.exec(trimmed);
        if (alterMatch) {
            currentTable = alterMatch[1];
            if (!schema[currentTable]) {
                schema[currentTable] = { name: currentTable, columns: new Set(), policies: new Set() };
            }
        }

        // Column Definition (Simple check if inside create table or Add Column)
        // e.g. "  name TEXT NOT NULL," or "ADD COLUMN name ..."
        // This is tricky without AST. We'll look for "ADD COLUMN" specifically or lines starting with words if we know we are in CREATE block.
        // Let's rely on "ADD COLUMN" and known patterns inside CREATE.
        // Heuristic: If line starts with word and contains type (TEXT, UUID, INT, BOOLEAN, TIMESTAMP), it might be a column.

        // ADD COLUMN
        const addColMatch = /ADD COLUMN\s+(\w+)\s+/i.exec(trimmed);
        if (addColMatch && currentTable) {
            schema[currentTable].columns.add(addColMatch[1]);
        }

        // Inside Create Table (loose context tracking)
        // We won't implement full context tracking here, but we can search for generic column patterns if we are sure?
        // Let's refine: Search for specific KNOWN columns.
        // Or better: Regex for `  column_name data_type`
        const colDefMatch = /^\s+(\w+)\s+(UUID|TEXT|INTEGER|BOOLEAN|TIMESTAMP|DATE|JSONB)/i.exec(line); // No trim for indent check
        if (colDefMatch && currentTable) {
            schema[currentTable].columns.add(colDefMatch[1]);
        }

        // RLS Policy
        const policyMatch = /CREATE POLICY "([^"]+)" ON (?:public\.)?(\w+)/i.exec(trimmed);
        if (policyMatch) {
            const tableName = policyMatch[2];
            const policyName = policyMatch[1];
            if (!schema[tableName]) schema[tableName] = { name: tableName, columns: new Set(), policies: new Set() };
            schema[tableName].policies.add(policyName);
        }
    }
});

// 2. Scan Code
const codeFiles = getAllFiles(SRC_DIR, ['.ts', '.tsx', '.js']);
const tableUsage: Record<string, number> = {};
const columnUsage: Record<string, Set<string>> = {}; // Table -> Used Cols

Object.keys(schema).forEach(t => {
    tableUsage[t] = 0;
    columnUsage[t] = new Set();
});

// Generic columns to skip analysis
const IGNORED_COLS = ['id', 'created_at', 'updated_at', 'name', 'user_id', 'organization_id', 'content', 'title', 'role', 'email'];

console.log(`Scanning ${codeFiles.length} source files...`);

codeFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');

    Object.values(schema).forEach(table => {
        // Table Usage
        if (content.includes(`"${table.name}"`) || content.includes(`'${table.name}'`)) {
            tableUsage[table.name]++;
        }

        // Column Usage
        table.columns.forEach(col => {
            if (IGNORED_COLS.includes(col)) return; // Skip generics
            if (content.includes(`"${col}"`) || content.includes(`'${col}'`) || content.includes(`.${col}`)) {
                columnUsage[table.name].add(col);
            }
        });
    });
});

// 3. Report
console.log('\n=============================================');
console.log('       DATABASE DEPENDENCY ANALYSIS       ');
console.log('=============================================\n');

console.log('## 1. Unused Tables (0 references in src)');
const unusedTables = Object.keys(schema).filter(t => tableUsage[t] === 0);
if (unusedTables.length === 0) console.log('✅ None');
else unusedTables.forEach(t => console.log(`- 🔴 ${t}`));

console.log('\n## 2. Potentially Unused Columns (Specific columns not found)');
Object.keys(schema).forEach(t => {
    if (tableUsage[t] === 0) return; // Skip unused tables

    const definedCols = Array.from(schema[t].columns);
    const usedCols = columnUsage[t];

    const unusedCols = definedCols.filter(c => !IGNORED_COLS.includes(c) && !usedCols.has(c));

    if (unusedCols.length > 0) {
        console.log(`\n### Table: ${t}`);
        unusedCols.forEach(c => console.log(`- ⚠️  ${c}`));
    }
});

console.log('\n## 3. RLS Policy Check (Snapshot)');
Object.keys(schema).forEach(t => {
    const policies = Array.from(schema[t].policies);
    if (policies.length > 0) {
        // console.log(`- ${t}: ${policies.length} policies`);
        // Check for duplicates roughly
        const names = policies.map(p => p.toLowerCase());
        const duplicates = names.filter((item, index) => names.indexOf(item) !== index);
        if (duplicates.length > 0) {
            console.log(`- 🔴 ${t}: Duplicate Policy Names Detected: ${duplicates.join(', ')}`);
        }
    }
});

console.log('\n=============================================');
