const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .order('name', { ascending: true });
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
      .from('parts')
      .select('*')
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
    const { name, part_number, description, quantity, min_quantity, unit_price, supplier_id } = req.body;
    const { data, error } = await supabase
      .from('parts')
      .insert([{ name, part_number, description, quantity, min_quantity, unit_price, supplier_id }])
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
    const { name, part_number, description, quantity, min_quantity, unit_price, supplier_id } = req.body;
    const { data, error } = await supabase
      .from('parts')
      .update({ name, part_number, description, quantity, min_quantity, unit_price, supplier_id })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/quantity', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { quantity_change } = req.body;
    const { data: part, error: fetchError } = await supabase
      .from('parts')
      .select('quantity')
      .eq('id', req.params.id)
      .single();
    if (fetchError) throw fetchError;
    
    const newQuantity = part.quantity + quantity_change;
    const { data, error } = await supabase
      .from('parts')
      .update({ quantity: newQuantity })
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
      .from('parts')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Part deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/low-stock/all', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .lt('quantity', 'min_quantity')
      .order('quantity', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;