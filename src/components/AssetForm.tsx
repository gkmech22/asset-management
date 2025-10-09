import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AssetFormProps {
  onSubmit: (asset: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
  assets?: any[];
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
    location: initialData?.location || "",
    employeeId: initialData?.employeeId || "",
    employeeName: initialData?.employeeName || "",
    farCode: initialData?.farCode || "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [customType, setCustomType] = React.useState("");
  const [customBrand, setCustomBrand] = React.useState("");
  const [customProvider, setCustomProvider] = React.useState("");
  const [customName, setCustomName] = React.useState("");
  const [customConfiguration, setCustomConfiguration] = React.useState("");
  const [customLocation, setCustomLocation] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [searchQueryName, setSearchQueryName] = React.useState("");
  const [searchQueryType, setSearchQueryType] = React.useState("");
  const [searchQueryBrand, setSearchQueryBrand] = React.useState("");
  const [searchQueryConfiguration, setSearchQueryConfiguration] = React.useState("");
  const [searchQueryProvider, setSearchQueryProvider] = React.useState("");
  const [searchQueryLocation, setSearchQueryLocation] = React.useState("");

  // Extract unique values for select options
  const uniqueTypes = Array.from(new Set(assets.map((a) => a.type).filter(Boolean)));
  const uniqueBrands = Array.from(new Set(assets.map((a) => a.brand).filter(Boolean)));
  const uniqueProviders = Array.from(new Set(assets.map((a) => a.provider).filter(Boolean)));
  const uniqueNames = Array.from(new Set(assets.map((a) => a.name).filter(Boolean)));
  const uniqueConfigurations = Array.from(new Set(assets.map((a) => a.configuration).filter(Boolean)));
  const uniqueLocations = Array.from(new Set(assets.map((a) => a.location).filter(Boolean)));

  const validateUniqueness = () => {
    const existingAssetWithId = assets.find(
      (a) => a.asset_id === formData.assetId && (!initialData || a.id !== initialData.id)
    );
    const existingAssetWithSerial = assets.find(
      (a) => a.serial_number === formData.serialNumber && (!initialData || a.id !== initialData.id)
    );
    const assetWithDifferentSerial = assets.find(
      (a) =>
        a.asset_id === formData.assetId &&
        a.serial_number !== formData.serialNumber &&
        (!initialData || a.id !== initialData.id)
    );
    const assetWithDifferentId = assets.find(
      (a) =>
        a.serial_number === formData.serialNumber &&
        a.asset_id !== formData.assetId &&
        (!initialData || a.id !== initialData.id)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      setIsSubmitting(false);
      return;
    }

    const submitData = {
      assetId: formData.assetId,
      name: formData.name === "custom" ? customName : formData.name,
      type: formData.type === "custom" ? customType : formData.type,
      brand: formData.brand === "custom" ? customBrand : formData.brand,
      configuration: formData.configuration === "custom" ? customConfiguration : formData.configuration || null,
      serialNumber: formData.serialNumber,
      provider: formData.provider === "custom" ? customProvider : formData.provider || null,
      warrantyStart: formData.warrantyStart || null,
      warrantyEnd: formData.warrantyEnd || null,
      location: formData.location === "custom" ? customLocation : formData.location,
      employeeId: formData.employeeId || null,
      employeeName: formData.employeeName || null,
      farCode: formData.farCode || null,
    };

    try {
      await onSubmit(submitData);
      toast.success("Asset added successfully!");
      onCancel();
    } catch (error: any) {
      const errorMessage =
        error.message?.includes("duplicate key value violates unique constraint")
          ? `Asset ID ${formData.assetId} is already in use in the database. Please choose a different ID.`
          : error.message || "Failed to create asset. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
              value={formData.configuration}
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
                placeholder="Enter custom configuration"
                className="mt-2"
                rows={2}
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
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={formData.provider}
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
                placeholder="Enter custom provider"
                className="mt-2"
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Select
              value={formData.location}
              onValueChange={(value) => setFormData({ ...formData, location: value })}
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
                    <SelectItem key={location} value={location}>{location}</SelectItem>
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
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input
              id="employeeId"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              placeholder="e.g., EMP-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employeeName">Employee Name</Label>
            <Input
              id="employeeName"
              value={formData.employeeName}
              onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
              placeholder="e.g., John Doe"
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              disabled={
                isSubmitting ||
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
                (formData.employeeId && !formData.employeeName) ||
                (formData.employeeName && !formData.employeeId)
              }
            >
              {initialData ? "Update Asset" : "Add Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};