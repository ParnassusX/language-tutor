export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.svg"]),
	mimeTypes: {".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.BqJ-n-Wc.js",app:"_app/immutable/entry/app.Dhc85wfc.js",imports:["_app/immutable/entry/start.BqJ-n-Wc.js","_app/immutable/chunks/IM8332wN.js","_app/immutable/chunks/Bkusq2lv.js","_app/immutable/chunks/L7fnnnqL.js","_app/immutable/chunks/ui5THt8X.js","_app/immutable/chunks/DRA-aPd3.js","_app/immutable/entry/app.Dhc85wfc.js","_app/immutable/chunks/L7fnnnqL.js","_app/immutable/chunks/ui5THt8X.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/Bkusq2lv.js","_app/immutable/chunks/DRA-aPd3.js","_app/immutable/chunks/CAqSUsYy.js","_app/immutable/chunks/B8PZ7MST.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/admin",
				pattern: /^\/admin\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/api/speak",
				pattern: /^\/api\/speak\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/speak/_server.ts.js'))
			},
			{
				id: "/api/transcribe",
				pattern: /^\/api\/transcribe\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/transcribe/_server.ts.js'))
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
