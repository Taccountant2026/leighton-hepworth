# Leighton Hepworth — personal website

An independent, buildless static website for `leightonhepworth.com`, using the approved LH Business Group logo. This is a dedicated project. It does not share a repository, deployment, backend, database, analytics stream or runtime dependency with the other businesses.

## Files

- `dist/index.html`: personal profile, businesses, project workbench, studies and contact routing.
- `dist/styles.css`: responsive navy, champagne-gold and ivory identity.
- `dist/app.js`: accessible mobile navigation, project filters, project-note dialogs, contact routing and copy-link button.
- `dist/analytics.js`: this website's GA4 measurement ID `G-80ZJ15H2XX`, with basic consent mode and a first-party cookie choice.
- `dist/assets/`: independently stored approved logo assets and local Inter font files; font licence included.
- `.openai/hosting.json`: this site's separate native hosting identity.

The other businesses appear only as portfolio content and ordinary outbound links. The site has no customer-data integration with them. No personal contact email, phone number, testimonials, qualifications or commercial results have been invented.

## Analytics

The LH site has its own supplied measurement ID, `G-80ZJ15H2XX`. Google Analytics loads only after analytics consent, and only on the HTTPS apex and `www` domain. Preview and hosting-alias visits do not load it. Advertising storage, advertising user data, ad personalisation and Google signals are disabled.

Accept and decline have equal prominence. Visitors can reopen Cookie settings on every page, including Privacy. Choices are stored for 180 days in the browser; analytics cookies are configured for 90 days. Withdrawal disables this ID, removes its first-party cookies and reloads the page without loading Google Analytics. The consent tests cover first visits, saved choices, storage failures, withdrawal, tab changes and the preview-host guard.

To confirm receipt in the Analytics account, open its Realtime report, visit the public domain and accept analytics. Account-side receipt is a separate check from installing and publishing the tag.

## Checks

Run `npm run check` with Node 22+ and Python 3. There are no dependencies to install and no build step. Source and deployed static files are identical.

Run these checks locally before each upload or publication. This project has no active GitHub Actions workflow: uploads do not start GitHub-hosted runners, use Actions minutes or create Actions artifacts. GitHub stores the source; the existing Sites hosting publishes the website independently. No GitHub upgrade is required for this workflow. This setup does not change any existing account subscription or billing balance.

## Publication

Public website: https://leightonhepworth.com/. Both the apex and `www` domain have verified DNS and active HTTPS. This release includes indexable page metadata, social previews, a sitemap and a crawlable robots file. Search engines decide when to index a public site; a sitemap is not proof of indexing.

Website audience is managed in Sites. The GitHub source repository remains private and independent. The root `CNAME` file added on GitHub is retained; the deployed website uses the `dist/` directory and the separately connected Sites domains.

Dedicated GitHub source: https://github.com/Taccountant2026/leighton-hepworth (private).

This repository is independent of RRUK, Bytova and Turf-Right/Stone & Sprig. It was created from an empty repository, with its own history and source files. Do not put another project's source or shared runtime into it.
