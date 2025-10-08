import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface PendingInvitation {
  id: string;
  family_id: string;
  family_name: string;
  inviter_name: string;
  invited_by: string;
  member_name?: string;
  expires_at: string;
  created_at: string;
}

export const usePendingInvitations = () => {
  const queryClient = useQueryClient();

  // Real-time subscription for invitation updates
  useEffect(() => {
    console.log("🔔 Setting up real-time subscription for invitations");
    
    const channel = supabase
      .channel("family-invitations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "family_invitations",
        },
        (payload) => {
          console.log("🔔 Real-time invitation update received:", payload);
          console.log("🔔 Event type:", payload.eventType);
          console.log("🔔 Payload data:", payload.new);
          
          // Refetch invitations when changes occur
          queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
          
          // Show toast for new invitations
          if (payload.eventType === "INSERT") {
            toast({
              title: "New Family Invitation",
              description: "You have a new family invitation!",
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("🔔 Real-time subscription status:", status);
      });

    return () => {
      console.log("🔔 Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: invitations = [], isLoading, error, refetch } = useQuery({
    queryKey: ["pending-invitations"],
    queryFn: async () => {
      console.log("🔔 [QUERY] Starting to fetch pending invitations...");
      const { data: { user } } = await supabase.auth.getUser();
      console.log("🔔 [QUERY] Current user:", user?.id, "Email:", user?.email);
      
      if (!user) {
        console.log("🔔 [QUERY] No user authenticated, returning empty array");
        return [];
      }

      console.log("🔔 [QUERY] Querying family_invitations table with filters:");
      console.log("  - invited_user_id:", user.id);
      console.log("  - status: pending");
      console.log("  - expires_at > now()");
      
      const { data, error } = await supabase
        .from("family_invitations")
        .select("id, family_id, family_name, inviter_name, invited_by, member_name, expires_at, created_at")
        .eq("invited_user_id", user.id)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("🔔 [QUERY] Error fetching invitations:", error);
        console.error("🔔 [QUERY] Error details:", JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log("🔔 [QUERY] Successfully fetched invitations:", data?.length || 0);
      if (data && data.length > 0) {
        console.log("🔔 [QUERY] Invitation details:", JSON.stringify(data, null, 2));
      }
      
      return data as PendingInvitation[];
    },
  });

  const acceptInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      console.log("🚀 Accepting invitation:", invitationId);
      const { data, error } = await supabase.functions.invoke("accept-family-invitation", {
        body: { invitationId },
      });

      if (error) {
        console.error("❌ Accept invitation error:", error);
        throw error;
      }
      console.log("✅ Invitation accepted:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Success",
        description: "You've joined the family successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    },
  });

  const rejectInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase.functions.invoke("reject-family-invitation", {
        body: { invitationId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
      toast({
        title: "Invitation Declined",
        description: "You've declined the family invitation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject invitation",
        variant: "destructive",
      });
    },
  });

  return {
    invitations,
    isLoading,
    error,
    refetch,
    acceptInvitation: acceptInvitation.mutate,
    rejectInvitation: rejectInvitation.mutate,
    isAccepting: acceptInvitation.isPending,
    isRejecting: rejectInvitation.isPending,
  };
};
