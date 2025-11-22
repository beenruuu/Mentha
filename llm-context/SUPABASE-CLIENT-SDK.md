# Supabase Python SDK Documentation

This document provides a comprehensive guide to using the Supabase Python SDK (`supabase-py`). The SDK allows you to interact with your Supabase project's Postgres database, implement authentication, manage storage, work with real-time subscriptions, and invoke Edge Functions.

## Table of Contents

- [Installation](#installation)
- [Initialization](#initialization)
- [Database Operations](#database-operations)
  - [Fetching Data](#fetching-data)
  - [Inserting Data](#inserting-data)
  - [Updating Data](#updating-data)
  - [Upserting Data](#upserting-data)
  - [Deleting Data](#deleting-data)
  - [Calling Postgres Functions](#calling-postgres-functions)
  - [Using Filters](#using-filters)
  - [Using Modifiers](#using-modifiers)
- [Authentication](#authentication)
  - [User Management](#user-management)
  - [Session Management](#session-management)
  - [OAuth & SSO](#oauth--sso)
  - [Multi-Factor Authentication](#multi-factor-authentication)
  - [Admin Functions](#admin-functions)
- [Edge Functions](#edge-functions)
- [Realtime](#realtime)
- [Storage](#storage)

## Installation

```bash
pip install supabase
```

## Initialization

Initialize the Supabase client with your project URL and public API key:

```python
from supabase import create_client

url = "https://your-project-id.supabase.co"
key = "your-supabase-api-key"
supabase = create_client(url, key)
```

## Database Operations

### Fetching Data

Retrieve data from your database tables:

```python
# Basic select
data = supabase.table('countries').select('*').execute()

# Select specific columns
data = supabase.table('countries').select('id, name').execute()

# Select with joins
data = supabase.table('countries').select('id, name, cities(id, name)').execute()
```

### Inserting Data

Add new records to your tables:

```python
# Insert a single record
data = supabase.table('countries').insert({"name": "Germany"}).execute()

# Insert multiple records
data = supabase.table('countries').insert([
    {"name": "France"},
    {"name": "Italy"}
]).execute()
```

### Updating Data

Modify existing records:

```python
data = supabase.table('countries').update({"capital": "Berlin"}).eq("name", "Germany").execute()
```

### Upserting Data

Insert records if they don't exist or update them if they do:

```python
data = supabase.table('countries').upsert({"id": 1, "name": "Germany", "capital": "Berlin"}).execute()
```

### Deleting Data

Remove records from your tables:

```python
# Delete specific records
data = supabase.table('countries').delete().eq("name", "Germany").execute()

# Delete all records (use with caution)
data = supabase.table('countries').delete().execute()
```

### Calling Postgres Functions

Execute custom PostgreSQL functions:

```python
data = supabase.rpc('get_countries_with_cities').execute()
```

### Using Filters

The SDK provides various filtering capabilities:

```python
# Equality
data = supabase.table('countries').select('*').eq('name', 'Germany').execute()

# Inequality
data = supabase.table('countries').select('*').neq('name', 'Germany').execute()

# Greater than
data = supabase.table('countries').select('*').gt('population', 1000000).execute()

# Greater than or equal to
data = supabase.table('countries').select('*').gte('population', 1000000).execute()

# Less than
data = supabase.table('countries').select('*').lt('population', 1000000).execute()

# Less than or equal to
data = supabase.table('countries').select('*').lte('population', 1000000).execute()

# Like (pattern matching)
data = supabase.table('countries').select('*').like('name', '%land%').execute()

# Case insensitive pattern matching
data = supabase.table('countries').select('*').ilike('name', '%land%').execute()

# In array
data = supabase.table('countries').select('*').in_('name', ['Germany', 'France', 'Italy']).execute()

# Contains
data = supabase.table('countries').select('*').contains('tags', ['european']).execute()

# Not filter
data = supabase.table('countries').select('*').not_('name', 'eq', 'Germany').execute()

# Or filter
data = supabase.table('countries').select('*').or_('name.eq.Germany,name.eq.France').execute()
```

### Using Modifiers

Modify your query results with various operators:

```python
# Order results
data = supabase.table('countries').select('*').order('name', ascending=True).execute()

# Limit results
data = supabase.table('countries').select('*').limit(10).execute()

# Range of results
data = supabase.table('countries').select('*').range(0, 9).execute()

# Single row
data = supabase.table('countries').select('*').single().execute()

# Maybe single row
data = supabase.table('countries').select('*').maybe_single().execute()

# Export as CSV
data = supabase.table('countries').select('*').csv().execute()

# Use explain to understand query plan
data = supabase.table('countries').select('*').explain().execute()
```

## Authentication

### User Management

Create and manage users:

```python
# Sign up a new user
user = supabase.auth.sign_up({
    "email": "example@email.com",
    "password": "example-password",
})

# Create an anonymous user
user = supabase.auth.sign_up({})

# Sign in a user
user = supabase.auth.sign_in_with_password({
    "email": "example@email.com",
    "password": "example-password",
})

# Sign in with ID token
user = supabase.auth.sign_in_with_id_token({
    "provider": "google",
    "token": "your-id-token",
})

# Sign in with OTP (One-Time Password)
supabase.auth.sign_in_with_otp({
    "email": "example@email.com",
})

# Sign out
supabase.auth.sign_out()
```

### Session Management

Handle user sessions:

```python
# Get the current session
session = supabase.auth.get_session()

# Refresh a session
session = supabase.auth.refresh_session()

# Get the current user
user = supabase.auth.get_user()

# Update user
user = supabase.auth.update_user({
    "email": "new.email@example.com",
    "password": "new-password",
    "data": {"custom_field": "custom_value"}
})
```

### OAuth & SSO

Authenticate with third-party providers:

```python
# Sign in with OAuth
supabase.auth.sign_in_with_oauth({
    "provider": "google",
    "redirect_to": "https://example.com/callback"
})

# Sign in with SSO
supabase.auth.sign_in_with_sso({
    "domain": "example.com"
})
```

### Multi-Factor Authentication

Implement MFA for enhanced security:

```python
# Enroll a factor
factor = supabase.auth.mfa.enroll({
    "factor_type": "totp",
    "issuer": "Example App",
})

# Create a challenge
challenge = supabase.auth.mfa.challenge({
    "factor_id": "factor-id",
})

# Verify a challenge
verification = supabase.auth.mfa.verify({
    "factor_id": "factor-id",
    "challenge_id": "challenge-id",
    "code": "123456",
})

# Unenroll a factor
supabase.auth.mfa.unenroll({
    "factor_id": "factor-id",
})
```

### Admin Functions

Perform administrative operations:

```python
# Get a user by ID
user = supabase.auth.admin.get_user("user-id")

# List all users
users = supabase.auth.admin.list_users()

# Create a user (admin)
user = supabase.auth.admin.create_user({
    "email": "example@email.com",
    "password": "example-password",
    "email_confirm": True
})

# Delete a user
supabase.auth.admin.delete_user("user-id")

# Send an email invite
supabase.auth.admin.invite_user_by_email("example@email.com")
```

## Edge Functions

Invoke Supabase Edge Functions:

```python
# Invoke a function
response = supabase.functions.invoke("function-name")

# Invoke with arguments
response = supabase.functions.invoke("function-name", invoke_options={
    "body": {"foo": "bar"}
})
```

## Realtime

Subscribe to real-time database changes:

```python
# Subscribe to a channel
channel = supabase.channel("channel-name")
channel.on("INSERT", lambda payload: print(payload)).subscribe()

# Unsubscribe
supabase.remove_channel("channel-name")

# Get all active channels
channels = supabase.get_channels()

# Broadcast a message
channel.send({
    "type": "broadcast",
    "event": "message",
    "payload": {"message": "Hello world!"}
})
```

## Storage

Manage files and buckets:

```python
# Create a storage bucket
bucket = supabase.storage.create_bucket("bucket-name")

# Get bucket details
bucket = supabase.storage.get_bucket("bucket-name")

# List all buckets
buckets = supabase.storage.list_buckets()

# Update bucket
bucket = supabase.storage.update_bucket("bucket-name", {"public": True})

# Delete bucket
supabase.storage.delete_bucket("bucket-name")

# Empty bucket
supabase.storage.empty_bucket("bucket-name")

# Upload a file
response = supabase.storage.from_("bucket-name").upload("file-path", "path/to/local/file")

# Download a file
file_data = supabase.storage.from_("bucket-name").download("file-path")

# List files
files = supabase.storage.from_("bucket-name").list()

# Move a file
supabase.storage.from_("bucket-name").move("old-path", "new-path")

# Copy a file
supabase.storage.from_("bucket-name").copy("source-path", "destination-path")

# Delete files
supabase.storage.from_("bucket-name").remove(["file1", "file2"])

# Create a signed URL
url = supabase.storage.from_("bucket-name").create_signed_url("file-path", 60)

# Get public URL
url = supabase.storage.from_("bucket-name").get_public_url("file-path")
```

---

This documentation is based on the [official Supabase Python documentation](https://supabase.com/docs/reference/python/introduction).