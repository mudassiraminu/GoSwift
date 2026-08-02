# Use the uploaded scooter-rider icon as the GOSwift logo

Adopt the uploaded violet app-icon artwork (delivery rider on a scooter over a "G" mark) as the official GOSwift brand mark across the app.

## Where it appears

- **Splash screen (`/`)** — replace the icon-composed `HeroArt` centrepiece with the real logo, kept floating with the existing motion. The animated route line, drifting van and pulsing pin stay as supporting vector detail.
- **Auth screen (`/auth`) and reset-password** — swap the generic `Package` glyph in the header for the logo mark.
- **Site header** — same swap for the `Package` icon next to the wordmark.
- **Favicon** — a downscaled square copy at `public/favicon.png`, wired into the root route's `links`, replacing the default `favicon.ico` (which then gets deleted).
- **Home-screen icon (iOS/Android)** — an `apple-touch-icon` link plus a small web app manifest so installing GOSwift to the home screen shows this icon.
- **theme-color** — change from white to the GOSwift violet so the status bar matches the icon.

## Technical notes

- The uploaded PNG is registered through the asset CLI as `src/assets/goswift-logo.png.asset.json` and imported by URL, so the binary is not committed into the repo.
- The favicon is the exception: a real resized 64x64 PNG in `public/`, generated from the upload.
- A small `<AppLogo />` component wraps the image with size and alt text so every usage stays consistent.
- No backend, auth, or routing changes.