<script lang="ts">
  export let messages: { text: string; type: string; timestamp: Date }[];
  export let isRecording: boolean;
  export let isAiThinking: boolean;
  export let interimTranscript: string;
</script>

<div class="bg-slate-800 rounded-lg p-4 mb-6 h-96 overflow-y-auto">
  <h3 class="text-white font-semibold mb-4">Conversation</h3>
  <div id="messages" class="space-y-3">
    {#each messages as msg}
      <div class="flex {msg.type === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="max-w-sm px-4 py-2 rounded-lg {msg.type === 'user' ? 'bg-blue-600 text-white' : msg.type === 'correction' ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-white'}">
          <div class="text-sm">{msg.text}</div>
          <div class="text-xs opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</div>
        </div>
      </div>
    {/each}
    {#if isRecording}
      <div class="flex justify-center">
        <div class="px-4 py-2 rounded-lg bg-slate-700 text-white flex items-center">
          <div class="flex space-x-1 mr-3">
            <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-200"></div>
            <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-400"></div>
          </div>
          <span class="text-sm">Recording...</span>
        </div>
      </div>
    {/if}
    {#if interimTranscript}
        <div class="flex justify-end">
            <div class="max-w-sm px-4 py-2 rounded-lg bg-blue-600 text-white opacity-70">
            <div class="text-sm">{interimTranscript}</div>
            </div>
        </div>
    {/if}
    {#if isAiThinking}
      <div class="flex justify-center">
        <div class="px-4 py-2 rounded-lg bg-slate-700 text-white flex items-center">
          <div class="flex space-x-1 mr-3">
            <div class="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div class="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-200"></div>
            <div class="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-400"></div>
          </div>
          <span class="text-sm">AI is thinking...</span>
        </div>
      </div>
    {/if}
  </div>
</div>
