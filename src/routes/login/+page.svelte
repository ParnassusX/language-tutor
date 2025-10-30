<script lang="ts">
  let username = '';
  let password = '';
  let error = '';

  async function handleSubmit() {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      window.location.href = '/';
    } else {
      error = 'Invalid username or password';
    }
  }
</script>

<main class="min-h-screen bg-slate-900 p-6">
  <div class="max-w-md mx-auto">
    <h1 class="text-4xl font-bold text-white mb-8">Login</h1>
    <form on:submit|preventDefault={handleSubmit}>
      <div class="mb-4">
        <label for="username" class="block text-white mb-2">Username</label>
        <input type="text" id="username" bind:value={username} class="w-full px-4 py-2 rounded-lg bg-slate-800 text-white border border-slate-600" />
      </div>
      <div class="mb-4">
        <label for="password" class="block text-white mb-2">Password</label>
        <input type="password" id="password" bind:value={password} class="w-full px-4 py-2 rounded-lg bg-slate-800 text-white border border-slate-600" />
      </div>
      {#if error}
        <p class="text-red-500 mb-4">{error}</p>
      {/if}
      <button type="submit" class="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
        Login
      </button>
    </form>
  </div>
</main>
