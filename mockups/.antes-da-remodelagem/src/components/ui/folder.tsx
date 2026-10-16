import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* folder (21st.dev) — a pasta que o Gabriel escolheu (20/09/2026) para a Biblioteca: ao passar o mouse a frente
   tomba, e as três folhas de dentro se abrem em leque. Fica o desenho inteiro (aba de trás, três folhas, frente com
   aba e o brilho por dentro). Vestida na adoção:
   · cor por variável, na paleta do produto: `laranja` (o da pinta, no lugar do âmbar), `preto` e `cinza`;
   · `escala`, porque o original tem 240 × 160 px fixos — a caixa de fora já nasce do tamanho final, para a grade
     não pular;
   · `aberta` abre a pasta sem precisar do mouse (é o estado "selecionada"), e o grupo que dispara o movimento pode
     ser o cartão inteiro: basta o pai ter a classe `group/pasta`;
   · a folha de cima ganhou linhas, para parecer documento; movimento só com transform, e parado em `reduced-motion`.
   Saiu o "Hover over" do exemplo. */

const TONS = {
  laranja: { fundo: '#C95F1C', de: '#E8732E', ate: '#F08B4C', brilho: '#F6B083' },
  preto: { fundo: '#161616', de: '#262626', ate: '#474747', brilho: '#6B6B6B' },
  cinza: { fundo: '#B4B4B4', de: '#CFCFCF', ate: '#E4E4E4', brilho: '#F4F4F4' },
}

const SOLTA = 'transition-all duration-300 ease-out motion-reduce:transition-none'
// classes por extenso: o Tailwind só gera o que lê escrito no arquivo
const FOLHA_1 = 'group-hover/pasta:[transform:rotateX(-20deg)] group-data-[aberta=true]/pasta:[transform:rotateX(-20deg)]'
const FOLHA_2 = 'group-hover/pasta:[transform:rotateX(-30deg)] group-data-[aberta=true]/pasta:[transform:rotateX(-30deg)]'
const FOLHA_3 = 'group-hover/pasta:[transform:rotateX(-38deg)] group-data-[aberta=true]/pasta:[transform:rotateX(-38deg)]'

export function Folder({ tom = 'laranja', escala = 1, aberta = false, children, className }: {
  tom?: keyof typeof TONS; escala?: number; aberta?: boolean; children?: ReactNode; className?: string
}) {
  const t = TONS[tom]
  const vars = { '--pasta-fundo': t.fundo, '--pasta-de': t.de, '--pasta-ate': t.ate, '--pasta-brilho': t.brilho } as CSSProperties
  return (
    <div aria-hidden data-aberta={aberta} className={cn('group/pasta relative shrink-0', className)} style={{ width: 240 * escala, height: 176 * escala, ...vars }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${escala})`, width: 240, height: 176 }}>
        <div className="absolute inset-x-0 bottom-0 h-40 origin-bottom [perspective:1500px]">
          {/* o fundo da pasta, com a aba à esquerda */}
          <div className={cn("relative h-full w-full origin-top rounded-2xl rounded-tl-none bg-[var(--pasta-fundo)] after:absolute after:bottom-[99%] after:left-0 after:h-4 after:w-20 after:rounded-t-2xl after:bg-[var(--pasta-fundo)] after:content-[''] before:absolute before:-top-[15px] before:left-[75.5px] before:h-4 before:w-4 before:bg-[var(--pasta-fundo)] before:content-[''] before:[clip-path:polygon(0_35%,0%_100%,50%_100%)] group-hover/pasta:shadow-[0_20px_40px_rgba(0,0,0,.18)] group-data-[aberta=true]/pasta:shadow-[0_20px_40px_rgba(0,0,0,.18)]", SOLTA)} />
          {/* as três folhas */}
          <div className={cn('absolute inset-1 origin-bottom select-none rounded-2xl bg-[#CFCFCF]', SOLTA, FOLHA_1)} />
          <div className={cn('absolute inset-1 origin-bottom rounded-2xl bg-[#E4E4E4]', SOLTA, FOLHA_2)} />
          <div className={cn('absolute inset-1 origin-bottom overflow-hidden rounded-2xl bg-white p-5', SOLTA, FOLHA_3)}>
            {children ?? (
              <div className="space-y-2.5">
                <div className="h-1.5 w-2/5 rounded-full bg-black/25" />
                <div className="h-1.5 w-4/5 rounded-full bg-black/10" />
                <div className="h-1.5 w-3/5 rounded-full bg-black/10" />
                <div className="h-1.5 w-2/3 rounded-full bg-black/10" />
              </div>
            )}
          </div>
          {/* a frente, que tomba */}
          <div className={cn("absolute bottom-0 flex h-[156px] w-full origin-bottom items-end rounded-2xl rounded-tr-none bg-linear-to-t from-[var(--pasta-de)] to-[var(--pasta-ate)] after:absolute after:bottom-[99%] after:right-0 after:h-[16px] after:w-[146px] after:rounded-t-2xl after:bg-[var(--pasta-ate)] after:content-[''] before:absolute before:-top-[10px] before:right-[142px] before:size-3 before:bg-[var(--pasta-ate)] before:content-[''] before:[clip-path:polygon(100%_14%,50%_100%,100%_100%)] group-hover/pasta:shadow-[inset_0_20px_40px_var(--pasta-brilho),inset_0_-20px_40px_var(--pasta-fundo)] group-hover/pasta:[transform:rotateX(-46deg)_translateY(1px)] group-data-[aberta=true]/pasta:shadow-[inset_0_20px_40px_var(--pasta-brilho),inset_0_-20px_40px_var(--pasta-fundo)] group-data-[aberta=true]/pasta:[transform:rotateX(-46deg)_translateY(1px)]", SOLTA)} />
        </div>
      </div>
    </div>
  )
}

export default Folder
