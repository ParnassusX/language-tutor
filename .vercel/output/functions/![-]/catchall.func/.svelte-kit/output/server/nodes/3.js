import * as server from '../entries/pages/admin/_page.server.ts.js';

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/admin/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/admin/+page.server.ts";
export const imports = ["_app/immutable/nodes/3.BvRMgvNd.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/WWMCCf7j.js","_app/immutable/chunks/7g51GqNO.js","_app/immutable/chunks/Cfa9bKA1.js","_app/immutable/chunks/OGr0-8w1.js"];
export const stylesheets = ["_app/immutable/assets/3.ue3Gcx4T.css"];
export const fonts = [];
