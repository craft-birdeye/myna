import { useState } from 'react'
import { ChevronDown, ChevronRight, ListFilter } from 'lucide-react'
import { AddEmployeeDrawer, DataTable, FilterPanel, HeaderSearchField, Link, SelectMenu, TopNav } from '../components'
import { EMPLOYEES, Employee } from '../data/employeesData'
import { WIZARD_LOCATIONS } from '../data/wizardLocations'
import { EmployeeBulkImportScreen } from './EmployeeBulkImportScreen'

const LOCATION_OPTIONS = [{ value: 'all', label: 'All locations' }]

const FILTER_FIELDS = [{ id: 'location', label: 'Location', options: LOCATION_OPTIONS }]

interface EmployeesScreenProps {
  onBack: () => void
}

export function EmployeesScreen({ onBack }: EmployeesScreenProps) {
  const [locationOpen, setLocationOpen] = useState(false)
  const [locationFilter, setLocationFilter] = useState<string[]>([])
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES)
  const [addOpen, setAddOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [moreOpen, setMoreOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterSelections, setFilterSelections] = useState<Record<string, string[]>>({})
  const [view, setView] = useState<'list' | 'bulk-import'>('list')

  const columns = [
    { key: 'name' as const, label: 'Name' },
    { key: 'email' as const, label: 'Email' },
    { key: 'phone' as const, label: 'Phone' },
    { key: 'location' as const, label: 'Location' },
  ]

  const filteredEmployees = employees.filter(
    (e) =>
      !searchQuery.trim() ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (view === 'bulk-import') {
    return <EmployeeBulkImportScreen onBack={() => setView('list')} />
  }

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-xs bg-surface px-2xl pt-lg pb-0">
            <Link as="button" onClick={onBack} className="text-body">
              Settings
            </Link>
            <ChevronRight className="size-4 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
            <Link as="button" onClick={onBack} className="text-body">
              Account
            </Link>
            <ChevronRight className="size-4 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
            <div className="relative">
              <button
                type="button"
                onClick={() => setLocationOpen((o) => !o)}
                className="flex items-center gap-xs text-body text-text-primary hover:text-text-action"
              >
                {locationFilter.length === 0 ? 'All locations' : locationFilter[0]}
                <ChevronDown className="size-4 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
              {locationOpen && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={() => setLocationOpen(false)} />
                  <div className="absolute left-0 top-[calc(100%+4px)] z-[60] w-[200px]">
                    <SelectMenu
                      options={LOCATION_OPTIONS}
                      value={locationFilter}
                      onChange={(v) => {
                        setLocationFilter(v)
                        setLocationOpen(false)
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Header bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
            <h1 className="text-h3 text-text-primary">{employees.length} employees</h1>

            <div className="flex items-center gap-sm">
              <HeaderSearchField open={searchOpen} value={searchQuery} onOpenChange={setSearchOpen} onChange={setSearchQuery} />

              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex h-9 items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
              >
                Add employee
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMoreOpen((o) => !o)}
                  className="flex h-9 items-center gap-xs rounded-md border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
                >
                  More
                  <ChevronDown className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                </button>
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-[55]" onClick={() => setMoreOpen(false)} />
                    <div className="absolute right-0 top-[calc(100%+4px)] z-[60] min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
                      <p className="px-md pb-xs pt-sm text-[10px] uppercase tracking-wide text-text-tertiary">
                        Bulk actions
                      </p>
                      {(
                        [
                          'Delete employees',
                          'Bulk import',
                          'Download',
                        ] as const
                      ).map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            setMoreOpen(false)
                            if (label === 'Bulk import') setView('bulk-import')
                          }}
                          className="block w-full whitespace-nowrap px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                aria-label="Filters"
                onClick={() => setFilterOpen((o) => !o)}
                className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
              >
                <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="px-lg">
            <DataTable
              columns={columns}
              data={filteredEmployees as unknown as Record<string, unknown>[]}
              rowMenuItems={[
                { label: 'Edit', onClick: () => {} },
                { label: 'Remove', onClick: () => {}, variant: 'danger' },
              ]}
            />
          </div>
        </div>

        <FilterPanel
          open={filterOpen}
          fields={FILTER_FIELDS}
          selections={filterSelections}
          onSelectionsChange={setFilterSelections}
          onClose={() => setFilterOpen(false)}
        />
      </div>

      <AddEmployeeDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(values) => {
          setEmployees((prev) => [
            {
              name: `${values.firstName} ${values.lastName}`.trim() || 'Unnamed',
              email: values.email,
              phone: values.phone || '-',
              location: WIZARD_LOCATIONS.find((l) => l.id === values.location)?.name ?? '-',
            },
            ...prev,
          ])
          setAddOpen(false)
        }}
      />
    </div>
  )
}
