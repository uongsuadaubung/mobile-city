import type { FilterState } from './types';

export const BLACKLIST = [
    'apple watch',
    'đồng hồ',
    'tai nghe',
    'ốp lưng',
    'cáp sạc',
    'cường lực',
    'bao da',
    'dây đeo',
    'máy chơi game',
    'tay cầm'
];

export const BRANDS = [
    'iPhone', 'Samsung', 'Xiaomi', 'Realme', 'Oppo', 'Vivo', 'Nokia', 'Huawei',
    'Google', 'Sony', 'Asus', 'Nubia', 'Tecno', 'Infinix', 'Itel', 'Lenovo',
    'Honor', 'Redmi', 'ROG', 'ZTE', 'Meizu', 'POCO', 'Black Shark',
    'LeEco', 'LG', 'Sol Prime', 'Gionee', 'OnePlus', 'Motorola', 'Thành Hưng',
    'Vsmart', 'Bphone', 'Bkav', 'BlackBerry', 'Sharp', 'Kyocera', 'HTC',
    'Unihertz', 'Ulefone', 'Smartisan', 'Fairphone', 'Nothing', 'Sky'
];

export const DEFAULT_FILTERS: FilterState = {
    search: '',
    brandFilter: 'all',
    condition: 'all',
    ramFilter: 'all',
    storageFilter: 'all',
    cpuBrand: 'all',
    displayType: 'all',
    port: 'all',
    minBattery: 0,
    minBatteryDisplay: '',
    fastCharging: 'all',
    minPrice: '',
    maxPrice: '',
    sort: 'none',
    speaker: 'all',
    stockStatus: 'instock'
};
