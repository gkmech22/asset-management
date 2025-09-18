import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Search, ScanBarcode } from "lucide-react";
import { AssetList } from "./AssetList";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const AuditView = ({ assets, onAssign, onUnassign, onUpdateAsset, onUpdateStatus, onUpdateLocation, onUpdateAssetCheck, onDelete, userRole }: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [configFilter, setConfigFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const assetTypes = [...new Set(assets.map((asset: any) => asset.type).filter(Boolean))];
  const assetBrands = [...new Set(assets.map((asset: any) => asset.brand).filter(Boolean))];
  const assetConfigurations = [...new Set(assets.map((asset: any) => asset.configuration).filter(Boolean))];
  const assetLocations = [...new Set(assets.map((asset: any) => asset.location).filter(Boolean))];
  const assetStatuses = [...new Set(assets.map((asset: any) => asset.status).filter(Boolean))].filter(status => status !== "Assigned");

  const filteredAssets = assets.filter((asset: any) => {
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
        asset.provider || "",
      ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()));

    return typeMatch && brandMatch && configMatch && locationMatch && statusMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            Audit Filter Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Assets</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <ScanBarcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 cursor-pointer hover:text-primary" />
                <Input
                  placeholder="Search by any field..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Asset Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  {assetTypes.map((type) => (
                    <SelectItem key={String(type)} value={String(type)}>
                      {String(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Brand</label>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by brand" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="all">All Brands</SelectItem>
                  {assetBrands.map((brand) => (
                    <SelectItem key={String(brand)} value={String(brand)}>
                      {String(brand)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Configuration</label>
              <Select value={configFilter} onValueChange={setConfigFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by configuration" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="all">All Configurations</SelectItem>
                  {assetConfigurations.map((config) => (
                    <SelectItem key={String(config)} value={String(config)}>
                      {String(config)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="all">All Locations</SelectItem>
                  {assetLocations.map((location) => (
                    <SelectItem key={String(location)} value={String(location)}>
                      {String(location)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status (Multiple)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Filter className="h-4 w-4 mr-2" />
                    {statusFilter.length === 0 ? "All Statuses" : `${statusFilter.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 bg-card border border-border" side="bottom" align="start">
                  <div className="space-y-2">
                    {assetStatuses.map((status) => (
                      <div key={String(status)} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${String(status)}`}
                          checked={statusFilter.includes(String(status))}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStatusFilter([...statusFilter, String(status)]);
                            } else {
                              setStatusFilter(statusFilter.filter((s) => s !== String(status)));
                            }
                          }}
                        />
                        <Label htmlFor={`status-${String(status)}`}>{String(status)}</Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setDateRange(undefined);
                setTypeFilter("all");
                setBrandFilter("all");
                setConfigFilter("all");
                setLocationFilter("all");
                setStatusFilter([]);
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
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
          defaultRowsPerPage={50}
          viewType="audit"
        />
      </Card>
    </div>
  );
};

export default AuditView;