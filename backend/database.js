const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Persistent SQLite database file at project root for easy local setup.
const dbPath = path.join(__dirname, '..', 'frutiger_cloud.db');
const db = new sqlite3.Database(dbPath);

// Initialize app tables if they don't exist.
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      drive_folder_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
