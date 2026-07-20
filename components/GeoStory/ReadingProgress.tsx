'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="fixed top-14 left-0 right-0 h-[3px] z-50 pointer-events-none">
      <div
        className="h-full bg-red-600 origin-left"
        style={{ transform: `scaleX(${progress})`, transition: 'transform 120ms linear' }}
      />
    </div>
  )
}
