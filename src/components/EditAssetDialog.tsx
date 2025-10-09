import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface EditAssetDialogProps {
  asset: any;
  assets: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (assetId: string, updatedAsset: any) => void;
}

export const EditAssetDialog = ({ asset, assets, open, onOpenChange, onUpdate }: EditAssetDialogProps) => {
  const [formData, setFormData] = useState({
    assetId: "",
    name: "",
    type: "",
    brand: "",
    configuration: "",
    serialNumber: "",
    farCode: "",
    provider: "",
    warrantyStart: "",
    warrantyEnd: "",
    employeeId: "",
    employeeName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [customType, setCustomType] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customProvider, setCustomProvider] = useState("");
  const [customName, setCustomName] = useState("");
  const [customConfiguration, setCustomConfiguration] = useState("");
  const [searchQueryName, setSearchQueryName] = useState("");
  const [searchQueryType, setSearchQueryType] = useState("");
  const [searchQueryBrand, setSearchQueryBrand] = useState("");
  const [searchQueryConfiguration, setSearchQueryConfiguration] = useState("");
  const [searchQueryProvider, setSearchQueryProvider] = useState("");

  // Extract unique values for select options
  const uniqueTypes = Array.from(new Set(assets.map((a) => a.type).filter(Boolean)));
  const uniqueBrands = Array.from(new Set(assets.map((a) => a.brand).filter(Boolean)));
  const uniqueProviders = Array.from(new Set(assets.map((a) => a.provider).filter(Boolean)));
  const uniqueNames = Array.from(new Set(assets.map((a) => a.name).filter(Boolean)));
  const uniqueConfigurations = Array.from(new Set(assets.map((a) => a.configuration).filter(Boolean)));

  useEffect(() => {
    if (asset && open) {
      setFormData({
        assetId: asset.asset_id || "",
        name: asset.name || "",
        type: asset.type || "",
        brand: asset.brand || "",
        configuration: asset.configuration || "",
        serialNumber: asset.serial_number || "",
        farCode: asset.far_code || "",
        provider: asset.provider || "",
        warrantyStart: asset.warranty_start || "",
        warrantyEnd: asset.warranty_end || "",
        employeeId: asset.employee_id || "",
        employeeName: asset.assigned_to || "",
      });
      setCustomType(asset.type === "custom" ? asset.type : "");
      setCustomBrand(asset.brand === "custom" ? asset.brand : "");
      setCustomProvider(asset.provider === "custom" ? asset.provider : "");
      setCustomName(asset.name === "custom" ? asset.name : "");
      setCustomConfiguration(asset.configuration === "custom" ? asset.configuration : "");
      setError(null);
      setSearchQueryName("");
      setSearchQueryType("");
      setSearchQueryBrand("");
      setSearchQueryConfiguration("");
      setSearchQueryProvider("");
    }
  }, [asset, open]);

  const isAssigned = asset?.status === "Assigned";

  const validateUniqueness = () => {
    const existingAssetWithId = assets.find(
      (a) => a.asset_id === formData.assetId && a.id !== asset.id
    );
    const existingAssetWithSerial = assets.find(
      (a) => a.serial_number === formData.serialNumber && a.id !== asset.id
    );
    const assetWithDifferentSerial = assets.find(
      (a) => a.asset_id === formData.assetId && a.serial_number !== formData.serialNumber && a.id !== asset.id
    );
    const assetWithDifferentId = assets.find(
      (a) => a.serial_number === formData.serialNumber && a.asset_id !== formData.assetId && a.id !== asset.id
    );

    if (existingAssetWithId) {
      return `Asset ID ${formData.assetId} is already in use by another asset.`;
    }
    if (existingAssetWithSerial) {
      return `Serial Number ${formData.serialNumber} is already in use by another asset.`;
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
    setError(null);

    const validationError = validateUniqueness();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    if (!formData.assetId || !formData.name || !formData.type || !formData.brand || !formData.serialNumber) {
      setError("Please fill in all required fields.");
      toast.error("Please fill in all required fields.");
      return;
    }

    // Validate employee fields if status is Assigned
    if (isAssigned && (!formData.employeeId || !formData.employeeName)) {
      setError("Employee ID and Employee Name are required for Assigned status.");
      toast.error("Employee ID and Employee Name are required for Assigned status.");
      return;
    }

    // Pass only changed fields to onUpdate
    const updatedFields: any = {};
    if (formData.assetId !== asset.asset_id) updatedFields.assetId = formData.assetId;
    if (formData.name !== asset.name) updatedFields.name = formData.name === "custom" ? customName : formData.name;
    if (formData.type !== asset.type) updatedFields.type = formData.type === "custom" ? customType : formData.type;
    if (formData.brand !== asset.brand) updatedFields.brand = formData.brand === "custom" ? customBrand : formData.brand;
    if (formData.configuration !== (asset.configuration || "")) updatedFields.configuration = formData.configuration === "custom" ? customConfiguration : (formData.configuration || null);
    if (formData.serialNumber !== asset.serial_number) updatedFields.serialNumber = formData.serialNumber;
    if (formData.farCode !== (asset.far_code || "")) updatedFields.farCode = formData.farCode || null;
    if (formData.provider !== (asset.provider || "")) updatedFields.provider = formData.provider === "custom" ? customProvider : (formData.provider || null);
    if (formData.warrantyStart !== (asset.warranty_start || "")) updatedFields.warrantyStart = formData.warrantyStart || null;
    if (formData.warrantyEnd !== (asset.warranty_end || "")) updatedFields.warrantyEnd = formData.warrantyEnd || null;

    // Only call onUpdate if there are changes
    if (Object.keys(updatedFields).length > 0) {
      onUpdate(asset.id, updatedFields);
    }
    onOpenChange(false);
    setError(null);
  };

  if (!asset || !open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            Edit Asset
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
            <Label htmlFor="name">Model *</Label>
            <Select
              value={formData.name}
              onValueChange={(value) => setFormData({ ...formData, name: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    type="text"
                    placeholder="Type to search..."
                    value={searchQueryName}
                    onChange={(e) => setSearchQueryName(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-full h-6 text-xs"
                  />
                </div>
                {uniqueNames
                  .filter((name) =>
                    name.toLowerCase().includes(searchQueryName.toLowerCase())
                  )
                  .map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {formData.name === "custom" && (
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter custom asset name"
                className="mt-2"
                required
              />
            )}
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
                {uniqueTypes
                  .filter((type) =>
                    type.toLowerCase().includes(searchQueryType.toLowerCase())
                  )
                  .map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {formData.type === "custom" && (
              <Input
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Enter custom type"
                className="mt-2"
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Brand *</Label>
            <Select
              value={formData.brand}
              onValueChange={(value) => setFormData({ ...formData, brand: value })}
            >
              <SelectTrigger>
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
                {uniqueBrands
                  .filter((brand) =>
                    brand.toLowerCase().includes(searchQueryBrand.toLowerCase())
                  )
                  .map((brand) => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {formData.brand === "custom" && (
              <Input
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                placeholder="Enter custom brand"
                className="mt-2"
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="configuration">Configuration</Label>
            <Select
              value={formData.configuration || ""}
              onValueChange={(value) => setFormData({ ...formData, configuration: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select configuration" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    type="text"
                    placeholder="Type to search..."
                    value={searchQueryConfiguration}
                    onChange={(e) => setSearchQueryConfiguration(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-full h-6 text-xs"
                  />
                </div>
                {uniqueConfigurations
                  .filter((config) =>
                    config.toLowerCase().includes(searchQueryConfiguration.toLowerCase())
                  )
                  .map((config) => (
                    <SelectItem key={config} value={config}>{config}</SelectItem>
                  ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {formData.configuration === "custom" && (
              <Textarea
                value={customConfiguration}
                onChange={(e) => setCustomConfiguration(e.target.value)}
                placeholder="e.g., 16GB RAM, 512GB SSD"
                rows={2}
                className="mt-2"
              />
            )}
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
            <Label htmlFor="farCode">FAR Code</Label>
            <Input
              id="farCode"
              value={formData.farCode}
              onChange={(e) => setFormData({ ...formData, farCode: e.target.value })}
              placeholder="e.g., FAR-001 (Optional)"
            />
          </div>

          {isAssigned && (
            <>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  disabled
                  placeholder="Enter employee ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeName">Employee Name *</Label>
                <Input
                  id="employeeName"
                  value={formData.employeeName}
                  disabled
                  placeholder="Enter employee name"
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={formData.provider || ""}
              onValueChange={(value) => setFormData({ ...formData, provider: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    type="text"
                    placeholder="Type to search..."
                    value={searchQueryProvider}
                    onChange={(e) => setSearchQueryProvider(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-full h-6 text-xs"
                  />
                </div>
                {uniqueProviders
                  .filter((provider) =>
                    provider.toLowerCase().includes(searchQueryProvider.toLowerCase())
                  )
                  .map((provider) => (
                    <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                  ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {formData.provider === "custom" && (
              <Input
                value={customProvider}
                onChange={(e) => setCustomProvider(e.target.value)}
                placeholder="e.g., Amazon, Dell Direct"
                className="mt-2"
              />
            )}
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

          <div className="space-y-2">
            <Label htmlFor="createdBy">Created By</Label>
            <Input
              id="createdBy"
              value={asset.created_by || ""}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="createdAt">Created At</Label>
            <Input
              id="createdAt"
              value={asset.created_at ? new Date(asset.created_at).toLocaleString() : ""}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="updatedBy">Last Updated By</Label>
            <Input
              id="updatedBy"
              value={asset.updated_by || ""}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="updatedAt">Last Updated At</Label>
            <Input
              id="updatedAt"
              value={asset.updated_at ? new Date(asset.updated_at).toLocaleString() : ""}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                setError(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              disabled={!formData.assetId || !formData.name || (formData.name === "custom" && !customName) || !formData.type || (formData.type === "custom" && !customType) || !formData.brand || (formData.brand === "custom" && !customBrand) || !formData.serialNumber || (isAssigned && (!formData.employeeId || !formData.employeeName))}
            >
              Update Asset
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};