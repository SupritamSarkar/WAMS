const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('transactions')
      .select('*, products(name), dealers(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('transactions')
      .select('*, products(name), dealers(name)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { product_id, dealer_id, quantity, unit_price, total_amount, status = 'pending', transaction_type } = req.body;
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ product_id, dealer_id, quantity, unit_price, total_amount, status, transaction_type }])
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { product_id, dealer_id, quantity, unit_price, total_amount, status, transaction_type } = req.body;
    const { data, error } = await supabase
      .from('transactions')
      .update({ product_id, dealer_id, quantity, unit_price, total_amount, status, transaction_type })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { status } = req.body;
    const { data, error } = await supabase
      .from('transactions')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;