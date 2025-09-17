import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const AmcsView = (props: AmcsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [configFilter, setConfigFilter] = useState<string>("all");

  // Get unique values for AMC view (showing warranty-related data)
  const uniqueTypes = [...new Set(props.assets.map((asset) => asset.type))];
  const uniqueBrands = [...new Set(props.assets.map((asset) => asset.brand))];
  const uniqueConfigurations = [...new Set(props.assets.map((asset) => asset.configuration).filter(Boolean))];
  const uniqueProviders = [...new Set(props.assets.map((asset) => asset.provider).filter(Boolean))];
  const uniqueWarrantyStatuses = [...new Set(props.assets.map((asset) => asset.warranty_status).filter(Boolean))];

  const filteredAssets = props.assets.filter((asset) => {
    const typeMatch = typeFilter === "all" || asset.type === typeFilter;
    const brandMatch = brandFilter === "all" || asset.brand === brandFilter;
    const configMatch = configFilter === "all" || asset.configuration === configFilter;

    const searchMatch = searchQuery.trim() === "" || 
      [
        asset.asset_id,
        asset.name,
        asset.type,
        asset.brand,
        asset.configuration || "",
        asset.serial_number,
        asset.provider || "",
        asset.warranty_status || "",
      ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()));

    return typeMatch && brandMatch && configMatch && searchMatch;
  });

  const clearFilters = () => {
    setTypeFilter("all");
    setBrandFilter("all");
    setConfigFilter("all");
    setDateRange(undefined);
    setSearchQuery("");
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
            <CardTitle className="text-sm font-medium text-primary">Providers</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-32 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50">
                    <TableHead className="text-xs font-medium text-muted-foreground h-8">Provider</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground h-8 text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueProviders.map((provider: string) => (
                    <TableRow key={provider} className="border-b border-border/50">
                      <TableCell className="font-medium text-foreground">{provider}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {props.assets.filter(a => a.provider === provider).length}
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
            <CardTitle className="text-sm font-medium text-primary">Warranty Status</CardTitle>
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
                  {uniqueWarrantyStatuses.map((status: string) => (
                    <TableRow key={status} className="border-b border-border/50">
                      <TableCell className="font-medium text-foreground">{status}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {props.assets.filter(a => a.warranty_status === status).length}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Asset Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="text-xs h-7">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type: string) => (
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
                  {uniqueBrands.map((brand: string) => (
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
                  {uniqueConfigurations.map((config: string) => (
                    <SelectItem key={config} value={config} className="text-xs">
                      {config}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Warranty Period</label>
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
        defaultRowsPerPage={10}
        viewType="amcs"
      />
    </>
  );
};

export default AmcsView;