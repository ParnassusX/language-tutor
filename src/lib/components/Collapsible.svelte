<script lang="ts">
  export let title: string;
  let isOpen = false;
</script>

<div class="mb-4">
  <button on:click={() => isOpen = !isOpen} class="w-full text-left text-white font-semibold mb-2">
    {isOpen ? '▼' : '►'} {title}
  </button>
  {#if isOpen}
    <div class="p-4 bg-slate-800 rounded-lg">
      <slot />
    </div>
  {/if}
</div>
