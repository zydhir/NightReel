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

## Adsterra ads
All four Adsterra units (**Social Bar**, **Native Banner**, **160×300 Sidebar Banner**, and **Smartlink**) are pre-configured in `js/ads.js` and `index.html`:
- **Manage live:** Open `#admin` → **Ads** to toggle the master switch or individual ad formats, adjust Smartlink behaviour/cooldown, or swap Adsterra tag URLs anytime (synced via Supabase `site_config` key `ads`).
- **Automatic protections:** Sign-in (`#auth`), Admin (`#admin`), legal pages, and Kids profiles stay ad-free automatically.

## Embedded players

The Play button and episode list open a third-party player. The centered chooser switches between CineSrc, Cinextream and Vidy and remembers the selection in the browser. All use TMDB IDs; TV URLs include season and episode. The site accent color is passed to all three providers. CineSrc and Vidy support restoring a saved timestamp; Cinextream may start from the beginning because its documentation does not specify a resume parameter. Playback and progress events depend on the providers and can change or be unavailable. Switching providers reloads the video. Select TV episodes from Nightreel; Vidy’s built-in episode selector is disabled because its documentation does not specify episode-change events. Confirm that you have the rights to embed and stream the content, and review the providers' terms and privacy practices before deployment.
