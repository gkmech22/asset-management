import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Users, Plus, Filter, Upload, Download } from "lucide-react";
import { AssetForm } from "./AssetForm";
import { AssetList } from "./AssetList";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { BulkUpload } from "./BulkUpload";
import { DateRange } from "react-day-picker";
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset, Asset } from "@/hooks/useAssets";
import { toast } from "sonner";

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

  // Get unique values for filters
  const assetTypes = [...new Set(assets.map((asset) => asset.type))];
  const assetBrands = [...new Set(assets.map((asset) => asset.brand))];
  const assetConfigurations = [...new Set(assets.map((asset) => asset.configuration).filter(Boolean))];
  const assetLocations = [...new Set(assets.map((asset) => asset.location))];
  const assetStatuses = [...new Set(assets.map((asset) => asset.status))];

  // Filter assets based on selected filters
  const filteredAssets = assets.filter((asset) => {
    const typeMatch = typeFilter === "all" || asset.type === typeFilter;
    const brandMatch = brandFilter === "all" || asset.brand === brandFilter;
    const configMatch = configFilter === "all" || asset.configuration === configFilter;
    const locationMatch = locationFilter === "all" || asset.location === locationFilter;
    const statusMatch = !statusFilter || statusFilter === "all" || asset.status === statusFilter;

    return typeMatch && brandMatch && configMatch && locationMatch && statusMatch;
  });

  // Calculate inventory statistics using filtered data
  const totalInventory = filteredAssets.length;
  const allocatedAssets = filteredAssets.filter((asset) => asset.status === "Assigned").length;
  const currentStock = filteredAssets.filter((asset) => asset.status === "Available").length;
  const scrapDamageAssets = filteredAssets.filter((asset) => asset.status === "Scrap/Damage").length;

  // Calculate asset type-wise counts for each status
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
      };
      await createAssetMutation.mutateAsync(asset);
      toast.success("Asset created successfully");
      setShowAddForm(false);
    } catch (error) {
      toast.error("Failed to create asset");
    }
  };

  const handleAssignAsset = async (assetId: string, userName: string, employeeId: string) => {
    try {
      await updateAssetMutation.mutateAsync({
        id: assetId,
        assigned_to: userName,
        employee_id: employeeId,
        status: "Assigned",
        assigned_date: new Date().toISOString(),
      });
      toast.success("Asset assigned successfully");
    } catch (error) {
      toast.error("Failed to assign asset");
    }
  };

  const handleUnassignAsset = async (assetId: string) => {
    try {
      await updateAssetMutation.mutateAsync({
        id: assetId,
        assigned_to: null,
        employee_id: null,
        status: "Available",
        assigned_date: null,
      });
      toast.success("Asset returned successfully");
    } catch (error) {
      toast.error("Failed to return asset");
    }
  };

  const handleUpdateAsset = async (assetId: string, updatedAsset: any) => {
    try {
      await updateAssetMutation.mutateAsync({
        id: assetId,
        asset_id: updatedAsset.assetId,
        name: updatedAsset.name,
        type: updatedAsset.type,
        brand: updatedAsset.brand,
        configuration: updatedAsset.configuration,
        serial_number: updatedAsset.serialNumber,
      });
      toast.success("Asset updated successfully");
    } catch (error) {
      toast.error("Failed to update asset");
    }
  };

  const handleUpdateStatus = async (assetId: string, status: string) => {
    try {
      await updateAssetMutation.mutateAsync({ id: assetId, status });
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleUpdateLocation = async (assetId: string, location: string) => {
    try {
      await updateAssetMutation.mutateAsync({ id: assetId, location });
      toast.success("Location updated successfully");
    } catch (error) {
      toast.error("Failed to update location");
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteAssetMutation.mutateAsync(assetId);
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
          asset.assigned_date || "",
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
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b shadow-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <img
                src="https://oc.leadschool.in/lead-group-logo-blue.png"
                alt="Lead School Logo"
                className="h-12 bg-white p-1"
              />
              <div>
                <h1 className="text-2xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
                  Asset Management System
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Track and manage organization's assets efficiently
                </p>
              </div>
            </div>
            <div className="flex gap-2">
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
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Total Inventory */}
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
                <div className="text-right text-xs">
                  {Object.entries(getAssetTypeCounts("all"))
                    .filter(([_, count]) => count > 0)
                    .map(([type, count]) => (
                      <div key={type} className="mb-1">
                        {type}: {count}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allocated */}
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
                <div className="text-right text-xs">
                  {Object.entries(getAssetTypeCounts("Assigned"))
                    .filter(([_, count]) => count > 0)
                    .map(([type, count]) => (
                      <div key={type} className="mb-1">
                        {type}: {count}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Stock */}
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
                <div className="text-right text-xs">
                  {Object.entries(getAssetTypeCounts("Available"))
                    .filter(([_, count]) => count > 0)
                    .map(([type, count]) => (
                      <div key={type} className="mb-1">
                        {type}: {count}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scrap/Damage */}
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
                <div className="text-right text-xs">
                  {Object.entries(getAssetTypeCounts("Scrap/Damage"))
                    .filter(([_, count]) => count > 0)
                    .map(([type, count]) => (
                      <div key={type} className="mb-1">
                        {type}: {count}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="shadow-card mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1 text-base">
                <Filter className="h-3 w-3 text-primary" />
                Filters
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="hover:bg-destructive hover:text-destructive-foreground text-xs h-6"
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              {/* Asset Type Filter */}
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

              {/* Brand Filter */}
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

              {/* Configuration Filter */}
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

              {/* Location Filter */}
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

              {/* Status Filter */}
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

              {/* Date Range Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Allocation Date Range</label>
                <DatePickerWithRange date={dateRange} setDate={setDateRange} className="h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset List (visible only when a status is selected, including "All") */}
        {statusFilter && (
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

      {/* Add Asset Modal */}
      {showAddForm && <AssetForm onSubmit={handleAddAsset} onCancel={() => setShowAddForm(false)} />}

      {/* Bulk Upload Modal */}
      <BulkUpload
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onUpload={handleBulkUpload}
        onDownload={handleDownloadData}
      />
    </div>
  );
};