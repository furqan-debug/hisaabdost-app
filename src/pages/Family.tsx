import { useEffect, useState } from 'react';
import { useFamilyContext } from '@/hooks/useFamilyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Search, Mail, Activity } from 'lucide-react';
import { PendingInvitations } from '@/components/family/PendingInvitations';
import { SentInvitations } from '@/components/family/SentInvitations';
import { FamilyCard } from '@/components/family/FamilyCard';
import { MemberCard } from '@/components/family/MemberCard';
import { FamilyStats } from '@/components/family/FamilyStats';
import { FamilySwitcher } from '@/components/family/FamilySwitcher';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth';
import { FamilyRole } from '@/types/family';
import { useNavigate } from 'react-router-dom';

export default function Family() {
  const { userFamilies, familyMembers, currentFamily, refetch, switchToFamily, switchToPersonal, activeFamilyId } = useFamilyContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteMemberName, setInviteMemberName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

  // Force close all dialogs on mount and cleanup any lingering overlays
  useEffect(() => {
    // Reset all dialog states
    setLeaveDialogOpen(false);
    setDeleteDialogOpen(false);
    setCreateDialogOpen(false);
    setInviteDialogOpen(false);
    
    // Force cleanup any lingering dialog overlays
    const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-alert-dialog-overlay]');
    overlays.forEach(overlay => overlay.remove());
    
    // Reset body styles that might be set by dialogs
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
    
    return () => {
      setLeaveDialogOpen(false);
      setDeleteDialogOpen(false);
      setCreateDialogOpen(false);
      setInviteDialogOpen(false);
    };
  }, []);

  // Fetch user roles for all families
  const { data: userRoles = {}, refetch: refetchRoles } = useQuery({
    queryKey: ['user-family-roles', user?.id],
    queryFn: async () => {
      if (!user?.id || userFamilies.length === 0) return {};
      
      const familyIds = userFamilies.map(f => f.id);
      const { data, error } = await supabase
        .from('family_members')
        .select('family_id, role')
        .eq('user_id', user.id)
        .in('family_id', familyIds)
        .eq('is_active', true);
      
      if (error) throw error;
      
      const rolesMap: Record<string, FamilyRole> = {};
      data?.forEach(item => {
        rolesMap[item.family_id] = item.role as FamilyRole;
      });
      return rolesMap;
    },
    enabled: !!user?.id && userFamilies.length > 0,
  });

  const createFamilyMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id) {
        throw new Error('You must be logged in to create a family');
      }

      const { data, error } = await supabase.functions.invoke('create-family', {
        body: { name },
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to create family');
      }

      if (!data?.family) {
        throw new Error('No family data returned');
      }

      return data.family;
    },
    onSuccess: () => {
      toast.success('Family created successfully!');
      setNewFamilyName('');
      setCreateDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || '';
      
      if (errorMessage.includes('logged in')) {
        toast.error('Please log in to create a family');
      } else if (errorMessage.includes('already exists')) {
        toast.error('A family with this name already exists');
      } else {
        toast.error('Unable to create family', {
          description: 'Please try again or contact support if the problem continues.',
        });
      }
      console.error('Create family error:', error);
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async ({ memberName, email }: { memberName: string; email: string }) => {
      if (!currentFamily?.id) throw new Error('No family selected');
      const { data, error } = await supabase.functions.invoke('invite-family-member', {
        body: { familyId: currentFamily.id, memberName, email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, { memberName }) => {
      toast.success(`Invitation sent to ${memberName}!`);
      toast.info('They will see the invitation in their Family page', { duration: 4000 });
      setInviteMemberName('');
      setInviteEmail('');
      setInviteDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      // Parse the error to provide user-friendly messages
      const errorMessage = error?.message || '';
      
      if (errorMessage.includes('permission') || errorMessage.includes('don\'t have permission')) {
        toast.error('Only family owners and admins can invite members', {
          description: 'Ask your family owner to promote you to admin or have them send the invitation.',
          duration: 5000,
        });
      } else if (errorMessage.includes('already exists') || errorMessage.includes('already a member')) {
        toast.error('This person is already a family member');
      } else if (errorMessage.includes('invitation already sent') || errorMessage.includes('pending invitation')) {
        toast.error('An invitation has already been sent to this email');
      } else if (errorMessage.includes('invalid email')) {
        toast.error('Please enter a valid email address');
      } else {
        toast.error('Unable to send invitation', {
          description: errorMessage || 'Please try again or contact support if the problem persists.',
        });
      }
      console.error('Invite member error:', error);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('family_members')
        .update({ is_active: false })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Member removed successfully');
      refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || '';
      
      if (errorMessage.includes('permission')) {
        toast.error('Only family owners and admins can remove members');
      } else if (errorMessage.includes('not found')) {
        toast.error('Member not found');
      } else {
        toast.error('Unable to remove member', {
          description: 'Please try again or contact support if the problem persists.',
        });
      }
      console.error('Remove member error:', error);
    },
  });

  const leaveFamilyMutation = useMutation({
    mutationFn: async (familyId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: membership, error: fetchError } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', familyId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('family_members')
        .update({ is_active: false })
        .eq('id', membership.id);
      
      if (error) throw error;
    },
    onSuccess: async (_, familyId) => {
      if (activeFamilyId === familyId) {
        await switchToPersonal();
      }

      // Close dialog and navigate after a short delay to allow overlays to unmount
      setLeaveDialogOpen(false);
      setSelectedFamilyId(null);
      setTimeout(() => {
        navigate('/app/dashboard', { replace: true });
      }, 60);

      // Fire-and-forget cache updates
      queryClient.invalidateQueries({ queryKey: ['families', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      queryClient.invalidateQueries({ queryKey: ['user-family-roles', user?.id] });

      toast.success('You have left the family');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || '';
      
      if (errorMessage.includes('authenticated')) {
        toast.error('Please log in to leave a family');
      } else if (errorMessage.includes('not found') || errorMessage.includes('not a member')) {
        toast.error('You are not a member of this family');
      } else if (errorMessage.includes('owner')) {
        toast.error('Family owners cannot leave', {
          description: 'Please transfer ownership or delete the family instead.',
        });
      } else {
        toast.error('Unable to leave family', {
          description: 'Please try again or contact support if the problem continues.',
        });
      }
      console.error('Leave family error:', error);
    },
  });

  const deleteFamilyMutation = useMutation({
    mutationFn: async (familyId: string) => {
      // Delete the family (cascade will handle members and other related data)
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', familyId);
      
      if (error) throw error;
    },
    onSuccess: async (_, familyId) => {
      if (activeFamilyId === familyId) {
        await switchToPersonal();
      }

      // Close dialog and navigate after a short delay to allow overlays to unmount
      setDeleteDialogOpen(false);
      setSelectedFamilyId(null);
      setTimeout(() => {
        navigate('/app/dashboard', { replace: true });
      }, 60);

      // Fire-and-forget cache updates
      queryClient.invalidateQueries({ queryKey: ['families', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      queryClient.invalidateQueries({ queryKey: ['user-family-roles', user?.id] });

      toast.success('Family deleted successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || '';
      
      if (errorMessage.includes('permission')) {
        toast.error('Only family owners can delete families');
      } else if (errorMessage.includes('not found')) {
        toast.error('Family not found');
      } else {
        toast.error('Unable to delete family', {
          description: 'Please try again or contact support if the problem persists.',
        });
      }
      console.error('Delete family error:', error);
    },
  });

  // Get member count for each family
  const getFamilyMemberCount = (familyId: string) => {
    // This would ideally come from a real query, but for now we use current family members
    if (currentFamily?.id === familyId) {
      return familyMembers.length;
    }
    return 0; // Placeholder - in production, fetch this per family
  };

  // Filter members based on search
  const filteredMembers = familyMembers.filter(member => {
    const displayName = member.profile?.display_name || member.profile?.full_name || '';
    return displayName.toLowerCase().includes(memberSearchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Clean Header */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  Family Management
                </h1>
                <p className="text-muted-foreground">
                  Manage families and track shared expenses
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <FamilySwitcher />
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 sm:flex-none">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Family
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Family</DialogTitle>
                      <DialogDescription>
                        Start a new family to share and manage expenses together
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="family-name">
                          Family Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="family-name"
                          placeholder="e.g., Smith Family"
                          value={newFamilyName}
                          onChange={(e) => setNewFamilyName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newFamilyName.trim()) {
                              createFamilyMutation.mutate(newFamilyName);
                            }
                          }}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => createFamilyMutation.mutate(newFamilyName)}
                        disabled={!newFamilyName.trim() || createFamilyMutation.isPending}
                      >
                        {createFamilyMutation.isPending ? 'Creating...' : 'Create Family'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Clean Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border">
              <TabsList className="w-full sm:w-auto inline-flex h-12 items-center justify-start rounded-none bg-transparent p-0 gap-6">
                <TabsTrigger 
                  value="overview" 
                  className="gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                >
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="members" 
                  className="gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Members</span>
                  <span className="sm:hidden">Team</span>
                  {currentFamily && familyMembers.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {familyMembers.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="invitations" 
                  className="gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 font-medium text-muted-foreground transition-all data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Invitations</span>
                  <span className="sm:hidden">Invites</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              {/* Family Stats */}
              {currentFamily && (
                <FamilyStats
                  memberCount={familyMembers.length}
                  familyName={currentFamily.name}
                  createdAt={currentFamily.created_at}
                />
              )}

              {/* Your Families */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Your Families</CardTitle>
                      <CardDescription className="mt-1">
                        {userFamilies.length === 0
                          ? 'You are not part of any family yet'
                          : `Managing ${userFamilies.length} ${userFamilies.length === 1 ? 'family' : 'families'}`}
                      </CardDescription>
                    </div>
                    {userFamilies.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">{userFamilies.length}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {userFamilies.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No families yet</h3>
                      <p className="text-muted-foreground mb-6 text-sm max-w-sm mx-auto">
                        Create your first family to start tracking shared expenses
                      </p>
                      <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Your First Family
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                      {userFamilies.map((family) => {
                        const userRole = userRoles[family.id];
                        const isOwner = userRole === 'owner';
                        
                        return (
                          <FamilyCard
                            key={family.id}
                            family={family}
                            isActive={currentFamily?.id === family.id}
                            memberCount={getFamilyMemberCount(family.id)}
                            onSwitch={() => switchToFamily(family.id)}
                            onSettings={isOwner ? () => {
                              setSelectedFamilyId(family.id);
                              setDeleteDialogOpen(true);
                            } : undefined}
                            onLeave={!isOwner ? () => {
                              setSelectedFamilyId(family.id);
                              setLeaveDialogOpen(true);
                            } : undefined}
                          />
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="mt-6 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              {currentFamily ? (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            {currentFamily.name} Members
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
                              <Users className="h-3.5 w-3.5 text-primary" />
                              <span className="text-sm font-semibold text-primary">{familyMembers.length}</span>
                            </div>
                          </CardTitle>
                          <CardDescription>
                            Manage family members and their roles
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search members..."
                              value={memberSearchQuery}
                              onChange={(e) => setMemberSearchQuery(e.target.value)}
                              className="pl-9 w-full sm:w-[200px]"
                            />
                          </div>
                          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                            <DialogTrigger asChild>
                              <Button className="whitespace-nowrap">
                                <Plus className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Add Member</span>
                                <span className="sm:hidden">Add</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Invite Family Member</DialogTitle>
                                <DialogDescription>
                                  Enter the member's name and their email address. Only family owners and admins can send invitations.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="invite-name">
                                    Member Name <span className="text-destructive">*</span>
                                  </Label>
                                  <Input
                                    id="invite-name"
                                    type="text"
                                    placeholder="e.g., John Smith"
                                    value={inviteMemberName}
                                    onChange={(e) => setInviteMemberName(e.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    This name will be displayed throughout the app
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="invite-email">
                                    Email Address <span className="text-destructive">*</span>
                                  </Label>
                                  <Input
                                    id="invite-email"
                                    type="email"
                                    placeholder="member@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Must be a registered user
                                  </p>
                                </div>
                                <Button
                                  className="w-full"
                                  onClick={() => inviteMemberMutation.mutate({ memberName: inviteMemberName, email: inviteEmail })}
                                  disabled={!inviteMemberName.trim() || !inviteEmail.trim() || inviteMemberMutation.isPending}
                                >
                                  {inviteMemberMutation.isPending ? 'Sending Invitation...' : 'Send Invitation'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {familyMembers.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                            <Users className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No members yet</h3>
                          <p className="text-muted-foreground mb-6 text-sm max-w-sm mx-auto">
                            Invite members to start collaborating on expenses
                          </p>
                          <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Invite First Member
                          </Button>
                        </div>
                      ) : filteredMembers.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <p className="text-muted-foreground">No members found matching "{memberSearchQuery}"</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredMembers.map((member) => {
                            const canRemove = member.role !== 'owner' && member.user_id !== user?.id;
                            return (
                              <div key={member.id}>
                                {canRemove ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <div>
                                        <MemberCard
                                          member={member}
                                          canRemove={canRemove}
                                          isCurrentUser={member.user_id === user?.id}
                                          onRemove={() => {}}
                                        />
                                      </div>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to remove this member from the family?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => removeMemberMutation.mutate(member.id)}
                                        >
                                          Remove
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : (
                                  <MemberCard
                                    member={member}
                                    canRemove={canRemove}
                                    isCurrentUser={member.user_id === user?.id}
                                    onRemove={() => {}}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Family Selected</h3>
                    <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
                      Select a family from the dropdown to view and manage members
                    </p>
                    <FamilySwitcher />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Invitations Tab */}
            <TabsContent value="invitations" className="mt-6 space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <PendingInvitations />
              <SentInvitations />
            </TabsContent>
          </Tabs>

          {/* Leave Family Confirmation Dialog */}
          <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave Family?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to leave this family? You will lose access to all shared data and expenses.
                  You can only rejoin if invited again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedFamilyId(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => selectedFamilyId && leaveFamilyMutation.mutate(selectedFamilyId)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={leaveFamilyMutation.isPending}
                >
                  {leaveFamilyMutation.isPending ? 'Leaving...' : 'Leave Family'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Family Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Family?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this family? This action cannot be undone. All family data,
                  expenses, budgets, and member associations will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedFamilyId(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => selectedFamilyId && deleteFamilyMutation.mutate(selectedFamilyId)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteFamilyMutation.isPending}
                >
                  {deleteFamilyMutation.isPending ? 'Deleting...' : 'Delete Family'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
