# HisaabDost - Financial Management App

A production-ready financial management application built with React, Vite, Supabase, and Capacitor for web and Android platforms.

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Backend**: Supabase (Database, Auth, Storage)
- **Styling**: Tailwind CSS + shadcn/ui
- **Mobile**: Capacitor 7
- **State Management**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.15.0 (use nvm: `nvm use`)
- **npm**: v10+ (comes with Node.js)
- **Git**: Latest version
- **Android Studio**: (only if building for Android)
- **Java JDK**: 17+ (for Android builds)

## 🎯 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd hisaabdost
```

### 2. Use Correct Node Version

```bash
nvm use
# If you don't have nvm, install Node.js v20.15.0 manually
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Supabase credentials
# Get these from: https://supabase.com/dashboard/project/_/settings/api
```

Your `.env` file should contain:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id_here
```

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## 🏗️ Build Commands

### Web Build

```bash
# Production build
npm run build

# Development build
npm run build:dev

# Preview production build
npm run preview
```

### Android Build

See [ANDROID_BUILD.md](./ANDROID_BUILD.md) for detailed Android build instructions.

```bash
# Sync Capacitor (after making changes)
npm run cap:sync

# Run on Android device/emulator
npm run cap:run:android

# Build Android APK
npm run cap:build:android
```

## 📁 Project Structure

```
hisaabdost/
├── src/
│   ├── components/          # React components
│   │   └── ui/             # shadcn/ui components
│   ├── pages/              # Page components
│   ├── services/           # API and business logic
│   │   └── sync/          # Offline sync services
│   ├── integrations/       # Third-party integrations
│   │   └── supabase/      # Supabase client & types
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom React hooks
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── android/               # Capacitor Android project (generated)
├── scripts/               # Build and setup scripts
├── capacitor.config.ts    # Capacitor configuration
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind configuration
├── .env.example           # Environment variables template
└── .nvmrc                 # Node version specification
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run setup` | Validate setup and install dependencies |
| `npm run clean` | Clean install (removes node_modules, dist, build) |
| `npm run validate` | Validate environment setup |
| `npm run cap:sync` | Sync Capacitor with latest build |
| `npm run cap:run:android` | Run on Android device/emulator |
| `npm run cap:build:android` | Build Android APK |

## 🌐 Environment Setup

### Development

The app uses environment variables for configuration. Never commit the `.env` file.

**Required Variables:**
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID

### Validation

Run the setup validation script to check your environment:

```bash
npm run validate
```

This will check:
- ✅ Node.js version (v20.15.0)
- ✅ `.env` file exists
- ✅ Required environment variables are set
- ✅ Dependencies are installed

## 📱 Mobile Development (Android)

### First-Time Setup

1. Install [Android Studio](https://developer.android.com/studio)
2. Install Android SDK (API 33 or higher)
3. Set up `ANDROID_HOME` environment variable
4. Add Android platform:
   ```bash
   npx cap add android
   ```

### Development Workflow

1. Make changes to your React code
2. Build the project: `npm run build`
3. Sync with Capacitor: `npx cap sync`
4. Run on device: `npm run cap:run:android`

### Production Build

See [ANDROID_BUILD.md](./ANDROID_BUILD.md) for complete instructions on:
- Setting up signing keys
- Building release APK/AAB
- Publishing to Google Play Store

## 🐛 Troubleshooting

### Common Issues

**1. "Module not found" errors**
```bash
npm run clean
npm install
```

**2. Environment variables not working**
- Ensure `.env` file exists in project root
- Restart dev server after changing `.env`
- Check that variables start with `VITE_`

**3. Capacitor sync fails**
```bash
npm run build
npx cap sync
```

**4. Android build errors**
- Check Android Studio is installed
- Verify `ANDROID_HOME` is set
- Run `cd android && ./gradlew clean`

**5. Port 8080 already in use**
```bash
# Kill the process using port 8080
# Or change port in vite.config.ts
```

### Getting Help

- Check [SETUP.md](./SETUP.md) for detailed setup instructions
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
- Open an issue on GitHub for bugs or questions

## 🔒 Security

- Never commit `.env` files
- Keep Supabase keys secure
- Use RLS (Row Level Security) in Supabase
- Validate all user inputs
- Keep dependencies updated

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## 📄 License

This project is private and proprietary.

## 🔗 Links

- **Project URL**: https://lovable.dev/projects/ccb1b398-4ebf-47e1-ac45-1522f307f140
- **Supabase Dashboard**: https://supabase.com/dashboard/project/bklfolfivjonzpprytkz
- **Documentation**: See `/docs` folder for detailed documentation
