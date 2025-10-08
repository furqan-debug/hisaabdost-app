import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Family, FamilyMember, FamilyContext } from '@/types/family';
import { toast } from 'sonner';

const FamilyContextInstance = createContext<FamilyContext | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);

  // Fetch user's profile to get active_family_id
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('active_family_id')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Set active family from profile
  useEffect(() => {
    if (profile?.active_family_id) {
      setActiveFamilyId(profile.active_family_id);
    } else if (profile?.active_family_id === null) {
      // User has explicitly set to personal mode
      setActiveFamilyId(null);
    }
  }, [profile]);

  // Fetch user's families
  const { data: userFamilies = [], isLoading: familiesLoading } = useQuery({
    queryKey: ['families', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          family_id,
          families (
            id,
            name,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return (data || [])
        .map(item => item.families)
        .filter((f): f is Family => f !== null);
    },
    enabled: !!user?.id,
  });

  // Fetch current family members
  const { data: familyMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['family-members', activeFamilyId],
    queryFn: async () => {
      if (!activeFamilyId) return [];
      
      // First get family members
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('id, family_id, user_id, role, joined_at, is_active')
        .eq('family_id', activeFamilyId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });
      
      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      // Then get profiles for each member
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, avatar_url')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;

      // Combine the data
      return members.map(member => ({
        ...member,
        profile: profiles?.find(p => p.id === member.user_id) ? {
          full_name: profiles.find(p => p.id === member.user_id)!.full_name,
          display_name: profiles.find(p => p.id === member.user_id)!.display_name,
          avatar_url: profiles.find(p => p.id === member.user_id)!.avatar_url,
        } : undefined,
      })) as FamilyMember[];
    },
    enabled: !!activeFamilyId,
  });

  // Mutation to switch family context
  const switchFamilyMutation = useMutation({
    mutationFn: async (familyId: string | null) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ active_family_id: familyId })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: (_, familyId) => {
      setActiveFamilyId(familyId);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['monthly_income'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-additions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-additions-all'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-summary'] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success(familyId ? 'Switched to family context' : 'Switched to personal context');
    },
    onError: (error) => {
      toast.error('Failed to switch context');
      console.error('Switch family error:', error);
    },
  });

  const currentFamily = userFamilies.find(f => f.id === activeFamilyId) || null;
  const isPersonalMode = !activeFamilyId;

  const switchToFamily = async (familyId: string) => {
    await switchFamilyMutation.mutateAsync(familyId);
  };

  const switchToPersonal = async () => {
    await switchFamilyMutation.mutateAsync(null);
  };

  const refetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ['families', user?.id] });
    await queryClient.invalidateQueries({ queryKey: ['family-members', activeFamilyId] });
  };

  return (
    <FamilyContextInstance.Provider
      value={{
        currentFamily,
        isPersonalMode,
        activeFamilyId,
        switchToFamily,
        switchToPersonal,
        userFamilies,
        familyMembers,
        loading: familiesLoading || membersLoading,
        refetch,
      }}
    >
      {children}
    </FamilyContextInstance.Provider>
  );
}

export function useFamilyContext() {
  const context = useContext(FamilyContextInstance);
  if (context === undefined) {
    throw new Error('useFamilyContext must be used within a FamilyProvider');
  }
  return context;
}
