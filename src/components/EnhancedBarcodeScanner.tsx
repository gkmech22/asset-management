import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ZoomIn, ZoomOut, ScanBarcode } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { useToast } from '@/hooks/use-toast';

interface EnhancedBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  totalIFPQty?: string;
  existingSerials?: string[];
}

export const EnhancedBarcodeScanner = ({
  isOpen,
  onClose,
  onScan,
  totalIFPQty = '0',
  existingSerials = [],
}: EnhancedBarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setIsScanning(true);

      // Initialize code reader if not already created
      if (!codeReader.current) {
        codeReader.current = new BrowserMultiFormatReader();
        codeReader.current.timeBetweenDecodingAttempts = 100; // Adjust for performance
      }

      const videoElement = videoRef.current;
      if (!videoElement) {
        throw new Error('Video element not found');
      }

      // Request camera access with optimal constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
        },
      }).catch(async (err) => {
        console.error('Primary camera access failed:', err);
        // Fallback to lower resolution
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 640, height: 480 },
        });
      });

      videoElement.srcObject = stream;
      streamRef.current = stream;

      videoElement.setAttribute('playsinline', 'true');
      videoElement.setAttribute('webkit-playsinline', 'true');

      // Wait for video to be ready
      await videoElement.play();

      // Ensure video is ready before decoding
      const checkVideo = () => {
        if (videoElement.readyState >= 3) { // HAVE_FUTURE_DATA or higher
          if (codeReader.current) {
            codeReader.current.decodeFromVideoDevice(undefined, videoElement, (result, err) => {
              if (result) {
                const scannedText = result.getText().trim();
                validateAndHandleScan(scannedText);
              }
              // Log errors except NotFoundException
              if (err && err.name !== 'NotFoundException') {
                console.error('Decoding error:', err);
              }
            });
          }
        } else {
          setTimeout(checkVideo, 100);
        }
      };
      checkVideo();
    } catch (err) {
      console.error('Scanner initialization error:', err);
      toast({
        title: 'Camera Error',
        description: 'Failed to access camera. Please ensure permissions are granted and try again.',
        variant: 'destructive',
      });
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
      codeReader.current = null; // Clean up reader
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  const validateAndHandleScan = (scannedText: string) => {
    if (!scannedText) {
      toast({
        title: 'Invalid Scan',
        description: 'No valid barcode detected.',
        variant: 'destructive',
      });
      return;
    }

    const isDuplicate = existingSerials.some((item) => item === scannedText);
    const ifpQty = parseInt(totalIFPQty, 10) || 0;
    const isWithinLimit = ifpQty === 0 || existingSerials.length < ifpQty;

    if (isDuplicate) {
      toast({
        title: 'Duplicate Serial Number',
        description: `Serial number ${scannedText} has already been added.`,
        variant: 'destructive',
      });
    } else if (!isWithinLimit) {
      toast({
        title: 'Quantity Limit Reached',
        description: `Cannot add more than ${ifpQty} serial numbers.`,
        variant: 'destructive',
      });
    } else {
      onScan(scannedText);
      toast({
        title: 'Serial Number Scanned',
        description: `Serial number ${scannedText} scanned successfully`,
      });
      stopScanning();
      onClose();
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ScanBarcode className="h-5 w-5" />
              Scan Barcode
            </h3>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-48 object-cover"
                autoPlay
                playsInline
                muted
                style={{
                  imageRendering: 'crisp-edges',
                  filter: 'contrast(1.2) brightness(1.2)',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-out',
                }}
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-primary bg-transparent w-3/4 h-1/4 rounded-lg">
                    <div className="absolute -top-1 -left-1 w-6 h-6">
                      <div className="absolute top-0 left-0 w-full h-1 bg-primary rounded"></div>
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded"></div>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6">
                      <div className="absolute top-0 right-0 w-full h-1 bg-primary rounded"></div>
                      <div className="absolute top-0 right-0 w-1 h-full bg-primary rounded"></div>
                    </div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6">
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded"></div>
                      <div className="absolute bottom-0 left-0 w-1 h-full bg-primary rounded"></div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6">
                      <div className="absolute bottom-0 right-0 w-full h-1 bg-primary rounded"></div>
                      <div className="absolute bottom-0 right-0 w-1 h-full bg-primary rounded"></div>
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 right-2 flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 bg-black/50 border-white/20 text-white hover:bg-white/20"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 bg-black/50 border-white/20 text-white hover:bg-white/20"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
              {zoom > 1 && (
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {zoom.toFixed(1)}x
                </div>
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>Barcode will be scanned automatically</p>
              <p className="text-xs">🔍 Use zoom controls to adjust focus</p>
              <p className="text-xs">📱 Keep steady and ensure good lighting</p>
            </div>

            <Button variant="outline" className="w-full" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBarcodeScanner;