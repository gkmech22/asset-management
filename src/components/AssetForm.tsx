import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AssetFormProps {
  onSubmit: (asset: any) => void;
  onCancel: () => void;
  asset?: any;
  isEdit?: boolean;
}

export const AssetForm = ({ onSubmit, onCancel, asset, isEdit = false }: AssetFormProps) => {
  const [formData, setFormData] = useState({
    assetId: asset?.assetId || "",
    name: asset?.name || "",
    type: asset?.type || "",
    brand: asset?.brand || "",
    configuration: asset?.configuration || "",
    serialNumber: asset?.serialNumber || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            {isEdit ? "Edit Asset" : "Add New Asset"}
          </DialogTitle>
        </DialogHeader>
        
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
            <Select onValueChange={(value) => setFormData({ ...formData, type: value })}>
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

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              disabled={!formData.assetId || !formData.name || !formData.type || !formData.brand || !formData.serialNumber}
            >
              {isEdit ? "Update Asset" : "Add Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};