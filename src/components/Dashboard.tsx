import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Laptop, Package, Users, Plus, Filter, Upload, Download, Tablet, Monitor, Smartphone } from "lucide-react";
import { AssetForm } from "./AssetForm";
import { AssetList } from "./AssetList";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { BulkUpload } from "./BulkUpload";
import { DateRange } from "react-day-picker";

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

const mockAssets = Array.from({ length: 150 }, (_, index) => ({
  id: index + 1,
  assetId: `AST-${String(index + 1).padStart(3, "0")}`,
  name: `Device ${index + 1}`,
  type: ["Laptop", "Tablet", "Smartphone"][index % 3],
  brand: ["Apple", "Lenovo", "Microsoft", "Samsung", "Dell"][index % 5],
  configuration: ["16GB RAM, 512GB SSD", "32GB RAM, 1TB SSD", "256GB, Wi-Fi"][index % 3],
  serialNumber: `SN-${String(index + 1).padStart(3, "0")}`,
  assignedTo: index % 2 === 0 ? `Employee ${index + 1}` : null,
  employeeId: index % 2 === 0 ? `EMP${String(index + 1).padStart(3, "0")}` : null,
  status: index % 5 === 0 ? "Available" : index % 5 === 1 ? "Assigned" : index % 5 === 2 ? "Scrap/Damage" : index % 5 === 3 ? "Sold" : "Others",
  location: locations[index % locations.length],
  assignedDate: index % 2 === 0 ? `2024-${String((index % 12) + 1).padStart(2, "0")}-01` : null,
}));

export const Dashboard = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [assets, setAssets] = useState(mockAssets);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [configFilter, setConfigFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Get unique values for filters
  const assetTypes = [...new Set(assets.map((asset) => asset.type))];
  const assetBrands = [...new Set(assets.map((asset) => asset.brand))];
  const assetConfigurations = [...new Set(assets.map((asset) => asset.configuration))];
  const assetLocations = [...new Set(assets.map((asset) => asset.location))];

  // Filter assets based on selected filters
  const filteredAssets = assets.filter((asset) => {
    const typeMatch = typeFilter === "all" || asset.type === typeFilter;
    const brandMatch = brandFilter === "all" || asset.brand === brandFilter;
    const configMatch = configFilter === "all" || asset.configuration === configFilter;
    const locationMatch = locationFilter === "all" || asset.location === locationFilter;

    return typeMatch && brandMatch && configMatch && locationMatch;
  });

  // Calculate inventory statistics using filtered data
  const totalInventory = filteredAssets.length;
  const allocatedAssets = filteredAssets.filter((asset) => asset.status === "Assigned").length;
  const currentStock = filteredAssets.filter((asset) => asset.status === "Available").length;
  const scrapDamageAssets = filteredAssets.filter((asset) => asset.status === "Scrap/Damage").length;

  const allocatedInRange = filteredAssets.filter((asset) => {
    if (!asset.assignedDate || !dateRange?.from || !dateRange?.to) return false;
    const assignedDate = new Date(asset.assignedDate);
    return assignedDate >= dateRange.from && assignedDate <= dateRange.to;
  }).length;

  const handleAddAsset = (newAsset: any) => {
    const asset = {
      id: assets.length + 1,
      ...newAsset,
      status: "Available",
      location: locations[0], // Default to first location
      assignedTo: null,
      employeeId: null,
      assignedDate: null,
    };
    setAssets([...assets, asset]);
    setShowAddForm(false);
  };

  const handleAssignAsset = (assetId: number, userName: string, employeeId: string) => {
    setAssets(
      assets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              assignedTo: userName,
              employeeId,
              status: "Assigned",
              assignedDate: new Date().toISOString().split("T")[0],
            }
          : asset
      )
    );
  };

  const handleUnassignAsset = (assetId: number) => {
    setAssets(
      assets.map((asset) =>
        asset.id === assetId
          ? { ...asset, assignedTo: null, employeeId: null, status: "Available", assignedDate: null }
          : asset
      )
    );
  };

  const handleUpdateAsset = (assetId: number, updatedAsset: any) => {
    setAssets(
      assets.map((asset) => (asset.id === assetId ? { ...asset, ...updatedAsset } : asset))
    );
  };

  const handleUpdateStatus = (assetId: number, status: string) => {
    setAssets(assets.map((asset) => (asset.id === assetId ? { ...asset, status } : asset)));
  };

  const handleUpdateLocation = (assetId: number, location: string) => {
    setAssets(assets.map((asset) => (asset.id === assetId ? { ...asset, location } : asset)));
  };

  const handleDeleteAsset = (assetId: number) => {
    setAssets(assets.filter((asset) => asset.id !== assetId));
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
          asset.assetId,
          asset.name,
          asset.type,
          asset.brand,
          asset.configuration,
          asset.serialNumber,
          asset.employeeId || "",
          asset.assignedTo || "",
          asset.status,
          asset.location,
          asset.assignedDate || "",
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
    setDateRange(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b shadow-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Asset Management System
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Track and manage your organization's assets efficiently
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowBulkUpload(true)}
                variant="outline"
                className="hover:bg-primary hover:text-primary-foreground transition-smooth"
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Operations
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Asset
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Filters Section */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filters
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="hover:bg-destructive hover:text-destructive-foreground"
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Asset Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Asset Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {assetTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Brand Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {assetBrands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Configuration Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Configuration</label>
                <Select value={configFilter} onValueChange={setConfigFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select config" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Configurations</SelectItem>
                    {assetConfigurations.map((config) => (
                      <SelectItem key={config} value={config}>
                        {config}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Asset Location</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {assetLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Allocation Date Range</label>
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Inventory */}
          <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalInventory}</div>
              <p className="text-xs text-muted-foreground mt-1">Total assets in system</p>
            </CardContent>
          </Card>

          {/* Allocated */}
          <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Allocated</CardTitle>
              <Users className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{allocatedAssets}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently in use</p>
            </CardContent>
          </Card>

          {/* Current Stock */}
          <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Stock</CardTitle>
              <Package className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{currentStock}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready for allocation</p>
            </CardContent>
          </Card>

          {/* Scrap/Damage */}
          <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scrap/Damage</CardTitle>
              <Package className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{scrapDamageAssets}</div>
              <p className="text-xs text-muted-foreground mt-1">Out of service</p>
            </CardContent>
          </Card>
        </div>

        {/* Asset List */}
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
        />
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