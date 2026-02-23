# NYU AI Study Buddy

An intelligent academic assistant platform for NYU Abu Dhabi, designed to enhance learning and teaching through AI-powered course material analysis, personalized chat assistance, and comprehensive analytics. The platform serves both students and professors with role-specific dashboards and features.

## Overview

NYU AI Study Buddy is a comprehensive educational platform that leverages advanced AI models to provide instant, context-aware answers from course materials. The platform features separate dashboards for students and professors, enabling personalized learning experiences and detailed course analytics.

**Key Highlights:**
- **5 Advanced AI Models** — Choose from GPT-4o, Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash Lite, and Llama 3.1 405B
- **Student Dashboard** — Course selection, AI-powered chat, and personalized learning
- **Professor Dashboard** — Course management, analytics, and quiz generation
- **Comprehensive Analytics** — Track engagement, questions, and student activity
- **Multi-format Support** — PDF, PPTX, DOCX, XLSX, and TXT files
- **Modern UI** — Professional design with dark/light mode and responsive layout
- **Supabase Backend** — PostgreSQL database + file storage for users, courses, files, and analytics

---

## Features

### Core Functionality
- **Multi-format File Support**: Upload and analyze PDF, PPTX, DOCX, XLSX, and TXT files
- **AI-Powered Chat**: Get instant answers from course materials using advanced AI models
- **Comprehensive Material Analysis**: The AI reads and analyzes ALL uploaded files, not just recent ones
- **Smart Context Selection**: Automatically finds relevant sections from materials based on questions
- **Course-based Organization**: Materials organized by course for better context

### User Experience
- **Role-based Access**: Separate interfaces for students and professors
- **User Accounts**: Sign up with email/password or sign in with your NYU Google account
- **Chat History**: Save, search, and manage multiple conversation sessions (persisted in Supabase)
- **Model Selection**: Choose from 5 different AI models based on your needs
- **Personalization**: The AI adapts to your learning style, strengths, weaknesses, and study topics
- **Settings**: Comprehensive settings for appearance, chat preferences, and notifications

### Interface
- **Modern UI**: Professional, high-end design with NYU purple branding
- **Dark/Light Mode**: Toggle between themes with system preference detection
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Polished hover effects and transitions throughout
- **In-App Modals**: Professional confirmation dialogs for all actions

---

## Student Dashboard

The Student Dashboard provides a streamlined learning experience focused on accessing course materials and getting AI-powered assistance.

### Features:
1. **Course Selection**
   - Browse all available courses created by professors
   - Select a course to access its materials
   - View course descriptions and metadata
   - Quick access to course-specific chat

2. **AI Chat Interface**
   - Ask questions about course materials
   - Get instant, accurate answers with citations
   - Choose from 5 different AI models
   - Chat history with search functionality
   - Export and print conversations

3. **Personalized Learning**
   - AI adapts to your learning style
   - Tracks studied topics and strengths/weaknesses
   - Remembers your preferences across sessions
   - Provides tailored explanations based on your profile

4. **File Access**
   - View all course materials uploaded by professors
   - Access files organized by course
   - See file metadata (size, upload date, type)

---

## Professor Dashboard

The Professor Dashboard provides comprehensive tools for course management, analytics, and content generation.

### Course Management
- **Create Courses**: Set up new courses with names and descriptions
- **Edit Courses**: Update course information
- **Delete Courses**: Remove courses with confirmation
- **Course Organization**: Manage multiple courses simultaneously
- **File Upload**: Upload materials specific to each course
- **File Management**: View, organize, and delete course materials

### Analytics Dashboard
Comprehensive analytics to track student engagement and course performance:

#### Overview Metrics
- **Total Questions**: Count of all questions asked by students
- **Unique Students**: Number of distinct students engaging with the course
- **Active Days**: Days with student activity
- **Average Questions per Day**: Daily engagement rate

#### Visual Analytics
- **Question Activity Chart**: 30-day activity timeline with area chart
- **Peak Activity Hours**: Bar chart showing when students are most active (24-hour breakdown)
- **Top Topics Distribution**: Pie chart of most discussed topics
- **Most Frequently Asked Questions**: Ranked list of top questions with frequency counts

#### Export Features
- Download comprehensive analytics reports as text files
- Export includes all metrics, charts data, and insights
- Reports formatted for easy sharing and analysis

### Quiz Generator
AI-powered quiz generation from course materials:

- **Topic-based Generation**: Generate quizzes on specific topics or chapters
- **Customizable Questions**: Set number of questions (5-50)
- **Difficulty Levels**: Choose from Easy, Medium, or Hard
- **Multiple Choice Format**: Auto-generated with 4 options per question
- **Correct Answers**: Automatically marked with explanations
- **Export Functionality**: Download quizzes as text files
- **Course Material Integration**: Uses uploaded course files as context

### Insights Tab
- **All Courses Overview**: Compare performance across all courses
- **Top Topics & Keywords**: Visual tags showing most discussed topics
- **Engagement Insights**: Student participation rates and activity patterns
- **Question Categories**: Organized view of question types

---

## Available AI Models

The platform supports 5 advanced AI models through the NYU Portkey Gateway:

### 1. GPT-4o (`@gpt-4o/gpt-4o`)
- **Provider**: OpenAI
- **Best For**: Complex reasoning, detailed explanations, comprehensive analysis
- **Use Case**: When you need the most capable model for difficult questions

### 2. Gemini 2.5 Pro (`@vertexai/gemini-2.5-pro`)
- **Provider**: Google
- **Best For**: Advanced tasks, complex reasoning, multi-step problems
- **Use Case**: When you need Google's most advanced model for comprehensive answers

### 3. Gemini 2.5 Flash (`@vertexai/gemini-2.5-flash`)
- **Provider**: Google
- **Best For**: Fast responses with good quality, balanced performance
- **Use Case**: When you need a good balance of speed and quality

### 4. Gemini 2.5 Flash Lite (`@vertexai/gemini-2.5-flash-lite`)
- **Provider**: Google
- **Best For**: Quick, simple questions, fastest responses
- **Use Case**: When you need the fastest possible response for straightforward questions

### 5. Llama 3.1 405B (`@vertexai/meta.llama-3.1-405b-instruct-maas`)
- **Provider**: Meta
- **Best For**: Diverse tasks, open-source alternative, large context handling
- **Use Case**: When you need Meta's largest open model for varied academic tasks

**Model Selection**: Users can switch between models at any time, with the selection persisting across sessions.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- NYU Portkey API access (for the AI gateway)
- Supabase project (free tier works) — for database + file storage, see [DATABASE_SETUP_GUIDE.md](../DATABASE_SETUP_GUIDE.md)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kareemelsenosy/NYU-AI-Study-Buddy.git
   cd NYU-AI-Study-Buddy/ai-study-buddy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**

   Follow [DATABASE_SETUP_GUIDE.md](../DATABASE_SETUP_GUIDE.md) to create your free Supabase project and run the required SQL migrations.

4. **Set up environment variables**

   Create a `.env.local` file in the root of `ai-study-buddy/`:
   ```env
   # AI Gateway (NYU Portkey)
   PORTKEY_API_KEY=your_portkey_api_key
   PORTKEY_BASE_URL=https://ai-gateway.apps.cloud.rt.nyu.edu/v1
   AI_MODEL=@gpt-4o/gpt-4o

   # Supabase — Database + File Storage
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
ai-study-buddy/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/               # Google OAuth callbacks
│   │   ├── chat/               # Chat endpoint with streaming
│   │   ├── upload/             # File upload handler
│   │   ├── files/              # File management (list, delete)
│   │   ├── generate-quiz/      # AI quiz generation
│   │   ├── generate-title/     # AI-powered chat title generation
│   │   ├── portkey-config/     # Portkey configuration
│   │   ├── health/             # Health check endpoint
│   │   ├── debug/              # Debug utilities
│   │   └── test/               # Testing endpoints
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
│   │   └── FileUpload.tsx      # Drag-and-drop upload
│   ├── professor/              # Professor-specific components
│   │   ├── ProfessorAnalytics.tsx  # Analytics dashboard
│   │   └── ProfessorTools.tsx      # Tools and utilities
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
│   ├── RoleSelectionModal.tsx  # Role selection (Student/Professor)
│   ├── CourseManager.tsx       # Course management (Professors)
│   ├── CourseSelector.tsx      # Course selection (Students)
│   └── ThemeProvider.tsx       # Theme context provider
├── lib/
│   ├── file-extractors/        # File text extraction
│   │   ├── pdf-extractor.ts    # PDF parsing
│   │   ├── pptx-extractor.ts   # PowerPoint parsing
│   │   ├── docx-extractor.ts   # Word document parsing
│   │   ├── xlsx-extractor.ts   # Excel parsing
│   │   └── index.ts            # Unified extractor interface
│   ├── supabase.ts             # Supabase client (browser + server)
│   ├── portkey.ts              # Portkey AI client
│   ├── storage.ts              # Vercel Blob storage operations
│   ├── chat-history.ts         # Chat session management
│   ├── chat-export.ts          # Chat export/print functions
│   ├── user-auth.ts            # User authentication & memory (Supabase-backed)
│   ├── course-management.ts    # Course CRUD operations
│   ├── analytics.ts            # Analytics and tracking
│   ├── models.ts               # AI model configuration
│   ├── settings.ts             # Application settings
│   └── utils.ts                # Utility functions
└── types/
    └── index.ts                # TypeScript type definitions
```

---

## How It Works

### For Students:
1. **Sign In**: Use your NYU Google account or email/password
2. **Select Course**: Choose a course created by your professor
3. **Ask Questions**: Type questions about course materials in the chat
4. **AI Analysis**: The system extracts text from all course files, analyzes your question, and selects relevant sections
5. **Get Answers**: Receive comprehensive answers with citations from course materials
6. **Personalized Learning**: The AI adapts to your learning style and tracks your progress

### For Professors:
1. **Sign In**: Use your NYU Google account or email/password
2. **Create Course**: Set up a new course with name and description
3. **Upload Materials**: Add PDFs, PowerPoints, Word docs, etc. to the course
4. **Track Engagement**: View analytics dashboard to see student questions and activity
5. **Generate Quizzes**: Use AI to create quizzes from course materials
6. **Monitor Performance**: Analyze engagement patterns, peak hours, and popular topics

---

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORTKEY_API_KEY` | Portkey API key for the NYU AI gateway | `pk-...` |
| `PORTKEY_BASE_URL` | Portkey gateway URL | `https://ai-gateway.apps.cloud.rt.nyu.edu/v1` |
| `AI_MODEL` | Default AI model | `@gpt-4o/gpt-4o` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | `eyJ...` |
| `NEXT_PUBLIC_APP_URL` | Your application URL | `http://localhost:3000` |

### File Limits
- Maximum file size: 50MB per file
- Supported formats: PDF, PPTX, DOCX, XLSX, TXT
- Context limit: 200,000 characters (includes all uploaded files)

---

## Development

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
- **AI Integration**: Portkey AI Gateway (NYU)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth — email/password + NYU Google OAuth
- **Storage**: Supabase Storage
- **UI Components**: Custom components with Lucide icons
- **State Management**: React Hooks + Supabase
- **Charts**: Recharts for analytics visualization

---

## Features in Detail

### User Accounts & Authentication
- Sign up with name, email, and password
- Sign in with NYU Google account (restricted to `nyu.edu` domain)
- User data (preferences, memory, chat history) persisted in Supabase
- Set learning preferences (visual, auditory, reading, kinesthetic)
- Define academic level and major
- Track studied topics and strengths/weaknesses
- AI adapts responses based on your profile
- Role-based access (Student/Professor)

### Chat History
- Automatic session management (like ChatGPT)
- Sessions and messages stored in Supabase
- Search through past conversations
- Export chats as text files
- Print conversations
- Delete individual chats with confirmation
- AI-generated chat titles

### File Management
- Drag-and-drop file upload
- View all uploaded files with metadata
- Delete files with in-app confirmation
- Files organized by course and stored in Supabase Storage
- Files persist across sessions
- Support for multiple file formats

### Settings
- Appearance: Theme, font size, compact mode
- Chat: Auto-scroll, timestamps, enter to send
- AI Model: Default model selection
- Notifications: Sound and desktop notifications
- Privacy: Data export and clearing options

### Analytics (Professors Only)
- Real-time engagement tracking
- Question frequency analysis
- Student activity patterns
- Peak hours identification
- Topic popularity metrics
- Exportable reports

### Quiz Generation (Professors Only)
- AI-powered quiz creation
- Topic-specific generation
- Customizable difficulty and question count
- Multiple choice format
- Automatic answer key generation
- Export functionality

---

## User Interface

### Design Philosophy
- **Professional**: High-end design with NYU purple branding
- **Accessible**: WCAG-compliant with proper contrast ratios
- **Responsive**: Mobile-first design that works on all devices
- **Intuitive**: Clear navigation and user-friendly interactions
- **Modern**: Smooth animations and polished transitions

### Theme Support
- Light mode
- Dark mode
- System preference detection
- Smooth theme transitions

---

## Security & Privacy

- **Supabase Auth**: Secure authentication with Row Level Security (RLS)
- **NYU OAuth**: Google sign-in restricted to `nyu.edu` domain
- **Secure API**: All API calls use HTTPS
- **Environment Variables**: Sensitive keys stored server-side only (`SUPABASE_SERVICE_ROLE_KEY` is never exposed to the browser)
- **File Validation**: File type and size validation on upload
- **Error Handling**: Comprehensive error handling and user feedback

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
1. Follow TypeScript best practices
2. Follow React best practices
3. Maintain code consistency
4. Add comments for complex logic
5. Test your changes thoroughly

---

## License

MIT License — see LICENSE file for details

---

## Acknowledgments

- **NYU Abu Dhabi** for providing the AI gateway infrastructure
- **Portkey AI** for gateway services and multi-model support
- **Supabase** for the open-source database, auth, and storage platform
- All the open-source libraries that make this project possible

---

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built for NYU Abu Dhabi students and professors**

*Empowering education through AI technology*
