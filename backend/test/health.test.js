const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/index");

test("GET /api/health returns ok in local mode", async () => {
  const response = await request(app).get("/api/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.mode, "local");
  assert.match(response.body.data_file, /local-db\.json$/);
});
