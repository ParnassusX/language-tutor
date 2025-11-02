# Deployment Instructions

This document provides instructions for deploying the German Voice Tutor application.

## Prerequisites

-   A [Render](https://render.com/) account.
-   A [Deepgram](https://deepgram.com/) API key.
-   A [DeepL](https://www.deepl.com/) API key.
-   A [Google Gemini](https://ai.google.dev/) API key.

## Deployment Steps

1.  **Fork the repository** to your GitHub account.
2.  **Create a new Web Service** on Render and connect it to your forked repository.
3.  **Configure the service** with the following settings:
    -   **Name**: `german-voice-tutor` (or your preferred name)
    -   **Environment**: `Node`
    -   **Build Command**: `npm install && npm run build`
    -   **Start Command**: `node build/index.js`
4.  **Add a Disk** with the following settings:
    -   **Name**: `sqlite-data`
    -   **Mount Path**: `/app/prisma`
    -   **Size**: 1 GB
5.  **Add the following environment variables**:
    -   `DATABASE_URL`: `file:/app/prisma/dev.db`
    -   `DEEPGRAM_API_KEY`: Your Deepgram API key.
    -   `DEEPL_API_KEY`: Your DeepL API key.
    -   `GEMINI_API_KEY`: Your Google Gemini API key.
6.  **Deploy the service.**

## Logging In

The application does not have default credentials. You can sign up for a new account on the `/signup` page and then log in with your new credentials.
