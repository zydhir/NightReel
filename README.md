# Nightreel

Movie, series and anime discovery site: trending titles, where to watch, trailers, your list and stats.
Plain HTML/CSS/JS with no build step. Data from [TMDB](https://www.themoviedb.org/); accounts and sync by Supabase.

## Deploy on Netlify
1. Netlify → **Add new site → Import an existing project → GitHub** → pick this repo.
2. Leave the build command empty; publish directory is `.` (already set in `netlify.toml`). Deploy.

## After the first deploy (Supabase dashboard)
- **Authentication → URL Configuration:** set **Site URL** to your Netlify address and add it to **Redirect URLs**, or Google/Discord sign-in won't return to the site.
- **Authentication → Sign In / Up:** turn **Confirm email** on and connect a real SMTP sender before opening sign-ups to the public.

## Files
`index.html` loads the styles in `css/` and the scripts in `js/` **in a fixed order**. Later files build on earlier ones, so keep that order.
