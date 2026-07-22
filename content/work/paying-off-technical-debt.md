---
title: "Paying Off Technical Debt"
year: "2018–present"
type: "Client Work"
image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1200&q=80"
imageAlt: "Clinical device interface in a medical setting"
tags: ["Vue", "Observability", "Infrastructure", "Technical Debt", "UX Research"]
excerpt: "A medical device manufacturer's provider platform had grown into a black box: a custom CMS, a sprawl of microservices, and outages measured in hours per month. We instrumented it before we touched it. Cloud costs fell 60% and uptime reached 99.9968%."
---

## At a Glance

A major medical device company runs a provider platform where practitioners who buy its devices find product resources, reach support, and manage the public profile that sends them new consultation leads. It serves roughly 15,000 customers and 300 support staff.

By the time we were brought in, it was going down for hours every month.

- **60%** reduction in cloud costs
- **99.9968%** critical system uptime, up from several hours of downtime per month
- Staff redirected from keeping the system alive to the work the business actually hired them for

## The Situation

Nobody designed this system. That is not an insult, it is the diagnosis.

It had accumulated. A custom CMS sat at the center, surrounded by API-driven microservices, wrapped in a mix of commercial, open source, and bespoke tools. Some of it was built by internal engineers, some by a succession of third-party agencies, each arriving with their own conventions and leaving before anyone had to live with them. Every individual decision had been defensible at the time. The sum was not.

Two things follow from that kind of growth, and both were present.

The first is that features get bolted on under deadline pressure, so the experience fractures. Practitioners, distributors, and support staff each ended up on paths that had been built at different times by different people to different standards.

The second is worse. The infrastructure had become a black box. It was mission critical, usage was climbing, outages were getting more frequent, and nobody could say why. There was no instrumentation to answer the question. When something broke, the investigation started from zero.

That is the actual problem. Not the CMS, not the microservices. The absence of visibility, which meant every fix was a guess and no one could tell whether a change had helped.

## The Approach

We ran two tracks at once, and the pairing is the part I would repeat.

**Operations engineering wired the existing infrastructure to instrumentation and monitoring**, without changing it first. The goal was not to fix anything yet. It was to make the structure visible, so the failure modes could be seen instead of theorized about.

**The UX team modeled complete user journeys for every stakeholder group**, mapping what each type of user was actually trying to do and where the system fought them.

Doing both at the same time is what made the findings useful. Instrumentation alone tells you which service is slow. Journey mapping alone tells you which screens people hate. Together they tell you that the slow service sits on the path a distributor walks forty times a day, which is how you rank the work. What came out was a picture of the liabilities and the systemic friction creating drag, with the technical evidence and the human cost pointing at the same places.

## What We Recommended

**Define performance indicators and instrument the critical systems.** Make the black box legible through instrumentation, analytics, logging, and data visualization. Agree on what "healthy" means numerically, so the conversation about whether things are improving has an answer.

**Establish technical guidelines and document them.** Rigorous, written patterns: a design kit and UI/UX standards, API documentation, data structure documentation, infrastructure as code, and CI/CD with standard build tooling. This is the part that stops the accumulation from starting over. Agencies rotate through, and if the conventions live in the codebase rather than in someone's memory, the next arrival inherits them.

**Consolidate the toolchain.** Identify what was poorly designed and inadequately maintained, and remove it. That meant the complex, poorly written CMS, and it meant the proliferation of API microservices that had become choke points. What remained was consolidated onto a single platform.

The third recommendation is the one worth defending. The instinct with a system in this shape is to rewrite it, and a rewrite would have taken years while the outages continued. Consolidation is less satisfying and it works sooner. You are not building a new thing, you are removing the parts that were costing more than they returned.

## The Result

Cloud costs fell by 60%, which follows almost mechanically from consolidation once you can see what you are paying for.

Critical system uptime reached 99.9968%. That figure is worth converting: it is roughly seventeen minutes of downtime a year, against a starting point of several hours every month. For a platform where a practitioner's public profile is generating their consultation leads, that difference is revenue, not just an operations metric.

Development got faster. New systems come online at a fraction of the previous cost and time, because there are now documented patterns to build against instead of an archaeology exercise before every feature.

The result I would put first, though, is the staffing one. People who had been spending their time on operations and training went back to the work the business actually needed from them. That is what technical debt costs, and it does not show up on any infrastructure bill.
