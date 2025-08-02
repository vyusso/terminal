# Firebase Setup Guide

This guide will help you set up Firebase Firestore for your terminal project.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "terminal-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Firestore Database

1. In your Firebase project, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (you can add security rules later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

## 3. Get Your Firebase Configuration

1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "terminal-web")
6. Copy the configuration object

## 4. Set Up Environment Variables

1. Copy the `env.example` file to `.env.local`:

   ```bash
   cp env.example .env.local
   ```

2. Replace the placeholder values in `.env.local` with your actual Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

## 5. Set Up Firestore Security Rules

1. In your Firebase project, go to "Firestore Database"
2. Click on the "Rules" tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users under any document
    // WARNING: This is for development only!
    // In production, you should implement proper authentication and authorization
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Security Warning**: The rules above allow anyone to read and write to your database. For production, implement proper authentication and more restrictive rules.

## 6. Test Your Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to your app and try setting a nickname
3. Check the Firebase console to see if data is being saved

## 7. Database Structure

Your Firestore will have the following collection:

### `users` Collection

- **Document ID**: IP address
- **Fields**:
  - `nickname`: string
  - `ipAddress`: string
  - `createdAt`: timestamp
  - `lastSeen`: timestamp
  - `isActive`: boolean

## 8. Production Deployment

### Vercel Deployment

1. Add your environment variables in Vercel dashboard
2. Deploy your app
3. Update Firestore security rules for production

### Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add all the Firebase environment variables from your `.env.local`

## 9. Optional: Enable Analytics

If you want to track user behavior:

1. In Firebase console, go to "Analytics"
2. Follow the setup instructions
3. Add analytics tracking to your app

## 10. Troubleshooting

### Common Issues:

1. **"Firebase App named '[DEFAULT]' already exists"**

   - This usually happens in development with hot reloading
   - The error is harmless and can be ignored

2. **"Permission denied" errors**

   - Check your Firestore security rules
   - Make sure you're in test mode or have proper rules

3. **Environment variables not working**

   - Make sure all variables start with `NEXT_PUBLIC_`
   - Restart your development server after adding variables

4. **Data not appearing in Firestore**
   - Check browser console for errors
   - Verify your Firebase configuration
   - Check network tab for failed requests

## 11. Next Steps

Once Firebase is set up, you can:

1. **Add Authentication**: Implement user login/signup
2. **Add Real-time Updates**: Use Firestore listeners for live data
3. **Add Command Logging**: Track user commands and outputs
4. **Add Session Management**: Track user sessions and activity
5. **Implement Caching**: Cache frequently accessed data
6. **Add Analytics**: Track user behavior and usage patterns

## Support

If you encounter issues:

1. Check the [Firebase Documentation](https://firebase.google.com/docs)
2. Check the [Next.js Documentation](https://nextjs.org/docs)
3. Check browser console for error messages
4. Verify your Firebase configuration values
