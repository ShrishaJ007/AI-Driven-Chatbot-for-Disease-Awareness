# Quick Setup Guide

## Prerequisites Check

Ensure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Python 3.8+ installed (`python --version`)
- [ ] Supabase account created
- [ ] Supabase project created

## Step-by-Step Setup

### 1. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_FLASK_API_URL=http://localhost:5000
```

**Where to find these values:**
1. Go to your Supabase project dashboard
2. Click on "Project Settings" (gear icon)
3. Go to "API" section
4. Copy "Project URL" for `VITE_SUPABASE_URL`
5. Copy "anon public" key for `VITE_SUPABASE_ANON_KEY`

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Setup Backend

```bash
cd backend
python -m venv venv

# On Mac/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

pip install -r requirements.txt
cd ..
```

### 4. Database Setup

The database schema has already been created via Supabase migrations. You should see three tables in your Supabase dashboard:
- `healthprofiles`
- `symptomentries`
- `diseasepredictions`

If not, the migrations will auto-run when the app connects.

### 5. Run the Application

You need TWO terminal windows:

**Terminal 1 - Frontend:**
```bash
npm run dev
```
Frontend runs at: http://localhost:5173

**Terminal 2 - Backend:**
```bash
cd backend

# Activate virtual environment first
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

python app.py
```
Backend runs at: http://localhost:5000

### 6. Access the Application

Open your browser and go to: http://localhost:5173

## Quick Test

1. **Create Account**: Click "Get Started" and sign up
2. **Setup Profile**: Complete your health profile
3. **Test Chatbot**: Go to "Symptom Checker" and describe symptoms
4. **View History**: Check your prediction history

## Troubleshooting

### Frontend won't start
- Make sure `.env` file exists with valid Supabase credentials
- Run `npm install` again
- Check if port 5173 is already in use

### Backend won't start
- Activate virtual environment first
- Make sure Flask and flask-cors are installed: `pip install -r requirements.txt`
- Check if port 5000 is already in use

### Database errors
- Verify Supabase credentials in `.env`
- Check if tables exist in Supabase dashboard
- Verify RLS policies are enabled

### Chatbot not responding
- Make sure backend is running on port 5000
- Check browser console for errors
- Verify `VITE_FLASK_API_URL` in `.env` is correct

## Default Ports

- Frontend: 5173
- Backend: 5000
- Supabase: Uses your project URL

## Next Steps

1. Customize the disease database in `backend/app.py`
2. Add more symptoms to the symptom extraction logic
3. Enhance the UI with your branding
4. Deploy to production

## Production Deployment Notes

**Frontend:**
- Build: `npm run build`
- Deploy `dist/` folder to any static hosting (Vercel, Netlify, etc.)
- Update `.env` with production backend URL

**Backend:**
- Deploy Flask app to any Python hosting (Heroku, Railway, etc.)
- Set environment variable for production mode
- Update CORS settings for production domain

**Database:**
- Already hosted on Supabase
- No additional setup needed
- Consider upgrading plan for production traffic

## Support

If you encounter issues:
1. Check this guide again
2. Review the full README.md
3. Check the browser console for errors
4. Check terminal output for error messages
