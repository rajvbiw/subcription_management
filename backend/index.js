const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Check if user is admin
const requireAdmin = async (req, res, next) => {
  const result = await query('SELECT role FROM users WHERE id = $1', [req.userId]);
  if (result.rows[0]?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ---------- Auth ----------
app.post('/api/auth/register', async (req, res) => {
  const { email, password, planId = 1 } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password_hash, plan_id) VALUES ($1, $2, $3) RETURNING id',
      [email, hashed, planId]
    );
    res.status(201).json({ message: 'User created', userId: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await query(`
      SELECT u.id, u.email, u.password_hash, u.role, p.name as plan_name, p.id as plan_id
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.email = $1
    `, [email]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, plan_name: user.plan_name, plan_id: user.plan_id } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Usage ----------
// Get usage for the last 7 days
app.get('/api/usage', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    // Fetch metrics for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    }).reverse();

    const fetchMetricWithBalance = async (activityType) => {
      // 1. Get initial balance (sum of all activity before the last 6 days)
      const initialRes = await query(
        `SELECT SUM(value) as balance FROM usage_logs 
         WHERE user_id = $1 AND metric_type = $2 AND recorded_date < CURRENT_DATE - 6`,
        [userId, activityType]
      );
      let currentBalance = parseInt(initialRes.rows[0]?.balance || 0);

      // 2. Get activity for the last 7 days
      const activityRes = await query(
        `SELECT to_char(recorded_date, 'YYYY-MM-DD') as date_str, value FROM usage_logs 
         WHERE user_id = $1 AND metric_type = $2 AND recorded_date >= CURRENT_DATE - 6
         ORDER BY recorded_date`,
        [userId, activityType]
      );
      
      const activityMap = new Map(activityRes.rows.map(r => [r.date_str, parseInt(r.value)]));
      
      // 3. Build the 7-day cumulative trend
      return last7Days.map(date => {
        currentBalance += activityMap.get(date) || 0;
        return { date, value: Math.max(0, currentBalance) }; // Ensure balance doesn't drop below 0
      });
    };

    const apiCallsActivity = await fetchMetricWithBalance('api_calls_activity');
    const storageActivity = await fetchMetricWithBalance('storage_mb_activity');

    res.json({
      apiCalls: apiCallsActivity, // Use cumulative activity as the main trend
      storage: storageActivity
    });
  } catch (err) {
    console.error('[Fetch Usage Error]:', err);
    res.status(500).json({ message: err.message });
  }
});

// Record an API call (increment or decrement for today)
app.post('/api/usage/api-call', authenticate, async (req, res) => {
  const { count = 1 } = req.body;
  const safeCount = parseInt(count) || 1;
  const insertVal = Math.max(0, safeCount); // For first insert, never negative
  try {
    // 1. Update the cumulative total (never drops below 0)
    await query(
      `INSERT INTO usage_logs (user_id, metric_type, value, recorded_date)
       VALUES ($1, 'api_calls', $2, CURRENT_DATE)
       ON CONFLICT (user_id, metric_type, recorded_date)
       DO UPDATE SET value = GREATEST(0, usage_logs.value + $3::integer)`,
      [req.userId, insertVal, safeCount]
    );
    
    // 2. Track today's net activity (can go negative)
    await query(
      `INSERT INTO usage_logs (user_id, metric_type, value, recorded_date)
       VALUES ($1, 'api_calls_activity', $2, CURRENT_DATE)
       ON CONFLICT (user_id, metric_type, recorded_date)
       DO UPDATE SET value = usage_logs.value + $2::integer`,
      [req.userId, safeCount]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('[API Usage Error]:', err);
    res.status(500).json({ message: err.message });
  }
});

// Record storage usage (add or remove MB)
app.post('/api/usage/storage', authenticate, async (req, res) => {
  const { mb } = req.body;
  const safeMb = parseInt(mb) || 0;
  const insertVal = Math.max(0, safeMb); // For first insert, never negative
  try {
    // 1. Update the cumulative total (never drops below 0)
    await query(
      `INSERT INTO usage_logs (user_id, metric_type, value, recorded_date)
       VALUES ($1, 'storage_mb', $2, CURRENT_DATE)
       ON CONFLICT (user_id, metric_type, recorded_date)
       DO UPDATE SET value = GREATEST(0, usage_logs.value + $3::integer)`,
      [req.userId, insertVal, safeMb]
    );

    // 2. Track today's net activity (can go negative)
    await query(
      `INSERT INTO usage_logs (user_id, metric_type, value, recorded_date)
       VALUES ($1, 'storage_mb_activity', $2, CURRENT_DATE)
       ON CONFLICT (user_id, metric_type, recorded_date)
       DO UPDATE SET value = usage_logs.value + $2::integer`,
      [req.userId, safeMb]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[Storage Usage Error]:', err);
    res.status(500).json({ message: err.message });
  }
});

// ---------- Admin ----------
app.get('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.email, u.role, p.name as plan_name, p.id as plan_id
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/admin/users/:userId/plan', authenticate, requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const { planId } = req.body;
  try {
    await query('UPDATE users SET plan_id = $1 WHERE id = $2', [planId, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/plans', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query('SELECT * FROM plans ORDER BY price');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/plans', authenticate, requireAdmin, async (req, res) => {
  const { name, price } = req.body;
  try {
    const result = await query('INSERT INTO plans (name, price) VALUES ($1, $2) RETURNING *', [name, price]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));