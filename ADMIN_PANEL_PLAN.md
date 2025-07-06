# Admin Panel Architectural Plan

This document outlines the architectural plan for adding a simple and secure admin interface to the "Language Tutor" SvelteKit application. The primary purpose of this interface is to manage API keys for various services (Deepgram, DeepL, Groq).

## 1. Routing

A new route will be created for the admin panel at `/admin`. Given SvelteKit's file-based routing, this will be implemented by creating a new directory structure:

```
src/
└── routes/
    └── admin/
        ├── +page.svelte
        └── +page.server.ts
```

-   **`+page.svelte`**: This file will contain the UI for the admin panel, including the form for managing API keys.
-   **`+page.server.ts`**: This file will handle the server-side logic, including authentication and the actions for updating the API keys.

## 2. Authentication

To keep things simple and secure for this internal tool, we will use an environment variable-based password protection scheme.

-   A new private environment variable, `ADMIN_PASSWORD`, will be added to the project's `.env` file (and configured in the Vercel environment variables for production).
-   The `+page.server.ts` file for the `/admin` route will contain a `load` function that checks for a password submitted via a form or a cookie.
-   If the user is not authenticated, the page will render a simple login form.
-   Upon successful login, a secure, HTTP-only cookie will be set to maintain the session. All server-side actions on this route will validate this cookie.

This approach avoids the complexity of a full-fledged authentication provider while providing a reasonable level of security for an internal tool.

## 3. State Management (API Keys)

The API keys for Deepgram, DeepL, and Groq will be managed as private environment variables within the SvelteKit application.

-   **Storage:** The keys will be stored as private environment variables (e.g., `DEEPGRAM_API_KEY`, `DEEPL_API_KEY`, `GROQ_API_KEY`) in the `.env` file for local development and in the Vercel project settings for production. SvelteKit automatically loads these variables.
-   **Backend Access:** The backend functions (server-side code in `+page.server.ts` or API routes) will access these keys using SvelteKit's `$env/static/private` module.
-   **Updating Keys:** The admin panel will provide a form with fields for each API key. When the form is submitted, a server-side action in `+page.server.ts` will be triggered. This action will be responsible for updating the environment variables. **Note:** Directly updating `.env` files programmatically is not a standard practice and can be insecure. For a Vercel deployment, the Vercel API would be used to update the environment variables. For local development, the admin panel will show the current keys (or placeholders) and provide instructions to manually update the `.env` file. A more advanced implementation could use the Vercel API to update production variables directly.

## 4. UI/UX Flow

The user flow for the admin will be straightforward:

1.  **Access:** The admin navigates to `/admin`.
2.  **Login:** If not already logged in, they are presented with a password form. They enter the password stored in the `ADMIN_PASSWORD` environment variable.
3.  **View Keys:** Upon successful authentication, the admin is shown a form with input fields for each API key (Deepgram, DeepL, Groq). For security, the current values of the keys will be masked (e.g., showing only the last 4 characters).
4.  **Update Keys:** The admin can enter new API keys into the input fields.
5.  **Save:** The admin clicks a "Save" button. This submits the form to a server-side action.
6.  **Confirmation:** The backend processes the request. For a Vercel environment, it would use the Vercel API to update the environment variables. The UI will then display a confirmation message indicating that the keys have been updated. For local development, it will remind the user to restart the server for changes to take effect.

This plan provides a simple, secure, and maintainable solution for managing API keys within the "Language Tutor" application.