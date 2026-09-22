import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Marca } from '@/components/marca/Pinta'
import { NotaMockup } from '@/components/turmma/tela'

/* Segundo fator da coordenação: MFA obrigatório (F1). Seis campos de um dígito sobre shadcn/input. */
export function Verificacao() {
  const navegar = useNavigate()
  const [codigo, setCodigo] = useState(['4', '1', '8', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const completo = codigo.every((d) => d !== '')

  const digitar = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1)
    setCodigo((c) => c.map((x, j) => (j === i ? d : x)))
    if (d && i < 5) refs.current[i + 1]?.focus()
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-fundo px-4 py-10">
      <Marca className="mb-8 text-[24px]" />
      <Card className="w-full max-w-[420px] rounded-cartao border-linha shadow-none">
        <CardContent className="grid gap-5 p-6">
          <span className="grid size-11 place-items-center rounded-controle bg-info-cx text-info"><ShieldCheck className="size-5" /></span>
          <div>
            <h1 className="titulo-tela text-tinta">Confirme que é você</h1>
            <p className="mt-1.5 text-[15px] text-sutil">Digite o código de seis números do seu aplicativo autenticador. A coordenação sempre entra com esta segunda etapa.</p>
          </div>
          <form className="grid gap-5" onSubmit={(e) => { e.preventDefault(); navegar('/coordenacao') }}>
            <fieldset>
              <legend className="sr-only">Código de verificação</legend>
              <div className="grid grid-cols-6 gap-2">
                {codigo.map((d, i) => (
                  <Input key={i} ref={(el) => { refs.current[i] = el }} value={d} onChange={(e) => digitar(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Backspace' && !codigo[i] && i > 0) refs.current[i - 1]?.focus() }}
                    inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} aria-label={`Dígito ${i + 1} de 6`} maxLength={1}
                    className="h-14 rounded-controle border-borda-campo bg-superficie px-0 text-center text-2xl font-medium tabular-nums text-tinta" />
                ))}
              </div>
            </fieldset>
            <Button type="submit" className="h-12 w-full" disabled={!completo}>Confirmar e entrar</Button>
          </form>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <Link to="/entrar" className="text-tinta underline underline-offset-4 hover:text-sutil">Voltar</Link>
            <button type="button" className="text-tinta underline underline-offset-4 hover:text-sutil">Perdi o acesso ao aplicativo</button>
          </div>
        </CardContent>
      </Card>
      <div className="w-full max-w-[420px]"><NotaMockup>A1 · MFA obrigatório para coordenação (F1). No mockup, complete os três dígitos que faltam com qualquer número.</NotaMockup></div>
    </div>
  )
}
