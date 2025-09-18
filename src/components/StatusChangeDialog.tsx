import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Asset } from "@/hooks/useAssets";

interface StatusChangeDialogProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (status: string, recoveryAmount?: string, remarks?: string, location?: string) => Promise<void>;
}

const locations = [
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

const allStatuses = ["Available", "Scrap/Damage", "Sale", "Lost", "Emp Damage", "Courier Damage"];
const statusesNeedingRecovery = ["Sale", "Lost", "Emp Damage", "Courier Damage"];

export const StatusChangeDialog = ({ asset, open, onClose, onStatusChange }: StatusChangeDialogProps) => {
  const [newStatus, setNewStatus] = React.useState("");
  const [recoveryAmount, setRecoveryAmount] = React.useState("");
  const [remarks, setRemarks] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (asset) {
      setNewStatus(asset.status);
      setLocation(asset.location || "");
      setRecoveryAmount("");
      setRemarks("");
      setError(null);
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus) {
      setError("Please select a status.");
      return;
    }

    if (statusesNeedingRecovery.includes(newStatus) && !recoveryAmount) {
      setError("Recovery amount is required for this status.");
      return;
    }

    if (asset?.status === "Assigned" && newStatus !== "Assigned" && !location) {
      setError("Location is required when changing from Assigned status.");
      return;
    }

    try {
      await onStatusChange(newStatus, recoveryAmount || undefined, remarks || undefined, location || undefined);
      onClose();
      setError(null);
    } catch (error) {
      setError("Failed to update status. Please try again.");
    }
  };

  const availableStatuses = asset?.status === "Assigned" 
    ? allStatuses.filter(status => status !== "Assigned")
    : allStatuses;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Asset Status</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="text-destructive text-sm mb-4">
            <p>{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Status: {asset?.status}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newStatus">New Status *</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {asset?.status === "Assigned" && newStatus && newStatus !== "Assigned" && (
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {statusesNeedingRecovery.includes(newStatus) && (
            <div className="space-y-2">
              <Label htmlFor="recoveryAmount">Recovery Amount *</Label>
              <Input
                id="recoveryAmount"
                type="number"
                value={recoveryAmount}
                onChange={(e) => setRecoveryAmount(e.target.value)}
                placeholder="Enter recovery amount"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional remarks"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Update Status
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};