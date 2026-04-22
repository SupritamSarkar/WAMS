const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('quotations')
      .select('*, suppliers(name), parts(name)')
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
      .from('quotations')
      .select('*, suppliers(name), parts(name)')
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
    const { supplier_id, part_id, price, delivery_date, valid_until, status = 'pending' } = req.body;
    const { data, error } = await supabase
      .from('quotations')
      .insert([{ supplier_id, part_id, price, delivery_date, valid_until, status }])
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
    const { supplier_id, part_id, price, delivery_date, valid_until, status } = req.body;
    const { data, error } = await supabase
      .from('quotations')
      .update({ supplier_id, part_id, price, delivery_date, valid_until, status })
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
      .from('quotations')
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
      .from('quotations')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Quotation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;