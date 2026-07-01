// Coordinate conversion: image [x,y] (top-left origin) ↔ Leaflet [lat,lng] (lat = -y, lng = x)

export function imageToLeaflet([x, y]: [number, number]): [number, number] {
  return [-y, x]
}

export function leafletToImage([lat, lng]: [number, number]): [number, number] {
  return [Math.round(lng), Math.round(-lat)]
}

export type LineMode = 'route' | 'ledge' | 'crack' | 'roof' | 'rock'

export function lineStyle(mode: LineMode) {
  switch (mode) {
    case 'route': return { color: '#dc2626', weight: 3,   opacity: 0.95 }
    case 'ledge': return { color: '#475569', weight: 6,   opacity: 0.9,  dashArray: '1 5' }
    case 'crack': return { color: '#57534e', weight: 2,   opacity: 0.9,  dashArray: '5 3' }
    case 'roof':  return { color: '#2563eb', weight: 4,   opacity: 0.9,  dashArray: '2 8' }
    case 'rock':  return { color: '#292524', weight: 2.5, opacity: 0.9 }
  }
}

export interface GradeConv { french: string; uiaa: string; uk: string; aus: string }

export const GRADE_CONVERSIONS: Record<string, GradeConv> = {
  '5.0':  { french: '1',   uiaa: 'I',     uk: 'M',       aus: '1'  },
  '5.1':  { french: '2',   uiaa: 'II',    uk: 'D',       aus: '2'  },
  '5.2':  { french: '2+',  uiaa: 'III',   uk: 'VD',      aus: '3'  },
  '5.3':  { french: '3',   uiaa: 'III+',  uk: 'VD/MS',   aus: '4'  },
  '5.4':  { french: '3+',  uiaa: 'IV',    uk: 'MS',      aus: '5'  },
  '5.5':  { french: '4a',  uiaa: 'IV+',   uk: 'HS',      aus: '6'  },
  '5.6':  { french: '4b',  uiaa: 'V-',    uk: 'HS/4a',   aus: '7'  },
  '5.7':  { french: '4c',  uiaa: 'V',     uk: 'S/4a',    aus: '8'  },
  '5.8':  { french: '5a',  uiaa: 'V+',    uk: 'HVS/4b',  aus: '9'  },
  '5.9':  { french: '5b',  uiaa: 'VI-',   uk: 'HVS/4c',  aus: '10' },
  '5.10a':{ french: '5c',  uiaa: 'VI',    uk: 'E1/5a',   aus: '11' },
  '5.10b':{ french: '6a',  uiaa: 'VI+',   uk: 'E1/5b',   aus: '12' },
  '5.10c':{ french: '6a+', uiaa: 'VII-',  uk: 'E2/5b',   aus: '13' },
  '5.10d':{ french: '6b',  uiaa: 'VII',   uk: 'E3/5c',   aus: '14' },
  '5.11a':{ french: '6b+', uiaa: 'VII+',  uk: 'E3/5c',   aus: '15' },
  '5.11b':{ french: '6c',  uiaa: 'VII+',  uk: 'E4/6a',   aus: '16' },
  '5.11c':{ french: '6c+', uiaa: 'VIII-', uk: 'E4/6a',   aus: '17' },
  '5.11d':{ french: '7a',  uiaa: 'VIII',  uk: 'E5/6b',   aus: '18' },
  '5.12a':{ french: '7a+', uiaa: 'VIII+', uk: 'E5/6b',   aus: '19' },
  '5.12b':{ french: '7b',  uiaa: 'VIII+', uk: 'E6/6b',   aus: '20' },
  '5.12c':{ french: '7b+', uiaa: 'IX-',   uk: 'E6/6c',   aus: '21' },
  '5.12d':{ french: '7c',  uiaa: 'IX',    uk: 'E7/7a',   aus: '22' },
  '5.13a':{ french: '7c+', uiaa: 'IX+',   uk: 'E7/7a',   aus: '23' },
  '5.13b':{ french: '8a',  uiaa: 'X-',    uk: 'E8/7b',   aus: '24' },
  '5.13c':{ french: '8a+', uiaa: 'X',     uk: 'E8/7b',   aus: '25' },
  '5.13d':{ french: '8b',  uiaa: 'X+',    uk: 'E9/7c',   aus: '26' },
  '5.14a':{ french: '8b+', uiaa: 'XI-',   uk: 'E10/8a',  aus: '27' },
  '5.14b':{ french: '8c',  uiaa: 'XI',    uk: 'E10/8b',  aus: '28' },
  '5.14c':{ french: '8c+', uiaa: 'XI+',   uk: 'E11/8c',  aus: '29' },
  '5.14d':{ french: '9a',  uiaa: 'XII',   uk: 'E11/8c+', aus: '30' },
  '5.15a':{ french: '9a+', uiaa: 'XII',   uk: '—',       aus: '—'  },
  '5.15b':{ french: '9b',  uiaa: 'XII+',  uk: '—',       aus: '—'  },
  '5.15c':{ french: '9b+', uiaa: 'XII+',  uk: '—',       aus: '—'  },
  '5.15d':{ french: '9c',  uiaa: 'XIII',  uk: '—',       aus: '—'  },
}

// Topo JSON feature types (as saved by the editor)
export interface TopoFeatureRaw {
  type: 'route' | 'topo-line' | 'rock' | 'belay' | 'annotation'
  points?: [number, number][]
  position?: [number, number]
  style?: string
  label?: string
  pitch?: number
  title?: string
  grade?: string
  description?: string
  image?: string
}

export interface TopoData {
  image: { w: number; h: number }
  backgroundImage?: string
  features: TopoFeatureRaw[]
}
