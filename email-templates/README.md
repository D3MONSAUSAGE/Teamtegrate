# Email Template Configuration Guide

## Overview
This directory contains custom email templates for your application's authentication flow.

## Setup Instructions

### 1. Access Supabase Dashboard
Go to your Supabase project dashboard at:
`https://supabase.com/dashboard/project/zlfpiovyodiyecdueiig`

### 2. Configure Email Templates

1. Navigate to **Authentication** → **Email Templates** in the left sidebar
2. Find the **"Change Email Address"** template
3. Click **Edit** on this template

### 3. Update the Template

**Subject Line:**
```
Confirm Your New Email Address - {{.SiteName}}
```

**Email Body:**
Copy and paste the contents of `change-email.html` from this directory into the email body field.

**Important Variables:**
The template uses these Supabase variables:
- `{{ .Email }}` - The new email address
- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .SiteName }}` - Your site name

### 4. Configure Redirect URLs

1. Navigate to **Authentication** → **URL Configuration**
2. Add your callback URL to the **Redirect URLs** list:
   ```
   https://your-domain.com/auth/callback
   ```
   For development:
   ```
   http://localhost:8080/auth/callback
   ```

3. Ensure your **Site URL** is set correctly:
   - Production: `https://your-domain.com`
   - Development: `http://localhost:8080`

### 5. Email Provider Settings

1. Navigate to **Authentication** → **Providers** → **Email**
2. Ensure **"Confirm email"** is **ENABLED**
3. Set rate limits as needed (recommended: 3 emails per hour)

### 6. Customize Branding (Optional)

Edit the `change-email.html` file to customize:
- Company name/logo
- Color scheme (update HSL color values)
- Support email address
- Footer information

### 7. Test the Flow

1. Go to Settings in your app
2. Change your email address
3. Verify you receive the branded email
4. Click the confirmation link
5. Verify you're redirected to the callback page
6. Confirm the email change is successful

## Troubleshooting

### Email Not Received
- Check spam folder
- Verify email provider is configured in Supabase
- Check rate limits haven't been exceeded
- Use the "Resend Email" button in Settings

### Redirect Errors
- Ensure callback URL is added to Redirect URLs list
- Verify the URL format is correct (include protocol: https://)
- Check browser console for any JavaScript errors

### Template Not Updating
- Clear browser cache
- Wait 5 minutes for Supabase to propagate changes
- Check that you saved the template in Supabase Dashboard

## Additional Templates

You can use the same pattern for other auth emails:
- **Password Recovery** - `recovery.html` (create this if needed)
- **Magic Link** - `magic_link.html` (create this if needed)
- **Email Confirmation** - `confirmation.html` (create this if needed)

## Support

For issues with:
- **Email delivery**: Check Supabase email logs
- **Template rendering**: Contact Supabase support
- **App functionality**: Check browser console and network tab
