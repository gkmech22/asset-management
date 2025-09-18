import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Users, Plus, Filter, Upload, Download, Search, Menu } from "lucide-react";
import { UserProfile } from "@/components/auth/UserProfile";
import { AssetForm } from "./AssetForm";
import { BulkUpload } from "./BulkUpload";
import { useAssets, useCreateAsset, useUpdateAsset, useUnassignAsset, useDeleteAsset } from "@/hooks/useAssets";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DashboardView from "./DashboardView";
import AuditView from "./AuditView";
import AmcsView from "./AmcsView";
import SummaryView from "./SummaryView";

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

export const Dashboard = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const { data: assets = [], isLoading, error } = useAssets();
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();
  const unassignAssetMutation = useUnassignAsset();
  const deleteAssetMutation = useDeleteAsset();
  const [currentUser, setCurrentUser] = useState<string>("unknown_user");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'audit' | 'amcs' | 'summary'>('dashboard');

  useEffect(() => {
    const fetchUserAndAuthorize = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setCurrentUser(user.email);
          const { data, error } = await supabase
            .from('users')
            .select('email, role')
            .eq('email', user.email)
            .single();
          if (data && !error) {
            setIsAuthorized(true);
            setUserRole(data.role);
          } else {
            setIsAuthorized(false);
            setUserRole(null);
          }
        } else {
          toast.error("Failed to fetch user data. Access denied.");
          setIsAuthorized(false);
          setUserRole(null);
        }
      } catch (error) {
        toast.error("Error fetching user data. Access denied.");
        console.error("Supabase auth error:", error);
        setIsAuthorized(false);
        setUserRole(null);
      }
    };
    fetchUserAndAuthorize();
  }, []);

  const logEditHistory = async (assetId: string, field: string, oldValue: string | null, newValue: string | null) => {
    try {
      await supabase.from("asset_edit_history").insert({
        asset_id: assetId,
        field_changed: field,
        old_value: oldValue,
        new_value: newValue,
        changed_by: currentUser,
        changed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to log edit history:", error);
    }
  };

  const validateAssetUniqueness = (assetId: string, serialNumber: string, excludeAssetId?: string) => {
    const existingAssetWithId = assets.find(
      (a) => a.asset_id === assetId && (!excludeAssetId || a.id !== excludeAssetId)
    );
    const existingAssetWithSerial = assets.find(
      (a) => a.serial_number === serialNumber && (!excludeAssetId || a.id !== excludeAssetId)
    );
    const assetWithDifferentSerial = assets.find(
      (a) => a.asset_id === assetId && a.serial_number !== serialNumber && (!excludeAssetId || a.id !== excludeAssetId)
    );
    const assetWithDifferentId = assets.find(
      (a) => a.serial_number === serialNumber && a.asset_id !== assetId && (!excludeAssetId || a.id !== excludeAssetId)
    );

    if (existingAssetWithId) {
      return `Asset ID ${assetId} is already in use.`;
    }
    if (existingAssetWithSerial) {
      return `Serial Number ${serialNumber} is already in use.`;
    }
    if (assetWithDifferentSerial) {
      return `Asset ID ${assetId} is associated with a different Serial Number (${assetWithDifferentSerial.serial_number}).`;
    }
    if (assetWithDifferentId) {
      return `Serial Number ${serialNumber} is associated with a different Asset ID (${assetWithDifferentId.asset_id}).`;
    }
    return null;
  };

  const handleAddAsset = async (newAsset: any) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const validationError = validateAssetUniqueness(newAsset.assetId, newAsset.serialNumber);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const warrantyStatus = newAsset.warrantyEnd
        ? new Date(newAsset.warrantyEnd) >= new Date()
          ? "In Warranty"
          : "Out of Warranty"
        : "Out of Warranty";
      const asset = {
        asset_id: newAsset.assetId,
        name: newAsset.name,
        type: newAsset.type,
        brand: newAsset.brand,
        configuration: newAsset.configuration || null,
        serial_number: newAsset.serialNumber,
        status: newAsset.employeeId && newAsset.employeeName ? "Assigned" : "Available",
        location: newAsset.location || locations[0],
        assigned_to: newAsset.employeeName || null,
        employee_id: newAsset.employeeId || null,
        assigned_date: newAsset.employeeId && newAsset.employeeName ? new Date().toISOString() : null,
        received_by: null,
        return_date: null,
        remarks: null,
        created_by: currentUser,
        created_at: new Date().toISOString(),
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
        warranty_start: newAsset.warrantyStart || null,
        warranty_end: newAsset.warrantyEnd || null,
        asset_check: "",
        provider: newAsset.provider || null,
        warranty_status: warrantyStatus,
      };
      const { data, error } = await createAssetMutation.mutateAsync(asset);
      if (error) {
        throw new Error(error.message || "Failed to create asset.");
      }
      await logEditHistory(data.id, "created", null, "Asset Created");
      toast.success("Asset created successfully");
      setShowAddForm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create asset.");
    }
  };

  const handleAssignAsset = async (assetId: string, userName: string, employeeId: string, location?: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error("Asset not found.");
      }
      const existingAssetWithEmployeeId = assets.find(
        (a) => a.employee_id === employeeId && a.id !== assetId
      );
      const existingAssetWithSerial = assets.find(
        (a) => a.serial_number === asset.serial_number && a.employee_id !== employeeId && a.id !== assetId
      );

      if (existingAssetWithEmployeeId) {
        throw new Error(`Employee ID ${employeeId} is already assigned to another asset (Serial: ${existingAssetWithEmployeeId.serial_number}).`);
      }
      if (existingAssetWithSerial) {
        throw new Error(`Serial Number ${asset.serial_number} is already associated with another Employee ID (${existingAssetWithSerial.employee_id}).`);
      }

      const updatePayload: any = {
        id: assetId,
        assigned_to: userName,
        employee_id: employeeId,
        status: "Assigned",
        assigned_date: new Date().toISOString(),
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      };

      if (location && location !== asset.location) {
        updatePayload.location = location;
      }

      await updateAssetMutation.mutateAsync(updatePayload);
      await logEditHistory(assetId, "assigned_to", asset?.assigned_to || null, userName);
      await logEditHistory(assetId, "employee_id", asset?.employee_id || null, employeeId);
      await logEditHistory(assetId, "status", asset?.status || null, "Assigned");
      if (location && location !== asset.location) {
        await logEditHistory(assetId, "location", asset?.location || null, location);
      }
      toast.success("Asset assigned successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign asset.");
    }
  };

  const handleUnassignAsset = async (assetId: string, remarks?: string, receivedBy?: string, location?: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error("Asset not found.");
      }

      const updatePayload: any = {
        id: assetId,
        assigned_to: null,
        employee_id: null,
        status: "Available",
        return_date: new Date().toISOString(),
        received_by: receivedBy || currentUser,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
        configuration: asset.configuration, // Preserve existing configuration
      };

      if (remarks && remarks !== asset.remarks) {
        updatePayload.remarks = remarks;
      }
      if (location && location !== asset.location) {
        updatePayload.location = location;
      }

      await unassignAssetMutation.mutateAsync(updatePayload);
      await logEditHistory(assetId, "assigned_to", asset?.assigned_to || null, null);
      await logEditHistory(assetId, "employee_id", asset?.employee_id || null, null);
      await logEditHistory(assetId, "status", asset?.status || null, "Available");
      await logEditHistory(assetId, "return_date", asset?.return_date || null, new Date().toISOString());
      await logEditHistory(assetId, "received_by", asset?.received_by || null, receivedBy || currentUser);
      if (location && location !== asset.location) {
        await logEditHistory(assetId, "location", asset?.location || null, location);
      }
      if (remarks && remarks !== asset.remarks) {
        await logEditHistory(assetId, "remarks", asset?.remarks || null, remarks);
      }
      toast.success("Asset returned successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to return asset.");
    }
  };

  const handleUpdateAsset = async (assetId: string, updatedAsset: any) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error("Asset not found.");
      }
      const validationError = validateAssetUniqueness(updatedAsset.assetId, updatedAsset.serialNumber, assetId);
      if (validationError) {
        throw new Error(validationError);
      }

      const warrantyStatus = updatedAsset.warrantyEnd
        ? new Date(updatedAsset.warrantyEnd) >= new Date()
          ? "In Warranty"
          : "Out of Warranty"
        : "Out of Warranty";

      const updatePayload: any = {
        id: assetId,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      };

      if (updatedAsset.assetId !== asset.asset_id) updatePayload.asset_id = updatedAsset.assetId;
      if (updatedAsset.name !== asset.name) updatePayload.name = updatedAsset.name;
      if (updatedAsset.type !== asset.type) updatePayload.type = updatedAsset.type;
      if (updatedAsset.brand !== asset.brand) updatePayload.brand = updatedAsset.brand;
      if (updatedAsset.configuration !== asset.configuration) updatePayload.configuration = updatedAsset.configuration || null;
      if (updatedAsset.serialNumber !== asset.serial_number) updatePayload.serial_number = updatedAsset.serialNumber;
      if (updatedAsset.warrantyStart !== asset.warranty_start) updatePayload.warranty_start = updatedAsset.warrantyStart || null;
      if (updatedAsset.warrantyEnd !== asset.warranty_end) updatePayload.warranty_end = updatedAsset.warrantyEnd || null;
      if (updatedAsset.provider !== asset.provider) updatePayload.provider = updatedAsset.provider || null;
      if (warrantyStatus !== asset.warranty_status) updatePayload.warranty_status = warrantyStatus;

      await updateAssetMutation.mutateAsync(updatePayload);

      if (asset.asset_id !== updatedAsset.assetId) {
        await logEditHistory(assetId, "asset_id", asset.asset_id || null, updatedAsset.assetId);
      }
      if (asset.name !== updatedAsset.name) {
        await logEditHistory(assetId, "name", asset.name || null, updatedAsset.name);
      }
      if (asset.type !== updatedAsset.type) {
        await logEditHistory(assetId, "type", asset.type || null, updatedAsset.type);
      }
      if (asset.brand !== updatedAsset.brand) {
        await logEditHistory(assetId, "brand", asset.brand || null, updatedAsset.brand);
      }
      if (asset.configuration !== updatedAsset.configuration) {
        await logEditHistory(assetId, "configuration", asset.configuration || null, updatedAsset.configuration);
      }
      if (asset.serial_number !== updatedAsset.serialNumber) {
        await logEditHistory(assetId, "serial_number", asset.serial_number || null, updatedAsset.serialNumber);
      }
      if (asset.warranty_start !== updatedAsset.warrantyStart) {
        await logEditHistory(assetId, "warranty_start", asset.warranty_start || null, updatedAsset.warrantyStart);
      }
      if (asset.warranty_end !== updatedAsset.warrantyEnd) {
        await logEditHistory(assetId, "warranty_end", asset.warranty_end || null, updatedAsset.warrantyEnd);
      }
      if (asset.provider !== updatedAsset.provider) {
        await logEditHistory(assetId, "provider", asset.provider || null, updatedAsset.provider);
      }
      if (asset.warranty_status !== warrantyStatus) {
        await logEditHistory(assetId, "warranty_status", asset.warranty_status || null, warrantyStatus);
      }
      toast.success("Asset updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update asset.");
    }
  };

  const handleUpdateStatus = async (assetId: string, status: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error("Asset not found.");
      }
      const updatePayload: any = {
        id: assetId,
        status,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      };
      await updateAssetMutation.mutateAsync(updatePayload);
      await logEditHistory(assetId, "status", asset?.status || null, status);
      toast.success("Status updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status.");
    }
  };

  const handleUpdateLocation = async (assetId: string, location: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error("Asset not found.");
      }
      const updatePayload: any = {
        id: assetId,
        location,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      };
      await updateAssetMutation.mutateAsync(updatePayload);
      await logEditHistory(assetId, "location", asset?.location || null, location);
      toast.success("Location updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update location.");
    }
  };

  const handleUpdateAssetCheck = async (assetId: string, assetCheck: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error("Asset not found.");
      }
      const updatePayload: any = {
        id: assetId,
        asset_check: assetCheck,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      };
      await updateAssetMutation.mutateAsync(updatePayload);
      await logEditHistory(assetId, "asset_check", asset?.asset_check || null, assetCheck);
      toast.success("Asset check updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update asset check.");
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      await deleteAssetMutation.mutateAsync(assetId);
      await logEditHistory(assetId, "deleted", null, "Asset Deleted");
      toast.success("Asset deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete asset.");
    }
  };

  const handleBulkUpload = async (file: File) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      const headers = rows[0];
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell));

      const requiredHeaders = [
        "Asset ID",
        "Asset Name",
        "Asset Type",
        "Brand",
        "Configuration",
        "Serial Number",
        "Provider",
        "Warranty Start",
        "Warranty End",
      ];

      if (!requiredHeaders.every(header => headers.includes(header))) {
        throw new Error("Invalid CSV format: Missing required headers.");
      }

      const errors: string[] = [];
      const validAssets: any[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const asset = {
          assetId: row[headers.indexOf("Asset ID")],
          name: row[headers.indexOf("Asset Name")],
          type: row[headers.indexOf("Asset Type")],
          brand: row[headers.indexOf("Brand")],
          configuration: row[headers.indexOf("Configuration")],
          serialNumber: row[headers.indexOf("Serial Number")],
          provider: row[headers.indexOf("Provider")],
          warrantyStart: row[headers.indexOf("Warranty Start")],
          warrantyEnd: row[headers.indexOf("Warranty End")],
        };

        if (!asset.assetId || !asset.name || !asset.type || !asset.brand || !asset.serialNumber) {
          errors.push(`Row ${i + 2}: Missing required fields.`);
          continue;
        }

        const validationError = validateAssetUniqueness(asset.assetId, asset.serialNumber);
        if (validationError) {
          errors.push(`Row ${i + 2}: ${validationError}`);
          continue;
        }

        validAssets.push({
          asset_id: asset.assetId,
          name: asset.name,
          type: asset.type,
          brand: asset.brand,
          configuration: asset.configuration || null,
          serial_number: asset.serialNumber,
          status: "Available",
          location: locations[0],
          assigned_to: null,
          employee_id: null,
          assigned_date: null,
          received_by: null,
          return_date: null,
          remarks: null,
          created_by: currentUser,
          created_at: new Date().toISOString(),
          updated_by: currentUser,
          updated_at: new Date().toISOString(),
          warranty_start: asset.warrantyStart || null,
          warranty_end: asset.warrantyEnd || null,
          asset_check: "",
          provider: asset.provider || null,
          warranty_status: asset.warrantyEnd
            ? new Date(asset.warrantyEnd) >= new Date()
              ? "In Warranty"
              : "Out of Warranty"
            : "Out of Warranty",
        });
      }

      if (errors.length > 0) {
        throw new Error(`Bulk upload failed:\n${errors.join('\n')}`);
      }

      for (const asset of validAssets) {
        const { data, error } = await createAssetMutation.mutateAsync(asset);
        if (error) {
          throw new Error(`Failed to create asset ${asset.asset_id}: ${error.message}`);
        }
        await logEditHistory(data.id, "created", null, "Asset Created");
      }

      toast.success(`Successfully uploaded ${validAssets.length} assets.`);
      setShowBulkUpload(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to process bulk upload.");
    }
  };

  const handleDownloadData = () => {
    const headers = [
      "Asset ID",
      "Asset Name",
      "Asset Type",
      "Brand",
      "Configuration",
      "Serial Number",
      "Employee ID",
      "Employee Name",
      "Status",
      "Asset Location",
      "Assigned Date",
      "Return Date",
      "Received By",
      "Remarks",
      "Warranty Start",
      "Warranty End",
      "Created By",
      "Created At",
      "Updated By",
      "Updated At",
      "Asset Check",
      "Provider",
      "Warranty Status",
    ];

    const escapeCsvField = (value: string | null | undefined): string => {
      if (!value) return "";
      return value.includes(",") ? `"${value.replace(/"/g, '""')}"` : value;
    };

    const csvContent = [
      headers.join(","),
      ...assets.map((asset) =>
        [
          escapeCsvField(asset.asset_id),
          escapeCsvField(asset.name),
          escapeCsvField(asset.type),
          escapeCsvField(asset.brand),
          escapeCsvField(asset.configuration),
          escapeCsvField(asset.serial_number),
          escapeCsvField(asset.employee_id),
          escapeCsvField(asset.assigned_to),
          escapeCsvField(asset.status),
          escapeCsvField(asset.location),
          escapeCsvField(asset.assigned_date),
          escapeCsvField(asset.return_date),
          escapeCsvField(asset.received_by),
          escapeCsvField(asset.remarks),
          escapeCsvField(asset.warranty_start),
          escapeCsvField(asset.warranty_end),
          escapeCsvField(asset.created_by),
          escapeCsvField(asset.created_at),
          escapeCsvField(asset.updated_by),
          escapeCsvField(asset.updated_at),
          escapeCsvField(asset.asset_check),
          escapeCsvField(asset.provider),
          escapeCsvField(asset.warranty_status),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "asset_inventory.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isAuthorized) return <div>Access denied. You are not an authorized user.</div>;

  if (isLoading) {
    return <div className="text-center py-12">Loading assets...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-destructive">Error loading assets: {error.message}</div>;
  }

  const commonProps = {
    assets,
    onAssign: handleAssignAsset,
    onUnassign: handleUnassignAsset,
    onUpdateAsset: handleUpdateAsset,
    onUpdateStatus: handleUpdateStatus,
    onUpdateLocation: handleUpdateLocation,
    onUpdateAssetCheck: handleUpdateAssetCheck,
    onDelete: handleDeleteAsset,
    userRole,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b shadow-card">
        <div className="container mx-auto px-2 py-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onSelect={() => setCurrentPage('dashboard')}>Dashboard</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setCurrentPage('audit')}>Audit</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setCurrentPage('amcs')}>AMCs</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setCurrentPage('summary')}>Summary</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center gap-4">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
                    Asset Management System
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1"></p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(currentPage === 'dashboard' && (userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Operator')) && (
                <>
                  <Button
                    onClick={() => setShowBulkUpload(true)}
                    variant="outline"
                    className="hover:bg-primary hover:text-primary-foreground transition-smooth text-sm h-8"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Bulk Operations
                  </Button>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-gradient-primary hover:shadow-glow transition-smooth text-sm h-8"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Asset
                  </Button>
                </>
              )}
              <UserProfile />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-[60px] pb-[40px] container mx-auto px-4">
        {currentPage === 'dashboard' && <DashboardView {...commonProps} />}
        {currentPage === 'audit' && <AuditView {...commonProps} />}
        {currentPage === 'amcs' && <AmcsView {...commonProps} />}
        {currentPage === 'summary' && <SummaryView {...commonProps} />}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-card py-2">
        <div className="container mx-auto px-4">
          <p className="text-[14px] text-muted-foreground">
            Crafted by 🤓 IT Infra minds, for IT Infra needs
          </p>
        </div>
      </footer>

      {showAddForm && (userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Operator') && (
        <AssetForm
          onSubmit={handleAddAsset}
          onCancel={() => setShowAddForm(false)}
          assets={assets}
        />
      )}
      <BulkUpload
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onUpload={handleBulkUpload}
        onDownload={handleDownloadData}
      />
    </div>
  );
};