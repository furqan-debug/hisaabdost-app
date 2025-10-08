export type FamilyRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'rejected';

export interface Family {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  joined_at: string;
  is_active: boolean;
  profile?: {
    full_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface FamilyInvitation {
  id: string;
  family_id: string;
  email: string;
  invited_by: string;
  invited_user_id?: string;
  inviter_name?: string;
  family_name?: string;
  member_name?: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
}

export interface FamilyContext {
  currentFamily: Family | null;
  isPersonalMode: boolean;
  activeFamilyId: string | null;
  switchToFamily: (familyId: string) => Promise<void>;
  switchToPersonal: () => Promise<void>;
  userFamilies: Family[];
  familyMembers: FamilyMember[];
  loading: boolean;
  refetch: () => Promise<void>;
}
