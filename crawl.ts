import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import crypto from 'crypto';
import { BLACKLIST, BRANDS } from './src/lib/constants';
import type { Product, Specs } from './src/lib/types';
import { BaseProductSchema, ProductSpecsSchema, ProductSchema } from './src/lib/schema';
import type { BaseProduct, ProductSpecs } from './src/lib/schema';

const CONFIG = {
    BASE_URL: 'https://mobilecity.vn',
    START_URL: 'https://mobilecity.vn/dien-thoai',
    OUTPUT_DIR: './public',
    OUTPUT_FILE: 'products.json',
    BATCH_SIZE: 10,
    BATCH_DELAY: 500,
    PAGE_DELAY: 500,
    ITEMS_PER_PAGE: 50,
    TIMEOUT: 15000,
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    BLACKLIST
};

function generateId(name: string, link: string): string {
    return crypto.createHash('md5').update(`${name}|${link}`).digest('hex');
}

const session = axios.create({
    headers: {
        'User-Agent': CONFIG.USER_AGENT,
    },
    timeout: CONFIG.TIMEOUT
});

export async function runCrawl() {
    console.log('\n--- STARTING OPTIMIZED CRAWL PROCESS (TS) ---');
    try {
        // Step 0: Load existing data to skip redundant spec fetching
        let existingProductsMap = new Map<string, Product>();
        const fullOutputPath = `${CONFIG.OUTPUT_DIR}/${CONFIG.OUTPUT_FILE}`;
        if (fs.existsSync(fullOutputPath)) {
            try {
                const existingData: Product[] = JSON.parse(fs.readFileSync(fullOutputPath, 'utf8'));
                existingData.forEach(p => {
                    const key = p.id || generateId(p.name, p.link);
                    existingProductsMap.set(key, p);
                });
                console.log(`Step 0: Loaded ${existingProductsMap.size} existing products for reference.`);
            } catch (e) {
                console.log('Step 0: No valid existing data found, starting fresh.');
            }
        }

        // 1. GET INITIAL LIST
        const products = await getProductList();
        console.log(`Step 1 Complete: Found ${products.length} products.`);

        // 2. GET DETAILED SPECS & VALIDATE STAGES
        const validatedProducts = await getDetailedSpecs(products, existingProductsMap);
        console.log(`Step 2 & 3 Complete: Validated ${validatedProducts.length} full products.`);

        // 3. SAVE FINAL DATA
        const outputDir = CONFIG.OUTPUT_DIR;
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(`${outputDir}/${CONFIG.OUTPUT_FILE}`, JSON.stringify(validatedProducts));

        console.log(`\n✅ CRAWL FINISHED: Saved ${validatedProducts.length} valid products to ${outputDir}/${CONFIG.OUTPUT_FILE}`);
        console.log('--- CRAWL PROCESS FINISHED SUCCESSFULLY ---');
    } catch (err) {
        console.error('Crawl failed:', err);
    }
}

async function getProductList(): Promise<BaseProduct[]> {
    console.log('Step 1: Fetching initial session and tokens...');
    const firstPage = await session.get(CONFIG.START_URL);
    const $ = cheerio.load(firstPage.data);
    const csrfToken = $('meta[name="csrf-token"]').attr('content');
    const cookies = firstPage.headers['set-cookie'];

    const products: BaseProduct[] = [];
    const uniqueIds = new Set<string>();

    function extractFromHtml(html: string) {
        const _$ = cheerio.load(html);
        const items = _$('.product-list-item, .product-list > div').filter((i, el) => {
            return _$(el).find('.product-item-info').length > 0;
        });

        items.each((i, el) => {
            const nameEl = _$(el).find('.name a');
            const priceEl = _$(el).find('.price');
            const imgEl = _$(el).find('img.lazy');

            if (nameEl.length && priceEl.length) {
                const name = nameEl.text().trim();
                const isBlacklisted = CONFIG.BLACKLIST.some(keyword => 
                    name.toLowerCase().includes(keyword.toLowerCase())
                );
                if (isBlacklisted) return;
                
                const link = nameEl.attr('href');
                const priceStr = priceEl.text().trim();
                const price = parseInt(priceStr.replace(/\D/g, '')) || 0;
                const isContactPrice = priceStr.toLowerCase().includes('liên hệ') || (price === 0 && priceStr !== '');

                let image = imgEl.attr('data-original') || imgEl.attr('src');
                if (image && !image.startsWith('http')) image = CONFIG.BASE_URL + image;

                const productLink = link && link.startsWith('http') ? link : (link ? CONFIG.BASE_URL + link : '');
                const id = generateId(name, productLink);
                const brand = getBrandFromName(name);

                if (!uniqueIds.has(id)) {
                    const rawBase = { 
                        id,
                        brand,
                        name, 
                        price, 
                        link: productLink,
                        image: image || '',
                        is_contact_price: isContactPrice,
                        in_stock: true,
                        is_used: name.toLowerCase().includes('cũ')
                    };

                    const result = BaseProductSchema.safeParse(rawBase);
                    if (result.success) {
                        uniqueIds.add(id);
                        products.push(result.data);
                    } else {
                        console.warn(`  [Step 1 Failed] ${name}:`, result.error.format());
                    }
                }
            }
        });
    }

    console.log('Step 1.1: Fetching product list via API...');
    let page = 1;
    let hasMore = true;
    while (hasMore) {
        console.log(`  Fetching API page ${page}...`);
        try {
            const response = await session.post(`${CONFIG.BASE_URL}/product_view_more`,
                `count=${CONFIG.ITEMS_PER_PAGE}&slug=dien-thoai&page=${page}&type_category=phone_categories&get_order=`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRF-TOKEN': csrfToken || '',
                        'Referer': CONFIG.START_URL,
                        'Cookie': cookies ? cookies.join('; ') : '',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                }
            );

            let htmlData = '';
            if (typeof response.data === 'string') htmlData = response.data;
            else if (response.data && typeof response.data === 'object') htmlData = Object.values(response.data).join('');

            if (htmlData.trim().length > 10) {
                const prevCount = products.length;
                extractFromHtml(htmlData);
                if (products.length === prevCount) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }
        } catch (err: unknown) {
            const error = err as Error;
            console.error(`  Error on page ${page}: ${error.message}`);
            hasMore = false;
        }
        await new Promise(r => setTimeout(r, CONFIG.PAGE_DELAY));
    }

    return products;
}

async function getDetailedSpecs(products: BaseProduct[], existingMap: Map<string, Product>): Promise<Product[]> {
    console.log('Step 2: Fetching detailed specs and normalizing...');
    
    const validatedProducts: Product[] = [];
    const productsToFetch: BaseProduct[] = [];
    const skippedCount = { val: 0 };

    products.forEach(p => {
        const existing = existingMap.get(p.id);
        if (existing && existing.ram && existing.storage) {
            validatedProducts.push(existing);
            skippedCount.val++;
        } else {
            productsToFetch.push(p);
        }
    });

    console.log(`  Skipping ${skippedCount.val} products that already have detailed specs.`);
    console.log(`  Fetching specs for ${productsToFetch.length} new/incomplete products...`);

    const batchSize = CONFIG.BATCH_SIZE;
    for (let i = 0; i < productsToFetch.length; i += batchSize) {
        const batch = productsToFetch.slice(i, i + batchSize);
        console.log(`  Processing specs batch ${Math.floor(i / batchSize) + 1} (${i} to ${i + batch.length})...`);

        await Promise.all(batch.map(async (product) => {
            try {
                const response = await session.get(product.link);
                const $ = cheerio.load(response.data);
                
                const specsTable: Specs = {};
                $('table tr').each((_, tr) => {
                    const tds = $(tr).find('td');
                    if (tds.length >= 2) {
                        const key = $(tds[0]).text().replace(':', '').trim();
                        const value = $(tds[1]).text().trim();
                        if (key && value) specsTable[key] = value;
                    }
                });

                // NORMALIZE RAM
                const rawRam = specsTable['RAM'] || '';
                const ramValues = new Set<number>();
                const ramMatches = rawRam.matchAll(/(\d+)(?:\s*-\s*(\d+))?\s*GB/gi);
                for (const match of ramMatches) {
                    ramValues.add(parseInt(match[1]!));
                    if (match[2]) ramValues.add(parseInt(match[2]!));
                }
                const slashRamMatches = rawRam.matchAll(/(\d+)\/(\d+)\s*GB/gi);
                for (const match of slashRamMatches) {
                    ramValues.add(parseInt(match[1]!));
                    ramValues.add(parseInt(match[2]!));
                }

                // NORMALIZE STORAGE
                const rawStorage = specsTable['Bộ nhớ trong'] || '';
                const storageValues = new Set<number>();
                const storageMatches = rawStorage.matchAll(/(\d+)(?:\s*-\s*(\d+))?\s*(GB|TB)/gi);
                for (const match of storageMatches) {
                    let val = parseInt(match[1]!);
                    if (match[3]?.toUpperCase() === 'TB') val *= 1024;
                    storageValues.add(val);
                    if (match[2]) {
                        let val2 = parseInt(match[2]!);
                        if (match[3]?.toUpperCase() === 'TB') val2 *= 1024;
                        storageValues.add(val2);
                    }
                }

                // EXTRACT STOCK STATUS
                const statusText = $('.status-box, .status-instock, .status-outstock').text().trim().toLowerCase();
                const inStock = statusText.includes('còn hàng');

                // EXTRACT BATTERY
                const batteryStr = specsTable['Dung lượng pin'] || '';
                const batteryMatch = batteryStr.match(/(\d+(?:\.\d+)?)/);
                const batteryCap = batteryMatch ? parseInt(batteryMatch[1]!.replace('.', '')) : undefined;

                // EXTRACT PORT
                const portStr = (specsTable['Cổng kết nối'] || specsTable['Cổng sạc'] || '').toLowerCase();
                let port: string | undefined;
                if (portStr.includes('type-c') || portStr.includes('usb-c')) port = 'USB Type-C';
                else if (portStr.includes('lightning')) port = 'Lightning';
                else if (portStr.includes('micro')) port = 'Micro USB';

                // EXTRACT SPEAKER
                const speakerStr = (specsTable['Hệ thống loa'] || '').toLowerCase();
                let speaker: string | undefined;
                if (speakerStr.includes('stereo') || speakerStr.includes('kép') || speakerStr.includes('2 loa')) {
                    speaker = 'Stereo';
                } else if (speakerStr.includes('đơn') || speakerStr.includes('mono')) {
                    speaker = 'Mono';
                } else if (speakerStr) {
                    speaker = 'N/A';
                }

                // TỔNG HỢP PRODUCT SPECS (STEP 2)
                const specsData: ProductSpecs = {
                    ram: rawRam,
                    storage: rawStorage,
                    ram_values: Array.from(ramValues),
                    storage_values: Array.from(storageValues),
                    cpu: specsTable['Chipset (CPU)'] || specsTable['CPU'] || 'N/A',
                    display: specsTable['Công nghệ màn hình'] || specsTable['Màn hình'] || 'N/A',
                    battery_cap: batteryCap || 0,
                    port: port || 'N/A',
                    speaker: speaker || 'N/A',
                    has_fast_charging: (specsTable['Sạc nhanh'] || '').toLowerCase().includes('có') || (specsTable['Sạc nhanh'] || '').toLowerCase().includes('w'),
                    specs: specsTable
                };

                const specsResult = ProductSpecsSchema.safeParse(specsData);
                if (specsResult.success) {
                    // TẠO PRODUCT HOÀN CHỈNH (STEP 3)
                    const finalProduct: Product = { 
                        ...product, 
                        ...specsResult.data,
                        in_stock: inStock
                    };
                    
                    const finalResult = ProductSchema.safeParse(finalProduct);
                    if (finalResult.success) {
                        validatedProducts.push(finalResult.data);
                    } else {
                        console.warn(`  [Step 3 Failed] ${product.name}:`, finalResult.error.format());
                    }
                } else {
                    console.warn(`  [Step 2 Failed] ${product.name}:`, specsResult.error.format());
                }

            } catch (err: unknown) {
                const error = err as Error;
                console.error(`  Failed specs for ${product.name}: ${error.message}`);
            }
        }));

        await new Promise(r => setTimeout(r, CONFIG.BATCH_DELAY));
    }
    return validatedProducts;
}

// Execute the crawl
runCrawl().catch(console.error);

function getBrandFromName(name: string): string {
    const nameLower = name.toLowerCase();
    for (const b of BRANDS) {
        if (nameLower.includes(b.toLowerCase())) return b;
    }
    return 'Khác';
}
