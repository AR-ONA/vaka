import React from 'react'
import { parseFloorName } from '../utils/highestRecord'

interface FloorStarsProps {
  floorName: string
}

const SHAPE = 'M12 1 L14.6 9.4 L23 12 L14.6 14.6 L12 23 L9.4 14.6 L1 12 L9.4 9.4 Z'

// 큰 별은 층의 정수 부분, 작은 별은 소수 부분. 5층마다 색이 바뀌고 16층부터는 속이 빈 금색이다
function colorOf(level: number): { fill: string; stroke: string } {
  if (level <= 5) return { fill: '#e4115c', stroke: 'none' }
  if (level <= 10) return { fill: '#b11ad6', stroke: 'none' }
  if (level <= 15) return { fill: '#3b5cf5', stroke: 'none' }
  return { fill: 'none', stroke: '#9a8740' }
}

const Star: React.FC<{ level: number; small?: boolean }> = ({ level, small }) => {
  const { fill, stroke } = colorOf(level)
  return (
    <svg
      viewBox="0 0 24 24"
      className={`shrink-0 ${small ? 'size-3' : 'size-5'}`}
      fill={fill}
      stroke={stroke}
      strokeWidth={stroke === 'none' ? 0 : 1.5}
    >
      <path d={SHAPE} strokeLinejoin="round" />
    </svg>
  )
}

const FloorStars: React.FC<FloorStarsProps> = ({ floorName }) => {
  const { whole, fraction } = parseFloorName(floorName)
  // 소수 부분의 별은 마지막 큰 별과 같은 색이다
  const small = Math.max(whole, 1)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: whole }, (_, i) => (
        <Star key={`b${i}`} level={i + 1} />
      ))}
      {Array.from({ length: fraction }, (_, i) => (
        <Star key={`s${i}`} level={small} small />
      ))}
    </div>
  )
}

export default FloorStars
