// Updated Dashboard.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, Upload, Plus, Bell, Download } from "lucide-react";
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
import AboutView from "./AboutView";
import OrdersView from "./OrdersView"; // New import
import { PendingRequests } from "./PendingRequests";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const locations = [
  "Mumbai Office", "Hyderabad WH", "Ghaziabad WH", "Bhiwandi WH", "Patiala WH",
  "Bangalore Office", "Kolkata WH", "Trichy WH", "Gurugram Office", "Indore WH",
  "Bangalore WH", "Jaipur WH"
];

export const Dashboard = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showSkippedRowsDialog, setShowSkippedRowsDialog] = useState(false);
  const [skippedRowsCsv, setSkippedRowsCsv] = useState<string | null>(null);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const { data: assets = [], isLoading, error, refetch } = useAssets();
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();
  const unassignAssetMutation = useUnassignAsset();
  const deleteAssetMutation = useDeleteAsset();
  const [currentUser, setCurrentUser] = useState<string>("unknown_user");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'audit' | 'amcs' | 'summary' | 'orders' | 'employees' | 'about'>('dashboard'); // Updated type
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    console.log("Dashboard state:", { isAuthorized, userRole, currentUser, currentPage, isLoading, error, assetsLength: assets.length });
  }, [isAuthorized, userRole, currentUser, currentPage, isLoading, error, assets]);

  useEffect(() => {
    const fetchUserAndAuthorize = async () => {
      try {
        console.log("Fetching user data...");
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error("Supabase auth error:", authError);
          toast.error("Authentication error: " + authError.message);
          setIsAuthorized(false);
          setUserRole(null);
          return;
        }

        if (user?.email) {
          console.log("User email:", user.email);
          setCurrentUser(user.email);
          const { data, error } = await supabase
            .from('users')
            .select('email, role')
            .eq('email', user.email)
            .single();
          if (error) {
            console.error("Supabase users table error:", error);
            toast.error("Failed to fetch user role: " + error.message);
            setIsAuthorized(false);
            setUserRole(null);
            return;
          }
          if (data) {
            console.log("User data:", data);
            setIsAuthorized(true);
            setUserRole(data.role);
          } else {
            console.error("No user data found for email:", user.email);
            toast.error("User not found in database.");
            setIsAuthorized(false);
            setUserRole(null);
          }
        } else {
          console.error("No user email found");
          toast.error("No user logged in.");
          setIsAuthorized(false);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Unexpected error in fetchUserAndAuthorize:", error);
        toast.error("Unexpected error during authentication: " + (error.message || "Unknown error"));
        setIsAuthorized(false);
        setUserRole(null);
      }
    };

    fetchUserAndAuthorize();
    fetchPendingCount();

    const intervalId = setInterval(fetchPendingCount, 1000);

    const assetsSubscription = supabase
      .channel('assets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, (payload) => {
        console.log("Real-time update received:", payload);
        refetch();
      })
      .subscribe();

    const pendingRequestsSubscription = supabase
      .channel('pending-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_requests' }, () => {
        console.log("Pending requests update received");
        fetchPendingCount();
      })
      .subscribe();

    return () => {
      console.log("Cleaning up subscriptions and interval");
      assetsSubscription.unsubscribe();
      pendingRequestsSubscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  const fetchPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from('pending_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) {
        console.error("Error fetching pending count:", error);
        return;
      }
      console.log("Pending count:", count);
      setPendingCount(count || 0);
    } catch (error) {
      console.error("Unexpected error in fetchPendingCount:", error);
    }
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
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
    jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9, oct: 10,
    october: 10, nov: 11, november: 11, dec: 12, december: 12,
  };

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
      console.warn(`Invalid or empty date: ${dateStr}`);
      return null;
    }

    dateStr = dateStr.trim().toLowerCase();
    const formats = [
      { pattern: /^(\d{4})-(\d{2})-(\d{2})$/, order: [1, 2, 3] }, // YYYY-MM-DD
      { pattern: /^(\d{2})[-/](\d{2})[-/](\d{4})$/, order: [3, 2, 1] }, // DD-MM-YYYY or DD/MM/YYYY
      { pattern: /^(\d{2})[-/](\d{2})[-/](\d{2})$/, order: [3, 2, 1], adjustYear: true }, // DD-MM-YY or DD/MM/YY
      { pattern: /^(\d{1,2})[-/]([a-zA-Z]+)[-/](\d{4})$/, order: [3, 2, 1] }, // DD-MMM-YYYY or DD/MMM/YYYY
      { pattern: /^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/, order: [3, 2, 1] }, // DD MMM YYYY
      { pattern: /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/, order: [1, 2, 3] }, // YYYY/MM/DD or YYYY-MM-DD
    ];

    for (const format of formats) {
      const match = dateStr.match(format.pattern);
      if (match) {
        let [yearStr, monthStr, dayStr] = format.order.map(i => match[i]);
        let year = parseInt(yearStr, 10);
        let month = monthNames[monthStr] || parseInt(monthStr, 10);
        let day = parseInt(dayStr, 10);

        if (format.adjustYear && year < 100) {
          year += year < 50 ? 2000 : 1900;
        }

        if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
          console.warn(`Invalid date components: year=${year}, month=${month}, day=${day} for ${dateStr}`);
          return null;
        }

        const normalizedDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return normalizedDateStr;
      }
    }
    console.warn(`Unsupported date format: ${dateStr}`);
    return null;
  };

  const handleBulkUpload = async ({ headers, dataRows }) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      console.error("Unauthorized: Insufficient permissions for bulk upload.");
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      console.log("Processing bulk upload with headers:", headers, "and", dataRows.length, "rows");

      const fieldMap = {
        "asset id": "asset_id",
        "asset name": "name",
        "asset type": "type",
        "brand": "brand",
        "configuration": "configuration",
        "serial number": "serial_number",
        "far code": "far_code",
        "provider": "provider",
        "warranty start": "warranty_start",
        "warranty end": "warranty_end",
        "location": "location",
        "employee id": "employee_id",
        "employee name": "assigned_to",
        "asset value recovery": "asset_value_recovery",
      };

      const requiredFields = ["asset_id", "name", "type", "brand", "serial_number", "location"];
      const skippedRows: { row: string[], error: string }[] = [];

      for (const [index, row] of dataRows.entries()) {
        try {
          console.log(`Processing row ${index + 2}:`, row);
          const asset: any = {};
          headers.forEach((header, i) => {
            const normalizedHeader = header.trim().toLowerCase();
            if (fieldMap[normalizedHeader]) {
              asset[fieldMap[normalizedHeader]] = row[i] ? row[i].toString().trim() : null;
            }
          });

          if (!existingAsset) {
            for (const field of requiredFields) {
              if (!asset[field] || asset[field].trim() === "") {
                throw new Error(`Missing or empty required field: ${field}`);
              }
            }
          }

          if (asset.location && !locations.includes(asset.location)) {
            throw new Error(`Invalid location: ${asset.location}`);
          }

          if (asset.warranty_start !== undefined) {
            const parsedStart = parseDate(asset.warranty_start);
            console.log(`Row ${index + 2}: Parsed warranty_start "${asset.warranty_start}" to ${parsedStart}`);
            asset.warranty_start = parsedStart;
          }
          if (asset.warranty_end !== undefined) {
            const parsedEnd = parseDate(asset.warranty_end);
            console.log(`Row ${index + 2}: Parsed warranty_end "${asset.warranty_end}" to ${parsedEnd}`);
            asset.warranty_end = parsedEnd;
          }

          const isAssigned = asset.employee_id && asset.assigned_to;
          asset.status = isAssigned ? "Assigned" : existingAsset?.status || "Available";
          asset.assigned_date = isAssigned ? new Date().toISOString() : existingAsset?.assigned_date || null;
          asset.warranty_status = asset.warranty_end
            ? new Date(asset.warranty_end) >= new Date()
              ? "In Warranty"
              : "Out of Warranty"
            : existingAsset?.warranty_status || "Out of Warranty";
          asset.updated_by = currentUser;
          asset.updated_at = new Date().toISOString();
          asset.received_by = asset.received_by || existingAsset?.received_by || null;
          asset.return_date = asset.return_date || existingAsset?.return_date || null;
          asset.remarks = asset.remarks || existingAsset?.remarks || null;
          asset.asset_check = asset.asset_check || existingAsset?.asset_check || "";
          if (asset.status === "Sold") {
            if (!asset.asset_value_recovery) {
              throw new Error("Asset value recovery is mandatory for Sold status");
            }
            asset.asset_value_recovery = parseFloat(asset.asset_value_recovery);
            if (isNaN(asset.asset_value_recovery)) {
              throw new Error("Invalid asset value recovery for Sold status");
            }
          } else {
            asset.asset_value_recovery = null;
          }
          asset.asset_condition = asset.asset_condition || existingAsset?.asset_condition || null;

          if (existingAsset) {
            console.log(`Updating existing asset with serial_number: ${asset.serial_number}`);
            const validationError = validateAssetUniqueness(asset.asset_id, asset.serial_number, existingAsset.id);
            if (validationError) {
              throw new Error(validationError);
            }

            const updates = { ...asset };
            delete updates.created_by;
            delete updates.created_at;

            await updateAssetMutation.mutateAsync({
              id: existingAsset.id,
              ...updates,
            });

            for (const [field, newValue] of Object.entries(updates)) {
              const oldValue = existingAsset[field as keyof typeof existingAsset];
              if (oldValue !== newValue) {
                await logEditHistory(existingAsset.id, field, oldValue?.toString() ?? null, newValue?.toString() ?? null);
              }
            }

            toast.success(`Asset with serial ${asset.serial_number} updated successfully`);
          } else {
            console.log(`Inserting new asset with serial_number: ${asset.serial_number}`);
            const validationError = validateAssetUniqueness(asset.asset_id, asset.serial_number);
            if (validationError) {
              throw new Error(validationError);
            }

            asset.created_by = currentUser;
            asset.created_at = new Date().toISOString();

            const { data } = await supabase.from('assets').insert([asset]).select().single();
            await logEditHistory(data.id, "created", null, "Asset Created");
            for (const [field, value] of Object.entries(asset)) {
              if (value !== null && value !== "" && field !== "id" && field !== "created_by" && field !== "created_at" && field !== "updated_by" && field !== "updated_at") {
                await logEditHistory(data.id, field, null, value?.toString() ?? null);
              }
            }

            toast.success(`Asset with serial ${asset.serial_number} created successfully`);
          }
        } catch (error) {
          console.warn(`Row ${index + 2}: Skipped due to error: ${error.message}`);
          skippedRows.push({ row, error: error.message });
        }
      }

      if (skippedRows.length > 0) {
        const csvHeaders = [...headers, "Error"];
        const csvRows = skippedRows.map(({ row, error }) => [
          ...row.map(value => `"${(value || "").toString().replace(/"/g, '""')}"`),
          `"${error.replace(/"/g, '""')}"`
        ]);
        const csvContent = [
          csvHeaders.join(","),
          ...csvRows.map(row => row.join(","))
        ].join("\n");
        setSkippedRowsCsv(csvContent);
        setShowSkippedRowsDialog(true);
        console.log("Skipped rows CSV generated:", csvContent);
      }

      refetch();
      toast.success(`Bulk upload completed.`);
      if (skippedRows.length > 0) {
        toast.warning(`Skipped ${skippedRows.length} rows due to errors. You can download the list of skipped rows.`);
      }
    } catch (error) {
      console.error("Bulk upload error:", error);
      toast.error(error.message || "Failed to process bulk upload.");
    }
  };

  const handleDownloadSkippedRows = () => {
    if (!skippedRowsCsv) return;
    console.log("Downloading skipped rows CSV");
    const blob = new Blob([skippedRowsCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `skipped_assets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowSkippedRowsDialog(false);
    setSkippedRowsCsv(null);
    toast.success("Skipped rows CSV downloaded successfully!");
  };

  const handleAddAsset = async (newAsset: any) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      console.error("Unauthorized: Insufficient permissions for add asset.");
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const validationError = validateAssetUniqueness(newAsset.assetId, newAsset.serialNumber);
      if (validationError) {
        console.error("Validation error:", validationError);
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
        warranty_start: newAsset.warrantyStart ? parseDate(newAsset.warrantyStart) : null,
        warranty_end: newAsset.warrantyEnd ? parseDate(newAsset.warrantyEnd) : null,
        asset_check: "",
        provider: newAsset.provider,
        warranty_status: warrantyStatus,
        asset_value_recovery: newAsset.status === "Sold" ? parseFloat(newAsset.recoveryAmount) : null,
      };

      if (asset.status === "Sold" && !asset.asset_value_recovery) {
        throw new Error("Asset value recovery is mandatory for Sold status");
      }
      
      console.log("Adding asset:", asset);
      const data = await createAssetMutation.mutateAsync(asset);
      await logEditHistory(data.id, "created", null, "Asset Created");
      refetch();
      toast.success("Asset created successfully");
      setShowAddForm(false);
    } catch (error: any) {
      console.error("Error adding asset:", error);
      toast.error(error.message || "Failed to create asset.");
    }
  };

  const handleAssignAsset = async (assetId: string, userName: string, employeeId: string, status: string = "Assigned", assetValueRecovery?: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      console.error("Unauthorized: Insufficient permissions for assign asset.");
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error("Asset not found.");
      }
      
      if (status === "Sold" && !assetValueRecovery) {
        throw new Error("Asset value recovery is mandatory for Sold status");
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
          return_status: status,
          asset_value_recovery: status === "Sold" ? parseFloat(assetValueRecovery) : null,
        });
        
        toast.success("Assignment request sent for approval");
        fetchPendingCount();
        return;
      }

      const updates: any = {
        id: assetId,
        assigned_to: userName,
        employee_id: employeeId,
        status,
        assigned_date: new Date().toISOString(),
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      };

      if (status === "Sold") {
        const recoveryNum = parseFloat(assetValueRecovery);
        if (isNaN(recoveryNum)) {
          throw new Error("Invalid asset value recovery for Sold status");
        }
        updates.asset_value_recovery = recoveryNum;
      } else {
        updates.asset_value_recovery = null;
      }

      await updateAssetMutation.mutateAsync(updates);
      
      await logEditHistory(assetId, "assigned_to", asset?.assigned_to || null, userName);
      await logEditHistory(assetId, "employee_id", asset?.employee_id || null, employeeId);
      await logEditHistory(assetId, "status", asset?.status || null, status);
      await logEditHistory(assetId, "asset_value_recovery", asset?.asset_value_recovery?.toString() || null, updates.asset_value_recovery?.toString() || null);
      refetch();
      toast.success(`Asset ${status === "Sold" ? "sold" : "assigned"} successfully`);
    } catch (error: any) {
      console.error("Error assigning asset:", error);
      toast.error(error.message || "Failed to assign asset.");
    }
  };

  const handleUnassignAsset = async (assetId: string, remarks?: string, receivedBy?: string, location?: string, configuration?: string | null, assetCondition?: string | null, status?: string, assetValueRecovery?: string | null) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      console.error("Unauthorized: Insufficient permissions for unassign asset.");
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error("Asset not found.");
      }
      
      if (status === "Sold" && !assetValueRecovery) {
        throw new Error("Asset value recovery is mandatory for Sold status");
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
          asset_value_recovery: status === "Sold" ? parseFloat(assetValueRecovery) : null,
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
      
      if (assetValueRecovery !== undefined) {
        const recoveryNum = status === "Sold" ? parseFloat(assetValueRecovery) : null;
        await updateAssetMutation.mutateAsync({
          id: assetId,
          asset_value_recovery: recoveryNum,
          updated_at: new Date().toISOString(),
          updated_by: currentUser,
        });
        await logEditHistory(assetId, "asset_value_recovery", asset?.asset_value_recovery?.toString() || null, recoveryNum?.toString());
      }
      
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
      if (assetCondition) {
        await logEditHistory(assetId, "asset_condition", asset?.asset_condition || null, assetCondition);
      }
      refetch();
      toast.success("Asset returned successfully");
    } catch (error: any) {
      console.error("Error unassigning asset:", error);
      toast.error(error.message || "Failed to return asset.");
    }
  };

  const handleUpdateAsset = async (assetId: string, updates: any) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      console.error("Unauthorized: Insufficient permissions for update asset.");
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error("Asset not found.");
      }
      
      if (updates.asset_id || updates.serial_number) {
        const validationError = validateAssetUniqueness(
          updates.asset_id ?? asset.asset_id,
          updates.serial_number ?? asset.serial_number,
          assetId
        );
        if (validationError) {
          console.error("Validation error:", validationError);
          throw new Error(validationError);
        }
      }

      if (updates.warranty_start !== undefined) {
        updates.warranty_start = parseDate(updates.warranty_start);
      }
      if (updates.warranty_end !== undefined) {
        updates.warranty_end = parseDate(updates.warranty_end);
        const warrantyStatus = updates.warranty_end
          ? new Date(updates.warranty_end) >= new Date()
            ? "In Warranty"
            : "Out of Warranty"
          : "Out of Warranty";
        updates.warranty_status = warrantyStatus;
      }

      if (updates.status === "Sold" && !updates.asset_value_recovery) {
        throw new Error("Asset value recovery is mandatory for Sold status");
      }
      if (updates.status !== "Sold") {
        updates.asset_value_recovery = null;
      } else if (updates.asset_value_recovery !== undefined) {
        updates.asset_value_recovery = parseFloat(updates.asset_value_recovery);
        if (isNaN(updates.asset_value_recovery)) {
          throw new Error("Invalid asset value recovery for Sold status");
        }
      }

      if (!updates.updated_at) {
        updates.updated_at = new Date().toISOString();
      }
      if (!updates.updated_by) {
        updates.updated_by = currentUser;
      }

      await updateAssetMutation.mutateAsync({
        id: assetId,
        ...updates,
      });

      for (const [field, newValue] of Object.entries(updates)) {
        if (field !== 'id' && field !== 'updated_by' && field !== 'updated_at') {
          const oldValue = asset[field as keyof typeof asset];
          if (oldValue !== newValue) {
            await logEditHistory(assetId, field, oldValue?.toString() ?? null, newValue?.toString() ?? null);
          }
        }
      }

      refetch();
      toast.success("Asset updated successfully");
    } catch (error: any) {
      console.error("Error updating asset:", error);
      toast.error(error.message || "Failed to update asset.");
    }
  };

  const handleUpdateStatus = async (assetId: string, status: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      console.error("Unauthorized: Insufficient permissions for update status.");
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error("Asset not found.");
      }

      const updates: any = {
        id: assetId,
        status,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      };

      if (status !== "Sold") {
        updates.asset_value_recovery = null;
      } else if (!asset.asset_value_recovery) {
        throw new Error("Asset value recovery is mandatory for Sold status");
      }

      await updateAssetMutation.mutateAsync(updates);

      await logEditHistory(assetId, "status", asset?.status || null, status);
      if (status !== "Sold" && asset.asset_value_recovery) {
        await logEditHistory(assetId, "asset_value_recovery", asset.asset_value_recovery?.toString() || null, null);
      }
      refetch();
      toast.success("Asset status updated");
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update status.");
    }
  };

  const handleUpdateLocation = async (assetId: string, location: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      console.error("Unauthorized: Insufficient permissions for update location.");
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
      refetch();
      toast.success("Location updated");
    } catch (error: any) {
      console.error("Error updating location:", error);
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
      refetch();
    } catch (error: any) {
      console.error("Failed to update asset check:", error);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (userRole !== 'Super Admin') {
      console.error("Unauthorized: Only Super Admin can delete assets.");
      toast.error("Unauthorized: Only Super Admin can delete assets.");
      return;
    }

    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        throw new Error(`Asset with ID ${assetId} not found.`);
      }

      const { error: historyError } = await supabase
        .from('asset_edit_history')
        .delete()
        .eq('asset_id', assetId);
      
      if (historyError) {
        throw new Error(`Failed to delete related asset edit history: ${historyError.message}`);
      }

      await deleteAssetMutation.mutateAsync(assetId);
      refetch();
      toast.success("Asset deleted successfully");
    } catch (error: any) {
      console.error("Error deleting asset:", error);
      toast.error(error.message || "Failed to delete asset.");
    }
  };

  const handleDownload = () => {
    const headers = [
      "asset_id", "name", "type", "brand", "configuration", "serial_number", "far_code", "status", "location",
      "assigned_to", "employee_id", "assigned_date", "received_by", "return_date", "remarks",
      "created_by", "created_at", "updated_by", "updated_at", "warranty_start", "warranty_end",
      "asset_check", "provider", "warranty_status", "asset_value_recovery", "asset_condition"
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

  if (!isAuthorized && !isLoading && !error) {
    console.log("Rendering access denied UI");
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500">
              You are not authorized to access this application. Please check your login credentials.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    console.log("Rendering error UI:", error.message);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500">{error.message || "An error occurred while loading data."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    console.log("Rendering loading UI");
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500">Please wait while the dashboard loads.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    console.log("Rendering content for page:", currentPage);
    try {
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
        case 'orders':
          return (
            <OrdersView 
              userRole={userRole}
              currentUser={currentUser}
            />
          );
        case 'employees':
          return <EmployeeDetails />;
        case 'about':
          return <AboutView />;
        default:
          console.warn("Invalid currentPage value:", currentPage);
          return <div className="text-center text-gray-500">Invalid page selected.</div>;
      }
    } catch (error) {
      console.error("Error in renderContent:", error);
      return <div className="text-center text-red-600">Error rendering content: {error.message}</div>;
    }
  };

  console.log("Rendering main Dashboard UI");
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setCurrentPage('dashboard')}>Dashboard</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentPage('audit')}>Audit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentPage('amcs')}>AMCs</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentPage('summary')}>Summary</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentPage('orders')}>Orders</DropdownMenuItem> {/* New menu item */}
                  <DropdownMenuItem onClick={() => setCurrentPage('employees')}>Employee Details</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <img src="/logo.png" alt="LEAD GROUP" className="h-10" onError={() => console.error("Logo image failed to load")} />
              <span className="text-2xl font-bold text-blue-600">Asset Management System</span>
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

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-sm py-2">
        <div className="container mx-auto px-4">
          <p className="text-[14px] text-gray-500">
            Crafted by 🤓 IT Infra minds, for IT Infra needs
          </p>
        </div>
      </footer>

      {showBulkUpload && (
        <BulkUpload
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          onUpload={handleBulkUpload}
          onDownload={handleDownload}
          assets={assets}
        />
      )}

      {showPendingRequests && (
        <Dialog open={showPendingRequests} onOpenChange={setShowPendingRequests}>
          <DialogContent className="m-0 max-w-screen max-h-screen overflow-y-auto">
            <PendingRequests onRefresh={refetch} />
          </DialogContent>
        </Dialog>
      )}

      {showSkippedRowsDialog && (
        <Dialog open={showSkippedRowsDialog} onOpenChange={setShowSkippedRowsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Download Skipped Rows</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-500">
                Some rows were skipped due to errors. Would you like to download a CSV file containing the skipped rows and their error messages?
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  console.log("Cancelled skipped rows download");
                  setShowSkippedRowsDialog(false);
                  setSkippedRowsCsv(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDownloadSkippedRows}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};