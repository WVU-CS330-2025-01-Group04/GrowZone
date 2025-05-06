import mysql from 'mysql2/promise';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Azure's root certificate
const caCert = fs.readFileSync(path.join(__dirname, 'DigiCertGlobalRootCA.crt.pem'));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    ca: caCert,
    rejectUnauthorized: true
  }
});

pool.getConnection()
  .then(conn => {
    console.log('Successfully connected to MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('MySQL connection failed on startup:', err);
  });

export default pool;
