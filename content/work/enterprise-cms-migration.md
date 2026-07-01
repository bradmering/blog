---
title: "Enterprise CMS Migration"
year: "2023"
type: "Client Work"
image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=1200&q=80"
imageAlt: "Server infrastructure and data migration"
tags: ["Sanity", "Next.js", "TypeScript", "Architecture", "Migration"]
excerpt: "A full CMS platform migration for a large B2B enterprise — new content model, new UI layer, new schema, and migrated data — delivered in under three months by building each layer independently."
---

The client was in a real bind. A legacy CMS had become the foundation for their entire digital presence — marketing site, product documentation, localized content for multiple regions, forms and lead capture, structured data for integrations downstream. Over 5 years on a headless CMS platform, various agencies had layered schema over schema, component over component. 3 designs competed as you navigated the site. Even developers found it difficult to update content, much less create something new.

That's the kind of ask that usually ends one of two ways: an expensive multi-year program, or a rushed migration that leaves a different kind of mess. We found a third way by refusing to treat the migration as a single problem.

## The Decoupling Approach

The instinct in a migration like this is to move everything at once: pick a new platform, recreate the content model, migrate the data, rebuild the UI, repoint DNS. This creates a single enormous risk event with no way to validate partial progress.

We built it differently, treating each layer as an independent workstream with its own definition of done:

**Content model** — The new content schema was designed against the requirements of the presentation layer, not the legacy system's constraints. We documented every content type, its relationships, and its downstream consumers before touching any tooling. This became the contract that all other workstreams built against.

**UI components** — The component library was built against static content fixtures derived from the new schema. No CMS dependency during development. Every component could be tested and validated in isolation with realistic data, and the library shipped before data migration began.

**Data migration** — A migration pipeline mapped legacy content to the new schema with a full audit trail. Each content type had a migration script, a validation suite, and a rollback procedure. We normalized the 150 content types down to 1 block builder pattern. Because the migration was defined to a normalized schema, but independent of the schema, as the schema evolved, the contract evolved.

**Forms and data collection** — Form logic was extracted from the CMS entirely and rebuilt as a standalone service that could be pointed at either system. This made the form migration a configuration change, not a development effort.

**Integrations** — CRM connections, analytics, and downstream data consumers were abstracted behind an integration layer that isolated them from the CMS implementation.

## The Result

Because each layer had clean interfaces with the others, we could work in parallel across all five workstreams simultaneously. When something needed to change — and things always need to change — the blast radius was contained, and the contracts between the layers managed the change stream.

The migration completed in eleven weeks. The new platform launched with feature parity on day one, a materially improved authoring experience, a unified UI across even legacy content, and a content model that reflected what the team actually needed rather than what the previous system had imposed.

The decoupling wasn't just a delivery strategy. The client inherited an architecture where they can swap any individual layer — update the CMS, rebuild the UI, add an integration — without triggering another program.
