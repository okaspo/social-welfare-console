import fs from 'fs';
import path from 'path';

// Fix for ReferenceError: __dirname in some envs
const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const APP_DIR = path.join(SRC_DIR, 'app');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');

// Helper to get all files recursively
function getAllFiles(dir: string, extension: string[] = ['.ts', '.tsx']): string[] {
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

// 1. Inventory
const allFiles = getAllFiles(SRC_DIR);
const componentFiles = getAllFiles(COMPONENTS_DIR);
const pageFiles = getAllFiles(APP_DIR).filter(f => f.endsWith('page.tsx'));

// Map page files to routes
const routes = pageFiles.map(f => {
    let relPath = path.relative(APP_DIR, f);
    if (path.sep === '\\') relPath = relPath.replace(/\\/g, '/'); // Normalize windows paths
    let route = '/' + relPath.replace('/page.tsx', '').replace('page.tsx', '');
    if (route === '/index') route = '/';
    // Dynamic routes cleanup for simple matching (e.g., [id] -> *)
    // We will keep literal version for robust matching, and maybe a regex version?
    // For now, let's just store the literal route string.
    return route;
});

// Stats
const usageCounts: Record<string, number> = {};
componentFiles.forEach(f => usageCounts[f] = 0);

const routeUsageCounts: Record<string, number> = {};
routes.forEach(r => routeUsageCounts[r] = 0);

const brokenLinks: { file: string, link: string }[] = [];
const deadImports: { file: string, importPath: string }[] = [];

// Analysis
allFiles.forEach(file => {
    // Skip .d.ts
    if (file.endsWith('.d.ts')) return;

    const content = fs.readFileSync(file, 'utf-8');

    // Check Imports (Basic regex, not AST)
    // imports
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];

        // Check component usage
        // If importPath looks like a component...
        // Simplified: Check if importPath resolves to one of our componentFiles
        if (importPath.startsWith('@/components/')) {
            const relKey = importPath.replace('@/components/', '');
            // Try to find matching component
            const foundComp = componentFiles.find(cf => {
                const norm = cf.replace(/\\/g, '/');
                return norm.includes('/components/' + relKey) || norm.endsWith(relKey + '.tsx') || norm.endsWith(relKey + '/index.tsx');
            });
            if (foundComp) {
                usageCounts[foundComp]++;
            }
        } else if (importPath.startsWith('.') || importPath.startsWith('@/')) {
            // Verify existence (Dead Imports)
            // Resolve path
            let resolved = '';
            if (importPath.startsWith('@/')) {
                resolved = path.join(SRC_DIR, importPath.replace('@/', ''));
            } else {
                resolved = path.join(path.dirname(file), importPath);
            }

            // Try extensions
            const exts = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
            let exists = false;
            for (const ext of exts) {
                if (fs.existsSync(resolved + ext)) {
                    exists = true;
                    break;
                }
            }
            // Ignore css, json etc for now or check them too?
            if (!exists && !importPath.endsWith('.css')) {
                // deadImports.push({ file, importPath }); 
            }
        }
    }

    // Check Links
    // <Link href="...">, router.push("...")
    const linkRegex = /(?:href=|push\()\s*['"]([^'"]+)['"]/g;
    while ((match = linkRegex.exec(content)) !== null) {
        let link = match[1];
        // Ignore external
        if (link.startsWith('http') || link.startsWith('mailto')) continue;

        // Remove query params
        link = link.split('?')[0];

        // Normalize
        if (link.endsWith('/') && link !== '/') link = link.slice(0, -1);

        // Check if consistent with know routes
        // Exact match?
        let found = false;

        // Exact match
        if (routes.includes(link) || routes.includes(link + '/')) {
            routeUsageCounts[link]++;
            found = true;
        } else {
            // Dynamic match?
            // e.g. /dashboard/meetings/123 -> matches /dashboard/meetings/[id]
            const dynamicRoutes = routes.filter(r => r.includes('['));
            for (const dr of dynamicRoutes) {
                // Convert dr to regex: [id] -> [^/]+
                const pattern = '^' + dr.replace(/\[.*?\]/g, '[^/]+') + '$';
                if (new RegExp(pattern).test(link)) {
                    routeUsageCounts[dr]++;
                    found = true;
                    break;
                }
            }
        }

        if (!found && link.startsWith('/')) {
            // Only report internal absolute links
            brokenLinks.push({ file, link });
        }
    }
});

// Generate Report
console.log('# Scan Report');

console.log('\n## 1. Unused Components');
const unusedComps = componentFiles.filter(f => usageCounts[f] === 0);
if (unusedComps.length === 0) console.log('None detected.');
unusedComps.forEach(f => {
    const rel = path.relative(SRC_DIR, f).replace(/\\/g, '/');
    // Exclude basic ui?
    // if (!rel.startsWith('components/ui')) 
    console.log(`- src/${rel}`);
});

console.log('\n## 2. Orphaned Routes (No internal links detected)');
// Note: Some routes are entry points (login, dashboard root), so they might not be linked internally.
const orphanedRoutes = routes.filter(r => routeUsageCounts[r] === 0);
orphanedRoutes.forEach(r => {
    // Whitelist known entry points
    const whiteList = ['/', '/login', '/signup', '/dashboard'];
    if (!whiteList.includes(r)) console.log(`- ${r}`);
});

console.log('\n## 3. Potential Broken Links');
const uniqueBroken = [...new Set(brokenLinks.map(b => b.link))]; // Dedupe links
uniqueBroken.forEach(link => {
    // Show files where it appears
    const sources = brokenLinks.filter(b => b.link === link).map(b => path.relative(SRC_DIR, b.file)).slice(0, 3);
    console.log(`- ${link} (in ${sources.join(', ')}...)`);
});

console.log('\n## 4. Scan Notes');
console.log('- "Unused Components" might be dynamically imported or passed as props.');
console.log('- "Orphaned Routes" might be accessed directly or are entry pages.');
console.log('- "Broken Links" might be valid routes handled by middleware or rewrites.');
