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

  const handleAddAsset = async (newAsset: any) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') return;
    try {
      const asset = {
        asset_id: newAsset.assetId,
        name: newAsset.name,
        type: newAsset.type,
        brand: newAsset.brand,
        configuration: newAsset.configuration,
        serial_number: newAsset.serialNumber,
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
        warranty_start: null,
        warranty_end: null,
        amc_start: null,
        amc_end: null,
        asset_check: "",
      };
      const { data } = await createAssetMutation.mutateAsync(asset);
      await logEditHistory(data.id, "created", null, "Asset Created");
      toast.success("Asset created successfully");
      setShowAddForm(false);
    } catch (error) {
      toast.error("Failed to create asset");
    }
  };

  const handleAssignAsset = async (assetId: string, userName: string, employeeId: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') return;
    try {
      const asset = assets.find((a) => a.id === assetId);
      await updateAssetMutation.mutateAsync({
        id: assetId,
        assigned_to: userName,
        employee_id: employeeId,
        status: "Assigned",
        assigned_date: new Date().toISOString(),
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      await logEditHistory(assetId, "assigned_to", asset?.assigned_to || null, userName);
      await logEditHistory(assetId, "employee_id", asset?.employee_id || null, employeeId);
      await logEditHistory(assetId, "status", asset?.status || null, "Assigned");
      toast.success("Asset assigned successfully");
    } catch (error) {
      toast.error("Failed to assign asset");
    }
  };

  const handleUnassignAsset = async (assetId: string, remarks?: string, receivedBy?: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') return;
    try {
      const asset = assets.find((a) => a.id === assetId);
      await unassignAssetMutation.mutateAsync({
        id: assetId,
        remarks,
        receivedBy: receivedBy || currentUser,
      });
      await logEditHistory(assetId, "assigned_to", asset?.assigned_to || null, null);
      await logEditHistory(assetId, "employee_id", asset?.employee_id || null, null);
      await logEditHistory(assetId, "status", asset?.status || null, "Available");
      await logEditHistory(assetId, "return_date", asset?.return_date || null, new Date().toISOString());
      await logEditHistory(assetId, "received_by", asset?.received_by || null, receivedBy || currentUser);
      if (remarks) {
        await logEditHistory(assetId, "remarks", asset?.remarks || null, remarks);
      }
      toast.success("Asset returned successfully");
    } catch (error) {
      toast.error("Failed to return asset");
    }
  };

  const handleUpdateAsset = async (assetId: string, updatedAsset: any) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') return;
    try {
      const asset = assets.find((a) => a.id === assetId);
      await updateAssetMutation.mutateAsync({
        id: assetId,
        asset_id: updatedAsset.assetId,
        name: updatedAsset.name,
        type: updatedAsset.type,
        brand: updatedAsset.brand,
        configuration: updatedAsset.configuration,
        serial_number: updatedAsset.serialNumber,
        warranty_start: updatedAsset.warrantyStart,
        warranty_end: updatedAsset.warrantyEnd,
        amc_start: updatedAsset.amcStart,
        amc_end: updatedAsset.amcEnd,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      if (asset?.asset_id !== updatedAsset.assetId) {
        await logEditHistory(assetId, "asset_id", asset?.asset_id || null, updatedAsset.assetId);
      }
      if (asset?.name !== updatedAsset.name) {
        await logEditHistory(assetId, "name", asset?.name || null, updatedAsset.name);
      }
      if (asset?.type !== updatedAsset.type) {
        await logEditHistory(assetId, "type", asset?.type || null, updatedAsset.type);
      }
      if (asset?.brand !== updatedAsset.brand) {
        await logEditHistory(assetId, "brand", asset?.brand || null, updatedAsset.brand);
      }
      if (asset?.configuration !== updatedAsset.configuration) {
        await logEditHistory(assetId, "configuration", asset?.configuration || null, updatedAsset.configuration);
      }
      if (asset?.serial_number !== updatedAsset.serialNumber) {
        await logEditHistory(assetId, "serial_number", asset?.serial_number || null, updatedAsset.serialNumber);
      }
      if (asset?.warranty_start !== updatedAsset.warrantyStart) {
        await logEditHistory(assetId, "warranty_start", asset?.warranty_start || null, updatedAsset.warrantyStart);
      }
      if (asset?.warranty_end !== updatedAsset.warrantyEnd) {
        await logEditHistory(assetId, "warranty_end", asset?.warranty_end || null, updatedAsset.warrantyEnd);
      }
      if (asset?.amc_start !== updatedAsset.amcStart) {
        await logEditHistory(assetId, "amc_start", asset?.amc_start || null, updatedAsset.amcStart);
      }
      if (asset?.amc_end !== updatedAsset.amcEnd) {
        await logEditHistory(assetId, "amc_end", asset?.amc_end || null, updatedAsset.amcEnd);
      }
      toast.success("Asset updated successfully");
    } catch (error) {
      toast.error("Failed to update asset");
    }
  };

  const handleUpdateStatus = async (assetId: string, status: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') return;
    try {
      const asset = assets.find((a) => a.id === assetId);
      await updateAssetMutation.mutateAsync({ 
        id: assetId, 
        status,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      await logEditHistory(assetId, "status", asset?.status || null, status);
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleUpdateLocation = async (assetId: string, location: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') return;
    try {
      const asset = assets.find((a) => a.id === assetId);
      await updateAssetMutation.mutateAsync({ 
        id: assetId, 
        location,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      await logEditHistory(assetId, "location", asset?.location || null, location);
      toast.success("Location updated successfully");
    } catch (error) {
      toast.error("Failed to update location");
    }
  };

  const handleUpdateAssetCheck = async (assetId: string, assetCheck: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') return;
    try {
      const asset = assets.find((a) => a.id === assetId);
      await updateAssetMutation.mutateAsync({
        id: assetId,
        asset_check: assetCheck,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      await logEditHistory(assetId, "asset_check", asset?.asset_check || null, assetCheck);
      toast.success("Asset check updated successfully");
    } catch (error) {
      toast.error("Failed to update asset check");
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') return;
    try {
      await deleteAssetMutation.mutateAsync(assetId);
      await logEditHistory(assetId, "deleted", null, "Asset Deleted");
      toast.success("Asset deleted successfully");
    } catch (error) {
      toast.error("Failed to delete asset");
    }
  };

  const handleBulkUpload = (file: File) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') return;
    console.log("Processing file:", file.name);
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
      "AMC Start",
      "AMC End",
      "Created By",
      "Created At",
      "Updated By",
      "Updated At",
      "Asset Check",
    ];

    const csvContent = [
      headers.join(","),
      ...assets.map((asset) =>
        [
          asset.asset_id,
          asset.name,
          asset.type,
          asset.brand,
          asset.configuration || "",
          asset.serial_number,
          asset.employee_id || "",
          asset.assigned_to || "",
          asset.status,
          asset.location,
          asset.assigned_date || "",
          asset.return_date || "",
          asset.received_by || "",
          asset.remarks || "",
          asset.warranty_start || "",
          asset.warranty_end || "",
          asset.amc_start || "",
          asset.amc_end || "",
          asset.created_by || "",
          asset.created_at || "",
          asset.updated_by || "",
          asset.updated_at || "",
          asset.asset_check || "",
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
        <AssetForm onSubmit={handleAddAsset} onCancel={() => setShowAddForm(false)} />
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