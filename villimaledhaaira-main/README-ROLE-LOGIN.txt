Villimale temporary no-login test setup

1. Upload all files in this zip to GitHub.

2. Test links:
   https://naappe.github.io/Villimale/
   https://naappe.github.io/Villimale/all-voters.html
   https://naappe.github.io/Villimale/pages/mdp-tracker.html
   https://naappe.github.io/Villimale/pages/pnc-tracker.html

3. Current mode:
   No username/password is needed.
   Data is editable during testing.
   Anyone with the site link can update phone, reach status, vote status, and remarks.

4. To turn login back on later:
   Open js/config.js
   Change:
   const TEST_MODE_NO_LOGIN = true;
   To:
   const TEST_MODE_NO_LOGIN = false;

5. Normal login users for later:

   Website username: admin
   Supabase email: naappe@gmail.com
   Rights: admin / all voters

   Website username: mdp
   Supabase email: mdp@villimale.local
   Password: mdp2024
   Rights: MDP voters only

   Website username: pnc
   Supabase email: pnc@villimale.local
   Password: pnc2024
   Rights: PNC voters only

   Only admin password reset is enabled. It sends email to naappe@gmail.com.

6. Supabase status:
   Admin, MDP, and PNC users are already created in Supabase for this project.
   The role rows are already assigned.
   The site uses Supabase Auth + RLS for real protection.

7. If you ever need to rebuild the database rules, run this file in Supabase SQL Editor:
   supabase-roles-rls.sql

Role SQL reference:

   insert into public.user_roles (user_id, role, party, can_edit, can_export)
   select id, 'admin', null, true, false
   from auth.users
   where email = 'naappe@gmail.com'
   on conflict (user_id) do update
   set role = excluded.role,
       party = excluded.party,
       can_edit = excluded.can_edit,
       can_export = excluded.can_export;

   insert into public.user_roles (user_id, role, party, can_edit, can_export)
   select id, 'member', 'MDP', true, false
   from auth.users
   where email = 'mdp@villimale.local'
   on conflict (user_id) do update
   set role = excluded.role,
       party = excluded.party,
       can_edit = excluded.can_edit,
       can_export = excluded.can_export;

   insert into public.user_roles (user_id, role, party, can_edit, can_export)
   select id, 'member', 'PNC', true, false
   from auth.users
   where email = 'pnc@villimale.local'
   on conflict (user_id) do update
   set role = excluded.role,
       party = excluded.party,
       can_edit = excluded.can_edit,
       can_export = excluded.can_export;

Rights:
admin = All Voters
member + MDP = MDP voters only
member + PNC = PNC voters only
viewer + party = view only

There are no extra page password popups now.
