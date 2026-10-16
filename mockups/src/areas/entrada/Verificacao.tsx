import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Copy } from 'lucide-react'
import { Aviso, Botao, CLASSE_CAMPO } from '@/components/duo'
import { CascaPublica, Titulo, classeDoLink, useTituloDaAba } from '@/areas/publico/_casca'
import { introducaoVista } from '@/dados/sessao'
import { cn } from '@/lib/utils'

/* O SEGUNDO FATOR (/entrar/verificacao): obrigatório para a coordenação (F1), a secretaria e a operação (D76).
   · `?para=` diz para onde ir depois (só /coordenacao, /rede ou /operacao);
   · `?primeira=1` é a primeira vez, vinda do convite da coordenação: o desenho do QR para o app autenticador, os 6
     códigos de recuperação com COPIAR e o campo do código.
   Seis caixas de um dígito; colar o código inteiro preenche as seis. Qualquer código de 6 dígitos vale (a dica de
   quem apresenta mora no Mapa, R12). "Perdi o acesso" diz o que fazer (D78).
   13ª rodada: depois de confirmar, a primeira vez de cada papel vai à introdução — a coordenação vinda do convite
   (primeira=1) a /coordenacao/bem-vindo; a secretaria e a equipe Turmma a /rede/bem-vindo e /operacao/bem-vindo
   enquanto não viram a introdução. Nos outros casos, direto a `para`. */

const DESTINOS = ['/coordenacao', '/rede', '/operacao']
const RECUPERACAO = ['7KQ2-M9XD', 'R4TP-8WZN', 'H3VC-2LBF', 'Y6NJ-5QGS', 'D8MA-3EKT', 'P2WX-7CRH']

export function Verificacao() {
  const navegar = useNavigate()
  const [busca] = useSearchParams()
  const pedido = busca.get('para') ?? '/coordenacao'
  const para = DESTINOS.includes(pedido) ? pedido : '/coordenacao'
  const primeira = busca.get('primeira') === '1'
  useTituloDaAba(primeira ? 'Proteger a conta · Turmma' : 'Confirme que é você · Turmma')

  const [codigo, setCodigo] = useState(['', '', '', '', '', ''])
  const [perdi, setPerdi] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const completo = codigo.every((d) => d !== '')
  const destino = () => {
    if (para === '/coordenacao' && primeira) return '/coordenacao/bem-vindo'
    if (para === '/rede' && !introducaoVista('rede')) return '/rede/bem-vindo'
    if (para === '/operacao' && !introducaoVista('operacao')) return '/operacao/bem-vindo'
    return para
  }

  const preencher = (i: number, texto: string) => {
    const digitos = texto.replace(/\D/g, '')
    if (!digitos) { setCodigo((c) => c.map((x, j) => (j === i ? '' : x))); return }
    setCodigo((c) => {
      const n = [...c]
      for (let k = 0; k < digitos.length && i + k < 6; k++) n[i + k] = digitos[k]
      return n
    })
    refs.current[Math.min(i + digitos.length, 5)]?.focus()
  }

  return (
    <CascaPublica>
      <div className="animate-entra">
        <Titulo titulo={primeira ? 'Proteja sua conta' : 'Confirme que é você'}
          linha={primeira ? 'Escaneie com o app autenticador.' : 'Digite o código do app autenticador.'} />

        {primeira && <Configurar />}

        <form className="mt-6 grid gap-5" noValidate onSubmit={(e) => { e.preventDefault(); if (completo) navegar(destino()) }}>
          <fieldset className="grid gap-2">
            <legend className="mb-1.5 text-[15px] font-bold leading-5 text-tinta">{primeira ? 'Código do app' : 'Código de 6 números'}</legend>
            <div className="grid grid-cols-6 gap-2">
              {codigo.map((d, i) => (
                <input key={i} ref={(el) => { refs.current[i] = el }} value={d}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); preencher(i, v.length >= 6 ? v : v.slice(-1)) }}
                  onPaste={(e) => { e.preventDefault(); preencher(i, e.clipboardData.getData('text')) }}
                  onKeyDown={(e) => { if (e.key === 'Backspace' && !codigo[i] && i > 0) refs.current[i - 1]?.focus() }}
                  onFocus={(e) => e.currentTarget.select()}
                  inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} aria-label={`Dígito ${i + 1} de 6`}
                  autoFocus={i === 0 && !primeira}
                  className={cn(CLASSE_CAMPO, 'h-14 px-0 text-center text-[24px] font-bold tabular-nums')} />
              ))}
            </div>
          </fieldset>
          <Botao type="submit" largura="cheia" disabled={!completo}>Confirmar e entrar</Botao>
        </form>

        <div className="mt-5 grid gap-3">
          {perdi
            ? <Aviso tom="info">Peça a outra pessoa da coordenação ou à Turmma.</Aviso>
            : <p className="t-apoio"><button type="button" onClick={() => setPerdi(true)} className={classeDoLink}>Perdi o acesso ao aplicativo</button></p>}
          <div><Botao variante="fantasma" tamanho="m" className="-ml-3.5" onClick={() => navegar('/entrar')}>Voltar</Botao></div>
        </div>
      </div>
    </CascaPublica>
  )
}

/* ── Primeira vez: o QR e os códigos de recuperação ────────────────────────────────────────────────────── */

function Configurar() {
  const [copiado, setCopiado] = useState(false)
  const copiar = () => {
    try { void navigator.clipboard?.writeText(RECUPERACAO.join('\n')) } catch { /* sem área de transferência */ }
    setCopiado(true)
  }
  return (
    <div className="mt-5 grid grid-cols-[112px_1fr] gap-4">
      <DesenhoQR />
      <div className="min-w-0 rounded-[16px] border-2 border-borda p-3">
        <p className="text-[15px] font-bold leading-5 text-tinta">Códigos de recuperação</p>
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[14px] font-bold tabular-nums text-apoio">
          {RECUPERACAO.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <Botao variante="secundario" tamanho="p" className="mt-3" onClick={copiar}
          icone={copiado ? <Check strokeWidth={3} /> : <Copy strokeWidth={2.5} />}>{copiado ? 'Copiados' : 'Copiar'}</Botao>
      </div>
    </div>
  )
}

/** Um desenho de QR (não é um QR de verdade): os três quadrados de canto e um miolo sorteado sempre igual. As cores
    seguem o tema (no escuro, módulos claros sobre o fundo escuro). */
function DesenhoQR() {
  const n = 21
  const celulas = useMemo(() => {
    let a = 1337
    const sorteio = () => { a = (Math.imul(a ^ (a >>> 15), 0x2C1B3C6D) + 0x6D2B79F5) | 0; return ((a >>> 8) & 255) / 255 }
    const canto = (x: number, y: number) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8)
    const out: [number, number][] = []
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!canto(x, y) && sorteio() > 0.52) out.push([x, y])
    return out
  }, [])
  const olho = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="var(--color-white)" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" />
    </g>
  )
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} role="img" aria-label="Código QR para o app autenticador"
      className="size-28 rounded-[12px] border-2 border-borda bg-white p-1 text-tinta" shapeRendering="crispEdges">
      {celulas.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />)}
      {olho(0, 0)}{olho(n - 7, 0)}{olho(0, n - 7)}
    </svg>
  )
}
