# NYU AI Study Buddy

An intelligent academic assistant for NYU Abu Dhabi students. Upload your course materials and get instant, AI-powered answers to your questions with personalized learning support.

## ✨ Features

### Core Functionality
- **Multi-format File Support**: Upload PDF, PPTX, DOCX, XLSX, and TXT files
- **AI-Powered Chat**: Get instant answers from your course materials using advanced AI models
- **Comprehensive Material Analysis**: The AI reads and analyzes ALL uploaded files, not just recent ones
- **Smart Context Selection**: Automatically finds relevant sections from your materials based on your questions

### User Experience
- **User Accounts**: Sign up, sign in, and personalize your learning experience
- **Chat History**: Save, search, and manage multiple conversation sessions
- **Model Selection**: Choose from multiple AI models (GPT-4o, Gemini 2.5 Pro, Gemini 2.5 Flash, Llama 3.1)
- **Personalization**: The AI learns your learning style, strengths, weaknesses, and study topics
- **Settings**: Comprehensive settings for appearance, chat preferences, notifications, and more

### Interface
- **Modern UI**: Professional, high-end design with NYU purple branding
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Polished hover effects and transitions throughout
- **In-App Modals**: Professional confirmation dialogs for all actions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- NYU Portkey API access (for AI gateway)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kareemmeka/NYU-AI-Study-Buddy.git
   cd NYU-AI-Study-Buddy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   PORTKEY_API_KEY=your_portkey_api_key
   PORTKEY_BASE_URL=https://ai-gateway.apps.cloud.rt.nyu.edu/v1
   AI_MODEL=@gpt-4o/gpt-4o
   Files_READ_WRITE_TOKEN=your_vercel_blob_token
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
ai-study-buddy/
├── app/
│   ├── api/                    # API routes
│   │   ├── chat/               # Chat endpoint with streaming
│   │   ├── upload/             # File upload handler
│   │   ├── files/              # File management (list, delete)
│   │   ├── generate-title/     # AI-powered chat title generation
│   │   └── health/             # Health check endpoint
│   ├── layout.tsx              # Root layout with theme provider
│   ├── page.tsx                # Main application page
│   └── globals.css             # Global styles and animations
├── components/
│   ├── auth/                   # Authentication components
│   │   ├── AuthModal.tsx       # Login/Register modal
│   │   ├── UserMenu.tsx        # User dropdown menu
│   │   └── UserProfile.tsx     # User profile and preferences
│   ├── chat/                   # Chat interface components
│   │   ├── ChatInterface.tsx   # Main chat component
│   │   ├── ChatSidebar.tsx     # Chat history sidebar
│   │   ├── Message.tsx         # Individual message component
│   │   ├── MessageInput.tsx    # Message input with model selector
│   │   ├── MessageList.tsx     # Message list with scrolling
│   │   └── TypingIndicator.tsx # AI typing animation
│   ├── files/                  # File management components
│   │   ├── FileList.tsx        # File list with upload
│   │   ├── FileItem.tsx        # Individual file card
│   │   └── FileUpload.tsx     # Drag-and-drop upload
│   ├── ui/                     # Reusable UI components
│   │   ├── button.tsx          # Button component
│   │   ├── card.tsx            # Card component
│   │   ├── ConfirmModal.tsx    # Confirmation dialog
│   │   ├── input.tsx           # Input component
│   │   ├── scroll-area.tsx     # Scrollable area
│   │   └── toast.tsx           # Toast notifications
│   ├── Header.tsx              # Navigation header
│   ├── WelcomeSection.tsx      # Welcome page content
│   ├── HelpContent.tsx         # Help documentation
│   ├── ModelSelector.tsx       # AI model selector
│   ├── SettingsModal.tsx       # Settings panel
│   └── ThemeProvider.tsx       # Theme context provider
├── lib/
│   ├── file-extractors/        # File text extraction
│   │   ├── pdf-extractor.ts    # PDF parsing
│   │   ├── pptx-extractor.ts   # PowerPoint parsing
│   │   ├── docx-extractor.ts   # Word document parsing
│   │   ├── xlsx-extractor.ts   # Excel parsing
│   │   └── index.ts            # Unified extractor interface
│   ├── portkey.ts              # Portkey AI client
│   ├── storage.ts              # Vercel Blob storage operations
│   ├── chat-history.ts          # Chat session management
│   ├── chat-export.ts           # Chat export/print functions
│   ├── user-auth.ts            # User authentication & memory
│   ├── models.ts               # AI model configuration
│   ├── settings.ts              # Application settings
│   └── utils.ts                # Utility functions
└── types/
    └── index.ts                # TypeScript type definitions
```

## 🎯 How It Works

1. **Upload Materials**: Drag and drop or select your course files (PDFs, PowerPoints, Word docs, etc.)

2. **Ask Questions**: Type your question in the chat interface

3. **AI Analysis**: The system:
   - Extracts text from all uploaded files
   - Analyzes your question for keywords and context
   - Selects relevant sections from your materials
   - Searches through ALL files, not just recent ones

4. **Get Answers**: Receive comprehensive answers with citations from your course materials

5. **Personalized Learning**: The AI remembers your preferences, learning style, and study topics to provide better assistance over time

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORTKEY_API_KEY` | Your Portkey API key for NYU gateway | `your_key_here` |
| `PORTKEY_BASE_URL` | Portkey gateway URL | `https://ai-gateway.apps.cloud.rt.nyu.edu/v1` |
| `AI_MODEL` | Default AI model to use | `@gpt-4o/gpt-4o` |
| `Files_READ_WRITE_TOKEN` | Vercel Blob storage token | `vercel_blob_rw_...` |
| `NEXT_PUBLIC_APP_URL` | Your application URL | `http://localhost:3000` |

### Available AI Models

- **GPT-4o** (`@gpt-4o/gpt-4o`) - OpenAI's most capable model
- **Gemini 2.5 Pro** (`@vertexai/gemini-2.5-pro`) - Google's advanced model
- **Gemini 2.5 Flash** (`@vertexai/gemini-2.5-flash`) - Fast and efficient
- **Gemini 2.5 Flash Lite** (`@vertexai/gemini-2.5-flash-lite`) - Fastest option
- **Llama 3.1 405B** (`@vertexai/meta.llama-3.1-405b-instruct-maas`) - Meta's largest open model

### File Limits

- Maximum file size: 50MB per file
- Supported formats: PDF, PPTX, DOCX, XLSX, TXT
- Context limit: 200,000 characters (includes all uploaded files)

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Portkey AI Gateway
- **Storage**: Vercel Blob Storage
- **UI Components**: Custom components with Lucide icons
- **State Management**: React Hooks + Local Storage

## 📝 Features in Detail

### User Accounts & Personalization
- Create account with email and name
- Set learning preferences (visual, auditory, reading, kinesthetic)
- Define academic level and major
- Track studied topics and strengths/weaknesses
- AI adapts responses based on your profile

### Chat History
- Automatic session management (like ChatGPT)
- Search through past conversations
- Export chats as text files
- Print conversations
- Delete individual chats with confirmation

### File Management
- Drag-and-drop file upload
- View all uploaded files with metadata
- Delete files with in-app confirmation
- Files persist across sessions

### Settings
- Appearance: Theme, font size, compact mode
- Chat: Auto-scroll, timestamps, enter to send
- AI Model: Default model selection
- Notifications: Sound and desktop notifications
- Privacy: Data export and clearing options

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- NYU Abu Dhabi for providing the AI gateway infrastructure
- Portkey AI for gateway services
- All the open-source libraries that make this project possible

---

Built with ❤️ for NYU Abu Dhabi students
