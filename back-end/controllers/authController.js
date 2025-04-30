const bcrypt = require('bcryptjs');
const db = require('../db');

exports.registerUser = async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
  db.query(query, [username, hashedPassword], (err, result) => {
    if (err) return res.status(500).send('Error registering user');
    req.session.userId = result.insertId;
    res.send('User registered successfully');
  });
};

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], async (err, result) => {
    if (err || result.length === 0) return res.status(400).send('Invalid username or password');

    const user = result[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).send('Invalid username or password');

    req.session.userId = user.id;
    res.send('Login successful');
  });
};

exports.checkAuth = (req, res) => {
  if (req.session.userId) {
    res.send('User authenticated');
  } else {
    res.send('User not authenticated');
  }
};