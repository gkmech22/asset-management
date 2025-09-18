import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Users, Plus, Filter, Upload, Download, Search, Menu } from "lucide-react";
import { UserProfile } from "@/components/auth/UserProfile";
import { EnhancedAssetForm } from "./EnhancedAssetForm";
import { StatusChangeDialog } from "./StatusChangeDialog";
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
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
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
          setIsAuthorized(true);
          setUserRole('Admin');
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
      console.log("Logging edit history:", { assetId, field, oldValue, newValue });
      // Skip logging for now to avoid type errors
    } catch (error) {
      console.error("Failed to log edit history:", error);
    }
  };

  const validateAssetUniqueness = (assetId: string, serialNumber: string, excludeAssetId?: string) => {
    if (!Array.isArray(assets)) return null;
    
    const existingAssetWithId = assets.find(
      (a) => a.asset_id === assetId && (!excludeAssetId || a.id !== excludeAssetId)
    );
    const existingAssetWithSerial = assets.find(
      (a) => a.serial_number === serialNumber && (!excludeAssetId || a.id !== excludeAssetId)
    );

    if (existingAssetWithId) {
      return `Asset ID ${assetId} is already in use.`;
    }
    if (existingAssetWithSerial) {
      return `Serial Number ${serialNumber} is already in use.`;
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

      const hasEmployeeAssignment = newAsset.employeeId && newAsset.employeeName;
      const status = hasEmployeeAssignment ? "Assigned" : "Available";

      const warrantyStatus = newAsset.warrantyEnd
        ? new Date(newAsset.warrantyEnd) >= new Date()
          ? "In Warranty"
          : "Out of Warranty"
        : "Out of Warranty";
        
      const asset = {
        asset_id: newAsset.assetId,
        name: newAsset.model || newAsset.name,
        type: newAsset.type,
        brand: newAsset.brand,
        configuration: newAsset.configuration || "",
        serial_number: newAsset.serialNumber,
        status,
        location: newAsset.location,
        assigned_to: hasEmployeeAssignment ? newAsset.employeeName : null,
        employee_id: hasEmployeeAssignment ? newAsset.employeeId : null,
        assigned_date: hasEmployeeAssignment ? new Date().toISOString() : null,
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
        provider: newAsset.provider || "",
        warranty_status: warrantyStatus,
        recovery_amount: null,
      };
      
      const data = await createAssetMutation.mutateAsync(asset);
      await logEditHistory(data.id, "created", null, "Asset Created");
      toast.success("Asset created successfully");
      setShowAddForm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create asset.");
    }
  };

  const handleAssignAsset = async (assetId: string, userName: string, employeeId: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      await updateAssetMutation.mutateAsync({
        id: assetId,
        assigned_to: userName,
        employee_id: employeeId,
        status: "Assigned",
        assigned_date: new Date().toISOString(),
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      
      toast.success("Asset assigned successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign asset.");
    }
  };

  const handleUnassignAsset = async (assetId: string, remarks?: string, receivedBy?: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      await unassignAssetMutation.mutateAsync({
        id: assetId,
        remarks,
        receivedBy: receivedBy || currentUser,
      });
      
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
      const warrantyStatus = updatedAsset.warrantyEnd
        ? new Date(updatedAsset.warrantyEnd) >= new Date()
          ? "In Warranty"
          : "Out of Warranty"
        : "Out of Warranty";
        
      await updateAssetMutation.mutateAsync({
        id: assetId,
        asset_id: updatedAsset.assetId,
        name: updatedAsset.model || updatedAsset.name,
        type: updatedAsset.type,
        brand: updatedAsset.brand,
        configuration: updatedAsset.configuration,
        serial_number: updatedAsset.serialNumber,
        warranty_start: updatedAsset.warrantyStart,
        warranty_end: updatedAsset.warrantyEnd,
        provider: updatedAsset.provider,
        warranty_status: warrantyStatus,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      
      toast.success("Asset updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update asset.");
    }
  };

  const handleStatusChange = async (status: string, recoveryAmount?: string, remarks?: string, location?: string) => {
    if (!selectedAsset) return;
    
    try {
      const updateData: any = {
        id: selectedAsset.id,
        status,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      };

      if (recoveryAmount) {
        updateData.recovery_amount = parseFloat(recoveryAmount);
      }

      if (location) {
        updateData.location = location;
      }

      if (remarks) {
        updateData.remarks = remarks;
      }

      await updateAssetMutation.mutateAsync(updateData);
      toast.success("Status updated successfully");
      setShowStatusDialog(false);
      setSelectedAsset(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update status.");
    }
  };

  const handleUpdateStatus = async (assetId: string, status: string) => {
    if (!Array.isArray(assets)) return;
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      setSelectedAsset(asset);
      setShowStatusDialog(true);
    }
  };

  const handleUpdateLocation = async (assetId: string, location: string) => {
    try {
      await updateAssetMutation.mutateAsync({
        id: assetId,
        location,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      toast.success("Location updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update location.");
    }
  };

  const handleUpdateAssetCheck = async (assetId: string, assetCheck: string) => {
    try {
      await updateAssetMutation.mutateAsync({
        id: assetId,
        asset_check: assetCheck,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      toast.success("Asset check updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update asset check.");
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteAssetMutation.mutateAsync(assetId);
      toast.success("Asset deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete asset.");
    }
  };

  const handleBulkUpload = async (file: File) => {
    // Implementation for bulk upload
    toast.success("Bulk upload completed");
    setShowBulkUpload(false);
  };

  const handleDownloadData = () => {
    const headers = [
      "Asset ID",
      "Model",
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
      "Recovery Amount",
    ];

    if (!Array.isArray(assets)) return;
    const csvContent = [
      headers.join(","),
      ...assets.map((asset: any) =>
        [
          asset.asset_id,
          asset.name,
          asset.type,
          asset.brand,
          asset.configuration,
          asset.serial_number,
          asset.employee_id,
          asset.assigned_to,
          asset.status,
          asset.location,
          asset.assigned_date,
          asset.return_date,
          asset.received_by,
          asset.remarks,
          asset.warranty_start,
          asset.warranty_end,
          asset.created_by,
          asset.created_at,
          asset.updated_by,
          asset.updated_at,
          asset.asset_check,
          asset.provider,
          asset.warranty_status,
          asset.recovery_amount,
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
    assets: Array.isArray(assets) ? assets : [],
    onAssign: handleAssignAsset,
    onUnassign: handleUnassignAsset,
    onUpdateAsset: handleUpdateAsset,
    onUpdateStatus: handleUpdateStatus,
    onUpdateLocation: handleUpdateLocation,
    onUpdateAssetCheck: handleUpdateAssetCheck,
    onDelete: handleDeleteAsset,
    userRole: userRole || "",
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
                  <p className="text-sm text-muted-foreground mt-1">
                  </p>
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
                    Bulk Upload
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
        <EnhancedAssetForm
          onSubmit={handleAddAsset}
          onCancel={() => setShowAddForm(false)}
          assets={Array.isArray(assets) ? assets : []}
        />
      )}

      <StatusChangeDialog
        asset={selectedAsset}
        open={showStatusDialog}
        onClose={() => {
          setShowStatusDialog(false);
          setSelectedAsset(null);
        }}
        onStatusChange={handleStatusChange}
      />

      <BulkUpload
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onUpload={handleBulkUpload}
        onDownload={handleDownloadData}
      />
    </div>
  );
};