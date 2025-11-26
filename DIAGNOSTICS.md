# Diagnostics Guide - Fix "Program Not Working"

## Step 1: Check Environment Variables

After deploying, visit these URLs to check if environment variables are loaded:

### Health Check
```
https://your-app.vercel.app/api/health
```

This will show:
- Which environment variables are set
- Their prefixes (without exposing full values)
- Status of each variable

### Test Portkey Connection
```
https://your-app.vercel.app/api/test
```

This will:
- Test if Portkey API is working
- Show any connection errors
- Verify the API key and model

## Step 2: Verify Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Make sure ALL of these are set:

### Required Variables:

1. **PORTKEY_API_KEY**
   - Value: `3QNI3x+PPoiQlnL5Jh348nMmUtz8`
   - ✅ Production ✅ Preview ✅ Development

2. **PORTKEY_BASE_URL**
   - Value: `https://ai-gateway.apps.cloud.rt.nyu.edu/v1`
   - ✅ Production ✅ Preview ✅ Development

3. **AI_MODEL**
   - Value: `@gpt-4o/gpt-4o`
   - ✅ Production ✅ Preview ✅ Development

4. **Files_READ_WRITE_TOKEN**
   - Value: `vercel_blob_rw_SQrULv5f505YfLOW_osTffHgOi4prYyTIEoFKOooYxxYrFu`
   - ✅ Production ✅ Preview ✅ Development

5. **NEXT_PUBLIC_APP_URL**
   - Value: `https://your-app.vercel.app`
   - ✅ Production ✅ Preview ✅ Development

## Step 3: Common Issues & Fixes

### Issue: `/api/health` shows variables as "not set"

**Fix:**
1. Go to Vercel → Environment Variables
2. Make sure variables are added for **ALL environments** (Production, Preview, Development)
3. **Redeploy** after adding variables
4. Wait 2-3 minutes for deployment

### Issue: `/api/test` shows "403 Forbidden" or "Invalid API Key"

**Possible causes:**
1. Portkey API key is wrong
2. Portkey Virtual Key not configured properly
3. Model name is incorrect

**Fix:**
1. Verify `PORTKEY_API_KEY` in Vercel matches your Portkey Virtual Key
2. Check `AI_MODEL` is exactly `@gpt-4o/gpt-4o` (for NYU gateway)
3. Verify `PORTKEY_BASE_URL` is `https://ai-gateway.apps.cloud.rt.nyu.edu/v1`

### Issue: File upload shows "Access denied"

**Fix:**
1. Verify `Files_READ_WRITE_TOKEN` is set correctly
2. Make sure it's the READ-WRITE token (starts with `vercel_blob_rw_`)
3. Check token is for the correct Blob storage

### Issue: AI chat returns blank or errors

**Check:**
1. Visit `/api/test` - does it work?
2. Check browser console (F12) for errors
3. Check Vercel function logs for detailed errors
4. Verify all environment variables are set

## Step 4: Check Vercel Function Logs

1. Go to **Vercel Dashboard → Your Project → Deployments**
2. Click on latest deployment
3. Click **Functions** tab
4. Look for errors in:
   - `/api/chat` - Chat endpoint
   - `/api/upload` - Upload endpoint
   - `/api/files` - File list endpoint

## Step 5: After Fixing Variables

1. **Redeploy** your project:
   - Go to Deployments → Latest → "..." → Redeploy
   - OR push a new commit to trigger auto-deploy

2. **Wait 2-3 minutes** for deployment

3. **Test again:**
   - Visit `/api/health` to verify variables
   - Visit `/api/test` to test Portkey
   - Try uploading a file
   - Try asking a question

## Quick Checklist

- [ ] All 5 environment variables added to Vercel
- [ ] Variables set for Production, Preview, AND Development
- [ ] Redeployed after adding variables
- [ ] `/api/health` shows all variables as "set"
- [ ] `/api/test` returns success
- [ ] File upload works
- [ ] AI chat works

## Still Not Working?

1. Check `/api/health` endpoint - what does it show?
2. Check `/api/test` endpoint - what error do you get?
3. Check Vercel function logs - any errors?
4. Verify environment variable names match exactly (case-sensitive)
5. Make sure no extra spaces in variable values

