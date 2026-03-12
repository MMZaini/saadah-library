export interface VolumeOption {
  value: string | number
  label: string
}

export function makeVolumeOptions(volumes: (string | number)[] | undefined): VolumeOption[] {
  const vols = Array.isArray(volumes) && volumes.length > 0 ? volumes : []

  if (vols.length === 0) {
    return [{ value: 1, label: 'Volume 1' }]
  }

  const options: VolumeOption[] = vols.map((v, i) => ({ value: v, label: `Volume ${i + 1}` }))

  if (vols.length > 1) {
    options.push({ value: 'all', label: 'All Volumes' })
  }

  return options
}

export function getVolumeLabelForValue(
  volumes: (string | number)[] | undefined,
  value: string | number,
): string {
  const options = makeVolumeOptions(volumes)
  const found = options.find((o) => String(o.value) === String(value))
  return found ? found.label : options[0]?.label || 'Volume 1'
}
