---
title: "Two Storefronts, One Platform"
year: "2026"
type: "Client Work"
image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=1200&q=80"
imageAlt: "Veterinarian examining a horse in a stable"
tags: ["Next.js", "Turborepo", "Shopify", "Postgres", "Design Systems"]
excerpt: "A veterinary health brand and an equine pharmacy, owned in common, each needed its own storefront. Building them as two projects would have meant maintaining the same account system twice. We built one platform that renders as two businesses."
---

## At a Glance

Two related businesses, a veterinary health brand and an equine pharmacy, needed customer-facing storefronts at roughly the same time. The obvious plan was two projects. They sell to overlapping customers, so the same veterinarian would have ended up with two accounts, two password resets, and two order histories.

We built one platform instead. Two storefronts, separate brands and separate workflows, running on a shared database, a shared account system, and a shared component library.

## The Situation

The two businesses genuinely are different, which is why the two-projects instinct was reasonable.

The veterinary brand is commerce: a product catalog, collections, search, subscriptions, and reorder lists for clinics that buy the same things every month. The pharmacy is a workflow: prescriptions, patient records, and a fulfilment process that has to respect the fact that a prescription is not an impulse purchase.

What they share is the customer. A veterinarian buying supplements from one and filling prescriptions at the other is one person with one professional credential. Splitting that person across two systems would have created the exact problem worth avoiding, where a customer's verified professional status lives in one database and is unknown to the other.

## The Approach

We modeled the shared thing as the platform and the different things as applications on top of it.

The monorepo holds two Next.js applications and a set of shared packages. The packages own everything that would otherwise be duplicated: the database schema, authentication, the email layer, the Shopify integration, and the component library. The applications own their own routing, their own workflows, and their own brand.

Identity is the part that justifies the whole arrangement. There is one user table, one auth configuration, and one session shape carrying the user's role and their professional verification status. A vet verified once is verified everywhere. Roles distinguish a general customer from a vet from a distributor, and the applications read the same session to decide what someone is allowed to see.

Branding is a theme, not a fork. Both storefronts render from the same component library and diverge through CSS custom properties, so the teal brand and the blue brand are the same buttons with different variables. Transactional email works the same way, switching brand by configuration rather than by maintaining two templates.

## Details Worth Keeping

A few decisions did more work than their size suggests.

**A durable outbox for B2B provisioning.** Setting a distributor up in Shopify's B2B system involves several API calls that can each fail independently. Rather than doing that inline and hoping, provisioning jobs are written to a table and processed by a worker, so a partial failure is a retryable row instead of a customer in an unknown state. The worker has explicit mock and live modes, and live mode requires confirming which shop it is pointed at.

**Session-free order confirmation.** Order confirmation emails get forwarded, opened on other devices, and read by people who checked out as guests, so requiring a login to view an order is a guaranteed support ticket. The confirmation link is authorized by an HMAC token signed over the order, its email, and an expiry. The email address is not in the URL. It is read server-side and folded into the signature, so the link is bound to that exact order without putting a customer's address into query strings and server logs.

**Accessibility as a test, not a review.** The suite runs axe-core against every public page and fails the build on serious violations. That turns contrast and keyboard access into an ordinary red test rather than an audit someone commissions later. Getting to WCAG 2.2 AA meant real changes, including a second set of accent colors for cases where a brand color is used as small text rather than as a large fill.

## The Result

Two storefronts launched from one codebase, with one account system between them. A customer is one customer. A vet verifies once. A component fixed in the shared library is fixed in both places.

The cost of this approach is real and worth naming: shared packages mean a change in `core` can break two applications, so the typecheck and visual regression suites are not optional niceties. That is the trade. We took on stricter testing to avoid maintaining two of everything, which seems like the right side of the bargain when the two things were always going to drift.
