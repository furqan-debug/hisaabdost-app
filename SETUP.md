# HisaabDost - Detailed Setup Guide

This guide provides step-by-step instructions for setting up the HisaabDost development environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Running Locally](#running-locally)
5. [Common Issues](#common-issues)

---

## Prerequisites

### Required Software

1. **Node.js v20.15.0**
   - Install via [nvm](https://github.com/nvm-sh/nvm) (recommended):
     ```bash
     # Install nvm (if not already installed)
     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
     
     # Install and use Node.js v20.15.0
     nvm install 20.15.0
     nvm use 20.15.0
     ```
   - Or download directly from [nodejs.org](https://nodejs.org/)

2. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify: `git --version`

3. **Code Editor** (recommended)
   - [VS Code](https://code.visualstudio.com/)
   - Install recommended extensions:
     - ESLint
     - Prettier
     - Tailwind CSS IntelliSense
     - TypeScript Vue Plugin (Volar)

### Optional (for Android development)

4. **Android Studio**
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Install Android SDK (API 33+)
   - Configure `ANDROID_HOME` environment variable

5. **Java JDK 17+**
   - Download from [Oracle](https://www.oracle.com/java/technologies/downloads/) or use [OpenJDK](https://openjdk.org/)

---

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone <your-repository-url>
cd hisaabdost

# Or if you're using SSH
git clone git@github.com:your-username/hisaabdost.git
cd hisaabdost
```

### 2. Set Node Version

```bash
# If using nvm
nvm use

# This will use Node.js v20.15.0 as specified in .nvmrc
```

### 3. Install Dependencies

```bash
npm install
```

This will:
- Install all project dependencies
- Generate `package-lock.json` if it doesn't exist
- Set up the development environment

**Expected output:**
```
added 1500+ packages in 30s
```

### 4. Validate Setup

```bash
npm run validate
```

This script checks:
- ✅ Node.js version
- ✅ `.env` file existence
- ✅ Required environment variables
- ✅ Installed dependencies

---

## Supabase Configuration

### 1. Get Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Project API keys** → **anon/public** key
   - **Project Reference ID** (visible in project URL)

### 2. Create `.env` File

```bash
# Copy the example file
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `.env` and replace with your actual values:

```env
# Replace these with your actual Supabase credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Important:** 
- Never commit the `.env` file to version control
- The `.env` file is already in `.gitignore`
- Keep your keys secure and private

### 4. Verify Configuration

```bash
npm run validate
```

Should show:
```
✅ All required environment variables are configured
```

---

## Running Locally

### Start Development Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v5.4.1  ready in 500 ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Open in Browser

Navigate to: http://localhost:8080

You should see the HisaabDost login/dashboard page.

### Development Workflow

1. **Make changes** to files in `src/`
2. **See live updates** in browser (hot reload)
3. **Check console** for any errors
4. **Test features** as you develop

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

Build output will be in `dist/` directory.

---

## Common Issues

### Issue 1: "Module not found" errors

**Solution:**
```bash
# Clean install
npm run clean
npm install
```

### Issue 2: ".env file not found"

**Solution:**
```bash
# Create .env from template
cp .env.example .env

# Edit .env and add your Supabase credentials
```

### Issue 3: "Port 8080 already in use"

**Solution 1:** Kill the process using port 8080
```bash
# On macOS/Linux
lsof -ti:8080 | xargs kill

# On Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

**Solution 2:** Change the port in `vite.config.ts`:
```typescript
server: {
  host: "::",
  port: 3000, // Change this
}
```

### Issue 4: Node version mismatch

**Solution:**
```bash
# If using nvm
nvm use 20.15.0

# Or install Node.js v20.15.0 manually
nvm install 20.15.0
```

### Issue 5: Supabase connection errors

**Symptoms:**
- "Invalid API key" errors
- Database queries failing
- Auth not working

**Solution:**
1. Verify `.env` file exists and has correct values
2. Restart dev server after changing `.env`
3. Check Supabase dashboard for project status
4. Ensure API keys are from the correct project

### Issue 6: TypeScript errors

**Solution:**
```bash
# Clear TypeScript cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

### Issue 7: Build failures

**Solution:**
```bash
# Clean build artifacts
rm -rf dist .vite

# Rebuild
npm run build
```

---

## Next Steps

- **For Android development**: See [ANDROID_BUILD.md](./ANDROID_BUILD.md)
- **For contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md)
- **For project structure**: See main [README.md](./README.md)

---

## Getting Help

If you encounter issues not covered here:

1. Check the main [README.md](./README.md) troubleshooting section
2. Search existing GitHub issues
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)
   - Output of `npm run validate`

---

**Happy coding! 🚀**