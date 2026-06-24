import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeCode } from '@/lib/gmail'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('Connecting to Gmail...')

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setStatus('Error: No authorization code received.')
      return
    }

    exchangeCode({ code, state: searchParams.get('state') })
      .then((data) => {
        if (data.success) {
          setStatus(`Connected as ${data.user?.email || data.email}! Redirecting...`)
          setTimeout(() => navigate('/cold-emailing/spreadsheet'), 1500)
        } else {
          setStatus('Failed to connect Gmail. Please try again.')
        }
      })
      .catch(() => {
        setStatus('Something went wrong. Please try again.')
      })
  }, [searchParams, navigate])

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground mb-2">{status}</h2>
        <p className="text-sm text-muted-foreground">Please wait...</p>
      </div>
    </div>
  )
}
