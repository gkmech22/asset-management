import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAssetHistory = (assetId: string | null) => {
  return useQuery({
    queryKey: ["asset_history", assetId],
    queryFn: async () => {
      if (!assetId) return [];
      const { data, error } = await (supabase as any)
        .from("asset_edit_history")
        .select("*")
        .eq("asset_id", assetId)
        .order("changed_at", { ascending: false })
        .limit(15); // Limit to recent 15 entries
      if (error) throw error;
      return data;
    },
    enabled: !!assetId,
  });
};