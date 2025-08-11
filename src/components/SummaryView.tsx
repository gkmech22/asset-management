import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Asset } from "@/hooks/useAssets";

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
}: SummaryViewProps) => {
  // Define all possible statuses
  const statuses = ["Available", "Assigned", "Scrap/Damage", "Sold", "Others"];

  // Group assets by Asset Type and Brand, counting each status
  const summaryData = assets.reduce((acc, asset) => {
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

  // Sort by assetType alphabetically
  const tableData = Object.values(summaryData).sort((a, b) => a.assetType.localeCompare(b.assetType));

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          Asset Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted text-xs text-muted-foreground">
                <th className="p-2 text-left">Asset Type</th>
                <th className="p-2 text-left">Brand</th>
                {statuses.map(status => (
                  <th key={status} className="p-2 text-left">{status}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={`${row.assetType}-${row.brand}-${index}`} className="border-b">
                  <td className="p-2 text-xs">{row.assetType}</td>
                  <td className="p-2 text-xs">{row.brand}</td>
                  {statuses.map(status => (
                    <td key={status} className="p-2 text-xs">{row.counts[status]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryView;