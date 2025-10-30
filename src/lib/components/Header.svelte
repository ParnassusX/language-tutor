<script lang="ts">
  export let title: string;
  export let userLevel: string;
  export let topic: string;
</script>

<header class="text-center mb-8">
  <h1 class="text-4xl font-bold text-white mb-2">🇩🇪 German Language Tutor</h1>
  <h2 class="text-lg text-slate-300 mb-1">{title}</h2>
  <p class="text-sm text-slate-400">Level: {userLevel} • Topic: {topic}</p>
</header>
