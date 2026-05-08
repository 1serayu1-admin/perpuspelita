# Enable Email Signups - Step by Step Guide

## Method 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `ajmmyxeyqjzkdtqsyqrc`

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Go to "Settings" tab

3. **Enable Signups**
   - Scroll down to "Site URL" section
   - Find "Allow new users to sign up" toggle
   - **Enable this toggle**
   - Optionally set "Site URL" to your application URL
   - Click "Save"

4. **Additional Settings**
   - In "Email" section, ensure email provider is configured
   - Set "Confirm email" toggle based on your needs
   - For testing, you can disable email confirmation

## Method 2: SQL Alternative (Limited)

```sql
-- Check current auth settings
SELECT * FROM auth.configurations WHERE key LIKE '%signup%' OR key LIKE '%email%';

-- Try to enable via SQL (may not work in all Supabase versions)
UPDATE auth.configurations SET value = 'true' WHERE key = 'signup_enabled';
```

## Method 3: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase auth update --signups-enabled=true
```

## After Enabling Signups

1. **Test the sign-up flow** in your application
2. **Check the first user** gets `global_super_admin` role automatically
3. **Verify email confirmation** works (if enabled)

## Troubleshooting

- If still disabled, refresh the Supabase Dashboard page
- Clear browser cache and try again
- Check if you have the correct permissions in the project
- Verify your project is on a paid plan if needed for certain features
