<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Lesson } from '$lib/lessons';

  export let userLevel: string;
  export let showTranslation: boolean;
  export let lessons: Lesson[];
  export let currentLesson: Lesson;

  const dispatch = createEventDispatcher();

  function handleUserLevelChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    dispatch('setUserLevel', target.value);
  }

  function handleLessonChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    dispatch('setLesson', target.value);
  }
</script>

<div class="flex flex-wrap gap-4 mb-6 justify-center">
  <select bind:value={userLevel} on:change={handleUserLevelChange} class="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600">
    <option value="A1">A1 - Beginner</option>
    <option value="A2">A2 - Elementary</option>
    <option value="B1">B1 - Intermediate</option>
  </select>
  <select bind:value={currentLesson.id} on:change={handleLessonChange} class="bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600">
    {#each lessons as lesson}
      <option value={lesson.id}>{lesson.title}</option>
    {/each}
  </select>
  <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
    on:click={() => dispatch('toggleTranslation')}
    data-testid="translation-button">
    🔤 {showTranslation ? 'Hide' : 'Show'} Translations
  </button>
</div>
