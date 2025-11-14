
const { google } = require('googleapis');
const { authenticate } = require('@google-cloud/local-auth');
const fs = require('fs').promises;
const path = require('path');

// --- Configuration ---
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const QR_CODES_DIR = path.join(__dirname, 'qrcodes');
const DRIVE_FOLDER_NAME = 'EmoryHacks2025QRCode';
const START_ROW = 2;
const END_ROW = 180;
const TARGET_COLUMN = 'E';
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];
// -------------------

// This function handles the OAuth2 authentication flow
async function authorize() {
  try {
    const auth = await authenticate({
      keyfilePath: path.join(__dirname, 'client_secret.json'),
      scopes: SCOPES,
    });
    return auth;
  } catch (err) {
    console.error('Authentication failed:', err.message);
    console.error('Please ensure you have downloaded the "client_secret.json" for a "Desktop app" OAuth client ID.');
    return null;
  }
}

async function findOrCreateFolder(drive) {
  const res = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${DRIVE_FOLDER_NAME}' and trashed=false`,
    fields: 'files(id)',
  });

  if (res.data.files.length > 0) {
    console.log(`Found existing folder: "${DRIVE_FOLDER_NAME}"`);
    return res.data.files[0].id;
  }

  console.log(`Creating new folder: "${DRIVE_FOLDER_NAME}"...`);
  const folder = await drive.files.create({
    resource: {
      name: DRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });
  return folder.data.id;
}

async function uploadQrCode(drive, folderId, rowNumber) {
  const filePath = path.join(QR_CODES_DIR, `${rowNumber}.png`);
  try {
    await fs.access(filePath);
  } catch {
    return null; // File doesn't exist
  }

  const fileMetadata = {
    name: `${rowNumber}.png`,
    parents: [folderId],
  };
  const media = {
    mimeType: 'image/png',
    body: require('fs').createReadStream(filePath),
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink',
  });

  // Make the file public so the =IMAGE() formula works
  await drive.permissions.create({
    fileId: file.data.id,
    resource: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return file.data.webViewLink;
}

function prepareSheetUpdateRequests(publicUrls) {
    const requests = [];
    for (const [row, url] of Object.entries(publicUrls)) {
        if (url) {
            requests.push({
                updateCells: {
                    start: {
                        sheetId: 0,
                        rowIndex: parseInt(row) - 1,
                        columnIndex: TARGET_COLUMN.charCodeAt(0) - 'A'.charCodeAt(0),
                    },
                    rows: [ { values: [ { userEnteredValue: { formulaValue: `=IMAGE("${url}")` } } ] } ],
                    fields: 'userEnteredValue',
                },
            });
        }
    }
    return requests;
}

async function main() {
  if (!SPREADSHEET_ID) {
    console.error('❌ Error: SPREADSHEET_ID is not set in your environment variables.');
    return;
  }

  try {
    console.log('Authenticating... Please check your browser.');
    const auth = await authorize();
    if (!auth) return;

    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    const folderId = await findOrCreateFolder(drive);
    const publicUrls = {};

    console.log(`
Uploading ${END_ROW - START_ROW + 1} QR codes to Google Drive...`);
    for (let i = START_ROW; i <= END_ROW; i++) {
      const url = await uploadQrCode(drive, folderId, i);
      if (url) {
        publicUrls[i] = url;
        process.stdout.write(`Uploaded QR code for row ${i}...`);
      }
    }

    console.log('\n\nPreparing to update Google Sheet...');
    const updateRequests = prepareSheetUpdateRequests(publicUrls);
    
    if (updateRequests.length > 0) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: updateRequests },
        });
        console.log('✅ Success! Your Google Sheet has been updated with the QR code images.');
    } else {
        console.log('No QR codes were found to upload.');
    }

  } catch (error) {
    console.error('\n❌ An error occurred:', error.message);
  }
}

main();
