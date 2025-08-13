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

      // Label dimensions: 60 mm x 40 mm at 600 DPI
      const dpi = 600;
      const mmToInches = 25.4;
      const widthPx = (60 / mmToInches) * dpi; // 60 mm to inches * 600 DPI ≈ 1417 px
      const heightPx = (40 / mmToInches) * dpi; // 40 mm to inches * 600 DPI ≈ 945 px

      // Set canvas size
      canvas.width = Math.round(widthPx); // 1417 px
      canvas.height = Math.round(heightPx); // 945 px

      // Clear canvas with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Adjust for high DPI
      ctx.scale(dpi / 96, dpi / 96); // 100% scale to fit content

      // Optimize for barcode printer
      ctx.imageSmoothingEnabled = false; // Prevent blurry scaling
      ctx.textRendering = "optimizeLegibility";

      // Content dimensions with increased sizes and adjusted spacing
      const headerFontSize = 12; // Maintained at 12 px
      const barcodeHeight = 25; // Maintained at 15 mm
      const serialFontSize = 10; // Maintained at 10 px
      const assetIdFontSize = 10; // Maintained at 10 px
      const spacing = 3; // Maintained at 3 px for most spacing
      const totalContentHeight = headerFontSize + barcodeHeight + serialFontSize + assetIdFontSize + 4 * spacing;

      // Position content vertically
      const centerX = (canvas.width / (dpi / 96)) / 2;
      const availableHeight = canvas.height / (dpi / 96);
      let currentY = (availableHeight - totalContentHeight) / 2;

      if (currentY < 1) {
        currentY = 1;
        console.warn("AssetSticker: Content height exceeds canvas, adjusting to minimum offset");
      }

      // Header at top
      ctx.font = `bold ${headerFontSize}px "Arial"`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000000";
      ctx.fillText("Asset Management", centerX, currentY);
      currentY += headerFontSize + spacing;

      // Barcode and serial number in middle
      const barcodeCanvas = document.createElement("canvas");
      const serialNumber = asset.serial_number || "NO-SERIAL";
      try {
        console.log("AssetSticker: Generating barcode with serial:", serialNumber);
        window.JsBarcode(barcodeCanvas, serialNumber, {
          format: "CODE128",
          width: 1.5, // Maintained at 1.5 mm for wider barcode
          height: barcodeHeight,
          displayValue: false,
          margin: 0,
          background: "#FFFFFF",
          lineColor: "#000000",
          quietZone: 10, // Maintained
        });
        console.log("AssetSticker: Barcode canvas dimensions", {
          width: barcodeCanvas.width,
          height: barcodeCanvas.height
        });
        const barcodeWidth = Math.min(barcodeCanvas.width, (canvas.width / (dpi / 96)) * 0.85);
        const x = ((canvas.width / (dpi / 96)) - barcodeWidth) / 2;
        ctx.drawImage(barcodeCanvas, x, currentY, barcodeWidth, barcodeHeight);
        currentY += barcodeHeight + 5; // Maintained at 5 px spacing between barcode and serial number

        ctx.font = `bold ${serialFontSize}px "Arial"`;
        ctx.fillStyle = "#000000";
        ctx.fillText(serialNumber || "N/A", centerX, currentY);
        currentY += serialFontSize + spacing;
      } catch (e) {
        console.error("AssetSticker: Barcode generation failed", e);
        ctx.font = `${serialFontSize}px "Arial"`;
        ctx.fillStyle = "#000000";
        ctx.fillText("Barcode Error", centerX, currentY);
        currentY += serialFontSize + spacing;
      }

      // Asset ID at bottom
      ctx.font = `bold ${assetIdFontSize}px "Arial"`;
      ctx.fillStyle = "#000000";
      ctx.fillText(`${asset.asset_id || "N/A"}`, centerX, currentY);

      // Reset scale
      ctx.scale(96 / dpi, 96 / dpi); // Reset with 100% scale
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
                  width: 2.36in;
                  height: 1.57in;
                  background: white;
                }
                img {
                  width: 2.36in;
                  height: 1.57in;
                  image-rendering: pixelated;
                }
                @media print {
                  @page {
                    size: 2.36in 1.57in;
                    margin: 0;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                    width: 2.36in;
                    height: 1.57in;
                    display: block;
                  }
                  img {
                    width: 2.36in !important;
                    height: 1.57in !important;
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
    <div className="flex flex-col items-center w-full max-w-[1000px] p-2">
      {/* Canvas with no header, print button below with white background */}
      <canvas
        ref={canvasRef}
        className="border-2 border-red-500 bg-gray-100"
        style={{
          width: "100%",
          height: "auto",
          maxWidth: "1000px",
          maxHeight: "500px",
          imageRendering: "pixelated",
        }}
      />
      <Button
        onClick={handlePrintSticker}
        className="mt-2 bg-white border border-gray-300 hover:bg-gray-100 transition-smooth p-2"
        aria-label="Print sticker"
      >
        <Printer className="h-6 w-6 text-black" />
      </Button>
    </div>
  );
};