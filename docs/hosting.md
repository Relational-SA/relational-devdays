# Hosting plan

The app is a static build served by GitHub Pages from the company GitHub organisation
**Relational-SA**, at the project site URL:

```text
https://relational-sa.github.io/relational-devdays/
```

A custom Relational subdomain is not used for now; section 4 covers adding one later.

## 1. Repository

- Repository `Relational-SA/relational-devdays`, **public**. The organisation is on GitHub Free,
  where Pages serves only public repositories: making it private on 2026-10-15 took the site down
  at once and deleted its Pages configuration. A private repository needs a paid organisation
  plan (Team or Enterprise); the site itself is public either way, because visitors open it from
  a QR code.
- Guards against the public (repository settings, set 2026-10-15):
  - Issues, pull requests, wiki, discussions and projects off (General > Features), and commit
    comments off (General > Commits), so the public has nothing to comment on. Work is tracked in
    TFS and the team pushes to `main` directly. If pull requests or issues are ever turned back
    on, limit their creation to collaborators.
  - Interaction limits: collaborators only, for 6 months (Moderation > Interaction limits). GitHub
    caps them at 6 months; with the features above off there is no need to renew them when they
    lapse around 2027-04-15.
  - Ruleset `Protect main`: no deletion, no force push. Collaborators still push directly.
  - Actions: only actions created by GitHub may run; workflows from fork pull requests need
    approval for every external contributor; the default `GITHUB_TOKEN` is read-only.
  - Secret Protection with push protection, and Dependabot alerts.
- Nothing confidential in the repository: no secrets, no internal documents (the brand manual
  stays internal), no internal hostnames. The deploy workflow uses only the built-in
  `GITHUB_TOKEN`.
- Commits use the authors' GitHub `noreply` addresses (set per clone with
  `git config user.email <id>+<user>@users.noreply.github.com`), so no work email is published.
- Give teammates access through the organisation (Settings > Collaborators and teams).

## 2. Deployment

- Settings > Pages > Build and deployment > Source: **GitHub Actions**.
- [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs on every push to `main`
  (and manually): `npm ci`, unit tests, production build, then deploys
  `dist/relational-devdays/browser`.
- Base href: a project site lives under `/relational-devdays/`, so the workflow builds with
  `--base-href /relational-devdays/` (derived from the repository name). With a custom domain
  served from the root, set the repository variable `BASE_HREF` to `/`; no code change needed.
- The build writes `404.html` (a copy of `index.html`), so deep links load the app on a first
  visit; after that the service worker serves every navigation, also offline.

## 3. QR code

- [`qr/devdays-qr.svg`](qr/devdays-qr.svg) (vector, for print) and
  [`qr/devdays-qr.png`](qr/devdays-qr.png) (1200 px) encode
  `https://relational-sa.github.io/relational-devdays/` (with the trailing slash): navy on white,
  error correction level Q (still reads with about 25% of the code damaged or covered), with the
  standard 4-module quiet zone. Regenerate with
  `npx qrcode@1.5.4 -t svg -e Q -q 4 -d "#25384a" -l "#ffffff" -o docs/qr/devdays-qr.svg <url>`.
- [`qr/devdays-qr-logo.svg`](qr/devdays-qr-logo.svg) and [`qr/devdays-qr-logo.png`](qr/devdays-qr-logo.png):
  the same address at error correction level H (about 30%), with the Relational symbol on a white
  pad of 11 × 15 modules in the centre, 10% of the code's area. A decode test still read the code
  with the pad grown to 21% and failed at 26%, so the logo uses less than half of the margin and
  the rest absorbs glare, angle and dirt on the print.
- Print the address as text under the code, and also show the code on a tablet screen, so a
  sticker placed over the printed code is easy to spot.
- GitHub does **not** redirect `github.io` URLs when a repository or organisation is renamed or
  transferred. Until after the event, do not rename, transfer or delete the repository or the
  `Relational-SA` organisation, or the printed QR code and the apps installed on the tablets stop
  working. A renamed organisation's old name can be claimed by another account, which would then
  control the address.
- Test the printed code on Android and iPhone before the event.

## 4. Optional: custom Relational subdomain

1. Ask IT for `CNAME <app-domain> -> relational-sa.github.io` (organisation host only, no
   repository path). If the parent domain has CAA records, one must allow `letsencrypt.org`.
2. Settings > Pages > Custom domain: enter `<app-domain>`. With an Actions deployment the custom
   domain lives in the settings; a `CNAME` file in the build is ignored.
3. Set the repository variable `BASE_HREF` to `/` and re-run the deploy workflow.
4. Wait for the certificate (minutes, up to 24 hours), then tick **Enforce HTTPS**.
5. Verifying the domain (organisation Settings > Pages > Verified domains) protects it from being
   claimed by other accounts. Verify it on the **organisation** only, never on a personal account:
   a verified domain and its immediate subdomains are reserved for the account that verified it.
6. A custom domain changes the app's URL: reprint the QR code and reinstall the app on the tablets.

## 5. Taking the site down

With a custom domain, remove the DNS record **first**, then unpublish Pages
(Settings > Pages > Unpublish site) or archive the repository. A record that still points at
`github.io` after the site is gone can be claimed by another GitHub account (subdomain takeover).
