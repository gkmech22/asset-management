import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Papa from "papaparse";
import { useBulkUploadAssets, CsvAsset } from "@/hooks/useBulkAssets";
import { toast } from "sonner";

interface BulkUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
}

export const BulkUpload = ({ open, onOpenChange, onDownload }: BulkUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkUploadMutation = useBulkUploadAssets();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      setError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      setError(null);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setError("No file selected.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResults(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normalize header names
        const normalized = header.toLowerCase().trim();
        const mapping: { [key: string]: string } = {
          'asset id': 'asset_id',
          'assetid': 'asset_id',
          'asset name': 'name',
          'assetname': 'name',
          'asset type': 'type',
          'assettype': 'type',
          'serial number': 'serial_number',
          'serialnumber': 'serial_number',
          'warranty start': 'warranty_start',
          'warrantystart': 'warranty_start',
          'warranty end': 'warranty_end',
          'warrantyend': 'warranty_end',
        };
        return mapping[normalized] || normalized;
      },
      complete: async (results) => {
        try {
          const csvAssets: CsvAsset[] = results.data
            .filter((row: any) => row.asset_id && row.name && row.type && row.brand && row.serial_number)
            .map((row: any) => ({
              asset_id: row.asset_id?.toString().trim(),
              name: row.name?.toString().trim(),
              type: row.type?.toString().trim(),
              brand: row.brand?.toString().trim(),
              configuration: row.configuration?.toString().trim() || undefined,
              serial_number: row.serial_number?.toString().trim(),
              provider: row.provider?.toString().trim() || undefined,
              warranty_start: row.warranty_start?.toString().trim() || undefined,
              warranty_end: row.warranty_end?.toString().trim() || undefined,
            }));

          if (csvAssets.length === 0) {
            setError("No valid assets found in the CSV file. Please check the format and required columns.");
            setIsUploading(false);
            return;
          }

          const result = await bulkUploadMutation.mutateAsync(csvAssets);
          setUploadResults(result);
          
          toast.success(
            `Upload completed! Created: ${result.created}, Updated: ${result.updated}, Errors: ${result.errors.length}`
          );

          if (result.errors.length === 0) {
            setSelectedFile(null);
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : "Upload failed");
          toast.error("Upload failed");
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
        setIsUploading(false);
      }
    });
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Asset ID",
      "Asset Name",
      "Asset Type",
      "Brand",
      "Configuration",
      "Serial Number",
      "Provider",
      "Warranty Start",
      "Warranty End",
    ];
    
    const sampleRows = [
      [
        "AST-001",
        "MacBook Pro 16\"",
        "Laptop",
        "Apple",
        "16GB RAM, 512GB SSD",
        "MBP16-2023-001",
        "Amazon",
        "2023-01-01",
        "2025-01-01",
      ],
      [
        "AST-002",
        "ThinkPad X1",
        "Laptop",
        "Lenovo",
        "16GB RAM, 1TB SSD",
        "TPX1-2023-002",
        "Dell Direct",
        "2023-02-01",
        "2025-02-01",
      ],
      [
        "AST-003",
        "iPad Pro",
        "Tablet",
        "Apple",
        "256GB, Wi-Fi + Cellular",
        "IPD-2023-003",
        "Best Buy",
        "2023-03-01",
        "2024-03-01",
      ],
    ];
    
    const csvContent = [
      headers.join(","),
      ...sampleRows.map(row => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "asset_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); setError(null); setSelectedFile(null); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            Bulk Asset Operations
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploadResults && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Upload Results: Created {uploadResults.created}, Updated {uploadResults.updated}, 
              {uploadResults.errors.length > 0 && ` Errors: ${uploadResults.errors.length}`}
              {uploadResults.errors.length > 0 && (
                <div className="mt-2 text-sm">
                  {uploadResults.errors.slice(0, 3).map((error, index) => (
                    <div key={index} className="text-red-600">• {error}</div>
                  ))}
                  {uploadResults.errors.length > 3 && (
                    <div className="text-muted-foreground">... and {uploadResults.errors.length - 3} more errors</div>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Download Current Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Download your current asset inventory as a CSV file.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={onDownload}
                  className="bg-gradient-primary hover:shadow-glow transition-smooth"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Data
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadTemplate}
                  className="hover:bg-primary hover:text-primary-foreground"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload a CSV file with columns: Asset ID, Asset Name, Asset Type, Brand, Configuration, Serial Number, Provider, Warranty Start, Warranty End
                </AlertDescription>
              </Alert>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                
                {selectedFile ? (
                  <div>
                    <p className="text-lg font-medium text-primary">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Size: {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click to browse files
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports CSV, XLSX, XLS files
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => { onOpenChange(false); setError(null); setSelectedFile(null); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Assets"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};