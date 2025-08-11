import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, UserMinus, Search, Calendar, MoreVertical } from "lucide-react";
import { EditAssetDialog } from "./EditAssetDialog";
import { AssetDetailsDialog } from "./AssetDetailsDialog";
import { Asset } from "@/hooks/useAssets";
import { useAssetHistory } from "@/hooks/useAssetHistory";
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
  onUnassign: (assetId: string, remarks?: string, receivedBy?: string) => Promise<void>;
  onUpdateAsset: (assetId: string, updatedAsset: any) => Promise<void>;
  onUpdateStatus: (assetId: string, status: string) => Promise<void>;
  onUpdateLocation: (assetId: string, location: string) => Promise<void>;
  onUpdateAssetCheck: (assetId: string, assetCheck: string) => Promise<void>;
  onDelete: (assetId: string) => Promise<void>;
  dateRange?: { from?: Date; to?: Date };
  typeFilter?: string;
  brandFilter?: string;
  configFilter?: string;
  defaultRowsPerPage?: number;
  viewType?: 'dashboard' | 'audit' | 'amcs' | 'sites';
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
  const [returnRemarks, setReturnRemarks] = React.useState("");
  const [newStatus, setNewStatus] = React.useState("");
  const [newLocation, setNewLocation] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultRowsPerPage);
  const [error, setError] = React.useState<string | null>(null);
  const [showAssignedTo, setShowAssignedTo] = React.useState<string | null>(null);
  const [assetCheckId, setAssetCheckId] = React.useState("");
  const [checkedAssets, setCheckedAssets] = React.useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [filterCheckStatus, setFilterCheckStatus] = React.useState<string | null>(null);

  const { data: history = [], isLoading: historyLoading } = useAssetHistory(selectedAsset?.id);

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
      console.error("Error parsing user data:", err);
      return "Unknown User";
    }
  }, [user]);

  React.useEffect(() => {
    console.log("AssetList props:", { assets: assets.length, user, receivedBy });
  }, [assets, user, receivedBy]);

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initialize checkedAssets from asset_check column
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
      // In audit view, only show non-assigned assets
      if (viewType === 'audit' && asset.status === 'Assigned') {
        return false;
      }

      // Filter by Matched/Unmatched status
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
        asset.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.received_by && asset.received_by.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.warranty_start && asset.warranty_start.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.warranty_end && asset.warranty_end.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.amc_start && asset.amc_start.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.amc_end && asset.amc_end.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDateRange =
        !dateRange?.from ||
        !dateRange?.to ||
        !asset.assigned_date ||
        (new Date(asset.assigned_date) >= new Date(dateRange.from) &&
         new Date(asset.assigned_date) <= new Date(dateRange.to));

      const matchesType = typeFilter === "all" || asset.type === typeFilter;
      const matchesBrand = brandFilter === "all" || asset.brand === brandFilter;
      const matchesConfig = configFilter === "all" || asset.configuration === configFilter;

      return matchesSearch && matchesDateRange && matchesType && matchesBrand && matchesConfig;
    }).sort((a, b) => {
      if (a.status === "Available" && b.status !== "Available") return -1;
      if (a.status !== "Available" && b.status === "Available") return 1;
      const dateA = a.assigned_date ? new Date(a.assigned_date).getTime() : 0;
      const dateB = b.assigned_date ? new Date(b.assigned_date).getTime() : 0;
      return dateB - dateA;
    });
  }, [assets, searchTerm, dateRange, typeFilter, brandFilter, configFilter, filterCheckStatus]);

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
        await onAssign(selectedAsset.id, userName.trim(), employeeId.trim());
        setShowAssignDialog(false);
        setUserName("");
        setEmployeeId("");
        setSelectedAsset(null);
        setError(null);
      } catch (error) {
        console.error("Assign failed:", error);
        setError("Failed to assign asset. Please try again.");
      }
    }
  };

  const handleUpdateStatus = async () => {
    if (selectedAsset && newStatus) {
      try {
        await onUpdateStatus(selectedAsset.id, newStatus);
        setShowStatusDialog(false);
        setNewStatus("");
        setSelectedAsset(null);
        setError(null);
      } catch (error) {
        console.error("Update status failed:", error);
        setError("Failed to update status. Please try again.");
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
        console.error("Update location failed:", error);
        setError("Failed to update location. Please try again.");
      }
    }
  };

  const handleReturnAsset = async () => {
    if (selectedAsset) {
      try {
        await onUnassign(selectedAsset.id, returnRemarks, receivedBy);
        setShowReturnDialog(false);
        setReturnRemarks("");
        setSelectedAsset(null);
        setError(null);
      } catch (error) {
        console.error("Return failed:", error);
        setError("Failed to return asset. Please try again.");
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
          console.error("Asset check update failed:", error);
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
      console.error("Asset uncheck failed:", error);
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
      console.error("Clear asset checks failed:", error);
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
    // Toggle filter: if clicking the same status, clear the filter
    setFilterCheckStatus(prev => prev === status ? null : status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Assigned":
        return <Badge className="bg-warning text-warning-foreground">Assigned</Badge>;
      case "Available":
        return <Badge className="bg-success text-success-foreground">Available</Badge>;
      case "Scrap/Damage":
        return <Badge className="bg-destructive text-destructive-foreground">Scrap/Damage</Badge>;
      case "Sold":
        return <Badge className="bg-blue-500 text-white">Sold</Badge>;
      case "Others":
        return <Badge variant="secondary">Others</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(/(\d+)(st|nd|rd|th)/, "$1").replace(',', '');
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

  if (!assets || assets.length === 0) {
    console.log("No assets provided to AssetList");
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

  const isWarrantyView = viewType === 'amcs' || viewType === 'sites';
  const isAuditView = viewType === 'audit';

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Asset Inventory ({filteredAssets.length} items)
          </CardTitle>
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
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-muted text-xs text-muted-foreground">
                    <th className="p-2 w-[5%] text-left">S.No.</th>
                    <th className="p-2 w-[8%] text-left">Asset ID</th>
                    <th className="p-2 w-[12%] text-left">Asset Details</th>
                    <th className="p-2 w-[14%] text-left">Specifications</th>
                    {isWarrantyView && <th className="p-2 w-[12%] text-left">Warranty</th>}
                    {isWarrantyView && <th className="p-2 w-[12%] text-left">AMC</th>}
                    <th className="p-2 w-[15%] text-left">Serial Number</th>
                    <th className="p-2 w-[8%] text-left">Employee ID</th>
                    <th className="p-2 w-[12%] text-left">Received By</th>
                    <th className="p-2 w-[8%] text-left">Date</th>
                    <th className="p-2 w-[8%] text-left">Status</th>
                    {isAuditView && <th className="p-2 w-[10%] text-left">Asset Check</th>}
                    {!isAuditView && <th className="p-2 w-[10%] text-left">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssets.map((asset, index) => (
                    <tr key={asset.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-xs">
                        <div className="text-left">{(currentPage - 1) * rowsPerPage + index + 1}</div>
                      </td>
                      <td className="p-2 text-xs">
                        <div className="text-left">
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
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
                      {isWarrantyView && (
                        <td className="p-2 text-xs">
                          <div className="text-left">
                            Start: {formatDate(asset.warranty_start)} <br />
                            End: {formatDate(asset.warranty_end)}
                          </div>
                        </td>
                      )}
                      {isWarrantyView && (
                        <td className="p-2 text-xs">
                          <div className="text-left">
                            Start: {formatDate(asset.amc_start)} <br />
                            End: {formatDate(asset.amc_end)}
                          </div>
                        </td>
                      )}
                      <td className="p-2 text-xs">
                        <div className="text-left">
                          <code className="bg-muted px-1 py-0.5 rounded text-xs">
                            {asset.serial_number}
                          </code>
                        </div>
                      </td>
                      <td className="p-2 text-xs">
                        <div className="text-left">
                          {asset.employee_id ? (
                            <button
                              onClick={() => setShowAssignedTo(showAssignedTo === asset.id ? null : asset.id)}
                              className="bg-blue-50 text-blue-700 px-1 py-0.5 rounded text-xs hover:bg-blue-100"
                            >
                              {asset.employee_id}
                            </button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                          {showAssignedTo === asset.id && asset.assigned_to && (
                            <div className="text-xs font-medium mt-1">{asset.assigned_to}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-xs">
                        <div className="text-left">
                          {asset.received_by ? (
                            <div className="font-medium text-xs">{asset.received_by}</div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-xs">
                        <div className="text-left">
                          {asset.status === "Available" && asset.return_date
                            ? formatDate(asset.return_date)
                            : asset.assigned_date
                            ? formatDate(asset.assigned_date)
                            : "No date"}
                        </div>
                      </td>
                      <td className="p-2 text-xs">
                        <div className="text-left">{getStatusBadge(asset.status)}</div>
                      </td>
                      {isAuditView && (
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
                      )}
                      {!isAuditView && (
                        <td className="p-2 text-xs flex justify-between">
                          <div className="flex gap-1">
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
                            ) : asset.status === "Assigned" ? (
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
                            ) : null}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-primary hover:text-primary-foreground text-xs h-6"
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
                                    } catch (error) {
                                      console.error("Delete failed:", error);
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
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </Button>
                {startPage > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                  >
                    1
                  </Button>
                )}
                {startPage > 2 && <span className="text-sm">...</span>}
                {pageNumbers.map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-primary text-primary-foreground" : ""}
                  >
                    {page}
                  </Button>
                ))}
                {endPage < totalPages - 1 && <span className="text-sm">...</span>}
                {endPage < totalPages && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
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
              <Label>Asset: {selectedAsset?.name}</Label>
              <p className="text-sm text-muted-foreground">{selectedAsset?.asset_id}</p>
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
                disabled={!userName.trim() || !employeeId.trim()}
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
              <Label>Asset: {selectedAsset?.name}</Label>
              <p className="text-sm text-muted-foreground">{selectedAsset?.asset_id}</p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {isAuditView ? (
                    <>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Scrap/Damage">Scrap/Damage</SelectItem>
                      <SelectItem value="Sold">Sold</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Assigned">Assigned</SelectItem>
                      <SelectItem value="Scrap/Damage">Scrap/Damage</SelectItem>
                      <SelectItem value="Sold">Sold</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </>
                  )}
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
                disabled={!newStatus}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                Update
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
              <Label>Asset: {selectedAsset?.name}</Label>
              <p className="text-sm text-muted-foreground">{selectedAsset?.asset_id}</p>
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
                disabled={!newLocation}
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
              <Label>Asset: {selectedAsset?.name}</Label>
              <p className="text-sm text-muted-foreground">{selectedAsset?.asset_id}</p>
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
              <Label>Received By</Label>
              <Input
                value={receivedBy}
                disabled
                className="text-muted-foreground"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReturnDialog(false);
                  setReturnRemarks("");
                  setSelectedAsset(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReturnAsset}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                Return
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditAssetDialog
        asset={selectedAsset}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdate={onUpdateAsset}
      />

      <AssetDetailsDialog
        asset={selectedAsset}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl h-[80vh]">
          <DialogHeader className="pb-0">
            <DialogTitle className="mt-0">Edit History for {selectedAsset?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 pt-0">
            <div>
              <Label className="mt-0">Asset: {selectedAsset?.name}</Label>
              <p className="text-sm text-muted-foreground">{selectedAsset?.asset_id}</p>
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
                    <thead>
                      <tr className="bg-muted text-xs text-muted-foreground">
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
                          <td className="p-2 text-xs">
                            {formatDate(entry.changed_at)}
                          </td>
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
    </Card>
  );
};