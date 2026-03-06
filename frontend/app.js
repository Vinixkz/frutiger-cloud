// Shared helper for API calls with JWT token support.
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = options.headers || {};

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Unexpected request error.');
  }

  return data;
}

function setStatus(message, isError = false) {
  const statusEl = document.getElementById('status');
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ffd7d7' : '#e5fff1';
}

function saveSession(payload) {
  localStorage.setItem('token', payload.token);
  localStorage.setItem('user', JSON.stringify(payload.user));
}

function requireAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = new FormData(registerForm);
    const payload = {
      username: form.get('username'),
      email: form.get('email'),
      password: form.get('password')
    };

    try {
      const result = await apiFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      saveSession(result);
      setStatus('Account created! Redirecting to dashboard...');
      setTimeout(() => (window.location.href = '/dashboard.html'), 600);
    } catch (error) {
      setStatus(error.message, true);
    }
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = new FormData(loginForm);
    const payload = {
      email: form.get('email'),
      password: form.get('password')
    };

    try {
      const result = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      saveSession(result);
      setStatus('Login successful! Redirecting...');
      setTimeout(() => (window.location.href = '/dashboard.html'), 500);
    } catch (error) {
      setStatus(error.message, true);
    }
  });
}

const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
  requireAuth();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const welcomeTitle = document.getElementById('welcomeTitle');
  if (welcomeTitle && user.username) {
    welcomeTitle.textContent = `Welcome, ${user.username}`;
  }

  uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(uploadForm);

    try {
      await apiFetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      setStatus('File uploaded to Google Drive folder.');
      uploadForm.reset();
    } catch (error) {
      setStatus(error.message, true);
    }
  });
}

const fileList = document.getElementById('fileList');
if (fileList) {
  requireAuth();

  async function loadFiles() {
    try {
      const result = await apiFetch('/api/files');
      fileList.innerHTML = '';

      if (result.files.length === 0) {
        fileList.innerHTML = '<li class="file-item">No files uploaded yet.</li>';
        return;
      }

      result.files.forEach((file) => {
        const li = document.createElement('li');
        li.className = 'file-item';

        const meta = document.createElement('span');
        meta.textContent = `${file.name} (${file.size || 'unknown'} bytes)`;

        const actions = document.createElement('div');
        actions.className = 'actions';

        const download = document.createElement('a');
        download.className = 'button-link';
        download.textContent = 'Download';
        download.href = `/api/files/${file.id}/download`;

        const del = document.createElement('button');
        del.textContent = 'Delete';
        del.addEventListener('click', async () => {
          try {
            await apiFetch(`/api/files/${file.id}`, { method: 'DELETE' });
            setStatus(`Deleted ${file.name}`);
            loadFiles();
          } catch (error) {
            setStatus(error.message, true);
          }
        });

        actions.append(download, del);
        li.append(meta, actions);
        fileList.appendChild(li);
      });
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  document.getElementById('refreshBtn')?.addEventListener('click', loadFiles);
  loadFiles();
}

document.getElementById('logoutBtn')?.addEventListener('click', logout);
