import { getBezierPath } from '@xyflow/react'

export default function CadenceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) {
  const xEqual = sourceX === targetX
  const yEqual = sourceY === targetY

  const [edgePath] = getBezierPath({
    sourceX: xEqual ? sourceX + 0.0001 : sourceX,
    sourceY: yEqual ? sourceY + 0.0001 : sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      fill="none"
    />
  )
}
