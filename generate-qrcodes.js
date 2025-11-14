const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'qrcodes');

// --- Configuration ---
const START_NUMBER = 201;
const END_NUMBER = 230;
// -------------------

const generate = async () => {
  try {
    // 1. Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
      console.log(`Created directory: ${outputDir}`);
    }

    console.log(`Generating QR codes from ${START_NUMBER} to ${END_NUMBER}...`);

    // 2. Loop through the numbers and generate a QR code for each
    for (let i = START_NUMBER; i <= END_NUMBER; i++) {
      const data = String(i); // The data for the QR code is the number itself
      const filePath = path.join(outputDir, `${i}.png`);
      
      await QRCode.toFile(filePath, data, {
        errorCorrectionLevel: 'H', // High error correction
        width: 512 // Image width in pixels
      });

      // Log progress
      process.stdout.write(`Generated: ${i}.png   \r`);
    }

    console.log(`\n\n✅ Success! All QR codes have been generated in the "${outputDir}" folder.`);

  } catch (err) {
    console.error('❌ An error occurred:', err);
  }
};

generate();
