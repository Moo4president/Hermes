# Hermes.AI - Business Analysis Tool

A business intelligence platform that helps companies identify pain points, discover nearby service providers, and receive AI-powered actionable advice using Anthropic's Claude AI.

## Tech Stack

- **Frontend**: Vite + Vanilla JavaScript
- **Backend**: Supabase Edge Functions (Deno runtime)
- **AI**: Anthropic Claude (claude-sonnet-4-5-20250929)
- **Database**: Supabase

## Features

- Business pain point analysis
- Nearby service provider discovery
- AI-generated actionable business advice
- Automated email template generation for outreach
- Real-time business insights powered by Claude AI

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## Setup Instructions

### 1. Clone or Download the Project

```bash
git clone <your-repository-url>
cd <project-directory>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

#### Obtain an Anthropic API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (it starts with `sk-ant-`)

#### Create .env File

Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Security Warning**: Never commit your `.env` file to version control. The `.gitignore` file already excludes it.

## Running the Backend (Supabase Edge Functions)

### Option 1: Deploy to Supabase (Recommended)

1. **Set the Anthropic API Key as a Secret**

   Edge Functions need the API key set as a secret in Supabase:

   ```bash
   supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

2. **Deploy the Edge Function**

   ```bash
   supabase functions deploy analyze
   ```

3. **Verify Deployment**

   Your function will be available at:
   ```
   https://<your-project-ref>.supabase.co/functions/v1/analyze
   ```

### Option 2: Run Locally

1. **Start Supabase Locally**

   ```bash
   supabase start
   ```

2. **Set Local Environment Variables**

   Create a `.env` file in `supabase/functions/analyze/`:

   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

3. **Serve the Edge Function**

   ```bash
   supabase functions serve analyze
   ```

   The function will be available at:
   ```
   http://localhost:54321/functions/v1/analyze
   ```

## Running the Frontend

### Development Mode

Start the Vite development server:

```bash
npm run dev
```

The application will open at `http://localhost:5173` (or the next available port).

### Production Build

Build the project for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
.
├── index.html              # Main HTML file with embedded styles
├── main.js                 # Frontend application logic
├── counter.js              # Utility module
├── style.css               # Additional styles
├── package.json            # Node.js dependencies
├── .env                    # Environment variables (not committed)
├── .gitignore              # Git ignore rules
├── public/                 # Static assets
│   └── Hermes.webp         # Logo image
└── supabase/
    └── functions/
        └── analyze/
            └── index.ts    # Edge Function for AI analysis
```

## How It Works

1. **User Input**: Users enter their business name, address, industry, and pain points through the web interface
2. **AI Analysis**: The frontend sends data to the Supabase Edge Function
3. **Claude Processing**: The Edge Function uses Anthropic's Claude AI to:
   - Find nearby service providers
   - Generate actionable business advice
   - Create personalized email templates
4. **Results Display**: The frontend displays the AI-generated insights in a clean, organized interface

## Troubleshooting

### API Key Issues

- **Error: "ANTHROPIC_API_KEY not configured"**
  - Ensure you've set the secret using `supabase secrets set ANTHROPIC_API_KEY=...`
  - Verify the API key is valid and hasn't expired
  - Check that you're using the correct API key format (starts with `sk-ant-`)

### Connection Issues

- **Frontend can't reach backend**
  - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correctly set in `.env`
  - Check that the Edge Function is deployed and running
  - Ensure CORS headers are properly configured (already included in the code)

### Build Issues

- **npm install fails**
  - Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
  - Ensure you're using Node.js v16 or higher

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key (for Edge Function) | Yes |

## License

This project is provided as-is for educational and commercial use.

## Support

For issues or questions, please refer to the documentation or contact your development team.
