import * as server from '../entries/pages/admin/_page.server.ts.js';

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/admin/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/admin/+page.server.ts";
export const imports = ["_app/immutable/nodes/3.BNqwpHKB.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/C5xkfXMJ.js","_app/immutable/chunks/L7fnnnqL.js","_app/immutable/chunks/ui5THt8X.js","_app/immutable/chunks/CAqSUsYy.js","_app/immutable/chunks/B8PZ7MST.js"];
export const stylesheets = ["_app/immutable/assets/3.ue3Gcx4T.css"];
export const fonts = [];
