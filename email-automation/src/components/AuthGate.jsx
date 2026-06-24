import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

const AuthContext = createContext(null)

function GoogleMark() {
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
      G
    </span>
  )
}

function SignInPage({ error, loading, onSignIn }) {
  return (
    <main className="flex min-h-svh items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Email Automation</h1>
        </div>

        <Button
          type="button"
          onClick={onSignIn}
          disabled={loading}
          variant="ghost"
          className="!h-10 rounded-lg !border-2 !border-[#cfd4dc] !bg-white px-5 text-sm font-semibold !text-black shadow-[0_1px_0_rgba(255,255,255,0.55)_inset] hover:!border-[#b9c0ca] hover:!bg-white hover:!text-black"
        >
          {loading ? <Loader2 className="size-4 animate-spin !text-black" /> : <GoogleMark />}
          Sign in with Google
        </Button>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    </main>
  )
}

export function AuthGate({ children }) {
  const location = useLocation()
  const isAuthCallback = location.pathname === '/auth/callback'
  const [checking, setChecking] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  const refreshAuth = async () => {
    setChecking(true)
    setError('')
    try {
      const data = await api.authStatus()
      setUser(data.authenticated ? data.user : null)
    } catch (err) {
      setUser(null)
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (isAuthCallback) {
      setChecking(false)
      return
    }
    refreshAuth()
  }, [isAuthCallback])

  const signIn = async () => {
    setSigningIn(true)
    setError('')
    try {
      const { url } = await api.authUrl()
      window.location.href = url
    } catch (err) {
      setError(err.message)
      setSigningIn(false)
    }
  }

  const logout = async () => {
    try {
      await api.logout()
      setUser(null)
      window.location.href = '/'
    } catch (err) {
      toast.error(err.message)
    }
  }

  const value = useMemo(() => ({
    user,
    authenticated: Boolean(user),
    refreshAuth,
    logout,
  }), [user])

  if (isAuthCallback) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  }

  if (checking) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-white" />
      </main>
    )
  }

  if (!user) {
    return <SignInPage error={error} loading={signingIn} onSignIn={signIn} />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthGate')
  return context
}
