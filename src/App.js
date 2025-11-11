import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Download } from 'lucide-react';

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setResult('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setScanning(true);
      
      scanIntervalRef.current = setInterval(() => {
        captureAndDecode();
      }, 500);
      
    } catch (err) {
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
      console.error(err);
    }
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setScanning(false);
  };

  const captureAndDecode = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      setResult(code.data);
      stopScanning();
    }
  };

  const toggleCamera = () => {
    stopScanning();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(() => startScanning(), 100);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-center gap-3">
            <Camera size={32} />
            <h1 className="text-2xl font-bold">Escáner QR</h1>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {!scanning && !result && (
            <div className="text-center">
              <div className="mb-6 p-8 bg-gray-100 rounded-xl">
                <Camera size={64} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Presiona el botón para escanear un código QR</p>
              </div>
              <button
                onClick={startScanning}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                Iniciar Escáner
              </button>
            </div>
          )}

          {scanning && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                />
                <div className="absolute inset-0 border-4 border-white opacity-50 m-8 rounded-lg"></div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="flex gap-2">
                <button
                  onClick={toggleCamera}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  Cambiar Cámara
                </button>
                <button
                  onClick={stopScanning}
                  className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Detener
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                <h3 className="text-green-800 font-semibold mb-2">✓ Código detectado:</h3>
                <p className="text-gray-800 break-all font-mono text-sm">{result}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Copiar
                </button>
                <button
                  onClick={() => {
                    setResult('');
                    startScanning();
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Camera size={20} />
                  Escanear Otro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js"></script>
    </div>
  );
}