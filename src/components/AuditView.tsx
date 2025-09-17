import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Search, History } from "lucide-react";
import { AssetList } from "./AssetList";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAssetHistory } from "@/hooks/useAssetHistory";
import { format } from "date-fns";
import { Asset } from "@/hooks/useAssets";

interface AuditViewProps {
  assets: Asset[];
  onAssign: (assetId: string, userName: string, employeeId: string) => void;
  onUnassign: (assetId: string, remarks?: string, receivedBy?: string, location?: string) => void;
  onUpdateAsset: (assetId: string, updatedAsset: any) => void;
  onUpdateStatus: (assetId: string, status: string) => void;
  onUpdateLocation: (assetId: string, location: string) => void;
  onUpdateAssetCheck: (assetId: string, assetCheck: string) => void;
  onDelete: (assetId: string) => void;
  dateRange: DateRange;
  typeFilter: string;
  brandFilter: string;
  configFilter: string;
  userRole: string;
}

const AuditView = (props: AuditViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [configFilter, setConfigFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const { data: editHistory } = useAssetHistory();

  const assetTypes = [...new Set(props.assets.map((asset) => asset.type))];
  const assetBrands = [...new Set(props.assets.map((asset) => asset.brand))];
  const assetConfigurations = [...new Set(props.assets.map((asset) => asset.configuration).filter(Boolean))];
  const assetLocations = [...new Set(props.assets.map((asset) => asset.location))];
  const assetStatuses = [...new Set(props.assets.map((asset) => asset.status))].filter(status => status !== "Assigned");

  // Summary stats for audit view
  const uniqueTypes = [...new Set(props.assets.map((asset) => asset.type))];
  const uniqueBrands = [...new Set(props.assets.map((asset) => asset.brand))];
  const uniqueConfigurations = [...new Set(props.assets.map((asset) => asset.configuration).filter(Boolean))];
  const uniqueStatuses = [...new Set(props.assets.map((asset) => asset.status))];

  const filteredAssets = props.assets.filter((asset) => {
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
        asset.recovery_amount?.toString() || "",
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Asset Types</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-32 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50">
                    <TableHead className="text-xs font-medium text-muted-foreground h-8">Type</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground h-8 text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueTypes.map((type: string) => (
                    <TableRow key={type} className="border-b border-border/50">
                      <TableCell className="font-medium text-foreground">{type}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {props.assets.filter(a => a.type === type).length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Brands</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-32 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50">
                    <TableHead className="text-xs font-medium text-muted-foreground h-8">Brand</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground h-8 text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueBrands.map((brand: string) => (
                    <TableRow key={brand} className="border-b border-border/50">
                      <TableCell className="font-medium text-foreground">{brand}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {props.assets.filter(a => a.brand === brand).length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Configurations</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-32 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50">
                    <TableHead className="text-xs font-medium text-muted-foreground h-8">Configuration</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground h-8 text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueConfigurations.map((config: string) => (
                    <TableRow key={config} className="border-b border-border/50">
                      <TableCell className="font-medium text-foreground">{config}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {props.assets.filter(a => a.configuration === config).length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-32 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50">
                    <TableHead className="text-xs font-medium text-muted-foreground h-8">Status</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground h-8 text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueStatuses.map((status: string) => (
                    <TableRow key={status} className="border-b border-border/50">
                      <TableCell className="font-medium text-foreground">{status}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {props.assets.filter(a => a.status === status).length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" />
            Asset Edit History
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-48 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="text-xs">Asset ID</TableHead>
                  <TableHead className="text-xs">Field Changed</TableHead>
                  <TableHead className="text-xs">Old Value</TableHead>
                  <TableHead className="text-xs">New Value</TableHead>
                  <TableHead className="text-xs">Changed By</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editHistory?.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.asset_id && props.assets.find((a: Asset) => a.id === entry.asset_id)?.asset_id || 'Unknown'}
                    </TableCell>
                    <TableCell className="capitalize">
                      {entry.field_changed}
                    </TableCell>
                    <TableCell className="text-destructive">{entry.old_value || 'N/A'}</TableCell>
                    <TableCell className="text-primary">{entry.new_value || 'N/A'}</TableCell>
                    <TableCell>{entry.changed_by}</TableCell>
                    <TableCell>
                      {format(new Date(entry.changed_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-xs h-7">
                    {statusFilter.length ? `${statusFilter.length} selected` : "Select statuses"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="space-y-2">
                    {assetStatuses.map((status: string) => (
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
        {...props}
        assets={filteredAssets}
        onAssign={props.onAssign}
        onUnassign={props.onUnassign}
        onUpdateAsset={props.onUpdateAsset}
        onUpdateStatus={props.onUpdateStatus}
        onUpdateLocation={props.onUpdateLocation}
        onUpdateAssetCheck={props.onUpdateAssetCheck}
        onDelete={props.onDelete}
        dateRange={dateRange || props.dateRange}
        typeFilter={typeFilter}
        brandFilter={brandFilter}
        configFilter={configFilter}
        defaultRowsPerPage={100}
        viewType="audit"
      />
    </>
  );
};

export default AuditView;