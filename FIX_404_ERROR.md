# Fix Portkey 404 Error

## The Problem
"404 - page could not be found in portkey" - This means the API endpoint URL is incorrect.

## Possible Causes

### 1. Wrong Base URL
The base URL might be incorrect for the NYU gateway.

**Current:** `https://ai-gateway.apps.cloud.rt.nyu.edu/v1`

**Try these alternatives:**
- `https://ai-gateway.apps.cloud.rt.nyu.edu` (without /v1)
- Check with NYU IT for the correct gateway URL

### 2. Wrong API Key Format
The API key might need to be in a different format.

**Current:** `3QNI3x+PPoiQlnL5Jh348nMmUtz8`

**Check:**
- Is this the Virtual Key API key from Portkey dashboard?
- Does it start with `pk-` or similar?
- Is it the correct key for the NYU gateway?

### 3. Model Name Format
The model name might need to be different.

**Current:** `@gpt-4o/gpt-4o`

**Try:**
- `gpt-4o` (without @ prefix)
- `gpt-4o-2024-08-06` (full model name)
- Check Portkey dashboard for exact model name

## Quick Fixes

### Fix 1: Verify Base URL

1. Check with NYU IT or Portkey admin for correct gateway URL
2. Update `PORTKEY_BASE_URL` in Vercel:
   - Go to Settings → Environment Variables
   - Edit `PORTKEY_BASE_URL`
   - Try: `https://ai-gateway.apps.cloud.rt.nyu.edu` (without /v1)
   - Or: Check with admin for correct URL
3. Redeploy

### Fix 2: Check API Key

1. Go to Portkey Dashboard
2. Verify your Virtual Key API key
3. Make sure it's the key for the NYU gateway
4. Update in Vercel if different
5. Redeploy

### Fix 3: Check Model Name

1. Go to Portkey Dashboard → Your Virtual Key
2. Check the exact model name configured
3. Update `AI_MODEL` in Vercel to match exactly
4. Redeploy

## Test After Fixes

Visit: `/api/test`

**Expected:** `{"success": true, ...}`

**If still 404:**
- Check Vercel function logs for exact error
- Verify base URL with NYU IT
- Check Portkey Virtual Key configuration

## Contact NYU IT

If the base URL is wrong, contact NYU IT and ask:
- "What is the correct base URL for the AI gateway?"
- "Is it `https://ai-gateway.apps.cloud.rt.nyu.edu/v1` or different?"
- "What format should the API key be in?"

## Alternative: Use Portkey Cloud

If NYU gateway doesn't work, you might need to use Portkey's cloud service:
- Base URL: `https://api.portkey.ai/v1` (default Portkey)
- But you'd need a Portkey cloud account

