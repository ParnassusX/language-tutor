<script lang="ts">
  export let audioContext: AudioContext | null;
  export let micStream: MediaStream | null;
  export let messages: any[];
</script>

<div class="mt-8 bg-slate-800 p-4 rounded-lg">
  <h4 class="text-white font-semibold mb-3">Debug Info</h4>
  <div class="text-slate-400 text-sm space-y-1">
    <div>WebSocket URL: ws://localhost:5173</div>
    <div>Audio Context: {audioContext ? 'Available' : 'Not initialized'}</div>
    <div>Microphone: {micStream ? 'Available' : 'Not requested'}</div>
    <div>Messages: {messages.length}</div>
  </div>
</div>
