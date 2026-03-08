
-- Allow school_super_admin to UPDATE roles within their school (not global_super_admin role)
CREATE POLICY "School admins can update school roles"
ON public.user_roles FOR UPDATE
USING (
  has_role(auth.uid(), 'school_super_admin'::app_role)
  AND is_same_school(auth.uid(), school_id)
  AND role <> 'global_super_admin'::app_role
)
WITH CHECK (
  has_role(auth.uid(), 'school_super_admin'::app_role)
  AND role <> 'global_super_admin'::app_role
);

-- Allow school_super_admin to DELETE roles within their school
CREATE POLICY "School admins can delete school roles"
ON public.user_roles FOR DELETE
USING (
  has_role(auth.uid(), 'school_super_admin'::app_role)
  AND is_same_school(auth.uid(), school_id)
  AND role <> 'global_super_admin'::app_role
);

-- Allow global/school admins to update profiles school_id (assign user to school)
-- Already have "Admins can update school profiles" policy, but let's also allow 
-- global admins to view all profiles for user management
