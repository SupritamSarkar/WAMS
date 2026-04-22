const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/index");
const { buildSeedData, saveState } = require("../src/lib/localDb");

function resetData() {
  saveState(buildSeedData());
}

test.beforeEach(() => {
  resetData();
});

test.after(() => {
  resetData();
});

test("POST /api/auth/register creates a local user and /api/auth/login authenticates by username", async () => {
  const registerResponse = await request(app)
    .post("/api/auth/register")
    .send({
      email: "newdealer@wams.local",
      username: "newdealer",
      password: "pass123",
      name: "New Dealer",
      role: "dealer",
    });

  assert.equal(registerResponse.status, 200);
  assert.equal(registerResponse.body.user.email, "newdealer@wams.local");
  assert.equal(registerResponse.body.user.role, "dealer");
  assert.ok(registerResponse.body.token);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({ username: "newdealer", password: "pass123" });

  assert.equal(loginResponse.status, 200);
  assert.equal(loginResponse.body.user.name, "New Dealer");
  assert.ok(loginResponse.body.token);
});

test("dealer CRUD routes persist local changes", async () => {
  const createResponse = await request(app)
    .post("/api/dealers")
    .send({
      name: "Test Dealer",
      company_name: "Test Co",
      email: "test@dealer.local",
      phone: "999",
      address: "Local Street",
      status: "active",
    });

  assert.equal(createResponse.status, 200);
  assert.equal(createResponse.body.name, "Test Dealer");
  const dealerId = createResponse.body.id;

  const updateResponse = await request(app)
    .put(`/api/dealers/${dealerId}`)
    .send({
      ...createResponse.body,
      status: "inactive",
      company_name: "Updated Test Co",
    });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.status, "inactive");
  assert.equal(updateResponse.body.company_name, "Updated Test Co");

  const listResponse = await request(app).get("/api/dealers");
  assert.equal(listResponse.status, 200);
  assert.ok(listResponse.body.some((dealer) => dealer.id === dealerId && dealer.status === "inactive"));

  const deleteResponse = await request(app).delete(`/api/dealers/${dealerId}`);
  assert.equal(deleteResponse.status, 200);

  const finalListResponse = await request(app).get("/api/dealers");
  assert.equal(finalListResponse.status, 200);
  assert.ok(!finalListResponse.body.some((dealer) => dealer.id === dealerId));
});

test("fulfilling an order updates product stock, marks the order fulfilled, and creates a bill", async () => {
  const createOrderResponse = await request(app)
    .post("/api/orders")
    .send({
      dealer_id: "d-1",
      product_id: "prod-1",
      quantity: 3,
      notes: "Need stock for workshop",
    });

  assert.equal(createOrderResponse.status, 201);
  const orderId = createOrderResponse.body.id;

  const fulfillResponse = await request(app).patch(`/api/orders/${orderId}/fulfill`);
  assert.equal(fulfillResponse.status, 200);
  assert.equal(fulfillResponse.body.order.status, "fulfilled");
  assert.equal(fulfillResponse.body.bill.status, "generated");
  assert.equal(fulfillResponse.body.bill.total_amount, 54000);

  const productsResponse = await request(app).get("/api/products");
  const gearbox = productsResponse.body.find((product) => product.id === "prod-1");
  assert.equal(gearbox.quantity, 5);

  const ordersResponse = await request(app).get("/api/orders");
  const fulfilledOrder = ordersResponse.body.find((order) => order.id === orderId);
  assert.equal(fulfilledOrder.status, "fulfilled");

  const billingResponse = await request(app).get("/api/billing");
  assert.ok(billingResponse.body.some((bill) => bill.invoice_number === fulfillResponse.body.bill.invoice_number));
});

test("PATCH /api/billing/:id/status marks an invoice paid with a paid date", async () => {
  const response = await request(app)
    .patch("/api/billing/bill-1/status")
    .send({ status: "paid", payment_status: "paid" });

  assert.equal(response.status, 200);
  assert.equal(response.body.payment_status, "paid");
  assert.equal(response.body.status, "paid");
  assert.match(response.body.paid_date, /^\d{4}-\d{2}-\d{2}$/);
});
