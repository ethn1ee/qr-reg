
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const { row, score } = await req.json();

    if (!row || !score) {
      return NextResponse.json({ error: 'Missing row or score' }, { status: 400 });
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.SPREADSHEET_ID;
    const scoreColumn = 'C'; // Assuming Score is in column C

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
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
