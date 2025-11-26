# Vercel Blob Token Types - Important!

## Token Types

Vercel Blob storage has different token types:

1. **READ-ONLY Token** - Can only read/list files
2. **READ-WRITE Token** - Can read, write, and delete files ✅ **YOU NEED THIS ONE**

## For File Uploads, You Need READ-WRITE Token

The error "Access denied" happens when you use a READ-ONLY token for uploads.

## How to Get READ-WRITE Token

### Option 1: From Blob Storage Settings

1. Go to **Vercel Dashboard** → **Storage** → **nyu-ai-study-buddy-blob**
2. Click **Settings** tab
3. Look for **Tokens** or **Environment Variables** section
4. Find **READ-WRITE TOKEN** (not just "read token")
5. Copy the token that says "READ-WRITE" or "Read/Write"

### Option 2: Generate New Token

1. In Blob storage settings
2. Look for **"Generate Token"** or **"Create Token"**
3. Select **"Read/Write"** permissions (not just "Read")
4. Generate and copy the token

### Option 3: Check Environment Variables in Blob Storage

1. In Blob storage → **Settings**
2. Look for **"Environment Variables"** section
3. You should see:
   - `BLOB_READ_WRITE_TOKEN` (this is what you need)
   - Or `Files_READ_WRITE_TOKEN`
4. Copy the READ-WRITE token (not the read-only one)

## Add to Vercel Environment Variables

Once you have the READ-WRITE token:

1. Go to **Vercel Project** → **Settings** → **Environment Variables**
2. Add:
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: (your READ-WRITE token)
   - **Environment**: ✅ Production ✅ Preview ✅ Development
3. **Save**
4. **Redeploy**

## Verify Token Type

The READ-WRITE token should:
- Start with `vercel_blob_rw_` (rw = read-write)
- NOT start with `vercel_blob_r_` (r = read-only)

## Your Current Token

You mentioned: `vercel_blob_rw_SQrULv5f505YfLOW_osTffHgOi4prYyTIEoFKOooYxxYrFu`

This looks like a READ-WRITE token (has `rw` in it), so it should work. Make sure:
1. It's added to Vercel environment variables
2. It's the exact token from Blob storage settings
3. It's set for all environments
4. You've redeployed after adding it

## Still Getting "Access Denied"?

1. Double-check you're using the READ-WRITE token (not read-only)
2. Verify token in Vercel env vars matches Blob storage settings
3. Make sure token is for the correct Blob storage (nyu-ai-study-buddy-blob)
4. Try regenerating the token in Blob storage
5. Check Vercel function logs for detailed error

