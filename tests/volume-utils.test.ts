import { describe, expect, it } from 'vitest'
import { getVolumeLabelForValue, makeVolumeOptions } from '../lib/volume-utils'

describe('makeVolumeOptions', () => {
  it('defaults to a single Volume 1 option when no volumes are given', () => {
    expect(makeVolumeOptions(undefined)).toEqual([{ value: 1, label: 'Volume 1' }])
    expect(makeVolumeOptions([])).toEqual([{ value: 1, label: 'Volume 1' }])
  })

  it('labels volumes by position and omits "All Volumes" for a single volume', () => {
    expect(makeVolumeOptions(['Only-Volume-Id'])).toEqual([
      { value: 'Only-Volume-Id', label: 'Volume 1' },
    ])
  })

  it('adds an "All Volumes" option for multi-volume books', () => {
    const options = makeVolumeOptions(['Vol-A', 'Vol-B', 'Vol-C'])
    expect(options).toEqual([
      { value: 'Vol-A', label: 'Volume 1' },
      { value: 'Vol-B', label: 'Volume 2' },
      { value: 'Vol-C', label: 'Volume 3' },
      { value: 'all', label: 'All Volumes' },
    ])
  })
})

describe('getVolumeLabelForValue', () => {
  it('finds labels by value, comparing loosely across string/number', () => {
    expect(getVolumeLabelForValue([1, 2, 3], '2')).toBe('Volume 2')
    expect(getVolumeLabelForValue(['Vol-A', 'Vol-B'], 'Vol-B')).toBe('Volume 2')
    expect(getVolumeLabelForValue(['Vol-A', 'Vol-B'], 'all')).toBe('All Volumes')
  })

  it('falls back to the first option when the value is unknown', () => {
    expect(getVolumeLabelForValue(['Vol-A', 'Vol-B'], 'missing')).toBe('Volume 1')
    expect(getVolumeLabelForValue(undefined, 'missing')).toBe('Volume 1')
  })
})
