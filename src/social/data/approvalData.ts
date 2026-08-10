// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkflowApprover {
  id: string;
  name: string;
  isCurrentUser: boolean;
  responded: boolean;
  action?: 'approved' | 'rejected';
  respondedAt?: string;
  rejectionReason?: string;
  /**
   * 'all'     = full-location approver: responsible for every location in the post.
   * 'partial' = partial-location approver: responsible only for the locations listed
   *             in `assignedLocationIds`.
   */
  locationType: 'all' | 'partial';
  /**
   * Only populated when locationType === 'partial'.
   * Contains the IDs of ApprovalLocations this approver is responsible for.
   */
  assignedLocationIds?: string[];
}

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  status: 'complete' | 'current' | 'locked' | 'rejected';
  approvers: WorkflowApprover[];
}

export interface ApprovalLocation {
  id: string;
  name: string;
  city: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  actionedBy?: string;
  actionedAt?: string;
  /** true = current user can act on this location */
  isCurrentUserScope: boolean;
}

export interface ApprovalData {
  postId: string;
  workflowTitle: string;
  steps: WorkflowStep[];
  locations: ApprovalLocation[];
  submittedBy: string;
  submittedAt: string;
  deadline?: string;
}

// ─── Current logged-in user ───────────────────────────────────────────────────

export const CURRENT_USER = {
  id: 'current-user',
  name: 'Haresh',
  userType: 'A' as 'A' | 'B', // A = full-access, B = partial
};

// ─── Approval Data per post ───────────────────────────────────────────────────

// ── post-4 location IDs ──────────────────────────────────────────────────────
// Atlanta (8) — Haresh's scope
const ATL = ['loc-at1','loc-at2','loc-at3','loc-at4','loc-at5','loc-at6','loc-at7','loc-at8'];
// Dallas (6) + Austin (6) = 12 — Jaxson's scope
const DAL = ['loc-da1','loc-da2','loc-da3','loc-da4','loc-da5','loc-da6'];
const AUS = ['loc-au1','loc-au2','loc-au3','loc-au4','loc-au5','loc-au6'];
// New York (10) + Chicago (8) + Los Angeles (7) + Boston (5) = 30 — Nolan's (full-location)
const NYC = ['loc-ny1','loc-ny2','loc-ny3','loc-ny4','loc-ny5','loc-ny6','loc-ny7','loc-ny8','loc-ny9','loc-ny10'];
const CHI = ['loc-ch1','loc-ch2','loc-ch3','loc-ch4','loc-ch5','loc-ch6','loc-ch7','loc-ch8'];
const LAX = ['loc-la1','loc-la2','loc-la3','loc-la4','loc-la5','loc-la6','loc-la7'];
const BOS = ['loc-bo1','loc-bo2','loc-bo3','loc-bo4','loc-bo5'];

export const APPROVAL_DATA: Record<string, ApprovalData> = {

  // ── post-4: Rich 50-location demo — 3 approvers with different scopes ──────
  'post-4': {
    postId: 'post-4',
    workflowTitle: 'National franchise review',
    submittedBy: 'Ana Perez',
    submittedAt: 'Mar 3, 2026 9:00 AM',
    deadline: 'Mar 6, 2026 11:59 PM',
    steps: [
      {
        stepNumber: 1,
        title: 'Step 1 — Brand compliance',
        status: 'complete',
        approvers: [
          { id: 'nolan-s1', name: 'Nolan Botosh', isCurrentUser: false, responded: true, action: 'approved', respondedAt: 'Mar 3, 2026 11:00 AM', locationType: 'all' },
          { id: 'jaxson-s1', name: 'Jaxson Septimus', isCurrentUser: false, responded: true, action: 'approved', respondedAt: 'Mar 3, 2026 11:30 AM', locationType: 'all' },
        ],
      },
      {
        stepNumber: 2,
        title: 'Step 2 — Regional manager review',
        status: 'current',
        approvers: [
          // Partial-location approver: Haresh owns 8 Atlanta locations
          {
            id: 'current-user',
            name: 'Haresh',
            isCurrentUser: true,
            responded: false,
            locationType: 'partial',
            assignedLocationIds: ATL,
          },
          // Full-location approver: Nolan oversees all 50 locations
          {
            id: 'nolan',
            name: 'Nolan Botosh',
            isCurrentUser: false,
            responded: false,
            locationType: 'all',
          },
          // Partial-location approver: Jaxson owns 12 Dallas+Austin locations — already done
          {
            id: 'jaxson',
            name: 'Jaxson Septimus',
            isCurrentUser: false,
            responded: true,
            action: 'approved',
            respondedAt: 'Mar 4, 2026 8:45 AM',
            locationType: 'partial',
            assignedLocationIds: [...DAL, ...AUS],
          },
        ],
      },
    ],
    locations: [
      // ── Atlanta — Haresh's scope (8) ── mix of statuses
      { id: 'loc-at1', name: 'Motto Mortgage Atlanta Downtown',    city: 'Atlanta', status: 'pending',  isCurrentUserScope: true },
      { id: 'loc-at2', name: 'Motto Mortgage Atlanta Midtown',     city: 'Atlanta', status: 'pending',  isCurrentUserScope: true },
      { id: 'loc-at3', name: 'Motto Mortgage Atlanta Buckhead',    city: 'Atlanta', status: 'pending',  isCurrentUserScope: true },
      { id: 'loc-at4', name: 'Motto Mortgage Atlanta Perimeter',   city: 'Atlanta', status: 'approved', actionedBy: 'Haresh', actionedAt: 'Mar 4, 2026 9:10 AM', isCurrentUserScope: true },
      { id: 'loc-at5', name: 'Motto Mortgage Atlanta Airport',     city: 'Atlanta', status: 'approved', actionedBy: 'Haresh', actionedAt: 'Mar 4, 2026 9:12 AM', isCurrentUserScope: true },
      { id: 'loc-at6', name: 'Motto Mortgage Atlanta Sandy Springs',city: 'Atlanta', status: 'approved', actionedBy: 'Haresh', actionedAt: 'Mar 4, 2026 9:15 AM', isCurrentUserScope: true },
      { id: 'loc-at7', name: 'Motto Mortgage Atlanta Decatur',     city: 'Atlanta', status: 'rejected', rejectionReason: 'Caption contains a local phone number that is not compliant with franchise guidelines.', actionedBy: 'Haresh', actionedAt: 'Mar 4, 2026 9:20 AM', isCurrentUserScope: true },
      { id: 'loc-at8', name: 'Motto Mortgage Atlanta Smyrna',      city: 'Atlanta', status: 'rejected', rejectionReason: 'Image resolution is too low for this location\'s Instagram feed standards.', actionedBy: 'Haresh', actionedAt: 'Mar 4, 2026 9:22 AM', isCurrentUserScope: true },

      // ── Dallas — Jaxson's scope (6) — all done
      { id: 'loc-da1', name: 'Motto Mortgage Dallas Uptown',       city: 'Dallas', status: 'approved', actionedBy: 'Jaxson Septimus', actionedAt: 'Mar 4, 2026 8:45 AM', isCurrentUserScope: false },
      { id: 'loc-da2', name: 'Motto Mortgage Dallas Frisco',       city: 'Dallas', status: 'approved', actionedBy: 'Jaxson Septimus', actionedAt: 'Mar 4, 2026 8:46 AM', isCurrentUserScope: false },
      { id: 'loc-da3', name: 'Motto Mortgage Dallas Plano',        city: 'Dallas', status: 'approved', actionedBy: 'Jaxson Septimus', actionedAt: 'Mar 4, 2026 8:47 AM', isCurrentUserScope: false },
      { id: 'loc-da4', name: 'Motto Mortgage Dallas McKinney',     city: 'Dallas', status: 'rejected', rejectionReason: 'Seasonal promotional copy needs to be approved by legal before use.', actionedBy: 'Jaxson Septimus', actionedAt: 'Mar 4, 2026 8:48 AM', isCurrentUserScope: false },
      { id: 'loc-da5', name: 'Motto Mortgage Dallas Arlington',    city: 'Dallas', status: 'approved', actionedBy: 'Jaxson Septimus', actionedAt: 'Mar 4, 2026 8:49 AM', isCurrentUserScope: false },
      { id: 'loc-da6', name: 'Motto Mortgage Dallas Irving',       city: 'Dallas', status: 'approved', actionedBy: 'Jaxson Septimus', actionedAt: 'Mar 4, 2026 8:50 AM', isCurrentUserScope: false },

      // ── Austin — Jaxson's scope (6) — all done
      { id: 'loc-au1', name: 'Motto Mortgage Austin Downtown',     city: 'Austin', status: 'approved', actionedBy: 'Jaxson Septimus', actionedAt: 'Mar 4, 2026 8:51 AM', isCurrentUserScope: false },
      { id: 'loc-au2', name: 'Motto Mortgage Austin Domain',       city: 'Austin', status: 'approved', actionedBy: 'Jaxson Septimus', actionedAt: 'Mar 4, 2026 8:52 AM', isCurrentUserScope: false },
      { id: 'loc-au3', name: 'Motto Mortgage Austin South Congress',city: 'Austin', status: 'rejected', rejectionReason: 'Local market disclosures must appear in the caption for Texas locations.', actionedBy: 'Jaxson Septimus', actionedAt: 'Mar 4, 2026 8:53 AM', isCurrentUserScope: false },
      { id: 'loc-au4', name: 'Motto Mortgage Austin Round Rock',   city: 'Austin', status: 'approved', actionedBy: 'Jaxson Septimus', actionedAt: 'Mar 4, 2026 8:54 AM', isCurrentUserScope: false },
      { id: 'loc-au5', name: 'Motto Mortgage Austin Cedar Park',   city: 'Austin', status: 'approved', actionedBy: 'Jaxson Septimus', actionedAt: 'Mar 4, 2026 8:55 AM', isCurrentUserScope: false },
      { id: 'loc-au6', name: 'Motto Mortgage Austin Pflugerville', city: 'Austin', status: 'approved', actionedBy: 'Jaxson Septimus', actionedAt: 'Mar 4, 2026 8:56 AM', isCurrentUserScope: false },

      // ── New York — Nolan's scope (10) — partially done
      { id: 'loc-ny1',  name: 'Motto Mortgage New York Times Sq',  city: 'New York', status: 'approved', actionedBy: 'Nolan Botosh', actionedAt: 'Mar 4, 2026 10:00 AM', isCurrentUserScope: false },
      { id: 'loc-ny2',  name: 'Motto Mortgage New York Midtown',   city: 'New York', status: 'approved', actionedBy: 'Nolan Botosh', actionedAt: 'Mar 4, 2026 10:02 AM', isCurrentUserScope: false },
      { id: 'loc-ny3',  name: 'Motto Mortgage New York Brooklyn',  city: 'New York', status: 'approved', actionedBy: 'Nolan Botosh', actionedAt: 'Mar 4, 2026 10:04 AM', isCurrentUserScope: false },
      { id: 'loc-ny4',  name: 'Motto Mortgage New York Queens',    city: 'New York', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-ny5',  name: 'Motto Mortgage New York Bronx',     city: 'New York', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-ny6',  name: 'Motto Mortgage New York Staten Is', city: 'New York', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-ny7',  name: 'Motto Mortgage New York Harlem',    city: 'New York', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-ny8',  name: 'Motto Mortgage New York Jersey City',city: 'New York', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-ny9',  name: 'Motto Mortgage New York Hoboken',   city: 'New York', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-ny10', name: 'Motto Mortgage New York White Plains',city:'New York', status: 'pending',  isCurrentUserScope: false },

      // ── Chicago — Nolan's scope (8)
      { id: 'loc-ch1', name: 'Motto Mortgage Chicago Loop',        city: 'Chicago', status: 'approved', actionedBy: 'Nolan Botosh', actionedAt: 'Mar 4, 2026 10:10 AM', isCurrentUserScope: false },
      { id: 'loc-ch2', name: "Motto Mortgage Chicago O'Hare",      city: 'Chicago', status: 'approved', actionedBy: 'Nolan Botosh', actionedAt: 'Mar 4, 2026 10:12 AM', isCurrentUserScope: false },
      { id: 'loc-ch3', name: 'Motto Mortgage Chicago Wicker Park', city: 'Chicago', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-ch4', name: 'Motto Mortgage Chicago Lincoln Park', city: 'Chicago', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-ch5', name: 'Motto Mortgage Chicago Evanston',    city: 'Chicago', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-ch6', name: 'Motto Mortgage Chicago Naperville',  city: 'Chicago', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-ch7', name: 'Motto Mortgage Chicago Aurora',      city: 'Chicago', status: 'rejected', rejectionReason: 'Missing required state licensing disclosure for Illinois mortgage advertising.', actionedBy: 'Nolan Botosh', actionedAt: 'Mar 4, 2026 10:15 AM', isCurrentUserScope: false },
      { id: 'loc-ch8', name: 'Motto Mortgage Chicago Joliet',      city: 'Chicago', status: 'pending',  isCurrentUserScope: false },

      // ── Los Angeles — Nolan's scope (7)
      { id: 'loc-la1', name: 'Motto Mortgage LA Downtown',         city: 'Los Angeles', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-la2', name: 'Motto Mortgage LA Santa Monica',     city: 'Los Angeles', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-la3', name: 'Motto Mortgage LA Pasadena',         city: 'Los Angeles', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-la4', name: 'Motto Mortgage LA Long Beach',       city: 'Los Angeles', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-la5', name: 'Motto Mortgage LA Glendale',         city: 'Los Angeles', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-la6', name: 'Motto Mortgage LA Burbank',          city: 'Los Angeles', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-la7', name: 'Motto Mortgage LA Torrance',         city: 'Los Angeles', status: 'pending',  isCurrentUserScope: false },

      // ── Boston — Nolan's scope (5)
      { id: 'loc-bo1', name: 'Motto Mortgage Boston Commons',      city: 'Boston', status: 'approved', actionedBy: 'Nolan Botosh', actionedAt: 'Mar 4, 2026 10:20 AM', isCurrentUserScope: false },
      { id: 'loc-bo2', name: 'Motto Mortgage Boston Cambridge',    city: 'Boston', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-bo3', name: 'Motto Mortgage Boston Brookline',    city: 'Boston', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-bo4', name: 'Motto Mortgage Boston Newton',       city: 'Boston', status: 'pending',  isCurrentUserScope: false },
      { id: 'loc-bo5', name: 'Motto Mortgage Boston Quincy',       city: 'Boston', status: 'pending',  isCurrentUserScope: false },
    ],
  },

  // ── post-5: Awaiting approval — Step 1 complete, Step 2 in progress ─────────
  'post-5': {
    postId: 'post-5',
    workflowTitle: 'Manager review',
    submittedBy: 'Carlos Rivera',
    submittedAt: 'Mar 3, 2026 10:00 AM',
    deadline: 'Mar 6, 2026 11:59 PM',
    steps: [
      {
        stepNumber: 1,
        title: 'Step 1',
        status: 'complete',
        approvers: [
          { id: 'nolan', name: 'Nolan Botosh', isCurrentUser: false, responded: true, action: 'approved', respondedAt: 'Mar 3, 2026 2:00 PM', locationType: 'all' },
        ],
      },
      {
        stepNumber: 2,
        title: 'Step 2',
        status: 'current',
        approvers: [
          { id: 'current-user', name: 'Haresh', isCurrentUser: true, responded: false, locationType: 'all' },
          { id: 'kim', name: 'Manager Kim', isCurrentUser: false, responded: true, action: 'approved', respondedAt: 'Mar 3, 2026 4:00 PM', locationType: 'all' },
        ],
      },
    ],
    locations: [
      { id: 'loc-a', name: 'Motto Mortgage Denver Tech Center',  city: 'Denver', status: 'approved', actionedBy: 'Manager Kim', actionedAt: 'Mar 3, 2026 4:00 PM', isCurrentUserScope: true },
      { id: 'loc-b', name: 'Motto Mortgage Denver Airport',      city: 'Denver', status: 'pending',  isCurrentUserScope: true },
      { id: 'loc-c', name: 'Motto Mortgage Denver Highlands',    city: 'Denver', status: 'pending',  isCurrentUserScope: true },
      { id: 'loc-d', name: 'Motto Mortgage Denver Cherry Creek', city: 'Denver', status: 'rejected', rejectionReason: 'Image does not align with local market guidelines. Please use approved Denver regional assets.', actionedBy: 'Manager Kim', actionedAt: 'Mar 3, 2026 4:10 PM', isCurrentUserScope: true },
      { id: 'loc-e', name: 'Motto Mortgage Denver Union Station',city: 'Denver', status: 'pending',  isCurrentUserScope: true },
    ],
  },

  // ── post-9: Rejected ──────────────────────────────────────────────────────────
  'post-9': {
    postId: 'post-9',
    workflowTitle: 'Manager review',
    submittedBy: 'Ana Perez',
    submittedAt: 'Mar 3, 2026 9:00 AM',
    steps: [
      {
        stepNumber: 1,
        title: 'Step 1',
        status: 'complete',
        approvers: [
          { id: 'nolan', name: 'Nolan Botosh', isCurrentUser: false, responded: true, action: 'approved', respondedAt: 'Mar 3, 2026 11:00 AM', locationType: 'all' },
        ],
      },
      {
        stepNumber: 2,
        title: 'Step 2',
        status: 'rejected',
        approvers: [
          { id: 'current-user', name: 'Haresh', isCurrentUser: true, responded: true, action: 'rejected', respondedAt: 'Mar 4, 2026 10:30 AM', rejectionReason: 'Image does not meet brand guidelines. Please use approved photography from the Motto Mortgage asset library.', locationType: 'all' },
        ],
      },
    ],
    locations: [
      { id: 'loc-p1', name: 'Motto Mortgage Atlanta Downtown', city: 'Atlanta', status: 'approved', actionedBy: 'Haresh', actionedAt: 'Mar 4, 2026 10:20 AM', isCurrentUserScope: true },
      { id: 'loc-p2', name: 'Motto Mortgage Atlanta Midtown',  city: 'Atlanta', status: 'rejected', rejectionReason: 'Image does not meet brand guidelines.', actionedBy: 'Haresh', actionedAt: 'Mar 4, 2026 10:30 AM', isCurrentUserScope: true },
      { id: 'loc-p3', name: 'Motto Mortgage Boston Commons',   city: 'Boston',  status: 'rejected', rejectionReason: 'Caption needs local market customization before approval.', actionedBy: 'Haresh', actionedAt: 'Mar 4, 2026 10:35 AM', isCurrentUserScope: true },
    ],
  },

  // ── post-10: Awaiting — 10-step enterprise workflow at Step 5 ────────────────
  'post-10': {
    postId: 'post-10',
    workflowTitle: 'Enterprise approval — Houston',
    submittedBy: 'Maria Santos',
    submittedAt: 'Mar 2, 2026 9:00 AM',
    deadline: 'Mar 10, 2026 11:59 PM',
    steps: [
      { stepNumber: 1, title: 'Step 1 — Legal review',       status: 'complete',  approvers: [{ id: 'legal1', name: 'Legal Team',            isCurrentUser: false, responded: true, action: 'approved', respondedAt: 'Mar 2, 2026 11:00 AM', locationType: 'all' }] },
      { stepNumber: 2, title: 'Step 2 — Compliance',         status: 'complete',  approvers: [{ id: 'comp1', name: 'Compliance Officer',       isCurrentUser: false, responded: true, action: 'approved', respondedAt: 'Mar 2, 2026 2:00 PM',  locationType: 'all' }, { id: 'comp2', name: 'Sarah Mitchell', isCurrentUser: false, responded: true, action: 'approved', respondedAt: 'Mar 2, 2026 3:30 PM', locationType: 'all' }] },
      { stepNumber: 3, title: 'Step 3 — Brand team',         status: 'complete',  approvers: [{ id: 'brand1', name: 'Brand Team',             isCurrentUser: false, responded: true, action: 'approved', respondedAt: 'Mar 3, 2026 2:30 PM',  locationType: 'all' }] },
      { stepNumber: 4, title: 'Step 4 — Regional director',  status: 'complete',  approvers: [{ id: 'rd1', name: 'Regional Director West',     isCurrentUser: false, responded: true, action: 'approved', respondedAt: 'Mar 3, 2026 5:00 PM',  locationType: 'all' }] },
      {
        stepNumber: 5,
        title: 'Step 5 — Manager review',
        status: 'current',
        approvers: [
          { id: 'current-user', name: 'Haresh',          isCurrentUser: true,  responded: false, locationType: 'all' },
          { id: 'nolan3',       name: 'Nolan Botosh',    isCurrentUser: false, responded: true, action: 'approved', respondedAt: 'Mar 4, 2026 8:00 AM', locationType: 'all' },
          { id: 'jaxson3',      name: 'Jaxson Septimus', isCurrentUser: false, responded: false, locationType: 'all' },
        ],
      },
      { stepNumber: 6,  title: 'Step 6 — VP Marketing',       status: 'locked', approvers: [] },
      { stepNumber: 7,  title: 'Step 7 — Operations',          status: 'locked', approvers: [] },
      { stepNumber: 8,  title: 'Step 8 — Franchise owner',     status: 'locked', approvers: [] },
      { stepNumber: 9,  title: 'Step 9 — Executive sign-off',  status: 'locked', approvers: [] },
      { stepNumber: 10, title: 'Step 10 — Final publish',      status: 'locked', approvers: [] },
    ],
    locations: [
      { id: 'h-loc-1',  name: 'Motto Mortgage Houston Galleria',   city: 'Houston', status: 'pending', isCurrentUserScope: true },
      { id: 'h-loc-2',  name: 'Motto Mortgage Houston Heights',    city: 'Houston', status: 'pending', isCurrentUserScope: true },
      { id: 'h-loc-3',  name: 'Motto Mortgage Houston Memorial',   city: 'Houston', status: 'pending', isCurrentUserScope: true },
      { id: 'h-loc-4',  name: 'Motto Mortgage Houston Midtown',    city: 'Houston', status: 'pending', isCurrentUserScope: true },
      { id: 'h-loc-5',  name: 'Motto Mortgage Houston River Oaks', city: 'Houston', status: 'pending', isCurrentUserScope: true },
      { id: 'h-loc-6',  name: 'Motto Mortgage Sugar Land',         city: 'Houston', status: 'pending', isCurrentUserScope: true },
      { id: 'h-loc-7',  name: 'Motto Mortgage The Woodlands',      city: 'Houston', status: 'pending', isCurrentUserScope: true },
      { id: 'h-loc-8',  name: 'Motto Mortgage Katy',               city: 'Houston', status: 'pending', isCurrentUserScope: true },
      { id: 'h-loc-9',  name: 'Motto Mortgage Pearland',           city: 'Houston', status: 'pending', isCurrentUserScope: true },
      { id: 'h-loc-10', name: 'Motto Mortgage Pasadena',           city: 'Houston', status: 'pending', isCurrentUserScope: true },
      { id: 'h-loc-11', name: 'Motto Mortgage Baytown',            city: 'Houston', status: 'pending', isCurrentUserScope: true },
      { id: 'h-loc-12', name: 'Motto Mortgage Conroe',             city: 'Houston', status: 'pending', isCurrentUserScope: true },
    ],
  },

  // ── post-11: Awaiting — 3-step workflow at Step 2 (Seattle) ─────────────────
  'post-11': {
    postId: 'post-11',
    workflowTitle: 'Standard review — Northwest',
    submittedBy: 'Tom Chen',
    submittedAt: 'Mar 3, 2026 10:00 AM',
    deadline: 'Mar 8, 2026 11:59 PM',
    steps: [
      { stepNumber: 1, title: 'Step 1 — Compliance',       status: 'complete', approvers: [{ id: 'comp-s1', name: 'Compliance Team', isCurrentUser: false, responded: true, action: 'approved', respondedAt: 'Mar 4, 2026 9:00 AM', locationType: 'all' }] },
      {
        stepNumber: 2,
        title: 'Step 2 — Manager review',
        status: 'current',
        approvers: [
          { id: 'current-user', name: 'Haresh',       isCurrentUser: true,  responded: false, locationType: 'all' },
          { id: 'kim2',         name: 'Manager Kim',  isCurrentUser: false, responded: false, locationType: 'all' },
        ],
      },
      { stepNumber: 3, title: 'Step 3 — Regional director', status: 'locked', approvers: [] },
    ],
    locations: [
      { id: 's-loc-1', name: 'Motto Mortgage Seattle Downtown', city: 'Seattle', status: 'pending', isCurrentUserScope: true },
      { id: 's-loc-2', name: 'Motto Mortgage Bellevue',         city: 'Seattle', status: 'pending', isCurrentUserScope: true },
      { id: 's-loc-3', name: 'Motto Mortgage Redmond',          city: 'Seattle', status: 'pending', isCurrentUserScope: true },
      { id: 's-loc-4', name: 'Motto Mortgage Tacoma',           city: 'Seattle', status: 'pending', isCurrentUserScope: true },
      { id: 's-loc-5', name: 'Motto Mortgage Kirkland',         city: 'Seattle', status: 'pending', isCurrentUserScope: true },
      { id: 's-loc-6', name: 'Motto Mortgage Renton',           city: 'Seattle', status: 'pending', isCurrentUserScope: true },
    ],
  },

  // ── post-3: Rejected ──────────────────────────────────────────────────────────
  'post-3': {
    postId: 'post-3',
    workflowTitle: 'Brand Compliance review',
    submittedBy: 'Sarah Mitchell',
    submittedAt: 'Mar 2, 2026 11:00 AM',
    steps: [
      {
        stepNumber: 1,
        title: 'Step 1',
        status: 'rejected',
        approvers: [
          { id: 'compliance', name: 'Brand Compliance', isCurrentUser: false, responded: true, action: 'rejected', respondedAt: 'Mar 3, 2026 9:00 AM', rejectionReason: 'Image does not meet brand guidelines. Please use approved breakfast photography from the asset library.', locationType: 'all' },
        ],
      },
    ],
    locations: [
      { id: 'loc-r1', name: 'Motto Mortgage Chicago Loop',       city: 'Chicago', status: 'rejected', rejectionReason: 'Image does not meet brand guidelines.', actionedBy: 'Brand Compliance', actionedAt: 'Mar 3, 2026 9:00 AM', isCurrentUserScope: true },
      { id: 'loc-r2', name: "Motto Mortgage Chicago O'Hare",     city: 'Chicago', status: 'rejected', rejectionReason: 'Image does not meet brand guidelines.', actionedBy: 'Brand Compliance', actionedAt: 'Mar 3, 2026 9:00 AM', isCurrentUserScope: true },
      { id: 'loc-r3', name: 'Motto Mortgage Chicago Wicker Park',city: 'Chicago', status: 'rejected', rejectionReason: 'Image does not meet brand guidelines.', actionedBy: 'Brand Compliance', actionedAt: 'Mar 3, 2026 9:00 AM', isCurrentUserScope: true },
    ],
  },
};
