<script lang="ts">
	import type { ActionData, PageData } from './$types';

	export let form: ActionData;
	export let data: PageData;

	let { session } = data;
</script>

<svelte:head>
	<title>Admin Panel</title>
	<meta name="description" content="Admin panel for Language Tutor" />
</svelte:head>

<div class="container">
	<h1>Admin Panel</h1>

	{#if !session?.loggedIn}
		<h2>Login</h2>
		<form method="POST" action="?/login">
			<label for="password">Password:</label>
			<input type="password" id="password" name="password" required />
			<button type="submit">Login</button>
			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}
		</form>
	{:else}
		<h2>Manage API Keys</h2>
		<form method="POST" action="?/logout">
			<button type="submit">Logout</button>
		</form>

		<form method="POST" action="?/updateKeys">
			<div class="form-group">
				<label for="deepgram_api_key">Deepgram API Key:</label>
				<input type="text" id="deepgram_api_key" name="deepgram_api_key" placeholder="sk-..." />
				<p class="current-key">Current: {data.apiKeys?.deepgram}</p>
			</div>
			<div class="form-group">
				<label for="deepl_api_key">DeepL API Key:</label>
				<input type="text" id="deepl_api_key" name="deepl_api_key" placeholder="...:fx" />
				<p class="current-key">Current: {data.apiKeys?.deepl}</p>
			</div>
			<div class="form-group">
				<label for="groq_api_key">Groq API Key:</label>
				<input type="text" id="groq_api_key" name="groq_api_key" placeholder="gsk_..." />
				<p class="current-key">Current: {data.apiKeys?.groq}</p>
			</div>
			<div class="form-group">
				<label for="gemini_api_key">Gemini API Key:</label>
				<input type="text" id="gemini_api_key" name="gemini_api_key" placeholder="AIza..." />
				<p class="current-key">Current: {data.apiKeys?.gemini}</p>
			</div>
			<button type="submit">Save Keys</button>
			{#if form?.message}
				<p class="success">{form.message}</p>
			{/if}
		</form>
	{/if}
</div>

<style>
	.container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #ccc;
		border-radius: 8px;
	}
	.form-group {
		margin-bottom: 1rem;
	}
	label {
		display: block;
		margin-bottom: 0.5rem;
	}
	input {
		width: 100%;
		padding: 0.5rem;
		font-size: 1rem;
	}
	button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		cursor: pointer;
	}
	.error {
		color: red;
	}
	.success {
		color: green;
	}
	.current-key {
		font-size: 0.8rem;
		color: #666;
		margin-top: 0.25rem;
	}
</style>