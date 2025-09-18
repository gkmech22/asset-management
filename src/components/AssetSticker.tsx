import * as React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Asset } from "@/hooks/useAssets";

interface AssetStickerProps {
  asset: Asset | null;
}

declare global {
  interface Window {
    JsBarcode: any;
  }
}

export const AssetSticker: React.FC<AssetStickerProps> = ({ asset }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log("AssetSticker: Rendering with asset:", asset);

    if (!asset) {
      setIsLoading(false);
      setError("No asset provided for sticker generation.");
      return;
    }

    const loadJsBarcode = () => {
      if (window.JsBarcode) {
        console.log("AssetSticker: JsBarcode already loaded");
        setIsLoading(false);
        return;
      }

      console.log("AssetSticker: Loading JsBarcode");
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";
      script.async = true;
      script.onload = () => {
        console.log("AssetSticker: JsBarcode loaded successfully");
        setIsLoading(false);
      };
      script.onerror = () => {
        console.error("AssetSticker: Failed to load JsBarcode");
        setError("Failed to load barcode library.");
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    loadJsBarcode();
  }, [asset]);

  const generateSticker = React.useCallback(() => {
    if (!asset || !canvasRef.current || isLoading) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set actual canvas size (60mm x 40mm at 300 DPI = 708 x 472 pixels)
      const dpi = 300;
      const widthInMM = 60;
      const heightInMM = 40;
      const widthPx = Math.round((widthInMM / 25.4) * dpi);
      const heightPx = Math.round((heightInMM / 25.4) * dpi);
      
      canvas.width = widthPx;
      canvas.height = heightPx;

      // Set canvas display size
      canvas.style.width = "240px";
      canvas.style.height = "160px";

      // Fill white background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, widthPx, heightPx);

      // Set black color for text and borders
      ctx.fillStyle = "#000000";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;

      // Draw border
      ctx.strokeRect(4, 4, widthPx - 8, heightPx - 8);

      // Calculate layout
      const padding = 20;
      const barcodeHeight = 80;
      const textAreaHeight = heightPx - barcodeHeight - padding * 3;

      // Company name
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Quick Heal", widthPx / 2, padding + 28);

      // Asset details in smaller font
      ctx.font = "16px Arial";
      ctx.textAlign = "left";
      
      let yPos = padding + 60;
      const lineHeight = 20;
      
      ctx.fillText(`ID: ${asset.asset_id}`, padding, yPos);
      yPos += lineHeight;
      ctx.fillText(`Model: ${asset.name}`, padding, yPos);
      yPos += lineHeight;
      ctx.fillText(`S/N: ${asset.serial_number}`, padding, yPos);

      // Generate barcode in the bottom section
      if (window.JsBarcode && canvasRef.current) {
        try {
          const barcodeCanvas = document.createElement("canvas");
          window.JsBarcode(barcodeCanvas, asset.asset_id, {
            format: "CODE128",
            width: 2,
            height: 60,
            fontSize: 12,
            textMargin: 5,
            margin: 0,
            background: "#FFFFFF",
            lineColor: "#000000",
          });

          // Draw barcode onto main canvas
          const barcodeY = heightPx - barcodeHeight - 10;
          const barcodeX = (widthPx - barcodeCanvas.width) / 2;
          ctx.drawImage(barcodeCanvas, barcodeX, barcodeY);
        } catch (barcodeError) {
          console.error("AssetSticker: Error generating barcode:", barcodeError);
          // Fallback: draw text instead of barcode
          ctx.font = "14px Arial";
          ctx.textAlign = "center";
          ctx.fillText(asset.asset_id, widthPx / 2, heightPx - 20);
        }
      }
      
      console.log("AssetSticker: Sticker generated successfully");
    } catch (err) {
      console.error("AssetSticker: Error generating sticker:", err);
      setError("Failed to generate sticker.");
    }
  }, [asset, isLoading]);

  React.useEffect(() => {
    if (!isLoading && asset) {
      // Small delay to ensure JsBarcode is fully loaded
      const timer = setTimeout(generateSticker, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, asset, generateSticker]);

  const handlePrint = () => {
    if (!canvasRef.current) return;

    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const printWindow = window.open("", "_blank");
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Asset Sticker - ${asset?.asset_id}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh;
                  background: white;
                }
                img { 
                  width: 60mm; 
                  height: 40mm; 
                  border: 1px solid #000;
                }
                @media print {
                  body { padding: 0; margin: 0; }
                  img { 
                    width: 60mm; 
                    height: 40mm; 
                    page-break-inside: avoid;
                  }
                }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" alt="Asset Sticker" />
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (err) {
      console.error("AssetSticker: Error printing sticker:", err);
      setError("Failed to print sticker.");
    }
  };

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Loading barcode library...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No asset selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          className="border border-gray-300 rounded"
          style={{ 
            width: "240px", 
            height: "160px",
            imageRendering: "pixelated"
          }}
        />
      </div>
      
      <div className="flex justify-center gap-2">
        <Button onClick={handlePrint} className="bg-gradient-primary hover:shadow-glow transition-smooth">
          <Printer className="h-4 w-4 mr-2" />
          Print Sticker
        </Button>
        <Button variant="outline" onClick={generateSticker}>
          Regenerate
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        <p>Sticker Size: 60mm × 40mm</p>
        <p>Asset ID: {asset.asset_id}</p>
      </div>
    </div>
  );
};