'use client'

interface SearchFilterProps {
  search: string
  onSearchChange: (value: string) => void
  stageFilter: string
  onStageFilterChange: (value: string) => void
}

const STAGES = ['all', 'pending', 'plan_review', 'building', 'testing', 'complete', 'error']

export function SearchFilter({
  search,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
}: SearchFilterProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
      />
      <select
        value={stageFilter}
        onChange={(e) => onStageFilterChange(e.target.value)}
        className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
      >
        {STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {stage === 'all' ? 'All stages' : stage.replace('_', ' ')}
          </option>
        ))}
      </select>
    </div>
  )
}
