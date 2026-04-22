const express = require("express");
const dashboardRouter = require("./dashboard");

const router = express.Router();

router.use("/", dashboardRouter);

router.get("/stock-requirements", async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    const [{ data: parts, error: partsError }, { data: products, error: productsError }] = await Promise.all([
      supabase.from("parts").select("id, name, quantity, min_quantity, unit_price"),
      supabase.from("products").select("id, name, quantity, min_quantity, unit_price"),
    ]);

    if (partsError || productsError) {
      throw partsError || productsError;
    }

    const partRequirements = (parts || [])
      .filter((part) => Number(part.quantity || 0) < Number(part.min_quantity || 0))
      .map((part) => ({
        type: "raw_material",
        item_id: part.id,
        item_name: part.name,
        current_quantity: part.quantity,
        minimum_quantity: part.min_quantity,
        required_quantity: Number(part.min_quantity || 0) - Number(part.quantity || 0),
      }));

    const productRequirements = (products || [])
      .filter((product) => Number(product.quantity || 0) < Number(product.min_quantity || 0))
      .map((product) => ({
        type: "finished_product",
        item_id: product.id,
        item_name: product.name,
        current_quantity: product.quantity,
        minimum_quantity: product.min_quantity,
        required_quantity: Number(product.min_quantity || 0) - Number(product.quantity || 0),
      }));

    res.json({
      generated_at: new Date().toISOString(),
      requirements: [...partRequirements, ...productRequirements],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
