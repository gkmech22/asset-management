import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Download, Upload, Filter, Search, ScanBarcode } from 'lucide-react';
import { DatePickerWithRange } from './DatePickerWithRange';
import { AssetForm } from './AssetForm';
import { BulkUpload } from './BulkUpload';
import { AssetList } from './AssetList';
import { useAssets, useCreateAsset, useUpdateAsset, useUnassignAsset, useDeleteAsset } from '@/hooks/useAssets';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

export const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [returnStatus, setReturnStatus] = useState('Available');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [recoveryAmount, setRecoveryAmount] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [configFilter, setConfigFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: assetsData = [], isLoading, refetch } = useAssets();
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();
  const unassignAssetMutation = useUnassignAsset();
  const deleteAssetMutation = useDeleteAsset();
  const { toast } = useToast();

  useEffect(() => {
    setAssets(assetsData);
  }, [assetsData]);

  useEffect(() => {
    const fetchUserAndAuthorize = async () => {
      try {
        setCurrentUser('admin@example.com');
        setIsAuthorized(true);
        setUserRole('Admin');
      } catch (error) {
        console.error('Auth error:', error);
        setIsAuthorized(false);
        setUserRole(null);
      }
    };
    fetchUserAndAuthorize();
  }, []);

  const handleCreateAsset = async (assetData: any) => {
    try {
      await createAssetMutation.mutateAsync(assetData);
      toast({ title: "Success", description: "Asset created successfully" });
      setShowAssetForm(false);
      refetch();
    } catch (error) {
      console.error('Error creating asset:', error);
      toast({ title: "Error", description: "Failed to create asset", variant: "destructive" });
    }
  };

  const handleUpdateAsset = async (assetId: string, updates: any) => {
    try {
      await updateAssetMutation.mutateAsync({ id: assetId, ...updates });
      toast({ title: "Success", description: "Asset updated successfully" });
      refetch();
    } catch (error) {
      console.error('Error updating asset:', error);
      toast({ title: "Error", description: "Failed to update asset", variant: "destructive" });
    }
  };

  const handleAssignAsset = async (assetId: string, userName: string, employeeId: string) => {
    try {
      const updates = {
        status: 'Assigned',
        assigned_to: userName,
        employee_id: employeeId,
        assigned_date: new Date().toISOString(),
        updated_by: currentUser || 'unknown_user',
        updated_at: new Date().toISOString(),
      };
      await updateAssetMutation.mutateAsync({ id: assetId, ...updates });
      toast({ title: "Success", description: "Asset assigned successfully" });
      refetch();
    } catch (error) {
      console.error('Error assigning asset:', error);
      toast({ title: "Error", description: "Failed to assign asset", variant: "destructive" });
    }
  };

  const handleReturnAsset = async () => {
    if (!selectedAsset) return;

    try {
      const statusesNeedingRecovery = ['Sale', 'Lost', 'Emp Damage', 'Courier Damage'];
      const updates: any = {
        status: returnStatus,
        assigned_to: null,
        employee_id: null,
        assigned_date: null,
        return_date: new Date().toISOString(),
        received_by: currentUser,
        remarks: returnRemarks || null,
        updated_by: currentUser || 'unknown_user',
        updated_at: new Date().toISOString(),
      };

      if (statusesNeedingRecovery.includes(returnStatus) && recoveryAmount) {
        updates.recovery_amount = parseFloat(recoveryAmount);
      }

      await updateAssetMutation.mutateAsync({ id: selectedAsset.id, ...updates });
      toast({ title: "Success", description: "Asset returned successfully" });
      setShowReturnDialog(false);
      setSelectedAsset(null);
      setReturnStatus('Available');
      setReturnRemarks('');
      setRecoveryAmount('');
      refetch();
    } catch (error) {
      console.error('Error returning asset:', error);
      toast({ title: "Error", description: "Failed to return asset", variant: "destructive" });
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteAssetMutation.mutateAsync(assetId);
      toast({ title: "Success", description: "Asset deleted successfully" });
      refetch();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({ title: "Error", description: "Failed to delete asset", variant: "destructive" });
    }
  };

  const handleBulkUpload = async (file: File) => {
    try {
      // Handle bulk upload logic here
      toast({ title: "Success", description: "Bulk upload completed successfully" });
      setShowBulkUpload(false);
      refetch();
    } catch (error) {
      console.error('Error with bulk upload:', error);
      toast({ title: "Error", description: "Failed to process bulk upload", variant: "destructive" });
    }
  };

  const downloadCurrentData = () => {
    const headers = [
      'Asset ID', 'Model', 'Asset Type', 'Brand', 'Configuration', 'Serial Number',
      'Assigned To', 'Employee ID', 'Status', 'Location', 'Asset Check',
      'Assigned Date', 'Return Date', 'Received By', 'Recovery Amount'
    ];

    const csvData = [
      headers.join(','),
      ...assets.map(asset => [
        asset.asset_id || '',
        asset.name || '',
        asset.type || '',
        asset.brand || '',
        asset.configuration || '',
        asset.serial_number || '',
        asset.assigned_to || '',
        asset.employee_id || '',
        asset.status || '',
        asset.location || '',
        asset.asset_check || '',
        asset.assigned_date || '',
        asset.return_date || '',
        asset.received_by || '',
        asset.recovery_amount?.toString() || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openReturnDialog = (asset: any) => {
    setSelectedAsset(asset);
    setShowReturnDialog(true);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    const matchesBrand = brandFilter === 'all' || asset.brand === brandFilter;
    const matchesConfig = configFilter === 'all' || asset.configuration === configFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    
    return matchesType && matchesBrand && matchesConfig && matchesStatus;
  });

  const statusesNeedingRecovery = ['Sale', 'Lost', 'Emp Damage', 'Courier Damage'];

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Access denied. Please contact administrator.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Asset Management Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Button 
              onClick={() => setShowAssetForm(true)}
              className="bg-gradient-primary hover:shadow-glow transition-smooth"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowBulkUpload(true)}
              className="hover:bg-primary hover:text-primary-foreground"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Button 
              variant="outline" 
              onClick={downloadCurrentData}
              className="hover:bg-primary hover:text-primary-foreground"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Data
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  {[...new Set(assets.map(a => a.type))].map(type => (
                    <SelectItem key={String(type)} value={String(type)}>{String(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Brand</label>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All brands" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="all">All Brands</SelectItem>
                  {[...new Set(assets.map(a => a.brand))].map(brand => (
                    <SelectItem key={String(brand)} value={String(brand)}>{String(brand)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Configuration</label>
              <Select value={configFilter} onValueChange={setConfigFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All configurations" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="all">All Configurations</SelectItem>
                  {[...new Set(assets.map(a => a.configuration))].filter(Boolean).map(config => (
                    <SelectItem key={String(config)} value={String(config)}>{String(config)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {[...new Set(assets.map(a => a.status))].map(status => (
                    <SelectItem key={String(status)} value={String(status)}>{String(status)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <AssetList
        assets={filteredAssets}
        onAssign={handleAssignAsset}
        onUnassign={async (assetId, remarks, receivedBy) => openReturnDialog(assets.find(a => a.id === assetId))}
        onUpdateAsset={handleUpdateAsset}
        onUpdateStatus={(assetId, status) => handleUpdateAsset(assetId, { status })}
        onUpdateLocation={(assetId, location) => handleUpdateAsset(assetId, { location })}
        onUpdateAssetCheck={(assetId, assetCheck) => handleUpdateAsset(assetId, { asset_check: assetCheck })}
        onDelete={handleDeleteAsset}
        dateRange={dateRange}
        typeFilter={typeFilter}
        brandFilter={brandFilter}
        configFilter={configFilter}
        statusFilter={statusFilter}
      />

      <AssetForm
        onSubmit={handleCreateAsset}
        onCancel={() => setShowAssetForm(false)}
      />

      <BulkUpload
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onUpload={handleBulkUpload}
        onDownload={downloadCurrentData}
      />

      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Return Asset</DialogTitle>
            <DialogDescription>
              Update the status and provide return details for {selectedAsset?.asset_id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="returnStatus">Status *</Label>
              <Select value={returnStatus} onValueChange={setReturnStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Scrap/Damage">Scrap/Damage</SelectItem>
                  <SelectItem value="Sale">Sale</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Emp Damage">Emp Damage</SelectItem>
                  <SelectItem value="Courier Damage">Courier Damage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {statusesNeedingRecovery.includes(returnStatus) && (
              <div className="space-y-2">
                <Label htmlFor="recoveryAmount">Recovery Amount</Label>
                <Input
                  id="recoveryAmount"
                  type="number"
                  value={recoveryAmount}
                  onChange={(e) => setRecoveryAmount(e.target.value)}
                  placeholder="Enter recovery amount"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={returnRemarks}
                onChange={(e) => setReturnRemarks(e.target.value)}
                placeholder="Enter any remarks..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowReturnDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReturnAsset}
                className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                Return Asset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};