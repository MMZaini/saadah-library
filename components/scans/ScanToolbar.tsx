'use client'

import { useState } from 'react'
import {
  Highlighter,
  Eraser,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Menu,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  HIGHLIGHT_COLORS,
  type ExportLayout,
  type ExportFormat,
  type ExportDelivery,
} from '@/lib/scan-export'
import type { ScanTool } from './PageCanvas'

export interface ExportSettings {
  layout: ExportLayout
  format: ExportFormat
  delivery: ExportDelivery
  showBadge: boolean
  coverEnabled: boolean
  coverPage: number
}

export type CoverMode = 'book' | 'page' | null

interface ScanToolbarProps {
  hasDoc: boolean
  tool: ScanTool
  onToolChange: (tool: ScanTool) => void
  activeColor: string
  onColorChange: (color: string) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  currentPage: number
  numPages: number
  coverMode: CoverMode
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  selectedCount: number
  settings: ExportSettings
  onSettingsChange: (patch: Partial<ExportSettings>) => void
  onExport: () => void
  exporting: boolean
  onOpenSidebar: () => void
}

const LAYOUT_OPTIONS: { value: ExportLayout; label: string; hint: string }[] = [
  { value: 'each', label: 'Each page separately', hint: 'One image per selected page' },
  { value: 'page-cover', label: 'Page + cover', hint: 'Each page paired with the cover' },
  { value: 'all-cover', label: 'All pages + cover', hint: 'One wide image: pages then cover' },
]

function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded px-2.5 py-1 text-xs font-medium transition-colors',
            value === opt.value
              ? 'bg-accent text-accent-foreground'
              : 'text-foreground-muted hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function ExportPanel(props: ScanToolbarProps & { onClose: () => void }) {
  const {
    settings,
    onSettingsChange,
    selectedCount,
    numPages,
    coverMode,
    onExport,
    exporting,
    onClose,
  } = props
  const coverRelevant = settings.layout !== 'each'
  const multiFile =
    selectedCount > 1 && (settings.layout === 'each' || settings.layout === 'page-cover')
  const exportLabel =
    settings.layout === 'all-cover'
      ? 'Export page'
      : selectedCount > 0
        ? `Export ${selectedCount} ${selectedCount === 1 ? 'page' : 'pages'}`
        : 'Export pages'

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-surface-1 p-4 shadow-xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-faint">
          Layout
        </p>
        <div className="space-y-1.5">
          {LAYOUT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSettingsChange({ layout: opt.value })}
              className={cn(
                'flex w-full flex-col rounded-md border px-3 py-2 text-left transition-colors',
                settings.layout === opt.value
                  ? 'bg-accent/10 border-accent'
                  : 'border-border hover:bg-surface-2',
              )}
            >
              <span className="text-sm font-medium text-foreground">{opt.label}</span>
              <span className="text-xs text-foreground-faint">{opt.hint}</span>
            </button>
          ))}
        </div>

        {coverRelevant && (
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={settings.coverEnabled}
                onChange={(e) => onSettingsChange({ coverEnabled: e.target.checked })}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Include cover
            </label>
            {settings.coverEnabled && coverMode === 'page' ? (
              <label className="flex items-center justify-between gap-3 text-sm text-foreground-muted">
                <span>Cover page</span>
                <input
                  type="number"
                  min={1}
                  max={numPages}
                  value={settings.coverPage}
                  onChange={(event) => {
                    const parsed = Number(event.currentTarget.value)
                    onSettingsChange({
                      coverPage: Number.isFinite(parsed)
                        ? Math.min(numPages, Math.max(1, parsed))
                        : 1,
                    })
                  }}
                  className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm text-foreground"
                />
              </label>
            ) : settings.coverEnabled ? (
              <p className="text-xs text-foreground-faint">Uses the current book cover.</p>
            ) : null}
            {settings.coverEnabled && coverMode === 'page' && (
              <p className="text-xs text-foreground-faint">Page 1 is used by default.</p>
            )}
          </div>
        )}

        <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={settings.showBadge}
            onChange={(e) => onSettingsChange({ showBadge: e.target.checked })}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Page number badge (n/x)
        </label>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-foreground-muted">Format</span>
          <Seg
            value={settings.format}
            onChange={(format) => onSettingsChange({ format })}
            options={[
              { value: 'png', label: 'PNG' },
              { value: 'jpg', label: 'JPG' },
            ]}
          />
        </div>

        {multiFile && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-foreground-muted">Delivery</span>
            <Seg
              value={settings.delivery}
              onChange={(delivery) => onSettingsChange({ delivery })}
              options={[
                { value: 'zip', label: 'ZIP' },
                { value: 'separate', label: 'Separate' },
              ]}
            />
          </div>
        )}

        <Button
          className="mt-4 w-full"
          disabled={selectedCount === 0 || exporting}
          onClick={onExport}
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Exporting…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" /> {exportLabel}
            </>
          )}
        </Button>
        {selectedCount === 0 && (
          <p className="mt-2 text-center text-xs text-foreground-faint">
            Select pages from the sidebar first.
          </p>
        )}
      </div>
    </>
  )
}

export default function ScanToolbar(props: ScanToolbarProps) {
  const {
    hasDoc,
    tool,
    onToolChange,
    activeColor,
    onColorChange,
    zoom,
    onZoomIn,
    onZoomOut,
    currentPage,
    numPages,
    canPrev,
    canNext,
    onPrev,
    onNext,
    selectedCount,
    onOpenSidebar,
  } = props
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-2 sm:px-3">
      {/* Left: tools */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          onClick={onOpenSidebar}
          title="Browse PDFs"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="inline-flex rounded-md border border-border p-0.5">
          <button
            type="button"
            disabled={!hasDoc}
            onClick={() => onToolChange('draw')}
            title="Highlight (drag)"
            className={cn(
              'rounded p-1.5 transition-colors disabled:opacity-40',
              tool === 'draw'
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground-muted hover:text-foreground',
            )}
          >
            <Highlighter className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={!hasDoc}
            onClick={() => onToolChange('erase')}
            title="Erase (click a highlight)"
            className={cn(
              'rounded p-1.5 transition-colors disabled:opacity-40',
              tool === 'erase'
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground-muted hover:text-foreground',
            )}
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>

        <div className="ml-1 hidden items-center gap-1 sm:flex">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              disabled={!hasDoc}
              onClick={() => {
                onColorChange(color.value)
                onToolChange('draw')
              }}
              title={color.name}
              className={cn(
                'h-5 w-5 rounded-full border border-black/20 transition-transform disabled:opacity-40',
                activeColor === color.value && tool === 'draw'
                  ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                  : 'hover:scale-110',
              )}
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
      </div>

      {/* Center: page nav */}
      {hasDoc && (
        <div className="hidden items-center gap-1 sm:flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onPrev}
            disabled={!canPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[72px] text-center text-sm text-foreground-muted">
            {currentPage} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onNext}
            disabled={!canNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Right: zoom + export */}
      <div className="flex items-center gap-1">
        <div className="hidden items-center gap-0.5 sm:flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!hasDoc}
            onClick={onZoomOut}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span
            className={cn(
              'min-w-[3rem] px-1 text-center text-xs text-foreground-muted',
              !hasDoc && 'opacity-40',
            )}
          >
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!hasDoc}
            onClick={onZoomIn}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Button
            size="sm"
            className="h-8 gap-1.5"
            disabled={!hasDoc}
            onClick={() => setExportOpen((v) => !v)}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
            {selectedCount > 0 && (
              <span className="bg-accent-foreground/20 rounded-full px-1.5 text-[11px]">
                {selectedCount}
              </span>
            )}
          </Button>
          {exportOpen && <ExportPanel {...props} onClose={() => setExportOpen(false)} />}
        </div>
      </div>
    </div>
  )
}
