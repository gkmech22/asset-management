import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu, Upload, Plus } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const locations = [
  "Mumbai Office", "Hyderabad WH", "Ghaziabad WH", "Bhiwandi WH", "Patiala WH",
  "Bangalore Office", "Kolkata WH", "Trichy WH", "Gurugram Office", "Indore WH",
  "Bangalore WH", "Jaipur WH"
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
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'audit' | 'amcs' | 'summary' | 'employees'>('dashboard');
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailData, setEmailData] = useState<{ type: 'assign' | 'return'; asset: any; employeeId: string; userName: string; employeeEmail: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailCc, setEmailCc] = useState('');

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

  useEffect(() => {
    if (emailData) {
      const { type, asset, employeeId, userName } = emailData;
      setEmailSubject(`${type === 'assign' ? 'Asset Assigned' : 'Asset Returned'} - Employee ID: ${employeeId}`);
      setEmailBody(`Dear ${userName},

The following asset has been ${type === 'assign' ? 'assigned to you' : 'returned from you'}:

<table border="1" style="border-collapse: collapse; width: 100%;">
<thead>
<tr>
<th style="padding: 8px; border: 1px solid #ddd;">Asset ID</th>
<th style="padding: 8px; border: 1px solid #ddd;">Name</th>
<th style="padding: 8px; border: 1px solid #ddd;">Type</th>
<th style="padding: 8px; border: 1px solid #ddd;">Brand</th>
<th style="padding: 8px; border: 1px solid #ddd;">Configuration</th>
<th style="padding: 8px; border: 1px solid #ddd;">Serial Number</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding: 8px; border: 1px solid #ddd;">${asset.asset_id}</td>
<td style="padding: 8px; border: 1px solid #ddd;">${asset.name}</td>
<td style="padding: 8px; border: 1px solid #ddd;">${asset.type}</td>
<td style="padding: 8px; border: 1px solid #ddd;">${asset.brand}</td>
<td style="padding: 8px; border: 1px solid #ddd;">${asset.configuration || '-'}</td>
<td style="padding: 8px; border: 1px solid #ddd;">${asset.serial_number}</td>
</tr>
</tbody>
</table>

${type === 'assign' ? 'Assigned' : 'Returned'} on: ${new Date().toLocaleString()}

Regards,
Asset Management Team`);
      setEmailCc(currentUser);
    }
  }, [emailData, currentUser]);

  const handleSendEmail = async () => {
    if (!emailData) return;
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.employeeEmail,
          cc: emailCc.split(',').map(e => e.trim()).filter(e => e),
          subject: emailSubject,
          html: emailBody,
        },
      });
      if (error) throw error;
      toast.success('Email sent successfully');
      setShowEmailPreview(false);
    } catch (err) {
      toast.error('Failed to send email');
      console.error('Email send error:', err);
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
      return `Serial Number ${serialNumber} is already in use.`;
    }
    return null;
  };

  const parseDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr || dateStr.trim() === "") return null;

    const monthNames = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
      apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
      aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
      nov: 10, november: 10, dec: 11, december: 11,
    };

    const formats = [
      { pattern: /^(\d{4})-(\d{2})-(\d{2})$/, order: [1, 2, 3] },
      { pattern: /^(\d{2})[-/](\d{2})[-/](\d{4})$/, order: [3, 1, 2] },
      { pattern: /^(\d{2})[-/](\d{2})[-/](\d{2})$/, order: [3, 1, 2], adjustYear: true },
    ];

    for (const format of formats) {
      const match = dateStr.trim().match(format.pattern);
      if (match) {
        let [year, month, day] = format.order.map(i => match[i]);
        year = parseInt(year, 10);
        month = format.order[1] === 2 ? monthNames[month.toLowerCase()] : parseInt(month, 10) - 1;
        day = parseInt(day, 10);

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

      // Fetch employee email for email notification
      const { data: emp } = await supabase.from('employees').select('email').eq('employee_id', employeeId).single();
      if (emp?.email) {
        setEmailData({ type: 'assign', asset, employeeId, userName, employeeEmail: emp.email });
        setShowEmailPreview(true);
      }
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
      
      await unassignAssetMutation.mutateAsync({
        id: assetId,
        remarks,
        receivedBy: receivedBy || currentUser,
        location,
      });
      
      await logEditHistory(assetId, "assigned_to", asset?.assigned_to || null, null);
      await logEditHistory(assetId, "employee_id", asset?.employee_id || null, null);
      await logEditHistory(assetId, "status", asset?.status || null, "Available");
      await logEditHistory(assetId, "return_date", asset?.return_date || null, new Date().toISOString());
      await logEditHistory(assetId, "received_by", asset?.received_by || null, receivedBy || currentUser);
      
      if (location) {
        await logEditHistory(assetId, "location", asset?.location || null, location);
      }
      if (remarks) {
        await logEditHistory(assetId, "remarks", asset?.remarks || null, remarks);
      }
      
      toast.success("Asset returned successfully");

      // Fetch employee email for email notification
      const previousEmployeeId = asset.employee_id;
      const previousUserName = asset.assigned_to;
      if (previousEmployeeId) {
        const { data: emp } = await supabase.from('employees').select('email').eq('employee_id', previousEmployeeId).single();
        if (emp?.email) {
          setEmailData({ type: 'return', asset, employeeId: previousEmployeeId, userName: previousUserName!, employeeEmail: emp.email });
          setShowEmailPreview(true);
        }
      }
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
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });

      // Log changes
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
      await updateAssetMutation.mutateAsync({ 
        id: assetId, 
        location,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
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
      await updateAssetMutation.mutateAsync({
        id: assetId,
        asset_check: assetCheck,
        updated_by: currentUser,
        updated_at: new Date().toISOString(),
      });
      await logEditHistory(assetId, "asset_check", asset?.asset_check || null, assetCheck);
      toast.success("Asset check updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update asset check.");
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin') {
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

  const handleBulkUpload = async (data: { headers: string[]; dataRows: string[][] }) => {
    if (userRole !== 'Super Admin' && userRole !== 'Admin' && userRole !== 'Operator') {
      toast.error("Unauthorized: Insufficient permissions.");
      return;
    }

    try {
      const { headers, dataRows } = data;
      const errors: string[] = [];
      const validAssets: any[] = [];
      const addedAssets: string[] = [];
      const unaddedAssets: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const assetIndex = headers.indexOf("Asset ID");
        const nameIndex = headers.indexOf("Asset Name");
        const typeIndex = headers.indexOf("Asset Type");
        const brandIndex = headers.indexOf("Brand");
        const serialIndex = headers.indexOf("Serial Number");
        const locationIndex = headers.indexOf("Location");
        const configIndex = headers.indexOf("Configuration");
        const providerIndex = headers.indexOf("Provider");
        const warrantyStartIndex = headers.indexOf("Warranty Start");
        const warrantyEndIndex = headers.indexOf("Warranty End");
        const employeeIdIndex = headers.indexOf("Employee ID");
        const employeeNameIndex = headers.indexOf("Employee Name");

        const asset = {
          assetId: row[assetIndex]?.toString().trim() || "",
          name: row[nameIndex]?.toString().trim() || "",
          type: row[typeIndex]?.toString().trim() || "",
          brand: row[brandIndex]?.toString().trim() || "",
          serialNumber: row[serialIndex]?.toString().trim() || "",
          location: row[locationIndex]?.toString().trim() || locations[0],
          configuration: configIndex !== -1 ? row[configIndex]?.toString().trim() || "" : "",
          provider: providerIndex !== -1 ? row[providerIndex]?.toString().trim() || null : null,
          warrantyStart: warrantyStartIndex !== -1 ? row[warrantyStartIndex]?.toString().trim() || null : null,
          warrantyEnd: warrantyEndIndex !== -1 ? row[warrantyEndIndex]?.toString().trim() || null : null,
          employeeId: employeeIdIndex !== -1 ? row[employeeIdIndex]?.toString().trim() || null : null,
          employeeName: employeeNameIndex !== -1 ? row[employeeNameIndex]?.toString().trim() || null : null,
        };

        if (!asset.assetId || !asset.name || !asset.type || !asset.brand || !asset.serialNumber) {
          errors.push(`Row ${i + 2}: Missing required fields`);
          unaddedAssets.push(asset.assetId || `Row ${i + 2}`);
          continue;
        }

        const validationError = validateAssetUniqueness(asset.assetId, asset.serialNumber);
        if (validationError) {
          errors.push(`Row ${i + 2}: ${validationError}`);
          unaddedAssets.push(asset.assetId);
          continue;
        }

        const isAssigned = asset.employeeId && asset.employeeName;
        const assignedDate = isAssigned ? new Date().toISOString() : null;
        const warrantyStatus = asset.warrantyEnd
          ? new Date(asset.warrantyEnd) >= new Date()
            ? "In Warranty"
            : "Out of Warranty"
          : "Out of Warranty";

        validAssets.push({
          asset_id: asset.assetId,
          name: asset.name,
          type: asset.type,
          brand: asset.brand,
          configuration: asset.configuration,
          serial_number: asset.serialNumber,
          status: isAssigned ? "Assigned" : "Available",
          location: asset.location,
          assigned_to: isAssigned ? asset.employeeName : null,
          employee_id: isAssigned ? asset.employeeId : null,
          assigned_date: assignedDate,
          received_by: null,
          return_date: null,
          remarks: null,
          created_by: currentUser,
          created_at: new Date().toISOString(),
          updated_by: currentUser,
          updated_at: new Date().toISOString(),
          warranty_start: asset.warrantyStart,
          warranty_end: asset.warrantyEnd,
          asset_check: "",
          provider: asset.provider,
          warranty_status: warrantyStatus,
        });
      }

      if (errors.length > 0 && validAssets.length === 0) {
        throw new Error(`Bulk upload failed:\n${errors.join('\n')}`);
      }

      for (const asset of validAssets) {
        try {
          const result = await createAssetMutation.mutateAsync(asset);
          if (result.error || !result) {
            errors.push(`Failed to create asset ${asset.asset_id}`);
            unaddedAssets.push(asset.asset_id);
            continue;
          }
          addedAssets.push(asset.asset_id);
          await logEditHistory(result.id || asset.asset_id, "created", null, "Asset Created");
        } catch (error: any) {
          errors.push(`Error creating asset ${asset.asset_id}: ${error.message}`);
          unaddedAssets.push(asset.asset_id);
        }
      }

      let summaryMessage = `Successfully uploaded ${addedAssets.length} assets.`;
      if (unaddedAssets.length > 0) {
        summaryMessage += `\nUnadded assets: ${unaddedAssets.join(", ")}`;
      }
      if (errors.length > 0) {
        summaryMessage += `\nErrors: ${errors.length}`;
      }

      toast.success(summaryMessage);
      setShowBulkUpload(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to process bulk upload.");
    }
  };

  const handleDownloadData = () => {
    const headers = [
      "Asset ID", "Asset Name", "Asset Type", "Brand", "Configuration", "Serial Number",
      "Employee ID", "Employee Name", "Status", "Asset Location", "Assigned Date",
      "Return Date", "Received By", "Remarks", "Warranty Start", "Warranty End",
      "Created By", "Created At", "Updated By", "Updated At", "Asset Check", "Provider",
      "Warranty Status", "Recovery Amount"
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
          escapeCsvField(asset.recovery_amount?.toString()),
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
      {/* Header */}
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
                  <DropdownMenuItem onSelect={() => setCurrentPage('employees')}>Employees</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="LEAD Group Logo" className="h-12 w-auto text-primary" />
                <div>
                  <h1 className="text-2xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
                    Asset Management System
                  </h1>
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pt-[60px] pb-[40px] container mx-auto px-4">
        {currentPage === 'dashboard' && <DashboardView {...commonProps} />}
        {currentPage === 'audit' && <AuditView {...commonProps} />}
        {currentPage === 'amcs' && <AmcsView {...commonProps} />}
        {currentPage === 'summary' && <SummaryView {...commonProps} />}
        {currentPage === 'employees' && <EmployeeDetails />}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-card py-2">
        <div className="container mx-auto px-4">
          <p className="text-[14px] text-muted-foreground">
            Crafted by 🤓 IT Infra minds, for IT Infra needs
          </p>
        </div>
      </footer>

      {/* Modals */}
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

      {/* Email Preview Dialog */}
      <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview and Send Email</DialogTitle>
          </DialogHeader>
          {emailData && (
            <div className="space-y-4">
              <div>
                <Label>To</Label>
                <Input value={emailData.employeeEmail} disabled />
              </div>
              <div>
                <Label>CC (comma separated)</Label>
                <Input 
                  value={emailCc} 
                  onChange={(e) => setEmailCc(e.target.value)} 
                  placeholder="email1@example.com, email2@example.com" 
                />
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              </div>
              <div>
                <Label>Body</Label>
                <Textarea 
                  className="w-full h-64" 
                  value={emailBody} 
                  onChange={(e) => setEmailBody(e.target.value)} 
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEmailPreview(false)}>Skip</Button>
                <Button onClick={handleSendEmail}>Send</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}