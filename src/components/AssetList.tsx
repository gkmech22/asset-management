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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EnhancedBarcodeScanner } from "./EnhancedBarcodeScanner";

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
  const [recoveryAmount, setRecoveryAmount] = React.useState("");
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

  const { data: history = [], isLoading: historyLoading } = useAssetHistory(selectedAsset?.id);

  console.log("AssetList: Rendering with assets:", assets);

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

  const statusesNeedingRecovery = ["Sale", "Lost", "Emp Damage", "Courier Damage"];
  const allStatuses = ["Available", "Scrap/Damage", "Sale", "Lost", "Emp Damage", "Courier Damage"];

  const receivedBy = React.useMemo(() => {
    try {
      if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
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
    console.log("AssetList: Props updated:", { assets: assets.length, user, receivedBy });
  }, [assets, user, receivedBy]);

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
        initialChecked.add(asset.asset_id);
        initialChecked.add(asset.serial_number);
      }
    });
    setCheckedAssets(initialChecked);
  }, [assets]);

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

      const matchesSearch =
        !searchTerm ||
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.assigned_to && asset.assigned_to.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.employee_id && asset.employee_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.received_by && asset.received_by.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.assigned_date && asset.assigned_date.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.return_date && asset.return_date.toLowerCase().includes(searchTerm.toLowerCase())) ||
        asset.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.warranty_start && asset.warranty_start.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.warranty_end && asset.warranty_end.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.provider && asset.provider.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.warranty_status && asset.warranty_status.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.recovery_amount && asset.recovery_amount.toString().toLowerCase().includes(searchTerm.toLowerCase()));

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
  }, [assets, searchTerm, dateRange, typeFilter, brandFilter, configFilter, statusFilter, filterCheckStatus]);

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
    if (selectedAsset && userName.trim() && employeeId.trim()) {
      try {
        const existingAssetWithEmployeeId = assets.find(
          (asset) => asset.employee_id === employeeId && asset.id !== selectedAsset.id
        );
        const selectedAssetSerial = assets.find((asset) => asset.id === selectedAsset.id)?.serial_number;
        const existingAssetWithSerial = assets.find(
          (asset) => asset.serial_number === selectedAssetSerial && asset.employee_id !== employeeId && asset.id !== selectedAsset.id
        );

        if (existingAssetWithEmployeeId) {
          setError(`Employee ID ${employeeId} is already assigned to another asset (Serial: ${existingAssetWithEmployeeId.serial_number}).`);
          return;
        }
        if (existingAssetWithSerial) {
          setError(`Serial Number ${selectedAssetSerial} is already associated with another Employee ID (${existingAssetWithSerial.employee_id}).`);
          return;
        }

        await onAssign(selectedAsset.id, userName.trim(), employeeId.trim());
        await onUpdateAsset(selectedAsset.id, { status: "Assigned", received_by: "", return_date: "", recovery_amount: "" });
        setShowAssignDialog(false);
        setUserName("");
        setEmployeeId("");
        setSelectedAsset(null);
        setError(null);
      } catch (error) {
        console.error("AssetList: Assign failed:", error);
        setError("Failed to assign asset. Please try again.");
      }
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
        if (statusesNeedingRecovery.includes(newStatus) && !recoveryAmount) {
          setError("Recovery amount is required for this status.");
          return;
        }
        await onUpdateStatus(selectedAsset.id, newStatus);
        if (newStatus === "Assigned") {
          await onUpdateAsset(selectedAsset.id, { received_by: "", return_date: "", recovery_amount: "" });
        } else if (statusesNeedingRecovery.includes(newStatus)) {
          await onUpdateAsset(selectedAsset.id, { recovery_amount: recoveryAmount });
        }
        setShowStatusDialog(false);
        setNewStatus("");
        setRecoveryAmount("");
        setSelectedAsset(null);
        setError(null);
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
        if (statusesNeedingRecovery.includes(newStatus) && !recoveryAmount) {
          setError("Recovery amount is required for this status.");
          return;
        }
        console.log("Returning asset:", {
          assetId: selectedAsset.id,
          remarks: returnRemarks,
          receivedBy,
          returnLocation,
          recoveryAmount: statusesNeedingRecovery.includes(newStatus) ? recoveryAmount : undefined,
        });
        await onUnassign(selectedAsset.id, returnRemarks, receivedBy, newStatus !== "Assigned" ? returnLocation : undefined);
        if (newStatus && newStatus !== "Assigned") {
          await onUpdateStatus(selectedAsset.id, newStatus);
          await onUpdateAsset(selectedAsset.id, { 
            received_by: receivedBy,
            recovery_amount: statusesNeedingRecovery.includes(newStatus) ? recoveryAmount : ""
          });
        } else {
          await onUpdateStatus(selectedAsset.id, "Available");
          await onUpdateAsset(selectedAsset.id, { received_by: receivedBy, recovery_amount: "" });
        }
        setShowReturnDialog(false);
        setReturnRemarks("");
        setReturnLocation("");
        setNewStatus("");
        setRecoveryAmount("");
        setSelectedAsset(null);
        setError(null);
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
          .filter((entry: any) => entry.field_changed === "assigned_to" || entry.field_changed === "employee_id")
          .sort((a: any, b: any) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())[0];

        const userName = lastAssignment?.field_changed === "assigned_to" ? lastAssignment.new_value : selectedAsset.assigned_to || "";
        const employeeId = lastAssignment?.field_changed === "employee_id" ? lastAssignment.new_value : selectedAsset.employee_id || "";

        if (!userName || !employeeId) {
          setError("Cannot revoke: No previous assignment details found.");
          return;
        }

        await onAssign(selectedAsset.id, userName, employeeId);
        await onUpdateAsset(selectedAsset.id, { status: "Assigned", received_by: "", return_date: "", recovery_amount: "" });
        setShowRevokeDialog(false);
        setSelectedAsset(null);
        setError(null);
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
          setCheckedAssets(prev => new Set(prev).add(assetCheckId));
          setAssetCheckId("");
          setError(null);
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
      "Asset ID",
      "Asset Type",
      "Asset Name",
      "Brand",
      "Configuration",
      "Serial Number",
      "Status",
      "Asset Location",
      "Asset Check",
      "Assigned Date",
      "Return Date",
      "Received By",
      "Recovery Amount",
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
          escapeCsvField(asset.status === "Assigned" ? "" : asset.received_by),
          escapeCsvField(asset.recovery_amount),
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
        return <Badge className="bg-warning text-warning-foreground">Assigned</Badge>;
      case "Available":
        return <Badge className="bg-success text-success-foreground">Available</Badge>;
      case "Scrap/Damage":
        return <Badge className="bg-destructive text-destructive-foreground">Scrap/Damage</Badge>;
      case "Sale":
        return <Badge className="bg-blue-500 text-white">Sale</Badge>;
      case "Lost":
        return <Badge className="bg-red-500 text-white">Lost</Badge>;
      case "Emp Damage":
        return <Badge className="bg-orange-500 text-white">Emp Damage</Badge>;
      case "Courier Damage":
        return <Badge className="bg-purple-500 text-white">Courier Damage</Badge>;
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
      <Badge className="bg-green-500 text-white">In Warranty</Badge>
    ) : (
      <Badge className="bg-red-500 text-white">Out of Warranty</Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    if (viewType === 'amcs' || viewType === 'summary') {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).replace(/(\d+)(st|nd|rd|th)/, "$1");
    }
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(/(\d+)(st|nd|rd|th)/, "$1").replace(',', '');
  };

  const formatWarrantyPeriod = (warrantyEnd: string | null) => {
    if (!warrantyEnd) return "-";
    const endDate = new Date(warrantyEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Expired";

    const years = Math.floor(diffDays / 365);
    const remainingDaysAfterYears = diffDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const remainingDays = remainingDaysAfterYears % 30;

    if (years > 0) {
      return `${years} Year${years > 1 ? "s" : ""}${months > 0 ? ` ${months} Month${months > 1 ? "s" : ""}` : ""}`;
    } else if (months > 0) {
      return `${months} Month${months > 1 ? "s" : ""}${remainingDays > 0 ? ` ${remainingDays} Day${remainingDays > 1 ? "s" : ""}` : ""}`;
    } else {
      return `${diffDays} Day${diffDays > 1 ? "s" : ""}`;
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
      console.error("AssetList: Cannot open sticker dialog, invalid asset:", asset);
      setError("Invalid asset selected for sticker generation.");
      return;
    }
    console.log("AssetList: Opening sticker dialog with asset:", asset);
    setSelectedAsset(asset);
    setShowStickerDialog(true);
  };

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

  if (assets.length === 0) {
    console.log("AssetList: No assets provided");
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
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No Assets Available
            </h3>
            <p className="text-sm text-muted-foreground">
              No assets are currently available in the system. Please add assets or check your filters.
            </p>
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
              <Button
                onClick={handleAssetCheck}
                size="sm"
                className="h-9 text-sm"
              >
                Check
              </Button>
              <Button
                onClick={handleShowStatusCheck}
                size="sm"
                variant="outline"
                className="h-9 text-sm"
              >
                Status
              </Button>
              <Button
                onClick={confirmClear}
                variant="outline"
                size="sm"
                className="h-9 text-sm"
              >
                Clear All
              </Button>
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
              No Assets Found
            </h3>
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
                    {viewType === 'dashboard' && (
                      <>
                        <th className="p-2 w-[5%] text-left">S.No.</th>
                        <th className="p-2 w-[10%] text-left">Asset ID</th>
                        <th className="p-2 w-[15%] text-left">Asset Details</th>
                        <th className="p-2 w-[15%] text-left">Specifications</th>
                        <th className="p-2 w-[10%] text-left">Serial Number</th>
                        <th className="p-2 w-[10%] text-left">Location</th>
                        <th className="p-2 w-[10%] text-left">Employee ID</th>
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
                                  console.log("AssetList: Opening details dialog for asset:", asset);
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
                              <div className="font-medium text-sm">{asset.name}</div>
                              <div className="text-muted-foreground">{asset.type}</div>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <div className="font-medium">{asset.brand}</div>
                              <div className="text-muted-foreground">{asset.configuration || "-"}</div>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{asset.serial_number}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{asset.location || "-"}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <button
                                onClick={() => {
                                  console.log("AssetList: Opening assigned-to details for asset:", asset);
                                  setSelectedAsset(asset);
                                  setShowAssignedToOnly(true);
                                  setShowDetailsDialog(true);
                                }}
                                className="text-primary hover:underline"
                              >
                                {asset.employee_id || "-"}
                              </button>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              {asset.status === "Assigned" ? "-" : (asset.received_by || "-")}
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              {asset.status === "Available" && asset.return_date
                                ? formatDate(asset.return_date)
                                : formatDate(asset.assigned_date) || ""}
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{getStatusBadge(asset.status)}</div>
                          </td>
                          <td className="p-2 text-xs flex justify-end gap-2">
                            <div className="flex gap-1 items-center">
                              {asset.status === "Available" ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    console.log("AssetList: Opening assign dialog for asset:", asset);
                                    setSelectedAsset(asset);
                                    setShowAssignDialog(true);
                                  }}
                                  className="bg-gradient-primary hover:shadow-glow transition-smooth text-xs h-6"
                                >
                                  <UserPlus className="h-2 w-2 mr-1" />
                                  Assign
                                </Button>
                              ) : asset.status === "Assigned" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    console.log("AssetList: Opening return dialog for asset:", asset);
                                    setSelectedAsset(asset);
                                    setShowReturnDialog(true);
                                  }}
                                  className="hover:bg-warning hover:text-warning-foreground text-xs h-6"
                                >
                                  <UserMinus className="h-2 w-2 mr-1" />
                                  Return
                                </Button>
                              ) : null}
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
                                      console.log("AssetList: Opening edit dialog for asset:", asset);
                                      setSelectedAsset(asset);
                                      setShowEditDialog(true);
                                    }}
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      console.log("AssetList: Opening status dialog for asset:", asset);
                                      setSelectedAsset(asset);
                                      setNewStatus(asset.status);
                                      setShowStatusDialog(true);
                                    }}
                                  >
                                    Status
                                  </DropdownMenuItem>
                                  {asset.status !== "Assigned" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        console.log("AssetList: Opening location dialog for asset:", asset);
                                        setSelectedAsset(asset);
                                        setNewLocation(asset.location);
                                        setShowLocationDialog(true);
                                      }}
                                    >
                                      Location
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      console.log("AssetList: Opening history dialog for asset:", asset);
                                      setSelectedAsset(asset);
                                      setShowHistoryDialog(true);
                                    }}
                                  >
                                    History
                                  </DropdownMenuItem>
                                  {asset.received_by && asset.status !== "Assigned" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        console.log("AssetList: Opening revoke dialog for asset:", asset);
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
                                        } catch (error) {
                                          console.error("AssetList: Delete failed:", error);
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
                                  console.log("AssetList: Opening details dialog for asset:", asset);
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
                              <div className="font-medium text-sm">{asset.name}</div>
                              <div className="text-muted-foreground">{asset.type}</div>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <div className="font-medium">{asset.brand}</div>
                              <div className="text-muted-foreground">{asset.configuration || "-"}</div>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{asset.serial_number}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
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
                                  console.log("AssetList: Opening details dialog for asset:", asset);
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
                              <div className="font-medium text-sm">{asset.name}</div>
                              <div className="text-muted-foreground">{asset.type}</div>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">
                              <div className="font-medium">{asset.brand}</div>
                              <div className="text-muted-foreground">{asset.configuration || "-"}</div>
                            </div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{asset.serial_number}</div>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignDialog(false);
                  setUserName("");
                  setEmployeeId("");
                  setSelectedAsset(null);
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
            {statusesNeedingRecovery.includes(newStatus) && (
              <div className="space-y-2">
                <Label htmlFor="recoveryAmount">Recovery Amount *</Label>
                <Input
                  id="recoveryAmount"
                  type="number"
                  value={recoveryAmount}
                  onChange={(e) => setRecoveryAmount(e.target.value)}
                  placeholder="Enter recovery amount"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusDialog(false);
                  setNewStatus("");
                  setRecoveryAmount("");
                  setSelectedAsset(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={!newStatus || !selectedAsset || (statusesNeedingRecovery.includes(newStatus) && !recoveryAmount)}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                {selectedAsset?.status === "Assigned" && newStatus !== "Assigned" ? "Proceed to Return" : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <Label>Location {newStatus !== "Assigned" ? "*" : ""}</Label>
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
              <Input
                value={receivedBy}
                disabled
                className="text-muted-foreground"
              />
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
            {newStatus && newStatus !== "Assigned" && (
              <div className="space-y-2">
                <Label>New Status</Label>
                <Input
                  value={newStatus}
                  disabled
                  className="text-muted-foreground"
                />
              </div>
            )}
            {statusesNeedingRecovery.includes(newStatus) && (
              <div className="space-y-2">
                <Label htmlFor="recoveryAmount">Recovery Amount *</Label>
                <Input
                  id="recoveryAmount"
                  type="number"
                  value={recoveryAmount}
                  onChange={(e) => setRecoveryAmount(e.target.value)}
                  placeholder="Enter recovery amount"
                />
              </div>
            )}
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
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReturnAsset}
                disabled={!selectedAsset || (newStatus !== "Assigned" && !returnLocation) || (statusesNeedingRecovery.includes(newStatus) && !recoveryAmount)}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                Return
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                Revoke
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Clear All</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to clear all asset check details?</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={cancelClear}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssetCheckClear}
                className="flex-1 bg-destructive hover:shadow-glow transition-smooth"
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showStatusCheckDialog} onOpenChange={setShowStatusCheckDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asset Check Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              {unmatchedCount === 0 ? (
                <span style={{ color: 'green' }}>All assets are matched.</span>
              ) : (
                <span style={{ color: 'red' }}>{unmatchedCount} Asset{unmatchedCount === 1 ? '' : 's'} not matched.</span>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateReport}
                variant="outline"
                className="flex-1"
              >
                Generate Report
              </Button>
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

      <Dialog open={showStickerDialog} onOpenChange={(open) => {
        console.log("AssetList: Sticker Dialog open state:", open, "with selectedAsset:", selectedAsset);
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

      <EnhancedBarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(result) => setSearchTerm(result)}
        totalIFPQty="0"
        existingSerials={[]}
      />

      <EnhancedBarcodeScanner
        isOpen={showAssetCheckScanner}
        onClose={() => setShowAssetCheckScanner(false)}
        onScan={(result) => setAssetCheckId(result)}
        totalIFPQty="0"
        existingSerials={[]}
      />

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