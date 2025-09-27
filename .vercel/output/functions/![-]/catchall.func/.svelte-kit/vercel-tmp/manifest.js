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
		client: {start:"_app/immutable/entry/start.CRMb8bSV.js",app:"_app/immutable/entry/app.BLWepYwt.js",imports:["_app/immutable/entry/start.CRMb8bSV.js","_app/immutable/chunks/R_Pj2IOt.js","_app/immutable/chunks/DbdCj083.js","_app/immutable/chunks/WWMCCf7j.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/7g51GqNO.js","_app/immutable/chunks/BtM0sE0e.js","_app/immutable/entry/app.BLWepYwt.js","_app/immutable/chunks/WWMCCf7j.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/7g51GqNO.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/DbdCj083.js","_app/immutable/chunks/BtM0sE0e.js","_app/immutable/chunks/Cfa9bKA1.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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
				id: "/api/conversational",
				pattern: /^\/api\/conversational\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/conversational/_server.ts.js'))
			},
			{
				id: "/api/debug",
				pattern: /^\/api\/debug\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/debug/_server.ts.js'))
			},
			{
				id: "/api/health",
				pattern: /^\/api\/health\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/health/_server.ts.js'))
			},
			{
				id: "/api/speak",
				pattern: /^\/api\/speak\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/speak/_server.ts.js'))
			},
			{
				id: "/api/test-deepl",
				pattern: /^\/api\/test-deepl\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/test-deepl/_server.ts.js'))
			},
			{
				id: "/api/test-gemini",
				pattern: /^\/api\/test-gemini\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/test-gemini/_server.ts.js'))
			},
			{
				id: "/api/test-pipeline",
				pattern: /^\/api\/test-pipeline\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/test-pipeline/_server.ts.js'))
			},
			{
				id: "/api/test-timeout",
				pattern: /^\/api\/test-timeout\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/test-timeout/_server.ts.js'))
			},
			{
				id: "/api/test",
				pattern: /^\/api\/test\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/test/_server.ts.js'))
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
