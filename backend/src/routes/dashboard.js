const express = require('express');
const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    
    const [dealers, products, parts, suppliers, transactions, quotations, billing] = await Promise.all([
      supabase.from('dealers').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('parts').select('id', { count: 'exact', head: true }),
      supabase.from('suppliers').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('id', { count: 'exact', head: true }),
      supabase.from('quotations').select('id', { count: 'exact', head: true }),
      supabase.from('billing').select('id', { count: 'exact', head: true }),
    ]);
    
    res.json({
      dealers: dealers.count || 0,
      products: products.count || 0,
      parts: parts.count || 0,
      suppliers: suppliers.count || 0,
      transactions: transactions.count || 0,
      quotations: quotations.count || 0,
      bills: billing.count || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/low-stock', async (req, res) => {
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

router.get('/recent-transactions', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('transactions')
      .select('*, products(name), dealers(name, company_name)')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent-orders', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('dealer_requests')
      .select('*, dealers(name, company_name)')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sales-report', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .select('total_amount, created_at')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'completed');
    
    if (error) throw error;
    
    const totalSales = data.reduce((sum, t) => sum + (t.total_amount || 0), 0);
    const transactionCount = data.length;
    
    res.json({ totalSales, transactionCount, period });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;