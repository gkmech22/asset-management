import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, UserMinus, Search, Calendar, MoreVertical, ScanBarcode, Tag } from "lucide-react";
import { EditAssetDialog } from "./EditAssetDialog";
import { AssetDetailsDialog } from "./AssetDetailsDialog";
import { AssetSticker } from "./AssetSticker";
import { Asset } from "@/hooks/useAssets";
import { useAssetHistory } from "@/hooks/useAssetHistory";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EnhancedBarcodeScanner } from "./EnhancedBarcodeScanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AssetListProps {
  assets: Asset[];
  onAssign: (assetId: string, userName: string, employeeId: string) => Promise<void>;
  onUnassign: (assetId: string, remarks?: string, receivedBy?: string, location?: string) => Promise<void>;
  onUpdateAsset: (assetId: string, updatedAsset: any) => Promise<void>;
  onUpdateStatus: (assetId: string, status: string) => Promise<void>;
  onUpdateLocation: (assetId: string, location: string) => Promise<void>;
  onUpdateAssetCheck: (assetId: string, assetCheck: string) => Promise<void>;
  onDelete: (assetId: string) => Promise<void>;
  dateRange?: { from?: Date; to?: Date };
  typeFilter?: string;
  brandFilter?: string;
  configFilter?: string;
  statusFilter?: string;
  defaultRowsPerPage?: number;
  viewType?: 'dashboard' | 'audit' | 'amcs' | 'summary';
}

export const AssetList = ({
  assets = [],
  onAssign,
  onUnassign,
  onUpdateAsset,
  onUpdateStatus,
  onUpdateLocation,
  onUpdateAssetCheck,
  onDelete,
  dateRange,
  typeFilter = "all",
  brandFilter = "all",
  configFilter = "all",
  statusFilter = "all",
  defaultRowsPerPage = 100,
  viewType = 'dashboard',
}: AssetListProps) => {
  const { user } = useAuth() || { user: null };
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedAsset, setSelectedAsset] = React.useState<Asset | null>(null);
  const [userName, setUserName] = React.useState("");
  const [employeeId, setEmployeeId] = React.useState("");
  const [employeeEmail, setEmployeeEmail] = React.useState("");
  const [showAssignDialog, setShowAssignDialog] = React.useState(false);
  const [showStatusDialog, setShowStatusDialog] = React.useState(false);
  const [showLocationDialog, setShowLocationDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = React.useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = React.useState(false);
  const [showReturnDialog, setShowReturnDialog] = React.useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = React.useState(false);
  const [showStickerDialog, setShowStickerDialog] = React.useState(false);
  const [returnRemarks, setReturnRemarks] = React.useState("");
  const [returnLocation, setReturnLocation] = React.useState("");
  const [newStatus, setNewStatus] = React.useState("");
  const [newLocation, setNewLocation] = React.useState("");
  const [receivedByInput, setReceivedByInput] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultRowsPerPage);
  const [error, setError] = React.useState<string | null>(null);
  const [assetCheckId, setAssetCheckId] = React.useState("");
  const [checkedAssets, setCheckedAssets] = React.useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [showStatusCheckDialog, setShowStatusCheckDialog] = React.useState(false);
  const [filterCheckStatus, setFilterCheckStatus] = React.useState<string | null>(null);
  const [showScanner, setShowScanner] = React.useState(false);
  const [showAssetCheckScanner, setShowAssetCheckScanner] = React.useState(false);
  const [showAssignedToOnly, setShowAssignedToOnly] = React.useState(false);
  const [isFetchingEmployee, setIsFetchingEmployee] = React.useState(false);

  const { data: history = [], isLoading: historyLoading } = useAssetHistory(selectedAsset?.id);

  const locations = [
    "Mumbai Office", "Hyderabad WH", "Ghaziabad WH", "Bhiwandi WH", "Patiala WH",
    "Bangalore Office", "Kolkata WH", "Trichy WH", "Gurugram Office", "Indore WH",
    "Bangalore WH", "Jaipur WH"
  ];

  const allStatuses = ["Available", "Scrap/Damage", "Sale", "Lost", "Emp Damage", "Courier Damage"];

  const receivedBy = React.useMemo(() => {
    try {
      if (user?.displayName) return user.displayName;
      if (user?.email) {
        const prefix = user.email.split('@')[0];
        const parts = prefix.split(/[_.\-]/).filter(Boolean);
        return parts
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
      }
      return "Unknown User";
    } catch (err) {
      console.error("AssetList: Error parsing user data:", err);
      return "Unknown User";
    }
  }, [user]);

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  React.useEffect(() => {
    const initialChecked = new Set<string>();
    assets.forEach((asset) => {
      if (asset.asset_check === "Matched") {
        initialChecked.add(asset.asset_id || '');
        initialChecked.add(asset.serial_number || '');
      }
    });
    setCheckedAssets(initialChecked);
  }, [assets]);

  // Fetch employee details from Supabase
  const fetchEmployee = async (id: string) => {
    if (!id || id.length < 3) {
      setUserName('');
      setEmployeeEmail('');
      return;
    }

    try {
      setIsFetchingEmployee(true);
      const { data, error } = await supabase
        .from('employees')
        .select('employee_name, email')
        .eq('employee_id', id)
        .single();

      if (data && !error) {
        setUserName(data.employee_name || '');
        setEmployeeEmail(data.email || '');
        toast.success('Employee details loaded successfully');
      } else {
        setUserName('');
        setEmployeeEmail('');
        toast.error('Employee not found');
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      setUserName('');
      setEmployeeEmail('');
      toast.error('Failed to fetch employee details');
    } finally {
      setIsFetchingEmployee(false);
    }
  };

  const filteredAssets = React.useMemo(() => {
    return assets.filter((asset) => {
      if (!asset) return false;
      if (viewType === 'audit' && asset.status === 'Assigned') {
        return false;
      }

      if (filterCheckStatus) {
        if (filterCheckStatus === "Matched" && asset.asset_check !== "Matched") {
          return false;
        }
        if (filterCheckStatus === "Unmatched" && asset.asset_check === "Matched") {
          return false;
        }
      }

      const matchesSearch = !searchTerm || [
        asset.name || '', asset.asset_id || '', asset.brand || '',
        asset.serial_number || '', asset.assigned_to || '', asset.employee_id || '',
        asset.received_by || '', asset.assigned_date || '', asset.return_date || '',
        asset.status || '', asset.location || '', asset.warranty_start || '',
        asset.warranty_end || '', asset.provider || '', asset.warranty_status || '',
        asset.remarks || '',
      ].some(field => 
        field && field.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesDateRange =
        !dateRange?.from ||
        !dateRange?.to ||
        !asset.assigned_date ||
        (new Date(asset.assigned_date) >= new Date(dateRange.from) &&
         new Date(asset.assigned_date) <= new Date(dateRange.to));

      const matchesType = typeFilter === "all" || asset.type === typeFilter;
      const matchesBrand = brandFilter === "all" || asset.brand === brandFilter;
      const matchesConfig = configFilter === "all" || asset.configuration === configFilter;
      const matchesStatus = statusFilter === "all" || asset.status === statusFilter;

      return matchesSearch && matchesDateRange && matchesType && matchesBrand && matchesConfig && matchesStatus;
    }).sort((a, b) => {
      if (a.status === "Available" && b.status !== "Available") return -1;
      if (a.status !== "Available" && b.status === "Available") return 1;
      const dateA = a.assigned_date ? new Date(a.assigned_date).getTime() : 0;
      const dateB = b.assigned_date ? new Date(b.assigned_date).getTime() : 0;
      return dateB - dateA;
    });
  }, [assets, searchTerm, dateRange, typeFilter, brandFilter, configFilter, statusFilter, filterCheckStatus, viewType]);

  const matchedCount = React.useMemo(() => {
    return filteredAssets.filter(asset => asset.asset_check === "Matched").length;
  }, [filteredAssets]);

  const unmatchedCount = React.useMemo(() => {
    return filteredAssets.length - matchedCount;
  }, [filteredAssets, matchedCount]);

  const totalPages = Math.ceil(filteredAssets.length / rowsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

const handleAssignAsset = async () => {
  if (selectedAsset && userName.trim() && employeeId.trim() && employeeEmail.trim()) {
    try {
      // Remove the check for existing asset with employee ID since multiple assets can be assigned to same employee
      // const existingAssetWithEmployeeId = assets.find(
      //   (asset) => asset.employee_id === employeeId && asset.id !== selectedAsset.id
      // );

      const selectedAssetSerial = assets.find((asset) => asset.id === selectedAsset.id)?.serial_number;
      const existingAssetWithSerial = assets.find(
        (asset) => asset.serial_number === selectedAssetSerial && asset.id !== selectedAsset.id
      );

      // if (existingAssetWithEmployeeId) {
      //   setError(`Employee ID ${employeeId} is already assigned to another asset (Serial: ${existingAssetWithEmployeeId.serial_number}).`);
      //   return;
      // }

      if (existingAssetWithSerial) {
        setError(`Serial Number ${selectedAssetSerial} is already associated with another asset.`);
        return;
      }

      // Additional check to ensure asset is available for assignment
      if (selectedAsset.status !== "Available") {
        setError("This asset is not available for assignment. Please update the status to 'Available' first.");
        return;
      }

      await onAssign(selectedAsset.id, userName.trim(), employeeId.trim());
      await onUpdateAsset(selectedAsset.id, { status: "Assigned", received_by: "", return_date: "" });
      setShowAssignDialog(false);
      setUserName("");
      setEmployeeId("");
      setEmployeeEmail("");
      setSelectedAsset(null);
      setError(null);
      toast.success("Asset assigned successfully");
    } catch (error) {
      console.error("AssetList: Assign failed:", error);
      setError("Failed to assign asset. Please try again.");
    }
  } else {
    setError("Please enter Employee ID, Name, and Email");
  }
};
  const handleUpdateStatus = async () => {
    if (selectedAsset && newStatus) {
      try {
        if (selectedAsset.status === "Assigned" && newStatus !== "Assigned") {
          setShowStatusDialog(false);
          setShowReturnDialog(true);
          return;
        }
        await onUpdateStatus(selectedAsset.id, newStatus);
        if (newStatus === "Assigned") {
          await onUpdateAsset(selectedAsset.id, { received_by: "", return_date: "" });
        }
        setShowStatusDialog(false);
        setNewStatus("");
        setSelectedAsset(null);
        setError(null);
        toast.success("Status updated successfully");
      } catch (error) {
        console.error("AssetList: Update status failed:", error);
        setError("Failed to update status. Please try again.");
      }
    }
  };

  const handleReturnAsset = async () => {
    if (selectedAsset) {
      try {
        if (newStatus !== "Assigned" && !returnLocation) {
          setError("Location is required for this status.");
          return;
        }
        
        const finalReceivedBy = receivedByInput.trim() || receivedBy;
        
        await onUnassign(selectedAsset.id, returnRemarks, finalReceivedBy, newStatus !== "Assigned" ? returnLocation : undefined);
        
        if (newStatus && newStatus !== "Assigned") {
          await onUpdateStatus(selectedAsset.id, newStatus);
          await onUpdateAsset(selectedAsset.id, { 
            received_by: finalReceivedBy,
            return_date: new Date().toISOString()
          });
        } else {
          await onUpdateStatus(selectedAsset.id, "Available");
          await onUpdateAsset(selectedAsset.id, { 
            received_by: finalReceivedBy,
            return_date: new Date().toISOString()
          });
        }
        
        setShowReturnDialog(false);
        setReturnRemarks("");
        setReturnLocation("");
        setNewStatus("");
        setReceivedByInput("");
        setSelectedAsset(null);
        setError(null);
        toast.success("Asset returned successfully");
      } catch (error) {
        console.error("AssetList: Return failed:", error);
        setError("Failed to return asset. Please try again.");
      }
    }
  };

  const handleRevokeAsset = async () => {
    if (selectedAsset) {
      try {
        const lastAssignment = history
          .filter(entry => entry.field_changed === "assigned_to" || entry.field_changed === "employee_id")
          .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())[0];

        const userName = lastAssignment?.field_changed === "assigned_to" ? lastAssignment.new_value : selectedAsset.assigned_to || "";
        const employeeId = lastAssignment?.field_changed === "employee_id" ? lastAssignment.new_value : selectedAsset.employee_id || "";

        if (!userName || !employeeId) {
          setError("Cannot revoke: No previous assignment details found.");
          return;
        }

        await onAssign(selectedAsset.id, userName, employeeId);
        await onUpdateAsset(selectedAsset.id, { status: "Assigned", received_by: "", return_date: "" });
        setShowRevokeDialog(false);
        setSelectedAsset(null);
        setError(null);
        toast.success("Asset return revoked successfully");
      } catch (error) {
        console.error("AssetList: Revoke failed:", error);
        setError("Failed to revoke asset assignment. Please try again.");
      }
    }
  };

  const handleUpdateLocation = async () => {
    if (selectedAsset && newLocation) {
      try {
        await onUpdateLocation(selectedAsset.id, newLocation);
        setShowLocationDialog(false);
        setNewLocation("");
        setSelectedAsset(null);
        setError(null);
        toast.success("Location updated successfully");
      } catch (error) {
        console.error("AssetList: Location update failed:", error);
        setError("Failed to update location. Please try again.");
      }
    }
  };

  const handleAssetCheck = async () => {
    if (assetCheckId) {
      const asset = assets.find(
        (a) => a.asset_id === assetCheckId || a.serial_number === assetCheckId
      );
      if (asset) {
        try {
          await onUpdateAssetCheck(asset.id, "Matched");
          setCheckedAssets(prev => new Set([...prev, assetCheckId]));
          setAssetCheckId("");
          setError(null);
          toast.success("Asset check updated successfully");
        } catch (error) {
          console.error("AssetList: Asset check update failed:", error);
          setError("Failed to update asset check status. Please try again.");
        }
      } else {
        setError("Asset ID or Serial Number not found.");
      }
    }
  };

  const handleAssetUncheck = async (assetId: string, assetCheckId: string) => {
    try {
      await onUpdateAssetCheck(assetId, "");
      setCheckedAssets(prev => {
        const newSet = new Set(prev);
        newSet.delete(assetCheckId);
        return newSet;
      });
      setError(null);
      toast.success("Asset unchecked successfully");
    } catch (error) {
      console.error("AssetList: Asset uncheck failed:", error);
      setError("Failed to uncheck asset. Please try again.");
    }
  };

  const handleAssetCheckClear = async () => {
    try {
      for (const asset of assets) {
        if (asset.asset_check === "Matched") {
          await onUpdateAssetCheck(asset.id, "");
        }
      }
      setCheckedAssets(new Set());
      setAssetCheckId("");
      setShowConfirmDialog(false);
      setError(null);
      toast.success("All asset checks cleared successfully");
    } catch (error) {
      console.error("AssetList: Clear asset checks failed:", error);
      setError("Failed to clear asset checks. Please try again.");
    }
  };

  const confirmClear = () => {
    setShowConfirmDialog(true);
  };

  const cancelClear = () => {
    setShowConfirmDialog(false);
  };

  const handleFilterCheckStatus = (status: string) => {
    setFilterCheckStatus(prev => prev === status ? null : status);
    setCurrentPage(1);
  };

  const handleShowStatusCheck = () => {
    setShowStatusCheckDialog(true);
  };

  const handleGenerateReport = () => {
    const headers = [
      "Asset ID", "Asset Type", "Asset Name", "Brand", "Configuration",
      "Serial Number", "Status", "Asset Location", "Asset Check",
      "Assigned Date", "Return Date", "Received By"
    ];

    const escapeCsvField = (value: string | null | undefined): string => {
      if (!value) return "";
      return value.includes(",") ? `"${value.replace(/"/g, '""')}"` : value;
    };

    const csvContent = [
      headers.join(","),
      ...filteredAssets.map((asset) =>
        [
          escapeCsvField(asset.asset_id),
          escapeCsvField(asset.type),
          escapeCsvField(asset.name),
          escapeCsvField(asset.brand),
          escapeCsvField(asset.configuration),
          escapeCsvField(asset.serial_number),
          escapeCsvField(asset.status),
          escapeCsvField(asset.location),
          escapeCsvField(asset.asset_check),
          escapeCsvField(asset.assigned_date),
          escapeCsvField(asset.return_date),
          escapeCsvField(asset.received_by),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Assigned":
        return <Badge variant="default" className="bg-yellow-500 text-yellow-900">Assigned</Badge>;
      case "Available":
        return <Badge variant="default" className="bg-green-500 text-white">Available</Badge>;
      case "Scrap/Damage":
        return <Badge variant="destructive">Scrap/Damage</Badge>;
      case "Sale":
        return <Badge variant="default" className="bg-blue-500 text-white">Sale</Badge>;
      case "Lost":
        return <Badge variant="default" className="bg-red-500 text-white">Lost</Badge>;
      case "Emp Damage":
        return <Badge variant="default" className="bg-orange-500 text-white">Emp Damage</Badge>;
      case "Courier Damage":
        return <Badge variant="default" className="bg-purple-500 text-white">Courier Damage</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const getWarrantyStatusBadge = (warrantyEnd: string | null) => {
    if (!warrantyEnd) return <Badge variant="secondary">Unknown</Badge>;
    const endDate = new Date(warrantyEnd);
    const today = new Date();
    const warrantyStatus = endDate >= today ? "In Warranty" : "Out of Warranty";
    return warrantyStatus === "In Warranty" ? (
      <Badge variant="default" className="bg-green-500 text-white">In Warranty</Badge>
    ) : (
      <Badge variant="destructive">Out of Warranty</Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      if (viewType === 'amcs' || viewType === 'summary') {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "";
    }
  };

  const formatWarrantyPeriod = (warrantyEnd: string | null) => {
    if (!warrantyEnd) return "-";
    try {
      const endDate = new Date(warrantyEnd);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) return "Expired";

      const years = Math.floor(diffDays / 365);
      const remainingDaysAfterYears = diffDays % 365;
      const months = Math.floor(remainingDaysAfterYears / 30);

      if (years > 0) {
        return `${years} Year${years > 1 ? "s" : ""}${months > 0 ? ` ${months} Month${months > 1 ? "s" : ""}` : ""}`;
      } else if (months > 0) {
        return `${months} Month${months > 1 ? "s" : ""}`;
      } else {
        return `${diffDays} Day${diffDays > 1 ? "s" : ""}`;
      }
    } catch (error) {
      return "-";
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return { startPage, endPage, pageNumbers };
  };

  const { startPage, endPage, pageNumbers } = getPageNumbers();

  const historyTableRef = React.useRef<HTMLDivElement>(null);

  const handleOpenStickerDialog = (asset: Asset) => {
    if (!asset || !asset.asset_id || !asset.serial_number) {
      setError("Invalid asset selected for sticker generation.");
      return;
    }
    setSelectedAsset(asset);
    setShowStickerDialog(true);
  };

  if (!Array.isArray(assets)) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Asset Inventory (Error)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-destructive">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-sm">Invalid assets data provided.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isWarrantyView = viewType === 'amcs' || viewType === 'summary';
  const isAuditView = viewType === 'audit';

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Asset Inventory ({filteredAssets.length} items)
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 w-64 h-9 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setShowScanner(true)}
            >
              <ScanBarcode className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isAuditView && (
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm font-medium">Filters</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-sm text-green-500 cursor-pointer hover:underline"
                  onClick={() => handleFilterCheckStatus("Matched")}
                >
                  Matched: {matchedCount}
                </span>
                <span
                  className="text-sm text-red-500 cursor-pointer hover:underline"
                  onClick={() => handleFilterCheckStatus("Unmatched")}
                >
                  Unmatched: {unmatchedCount}
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Asset Check"
                  value={assetCheckId}
                  onChange={(e) => setAssetCheckId(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAssetCheck();
                    }
                  }}
                  className="pl-10 w-64 h-9 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setShowAssetCheckScanner(true)}
                >
                  <ScanBarcode className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleAssetCheck} size="sm" className="h-9 text-sm">Check</Button>
              <Button onClick={handleShowStatusCheck} size="sm" variant="outline" className="h-9 text-sm">Status</Button>
              <Button onClick={confirmClear} variant="outline" size="sm" className="h-9 text-sm">Clear All</Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-12 text-destructive">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              {assets.length === 0 ? "No Assets Available" : "No Assets Found"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {assets.length === 0 
                ? "No assets are currently available in the system."
                : "No assets match your current filters or search criteria."
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[60vh] relative">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-muted z-10">
                  <tr className="text-xs text-muted-foreground">
                    {viewType === 'dashboard' && (
                      <>
                        <th className="p-2 w-[5%] text-left">S.No.</th>
                        <th className="p-2 w-[10%] text-left">Asset ID</th>
                        <th className="p-2 w-[15%] text-left">Asset Details</th>
                        <th className="p-2 w-[15%] text-left">Specifications</th>
                        <th className="p-2 w-[10%] text-left">Serial Number</th>
                        <th className="p-2 w-[10%] text-left">Location</th>
                        <th className="p-2 w-[10%] text-left">Assigned To</th>
                        <th className="p-2 w-[10%] text-left">Received By</th>
                        <th className="p-2 w-[10%] text-left">Date</th>
                        <th className="p-2 w-[10%] text-left">Status</th>
                        <th className="p-2 w-[10%] text-left">Actions</th>
                      </>
                    )}
                    {viewType === 'audit' && (
                      <>
                        <th className="p-2 w-[5%] text-left">S.No.</th>
                        <th className="p-2 w-[10%] text-left">Asset ID</th>
                        <th className="p-2 w-[15%] text-left">Asset Details</th>
                        <th className="p-2 w-[20%] text-left">Specifications</th>
                        <th className="p-2 w-[10%] text-left">Serial Number</th>
                        <th className="p-2 w-[15%] text-left">Asset Check</th>
                      </>
                    )}
                    {isWarrantyView && (
                      <>
                        <th className="p-2 w-[5%] text-left">S.No.</th>
                        <th className="p-2 w-[10%] text-left">Asset ID</th>
                        <th className="p-2 w-[15%] text-left">Asset Details</th>
                        <th className="p-2 w-[15%] text-left">Specifications</th>
                        <th className="p-2 w-[10%] text-left">Serial Number</th>
                        <th className="p-2 w-[10%] text-left">Provider</th>
                        <th className="p-2 w-[12%] text-left">Warranty Start</th>
                        <th className="p-2 w-[12%] text-left">Warranty End</th>
                        <th className="p-2 w-[11%] text-left">Warranty Period</th>
                        <th className="p-2 w-[11%] text-left">Warranty Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssets.map((asset, index) => (
                    <tr key={asset.id} className="border-b hover:bg-muted/50">
                      {viewType === 'dashboard' && (
                        <>
                          <td className="p-2 text-xs">
                            <div className="text-left">{(currentPage - 1) * rowsPerPage + index + 1}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <button
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setShowAssignedToOnly(false);
                                  setShowDetailsDialog(true);
                                }}
                                className="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs font-medium hover:bg-primary/20"
                              >
                                {asset.asset_id}
                              </button>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <div className="font-medium text-sm">{asset.name || '-'}</div>
                              <div className="text-muted-foreground">{asset.type || '-'}</div>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <div className="font-medium">{asset.brand || '-'}</div>
                              <div className="text-muted-foreground">{asset.configuration || "-"}</div>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{asset.serial_number || '-'}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{asset.location || "-"}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <div style={{ color: '#1E90FF' }}>{asset.assigned_to || "-"}</div>
                              <div className="text-muted-foreground">{asset.employee_id || "-"}</div>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              {asset.status === "Assigned" ? "-" : (asset.received_by || "-")}
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              {asset.return_date ? formatDate(asset.return_date) : formatDate(asset.assigned_date) || ""}
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{getStatusBadge(asset.status || '')}</div>
                          </td>
                          <td className="p-2 text-xs flex justify-end gap-2">
                            <div className="flex gap-1 items-center">
                              {asset.status === "Available" ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setUserName("");
                                    setEmployeeId("");
                                    setEmployeeEmail("");
                                    setShowAssignDialog(true);
                                  }}
                                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-6"
                                >
                                  <UserPlus className="h-2 w-2 mr-1" />
                                  Assign
                                </Button>
                              ) : asset.status === "Assigned" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setNewStatus("");
                                    setReturnLocation("");
                                    setReturnRemarks("");
                                    setReceivedByInput("");
                                    setShowReturnDialog(true);
                                  }}
                                  className="text-xs h-6"
                                >
                                  <UserMinus className="h-2 w-2 mr-1" />
                                  Return
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenStickerDialog(asset)}
                                className="text-xs h-6 w-6 p-0"
                              >
                                <Tag className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-xs h-6 w-6 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedAsset(asset);
                                      setShowEditDialog(true);
                                    }}
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedAsset(asset);
                                      setNewStatus(asset.status || '');
                                      setShowStatusDialog(true);
                                    }}
                                  >
                                    Status
                                  </DropdownMenuItem>
                                  {asset.status !== "Assigned" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedAsset(asset);
                                        setNewLocation(asset.location || '');
                                        setShowLocationDialog(true);
                                      }}
                                    >
                                      Location
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedAsset(asset);
                                      setShowHistoryDialog(true);
                                    }}
                                  >
                                    History
                                  </DropdownMenuItem>
                                  {asset.received_by && asset.status !== "Assigned" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedAsset(asset);
                                        setShowRevokeDialog(true);
                                      }}
                                    >
                                      Revoke
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      if (confirm("Are you sure you want to delete this asset?")) {
                                        try {
                                          await onDelete(asset.id);
                                          setError(null);
                                          toast.success("Asset deleted successfully");
                                        } catch (error) {
                                          setError("Failed to delete asset. Please try again.");
                                        }
                                      }
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </>
                      )}
                      {viewType === 'audit' && (
                        <>
                          <td className="p-2 text-xs">
                            <div className="text-left">{(currentPage - 1) * rowsPerPage + index + 1}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <button
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setShowAssignedToOnly(false);
                                  setShowDetailsDialog(true);
                                }}
                                className="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs font-medium hover:bg-primary/20"
                              >
                                {asset.asset_id}
                              </button>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <div className="font-medium text-sm">{asset.name || '-'}</div>
                              <div className="text-muted-foreground">{asset.type || '-'}</div>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <div className="font-medium">{asset.brand || '-'}</div>
                              <div className="text-muted-foreground">{asset.configuration || "-"}</div>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{asset.serial_number || '-'}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              {asset.asset_check === "Matched" ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-green-500">✓ Matched</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAssetUncheck(asset.id, asset.asset_id || '')}
                                    className="h-6 text-xs"
                                  >
                                    Uncheck
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-red-500">✗ Unmatched</span>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                      {isWarrantyView && (
                        <>
                          <td className="p-2 text-xs">
                            <div className="text-left">{(currentPage - 1) * rowsPerPage + index + 1}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <button
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setShowAssignedToOnly(false);
                                  setShowDetailsDialog(true);
                                }}
                                className="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs font-medium hover:bg-primary/20"
                              >
                                {asset.asset_id}
                              </button>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <div className="font-medium text-sm">{asset.name || '-'}</div>
                              <div className="text-muted-foreground">{asset.type || '-'}</div>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <div className="font-medium">{asset.brand || '-'}</div>
                              <div className="text-muted-foreground">{asset.configuration || "-"}</div>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{asset.serial_number || '-'}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{asset.provider || "-"}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{formatDate(asset.warranty_start)}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{formatDate(asset.warranty_end)}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{formatWarrantyPeriod(asset.warranty_end)}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{getWarrantyStatusBadge(asset.warranty_end)}</div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div>
                    Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                    {Math.min(currentPage * rowsPerPage, filteredAssets.length)} of {filteredAssets.length} assets
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Rows per page:</Label>
                    <Select
                      value={rowsPerPage.toString()}
                      onValueChange={(value) => {
                        setRowsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    &lt;
                  </Button>
                  {startPage > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        className="h-8 w-8 p-0"
                      >
                        1
                      </Button>
                      {startPage > 2 && <span className="text-sm px-2">...</span>}
                    </>
                  )}
                  {pageNumbers.map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 p-0 ${currentPage === page ? "bg-primary text-primary-foreground" : ""}`}
                    >
                      {page}
                    </Button>
                  ))}
                  {endPage < totalPages && (
                    <>
                      {endPage < totalPages - 1 && <span className="text-sm px-2">...</span>}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="h-8 w-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Asset: {selectedAsset?.name || "N/A"}</Label>
              <p className="text-sm text-muted-foreground">{selectedAsset?.asset_id || "N/A"}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <div className="flex gap-2">
                <Input
                  id="employeeId"
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    setUserName("");
                    setEmployeeEmail("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && employeeId.trim()) {
                      fetchEmployee(employeeId.trim());
                    }
                  }}
                  placeholder="Enter employee ID"
                  className="text-sm flex-1"
                  disabled={isFetchingEmployee}
                />
                <Button
                  size="sm"
                  onClick={() => fetchEmployee(employeeId.trim())}
                  disabled={!employeeId.trim() || isFetchingEmployee}
                  className="h-9"
                >
                  {isFetchingEmployee ? "Fetching..." : "Fetch"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userName">Employee Name *</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter employee name"
                className="text-sm"
                disabled={isFetchingEmployee}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeEmail">Employee Email *</Label>
              <Input
                id="employeeEmail"
                type="email"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                placeholder="Enter employee email"
                className="text-sm"
                disabled={isFetchingEmployee}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignDialog(false);
                  setUserName("");
                  setEmployeeId("");
                  setEmployeeEmail("");
                  setSelectedAsset(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignAsset}
                disabled={!userName.trim() || !employeeId.trim() || !employeeEmail.trim() || !selectedAsset || isFetchingEmployee}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Asset Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Asset: {selectedAsset?.name || "N/A"}</Label>
              <p className="text-sm text-muted-foreground">{selectedAsset?.asset_id || "N/A"}</p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusDialog(false);
                  setNewStatus("");
                  setSelectedAsset(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={!newStatus || !selectedAsset}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {selectedAsset?.status === "Assigned" && newStatus !== "Assigned" ? "Proceed to Return" : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Asset Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Asset: {selectedAsset?.name || "N/A"}</Label>
              <p className="text-sm text-muted-foreground">{selectedAsset?.asset_id || "N/A"}</p>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={newLocation} onValueChange={setNewLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLocationDialog(false);
                  setNewLocation("");
                  setSelectedAsset(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateLocation}
                disabled={!newLocation || !selectedAsset}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Return Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Asset: {selectedAsset?.name || "N/A"}</Label>
              <p className="text-sm text-muted-foreground">{selectedAsset?.asset_id || "N/A"}</p>
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newStatus !== "Assigned" && (
              <div className="space-y-2">
                <Label>Location *</Label>
                <Select value={returnLocation} onValueChange={setReturnLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Received By</Label>
              <Input
                value={receivedByInput}
                onChange={(e) => setReceivedByInput(e.target.value)}
                placeholder={receivedBy}
              />
              <p className="text-xs text-muted-foreground">Leave blank to use current user</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="returnRemarks">Remarks</Label>
              <Input
                id="returnRemarks"
                value={returnRemarks}
                onChange={(e) => setReturnRemarks(e.target.value)}
                placeholder="Enter remarks (optional)"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReturnDialog(false);
                  setReturnRemarks("");
                  setReturnLocation("");
                  setNewStatus("");
                  setReceivedByInput("");
                  setSelectedAsset(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReturnAsset}
                disabled={!selectedAsset || !newStatus || (newStatus !== "Assigned" && !returnLocation)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                Return
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke Asset Return</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Asset: {selectedAsset?.name || "N/A"}</Label>
              <p className="text-sm text-muted-foreground">{selectedAsset?.asset_id || "N/A"}</p>
            </div>
            <p className="text-sm">Are you sure you want to revoke the return of this asset? This will reassign it to the previous user and set the status to "Assigned".</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRevokeDialog(false);
                  setSelectedAsset(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRevokeAsset}
                disabled={!selectedAsset}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                Revoke
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Clear Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Clear All</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to clear all asset check details?</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelClear} className="flex-1">Cancel</Button>
              <Button onClick={handleAssetCheckClear} className="flex-1 bg-red-500 hover:bg-red-600 text-white">Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Check Dialog */}
      <Dialog open={showStatusCheckDialog} onOpenChange={setShowStatusCheckDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asset Check Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              {unmatchedCount === 0 ? (
                <span className="text-green-600">All assets are matched.</span>
              ) : (
                <span className="text-red-600">{unmatchedCount} Asset{unmatchedCount === 1 ? '' : 's'} not matched.</span>
              )}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleGenerateReport} variant="outline" className="flex-1">Generate Report</Button>
              <Button variant="outline" onClick={() => setShowStatusCheckDialog(false)} className="flex-1">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticker Dialog */}
      <Dialog open={showStickerDialog} onOpenChange={(open) => {
        setShowStickerDialog(open);
        if (!open) setSelectedAsset(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asset Sticker</DialogTitle>
          </DialogHeader>
          {selectedAsset ? (
            <>
              <p className="text-sm text-muted-foreground">Generating sticker for {selectedAsset.asset_id}</p>
              <AssetSticker asset={selectedAsset} />
            </>
          ) : (
            <div className="text-center py-4 text-destructive">
              No asset selected for sticker generation.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Scanners */}
      <EnhancedBarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(result) => setSearchTerm(result)}
      />

      <EnhancedBarcodeScanner
        isOpen={showAssetCheckScanner}
        onClose={() => setShowAssetCheckScanner(false)}
        onScan={(result) => setAssetCheckId(result)}
      />

      {/* Edit Dialog */}
      <EditAssetDialog
        asset={selectedAsset}
        assets={assets}
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setSelectedAsset(null);
        }}
        onUpdate={onUpdateAsset}
      />

      {/* Details Dialog */}
      <AssetDetailsDialog
        asset={selectedAsset}
        open={showDetailsDialog}
        onOpenChange={(open) => {
          setShowDetailsDialog(open);
          if (!open) {
            setSelectedAsset(null);
            setShowAssignedToOnly(false);
          }
        }}
        showAssignedToOnly={showAssignedToOnly}
      />

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl h-[80vh]">
          <DialogHeader className="pb-0">
            <DialogTitle className="mt-0">Edit History for {selectedAsset?.name || "N/A"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 pt-0">
            <div>
              <Label className="mt-0">Asset: {selectedAsset?.name || "N/A"}</Label>
              <p className="text-sm text-muted-foreground">{selectedAsset?.asset_id || "N/A"}</p>
            </div>
            {historyLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No edit history available.</p>
            ) : (
              <div className="relative">
                <div
                  ref={historyTableRef}
                  className="max-h-[65vh] overflow-y-auto"
                  style={{ scrollBehavior: "smooth" }}
                >
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-muted z-10">
                      <tr className="text-xs text-muted-foreground">
                        <th className="p-2 text-left">Field</th>
                        <th className="p-2 text-left">Old Value</th>
                        <th className="p-2 text-left">New Value</th>
                        <th className="p-2 text-left">Changed By</th>
                        <th className="p-2 text-left">Changed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((entry) => (
                        <tr key={entry.id} className="border-b">
                          <td className="p-2 text-xs">{entry.field_changed}</td>
                          <td className="p-2 text-xs">{entry.old_value || "-"}</td>
                          <td className="p-2 text-xs">{entry.new_value || "-"}</td>
                          <td className="p-2 text-xs">{entry.changed_by}</td>
                          <td className="p-2 text-xs">{formatDate(entry.changed_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};