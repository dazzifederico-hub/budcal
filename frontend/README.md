# BUDCAL - Progressive Web App

A minimalist, grayscale budget tracker optimized for Mobile Chrome and Google Calendar integration.

## Features
- **Offline First**: Works without internet (IndexedDB).
- **Google Calendar Sync**: Extracts events, learns colors, and auto-classifies transactions.
- **PWA**: Installable on Android/iOS.
- **Privacy**: No backend, all data stays on your device (and your Google Calendar).
- **Import/Export**: Download your data as ZIP.

## Setup & Development

1. **Install Dependencies**
   ```bash
   yarn install
   ```

2. **Run Locally**
   ```bash
   yarn dev
   ```

3. **Build for Production**
   ```bash
   yarn build
   ```

## Deployment to GitHub Pages

This app is ready for GitHub Pages.

### Option 1: Manual Deploy
1. Run `yarn build`.
2. Upload the contents of the `dist` folder to your hosting or `gh-pages` branch.

### Option 2: GitHub Actions (Recommended)
1. Push this code to a GitHub repository.
2. Go to Settings > Pages.
3. Select "GitHub Actions" as the source.
4. Use the "Static HTML" workflow or a Vite specific workflow.

**Important for Google Calendar:**
To make the Google Calendar sync work, you must:
1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a project and enable **Google Calendar API**.
3. Create **OAuth 2.0 Client ID** (Web Application).
4. Add your deployment URL (e.g., `https://yourname.github.io`) to **Authorized JavaScript origins**.
5. Copy the **Client ID** and paste it in the **Settings** page of the app.

## Project Structure
- `src/services/db.js`: Local database logic (IndexedDB).
- `src/services/calendar.js`: Google API integration.
- `src/pages`: Application views.
- `src/components`: Reusable UI components (Shadcn UI).

## License
MIT
