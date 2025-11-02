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

<main class="min-h-screen hero bg-base-200">
  <div class="hero-content flex-col lg:flex-row-reverse">
    <div class="text-center lg:text-left">
      <h1 class="text-5xl font-bold">Login now!</h1>
      <p class="py-6">Welcome back! Access your personalized German language lessons and continue your learning journey.</p>
    </div>
    <div class="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
      <form class="card-body" on:submit|preventDefault={handleSubmit}>
        <div class="form-control">
          <label for="username" class="label">
            <span class="label-text">Username</span>
          </label>
          <input type="text" id="username" bind:value={username} class="input input-bordered" required />
        </div>
        <div class="form-control">
          <label for="password" class="label">
            <span class="label-text">Password</span>
          </label>
          <input type="password" id="password" bind:value={password} class="input input-bordered" required />
          <label class="label">
            <a href="/signup" class="label-text-alt link link-hover">Don't have an account? Sign up</a>
          </label>
        </div>
        {#if error}
          <p class="text-error text-sm">{error}</p>
        {/if}
        <div class="form-control mt-6">
          <button type="submit" class="btn btn-primary">Login</button>
        </div>
      </form>
    </div>
  </div>
</main>
