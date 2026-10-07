const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const dbConfig = {
  host: process.env.DB_HOST || 'mysql-db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'job_board',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function initDB() {
  let retries = 10;
  while (retries > 0) {
    try {
      pool = mysql.createPool(dbConfig);
      const conn = await pool.getConnection();
      console.log('Connected to MySQL successfully!');

      // Tạo bảng users
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          fullname VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tạo bảng jobs
      await conn.query(`
        CREATE TABLE IF NOT EXISTS jobs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          company VARCHAR(255) NOT NULL,
          location VARCHAR(255) NOT NULL,
          salary VARCHAR(100),
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tạo bảng applications
      await conn.query(`
        CREATE TABLE IF NOT EXISTS applications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          job_id INT,
          applicant_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          cv_link VARCHAR(500),
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tạo tài khoản mặc định kim123 / 123
      const [existingUser] = await conn.query('SELECT * FROM users WHERE username = ?', ['kim123']);
      if (existingUser.length === 0) {
        await conn.query(
          'INSERT INTO users (username, password, fullname) VALUES (?, ?, ?)',
          ['kim123', '123', 'Sinh viên Kim (dtc245200861)']
        );
        console.log('Default user kim123 created!');
      }

      // Thêm dữ liệu việc làm mẫu nếu bảng rỗng
      const [rows] = await conn.query('SELECT COUNT(*) as count FROM jobs');
      if (rows[0].count === 0) {
        await conn.query(`
          INSERT INTO jobs (title, company, location, salary, description) VALUES
          ('Frontend Developer (React/Vue)', 'FPT Software', 'Hà Nội', '15 - 25 Triệu', 'Lập trình viên Frontend có kinh nghiệm 1 năm'),
          ('Backend Developer (NodeJS/Express)', 'Viettel Digital', 'Hà Nội / Remote', '20 - 35 Triệu', 'Phát triển microservices, API Gateway'),
          ('DevOps / Cloud Engineer', 'VNG Corporation', 'Hồ Chí Minh', '25 - 45 Triệu', 'Quản trị hệ thống Docker, K8s, CI/CD, Prometheus & Grafana')
        `);
        console.log('Sample jobs inserted!');
      }

      conn.release();
      break;
    } catch (err) {
      console.log('Waiting for MySQL to be ready... Retrying in 3s. Error:', err.message);
      retries--;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

// API Health / Status check
app.get('/api/status', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ status: 'Connecting', error: 'Database initializing...' });
    }
    const [result] = await pool.query('SELECT 1 + 1 AS solution, NOW() as server_time');
    res.json({
      status: 'Hệ thống và Database đang chạy thành công!',
      result: result[0].solution,
      serverTime: result[0].server_time,
      studentId: 'dtc245200861'
    });
  } catch (err) {
    res.status(500).json({ status: 'Database error', error: err.message });
  }
});

// API Đăng nhập
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Tên đăng nhập và mật khẩu là bắt buộc' });
  }
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }
    const user = users[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Đăng ký tài khoản
app.post('/api/register', async (req, res) => {
  const { username, password, fullname } = req.body;
  if (!username || !password || !fullname) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại trên hệ thống' });
    }
    await pool.query('INSERT INTO users (username, password, fullname) VALUES (?, ?, ?)', [username, password, fullname]);
    res.json({ success: true, message: 'Đăng ký tài khoản thành công!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Lấy danh sách việc làm
app.get('/api/jobs', async (req, res) => {
  try {
    const [jobs] = await pool.query('SELECT * FROM jobs ORDER BY id DESC');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Đăng tin tuyển dụng mới
app.post('/api/jobs', async (req, res) => {
  const { title, company, location, salary, description } = req.body;
  if (!title || !company) {
    return res.status(400).json({ error: 'Tiêu đề và Công ty là bắt buộc' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO jobs (title, company, location, salary, description) VALUES (?, ?, ?, ?, ?)',
      [title, company, location || 'Toàn quốc', salary || 'Thỏa thuận', description || '']
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Ứng tuyển / Nộp CV
app.post('/api/apply', async (req, res) => {
  const { job_id, applicant_name, email, cv_link } = req.body;
  if (!applicant_name || !email) {
    return res.status(400).json({ error: 'Họ tên và Email là bắt buộc' });
  }
  try {
    await pool.query(
      'INSERT INTO applications (job_id, applicant_name, email, cv_link) VALUES (?, ?, ?, ?)',
      [job_id, applicant_name, email, cv_link || '']
    );
    res.json({ success: true, message: 'Nộp CV thành công!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log('Server running on port ' + port);
  initDB();
});
