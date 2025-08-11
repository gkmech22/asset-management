import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Asset } from "@/hooks/useAssets";

interface AssetDetailsDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showAssignedToOnly: boolean;
}

export const AssetDetailsDialog = ({ asset, open, onOpenChange, showAssignedToOnly }: AssetDetailsDialogProps) => {
  if (!asset) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        {!showAssignedToOnly && (
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
              Asset Details
            </DialogTitle>
          </DialogHeader>
        )}
        <div className="space-y-4">
          {showAssignedToOnly ? (
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Input id="assignedTo" value={asset.assigned_to || asset.userName || "Unassigned"} disabled className="bg-muted" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="assetId">Asset ID</Label>
                <Input id="assetId" value={asset.asset_id || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name</Label>
                <Input id="name" value={asset.name || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Asset Type</Label>
                <Input id="type" value={asset.type || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" value={asset.brand || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="configuration">Configuration</Label>
                <Textarea
                  id="configuration"
                  value={asset.configuration || ""}
                  disabled
                  className="bg-muted"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input id="serialNumber" value={asset.serial_number || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input id="status" value={asset.status || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={asset.location || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input id="assignedTo" value={asset.assigned_to || "Unassigned"} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input id="employeeId" value={asset.employee_id || "-"} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedDate">Assigned Date</Label>
                <Input id="assignedDate" value={formatDate(asset.assigned_date)} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createdBy">Created By</Label>
                <Input id="createdBy" value={asset.created_by || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createdAt">Created At</Label>
                <Input id="createdAt" value={asset.created_at ? formatDate(asset.created_at) : ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="updatedBy">Last Updated By</Label>
                <Input id="updatedBy" value={asset.updated_by || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="updatedAt">Last Updated At</Label>
                <Input id="updatedAt" value={asset.updated_at ? formatDate(asset.updated_at) : ""} disabled className="bg-muted" />
              </div>
            </>
          )}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};