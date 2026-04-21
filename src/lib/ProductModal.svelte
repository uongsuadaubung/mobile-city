<script lang="ts">
    import type { Product } from './types';
    import { onMount } from 'svelte';

    let { product, onClose } = $props<{
        product: Product | null,
        onClose: () => void
    }>();

    function formatPrice(num: number, isContact = false) {
        if (isContact || num === 0) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    }

    // Effect to handle Escape key
    $effect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && product) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });
</script>

{#if product}
    <div 
        class="modal-overlay" 
        onclick={onClose}
        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onClose()}
        role="button"
        tabindex="0"
        aria-label="Close modal"
    >
        <div 
            class="modal-content" 
            onclick={(e) => e.stopPropagation()} 
            onkeydown={(e) => e.stopPropagation()}
            role="none"
        >
            <button class="modal-close" onclick={onClose}>&times;</button>
            <div class="modal-scroll-area">
                <div class="modal-header">
                    <img src={product.image || 'https://via.placeholder.com/200x200?text=No+Image'} alt={product.name} class="modal-image">
                    <div class="modal-title-info">
                        <h2>{product.name}</h2>
                        <p class="modal-price" class:contact={product.is_contact_price || product.price === 0}>
                            {formatPrice(product.price, product.is_contact_price)}
                        </p>
                        <a href={product.link} target="_blank" class="modal-btn-buy">
                            Xem trên Website
                        </a>
                    </div>
                </div>

                <div class="modal-body">
                    <h3>Thông số kỹ thuật</h3>
                    <div class="specs-grid">
                        {#if product.ram}
                            <div class="spec-row"><span>RAM:</span> <strong>{product.ram}</strong></div>
                        {/if}
                        {#if product.storage}
                            <div class="spec-row"><span>Bộ nhớ:</span> <strong>{product.storage}</strong></div>
                        {/if}
                        {#if product.cpu}
                            <div class="spec-row"><span>Vi xử lý:</span> <strong>{product.cpu}</strong></div>
                        {/if}
                        {#if product.display}
                            <div class="spec-row"><span>Màn hình:</span> <strong>{product.display}</strong></div>
                        {/if}
                        {#if product.battery_cap}
                            <div class="spec-row"><span>Dung lượng Pin:</span> <strong>{product.battery_cap} mAh</strong></div>
                        {/if}
                        {#if product.port}
                            <div class="spec-row"><span>Cổng sạc:</span> <strong>{product.port}</strong></div>
                        {/if}
                        {#if product.speaker}
                            <div class="spec-row"><span>Loa:</span> <strong>{product.speaker}</strong></div>
                        {/if}
                        <div class="spec-row"><span>Tình trạng:</span> <strong>{product.is_used ? 'Máy cũ' : 'Máy mới'}</strong></div>
                        <div class="spec-row"><span>Trong kho:</span> <strong style="color: {product.in_stock ? '#22c55e' : '#ef4444'}">{product.in_stock ? 'Còn hàng' : 'Hết hàng'}</strong></div>
                    </div>

                    {#if product.specs && Object.keys(product.specs).length > 0}
                        <h3 style="margin-top: 2rem;">Chi tiết khác</h3>
                        <div class="specs-grid">
                            {#each Object.entries(product.specs) as [key, value]}
                                <div class="spec-row"><span>{key}:</span> <strong>{value}</strong></div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1.5rem;
        animation: fadeIn 0.3s ease-out;
    }

    .modal-content {
        background: #1e293b;
        width: 100%;
        max-width: 800px;
        max-height: 90vh;
        border-radius: 2rem;
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        animation: modalScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: flex;
        flex-direction: column;
    }

    .modal-scroll-area {
        overflow-y: auto;
        padding: 2.5rem;
        flex: 1;
    }

    .modal-scroll-area::-webkit-scrollbar {
        width: 6px;
    }

    .modal-scroll-area::-webkit-scrollbar-track {
        background: transparent;
    }

    .modal-scroll-area::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }

    .modal-scroll-area::-webkit-scrollbar-thumb:hover {
        background: var(--primary);
    }

    .modal-close {
        position: absolute;
        top: 1.5rem;
        right: 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
        z-index: 1001;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .modal-close:hover {
        background: var(--danger);
        transform: rotate(90deg);
    }

    .modal-header {
        display: flex;
        gap: 2.5rem;
        margin-bottom: 3rem;
    }

    .modal-image {
        width: 250px;
        height: 250px;
        object-fit: contain;
        background: white;
        padding: 1.5rem;
        border-radius: 1.5rem;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }

    .modal-title-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 1rem;
    }

    .modal-title-info h2 {
        font-size: 2.2rem;
        margin: 0;
        background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .modal-price {
        font-size: 1.8rem;
        font-weight: 800;
        color: var(--primary);
        margin: 0.5rem 0;
    }

    .modal-price.contact {
        color: #94a3b8;
    }

    .modal-btn-buy {
        display: inline-block;
        background: var(--primary);
        color: white;
        padding: 1rem 2rem;
        border-radius: 1rem;
        text-decoration: none;
        font-weight: 700;
        text-align: center;
        transition: all 0.3s;
        box-shadow: 0 10px 20px rgba(96, 165, 250, 0.2);
        width: fit-content;
    }

    .modal-btn-buy:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 30px rgba(96, 165, 250, 0.4);
        filter: brightness(1.1);
    }

    .modal-body h3 {
        font-size: 1.3rem;
        margin-bottom: 1.5rem;
        padding-bottom: 0.8rem;
        border-bottom: 2px solid rgba(255, 255, 255, 0.05);
        color: #94a3b8;
    }

    .specs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.2rem;
    }

    .spec-row {
        display: flex;
        justify-content: space-between;
        padding: 0.8rem 1.2rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 0.8rem;
        font-size: 0.95rem;
    }

    .spec-row span {
        color: #94a3b8;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes modalScaleUp {
        from { opacity: 0; transform: scale(0.95) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }

    @media (max-width: 768px) {
        .modal-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
        }
        .modal-image {
            width: 200px;
            height: 200px;
        }
        .modal-btn-buy {
            width: 100%;
        }
        .specs-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
