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
}

export const useAssets = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async (): Promise<Asset[]> => {
      let allAssets: Asset[] = [];
      let start = 0;
      const pageSize = 1000; // Supabase max rows per query

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
          break; // No more rows to fetch
        }

        allAssets = [...allAssets, ...data];
        start += pageSize;

        // Delay to avoid rate limits for very large datasets
        if (start % (pageSize * 5) === 0) {
          console.log(`Pausing for 200ms at ${start} rows`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`Fetched ${allAssets.length} assets in ${Math.ceil(start / pageSize)} batches`);
      return allAssets;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
    retry: 2, // Retry failed batches
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
    mutationFn: async ({ id, remarks, receivedBy }: { id: string; remarks?: string; receivedBy?: string }) => {
      const { data, error } = await supabase
        .from('assets')
        .update({
          status: 'Available',
          assigned_to: null,
          employee_id: null,
          assigned_date: null,
          return_date: new Date().toISOString(),
          received_by: receivedBy,
          remarks: remarks || null,
          updated_by: receivedBy || 'unknown_user',
          updated_at: new Date().toISOString(),
        })
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
