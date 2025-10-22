import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Asset } from "@/hooks/useAssets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Search, RotateCcw } from "lucide-react";

interface SummaryViewProps {
  assets: Asset[];
  onAssign: (assetId: string, userName: string, employeeId: string) => Promise<void>;
  onUnassign: (assetId: string, remarks?: string, receivedBy?: string) => Promise<void>;
  onUpdateAsset: (assetId: string, updatedAsset: any) => Promise<void>;
  onUpdateStatus: (assetId: string, status: string) => Promise<void>;
  onUpdateLocation: (assetId: string, location: string) => Promise<void>;
  onUpdateAssetCheck: (assetId: string, assetCheck: string) => Promise<void>;
  onDelete: (assetId: string) => Promise<void>;
  userRole: string | null;
}

const SummaryView = ({
  assets,
  onAssign,
  onUnassign,
  onUpdateAsset,
  onUpdateStatus,
  onUpdateLocation,
  onUpdateAssetCheck,
  onDelete,
  userRole,
}: SummaryViewProps) => {
  const [typeFilter, setTypeFilter] = React.useState("All");
  const [brandFilter, setBrandFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [locationFilter, setLocationFilter] = React.useState("All");
  const [conditionFilter, setConditionFilter] = React.useState("All");
  const [configFilter, setConfigFilter] = React.useState("All");
  const [warrantyFilter, setWarrantyFilter] = React.useState("All");
  const [assetCheckFilter, setAssetCheckFilter] = React.useState("All");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState<string | null>(null);
  const [dateTo, setDateTo] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 15;
  const [searchQueryType, setSearchQueryType] = React.useState("");
  const [searchQueryBrand, setSearchQueryBrand] = React.useState("");
  const [searchQueryStatus, setSearchQueryStatus] = React.useState("");
  const [searchQueryLocation, setSearchQueryLocation] = React.useState("");
  const [searchQueryCondition, setSearchQueryCondition] = React.useState("");
  const [searchQueryConfig, setSearchQueryConfig] = React.useState("");
  const [searchQueryWarranty, setSearchQueryWarranty] = React.useState("");
  const [searchQueryAssetCheck, setSearchQueryAssetCheck] = React.useState("");

  // Define possible locations
  const locations = [
    "All",
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

  // Get unique asset types
  const assetTypes = React.useMemo(() => {
    const types = new Set(assets.map(asset => asset.type));
    return ["All", ...Array.from(types).sort()];
  }, [assets]);

  // Get unique brands based on typeFilter
  const filteredBrands = React.useMemo(() => {
    const brandSet = new Set(
      assets
        .filter(asset => typeFilter === "All" || asset.type === typeFilter)
        .map(asset => asset.brand)
    );
    return ["All", ...Array.from(brandSet).sort()];
  }, [assets, typeFilter]);

  // Get unique configurations based on typeFilter
  const filteredConfigurations = React.useMemo(() => {
    const configSet = new Set(
      assets
        .filter(asset => typeFilter === "All" || asset.type === typeFilter)
        .map(asset => asset.configuration || "Unknown")
    );
    return ["All", ...Array.from(configSet).sort()];
  }, [assets, typeFilter]);

  // Reset brand and config filters when type changes
  React.useEffect(() => {
    setBrandFilter("All");
    setConfigFilter("All");
  }, [typeFilter]);

  const statuses = React.useMemo(() => {
    const statusSet = new Set(assets.map(asset => asset.status));
    return [...Array.from(statusSet).sort()];
  }, [assets]);

  const conditions = React.useMemo(() => {
    const conditionSet = new Set(assets.map(asset => asset.asset_condition || "Unknown"));
    return ["All", ...Array.from(conditionSet).sort()];
  }, [assets]);

  const warrantyStatuses = React.useMemo(() => {
    const warrantySet = new Set(assets.map(asset => asset.warranty_status || "Unknown"));
    return ["All", ...Array.from(warrantySet).sort()];
  }, [assets]);

  const assetChecks = React.useMemo(() => {
    const checkSet = new Set(assets.map(asset => asset.asset_check || "Unknown"));
    return ["All", ...Array.from(checkSet).sort()];
  }, [assets]);

  // Filter assets based on selected filters and search
  const filteredAssets = React.useMemo(() => {
    return assets.filter((asset) => {
      const matchesType = typeFilter === "All" || asset.type === typeFilter;
      const matchesBrand = brandFilter === "All" || asset.brand === brandFilter;
      const matchesStatus = statusFilter === "All" || asset.status === statusFilter;
      const matchesLocation = locationFilter === "All" || asset.location === locationFilter;
      const matchesCondition = conditionFilter === "All" || asset.asset_condition === conditionFilter;
      const matchesConfig = configFilter === "All" || asset.configuration === configFilter;
      const matchesWarranty = warrantyFilter === "All" || asset.warranty_status === warrantyFilter;
      const matchesAssetCheck = assetCheckFilter === "All" || asset.asset_check === assetCheckFilter;
      const matchesSearch = !searchTerm || 
        (asset.employee_id && asset.employee_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.assigned_to && asset.assigned_to.toLowerCase().includes(searchTerm.toLowerCase())) ||
        Object.values(asset).some(val => val && val.toString().toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDate = (!dateFrom || !asset.assigned_date || new Date(asset.assigned_date) >= new Date(dateFrom)) &&
        (!dateTo || !asset.assigned_date || new Date(asset.assigned_date) <= new Date(dateTo));
      return matchesType && matchesBrand && matchesStatus && matchesLocation && matchesCondition && matchesConfig && matchesWarranty && matchesAssetCheck && matchesSearch && matchesDate;
    });
  }, [assets, typeFilter, brandFilter, statusFilter, locationFilter, conditionFilter, configFilter, warrantyFilter, assetCheckFilter, searchTerm, dateFrom, dateTo]);

  // Calculate sum of asset_value_recovery
  const totalRecovery = React.useMemo(() => {
    return filteredAssets.reduce((sum, asset) => sum + (asset.asset_value_recovery || 0), 0);
  }, [filteredAssets]);

  // Group assets by Asset Type and Brand, counting each status
  const summaryData = filteredAssets.reduce((acc, asset) => {
    const key = `${asset.type}|${asset.brand}`;
    if (!acc[key]) {
      acc[key] = {
        assetType: asset.type,
        brand: asset.brand,
        counts: Object.fromEntries(statuses.map(status => [status, 0])),
      };
    }
    if (statuses.includes(asset.status)) {
      acc[key].counts[asset.status] += 1;
    }
    return acc;
  }, {} as Record<string, { assetType: string; brand: string; counts: Record<string, number> }>);

  // Calculate grand totals for each status
  const grandTotals = React.useMemo(() => {
    const totals = Object.fromEntries(statuses.map(status => [status, 0]));
    Object.values(summaryData).forEach(row => {
      statuses.forEach(status => {
        totals[status] += row.counts[status];
      });
    });
    return totals;
  }, [summaryData, statuses]);

  // Sort by assetType alphabetically
  const tableData = Object.values(summaryData).sort((a, b) => a.assetType.localeCompare(b.assetType));

  // Pagination calculations
  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const paginatedData = tableData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return { startPage, endPage, pageNumbers };
  };

  const { startPage, endPage, pageNumbers } = getPageNumbers();

  // Define dynamic colors for status columns
  const statusColors: Record<string, string> = {
    Available: "bg-green-600",
    Assigned: "bg-yellow-600",
    "Scrap/Damage": "bg-red-600",
    Sold: "bg-blue-800",
    // Add fallback for new statuses
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || `bg-gray-${Math.floor(Math.random() * 4 + 5)}00`; // Random gray shade for new statuses
  };

  const clearFilters = () => {
    setTypeFilter("All");
    setBrandFilter("All");
    setStatusFilter("All");
    setLocationFilter("All");
    setConditionFilter("All");
    setConfigFilter("All");
    setWarrantyFilter("All");
    setAssetCheckFilter("All");
    setSearchTerm("");
    setDateFrom(null);
    setDateTo(null);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            Asset Summary ({filteredAssets.length} items)
          </CardTitle>
          <div className="text-sm font-medium text-primary">
            Asset Value Recovery = Rs. {totalRecovery.toLocaleString()}
          </div>
        </div>
        <div className="flex gap-4 mt-4 overflow-x-auto">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium"></Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Asset Type:</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
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
                {assetTypes
                  .filter((type) =>
                    type.toLowerCase().includes(searchQueryType.toLowerCase())
                  )
                  .map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Brand:</Label>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
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
                {filteredBrands
                  .filter((brand) =>
                    brand.toLowerCase().includes(searchQueryBrand.toLowerCase())
                  )
                  .map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
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
                {["All", ...statuses]
                  .filter((status) =>
                    status.toLowerCase().includes(searchQueryStatus.toLowerCase())
                  )
                  .map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Location:</Label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
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
                {locations
                  .filter((location) =>
                    location.toLowerCase().includes(searchQueryLocation.toLowerCase())
                  )
                  .map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Asset Condition:</Label>
            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    type="text"
                    placeholder="Type to search..."
                    value={searchQueryCondition}
                    onChange={(e) => setSearchQueryCondition(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-full h-6 text-xs"
                  />
                </div>
                {conditions
                  .filter((condition) =>
                    condition.toLowerCase().includes(searchQueryCondition.toLowerCase())
                  )
                  .map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Configuration:</Label>
            <Select value={configFilter} onValueChange={setConfigFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Select configuration" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
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
                {filteredConfigurations
                  .filter((config) =>
                    config.toLowerCase().includes(searchQueryConfig.toLowerCase())
                  )
                  .map((config) => (
                    <SelectItem key={config} value={config}>
                      {config}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Warranty Status:</Label>
            <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Select warranty status" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    type="text"
                    placeholder="Type to search..."
                    value={searchQueryWarranty}
                    onChange={(e) => setSearchQueryWarranty(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-full h-6 text-xs"
                  />
                </div>
                {warrantyStatuses
                  .filter((warranty) =>
                    warranty.toLowerCase().includes(searchQueryWarranty.toLowerCase())
                  )
                  .map((warranty) => (
                    <SelectItem key={warranty} value={warranty}>
                      {warranty}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Asset Check:</Label>
            <Select value={assetCheckFilter} onValueChange={setAssetCheckFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Select asset check" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    type="text"
                    placeholder="Type to search..."
                    value={searchQueryAssetCheck}
                    onChange={(e) => setSearchQueryAssetCheck(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-full h-6 text-xs"
                  />
                </div>
                {assetChecks
                  .filter((check) =>
                    check.toLowerCase().includes(searchQueryAssetCheck.toLowerCase())
                  )
                  .map((check) => (
                    <SelectItem key={check} value={check}>
                      {check}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">From:</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom || ""}
                onChange={(e) => setDateFrom(e.target.value || null)}
                className="pl-10 w-48 h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">To:</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateTo || ""}
                onChange={(e) => setDateTo(e.target.value || null)}
                className="pl-10 w-48 h-9 text-sm"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="h-9"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No Assets Found
            </h3>
            <p className="text-sm text-muted-foreground">
              No assets match your current filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[60vh] relative">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-xs text-white sticky top-0 z-10">
                    <th className="p-2 text-left bg-blue-600">Asset Type</th>
                    <th className="p-2 text-left bg-blue-600">Brand</th>
                    {statuses.map((status) => (
                      <th key={status} className="p-2 text-left bg-blue-600">
                        {status}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr key={`${row.assetType}-${row.brand}-${index}`} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-xs">{row.assetType}</td>
                      <td className="p-2 text-xs">{row.brand}</td>
                      {statuses.map((status) => (
                        <td key={status} className="p-2 text-xs">{row.counts[status]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold bg-gray-100">
                    <td className="p-2 text-xs">Grand Total</td>
                    <td className="p-2 text-xs"></td>
                    {statuses.map((status) => (
                      <td key={status} className="p-2 text-xs">{grandTotals[status]}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                {Math.min(currentPage * rowsPerPage, tableData.length)} of {tableData.length} rows
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  &lt;
                </Button>
                {startPage > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      className="h-8 w-8 p-0"
                    >
                      1
                    </Button>
                    {startPage > 2 && <span className="text-sm px-2">...</span>}
                  </>
                )}
                {pageNumbers.map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 p-0 ${currentPage === page ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    {page}
                  </Button>
                ))}
                {endPage < totalPages && (
                  <>
                    {endPage < totalPages - 1 && <span className="text-sm px-2">...</span>}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="h-8 w-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  &gt;
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryView;