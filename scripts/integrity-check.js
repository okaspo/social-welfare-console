const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'src/app';

function getAllRoutes(dir, routeList = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            getAllRoutes(fullPath, routeList);
        } else if (file === 'page.tsx') {
            const route = fullPath
                .replace('src\\app', '')
                .replace('src/app', '')
                .replace('\\page.tsx', '')
                .replace('/page.tsx', '')
                .replace(/\\/g, '/');
            routeList.push(route || '/');
        }
    }
    return routeList;
}

const routes = getAllRoutes(ROOT_DIR);
console.log('✅ Found Routes:', routes.length);
console.log(routes.join('\n'));

// Check for missing critical pages
const CRITICAL_PAGES = [
    '/dashboard',
    '/dashboard/chat',
    '/dashboard/meetings',
    '/dashboard/officers',
    '/dashboard/documents',
    '/dashboard/articles',
    '/dashboard/organization',
    '/dashboard/settings',
    '/admin',
    '/admin/plans',
    '/admin/revenue',
    '/login'
];

const missing = CRITICAL_PAGES.filter(p => !routes.includes(p));

if (missing.length > 0) {
    console.error('\n❌ Missing Critical Pages:');
    console.error(missing.join('\n'));
} else {
    console.log('\n✅ All Critical Pages Exist!');
}

console.log('\n✅ Integrity Check Complete.');
