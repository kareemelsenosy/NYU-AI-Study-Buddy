# AI Study Buddy - CPE Course Assistant

A production-ready Next.js web application that helps NYU Abu Dhabi students with their CPE course materials. Upload your course files (PDF, PPTX, DOCX, XLSX, TXT) and get instant AI-powered answers to your questions.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` file:
```env
PORTKEY_API_KEY=your_portkey_api_key
PORTKEY_BASE_URL=https://ai-gateway.apps.cloud.rt.nyu.edu/v1
AI_MODEL=@gpt-4o/gpt-4o
Files_READ_WRITE_TOKEN=your_vercel_blob_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Deployment to Vercel

### Required Environment Variables in Vercel:

1. **PORTKEY_API_KEY** = `3QNI3x+PPoiQlnL5Jh348nMmUtz8`
2. **PORTKEY_BASE_URL** = `https://ai-gateway.apps.cloud.rt.nyu.edu/v1`
3. **AI_MODEL** = `@gpt-4o/gpt-4o`
4. **Files_READ_WRITE_TOKEN** = `vercel_blob_rw_SQrULv5f505YfLOW_osTffHgOi4prYyTIEoFKOooYxxYrFu`
5. **NEXT_PUBLIC_APP_URL** = `https://your-app.vercel.app`

**Important:** Add all variables for Production, Preview, and Development environments.

## 🎯 Features

- ✅ Multi-format file upload (PDF, PPTX, DOCX, XLSX, TXT)
- ✅ AI-powered chat with streaming responses
- ✅ Smart context selection from course materials
- ✅ File management (upload, view, delete)
- ✅ Dark mode support
- ✅ Mobile responsive

## 📁 Project Structure

```
ai-study-buddy/
├── app/
│   ├── api/              # API routes
│   │   ├── chat/         # Chat endpoint
│   │   ├── upload/       # File upload
│   │   └── files/        # File management
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page
│   └── globals.css       # Global styles
├── components/
│   ├── chat/             # Chat components
│   ├── files/            # File components
│   └── ui/               # UI components
├── lib/
│   ├── file-extractors/  # File text extraction
│   ├── portkey.ts        # Portkey AI client
│   ├── storage.ts        # Vercel Blob storage
│   └── utils.ts          # Utilities
└── types/                # TypeScript types
```

## 🔧 Configuration

- Maximum file size: 50MB per file
- Supported formats: PDF, PPTX, DOCX, XLSX, TXT
- AI Model: GPT-4o (configurable via AI_MODEL)

## 🐛 Troubleshooting

### Check Environment Variables
Visit these endpoints to diagnose issues:
- `/api/health` - Check if environment variables are loaded
- `/api/test` - Test Portkey connection

### File Upload Not Working
- Check `Files_READ_WRITE_TOKEN` is set in Vercel
- Verify token is for READ-WRITE (not read-only)
- Check Vercel function logs for errors
- Visit `/api/health` to verify token is loaded

### AI Chat Not Working
- Verify `PORTKEY_API_KEY` is set correctly
- Check `PORTKEY_BASE_URL` matches your gateway
- Verify `AI_MODEL` is correct (should be `@gpt-4o/gpt-4o` for NYU gateway)
- Visit `/api/test` to test Portkey connection
- Check Vercel function logs for detailed errors

### Build Errors
- Ensure all environment variables are set
- Check Node.js version (18+)
- Run `npm install` again
- After adding env vars in Vercel, **redeploy** the project

## 📝 License

MIT
