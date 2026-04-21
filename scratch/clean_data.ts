import fs from 'fs';
import path from 'path';

const BLACKLIST = ['apple watch', 'đồng hồ', 'tai nghe', 'ốp lưng', 'cáp sạc', 'cường lực', 'bao da'];

const filePath = path.join(process.cwd(), 'public', 'products.json');

if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
}

try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const initialCount = data.length;

    const filtered = data.filter((p: any) => {
        const isBlacklisted = BLACKLIST.some(keyword => 
            p.name.toLowerCase().includes(keyword.toLowerCase())
        );
        return !isBlacklisted;
    });

    const removedCount = initialCount - filtered.length;

    fs.writeFileSync(filePath, JSON.stringify(filtered));
    
    console.log(`\n--- Data Cleaning Summary ---`);
    console.log(`Total products before: ${initialCount}`);
    console.log(`Products removed: ${removedCount}`);
    console.log(`Total products after: ${filtered.length}`);
    console.log(`✅ Saved clean data to ${filePath}`);
} catch (err: any) {
    console.error(`❌ Error: ${err.message}`);
}
