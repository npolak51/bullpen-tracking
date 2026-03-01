# Bullpen Tracker

A PWA for tracking baseball bullpen sessions. Add players to your roster, run sessions with strike zone tracking, and view history by player.

## Tech Stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** for styling
- **Supabase** for backend (database, auth)
- **PWA** (Progressive Web App) for installable mobile/desktop experience

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Copy `.env.example` to `.env`
   - Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase dashboard

3. **Create database tables**

   - In the Supabase dashboard, go to **SQL Editor**
   - Run migrations in order:
     1. Copy `supabase/migrations/20240228180000_create_tables.sql` → Run
     2. Copy `supabase/migrations/20240301010000_pitches_5x5_grid.sql` → Run

4. **Run development server**

   ```bash
   npm run dev
   ```

5. **Build for production**

   ```bash
   npm run build
   ```

## Custom App Icon

To use your own icon when adding the app to your iPhone/iPad home screen:

1. Create two PNG images:
   - **icon-192.png** — 192×192 pixels
   - **icon-512.png** — 512×512 pixels

2. Place both files in the `public/` folder.

3. Rebuild the app. The PWA manifest is already configured to use these files.

   iOS will use the 512×512 icon for the home screen. Use a square design with no transparency for best results on iOS (or use a solid background color).

- `npm run dev` – Start dev server
- `npm run build` – Build for production
- `npm run preview` – Preview production build locally
- `npm run lint` – Run ESLint
