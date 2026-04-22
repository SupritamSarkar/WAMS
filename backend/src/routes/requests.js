const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('dealer_requests')
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
      .from('dealer_requests')
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
    const { dealer_id, product_id, quantity, status = 'pending', notes } = req.body;
    const { data, error } = await supabase
      .from('dealer_requests')
      .insert([{ dealer_id, product_id, quantity, status, notes }])
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
    const { dealer_id, product_id, quantity, status, notes } = req.body;
    const { data, error } = await supabase
      .from('dealer_requests')
      .update({ dealer_id, product_id, quantity, status, notes })
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
      .from('dealer_requests')
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
      .from('dealer_requests')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Request deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;