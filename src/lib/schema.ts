import { z } from 'zod';

/**
 * Giai đoạn 1: Thông tin cơ bản từ trang danh sách (List Page)
 */
export const BaseProductSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    price: z.number(),
    image: z.url(),
    link: z.url(),
    brand: z.string(),
    in_stock: z.boolean(),
    is_used: z.boolean(),
    is_contact_price: z.boolean(),
});

/**
 * Giai đoạn 2: Thông số kỹ thuật chi tiết từ trang sản phẩm (Specs Page)
 */
export const ProductSpecsSchema = z.object({
    // Các thông số kỹ thuật chính (Bắt buộc theo yêu cầu)
    ram: z.string(),
    storage: z.string(),
    ram_values: z.array(z.number()),
    storage_values: z.array(z.number()),
    
    // Các thông số có thể có hoặc không tùy đời máy
    cpu: z.string(),
    display: z.string(),
    battery_cap: z.number(),
    port: z.string(),
    speaker: z.string(),
    has_fast_charging: z.boolean(),
    
    // Toàn bộ bảng specs thô
    specs: z.record(z.string(), z.string()).optional()
});

/**
 * Sản phẩm hoàn chỉnh sau khi gộp cả 2 đợt crawl
 */
export const ProductSchema = BaseProductSchema.extend(ProductSpecsSchema.shape);

export const ProductListSchema = z.array(ProductSchema);

export type BaseProduct = z.infer<typeof BaseProductSchema>;
export type ProductSpecs = z.infer<typeof ProductSpecsSchema>;
export type Product = z.infer<typeof ProductSchema>;

export const FilterStateSchema = z.object({
    search: z.string(),
    brandFilter: z.string(),
    condition: z.string(),
    ramFilter: z.string(),
    storageFilter: z.string(),
    cpuBrand: z.string(),
    displayType: z.string(),
    port: z.string(),
    minBattery: z.number(),
    minBatteryDisplay: z.string(),
    fastCharging: z.string(),
    minPrice: z.string(),
    maxPrice: z.string(),
    sort: z.string(),
    speaker: z.string(),
    stockStatus: z.string()
});

export type FilterState = z.infer<typeof FilterStateSchema>;
