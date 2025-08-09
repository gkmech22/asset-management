import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Users, Plus, Filter, Upload, Download, Search } from "lucide-react";
import { UserProfile } from "@/components/auth/UserProfile";
import { AssetForm } from "./AssetForm";
import { AssetList } from "./AssetList";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { BulkUpload } from "./BulkUpload";
import { DateRange } from "react-day-picker";
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from "@/hooks/useAssets";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

export const Dashboard = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: assets = [], isLoading, error } = useAssets();
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();
  const deleteAssetMutation = useDeleteAsset();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [configFilter, setConfigFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<string>("unknown_user");

  // Fetch current user from Supabase auth
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setCurrentUser(user.email);
        } else {
          toast.error("Failed to fetch user data. Using fallback user ID.");
        }
      } catch (error) {
        toast.error("Error fetching user data. Using fallback user ID.");
        console.error("Supabase auth error:", error);
      }
    };
    fetchUser();
  }, []);

  const logEditHistory = async (assetId: string, field: string, oldValue: string | null, newValue: string | null) => {
    try {
      await supabase.from("asset_edit_history").insert({
        asset_id: assetId,
        field_changed: field,
        old_value: oldValue,
        new_value: newValue,
        changed_by: currentUser,
        changed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to log edit history:", error);
    }
  };

  const assetTypes = [...new Set(assets.map((asset) => asset.type))];
  const assetBrands = [...new Set(assets.map((asset) => asset.brand))];
  const assetConfigurations = [...new Set(assets.map((asset) => asset.configuration).filter(Boolean))];
  const assetLocations = [...new Set(assets.map((asset) => asset.location))];
  const assetStatuses = [...new Set(assets.map((asset) => asset.status))];

  const isFilterOrSearchActive =
    searchQuery.trim() !== "" ||
    typeFilter !== "all" ||
    brandFilter !== "all" ||
    configFilter !== "all" ||
    locationFilter !== "all" ||
    statusFilter !== "" ||
    dateRange !== undefined;

  const filteredAssets = assets.filter((asset) => {
    const typeMatch = typeFilter === "all" || asset.type === typeFilter;
    const brandMatch = brandFilter === "all" || asset.brand === brandFilter;
    const configMatch = configFilter === "all" || asset.configuration === configFilter;
    const locationMatch = locationFilter === "all" || asset.location === locationFilter;
    const statusMatch = !statusFilter || statusFilter === "all" || asset.status === statusFilter;

    const searchMatch = searchQuery.trim() === "" || 
      [
        asset.asset_id,
        asset.name,
        asset.type,
        asset.brand,
        asset.configuration || "",
        asset.serial_number,
        asset.employee_id || "",
        asset.assigned_to || "",
        asset.status,
        asset.location,
        asset.created_by || "",
        asset.updated_by || "",
      ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()));

    return typeMatch && brandMatch && configMatch && locationMatch && statusMatch && searchMatch;
  });

  const totalInventory = filteredAssets.length;
  const allocatedAssets = filteredAssets.filter((asset) => asset.status === "Assigned").length;
  const currentStock = filteredAssets.filter((asset) => asset.status === "Available").length;
  const scrapDamageAssets = filteredAssets.filter((asset) => asset.status === "Scrap/Damage").length;

  const getAssetTypeCounts = (status: string) => {
    return assetTypes.reduce((acc, type) => {
      acc[type] = filteredAssets.filter((asset) => asset.type === type && (status === "all" || asset.status === status)).length;
      return acc;
    }, {} as Record<string, number>);
  };

  const handleAddAsset = async (newAsset: any) => {
    try {
      const asset = {
        asset_id: newAsset.assetId,
        name: newAsset.name,
        type: newAsset.type,
        brand: newAsset.brand,
        configuration: newAsset.configuration,
        serial_number: newAsset.serialNumber,
        status: "Available",
        location: locations[0],
        assigned_to: null,
        employee_id: null,
        assigned_date: null,
        created_by: currentUser,
        created_at: new Date().toISOString(),
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      };
      const { data } = await createAssetMutation.mutateAsync(asset);
      await logEditHistory(data.id, "created", null, "Asset Created");
      toast.success("Asset created successfully");
      setShowAddForm(false);
    } catch (error) {
      toast.error("Failed to create asset");
    }
  };

  const handleAssignAsset = async (assetId: string, userName: string, employeeId: string) => {
    try {
      const asset = assets.find((a) => a.id === assetId);
      await updateAssetMutation.mutateAsync({
        id: assetId,
        assigned_to: userName,
        employee_id: employeeId,
        status: "Assigned",
        assigned_date: new Date().toISOString(),
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      await logEditHistory(assetId, "assigned_to", asset?.assigned_to || null, userName);
      await logEditHistory(assetId, "employee_id", asset?.employee_id || null, employeeId);
      await logEditHistory(assetId, "status", asset?.status || null, "Assigned");
      toast.success("Asset assigned successfully");
    } catch (error) {
      toast.error("Failed to assign asset");
    }
  };

  const handleUnassignAsset = async (assetId: string) => {
    try {
      const asset = assets.find((a) => a.id === assetId);
      await updateAssetMutation.mutateAsync({
        id: assetId,
        assigned_to: null,
        employee_id: null,
        status: "Available",
        assigned_date: null,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      await logEditHistory(assetId, "assigned_to", asset?.assigned_to || null, null);
      await logEditHistory(assetId, "employee_id", asset?.employee_id || null, null);
      await logEditHistory(assetId, "status", asset?.status || null, "Available");
      toast.success("Asset returned successfully");
    } catch (error) {
      toast.error("Failed to return asset");
    }
  };

  const handleUpdateAsset = async (assetId: string, updatedAsset: any) => {
    try {
      const asset = assets.find((a) => a.id === assetId);
      await updateAssetMutation.mutateAsync({
        id: assetId,
        asset_id: updatedAsset.assetId,
        name: updatedAsset.name,
        type: updatedAsset.type,
        brand: updatedAsset.brand,
        configuration: updatedAsset.configuration,
        serial_number: updatedAsset.serialNumber,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      // Log changes for each field
      if (asset?.asset_id !== updatedAsset.assetId) {
        await logEditHistory(assetId, "asset_id", asset?.asset_id || null, updatedAsset.assetId);
      }
      if (asset?.name !== updatedAsset.name) {
        await logEditHistory(assetId, "name", asset?.name || null, updatedAsset.name);
      }
      if (asset?.type !== updatedAsset.type) {
        await logEditHistory(assetId, "type", asset?.type || null, updatedAsset.type);
      }
      if (asset?.brand !== updatedAsset.brand) {
        await logEditHistory(assetId, "brand", asset?.brand || null, updatedAsset.brand);
      }
      if (asset?.configuration !== updatedAsset.configuration) {
        await logEditHistory(assetId, "configuration", asset?.configuration || null, updatedAsset.configuration);
      }
      if (asset?.serial_number !== updatedAsset.serialNumber) {
        await logEditHistory(assetId, "serial_number", asset?.serial_number || null, updatedAsset.serialNumber);
      }
      toast.success("Asset updated successfully");
    } catch (error) {
      toast.error("Failed to update asset");
    }
  };

  const handleUpdateStatus = async (assetId: string, status: string) => {
    try {
      const asset = assets.find((a) => a.id === assetId);
      await updateAssetMutation.mutateAsync({ 
        id: assetId, 
        status,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      await logEditHistory(assetId, "status", asset?.status || null, status);
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleUpdateLocation = async (assetId: string, location: string) => {
    try {
      const asset = assets.find((a) => a.id === assetId);
      await updateAssetMutation.mutateAsync({ 
        id: assetId, 
        location,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      await logEditHistory(assetId, "location", asset?.location || null, location);
      toast.success("Location updated successfully");
    } catch (error) {
      toast.error("Failed to update location");
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteAssetMutation.mutateAsync(assetId);
      await logEditHistory(assetId, "deleted", null, "Asset Deleted");
      toast.success("Asset deleted successfully");
    } catch (error) {
      toast.error("Failed to delete asset");
    }
  };

  const handleBulkUpload = (file: File) => {
    console.log("Processing file:", file.name);
  };

  const handleDownloadData = () => {
    const headers = [
      "Asset ID",
      "Asset Name",
      "Asset Type",
      "Brand",
      "Configuration",
      "Serial Number",
      "Employee ID",
      "Employee Name",
      "Status",
      "Asset Location",
      "Assigned Date",
      "Created By",
      "Created At",
      "Updated By",
      "Updated At",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredAssets.map((asset) =>
        [
          asset.asset_id,
          asset.name,
          asset.type,
          asset.brand,
          asset.configuration || "",
          asset.serial_number,
          asset.employee_id || "",
          asset.assigned_to || "",
          asset.status,
          asset.location,
          asset.created_by || "",
          asset.created_at || "",
          asset.updated_by || "",
          asset.updated_at || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "asset_inventory.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setTypeFilter("all");
    setBrandFilter("all");
    setConfigFilter("all");
    setLocationFilter("all");
    setStatusFilter("");
    setDateRange(undefined);
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b shadow-card">
        <div className="container mx-auto px-2 py-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
                  Asset Management System
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Track and manage organization's assets efficiently
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowBulkUpload(true)}
                variant="outline"
                className="hover:bg-primary hover:text-primary-foreground transition-smooth text-sm h-8"
              >
                <Upload className="w-3 h-3 mr-1" />
                Bulk Operations
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-primary hover:shadow-glow transition-smooth text-sm h-8"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Asset
              </Button>
              <UserProfile />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-[60px] pb-[40px] container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex justify-between items-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{totalInventory}</div>
                  <p className="text-xs text-muted-foreground mt-2">Total assets in system</p>
                </div>
                <div className="w-1/2 text-right">
                  <div className="h-24 overflow-y-auto pr-2">
                    {Object.entries(getAssetTypeCounts("all"))
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => (
                        <div key={type} className="flex justify-end mb-1 text-xs">
                          <span className="mr-2">{type}:</span>
                          <span className="w-6 text-right">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Allocated</CardTitle>
              <Users className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex justify-between items-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">{allocatedAssets}</div>
                  <p className="text-xs text-muted-foreground mt-2">Currently in use</p>
                </div>
                <div className="w-1/2 text-right">
                  <div className="h-24 overflow-y-auto pr-2">
                    {Object.entries(getAssetTypeCounts("Assigned"))
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => (
                        <div key={type} className="flex justify-end mb-1 text-xs">
                          <span className="mr-2">{type}:</span>
                          <span className="w-6 text-right">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Stock</CardTitle>
              <Package className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex justify-between items-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{currentStock}</div>
                  <p className="text-xs text-muted-foreground mt-2">Ready for allocation</p>
                </div>
                <div className="w-1/2 text-right">
                  <div className="h-24 overflow-y-auto pr-2">
                    {Object.entries(getAssetTypeCounts("Available"))
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => (
                        <div key={type} className="flex justify-end mb-1 text-xs">
                          <span className="mr-2">{type}:</span>
                          <span className="w-6 text-right">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scrap/Damage</CardTitle>
              <Package className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex justify-between items-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{scrapDamageAssets}</div>
                  <p className="text-xs text-muted-foreground mt-2">Out of service</p>
                </div>
                <div className="w-1/2 text-right">
                  <div className="h-24 overflow-y-auto pr-2">
                    {Object.entries(getAssetTypeCounts("Scrap/Damage"))
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => (
                        <div key={type} className="flex justify-end mb-1 text-xs">
                          <span className="mr-2">{type}:</span>
                          <span className="w-6 text-right">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1 text-base">
                <Filter className="h-3 w-3 text-primary" />
                Filters
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Input
                    type="text"
                    placeholder="Search assets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-7 text-xs"
                  />
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="hover:bg-destructive hover:text-destructive-foreground text-xs h-6"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Asset Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="text-xs h-7">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {assetTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-xs">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Brand</label>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="text-xs h-7">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {assetBrands.map((brand) => (
                      <SelectItem key={brand} value={brand} className="text-xs">
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Configuration</label>
                <Select value={configFilter} onValueChange={setConfigFilter}>
                  <SelectTrigger className="text-xs h-7">
                    <SelectValue placeholder="All Configurations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Configurations</SelectItem>
                    {assetConfigurations.map((config) => (
                      <SelectItem key={config} value={config} className="text-xs">
                        {config}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Asset Location</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="text-xs h-7">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {assetLocations.map((location) => (
                      <SelectItem key={location} value={location} className="text-xs">
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="text-xs h-7">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {assetStatuses.map((status) => (
                      <SelectItem key={status} value={status} className="text-xs">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Allocation Date Range</label>
                <DatePickerWithRange date={dateRange} setDate={setDateRange} className="h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isFilterOrSearchActive && (
          <AssetList
            assets={filteredAssets}
            onAssign={handleAssignAsset}
            onUnassign={handleUnassignAsset}
            onUpdateAsset={handleUpdateAsset}
            onUpdateStatus={handleUpdateStatus}
            onUpdateLocation={handleUpdateLocation}
            onDelete={handleDeleteAsset}
            dateRange={dateRange}
            typeFilter={typeFilter}
            brandFilter={brandFilter}
            configFilter={configFilter}
            defaultRowsPerPage={100}
          />
        )}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-card py-2">
        <div className="container mx-auto px-4">
          <p className="text-[14px] text-muted-foreground">
            Crafted by 🤓 IT Infra minds, for IT Infra needs
          </p>
        </div>
      </footer>

      {showAddForm && <AssetForm onSubmit={handleAddAsset} onCancel={() => setShowAddForm(false)} />}
      <BulkUpload
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onUpload={handleBulkUpload}
        onDownload={handleDownloadData}
      />
    </div>
  );
};