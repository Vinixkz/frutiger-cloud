require('dotenv').config();

const path = require('path');
const express = require('express');
const multer = require('multer');

const db = require('./database');
const { hashPassword, comparePassword, signToken } = require('./auth');
const { authenticateToken } = require('./middleware');
const {
  createUserFolder,
  uploadFileToFolder,
  listFilesInFolder,
  deleteFile,
  getDownloadLink
} = require('./drive');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files so the app can run locally with one command.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required.' });
  }

  try {
    const passwordHash = await hashPassword(password);
    const driveFolderId = await createUserFolder(username);

    db.run(
      `INSERT INTO users (username, email, password_hash, drive_folder_id) VALUES (?, ?, ?, ?)`,
      [username, email, passwordHash, driveFolderId],
      function onInsert(err) {
        if (err) {
          return res.status(400).json({ error: 'Username or email already exists.' });
        }

        const user = { id: this.lastID, username, email };
        const token = signToken(user);
        return res.status(201).json({ message: 'Registration successful.', token, user });
      }
    );
  } catch (error) {
    return res.status(500).json({ error: `Registration failed: ${error.message}` });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = signToken(user);
    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  });
});

app.get('/api/me', authenticateToken, (req, res) => {
  db.get(
    `SELECT id, username, email, drive_folder_id FROM users WHERE id = ?`,
    [req.user.userId],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      return res.json({ user });
    }
  );
});

app.post('/api/files/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided.' });
  }

  db.get(
    `SELECT drive_folder_id FROM users WHERE id = ?`,
    [req.user.userId],
    async (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      try {
        const uploadedFile = await uploadFileToFolder(user.drive_folder_id, req.file);
        return res.json({ message: 'File uploaded.', file: uploadedFile });
      } catch (error) {
        return res.status(500).json({ error: `Upload failed: ${error.message}` });
      }
    }
  );
});

app.get('/api/files', authenticateToken, (req, res) => {
  db.get(
    `SELECT drive_folder_id FROM users WHERE id = ?`,
    [req.user.userId],
    async (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      try {
        const files = await listFilesInFolder(user.drive_folder_id);
        return res.json({ files });
      } catch (error) {
        return res.status(500).json({ error: `Could not list files: ${error.message}` });
      }
    }
  );
});

app.delete('/api/files/:fileId', authenticateToken, async (req, res) => {
  try {
    await deleteFile(req.params.fileId);
    return res.json({ message: 'File deleted.' });
  } catch (error) {
    return res.status(500).json({ error: `Delete failed: ${error.message}` });
  }
});

app.get('/api/files/:fileId/download', authenticateToken, async (req, res) => {
  try {
    const streamResponse = await getDownloadLink(req.params.fileId);
    streamResponse.data.pipe(res);
  } catch (error) {
    return res.status(500).json({ error: `Download failed: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Frutiger Cloud server running on http://localhost:${PORT}`);
});
