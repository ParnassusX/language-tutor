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
      window.location.href = '/tutor';
    } else {
      error = 'Invalid username or password';
    }
  }
</script>

<main class="min-h-screen bg-gradient-to-br from-slate-900 to-gray-800 flex items-center justify-center p-6">
  <div class="bg-slate-800 bg-opacity-50 backdrop-blur-md rounded-2xl shadow-lg p-8 w-full max-w-md">
    <h1 class="text-4xl font-bold text-white mb-8 text-center">Login</h1>
    <form on:submit|preventDefault={handleSubmit}>
      <div class="mb-4">
        <label for="username" class="block text-gray-300 mb-2">Username</label>
        <input type="text" id="username" bind:value={username} class="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div class="mb-4">
        <label for="password" class="block text-gray-300 mb-2">Password</label>
        <input type="password" id="password" bind:value={password} class="w-full px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {#if error}
        <p class="text-red-500 mb-4">{error}</p>
      {/if}
      <button type="submit" class="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all transform hover:scale-105">
        Login
      </button>
    </form>
  </div>
</main>
