# Data Alchemist – Project Documentation

## Overview

**Data Alchemist** is a modern, AI-powered data operations platform built with Next.js. It enables users to upload, search, edit, validate, and auto-fix tabular data (CSV/XLSX) using both natural language and advanced AI (Gemini/OpenAI) capabilities. The UI is clean, responsive, and user-friendly, supporting both manual and AI-driven workflows.

---

## Features

### 1. File Upload & Data Management
- Upload CSV or XLSX files for Clients, Workers, and Tasks.
- Data is parsed and stored in React state for fast, in-memory operations.
- Supports dynamic switching between datasets.

### 2. Natural Language Search
- Search your data using plain English queries (e.g., “Tasks with duration > 1 and preferred in phase 2”).
- Uses Gemini AI to generate JavaScript filter functions, which are applied client-side.
- Supports advanced queries, including column:value, range, and keyword search.
- Clean, modern UI with clear feedback and example queries.

### 3. Natural Language Editor
- Edit your data using natural language instructions (e.g., “Set PriorityLevel=5 where GroupTag=Enterprise”).
- Regex-based parsing for common edit patterns.
- Shows pending changes before applying.
- Consistent, user-friendly UI.

### 4. AI Validation & Auto-Fix
- AI-powered validation of your data for inconsistencies, outliers, and logical errors.
- Suggests fixes, which can be reviewed and applied in bulk.
- Uses Gemini for generating validation logic and fixes.

### 5. AI Rule Recommendations
- Analyzes your data and suggests useful scheduling or co-run rules.
- Accept, edit, or ignore AI-suggested rules.
- Bulk operations supported.

### 6. Prioritization & Rule Builder
- Configure prioritization and custom rules for your data operations.
- Visual, interactive UI for rule creation and management.

---

## Project Structure

```
data-alchemist/
  ├── public/                # Static assets (SVGs, icons)
  ├── src/
  │   ├── app/
  │   │   ├── api/           # API routes (Next.js serverless functions)
  │   │   │   ├── ai-validation/
  │   │   │   ├── autofix/
  │   │   │   ├── rule-suggestions/
  │   │   │   ├── query-edit/
  │   │   │   └── query-filter/
  │   │   ├── layout.tsx     # App layout
  │   │   └── page.tsx       # Main page
  │   ├── components/        # All React UI components
  │   ├── lib/               # AI and utility libraries (ai.ts, gemini.ts, openai.ts)
  │   └── utils/             # Validation and helper utilities
  ├── .env.local             # Environment variables (API keys)
  ├── package.json           # Dependencies and scripts
  └── README.md              # Project overview and setup
```

---

## Key Components

- **FileUploader.tsx**: Handles CSV/XLSX upload and parsing.
- **DataGridViewer.tsx**: Displays tabular data with optional error highlighting.
- **NaturalLanguageSearch.tsx**: Main search UI, calls backend for AI-generated filters.
- **NaturalLanguageEditor.tsx**: Edit UI, parses and applies edit instructions.
- **AIRecommendations.tsx**: Shows AI-suggested rules and allows user actions.
- **AutoFixPanel.tsx**: Displays and applies AI-suggested data fixes.
- **Prioritization.tsx, RuleBuilder.tsx**: For advanced rule and priority configuration.

---

## AI Integration

- **Gemini (Google) and OpenAI** are supported for all AI features.
- API keys are stored in `.env.local` and never exposed to the client.
- All AI calls are made server-side via API routes, ensuring security.

---

## Environment Variables

- `GEMINI_API_KEY` – Your Gemini API key (required for AI features)
- `OPENAI_API_KEY` – Your OpenAI API key (optional, fallback)
- `OPENAI_MODEL` – Model name (e.g., gpt-3.5-turbo)
- `.env.local` example:
  ```
  GEMINI_API_KEY=your-gemini-api-key
  OPENAI_API_KEY=your-openai-api-key
  OPENAI_MODEL=gpt-3.5-turbo
  ```

---

## How to Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Create `.env.local` in the `data-alchemist` directory.
   - Add your API keys as shown above.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Go to [http://localhost:3000](http://localhost:3000)

---
