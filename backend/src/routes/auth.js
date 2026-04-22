const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'service-key';

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'staff' } = req.body;
    const supabase = req.app.locals.supabase;
    
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, name, role }])
      .select()
      .single();
    
    if (error) throw error;
    
    const token = jwt.sign({ id: data.id, email: data.email, role: data.role }, process.env.JWT_SECRET || 'secret');
    
    res.json({ user: { id: data.id, email: data.email, name: data.name, role: data.role }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const supabase = req.app.locals.supabase;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret');
    
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/change-password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    const supabase = req.app.locals.supabase;

    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single();
    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Old password is incorrect" });
    }

    const password = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase.from("users").update({ password }).eq("id", user.id);
    if (updateError) throw updateError;

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const supabase = req.app.locals.supabase;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', decoded.id)
      .single();
    
    if (error) throw error;
    
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;