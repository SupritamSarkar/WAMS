const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('billing')
      .select('*, dealers(name, company_name)')
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
      .from('billing')
      .select('*, dealers(name, company_name)')
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
    const { dealer_id, invoice_number, items, total_amount, status = 'pending', due_date } = req.body;
    const { data, error } = await supabase
      .from('billing')
      .insert([{ dealer_id, invoice_number, items, total_amount, status, due_date }])
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
    const { dealer_id, invoice_number, items, total_amount, status, due_date } = req.body;
    const { data, error } = await supabase
      .from('billing')
      .update({ dealer_id, invoice_number, items, total_amount, status, due_date })
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
      .from('billing')
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
      .from('billing')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Bill deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;