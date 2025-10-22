import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Asset } from "@/hooks/useAssets"; // Ensure this import matches your project

interface BulkUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (data: { headers: string[]; dataRows: string[][] }) => Promise<void>;
  assets: Asset[]; // Assets prop to filter and download
}

export const BulkUpload = ({ open, onOpenChange, onUpload, assets }: BulkUploadProps) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [locationFilter, setLocationFilter] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [searchQueryLocation, setSearchQueryLocation] = React.useState("");
  const [searchQueryStatus, setSearchQueryStatus] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const locationRef = React.useRef<HTMLDivElement>(null);
  const statusRef = React.useRef<HTMLDivElement>(null);

  const requiredHeaders = [
    "Asset ID",
    "Asset Name",
    "Asset Type",
    "Brand",
    "Serial Number",
    "Location",
  ].map(header => header.toLowerCase());

  // Compute unique locations and statuses from assets
  const assetLocations = React.useMemo(
    () => [...new Set(assets.map((asset) => asset.location).filter(Boolean))].sort(),
    [assets]
  );
  const assetStatuses = React.useMemo(
    () => [...new Set(assets.map((asset) => asset.status).filter(Boolean))].sort(),
    [assets]
  );

  const validateCsvHeaders = (headers: string[]) => {
    if (!headers || headers.length === 0) return "CSV file is empty or malformed.";
    const normalizedHeaders = headers.map(header => header.trim().toLowerCase());
    const missingHeaders = requiredHeaders.filter(header => !normalizedHeaders.includes(header));
    return missingHeaders.length > 0 ? `Invalid CSV format: Missing required headers: ${missingHeaders.join(", ")}.` : null;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) handleFile(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) handleFile(files[0]);
  };

  const handleFile = async (file: File) => {
    if (
      file.type === 'text/csv' ||
      file.name.endsWith('.csv') ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xls') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.name.endsWith('.xlsx')
    ) {
      setSelectedFile(file);
      setError(null);
      setUploadStatus('idle');
    } else {
      setError("Please select a valid CSV, XLSX, or XLS file.");
    }
  };

  const convertToCsvData = async (file: File) => {
    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      const parseResult = Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        transform: (value: any) => value?.trim() || "",
      });
      const rows = parseResult.data as string[][];
      const errors = parseResult.errors;
      if (errors.length > 0) throw new Error(`CSV parsing errors: ${errors.map((e: any) => e.message).join(', ')}`);
      const headers = rows[0];
      const dataRows = rows.slice(1).filter(row => row.length > 0 && row.some(cell => cell != null && cell.toString().trim() !== ""));
      const headerError = validateCsvHeaders(headers);
      if (headerError) throw new Error(headerError);
      return { headers, dataRows };
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error("No sheets found in the Excel file.");
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as string[][];
      const headers = jsonData[0].map(header => header?.toString().trim());
      const dataRows = jsonData.slice(1).filter(row => row.length > 0 && row.some(cell => cell != null && cell.toString().trim() !== ""));
      const headerError = validateCsvHeaders(headers);
      if (headerError) throw new Error(headerError);
      return { headers, dataRows };
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("No file selected.");
      setUploadStatus('error');
      toast.error("No file selected.");
      return;
    }

    setUploadStatus('uploading');
    setError(null);

    try {
      const { headers, dataRows } = await convertToCsvData(selectedFile);
      await onUpload({ headers, dataRows });
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
      toast.error(errorMessage);
      console.error("Upload error:", err);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Asset ID",
      "Asset Name",
      "Asset Type",
      "Brand",
      "Configuration",
      "Serial Number",
      "FAR Code",
      "Provider",
      "Warranty Start",
      "Warranty End",
      "Location",
      "Employee ID",
      "Employee Name",
    ];

    const sampleRows = [
      ["AST-001", "MacBook Pro 16\"", "Laptop", "Apple", "16GB RAM, 512GB SSD", "MBP16-2023-001", "FAR-001", "Amazon@Tech", "2023-01-01", "2025-01-01", "Mumbai Office", "EMP001", "John Doe"],
      ["AST-002", "ThinkPad X1", "Laptop", "Lenovo", "8GB RAM, 256GB SSD", "TPX1-2023-002", "", "Dell~Direct", "", "", "Hyderabad WH", "", ""],
      ["AST-003", "iPad Pro", "Tablet", "Apple", "8GB RAM, 256GB SSD", "IPAD-2023-003", "FAR-002", "Best&Buy", "", "", "Bangalore Office", "EMP002", "Jane Smith"],
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

  const handleDownload = () => {
    // Filter assets based on selected location and status
    const filteredAssets = assets.filter((asset) => {
      const locationMatch = locationFilter.length === 0 || locationFilter.includes(asset.location || "");
      const statusMatch = statusFilter.length === 0 || statusFilter.includes(asset.status || "");
      return locationMatch && statusMatch;
    });

    // Define headers for the CSV
    const headers = [
      "Asset ID",
      "Asset Name",
      "Asset Type",
      "Brand",
      "Configuration",
      "Serial Number",
      "FAR Code",
      "Provider",
      "Warranty Start",
      "Warranty End",
      "Location",
      "Employee ID",
      "Employee Name",
      "Status",
    ];

    // Convert filtered assets to CSV rows
    const rows = filteredAssets.map((asset) => [
      asset.asset_id || "",
      asset.name || "",
      asset.type || "",
      asset.brand || "",
      asset.configuration || "",
      asset.serial_number || "",
      asset.far_code || "",
      asset.provider || "",
      asset.warranty_start || "",
      asset.warranty_end || "",
      asset.location || "",
      asset.employee_id || "",
      asset.assigned_to || "",
      asset.status || "",
    ]);

    // Escape CSV values
    const escapeCsvValue = (value: any) => {
      if (value == null || value === '') return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Create CSV content
    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map(row => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `asset_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Filtered data downloaded successfully!");
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

  // Handle keyboard navigation and mouse wheel
  const handleKeyDown = (e: React.KeyboardEvent, ref: React.RefObject<HTMLDivElement>, options: string[], filterSetter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (!ref.current) return;
    const items = ref.current.querySelectorAll('[role="checkbox"]');
    if (items.length === 0) return;

    let focusedIndex = -1;
    items.forEach((item, index) => {
      if (document.activeElement === item || document.activeElement === item.querySelector('input')) {
        focusedIndex = index;
      }
    });

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        focusedIndex = Math.max(0, focusedIndex - 1);
        (items[focusedIndex] as HTMLElement)?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        focusedIndex = Math.min(items.length - 1, focusedIndex + 1);
        (items[focusedIndex] as HTMLElement)?.focus();
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0) {
          const option = options[focusedIndex];
          filterSetter(prev => 
            prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
          );
        }
        break;
    }
  };

  const handleWheel = (e: React.WheelEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollTop += e.deltaY;
      e.preventDefault(); // Prevent parent scroll
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      setError(null);
      setSelectedFile(null);
      setUploadStatus('idle');
      setLocationFilter([]);
      setStatusFilter([]);
      setSearchQueryLocation("");
      setSearchQueryStatus("");
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
                Export your current asset inventory or download a template to get started with bulk uploads. Apply filters to download specific assets.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Asset Location</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="text-xs h-7 w-full justify-between">
                        {locationFilter.length === 0 ? "All Locations" : `${locationFilter.length} selected`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-56 p-0 z-50"
                      style={{ overflowY: 'auto' }}
                      key={locationFilter.length + searchQueryLocation.length}
                    >
                      <div className="p-2 border-b">
                        <Input
                          type="text"
                          placeholder="Type to search..."
                          value={searchQueryLocation}
                          onChange={(e) => setSearchQueryLocation(e.target.value)}
                          autoFocus
                          className="w-full h-6 text-xs"
                          onBlur={() => locationRef.current?.focus()}
                        />
                      </div>
                      <div
                        ref={locationRef}
                        className="max-h-64 overflow-y-auto p-2"
                        onWheel={(e) => handleWheel(e, locationRef)}
                        onKeyDown={(e) => handleKeyDown(e, locationRef, assetLocations, setLocationFilter)}
                        tabIndex={0} // Make div focusable
                      >
                        {assetLocations
                          .filter((location: string) => location.toLowerCase().includes(searchQueryLocation.toLowerCase()))
                          .map((location: string) => (
                            <div key={location} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={`location-${location}`}
                                checked={locationFilter.includes(location)}
                                onCheckedChange={(checked) => {
                                  setLocationFilter((prev) =>
                                    checked ? [...prev, location] : prev.filter((l) => l !== location)
                                  );
                                }}
                              />
                              <Label htmlFor={`location-${location}`} className="text-xs cursor-pointer flex-1">
                                {location}
                              </Label>
                            </div>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Status</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="text-xs h-7 w-full justify-between">
                        {statusFilter.length === 0 ? "All Statuses" : `${statusFilter.length} selected`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-56 p-0 z-50"
                      style={{ overflowY: 'auto' }}
                      key={statusFilter.length + searchQueryStatus.length}
                    >
                      <div className="p-2 border-b">
                        <Input
                          type="text"
                          placeholder="Type to search..."
                          value={searchQueryStatus}
                          onChange={(e) => setSearchQueryStatus(e.target.value)}
                          autoFocus
                          className="w-full h-6 text-xs"
                          onBlur={() => statusRef.current?.focus()}
                        />
                      </div>
                      <div
                        ref={statusRef}
                        className="max-h-64 overflow-y-auto p-2"
                        onWheel={(e) => handleWheel(e, statusRef)}
                        onKeyDown={(e) => handleKeyDown(e, statusRef, assetStatuses, setStatusFilter)}
                        tabIndex={0} // Make div focusable
                      >
                        {assetStatuses
                          .filter((status: string) => status.toLowerCase().includes(searchQueryStatus.toLowerCase()))
                          .map((status: string) => (
                            <div key={status} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={`status-${status}`}
                                checked={statusFilter.includes(status)}
                                onCheckedChange={(checked) => {
                                  setStatusFilter((prev) =>
                                    checked ? [...prev, status] : prev.filter((s) => s !== status)
                                  );
                                }}
                              />
                              <Label htmlFor={`status-${status}`} className="text-xs cursor-pointer flex-1">
                                {status}
                              </Label>
                            </div>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleDownload}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all"
                  disabled={uploadStatus === 'uploading'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Filtered Data
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
                    <p><strong>Required columns:</strong> Asset ID, Asset Name, Asset Type, Brand, Serial Number, FAR Code, Location</p>
                    <p><strong>Optional columns:</strong> Configuration, Provider, Warranty Start, Warranty End, Employee ID, Employee Name</p>
                    <p className="text-sm"><em>Fields with commas (e.g., "16GB RAM, 512GB SSD") are automatically handled as single fields, even without quotes. For best results, enclose such fields in double quotes in the CSV.</em></p>
                    <p className="text-sm"><em>Status is set automatically: "Assigned" if both Employee Name and Employee ID are provided, otherwise "Available".</em></p>
                    <p className="text-sm text-amber-600"><strong>Update existing:</strong> If a serial number already exists, the row will update that asset with new details from the CSV.</p>
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
                  accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploadStatus === 'uploading'}
                />
                <Upload
                  className={`mx-auto h-12 w-12 transition-colors duration-200 mb-4 ${
                    dragActive ? 'text-blue-500' : 'text-gray-400'
                  }`}
                />
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
                    <p className="text-lg font-medium mb-2 text-gray-900">Drop your CSV, XLSX, or XLS file here</p>
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