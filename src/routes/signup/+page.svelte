<script lang="ts">
  let username = '';
  let password = '';
  let error = '';

  async function handleSubmit() {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      window.location.href = '/tutor';
    } else {
      error = 'Username already taken';
    }
  }
</script>

<main class="min-h-screen hero bg-base-200">
  <div class="hero-content flex-col lg:flex-row-reverse">
    <div class="text-center lg:text-left">
      <h1 class="text-5xl font-bold">Sign up now!</h1>
      <p class="py-6">Join our community and start your German learning journey today. It's free!</p>
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
            <a href="/login" class="label-text-alt link link-hover">Already have an account? Login</a>
          </label>
        </div>
        {#if error}
          <p class="text-error text-sm">{error}</p>
        {/if}
        <div class="form-control mt-6">
          <button type="submit" class="btn btn-primary">Sign Up</button>
        </div>
      </form>
    </div>
  </div>
</main>
