# Supabase Setup Guide

This guide explains how to set up the backend database for the WBS Management App using Supabase.

## 1. Create a Supabase Project

1.  Go to [Supabase](https://supabase.com/) and sign in.
2.  Click **"New Project"**.
3.  Choose your organization, give it a **Name** (e.g., `wbs-app`), set a **Database Password** (keep it safe), and choose a **Region** (e.g., `Tokyo`).
4.  Click **"Create new project"**.

## 2. Run the SQL Schema

Once your project is created (it might take a minute):

1.  Go to the **SQL Editor** (icon on the left sidebar looking like a terminal `>_`).
2.  Click **"+ New query"**.
3.  Copy the content of the `supabase/schema.sql` file in this repository.
    - [Click here to view schema.sql](supabase/schema.sql)
4.  Paste the SQL into the editor.
5.  Click **"Run"** (bottom right).
    - You should see "Success. No rows returned."

This creates the `projects` table needed to store your data.

## 3. Get API Keys

1.  Go to **Project Settings** (gear icon ⚙️ at the bottom of the sidebar).
2.  Click **"API"**.
3.  Look for **Project URL** and **anon / public** key.

## 4. Set Environment Variables

### On your local machine (Windows/Mac):

1.  Create a file named `.env.local` in the root folder of the project (same level as `package.json`).
2.  Add the URL and Key you found in step 3:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL_HERE
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

*Replace `YOUR_PROJECT_URL_HERE` and `YOUR_ANON_KEY_HERE` with your actual values.*

### 5. Restart the App

If the app is running, stop it (Ctrl+C) and start it again:

```bash
npm run dev
```

Your app is now connected to Supabase! Data you create will be saved to the cloud.
