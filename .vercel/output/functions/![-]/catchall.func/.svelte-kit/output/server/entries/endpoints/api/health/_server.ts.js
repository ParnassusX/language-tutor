import { j as json } from "../../../../chunks/index2.js";
const GET = async () => {
  console.log("🎯 GET /api/health - Health check request received");
  try {
    return json({
      status: "ok",
      message: "Server is healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("❌ Health check error:", error);
    return json({
      status: "error",
      message: "Health check failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
};
const POST = async ({ request }) => {
  console.log("🎯 POST /api/health - Health check POST request received");
  try {
    const body = await request.json().catch(() => ({}));
    console.log("📝 POST body:", body);
    return json({
      status: "ok",
      message: "Server is healthy (POST)",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      receivedData: body
    });
  } catch (error) {
    console.error("❌ Health check POST error:", error);
    return json({
      status: "error",
      message: "Health check POST failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
};
export {
  GET,
  POST
};
