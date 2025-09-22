import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";
import { AssetList } from "./AssetList";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const AuditView = ({ assets, onAssign, onUnassign, onUpdateAsset, onUpdateStatus, onUpdateLocation, onUpdateAssetCheck, onDelete, userRole }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [configFilter, setConfigFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const assetTypes = [...new Set(assets.map((asset) => asset.type))];
  const assetBrands = [...new Set(assets.map((asset) => asset.brand))];
  const assetConfigurations = [...new Set(assets.map((asset) => asset.configuration).filter(Boolean))];
  const assetLocations = [...new Set(assets.map((asset) => asset.location))];
  const assetStatuses = [...new Set(assets.map((asset) => asset.status))].filter(status => status !== "Assigned");

  const filteredAssets = assets.filter((asset) => {
    const typeMatch = typeFilter === "all" || asset.type === typeFilter;
    const brandMatch = brandFilter === "all" || asset.brand === brandFilter;
    const configMatch = configFilter === "all" || asset.configuration === configFilter;
    const locationMatch = locationFilter === "all" || asset.location === locationFilter;
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(asset.status);

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

    return typeMatch && brandMatch && configMatch && locationMatch && statusMatch && searchMatch && asset.status !== "Assigned";
  });

  const clearFilters = () => {
    setTypeFilter("all");
    setBrandFilter("all");
    setConfigFilter("all");
    setLocationFilter("all");
    setStatusFilter([]);
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-xs h-7">
                    {statusFilter.length ? `${statusFilter.length} selected` : "Select statuses"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="space-y-2">
                    {assetStatuses.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={statusFilter.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStatusFilter([...statusFilter, status]);
                            } else {
                              setStatusFilter(statusFilter.filter((s) => s !== status));
                            }
                          }}
                        />
                        <Label htmlFor={`status-${status}`} className="text-sm">
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
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
        defaultRowsPerPage={10}
        viewType="audit"
      />
    </>
  );
};

export default AuditView;