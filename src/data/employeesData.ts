export interface Employee {
  name: string
  email: string
  phone: string
  location: string
}

const LOCATION_NAMES = [
  'Austin, TX', 'Baltimore, MD', 'Boston, MA', 'Cambridge, MA', 'Chicago, IL',
  'Dallas, TX', 'Denver, CO', 'Houston, TX', 'Miami, FL', 'Nashville, TN',
  'New York, NY', 'Orlando, FL', 'Phoenix, AZ', 'Portland, OR', 'Sacramento, CA',
  'San Diego, CA', 'Seattle, WA', 'Tampa, FL',
]

const AREA_CODES = [212, 305, 404, 512, 602, 617, 702, 718, 801, 916, 973, 214, 312, 503, 615, 619, 206, 813]

function usPhone(i: number): string {
  const area = AREA_CODES[i % AREA_CODES.length]
  const mid = String(200 + ((i * 7) % 800)).padStart(3, '0')
  const last = String((i * 37) % 10000).padStart(4, '0')
  return `(${area}) ${mid}-${last}`
}

function emailFor(name: string, i: number): string {
  const local = name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.+|\.+$/g, '')
  return `${local}${i}@extraspace.com`
}

const NAMED_EMPLOYEES: Employee[] = [
  { name: 'aaronlammey lammey' },
  { name: 'ABC abc' },
  { name: 'ABC Rao' },
  { name: 'Abc Xyz' },
  { name: 'Akhilesh Singh' },
  { name: 'Akshat Jain' },
  { name: 'alan brown' },
  { name: 'Albert Brown' },
  { name: 'Alex Reese' },
  { name: 'Alka Jha' },
  { name: 'alred all' },
  { name: 'Alrin Fernendas' },
  { name: 'Aman Agrawal' },
  { name: 'Anam B' },
  { name: 'Andy Rao' },
].map((e, i) => ({
  name: e.name,
  email: emailFor(e.name, i),
  phone: usPhone(i),
  location: LOCATION_NAMES[i % LOCATION_NAMES.length],
}))

const FIRST_NAMES = [
  'Anita', 'Arjun', 'Bella', 'Carlos', 'Diana', 'Ethan', 'Farah', 'Gabriel', 'Hannah', 'Ishan',
  'Julia', 'Kevin', 'Lena', 'Manav', 'Nina', 'Oscar', 'Priya', 'Quentin', 'Rosa', 'Samir',
  'Tara', 'Umar', 'Vera', 'Will', 'Xena', 'Yusuf', 'Zara',
]
const LAST_NAMES = [
  'Anderson', 'Bhatt', 'Chen', 'Desai', 'Evans', 'Fisher', 'Gupta', 'Harris', 'Iyer', 'Johnson',
  'Kapoor', 'Lopez', 'Mehta', 'Nair', 'Owens', 'Patel', 'Quinn', 'Reddy', 'Shah', 'Turner',
]

function generateFillerEmployees(count: number): Employee[] {
  const out: Employee[] = []
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length]
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]
    const name = `${first} ${last}`
    out.push({
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@extraspace.com`,
      phone: usPhone(i + NAMED_EMPLOYEES.length),
      location: LOCATION_NAMES[i % LOCATION_NAMES.length],
    })
  }
  return out
}

export const EMPLOYEES: Employee[] = [...NAMED_EMPLOYEES, ...generateFillerEmployees(252)].sort((a, b) =>
  a.name.localeCompare(b.name),
)
