/**
 * CV content lives here as data so the /work page stays presentation-only.
 *
 * Sourced from Brad's 2017-era resume PDF plus current repo evidence.
 * Street address and phone from that PDF are deliberately omitted: this page
 * is public, and city + email is enough contact surface.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TODO (Brad): one field left — the Convertiv role's `summary` line.
 * Anything left as `TODO:` renders as a visible amber flag, so the page
 * tells you what's missing.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface ResumeRole {
  company: string
  title: string
  /** Four-digit year, e.g. "2016" */
  start: string
  /** Four-digit year or "present" */
  end: string
  location?: string
  summary?: string
  highlights?: string[]
}

export interface ResumeEducation {
  school: string
  credential: string
  year?: string
  detail?: string
}

export interface SkillGroup {
  group: string
  items: string[]
}

export interface Publication {
  citation: string
  venue: string
  year: string
  url?: string
}

export interface Resume {
  name: string
  headline: string
  summary: string[]
  location?: string
  email?: string
  github?: string
  roles: ResumeRole[]
  education: ResumeEducation[]
  skills: SkillGroup[]
  publications: Publication[]
}

export const resume: Resume = {
  name: 'Bradley Mering',
  headline: 'Software architect and platform engineer',
  location: 'Boulder, Colorado',
  email: 'brad.mering@gmail.com',
  github: 'https://github.com/bradmering',

  summary: [
    'I build platforms: content systems, design-system tooling, and the unglamorous middleware that lets a business stop fighting its own software. Much of my work has been in higher education and the digital humanities, and most of the rest has been helping companies pay down a decade of accumulated decisions.',
    'My training is in philosophy, which turns out to be reasonable preparation for architecture work. Both are mostly about finding the right abstraction and then being honest about where it breaks.',
  ],

  roles: [
    {
      company: 'Convertiv',
      title: 'VP - Development & Operations',
      start: '2018',
      end: 'present',
      summary:
        'TODO: one line on scope — the kinds of clients, the kinds of problems, and what you own.',
    },
    {
      company: 'Independent',
      title: 'Application Developer and Consultant',
      start: '2007',
      end: '2018',
      location: 'Colorado',
      summary:
        'Full-stack engineering and consulting, from DevOps through rich JavaScript applications, with a focus on projects built for higher education.',
      highlights: [
        'MediaKron: primary developer of a toolkit for building visualizations of qualitative data in the humanities, letting professors compose contextual stories from textual, visual, temporal, and spatial data. Grew to several hundred sites across five universities.',
        'AMPS Advantage: a customer-facing platform where practitioners who purchase medical devices reach product resources, engage support, and manage the public profile that drives their consultation leads. Serves roughly 15,000 customers and 300 support staff.',
        'P3 Software: built a Laravel API for a print-fulfilment SaaS, exposing both SOAP and REST so existing customers could query and create records programmatically without rewriting their integrations.',
      ],
    },
    {
      company: 'Boston College',
      title: 'Web Developer, Instructional Design',
      start: '2005',
      end: '2007',
      location: 'Chestnut Hill, Massachusetts',
      summary: 'Worked in Instructional Design while pursuing my masters.',
      highlights: [
        'Built a platform for deploying and managing Drupal across the university.',
        'Wrote a software deployment system in Perl that pushed nightly updates to hundreds of lab computers.',
        'Designed an HTML5 interface unifying several departmental web applications behind one front door.',
      ],
    },
    {
      company: 'MerVideo Inc.',
      title: 'Founder and Video Engineer',
      start: '1998',
      end: '2005',
      location: 'Baltimore, Maryland',
      summary:
        'Founded and ran a videography and video-conferencing company serving corporate and nonprofit clients.',
      highlights: [
        'Produced video for large-scale concerts and conferences.',
        'Designed and built three video conference studios.',
        "Clients included McDonald's, Goldman Sachs, the Jordanian Tourism Board, and Youth For Christ.",
      ],
    },
  ],

  education: [
    {
      school: 'Boston College',
      credential: 'MA, Philosophy',
      year: '2005–2007',
      detail: 'Continental philosophy. Kierkegaard, Levinas, and Heidegger.',
    },
    {
      school: 'Towson University',
      credential: 'BS, Philosophy',
      year: '2000–2004',
    },
  ],

  publications: [
    {
      citation:
        'García, N. A., Caplan, A., and Mering, B. “A Pedagogy for Computer-Assisted Literary Analysis: Introducing GALGO.”',
      venue: 'Digital Humanities Quarterly 11.3',
      year: '2017',
    },
  ],

  // Current stack first, with the still-relevant older tools folded in.
  skills: [
    {
      group: 'Languages',
      items: ['TypeScript', 'JavaScript', 'PHP', 'Python', 'Java', 'Swift', 'Perl', 'SQL'],
    },
    {
      group: 'Frontend',
      items: ['React', 'Next.js', 'Vue', 'Tailwind CSS', 'Electron', 'Backbone.js'],
    },
    {
      group: 'Backend & data',
      items: ['Node.js', 'Laravel', 'Symfony', 'Postgres', 'Drizzle', 'MySQL', 'MongoDB', 'Redis'],
    },
    {
      group: 'Content & commerce',
      items: ['Sanity', 'WordPress', 'Drupal', 'Shopify', 'Salsify', 'Algolia'],
    },
    {
      group: 'Design systems',
      items: ['Handoff', 'Figma API', 'Design tokens', 'Component documentation'],
    },
    {
      group: 'Infrastructure',
      items: ['AWS', 'ECS', 'Docker', 'Ansible', 'Nginx', 'Varnish', 'Vercel', 'CI/CD'],
    },
    {
      group: 'Integrations',
      items: ['Salesforce', 'Marketo', 'HubSpot', 'SendGrid', 'Mapbox'],
    },
  ],
}

/** True when a field still carries a placeholder, so the UI can flag it. */
export function isTodo(value: string | undefined): boolean {
  return !!value && value.trimStart().startsWith('TODO')
}
