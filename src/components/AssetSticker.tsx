import * as React from "react";
import { Button } from "@/components/ui/button";
import { Asset } from "@/hooks/useAssets";

interface AssetStickerProps {
  asset: Asset | null;
}

export const AssetSticker: React.FC<AssetStickerProps> = ({ asset }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log("AssetSticker: Rendering with asset:", asset);

    // Handle null asset
    if (!asset) {
      setIsLoading(false);
      setError("No asset provided for sticker generation.");
      return;
    }

    // Load JsBarcode library
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
        setIsLoading(false);
        setError("Failed to load barcode library. Please check your internet connection.");
      };
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    };

    // Render the sticker
    const renderSticker = () => {
      if (!asset || !canvasRef.current || typeof window.JsBarcode !== "function") {
        console.error("AssetSticker: Cannot render sticker", { asset, canvas: !!canvasRef.current, jsBarcode: typeof window.JsBarcode });
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("AssetSticker: Canvas 2D context is null");
        setError("Failed to initialize canvas.");
        return;
      }

      // Fixed dimensions in mm at 300 DPI
      const mmToPx = 11.811; // 300 DPI / 25.4 mm per inch
      const widthPx = 60 * mmToPx; // 60mm width
      const heightPx = 40 * mmToPx; // 40mm height

      // Set canvas size
      canvas.width = widthPx;
      canvas.height = heightPx;
      canvas.style.width = `${60}mm`;
      canvas.style.height = `${40}mm`;

      // Clear canvas and draw border
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, widthPx, heightPx);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, widthPx - 4, heightPx - 4);

      // Content dimensions
      const titleFontSize = 36;
      const barcodeHeight = heightPx * 0.3;
      const serialFontSize = 28;
      const assetIdFontSize = 28;
      const spacing = 20;
      const totalContentHeight = titleFontSize + barcodeHeight + serialFontSize + assetIdFontSize + 3 * spacing;

      // Center content vertically
      const centerX = widthPx / 2;
      let currentY = (heightPx - totalContentHeight) / 2 + titleFontSize / 2;

      // Title text
      ctx.font = `bold ${titleFontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "black";
      ctx.fillText("Asset Management System", centerX, currentY);
      currentY += titleFontSize + spacing;

      // Generate and draw barcode
      const barcodeCanvas = document.createElement("canvas");
      try {
        window.JsBarcode(barcodeCanvas, asset.serial_number, {
          format: "CODE128",
          width: 2,
          height: barcodeHeight,
          displayValue: false,
          margin: 0,
        });
        const barcodeWidth = Math.min(barcodeCanvas.width * 0.8, widthPx * 0.8);
        const x = (widthPx - barcodeWidth) / 2;
        ctx.drawImage(barcodeCanvas, x, currentY, barcodeWidth, barcodeHeight);
        currentY += barcodeHeight + spacing;
      } catch (e) {
        console.error("AssetSticker: Barcode generation failed", e);
        ctx.font = `${serialFontSize}px Arial`;
        ctx.fillText("Barcode Error", centerX, currentY);
        currentY += serialFontSize + spacing;
      }

      // Serial Number text
      ctx.font = `bold ${serialFontSize}px Arial`;
      ctx.fillText(asset.serial_number || "N/A", centerX, currentY);
      currentY += serialFontSize + spacing;

      // Asset ID text
      ctx.font = `bold ${assetIdFontSize}px Arial`;
      ctx.fillText(`${asset.asset_id || "N/A"}`, centerX, currentY);
    };

    loadJsBarcode();
    if (!isLoading && asset) {
      console.log("AssetSticker: Triggering renderSticker");
      renderSticker();
    }
  }, [asset, isLoading]);

  // Handle sticker printing
  const handlePrintSticker = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Asset Sticker</title>
              <style>
                @media print {
                  body { margin: 0; }
                  img { width: 60mm; height: 40mm; }
                }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        console.error("AssetSticker: Failed to open print window");
        setError("Unable to open print window.");
      }
    } else {
      console.error("AssetSticker: Canvas ref is null");
      setError("Canvas not available for printing.");
    }
  };

  if (!asset) {
    return <div className="text-center py-4 text-destructive">No asset selected</div>;
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-4 flex flex-col items-center">
      <canvas
        ref={canvasRef}
        className="border-4 border-red-500 bg-gray-100"
      />
      <Button
        onClick={handlePrintSticker}
        className="bg-gradient-primary hover:shadow-glow transition-smooth"
      >
        Print
      </Button>
    </div>
  );
};