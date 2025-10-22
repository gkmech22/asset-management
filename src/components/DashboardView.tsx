import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Search, Package, Users } from "lucide-react";
import { AssetList } from "./AssetList";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

const DashboardView = ({ assets, onAssign, onUnassign, onUpdateAsset, onUpdateStatus, onUpdateLocation, onUpdateAssetCheck, onDelete, userRole }: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [configFilter, setConfigFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [searchQueryType, setSearchQueryType] = useState("");
  const [searchQueryBrand, setSearchQueryBrand] = useState("");
  const [searchQueryConfig, setSearchQueryConfig] = useState("");
  const [searchQueryLocation, setSearchQueryLocation] = useState("");
  const [searchQueryStatus, setSearchQueryStatus] = useState("");

  // Compute filtered assets based on all active filters except the one being computed
  const getFilteredAssets = (excludeFilter: string) => {
    return assets.filter((asset: any) => {
      const typeMatch = excludeFilter === "type" || typeFilter.length === 0 || typeFilter.includes(asset.type);
      const brandMatch = excludeFilter === "brand" || brandFilter.length === 0 || brandFilter.includes(asset.brand);
      const configMatch = excludeFilter === "config" || configFilter.length === 0 || (asset.configuration && configFilter.includes(asset.configuration));
      const locationMatch = excludeFilter === "location" || locationFilter.length === 0 || locationFilter.includes(asset.location);
      const statusMatch = excludeFilter === "status" || statusFilter.length === 0 || statusFilter.includes(asset.status);
      return typeMatch && brandMatch && configMatch && locationMatch && statusMatch;
    });
  };

  // Compute options for each dropdown based on filtered assets
  const assetTypes = [...new Set(assets.map((asset: any) => asset.type).filter(Boolean))].sort();
  const assetBrands = [...new Set(assets.map((asset: any) => asset.brand).filter(Boolean))].sort();
  const assetConfigurations = [...new Set(assets.map((asset: any) => asset.configuration).filter(Boolean))].sort();
  const assetLocations = [...new Set(assets.map((asset: any) => asset.location).filter(Boolean))].sort();
  const assetStatuses = [...new Set(assets.map((asset: any) => asset.status).filter(Boolean))].sort();

  // Assets filtered by all active filters for display
  const filteredAssets = assets.filter((asset: any) => {
    const typeMatch = typeFilter.length === 0 || typeFilter.includes(asset.type);
    const brandMatch = brandFilter.length === 0 || brandFilter.includes(asset.brand);
    const configMatch = configFilter.length === 0 || (asset.configuration && configFilter.includes(asset.configuration));
    const locationMatch = locationFilter.length === 0 || locationFilter.includes(asset.location);
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(asset.status);

    const searchMatch = searchQuery.trim() === "" ||
      [
        asset.asset_id || "",
        asset.name || "",
        asset.type || "",
        asset.brand || "",
        asset.configuration || "",
        asset.serial_number || "",
        asset.employee_id || "",
        asset.assigned_to || "",
        asset.status || "",
        asset.location || "",
        asset.created_by || "",
        asset.updated_by || "",
        asset.received_by || "",
        asset.remarks || "",
        asset.warranty_start || "",
        asset.warranty_end || "",
        asset.amc_start || "",
        asset.amc_end || "",
        asset.asset_check || "",
      ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()));

    const dateMatch = !dateRange?.from || !dateRange?.to ||
      ((asset.assigned_date || asset.return_date) &&
        new Date(asset.assigned_date || asset.return_date) >= new Date(dateRange.from) &&
        new Date(asset.assigned_date || asset.return_date) <= new Date(dateRange.to));

    return typeMatch && brandMatch && configMatch && locationMatch && statusMatch && searchMatch && dateMatch;
  });

  const totalInventory = filteredAssets.filter((asset: any) => asset.status !== "Sold").length;
  const allocatedAssets = filteredAssets.filter((asset: any) => asset.status === "Assigned").length;
  const currentStock = filteredAssets.filter((asset: any) => asset.status === "Available").length;
  const soldAssets = filteredAssets.filter((asset: any) => asset.status === "Sold").length;
  const totalAssetValueRecovery = filteredAssets
    .filter((asset: any) => asset.status === "Sold" && asset.asset_value_recovery)
    .reduce((sum: number, asset: any) => sum + parseFloat(asset.asset_value_recovery), 0)
    .toFixed(2);

  const getAssetTypeCounts = (status: string) => {
    return assetTypes.reduce((acc, type) => {
      acc[type] = filteredAssets.filter((asset: any) => asset.type === type && (status === "all" || asset.status === status)).length;
      return acc;
    }, {} as Record<string, number>);
  };

  const clearFilters = () => {
    setTypeFilter([]);
    setBrandFilter([]);
    setConfigFilter([]);
    setLocationFilter([]);
    setStatusFilter([]);
    setDateRange(undefined);
    setSearchQuery("");
    setSearchQueryType("");
    setSearchQueryBrand("");
    setSearchQueryConfig("");
    setSearchQueryLocation("");
    setSearchQueryStatus("");
  };

  // Reset invalid filter selections
  useEffect(() => {
    setTypeFilter(typeFilter.filter(t => assetTypes.includes(t)));
    setBrandFilter(brandFilter.filter(b => assetBrands.includes(b)));
    setConfigFilter(configFilter.filter(c => assetConfigurations.includes(c)));
    setLocationFilter(locationFilter.filter(l => assetLocations.includes(l)));
    setStatusFilter(statusFilter.filter(s => assetStatuses.includes(s)));
  }, [assets]);

  return (
    <>
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
            <CardTitle className="text-sm font-medium">Sold</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex justify-between items-start">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{soldAssets}</div>
                <p className="text-xs text-muted-foreground mt-2">Total asset value recovered: Rs.{totalAssetValueRecovery}</p>
              </div>
              <div className="w-1/2 text-right">
                <div className="h-24 overflow-y-auto pr-2">
                  {Object.entries(getAssetTypeCounts("Sold"))
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
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Asset Type</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {typeFilter.length === 0 ? "All Types" : `${typeFilter.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Type to search..."
                      value={searchQueryType}
                      onChange={(e) => setSearchQueryType(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetTypes
                      .filter((type: string) => type.toLowerCase().includes(searchQueryType.toLowerCase()))
                      .map((type: string) => (
                        <div key={type} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`type-${type}`}
                            checked={typeFilter.includes(type)}
                            onCheckedChange={(checked) => {
                              setTypeFilter((prev) =>
                                checked ? [...prev, type] : prev.filter((t) => t !== type)
                              );
                            }}
                          />
                          <label htmlFor={`type-${type}`} className="text-xs cursor-pointer flex-1">
                            {type}
                          </label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Brand</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {brandFilter.length === 0 ? "All Brands" : `${brandFilter.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Type to search..."
                      value={searchQueryBrand}
                      onChange={(e) => setSearchQueryBrand(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetBrands
                      .filter((brand: string) => brand.toLowerCase().includes(searchQueryBrand.toLowerCase()))
                      .map((brand: string) => (
                        <div key={brand} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`brand-${brand}`}
                            checked={brandFilter.includes(brand)}
                            onCheckedChange={(checked) => {
                              setBrandFilter((prev) =>
                                checked ? [...prev, brand] : prev.filter((b) => b !== brand)
                              );
                            }}
                          />
                          <label htmlFor={`brand-${brand}`} className="text-xs cursor-pointer flex-1">
                            {brand}
                          </label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Configuration</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {configFilter.length === 0 ? "All Configurations" : `${configFilter.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Type to search..."
                      value={searchQueryConfig}
                      onChange={(e) => setSearchQueryConfig(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetConfigurations
                      .filter((config: string) => config.toLowerCase().includes(searchQueryConfig.toLowerCase()))
                      .map((config: string) => (
                        <div key={config} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`config-${config}`}
                            checked={configFilter.includes(config)}
                            onCheckedChange={(checked) => {
                              setConfigFilter((prev) =>
                                checked ? [...prev, config] : prev.filter((c) => c !== config)
                              );
                            }}
                          />
                          <label htmlFor={`config-${config}`} className="text-xs cursor-pointer flex-1">
                            {config}
                          </label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Asset Location</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {locationFilter.length === 0 ? "All Locations" : `${locationFilter.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Type to search..."
                      value={searchQueryLocation}
                      onChange={(e) => setSearchQueryLocation(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
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
                          <label htmlFor={`location-${location}`} className="text-xs cursor-pointer flex-1">
                            {location}
                          </label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Status</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {statusFilter.length === 0 ? "All Statuses" : `${statusFilter.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Type to search..."
                      value={searchQueryStatus}
                      onChange={(e) => setSearchQueryStatus(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
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
                          <label htmlFor={`status-${status}`} className="text-xs cursor-pointer flex-1">
                            {status}
                          </label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Date Range (Assigned/Returned)</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} className="h-7" />
            </div>
          </div>
        </CardContent>
      </Card>

      <AssetList
        assets={filteredAssets}
        onAssign={onAssign}
        onUnassign={onUnassign}
        onUpdateAsset={onUpdateAsset}
        onUpdateStatus={onUpdateStatus}
        onUpdateLocation={onUpdateLocation}
        onUpdateAssetCheck={onUpdateAssetCheck}
        onDelete={onDelete}
        dateRange={dateRange}
        typeFilter={typeFilter}
        brandFilter={brandFilter}
        configFilter={configFilter}
        locationFilter={locationFilter}
        statusFilter={statusFilter}
        defaultRowsPerPage={10}
        viewType="dashboard"
      />
    </>
  );
};

export default DashboardView;