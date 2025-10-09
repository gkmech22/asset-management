import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu, Upload, Plus, Bell } from "lucide-react";
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
import EmployeeDetails from "./EmployeeDetails";
import { PendingRequests } from "./PendingRequests";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const locations = [
  "Mumbai Office", "Hyderabad WH", "Ghaziabad WH", "Bhiwandi WH", "Patiala WH",
  "Bangalore Office", "Kolkata WH", "Trichy WH", "Gurugram Office", "Indore WH",
  "Bangalore WH", "Jaipur WH"
];

export const Dashboard = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const { data: assets = [], isLoading, error, refetch } = useAssets();
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();
  const unassignAssetMutation = useUnassignAsset();
  const deleteAssetMutation = useDeleteAsset();
  const [currentUser, setCurrentUser] = useState<string>("unknown_user");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'audit' | 'amcs' | 'summary' | 'employees'>('dashboard');
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

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
    fetchPendingCount();

    // Real-time subscription for assets
    const assetsSubscription = supabase
      .channel('assets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, (payload) => {
        refetch();
      })
      .subscribe();

    // Real-time subscription for pending requests
    const pendingRequestsSubscription = supabase
      .channel('pending-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_requests' }, () => {
        fetchPendingCount();
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      assetsSubscription.unsubscribe();
      pendingRequestsSubscription.unsubscribe();
    };
  }, []);

  const fetchPendingCount = async () => {
    const { count } = await supabase
      .from('pending_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingCount(count || 0);
  };

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

    if (existingAssetWithId) {
      return `Asset ID ${assetId} is already in use.`;
    }
    if (existingAssetWithSerial) {
      return `Serial number ${serialNumber} is already in use.`;
    }
    return null;
  };

  const monthNames: { [key: string]: number } = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4,
    jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8, oct: 9,
    october: 9, nov: 10, november: 10, dec: 11, december: 11,
  };

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr || typeof dateStr !== 'string') {
      return null;
    }

    const formats = [
      { pattern: /^(\d{4})-(\d{2})-(\d{2})$/, order: [1, 2, 3] },
      { pattern: /^(\d{2})[-/](\d{2})[-/](\d{4})$/, order: [3, 1, 2] },
      { pattern: /^(\d{2})[-/](\d{2})[-/](\d{2})$/, order: [3, 1, 2], adjustYear: true },
    ];

    for (const format of formats) {
      const match = dateStr.trim().match(format.pattern);
      if (match) {
        let [yearStr, monthStr, dayStr] = format.order.map(i => match[i]);
        let year = parseInt(yearStr, 10);
        let month = format.order[1] === 2 ? monthNames[monthStr.toLowerCase()] : parseInt(monthStr, 10) - 1;
        let day = parseInt(dayStr, 10);

        if (format.adjustYear && year < 100) year += year < 50 ? 2000 : 1900;
        if (isNaN(year) || isNaN(month) || isNaN(day) || month < 0 || month > 11 || day < 1 || day > 31) {
          return null;
        }

        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) {
          return null;
        }
        return date.toISOString().split("T")[0];
      }
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

      const isAssigned = newAsset.employeeId && newAsset.employeeName;
      const assignedDate = isAssigned ? new Date().toISOString() : null;
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
        configuration: newAsset.configuration,
        serial_number: newAsset.serialNumber,
        far_code: newAsset.farCode,
        status: isAssigned ? "Assigned" : "Available",
        location: newAsset.location || locations[0],
        assigned_to: isAssigned ? newAsset.employeeName : null,
        employee_id: isAssigned ? newAsset.employeeId : null,
        assigned_date: assignedDate,
        received_by: null,
        return_date: null,
        remarks: null,
        created_by: currentUser,
        created_at: new Date().toISOString(),
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
        warranty_start: newAsset.warrantyStart,
        warranty_end: newAsset.warrantyEnd,
        asset_check: "",
        provider: newAsset.provider,
        warranty_status: warrantyStatus,
        recovery_amount: newAsset.recoveryAmount || null,
      };
      
      const data = await createAssetMutation.mutateAsync(asset);
      await logEditHistory(data.id, "created", null, "Asset Created");
      refetch(); // Update assets state immediately
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
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error("Asset not found.");
      }
      
      if (userRole === 'Operator') {
        const { data: emp } = await supabase.from('employees').select('email').eq('employee_id', employeeId).single();
        
        await supabase.from('pending_requests').insert({
          request_type: 'assign',
          asset_id: assetId,
          requested_by: currentUser,
          assign_to: userName,
          employee_id: employeeId,
          employee_email: emp?.email || '',
        });
        
        toast.success("Assignment request sent for approval");
        fetchPendingCount();
        return;
      }

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
      refetch(); // Update assets state immediately
      toast.success("Asset assigned successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign asset.");
    }
  };

  const handleUnassignAsset = async (assetId: string, remarks?: string, receivedBy?: string, location?: string, configuration?: string | null, assetCondition?: string | null, status?: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error("Asset not found.");
      }
      
      if (userRole === 'Operator') {
        await supabase.from('pending_requests').insert({
          request_type: 'return',
          asset_id: assetId,
          requested_by: currentUser,
          return_remarks: remarks,
          return_location: location || asset.location,
          return_status: status || 'Available',
          asset_condition: assetCondition,
          received_by: receivedBy || currentUser,
        });
        
        toast.success("Return request sent for approval");
        fetchPendingCount();
        return;
      }

      await unassignAssetMutation.mutateAsync({
        id: assetId,
        remarks,
        receivedBy: receivedBy || currentUser,
        location,
        assetCondition,
        status,
      });
      
      await logEditHistory(assetId, "assigned_to", asset?.assigned_to || null, null);
      await logEditHistory(assetId, "employee_id", asset?.employee_id || null, null);
      await logEditHistory(assetId, "status", asset?.status || null, status || "Available");
      await logEditHistory(assetId, "return_date", asset?.return_date || null, new Date().toISOString());
      await logEditHistory(assetId, "received_by", asset?.received_by || null, receivedBy || currentUser);
      
      if (location) {
        await logEditHistory(assetId, "location", asset?.location || null, location);
      }
      if (remarks) {
        await logEditHistory(assetId, "remarks", asset?.remarks || null, remarks);
      }
      refetch(); // Update assets state immediately
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
      provider: updatedAsset.provider,
      warranty_status: warrantyStatus,
      recovery_amount: updatedAsset.recoveryAmount || null,
      far_code: updatedAsset.farCode,
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
    if (asset?.provider !== updatedAsset.provider) {
      await logEditHistory(assetId, "provider", asset?.provider || null, updatedAsset.provider);
    }
    if (asset?.warranty_status !== warrantyStatus) {
      await logEditHistory(assetId, "warranty_status", asset?.warranty_status || null, warrantyStatus);
    }
    if (asset?.far_code !== updatedAsset.farCode) {
      await logEditHistory(assetId, "far_code", asset?.far_code || null, updatedAsset.farCode);
    }
    refetch(); // Update assets state immediately
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

      await updateAssetMutation.mutateAsync({
        id: assetId,
        status,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });

      await logEditHistory(assetId, "status", asset?.status || null, status);
      refetch(); // Update assets state immediately
      toast.success("Asset status updated");
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

      await updateAssetMutation.mutateAsync({
        id: assetId,
        location,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });

      await logEditHistory(assetId, "location", asset?.location || null, location);
      refetch(); // Update assets state immediately
      toast.success("Location updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update location.");
    }
  };

  const handleUpdateAssetCheck = async (assetId: string, assetCheck: string) => {
    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error("Asset not found.");
      }

      await updateAssetMutation.mutateAsync({
        id: assetId,
        asset_check: assetCheck,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });

      await logEditHistory(assetId, "asset_check", asset?.asset_check || null, assetCheck);
      refetch(); // Update assets state immediately
    } catch (error: any) {
      console.error("Failed to update asset check:", error);
    }
  };

const handleDeleteAsset = async (assetId: string) => {
  if (userRole !== 'Super Admin' && userRole !== 'Admin') {
    toast.error("Unauthorized: Only Super Admin and Admin can delete assets.");
    return;
  }

  try {
    // Verify asset exists before attempting deletion
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) {
      throw new Error(`Asset with ID ${assetId} not found.`);
    }

    // Delete related records in asset_edit_history to avoid foreign key constraint violation
    const { error: historyError } = await supabase
      .from('asset_edit_history')
      .delete()
      .eq('asset_id', assetId);
    
    if (historyError) {
      throw new Error(`Failed to delete related asset edit history: ${historyError.message}`);
    }

    // Now delete the asset
    await deleteAssetMutation.mutateAsync(assetId);

    refetch(); // Update assets state immediately
    toast.success("Asset deleted successfully");
  } catch (error: any) {
    console.error("Error deleting asset:", error); // Log error for debugging
    toast.error(error.message || "Failed to delete asset. Please check the console for details.");
  }
};
  const handleDownload = () => {
    const headers = [
      "asset_id", "name", "type", "brand", "configuration", "serial_number","far_code", "status", "location",
      "assigned_to", "employee_id", "assigned_date", "received_by", "return_date", "remarks",
      "created_by", "created_at", "updated_by", "updated_at", "warranty_start", "warranty_end",
      "asset_check", "provider", "warranty_status", "asset_value_recovery"
    ];

    const csvContent = [
      headers.join(","),
      ...assets.map(asset =>
        headers.map(field => {
          const value = asset[field as keyof typeof asset] ?? "";
          return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assets.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You are not authorized to access this application.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardView
            assets={assets}
            isLoading={isLoading}
            onAssign={handleAssignAsset}
            onUnassign={handleUnassignAsset}
            onUpdateAsset={handleUpdateAsset}
            onUpdateStatus={handleUpdateStatus}
            onUpdateLocation={handleUpdateLocation}
            onUpdateAssetCheck={handleUpdateAssetCheck}
            onDelete={handleDeleteAsset}
            userRole={userRole}
          />
        );
      case 'audit':
        return (
          <AuditView
            assets={assets}
            onAssign={handleAssignAsset}
            onUnassign={handleUnassignAsset}
            onUpdateAsset={handleUpdateAsset}
            onUpdateStatus={handleUpdateStatus}
            onUpdateLocation={handleUpdateLocation}
            onUpdateAssetCheck={handleUpdateAssetCheck}
            onDelete={handleDeleteAsset}
            userRole={userRole}
          />
        );
      case 'amcs':
        return (
          <AmcsView
            assets={assets}
            onAssign={handleAssignAsset}
            onUnassign={handleUnassignAsset}
            onUpdateAsset={handleUpdateAsset}
            onUpdateStatus={handleUpdateStatus}
            onUpdateLocation={handleUpdateLocation}
            onUpdateAssetCheck={handleUpdateAssetCheck}
            onDelete={handleDeleteAsset}
            userRole={userRole}
          />
        );
      case 'summary':
        return (
          <SummaryView 
            assets={assets}
            onAssign={handleAssignAsset}
            onUnassign={handleUnassignAsset}
            onUpdateAsset={handleUpdateAsset}
            onUpdateStatus={handleUpdateStatus}
            onUpdateLocation={handleUpdateLocation}
            onUpdateAssetCheck={handleUpdateAssetCheck}
            onDelete={handleDeleteAsset}
            userRole={userRole}
          />
        );
      case 'employees':
        return <EmployeeDetails />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-0 w-0 mr-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setCurrentPage('dashboard')}>Dashboard</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentPage('audit')}>Audit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentPage('amcs')}>AMCs</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentPage('summary')}>Summary</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentPage('employees')}>Employee Details</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <img src="/logo.png" alt="LEAD GROUP" className="h-10" />
              <span className="text-2xl font-bold text-primary">Asset Management System</span>
            </div>

            <div className="flex items-center gap-3">
              {(userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Operator') && (
                <>
                  <Button onClick={() => setShowBulkUpload(true)} variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Upload
                  </Button>
                  <Button onClick={() => setShowAddForm(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="relative"
                onClick={() => {
                  setShowPendingRequests(true);
                  fetchPendingCount();
                }}
              >
                <Bell className="h-4 w-4" />
                {pendingCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </Button>
              <UserProfile />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {renderContent()}
      </div>

      {showAddForm && (
        <AssetForm
          assets={assets}
          onSubmit={handleAddAsset}
          onCancel={() => setShowAddForm(false)}
        />
      )}

            {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-card py-2">
        <div className="container mx-auto px-4">
          <p className="text-[14px] text-muted-foreground">
            Crafted by 🤓 IT Infra minds, for IT Infra needs
          </p>
        </div>
      </footer>

      {showBulkUpload && (
        <BulkUpload
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          onUpload={() => {
            setShowBulkUpload(false);
            refetch(); // Update assets state after bulk upload
            toast.success("Assets uploaded successfully");
          }}
          onDownload={handleDownload}
        />
      )}

      <Dialog open={showPendingRequests} onOpenChange={setShowPendingRequests}>
        <DialogContent className="m-0 max-w-screen max-h-screen overflow-y-auto">
          <PendingRequests onRefresh={refetch} />
        </DialogContent>
      </Dialog>
    </div>
  );
};