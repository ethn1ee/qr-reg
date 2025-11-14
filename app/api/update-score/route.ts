
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const { row, score } = await req.json();

    if (!row || !score) {
      return NextResponse.json({ error: 'Missing row or score' }, { status: 400 });
    }

    // Vercel automatically sets NODE_ENV to 'production'
    const isProduction = process.env.NODE_ENV === 'production';

    const auth = new google.auth.GoogleAuth({
      // Use credentials from environment variables in production
      // and the key file in development
      credentials: isProduction ? {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // The private key must have newlines replaced with \\n in the environment variable
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } : undefined,
      keyFile: isProduction ? undefined : 'credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.SPREADSHEET_ID;
    const scoreColumn = process.env.SCORE_COLUMN || 'G'; // Configurable score column, defaults to G

    // Fetch the current score first
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Sheet1!${scoreColumn}${row}`,
    });

    const currentScore = parseInt(getResponse.data.values?.[0]?.[0] || '0', 10);
    const newScore = currentScore + parseInt(score, 10);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!${scoreColumn}${row}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newScore]],
      },
    });

    return NextResponse.json({ success: true, newScore });
  } catch (error: any) {
    console.error(error);
    // Provide a more specific error message if credentials are the issue
    if (error.message.includes('credential')) {
      return NextResponse.json({ error: 'Authentication failed. Please check server credentials.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
