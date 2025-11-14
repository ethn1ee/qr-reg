
'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

// Helper component for the success/error overlay
const StatusOverlay = ({ message, isError }: { message: string; isError: boolean }) => (
  <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}>
    <div className={`p-8 rounded-lg shadow-2xl text-center ${isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
      <p className="text-2xl font-bold">{message}</p>
    </div>
  </div>
);

export default function QrScanner() {
  const [score, setScore] = useState(10);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [], // Use all supported scan types
    };

    const qrScanner = new Html5Qrcode('qr-reader');
    scannerRef.current = qrScanner;

    const onScanSuccess = (decodedText: string) => {
      if (!isNaN(Number(decodedText))) {
        handleUpdateScore(decodedText);
      } else {
        showStatus(`Invalid QR Code: Not a row number: ${decodedText}`, true);
      }
    };

    const onScanError = (error: any) => {
      // This callback is called frequently, so we'll keep it quiet
      // console.warn(`QR scan error: ${error}`);
    };

    qrScanner.start({ facingMode: 'environment' }, config, onScanSuccess, onScanError)
      .catch(err => {
        console.error("Unable to start scanner", err);
        showStatus("Could not start camera.", true);
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, []);

  const showStatus = (message: string, error: boolean) => {
    setStatusMessage(message);
    setIsError(error);
    setTimeout(() => {
      setStatusMessage(null);
    }, 2000); // Message disappears after 2 seconds
  };

  const handleUpdateScore = async (scannedRow: string) => {
    // Prevent multiple submissions while one is in progress
    if (statusMessage) return;

    setStatusMessage('Updating...');
    setIsError(false);

    try {
      const response = await fetch('/api/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row: scannedRow, score }),
      });

      const data = await response.json();

      if (response.ok) {
        showStatus(`Row ${scannedRow} updated! New Score: ${data.newScore}`, false);
      } else {
        showStatus(`Error: ${data.error}`, true);
      }
    } catch (error) {
      showStatus('Network error. Please try again.', true);
    }
  };

  return (
    <div className="w-full h-screen bg-black">
      {statusMessage && <StatusOverlay message={statusMessage} isError={isError} />}
      
      <div id="qr-reader" className="w-full h-full"></div>

      <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-90 p-4 shadow-t-lg backdrop-blur-sm">
        <div className="max-w-md mx-auto text-center">
          <label htmlFor="score" className="block text-lg font-medium text-gray-800 mb-2">
            Score to Award
          </label>
          <div className="flex items-center justify-center space-x-4">
            <button 
              onClick={() => setScore(s => Math.max(0, s - 5))}
              className="px-4 py-2 text-2xl font-bold text-white bg-blue-500 rounded-full shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              -
            </button>
            <input
              type="number"
              id="score"
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value, 10) || 0)}
              className="w-24 text-center text-3xl font-bold border-none bg-transparent focus:ring-0"
            />
            <button 
              onClick={() => setScore(s => s + 5)}
              className="px-4 py-2 text-2xl font-bold text-white bg-blue-500 rounded-full shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
