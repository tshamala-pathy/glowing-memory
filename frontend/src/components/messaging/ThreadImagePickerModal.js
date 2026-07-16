import React from 'react';
import {
  THREAD_COVER_PRESETS,
  THREAD_WALLPAPER_PRESETS,
} from '../../constants/threadBackgrounds';

const PRESET_CONFIG = {
  cover: {
    title: 'Sidebar cover photo',
    description: 'A clear photo for the left panel only — separate from chat wallpaper.',
    presetsLabel: 'Cover photos',
    presets: THREAD_COVER_PRESETS,
    renderPreview: (preset) => (
      <img src={preset.url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
    ),
  },
  wallpaper: {
    title: 'Chat wallpaper',
    description: 'Background behind messages in the chat box — separate from the sidebar cover.',
    presetsLabel: 'Wallpapers',
    presets: THREAD_WALLPAPER_PRESETS,
    renderPreview: (preset) => (
      <div
        className="aspect-[4/3] w-full"
        style={{
          backgroundImage: `url("${preset.url}")`,
          backgroundSize: preset.tileSize || 'cover',
          backgroundRepeat: preset.repeat ? 'repeat' : 'no-repeat',
          backgroundPosition: 'center',
        }}
      />
    ),
  },
};

/**
 * Modal to pick a preset or upload a custom image for sidebar cover or chat wallpaper.
 */
const ThreadImagePickerModal = ({
  mode,
  activePresetId,
  saving,
  coverInputRef,
  wallpaperInputRef,
  onClose,
  onSelectPreset,
  onUploadCover,
  onUploadWallpaper,
}) => {
  if (!mode) return null;

  const config = PRESET_CONFIG[mode];
  const fileInputRef = mode === 'cover' ? coverInputRef : wallpaperInputRef;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="thread-image-picker-title"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="thread-image-picker-title" className="text-base font-bold text-slate-900">
              {config.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{config.description}</p>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="px-5 py-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            {config.presetsLabel}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {config.presets.map((preset) => {
              const selected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  disabled={saving}
                  onClick={() => onSelectPreset(preset.id)}
                  className={`relative overflow-hidden rounded-xl border-2 text-left transition focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60 ${
                    selected ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {config.renderPreview(preset)}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent px-2 py-2 text-[11px] font-semibold text-white">
                    {preset.label}
                  </span>
                  {selected && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Your photo</p>
            <button
              type="button"
              disabled={saving}
              onClick={() => fileInputRef.current?.click()}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-sm font-semibold transition disabled:opacity-60 ${
                activePresetId === 'custom'
                  ? 'border-slate-900 bg-slate-50 text-slate-900'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              Upload from gallery
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">PNG, JPG, or WebP · max 5 MB</p>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          {saving && (
            <span className="mr-auto inline-flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              Saving…
            </span>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200/60 disabled:opacity-50"
          >
            Done
          </button>
        </footer>

        <input ref={coverInputRef} type="file" accept="image/*" onChange={onUploadCover} className="hidden" />
        <input ref={wallpaperInputRef} type="file" accept="image/*" onChange={onUploadWallpaper} className="hidden" />
      </div>
    </div>
  );
};

export default ThreadImagePickerModal;
