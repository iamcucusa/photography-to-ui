import type { PostEntity } from '../model'

const baseUrl = import.meta.env.BASE_URL

export const mockPosts: PostEntity[] = [
  {
    id: 'post-07-career-systems-not-speed',
    type: 'single',
    title: 'Career Progress Comes From Systems, Not Speed',
    topic: 'career-systems',
    tags: ['SystemsThinking', 'SeniorEngineering'],
    createdAt: '2025-01-21T10:00:00Z',
    linkedinFormat: 'landscape',
    narrative:
      'Speed creates motion.\n\nSystems create progress.\n\nThe runner moves alone, while the platform carries many.\n\nWhich path builds trust?\n\nWhich path scales?',
    content: {
      cover: {
        src: `${baseUrl}assets/posts/design-systems-vs-individual-effort-platform-thinking.png`,
        alt: 'Minimal dark illustration showing a runner approaching a moving platform carrying several walking figures, with small magenta markers on the platform',
      },
      caption:
        'Speed creates motion. Systems create progress. The runner moves alone, while the platform carries many. Which path builds trust? Which path scales?',
    },
  },
  {
    id: 'post-08-staff-engineer-trust-systems',
    type: 'single',
    title: "Staff engineers don't scale themselves. They scale trust.",
    topic: 'staff-engineering',
    tags: ['StaffEngineering', 'EngineeringLeadership'],
    createdAt: '2025-01-22T10:00:00Z',
    linkedinFormat: 'landscape',
    narrative: `Staff engineers don't scale themselves. They scale trust.

Early in my career, I thought impact came from speed. Shipping more. Solving faster. Being everywhere.

It didn't.

What actually opened doors — as an employee and as a freelancer — was trust.

Trust that I'd make decisions with the system in mind. Trust that I'd protect teams I wasn't even part of yet. Trust that I'd say "this will break later" before it did.

Over time, I learned that trust doesn't come from being the fastest person in the room.

It comes from:
* being predictable under pressure
* designing constraints instead of rules
* fixing things without needing credit
* and saying no early, when it's still cheap

That's what scales.

Not effort. Not heroics. Trust.`,
    content: {
      cover: {
        src: `${baseUrl}assets/posts/staff-engineer-trust-systems-career-leadership-bw.jpg`,
        alt: 'Black and white photograph representing staff engineering, trust, systems, and career leadership',
      },
      caption: "Staff engineers don't scale themselves. They scale trust.",
    },
  },
  {
    id: 'post-09-frontend-burnout-entropy',
    type: 'single',
    title: "Most frontend burnout isn't workload. It's entropy.",
    topic: 'frontend-systems',
    tags: ['DesignSystems', 'FrontendArchitecture', 'ProductEngineering'],
    createdAt: '2025-01-23T10:00:00Z',
    linkedinFormat: 'landscape',
    narrative: `Most frontend burnout isn't workload.
It's entropy.

It's not the number of tickets.
It's the constant friction of a system that no longer holds.

Small exceptions.
One-off fixes.
Temporary workarounds that never get cleaned up.

Individually, they're harmless.
Collectively, they drain you.

You stop trusting the system.
You start second-guessing every change.
Every task feels heavier than it should.

That's not a motivation problem.
That's architectural fatigue.

Good systems reduce cognitive load.
Entropy does the opposite.

And no amount of "working harder" fixes that.

If your system feels heavy, it probably is.`,
    content: {
      // Text-only post - no cover image
    },
  },
  {
    id: 'post-10-ux-explanation-system-failure',
    type: 'single',
    title: 'If your UX depends on designers explaining it, the system already failed.',
    topic: 'ux-systems',
    tags: ['UXDesign', 'SystemsThinking', 'ProductDesign'],
    createdAt: '2025-01-24T10:00:00Z',
    linkedinFormat: 'landscape',
    narrative: `This is uncomfortable, but it's been consistently true in my experience.

When UX needs explanation, what's missing isn't talent or effort. 

It's shared constraints, clear ownership, and systems that carry intent without narration.

Good UX scales quietly. 
Explanations don't.`,
    content: {
      quote: {
        text: 'If your UX depends on designers explaining it, the system already failed.',
        author: 'Grace Henriquez',
        highlightedPhrase: ['system', 'already', 'failed'],
        category: 'System Invariant',
        number: '01',
      },
    },
  },
  {
    id: 'post-11-consistency-discipline-system-decay',
    type: 'single',
    title: 'If consistency depends on discipline, the system will decay.',
    topic: 'system-invariants',
    tags: ['SystemsThinking', 'DesignSystems'],
    createdAt: '2025-01-25T10:00:00Z',
    linkedinFormat: 'landscape',
    narrative: `If consistency depends on discipline, the system will decay.

Discipline doesn't scale.

It relies on people remembering, caring, and doing the right thing
every time — under pressure, across teams, over years.

Good systems don't ask for discipline.
They encode intent.

They make the right path the default,
and the wrong path harder than it's worth.

When consistency only exists because people are trying harder,
decay is just a matter of time.

Systems don't fail loudly.
They erode quietly.`,
    content: {
      quote: {
        text: 'If consistency depends on discipline, the system will decay.',
        author: 'Grace Henriquez',
        highlightedPhrase: ['system will decay'],
        category: 'System Invariant',
        number: '02',
        variant: 'minimal',
      },
    },
  },
  {
    id: 'post-12-scaling-coordination-abstraction-failed',
    type: 'single',
    title: 'If scaling requires more coordination, the abstraction failed.',
    topic: 'system-invariants',
    tags: ['SystemsThinking', 'FrontendArchitecture'],
    createdAt: '2025-01-26T10:00:00Z',
    linkedinFormat: 'landscape',
    narrative: `If scaling requires more coordination, the abstraction failed.

Good abstractions reduce communication.
Bad ones multiply meetings.

When systems scale correctly:
• teams don't need constant alignment
• interfaces replace conversations
• ownership is obvious without explanation

When scale adds coordination:
• the abstraction leaks
• intent wasn't encoded
• humans are compensating for design gaps

Coordination is a tax.
Abstractions exist to lower it.

That's the difference between systems that scale
and systems that only grow in headcount.`,
    content: {
      quote: {
        text: 'If scaling requires more coordination, the abstraction failed.',
        author: 'Grace Henriquez',
        highlightedPhrase: ['abstraction failed'],
        category: 'System Invariant',
        number: '03',
        variant: 'minimal',
      },
    },
  },
  {
    id: 'FE-SCALE-001',
    type: 'carousel',
    title: "Why most frontend best practices don't survive multi-team scale.",
    topic: 'frontend-systems',
    tags: ['DesignSystems', 'SystemDesign', 'FrontendArchitecture'],
    createdAt: '2025-01-20T10:00:00Z',
    linkedinFormat: 'portrait',
    narrative: `Most frontend best practices fail not because they're wrong
but because they're optional.

They're written for teams.
But software breaks at scale.

When multiple teams ship in parallel,
local decisions stop being local.

They compound.

One team adds a workaround to move faster.
Another team inherits it as a constraint.

No one planned it.
The system remembers it anyway.

Exceptions are quiet at first.

They don't look like problems.
They look like progress.

Until patterns emerge —
not from design, but from repetition.

Tokens bypassed.
Components duplicated.
Styles overridden "just this once."

Each decision feels isolated.
Together, they fragment the system.`,
    content: {
      aspect: '4:5',
      slides: [
        {
          id: 'slide-1',
          kind: 'cover',
          eyebrow: 'Frontend Systems',
          headline: "Why most frontend best practices don't survive multi-team scale.",
          subhead: 'Local fixes create global entropy. Exceptions become systemic.',
          cta: 'Swipe left →',
          emphasizedWords: [
            'frontend best practices',
            'multi-team scale',
            'global entropy',
            'systemic',
          ],
          image: {
            src: `${baseUrl}assets/posts/frontend-systems-modular-grid-pre-entropy-background.jpeg`,
            alt: 'Modular grid pattern representing frontend systems before entropy',
            mode: 'full',
          },
        },
        {
          id: 'slide-2',
          kind: 'principle',
          number: '1',
          headline: 'Local fixes create global entropy.',
          subhead: "One team's workaround becomes another team's constraint.",
          image: {
            src: `${baseUrl}assets/posts/local-fixes-global-entropy-engineering-systems.jpeg`,
            alt: 'Person working on electronics, showing local fixes and system complexity with cables and components visible',
            mode: 'full',
          },
        },
        {
          id: 'slide-3',
          kind: 'principle',
          number: '2',
          headline: "Exceptions are invisible until they're systemic.",
          subhead: 'Patterns emerge from repeated deviations, not from design.',
          image: {
            src: `${baseUrl}assets/posts/emergent-patterns-frost-local-deviations2.jpeg`,
            alt: 'Patterns emerging from repeated exceptions',
            mode: 'full',
          },
        },
        {
          id: 'slide-4',
          kind: 'example',
          number: '3',
          headline: 'Multi-team overrides.',
          subhead:
            'Tokens bypassed. Components duplicated. Styles overridden. Each decision seems isolated. Together, they fragment the system.',
          cta: 'Swipe left →',
          image: {
            src: `${baseUrl}assets/posts/frontend-design-system-multi-team-entropy.jpeg`,
            alt: 'Fragmented system with multiple overrides and duplications',
            mode: 'full',
          },
        },
        {
          id: 'slide-5',
          kind: 'closing',
          eyebrow: 'Frontend Systems',
          headline: 'If you maintain a design system, design your constraints.',
          subhead: "Best practices survive scale when they're enforced, not suggested.",
          cta: 'Start over →',
          emphasizedWords: ['design your constraints'],
          image: {
            src: `${baseUrl}assets/posts/architectural-system-constraints-enforced-design.jpeg`,
            alt: 'Architectural system constraints showing enforced design patterns',
            mode: 'full',
          },
        },
      ],
    },
  },
  {
    id: 'post-15-senior-engineers-dont-scale-by-writing',
    type: 'single',
    title:
      "Senior engineers don't scale by writing more code. They scale by increasing the output of everyone around them.",
    topic: 'staff-engineering',
    tags: ['StaffEngineering', 'FrontendLeadership', 'UXEngineering'],
    createdAt: '2025-01-27T10:00:00Z',
    linkedinFormat: 'landscape',
    narrative: `Senior engineers don't scale by writing more code.
They scale by increasing the output of everyone around them.

Over the last 8+ years, the work I'm most proud of wasn't individual delivery.
It was building environments where other people could grow faster, and safely.

In several cases, I explicitly encouraged managers to hire junior engineers.
With a clear commitment that I would mentor them and absorb the ramp-up risk.
Not as a favor.
As a system design decision.

I've seen juniors become independent contributors.
I've seen specialists scale across teams once their strengths were reframed.
And I've seen what happens when teams optimize for "all seniors" instead.

Teams don't fail because they lack seniors.
They fail because seniors stop absorbing risk and start optimizing for comfort.

If junior demand rebounds — as it always does —
the differentiator won't be speed.
It will be who knows how to grow people without breaking the system.

*(Related thinking from Addy Osmani on the next wave of junior hiring — worth the read.)*`,
    content: {
      cover: {
        src: `${baseUrl}assets/posts/senior-engineer-mentorship-scaling-trust-workshop-barcelona.jpg`,
        alt: 'Photograph representing senior engineering mentorship, scaling trust, and workshop collaboration in Barcelona',
      },
      caption:
        "Senior engineers don't scale by writing more code. They scale by increasing the output of everyone around them.",
    },
  },
]
