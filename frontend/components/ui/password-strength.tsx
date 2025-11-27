import * as React from 'react'

type Props = {
  password: string
}

export function passwordScore(password: string) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

export default function PasswordStrength({ password }: Props) {
  const score = React.useMemo(() => passwordScore(password), [password])

  const pct = Math.min(100, Math.round((score / 4) * 100))
  const color = score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-yellow-400' : 'bg-emerald-500'

  return (
    <div className="space-y-2 mt-2">
      <div className="h-2 w-full bg-zinc-800 rounded overflow-hidden">
        <div className={`${color} h-2`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-3 h-3 rounded-full ${password.length >= 8 ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
          <span>8+ caracteres</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-3 h-3 rounded-full ${/[A-Z]/.test(password) ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
          <span>Mayúscula</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-3 h-3 rounded-full ${/[0-9]/.test(password) ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
          <span>Número</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-3 h-3 rounded-full ${/[^A-Za-z0-9]/.test(password) ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
          <span>Carácter especial</span>
        </div>
      </div>
    </div>
  )
}
