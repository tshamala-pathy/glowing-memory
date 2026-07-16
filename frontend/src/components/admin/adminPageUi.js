import React from 'react';

export const ADMIN_INPUT_CLASS =
  'mt-1.5 block w-full border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors bg-white';

export const AdminLoadingSkeleton = () => (
  <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
    <div className="h-48 rounded-3xl bg-slate-200" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 rounded-2xl bg-slate-200" />
      ))}
    </div>
    <div className="h-96 rounded-2xl bg-slate-200" />
  </div>
);

export const AdminPageBanner = ({
  image,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
}) => (
  <section className="relative overflow-hidden rounded-3xl shadow-lg min-h-[200px] sm:min-h-[220px]">
    <img src={image} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/30" />
    <div className="relative px-6 sm:px-8 py-8 sm:py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300 mb-2">{eyebrow}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{title}</h1>
        <p className="mt-2 text-slate-200 text-sm sm:text-base max-w-lg">{description}</p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  </section>
);

export const AdminStatGrid = ({ stats }) => (
  <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {stats.map((stat) => (
      <div key={stat.label} className={`rounded-2xl p-5 shadow-sm ${stat.tone}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${
                stat.tone?.includes('text-white') ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              {stat.label}
            </p>
            <p
              className={`mt-2 text-3xl font-bold ${
                stat.valueClass || (stat.tone?.includes('text-white') ? 'text-white' : 'text-slate-900')
              }`}
            >
              {stat.value}
            </p>
          </div>
          {stat.icon && (
            <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
            </span>
          )}
        </div>
      </div>
    ))}
  </section>
);

export const AdminListSection = ({
  title,
  subtitle,
  listIcon,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters = [],
  activeFilter,
  onFilterChange,
  showingCount,
  totalCount,
  onClearFilters,
  hasActiveFilters,
  onCreate,
  createLabel = 'New item',
  emptyTitle = 'No items found',
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  hideResultCount = false,
  children,
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    <div className="border-b border-slate-200 bg-slate-900 px-5 sm:px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {listIcon && (
            <span className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white">
              {listIcon}
            </span>
          )}
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-sm text-slate-300">{subtitle}</p>
          </div>
        </div>
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 self-start lg:self-center px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {createLabel}
          </button>
        )}
      </div>
    </div>

    <div className="px-5 sm:px-6 py-5 bg-slate-50 border-b border-slate-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {hasActiveFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange(filter.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === filter.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {filter.label}
              {typeof filter.count === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    activeFilter === filter.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {typeof showingCount === 'number' && typeof totalCount === 'number' && !hideResultCount && (
        <p className="text-xs font-medium text-slate-500">
          Showing <span className="text-slate-800 font-semibold">{showingCount}</span> of{' '}
          <span className="text-slate-800 font-semibold">{totalCount}</span>
        </p>
      )}
    </div>

    {showingCount === 0 ? (
      <div className="px-6 py-16 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          {listIcon || (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          )}
        </div>
        <h3 className="text-base font-bold text-slate-900">{emptyTitle}</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{emptyDescription}</p>
        {onEmptyAction && (
          <button
            type="button"
            onClick={onEmptyAction}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    ) : (
      children
    )}
  </section>
);

export const AdminTableWrap = ({ children }) => (
  <div className="overflow-x-auto">{children}</div>
);

export const AdminActionButtons = ({ onEdit, onDelete, editLabel = 'Edit', deleteLabel = 'Delete', extra }) => (
  <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
    {extra}
    {onEdit && (
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        {editLabel}
      </button>
    )}
    {onDelete && (
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
      >
        {deleteLabel}
      </button>
    )}
  </div>
);

export const AdminRefreshButton = ({ onClick, refreshing, label = 'Refresh' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={refreshing}
    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors min-w-[110px]"
  >
    {refreshing ? (
      <>
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading
      </>
    ) : (
      label
    )}
  </button>
);

export const AdminPrimaryBannerButton = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-sm shadow-md hover:bg-slate-50 transition-colors"
  >
    {children}
  </button>
);
