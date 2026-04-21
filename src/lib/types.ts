import { ProductSchema, FilterStateSchema } from './schema';
import type { z } from 'zod';

export type Product = z.infer<typeof ProductSchema>;
export type FilterState = z.infer<typeof FilterStateSchema>;

export interface Specs {
    [key: string]: string;
}
