import { f as fail, r as redirect } from "../../../chunks/index2.js";
import { V as VERCEL_PROJECT_ID, b as VERCEL_TEAM_ID, c as VERCEL_TOKEN, A as ADMIN_PASSWORD, G as GEMINI_API_KEY, d as GROQ_API_KEY, a as DEEPL_API_KEY, D as DEEPGRAM_API_KEY } from "../../../chunks/private.js";
const load = ({ cookies }) => {
  const sessionCookie = cookies.get("session");
  const session = sessionCookie ? JSON.parse(sessionCookie) : { loggedIn: false };
  if (!session.loggedIn) {
    return {
      session: { loggedIn: false },
      apiKeys: null
    };
  }
  const maskKey = (key) => {
    if (!key || key.includes("_HERE")) return "Not set";
    return `...${key.slice(-4)}`;
  };
  return {
    session,
    apiKeys: {
      deepgram: maskKey(DEEPGRAM_API_KEY),
      deepl: maskKey(DEEPL_API_KEY),
      groq: maskKey(GROQ_API_KEY),
      gemini: maskKey(GEMINI_API_KEY)
    }
  };
};
const actions = {
  login: async ({ cookies, request }) => {
    const data = await request.formData();
    const password = data.get("password");
    if (password !== ADMIN_PASSWORD) {
      return fail(401, { error: "Invalid password." });
    }
    const session = { loggedIn: true };
    cookies.set("session", JSON.stringify(session), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7
      // 1 week
    });
    throw redirect(303, "/admin");
  },
  logout: async ({ cookies }) => {
    cookies.delete("session", { path: "/" });
    throw redirect(303, "/admin");
  },
  updateKeys: async ({ request, cookies }) => {
    const sessionCookie = cookies.get("session");
    const session = sessionCookie ? JSON.parse(sessionCookie) : { loggedIn: false };
    if (!session.loggedIn) {
      return fail(401, { error: "Unauthorized" });
    }
    const data = await request.formData();
    const keysToUpdate = [
      { name: "DEEPGRAM_API_KEY", value: data.get("deepgram_api_key") },
      { name: "DEEPL_API_KEY", value: data.get("deepl_api_key") },
      { name: "GROQ_API_KEY", value: data.get("groq_api_key") },
      { name: "GEMINI_API_KEY", value: data.get("gemini_api_key") }
    ].filter((key) => key.value);
    if (keysToUpdate.length === 0) {
      return fail(400, { error: "No keys to update." });
    }
    try {
      for (const key of keysToUpdate) {
        const response = await fetch(
          `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${VERCEL_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              key: key.name,
              value: key.value,
              type: "encrypted",
              target: ["production", "preview", "development"]
            })
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          return fail(response.status, {
            error: `Failed to update ${key.name}: ${errorData.error.message}`
          });
        }
      }
      return { message: "API keys updated successfully. Changes may take a moment to apply." };
    } catch (error) {
      return fail(500, { error: "An unexpected error occurred." });
    }
  }
};
export {
  actions,
  load
};
