import { Handle, Position } from '@xyflow/react'
import { Clock } from 'lucide-react'

export default function DelayNode({ data }) {
  return (
    <div className="react-flow__node-delay">
      <div className="wrapper">
        <div className="inner">
          <div className="body">
            <div className="icon">
              <Clock size={14} />
            </div>
            <div>
              <div className="title">{data.title}</div>
              {data.subtitle && <div className="subtitle">{data.subtitle}</div>}
            </div>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
