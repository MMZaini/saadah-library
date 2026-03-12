'use client'

import VolumeStructure from './VolumeStructure'

interface GenericVolumeStructureProps {
  bookId: string
  bookName: string
  volumes: number[] | string[]
  baseRoute?: string
  className?: string
}

// Simple thin wrapper that forwards props to the existing VolumeStructure component.
// Provide a default name if none is passed to satisfy VolumeStructureProps.
export default function GenericVolumeStructure({
  bookId,
  bookName,
  volumes,
  baseRoute,
  className,
}: GenericVolumeStructureProps) {
  return (
    <VolumeStructure
      bookId={bookId}
      bookName={bookName || bookId}
      volumes={volumes as any as number[]}
      baseRoute={baseRoute}
      className={className}
    />
  )
}
