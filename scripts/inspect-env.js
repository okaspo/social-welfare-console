const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), 'temp_env_utf8.txt');

if (fs.existsSync(envPath)) {
    console.log(`Reading ${envPath} (${fs.statSync(envPath).size} bytes) as utf8`);
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, i) => {
        if (line.includes('postgres') || line.includes('DATABASE') || line.includes('DB_URL')) {
            console.log(`FOUND_LINE_${i + 1}: ${line}`);
        } else if (line.trim().length > 0 && !line.startsWith('#')) {
            const [key] = line.split('=');
            if (key) console.log(`KEY_FOUND: ${key}`);
        }
    });
} else {
    console.log('temp_env_utf8.txt not found');
}
