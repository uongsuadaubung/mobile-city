import fs from 'fs';
import path from 'path';

import { BLACKLIST, BRANDS } from '../src/lib/constants';

function getBrand(name: string): string {
    const nameLower = name.toLowerCase();
    for (const b of BRANDS) {
        if (nameLower.includes(b.toLowerCase())) return b;
    }
    return 'Khác';
}

const filePath = path.join(process.cwd(), 'public', 'products.json');

if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
}

try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const products = JSON.parse(rawData);
    const initialCount = products.length;

    console.log(`📖 Processing ${initialCount} products...`);

    const processed = products
        .filter((p: any) => {
            const isBlacklisted = BLACKLIST.some(keyword => 
                p.name.toLowerCase().includes(keyword.toLowerCase())
            );
            return !isBlacklisted;
        })
        .map((p: any) => {
            return {
                ...p,
                brand: getBrand(p.name)
            };
        });

    fs.writeFileSync(filePath, JSON.stringify(processed));
    
    console.log(`\n--- Normalization Summary ---`);
    console.log(`Initial items: ${initialCount}`);
    console.log(`Items removed (Blacklist): ${initialCount - processed.length}`);
    console.log(`Final items: ${processed.length}`);
    console.log(`✅ Data standardized and saved to ${filePath}`);

} catch (err: any) {
    console.error(`❌ Error during normalization: ${err.message}`);
}
