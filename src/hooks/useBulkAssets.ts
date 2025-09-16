import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Asset } from './useAssets';

export interface CsvAsset {
  asset_id: string;
  name: string;
  type: string;
  brand: string;
  configuration?: string;
  serial_number: string;
  provider?: string;
  warranty_start?: string;
  warranty_end?: string;
}

export const useBulkUploadAssets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (csvAssets: CsvAsset[]) => {
      const results = {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const csvAsset of csvAssets) {
        try {
          // Check if asset already exists by asset_id or serial_number
          const { data: existingAssets, error: queryError } = await supabase
            .from('assets')
            .select('id, asset_id, serial_number')
            .or(`asset_id.eq.${csvAsset.asset_id},serial_number.eq.${csvAsset.serial_number}`);

          if (queryError) {
            results.errors.push(`Error checking asset ${csvAsset.asset_id}: ${queryError.message}`);
            continue;
          }

          const assetData = {
            asset_id: csvAsset.asset_id,
            name: csvAsset.name,
            type: csvAsset.type,
            brand: csvAsset.brand,
            configuration: csvAsset.configuration || null,
            serial_number: csvAsset.serial_number,
            provider: csvAsset.provider || null,
            warranty_start: csvAsset.warranty_start || null,
            warranty_end: csvAsset.warranty_end || null,
            status: 'Available',
            location: 'Mumbai Office', // Default location
            created_by: 'Bulk Upload',
            updated_by: 'Bulk Upload',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          if (existingAssets && existingAssets.length > 0) {
            // Asset exists, update it
            const existingAsset = existingAssets[0];
            const { error: updateError } = await supabase
              .from('assets')
              .update({
                ...assetData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingAsset.id);

            if (updateError) {
              results.errors.push(`Error updating asset ${csvAsset.asset_id}: ${updateError.message}`);
            } else {
              results.updated++;
            }
          } else {
            // Asset doesn't exist, create it
            const { error: insertError } = await supabase
              .from('assets')
              .insert([assetData]);

            if (insertError) {
              results.errors.push(`Error creating asset ${csvAsset.asset_id}: ${insertError.message}`);
            } else {
              results.created++;
            }
          }
        } catch (error) {
          results.errors.push(`Unexpected error processing asset ${csvAsset.asset_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useExportAssets = () => {
  return useMutation({
    mutationFn: async (assets: Asset[]) => {
      const csvHeaders = [
        'Asset ID',
        'Asset Name', 
        'Asset Type',
        'Brand',
        'Configuration',
        'Serial Number',
        'Status',
        'Location',
        'Assigned To',
        'Employee ID',
        'Provider',
        'Warranty Start',
        'Warranty End',
        'Recovery Amount',
        'Created By',
        'Created At',
      ];

      const csvRows = assets.map(asset => [
        asset.asset_id || '',
        asset.name || '',
        asset.type || '',
        asset.brand || '',
        asset.configuration || '',
        asset.serial_number || '',
        asset.status || '',
        asset.location || '',
        asset.assigned_to || '',
        asset.employee_id || '',
        asset.provider || '',
        asset.warranty_start || '',
        asset.warranty_end || '',
        asset.recovery_amount?.toString() || '',
        asset.created_by || '',
        asset.created_at || '',
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assets_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      return { success: true, count: assets.length };
    },
  });
};