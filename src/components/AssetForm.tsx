import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AssetFormProps {
  onSubmit: (asset: any) => void;
  onCancel: () => void;
  initialData?: any;
  assets?: any[]; // Added for uniqueness validation
}

export const AssetForm = ({ onSubmit, onCancel, initialData, assets = [] }: AssetFormProps) => {
  const [formData, setFormData] = React.useState({
    assetId: initialData?.assetId || "",
    name: initialData?.name || "",
    type: initialData?.type || "",
    brand: initialData?.brand || "",
    configuration: initialData?.configuration || "",
    serialNumber: initialData?.serialNumber || "",
    provider: initialData?.provider || "",
    warrantyStart: initialData?.warrantyStart || "",
    warrantyEnd: initialData?.warrantyEnd || "",
  });
  const [error, setError] = React.useState<string | null>(null);

  const validateUniqueness = () => {
    const existingAssetWithId = assets.find(
      (a) => a.asset_id === formData.assetId && (!initialData || a.id !== initialData.id)
    );
    const existingAssetWithSerial = assets.find(
      (a) => a.serial_number === formData.serialNumber && (!initialData || a.id !== initialData.id)
    );
    const assetWithDifferentSerial = assets.find(
      (a) => a.asset_id === formData.assetId && a.serial_number !== formData.serialNumber && (!initialData || a.id !== initialData.id)
    );
    const assetWithDifferentId = assets.find(
      (a) => a.serial_number === formData.serialNumber && a.asset_id !== formData.assetId && (!initialData || a.id !== initialData.id)
    );

    if (existingAssetWithId) {
      return `Asset ID ${formData.assetId} is already in use.`;
    }
    if (existingAssetWithSerial) {
      return `Serial Number ${formData.serialNumber} is already in use.`;
    }
    if (assetWithDifferentSerial) {
      return `Asset ID ${formData.assetId} is associated with a different Serial Number (${assetWithDifferentSerial.serial_number}).`;
    }
    if (assetWithDifferentId) {
      return `Serial Number ${formData.serialNumber} is associated with a different Asset ID (${assetWithDifferentId.asset_id}).`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetId || !formData.name || !formData.type || !formData.brand || !formData.serialNumber) {
      setError("Please fill in all required fields.");
      toast.error("Please fill in all required fields.");
      return;
    }

    const validationError = validateUniqueness();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    onSubmit(formData);
    setError(null);
  };

  return (
    <Dialog open={true} onOpenChange={() => { onCancel(); setError(null); }}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            {initialData ? "Edit Asset" : "Add New Asset"}
          </DialogTitle>
        </DialogHeader>
        {error && (
          <div className="text-destructive text-sm mb-4">
            <p>{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assetId">Asset ID *</Label>
            <Input
              id="assetId"
              value={formData.assetId}
              onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
              placeholder="e.g., AST-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Asset Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., MacBook Pro 16 inch"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Asset Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Laptop">Laptop</SelectItem>
                <SelectItem value="Tablet">Tablet</SelectItem>
                <SelectItem value="Desktop">Desktop</SelectItem>
                <SelectItem value="Monitor">Monitor</SelectItem>
                <SelectItem value="Phone">Phone</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Brand *</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="e.g., Apple, Dell, HP"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="configuration">Configuration</Label>
            <Textarea
              id="configuration"
              value={formData.configuration}
              onChange={(e) => setFormData({ ...formData, configuration: e.target.value })}
              placeholder="e.g., 16GB RAM, 512GB SSD"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serialNumber">Serial Number *</Label>
            <Input
              id="serialNumber"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              placeholder="e.g., MBP16-2023-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder="e.g., Amazon, Dell Direct"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warrantyStart">Warranty Start Date</Label>
            <Input
              id="warrantyStart"
              type="date"
              value={formData.warrantyStart}
              onChange={(e) => setFormData({ ...formData, warrantyStart: e.target.value })}
              placeholder="Select warranty start date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warrantyEnd">Warranty End Date</Label>
            <Input
              id="warrantyEnd"
              type="date"
              value={formData.warrantyEnd}
              onChange={(e) => setFormData({ ...formData, warrantyEnd: e.target.value })}
              placeholder="Select warranty end date"
            />
          </div>

          {initialData && (
            <>
              <div className="space-y-2">
                <Label htmlFor="createdBy">Created By</Label>
                <Input
                  id="createdBy"
                  value={initialData.created_by || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createdAt">Created At</Label>
                <Input
                  id="createdAt"
                  value={initialData.created_at ? new Date(initialData.created_at).toLocaleString() : ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="updatedBy">Last Updated By</Label>
                <Input
                  id="updatedBy"
                  value={initialData.updated_by || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="updatedAt">Last Updated At</Label>
                <Input
                  id="updatedAt"
                  value={initialData.updated_at ? new Date(initialData.updated_at).toLocaleString() : ""}
                  disabled
                  className="bg-muted"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => { onCancel(); setError(null); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              disabled={!formData.assetId || !formData.name || !formData.type || !formData.brand || !formData.serialNumber}
            >
              {initialData ? "Update Asset" : "Add Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};