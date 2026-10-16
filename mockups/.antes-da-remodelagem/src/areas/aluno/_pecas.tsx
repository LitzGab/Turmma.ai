import type { ReactNode } from 'react'
import { Check, type LucideIcon } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

/* Peças só da área do aluno (11.6). A mesma casca, mais calma:
   corpo nunca abaixo de 16 px (o leitor tem 11 anos, D43), barra em cor neutra,
   nenhuma coreografia de entrada, nenhum número subindo, nada que premie ficar (D59). */

/** A moldura de tela do aluno: igual à `Tela`, mas a linha de apoio tem 16 px. */
export function TelaAluno({ titulo, descricao, acoes, largura = 'media', objeto = false, children }: {
  titulo: ReactNode; descricao?: ReactNode; acoes?: ReactNode; largura?: 'conversa' | 'media'; objeto?: boolean; children: ReactNode
}) {
  // Mesmo padrão de espaço de turmma/tela: aba sem título; só tela de objeto (uma prova, uma lista) mostra o nome.
  return (
    <div className={cn('mx-auto w-full px-4 pb-8 pt-4 md:px-6 md:pt-5', largura === 'conversa' ? 'max-w-[760px]' : 'max-w-[1040px]')}>
      {objeto ? (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5">
          <div className="min-w-0">
            <h1 className="titulo-tela text-tinta">{titulo}</h1>
            {descricao && <p className="mt-1 max-w-[72ch] text-[15px] text-apoio">{descricao}</p>}
          </div>
          {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
        </header>
      ) : (
        <>
          <h1 className="sr-only">{titulo}</h1>
          {acoes && <div className="mb-4 flex flex-wrap items-center gap-2">{acoes}</div>}
        </>
      )}
      {children}
    </div>
  )
}

/** Barra calma: rótulo e número em texto de 16 px, preenchimento neutro. Não fica vermelha, não pisca. */
export function BarraCalma({ rotulo, detalhe, valor, maximo = 100, texto, className }: {
  rotulo: ReactNode; detalhe?: ReactNode; valor: number; maximo?: number; texto?: string; className?: string
}) {
  const pct = Math.round((valor / maximo) * 100)
  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="min-w-0 text-base text-tinta"><span className="font-medium">{rotulo}</span>{detalhe && <span className="text-sutil"> · {detalhe}</span>}</p>
        <p className="shrink-0 text-base font-semibold tabular-nums text-tinta">{texto ?? `${pct}%`}</p>
      </div>
      <Progress value={pct} aria-label={typeof rotulo === 'string' ? rotulo : undefined} className="h-2 rounded-full bg-ia-cx [&>div]:bg-sutil [&>div]:transition-none" />
    </div>
  )
}

/** Tela que EXPLICA, com ícone e uma frase. Tutor travado ou desligado não parece erro (D19). */
export function Explica({ icone: Icone, titulo, children, acao }: { icone: LucideIcon; titulo: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[560px] justify-items-center gap-4 px-4 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-cartao bg-info-cx text-info"><Icone className="size-7" strokeWidth={1.75} /></span>
      <h2 className="font-titulo text-[22px] font-semibold leading-tight tracking-[-0.02em] text-tinta">{titulo}</h2>
      <div className="grid gap-2 text-base leading-relaxed text-apoio">{children}</div>
      {acao && <div className="mt-1 flex flex-wrap justify-center gap-2">{acao}</div>}
    </div>
  )
}

/** "Resposta salva": aparece a cada item, em texto com ícone. Nunca só cor. */
export function RespostaSalva({ salvo }: { salvo: boolean }) {
  return (
    <p className={cn('inline-flex h-7 items-center gap-1.5 text-base', salvo ? 'text-ok' : 'text-sutil')} role="status">
      {salvo ? <><Check className="size-4" strokeWidth={2.4} /> Resposta salva</> : 'Escolha uma alternativa'}
    </p>
  )
}

export type Questao = { enunciado: string; alternativas: string[] }

/** Alternativas de questão objetiva: shadcn/radio-group, linha inteira clicável, alvo de 52 px. */
export function Alternativas({ questao, valor, aoEscolher, nome }: { questao: Questao; valor?: string; aoEscolher: (v: string) => void; nome: string }) {
  return (
    <RadioGroup value={valor ?? ''} onValueChange={aoEscolher} aria-label="Alternativas" className="gap-2.5">
      {questao.alternativas.map((alt, i) => {
        const letra = 'ABCDE'[i]
        const id = `${nome}-${letra}`
        const marcada = valor === letra
        return (
          <label key={letra} htmlFor={id}
            className={cn('flex min-h-[52px] cursor-pointer items-center gap-3 rounded-controle border px-4 py-3 text-base text-tinta transition-colors duration-150',
              marcada ? 'border-noite bg-info-cx font-medium' : 'border-linha bg-superficie hover:bg-realce')}>
            <RadioGroupItem id={id} value={letra} className="size-5 shrink-0 border-borda-campo text-noite data-[state=checked]:border-noite" />
            <span className="w-5 shrink-0 font-semibold text-apoio">{letra}</span>
            <span className="min-w-0">{alt}</span>
          </label>
        )
      })}
    </RadioGroup>
  )
}

/* Oito questões sintéticas de estequiometria, usadas na atividade e na prova. */
export const QUESTOES_ESTEQUIOMETRIA: Questao[] = [
  { enunciado: 'Qual é a massa de 2 mol de água? (H = 1; O = 16)', alternativas: ['18 g', '20 g', '36 g', '32 g'] },
  { enunciado: 'Quantos mols existem em 88 g de CO₂? (C = 12; O = 16)', alternativas: ['1 mol', '2 mol', '4 mol', '44 mol'] },
  { enunciado: 'Na reação N₂ + 3 H₂ → 2 NH₃, quantos mols de NH₃ se formam a partir de 6 mol de H₂?', alternativas: ['2 mol', '3 mol', '4 mol', '6 mol'] },
  { enunciado: 'Em 2 Al + 3 Cl₂ → 2 AlCl₃, com 54 g de Al e 71 g de Cl₂, qual é o reagente limitante? (Al = 27; Cl = 35,5)', alternativas: ['O alumínio', 'O cloro', 'Os dois acabam juntos', 'Nenhum dos dois'] },
  { enunciado: 'Qual é a massa de CO₂ formada na queima completa de 24 g de carbono?', alternativas: ['44 g', '56 g', '88 g', '24 g'] },
  { enunciado: 'Uma reação devia produzir 50 g e produziu 40 g. Qual foi o rendimento?', alternativas: ['40%', '50%', '80%', '90%'] },
  { enunciado: 'Quantos gramas de H₂ são necessários para formar 36 g de água?', alternativas: ['2 g', '4 g', '8 g', '18 g'] },
  { enunciado: 'A lei de Lavoisier diz que, numa reação em sistema fechado:', alternativas: ['a massa aumenta', 'a massa diminui', 'a massa se conserva', 'a massa vira energia'] },
]
