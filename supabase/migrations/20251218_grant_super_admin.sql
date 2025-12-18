-- 指定されたメールアドレスのユーザーを特権管理者に任命する
INSERT INTO public.admin_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'junichiro.kubo@ainomi.com'
ON CONFLICT (user_id) 
DO UPDATE SET role = 'super_admin';
