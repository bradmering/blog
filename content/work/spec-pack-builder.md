---
title: "The Spec Pack Builder"
year: "2021–present"
type: "Client Work"
image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80"
imageAlt: "Architectural drawings and specification documents on a desk"
tags: ["Laravel", "React", "PIM", "Document Engine", "Salesforce"]
excerpt: "A commercial plumbing manufacturer was losing specification work to whoever could produce a submittal package fastest. We built a document engine that turned a two-day scramble into a ten-minute task, then got a second product out of the same engine for free."
---

## At a Glance

A commercial plumbing manufacturer sells through a specification process. Before a fixture goes into a hospital or a hotel, an engineer writes it into the project documents, and that decision gets made from a **spec pack**: a bound set of product data sheets, dimensional drawings, compliance certifications, and installation details, assembled for one specific job.

Their spec packs were assembled by hand. A sales rep would gather PDFs from a shared drive, drop them into a document, add a cover page, and email the result. It took a day or two, the product data was frequently out of date, and the rep who moved fastest usually won the spec.

We built a system that assembles the pack from live product data in about ten minutes.

## The Situation

The bottleneck was not really document assembly. It was that product truth lived in several places at once.

Canonical product data sat in a PIM. Marketing assets sat in the CMS. Certifications and drawings lived in a file share. When a spec changed, the PIM was updated, but every spec pack already sitting in a customer's inbox was now quietly wrong. Nobody could tell which version of a pack a given contractor was working from, which is a genuine problem when the document is going to be used to order sixty of something.

The reps had also developed the usual workarounds. Personal folders of "good" PDFs, a favorite cover page from two years ago, a spreadsheet mapping models to certifications. All of it invisible to the business and impossible to keep current.

## The Approach

We treated the spec pack as a versioned document, not as a file.

The core model is deliberately boring: a **project** contains **versions**, a version contains **pages**, and a page contains **blocks**. A block is one of a small set of types, including product blocks that reference the PIM rather than copy from it, along with text, image, introduction, summary, and embedded PDF blocks.

That reference rather than copy decision is the whole design. A product block stores a pointer, so a pack is always assembled from current data at publish time. It also means a pack can be re-published against updated product data without anyone rebuilding it.

Versioning solved the "which one are they holding" problem. Publishing is an explicit state transition rather than a save, moving a project through draft, publishing, published, and, when something goes wrong, publish failed. Generating the PDF is queued work rather than a request the user waits on, so a large pack does not tie up a browser tab or time out.

## What We Built

- **A block-based builder** in React, where reps assemble a pack from searchable product data, with an alternating page layout so the output looks composed rather than concatenated.
- **A Laravel service** sitting between the CMS, the PIM, and the search index, which owns the document model and the publish pipeline.
- **Queued PDF generation**, so publishing is asynchronous and a failure is a visible state rather than a broken download.
- **Token-based public sharing.** Each project gets an unguessable public token and a designated public version, so a rep can send a link instead of a 40MB attachment, and the recipient always sees the version the rep chose to publish.
- **Co-branding.** Distributors and reps can place their own logo on the cover with stored position, scale, rotation, and flip, which sounds trivial and was the single most requested feature.
- **CRM integration.** Packs link to customer and opportunity records, and the published PDF link is written back to the opportunity, so the pack is attached to the deal rather than living in someone's sent folder.

## The Result

Assembly time went from a day or two to minutes. More importantly, the packs are now correct by construction: they are generated from the same product data the rest of the business runs on, so a spec pack cannot silently drift from the catalog.

The part worth reporting, though, came four years later. In 2025 the client wanted a quote builder. Quotes have different content and different rules, but structurally a quote is the same thing as a spec pack: a versioned, branded, publishable document assembled from product records and tied to an opportunity.

So it was not a new product. It was one enum on the project model, extending the builder from one document type to two, and reusing the entire publish, version, share, and PDF pipeline underneath. A second revenue-supporting tool shipped in a fraction of the time the first one took, because the first one had been modeled as a document engine instead of as a spec pack feature.

That is the argument for spending the extra week on the data model. You usually get paid back years after anyone remembers the decision.
