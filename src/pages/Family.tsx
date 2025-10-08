import { useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

export default function Family() {
  const { userFamilies, familyMembers, currentFamily, refetch, switchToFamily } = useFamilyContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

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
    onError: (error) => {
      toast.error('Failed to create family');
      console.error('Create family error:', error);
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!currentFamily?.id) throw new Error('No family selected');
      const { data, error } = await supabase.functions.invoke('invite-family-member', {
        body: { familyId: currentFamily.id, email },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, email) => {
      toast.success(`Invitation sent to ${email}!`);
      toast.info('They will see the invitation in their Family page', { duration: 4000 });
      setInviteEmail('');
      setInviteDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add member');
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
    onError: (error) => {
      toast.error('Failed to remove member');
      console.error('Remove member error:', error);
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Header with Context Switcher */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 backdrop-blur-sm border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                <Users className="h-9 w-9 text-primary" />
                Family Management
              </h1>
              <p className="text-muted-foreground text-base">
                Manage your families and shared expenses seamlessly
              </p>
            </div>
            <div className="flex items-center gap-3">
            <FamilySwitcher />
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Family
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Family</DialogTitle>
                  <DialogDescription>
                    Create a family account to share expenses with other members
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="family-name">Family Name</Label>
                    <Input
                      id="family-name"
                      placeholder="e.g., Smith Family"
                      value={newFamilyName}
                      onChange={(e) => setNewFamilyName(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => createFamilyMutation.mutate(newFamilyName)}
                    disabled={!newFamilyName.trim() || createFamilyMutation.isPending}
                  >
                    Create Family
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:inline-grid h-auto p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
              {familyMembers.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {familyMembers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Invitations</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            {/* Family Stats */}
            {currentFamily && (
              <FamilyStats
                memberCount={familyMembers.length}
                familyName={currentFamily.name}
                createdAt={currentFamily.created_at}
              />
            )}

            {/* Your Families */}
            <Card className="backdrop-blur-sm border-muted">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Your Families</CardTitle>
                    <CardDescription className="mt-1.5">
                      {userFamilies.length === 0
                        ? 'You are not part of any family yet'
                        : `You are part of ${userFamilies.length} ${userFamilies.length === 1 ? 'family' : 'families'}`}
                    </CardDescription>
                  </div>
                  {userFamilies.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">{userFamilies.length}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {userFamilies.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                      <Users className="relative h-20 w-20 mx-auto text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No families yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Create your first family to start tracking shared expenses and collaborate with others
                    </p>
                    <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Your First Family
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {userFamilies.map((family) => (
                      <FamilyCard
                        key={family.id}
                        family={family}
                        isActive={currentFamily?.id === family.id}
                        memberCount={getFamilyMemberCount(family.id)}
                        onSwitch={() => switchToFamily(family.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6 animate-fade-in">
            {currentFamily ? (
              <>
                <Card className="backdrop-blur-sm border-muted">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl flex items-center gap-2">
                          {currentFamily.name} Members
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <Users className="h-3.5 w-3.5 text-primary" />
                            <span className="text-sm font-medium text-primary">{familyMembers.length}</span>
                          </div>
                        </CardTitle>
                        <CardDescription className="text-base">
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
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Member
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Family Member</DialogTitle>
                              <DialogDescription>
                                Enter the email address of an existing Hisaab Dost user
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="invite-email">Email Address</Label>
                                <Input
                                  id="invite-email"
                                  type="email"
                                  placeholder="member@example.com"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                />
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => inviteMemberMutation.mutate(inviteEmail)}
                                disabled={!inviteEmail.trim() || inviteMemberMutation.isPending}
                              >
                                Send Invitation
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="backdrop-blur-sm border-muted">
                <CardContent className="text-center py-16 px-4">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                    <Users className="relative h-20 w-20 mx-auto text-muted-foreground/40" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Family Selected</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Switch to a family context to view and manage members
                  </p>
                  <FamilySwitcher />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-6 animate-fade-in">
            <PendingInvitations />
            <SentInvitations />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
