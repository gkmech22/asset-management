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
  onOpenChange: (open: boolean) => void;
  onConfirm: (newStatus: string, recoveryAmount?: string, remarks?: string, location?: string) => void;
}

export const StatusChangeDialog = ({ asset, open, onOpenChange, onConfirm }: StatusChangeDialogProps) => {
  const [newStatus, setNewStatus] = React.useState("");
  const [recoveryAmount, setRecoveryAmount] = React.useState("");
  const [remarks, setRemarks] = React.useState("");
  const [location, setLocation] = React.useState("");

  const statusesNeedingRecovery = ["Sale", "Lost", "Emp Damage", "Courier Damage"];
  const allStatuses = asset?.status === "Assigned" 
    ? ["Available", "Scrap/Damage", "Sale", "Lost", "Emp Damage", "Courier Damage"]
    : ["Available", "Scrap/Damage", "Sale", "Lost", "Emp Damage", "Courier Damage"];

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

  React.useEffect(() => {
    if (asset) {
      setNewStatus(asset.status);
      setLocation(asset.location || "");
      setRecoveryAmount("");
      setRemarks("");
    }
  }, [asset]);

  const handleConfirm = () => {
    onConfirm(newStatus, recoveryAmount || undefined, remarks || undefined, location || undefined);
    onOpenChange(false);
  };

  const needsRecoveryAmount = statusesNeedingRecovery.includes(newStatus);
  const needsLocation = asset?.status === "Assigned" && newStatus !== "Assigned";
  const isReturning = asset?.status === "Assigned";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            {isReturning ? "Return Asset" : "Change Status"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentStatus">Current Status</Label>
            <Input
              id="currentStatus"
              value={asset?.status || ""}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newStatus">New Status *</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {allStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsLocation && (
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

          {needsRecoveryAmount && (
            <div className="space-y-2">
              <Label htmlFor="recoveryAmount">Recovery Amount</Label>
              <Input
                id="recoveryAmount"
                type="number"
                value={recoveryAmount}
                onChange={(e) => setRecoveryAmount(e.target.value)}
                placeholder="Enter recovery amount"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter any remarks"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirm}
              className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              disabled={!newStatus || (needsLocation && !location)}
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};