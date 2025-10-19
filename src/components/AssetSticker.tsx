import * as React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
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
      if ((window as any).JsBarcode) {
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
      if (!asset || !canvasRef.current) {
        console.error("AssetSticker: Missing asset or canvas", { asset: !!asset, canvas: !!canvasRef.current });
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) {
        console.error("AssetSticker: Failed to get 2D context");
        setError("Failed to initialize canvas context.");
        return;
      }

      console.log("AssetSticker: Rendering sticker with dimensions", { width: canvas.width, height: canvas.height });

      // Label dimensions: 60 mm x 40 mm at 300 DPI
      const dpi = 300;
      const mmToInches = 25.4;
      const widthPx = Math.round((60 / mmToInches) * dpi); // 709 px
      const heightPx = Math.round((40 / mmToInches) * dpi); // 472 px

      // Set canvas size to full resolution
      canvas.width = widthPx;
      canvas.height = heightPx;

      // Clear canvas with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Optimize for sharpness
      ctx.imageSmoothingEnabled = false;
      ctx.textRendering = "geometricPrecision";

      // Adjusted dimensions to fit 300 DPI canvas
      const headerFontSize = 40; // Reduced to fit within height
      const barcodeHeight = 100; // Adjusted to fit within height
      const serialFontSize = 30; // Reduced to fit
      const assetIdFontSize = 30; // Reduced to fit
      const spacing = 20; // Adjusted spacing
      const totalContentHeight = headerFontSize + barcodeHeight + serialFontSize + assetIdFontSize + 5 * spacing;

      // Position content vertically with proper margins
      const centerX = widthPx / 2;
      let currentY = (heightPx - totalContentHeight) / 2;
      if (currentY < spacing * 2) {
        currentY = spacing * 2;
        console.warn("AssetSticker: Content height exceeds canvas, adjusting to minimum offset with margins");
      }

      // Header with top margin
      ctx.font = `bold ${headerFontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000000";
      ctx.fillText("Asset Management", centerX, Math.round(currentY));
      currentY += headerFontSize + spacing;

      // Barcode and serial number
      const barcodeCanvas = document.createElement("canvas");
      const serialNumber = asset.serial_number || "NO-SERIAL";
      try {
        console.log("AssetSticker: Generating barcode with serial:", serialNumber);
        (window as any).JsBarcode(barcodeCanvas, serialNumber, {
          format: "CODE128",
          width: 5, // Adjusted for fit and clarity
          height: barcodeHeight,
          displayValue: false,
          margin: 0,
          background: "#FFFFFF",
          lineColor: "#000000",
          quietZoneSize: 0.7, // Adjusted for fit
        });

        const barcodeWidth = Math.min(barcodeCanvas.width * 0.85, widthPx * 0.85);
        const x = Math.round((widthPx - barcodeWidth) / 2);
        ctx.drawImage(barcodeCanvas, x, Math.round(currentY), barcodeWidth, barcodeHeight);
        currentY += barcodeHeight + spacing * 1.5;

        ctx.font = `bold ${serialFontSize}px Arial`;
        ctx.fillStyle = "#000000";
        ctx.fillText(serialNumber || "N/A", centerX, Math.round(currentY));
        currentY += serialFontSize + spacing;
      } catch (e) {
        console.error("AssetSticker: Barcode generation failed", e);
        ctx.font = `${serialFontSize}px Arial`;
        ctx.fillStyle = "#000000";
        ctx.fillText("Barcode Error", centerX, Math.round(currentY));
        currentY += serialFontSize + spacing;
      }

      // Asset ID with bottom margin
      ctx.font = `bold ${assetIdFontSize}px Arial`;
      ctx.fillStyle = "#000000";
      ctx.fillText(`${asset.asset_id || "N/A"}`, centerX, Math.round(currentY));
      currentY += assetIdFontSize + spacing * 2;
    };

    loadJsBarcode();
    if (!isLoading && asset) {
      console.log("AssetSticker: Triggering renderSticker");
      renderSticker();
    }
  }, [asset, isLoading]);

  const handlePrintSticker = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png", 1.0);
      const printWindow = window.open("", "_blank");
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
                  width: 60mm;
                  height: 40mm;
                  background: white;
                }
                img {
                  width: 60mm;
                  height: 40mm;
                  image-rendering: pixelated;
                }
                @media print {
                  @page {
                    size: 60mm 40mm;
                    margin: 0;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                    width: 60mm;
                    height: 40mm;
                    display: block;
                  }
                  img {
                    width: 60mm !important;
                    height: 40mm !important;
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
    return <div className="text-center py-2 text-destructive">No asset selected</div>;
  }

  if (isLoading) {
    return <div className="text-center py-2">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-2 text-destructive">{error}</div>;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[700px] p-4">
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-300 bg-white shadow-md rounded"
        style={{
          width: "227px", // 60mm at 96 DPI
          height: "151px", // 40mm at 96 DPI
          imageRendering: "auto",
        }}
      />
      <Button
        onClick={handlePrintSticker}
        className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2"
        aria-label="Print sticker"
      >
        <Printer className="h-5 w-5 mr-2" />
        Print Sticker
      </Button>
    </div>
  );
};