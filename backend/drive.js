const { google } = require('googleapis');
const { Readable } = require('stream');

const MAIN_FOLDER_NAME = 'frutiger-cloud';

function getDriveClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive credentials are not configured in environment variables.');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/drive']
  });

  return google.drive({ version: 'v3', auth });
}

async function ensureMainFolder(drive) {
  const response = await drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.folder' and name = '${MAIN_FOLDER_NAME}' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: MAIN_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    },
    fields: 'id'
  });

  return folder.data.id;
}

async function createUserFolder(username) {
  const drive = getDriveClient();
  const mainFolderId = await ensureMainFolder(drive);

  // Reuse the user's folder if it already exists to avoid duplicates.
  const existing = await drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.folder' and name = '${username}' and '${mainFolderId}' in parents and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (existing.data.files.length > 0) {
    return existing.data.files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: username,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [mainFolderId]
    },
    fields: 'id'
  });

  return folder.data.id;
}

async function uploadFileToFolder(folderId, file) {
  const drive = getDriveClient();

  const response = await drive.files.create({
    requestBody: {
      name: file.originalname,
      parents: [folderId]
    },
    media: {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer)
    },
    fields: 'id, name'
  });

  return response.data;
}

async function listFilesInFolder(folderId) {
  const drive = getDriveClient();
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, modifiedTime)',
    spaces: 'drive'
  });

  return response.data.files;
}

async function deleteFile(fileId) {
  const drive = getDriveClient();
  await drive.files.delete({ fileId });
}

async function getDownloadLink(fileId) {
  const drive = getDriveClient();
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  return response;
}

module.exports = {
  createUserFolder,
  uploadFileToFolder,
  listFilesInFolder,
  deleteFile,
  getDownloadLink
};
