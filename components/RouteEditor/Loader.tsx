'use client'

import dynamic from 'next/dynamic'

const RouteEditor = dynamic(() => import('./index'), { ssr: false })

export default function RouteEditorLoader() {
  return <RouteEditor />
}
