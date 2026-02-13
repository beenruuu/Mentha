"use client"

import React from 'react'

type Props = {
  code: string
  size?: number
  title?: string
  className?: string
}

export default function FlagIcon({ code, size = 18, title, className }: Props) {
  const cc = (code || '').toLowerCase()
  const dimension = size
  return (
    <span
      aria-label={title || code}
      title={title || code}
      className={`fi fi-${cc} inline-block align-middle ${className || ''}`.trim()}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: '9999px',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.05)'
      }}
    />
  )
}
