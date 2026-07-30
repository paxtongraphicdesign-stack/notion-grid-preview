'use client';

interface FilterBarProps {
  statuses: string[];
  platforms: string[];
  selectedStatus: string | null;
  selectedPlatform: string | null;
  onStatusChange: (v: string | null) => void;
  onPlatformChange: (v: string | null) => void;
}

export default function FilterBar({
  statuses,
  platforms,
  selectedStatus,
  selectedPlatform,
  onStatusChange,
  onPlatformChange,
}: FilterBarProps) {
  if (statuses.length === 0 && platforms.length === 0) return null;

  return (
    <div className="filter-bar">
      {statuses.length > 0 && (
        <select
          className="filter-select"
          value={selectedStatus ?? ''}
          onChange={(e) => onStatusChange(e.target.value || null)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
      {platforms.length > 0 && (
        <select
          className="filter-select"
          value={selectedPlatform ?? ''}
          onChange={(e) => onPlatformChange(e.target.value || null)}
          aria-label="Filter by platform"
        >
          <option value="">All platforms</option>
          {platforms.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
