# Leighton Hepworth — personal website

An independent, buildless static website for `leightonhepworth.com`, using the approved LH Business Group logo. This is a dedicated project. It does not share a repository, deployment, backend, database, analytics stream or runtime dependency with the other businesses.

## Files

- `dist/index.html`: personal profile, businesses, project workbench, studies and contact routing.
- `dist/styles.css`: responsive navy, champagne-gold and ivory identity.
- `dist/app.js`: accessible mobile navigation, project filters, project-note dialogs, contact routing and copy-link button.
- `dist/assets/`: independently stored approved logo assets and local Inter font files; font licence included.
- `.openai/hosting.json`: this site's separate native hosting identity.

The other businesses appear only as portfolio content and ordinary outbound links. The site has no customer-data integration with them. No personal contact email, phone number, testimonials, qualifications or commercial results have been invented.

## Checks

Run `npm run check` with Node 22+ and Python 3. There are no dependencies to install and no build step. Source and deployed static files are identical.

Run these checks locally before each upload or publication. This project has no active GitHub Actions workflow: uploads do not start GitHub-hosted runners, use Actions minutes or create Actions artifacts. GitHub stores the source; the existing Sites hosting publishes the website independently. No GitHub upgrade is required for this workflow. This setup does not change any existing account subscription or billing balance.

## Publication

The first version is private, with noindex metadata and a disallow-all robots file. The registered domain is `leightonhepworth.com`. DNS records must match the actual records returned by the Sites domain tool. Registration of a domain does not itself connect it to hosting.

Dedicated GitHub source: https://github.com/Taccountant2026/leighton-hepworth (private).

This repository is independent of RRUK, Bytova and Turf-Right/Stone & Sprig. It was created from an empty repository, with its own history and source files. Do not put another project's source or shared runtime into it.
