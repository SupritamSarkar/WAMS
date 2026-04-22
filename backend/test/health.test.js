const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/index");

test("GET /api/health returns ok", async () => {
  const response = await request(app).get("/api/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
});
