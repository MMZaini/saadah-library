# Saadah Library

Saadah Library ("The Library of Happiness") is a free, non-profit online platform that makes classical Islamic texts more accessible to readers worldwide. The project grew from a personal connection to a family library in Iraq and is intended as a public service: a reliable, well-organized digital library for students, researchers, scholars, and the curious public.

## Purpose

- Democratize access to important Islamic works by providing a clean, searchable, and mobile-friendly interface.
- Preserve scholarly material and citations, and make verified references and grading classifications easy to find.
- Provide an environment where translations, annotations, and scholarly contributions can be linked and shared.
- Offer the site as a charitable resource — free to use and open-source.

## What the app provides

- A browsable collection of key works including Al-Kāfi.
- English translations and arabic text.
- Bookmarks and personal saved items for study and review.
- Hadith sharing and grading classifications with verifiable source references.
- Responsive, accessible UI with adjustable text size, and keyboard-friendly navigation.

## Who it's for

- Students and researchers of Islamic studies.
- Community members seeking reliable translations and references.
- Scholars collaborating to improve digital editions and classifications.

## Tech stack

- **Framework:** Next.js 15 (App Router, Turbopack) with React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3, tailwindcss-animate
- **UI primitives:** Radix UI (dialog, dropdown-menu, accordion, select, tooltip, etc.)
- **Icons:** Lucide React
- **Utilities:** class-variance-authority, clsx, tailwind-merge
- **Linting / Formatting:** ESLint 9, Prettier (with prettier-plugin-tailwindcss)
- **Package manager:** Yarn
- **Deployment:** Vercel

For developers:

1. Fork the repository and open a branch for your changes.
2. Run the app locally (see "Local development") and include tests where appropriate.
3. Open a pull request with a clear description of your changes.

## Local development

Install dependencies and run the dev server:

```bash
yarn install
yarn dev
```

Open http://localhost:3000 in your browser.

## License & Ethics

The project is intended as a charitable, educational resource. If parts of the repository are published under a specific license, they will be noted in their respective directories. If you need specific licensing or permission information for a given text or translation, please check the source files or contact the maintainers.

## Data sources

Hadith data is sourced from [thaqalayn.net](http://thaqalayn.net/) via the [ThaqalaynAPI](https://github.com/MohammedArab1/ThaqalaynAPI) by Mohammed Arab. We are grateful for their work in making this content programmatically accessible.

## Acknowledgements

This project is inspired by family history and a commitment to public knowledge. Special thanks to the team behind [thaqalayn.net](http://thaqalayn.net/) and [MohammedArab1](https://github.com/MohammedArab1) for the ThaqalaynAPI, as well as all contributors, reviewers, and scholars helping to improve the quality and scope of the library.