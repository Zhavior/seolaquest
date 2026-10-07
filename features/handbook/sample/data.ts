/**
 * Sample hunt data.
 *
 * Every record here is invented for the demonstration and labelled as such on
 * every screen that shows it. No handle, post, score, or reply below comes from
 * a real account, a captured thread, or a model run. The scores exist to teach
 * the real thresholds (see ../rules.ts): one lead per set sits under the line
 * where claiming stops paying XP, and one is low enough to be ignored.
 */

export type SamplePost = {
  id: string
  handle: string
  name: string
  text: string
  /** Invented Aurora-style score, 0-100. Not a model output. */
  score: number
  /** What the scorer would cite, in the product's own reason style. */
  reasons: string[]
  /** Draft reply shown after "Draft reply". Never posted anywhere. */
  draft: string
}

export type SampleDropped = { who: string; text: string; why: string }

export type SampleSet = {
  id: string
  keyword: string
  blurb: string
  posts: SamplePost[]
  dropped: SampleDropped[]
}

export const SAMPLE_SETS: SampleSet[] = [
  {
    id: 'crm',
    keyword: 'HubSpot alternative',
    blurb: 'Founders unhappy with a CRM they pay per seat for.',
    posts: [
      {
        id: 'crm-1',
        handle: '@sample_cto_builds',
        name: 'Ada K.',
        text: 'HubSpot onboarding has taken three weeks and we ship Friday. Still waiting on migration verification. Has anyone moved a mid-size workspace over in under a week without a vendor call?',
        score: 91,
        reasons: ['Names a competitor', 'Asks for help now', 'Deadline stated: "we ship Friday"'],
        draft:
          'If the blocker is verification rather than the data, ask the vendor for a sandbox workspace so you can run the import against real records while the paperwork finishes.',
      },
      {
        id: 'crm-2',
        handle: '@sample_ops_lead',
        name: 'Marcus T.',
        text: "Is there a HubSpot alternative with a real API? We're twelve people and paying for seats nobody logs into.",
        score: 84,
        reasons: ['Asks for an alternative', 'Names a pricing pain', 'Team size given'],
        draft:
          'Seat count is usually the first thing to go wrong at that size. Before you switch, export a month of activity and see how many seats actually did anything; the answer often decides the plan you need.',
      },
      {
        id: 'crm-3',
        handle: '@sample_growth_riya',
        name: 'Riya S.',
        text: 'Thinking about leaving HubSpot at renewal. What are people switching to?',
        score: 72,
        reasons: ['Names a competitor', 'Renewal timing implied'],
        draft:
          'Renewal is a good moment to price it out. Write down the three workflows you would miss most; that list narrows the field faster than any comparison chart.',
      },
      {
        id: 'crm-4',
        handle: '@sample_indie_jo',
        name: 'Jo P.',
        text: "HubSpot's pricing page needs a translator.",
        score: 58,
        reasons: ['Names a competitor', 'No stated plan to switch'],
        draft: 'It does read like a puzzle. What were you trying to work out: seats, contacts, or the add-ons?',
      },
      {
        id: 'crm-5',
        handle: '@sample_devrel_tom',
        name: 'Tom W.',
        text: "HubSpot's new release notes are actually pretty good.",
        score: 22,
        reasons: ['Positive mention', 'No problem stated'],
        draft: 'Nothing to say here. A compliment is not a lead.',
      },
    ],
    dropped: [
      { who: 'cashtag post', text: '$CRM looking strong this week. Not financial advice.', why: 'Stock chatter, not a problem' },
      { who: 'job post', text: 'We are hiring a HubSpot admin. Apply below.', why: 'Job post' },
    ],
  },
  {
    id: 'sheets',
    keyword: 'Airtable pricing',
    blurb: 'Teams that outgrew a spreadsheet-shaped database.',
    posts: [
      {
        id: 'sheets-1',
        handle: '@sample_martech',
        name: 'Lena V.',
        text: 'Hit the Airtable record ceiling in production. We need relational integrity without jumping to the tier that prices it as an add-on. Open to anything with a real query layer.',
        score: 88,
        reasons: ['Names a competitor', 'Hard limit reached', 'Open to alternatives'],
        draft:
          'A record ceiling usually means the data outgrew the spreadsheet model rather than the plan. Price a managed Postgres against the upgrade before you renew; at that size the comparison is often closer than it looks.',
      },
      {
        id: 'sheets-2',
        handle: '@sample_ops_nia',
        name: 'Nia R.',
        text: 'Airtable automation run limit again this week. Anyone using something else for ops tables?',
        score: 79,
        reasons: ['Names a competitor', 'Recurring pain', 'Asks for alternatives'],
        draft:
          'If the limit keeps biting, count the runs you actually need per month and compare that number, not the plan name, against the alternatives.',
      },
      {
        id: 'sheets-3',
        handle: '@sample_pm_dev',
        name: 'Dev A.',
        text: 'Airtable per-seat versus viewer pricing: does anyone actually understand this?',
        score: 63,
        reasons: ['Names a competitor', 'Pricing confusion'],
        draft: 'The viewer/editor split trips people up. Which role are your stakeholders in the base today?',
      },
      {
        id: 'sheets-4',
        handle: '@sample_growth_sam',
        name: 'Sam L.',
        text: "Airtable's new interface is fine I guess.",
        score: 31,
        reasons: ['Neutral mention', 'No problem stated'],
        draft: 'Nothing to say here.',
      },
      {
        id: 'sheets-5',
        handle: '@sample_podcast_kim',
        name: 'Kim H.',
        text: 'Made a template in Airtable for tracking podcast guests. Sharing it Friday.',
        score: 12,
        reasons: ['Content share', 'No problem stated'],
        draft: 'Nothing to say here.',
      },
    ],
    dropped: [
      { who: 'invite spam', text: 'Join our database builders group. Link in bio.', why: 'Invite spam' },
      { who: 'job post', text: 'Hiring an Airtable consultant. Apply below.', why: 'Job post' },
    ],
  },
  {
    id: 'docs',
    keyword: 'Notion too slow',
    blurb: 'Wikis that became databases nobody planned.',
    posts: [
      {
        id: 'docs-1',
        handle: '@sample_data_ivy',
        name: 'Ivy C.',
        text: 'Notion formulas keep timing out once relations get deep. Looking for a database with a real query layer, not another docs tool.',
        score: 90,
        reasons: ['Names a competitor', 'Specific technical limit', 'Asks for a category switch'],
        draft:
          'Relation-heavy formulas are usually the first thing to fall over. Splitting the lookup tables into a real database and keeping docs as docs is less work than it sounds, and it makes the slow queries measurable.',
      },
      {
        id: 'docs-2',
        handle: '@sample_founder_ray',
        name: 'Ray B.',
        text: 'Notion search has slowed to a crawl across a 40-doc workspace. We want something built for structured lookups rather than documents.',
        score: 84,
        reasons: ['Names a competitor', 'Structured need stated'],
        draft:
          'At forty docs the search index is rarely the problem; it is usually a few heavy pages. Worth profiling which ones before you migrate anything.',
      },
      {
        id: 'docs-3',
        handle: '@sample_wiki_ana',
        name: 'Ana F.',
        text: 'Migrating our wiki out of Notion and the export is painful. Tips?',
        score: 76,
        reasons: ['Names a competitor', 'Migration in progress'],
        draft: 'Export to Markdown first and check how relations survive before you commit to a cutover date.',
      },
      {
        id: 'docs-4',
        handle: '@sample_remote_bo',
        name: 'Bo M.',
        text: 'Does Notion have an offline mode yet?',
        score: 47,
        reasons: ['Names a competitor', 'Question, no switch intent'],
        draft: 'Short answer depends on the platform; happy to point you at what works today if you say which devices.',
      },
      {
        id: 'docs-5',
        handle: '@sample_ai_zed',
        name: 'Zed O.',
        text: 'Notion AI summary was surprisingly ok.',
        score: 18,
        reasons: ['Positive mention', 'No problem stated'],
        draft: 'Nothing to say here.',
      },
    ],
    dropped: [
      { who: 'cashtag post', text: '$NOTN chart looks interesting. Not financial advice.', why: 'Stock chatter, not a problem' },
      { who: 'invite spam', text: 'Join our workspace power users group. Link in bio.', why: 'Invite spam' },
    ],
  },
]

export const SAMPLE_LABEL = 'Sample data. Invented for this page. Nothing here is a real account, post, or score.'
