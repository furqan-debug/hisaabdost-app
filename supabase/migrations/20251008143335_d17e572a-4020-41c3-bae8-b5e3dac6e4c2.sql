-- Add member_name column to family_invitations table
ALTER TABLE public.family_invitations 
ADD COLUMN IF NOT EXISTS member_name TEXT;

COMMENT ON COLUMN public.family_invitations.member_name IS 'Name of the member being invited, set by the family owner';