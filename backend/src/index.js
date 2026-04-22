require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 5000;

const supabaseUrl = process.env.SUPABASE_URL || "https://your-project.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "your-anon-key";
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.locals.supabase = supabase;

app.use("/api/auth", require("./routes/auth"));
app.use("/api/dealers", require("./routes/dealers"));
app.use("/api/parts", require("./routes/parts"));
app.use("/api/products", require("./routes/products"));
app.use("/api/suppliers", require("./routes/suppliers"));
app.use("/api/quotations", require("./routes/quotations"));
app.use("/api/billing", require("./routes/billing"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/purchase-orders", require("./routes/purchaseOrders"));

app.get("/api/health", (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`WAMS Backend running on port ${PORT}`);
  });
}

module.exports = app;