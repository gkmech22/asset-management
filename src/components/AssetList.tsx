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
import { useAssetHistory } from "@/hooks/useAssetHistory";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EnhancedBarcodeScanner } from "./EnhancedBarcodeScanner";
import { toast } from "sonner";

interface Asset {
  id: string;
  asset_id: string;
  name: string;
  type: string;
  brand: string;
  configuration?: string;
  serial_number: string;
  status: string;
  location: string;
  assigned_to?: string | null;
  employee_id?: string | null;
  assigned_date?: string | null;
  received_by?: string | null;
  return_date?: string | null;
  remarks?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
  warranty_start?: string | null;
  warranty_end?: string | null;
  asset_check?: string | null;
  provider?: string | null;
  warranty_status?: string | null;
  recovery_amount?: number | null;
}

interface AssetListProps {
  assets: Asset[];
  onAssign: (assetId: string, userName: string, employeeId: string) => Promise<void>;
  onUnassign: (assetId: string, remarks?: string, receivedBy?: string, location?: string, recoveryAmount?: number) => Promise<void>;
  onUpdateAsset: (assetId: string, updatedAsset: Partial<Asset>) => Promise<void>;
  onUpdateStatus: (assetId: string, status: string, recoveryAmount?: number) => Promise<void>;
  onUpdateLocation: (assetId: string, location: string) => Promise<void>;
  onUpdateAssetCheck: (assetId: string, assetCheck: string) => Promise<void>;
  onDelete: (assetId: string) => Promise<void>;
  dateRange?: { from?: Date; to?: Date };
  typeFilter?: string;
  brandFilter?: string;
  configFilter?: string;
  statusFilter?: string;
  defaultRowsPerPage?: number;
  viewType?: "dashboard" | "audit" | "amcs" | "summary";
}

export const AssetList: React.FC<AssetListProps> = ({
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
  viewType = "dashboard",
}) => {
  const { user } = useAuth() || { user: null };
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedAsset, setSelectedAsset] = React.useState<Asset | null>(null);
  const [userName, setUserName] = React.useState("");
  const [employeeId, setEmployeeId] = React.useState("");
  const [showAssignDialog, setShowAssignDialog] = React.useState(false);
  const [showStatusDialog, setShowStatusDialog] = React.useState(false);
  const [showLocationDialog, setShowLocationDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = React.useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = React.useState(false);
  const [showReturnDialog, setShowReturnDialog] = React.useState(false);
  const [showStickerDialog, setShowStickerDialog] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [showStatusCheckDialog, setShowStatusCheckDialog] = React.useState(false);
  const [returnRemarks, setReturnRemarks] = React.useState("");
  const [returnLocation, setReturnLocation] = React.useState("");
  const [recoveryAmount, setRecoveryAmount] = React.useState("");
  const [newStatus, setNewStatus] = React.useState("");
  const [newLocation, setNewLocation] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultRowsPerPage);
  const [error, setError] = React.useState<string | null>(null);
  const [assetCheckId, setAssetCheckId] = React.useState("");
  const [checkedAssets, setCheckedAssets] = React.useState<Set<string>>(new Set());
  const [filterCheckStatus, setFilterCheckStatus] = React.useState<string | null>(null);
  const [showScanner, setShowScanner] = React.useState(false);
  const [showAssetCheckScanner, setShowAssetCheckScanner] = React.useState(false);

  const { data: history = [], isLoading: historyLoading } = useAssetHistory(selectedAsset?.id || "");

  // Calculate warranty period
  const getWarrantyPeriod = (startDate: string | null, endDate: string | null): string => {
    if (!startDate || !endDate) return "N/A";
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "N/A";

    const today = new Date();
    const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) return "Expired";

    const years = Math.floor(daysRemaining / 365);
    const remainingDaysAfterYears = daysRemaining % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;

    return `${years > 0 ? `${years} Year${years > 1 ? "s" : ""} ` : ""}${months > 0 ? `${months} Month${months > 1 ? "s" : ""} ` : ""}${days > 0 ? `${days} Day${days > 1 ? "s" : ""}` : ""}`.trim();
  };

  // Render warranty status badge
  const getWarrantyStatusBadge = (warrantyEnd: string | null) => {
    if (!warrantyEnd) return <Badge variant="secondary">N/A</Badge>;
    const endDate = new Date(warrantyEnd);
    const today = new Date();
    const isWarrantyActive = endDate.getTime() > today.getTime();
    return isWarrantyActive ? (
      <Badge className="bg-green-500 text-white">In Warranty</Badge>
    ) : (
      <Badge className="bg-red-500 text-white">Out of Warranty</Badge>
    );
  };

  // Predefined locations
  const locations = [
    "Mumbai Office",
    "Hyderabad WH",
    "Ghaziabad WH",
    "Bhiwandi WH",
    "Patiala WH",
    "Bangalore Office",
    "Kolkata WH",
    "Trichy WH",
    "Gurugram Office",
    "Indore WH",
    "Bangalore WH",
    "Jaipur WH",
  ];

  // Derive receivedBy
  const receivedBy = React.useMemo(() => {
    if (!user) return "Unknown User";
    if (user.displayName) return user.displayName;
    if (user.email) {
      const prefix = user.email.split("@")[0];
      const parts = prefix.split(/[_.\-]/).filter(Boolean);
      return parts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
    }
    return "Unknown User";
  }, [user]);

  // Clear error after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initialize checked assets for audit view
  React.useEffect(() => {
    const initialChecked = new Set<string>();
    assets.forEach((asset) => {
      if (asset.asset_check === "Matched" && asset.asset_id && asset.serial_number) {
        initialChecked.add(asset.asset_id);
        initialChecked.add(asset.serial_number);
      }
    });
    setCheckedAssets(initialChecked);
  }, [assets]);

  // Filter assets
  const filteredAssets = React.useMemo(() => {
    return assets
      .filter((asset): boolean => {
        if (!asset) return false;
        if (viewType === "audit" && asset.status === "Assigned") return false;

        const matchesSearch =
          !searchTerm ||
          Object.entries(asset).some(([key, value]) =>
            value &&
            typeof value === "string" &&
            ["name", "asset_id", "brand", "serial_number", "assigned_to", "employee_id", "received_by", "status", "location", "warranty_start", "warranty_end", "provider"].includes(key) &&
            value.toLowerCase().includes(searchTerm.toLowerCase())
          );

        const matchesDateRange =
          !dateRange?.from ||
          !dateRange?.to ||
          !asset.assigned_date ||
          (new Date(asset.assigned_date) >= dateRange.from &&
           new Date(asset.assigned_date) <= dateRange.to);

        const matchesType = typeFilter === "all" || asset.type === typeFilter;
        const matchesBrand = brandFilter === "all" || asset.brand === brandFilter;
        const matchesConfig = configFilter === "all" || asset.configuration === configFilter;
        const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
        const matchesCheckStatus = !filterCheckStatus || asset.asset_check === filterCheckStatus;

        return matchesSearch && matchesDateRange && matchesType && matchesBrand && matchesConfig && matchesStatus && matchesCheckStatus;
      })
      .sort((a, b) => {
        if (a.status === "Available" && b.status !== "Available") return -1;
        if (a.status !== "Available" && b.status === "Available") return 1;
        const dateA = a.assigned_date ? new Date(a.assigned_date).getTime() : 0;
        const dateB = b.assigned_date ? new Date(b.assigned_date).getTime() : 0;
        return dateB - dateA;
      });
  }, [assets, searchTerm, dateRange, typeFilter, brandFilter, configFilter, statusFilter, filterCheckStatus]);

  // Calculate matched and unmatched counts
  const matchedCount = React.useMemo(() => filteredAssets.filter((asset) => asset.asset_check === "Matched").length, [filteredAssets]);
  const unmatchedCount = React.useMemo(() => filteredAssets.length - matchedCount, [filteredAssets, matchedCount]);

  // Paginate assets
  const totalPages = Math.ceil(filteredAssets.length / rowsPerPage);
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Handle asset assignment
  const handleAssignAsset = async () => {
    if (!selectedAsset || !userName.trim() || !employeeId.trim()) {
      setError("Employee ID and Name are required");
      toast.error("Employee ID and Name are required");
      return;
    }

    try {
      const existingAssetWithEmployeeId = assets.find(
        (asset) => asset.employee_id === employeeId && asset.id !== selectedAsset.id
      );
      const existingAssetWithSerial = assets.find(
        (asset) => asset.serial_number === selectedAsset.serial_number && asset.employee_id !== employeeId && asset.id !== selectedAsset.id
      );

      if (existingAssetWithEmployeeId) {
        setError(`Employee ID ${employeeId} is already assigned to asset ${existingAssetWithEmployeeId.asset_id}`);
        toast.error(`Employee ID ${employeeId} is already assigned to asset ${existingAssetWithEmployeeId.asset_id}`);
        return;
      }
      if (existingAssetWithSerial) {
        setError(`Serial Number ${selectedAsset.serial_number} is already assigned to Employee ID ${existingAssetWithSerial.employee_id}`);
        toast.error(`Serial Number ${selectedAsset.serial_number} is already assigned to Employee ID ${existingAssetWithSerial.employee_id}`);
        return;
      }

      await onAssign(selectedAsset.id, userName.trim(), employeeId.trim());
      await onUpdateAsset(selectedAsset.id, {
        status: "Assigned",
        assigned_to: userName.trim(),
        employee_id: employeeId.trim(),
        assigned_date: new Date().toISOString(),
      });
      setShowAssignDialog(false);
      setUserName("");
      setEmployeeId("");
      setSelectedAsset(null);
      setError(null);
      toast.success("Asset assigned successfully");
    } catch (error: any) {
      console.error("AssetList: Assign failed:", error.message, error.stack);
      setError("Failed to assign asset. Please try again.");
      toast.error("Failed to assign asset. Please try again.");
    }
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!selectedAsset || !newStatus) {
      setError("Status is required");
      toast.error("Status is required");
      return;
    }

    try {
      const recoveryAmountNum = recoveryAmount ? parseFloat(recoveryAmount) : undefined;
      if (["Sale", "Lost", "Emp Damage", "Courier Damage"].includes(newStatus) && (isNaN(recoveryAmountNum) || recoveryAmountNum < 0)) {
        setError("Please enter a valid non-negative recovery amount");
        toast.error("Please enter a valid non-negative recovery amount");
        return;
      }

      await onUpdateStatus(selectedAsset.id, newStatus, recoveryAmountNum);
      await onUpdateAsset(selectedAsset.id, {
        status: newStatus,
        recovery_amount: recoveryAmountNum,
        received_by: newStatus === "Available" ? null : receivedBy,
        return_date: newStatus === "Available" ? null : new Date().toISOString(),
      });
      setShowStatusDialog(false);
      setNewStatus("");
      setRecoveryAmount("");
      setSelectedAsset(null);
      setError(null);
      toast.success("Status updated successfully");
    } catch (error: any) {
      console.error("AssetList: Update status failed:", error.message, error.stack);
      setError("Failed to update status. Please try again.");
      toast.error("Failed to update status. Please try again.");
    }
  };

  // Handle asset return
  const handleReturnAsset = async () => {
    if (!selectedAsset || !returnLocation) {
      setError("Location is required");
      toast.error("Location is required");
      return;
    }

    try {
      const recoveryAmountNum = recoveryAmount ? parseFloat(recoveryAmount) : undefined;
      if (["Sale", "Lost", "Emp Damage", "Courier Damage"].includes(newStatus) && (isNaN(recoveryAmountNum) || recoveryAmountNum < 0)) {
        setError("Please enter a valid non-negative recovery amount");
        toast.error("Please enter a valid non-negative recovery amount");
        return;
      }

      await onUnassign(selectedAsset.id, returnRemarks, receivedBy, returnLocation, recoveryAmountNum);
      await onUpdateStatus(selectedAsset.id, newStatus || "Available", recoveryAmountNum);
      await onUpdateAsset(selectedAsset.id, {
        status: newStatus || "Available",
        assigned_to: null,
        employee_id: null,
        assigned_date: null,
        received_by: receivedBy,
        return_date: new Date().toISOString(),
        recovery_amount: recoveryAmountNum,
        location: returnLocation,
      });
      setShowReturnDialog(false);
      setReturnRemarks("");
      setReturnLocation("");
      setNewStatus("");
      setRecoveryAmount("");
      setSelectedAsset(null);
      setError(null);
      toast.success("Asset returned successfully");
    } catch (error: any) {
      console.error("AssetList: Return failed:", error.message, error.stack);
      setError("Failed to return asset. Please try again.");
      toast.error("Failed to return asset. Please try again.");
    }
  };

  // Handle location update
  const handleUpdateLocation = async () => {
    if (!selectedAsset || !newLocation) {
      setError("Location is required");
      toast.error("Location is required");
      return;
    }

    try {
      await onUpdateLocation(selectedAsset.id, newLocation);
      await onUpdateAsset(selectedAsset.id, { location: newLocation });
      setShowLocationDialog(false);
      setNewLocation("");
      setSelectedAsset(null);
      setError(null);
      toast.success("Location updated successfully");
    } catch (error: any) {
      console.error("AssetList: Update location failed:", error.message, error.stack);
      setError("Failed to update location. Please try again.");
      toast.error("Failed to update location. Please try again.");
    }
  };

  // Handle asset check
  const handleAssetCheck = async () => {
    if (!assetCheckId) {
      setError("Asset ID or Serial Number is required");
      toast.error("Asset ID or Serial Number is required");
      return;
    }

    try {
      const asset = assets.find(
        (a) => a.asset_id === assetCheckId || a.serial_number === assetCheckId
      );
      if (asset) {
        await onUpdateAssetCheck(asset.id, "Matched");
        setCheckedAssets((prev) => {
          const newSet = new Set(prev);
          if (asset.asset_id) newSet.add(asset.asset_id);
          if (asset.serial_number) newSet.add(asset.serial_number);
          return newSet;
        });
        setAssetCheckId("");
        setError(null);
        toast.success("Asset checked successfully");
      } else {
        setError("Asset not found");
        toast.error("Asset not found");
      }
    } catch (error: any) {
      console.error("AssetList: Asset check failed:", error.message, error.stack);
      setError("Failed to check asset. Please try again.");
      toast.error("Failed to check asset. Please try again.");
    }
  };

  // Handle asset uncheck
  const handleAssetUncheck = async (assetId: string, id: string) => {
    try {
      await onUpdateAssetCheck(assetId, "");
      setCheckedAssets((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setError(null);
      toast.success("Asset unchecked successfully");
    } catch (error: any) {
      console.error("AssetList: Asset uncheck failed:", error.message, error.stack);
      setError("Failed to uncheck asset. Please try again.");
      toast.error("Failed to uncheck asset. Please try again.");
    }
  };

  // Handle status check filter
  const handleFilterCheckStatus = (status: string) => {
    setFilterCheckStatus(status);
  };

  // Clear all checks
  const handleClearAll = async () => {
    try {
      for (const asset of assets) {
        if (asset.asset_check === "Matched") {
          await onUpdateAssetCheck(asset.id, "");
        }
      }
      setCheckedAssets(new Set());
      setFilterCheckStatus(null);
      setShowConfirmDialog(false);
      setError(null);
      toast.success("All checks cleared successfully");
    } catch (error: any) {
      console.error("AssetList: Clear all failed:", error.message, error.stack);
      setError("Failed to clear checks. Please try again.");
      toast.error("Failed to clear checks. Please try again.");
    }
  };

  // Render status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <Badge className="bg-green-500 text-white">Available</Badge>;
      case "Assigned":
        return <Badge className="bg-blue-500 text-white">Assigned</Badge>;
      case "Scrap/Damage":
        return <Badge className="bg-red-500 text-white">Scrap/Damage</Badge>;
      case "Sale":
        return <Badge className="bg-blue-600 text-white">Sale</Badge>;
      case "Lost":
        return <Badge className="bg-red-600 text-white">Lost</Badge>;
      case "Emp Damage":
        return <Badge className="bg-orange-600 text-white">Emp Damage</Badge>;
      case "Courier Damage":
        return <Badge className="bg-purple-600 text-white">Courier Damage</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  // Format dates
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).replace(/(\d+)(st|nd|rd|th)/, "$1");
  };

  // Pagination page numbers
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    return { startPage, endPage, pageNumbers };
  };

  const { startPage, endPage, pageNumbers } = getPageNumbers();

  // Handle sticker dialog
  const handleOpenStickerDialog = (asset: Asset) => {
    if (!asset || !asset.asset_id || !asset.serial_number) {
      setError("Invalid asset selected for sticker generation.");
      toast.error("Invalid asset selected for sticker generation.");
      return;
    }
    setSelectedAsset(asset);
    setShowStickerDialog(true);
  };

  // Handle invalid assets prop
  if (!Array.isArray(assets)) {
    console.error("AssetList: Invalid assets prop, expected array:", assets);
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Asset Inventory (0 items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-destructive">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-sm">Invalid assets data provided. Please check the data source.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle empty assets
  if (assets.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Asset Inventory (0 items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Assets Available</h3>
            <p className="text-sm text-muted-foreground">
              No assets are currently available in the system. Please add assets or check your filters.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isWarrantyView = viewType === "amcs" || viewType === "summary";
  const isAuditView = viewType === "audit";

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
              onChange={(e) => setSearchTerm(e.target.value)}
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
                    if (e.key === "Enter") {
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
              <Button onClick={handleAssetCheck} size="sm" className="h-9 text-sm">
                Check
              </Button>
              <Button onClick={() => setShowStatusCheckDialog(true)} size="sm" variant="outline" className="h-9 text-sm">
                Status
              </Button>
              <Button onClick={() => setShowConfirmDialog(true)} variant="outline" size="sm" className="h-9 text-sm">
                Clear All
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-4 text-destructive">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Assets Found</h3>
            <p className="text-sm text-muted-foreground">
              No assets match your current filters or search criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[60vh] relative">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-muted z-10">
                  <tr className="text-xs text-muted-foreground">
                    {viewType === "dashboard" && (
                      <>
                        <th className="p-2 w-[5%] text-left">S.No.</th>
                        <th className="p-2 w-[10%] text-left">Asset ID</th>
                        <th className="p-2 w-[15%] text-left">Asset Details</th>
                        <th className="p-2 w-[20%] text-left">Specifications</th>
                        <th className="p-2 w-[10%] text-left">Serial Number</th>
                        <th className="p-2 w-[10%] text-left">Employee ID</th>
                        <th className="p-2 w-[10%] text-left">Received By</th>
                        <th className="p-2 w-[10%] text-left">Date</th>
                        <th className="p-2 w-[10%] text-left">Status</th>
                        <th className="p-2 w-[10%] text-left">Recovery Amount</th>
                        <th className="p-2 w-[10%] text-left">Actions</th>
                      </>
                    )}
                    {viewType === "audit" && (
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
                        <th className="p-2 w-[12%] text-left">Provider</th>
                        <th className="p-2 w-[12%] text-left">Warranty Start</th>
                        <th className="p-2 w-[12%] text-left">Warranty End</th>
                        <th className="p-2 w-[12%] text-left">Warranty Period</th>
                        <th className="p-2 w-[12%] text-left">Warranty Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssets.map((asset, index) => (
                    <tr key={asset.id} className="border-b hover:bg-muted/50">
                      {viewType === "dashboard" && (
                        <>
                          <td className="p-2 text-xs">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                          <td className="p-2 text-xs">
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowDetailsDialog(true);
                              }}
                              className="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs font-medium hover:bg-primary/20"
                            >
                              {asset.asset_id}
                            </button>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="font-medium text-sm">{asset.name || "-"}</div>
                            <div className="text-muted-foreground">{asset.type || "-"}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="font-medium">{asset.brand || "-"}</div>
                            <div className="text-muted-foreground">{asset.configuration || "-"}</div>
                          </td>
                          <td className="p-2 text-xs">{asset.serial_number || "-"}</td>
                          <td className="p-2 text-xs">{asset.employee_id || "-"}</td>
                          <td className="p-2 text-xs">{asset.received_by || "-"}</td>
                          <td className="p-2 text-xs">
                            {asset.return_date ? formatDate(asset.return_date) : formatDate(asset.assigned_date)}
                          </td>
                          <td className="p-2 text-xs">{getStatusBadge(asset.status)}</td>
                          <td className="p-2 text-xs">{asset.recovery_amount ? `$${asset.recovery_amount.toFixed(2)}` : "-"}</td>
                          <td className="p-2 text-xs flex justify-end gap-2">
                            <div className="flex gap-1 items-center">
                              {asset.status === "Available" ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setShowAssignDialog(true);
                                  }}
                                  className="bg-gradient-primary hover:shadow-glow transition-smooth text-xs h-6"
                                >
                                  <UserPlus className="h-2 w-2 mr-1" />
                                  Assign
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setShowReturnDialog(true);
                                  }}
                                  className="hover:bg-warning hover:text-warning-foreground text-xs h-6"
                                >
                                  <UserMinus className="h-2 w-2 mr-1" />
                                  Return
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenStickerDialog(asset)}
                                className="hover:bg-primary hover:text-primary-foreground text-xs h-6 w-6 p-0"
                              >
                                <Tag className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="hover:bg-primary hover:text-primary-foreground text-xs h-6 w-6 p-0"
                                  >
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
                                      setNewStatus(asset.status);
                                      setRecoveryAmount(asset.recovery_amount?.toString() || "");
                                      setShowStatusDialog(true);
                                    }}
                                  >
                                    Status
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedAsset(asset);
                                      setNewLocation(asset.location);
                                      setShowLocationDialog(true);
                                    }}
                                  >
                                    Location
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedAsset(asset);
                                      setShowHistoryDialog(true);
                                    }}
                                  >
                                    History
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      if (confirm("Are you sure you want to delete this asset?")) {
                                        try {
                                          await onDelete(asset.id);
                                          setError(null);
                                          toast.success("Asset deleted successfully");
                                        } catch (error: any) {
                                          console.error("AssetList: Delete failed:", error.message, error.stack);
                                          setError("Failed to delete asset. Please try again.");
                                          toast.error("Failed to delete asset. Please try again.");
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
                      {viewType === "audit" && (
                        <>
                          <td className="p-2 text-xs">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                          <td className="p-2 text-xs">
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowDetailsDialog(true);
                              }}
                              className="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs font-medium hover:bg-primary/20"
                            >
                              {asset.asset_id}
                            </button>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="font-medium text-sm">{asset.name || "-"}</div>
                            <div className="text-muted-foreground">{asset.type || "-"}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="font-medium">{asset.brand || "-"}</div>
                            <div className="text-muted-foreground">{asset.configuration || "-"}</div>
                          </td>
                          <td className="p-2 text-xs">{asset.serial_number || "-"}</td>
                          <td className="p-2 text-xs">
                            {asset.asset_check === "Matched" ? (
                              <div className="flex items-center gap-2">
                                <span className="text-green-500">Matched</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAssetUncheck(asset.id, asset.asset_id)}
                                  className="h-6 text-xs"
                                >
                                  Uncheck
                                </Button>
                              </div>
                            ) : (
                              <span className="text-red-500">Unmatched</span>
                            )}
                          </td>
                        </>
                      )}
                      {isWarrantyView && (
                        <>
                          <td className="p-2 text-xs">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                          <td className="p-2 text-xs">
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowDetailsDialog(true);
                              }}
                              className="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs font-medium hover:bg-primary/20"
                            >
                              {asset.asset_id}
                            </button>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="font-medium text-sm">{asset.name || "-"}</div>
                            <div className="text-muted-foreground">{asset.type || "-"}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="font-medium">{asset.brand || "-"}</div>
                            <div className="text-muted-foreground">{asset.configuration || "-"}</div>
                          </td>
                          <td className="p-2 text-xs">{asset.serial_number || "-"}</td>
                          <td className="p-2 text-xs">{asset.provider || "-"}</td>
                          <td className="p-2 text-xs">{formatDate(asset.warranty_start)}</td>
                          <td className="p-2 text-xs">{formatDate(asset.warranty_end)}</td>
                          <td className="p-2 text-xs">{getWarrantyPeriod(asset.warranty_start, asset.warranty_end)}</td>
                          <td className="p-2 text-xs">{getWarrantyStatusBadge(asset.warranty_end)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          </>
        )}
      </CardContent>

      {/* Assign Asset Dialog */}
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
              <Input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter employee ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userName">Employee Name *</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter employee name"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignDialog(false);
                  setUserName("");
                  setEmployeeId("");
                  setSelectedAsset(null);
                  setError(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignAsset}
                disabled={!userName.trim() || !employeeId.trim() || !selectedAsset}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
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
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Scrap/Damage">Scrap/Damage</SelectItem>
                  <SelectItem value="Sale">Sale</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Emp Damage">Emp Damage</SelectItem>
                  <SelectItem value="Courier Damage">Courier Damage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {["Sale", "Lost", "Emp Damage", "Courier Damage"].includes(newStatus) && (
              <div className="space-y-2">
                <Label htmlFor="recoveryAmount">Recovery Amount *</Label>
                <Input
                  id="recoveryAmount"
                  type="number"
                  value={recoveryAmount}
                  onChange={(e) => setRecoveryAmount(e.target.value)}
                  placeholder="Enter recovery amount"
                  min="0"
                />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusDialog(false);
                  setNewStatus("");
                  setRecoveryAmount("");
                  setSelectedAsset(null);
                  setError(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={!newStatus || !selectedAsset}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Location Dialog */}
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLocationDialog(false);
                  setNewLocation("");
                  setSelectedAsset(null);
                  setError(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateLocation}
                disabled={!newLocation || !selectedAsset}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Asset Dialog */}
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
            <div className="space-y-2">
              <Label>Received By</Label>
              <Input value={receivedBy} disabled className="text-muted-foreground" />
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
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Scrap/Damage">Scrap/Damage</SelectItem>
                  <SelectItem value="Sale">Sale</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Emp Damage">Emp Damage</SelectItem>
                  <SelectItem value="Courier Damage">Courier Damage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {["Sale", "Lost", "Emp Damage", "Courier Damage"].includes(newStatus) && (
              <div className="space-y-2">
                <Label htmlFor="recoveryAmount">Recovery Amount *</Label>
                <Input
                  id="recoveryAmount"
                  type="number"
                  value={recoveryAmount}
                  onChange={(e) => setRecoveryAmount(e.target.value)}
                  placeholder="Enter recovery amount"
                  min="0"
                />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReturnDialog(false);
                  setReturnRemarks("");
                  setReturnLocation("");
                  setNewStatus("");
                  setRecoveryAmount("");
                  setSelectedAsset(null);
                  setError(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReturnAsset}
                disabled={!returnLocation || !selectedAsset}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                Return
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Clear Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clear All Checks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to clear all asset checks?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleClearAll}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                Clear All
              </Button>
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
            <p className="text-sm text-muted-foreground">
              Matched: {matchedCount} | Unmatched: {unmatchedCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowStatusCheckDialog(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
          </DialogHeader>
          <EnhancedBarcodeScanner
            onScan={(result) => {
              setSearchTerm(result);
              setShowScanner(false);
            }}
            onError={(err) => setError(`Barcode scan error: ${err}`)}
          />
        </DialogContent>
      </Dialog>

      {/* Asset Check Scanner Dialog */}
      <Dialog open={showAssetCheckScanner} onOpenChange={setShowAssetCheckScanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Asset Check</DialogTitle>
          </DialogHeader>
          <EnhancedBarcodeScanner
            onScan={(result) => {
              setAssetCheckId(result);
              handleAssetCheck();
              setShowAssetCheckScanner(false);
            }}
            onError={(err) => setError(`Barcode scan error: ${err}`)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      {selectedAsset && (
        <EditAssetDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) setSelectedAsset(null);
          }}
          asset={selectedAsset}
          assets={assets}
          onUpdate={async (assetId, updatedAsset) => {
            try {
              await onUpdateAsset(assetId, updatedAsset);
              setShowEditDialog(false);
              setSelectedAsset(null);
              toast.success("Asset updated successfully");
            } catch (error: any) {
              console.error("AssetList: Update asset failed:", error.message, error.stack);
              setError("Failed to update asset. Please try again.");
              toast.error("Failed to update asset. Please try again.");
            }
          }}
        />
      )}

      {/* Asset Details Dialog */}
      {selectedAsset && (
        <AssetDetailsDialog
          open={showDetailsDialog}
          onOpenChange={(open) => {
            setShowDetailsDialog(open);
            if (!open) setSelectedAsset(null);
          }}
          asset={selectedAsset}
        />
      )}

      {/* Asset Sticker Dialog */}
      {selectedAsset && (
        <Dialog open={showStickerDialog} onOpenChange={setShowStickerDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asset Sticker</DialogTitle>
            </DialogHeader>
            <AssetSticker
              assetId={selectedAsset.asset_id}
              serialNumber={selectedAsset.serial_number}
              name={selectedAsset.name}
              onClose={() => {
                setShowStickerDialog(false);
                setSelectedAsset(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* History Dialog */}
      {selectedAsset && (
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Asset History: {selectedAsset.name || "N/A"} ({selectedAsset.asset_id || "N/A"})</DialogTitle>
            </DialogHeader>
            <div className="max-h-[50vh] overflow-y-auto">
              {historyLoading ? (
                <p className="text-sm text-muted-foreground">Loading history...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No history available.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Field Changed</th>
                      <th className="p-2 text-left">Old Value</th>
                      <th className="p-2 text-left">New Value</th>
                      <th className="p-2 text-left">Changed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry: any) => (
                      <tr key={entry.id} className="border-b">
                        <td className="p-2 text-xs">{formatDate(entry.changed_at)}</td>
                        <td className="p-2 text-xs">{entry.field_changed || "-"}</td>
                        <td className="p-2 text-xs">{entry.old_value || "-"}</td>
                        <td className="p-2 text-xs">{entry.new_value || "-"}</td>
                        <td className="p-2 text-xs">{entry.changed_by || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowHistoryDialog(false);
                  setSelectedAsset(null);
                }}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};
