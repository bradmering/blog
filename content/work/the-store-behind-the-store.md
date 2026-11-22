---
title: "The Store Behind the Store"
year: "2024–present"
type: "Client Work"
image: "https://images.unsplash.com/photo-1545262810-77515befe149?w=1200&q=80"
imageAlt: "Fuel station forecourt lit at dusk"
tags: ["React", "WordPress", "Headless Commerce", "API Integration", "SEO"]
excerpt: "A convenience and fuel retailer's online store was owned by a vendor: the vendor's catalog, the vendor's checkout, the vendor's login. We built a first-party layer in front of it, so customers only ever talk to the brand and the vendor became an implementation detail."
---

## At a Glance

A regional convenience and fuel retailer sells online through a headless commerce vendor. The vendor supplies the ordering system, the catalog, and the customer accounts.

The usual outcome of that arrangement is that customers can feel the seam. They browse a nice branded site, then get handed to something that looks and behaves like a different company, because it is one.

We built so that the seam does not exist. The React storefront talks only to endpoints on the retailer's own domain. The vendor sits behind them, and the customer never sees it.

## The Situation

The constraint was fixed: the vendor owned commerce, and that was not up for negotiation on this engagement. The vendor provided the store and the identity system, and a contract said so.

Working inside that constraint, there were two obvious paths. Send users to the vendor's hosted experience, which is fast to build and cedes the brand at the moment of purchase. Or call the vendor's API directly from the browser, which keeps the visual brand but leaks vendor endpoints into the client, couples the frontend to their contract, and puts their rate limits directly in front of the customer.

We took a third path, which was to put a layer of our own in between.

## The Approach

The site runs WordPress with a React application mounted inside it for the store. The interesting decision is that the WordPress plugin is not just a host for the React bundle. It is the integration layer.

The plugin publishes its own REST namespace under the retailer's domain. The React app calls those endpoints and only those endpoints. Every vendor call happens server side, which means vendor credentials never reach the browser, the vendor's URL never appears in a network tab, and the shape of the vendor's API is something we translate rather than something the frontend has to accept.

That includes authentication, which is the part people usually give up on. Registration, login, token refresh, password reset, confirmation, profile updates, and saved addresses are all proxied through first-party endpoints. From the customer's point of view they have an account with the retailer. That happens to be backed by the vendor's identity system, but nothing in the experience says so.

Because those endpoints are ours, we could put a rate limiter in front of them, tracking attempts per client IP with expiry. Credential endpoints are the ones that get hammered, and this way the abuse stops at our door instead of at the vendor's, where the only available response would have been whatever their platform decided to do.

## The Clever Part

The store locator is where this architecture earned its keep.

Location data lived in two different SaaS systems. A location-marketing platform held the addresses, hours, and photography. The commerce vendor held the store codes that orders are actually placed against. Neither system knew about the other, and neither was a good place to serve a web page from.

Rather than query both at request time, the plugin materializes locations into native WordPress posts. A scheduled import pulls from both upstreams, reconciles them into a single location record with metadata from each side, imports the photography, and keeps the set in sync on a cron with explicit create, update, and delete paths.

The payoff is that a store becomes ordinary content. It has a URL that search engines can index, which matters enormously for a business where the search is "gas station near me." Marketers can edit it in the CMS they already use. It renders server side at the speed of a database read rather than at the speed of two third-party APIs agreeing with each other. And when an upstream is slow or down, the store pages keep working, because the page is not waiting on them.

Search got the same treatment. City and place lookups run against a dataset bundled with the plugin rather than a metered geocoding API on every keystroke, with IP-based geolocation used to guess the visitor's area up front so the first result is useful before anyone types anything or grants a location permission.

## The Result

The customer experiences one brand. Browsing, account creation, and ordering all happen on the retailer's domain, with the retailer's design, and the vendor is invisible.

Operationally, the store locator is fast and indexable, which is the difference between existing in local search results and not. Location data has a single reconciled source that marketing can actually edit.

The strategic result took longer to become obvious. Because the React app was written against internal endpoints instead of vendor endpoints, the vendor is a swappable dependency. When the business later began evaluating a replacement for both the commerce platform and the loyalty provider, the frontend was not part of the problem. The work of changing vendors is the work of rewriting adapters behind an interface that already exists.

That was not the reason we built it this way. It was the reason it was worth having built it this way.
