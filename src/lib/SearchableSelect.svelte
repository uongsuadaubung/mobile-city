<script lang="ts">
    import { onMount } from 'svelte';

    interface Props {
        label: string;
        options: string[];
        value: string;
        placeholder?: string;
        allLabel?: string;
        showSearch?: boolean;
        onChange: (val: string) => void;
    }

    let { label, options, value, placeholder = "Tìm kiếm...", allLabel = "Tất cả", showSearch = true, onChange }: Props = $props();

    let isOpen = $state(false);
    let search = $state('');
    let container: HTMLDivElement;

    let filteredOptions = $derived(
        options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()))
    );

    let displayValue = $derived(
        value === 'all' ? allLabel : value
    );

    function toggle() {
        isOpen = !isOpen;
        if (isOpen) search = '';
    }

    function select(val: string) {
        onChange(val);
        isOpen = false;
        search = '';
    }

    // Click outside handler
    onMount(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (container && !container.contains(event.target as Node)) {
                isOpen = false;
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    });

    // Generate a unique ID for a11y
    const id = Math.random().toString(36).substring(2, 9);
</script>

<div class="searchable-select" bind:this={container} style:z-index={isOpen ? 1000 : 1}>
    {#if label}
        <label class="select-label" for="select-{id}">{label}</label>
    {/if}
    
    <button id="select-{id}" class="select-trigger" class:active={isOpen} onclick={toggle} type="button">
        <span>{displayValue}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    </button>

    {#if isOpen}
        <div class="select-dropdown">
            {#if showSearch}
                <div class="search-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input 
                        type="text" 
                        bind:value={search} 
                        placeholder={placeholder}
                        
                    >
                </div>
            {/if}
            
            <ul class="options-list">
                <li class:selected={value === 'all'}>
                    <button onclick={() => select('all')}>{allLabel}</button>
                </li>
                {#each filteredOptions as opt}
                    <li class:selected={value === opt}>
                        <button onclick={() => select(opt)}>{opt}</button>
                    </li>
                {/each}
                {#if filteredOptions.length === 0 && search !== ''}
                    <li class="no-results">Không tìm thấy</li>
                {/if}
            </ul>
        </div>
    {/if}
</div>

<style>
    .searchable-select {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
    }

    .select-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #94a3b8;
        margin-left: 0.2rem;
    }

    .select-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        cursor: pointer;
        transition: all 0.2s;
        backdrop-filter: blur(10px);
        text-align: left;
    }

    .select-trigger:hover, .select-trigger.active {
        background: rgba(30, 41, 59, 0.8);
        border-color: var(--primary);
        box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
    }

    .select-trigger span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-right: 0.5rem;
    }

    .select-dropdown {
        position: absolute;
        top: calc(100% + 0.5rem);
        left: 0;
        right: 0;
        background: #1e293b;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        z-index: 100;
        overflow: hidden;
        animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .search-box {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(15, 23, 42, 0.5);
    }

    .search-box input {
        background: transparent;
        border: none;
        color: white;
        font-size: 0.9rem;
        width: 100%;
        outline: none;
    }

    .options-list {
        list-style: none;
        padding: 0.5rem;
        margin: 0;
        max-height: 250px;
        overflow-y: auto;
    }

    .options-list::-webkit-scrollbar {
        width: 5px;
    }

    .options-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }

    .options-list li button {
        width: 100%;
        padding: 0.6rem 0.75rem;
        background: transparent;
        border: none;
        color: #cbd5e1;
        text-align: left;
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.2s;
        font-size: 0.9rem;
    }

    .options-list li:hover button {
        background: rgba(255, 255, 255, 0.05);
        color: white;
    }

    .options-list li.selected button {
        background: var(--primary);
        color: white;
    }

    .no-results {
        padding: 1rem;
        text-align: center;
        color: #64748b;
        font-size: 0.85rem;
    }
</style>
