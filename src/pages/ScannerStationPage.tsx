import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, Wifi, CheckCircle, XCircle, Loader2, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsQR from 'jsqr';
import { useSearchParams } from 'react-router-dom';

export const ScannerStationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const stationId = searchParams.get('station');
  
  const [stationInfo, setStationInfo] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanningRef = useRef(false);

  // Fetch station info
  useEffect(() => {
    if (stationId) {
      fetchStationInfo();
    }
  }, [stationId]);

  const fetchStationInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('qr_scanner_stations')
        .select('*')
        .eq('id', stationId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setStationInfo(data);
    } catch (error) {
      console.error('Failed to fetch station info:', error);
      toast.error('Invalid or inactive scanner station');
    }
  };

  // Start camera
  useEffect(() => {
    if (scanning) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [scanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanningRef.current = true;
        scanQRCode();
      }
      
      setCameraError(null);
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Unable to access camera. Please check permissions.');
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    scanningRef.current = false;
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const scanQRCode = () => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      handleQRCodeDetected(code.data);
    } else {
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleQRCodeDetected = async (qrData: string) => {
    scanningRef.current = false;
    stopCamera();

    try {
      const { data, error } = await supabase.functions.invoke('validate-attendance-qr', {
        body: {
          token: qrData,
          stationId,
          stationLocation: stationInfo?.location
        }
      });

      if (error) throw error;

      setScanResult(data);
      setShowResult(true);

      if (data.success) {
        toast.success(data.message);
        
        // Broadcast to other tabs/windows to sync their time tracking state
        try {
          const syncChannel = new BroadcastChannel('time-tracking-sync');
          syncChannel.postMessage({ 
            type: data.action === 'clock_in' ? 'clock-in' : 'clock-out',
            timestamp: Date.now()
          });
          syncChannel.close();
        } catch (broadcastError) {
          console.warn('BroadcastChannel not supported:', broadcastError);
        }
      } else {
        // Better error messaging based on scan status
        const scanStatus = data.scanStatus || '';
        let errorMessage = data.error;
        
        if (scanStatus === 'expired') {
          errorMessage = '⏰ QR Code Expired - Generate a new one';
        } else if (scanStatus === 'already_used') {
          errorMessage = '🔄 QR Code Already Used - Generate a new one';
        } else if (scanStatus === 'schedule_required') {
          errorMessage = '📅 Schedule Required - Contact your manager';
        } else if (scanStatus === 'invalid') {
          errorMessage = '❌ Invalid QR Code - Please try again';
        }
        
        toast.error(errorMessage);
      }

      // Auto-hide result and restart scanning after 3 seconds for success, 4 seconds for errors
      setTimeout(() => {
        setShowResult(false);
        setScanResult(null);
        setScanning(true);
      }, data.success ? 3000 : 4000);

    } catch (error: any) {
      console.error('Scan validation error:', error);
      
      // Distinguish between network errors and validation errors
      const isNetworkError = error.message?.includes('Failed to fetch') || 
                            error.message?.includes('NetworkError');
      
      const errorMessage = isNetworkError 
        ? '📡 Network Error - Check your connection'
        : error.message || 'Scan validation failed';
      
      setScanResult({ 
        success: false, 
        error: errorMessage,
        isNetworkError 
      });
      setShowResult(true);
      toast.error(errorMessage);
      
      // Network errors get longer timeout and auto-restart
      setTimeout(() => {
        setShowResult(false);
        setScanResult(null);
        setScanning(true);
      }, isNetworkError ? 5000 : 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">QR Scanner Station</h1>
                {stationInfo && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    {stationInfo.station_name} - {stationInfo.location}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Scanner Area */}
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-2xl shadow-2xl border-2">
          <div className="p-8">
            {!scanning && !showResult ? (
              // Start Screen
              <div className="flex flex-col items-center gap-6 py-12">
                <div className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                  <QrCode className="h-24 w-24 text-primary" />
                </div>
                
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">Ready to Scan</h2>
                  <p className="text-muted-foreground max-w-md">
                    Click the button below to activate the scanner and scan employee QR codes
                  </p>
                </div>

                <Button 
                  onClick={() => setScanning(true)}
                  size="lg"
                  className="text-lg px-8 py-6 h-auto"
                >
                  <Camera className="h-6 w-6 mr-3" />
                  Start Scanning
                </Button>

                {cameraError && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg max-w-md">
                    <p className="text-sm text-destructive text-center">{cameraError}</p>
                  </div>
                )}
              </div>
            ) : showResult && scanResult ? (
              // Result Screen
              <div className="flex flex-col items-center gap-6 py-12">
                {scanResult.success ? (
                  <>
                    <div className="p-6 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 animate-pulse">
                      <CheckCircle className="h-24 w-24 text-green-600" />
                    </div>
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-green-600">Success!</h2>
                      <p className="text-lg font-medium">{scanResult.userName}</p>
                      <p className="text-muted-foreground">{scanResult.message}</p>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(scanResult.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-6 rounded-full bg-gradient-to-br from-destructive/20 to-red-600/20">
                      <XCircle className="h-24 w-24 text-destructive" />
                    </div>
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-bold text-destructive">Scan Failed</h2>
                      <p className="text-muted-foreground max-w-md">{scanResult.error}</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Scanning Screen
              <div className="space-y-6">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Scanning Frame */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-64 h-64">
                      {/* Corner Brackets */}
                      <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-lg animate-pulse" />
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-lg animate-pulse" />
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-lg animate-pulse" />
                      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-lg animate-pulse" />
                      
                      {/* Scanning Line */}
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary/50 animate-pulse" />
                    </div>
                  </div>

                  {/* Status Overlay */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                      <Camera className="h-3 w-3 mr-1" />
                      Scanning...
                    </Badge>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">Position QR Code in Frame</p>
                  <p className="text-sm text-muted-foreground">
                    Scanner will automatically detect and validate the code
                  </p>
                </div>

                <Button 
                  onClick={() => setScanning(false)}
                  variant="outline"
                  className="w-full"
                >
                  Stop Scanning
                </Button>
              </div>
            )}
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Station Active
            </div>
            {stationInfo?.last_scan_at && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Last scan: {new Date(stationInfo.last_scan_at).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ScannerStationPage;