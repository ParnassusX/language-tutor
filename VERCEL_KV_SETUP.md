# Vercel KV Setup using the CLI

This guide outlines the steps to create and link a Vercel KV store to your project using the Vercel Command Line Interface (CLI).

## Step 1: Install the Vercel CLI

First, ensure you have the Vercel CLI installed globally on your machine.

```bash
npm install -g vercel
```

## Step 2: Log in to your Vercel Account

Next, you'll need to log in to your Vercel account through the CLI.

```bash
vercel login
```

This command will prompt you to enter the email address associated with your Vercel account and will guide you through the login process.

## Step 3: Link Your Local Project to Vercel

Navigate to your project's root directory in your terminal and run the following command to link it to your project on Vercel.

```bash
vercel link
```

The CLI will ask a few questions to identify the correct Vercel project. It should automatically detect and suggest your `language-tutor` project.

## Step 4: Create and Connect the KV Store

Finally, run the following command to create a new KV database and automatically connect it to your linked project.

```bash
vercel kv create language-tutor-kv
```

This command will create the database and automatically add the required environment variables (`KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.) to your project's settings on Vercel.

Once these steps are complete, your Vercel KV store will be set up and connected to your project.