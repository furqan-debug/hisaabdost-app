-- Allow family members to view each other's basic profile information
-- This is needed for displaying member names in the family management UI
CREATE POLICY "Family members can view each other's basic profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Allow viewing own profile
  auth.uid() = id
  OR
  -- Allow viewing profiles of users in the same family
  EXISTS (
    SELECT 1 FROM public.family_members fm1
    INNER JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid()
      AND fm2.user_id = profiles.id
      AND fm1.is_active = true
      AND fm2.is_active = true
  )
);