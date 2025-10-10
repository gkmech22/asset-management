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
    location: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [customType, setCustomType] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customProvider, setCustomProvider] = useState("");
  const [customName, setCustomName] = useState("");
  const [customConfiguration, setCustomConfiguration] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [searchQueryName, setSearchQueryName] = useState("");
  const [searchQueryType, setSearchQueryType] = useState("");
  const [searchQueryBrand, setSearchQueryBrand] = useState("");
  const [searchQueryConfiguration, setSearchQueryConfiguration] = useState("");
  const [searchQueryProvider, setSearchQueryProvider] = useState("");
  const [searchQueryLocation, setSearchQueryLocation] = useState("");

  // Reset dependent fields when Asset Type changes
  useEffect(() => {
    if (formData.type && formData.type !== asset?.type) {
      setFormData((prev) => ({
        ...prev,
        name: "",
        brand: "",
        configuration: "",
        provider: "",
        location: "",
      }));
      setCustomName("");
      setCustomBrand("");
      setCustomConfiguration("");
      setCustomProvider("");
      setCustomLocation("");
      setSearchQueryName("");
      setSearchQueryBrand("");
      setSearchQueryConfiguration("");
      setSearchQueryProvider("");
      setSearchQueryLocation("");
    }
  }, [formData.type, asset?.type]);

  // Initialize form data when dialog opens or asset changes
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
        location: asset.location || "",
      });
      setCustomType("");
      setCustomBrand("");
      setCustomProvider("");
      setCustomName("");
      setCustomConfiguration("");
      setCustomLocation("");
      setError(null);
      setSearchQueryName("");
      setSearchQueryType("");
      setSearchQueryBrand("");
      setSearchQueryConfiguration("");
      setSearchQueryProvider("");
      setSearchQueryLocation("");
    }
  }, [asset, open]);

  // Filter assets based on selected type
  const filteredAssets = formData.type
    ? assets.filter((a) => a.type === formData.type || formData.type === "custom")
    : assets;

  // Extract unique values for select options
  const uniqueTypes = Array.from(new Set(assets.map((a) => a.type).filter(Boolean)));
  const uniqueNames = Array.from(new Set(filteredAssets.map((a) => a.name).filter(Boolean)));
  const uniqueBrands = Array.from(new Set(filteredAssets.map((a) => a.brand).filter(Boolean)));
  const uniqueConfigurations = Array.from(
    new Set(filteredAssets.map((a) => a.configuration).filter(Boolean))
  );
  const uniqueProviders = Array.from(new Set(filteredAssets.map((a) => a.provider).filter(Boolean)));
  const uniqueLocations = Array.from(new Set(filteredAssets.map((a) => a.location).filter(Boolean)));

  const isAssigned = asset?.status === "Assigned";

  const validateUniqueness = () => {
    const existingAssetWithId = assets.find(
      (a) => a.asset_id === formData.assetId && a.id !== asset.id
    );
    const existingAssetWithSerial = assets.find(
      (a) => a.serial_number === formData.serialNumber && a.id !== asset.id
    );
    const assetWithDifferentSerial = assets.find(
      (a) =>
        a.asset_id === formData.assetId &&
        a.serial_number !== formData.serialNumber &&
        a.id !== asset.id
    );
    const assetWithDifferentId = assets.find(
      (a) =>
        a.serial_number === formData.serialNumber &&
        a.asset_id !== formData.assetId &&
        a.id !== asset.id
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

  const validateForm = () => {
    if (
      !formData.assetId ||
      !formData.name ||
      !formData.type ||
      !formData.brand ||
      !formData.serialNumber ||
      !formData.location
    ) {
      return "Please fill in all required fields: Asset ID, Name, Type, Brand, Serial Number, and Location.";
    }
    if (isAssigned && (!formData.employeeId || !formData.employeeName)) {
      return "Employee ID and Employee Name are required for Assigned status.";
    }
    if (formData.employeeId && !formData.employeeName) {
      return "Employee Name is required if Employee ID is provided.";
    }
    if (formData.employeeName && !formData.employeeId) {
      return "Employee ID is required if Employee Name is provided.";
    }
    if (formData.type === "custom" && !customType) {
      return "Please provide a custom asset type.";
    }
    if (formData.brand === "custom" && !customBrand) {
      return "Please provide a custom brand.";
    }
    if (formData.provider === "custom" && !customProvider) {
      return "Please provide a custom provider.";
    }
    if (formData.name === "custom" && !customName) {
      return "Please provide a custom asset name.";
    }
    if (formData.configuration === "custom" && !customConfiguration) {
      return "Please provide a custom configuration.";
    }
    if (formData.location === "custom" && !customLocation) {
      return "Please provide a custom location.";
    }
    return validateUniqueness();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    const updatedFields: any = {};
    if (formData.assetId !== asset.asset_id) updatedFields.assetId = formData.assetId;
    if (formData.name !== asset.name)
      updatedFields.name = formData.name === "custom" ? customName : formData.name;
    if (formData.type !== asset.type)
      updatedFields.type = formData.type === "custom" ? customType : formData.type;
    if (formData.brand !== asset.brand)
      updatedFields.brand = formData.brand === "custom" ? customBrand : formData.brand;
    if (formData.configuration !== (asset.configuration || ""))
      updatedFields.configuration =
        formData.configuration === "custom" ? customConfiguration : formData.configuration || null;
    if (formData.serialNumber !== asset.serial_number)
      updatedFields.serialNumber = formData.serialNumber;
    if (formData.farCode !== (asset.far_code || ""))
      updatedFields.farCode = formData.farCode || null;
    if (formData.provider !== (asset.provider || ""))
      updatedFields.provider = formData.provider === "custom" ? customProvider : formData.provider || null;
    if (formData.warrantyStart !== (asset.warranty_start || ""))
      updatedFields.warrantyStart = formData.warrantyStart || null;
    if (formData.warrantyEnd !== (asset.warranty_end || ""))
      updatedFields.warrantyEnd = formData.warrantyEnd || null;
    if (formData.location !== (asset.location || ""))
      updatedFields.location = formData.location === "custom" ? customLocation : formData.location;
    if (formData.employeeId !== (asset.employee_id || ""))
      updatedFields.employeeId = formData.employeeId || null;
    if (formData.employeeName !== (asset.assigned_to || ""))
      updatedFields.employeeName = formData.employeeName || null;

    if (Object.keys(updatedFields).length > 0) {
      onUpdate(asset.id, updatedFields);
      toast.success("Asset updated successfully!");
    } else {
      toast.info("No changes detected.");
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
                  .filter((type) => type.toLowerCase().includes(searchQueryType.toLowerCase()))
                  .map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
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
            <Label htmlFor="name">Model *</Label>
            <Select
              value={formData.name}
              onValueChange={(value) => setFormData({ ...formData, name: value })}
              disabled={!formData.type}
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
                  .filter((name) => name.toLowerCase().includes(searchQueryName.toLowerCase()))
                  .map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
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
            <Label htmlFor="brand">Brand *</Label>
            <Select
              value={formData.brand}
              onValueChange={(value) => setFormData({ ...formData, brand: value })}
              disabled={!formData.type}
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
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
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
              disabled={!formData.type}
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
                    <SelectItem key={config} value={config}>
                      {config}
                    </SelectItem>
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
            <Label htmlFor="location">Location *</Label>
            <Select
              value={formData.location}
              onValueChange={(value) => setFormData({ ...formData, location: value })}
              disabled={!formData.type}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    type="text"
                    placeholder="Type to search..."
                    value={searchQueryLocation}
                    onChange={(e) => setSearchQueryLocation(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    autoFocus
                    className="w-full h-6 text-xs"
                  />
                </div>
                {uniqueLocations
                  .filter((location) =>
                    location.toLowerCase().includes(searchQueryLocation.toLowerCase())
                  )
                  .map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {formData.location === "custom" && (
              <Input
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Enter custom location"
                className="mt-2"
                required
              />
            )}
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
              disabled={!formData.type}
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
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
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
              disabled={
                !formData.assetId ||
                !formData.name ||
                (formData.name === "custom" && !customName) ||
                !formData.type ||
                (formData.type === "custom" && !customType) ||
                !formData.brand ||
                (formData.brand === "custom" && !customBrand) ||
                !formData.serialNumber ||
                !formData.location ||
                (formData.location === "custom" && !customLocation) ||
                (isAssigned && (!formData.employeeId || !formData.employeeName)) ||
                (formData.employeeId && !formData.employeeName) ||
                (formData.employeeName && !formData.employeeId)
              }
            >
              Update Asset
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};