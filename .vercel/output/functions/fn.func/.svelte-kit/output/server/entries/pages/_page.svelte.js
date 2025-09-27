import { x as valueless_option, v as pop, t as push } from "../../chunks/index.js";
import { e as escape_html } from "../../chunks/escaping.js";
import "clsx";
const replacements = {
  translate: /* @__PURE__ */ new Map([
    [true, "yes"],
    [false, "no"]
  ])
};
function attr(name, value, is_boolean = false) {
  if (is_boolean) return "";
  const normalized = name in replacements && replacements[name].get(value) || value;
  const assignment = is_boolean ? "" : `="${escape_html(normalized, true)}"`;
  return ` ${name}${assignment}`;
}
function _page($$payload, $$props) {
  push();
  let isLoading = false;
  let selectedTopic = "General Conversation";
  $$payload.out += `<main class="svelte-39rblt"><h1 class="svelte-39rblt">Language Tutor</h1> <p class="svelte-39rblt">Press the button and start speaking in German.</p> <div class="container svelte-39rblt">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<button${attr("disabled", isLoading, true)} class="svelte-39rblt">Start Talking</button>`;
  }
  $$payload.out += `<!--]--> <button${attr("disabled", isLoading, true)} class="svelte-39rblt">Clear History</button> <div class="topic-selector svelte-39rblt"><label for="topic" class="svelte-39rblt">Select a Topic:</label> <select id="topic" class="svelte-39rblt">`;
  $$payload.select_value = selectedTopic;
  $$payload.out += `<option class="svelte-39rblt">`;
  valueless_option($$payload, () => {
    $$payload.out += `General Conversation`;
  });
  $$payload.out += `</option><option class="svelte-39rblt">`;
  valueless_option($$payload, () => {
    $$payload.out += `Ordering at a Restaurant`;
  });
  $$payload.out += `</option><option class="svelte-39rblt">`;
  valueless_option($$payload, () => {
    $$payload.out += `Asking for Directions`;
  });
  $$payload.out += `</option><option class="svelte-39rblt">`;
  valueless_option($$payload, () => {
    $$payload.out += `At the Airport`;
  });
  $$payload.out += `</option>`;
  $$payload.select_value = void 0;
  $$payload.out += `</select></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></main>`;
  pop();
}
export {
  _page as default
};
