
# Google Sheets API Setup Guide

To connect your web app to Google Sheets, you'll need to create a service account and authorize it to access your spreadsheet. Follow these steps:

## 1. Create a Google Cloud Project

If you don't have one already, create a new project in the [Google Cloud Console](https://console.cloud.google.com/).

## 2. Enable the Google Sheets API

- In your Google Cloud project, go to the "APIs & Services" > "Library" section.
- Search for "Google Sheets API" and enable it.

## 3. Create a Service Account

- Go to "APIs & Services" > "Credentials".
- Click "Create Credentials" and select "Service account".
- Give your service account a name (e.g., "sheets-updater").
- Grant the service account the "Editor" role.
- Click "Done".

## 4. Generate Service Account Keys

- In the "Credentials" page, find your newly created service account.
- Click on the service account to open its details.
- Go to the "Keys" tab.
- Click "Add Key" and select "Create new key".
- Choose "JSON" as the key type and click "Create".
- A JSON file with your service account credentials will be downloaded.

## 5. Share Your Google Sheet

- Open the Google Sheet you want to use.
- Click the "Share" button in the top right corner.
- In the "Share with people and groups" dialog, add the service account's email address (you can find it in the JSON credentials file under the `client_email` field).
- Give the service account "Editor" permissions.
- Click "Send".

## 6. Store Your Credentials Securely

- Rename the downloaded JSON file to `credentials.json`.
- **IMPORTANT:** Do not commit this file to your version control system (e.g., Git). It contains sensitive information.
- Add `credentials.json` to your `.gitignore` file.
- For this application, place the `credentials.json` file in the root of your project directory.

Now you're ready to use the Google Sheets API in your Next.js app.
