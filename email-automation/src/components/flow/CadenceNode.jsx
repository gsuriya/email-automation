import { Handle, Position } from '@xyflow/react'
import { Mail } from 'lucide-react'

export default function CadenceNode({ data }) {
  return (
    <div className="react-flow__node-cadence">
      <div className="wrapper gradient">
        <div className="inner">
          <div className="body">
            <div className="icon">
              {data.icon || <Mail size={14} />}
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
