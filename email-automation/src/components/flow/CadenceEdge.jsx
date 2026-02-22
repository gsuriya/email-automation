import { getBezierPath, EdgeLabelRenderer } from '@xyflow/react'
import AddNodePopover from './AddNodePopover'

export default function CadenceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) {
  const xEqual = sourceX === targetX
  const yEqual = sourceY === targetY

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: xEqual ? sourceX + 0.0001 : sourceX,
    sourceY: yEqual ? sourceY + 0.0001 : sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          <AddNodePopover
            onAdd={(type) => data?.onAddNode?.(type, data?.sourceNodeId)}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
