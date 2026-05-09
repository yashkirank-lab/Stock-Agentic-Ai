# macOS Terminal Deployment Guide

Follow these steps to run the **APEX Broker** application on your MacBook.

## 1. Environment Preparation

### A. Open Terminal
Press `Command + Space`, type **Terminal**, and hit `Enter`.

### B. Install Homebrew (Optional but Recommended)
Homebrew is the package manager for macOS. If you don't have it, paste this into your terminal:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### C. Install Node.js
The application requires Node.js. Install it via Homebrew:
```bash
brew install node
```
*Verify installation:* `node -v` (should be v18+)

---

## 2. Launching the Application

### Step 1: Navigate to the Project Folder
Use the `cd` (change directory) command to get to your project:
```bash
cd path/to/your/cloned-repo
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Setup Environment Variables
You need a Gemini API key. Create a `.env` file directly from the terminal:
```bash
echo "GEMINI_API_KEY=YOUR_KEY_HERE" > .env
```
*Replace `YOUR_KEY_HERE` with your actual key.*

### Step 4: Run the Development Server
```bash
npm run dev
```

### Step 5: Access the Interface
Once the terminal shows `Server running on http://localhost:3000`, open your web browser (Safari, Chrome, or Brave) and go to:
**[http://localhost:3000](http://localhost:3000)**

---

## 🛠 Useful Terminal Commands for Mac

- **Stop the server**: Press `Control + C` in the terminal window.
- **Check if port 3000 is used**: `lsof -i :3000`
- **Kill process on port 3000**: `kill -9 $(lsof -t -i:3000)`
- **Update app code from GitHub**: `git pull origin main`
