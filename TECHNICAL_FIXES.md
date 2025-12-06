# 🔧 Technical Fixes - Immediate Actions Required

## 1. Fix PrismaClient Singleton ⚡ (1 hour)

### Problem:
Multiple PrismaClient instances cause connection pool exhaustion.

### Files to Change:
1. Create `src/lib/server/db.ts`
2. Update `src/lib/server/auth.ts`
3. Update `src/routes/api/auth/login/+server.ts`

### Solution:

**Create: `src/lib/server/db.ts`**
```typescript
import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

let prisma: PrismaClient;

if (dev) {
  // In development, use a global variable to preserve the client across hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
} else {
  // In production, create a new client
  prisma = new PrismaClient();
}

export { prisma };
```

**Update: `src/lib/server/auth.ts`**
```typescript
// Change line 8 from:
// const prisma = new PrismaClient();
// To:
import { prisma } from './db';
```

**Update: `src/routes/api/auth/login/+server.ts`**
```typescript
// Change line 5 from:
// const prisma = new PrismaClient();
// To:
import { prisma } from '$lib/server/db';
```

---

## 2. Fix JWT Secret Fallback 🔒 (15 minutes)

### Problem:
Security risk - falls back to hardcoded 'secret' if env var not set.

### File to Change:
`src/lib/server/auth.ts` line 9

### Solution:

```typescript
// Change from:
const JWT_SECRET = env.JWT_SECRET || 'secret';

// To:
const JWT_SECRET = env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

**Also add to `.env.example`:**
```bash
# Required: Generate with: openssl rand -base64 32
JWT_SECRET=your-secret-key-here-minimum-32-characters
```

---

## 3. Fix WebSocket Architecture 🔌 (3-5 days)

### Problem:
WebSocket server defined but never initialized. Frontend connects to wrong endpoint.

### Current Issues:
```typescript
// src/routes/tutor/+page.svelte:115
const wsUrl = `ws://${window.location.host}`;
socket = new WebSocket(wsUrl);
// ❌ This connects to SvelteKit app, not Deepgram!
```

### Option A: Direct Client Connection (RECOMMENDED)

**Pros:**
- Simpler architecture
- Lower latency
- No proxy server needed
- Standard Deepgram pattern

**Cons:**
- API key exposed to client (must use token endpoint)

**Implementation:**

**1. Update API endpoint: `src/routes/api/voice-agent/+server.ts`**
```typescript
// Add token generation endpoint
export const POST = async ({ request }) => {
  const { DEEPGRAM_API_KEY } = env;
  
  if (!DEEPGRAM_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { 
      status: 500 
    });
  }

  // Return temporary token for client
  return new Response(JSON.stringify({
    token: DEEPGRAM_API_KEY, // Or generate scoped token with Deepgram API
    wsUrl: 'wss://api.deepgram.com/v1/listen',
    expiresIn: 3600
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
```

**2. Update frontend: `src/routes/tutor/+page.svelte`**
```typescript
async function connect(): Promise<void> {
  try {
    status = 'Connecting...';
    
    // Get token from backend
    const response = await fetch('/api/voice-agent', { method: 'POST' });
    const { token, wsUrl } = await response.json();
    
    // Connect directly to Deepgram
    socket = new WebSocket(`${wsUrl}?token=${token}`);
    
    socket.onopen = () => {
      status = 'Connected';
      isConnected = true;
      
      // Send configuration
      socket.send(JSON.stringify({
        type: 'Settings',
        language: 'de',
        // ... rest of settings
      }));
    };
    
    // ... rest of handlers
  } catch (error) {
    console.error('Connection failed:', error);
    status = 'Failed';
  }
}
```

### Option B: Proxy Server (More Complex)

**Only if you need:**
- Request logging
- Rate limiting
- Additional processing

**Implementation:**

**1. Create `src/hooks.server.ts` handler:**
```typescript
import type { Handle } from '@sveltejs/kit';
import { configureWebSocketServer } from './hooks/webSocketServer';

export const handleWebSocket = async ({ event, resolve }) => {
  // Check if WebSocket upgrade request
  if (event.request.headers.get('upgrade') === 'websocket') {
    // Handle WebSocket upgrade
    return configureWebSocketServer(event);
  }
  return resolve(event);
};
```

**Note:** This is complex with adapter-node. Consider using separate WebSocket server.

---

## 4. Fix Duplicate Lesson Interface 📝 (5 minutes)

### Problem:
Interface defined twice, with typo in one location.

### Files to Change:
`src/routes/tutor/+page.svelte` lines 24-31

### Solution:

```typescript
// Remove lines 24-31 (duplicate interface)
// Just use the import:
import { lessons, type Lesson } from '$lib/lessons';

// Remove duplicate interface definition
```

**Also fix typo in `src/lib/lessons.ts` if present:**
```typescript
// Change 'vocalbulary' to 'vocabulary' if found
```

---

## 5. Update Vulnerable Dependencies 📦 (30 minutes)

### Problem:
10 security vulnerabilities including XSS in @sveltejs/kit.

### Solution:

```bash
# Update to latest stable versions
npm update @sveltejs/kit @sveltejs/adapter-node
npm audit fix

# For major version updates (breaking changes):
npm install @sveltejs/kit@latest @sveltejs/adapter-node@latest

# Verify build still works
npm run build
```

**Manual review required for:**
- Migration guides for SvelteKit 2.x
- API changes in adapter-node
- Update import statements if needed

---

## 6. Fix Failing Tests 🧪 (2-3 hours)

### Problem:
All 5 tests failing - testing wrong component.

### File to Fix:
`src/routes/__tests__/page.test.ts`

### Solution:

```typescript
// Change test import from:
import Page from '../+page.svelte';

// To (if testing tutor page):
import Page from '../tutor/+page.svelte';

// OR rename test file to:
// src/routes/tutor/__tests__/page.test.ts

// Update test expectations to match actual tutor page:
describe('Language Tutor Page', () => {
  it('renders the main page with all expected elements', () => {
    render(Page);
    
    // Update to match tutor page elements
    expect(screen.getByText(/Conversation/i)).toBeInTheDocument();
    // Add more assertions for tutor-specific elements
  });
});
```

---

## 7. Add Loading States 🔄 (1-2 hours)

### Files to Update:
- `src/routes/tutor/+page.svelte`
- `src/lib/components/ConnectionStatus.svelte`

### Solution:

**Add loading state variable:**
```typescript
let isLoading = false;
let loadingMessage = '';

async function connect(): Promise<void> {
  isLoading = true;
  loadingMessage = 'Connecting to voice agent...';
  
  try {
    // ... connection logic
  } finally {
    isLoading = false;
    loadingMessage = '';
  }
}
```

**Update UI:**
```svelte
{#if isLoading}
  <div class="flex items-center justify-center p-4">
    <div class="loading loading-spinner loading-lg"></div>
    <span class="ml-4">{loadingMessage}</span>
  </div>
{/if}
```

---

## 8. Add Error Boundaries 🛡️ (2-3 hours)

### Create: `src/routes/+error.svelte`

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  
  $: error = $page.error;
  $: status = $page.status;
</script>

<main class="min-h-screen hero bg-base-200">
  <div class="hero-content text-center">
    <div class="max-w-md">
      <h1 class="text-5xl font-bold">Oops!</h1>
      <p class="py-6">
        {#if status === 404}
          Page not found
        {:else if status === 500}
          Something went wrong on our end
        {:else}
          An error occurred: {error?.message || 'Unknown error'}
        {/if}
      </p>
      <a href="/" class="btn btn-primary">Go Home</a>
    </div>
  </div>
</main>
```

### Add to components:

```svelte
<!-- In critical components like tutor page -->
<script>
  import { onMount } from 'svelte';
  
  let error = null;
  
  onMount(() => {
    const handleError = (e) => {
      console.error('Component error:', e);
      error = e.message;
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  });
</script>

{#if error}
  <div class="alert alert-error">
    <span>Error: {error}</span>
    <button on:click={() => error = null}>Dismiss</button>
  </div>
{/if}
```

---

## 9. Add Environment Variable Validation 🔍 (1 hour)

### Create: `src/lib/server/env.ts`

```typescript
import { env } from '$env/dynamic/private';

export function validateEnv() {
  const required = ['JWT_SECRET', 'DATABASE_URL'];
  const optional = ['DEEPGRAM_API_KEY', 'DEEPL_API_KEY', 'GEMINI_API_KEY'];
  
  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  const missingOptional = optional.filter(key => !env[key]);
  if (missingOptional.length > 0) {
    console.warn(`⚠️  Optional environment variables not set: ${missingOptional.join(', ')}`);
    console.warn('Some features may not work without these variables.');
  }
  
  return {
    required: Object.fromEntries(required.map(k => [k, env[k]])),
    optional: Object.fromEntries(optional.map(k => [k, env[k]])),
  };
}
```

### Use in `src/hooks.server.ts`:

```typescript
import { validateEnv } from '$lib/server/env';

// Validate on startup
if (import.meta.env.PROD) {
  validateEnv();
}
```

---

## 10. Clean Up Repository 🧹 (30 minutes)

### Files/Folders to Remove or Update:

**Add to `.gitignore`:**
```bash
# Build artifacts
/.vercel/
/build/

# Testing
/test-results/
/playwright-report/

# Archives (should not be in git)
/archive/
/backup/

# Agent scratch
/jules-scratch/
```

**Run cleanup:**
```bash
# Remove from git but keep local
git rm -r --cached .vercel archive backup

# Or delete entirely if not needed
rm -rf archive backup

# Commit cleanup
git add .gitignore
git commit -m "chore: clean up repository and update .gitignore"
```

---

## 11. Add Health Check Endpoint ❤️ (15 minutes)

### Update: `src/routes/api/health/+server.ts`

```typescript
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      deepgram: env.DEEPGRAM_API_KEY ? 'configured' : 'missing',
      deepl: env.DEEPL_API_KEY ? 'configured' : 'missing',
      gemini: env.GEMINI_API_KEY ? 'configured' : 'missing',
    }
  };
  
  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = 'ok';
  } catch (error) {
    checks.status = 'degraded';
    checks.checks.database = 'error';
  }
  
  return new Response(JSON.stringify(checks, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
};
```

---

## 12. Add Rate Limiting 🚦 (2-3 hours)

### Install dependency:
```bash
npm install @upstash/ratelimit @upstash/redis
```

### Create: `src/lib/server/ratelimit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Use in-memory for development, Redis for production
let ratelimit: Ratelimit;

if (import.meta.env.PROD && process.env.UPSTASH_REDIS_REST_URL) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
  });
}

export async function checkRateLimit(identifier: string) {
  if (!ratelimit) {
    return { success: true }; // No rate limiting in dev
  }
  
  return await ratelimit.limit(identifier);
}
```

### Use in auth endpoints:

```typescript
import { checkRateLimit } from '$lib/server/ratelimit';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const ip = getClientAddress();
  const { success } = await checkRateLimit(ip);
  
  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }
  
  // ... rest of handler
};
```

---

## Implementation Priority

| Fix | Time | Priority | Blocking? |
|-----|------|----------|-----------|
| 1. PrismaClient | 1h | HIGH | No |
| 2. JWT Secret | 15m | HIGH | No |
| 3. WebSocket | 3-5d | **CRITICAL** | **YES** |
| 4. Lesson Interface | 5m | LOW | No |
| 5. Dependencies | 30m | HIGH | No |
| 6. Tests | 2-3h | MEDIUM | No |
| 7. Loading States | 1-2h | MEDIUM | No |
| 8. Error Boundaries | 2-3h | HIGH | No |
| 9. Env Validation | 1h | MEDIUM | No |
| 10. Cleanup | 30m | LOW | No |
| 11. Health Check | 15m | MEDIUM | No |
| 12. Rate Limiting | 2-3h | MEDIUM | No |

**Total Time (excluding WebSocket):** ~12-15 hours
**WebSocket Implementation:** 3-5 days

---

## Testing Checklist

After implementing fixes:

- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] No console errors in browser
- [ ] Health check returns OK: `curl http://localhost:5173/api/health`
- [ ] Can create account
- [ ] Can login
- [ ] Can logout
- [ ] WebSocket connects (after fix #3)
- [ ] Audio records (after fix #3)
- [ ] Transcription works (after fix #3)
- [ ] TTS plays (after fix #3)

---

**Next:** After these fixes, proceed with Phase 2 (Data Persistence) from the main roadmap.
