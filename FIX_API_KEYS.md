# Fix API Keys - Step by Step Guide

## The Problem
All URLs are not working - likely API keys are wrong or not set correctly in Vercel.

## Step 1: Check What Vercel Sees

After deploying, visit this URL to see EXACTLY what environment variables Vercel has:

```
https://nyu-ai-study-buddy-eugo02n15-kareem-elsenosys-projects.vercel.app/api/debug
```

This will show you:
- ✅ Which variables exist
- ✅ What values they have (preview)
- ✅ If they match expected values
- ✅ Specific recommendations

## Step 2: Verify Environment Variables in Vercel

Go to: **https://vercel.com/dashboard** → Your Project → **Settings** → **Environment Variables**

### Variable 1: PORTKEY_API_KEY
- **Name (EXACT):** `PORTKEY_API_KEY`
- **Value (EXACT):** `3QNI3x+PPoiQlnL5Jh348nMmUtz8`
- **Environments:** ✅ Production ✅ Preview ✅ Development
- **Check:**
  - No spaces: `PORTKEY_API_KEY=3QNI3x+PPoiQlnL5Jh348nMmUtz8` ✅
  - Not: `PORTKEY_API_KEY = 3QNI3x+PPoiQlnL5Jh348nMmUtz8` ❌ (spaces)
  - Not: `PORTKEY_API_KEY="3QNI3x+PPoiQlnL5Jh348nMmUtz8"` ❌ (quotes)

### Variable 2: PORTKEY_BASE_URL
- **Name (EXACT):** `PORTKEY_BASE_URL`
- **Value (EXACT):** `https://ai-gateway.apps.cloud.rt.nyu.edu/v1`
- **Environments:** ✅ Production ✅ Preview ✅ Development

### Variable 3: AI_MODEL
- **Name (EXACT):** `AI_MODEL`
- **Value (EXACT):** `@gpt-4o/gpt-4o`
- **Environments:** ✅ Production ✅ Preview ✅ Development

### Variable 4: Files_READ_WRITE_TOKEN
- **Name (EXACT):** `Files_READ_WRITE_TOKEN`
- **Value (EXACT):** `vercel_blob_rw_SQrULv5f505YfLOW_osTffHgOi4prYyTIEoFKOooYxxYrFu`
- **Environments:** ✅ Production ✅ Preview ✅ Development
- **Check:** Must start with `vercel_blob_rw_`

### Variable 5: NEXT_PUBLIC_APP_URL
- **Name (EXACT):** `NEXT_PUBLIC_APP_URL`
- **Value (EXACT):** `https://nyu-ai-study-buddy-eugo02n15-kareem-elsenosys-projects.vercel.app`
- **Environments:** ✅ Production ✅ Preview ✅ Development

## Step 3: Common Mistakes

### ❌ Wrong Variable Names
- `portkey_api_key` ❌ (lowercase)
- `PORTKEY_API_KEY` ✅ (uppercase)
- `Portkey_Api_Key` ❌ (mixed case)

### ❌ Not Set for All Environments
- Only set for Production ❌
- Must set for: Production, Preview, AND Development ✅

### ❌ Extra Spaces or Quotes
- `PORTKEY_API_KEY = value` ❌ (spaces around =)
- `PORTKEY_API_KEY="value"` ❌ (quotes)
- `PORTKEY_API_KEY=value` ✅ (no spaces, no quotes)

### ❌ Forgot to Redeploy
- Added variables but didn't redeploy ❌
- **MUST redeploy after adding/updating variables** ✅

## Step 4: After Setting Variables

1. **Redeploy:**
   - Go to **Deployments** tab
   - Click latest deployment → **"..."** → **Redeploy**
   - Turn OFF **"Use existing Build Cache"**
   - Click **Redeploy**
   - Wait 2-3 minutes

2. **Test:**
   - Visit `/api/debug` to verify variables are loaded
   - Visit `/api/health` for quick check
   - Visit `/api/test` to test Portkey connection

## Step 5: If Still Not Working

### Check Vercel Function Logs:
1. Go to **Deployments** → Latest deployment
2. Click **Functions** tab
3. Click on `/api/debug` or `/api/test`
4. Look for error messages

### Common Issues:

**Issue: Variables show as "NOT SET" in /api/debug**
- Solution: Variables not added to Vercel, or not redeployed after adding

**Issue: Variables exist but values don't match**
- Solution: Check exact spelling and value in Vercel dashboard

**Issue: 404 errors**
- Solution: Check `PORTKEY_BASE_URL` is correct
- Solution: Verify API key is valid for NYU gateway

**Issue: "Access denied" for file upload**
- Solution: Check `Files_READ_WRITE_TOKEN` starts with `vercel_blob_rw_`
- Solution: Verify token is correct from Vercel dashboard

## Quick Diagnostic URLs

After deploying, test these:

1. **Debug (shows all env vars):**
   ```
   /api/debug
   ```

2. **Health (quick check):**
   ```
   /api/health
   ```

3. **Test Portkey:**
   ```
   /api/test
   ```

## Expected Results

### /api/debug should show:
```json
{
  "status": "OK",
  "critical_checks": {
    "hasPortkeyKey": true,
    "portkeyKeyMatches": true,
    "hasPortkeyBaseUrl": true,
    "portkeyBaseUrlMatches": true,
    "hasAiModel": true,
    "aiModelMatches": true,
    "hasBlobToken": true,
    "blobTokenFormat": true
  }
}
```

### /api/test should show:
```json
{
  "success": true,
  "message": "...",
  "model": "@gpt-4o/gpt-4o"
}
```

If you see different results, follow the recommendations in the response!

