import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { login } from './session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Magandang Umaga'
  if (hour < 18) return 'Magandang Hapon'
  return 'Magandang Gabi'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [greeting] = useState(getGreeting)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-capiz px-4">
      <div className="w-full max-w-sm">
        {/* Seal */}
        <div className="flex justify-center animate-scale-in">
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-gold/30 bg-gold/5">
            <span className="text-2xl font-bold tracking-tight text-gold">B</span>
          </div>
        </div>

        {/* Greeting */}
        <div className="mt-5 text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <p className="text-sm font-medium tracking-[0.15em] text-narra uppercase">
            {greeting}
          </p>
        </div>

        {/* Gold rule */}
        <div
          className="mx-auto mt-5 h-px w-12 rounded-full bg-gold/50 animate-fade-in"
          style={{ animationDelay: '200ms' }}
          aria-hidden="true"
        />

        {/* Form */}
        <div className="mt-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="rounded-xl border border-bamboo bg-card p-6 shadow-sm sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@barangay.gov.ph"
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="text-base"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-pinoy/20 bg-red-pinoy/5 px-3.5 py-2.5 text-sm text-red-pinoy animate-fade-in">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full gap-2 text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p
          className="mt-8 text-center text-[11px] text-muted-foreground/30 animate-fade-in"
          style={{ animationDelay: '500ms' }}
        >
          Barangay System
        </p>
      </div>
    </div>
  )
}
