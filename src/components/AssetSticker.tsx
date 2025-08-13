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
        setIsLoading(false);
        setError("Failed to load barcode library. Please check your internet connection.");
      };
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    };

    const renderSticker = () => {
      if (!asset || !canvasRef.current || typeof window.JsBarcode !== "function") {
        console.error("AssetSticker: Cannot render sticker", { asset, canvas: !!canvasRef.current, jsBarcode: typeof window.JsBarcode });
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) {
        console.error("AssetSticker: Canvas 2D context is null");
        setError("Failed to initialize canvas.");
        return;
      }

      // Dimensions: 1.0in x 0.6in at 203 DPI to match printer
      const dpi = 203;
      const inchToPx = dpi;
      const widthPx = 1.0 * inchToPx; // 1.0 inch width
      const heightPx = 0.6 * inchToPx; // 0.6 inch height

      // Set canvas size
      canvas.width = widthPx;
      canvas.height = heightPx;

      // Clear canvas with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, widthPx, heightPx);

      // Adjust for high DPI
      ctx.scale(dpi / 96, dpi / 96); // Scale to account for 96 DPI browser default

      // Optimize for barcode printer
      ctx.imageSmoothingEnabled = false; // Prevent blurry scaling
      ctx.textRendering = "optimizeLegibility";

      // Content dimensions (optimized for smaller sticker)
      const titleFontSize = 8;
      const barcodeHeight = 6.25; // 6.25 mm height as requested
      const serialFontSize = 6;
      const assetIdFontSize = 6;
      const spacing = 4;
      const totalContentHeight = titleFontSize + barcodeHeight + serialFontSize + assetIdFontSize + 3 * spacing;

      // Position content at bottom and center with offset
      const centerX = (widthPx / (dpi / 96)) / 2;
      let currentY = (heightPx / (dpi / 96)) - totalContentHeight + 1; // Offset of 1

      // Title text
      ctx.font = `bold ${titleFontSize}px "Microsoft Sans Serif"`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "black";
      ctx.fillText("Asset Management", centerX, currentY);
      currentY += titleFontSize + spacing;

      // Generate and draw barcode
      const barcodeCanvas = document.createElement("canvas");
      try {
        window.JsBarcode(barcodeCanvas, asset.serial_number, {
          format: "CODE39", // Changed to Code39 as requested
          width: 0.250, // Narrow element width 0.250 mm
          height: barcodeHeight, // 6.25 mm height
          displayValue: false,
          margin: 0,
          background: "#FFFFFF",
          lineColor: "#000000",
          wideNarrowRatio: 3, // Wide/Narrow ratio derived from 0.750/0.250 = 3
        });
        const barcodeWidth = Math.min(barcodeCanvas.width * 0.9, (widthPx / (dpi / 96)) * 0.9);
        const x = ((widthPx / (dpi / 96)) - barcodeWidth) / 2;
        ctx.drawImage(barcodeCanvas, x, currentY, barcodeWidth, barcodeHeight);
        currentY += barcodeHeight + spacing;
      } catch (e) {
        console.error("AssetSticker: Barcode generation failed", e);
        ctx.font = `${serialFontSize}px "Microsoft Sans Serif"`;
        ctx.fillText("Barcode Error", centerX, currentY);
        currentY += serialFontSize + spacing;
      }

      // Serial Number text
      ctx.font = `bold ${serialFontSize}px "Microsoft Sans Serif"`;
      ctx.fillText(asset.serial_number || "N/A", centerX, currentY);
      currentY += serialFontSize + spacing;

      // Asset ID text
      ctx.font = `bold ${assetIdFontSize}px "Microsoft Sans Serif"`;
      ctx.fillText(`${asset.asset_id || "N/A"}`, centerX, currentY);

      // Reset scale
      ctx.scale(96 / dpi, 96 / dpi);
    };

    loadJsBarcode();
    if (!isLoading && asset) {
      console.log("AssetSticker: Triggering renderSticker");
      renderSticker();
    }
  }, [asset, isLoading]);

  const handlePrintSticker = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png", 1.0); // High quality PNG
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Asset Sticker</title>
              <style>
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  width: 1.0in;
                  height: 0.6in;
                  background: white;
                }
                img {
                  width: 1.0in;
                  height: 0.6in;
                  image-rendering: pixelated;
                }
                @media print {
                  @page {
                    size: 1.0in 0.6in; /* Match printer setup */
                    margin: 0;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                    width: 1.0in;
                    height: 0.6in;
                    display: block;
                  }
                  img {
                    width: 1.0in !important;
                    height: 0.6in !important;
                    display: block;
                    image-rendering: pixelated;
                  }
                }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" />
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => {
          printWindow.print();
          setTimeout(() => printWindow.close(), 1000);
        };
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
    <div className="space-y-4 flex flex-col items-center w-full">
      <div className="w-full h-[60vh] flex justify-center items-center">
        <canvas
          ref={canvasRef}
          className="border-4 border-red-500 bg-gray-100"
          style={{ 
            width: "100%", 
            height: "100%", 
            maxWidth: "250px", 
            maxHeight: "150px", 
            imageRendering: "pixelated" 
          }}
        />
      </div>
      <Button
        onClick={handlePrintSticker}
        className="bg-gradient-primary hover:shadow-glow transition-smooth"
      >
        Print
      </Button>
    </div>
  );
};