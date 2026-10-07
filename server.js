const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static('public'));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql-db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'job_board',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/api/status', (req, res) => {
  pool.query('SELECT 1 + 1 AS solution', (error, results) => {
    if (error) {
      return res.status(500).json({ status: 'Database connection failed', error: error.message });
    }
    res.json({ status: 'Hệ thống và Database đang chạy thành công!', result: results[0].solution });
  });
});

app.listen(port, () => {
  console.log(\Server running at http://localhost:\\);
});
