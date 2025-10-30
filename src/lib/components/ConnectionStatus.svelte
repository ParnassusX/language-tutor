<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let status: string;
  export let isConnected: boolean;
  export let isAiThinking: boolean;
  export let isRecording: boolean;

  const dispatch = createEventDispatcher();

  $: statusMessage = isAiThinking ? 'AI is thinking...' : isRecording ? 'Listening...' : status;
</script>

<div class="bg-slate-800 p-4 rounded-lg mb-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <div class="w-3 h-3 rounded-full {status === 'Connected' ? 'bg-green-400' :
       status === 'Connecting...' ? 'bg-orange-400' : 'bg-red-400'}"></div>
      <span class="text-white font-medium" data-testid="status-message">Status: {statusMessage}</span>
    </div>
    <button
      on:click={() => dispatch('toggleConnection')}
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      data-testid="connect-button"
    >
      {isConnected ? 'Disconnect' : 'Connect'}
    </button>
  </div>
</div>
