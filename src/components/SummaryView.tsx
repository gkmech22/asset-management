import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Asset } from "@/hooks/useAssets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [brandFilter, setBrandFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [locationFilter, setLocationFilter] = React.useState("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 15;

  // Define possible locations
  const locations = [
    "all",
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

  // Get unique asset types, brands, and statuses
  const assetTypes = React.useMemo(() => {
    const types = new Set(assets.map(asset => asset.type));
    return ["all", ...Array.from(types).sort()];
  }, [assets]);

  const brands = React.useMemo(() => {
    const brandSet = new Set(assets.map(asset => asset.brand));
    return ["all", ...Array.from(brandSet).sort()];
  }, [assets]);

  const statuses = React.useMemo(() => {
    const statusSet = new Set(assets.map(asset => asset.status));
    return [...Array.from(statusSet).sort(), "Others"];
  }, [assets]);

  // Filter assets based on selected filters
  const filteredAssets = React.useMemo(() => {
    return assets.filter((asset) => {
      const matchesType = typeFilter === "all" || asset.type === typeFilter;
      const matchesBrand = brandFilter === "all" || asset.brand === brandFilter;
      const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
      const matchesLocation = locationFilter === "all" || asset.location === locationFilter;
      return matchesType && matchesBrand && matchesStatus && matchesLocation;
    });
  }, [assets, typeFilter, brandFilter, statusFilter, locationFilter]);

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
    } else {
      acc[key].counts["Others"] += 1;
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
    Others: "bg-gray-600",
    // Add fallback for new statuses
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || `bg-gray-${Math.floor(Math.random() * 4 + 5)}00`; // Random gray shade for new statuses
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          Asset Summary ({tableData.length} items)
        </CardTitle>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Asset Type:</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
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
                {brands.map((brand) => (
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
                {["all", ...statuses].map((status) => (
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
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tableData.length === 0 ? (
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