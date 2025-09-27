import { j as json } from "../../../../chunks/index2.js";
async function GET() {
  return json({ message: "Test endpoint working", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
}
export {
  GET
};
