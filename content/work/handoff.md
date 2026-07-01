---
title: "Handoff"
year: "2022–present"
type: "Product"
url: "https://handoff.com"
image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200&q=80"
imageAlt: "Design system tokens and component documentation"
tags: ["Design Systems", "React", "TypeScript", "Node.js"]
excerpt: "An open-source design-to-code platform that automates the handoff layer between design and engineering — transforming Figma components into tokens, documentation, and exportable code."
---

Most design systems fail at the last mile. The Figma file is the source of truth in theory. In practice, engineers work from screenshots and guesswork, tokens drift in code, and documentation is always out of date.

Handoff is an attempt to close that gap permanently. It connects directly to Figma's API, extracts design tokens and component metadata, and exports them in formats developers actually use — CSS custom properties, Sass variables, TypeScript constants, JSON for Style Dictionary. Documentation pages generate automatically from component descriptions. When the design changes, the tokens change with it, on the next build.

## The Problem with Design Handoff

The standard approach — export assets, write a Confluence page, hope engineers find it — breaks the moment the design evolves. Token naming diverges. Spacing values exist in three places with three different values. Components in code no longer match the spec.

We'd watched this happen across enough projects to recognize it wasn't a people problem. It was a tooling gap that every team was solving manually, project by project, with the same imperfect results.

## What We Built

Handoff is built as a CLI-first tool with a statically-generated documentation output. The core workflow:

1. **Connect to Figma** — authenticate against the Figma API, point at a design file
2. **Extract primitives** — pull color, typography, spacing, and effect tokens from published styles
3. **Extract components** — traverse component sets, extract variants, document props and states
4. **Export and build** — output tokens in the configured format, generate a static documentation site

The documentation site renders component previews with code examples in multiple frameworks, shows all token values with live swatches, and stays current with every build.

## Architectural Decisions

The core extraction pipeline is framework-agnostic by design. Outputs are configured, not hardcoded — the same pipeline can emit Style Dictionary JSON, Tailwind config, or raw CSS depending on what the consuming project needs.

We kept the CLI as the primary interface deliberately. This makes Handoff CI-able: run it in a GitHub Action on every merge to the design file, commit the output, and let the PR diff show what changed. The design-to-code gap becomes auditable.

## Impact

Handoff is live on multiple production design systems. Teams using it have cut their token sync time from hours per sprint to a single build step and reduced the class of "design drifted from spec" bugs to near zero for token-level decisions.
