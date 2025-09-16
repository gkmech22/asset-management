import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AssetFormProps {
  onSubmit: (asset: any) => void;
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
  });
  const [showCustomName, setShowCustomName] = React.useState(false);
  const [showCustomBrand, setShowCustomBrand] = React.useState(false);
  const [showCustomConfiguration, setShowCustomConfiguration] = React.useState(false);
  const [showCustomProvider, setShowCustomProvider] = React.useState(false);
  const [customName, setCustomName] = React.useState("");
  const [customBrand, setCustomBrand] = React.useState("");
  const [customConfiguration, setCustomConfiguration] = React.useState("");
  const [customProvider, setCustomProvider] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Derive unique values for dropdowns
  const uniqueNames = React.useMemo(() => {
    const names = new Set<string>();
    assets.forEach((a) => {
      if (a?.name) names.add(a.name);
    });
    return Array.from(names).sort();
  }, [assets]);

  const uniqueBrands = React.useMemo(() => {
    const brands = new Set<string>();
    assets.forEach((a) => {
      if (a?.brand) brands.add(a.brand);
    });
    return Array.from(brands).sort();
  }, [assets]);

  const uniqueConfigurations = React.useMemo(() => {
    const configurations = new Set<string>();
    assets.forEach((a) => {
      if (a?.configuration) configurations.add(a.configuration);
    });
    return Array.from(configurations).sort();
  }, [assets]);

  const uniqueProviders = React.useMemo(() => {
    const providers = new Set<string>();
    assets.forEach((a) => {
      if (a?.provider) providers.add(a.provider);
    });
    return Array.from(providers).sort();
  }, [assets]);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        assetId: initialData.assetId || "",
        name: initialData.name || "",
        type: initialData.type || "",
        brand: initialData.brand || "",
        configuration: initialData.configuration || "",
        serialNumber: initialData.serialNumber || "",
        provider: initialData.provider || "",
        warrantyStart: initialData.warrantyStart || "",
        warrantyEnd: initialData.warrantyEnd || "",
      });
      setShowCustomName(false);
      setShowCustomBrand(false);
      setShowCustomConfiguration(false);
      setShowCustomProvider(false);
      setCustomName("");
      setCustomBrand("");
      setCustomConfiguration("");
      setCustomProvider("");
      setError(null);
    }
  }, [initialData]);

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

  const validateDates = () => {
    if (formData.warrantyStart && formData.warrantyEnd) {
      const startDate = new Date(formData.warrantyStart);
      const endDate = new Date(formData.warrantyEnd);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return "Invalid warranty dates provided.";
      }
      if (startDate > endDate) {
        return "Warranty start date must be before end date.";
      }
    }
    return null;
  };

  const validateForm = () => {
    if (!formData.assetId || !formData.type || !formData.serialNumber) {
      return "Please fill in all required fields.";
    }
    if (showCustomName && !customName.trim()) {
      return "Please provide a custom asset name.";
    }
    if (showCustomBrand && !customBrand.trim()) {
      return "Please provide a custom brand.";
    }
    if (showCustomConfiguration && !customConfiguration.trim()) {
      return "Please provide a custom configuration.";
    }
    if (showCustomProvider && !customProvider.trim()) {
      return "Please provide a custom provider.";
    }
    if (!showCustomName && !formData.name) {
      return "Please select or enter an asset name.";
    }
    if (!showCustomBrand && !formData.brand) {
      return "Please select or enter a brand.";
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formError = validateForm();
    if (formError) {
      setError(formError);
      toast.error(formError);
      return;
    }

    const uniquenessError = validateUniqueness();
    if (uniquenessError) {
      setError(uniquenessError);
      toast.error(uniquenessError);
      return;
    }

    const dateError = validateDates();
    if (dateError) {
      setError(dateError);
      toast.error(dateError);
      return;
    }

    try {
      const updatedAsset = {
        ...formData,
        name: showCustomName ? customName.trim() : formData.name,
        brand: showCustomBrand ? customBrand.trim() : formData.brand,
        configuration: showCustomConfiguration ? customConfiguration.trim() : formData.configuration,
        provider: showCustomProvider ? customProvider.trim() : formData.provider,
      };
      onSubmit(updatedAsset);
      toast.success(initialData ? "Updated asset successfully" : "Added asset successfully");
      setError(null);
    } catch (error: any) {
      setError("Failed to submit asset. Please try again.");
      toast.error("Failed to submit asset. Please try again.");
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
            <Label htmlFor="name">Asset Name *</Label>
            <div className="flex items-center gap-2">
              <Select
                value={showCustomName ? "" : formData.name}
                onValueChange={(value) => {
                  setFormData({ ...formData, name: value });
                  setShowCustomName(false);
                  setCustomName("");
                }}
                disabled={showCustomName}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select asset name" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCustomName(!showCustomName);
                  if (showCustomName) {
                    setCustomName("");
                    setFormData({ ...formData, name: "" });
                  }
                }}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {showCustomName && (
              <Input
                id="custom_name"
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
            <div className="flex items-center gap-2">
              <Select
                value={showCustomBrand ? "" : formData.brand}
                onValueChange={(value) => {
                  setFormData({ ...formData, brand: value });
                  setShowCustomBrand(false);
                  setCustomBrand("");
                }}
                disabled={showCustomBrand}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCustomBrand(!showCustomBrand);
                  if (showCustomBrand) {
                    setCustomBrand("");
                    setFormData({ ...formData, brand: "" });
                  }
                }}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {showCustomBrand && (
              <Input
                id="custom_brand"
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
            <div className="flex items-center gap-2">
              <Select
                value={showCustomConfiguration ? "" : formData.configuration}
                onValueChange={(value) => {
                  setFormData({ ...formData, configuration: value });
                  setShowCustomConfiguration(false);
                  setCustomConfiguration("");
                }}
                disabled={showCustomConfiguration}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select configuration" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueConfigurations.map((config) => (
                    <SelectItem key={config} value={config}>
                      {config}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCustomConfiguration(!showCustomConfiguration);
                  if (showCustomConfiguration) {
                    setCustomConfiguration("");
                    setFormData({ ...formData, configuration: "" });
                  }
                }}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {showCustomConfiguration && (
              <Textarea
                id="custom_configuration"
                value={customConfiguration}
                onChange={(e) => setCustomConfiguration(e.target.value)}
                placeholder="Enter custom configuration"
                className="mt-2"
                rows={2}
                required
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
            <div className="flex items-center gap-2">
              <Select
                value={showCustomProvider ? "" : formData.provider}
                onValueChange={(value) => {
                  setFormData({ ...formData, provider: value });
                  setShowCustomProvider(false);
                  setCustomProvider("");
                }}
                disabled={showCustomProvider}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueProviders.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCustomProvider(!showCustomProvider);
                  if (showCustomProvider) {
                    setCustomProvider("");
                    setFormData({ ...formData, provider: "" });
                  }
                }}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {showCustomProvider && (
              <Input
                id="custom_provider"
                value={customProvider}
                onChange={(e) => setCustomProvider(e.target.value)}
                placeholder="Enter custom provider"
                className="mt-2"
                required
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
              disabled={
                !formData.assetId ||
                !formData.type ||
                !formData.serialNumber ||
                (showCustomName && !customName.trim()) ||
                (showCustomBrand && !customBrand.trim()) ||
                (showCustomConfiguration && !customConfiguration.trim()) ||
                (showCustomProvider && !customProvider.trim()) ||
                (!showCustomName && !formData.name) ||
                (!showCustomBrand && !formData.brand)
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
