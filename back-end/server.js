import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import expressSession from 'express-session';
import cors from 'cors';
import puppeteer from 'puppeteer';
import pool from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);  // directory of current file

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'https://agreeable-pond-00427160f.6.azurestaticapps.net',
  credentials: true
}));

// express sessions to track user sessions
app.use(expressSession({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false, // recommended
  cookie: {
    secure: true,            // ensure it's HTTPS-only
    sameSite: 'none'         // allow cross-origin cookies
  }
}));

// express static middleware to serve frontend files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Post creation route
app.post('/api/create-post', upload.single('image'), async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not authenticated' });

  const { title, description } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await pool.query(
      'INSERT INTO posts (post_title, username, description, image_path) VALUES (?, ?, ?, ?)',
      [title, req.session.user.username, description, imagePath]
    );
    res.status(201).json({ message: 'Post created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load posts' });
  }
});

app.get('/api/saved-plants', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT Saved_Plants FROM users WHERE id = ?',
      [req.session.user.id]
    );

    const saved = rows[0]?.Saved_Plants || '';
    const symbols = saved.split(',').map(s => s.trim()).filter(Boolean);
    if (symbols.length === 0) return res.json([]);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const results = [];

    for (const symbol of symbols) {
      const url = `https://plants.usda.gov/plant-profile/${symbol}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      await page.waitForSelector('h1', { timeout: 10000 }).catch(() => { });
      await page.waitForSelector('table.usa-table', { timeout: 10000 }).catch(() => { });

      const plantData = await page.evaluate((symbol) => {
        const getText = (selector) => {
          const el = document.querySelector(selector);
          return el ? el.textContent.trim() : 'Not found';
        };

        const rows = document.querySelectorAll('table.usa-table tr');
        const plantInfo = {};
        rows.forEach(row => {
          const header = row.querySelector('th h3');
          const td = row.querySelector('td');
          if (header && td) {
            plantInfo[header.textContent.trim()] = td.textContent.trim();
          }
        });

        let scientificName = '';
        const h1 = document.querySelector('h1');
        if (h1) {
          const i = h1.querySelector('i');
          scientificName = i ? i.textContent.trim() : h1.textContent.trim();
        }

        const h2 = document.querySelector('h2');
        const commonName = h2 ? h2.textContent.trim() : 'Unknown';

        return {
          symbol,
          scientific_name: scientificName,
          common_name: commonName,
          group: plantInfo['Group'] || 'Not found',
          duration: plantInfo['Duration'] || 'Not found',
          growth_habit: plantInfo['Growth Habit'] || plantInfo['Growth Habits'] || 'Not found',
          native_status: plantInfo['Native Status'] || 'Not found',
          url: `https://plants.usda.gov/plant-profile/${symbol}`
        };
      }, symbol);

      results.push(plantData);
    }

    await browser.close();
    res.json(results);
  } catch (err) {
    console.error("Failed to fetch saved plant data:", err);
    res.status(500).json({ message: 'Internal error' });
  }
});

app.post('/api/save-plant', async (req, res) => {
  const { symbol } = req.body;

  if (!req.session.user) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  if (!symbol) {
    return res.status(400).json({ message: 'Missing plant symbol' });
  }

  try {
    const userId = req.session.user.id;

    // Get current saved list
    const [rows] = await pool.query('SELECT Saved_Plants FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const saved = rows[0].Saved_Plants;
    let savedList = [];

    if (saved) {
      savedList = saved.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (!savedList.includes(symbol)) {
      savedList.push(symbol);
      await pool.query('UPDATE users SET Saved_Plants = ? WHERE id = ?', [savedList.join(','), userId]);
    }

    res.json({ message: 'Plant saved!', saved: savedList });
  } catch (err) {
    console.error('Save plant error:', err);
    res.status(500).json({ message: 'Failed to save plant' });
  }
});

app.get('/api/plant-info', async (req, res) => {
  const { name, state } = req.query;

  if (!name || !state) {
    return res.status(400).json({ error: 'Missing plant name or state' });
  }

  const validStates = ['wv', 'va', 'pa', 'oh', 'hi', 'ga', 'fl', 'de', 'ct', 'co', 'ca', 'az', 'ar', 'al', 'ak'];
  const table = `${state.toLowerCase()}plants`;

  if (!validStates.includes(state.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid state code' });
  }

  let browser;
  try {
    const [rows] = await pool.query(
      `SELECT Symbol FROM \`${table}\` WHERE State_Common_Name = ? LIMIT 1`,
      [name]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Plant not found in database' });
    }

    const symbol = rows[0].Symbol;
    const url = `https://plants.usda.gov/plant-profile/${symbol}`;

    // Launch browser
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set user agent to mimic a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to the page and wait for content to load
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for specific elements to ensure page is loaded
    await page.waitForSelector('h1', { timeout: 10000 }).catch(() => { });
    await page.waitForSelector('table.usa-table', { timeout: 10000 }).catch(() => { });

    // Extract the data
    const plantData = await page.evaluate(() => {
      // Scientific name
      let scientificName = '';
      const h1 = document.querySelector('h1');
      if (h1) {
        const italicElement = h1.querySelector('i');
        if (italicElement) {
          scientificName = italicElement.textContent.trim();
          // Get the full text to include author
          const fullText = h1.textContent.trim();
          const author = fullText.replace(scientificName, '').trim();
          if (author) {
            scientificName += ' ' + author;
          }
        } else {
          scientificName = h1.textContent.trim();
        }
      }

      // Common name
      const h2 = document.querySelector('h2');
      const commonName = h2 ? h2.textContent.trim() : '';

      // Parse general information table
      const plantInfo = {};
      const rows = document.querySelectorAll('table.usa-table tr');

      rows.forEach(row => {
        const header = row.querySelector('th h3');
        if (header) {
          const headerText = header.textContent.trim();
          const td = row.querySelector('td');

          if (td) {
            // Handle multiple values (like Growth Habits)
            const spans = td.querySelectorAll('span');
            let value = '';

            if (spans.length > 0) {
              value = Array.from(spans)
                .map(span => span.textContent.trim())
                .filter(text => text.length > 0)
                .join(', ');
            } else {
              value = td.textContent.trim();
            }

            plantInfo[headerText] = value;
          }
        }
      });

      return {
        scientificName,
        commonName,
        plantInfo
      };
    });

    await browser.close();

    // Extract specific fields
    const { scientificName, commonName, plantInfo } = plantData;
    const group = plantInfo['Group'] || 'Not found';
    const duration = plantInfo['Duration'] || 'Not found';
    const growth = plantInfo['Growth Habits'] || plantInfo['Growth Habit'] || 'Not found';
    const nativeStatus = plantInfo['Native Status'] || 'Not found';

    // Try to find family information from database
    let family = 'Not found';
    try {
      const [familyRows] = await pool.query(
        `SELECT Family FROM \`${table}\` WHERE State_Common_Name = ? LIMIT 1`,
        [name]
      );
      if (familyRows.length > 0 && familyRows[0].Family) {
        family = familyRows[0].Family;
      }
    } catch (dbError) {
      console.log('Could not fetch family from database:', dbError.message);
    }

    // Debug logging
    console.log('Parsed plant info:', plantInfo);
    console.log('Scientific name:', scientificName);
    console.log('Common name:', commonName);

    res.json({
      common_name: commonName || name,
      scientific_name: scientificName || 'Not found',
      symbol: symbol,
      group: group,
      duration: duration,
      growth_habit: growth,
      native_status: nativeStatus,
      family: family,
      url: url
    });

  } catch (err) {
    console.error('Error fetching plant data:', err.message);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to fetch USDA data' });
  }
});

app.get('/api/plant-search', async (req, res) => {
  const search = `%${req.query.q}%`;
  const state = req.query.state?.toLowerCase();
  const validStates = ['wv', 'va', 'pa', 'oh', 'hi', 'ga', 'fl', 'de', 'ct', 'co', 'ca', 'az', 'ar', 'al', 'ak'];
  if (!state || !validStates.includes(state)) {
    return res.status(400).json({ message: 'Invalid or missing state parameter' });
  }
  const table = `${state}plants`;

  try {
    const [results] = await pool.query(
      `SELECT DISTINCT State_Common_Name
       FROM \`${table}\`
       WHERE State_Common_Name IS NOT NULL
       ORDER BY State_Common_Name ASC
       LIMIT 11000`,
      [search]
    );

    const suggestions = results.map(row => ({
      value: row.State_Common_Name,
      label: row.State_Common_Name
    }));

    res.json(suggestions);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).send('Server error');
  }
});

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
      req.session.user = { id: user.id, username: user.username };
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

app.get('/profile', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT username, Saved_Plants FROM users WHERE id = ?',
      [req.session.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    const savedList = user.Saved_Plants
      ? user.Saved_Plants.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    res.json({
      username: user.username,
      plantCount: savedList.length
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/update-profile', (req, res) => {
  res.send('This is the update profile page. Use POST to actually update your profile.');
});

app.post('/update-profile', async (req, res) => {
  console.log("Request body:", req.body);

  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  try {
    const [result] = await pool.query(
      'UPDATE users SET username = ? WHERE id = ?',
      [username, req.session.user.id]
    );

    console.log('Database result:', result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: "Profile updated successfully!", username });

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app._router.stack
  .filter(r => r.route && r.route.methods.get)
  .forEach(r => {
    console.log(`GET${r.route.path}`);
  });

// starting server: displaying URL in console
const BACKEND_PORT = process.env.BACKEND_PORT;
app.listen(BACKEND_PORT, () => {
  console.log(`Server is running on port ${BACKEND_PORT}`);
})
