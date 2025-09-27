import { x as head, y as bind_props, v as pop, t as push } from "../../../chunks/index.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$payload, $$props) {
  push();
  let form = $$props["form"];
  let data = $$props["data"];
  let { session } = data;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Admin Panel</title>`;
    $$payload2.out += `<meta name="description" content="Admin panel for Language Tutor"/>`;
  });
  $$payload.out += `<div class="container svelte-1n6hu00"><h1>Admin Panel</h1> `;
  if (!session?.loggedIn) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<h2>Login</h2> <form method="POST" action="?/login"><label for="password" class="svelte-1n6hu00">Password:</label> <input type="password" id="password" name="password" required class="svelte-1n6hu00"/> <button type="submit" class="svelte-1n6hu00">Login</button> `;
    if (form?.error) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="error svelte-1n6hu00">${escape_html(form.error)}</p>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></form>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<h2>Manage API Keys</h2> <form method="POST" action="?/logout"><button type="submit" class="svelte-1n6hu00">Logout</button></form> <form method="POST" action="?/updateKeys"><div class="form-group svelte-1n6hu00"><label for="deepgram_api_key" class="svelte-1n6hu00">Deepgram API Key:</label> <input type="text" id="deepgram_api_key" name="deepgram_api_key" placeholder="sk-..." class="svelte-1n6hu00"/> <p class="current-key svelte-1n6hu00">Current: ${escape_html(data.apiKeys?.deepgram)}</p></div> <div class="form-group svelte-1n6hu00"><label for="deepl_api_key" class="svelte-1n6hu00">DeepL API Key:</label> <input type="text" id="deepl_api_key" name="deepl_api_key" placeholder="...:fx" class="svelte-1n6hu00"/> <p class="current-key svelte-1n6hu00">Current: ${escape_html(data.apiKeys?.deepl)}</p></div> <div class="form-group svelte-1n6hu00"><label for="gemini_api_key" class="svelte-1n6hu00">Gemini API Key:</label> <input type="text" id="gemini_api_key" name="gemini_api_key" placeholder="AIza..." class="svelte-1n6hu00"/> <p class="current-key svelte-1n6hu00">Current: ${escape_html(data.apiKeys?.gemini)}</p></div> <button type="submit" class="svelte-1n6hu00">Save Keys</button> `;
    if (form?.message) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="success svelte-1n6hu00">${escape_html(form.message)}</p>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></form>`;
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { form, data });
  pop();
}
export {
  _page as default
};
