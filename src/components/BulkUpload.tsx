import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface BulkUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => void;
  onDownload: () => void;
}

export const BulkUpload = ({ open, onOpenChange, onUpload, onDownload }: BulkUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const file = files[0];
      if (file.type === '' || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setError(null);
        setUploadStatus('idle');
      } else {
        setError("Please select a valid CSV, XLSX, or XLS file.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === '' || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setError(null);
        setUploadStatus('idle');
      } else {
        setError("Please select a valid CSV, XLSX, or XLS file.");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("No file selected.");
      return;
    }

    setUploadStatus('uploading');
    setError(null);

    try {
      await onUpload(selectedFile);
      setUploadStatus('success');
      toast.success(`Successfully uploaded ${selectedFile.name}!`);
      
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus('idle');
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setUploadStatus('error');
      const errorMessage = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(errorMessage);
      toast.error("Upload failed: " + errorMessage);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Asset ID*",
      "Asset Name*",
      "Asset Type*",
      "Brand*",
      "Configuration",
      "Serial Number*",
      "Provider",
      "Warranty Start",
      "Warranty End",
      "Location*",
      "Employee ID",
      "Employee Name",
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
        "Mumbai Office",
        "EMP001",
        "John Doe",
      ],
      [
        "AST-002",
        "ThinkPad X1",
        "Laptop",
        "Lenovo",
        "8GB RAM, 256GB SSD",
        "TPX1-2023-002",
        "Dell Direct",
        "",
        "",
        "Hyderabad WH",
        "",
        "",
      ],
      [
        "AST-003",
        "iPad Pro",
        "Tablet",
        "Apple",
        "8GB RAM, 256GB SSD",
        "IPAD-2023-003",
        "",
        "",
        "",
        "Bangalore Office",
        "EMP002",
        "Jane Smith",
      ],
    ];
    
    const escapeCsvValue = (value: any) => {
      if (value == null || value === '') return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    
    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...sampleRows.map(row => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `asset_template_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Template downloaded successfully!");
  };

  const getUploadStatusIndicator = () => {
    switch (uploadStatus) {
      case 'uploading':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Uploading...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Upload successful!</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Upload failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { 
      onOpenChange(isOpen); 
      setError(null); 
      setSelectedFile(null); 
      setUploadStatus('idle');
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Bulk Asset Operations
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploadStatus !== 'idle' && getUploadStatusIndicator() && (
          <Alert className={`mb-4 ${uploadStatus === 'success' ? 'border-green-200 bg-green-50' : uploadStatus === 'error' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
            <AlertDescription className={uploadStatus === 'success' ? 'text-green-800' : uploadStatus === 'error' ? 'text-red-800' : 'text-blue-800'}>
              {getUploadStatusIndicator()}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <Card className="shadow-lg border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-500" />
                Download Current Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Export your current asset inventory or download a template to get started with bulk uploads.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={onDownload}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all"
                  disabled={uploadStatus === 'uploading'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Current Data
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadTemplate}
                  className="flex-1 border-gray-300 hover:bg-blue-50 hover:text-blue-500"
                  disabled={uploadStatus === 'uploading'}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-500" />
                Upload Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <div className="space-y-1">
                    <p><strong>Required columns:</strong> Asset ID*, Asset Name*, Asset Type*, Brand*, Serial Number*, Location*</p>
                    <p><strong>Optional columns:</strong> Configuration, Provider, Warranty Start, Warranty End, Employee ID, Employee Name</p>
                    <p className="text-sm"><em>* Required fields. Status and Assigned Date are set automatically: "Assigned" if both Employee Name and Employee ID are provided, otherwise "Available".</em></p>
                  </div>
                </AlertDescription>
              </Alert>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                  dragActive 
                    ? "border-blue-500 bg-blue-50 shadow-lg" 
                    : "border-gray-300 hover:border-blue-300 hover:bg-blue-25"
                } ${uploadStatus === 'uploading' ? 'opacity-50 cursor-not-allowed' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => uploadStatus !== 'uploading' && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploadStatus === 'uploading'}
                />
                
                <Upload className={`mx-auto h-12 w-12 transition-colors duration-200 mb-4 ${
                  dragActive ? 'text-blue-500' : 'text-gray-400'
                }`} />
                
                {uploadStatus === 'uploading' ? (
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-blue-600">Processing {selectedFile?.name}</p>
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-blue-600 truncate max-w-full">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      Size: {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <div className="flex justify-center pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedFile(null);
                          setError(null);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Change File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-medium mb-2 text-gray-900">Drop your CSV file here</p>
                    <p className="text-sm text-gray-500 mb-4">
                      or click to browse files
                    </p>
                    <p className="text-xs text-gray-400">
                      Supports CSV, XLSX, XLS files • Max 10MB
                    </p>
                  </div>
                )}
              </div>

              {selectedFile && uploadStatus === 'idle' && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600 flex items-center justify-between">
                    <span>Ready to upload: <strong>{selectedFile.name}</strong></span>
                    <span className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => { 
                    onOpenChange(false); 
                    setError(null); 
                    setSelectedFile(null); 
                    setUploadStatus('idle');
                  }}
                  className="flex-1 border-gray-300 hover:bg-gray-100"
                  disabled={uploadStatus === 'uploading'}
                >
                  {uploadStatus === 'uploading' ? 'Processing...' : 'Cancel'}
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadStatus === 'uploading'}
                  className={`flex-1 transition-all ${
                    !selectedFile || uploadStatus === 'uploading' 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                  }`}
                >
                  {uploadStatus === 'uploading' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedFile ? `Upload ${selectedFile.name}` : 'Upload Assets'}
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 p-2 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-500 text-center">
                  <strong>Status Logic:</strong> Assets will be marked as "Assigned" if both Employee Name and Employee ID are provided, otherwise "Available". All other fields are optional.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};