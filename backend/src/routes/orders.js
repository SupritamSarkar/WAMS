const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from("dealer_requests")
      .select("*, dealers(name, company_name), products(name, sku, unit_price)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { dealer_id, product_id, quantity, notes } = req.body;
    const supabase = req.app.locals.supabase;

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, quantity, unit_price")
      .eq("id", product_id)
      .single();
    if (productError) throw productError;

    const status = product.quantity >= quantity ? "pending" : "waiting_for_production";
    const { data, error } = await supabase
      .from("dealer_requests")
      .insert([{ dealer_id, product_id, quantity, status, notes }])
      .select()
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/approve", async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from("dealer_requests")
      .update({ status: "approved" })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/fulfill", async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data: order, error: orderError } = await supabase
      .from("dealer_requests")
      .select("id, dealer_id, product_id, quantity")
      .eq("id", req.params.id)
      .single();
    if (orderError) throw orderError;

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, quantity, unit_price")
      .eq("id", order.product_id)
      .single();
    if (productError) throw productError;
    if (product.quantity < order.quantity) {
      return res.status(400).json({ error: "Insufficient stock to fulfill this order." });
    }

    const updatedQty = product.quantity - order.quantity;
    const totalAmount = order.quantity * Number(product.unit_price || 0);

    const [{ error: stockError }, { data: bill, error: billError }, { error: transactionError }, { data: fulfilledOrder, error: fulfillError }] =
      await Promise.all([
        supabase.from("products").update({ quantity: updatedQty }).eq("id", order.product_id),
        supabase
          .from("billing")
          .insert([
            {
              dealer_id: order.dealer_id,
              invoice_number: `INV-${Date.now()}`,
              items: [{ product_id: order.product_id, quantity: order.quantity, unit_price: product.unit_price }],
              total_amount: totalAmount,
              status: "generated",
            },
          ])
          .select()
          .single(),
        supabase.from("transactions").insert([
          {
            product_id: order.product_id,
            dealer_id: order.dealer_id,
            quantity: order.quantity,
            unit_price: product.unit_price,
            total_amount: totalAmount,
            status: "completed",
            transaction_type: "supply",
          },
        ]),
        supabase
          .from("dealer_requests")
          .update({ status: "fulfilled" })
          .eq("id", req.params.id)
          .select()
          .single(),
      ]);

    if (stockError || billError || transactionError || fulfillError) {
      throw stockError || billError || transactionError || fulfillError;
    }

    res.json({ order: fulfilledOrder, bill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
