import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAssetHistory = (assetId: string | null) => {
  return useQuery({
    queryKey: ["asset_history", assetId],
    queryFn: async () => {
      if (!assetId) return [];
      // Temporarily disabled due to schema issues
      return [];
    },
    enabled: !!assetId,
  });
};