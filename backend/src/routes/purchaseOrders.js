const express = require("express");

const router = express.Router();

router.post("/:quotationId/confirm", async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { quotationId } = req.params;

    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", quotationId)
      .single();
    if (quotationError) throw quotationError;

    const { data: purchaseOrder, error: poError } = await supabase
      .from("purchase_orders")
      .insert([
        {
          supplier_id: quotation.supplier_id,
          part_id: quotation.part_id,
          quantity: quotation.quantity || 0,
          quoted_price: quotation.price,
          expected_delivery: quotation.delivery_date,
          status: "confirmed",
        },
      ])
      .select()
      .single();
    if (poError) throw poError;

    const { error: quotationUpdateError } = await supabase
      .from("quotations")
      .update({ status: "accepted" })
      .eq("id", quotationId);
    if (quotationUpdateError) throw quotationUpdateError;

    res.status(201).json(purchaseOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
