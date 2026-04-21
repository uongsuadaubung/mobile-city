<script lang="ts">
    import { onMount } from 'svelte';
    import ProductCard from './lib/ProductCard.svelte';
    import ProductModal from './lib/ProductModal.svelte';
    import SearchableSelect from './lib/SearchableSelect.svelte';
    import type { Product, FilterState } from './lib/types';
    import { DEFAULT_FILTERS } from './lib/constants';

    const BASE_URL = import.meta.env.BASE_URL;
    // Derived data is now all dynamic via $derived.by
    let allProducts = $state<Product[]>([]);
    let loading = $state(true);
    let selectedProduct = $state<Product | null>(null);
    let filters = $state<FilterState>({ ...DEFAULT_FILTERS });

    onMount(async () => {
        try {
            // Load saved filters
            const saved = localStorage.getItem('mobilecity_svelte_filters');
            if (saved) {
                const f = JSON.parse(saved);
                Object.keys(DEFAULT_FILTERS).forEach(key => {
                    if (f[key] !== undefined) (filters as any)[key] = f[key];
                });
            }

            const response = await fetch(`${BASE_URL}products.json`);
            const rawData = await response.json();

            // Validate with Zod
            const { ProductListSchema } = await import('./lib/schema');
            const result = ProductListSchema.safeParse(rawData);
            
            if (result.success) {
                allProducts = result.data;
            } else {
                console.error('Data validation failed:', result.error.format());
                allProducts = rawData as Product[]; // Fallback with warning
            }
        } catch (e) {
            console.error('Failed to load data', e);
        } finally {
            loading = false;
        }
    });

    function parsePrice(val: string | number) {
        return parseInt(val.toString().replace(/\D/g, "")) || 0;
    }

    function formatPrice(num: number, isContact = false) {
        if (isContact || num === 0) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    }

    function formatBatteryInput(e: Event) {
        const input = e.target as HTMLInputElement;
        const val = input.value.replace(/\D/g, '');
        filters.minBattery = val ? parseInt(val) : 0;
        filters.minBatteryDisplay = val ? parseInt(val).toLocaleString('vi-VN') : '';
    }

    function formatNumberInput(e: Event) {
        const input = e.target as HTMLInputElement;
        const val = input.value.replace(/\D/g, '');
        if (input.id === 'min-price') filters.minPrice = val ? parseInt(val).toLocaleString('vi-VN') : '';
        if (input.id === 'max-price') filters.maxPrice = val ? parseInt(val).toLocaleString('vi-VN') : '';
    }

    function clearFilters() {
        filters = { ...DEFAULT_FILTERS };
    }

    function exportJson() {
        const dataStr = JSON.stringify(filteredProducts);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mobilecity_export_${new Date().getTime()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Faceted Filter Matchers
    const matchSearch = (p: Product) => !filters.search || p.name.toLowerCase().includes(filters.search.toLowerCase());
    const matchBrand = (p: Product) => filters.brandFilter === 'all' || p.brand === filters.brandFilter;
    const matchCondition = (p: Product) => filters.condition === 'all' || (filters.condition === 'used' ? p.is_used : !p.is_used);
    const matchRam = (p: Product) => {
        if (filters.ramFilter === 'all') return true;
        const target = parseInt(filters.ramFilter);
        return p.ram_values?.includes(target);
    };
    const matchStorage = (p: Product) => {
        if (filters.storageFilter === 'all') return true;
        const target = parseInt(filters.storageFilter);
        return p.storage_values?.includes(target);
    };
    const matchCpu = (p: Product) => filters.cpuBrand === 'all' || (p.cpu && p.cpu.toLowerCase().includes(filters.cpuBrand.toLowerCase()));
    const matchDisplay = (p: Product) => filters.displayType === 'all' || (p.display && p.display.toLowerCase().includes(filters.displayType.toLowerCase()));
    const matchPort = (p: Product) => filters.port === 'all' || p.port === filters.port;
    const matchBattery = (p: Product) => !filters.minBattery || (p.battery_cap || 0) >= filters.minBattery;
    const matchFast = (p: Product) => filters.fastCharging === 'all' || (filters.fastCharging === 'yes' ? p.has_fast_charging : !p.has_fast_charging);
    const matchSpeaker = (p: Product) => filters.speaker === 'all' || p.speaker === filters.speaker;
    const matchPrice = (p: Product) => {
        const min = parsePrice(filters.minPrice);
        const max = parsePrice(filters.maxPrice);
        if (min && (p.price || 0) < min) return false;
        if (max && (p.price || 0) > max) return false;
        return true;
    };
    const matchStock = (p: Product) => filters.stockStatus === 'all' || (filters.stockStatus === 'instock' ? p.in_stock !== false : p.in_stock === false);

    // Final filtered products
    let filteredProducts = $derived.by(() => {
        let filtered = allProducts.filter(p => 
            matchSearch(p) && matchBrand(p) && matchCondition(p) && matchRam(p) && 
            matchStorage(p) && matchCpu(p) && matchDisplay(p) && matchPort(p) && 
            matchBattery(p) && matchFast(p) && matchSpeaker(p) && matchPrice(p) && matchStock(p)
        );

        if (filters.sort === 'price-asc') filtered.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        else if (filters.sort === 'price-desc') filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        else if (filters.sort === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
        
        return filtered;
    });

    // Smart Faceted Options
    const getAvailable = (exclude: string) => {
        return allProducts.filter(p => {
            if (exclude !== 'search' && !matchSearch(p)) return false;
            if (exclude !== 'brand' && !matchBrand(p)) return false;
            if (exclude !== 'condition' && !matchCondition(p)) return false;
            if (exclude !== 'ram' && !matchRam(p)) return false;
            if (exclude !== 'storage' && !matchStorage(p)) return false;
            if (exclude !== 'cpu' && !matchCpu(p)) return false;
            if (exclude !== 'display' && !matchDisplay(p)) return false;
            if (exclude !== 'port' && !matchPort(p)) return false;
            if (exclude !== 'battery' && !matchBattery(p)) return false;
            if (exclude !== 'fast' && !matchFast(p)) return false;
            if (exclude !== 'speaker' && !matchSpeaker(p)) return false;
            if (exclude !== 'price' && !matchPrice(p)) return false;
            if (exclude !== 'stock' && !matchStock(p)) return false;
            return true;
        });
    };

    let availableBrands = $derived.by(() => {
        const brands = new Set<string>();
        getAvailable('brand').forEach(p => p.brand && brands.add(p.brand));
        return Array.from(brands).sort();
    });

    let availableRams = $derived.by(() => {
        const rams = new Set<number>();
        getAvailable('ram').forEach(p => p.ram_values?.forEach(v => rams.add(v)));
        return Array.from(rams).sort((a, b) => a - b);
    });

    let availableStorages = $derived.by(() => {
        const storages = new Set<number>();
        getAvailable('storage').forEach(p => p.storage_values?.forEach(v => storages.add(v)));
        return Array.from(storages).sort((a, b) => a - b);
    });

    let availableCpus = $derived.by(() => {
        const options = ['Snapdragon', 'Apple', 'MediaTek', 'Dimensity', 'Exynos', 'Helio', 'Kirin', 'Unisoc', 'Google Tensor'];
        const available = getAvailable('cpu');
        return options.filter(opt => available.some(p => p.cpu && p.cpu.toLowerCase().includes(opt.toLowerCase())));
    });

    let availableDisplays = $derived.by(() => {
        const options = ['AMOLED', 'OLED', 'IPS', 'LCD', 'Retina', 'TFT', 'PLS', 'P-OLED'];
        const available = getAvailable('display');
        return options.filter(opt => available.some(p => p.display && p.display.toLowerCase().includes(opt.toLowerCase())));
    });

    let availablePorts = $derived.by(() => {
        const ports = new Set<string>();
        getAvailable('port').forEach(p => p.port && ports.add(p.port));
        return Array.from(ports).sort();
    });

    let availableSpeakers = $derived.by(() => {
        const speakers = new Set<string>();
        getAvailable('speaker').forEach(p => p.speaker && speakers.add(p.speaker));
        return Array.from(speakers).sort();
    });

    // Save filters on change
    $effect(() => {
        if (!loading) {
            localStorage.setItem('mobilecity_svelte_filters', JSON.stringify(filters));
        }
    });

    // Disable body scroll when modal is open
    $effect(() => {
        if (typeof document !== 'undefined') {
            document.body.style.overflow = selectedProduct ? 'hidden' : '';
        }
    });
</script>

<div class="container">
    <header>
        <h1>MobileCity Pro Filter</h1>
        <p class="subtitle">Hệ thống lọc thông minh xây dựng bằng Svelte</p>
    </header>

    <div class="controls">
        <div class="control-group">
            <label for="search">Tên máy</label>
            <input id="search" type="text" bind:value={filters.search} placeholder="iPhone, Samsung...">
        </div>
        <div class="control-group">
            <SearchableSelect 
                label="Hãng sản xuất"
                options={availableBrands}
                value={filters.brandFilter}
                allLabel="Tất cả hãng"
                onChange={(val) => filters.brandFilter = val}
            />
        </div>
        <div class="control-group">
            <SearchableSelect 
                label="Tình trạng"
                options={['Máy mới', 'Máy cũ']}
                value={filters.condition === 'all' ? 'all' : (filters.condition === 'used' ? 'Máy cũ' : 'Máy mới')}
                allLabel="Tất cả"
                showSearch={false}
                onChange={(val) => {
                    if (val === 'all') filters.condition = 'all';
                    else filters.condition = val === 'Máy cũ' ? 'used' : 'new';
                }}
            />
        </div>
        <div class="control-group">
            <SearchableSelect 
                label="RAM"
                options={availableRams.map(r => `${r} GB`)}
                value={filters.ramFilter === 'all' ? 'all' : `${filters.ramFilter} GB`}
                allLabel="Tất cả RAM"
                onChange={(val) => filters.ramFilter = val === 'all' ? 'all' : val.split(' ')[0]}
            />
        </div>
        <div class="control-group">
            <SearchableSelect 
                label="Bộ nhớ trong"
                options={availableStorages.map(s => s >= 1024 ? `${s/1024} TB` : `${s} GB`)}
                value={filters.storageFilter === 'all' ? 'all' : (parseInt(filters.storageFilter) >= 1024 ? `${parseInt(filters.storageFilter)/1024} TB` : `${filters.storageFilter} GB`)}
                allLabel="Tất cả bộ nhớ"
                onChange={(val) => {
                    if (val === 'all') {
                        filters.storageFilter = 'all';
                    } else {
                        const num = parseInt(val);
                        const unit = val.includes('TB') ? 1024 : 1;
                        filters.storageFilter = (num * unit).toString();
                    }
                }}
            />
        </div>
        <div class="control-group">
            <SearchableSelect 
                label="Dòng Chip"
                options={availableCpus}
                value={filters.cpuBrand}
                allLabel="Tất cả chip"
                onChange={(val) => filters.cpuBrand = val}
            />
        </div>
        <div class="control-group">
            <SearchableSelect 
                label="Màn hình"
                options={availableDisplays}
                value={filters.displayType}
                allLabel="Tất cả màn hình"
                onChange={(val) => filters.displayType = val}
            />
        </div>
        <div class="control-group">
            <SearchableSelect 
                label="Cổng sạc"
                options={availablePorts}
                value={filters.port}
                allLabel="Tất cả cổng"
                onChange={(val) => filters.port = val}
            />
        </div>
        <div class="control-group">
            <label for="battery">Pin tối thiểu (mAh)</label>
            <input id="battery" type="text" bind:value={filters.minBatteryDisplay} oninput={formatBatteryInput} placeholder="4.500">
        </div>
        <div class="control-group">
            <SearchableSelect 
                label="Sạc nhanh"
                options={['Có sạc nhanh', 'Sạc thường']}
                value={filters.fastCharging === 'all' ? 'all' : (filters.fastCharging === 'yes' ? 'Có sạc nhanh' : 'Sạc thường')}
                allLabel="Tất cả"
                showSearch={false}
                onChange={(val) => {
                    if (val === 'all') filters.fastCharging = 'all';
                    else filters.fastCharging = val === 'Có sạc nhanh' ? 'yes' : 'no';
                }}
            />
        </div>
        <div class="control-group">
            <label for="min-price">Giá từ</label>
            <input id="min-price" type="text" bind:value={filters.minPrice} oninput={formatNumberInput} placeholder="0">
        </div>
        <div class="control-group">
            <label for="max-price">Giá đến</label>
            <input id="max-price" type="text" bind:value={filters.maxPrice} oninput={formatNumberInput} placeholder="99.000.000">
        </div>
        <div class="control-group">
            <SearchableSelect 
                label="Hệ thống loa"
                options={availableSpeakers}
                value={filters.speaker}
                allLabel="Tất cả loa"
                onChange={(val) => filters.speaker = val}
            />
        </div>
        <div class="control-group">
            <SearchableSelect 
                label="Hàng trong kho"
                options={['Còn hàng', 'Hết hàng']}
                value={filters.stockStatus === 'all' ? 'all' : (filters.stockStatus === 'instock' ? 'Còn hàng' : 'Hết hàng')}
                allLabel="Tất cả"
                showSearch={false}
                onChange={(val) => {
                    if (val === 'all') filters.stockStatus = 'all';
                    else filters.stockStatus = val === 'Còn hàng' ? 'instock' : 'outstock';
                }}
            />
        </div>
    </div>

    <div class="stats">
        <span>{loading ? 'Đang tải dữ liệu...' : `Tìm thấy ${filteredProducts.length} sản phẩm`}</span>
        <div style="display: flex; gap: 1rem; align-items: center;">
            <SearchableSelect 
                label=""
                options={['Sắp xếp: Giá tăng', 'Sắp xếp: Giá giảm', 'Sắp xếp: Tên A-Z']}
                value={filters.sort === 'none' ? 'all' : (filters.sort === 'price-asc' ? 'Sắp xếp: Giá tăng' : (filters.sort === 'price-desc' ? 'Sắp xếp: Giá giảm' : 'Sắp xếp: Tên A-Z'))}
                allLabel="Sắp xếp: Mặc định"
                showSearch={false}
                onChange={(val) => {
                    if (val === 'all') filters.sort = 'none';
                    else if (val === 'Sắp xếp: Giá tăng') filters.sort = 'price-asc';
                    else if (val === 'Sắp xếp: Giá giảm') filters.sort = 'price-desc';
                    else filters.sort = 'name-asc';
                }}
            />
            <button class="btn-export" onclick={exportJson}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Xuất JSON
            </button>
            <button class="btn-reset" onclick={clearFilters}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                Xóa lọc
            </button>
        </div>
    </div>

    <div class="product-grid">
        {#each filteredProducts as product (product.id)}
            <ProductCard {product} onShowDetails={(p) => selectedProduct = p} />
        {:else}
            {#if !loading}
                <div style="grid-column: 1/-1; text-align: center; padding: 5rem; color: var(--text-muted)">
                    Không tìm thấy sản phẩm nào khớp với bộ lọc.
                </div>
            {/if}
        {/each}
    </div>

    <ProductModal 
        product={selectedProduct} 
        onClose={() => selectedProduct = null} 
    />
</div>


<style>
    header {
        text-align: center;
        margin-bottom: 3rem;
        animation: fadeInDown 0.8s ease-out;
    }

    h1 {
        font-size: 3rem;
        font-weight: 700;
        background: linear-gradient(to right, var(--primary), var(--accent));
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }

    .subtitle {
        color: var(--text-muted);
        font-size: 1.1rem;
    }

    .controls {
        background: var(--card-bg);
        padding: 2rem;
        border-radius: 1.5rem;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1.2rem;
        margin-bottom: 3rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        animation: fadeInUp 0.8s ease-out;
        position: relative;
        z-index: 100;
    }

    .control-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    label {
        font-weight: 600;
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .controls input {
        padding: 0.75rem 1rem;
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-size: 0.95rem;
        outline: none;
        transition: all 0.2s;
        backdrop-filter: blur(10px);
        width: 100%;
    }

    .controls input:hover, .controls input:focus {
        background: rgba(30, 41, 59, 0.8);
        border-color: var(--primary);
        box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
    }

    .stats {
        margin-bottom: 1.5rem;
        font-size: 1rem;
        color: var(--text-muted);
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 0.5rem;
        position: relative;
        z-index: 50; /* Đủ cao để đè lên badge của product card */
    }

    .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 2rem;
    }

    .btn-reset {
        background: rgba(239, 68, 68, 0.1);
        color: var(--danger);
        border: 1px solid rgba(239, 68, 68, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 0.75rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .btn-reset:hover {
        background: var(--danger);
        color: white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .btn-export {
        background: rgba(34, 197, 94, 0.1);
        color: var(--success);
        border: 1px solid rgba(34, 197, 94, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 0.75rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .btn-export:hover {
        background: var(--success);
        color: white;
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }

</style>
