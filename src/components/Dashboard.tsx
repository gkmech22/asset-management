import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { AssetForm } from './AssetForm';
import { BulkUpload } from './BulkUpload';
import DashboardView from './DashboardView';
import AmcsView from './AmcsView';
import AuditView from './AuditView';
import SummaryView from './SummaryView';
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset, useUnassignAsset } from '@/hooks/useAssets';
import { useExportAssets } from '@/hooks/useBulkAssets';
import { toast } from 'sonner';

export const Dashboard = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'amcs' | 'audit' | 'summary'>('dashboard');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const { data: assets = [], isLoading, error, refetch } = useAssets();
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();
  const deleteAssetMutation = useDeleteAsset();
  const unassignAssetMutation = useUnassignAsset();
  const exportAssetsMutation = useExportAssets();

  // Add asset
  const handleAddAsset = async (assetData: any) => {
    try {
      await createAssetMutation.mutateAsync({
        ...assetData,
        status: 'Available',
        created_by: 'admin',
        updated_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setShowAddForm(false);
      toast.success('Asset added successfully');
    } catch (error) {
      console.error('Error adding asset:', error);
      toast.error('Failed to add asset');
    }
  };

  // Assign asset
  const handleAssignAsset = async (assetId: string, userName: string, employeeId: string) => {
    try {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) throw new Error('Asset not found');

      await updateAssetMutation.mutateAsync({
        id: assetId,
        status: 'Assigned',
        assigned_to: userName,
        employee_id: employeeId,
        assigned_date: new Date().toISOString(),
        updated_by: 'admin',
        updated_at: new Date().toISOString(),
      });
      toast.success('Asset assigned successfully');
    } catch (error) {
      console.error('Error assigning asset:', error);
      toast.error('Failed to assign asset');
    }
  };

  // Unassign asset
  const handleUnassignAsset = async (assetId: string, remarks?: string, receivedBy?: string, location?: string, recoveryAmount?: number) => {
    try {
      await unassignAssetMutation.mutateAsync({
        id: assetId,
        remarks,
        receivedBy,
      });

      // Update location and recovery amount separately if provided
      if (location || recoveryAmount !== undefined) {
        await updateAssetMutation.mutateAsync({
          id: assetId,
          location: location || assets.find(a => a.id === assetId)?.location || 'Mumbai Office',
          recovery_amount: recoveryAmount,
        });
      }

      toast.success('Asset unassigned successfully');
    } catch (error) {
      console.error('Error unassigning asset:', error);
      toast.error('Failed to unassign asset');
    }
  };

  // Update asset
  const handleUpdateAsset = async (assetId: string, updates: any) => {
    try {
      await updateAssetMutation.mutateAsync({
        id: assetId,
        ...updates,
        updated_by: 'admin',
        updated_at: new Date().toISOString(),
      });
      toast.success('Asset updated successfully');
    } catch (error) {
      console.error('Error updating asset:', error);
      toast.error('Failed to update asset');
    }
  };

  // Update status
  const handleUpdateStatus = async (assetId: string, status: string, recoveryAmount?: number) => {
    try {
      const updates: any = {
        id: assetId,
        status,
        updated_by: 'admin',
        updated_at: new Date().toISOString(),
      };

      if (recoveryAmount !== undefined) {
        updates.recovery_amount = recoveryAmount;
      }

      await updateAssetMutation.mutateAsync(updates);
      toast.success('Asset status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Update location
  const handleUpdateLocation = async (assetId: string, location: string) => {
    try {
      await updateAssetMutation.mutateAsync({
        id: assetId,
        location,
        updated_by: 'admin',
        updated_at: new Date().toISOString(),
      });
      toast.success('Asset location updated successfully');
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    }
  };

  // Update asset check
  const handleUpdateAssetCheck = async (assetId: string, assetCheck: string) => {
    try {
      await updateAssetMutation.mutateAsync({
        id: assetId,
        asset_check: assetCheck,
        updated_by: 'admin',
        updated_at: new Date().toISOString(),
      });
      toast.success('Asset check updated successfully');
    } catch (error) {
      console.error('Error updating asset check:', error);
      toast.error('Failed to update asset check');
    }
  };

  // Delete asset
  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteAssetMutation.mutateAsync(assetId);
      toast.success('Asset deleted successfully');
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    }
  };

  // Export data
  const handleDownloadData = async () => {
    try {
      await exportAssetsMutation.mutateAsync(assets);
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading assets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error loading assets: {error.message}</div>
      </div>
    );
  }

  const renderActiveView = () => {
    const commonProps = {
      assets,
      onAssign: handleAssignAsset,
      onUnassign: handleUnassignAsset,
      onUpdateAsset: handleUpdateAsset,
      onUpdateStatus: handleUpdateStatus,
      onUpdateLocation: handleUpdateLocation,
      onUpdateAssetCheck: handleUpdateAssetCheck,
      onDelete: handleDeleteAsset,
      userRole: 'admin', // Default role
    };

    switch (activeView) {
      case 'amcs':
        return <AmcsView {...commonProps} />;
      case 'audit':
        return <AuditView {...commonProps} />;
      case 'summary':
        return <SummaryView {...commonProps} />;
      default:
        return <DashboardView {...commonProps} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
              Asset Management System
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddForm(true)}
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex gap-2">
            {[
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'amcs', label: 'AMCS' },
              { key: 'audit', label: 'Audit' },
              { key: 'summary', label: 'Summary' },
            ].map((view) => (
              <Button
                key={view.key}
                variant={activeView === view.key ? 'default' : 'outline'}
                onClick={() => setActiveView(view.key as any)}
                className={
                  activeView === view.key
                    ? 'bg-gradient-primary hover:shadow-glow transition-smooth'
                    : 'hover:bg-primary hover:text-primary-foreground'
                }
              >
                {view.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active View */}
      {renderActiveView()}

      {/* Add Asset Form */}
      {showAddForm && (
        <AssetForm
          onSubmit={handleAddAsset}
          onCancel={() => setShowAddForm(false)}
          assets={assets}
        />
      )}

      {/* Bulk Upload */}
      <BulkUpload
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onDownload={handleDownloadData}
      />
    </div>
  );
};