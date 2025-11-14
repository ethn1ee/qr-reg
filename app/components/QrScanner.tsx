
'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

// Helper component for the status overlay, now with a button
const StatusOverlay = ({
  message,
  isError,
  isUpdating,
  onClose
}: {
  message: string;
  isError: boolean;
  isUpdating: boolean;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
    <div className={`w-full max-w-sm p-6 rounded-xl shadow-2xl text-center ${isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
      <p className="text-2xl font-bold">{message}</p>
      {!isUpdating && (
        <button
          onClick={onClose}
          className="mt-6 w-full px-6 py-3 text-lg font-semibold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
        >
          OK
        </button>
      )}
    </div>
  </div>
);

export default function QrScanner() {
  const [score, setScore] = useState(10);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [],
    };

    const qrScanner = new Html5Qrcode('qr-reader');
    scannerRef.current = qrScanner;

    const onScanSuccess = (decodedText: string) => {
      // Stop further scans until user clicks OK
      if (scannerRef.current?.isScanning) {
        scannerRef.current.pause(true);
      }
      
      if (!isNaN(Number(decodedText))) {
        handleUpdateScore(decodedText);
      } else {
        setStatusMessage('Invalid QR Code: Not a row number.');
        setIsError(true);
        setIsUpdating(false);
      }
    };

    qrScanner.start({ facingMode: 'environment' }, config, onScanSuccess, undefined)
      .catch(err => {
        console.error("Unable to start scanner", err);
        setStatusMessage("Could not start camera.");
        setIsError(true);
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, []);

  const handleUpdateScore = async (scannedRow: string) => {
    setStatusMessage('Updating...');
    setIsError(false);
    setIsUpdating(true);

    try {
      const response = await fetch('/api/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row: scannedRow, score }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatusMessage(`Row ${scannedRow} updated! New Score: ${data.newScore}`);
        setIsError(false);
      } else {
        setStatusMessage(`Error: ${data.error}`);
        setIsError(true);
      }
    } catch (error) {
      setStatusMessage('Network error. Please try again.');
      setIsError(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseOverlay = () => {
    setStatusMessage(null);
    if (scannerRef.current) {
      scannerRef.current.resume();
    }
  };

  return (
    <div className="w-full h-screen bg-black">
      {statusMessage && (
        <StatusOverlay 
          message={statusMessage} 
          isError={isError} 
          isUpdating={isUpdating}
          onClose={handleCloseOverlay} 
        />
      )}
      
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
