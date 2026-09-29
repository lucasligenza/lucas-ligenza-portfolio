# Lucas Ligenza / ASCII Galaxy Portfolio

A static portfolio with a scroll-driven space journey, the original ASCII rocket,
five destinations, and saved discoveries. Built with HTML, CSS, Canvas, and plain
JavaScript. No application framework, external packages, API keys, or backend are
required.

**Live site:** https://lucas-ligenza-portfolio.vercel.app/

**Source:** https://github.com/lucasligenza/lucas-ligenza-portfolio

Deployed to `lucas-ligenzas-projects/lucas-ligenza-portfolio` on Vercel. This local
folder is linked through the ignored `.vercel/` directory. To publish an update,
run `vercel project inspect --non-interactive` to confirm the target, then
`vercel deploy --prod --scope lucas-ligenzas-projects`. Vercel runs the tests and
build before publishing. Deployment currently uses the CLI; pushing files alone
will not publish updates until a Git repository is connected.

## Run locally

Use **Node.js 24** and npm. Clone the repository, then build and preview it:

```sh
git clone https://github.com/lucasligenza/lucas-ligenza-portfolio.git
cd lucas-ligenza-portfolio
npm ci
npm run build
npm run preview
```

Open **http://localhost:4173/**. The preview serves the production files in `dist/`.
After editing source or notes, run `npm run build` again and refresh the browser.
If that port is busy, use `npm run preview -- --port 4174`.

`npm test` runs the journey, navigation, Markdown, and production-build checks.
`npm run build` runs those checks first, then generates the static site.

## Deploy to Vercel

The root `vercel.json` contains the build settings. No environment variables are
needed. Deploy the **project root**, not the archived preview directory.

### Import a Git repository

1. Put this project in a Git repository and push it to your Git provider. The
   included `.gitignore` excludes local previews, generated output, and secrets.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Use these settings if prompted:

   | Setting | Value |
   | --- | --- |
   | Root Directory | Repository root (`.`) |
   | Framework Preset | Other |
   | Node.js Version | 24.x |
   | Install Command | `npm ci` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Environment Variables | None |

4. Choose **Deploy**. Future pushes to the production branch rebuild the site;
   other branches can receive preview deployments.

### Deploy from this folder with the CLI

Installing the Vercel CLI is recommended for deployment, environment management,
and logs:

```sh
npm i -g vercel
vercel login
vercel link
vercel project inspect
vercel deploy
```

Select your intended account and project when linking, and confirm them in the
inspection output. `vercel deploy` creates a preview. After reviewing that preview,
publish a production deployment with:

```sh
vercel deploy --prod
```

The CLI is not a dependency of this website. `.vercelignore` excludes the local
brainstorming archive and environment files from CLI uploads. Only `dist/` is
served to visitors. Hash links such as `/#projects` need no routing rewrites.

Official references: [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json)
and [Vercel CLI](https://vercel.com/docs/cli).

## Editing the site

| Path | Purpose |
| --- | --- |
| `src/journey.html` | Portfolio content and semantic HTML |
| `src/journey*.css` | Journey, reading zones, and responsive styles |
| `src/journey-model.js` | Scroll distances and journey state |
| `src/journey-navigation.js` | Navigation, deep links, motion, and history |
| `src/journey-renderer.js`, `src/rocket.js` | Galaxy, planets, and original rocket |
| `src/journey-discoveries.js` | Discoveries and their dialogs |
| `src/journey.js` | Project shortcuts and content measurement |
| `notes/` | Retained Markdown drafts and publishing utility; currently not displayed |
| `scripts/` | Dependency-free builder, art generators, and preview server |
| `tests/` | Automated regression checks |
| `public/` | Favicon and robots.txt |

These root-level sources are now the editable project. `.superpowers/` holds the
earlier design-preview history and is neither a build input nor deployed. Do not
edit `dist/` directly; it is generated.

## Current behavior

- Contact provides direct email, LinkedIn, and GitHub links. There is no message
  form or simulated send flow. The résumé is a clearly labeled placeholder.
- Discoveries use browser storage. They stay on the visitor's device
  and are separate for localhost, each preview URL, and the production domain.
- Beyond work replaces the old Experiments stop with personal interests. Old
  `/#experiments` links still open the ringed-world stop at Beyond work.
- The former AI opinion block, questions list, signal lab, and empty Engineering
  Notes section are no longer displayed. Markdown drafts and their renderer are
  retained for possible future writing; the current build does not include them.
- The site uses native scrolling, supports reduced motion, and pauses ambience
  separately from navigation. No analytics, external fonts, or network APIs are
  loaded by the application.
- The portfolio describes this site as a live **ASCII Galaxy Portfolio**;
  the old OS concept is not presented as a separate completed project.
