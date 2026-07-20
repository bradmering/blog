import WorkCard from "@/components/WorkCard";
import type { WorkItem } from "@/components/WorkCard";
import { getAllWork } from "@/lib/work";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About — Bradley Mering",
  description: "Dad, climber, trail runner, failed philosopher, and developer.",
  path: "/about",
});

const work: WorkItem[] = [
  {
    title: "Handoff",
    description:
      "An open-source design-to-code platform that automates the handoff layer between design and engineering — transforming Figma components into tokens, documentation, and exportable code.",
    image:
      "/images/handoff/splash.webp",
    tags: ["Design Systems", "React", "TypeScript", "Node.js"],
    slug: "handoff",
    year: "2022–present",
  },
  {
    title: "MediaKron",
    description:
      "An open-source multimedia timeline platform built for Boston College that lets educators and journalists construct interactive narratives from video, images, documents, and text.",
    image:
      "/images/mediakron/splash.webp",
    tags: ["React", "WordPress", "PHP", "Education"],
    slug: "mediakron",
    year: "2018–present",
  },
  {
    title: "Galgo",
    description:
      "GALGO — Golden Age Literature Glossary Online — is a searchable Spanish-English glossary and research platform for scholars and readers of 16th and 17th century Spanish literature.",
    image:
      "/images/galgo/splash.webp",
    tags: ["Digital Humanities", "React", "Search", "Education"],
    slug: "galgo",
    year: "2022–present",
  },
  {
    title: "Enterprise CMS Migration",
    description:
      "A full CMS platform migration for a large B2B enterprise — new content model, new UI layer, new schema, and migrated data — delivered in under three months by building each layer independently.",
    image:
      "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&q=80",
    tags: ["Sanity", "Next.js", "TypeScript", "Architecture"],
    slug: "enterprise-cms-migration",
    year: "2023",
  },
];

function IconEmail() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconGitHub() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function AboutPage() {
  const projects = getAllWork()
  return (
    <div>
      {/* Hero: on lg+, image pins full-screen (parallax-style, like the story
          chapters) and the bio card scrolls independently over it, then
          releases into the Work section. Tablet/mobile get the stacked
          layout below instead — no pinning. */}
      <div className="relative lg:h-[320vh]">
        <div className="lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden lg:bg-black">
          <img
            src="/images/about-cover.jpg"
            alt="Bradley Mering on a snowy ridge in the Rocky Mountains"
            className="w-full h-auto block lg:absolute lg:inset-0 lg:w-full lg:h-full lg:object-cover lg:object-[center_25%]"
          />
          <div className="hidden lg:block absolute inset-0 pointer-events-none bg-gradient-to-l from-black/70 via-black/10 to-transparent" />
          <div className="hidden lg:flex absolute bottom-6 left-0 right-0 flex-col items-center gap-1.5 pointer-events-none">
            <div className="flex flex-col items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white shadow-lg shadow-black/30">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase">Scroll</span>
              <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bio panel — scrolls over the pinned image on lg+. Starts near the
            top of its zone (not vertically centered) since the bio is long
            enough that centering would push its start off-screen. */}
        <div
          className="hidden lg:flex absolute top-0 left-0 right-0 items-start justify-end px-16 pt-28"
          style={{ height: '200vh', zIndex: 20 }}
        >
          <div className="mr-10 xl:mr-20 bg-black/60 backdrop-blur-md text-white rounded-xl px-8 py-10 max-w-xl xl:max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight mb-6">About</h1>
            <div className="space-y-4 text-lg text-white/85 leading-relaxed">
              <p>
                I&apos;m a dad, climber, trail runner, failed philosopher, and
                developer. By day, I help companies solve problems with
                software for{" "}
                <a
                  href="https://convertiv.com"
                  className="text-white underline underline-offset-2 decoration-white/40 hover:decoration-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Convertiv
                </a>
                . 
              </p>
              <p className="border-t border-white/20 pt-4">
                My heart lives amongst the rocks, the snow, the community that forms
                in the shadow of the heights. I've lived near Boulder, Colorado on and off since 2008 -
                without question the best place to find balance as a climber.
                Eldorado canyon - the stillness of the early morning,
                surrounded by the silence of the rock, the rushing creek, the
                canyon wrens looking for breakfast.
              </p>
              <p>
                I moved to Bozeman, Montana in 2013 to learn how to properly ice climb, and ski 
                mountaineer. I spent six months living out of my jeep in the desert, climbing towers.
                I've climbed in the Himalayas, and the Cordillera Blanca, and attempted the North Face on 
                Batian Peak of Mount Kenya.
              </p>

              <p className="border-t border-white/20 pt-4">
                My undergraduate work was in philosophy. My masters
                was from Boston College in continental philosophy. My primary
                reading was Kierkegaard, Levinas, and Heidegger.
              </p>
              <p>
                The academy, as a career, was clearly fraught. I honestly wasn't cut out for it. 
                I loved it, but to some degree, it needs to consume you. You need to be disciplined,
                focused, and dedicated to it, and I just wasn't. I wanted to climb, explore,
                build things. I just never found the focus required to succeed at it. Writing software
                is a similar kind of thinking - Highly structured logic, with
                a much more reasonable problem space, and better pay.
              </p>
              <p>
                I hope this site becomes a place again to write in public, if only for 
                the discipline of the public act - the spectre of an audience as a prod
                to hone the work. I miss trying hard to think the problem through, and 
                think clearly for others.  
              </p>
            </div>
            <div className="flex items-center gap-4 mt-7 pt-7 border-t border-white/20">
              <a
                href="mailto:brad.mering@gmail.com"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Email"
              >
                <IconEmail />
              </a>
              <a
                href="https://github.com/bradmering"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <IconGitHub />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bio — mobile & tablet (stacked, no overlay) */}
      <div className="lg:hidden px-6 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-6">
          About
        </h1>
        <div className="space-y-4 text-base text-stone-600 leading-relaxed">
        <p>
                I&apos;m a dad, climber, trail runner, failed philosopher, and
                developer. By day, I help companies solve problems with
                software for{" "}
                <a
                  href="https://convertiv.com"
                  className="text-white underline underline-offset-2 decoration-white/40 hover:decoration-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Convertiv
                </a>
                . 
              </p>
              <p className="border-t border-white/20 pt-4">
                My heart lives amongst the rocks, the snow, the community that forms
                in the shadow of the heights. 
                I've lived near Boulder, Colorado on and off since 2008 -
                without question the best place to find balance as a climber.
                Eldorado canyon - the stillness of the early morning,
                surrounded by the silence of the rock, the rushing creek, the
                canyon wrens looking for breakfast.
              </p>
              <p>
                I moved to Bozeman, Montana in 2013 to learn how to properly ice climb, and ski 
                mountaineer. I spent six months living out of my jeep in the desert, climbing towers.
                I've climbed in the Himalayas, and the Cordillera Blanca, and attempted the North Face on 
                Batian Peak of Mount Kenya.
              </p>

              <p className="border-t border-white/20 pt-4">
                My undergraduate work was in philosophy. My masters
                was from Boston College in continental philosophy. My primary
                reading was Kierkegaard, Levinas, and Heidegger.
              </p>
              <p>
                The academy, as a career, was clearly fraught, and I honestly wasn't cut out for it. 
                I loved it, but to some degree, it needs to consume you. You need to be disciplined,
                focused, and dedicated to it, and I just wasn't. I wanted to climb, explore,
                build things. I just never found the focus required to succeed at it. Writing software
                is a similar kind of thinking - Highly structured logic, with
                a much more reasonable problem space, and better pay.
              </p>
              <p>
                I hope this site becomes a place again to write in public, if only for 
                the discipline of the public act - the spectre of an audience as a prod
                to hone the work. I miss trying hard to think the problem through, and 
                think clearly for others.  
              </p>
        </div>
        <div className="flex items-center gap-5 mt-8 pt-8 border-t border-stone-100">
          <a
            href="mailto:brad.mering@gmail.com"
            className="text-stone-400 hover:text-stone-900 transition-colors"
            aria-label="Email"
          >
            <IconEmail />
          </a>
          <a
            href="https://github.com/bradmering"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-400 hover:text-stone-900 transition-colors"
            aria-label="GitHub"
          >
            <IconGitHub />
          </a>
        </div>
      </div>

      {/* Work showcase */}
      <div className="max-w-5xl mx-auto px-6 pb-20 mt-24">
        <h2 className="text-sm font-semibold text-stone-400 tracking-widest uppercase mb-8">
          Selected Work
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {projects.map((item) => (
            <WorkCard key={item.title} work={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
