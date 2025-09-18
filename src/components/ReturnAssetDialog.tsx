import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReturnAssetDialogProps {
  asset: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReturn: (assetId: string, data: {
    status: string;
    remarks?: string;
    receivedBy?: string;
    location?: string;
    recoveryAmount?: string;
    returnDate?: string;
  }) => Promise<void>;
  currentUser: string;
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

const statusesNeedingRecovery = ["Sale", "Lost", "Emp Damage", "Courier Damage"];
const allStatuses = ["Available", "Scrap/Damage", "Sale", "Lost", "Emp Damage", "Courier Damage"];

export const ReturnAssetDialog = ({ asset, open, onOpenChange, onReturn, currentUser }: ReturnAssetDialogProps) => {
  const [newStatus, setNewStatus] = React.useState("Available");
  const [remarks, setRemarks] = React.useState("");
  const [receivedBy, setReceivedBy] = React.useState(currentUser || "");
  const [returnLocation, setReturnLocation] = React.useState("");
  const [recoveryAmount, setRecoveryAmount] = React.useState("");
  const [returnDate, setReturnDate] = React.useState<Date>(new Date());
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setNewStatus("Available");
      setRemarks("");
      setReceivedBy(currentUser || "");
      setReturnLocation("");
      setRecoveryAmount("");
      setReturnDate(new Date());
      setError(null);
    }
  }, [open, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receivedBy.trim()) {
      setError("Received By is required.");
      toast.error("Received By is required.");
      return;
    }

    if (newStatus !== "Available" && !returnLocation) {
      setError("Return Location is required for this status.");
      toast.error("Return Location is required for this status.");
      return;
    }

    if (statusesNeedingRecovery.includes(newStatus) && !recoveryAmount) {
      setError("Recovery amount is required for this status.");
      toast.error("Recovery amount is required for this status.");
      return;
    }

    if (!returnDate) {
      setError("Return Date is required.");
      toast.error("Return Date is required.");
      return;
    }

    try {
      await onReturn(asset.id, {
        status: newStatus,
        remarks: remarks.trim() || undefined,
        receivedBy: receivedBy.trim(),
        location: newStatus !== "Available" ? returnLocation : undefined,
        recoveryAmount: statusesNeedingRecovery.includes(newStatus) ? recoveryAmount : undefined,
        returnDate: returnDate.toISOString(),
      });
      onOpenChange(false);
      setError(null);
    } catch (error) {
      console.error("Return failed:", error);
      setError("Failed to return asset. Please try again.");
      toast.error("Failed to return asset. Please try again.");
    }
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            Return Asset - {asset.asset_id}
          </DialogTitle>
        </DialogHeader>
        {error && (
          <div className="text-destructive text-sm mb-4">
            <p>{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">New Status *</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
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

          <div className="space-y-2">
            <Label htmlFor="receivedBy">Received By *</Label>
            <Input
              id="receivedBy"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              placeholder="Enter receiver name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="returnDate">Return Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !returnDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {returnDate ? format(returnDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={returnDate}
                  onSelect={(date) => setReturnDate(date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {newStatus !== "Available" && (
            <div className="space-y-2">
              <Label htmlFor="location">Return Location *</Label>
              <Select value={returnLocation} onValueChange={setReturnLocation}>
                <SelectTrigger>
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
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
            >
              Return Asset
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};