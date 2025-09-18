import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Camera } from "lucide-react";
import { BrowserMultiFormatReader } from '@zxing/library';

interface EnhancedBarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
}

export const EnhancedBarcodeScanner: React.FC<EnhancedBarcodeScannerProps> = ({
  open,
  onClose,
  onScan,
  title = "Scan Barcode"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeReader] = useState(() => new BrowserMultiFormatReader());

  useEffect(() => {
    if (open) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open]);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setError(null);

      // Get available video devices
      const videoInputDevices = await navigator.mediaDevices.enumerateDevices()
        .then(devices => devices.filter(device => device.kind === 'videoinput'));
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Use the first available camera (usually back camera on mobile)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            console.log('Barcode scanned:', scannedText);
            onScan(scannedText);
            onClose();
          }
          if (error && !(error.name === 'NotFoundException')) {
            console.error('Scan error:', error);
          }
        }
      );
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start scanner');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader) {
      codeReader.reset();
    }
    setIsScanning(false);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error ? (
            <div className="text-center py-8">
              <div className="text-destructive mb-4">{error}</div>
              <Button onClick={startScanning} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg"
                autoPlay
                playsInline
                muted
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-primary w-48 h-32 opacity-50"></div>
                </div>
              )}
            </div>
          )}
          
          <div className="text-center text-sm text-muted-foreground">
            Position the barcode within the scanning area
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};