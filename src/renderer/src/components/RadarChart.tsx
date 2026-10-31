import React from 'react'

interface RadarChartProps {
  axes: string[]
  values: number[] // axes와 같은 순서, 0~max
  max: number
}

const SIZE = 340
const CENTER = SIZE / 2
// 긴 라벨(능지/사이드)이 잘리지 않게 좌우를 넓히고, 위아래 빈 여백은 줄인다. 중심(CENTER) 기준 대칭
const VIEW_BOX = `${CENTER - 230} ${CENTER - 150} 460 300`
const RADIUS = 100
const LABEL_RADIUS = RADIUS + 28

// i번째 축 위, 중심에서 r만큼 떨어진 점. 첫 축이 위쪽에서 시작해 시계 방향으로 돈다
function point(i: number, count: number, r: number): [number, number] {
  const angle = -Math.PI / 2 + (2 * Math.PI * i) / count
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)]
}

const toPoints = (points: [number, number][]): string => points.map((p) => p.join(',')).join(' ')

const RadarChart: React.FC<RadarChartProps> = ({ axes, values, max }) => {
  const count = axes.length
  const rings = Array.from({ length: max }, (_, k) => k + 1)
  const data = values.map((v, i) => point(i, count, (Math.min(v, max) / max) * RADIUS))

  return (
    <svg
      viewBox={VIEW_BOX}
      className="mx-auto block w-full overflow-visible"
      role="img"
      aria-label={axes.map((a, i) => `${a} ${values[i]}`).join(', ')}
    >
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={toPoints(axes.map((_, i) => point(i, count, (ring / max) * RADIUS)))}
          fill="none"
          stroke="var(--ev-c-gray-2)"
          strokeWidth={ring === max ? 1.5 : 1}
        />
      ))}
      {axes.map((axis, i) => {
        const [x, y] = point(i, count, RADIUS)
        return <line key={axis} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="var(--ev-c-gray-3)" />
      })}

      <polygon
        points={toPoints(data)}
        className="fill-violet-400/25 stroke-violet-300"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {data.map(([x, y], i) =>
        values[i] > 0 ? (
          <circle key={axes[i]} cx={x} cy={y} r={3.5} className="fill-violet-300" />
        ) : null
      )}

      {axes.map((axis, i) => {
        const [x, y] = point(i, count, LABEL_RADIUS)
        const dx = x - CENTER
        const anchor = dx > 8 ? 'start' : dx < -8 ? 'end' : 'middle'
        return (
          <text
            key={axis}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className={`fill-current text-[13px] ${values[i] > 0 ? '' : 'opacity-40'}`}
          >
            {axis}
            {values[i] > 0 && <tspan className="fill-violet-300 font-semibold"> {values[i]}</tspan>}
          </text>
        )
      })}
    </svg>
  )
}

export default RadarChart
