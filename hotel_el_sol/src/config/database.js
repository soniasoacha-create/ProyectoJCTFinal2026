import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD, // SONIAs1234*
  database: process.env.DB_DATABASE, // bd_hotelelsol_test
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});