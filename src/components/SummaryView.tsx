import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Asset } from "@/hooks/useAssets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { DateRange } from "react-day-picker";

interface SummaryViewProps {
  assets: Asset[];
}

const SummaryView = ({ assets }: SummaryViewProps) => {
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [conditionFilter, setConditionFilter] = useState<string[]>([]);
  const [configFilter, setConfigFilter] = useState<string[]>([]);
  const [warrantyFilter, setWarrantyFilter] = useState<string[]>([]);
  const [assetCheckFilter, setAssetCheckFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQueryType, setSearchQueryType] = useState("");
  const [searchQueryBrand, setSearchQueryBrand] = useState("");
  const [searchQueryStatus, setSearchQueryStatus] = useState("");
  const [searchQueryLocation, setSearchQueryLocation] = useState("");
  const [searchQueryCondition, setSearchQueryCondition] = useState("");
  const [searchQueryConfig, setSearchQueryConfig] = useState("");
  const [searchQueryWarranty, setSearchQueryWarranty] = useState("");
  const [searchQueryAssetCheck, setSearchQueryAssetCheck] = useState("");
  const rowsPerPage = 15;

  // Unified filter function with excludeFilter for dynamic dropdowns
  const getFilteredAssets = useMemo(
    () => (excludeFilter: string) => {
      return assets.filter((asset) => {
        const typeMatch = excludeFilter === "type" || typeFilter.length === 0 || typeFilter.includes(asset.type);
        const brandMatch = excludeFilter === "brand" || brandFilter.length === 0 || brandFilter.includes(asset.brand);
        const statusMatch = excludeFilter === "status" || statusFilter.length === 0 || statusFilter.includes(asset.status);
        const locationMatch = excludeFilter === "location" || locationFilter.length === 0 || locationFilter.includes(asset.location);
        const conditionMatch = excludeFilter === "condition" || conditionFilter.length === 0 || conditionFilter.includes(asset.asset_condition || "Unknown");
        const configMatch = excludeFilter === "config" || configFilter.length === 0 || (asset.configuration && configFilter.includes(asset.configuration));
        const warrantyMatch = excludeFilter === "warranty" || warrantyFilter.length === 0 || warrantyFilter.includes(asset.warranty_status || "Unknown");
        const assetCheckMatch = excludeFilter === "assetCheck" || assetCheckFilter.length === 0 || assetCheckFilter.includes(asset.asset_check || "Unknown");

        const searchMatch = !searchTerm ||
          [
            asset.employee_id || "",
            asset.assigned_to || "",
            asset.asset_id || "",
            asset.name || "",
            asset.type || "",
            asset.brand || "",
            asset.configuration || "",
            asset.serial_number || "",
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
            asset.asset_condition || "",
            asset.warranty_status || "",
            asset.asset_value_recovery?.toString() || "",
          ].some((val) => val.toLowerCase().includes(searchTerm.toLowerCase()));

        // CORRECTED: Include full end day
        const dateMatch =
          !dateRange?.from ||
          !dateRange?.to ||
          (() => {
            const from = new Date(dateRange.from!);
            const to = new Date(dateRange.to!);
            to.setHours(23, 59, 59, 999); // Include entire end day

            const assigned = asset.assigned_date ? new Date(asset.assigned_date) : null;
            const returned = asset.return_date ? new Date(asset.return_date) : null;

            return (
              (assigned && assigned >= from && assigned <= to) ||
              (returned && returned >= from && returned <= to)
            );
          })();

        return (
          typeMatch && brandMatch && statusMatch && locationMatch &&
          conditionMatch && configMatch && warrantyMatch && assetCheckMatch &&
          searchMatch && dateMatch
        );
      });
    },
    [
      assets,
      typeFilter,
      brandFilter,
      statusFilter,
      locationFilter,
      conditionFilter,
      configFilter,
      warrantyFilter,
      assetCheckFilter,
      searchTerm,
      dateRange,
    ]
  );

  // Compute filtered assets for each dropdown
  const filteredForTypes = useMemo(() => getFilteredAssets("type"), [getFilteredAssets]);
  const filteredForBrands = useMemo(() => getFilteredAssets("brand"), [getFilteredAssets]);
  const filteredForStatuses = useMemo(() => getFilteredAssets("status"), [getFilteredAssets]);
  const filteredForLocations = useMemo(() => getFilteredAssets("location"), [getFilteredAssets]);
  const filteredForConditions = useMemo(() => getFilteredAssets("condition"), [getFilteredAssets]);
  const filteredForConfigs = useMemo(() => getFilteredAssets("config"), [getFilteredAssets]);
  const filteredForWarranties = useMemo(() => getFilteredAssets("warranty"), [getFilteredAssets]);
  const filteredForAssetChecks = useMemo(() => getFilteredAssets("assetCheck"), [getFilteredAssets]);

  // Dropdown options
  const assetTypes = useMemo(() => [...new Set(filteredForTypes.map(a => a.type).filter(Boolean))].sort(), [filteredForTypes]);
  const assetBrands = useMemo(() => [...new Set(filteredForBrands.map(a => a.brand).filter(Boolean))].sort(), [filteredForBrands]);
  const assetStatuses = useMemo(() => [...new Set(filteredForStatuses.map(a => a.status).filter(Boolean))].sort(), [filteredForStatuses]);
  const assetLocations = useMemo(() => [...new Set(filteredForLocations.map(a => a.location).filter(Boolean))].sort(), [filteredForLocations]);
  const assetConditions = useMemo(() => [...new Set(filteredForConditions.map(a => a.asset_condition || "Unknown").filter(Boolean))].sort(), [filteredForConditions]);
  const assetConfigurations = useMemo(() => [...new Set(filteredForConfigs.map(a => a.configuration).filter(Boolean))].sort(), [filteredForConfigs]);
  const warrantyStatuses = useMemo(() => [...new Set(filteredForWarranties.map(a => a.warranty_status || "Unknown").filter(Boolean))].sort(), [filteredForWarranties]);
  const assetChecks = useMemo(() => [...new Set(filteredForAssetChecks.map(a => a.asset_check || "Unknown").filter(Boolean))].sort(), [filteredForAssetChecks]);

  // Final filtered assets
  const filteredAssets = useMemo(() => getFilteredAssets(""), [getFilteredAssets]);

  // Total recovery
  const totalRecovery = useMemo(() => {
    return filteredAssets.reduce((sum, asset) => sum + (Number(asset.asset_value_recovery) || 0), 0);
  }, [filteredAssets]);

  // Summary data
  const summaryData = useMemo(() => {
    return filteredAssets.reduce((acc, asset) => {
      const key = `${asset.type}|${asset.brand}`;
      if (!acc[key]) {
        acc[key] = {
          assetType: asset.type,
          brand: asset.brand,
          counts: Object.fromEntries(assetStatuses.map(status => [status, 0])),
        };
      }
      if (assetStatuses.includes(asset.status)) {
        acc[key].counts[asset.status] += 1;
      }
      return acc;
    }, {} as Record<string, { assetType: string; brand: string; counts: Record<string, number> }>);
  }, [filteredAssets, assetStatuses]);

  const grandTotals = useMemo(() => {
    const totals = Object.fromEntries(assetStatuses.map(status => [status, 0]));
    Object.values(summaryData).forEach(row => {
      assetStatuses.forEach(status => {
        totals[status] += row.counts[status];
      });
    });
    return totals;
  }, [summaryData, assetStatuses]);

  const tableData = useMemo(() => Object.values(summaryData).sort((a, b) => a.assetType.localeCompare(b.assetType)), [summaryData]);
  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    return tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [tableData, currentPage]);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    return { startPage, endPage, pageNumbers };
  };
  const { startPage, endPage, pageNumbers } = getPageNumbers();

  const statusColors: Record<string, string> = {
    Available: "bg-green-600",
    Assigned: "bg-yellow-600",
    "Scrap/Damage": "bg-red-600",
    Sold: "bg-blue-800",
  };
  const getStatusColor = (status: string) => statusColors[status] || "bg-gray-500";

  const clearFilters = () => {
    setTypeFilter([]);
    setBrandFilter([]);
    setStatusFilter([]);
    setLocationFilter([]);
    setConditionFilter([]);
    setConfigFilter([]);
    setWarrantyFilter([]);
    setAssetCheckFilter([]);
    setSearchTerm("");
    setDateRange(undefined);
    setSearchQueryType("");
    setSearchQueryBrand("");
    setSearchQueryStatus("");
    setSearchQueryLocation("");
    setSearchQueryCondition("");
    setSearchQueryConfig("");
    setSearchQueryWarranty("");
    setSearchQueryAssetCheck("");
    setCurrentPage(1);
  };

  useEffect(() => {
    setTypeFilter(prev => prev.filter(t => assetTypes.includes(t)));
    setBrandFilter(prev => prev.filter(b => assetBrands.includes(b)));
    setStatusFilter(prev => prev.filter(s => assetStatuses.includes(s)));
    setLocationFilter(prev => prev.filter(l => assetLocations.includes(l)));
    setConditionFilter(prev => prev.filter(c => assetConditions.includes(c)));
    setConfigFilter(prev => prev.filter(c => assetConfigurations.includes(c)));
    setWarrantyFilter(prev => prev.filter(w => warrantyStatuses.includes(w)));
    setAssetCheckFilter(prev => prev.filter(a => assetChecks.includes(a)));
  }, [assetTypes, assetBrands, assetStatuses, assetLocations, assetConditions, assetConfigurations, warrantyStatuses, assetChecks]);

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

        {/* SINGLE ROW FILTER BAR */}
        <div className="mt-4 overflow-x-auto">
          <div className="flex gap-2 items-end min-w-max">
            {/* Global Search */}
            <div className="space-y-1 min-w-48">
              <Label className="text-xs font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-7 text-xs"
                />
              </div>
            </div>

            {/* Asset Type */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Type</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {typeFilter.length === 0 ? "All" : `${typeFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQueryType}
                      onChange={(e) => setSearchQueryType(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetTypes
                      .filter(t => t.toLowerCase().includes(searchQueryType.toLowerCase()))
                      .map((type) => (
                        <div key={type} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`type-${type}`}
                            checked={typeFilter.includes(type)}
                            onCheckedChange={(checked) => {
                              setTypeFilter(prev => checked ? [...prev, type] : prev.filter(t => t !== type));
                            }}
                          />
                          <Label htmlFor={`type-${type}`} className="text-xs cursor-pointer flex-1">
                            {type}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Brand */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Brand</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {brandFilter.length === 0 ? "All" : `${brandFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQueryBrand}
                      onChange={(e) => setSearchQueryBrand(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetBrands
                      .filter(b => b.toLowerCase().includes(searchQueryBrand.toLowerCase()))
                      .map((brand) => (
                        <div key={brand} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`brand-${brand}`}
                            checked={brandFilter.includes(brand)}
                            onCheckedChange={(checked) => {
                              setBrandFilter(prev => checked ? [...prev, brand] : prev.filter(b => b !== brand));
                            }}
                          />
                          <Label htmlFor={`brand-${brand}`} className="text-xs cursor-pointer flex-1">
                            {brand}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Status</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {statusFilter.length === 0 ? "All" : `${statusFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQueryStatus}
                      onChange={(e) => setSearchQueryStatus(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetStatuses
                      .filter(s => s.toLowerCase().includes(searchQueryStatus.toLowerCase()))
                      .map((status) => (
                        <div key={status} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`status-${status}`}
                            checked={statusFilter.includes(status)}
                            onCheckedChange={(checked) => {
                              setStatusFilter(prev => checked ? [...prev, status] : prev.filter(s => s !== status));
                            }}
                          />
                          <Label htmlFor={`status-${status}`} className="text-xs cursor-pointer flex-1">
                            {status}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Location */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Location</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {locationFilter.length === 0 ? "All" : `${locationFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQueryLocation}
                      onChange={(e) => setSearchQueryLocation(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetLocations
                      .filter(l => l.toLowerCase().includes(searchQueryLocation.toLowerCase()))
                      .map((location) => (
                        <div key={location} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`location-${location}`}
                            checked={locationFilter.includes(location)}
                            onCheckedChange={(checked) => {
                              setLocationFilter(prev => checked ? [...prev, location] : prev.filter(l => l !== location));
                            }}
                          />
                          <Label htmlFor={`location-${location}`} className="text-xs cursor-pointer flex-1">
                            {location}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Condition */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Asset Condition</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {conditionFilter.length === 0 ? "All" : `${conditionFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQueryCondition}
                      onChange={(e) => setSearchQueryCondition(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetConditions
                      .filter(c => c.toLowerCase().includes(searchQueryCondition.toLowerCase()))
                      .map((condition) => (
                        <div key={condition} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`condition-${condition}`}
                            checked={conditionFilter.includes(condition)}
                            onCheckedChange={(checked) => {
                              setConditionFilter(prev => checked ? [...prev, condition] : prev.filter(c => c !== condition));
                            }}
                          />
                          <Label htmlFor={`condition-${condition}`} className="text-xs cursor-pointer flex-1">
                            {condition}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Configuration */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Configuration</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {configFilter.length === 0 ? "All" : `${configFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQueryConfig}
                      onChange={(e) => setSearchQueryConfig(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetConfigurations
                      .filter(c => c.toLowerCase().includes(searchQueryConfig.toLowerCase()))
                      .map((config) => (
                        <div key={config} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`config-${config}`}
                            checked={configFilter.includes(config)}
                            onCheckedChange={(checked) => {
                              setConfigFilter(prev => checked ? [...prev, config] : prev.filter(c => c !== config));
                            }}
                          />
                          <Label htmlFor={`config-${config}`} className="text-xs cursor-pointer flex-1">
                            {config}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Warranty */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Warranty</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {warrantyFilter.length === 0 ? "All" : `${warrantyFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQueryWarranty}
                      onChange={(e) => setSearchQueryWarranty(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {warrantyStatuses
                      .filter(w => w.toLowerCase().includes(searchQueryWarranty.toLowerCase()))
                      .map((warranty) => (
                        <div key={warranty} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`warranty-${warranty}`}
                            checked={warrantyFilter.includes(warranty)}
                            onCheckedChange={(checked) => {
                              setWarrantyFilter(prev => checked ? [...prev, warranty] : prev.filter(w => w !== warranty));
                            }}
                          />
                          <Label htmlFor={`warranty-${warranty}`} className="text-xs cursor-pointer flex-1">
                            {warranty}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Asset Check */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Check</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {assetCheckFilter.length === 0 ? "All" : `${assetCheckFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQueryAssetCheck}
                      onChange={(e) => setSearchQueryAssetCheck(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetChecks
                      .filter(c => c.toLowerCase().includes(searchQueryAssetCheck.toLowerCase()))
                      .map((check) => (
                        <div key={check} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`check-${check}`}
                            checked={assetCheckFilter.includes(check)}
                            onCheckedChange={(checked) => {
                              setAssetCheckFilter(prev => checked ? [...prev, check] : prev.filter(a => a !== check));
                            }}
                          />
                          <Label htmlFor={`check-${check}`} className="text-xs cursor-pointer flex-1">
                            {check}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Date Range */}
            <div className="space-y-1 min-w-48">
              <Label className="text-xs font-medium">Date Range</Label>
              <DatePickerWithRange
                date={dateRange}
                setDate={setDateRange}
                className="h-7 text-xs"
                placeholder="Pick range"
              />
            </div>

            {/* Clear Filters */}
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="hover:bg-destructive hover:text-destructive-foreground text-xs h-7 w-full min-w-28"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Assets Found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[60vh] relative">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-xs text-white sticky top-0 z-10">
                    <th className="p-2 text-left bg-blue-600">Asset Type</th>
                    <th className="p-2 text-left bg-blue-600">Brand</th>
                    {assetStatuses.map((status) => (
                      <th key={status} className={`p-2 text-left ${getStatusColor(status)}`}>
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
                      {assetStatuses.map((status) => (
                        <td key={status} className="p-2 text-xs">{row.counts[status]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold bg-gray-100">
                    <td className="p-2 text-xs">Grand Total</td>
                    <td className="p-2 text-xs"></td>
                    {assetStatuses.map((status) => (
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
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  &lt;
                </Button>
                {startPage > 1 && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} className="h-8 w-8 p-0">1</Button>
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
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} className="h-8 w-8 p-0">
                      {totalPages}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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