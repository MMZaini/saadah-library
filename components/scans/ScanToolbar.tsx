'use client'

import { useState } from 'react'
import {
  Highlighter,
  Underline,
  Palette,
  Move,
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
import { normalizeExportLayout } from '@/lib/scan-layout'
import {
  HIGHLIGHT_COLORS,
  UNDERLINE_COLORS,
  type Highlight,
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
  selectedHighlight: Highlight | null
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

const SINGLE_PAGE_LAYOUT_OPTIONS = LAYOUT_OPTIONS.filter((opt) => opt.value !== 'all-cover')

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
  const effectiveLayout = normalizeExportLayout(settings.layout, selectedCount)
  const layoutOptions = selectedCount > 1 ? LAYOUT_OPTIONS : SINGLE_PAGE_LAYOUT_OPTIONS
  const coverRelevant = effectiveLayout !== 'each'
  const multiFile =
    selectedCount > 1 && (effectiveLayout === 'each' || effectiveLayout === 'page-cover')
  const exportLabel =
    effectiveLayout === 'all-cover'
      ? 'Export page'
      : selectedCount > 0
        ? `Export ${selectedCount} ${selectedCount === 1 ? 'page' : 'pages'}`
        : 'Export pages'

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-lg border border-border bg-surface-1 p-4 shadow-xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-faint">
          Layout
        </p>
        <div className="space-y-1.5">
          {layoutOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSettingsChange({ layout: opt.value })}
              className={cn(
                'flex w-full flex-col rounded-md border px-3 py-2 text-left transition-colors',
                effectiveLayout === opt.value
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

function ColorPanel({
  tool,
  activeColor,
  onColorChange,
  selectedHighlight,
  onClose,
}: Pick<ScanToolbarProps, 'tool' | 'activeColor' | 'onColorChange' | 'selectedHighlight'> & {
  onClose: () => void
}) {
  const annotationKind =
    selectedHighlight?.kind ?? (tool === 'underline' ? 'underline' : 'highlight')
  const colors = annotationKind === 'underline' ? UNDERLINE_COLORS : HIGHLIGHT_COLORS
  const label = annotationKind === 'underline' ? 'Underline colour' : 'Highlight colour'

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label={label}
        className="absolute left-1/2 top-full z-50 mt-2 w-[min(17rem,calc(100vw-1rem))] -translate-x-1/2 rounded-lg border border-border bg-surface-1 p-3 shadow-xl"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-faint">
          {label}
        </p>
        <div className="grid grid-cols-6 gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => onColorChange(color.value)}
              title={color.name}
              aria-label={`${color.name} ${annotationKind}`}
              aria-pressed={activeColor.toLowerCase() === color.value.toLowerCase()}
              className={cn(
                'h-8 w-8 rounded-full border border-black/30 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                activeColor.toLowerCase() === color.value.toLowerCase() &&
                  'scale-105 shadow-sm ring-2 ring-white/70',
              )}
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
        <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 border-t border-border pt-3 text-sm text-foreground-muted">
          <span>Custom colour</span>
          <span
            className="relative h-8 w-12 overflow-hidden rounded-md border border-border"
            style={{ backgroundColor: activeColor }}
          >
            <input
              type="color"
              value={activeColor}
              onChange={(event) => onColorChange(event.currentTarget.value)}
              aria-label={`Custom ${annotationKind} colour`}
              className="absolute -inset-2 h-12 w-16 cursor-pointer opacity-0"
            />
          </span>
        </label>
        {selectedHighlight && (
          <p className="mt-2 text-xs text-foreground-faint">
            Changes apply to the selected {annotationKind}.
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
  const [colorOpen, setColorOpen] = useState(false)

  return (
    <>
      <div className="relative flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-2 sm:px-4">
        {/* Left: tools */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1 lg:pr-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 h-8 w-8 md:hidden"
            onClick={onOpenSidebar}
            title="Browse PDFs"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="inline-flex rounded-lg border border-border bg-surface-1 p-1 shadow-sm">
            <button
              type="button"
              disabled={!hasDoc}
              onClick={() => onToolChange('draw')}
              title="Highlight (drag)"
              aria-label="Draw highlight"
              aria-pressed={tool === 'draw'}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all disabled:opacity-40',
                tool === 'draw'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-foreground-muted hover:bg-surface-2 hover:text-foreground',
              )}
            >
              <Highlighter className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!hasDoc}
              onClick={() => onToolChange('underline')}
              title="Underline (drag under text)"
              aria-label="Draw underline"
              aria-pressed={tool === 'underline'}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all disabled:opacity-40',
                tool === 'underline'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-foreground-muted hover:bg-surface-2 hover:text-foreground',
              )}
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!hasDoc}
              onClick={() => onToolChange('select')}
              title="Select, move and resize highlights"
              aria-label="Select and move highlights"
              aria-pressed={tool === 'select'}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all disabled:opacity-40',
                tool === 'select'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-foreground-muted hover:bg-surface-2 hover:text-foreground',
              )}
            >
              <Move className="h-4 w-4" />
            </button>
          </div>

          <div className="relative ml-1">
            <button
              type="button"
              disabled={!hasDoc}
              onClick={() => {
                setExportOpen(false)
                setColorOpen((open) => !open)
              }}
              title="Choose annotation colour"
              aria-label="Choose annotation colour"
              aria-expanded={colorOpen}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-1 px-2 text-foreground-muted shadow-sm transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
            >
              <Palette className="h-4 w-4" />
              <span
                aria-hidden
                className="h-4 w-4 rounded-full border border-black/30"
                style={{ backgroundColor: activeColor }}
              />
            </button>
            {colorOpen && <ColorPanel {...props} onClose={() => setColorOpen(false)} />}
          </div>
        </div>

        {/* Center: page nav */}
        {hasDoc && (
          <div className="hidden items-center gap-1 rounded-lg border border-border bg-surface-1 p-1 shadow-sm lg:flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onPrev}
              disabled={!canPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[72px] text-center text-sm tabular-nums text-foreground-muted">
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
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
          <div className="hidden items-center gap-0.5 rounded-lg border border-border bg-surface-1 p-1 shadow-sm lg:flex">
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
              className="h-9 gap-1.5 rounded-lg shadow-sm"
              disabled={!hasDoc}
              onClick={() => {
                setColorOpen(false)
                setExportOpen((v) => !v)
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden lg:inline">Export</span>
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

      {/* Compact secondary row: retained until the viewer pane is wide enough for
          navigation, colours and zoom to fit comfortably in the primary row. */}
      {hasDoc && (
        <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-background px-2 py-1.5 lg:hidden">
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onPrev}
              disabled={!canPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[60px] text-center text-xs tabular-nums text-foreground-muted">
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

          <div className="h-5 w-px shrink-0 bg-border" />

          <div className="flex shrink-0 items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="min-w-[3rem] text-center text-xs tabular-nums text-foreground-muted">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
