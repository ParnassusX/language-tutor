<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let isConnected: boolean;
  export let isRecording: boolean;

  const dispatch = createEventDispatcher();
</script>

<div class="flex space-x-4">
  <button
    on:click={() => dispatch('toggleRecording')}
    disabled={!isConnected}
    class="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
  >
    {isRecording ? '🎤 Mute' : '🎤 Unmute'}
  </button>
</div>
