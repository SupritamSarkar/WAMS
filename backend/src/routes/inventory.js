const express = require("express");

const router = express.Router();

router.post("/stock-adjustments", async (req, res) => {
  try {
    const { item_type, item_id, quantity_change, reason = "manual_adjustment" } = req.body;
    const supabase = req.app.locals.supabase;

    if (!["part", "product"].includes(item_type)) {
      return res.status(400).json({ error: "item_type must be either part or product." });
    }

    const tableName = item_type === "part" ? "parts" : "products";
    const { data: item, error: fetchError } = await supabase
      .from(tableName)
      .select("id, quantity")
      .eq("id", item_id)
      .single();
    if (fetchError) throw fetchError;

    const newQuantity = Number(item.quantity || 0) + Number(quantity_change || 0);
    if (newQuantity < 0) {
      return res.status(400).json({ error: "Adjusted quantity cannot be negative." });
    }

    const { data, error } = await supabase
      .from(tableName)
      .update({ quantity: newQuantity })
      .eq("id", item_id)
      .select()
      .single();
    if (error) throw error;

    await supabase.from("stock_adjustments").insert([
      {
        item_type,
        item_id,
        quantity_change,
        reason,
      },
    ]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
