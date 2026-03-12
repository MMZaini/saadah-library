'use client'

import { useSettings } from '@/lib/settings-context'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

export default function SettingsSidebar() {
  const {
    settings,
    updateSettings,
    isSettingsOpen,
    toggleSettings,
    resetArabicFontSize,
    resetEnglishFontSize,
  } = useSettings()

  return (
    <Sheet open={isSettingsOpen} onOpenChange={toggleSettings}>
      <SheetContent side="right" className="flex flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Customize your reading experience.</SheetDescription>
        </SheetHeader>

        <Separator className="-mx-6 w-auto" />

        <div className="-mx-6 -mb-6 flex-1 space-y-6 overflow-y-auto px-6 pb-6 pt-1">
          {/* Hadith Display */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Hadith Display</h3>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Always show full text</p>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  Expand all hadith text by default
                </p>
              </div>
              <Switch
                checked={settings.alwaysShowFullHadith}
                onCheckedChange={(checked) => updateSettings({ alwaysShowFullHadith: checked })}
              />
            </label>
          </section>

          <Separator className="-mx-6 w-auto" />

          {/* Font Sizes */}
          <section className="space-y-5">
            <h3 className="text-sm font-medium text-foreground">Text Size</h3>

            {/* Arabic slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-muted">Arabic</span>
                <div className="flex items-center gap-2">
                  <span className="min-w-[3ch] text-right text-xs tabular-nums text-foreground-faint">
                    {settings.arabicFontSize}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={resetArabicFontSize}
                    title="Reset Arabic font size"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                min={70}
                max={200}
                step={5}
                value={[settings.arabicFontSize]}
                onValueChange={([v]) => updateSettings({ arabicFontSize: v })}
              />
            </div>

            {/* English slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-muted">English</span>
                <div className="flex items-center gap-2">
                  <span className="min-w-[3ch] text-right text-xs tabular-nums text-foreground-faint">
                    {settings.englishFontSize}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={resetEnglishFontSize}
                    title="Reset English font size"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                min={70}
                max={200}
                step={5}
                value={[settings.englishFontSize]}
                onValueChange={([v]) => updateSettings({ englishFontSize: v })}
              />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
