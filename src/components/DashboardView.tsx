import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Search, Package, Users } from "lucide-react";
import { AssetList } from "./AssetList";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { DateRange } from "react-day-picker";

const DashboardView = ({ assets, onAssign, onUnassign, onUpdateAsset, onUpdateStatus, onUpdateLocation, onUpdateAssetCheck, onDelete, userRole }: {
  assets: any[],
  onAssign: any,
  onUnassign: any,
  onUpdateAsset: any,
  onUpdateStatus: any,
  onUpdateLocation: any,
  onUpdateAssetCheck: any,
  onDelete: any,
  userRole: any
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [configFilter, setConfigFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const assetTypes = [...new Set((assets || []).map((asset) => asset.type))];
  const assetBrands = [...new Set((assets || []).map((asset) => asset.brand))];
  const assetConfigurations = [...new Set((assets || []).map((asset) => asset.configuration).filter(Boolean))];
  const assetLocations = [...new Set((assets || []).map((asset) => asset.location))];
  const assetStatuses = [...new Set((assets || []).map((asset) => asset.status))];

  const filteredAssets = (assets || []).filter((asset) => {
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
        asset.received_by || "",
        asset.remarks || "",
        asset.warranty_start || "",
        asset.warranty_end || "",
        asset.amc_start || "",
        asset.amc_end || "",
        asset.asset_check || "",
      ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()));

    return typeMatch && brandMatch && configMatch && locationMatch && statusMatch && searchMatch;
  });

  const totalInventory = filteredAssets.length;
  const allocatedAssets = filteredAssets.filter((asset) => asset.status === "Assigned").length;
  const currentStock = filteredAssets.filter((asset) => asset.status === "Available").length;
  const scrapDamageAssets = filteredAssets.filter((asset) => asset.status === "Scrap/Damage").length;

  const getAssetTypeCounts = (status: string) => {
    return assetTypes.reduce((acc: Record<string, number>, type: string) => {
      acc[type] = filteredAssets.filter((asset) => asset.type === type && (status === "all" || asset.status === status)).length;
      return acc;
    }, {} as Record<string, number>);
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
                    .filter(([_, count]) => (count as number) > 0)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-end mb-1 text-xs">
                        <span className="mr-2">{type}:</span>
                        <span className="w-6 text-right">{count as number}</span>
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
                    .filter(([_, count]) => (count as number) > 0)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-end mb-1 text-xs">
                        <span className="mr-2">{type}:</span>
                        <span className="w-6 text-right">{count as number}</span>
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
                    .filter(([_, count]) => (count as number) > 0)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-end mb-1 text-xs">
                        <span className="mr-2">{type}:</span>
                        <span className="w-6 text-right">{count as number}</span>
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
                    .filter(([_, count]) => (count as number) > 0)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-end mb-1 text-xs">
                        <span className="mr-2">{type}:</span>
                        <span className="w-6 text-right">{count as number}</span>
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="text-xs h-7">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {assetTypes.map((type: string) => (
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
                  {assetBrands.map((brand: string) => (
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
                  {assetConfigurations.map((config: string) => (
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
                  {assetLocations.map((location: string) => (
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
                  {assetStatuses.map((status: string) => (
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
        defaultRowsPerPage={100}
        viewType="dashboard"
      />
    </>
  );
};

export default DashboardView;