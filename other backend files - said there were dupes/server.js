import express from 'express';
import bcrypt from 'bcryptjs';
import expressSession from 'express-session';
import pool from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);  // directory of current file

const app = express();
app.use(express.json());

// express sessions to track user sessions
app.use(expressSession({
  secret: 'secretkey',  // need to change to something more secure
  resave: false,
  saveUninitialized: true
}));

// express static middleware to serve frontend files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// route to home
app.get('/', (req, res) => {
  res.send('Welcome to the GrowZone API!');
});

// route to login
app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'userLogin.html'));
});

// route to registration
app.get('/register', (req, res) => {
  res.sendFile(path.join(frontendPath, 'userRegister.html'));
});

// login post route: handles user login by checking against database

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

    const user = rows[0];  // Assuming the first result is the correct user: not sure if this needs to change
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      req.session.user = user;
      return res.json({ message: 'Login successful!' });
    } else {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});

// register post route: handles user registration by checking if the user already exists and hashing the password before storing it in the database
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

    res.json({ message: 'Registration successful!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during registration' });
  }
});

// starting server: displaying URL in console
app.listen(4002, () => {
  console.log('Server is running on http://localhost:4002');
});