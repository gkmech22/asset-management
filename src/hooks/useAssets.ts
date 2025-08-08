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
}

export const useAssets = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase fetch error:', error.message);
        throw new Error(`Failed to fetch assets: ${error.message}`);
      }
      return data as Asset[];
    },
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