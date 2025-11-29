# Vercel "fetch failed" Error - Complete Solutions Guide

## Problem Summary

**Error:** `AI Error: fetch failed. Please check your Portkey API key and configuration.`

**Works:** ✅ Localhost  
**Fails:** ❌ Vercel

## Root Cause

The NYU gateway (`https://ai-gateway.apps.cloud.rt.nyu.edu/v1`) is **not accessible from Vercel's servers**. This is a network connectivity issue, not a code problem.

### Why It Works Locally

- Your local machine can access NYU's internal gateway
- You might be on NYU network or VPN
- Your IP might be whitelisted

### Why It Fails on Vercel

- Vercel servers are in public cloud (AWS, etc.)
- NYU gateway is likely behind a firewall
- Vercel IPs are not whitelisted
- Gateway might require VPN access

## Solutions (In Order of Recommendation)

### Solution 1: Use Portkey Cloud ⭐ RECOMMENDED

Switch from NYU gateway to Portkey's public cloud service.

**Advantages:**
- ✅ Publicly accessible (no firewall issues)
- ✅ Works from anywhere (Vercel, local, etc.)
- ✅ No VPN required
- ✅ More reliable

**Steps:**

1. **Get Portkey Cloud API Key:**
   - Go to: https://app.portkey.ai
   - API Keys → Create/Get API Key (not Virtual Key)
   - Copy the key

2. **Update Vercel Environment Variables:**
   ```
   PORTKEY_API_KEY=your_portkey_cloud_api_key
   AI_MODEL=@vertexai/gemini-2.5-pro
   PORTKEY_BASE_URL=https://api.portkey.ai/v1
   ```

3. **Redeploy**

**Code Change:** Already implemented! Just update env vars.

---

### Solution 2: Whitelist Vercel IPs (If You Have NYU Admin Access)

If you have access to NYU IT/admin, request to whitelist Vercel IPs.

**Steps:**

1. **Get Vercel IP Ranges:**
   - Vercel uses AWS IP ranges
   - Check: https://ip-ranges.amazonaws.com/ip-ranges.json
   - Filter for Vercel regions

2. **Contact NYU IT:**
   - Request whitelisting of Vercel IP ranges
   - Provide business justification
   - May take time for approval

3. **Alternative:** Use Vercel's static IP (if available)

**Note:** This requires admin access and may not be possible.

---

### Solution 3: Use Proxy/VPN (Not Recommended)

Set up a proxy server that can access NYU gateway.

**Disadvantages:**
- ❌ Complex setup
- ❌ Additional costs
- ❌ Performance overhead
- ❌ Maintenance burden

---

### Solution 4: Improve Error Messages (Already Done)

Better error messages to help diagnose the issue.

**What's Fixed:**
- ✅ More detailed error logging
- ✅ Network error detection
- ✅ Timeout handling
- ✅ Better error messages for users

---

## Immediate Fix: Switch to Portkey Cloud

### Step-by-Step

1. **Get Portkey Cloud API Key:**
   ```
   https://app.portkey.ai → API Keys → Create API Key
   ```

2. **Update Vercel Environment Variables:**
   - Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   - Update:
     ```
     PORTKEY_API_KEY=your_portkey_cloud_key
     PORTKEY_BASE_URL=https://api.portkey.ai/v1
     AI_MODEL=@vertexai/gemini-2.5-pro
     ```
   - Set for: Production, Preview, Development

3. **Redeploy:**
   - Deployments → Latest → Redeploy
   - Or wait for auto-deploy

4. **Test:**
   - Try sending a chat message
   - Check Vercel function logs
   - Should work now!

---

## Diagnostic Steps

### Check Current Configuration

1. **View Vercel Logs:**
   - Vercel Dashboard → Your Project → Functions → `/api/chat` → Logs
   - Look for error messages

2. **Test Endpoint:**
   ```
   https://your-app.vercel.app/api/portkey-config
   ```
   - Shows current configuration
   - Tests connection

3. **Check Environment Variables:**
   ```
   https://your-app.vercel.app/api/debug
   ```
   - Shows all env vars (masked)

### Common Issues

1. **Missing Environment Variables:**
   - Check all vars are set in Vercel
   - Ensure they're set for Production environment

2. **Wrong API Key:**
   - Using Virtual Key instead of API Key
   - Virtual Keys only work with specific gateways

3. **Network Timeout:**
   - NYU gateway takes too long to respond
   - Vercel times out (30s default)

---

## Code Changes Made

### 1. Improved Error Handling
- Better network error detection
- More detailed logging
- Timeout handling

### 2. Better Error Messages
- User-friendly error messages
- Actionable suggestions
- Clear explanation of the issue

### 3. Enhanced Logging
- Logs environment (Vercel vs Local)
- Logs region
- Logs error types
- Helps diagnose issues

---

## Testing

### Test Locally:
```bash
npm run dev
# Try chat - should work
```

### Test on Vercel:
1. Deploy
2. Try chat
3. Check logs
4. Should work with Portkey Cloud

---

## Recommended Action

**Switch to Portkey Cloud** - It's the easiest and most reliable solution.

1. Get Portkey Cloud API key
2. Update Vercel env vars
3. Redeploy
4. Done! ✅

---

## Support

If issues persist:
1. Check Vercel function logs
2. Check `/api/portkey-config` endpoint
3. Verify environment variables
4. Test with Portkey Cloud

