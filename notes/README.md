# Engineering Notes

This directory and its Markdown renderer are retained for possible future writing.
Engineering Notes is not currently displayed: the old Experiments stop has become
Beyond work. The production build does not read or publish this directory.

If a writing section is added again, the existing renderer supports this workflow:

1. Copy `_template.md` to a descriptive filename such as `agent-reliability.md`.
2. Write your real note. Set its title and publication date in the metadata.
3. Keep `status: draft` until you want it visible. Change it to `status: published` to include it.
4. Connect `renderNotes` from `scripts/engineering-notes.cjs` to that writing section, then build and deploy.

Notes appear newest first, fully visible beneath the signal experiment.
No server, database, account, or new package is needed. Drafts, this README,
and filenames beginning with `_` are excluded from the generated site.

Supported Markdown: paragraphs, `#` through `###` headings, bullet lists,
**bold**, inline code, fenced code blocks, and links with full HTTP(S) URLs.
Raw HTML is displayed as text. Images, MDX, and nested lists are not supported.
Use lowercase letters, numbers, and hyphens for published filenames.

Only publish material you have actually written. The template is deliberately a draft.
