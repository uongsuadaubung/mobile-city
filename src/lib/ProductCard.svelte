
<script lang="ts">
    
    import type { Product } from './types';
    type Props = {
            product: Product,
            onShowDetails: (p: Product) => void
        }
    let { product, onShowDetails }:Props = $props();

    function formatPrice(num: number, isContact = false) {
        if (isContact || num === 0) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    }

    function handleCardClick() {
        onShowDetails?.(product);
    }
</script>

<div 
    class="product-card" 
    onclick={handleCardClick}
    onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleCardClick();
        }
    }}
    tabindex="0"
    role="button"
    aria-label="Xem chi tiết {product.name}"
>
    {#if product.has_fast_charging}
        <div class="badge-fast">SẠC NHANH</div>
    {/if}
    {#if product.is_used}
        <div class="badge-used">MÁY CŨ</div>
    {/if}
    {#if product.in_stock === false}
        <div class="badge-outstock">HẾT HÀNG</div>
    {/if}
    
    <div class="product-image-container">
        <img src={product.image || 'https://via.placeholder.com/200x200?text=No+Image'} alt={product.name} class="product-image" loading="lazy">
    </div>
    
    <div class="product-info">
        <div class="product-name">{product.name}</div>
        <div class="product-price" class:contact={product.is_contact_price || product.price === 0}>
            {formatPrice(product.price, product.is_contact_price)}
        </div>
        <div class="product-specs">
            <div class="spec-item">RAM: {product.ram || 'N/A'}</div>
            <div class="spec-item">ROM: {product.storage || 'N/A'}</div>
            <div class="spec-item" style="grid-column: span 2">CPU: {product.cpu || 'N/A'}</div>
            <div class="spec-item" style="grid-column: span 2">Màn: {product.display || 'N/A'}</div>
            <div class="spec-item">Pin: {product.battery_cap ? product.battery_cap + 'mAh' : 'N/A'}</div>
            <div class="spec-item">Loa: {product.speaker || 'Mono'}</div>
        </div>
        <a href={product.link} target="_blank" class="btn-view" onclick={(e) => e.stopPropagation()}>Xem chi tiết</a>
    </div>
</div>

<style>
    .product-card {
        background: var(--card-bg);
        border-radius: 1.25rem;
        padding: 1.5rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        cursor: pointer;
        animation: zoomIn 0.5s ease-out;
        position: relative;
    }

    .product-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
        border-color: var(--primary);
    }

    .product-image-container {
        width: 100%;
        height: 220px;
        background: #1e293b;
        border-radius: 0.75rem;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        overflow: hidden;
    }

    .product-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transition: transform 0.5s ease;
    }

    .product-card:hover .product-image {
        transform: scale(1.1);
    }

    .badge-fast, .badge-used, .badge-outstock {
        position: absolute;
        top: 1rem;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.3rem 0.6rem;
        border-radius: 2rem;
        z-index: 10;
    }

    .badge-fast { right: 1rem; background: var(--success); box-shadow: 0 4px 10px rgba(34, 197, 94, 0.3); }
    .badge-used { left: 1rem; background: var(--danger); box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3); }
    .badge-outstock { left: 50%; transform: translateX(-50%); background: #475569; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); }

    .product-info {
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    .product-name {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--text);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 2.8rem;
    }

    .product-price {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary);
        margin-bottom: 1rem;
    }
    
    .product-price.contact {
        color: var(--text-muted);
    }

    .product-specs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
        margin-bottom: 1.5rem;
        font-size: 0.85rem;
        color: var(--text-muted);
    }

    .spec-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        background: rgba(255, 255, 255, 0.03);
        padding: 0.4rem 0.6rem;
        border-radius: 0.5rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .btn-view {
        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        color: white;
        text-align: center;
        padding: 0.75rem 2rem;
        border-radius: 0.75rem;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-top: auto;
        align-self: center;
    }

    .btn-view:hover { opacity: 0.9; transform: scale(1.05); }

    @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>
