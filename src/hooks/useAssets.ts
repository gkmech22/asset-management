import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Asset {
  id: string;
  asset_id: string;
  name: string;
  type: string;
  brand: string;
  configuration: string | null;
  serial_number: string;
  assigned_to: string | null;
  employee_id: string | null;
  status: string;
  location: string;
  assigned_date: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  received_by: string | null;
  return_date: string | null;
  remarks: string | null;
  asset_check: string;
  warranty_start: string | null;
  warranty_end: string | null;
  warranty_status: string | null;
  provider: string | null;
  recovery_amount?: number;
  asset_condition?: string | null;
}

export const useAssets = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async (): Promise<Asset[]> => {
      let allAssets: Asset[] = [];
      let start = 0;
      const pageSize = 1000;

      while (true) {
        console.log(`Fetching assets batch: rows ${start}-${start + pageSize - 1}`);
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .order('created_at', { ascending: false })
          .range(start, start + pageSize - 1);

        if (error) {
          console.error('Supabase fetch error:', error.message);
          throw new Error(`Failed to fetch assets batch: ${error.message}`);
        }

        if (!data || data.length === 0) {
          console.log('No more assets to fetch');
          break;
        }

        allAssets = [...allAssets, ...data];
        start += pageSize;

        if (start % (pageSize * 5) === 0) {
          console.log(`Pausing for 200ms at ${start} rows`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`Fetched ${allAssets.length} assets in ${Math.ceil(start / pageSize)} batches`);
      return allAssets;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (asset: Omit<Asset, 'id'>) => {
      const { data, error } = await supabase
        .from('assets')
        .insert([asset])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase insert error:', error.message);
        throw new Error(`Failed to create asset: ${error.message}`);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Asset> & { id: string }) => {
      const { data, error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase update error:', error.message);
        throw new Error(`Failed to update asset: ${error.message}`);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useUnassignAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, remarks, receivedBy, location, configuration, assetCondition, status }: { 
      id: string; 
      remarks?: string; 
      receivedBy?: string; 
      location?: string;
      configuration?: string | null;
      assetCondition?: string | null;
      status?: string;
    }) => {
      const { data: currentAsset, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError.message);
        throw new Error(`Failed to fetch asset: ${fetchError.message}`);
      }

      const updatePayload: Partial<Asset> = {
        status: status || 'Available',
        assigned_to: null,
        employee_id: null,
        assigned_date: null,
        return_date: new Date().toISOString(),
        received_by: receivedBy || currentAsset.updated_by || 'unknown_user',
        updated_by: receivedBy || currentAsset.updated_by || 'unknown_user',
        updated_at: new Date().toISOString(),
        configuration: configuration !== undefined ? configuration : currentAsset.configuration,
      };

      if (remarks !== undefined && remarks !== currentAsset.remarks) {
        updatePayload.remarks = remarks || null;
      }
      if (location !== undefined && location !== currentAsset.location) {
        updatePayload.location = location;
      }
      if (assetCondition !== undefined) {
        updatePayload.asset_condition = assetCondition || null;
      }

      const { data, error } = await supabase
        .from('assets')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase unassign error:', error.message);
        throw new Error(`Failed to unassign asset: ${error.message}`);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase delete error:', error.message);
        throw new Error(`Failed to delete asset: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};