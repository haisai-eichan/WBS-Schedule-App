# WBS Management App

WBS (Work Breakdown Structure) management application for website production directors.

## Getting Started

### 1. Prerequisite
- Node.js (v18 or later recommended)
- npm (installed with Node.js)

### 2. Clone the repository
```bash
git clone https://github.com/haisai-eichan/WBS-Schedule-App.git
cd WBS-Schedule-App
```

### 3. Install dependencies
Run the following command to install the required packages.
```bash
npm install
# or
yarn install
```

### 4. Environment Setup (.env.local)
This application requires Supabase environment variables.
Create a file named `.env.local` in the root directory and add your Supabase keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
*Note: If you don't have these keys, ask the project administrator.*

### 5. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Troubleshooting (Windows)

If you encounter issues on Windows:

1.  **"Script not found" or "Command not recognized"**: Ensure you have Node.js installed and added to your PATH.
2.  **Powershell Execution Policy**: If you see permission errors, try running VS Code or Powershell as Administrator, or check your execution policy (`Set-ExecutionPolicy RemoteSigned`).
3.  **Missing Modules**: If you get "Module not found", delete `node_modules` and `package-lock.json`, then run `npm install` again.
