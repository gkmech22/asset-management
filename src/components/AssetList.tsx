import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, UserMinus, Settings, Search, Calendar } from "lucide-react";
import { DateRange } from "react-day-picker";
import { EditAssetDialog } from "./EditAssetDialog";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Asset } from "@/hooks/useAssets";


interface AssetListProps {
  assets: Asset[];
  onAssign: (assetId: string, userName: string, employeeId: string) => void;
  onUnassign: (assetId: string) => void;
  onUpdateAsset: (assetId: string, updatedAsset: any) => void;
  onUpdateStatus: (assetId: string, status: string) => void;
  onUpdateLocation: (assetId: string, location: string) => void;
  onDelete: (assetId: string) => void;
  dateRange?: DateRange;
  typeFilter?: string;
  brandFilter?: string;
  configFilter?: string;
}

export const AssetList = ({
  assets,
  onAssign,
  onUnassign,
  onUpdateAsset,
  onUpdateStatus,
  onUpdateLocation,
  onDelete,
  dateRange,
  typeFilter = "all",
  brandFilter = "all",
  configFilter = "all",
}: AssetListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [userName, setUserName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 100;

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

  // Filter assets based on search, date range, and filters
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.assigned_to && asset.assigned_to.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.employee_id && asset.employee_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      asset.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDateRange =
      !dateRange?.from ||
      !dateRange?.to ||
      !asset.assigned_date ||
      (new Date(asset.assigned_date) >= dateRange.from && new Date(asset.assigned_date) <= dateRange.to);

    const matchesType = typeFilter === "all" || asset.type === typeFilter;
    const matchesBrand = brandFilter === "all" || asset.brand === brandFilter;
    const matchesConfig = configFilter === "all" || asset.configuration === configFilter;

    return matchesSearch && matchesDateRange && matchesType && matchesBrand && matchesConfig;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAssets.length / rowsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleAssignAsset = () => {
    if (selectedAsset && userName.trim() && employeeId.trim()) {
      onAssign(selectedAsset.id, userName.trim(), employeeId.trim());
      setShowAssignDialog(false);
      setUserName("");
      setEmployeeId("");
      setSelectedAsset(null);
    }
  };

  const handleUpdateStatus = () => {
    if (selectedAsset && newStatus) {
      onUpdateStatus(selectedAsset.id, newStatus);
      setShowStatusDialog(false);
      setNewStatus("");
      setSelectedAsset(null);
    }
  };

  const handleUpdateLocation = () => {
    if (selectedAsset && newLocation) {
      onUpdateLocation(selectedAsset.id, newLocation);
      setShowLocationDialog(false);
      setNewLocation("");
      setSelectedAsset(null);
    }
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
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Asset Inventory ({filteredAssets.length} items)
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAssets.length === 0 ? (
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
              <ResizablePanelGroup direction="horizontal" className="min-h-[600px] w-full border rounded-lg">
                <ResizablePanel defaultSize={12} minSize={8}>
                  <div className="p-2 h-full bg-muted/30">
                    <div className="font-medium text-xs mb-2 text-muted-foreground">Asset ID</div>
                    <div className="space-y-2">
                      {paginatedAssets.map((asset) => (
                        <div key={asset.id} className="p-2 text-xs bg-background rounded border">
                          <code className="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs font-medium">
                            {asset.asset_id}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={18} minSize={15}>
                  <div className="p-2 h-full bg-muted/30">
                    <div className="font-medium text-xs mb-2 text-muted-foreground">Asset Details</div>
                    <div className="space-y-2">
                      {paginatedAssets.map((asset) => (
                        <div key={asset.id} className="p-2 text-xs bg-background rounded border">
                          <div className="font-medium text-sm">{asset.name}</div>
                          <div className="text-xs text-muted-foreground">{asset.type}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={15} minSize={12}>
                  <div className="p-2 h-full bg-muted/30">
                    <div className="font-medium text-xs mb-2 text-muted-foreground">Configuration</div>
                    <div className="space-y-2">
                      {paginatedAssets.map((asset) => (
                        <div key={asset.id} className="p-2 text-xs bg-background rounded border">
                          <div className="text-xs font-medium">{asset.brand}</div>
                          <div className="text-xs text-muted-foreground">{asset.configuration}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={12} minSize={10}>
                  <div className="p-2 h-full bg-muted/30">
                    <div className="font-medium text-xs mb-2 text-muted-foreground">Serial Number</div>
                    <div className="space-y-2">
                      {paginatedAssets.map((asset) => (
                        <div key={asset.id} className="p-2 text-xs bg-background rounded border">
                          <code className="bg-muted px-1 py-0.5 rounded text-xs">
                            {asset.serial_number}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={10} minSize={8}>
                  <div className="p-2 h-full bg-muted/30">
                    <div className="font-medium text-xs mb-2 text-muted-foreground">Employee ID</div>
                    <div className="space-y-2">
                      {paginatedAssets.map((asset) => (
                        <div key={asset.id} className="p-2 text-xs bg-background rounded border">
                          {asset.employee_id ? (
                            <code className="bg-blue-50 text-blue-700 px-1 py-0.5 rounded text-xs">
                              {asset.employee_id}
                            </code>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={12} minSize={10}>
                  <div className="p-2 h-full bg-muted/30">
                    <div className="font-medium text-xs mb-2 text-muted-foreground">Assigned To</div>
                    <div className="space-y-2">
                      {paginatedAssets.map((asset) => (
                        <div key={asset.id} className="p-2 text-xs bg-background rounded border">
                          {asset.assigned_to ? (
                            <div className="font-medium text-xs">{asset.assigned_to}</div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Unassigned</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={10} minSize={8}>
                  <div className="p-2 h-full bg-muted/30">
                    <div className="font-medium text-xs mb-2 text-muted-foreground">Status</div>
                    <div className="space-y-2">
                      {paginatedAssets.map((asset) => (
                        <div key={asset.id} className="p-2 text-xs bg-background rounded border">
                          {getStatusBadge(asset.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={11} minSize={9}>
                  <div className="p-2 h-full bg-muted/30">
                    <div className="font-medium text-xs mb-2 text-muted-foreground">Location</div>
                    <div className="space-y-2">
                      {paginatedAssets.map((asset) => (
                        <div key={asset.id} className="p-2 text-xs bg-background rounded border">
                          <Badge variant="secondary" className="text-xs">{asset.location}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={25} minSize={20}>
                  <div className="p-2 h-full bg-muted/30">
                    <div className="font-medium text-xs mb-2 text-muted-foreground">Actions</div>
                    <div className="space-y-2">
                      {paginatedAssets.map((asset) => (
                        <div key={asset.id} className="p-2 text-xs bg-background rounded border">
                          <div className="flex gap-1 flex-wrap">
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
                                onClick={() => onUnassign(asset.id)}
                                className="hover:bg-warning hover:text-warning-foreground text-xs h-6"
                              >
                                <UserMinus className="h-2 w-2 mr-1" />
                                Return
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowEditDialog(true);
                              }}
                              className="hover:bg-blue-500 hover:text-white text-xs h-6"
                            >
                              <Settings className="h-2 w-2" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setNewStatus(asset.status);
                                setShowStatusDialog(true);
                              }}
                              className="hover:bg-primary hover:text-primary-foreground text-xs h-6"
                            >
                              Status
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setNewLocation(asset.location);
                                setShowLocationDialog(true);
                              }}
                              className="hover:bg-primary hover:text-primary-foreground text-xs h-6"
                            >
                              Location
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this asset?")) {
                                  onDelete(asset.id);
                                }
                              }}
                              className="hover:bg-destructive hover:text-destructive-foreground text-xs h-6"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                {Math.min(currentPage * rowsPerPage, filteredAssets.length)} of {filteredAssets.length} assets
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
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

      {/* Update Status Dialog */}
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
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="Scrap/Damage">Scrap/Damage</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
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

      {/* Update Location Dialog */}
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

      {/* Edit Asset Dialog */}
      <EditAssetDialog
        asset={selectedAsset}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdate={onUpdateAsset}
      />
    </Card>
  );
};