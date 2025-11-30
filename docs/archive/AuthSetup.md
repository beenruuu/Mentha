# Authentication Provider Setup Guide

This guide provides instructions for configuring authentication providers in Supabase for your full-stack application. The boilerplate supports multiple authentication methods, including OAuth providers like Google and LinkedIn.

## Table of Contents

- [Prerequisites](#prerequisites)
- [General Setup Steps](#general-setup-steps)
- [Google OAuth](#google-oauth)
- [LinkedIn OAuth](#linkedin-oauth)
- [Additional Providers](#additional-providers)
  - [GitHub](#github)
  - [Twitter/X](#twitter-x)
  - [Apple](#apple)
- [Email/Password Authentication](#email-password-authentication)
- [Advanced Configuration](#advanced-configuration)

## Prerequisites

Before setting up authentication providers:

1. Create a [Supabase](https://supabase.com) account and project
2. Set up your application's `.env` file with your Supabase credentials:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

## General Setup Steps

For all OAuth providers, you'll need to:

1. Register your application with the provider
2. Configure the callback URL
3. Add the provider credentials to Supabase

The general callback URL format for Supabase is:
```
https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
```

## Google OAuth

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add a name for your OAuth client
7. Add the following authorized redirect URI:
   ```
   https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
   ```
8. Click "Create" to generate your Client ID and Client Secret

### Step 2: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" in the list of providers and click "Edit"
4. Toggle the "Enabled" switch to on
5. Enter your Google Client ID and Client Secret
6. Save your changes

### Step 3: Update Application Code

The boilerplate already includes Google authentication in the frontend code:

```typescript
// frontend/services/supabase.ts
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}
```

## LinkedIn OAuth

### Step 1: Create LinkedIn OAuth Credentials

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click "Create App" to create a new application
3. Fill in the required information for your app
4. Under the "Auth" tab, add the following OAuth 2.0 Redirect URL:
   ```
   https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
   ```
5. Request the following OAuth scopes:
   - `r_emailaddress`
   - `r_liteprofile`
6. Note your Client ID and Client Secret

### Step 2: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "LinkedIn" in the list of providers and click "Edit"
4. Toggle the "Enabled" switch to on
5. Enter your LinkedIn Client ID and Client Secret
6. Save your changes

### Step 3: Update Application Code

The boilerplate already includes LinkedIn authentication in the frontend code:

```typescript
// frontend/services/supabase.ts
export async function signInWithLinkedIn() {
  return supabase.auth.signInWithOAuth({
    provider: 'linkedin',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}
```

## Additional Providers

### GitHub

#### Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details
4. Set the Authorization callback URL to:
   ```
   https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
   ```
5. Register the application and note your Client ID
6. Generate a Client Secret and note it down

#### Step 2: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "GitHub" in the list of providers and click "Edit"
4. Toggle the "Enabled" switch to on
5. Enter your GitHub Client ID and Client Secret
6. Save your changes

#### Step 3: Add to Application Code

Add GitHub authentication to your frontend code:

```typescript
// Add to frontend/services/supabase.ts
export async function signInWithGitHub() {
  return supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}
```

### Twitter/X

#### Step 1: Create Twitter App

1. Go to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. In your app settings, set up User Authentication
4. Set the callback URL to:
   ```
   https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
   ```
5. Request the necessary permissions (read email)
6. Note your API Key and API Secret

#### Step 2: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Twitter" in the list of providers and click "Edit"
4. Toggle the "Enabled" switch to on
5. Enter your Twitter API Key and API Secret
6. Save your changes

#### Step 3: Add to Application Code

Add Twitter authentication to your frontend code:

```typescript
// Add to frontend/services/supabase.ts
export async function signInWithTwitter() {
  return supabase.auth.signInWithOAuth({
    provider: 'twitter',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}
```

### Apple

Setting up Apple Sign-In is more complex due to additional requirements:

1. You need an Apple Developer account ($99/year)
2. You must have a domain and verify ownership
3. You need to generate and manage certificates

For detailed instructions, refer to the [Supabase Apple Login Guide](https://supabase.com/docs/guides/auth/social-login/auth-apple).

## Email/Password Authentication

To enable email/password authentication:

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Email" in the list of providers and click "Edit"
4. Configure your preferred settings:
   - Enable/disable "Confirm email"
   - Set up email templates
   - Configure security options
5. Save your changes

## Advanced Configuration

For more advanced authentication configuration, such as:
- Custom email templates
- Custom redirect URLs
- Multi-factor authentication
- Role-based access control

Refer to the [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth).