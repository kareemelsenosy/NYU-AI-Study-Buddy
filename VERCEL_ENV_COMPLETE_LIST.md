# Complete Vercel Environment Variables - Copy & Paste

## All Environment Variables You Need

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add each of these (click "Add New" for each):

---

### 1. Portkey API Key
```
Key: PORTKEY_API_KEY
Value: 3QNI3x+PPoiQlnL5Jh348nMmUtz8
Description: AI Study Buddy API Key
Environment: ✅ Production ✅ Preview ✅ Development
```

---

### 2. Portkey Base URL
```
Key: PORTKEY_BASE_URL
Value: https://ai-gateway.apps.cloud.rt.nyu.edu/v1
Environment: ✅ Production ✅ Preview ✅ Development
```

---

### 3. AI Model
```
Key: AI_MODEL
Value: @gpt-4o/gpt-4o
Environment: ✅ Production ✅ Preview ✅ Development
```

---

### 4. Blob Storage Token
```
Key: Files_READ_WRITE_TOKEN
Value: vercel_blob_rw_SQrULv5f505YfLOW_osTffHgOi4prYyTIEoFKOooYxxYrFu
Environment: ✅ Production ✅ Preview ✅ Development
```

---

### 5. App URL
```
Key: NEXT_PUBLIC_APP_URL
Value: https://nyu-ai-study-buddy-eugo02n15-kareem-elsenosys-projects.vercel.app
Environment: ✅ Production ✅ Preview ✅ Development
```

---

## After Adding All 5 Variables:

1. **Save** each variable
2. Go to **Deployments** tab
3. Click latest deployment → **..."** → **Redeploy**
4. Wait 2-3 minutes

## ✅ Verification Checklist:

- [ ] PORTKEY_API_KEY added
- [ ] PORTKEY_BASE_URL added
- [ ] AI_MODEL added
- [ ] Files_READ_WRITE_TOKEN added
- [ ] NEXT_PUBLIC_APP_URL added
- [ ] All set for Production, Preview, Development
- [ ] Redeployed project

## Test After Redeploy:

1. ✅ Upload a file - should work
2. ✅ Ask AI a question - should respond
3. ✅ Check for errors in browser console (F12)

