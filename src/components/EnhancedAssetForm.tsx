import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Asset } from "@/hooks/useAssets";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EnhancedAssetFormProps {
  onSubmit: (asset: any) => void;
  onCancel: () => void;
  initialData?: Asset;
  assets?: Asset[];
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

export const EnhancedAssetForm = ({ onSubmit, onCancel, initialData, assets = [] }: EnhancedAssetFormProps) => {
  const [formData, setFormData] = React.useState({
    assetId: initialData?.asset_id || "",
    model: initialData?.name || "",
    type: initialData?.type || "",
    brand: initialData?.brand || "",
    configuration: initialData?.configuration || "",
    serialNumber: initialData?.serial_number || "",
    provider: initialData?.provider || "",
    warrantyStart: initialData?.warranty_start || "",
    warrantyEnd: initialData?.warranty_end || "",
    location: initialData?.location || "",
    employeeId: initialData?.employee_id || "",
    employeeName: initialData?.assigned_to || "",
  });

  const [customValues, setCustomValues] = React.useState({
    type: "",
    brand: "",
    configuration: "",
    provider: "",
    model: "",
  });

  const [showCustom, setShowCustom] = React.useState({
    type: false,
    brand: false,
    configuration: false,
    provider: false,
    model: false,
  });

  const [warrantyStartDate, setWarrantyStartDate] = React.useState<Date | undefined>(
    initialData?.warranty_start ? new Date(initialData.warranty_start) : undefined
  );
  const [warrantyEndDate, setWarrantyEndDate] = React.useState<Date | undefined>(
    initialData?.warranty_end ? new Date(initialData.warranty_end) : undefined
  );

  const [error, setError] = React.useState<string | null>(null);

  // Extract unique values from existing assets
  const uniqueTypes = [...new Set(assets.map(a => a.type).filter(Boolean))];
  const uniqueBrands = [...new Set(assets.map(a => a.brand).filter(Boolean))];
  const uniqueConfigurations = [...new Set(assets.map(a => a.configuration).filter(Boolean))];
  const uniqueProviders = [...new Set(assets.map(a => a.provider).filter(Boolean))];
  const uniqueModels = [...new Set(assets.map(a => a.name).filter(Boolean))];

  const validateUniqueness = () => {
    const existingAssetWithId = assets.find(
      (a) => a.asset_id === formData.assetId && (!initialData || a.id !== initialData.id)
    );
    const existingAssetWithSerial = assets.find(
      (a) => a.serial_number === formData.serialNumber && (!initialData || a.id !== initialData.id)
    );

    if (existingAssetWithId) {
      return `Asset ID ${formData.assetId} is already in use.`;
    }
    if (existingAssetWithSerial && formData.serialNumber) {
      return `Serial Number ${formData.serialNumber} is already in use.`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.assetId || !formData.model || !formData.type || !formData.brand || !formData.serialNumber || !formData.location) {
      setError("Please fill in all required fields (Asset ID, Model, Type, Brand, Serial Number, Location).");
      toast.error("Please fill in all required fields (Asset ID, Model, Type, Brand, Serial Number, Location).");
      return;
    }

    const validationError = validateUniqueness();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    // Use custom values if provided
    const finalData = {
      ...formData,
      name: showCustom.model ? customValues.model : formData.model,
      type: showCustom.type ? customValues.type : formData.type,
      brand: showCustom.brand ? customValues.brand : formData.brand,
      configuration: showCustom.configuration ? customValues.configuration : formData.configuration,
      provider: showCustom.provider ? customValues.provider : formData.provider,
      warrantyStart: warrantyStartDate ? format(warrantyStartDate, "yyyy-MM-dd") : "",
      warrantyEnd: warrantyEndDate ? format(warrantyEndDate, "yyyy-MM-dd") : "",
    };

    onSubmit(finalData);
    setError(null);
  };

  const handleCustomToggle = (field: keyof typeof showCustom) => {
    setShowCustom(prev => ({ ...prev, [field]: !prev[field] }));
    if (showCustom[field]) {
      setCustomValues(prev => ({ ...prev, [field]: "" }));
    }
  };

  const renderSelectWithCustom = (
    field: keyof typeof showCustom,
    label: string,
    options: string[],
    value: string,
    onChange: (value: string) => void,
    required = false
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={field}>{label} {required && "*"}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleCustomToggle(field)}
          className="h-6 w-6 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {showCustom[field] ? (
        <Input
          id={`custom-${field}`}
          value={customValues[field]}
          onChange={(e) => setCustomValues(prev => ({ ...prev, [field]: e.target.value }))}
          placeholder={`Enter custom ${label.toLowerCase()}`}
          required={required}
        />
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );

  const renderDatePicker = (
    label: string,
    date: Date | undefined,
    onDateChange: (date: Date | undefined) => void,
    required = false
  ) => (
    <div className="space-y-2">
      <Label>{label} {required && "*"}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  // Only show employee fields if status is Assigned during edit
  const showEmployeeFields = !initialData || initialData.status === "Assigned";

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

          {renderSelectWithCustom(
            "model",
            "Model",
            uniqueModels,
            formData.model,
            (value) => setFormData({ ...formData, model: value }),
            true
          )}

          {renderSelectWithCustom(
            "type",
            "Asset Type",
            uniqueTypes,
            formData.type,
            (value) => setFormData({ ...formData, type: value }),
            true
          )}

          {renderSelectWithCustom(
            "brand",
            "Brand",
            uniqueBrands,
            formData.brand,
            (value) => setFormData({ ...formData, brand: value }),
            true
          )}

          {renderSelectWithCustom(
            "configuration",
            "Configuration",
            uniqueConfigurations,
            formData.configuration,
            (value) => setFormData({ ...formData, configuration: value })
          )}

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

          {renderSelectWithCustom(
            "provider",
            "Provider",
            uniqueProviders,
            formData.provider,
            (value) => setFormData({ ...formData, provider: value })
          )}

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
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

          {renderDatePicker(
            "Warranty Start Date",
            warrantyStartDate,
            setWarrantyStartDate
          )}

          {renderDatePicker(
            "Warranty End Date",
            warrantyEndDate,
            setWarrantyEndDate
          )}

          {showEmployeeFields && (
            <>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="e.g., EMP001 (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeName">Employee Name</Label>
                <Input
                  id="employeeName"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  placeholder="e.g., John Doe (optional)"
                />
              </div>
            </>
          )}

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
              {initialData.recovery_amount && (
                <div className="space-y-2">
                  <Label htmlFor="recoveryAmount">Recovery Amount</Label>
                  <Input
                    id="recoveryAmount"
                    value={initialData.recovery_amount.toString()}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}
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
              disabled={!formData.assetId || !formData.model || !formData.type || !formData.brand || !formData.serialNumber || !formData.location}
            >
              {initialData ? "Update Asset" : "Add Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};