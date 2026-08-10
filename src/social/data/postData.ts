// Placeholder image — original asset not present in myna-main
const imgEarnestMoney = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=700&q=80';

export type StatusType = 'published' | 'draft' | 'rejected' | 'awaiting' | 'scheduled' | 'ai-suggested' | 'expired';

export interface PostPage {
  id: string;
  name: string;
  platforms: ('facebook' | 'instagram' | 'linkedin')[];
}

export interface PostData {
  postId: string;
  status: StatusType;
  platforms: ('facebook' | 'instagram' | 'linkedin')[];
  time: string;
  date: string;
  caption: string;
  hashtags: string;
  image: string;
  location: string;
  scheduledFor?: string;
  /** ISO date-time when the post should be (or was) automatically unpublished */
  expiryDate?: string;
  /** Reason the post couldn't be removed on one or more platforms */
  expiryFailedPlatforms?: ('instagram')[];
  /** Pages/locations this post was published or scheduled for */
  pages?: PostPage[];
}

export type ActivityType =
  | 'created' | 'edited' | 'scheduled' | 'rescheduled'
  | 'caption_edited' | 'media_updated' | 'image_changed'
  | 'location_added' | 'location_removed'
  | 'approved' | 'rejected' | 'partial_approval'
  | 'multi_location_edit' | 'bulk_edit' | 'ai_generated';

export interface Activity {
  id: string;
  type: ActivityType;
  user: { name: string; avatar: string };
  timestamp: string;
  description: string;
  details?: {
    before?: string;
    after?: string;
    beforeImage?: string;
    afterImage?: string;
    locations?: string[];
    count?: number;
    rejectionReason?: string;
  };
}

// ─── Unique image URLs per post ────────────────────────────────────────────────
// Post 1 & 4: Motto Mortgage "Meet Ernest / Buyers Pay Sellers" branded blue poster (figma asset)
const imgEarnest = imgEarnestMoney;
// Post 2: Sweat Equity — couple renovating their home (dark poster aesthetic)
const imgSweatEquity     = 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=700&q=80';
// Post 3: First-Time Homebuyer Feeling — excited young man celebrating
const imgFTHB            = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=700&q=80';
// Post 5: Team spotlight — real estate team / loan officers
const imgTeam            = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=700&q=80';
// Post 6: Refinancing / modern home interior
const imgModernHome      = 'https://images.unsplash.com/photo-1600210491892-03d54730d73?w=700&q=80';
// Post 7: Seminar / handshake / closing the deal
const imgSeminar         = 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=700&q=80';
// Post 8: Home is where life happens — family home exterior
const imgFamilyHome      = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=700&q=80';

// ─── Post Data ────────────────────────────────────────────────────────────────

export const POST_DATA: Record<string, PostData> = {
  // ── Post 1: Published — "Meet Ernest / Earnest Money" ──────────────────────
  'post-1': {
    postId: 'post-1',
    status: 'published',
    platforms: ['facebook'],
    time: '10:00 AM',
    date: 'Mon, Mar 2, 2026',
    caption: "So, how can a homebuyer show the current homeowner they are serious about buying? Meet Ernest. Well, earnest money actually. 😄\n\nEarnest money is a deposit given to the seller when a buyer submits an offer on a home. It demonstrates their commitment to the purchase and is typically credited toward down payment or closing costs.\n\nQuestions about earnest money? Reach out for details.",
    hashtags: '#EarnestMoney #SeriousBuyer #HomeBuyingTips #RealEstateAdvice #HomeownershipJourney #CommitmentToBuy #DownPayment #ClosingCosts #HomeGoals #TrustedAdvisor #StartYourJourney #HomeBuyingJourney',
    image: imgEarnest,
    location: 'Atlanta',
    scheduledFor: 'Published on Mar 2, 10:00 AM',
    pages: [
      { id: 'atl-buckhead',      name: 'Motto Mortgage Atlanta - Buckhead',      platforms: ['facebook'] },
      { id: 'atl-midtown',       name: 'Motto Mortgage Atlanta - Midtown',        platforms: ['facebook'] },
      { id: 'atl-decatur',       name: 'Motto Mortgage Atlanta - Decatur',        platforms: ['facebook'] },
      { id: 'atl-druid-hills',   name: 'Motto Mortgage Atlanta - Druid Hills',    platforms: ['facebook'] },
      { id: 'atl-sandy-springs', name: 'Motto Mortgage Atlanta - Sandy Springs',  platforms: ['facebook'] },
      { id: 'atl-dunwoody',      name: 'Motto Mortgage Atlanta - Dunwoody',       platforms: ['facebook'] },
      { id: 'atl-marietta',      name: 'Motto Mortgage Atlanta - Marietta',       platforms: ['facebook'] },
      { id: 'atl-roswell',       name: 'Motto Mortgage Atlanta - Roswell',        platforms: ['facebook'] },
      { id: 'atl-alpharetta',    name: 'Motto Mortgage Atlanta - Alpharetta',     platforms: ['facebook'] },
      { id: 'atl-smyrna',        name: 'Motto Mortgage Atlanta - Smyrna',         platforms: ['facebook'] },
      { id: 'atl-tucker',        name: 'Motto Mortgage Atlanta - Tucker',         platforms: ['facebook'] },
      { id: 'atl-kennesaw',      name: 'Motto Mortgage Atlanta - Kennesaw',       platforms: ['facebook'] },
      { id: 'atl-norcross',      name: 'Motto Mortgage Atlanta - Norcross',       platforms: ['facebook'] },
      { id: 'atl-conyers',       name: 'Motto Mortgage Atlanta - Conyers',        platforms: ['facebook'] },
      { id: 'atl-mcdonough',     name: 'Motto Mortgage Atlanta - McDonough',      platforms: ['facebook'] },
      { id: 'atl-douglasville',  name: 'Motto Mortgage Atlanta - Douglasville',   platforms: ['facebook'] },
      { id: 'atl-newnan',        name: 'Motto Mortgage Atlanta - Newnan',         platforms: ['facebook'] },
      { id: 'atl-carrollton',    name: 'Motto Mortgage Atlanta - Carrollton',     platforms: ['facebook'] },
      { id: 'atl-canton',        name: 'Motto Mortgage Atlanta - Canton',         platforms: ['facebook'] },
      { id: 'atl-gainesville',   name: 'Motto Mortgage Atlanta - Gainesville',    platforms: ['facebook'] },
      { id: 'atl-griffin',       name: 'Motto Mortgage Atlanta - Griffin',        platforms: ['facebook'] },
      { id: 'atl-athens',        name: 'Motto Mortgage Atlanta - Athens',         platforms: ['facebook'] },
    ],
  },

  // ── Post 2: Draft — "Sweat Equity" ──────────────────────────────────────────
  'post-2': {
    postId: 'post-2',
    status: 'draft',
    platforms: ['facebook'],
    time: '10:00 AM',
    date: 'Tue, Mar 3, 2026',
    caption: "It would be hard not to hear about sweat equity in today's market. So, what exactly does it mean? Sweat equity is when a homeowner invests their own labor into improving their property. It can boost the value of the home without requiring a significant financial investment. 💰🏠\n\nQuestions about sweat equity? Don't sweat it – reach out for details.",
    hashtags: '#SweatEquity #HomeImprovement #ValueBoost #DIYHomeProjects #Homeownership #RealEstateTips #HomeValue #AffordableHomeownership #HomeRenovation #PropertyInvestment #HomeGoals #TrustedAdvisor #StartYourJourney',
    image: imgSweatEquity,
    location: 'Boston',
    scheduledFor: 'Not yet scheduled',
    pages: [
      { id: 'bos-back-bay',      name: 'Motto Mortgage Boston - Back Bay',        platforms: ['facebook'] },
      { id: 'bos-south-end',     name: 'Motto Mortgage Boston - South End',       platforms: ['facebook'] },
      { id: 'bos-beacon-hill',   name: 'Motto Mortgage Boston - Beacon Hill',     platforms: ['facebook'] },
      { id: 'bos-fenway',        name: 'Motto Mortgage Boston - Fenway',          platforms: ['facebook'] },
      { id: 'bos-charlestown',   name: 'Motto Mortgage Boston - Charlestown',     platforms: ['facebook'] },
      { id: 'bos-cambridge',     name: 'Motto Mortgage Boston - Cambridge',       platforms: ['facebook'] },
      { id: 'bos-somerville',    name: 'Motto Mortgage Boston - Somerville',      platforms: ['facebook'] },
      { id: 'bos-brookline',     name: 'Motto Mortgage Boston - Brookline',       platforms: ['facebook'] },
      { id: 'bos-newton',        name: 'Motto Mortgage Boston - Newton',          platforms: ['facebook'] },
      { id: 'bos-quincy',        name: 'Motto Mortgage Boston - Quincy',          platforms: ['facebook'] },
      { id: 'bos-waltham',       name: 'Motto Mortgage Boston - Waltham',         platforms: ['facebook'] },
      { id: 'bos-medford',       name: 'Motto Mortgage Boston - Medford',         platforms: ['facebook'] },
      { id: 'bos-malden',        name: 'Motto Mortgage Boston - Malden',          platforms: ['facebook'] },
      { id: 'bos-everett',       name: 'Motto Mortgage Boston - Everett',         platforms: ['facebook'] },
      { id: 'bos-lynn',          name: 'Motto Mortgage Boston - Lynn',            platforms: ['facebook'] },
      { id: 'bos-woburn',        name: 'Motto Mortgage Boston - Woburn',          platforms: ['facebook'] },
      { id: 'bos-lexington',     name: 'Motto Mortgage Boston - Lexington',       platforms: ['facebook'] },
      { id: 'bos-framingham',    name: 'Motto Mortgage Boston - Framingham',      platforms: ['facebook'] },
      { id: 'bos-natick',        name: 'Motto Mortgage Boston - Natick',          platforms: ['facebook'] },
      { id: 'bos-braintree',     name: 'Motto Mortgage Boston - Braintree',       platforms: ['facebook'] },
      { id: 'bos-dedham',        name: 'Motto Mortgage Boston - Dedham',          platforms: ['facebook'] },
      { id: 'bos-norwood',       name: 'Motto Mortgage Boston - Norwood',         platforms: ['facebook'] },
    ],
  },

  // ── Post 3: Rejected — "First-Time Homebuyer Feeling" ───────────────────────
  'post-3': {
    postId: 'post-3',
    status: 'rejected',
    platforms: ['facebook'],
    time: '10:00 AM',
    date: 'Tue, Mar 3, 2026',
    caption: "Your dreams are closer than you think! With the right guidance and support, you've got everything you need to make them a reality. Let's do this! 💪✨\n\nReady for some mortgage support? Reach out to get started.",
    hashtags: '#DreamsWithinReach #MortgageSupport #HomeownershipJourney #GuidanceAndSupport #MakeItHappen #HomeGoals #PathToHomeownership #TrustedAdvisor #StartYourJourney #HomeBuyingTips #RealEstateAdvice #HomeSweetHome',
    image: imgFTHB,
    location: 'Chicago',
    scheduledFor: 'Rejected on Mar 3',
  },

  // ── Post 4: Awaiting approval — "Buyers Pay Sellers" (Instagram only) ───────
  'post-4': {
    postId: 'post-4',
    status: 'awaiting',
    platforms: ['instagram'],
    time: '10:00 AM',
    date: 'Wed, Mar 4, 2026',
    caption: "Buyers pay sellers earnest money to show they are serious about purchasing. 🏡\n\nThis strategy helps buyers stand out in a competitive market — and can make all the difference when submitting your offer. Want to learn more about how earnest money works in your favor?\n\nReach out to our team today!",
    hashtags: '#BuyersPaySellers #EarnestMoney #HomeBuying #MotoMortgage #AtlantaRealEstate #CompetitiveMarket #HomeOffers #RealEstateTips #MortgageAdvice #TrustedAdvisor',
    image: imgEarnest,
    location: 'Atlanta',
    scheduledFor: 'Awaiting approval for Mar 16, 10:00 AM',
  },

  // ── Post 5: Awaiting approval — "You Got This / FTHB" ──────────────────────
  'post-5': {
    postId: 'post-5',
    status: 'awaiting',
    platforms: ['instagram'],
    time: '10:00 AM',
    date: 'Wed, Mar 4, 2026',
    caption: "That first-time homebuyer feeling... YOU GOT THIS! 🙌✨\n\nWe know the journey to homeownership can feel overwhelming — but with the right team by your side, every step gets easier. Our loan officers at Motto Mortgage Denver are here to guide you from pre-approval to closing day.\n\nReady to start your journey? Drop us a message!",
    hashtags: '#FirstTimeHomeBuyer #YouGotThis #HomeownershipJourney #MotoMortgage #DenverRealEstate #MortgageSupport #HomeGoals #PathToHomeownership #TrustedAdvisor #StartYourJourney',
    image: imgFTHB,
    location: 'Denver',
    scheduledFor: 'Awaiting approval for Mar 4, 10:00 AM',
  },

  // ── Post 6: AI-suggested — "Sweat Equity tips" ──────────────────────────────
  'post-6': {
    postId: 'post-6',
    status: 'ai-suggested',
    platforms: ['facebook', 'instagram', 'linkedin'],
    time: '10:00 AM',
    date: 'Thu, Mar 5, 2026',
    caption: "Sweat equity? More like SWEET equity! 🍬🏡\n\nDid you know that renovating your home yourself can significantly increase its value — without a big financial investment? Whether it's a fresh coat of paint or a kitchen refresh, your hard work literally pays off.\n\nCurious how sweat equity could help with your mortgage? Reach out to learn more!",
    hashtags: '#SweatEquity #HomeImprovement #SweetEquity #HomeValue #DIYHome #MotoMortgage #LARealEstate #RealEstateTips #AffordableHomeownership #HomeRenovation #TrustedAdvisor',
    image: imgSweatEquity,
    location: 'Los Angeles',
    scheduledFor: 'AI suggested for Mar 5, 10:00 AM',
  },

  // ── Post 7: Scheduled — "Earnest Money deep dive" ───────────────────────────
  'post-7': {
    postId: 'post-7',
    status: 'scheduled',
    platforms: ['facebook'],
    time: '10:00 AM',
    date: 'Thu, Mar 5, 2026',
    caption: "So, how can a homebuyer show the current homeowner they are serious about buying? 🤝\n\nEarnest money is a deposit given to the seller when a buyer submits an offer. It demonstrates commitment to the purchase and is typically credited toward down payment or closing costs.\n\nQuestions about earnest money? Reach out — we'd love to help!",
    hashtags: '#EarnestMoney #HomeBuying #MotoMortgage #SeattleRealEstate #MortgageTips #HomeOwnership #DownPayment #ClosingCosts #TrustedAdvisor #StartYourJourney #RealEstateAdvice',
    image: imgEarnest,
    location: 'Seattle',
    scheduledFor: 'Scheduled for Mar 5, 10:00 AM — 10 locations',
    expiryDate: '2026-03-06T04:30:00',
    pages: [
      { id: 'sea-downtown',     name: 'Motto Mortgage Seattle - Downtown',      platforms: ['facebook'] },
      { id: 'sea-bellevue',     name: 'Motto Mortgage Seattle - Bellevue',      platforms: ['facebook'] },
      { id: 'sea-capitol-hill', name: 'Motto Mortgage Seattle - Capitol Hill',  platforms: ['facebook'] },
      { id: 'sea-fremont',      name: 'Motto Mortgage Seattle - Fremont',       platforms: ['facebook'] },
      { id: 'sea-ballard',      name: 'Motto Mortgage Seattle - Ballard',       platforms: ['facebook'] },
      { id: 'sea-queen-anne',   name: 'Motto Mortgage Seattle - Queen Anne',    platforms: ['facebook'] },
      { id: 'sea-south-lake',   name: 'Motto Mortgage Seattle - South Lake Union', platforms: ['facebook'] },
      { id: 'sea-westlake',     name: 'Motto Mortgage Seattle - Westlake',      platforms: ['facebook'] },
      { id: 'sea-kirkland',     name: 'Motto Mortgage Seattle - Kirkland',      platforms: ['facebook'] },
      { id: 'sea-redmond',      name: 'Motto Mortgage Seattle - Redmond',       platforms: ['facebook'] },
      { id: 'sea-bothell',      name: 'Motto Mortgage Seattle - Bothell',       platforms: ['facebook'] },
      { id: 'sea-renton',       name: 'Motto Mortgage Seattle - Renton',        platforms: ['facebook'] },
      { id: 'sea-kent',         name: 'Motto Mortgage Seattle - Kent',          platforms: ['facebook'] },
      { id: 'sea-auburn',       name: 'Motto Mortgage Seattle - Auburn',        platforms: ['facebook'] },
      { id: 'sea-federal-way',  name: 'Motto Mortgage Seattle - Federal Way',   platforms: ['facebook'] },
      { id: 'sea-tacoma',       name: 'Motto Mortgage Seattle - Tacoma',        platforms: ['facebook'] },
      { id: 'sea-issaquah',     name: 'Motto Mortgage Seattle - Issaquah',      platforms: ['facebook'] },
      { id: 'sea-sammamish',    name: 'Motto Mortgage Seattle - Sammamish',     platforms: ['facebook'] },
      { id: 'sea-burien',       name: 'Motto Mortgage Seattle - Burien',        platforms: ['facebook'] },
      { id: 'sea-shoreline',    name: 'Motto Mortgage Seattle - Shoreline',     platforms: ['facebook'] },
      { id: 'sea-lynnwood',     name: 'Motto Mortgage Seattle - Lynnwood',      platforms: ['facebook'] },
      { id: 'sea-everett',      name: 'Motto Mortgage Seattle - Everett',       platforms: ['facebook'] },
      { id: 'sea-mount-lake',   name: 'Motto Mortgage Seattle - Mountlake Terrace', platforms: ['facebook'] },
    ],
  },

  // ── Post 9: Rejected from approval — "Earnest Money" Atlanta locations ────────
  'post-9': {
    postId: 'post-9',
    status: 'rejected',
    platforms: ['instagram'],
    time: '10:00 AM',
    date: 'Wed, Mar 4, 2026',
    caption: "Buyers pay sellers earnest money to show they are serious about purchasing. 🏡\n\nThis strategy helps buyers stand out in a competitive market — and can make all the difference when submitting your offer. Want to learn more about how earnest money works in your favor?\n\nReach out to our team today!",
    hashtags: '#BuyersPaySellers #EarnestMoney #HomeBuying #MotoMortgage #AtlantaRealEstate #CompetitiveMarket #HomeOffers #RealEstateTips #MortgageAdvice #TrustedAdvisor',
    image: imgEarnest,
    location: 'Atlanta Midtown',
    scheduledFor: 'Rejected on Mar 4',
  },

  // ── Post 10: Awaiting approval — "Team Spotlight" (10-step workflow, step 5) ─
  'post-10': {
    postId: 'post-10',
    status: 'awaiting',
    platforms: ['facebook', 'instagram', 'linkedin'],
    time: '2:00 PM',
    date: 'Wed, Mar 4, 2026',
    caption: "Meet the powerhouse team behind Motto Mortgage Houston! 🌟\n\nFrom pre-approval to closing day, our loan officers work tirelessly to help Houston families achieve homeownership. We're proud to be your trusted partners in this journey.\n\nReady to start your homeownership story? Reach out today!",
    hashtags: '#TeamSpotlight #MotoMortgage #HoustonRealEstate #MortgageTeam #HomeLoan #HoustonHomes #TrustedAdvisor #HomeownershipJourney',
    image: imgTeam,
    location: 'Houston',
    scheduledFor: 'Awaiting approval for Mar 20, 2:00 PM',
  },

  // ── Post 11: Awaiting approval — "Modern Home" (3-step workflow, step 2) ────
  'post-11': {
    postId: 'post-11',
    status: 'awaiting',
    platforms: ['facebook', 'instagram'],
    time: '11:00 AM',
    date: 'Wed, Mar 4, 2026',
    caption: "Your dream home is closer than you think. 🏡✨\n\nWith today's refinancing options, thousands of homeowners are unlocking equity, lowering their payments, and funding the renovations they've always wanted. Let's talk about what refinancing could do for you.\n\nBook a free consultation today — link in bio.",
    hashtags: '#Refinancing #HomeEquity #MotoMortgage #SeattleRealEstate #HomeRenovation #MortgageTips #DreamHome #LowerPayments #TrustedAdvisor',
    image: imgModernHome,
    location: 'Seattle',
    scheduledFor: 'Awaiting approval for Mar 18, 11:00 AM',
  },

  // ── Post 8: AI-suggested — "Dream big / FTHB encouragement" ─────────────────
  'post-8': {
    postId: 'post-8',
    status: 'ai-suggested',
    platforms: ['facebook', 'instagram', 'linkedin'],
    time: '10:00 AM',
    date: 'Fri, Mar 6, 2026',
    caption: "Your dreams are closer than you think! 💛✨\n\nWith the right guidance and support, you've got everything you need to make homeownership a reality. Our team at Motto Mortgage New York is ready to help you take that first step.\n\nReady for some mortgage support? Reach out to get started.",
    hashtags: '#DreamsWithinReach #MortgageSupport #HomeownershipJourney #MotoMortgage #NYRealEstate #PathToHomeownership #HomeGoals #TrustedAdvisor #StartYourJourney #HomeSweetHome',
    image: imgFTHB,
    location: 'New York',
    scheduledFor: 'AI suggested for Mar 6, 10:00 AM',
  },

  // ── Expired posts ─────────────────────────────────────────────────────────────

  'post-exp-1': {
    postId: 'post-exp-1',
    status: 'expired',
    platforms: ['facebook', 'linkedin'],
    time: '9:00 AM',
    date: 'Mon, Mar 16, 2026',
    caption: "Spring into savings! 🌸 Our March promotion ends tonight — lock in your rate before midnight and save on closing costs. Limited slots available.",
    hashtags: '#SpringPromo #MortgageDeals #LimitedOffer',
    image: imgModernHome,
    location: 'Atlanta',
    scheduledFor: 'Published Mar 1, 9:00 AM',
    expiryDate: '2026-03-16T23:59',
    pages: [
      { id: 'atl-1', name: 'Motto Mortgage Atlanta - Buckhead', platforms: ['facebook', 'linkedin'] },
      { id: 'atl-2', name: 'Motto Mortgage Atlanta - Midtown', platforms: ['facebook', 'linkedin'] },
      { id: 'atl-3', name: 'Motto Mortgage Atlanta - Decatur', platforms: ['facebook', 'linkedin'] },
    ],
  },

  'post-exp-2': {
    postId: 'post-exp-2',
    status: 'expired',
    platforms: ['facebook', 'instagram', 'linkedin'],
    time: '12:00 PM',
    date: 'Fri, Mar 20, 2026',
    caption: "Meet the team behind your mortgage journey! Our Denver crew is here every step of the way — from pre-approval to closing day. 🏡",
    hashtags: '#TeamSpotlight #DenverMortgage #MeetTheTeam',
    image: imgTeam,
    location: 'Denver',
    scheduledFor: 'Published Mar 10, 12:00 PM',
    expiryDate: '2026-03-20T18:00',
    // Instagram couldn't be removed via API
    expiryFailedPlatforms: ['instagram'],
    pages: [
      { id: 'den-1', name: 'Motto Mortgage Denver - Cherry Creek', platforms: ['facebook', 'instagram', 'linkedin'] },
      { id: 'den-2', name: 'Motto Mortgage Denver - Highland', platforms: ['facebook', 'instagram', 'linkedin'] },
      { id: 'den-3', name: 'Motto Mortgage Denver - LoDo', platforms: ['facebook', 'instagram', 'linkedin'] },
    ],
  },

  'post-exp-3': {
    postId: 'post-exp-3',
    status: 'expired',
    platforms: ['facebook'],
    time: '10:00 AM',
    date: 'Wed, Mar 25, 2026',
    caption: "Last chance to attend our FREE first-time homebuyer seminar this Saturday in Houston! Register now — spots are filling fast.",
    hashtags: '#FTHBSeminar #HoustonHomes #FreeEvent',
    image: imgSeminar,
    location: 'Houston',
    scheduledFor: 'Published Mar 18, 10:00 AM',
    expiryDate: '2026-03-25T08:00',
    pages: [
      { id: 'hou-1', name: 'Motto Mortgage Houston - Galleria', platforms: ['facebook'] },
      { id: 'hou-2', name: 'Motto Mortgage Houston - Heights', platforms: ['facebook'] },
    ],
  },
};

// ─── Per-post Activity Feeds ──────────────────────────────────────────────────

export const POST_ACTIVITIES: Record<string, Activity[]> = {

  // post-1: Published — full lifecycle shown
  'post-1': [
    {
      id: '1',
      type: 'caption_edited',
      user: { name: 'Sarah Mitchell', avatar: 'gradient' },
      timestamp: 'just now',
      description: 'edited the caption and hashtags',
      details: {
        before: "Earnest money is a deposit buyers make to show they're serious. #MotoMortgage #HomeBuying",
        after: "So, how can a homebuyer show the current homeowner they are serious about buying? Meet Ernest. Well, earnest money actually. It's a deposit that demonstrates commitment — typically credited toward closing costs. 🏡 #EarnestMoney #HomeBuyingTips #MotoMortgage",
      },
    },
    {
      id: '2',
      type: 'image_changed',
      user: { name: 'David Rodriguez', avatar: 'gradient' },
      timestamp: '5mins',
      description: 'updated the post image',
      details: {
        beforeImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
        afterImage: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop',
      },
    },
    {
      id: '3',
      type: 'approved',
      user: { name: 'Regional Manager', avatar: 'gradient' },
      timestamp: 'Mar 1, 2026 2:00 PM',
      description: 'approved and published this post',
    },
    {
      id: '4',
      type: 'scheduled',
      user: { name: 'Jessica Martinez', avatar: 'gradient' },
      timestamp: 'Mar 1, 2026 11:30 AM',
      description: 'scheduled this post for 5 locations on Mar 2, 10:00 AM',
      details: {
        count: 5,
        locations: ['Motto Mortgage Atlanta', 'Motto Mortgage Midtown', 'Motto Mortgage Airport', 'Motto Mortgage Buckhead', 'Motto Mortgage Perimeter'],
      },
    },
    {
      id: '5',
      type: 'location_added',
      user: { name: 'Michael Chen', avatar: 'gradient' },
      timestamp: 'Feb 28, 2026 4:15 PM',
      description: 'added 2 new locations',
      details: {
        locations: ['Motto Mortgage Airport', 'Motto Mortgage Perimeter'],
      },
    },
    {
      id: '6',
      type: 'caption_edited',
      user: { name: 'Sarah Mitchell', avatar: 'gradient' },
      timestamp: 'Feb 28, 2026 3:00 PM',
      description: 'edited the post caption',
      details: {
        before: "Earnest money — what is it and why does it matter?",
        after: "Earnest money is a deposit buyers make to show they're serious. #MotoMortgage #HomeBuying",
      },
    },
    {
      id: '7',
      type: 'created',
      user: { name: 'Sarah Mitchell', avatar: 'gradient' },
      timestamp: 'Feb 28, 2026 9:00 AM',
      description: 'created this post',
    },
  ],

  // post-2: Draft — editing in progress
  'post-2': [
    {
      id: '1',
      type: 'caption_edited',
      user: { name: 'Tom Chen', avatar: 'gradient' },
      timestamp: 'just now',
      description: 'edited the caption and hashtags',
      details: {
        before: 'First-time homebuyer? We can help! #MotoMortgage',
        after: "Buying your first home doesn't have to feel overwhelming. 💛 At Motto Mortgage, we guide you through every step — from pre-approval to handing you the keys. Let's make your dream a reality! #FirstTimeHomeBuyer #MotoMortgage",
      },
    },
    {
      id: '2',
      type: 'image_changed',
      user: { name: 'Tom Chen', avatar: 'gradient' },
      timestamp: '20 mins ago',
      description: 'updated the post image',
      details: {
        beforeImage: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
        afterImage: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=400&h=300&fit=crop',
      },
    },
    {
      id: '3',
      type: 'caption_edited',
      user: { name: 'Tom Chen', avatar: 'gradient' },
      timestamp: 'Mar 2, 2026 4:30 PM',
      description: 'edited the post caption',
      details: {
        before: 'Ready to buy your first home? Reach out today.',
        after: 'First-time homebuyer? We can help! #MotoMortgage',
      },
    },
    {
      id: '4',
      type: 'created',
      user: { name: 'Tom Chen', avatar: 'gradient' },
      timestamp: 'Mar 2, 2026 2:00 PM',
      description: 'created this draft post',
    },
  ],

  // post-3: Rejected — includes rejection reason
  'post-3': [
    {
      id: '1',
      type: 'rejected',
      user: { name: 'Brand Compliance', avatar: 'gradient' },
      timestamp: 'just now',
      description: 'rejected this post',
      details: {
        rejectionReason: 'Image does not meet brand guidelines. Please use approved photography from the Motto Mortgage asset library.',
      },
    },
    {
      id: '2',
      type: 'image_changed',
      user: { name: 'Sarah Mitchell', avatar: 'gradient' },
      timestamp: '2 hours ago',
      description: 'updated the post image before submission',
      details: {
        beforeImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=300&fit=crop',
        afterImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
      },
    },
    {
      id: '3',
      type: 'scheduled',
      user: { name: 'Sarah Mitchell', avatar: 'gradient' },
      timestamp: 'Mar 2, 2026 11:00 AM',
      description: 'submitted this post for approval at 3 locations',
      details: {
        count: 3,
        locations: ['Motto Mortgage Chicago Loop', "Motto Mortgage O'Hare", 'Motto Mortgage Wicker Park'],
      },
    },
    {
      id: '4',
      type: 'caption_edited',
      user: { name: 'Sarah Mitchell', avatar: 'gradient' },
      timestamp: 'Mar 2, 2026 10:00 AM',
      description: 'edited the post caption',
      details: {
        before: "Don't let your credit score stop you from owning a home.",
        after: "Your credit score doesn't define your future in real estate 🏠 At Motto Mortgage, we find loan solutions for YOUR situation. Book a free consultation — link in bio. #MotoMortgage",
      },
    },
    {
      id: '5',
      type: 'created',
      user: { name: 'Sarah Mitchell', avatar: 'gradient' },
      timestamp: 'Mar 1, 2026 3:00 PM',
      description: 'created this post',
    },
  ],

  // post-4: Awaiting approval — Instagram only, multi-location
  'post-4': [
    {
      id: '1',
      type: 'caption_edited',
      user: { name: 'Ana Perez', avatar: 'gradient' },
      timestamp: 'just now',
      description: 'edited the caption and hashtags',
      details: {
        before: 'New Buyers Pay Sellers promotion launching soon in Atlanta! #MotoMortgage',
        after: "Big news, Atlanta! 🎊 We're launching our brand-new Buyers Pay Sellers promotion — and YOU are invited! Buyers can now use this creative strategy to reduce out-of-pocket costs. Don't miss out! #BuyersPaySellers #MotoMortgage",
      },
    },
    {
      id: '2',
      type: 'image_changed',
      user: { name: 'David Rodriguez', avatar: 'gradient' },
      timestamp: '30 mins ago',
      description: 'updated the post image across all platforms',
      details: {
        beforeImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
        afterImage: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop',
      },
    },
    {
      id: '3',
      type: 'multi_location_edit',
      user: { name: 'Marketing Team', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 2:00 PM',
      description: 'applied Buyers Pay Sellers promotion content to Instagram',
      details: {
        locations: ['Instagram'],
        count: 1,
      },
    },
    {
      id: '4',
      type: 'scheduled',
      user: { name: 'Jessica Martinez', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 9:00 AM',
      description: 'submitted post for approval across 8 locations',
      details: {
        count: 8,
        locations: ['Motto Mortgage Atlanta Downtown', 'Motto Mortgage Atlanta Midtown', 'Motto Mortgage Boston', 'Motto Mortgage Chicago', 'Motto Mortgage Denver', 'Motto Mortgage Houston', 'Motto Mortgage Miami Beach', 'Motto Mortgage New York'],
      },
    },
    {
      id: '5',
      type: 'location_added',
      user: { name: 'Michael Chen', avatar: 'gradient' },
      timestamp: 'Mar 2, 2026 5:30 PM',
      description: 'added 3 new locations',
      details: {
        locations: ['Motto Mortgage Houston', 'Motto Mortgage Miami Beach', 'Motto Mortgage New York'],
      },
    },
    {
      id: '6',
      type: 'caption_edited',
      user: { name: 'Ana Perez', avatar: 'gradient' },
      timestamp: 'Mar 2, 2026 4:00 PM',
      description: 'edited the post caption',
      details: {
        before: 'Exciting news coming soon to Atlanta! Stay tuned.',
        after: 'New Buyers Pay Sellers promotion launching soon in Atlanta! #MotoMortgage',
      },
    },
    {
      id: '7',
      type: 'created',
      user: { name: 'Ana Perez', avatar: 'gradient' },
      timestamp: 'Mar 2, 2026 11:00 AM',
      description: 'created this post for the Buyers Pay Sellers campaign',
    },
  ],

  // post-5: Partially approved — shows mixed approval status
  'post-5': [
    {
      id: '1',
      type: 'caption_edited',
      user: { name: 'Carlos Rivera', avatar: 'gradient' },
      timestamp: 'just now',
      description: 'edited the caption after partial rejection feedback',
      details: {
        before: 'Shoutout to our amazing team at Motto Mortgage Denver! #MotoMortgage',
        after: "Meet our incredible team at Motto Mortgage Denver! 🌟 Our loan officers are passionate about helping families achieve the dream of homeownership. Tag someone who deserves their dream home! #MotoMortgage #TeamSpotlight",
      },
    },
    {
      id: '2',
      type: 'partial_approval',
      user: { name: 'Regional Manager', avatar: 'gradient' },
      timestamp: '1 hour ago',
      description: 'approved 1 location, 4 pending review',
      details: {
        locations: ['Denver Tech Center ✓ Approved', 'Denver Airport — Pending', 'Denver Highlands — Pending', 'Denver Cherry Creek — Pending', 'Denver Union Station — Pending'],
      },
    },
    {
      id: '3',
      type: 'image_changed',
      user: { name: 'Carlos Rivera', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 3:00 PM',
      description: 'updated the team spotlight image',
      details: {
        beforeImage: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
        afterImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop',
      },
    },
    {
      id: '4',
      type: 'scheduled',
      user: { name: 'Jessica Martinez', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 10:00 AM',
      description: 'submitted for approval at 5 locations',
      details: {
        count: 5,
        locations: ['Motto Mortgage Denver Tech Center', 'Motto Mortgage Denver Airport', 'Motto Mortgage Denver Highlands', 'Motto Mortgage Denver Cherry Creek', 'Motto Mortgage Denver Union Station'],
      },
    },
    {
      id: '5',
      type: 'location_removed',
      user: { name: 'Michael Chen', avatar: 'gradient' },
      timestamp: 'Mar 2, 2026 6:00 PM',
      description: 'removed location',
      details: { locations: ['Motto Mortgage Denver Stapleton'] },
    },
    {
      id: '6',
      type: 'created',
      user: { name: 'Carlos Rivera', avatar: 'gradient' },
      timestamp: 'Mar 2, 2026 1:00 PM',
      description: 'created this team spotlight post',
    },
  ],

  // post-6: AI-suggested — generation + review lifecycle
  'post-6': [
    {
      id: '1',
      type: 'ai_generated',
      user: { name: 'AI Assistant', avatar: 'gradient' },
      timestamp: 'just now',
      description: 'generated this post suggestion based on top-performing content for Los Angeles',
    },
    {
      id: '2',
      type: 'ai_generated',
      user: { name: 'AI Assistant', avatar: 'gradient' },
      timestamp: '2 hours ago',
      description: 'analyzed 30 days of engagement data and identified sweat equity as a trending topic for your audience',
    },
  ],

  // post-7: Scheduled — rich lifecycle
  'post-7': [
    {
      id: '1',
      type: 'caption_edited',
      user: { name: 'Sarah Mitchell', avatar: 'gradient' },
      timestamp: 'just now',
      description: 'edited the caption and hashtags',
      details: {
        before: 'First-Time Homebuyer Seminar this weekend — free registration! #MotoMortgage',
        after: "This weekend only: join us for our FREE First-Time Homebuyer Seminar! 🎉 Learn everything about the mortgage process — from pre-approval to closing day. Register via the link in bio. Seats are limited! #FirstTimeHomeBuyer #MotoMortgage",
      },
    },
    {
      id: '2',
      type: 'image_changed',
      user: { name: 'David Rodriguez', avatar: 'gradient' },
      timestamp: '5mins',
      description: 'updated the post image',
      details: {
        beforeImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
        afterImage: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=300&fit=crop',
      },
    },
    {
      id: '3',
      type: 'scheduled',
      user: { name: 'Jessica Martinez', avatar: 'gradient' },
      timestamp: 'Mar 4, 2026 11:42 AM',
      description: 'scheduled this post for 10 locations on Mar 5, 10:00 AM',
      details: {
        count: 10,
        locations: ['Motto Mortgage Atlanta', 'Motto Mortgage Boston', 'Motto Mortgage LA', 'Motto Mortgage Chicago', 'Motto Mortgage Denver', 'Motto Mortgage Houston', 'Motto Mortgage Miami', 'Motto Mortgage New York', 'Motto Mortgage Seattle', 'Motto Mortgage Phoenix'],
      },
    },
    {
      id: '4',
      type: 'approved',
      user: { name: 'Regional Manager', avatar: 'gradient' },
      timestamp: 'Mar 4, 2026 10:15 AM',
      description: 'approved 5 of 10 locations',
      details: {
        locations: ['Motto Mortgage Atlanta', 'Motto Mortgage Boston', 'Motto Mortgage LA', 'Motto Mortgage Chicago', 'Motto Mortgage Denver'],
      },
    },
    {
      id: '5',
      type: 'location_removed',
      user: { name: 'Michael Chen', avatar: 'gradient' },
      timestamp: 'Mar 4, 2026 9:30 AM',
      description: 'removed location',
      details: { locations: ['Motto Mortgage Phoenix'] },
    },
    {
      id: '6',
      type: 'caption_edited',
      user: { name: 'Sarah Mitchell', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 4:20 PM',
      description: 'edited the post caption',
      details: {
        before: "Free homebuyer seminar coming to Seattle this weekend!",
        after: 'First-Time Homebuyer Seminar this weekend — free registration! #MotoMortgage',
      },
    },
    {
      id: '7',
      type: 'media_updated',
      user: { name: 'David Rodriguez', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 3:15 PM',
      description: 'updated the post image for 8 locations',
      details: { count: 8 },
    },
    {
      id: '8',
      type: 'location_added',
      user: { name: 'Michael Chen', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 1:30 PM',
      description: 'added 3 new locations',
      details: {
        locations: ['Motto Mortgage Miami', 'Motto Mortgage Seattle', 'Motto Mortgage Phoenix'],
      },
    },
    {
      id: '9',
      type: 'approved',
      user: { name: 'Regional Manager', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 12:45 PM',
      description: 'approved the remaining 5 locations',
      details: {
        locations: ['Motto Mortgage Houston', 'Motto Mortgage Miami', 'Motto Mortgage New York', 'Motto Mortgage Seattle', 'Motto Mortgage Phoenix'],
      },
    },
    {
      id: '10',
      type: 'rejected',
      user: { name: 'Brand Compliance', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 11:20 AM',
      description: 'rejected Boston location',
      details: {
        locations: ['Motto Mortgage Boston'],
        rejectionReason: 'Image does not meet brand standards — logo placement incorrect. Please resubmit with approved asset.',
      },
    },
    {
      id: '11',
      type: 'caption_edited',
      user: { name: 'Sarah Mitchell', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 10:00 AM',
      description: 'edited the post caption',
      details: {
        before: 'Join Motto Mortgage for a homebuyer info session this weekend.',
        after: "Free homebuyer seminar coming to Seattle this weekend!",
      },
    },
    {
      id: '12',
      type: 'rescheduled',
      user: { name: 'Jessica Martinez', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 9:15 AM',
      description: 'rescheduled this post from Mar 4 to Mar 5, 10:00 AM',
      details: {
        before: 'Mar 4, 2026 10:00 AM',
        after: 'Mar 5, 2026 10:00 AM',
      },
    },
    {
      id: '13',
      type: 'created',
      user: { name: 'Sarah Mitchell', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 9:00 AM',
      description: 'created this post',
    },
  ],

  // post-8: AI-suggested — generation lifecycle (New York)
  'post-8': [
    {
      id: '1',
      type: 'ai_generated',
      user: { name: 'AI Assistant', avatar: 'gradient' },
      timestamp: 'just now',
      description: 'generated this post suggestion based on top-performing content for New York',
    },
    {
      id: '2',
      type: 'ai_generated',
      user: { name: 'AI Assistant', avatar: 'gradient' },
      timestamp: '3 hours ago',
      description: 'identified first-time homebuyer encouragement as a high-engagement theme for your New York audience',
    },
  ],

  // post-10: Awaiting approval — 10-step workflow, step 5 (Houston team spotlight)
  'post-10': [
    {
      id: '1',
      type: 'caption_edited',
      user: { name: 'Maria Santos', avatar: 'gradient' },
      timestamp: 'just now',
      description: 'refined caption for the Houston team spotlight',
      details: {
        before: 'Spotlight on our amazing Houston team! #MotoMortgage',
        after: "Meet the powerhouse team behind Motto Mortgage Houston! 🌟 From pre-approval to closing day, our loan officers work tirelessly to help Houston families achieve homeownership.",
      },
    },
    {
      id: '2',
      type: 'approved',
      user: { name: 'Regional Director West', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 5:00 PM',
      description: 'approved — Step 4 complete',
    },
    {
      id: '3',
      type: 'approved',
      user: { name: 'Brand Team', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 2:30 PM',
      description: 'approved — Step 3 complete',
    },
    {
      id: '4',
      type: 'scheduled',
      user: { name: 'Maria Santos', avatar: 'gradient' },
      timestamp: 'Mar 2, 2026 9:00 AM',
      description: 'submitted for approval across 12 locations',
      details: { count: 12 },
    },
    {
      id: '5',
      type: 'created',
      user: { name: 'Maria Santos', avatar: 'gradient' },
      timestamp: 'Mar 1, 2026 3:00 PM',
      description: 'created this team spotlight post',
    },
  ],

  // post-11: Awaiting approval — 3-step workflow, step 2 (Seattle refinancing)
  'post-11': [
    {
      id: '1',
      type: 'approved',
      user: { name: 'Compliance Team', avatar: 'gradient' },
      timestamp: 'Mar 4, 2026 9:00 AM',
      description: 'approved — Step 1 complete',
    },
    {
      id: '2',
      type: 'image_changed',
      user: { name: 'Tom Chen', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 4:00 PM',
      description: 'updated the hero image to modern home interior',
      details: {
        beforeImage: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
        afterImage: 'https://images.unsplash.com/photo-1600210491892-03d54730d73?w=400&h=300&fit=crop',
      },
    },
    {
      id: '3',
      type: 'scheduled',
      user: { name: 'Tom Chen', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 10:00 AM',
      description: 'submitted for approval across 6 locations',
      details: {
        count: 6,
        locations: ['Motto Mortgage Seattle Downtown', 'Motto Mortgage Bellevue', 'Motto Mortgage Redmond', 'Motto Mortgage Tacoma', 'Motto Mortgage Kirkland', 'Motto Mortgage Renton'],
      },
    },
    {
      id: '4',
      type: 'created',
      user: { name: 'Tom Chen', avatar: 'gradient' },
      timestamp: 'Mar 2, 2026 2:00 PM',
      description: 'created this refinancing post',
    },
  ],

  // post-9: Rejected — rejection + submission lifecycle (Atlanta Midtown)
  'post-9': [
    {
      id: '1',
      type: 'rejected',
      user: { name: 'Brand Compliance', avatar: 'gradient' },
      timestamp: 'Mar 4, 2026 2:15 PM',
      description: 'rejected this post',
      details: {
        rejectionReason: 'Caption references incorrect loan program details. Please update to reflect current Motto Mortgage Atlanta Midtown offerings before resubmitting.',
      },
    },
    {
      id: '2',
      type: 'scheduled',
      user: { name: 'Ana Perez', avatar: 'gradient' },
      timestamp: 'Mar 4, 2026 10:00 AM',
      description: 'submitted this post for approval at 1 location',
      details: {
        count: 1,
        locations: ['Motto Mortgage Atlanta Midtown'],
      },
    },
    {
      id: '3',
      type: 'caption_edited',
      user: { name: 'Ana Perez', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 4:30 PM',
      description: 'edited the post caption',
      details: {
        before: 'Buyers can now use earnest money to stand out. #MotoMortgage #AtlantaMidtown',
        after: "Buyers pay sellers earnest money to show they are serious about purchasing. 🏡 #BuyersPaySellers #EarnestMoney #MotoMortgage",
      },
    },
    {
      id: '4',
      type: 'created',
      user: { name: 'Ana Perez', avatar: 'gradient' },
      timestamp: 'Mar 3, 2026 2:00 PM',
      description: 'created this post for the Atlanta Midtown location',
    },
  ],
};
