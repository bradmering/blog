import { notFound } from 'next/navigation'
import RouteEditorLoader from '@/components/RouteEditor/Loader'

export default function RouteEditorPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  return <RouteEditorLoader />
}
