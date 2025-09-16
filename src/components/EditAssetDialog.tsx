import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Asset {
  id: string;
  asset_id: string;
  name: string;
  type: string;
  brand: string;
  configuration?: string;
  serial_number: string;
  status: string;
  location: string;
  assigned_to?: string | null;
  employee_id?: string | null;
  assigned_date?: string | null;
  received_by?: string | null;
  return_date?: string | null;
  remarks?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
  warranty_start?: string | null;
  warranty_end?: string | null;
  asset_check?: string | null;
  provider?: string | null;
  warranty_status?: string | null;
}

interface EditAssetDialogProps {
  asset: Asset | null;
  assets: Asset[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (assetId: string, updatedAsset: Partial<Asset>) => void;
}

export const EditAssetDialog = ({ asset, assets = [], open, onOpenChange, onUpdate }: EditAssetDialogProps) => {
  const [formData, setFormData] = useState<Partial<Asset>>({
    asset_id: "",
    name: "",
    type: "",
    brand: "",
    configuration: "",
    serial_number: "",
    provider: "",
    warranty_start: "",
    warranty_end: "",
  });
  const [showCustomName, setShowCustomName] = useState(false);
  const [showCustomBrand, setShowCustomBrand] = useState(false);
  const [showCustomConfiguration, setShowCustomConfiguration] = useState(false);
  const [showCustomProvider, setShowCustomProvider] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customConfiguration, setCustomConfiguration] = useState("");
  const [customProvider, setCustomProvider] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (asset) {
      setFormData({
        asset_id: asset.asset_id || "",
        name: asset.name || "",
        type: asset.type || "",
        brand: asset.brand || "",
        configuration: asset.configuration || "",
        serial_number: asset.serial_number || "",
        provider: asset.provider || "",
        warranty_start: asset.warranty_start || "",
        warranty_end: asset.warranty_end || "",
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
  }, [asset]);

  const validateUniqueness = () => {
    if (!Array.isArray(assets)) {
      console.error("EditAssetDialog: Invalid assets prop, expected array:", assets);
      return "Invalid assets data provided.";
    }

    const validAssets = assets.filter((a): a is Asset => a && typeof a === "object" && "id" in a && "asset_id" in a && "serial_number" in a);
    const initialId = asset?.id || "";

    const existingAssetWithId = validAssets.find(
      (a) => a.asset_id === formData.asset_id && a.id !== initialId
    );
    const existingAssetWithSerial = validAssets.find(
      (a) => a.serial_number === formData.serial_number && a.id !== initialId
    );
    const assetWithDifferentSerial = validAssets.find(
      (a) => a.asset_id === formData.asset_id && a.serial_number !== formData.serial_number && a.id !== initialId
    );
    const assetWithDifferentId = validAssets.find(
      (a) => a.serial_number === formData.serial_number && a.asset_id !== formData.asset_id && a.id !== initialId
    );

    if (existingAssetWithId) {
      return `Asset ID ${formData.asset_id} is already in use.`;
    }
    if (existingAssetWithSerial) {
      return `Serial Number ${formData.serial_number} is already in use.`;
    }
    if (assetWithDifferentSerial) {
      return `Asset ID ${formData.asset_id} is associated with a different Serial Number (${assetWithDifferentSerial.serial_number}).`;
    }
    if (assetWithDifferentId) {
      return `Serial Number ${formData.serial_number} is associated with a different Asset ID (${assetWithDifferentId.asset_id}).`;
    }
    return null;
  };

  const validateDates = () => {
    if (formData.warranty_start && formData.warranty_end) {
      const startDate = new Date(formData.warranty_start);
      const endDate = new Date(formData.warranty_end);
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
    if (!formData.asset_id || !formData.type || !formData.serial_number) {
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
    if (!asset) return;

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
      const updatedAsset: Partial<Asset> = {
        ...formData,
        name: showCustomName ? customName.trim() : formData.name,
        brand: showCustomBrand ? customBrand.trim() : formData.brand,
        configuration: showCustomConfiguration ? customConfiguration.trim() : formData.configuration,
        provider: showCustomProvider ? customProvider.trim() : formData.provider,
      };
      onUpdate(asset.id, updatedAsset);
      toast.success("Updated asset successfully");
      onOpenChange(false);
      setError(null);
    } catch (error: any) {
      console.error("EditAssetDialog: Submit failed:", error.message, error.stack);
      setError("Failed to update asset. Please try again.");
      toast.error("Failed to update asset. Please try again.");
    }
  };

  if (!asset) return null;

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
            <Label htmlFor="asset_id">Asset ID *</Label>
            <Input
              id="asset_id"
              value={formData.asset_id || ""}
              onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
              placeholder="e.g., AST-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Asset Name *</Label>
            <div className="flex items-center gap-2">
              <Select
                value={showCustomName ? "" : formData.name || ""}
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
              value={formData.type || ""}
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
                value={showCustomBrand ? "" : formData.brand || ""}
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
                value={showCustomConfiguration ? "" : formData.configuration || ""}
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
            <Label htmlFor="serial_number">Serial Number *</Label>
            <Input
              id="serial_number"
              value={formData.serial_number || ""}
              onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              placeholder="e.g., MBP16-2023-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <div className="flex items-center gap-2">
              <Select
                value={showCustomProvider ? "" : formData.provider || ""}
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
            <Label htmlFor="warranty_start">Warranty Start Date</Label>
            <Input
              id="warranty_start"
              type="date"
              value={formData.warranty_start || ""}
              onChange={(e) => setFormData({ ...formData, warranty_start: e.target.value })}
              placeholder="Select warranty start date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warranty_end">Warranty End Date</Label>
            <Input
              id="warranty_end"
              type="date"
              value={formData.warranty_end || ""}
              onChange={(e) => setFormData({ ...formData, warranty_end: e.target.value })}
              placeholder="Select warranty end date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="created_by">Created By</Label>
            <Input
              id="created_by"
              value={asset.created_by || ""}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="created_at">Created At</Label>
            <Input
              id="created_at"
              value={asset.created_at ? new Date(asset.created_at).toLocaleString() : ""}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="updated_by">Last Updated By</Label>
            <Input
              id="updated_by"
              value={asset.updated_by || ""}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="updated_at">Last Updated At</Label>
            <Input
              id="updated_at"
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
                !formData.asset_id ||
                !formData.type ||
                !formData.serial_number ||
                (showCustomName && !customName.trim()) ||
                (showCustomBrand && !customBrand.trim()) ||
                (showCustomConfiguration && !customConfiguration.trim()) ||
                (showCustomProvider && !customProvider.trim()) ||
                (!showCustomName && !formData.name) ||
                (!showCustomBrand && !formData.brand)
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
