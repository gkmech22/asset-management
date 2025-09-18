// AmcsView.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";
import { AssetList } from "./AssetList";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { Asset } from "@/hooks/useAssets";

interface AmcsViewProps {
  assets: Asset[];
  onAssign: (assetId: string, userName: string, employeeId: string) => Promise<void>;
  onUnassign: (assetId: string, remarks?: string, receivedBy?: string, location?: string) => Promise<void>;
  onUpdateAsset: (assetId: string, updatedAsset: any) => Promise<void>;
  onUpdateStatus: (assetId: string, status: string) => Promise<void>;
  onUpdateLocation: (assetId: string, location: string) => Promise<void>;
  onUpdateAssetCheck: (assetId: string, assetCheck: string) => Promise<void>;
  onDelete: (assetId: string) => Promise<void>;
  userRole: string | null;
}

const AmcsView = ({ assets, onAssign, onUnassign, onUpdateAsset, onUpdateStatus, onUpdateLocation, onUpdateAssetCheck, onDelete, userRole }: AmcsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [configFilter, setConfigFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const assetTypes = [...new Set(assets.map((asset: Asset) => asset.type))];
  const assetBrands = [...new Set(assets.map((asset: Asset) => asset.brand))];
  const assetConfigurations = [...new Set(assets.map((asset: Asset) => asset.configuration).filter(Boolean))];
  const assetLocations = [...new Set(assets.map((asset: Asset) => asset.location))];
  const assetStatuses = [...new Set(assets.map((asset: Asset) => asset.status))];

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
        asset.received_by || "",
        asset.remarks || "",
        asset.warranty_start || "",
        asset.warranty_end || "",
        asset.warranty_start || "",
        asset.warranty_end || "",
      ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()));

    return typeMatch && brandMatch && configMatch && locationMatch && statusMatch && searchMatch;
  });

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
        viewType="amcs"
      />
    </>
  );
};

export default AmcsView;