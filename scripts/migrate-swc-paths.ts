
import fs from 'fs';
import path from 'path';

const targetDir = path.resolve(process.cwd(), 'src/app/swc/dashboard');

function walk(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walk(filePath, fileList);
        } else {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const files = walk(targetDir);

files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Replace href="/dashboard..." with href="/swc/dashboard..."
    content = content.replace(/href="\/dashboard/g, 'href="/swc/dashboard');

    // Replace redirect('/dashboard') with redirect('/swc/dashboard')
    content = content.replace(/redirect\('\/dashboard'/g, "redirect('/swc/dashboard'");
    content = content.replace(/redirect\("\/dashboard"/g, 'redirect("/swc/dashboard"');

    // Replace revalidatePath('/dashboard...') with revalidatePath('/swc/dashboard...')
    content = content.replace(/revalidatePath\('\/dashboard/g, "revalidatePath('/swc/dashboard");
    content = content.replace(/revalidatePath\(`\/dashboard/g, "revalidatePath(`/swc/dashboard");

    // Fix specific edge case: redirect('/dashboard/organization')
    // handled by general redirect replacer

    // Check imports - we DON'T want to replace @/components/dashboard
    // But if there are any other string literals?

    if (content !== originalContent) {
        console.log(`Updating ${file}...`);
        fs.writeFileSync(file, content, 'utf8');
    }
});
