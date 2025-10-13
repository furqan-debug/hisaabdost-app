
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { WalletAddition } from "./types";
import { useFamilyContext } from "@/hooks/useFamilyContext";

export function useWalletQueries(selectedMonth?: Date) {
  const { user } = useAuth();
  const { activeFamilyId, isPersonalMode } = useFamilyContext();

  // Use the provided month or default to current month
  const targetMonth = selectedMonth || new Date();
  const firstDayOfMonth = format(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1), 'yyyy-MM-dd');
  const lastDayOfMonth = format(new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0), 'yyyy-MM-dd');

  // Query wallet additions for selected month with optimized polling
  const { data: walletAdditions = [], isLoading } = useQuery({
    queryKey: ['wallet-additions', user?.id, firstDayOfMonth, isPersonalMode ? 'personal' : activeFamilyId],
    queryFn: async () => {
      if (!user) return [];

      if (import.meta.env.DEV) {
        console.log('🔄 Fetching wallet additions for selected month:', firstDayOfMonth, "Mode:", isPersonalMode ? 'personal' : `family: ${activeFamilyId}`);
      }
      
      // Execute query based on family context - separate queries to avoid TS type issues
      let data: any = null;
      let error: any = null;
      
      if (isPersonalMode) {
        // Personal mode: user's data only, no family
        const result = await supabase
          .from('wallet_additions')
          .select('*')
          .eq('user_id', user.id)
          .is('family_id', null)
          .gte('date', firstDayOfMonth)
          .lte('date', lastDayOfMonth)
          .eq('is_deleted_by_user', false)
          .order('date', { ascending: false });
        data = result.data;
        error = result.error;
      } else if (activeFamilyId) {
        // Family mode: family's data only
        const familyIdValue = String(activeFamilyId);
        // @ts-ignore - TypeScript has issues with deep type inference on family_id filtering
        const result = await supabase
          .from('wallet_additions')
          .select('*')
          .eq('family_id', familyIdValue)
          .gte('date', firstDayOfMonth)
          .lte('date', lastDayOfMonth)
          .eq('is_deleted_by_user', false)
          .order('date', { ascending: false });
        data = result.data;
        error = result.error;
      } else {
        // Fallback: user's data
        const result = await supabase
          .from('wallet_additions')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', firstDayOfMonth)
          .lte('date', lastDayOfMonth)
          .eq('is_deleted_by_user', false)
          .order('date', { ascending: false });
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Error fetching wallet additions:', error);
        return [];
      }

      if (import.meta.env.DEV) {
        console.log(`✅ Found ${data?.length || 0} wallet additions for selected month`);
      }
      return data as WalletAddition[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes - mobile optimized
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true
  });

  // Query all wallet additions with optimized polling
  const { data: allWalletAdditions = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['wallet-additions-all', user?.id, isPersonalMode ? 'personal' : activeFamilyId],
    queryFn: async () => {
      if (!user) return [];

      if (import.meta.env.DEV) {
        console.log('🔄 Fetching all wallet additions');
      }
      
      // Execute query based on family context - separate queries to avoid TS type issues
      let data: any = null;
      let error: any = null;
      
      if (isPersonalMode) {
        // Personal mode: user's data only, no family
        const result = await supabase
          .from('wallet_additions')
          .select('*')
          .eq('user_id', user.id)
          .is('family_id', null)
          .eq('is_deleted_by_user', false)
          .order('date', { ascending: false });
        data = result.data;
        error = result.error;
      } else if (activeFamilyId) {
        // Family mode: family's data only
        const familyIdValue = String(activeFamilyId);
        // @ts-ignore - TypeScript has issues with deep type inference on family_id filtering
        const result = await supabase
          .from('wallet_additions')
          .select('*')
          .eq('family_id', familyIdValue)
          .eq('is_deleted_by_user', false)
          .order('date', { ascending: false });
        data = result.data;
        error = result.error;
      } else {
        // Fallback: user's data
        const result = await supabase
          .from('wallet_additions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted_by_user', false)
          .order('date', { ascending: false });
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Error fetching all wallet additions:', error);
        return [];
      }

      if (import.meta.env.DEV) {
        console.log(`✅ Found ${data?.length || 0} total wallet additions`);
      }
      return data as WalletAddition[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes - all additions change less frequently
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true
  });

  // Calculate total additions
  const totalAdditions = walletAdditions.reduce((sum, addition) => sum + Number(addition.amount), 0);

  return {
    walletAdditions,
    allWalletAdditions,
    totalAdditions,
    isLoading,
    isLoadingAll,
  };
}
