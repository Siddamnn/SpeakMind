# 🧘 SpeakMind - AI-Powered Mental Wellness Platform

<div align="center">

![SpeakMind](https://img.shields.io/badge/SpeakMind-Mental%20Wellness-9D7CF3?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-11.0-FFCA28?style=for-the-badge&logo=firebase)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite)

*A comprehensive mental wellness application combining AI coaching, meditation, journaling, and community support*

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Performance](#-performance-optimizations) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

SpeakMind is a modern mental wellness platform that leverages AI technology to provide personalized mental health support. The application offers guided meditation, AI-powered coaching, mood tracking, journaling, and community features—all designed to help users maintain their mental well-being.

### 🌟 Key Highlights

- 🤖 **AI-Powered Coaching** - Real-time conversations with Google's Gemini AI
- 🧘 **Guided Meditation** - Customizable meditation sessions with timers
- 📝 **Smart Journaling** - Emotion tracking and reflection prompts
- 🌍 **Multi-language Support** - 11 Indian languages + English
- 🎨 **6 Beautiful Themes** - Customizable color schemes and dark mode
- 🔥 **Streak Tracking** - Gamified wellness habits
- 👥 **Community Forum** - Share experiences and support others
- 📊 **EEG Integration** - Brain health monitoring (experimental)

---

## ✨ Features

### 🧠 AI Features

#### Mind Coach
- Real-time AI conversations using Google Gemini
- Context-aware responses based on your emotional state
- Voice session support for hands-free interaction
- Personalized wellness recommendations

#### AI Question Assistant
- Instant answers to mental health questions
- Evidence-based wellness guidance
- Topic suggestions and prompts

### 🧘 Meditation & Mindfulness

- **Guided Meditation Sessions** - Various durations and styles
- **Meditation Timer** - Customizable with ambient sounds
- **Emotional Release Exercises** - Targeted breathing and relaxation
- **Quick Calm Exercises** - 5-minute stress relief
- **Stretch & Focus** - Physical + mental wellness
- **Mind-Body Sync** - Holistic wellness routines

### 📝 Journaling & Tracking

- **Reflection Journal** - Daily mood and thought tracking
- **Emotion Analysis** - AI-powered sentiment detection
- **Streak System** - Build consistent wellness habits
- **Progress Visualization** - Track your wellness journey

### 🌏 Content & Learning

- **Vedic Calm** - Ancient wisdom for modern minds
- **Wisdom from Gita** - Bhagavad Gita insights
- **Midnight Relaxation** - Late-night calming content
- **Wellness Events** - Discover local and online events

### 👥 Community

- **Sharing Forum** - Connect with others on similar journeys
- **Anonymous Posting** - Share safely and comfortably
- **Real-time Updates** - Firestore-powered live discussions
- **Multi-language** - Communicate in your preferred language
- **Wellness Events** - Discover local meditation and yoga events
- **Nearby Places** - Find yoga centers, temples, and meditation organizations in your locality
  - Locality-based search for major Indian cities
  - Yoga & meditation centers nearby
  - Religious places (temples, gurudwaras, churches, mosques)
  - Major organizations (Osho, Art of Living, Isha Foundation, Brahma Kumaris)

---

## 🛠️ Tech Stack

### Frontend Framework
- **React 18.3** - Modern UI library with hooks
- **TypeScript 5.6** - Type-safe development
- **Vite 5.4** - Lightning-fast build tool

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Custom Themes** - 6 color schemes with dark mode

### Backend & Services
- **Firebase 11.0**
  - Authentication (Email, Google OAuth)
  - Firestore (Real-time database)
  - Offline persistence enabled
- **Google Gemini AI** - AI coaching and conversations
- **YouTube Data API v3** - Personalized video recommendations
- **Google Places API** - Location-based wellness center discovery
- **Serverless Functions** - API key security

### State Management
- **React Context API** - Global state (Auth, Language, Theme)
- **Custom Hooks** - Reusable logic
- **Optimized with useMemo/useCallback** - Performance-first

### Development Tools
- **ESLint** - Code quality
- **TypeScript Strict Mode** - Enhanced type safety
- **Git** - Version control

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Google AI API key (for Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ankurrawatll/SpeakMind.git
   cd SpeakMind
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   # Google AI (Gemini)
   VITE_GEMINI_API_KEY=your_gemini_api_key
   
   # YouTube Data API v3
   VITE_YOUTUBE_API_KEY=your_youtube_api_key
   
   # Google Places API (for nearby wellness centers)
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   
   # Optional: Pexels API for images
   VITE_PEXELS_API_KEY=your_pexels_key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   The app will open at `http://localhost:3000`

5. **Build for production**
   ```bash
   npm run build
   ```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password, Google)
3. Create a **Firestore Database** (Start in production mode)
4. Add security rules for Firestore:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /forum_posts/{postId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null;
         allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
       }
     }
   }
   ```

---

## ⚡ Performance Optimizations

SpeakMind is built with performance as a priority. Here are the key optimizations:

### 🎯 React Performance
- **React.memo** on frequently rendered components (BottomNavigation, ThemeToggle, LanguageToggle)
- **useMemo/useCallback** in all context providers (Auth, Language, Theme)
- **Lazy loading** for all screens and heavy components
- **Suspense boundaries** for smooth loading states

### 📦 Bundle Optimization
- **Dynamic code splitting** - Screens grouped by usage frequency
- **Vendor chunking** - React, Firebase, Framer Motion separated
- **ES2020 target** - Smaller bundles for modern browsers
- **Gzip & Brotli compression** - Automatic compression
- **Tree shaking** - Unused code eliminated

### 🚀 Build Configuration
- **Terser minification** - Optimized JavaScript
- **CSS minification** - Smaller stylesheets
- **Asset optimization** - Hashed filenames for caching
- **Modern module format** - ESM for better performance

### 📊 Results
- Initial bundle: < 200KB (gzipped)
- Fast initial load with lazy-loaded routes
- Minimal re-renders with memoization
- Excellent Lighthouse scores

---

## 🌐 Supported Languages

SpeakMind supports 12 languages out of the box:

- 🇺🇸 English
- 🇮🇳 Hindi (हिंदी)
- 🇮🇳 Bengali (বাংলা)
- 🇮🇳 Telugu (తెలుగు)
- 🇮🇳 Marathi (मराठी)
- 🇮🇳 Tamil (தமிழ்)
- 🇮🇳 Gujarati (ગુજરાતી)
- 🇮🇳 Kannada (ಕನ್ನಡ)
- 🇮🇳 Malayalam (മലയാളം)
- 🇮🇳 Punjabi (ਪੰਜਾਬੀ)
- 🇮🇳 Odia (ଓଡ଼ିଆ)

All UI text, navigation, and content adapt to the selected language.

---

## 🎨 Themes

Choose from 6 beautiful color themes:

1. **💜 Calm & Serene** (Purple) - Default
2. **🌊 Ocean & Tranquility** (Blue)
3. **🌿 Nature & Growth** (Green)
4. **🔥 Energy & Warmth** (Orange)
5. **💗 Love & Compassion** (Pink)
6. **🔮 Deep Focus** (Indigo)

Each theme includes light and dark mode variants.

---

## 📁 Project Structure

```
SpeakMind/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── exercises/       # Meditation/wellness exercises
│   │   ├── ui/             # UI primitives
│   │   ├── BottomNavigation.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── LanguageToggle.tsx
│   ├── contexts/           # React contexts (Auth, Language, Theme)
│   ├── screens/            # Main application screens
│   ├── services/           # API services (Firestore, etc.)
│   ├── utils/              # Utility functions & Logger
│   ├── config/             # Firebase & API configuration
│   ├── locales/            # Translation files (i18n)
│   ├── hooks/              # Custom React hooks
│   └── App.tsx             # Main app component
├── public/                 # Static assets
├── .env                    # Environment variables (create this)
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

---

## 🔐 Security

- ✅ Firebase Authentication with secure token management
- ✅ API keys stored in environment variables
- ✅ Serverless functions for sensitive operations
- ✅ Firestore security rules for data protection
- ✅ Input validation and sanitization
- ✅ HTTPS-only in production

---

## 🧪 Testing & Quality

### Code Quality
- **TypeScript Strict Mode** - Enhanced type safety
- **ESLint** - Code linting with React best practices
- **Prettier** - Consistent code formatting
- **No console.log in production** - Logger utility with dev-only output

### Testing
```bash
# Lint code
npm run lint

# Type check
npm run type-check

# Build (includes checks)
npm run build
```

---

## 📝 Scripts

```bash
# Development
npm run dev              # Start development server

# Production
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking

# Bundle Analysis
npm run analyze         # Visualize bundle size
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use React hooks and functional components
- Maintain consistent code style (ESLint + Prettier)
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

---

## 🐛 Known Issues & Limitations

- EEG Brain Health feature is experimental
- Some meditation content requires internet connection
- Offline mode has limited functionality
- Voice sessions require microphone permissions

---

## 🗺️ Roadmap

### Coming Soon
- [ ] Progressive Web App (PWA) support
- [ ] Push notifications for reminders
- [ ] Offline mode improvements
- [ ] More meditation content
- [ ] Social features expansion
- [ ] AI personality customization
- [ ] Export journal data
- [ ] Weekly/monthly wellness reports

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ankur Rawat**
- GitHub: [@ankurrawatll](https://github.com/ankurrawatll)

---

## 🙏 Acknowledgments

- **Google Gemini AI** - For powerful AI capabilities
- **Firebase** - For backend infrastructure
- **React Community** - For excellent documentation and tools
- **Tailwind CSS** - For beautiful styling utilities
- **Framer Motion** - For smooth animations
- **All Contributors** - Thank you for your support!

---

## 📞 Support

If you have questions or need help:
- Open an [Issue](https://github.com/ankurrawatll/SpeakMind/issues)
- Check existing documentation
- Review the code comments

---

<div align="center">

### ⭐ If you find this project helpful, please give it a star!

Made with ❤️ for mental wellness

**SpeakMind** - *Your AI-Powered Mental Wellness Companion*

</div>
