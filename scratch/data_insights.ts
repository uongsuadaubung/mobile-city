import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'public', 'products.json');

if (!fs.existsSync(filePath)) {
    console.error('❌ products.json not found!');
    process.exit(1);
}

const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const total = products.length;

console.log(`\n=========================================`);
console.log(`📊 MOBILECITY DATA INSIGHTS REPORT`);
console.log(`=========================================`);
console.log(`Total Products: ${total}`);

// 1. DATA COVERAGE
const coverage = {
    brand: 0,
    price: 0,
    specs: 0,
    ram: 0,
    storage: 0,
    cpu: 0,
    display: 0,
    battery: 0,
    port: 0,
    speaker: 0,
    in_stock: 0
};

products.forEach((p: any) => {
    if (p.brand && p.brand !== 'Khác') coverage.brand++;
    if (p.price > 0) coverage.price++;
    if (p.specs && Object.keys(p.specs).length > 0) coverage.specs++;
    if (p.ram_values && p.ram_values.length > 0) coverage.ram++;
    if (p.storage_values && p.storage_values.length > 0) coverage.storage++;
    if (p.cpu && p.cpu.length > 0) coverage.cpu++;
    if (p.display && p.display.length > 0) coverage.display++;
    if (p.battery_cap > 0) coverage.battery++;
    if (p.port && p.port !== 'Khác') coverage.port++;
    if (p.speaker && p.speaker !== 'N/A') coverage.speaker++;
    if (p.in_stock !== undefined) coverage.in_stock++;
});

console.log('\n📈 [1] Data Coverage (%):');
Object.entries(coverage).forEach(([key, count]) => {
    const percent = ((count / total) * 100).toFixed(1);
    console.log(`- ${key.padEnd(10)}: ${percent}% (${count}/${total})`);
});

// 2. RAW SPECS ANALYSIS (Discover new potential filters)
const specKeys = new Map<string, number>();
products.forEach((p: any) => {
    if (p.specs) {
        Object.keys(p.specs).forEach(k => {
            specKeys.set(k, (specKeys.get(k) || 0) + 1);
        });
    }
});

const sortedKeys = Array.from(specKeys.entries()).sort((a, b) => b[1] - a[1]);

console.log('\n🔍 [2] Raw Specs Keys Found (Potential for new filters):');
sortedKeys.slice(0, 20).forEach(([key, count]) => {
    console.log(`- ${key.padEnd(25)}: Found in ${count} products`);
});

// 3. CATEGORICAL ANALYSIS
function getTopValues(field: string, limit = 10) {
    const counts = new Map<string, number>();
    products.forEach((p: any) => {
        const val = p[field] || 'N/A';
        counts.set(val, (counts.get(val) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

console.log('\n🏢 [3] Top Brands:');
getTopValues('brand').forEach(([val, count]) => console.log(`- ${val.padEnd(15)}: ${count}`));

// 4. POTENTIAL DATA ISSUES
const issues = {
    zeroPrice: products.filter((p: any) => p.price === 0 && !p.is_contact_price).length,
    noImage: products.filter((p: any) => !p.image).length,
    noSpecs: products.filter((p: any) => !p.specs || Object.keys(p.specs).length === 0).length,
};

console.log('\n⚠️ [4] Potential Data Issues:');
console.log(`- Zero Price (not contact): ${issues.zeroPrice}`);
console.log(`- Missing Image         : ${issues.noImage}`);
console.log(`- Missing Detailed Specs: ${issues.noSpecs}`);

console.log(`\n=========================================`);
console.log(`💡 Recommendation: If 'Missing Detailed Specs' is high, run 'bun crawl.ts' again.`);
console.log(`=========================================`);
