import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, UserMinus, Search, Calendar, MoreVertical, ScanBarcode, Tag } from "lucide-react";
import { EditAssetDialog } from "./EditAssetDialog";
import { AssetDetailsDialog } from "./AssetDetailsDialog";
import { AssetSticker } from "./AssetSticker";
import { Asset } from "@/hooks/useAssets";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = React.useState(false);
  const [showReturnDialog, setShowReturnDialog] = React.useState(false);
  const [showStickerDialog, setShowStickerDialog] = React.useState(false);
  const [returnRemarks, setReturnRemarks] = React.useState("");
  const [returnLocation, setReturnLocation] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultRowsPerPage);
  const [error, setError] = React.useState<string | null>(null);
  const [assetCheckId, setAssetCheckId] = React.useState("");
  const [checkedAssets, setCheckedAssets] = React.useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [showStatusCheckDialog, setShowStatusCheckDialog] = React.useState(false);
  const [filterCheckStatus, setFilterCheckStatus] = React.useState<string | null>(null);
  const [showAssignedToOnly, setShowAssignedToOnly] = React.useState(false);

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

  const handleReturnAsset = async () => {
    if (selectedAsset) {
      try {
        console.log("Returning asset:", {
          assetId: selectedAsset.id,
          remarks: returnRemarks,
          receivedBy,
          returnLocation,
        });
        await onUnassign(selectedAsset.id, returnRemarks, receivedBy, returnLocation);
        await onUpdateStatus(selectedAsset.id, "Available");
        await onUpdateAsset(selectedAsset.id, { received_by: receivedBy, recovery_amount: "" });
        setShowReturnDialog(false);
        setReturnRemarks("");
        setReturnLocation("");
        setSelectedAsset(null);
        setError(null);
      } catch (error) {
        console.error("AssetList: Return failed:", error);
        setError("Failed to return asset. Please try again.");
      }
    }
  };

  const handleUpdateLocation = async () => {
    if (selectedAsset && returnLocation) {
      try {
        await onUpdateLocation(selectedAsset.id, returnLocation);
        setReturnLocation("");
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
                                      onUpdateStatus(asset.id, asset.status);
                                    }}
                                  >
                                    Status
                                  </DropdownMenuItem>
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
                            <div className="text-left">{asset.warranty_start ? formatDate(asset.warranty_start) : "-"}</div>
                          </td>
                          <td className="p-2 text-xs">
                            <div className="text-left">{asset.warranty_end ? formatDate(asset.warranty_end) : "-"}</div>
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
              <div className="flex items-center justify-between mt-4 text-sm">
                <div className="text-muted-foreground">
                  Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredAssets.length)} of {filteredAssets.length} assets
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {pageNumbers.map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8"
                    >
                      {pageNum}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {showAssignDialog && selectedAsset && (
        <Dialog open={showAssignDialog} onOpenChange={() => setShowAssignDialog(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Employee Name</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter employee name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter employee ID"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAssignDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAssignAsset} className="flex-1">
                  Assign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showReturnDialog && selectedAsset && (
        <Dialog open={showReturnDialog} onOpenChange={() => setShowReturnDialog(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Return Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="returnRemarks">Remarks</Label>
                <Input
                  id="returnRemarks"
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  placeholder="Optional remarks"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnLocation">Return Location</Label>
                <Input
                  id="returnLocation"
                  value={returnLocation}
                  onChange={(e) => setReturnLocation(e.target.value)}
                  placeholder="Return location"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowReturnDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleReturnAsset} className="flex-1">
                  Return
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showEditDialog && selectedAsset && (
        <EditAssetDialog
          asset={selectedAsset}
          onClose={() => setShowEditDialog(false)}
          onSubmit={(updatedAsset) => {
            onUpdateAsset(selectedAsset.id, updatedAsset);
            setShowEditDialog(false);
          }}
          assets={assets}
        />
      )}

      {showDetailsDialog && selectedAsset && (
        <AssetDetailsDialog
          asset={selectedAsset}
          open={showDetailsDialog}
          onOpenChange={() => setShowDetailsDialog(false)}
          showAssignedToOnly={showAssignedToOnly}
        />
      )}

      {showStickerDialog && selectedAsset && (
        <AssetSticker
          asset={selectedAsset}
          open={showStickerDialog}
          onOpenChange={() => setShowStickerDialog(false)}
        />
      )}

      {showConfirmDialog && (
        <Dialog open={showConfirmDialog} onOpenChange={cancelClear}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Clear All</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Are you sure you want to clear all asset checks? This action cannot be undone.</p>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={cancelClear} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAssetCheckClear} variant="destructive" className="flex-1">
                  Clear All
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};