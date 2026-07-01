---
title: "Handoff"
year: "2022–present"
type: "Product"
url: "https://handoff.com"
image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200&q=80"
imageAlt: "Design system tokens and component documentation"
tags: ["Design Systems", "React", "TypeScript", "Figma"]
excerpt: "An Open Source toolchain for design system documentation and automation"
---

We built Handoff at [Convertiv](https://convertiv.com) to help us deliver through the normal agency crisis - too little time, too many change requests. We delivered design systems for customers, but found them hard for the team to maintain. They would often fall apart soon after our engagement ended. When we surveyed the landscape of tools we used in our client work - Storybook, Figma, Token Studio, Knapsack - we realized that they all created silos for various reasons. 

We needed a set of tools that we could could plug into the client's existing workspace and create robust, self-reinforcing process. The process needed to be easier to maintain than not. Above all, the process needed to be data driven - not UI first. We needed our tool to be able to consume and standardize all the pieces - design, components, tokens, code, documentation. It had to accommodate a huge range of different kinds of design documentation, and produce normalized, consumable output.

If we could do this, we could roll into a customer's space, consume all the pieces we need, normalize them down, and automate that normalization over time. So we could ingest half the tokens from figma's REST api, and the other half from a repository where the team maintained their tailwind code. Or pull tokens from Token Studio, and components from an NPM library. If the IO could be well defined, the documentation would stay up to date, users could contribute meaningful annotation, and downstream consumers could count on a reliable source of truth. 

Above all, think one of the problems with design systems is that they have too narrow of an audience. They end up being silos for designs or developers, to which only designers and developers can contribute. So they languish, fall out of date, and get scrapped at the next rebrand.

## The Problem with Design Handoff

At the scale we work, most companies design systems consist of carefully export assets, simple component documentation, and LLM generated docs apps. Most companies simply do not have the time to invest in the rigour that makes a DS project sustainable over time.  Code and Design evolves independently and breaks the specification. Token naming diverges. Spacing values exist in three places with three different values. Components in code no longer match the spec.

We'd watched this happen across enough projects to recognize it wasn't a people problem. It was a tooling gap that every team was solving manually, project by project, with the same imperfect results.

## What We Built

Handoff is an application stack with two parts - Workspace and Registry. Developers can build a Handoff workspace, in code, alongside their existing code base. The workspace is driven by a CLI toolchain designed to make it easy to extract data from sources and normalize it. The CLI manifests a local web application UI to allow developers to work with design system, run tests, write content, manage tokens, and build components. 

The Registry gets published to the web, and becomes a living platform for collaboration. Handoff's registries are far more than just a documentation library. Because the DS is just well structured data, we can build robust tooling on top of that data. Users can prototype new components using Handoff's design workbench, using all we know about components and foundations to ensure that all the prototyping stays on brand and consistent.  


1. **Connect to Sources (Design, Code, Libraries, SaaS Tools** — authenticate against the API, using prebuild extraction or extending with customer specific needs
2. **Extract and Build Data Set - Tokens and Components** — pull and compose all the required pieces, tokens, foundations, components, documentation can be extracted from all the sources, and then enriched with manual documentation and creation
3. **Export and build** — output tokens in the configured format, generate a static documentation site

The documentation site renders component previews with code examples in multiple frameworks, shows all token values with live swatches, and stays current with every build.

## Architectural Decisions

The core extraction pipeline is framework-agnostic by design. Outputs are configured, not hardcoded — the same pipeline can emit Style Dictionary JSON, Tailwind config, or raw CSS depending on what the consuming project needs.

We kept the CLI as the primary interface deliberately. This makes Handoff CI-able: run it in a GitHub Action on every merge to the design file, commit the output, and let the PR diff show what changed. The design-to-code gap becomes auditable.

## Impact

Handoff is live on multiple production design systems. Teams using it have cut their token sync time from hours per sprint to a single build step and reduced the class of "design drifted from spec" bugs to near zero for token-level decisions.
