import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { tipo } from './teachy'

/* As peças do painel do professor, refeitas em 19/09/2026 (o Gabriel achou a primeira versão "muito feia").
   O desenho vem do 21st.dev e é vestido com os tokens:
   · a faixa de números é a do sean0205/statistics-card-7 (4435): UM contorno, células separadas por fio,
     em vez de quatro cartões soltos com metade vazia;
   · o gráfico segue o sean0205/line-charts-1 (4659): grade tracejada, linha fina, ponto vazado, área em
     degradê. A peça original usa `recharts` (uns 100 kB); aqui é SVG à mão, que cabe no limite de 150 kB
     da regra 50 e não pede biblioteca.
   Cor: preto para o dado, laranja só no que pede atenção.
   OITAVA RODADA (20/09/2026): a área "Turmas" virou cópia da Teachy, e as peças DELA estão no fim deste arquivo (menus,
   cartão de métrica, barra de desempenho, minigráficos). As peças de cima continuam servindo: `Trilho` (abas da turma,
   sala), `LinhaBarra` (Meu uso), `Iniciais` (convite). `Secao`, `FaixaNumeros`, `Numero`, `Minilinha`, `GraficoEvolucao`
   e `Concluiu` ficaram sem uso nesta rodada (o "Meu uso" passou para a pele da Teachy); seguem aqui para os painéis
   que ainda vão nascer fora desta área. */

/** Cartão de seção: título de 15 px, uma linha de apoio em cinza e, à direita, no máximo uma ação. */
export function Secao({ titulo, apoio, acao, children, className }: {
  titulo: ReactNode; apoio?: ReactNode; acao?: ReactNode; children: ReactNode; className?: string
}) {
  return (
    <section className={cn('rounded-cartao border border-linha bg-superficie p-4 sm:p-5', className)}>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="font-corpo text-[15px] font-semibold leading-snug text-tinta">{titulo}</h2>
          {apoio && <p className="mt-0.5 text-[13px] leading-snug text-sutil">{apoio}</p>}
        </div>
        {acao}
      </header>
      {children}
    </section>
  )
}

/** A faixa de números: um contorno só, células separadas por um fio de 1 px (o fundo cinza aparece no vão). */
export function FaixaNumeros({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-px overflow-hidden rounded-cartao border border-linha bg-linha sm:grid-cols-2 lg:grid-cols-4', className)}>
      {children}
    </div>
  )
}

export function Numero({ rotulo, valor, sufixo, apoio, lado, className }: {
  rotulo: ReactNode; valor: ReactNode; sufixo?: ReactNode; apoio?: ReactNode; lado?: ReactNode; className?: string
}) {
  return (
    <div className={cn('flex min-h-[116px] flex-col bg-superficie p-4 sm:px-5', className)}>
      <p className="text-[13px] font-medium leading-tight text-sutil">{rotulo}</p>
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <p className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-tinta">
          {valor}{sufixo && <span className="ml-1.5 text-[15px] font-medium tracking-normal text-sutil">{sufixo}</span>}
        </p>
        {lado}
      </div>
      {apoio && <div className="mt-auto pt-2.5 text-[13px] leading-snug text-sutil">{apoio}</div>}
    </div>
  )
}

/** Minigráfico de linha para dentro de uma célula de número. Só forma: o valor está escrito ao lado. */
export function Minilinha({ valores, className }: { valores: number[]; className?: string }) {
  const min = Math.min(...valores), max = Math.max(...valores)
  const pontos = valores.map((v, i) => [(i / (valores.length - 1)) * 64 + 2, 22 - ((v - min) / Math.max(1, max - min)) * 18] as const)
  const [ux, uy] = pontos[pontos.length - 1]
  return (
    <svg aria-hidden viewBox="0 0 70 26" className={cn('h-[26px] w-[70px] shrink-0 overflow-visible', className)}>
      <polyline points={pontos.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--color-inativo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ux} cy={uy} r="2.75" fill="var(--color-tinta)" />
    </svg>
  )
}

/** Trilho fino de proporção (6 px). Preto para o dado, laranja para o que pede atenção. */
export function Trilho({ valor, tom = 'tinta', marca, className }: { valor: number; tom?: 'tinta' | 'caramelo' | 'cinza'; marca?: number; className?: string }) {
  const cor = { tinta: 'bg-tinta', caramelo: 'bg-caramelo', cinza: 'bg-inativo' }[tom]
  return (
    <div role="img" aria-label={`${valor}%`} className={cn('relative h-1.5 w-full rounded-full bg-realce', className)}>
      <div className={cn('h-full rounded-full', cor)} style={{ width: `${Math.max(2, Math.min(100, valor))}%` }} />
      {marca !== undefined && <span aria-hidden className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-borda-campo" style={{ left: `${marca}%` }} />}
    </div>
  )
}

/** Linha de uma lista de barras: nome e detalhe à esquerda, trilho no meio, número à direita. */
export function LinhaBarra({ nome, detalhe, valor, sufixo = '%', tom, marca, proporcao }: {
  nome: ReactNode; detalhe?: ReactNode; valor: number; sufixo?: string; tom?: 'tinta' | 'caramelo' | 'cinza'; marca?: number
  /** quanto do trilho encher, de 0 a 100, quando o número mostrado não é uma porcentagem */
  proporcao?: number
}) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_3.25rem]">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium leading-snug text-tinta">{nome}</p>
        {detalhe && <p className="truncate text-[12.5px] leading-snug text-inativo">{detalhe}</p>}
      </div>
      <p className="text-right text-sm font-semibold text-tinta sm:order-last">{valor}{sufixo}</p>
      <Trilho valor={proporcao ?? valor} tom={tom} marca={marca} className="col-span-2 sm:col-span-1" />
    </li>
  )
}

export type PontoEvolucao = { rotulo: string; data: string; valor: number }

/** Evolução em linha. A forma é SVG esticado (traço que não engrossa); grade, pontos e rótulos são HTML
    posicionados em %, para o texto não deformar quando a coluna muda de largura. */
export function GraficoEvolucao({ pontos, min = 20, max = 100, grade = [25, 50, 75, 100] }: { pontos: PontoEvolucao[]; min?: number; max?: number; grade?: number[] }) {
  const n = pontos.length
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100)
  const y = (v: number) => 100 - ((v - min) / (max - min)) * 100
  const linha = pontos.map((p, i) => `${x(i)},${y(p.valor)}`).join(' ')
  const area = `M0,100 L${pontos.map((p, i) => `${x(i)},${y(p.valor)}`).join(' L')} L100,100 Z`
  return (
    <figure className="m-0">
      <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2">
        <div className="relative h-[168px]">
          {grade.map((g) => <span key={g} className="absolute right-0 -translate-y-1/2 text-[11.5px] leading-none text-inativo" style={{ top: `${y(g)}%` }}>{g}%</span>)}
        </div>
        <div className="relative mx-2 h-[168px]">
          {grade.map((g) => <span key={g} aria-hidden className="absolute -inset-x-2 border-t border-dashed border-linha" style={{ top: `${y(g)}%` }} />)}
          <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <linearGradient id="evolucao-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-tinta)" stopOpacity="0.10" />
                <stop offset="1" stopColor="var(--color-tinta)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#evolucao-area)" />
            <polyline points={linha} fill="none" stroke="var(--color-tinta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
          {pontos.map((p, i) => {
            const ultimo = i === n - 1
            return (
              <span key={p.rotulo} title={`${p.rotulo} · ${p.data}: ${p.valor}%`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x(i)}%`, top: `${y(p.valor)}%` }}>
                <span className={cn('block size-2.5 rounded-full border-2', ultimo ? 'border-caramelo bg-caramelo' : 'border-tinta bg-superficie')} />
                <span className={cn('absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap text-xs font-semibold leading-none', ultimo ? 'rounded-full bg-tinta px-2 py-1 text-white' : 'text-tinta')}>{p.valor}%</span>
              </span>
            )
          })}
        </div>
        <span />
        <div className="relative mx-2 mt-2 h-4">
          {pontos.map((p, i) => <span key={p.rotulo} className={cn('absolute whitespace-nowrap text-[11.5px] leading-none text-inativo', i === 0 ? 'left-0' : i === n - 1 ? 'right-0' : '-translate-x-1/2')} style={i > 0 && i < n - 1 ? { left: `${x(i)}%` } : undefined}>{p.data}</span>)}
        </div>
      </div>
      <figcaption className="sr-only">{pontos.map((p) => `${p.rotulo}, ${p.data}: ${p.valor}%`).join('; ')}</figcaption>
    </figure>
  )
}

/** "5 de 5" em cinco tracinhos: quantas atividades atribuídas o aluno concluiu. É entrega, não comportamento (D69). */
export function Concluiu({ feitas, total }: { feitas: number; total: number }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] text-sutil" title={`Concluiu ${feitas} de ${total} do que você atribuiu`}>
      <span aria-hidden className="flex gap-0.5">
        {Array.from({ length: total }, (_, i) => <span key={i} className={cn('h-3 w-1.5 rounded-full', i < feitas ? 'bg-tinta' : 'bg-realce')} />)}
      </span>
      {feitas} de {total}
    </span>
  )
}

/** Iniciais num círculo cinza. Aluno não tem foto no sistema (regra 20, item 2). */
export function Iniciais({ nome, className }: { nome: string; className?: string }) {
  const partes = nome.split(' ')
  return (
    <span aria-hidden className={cn('grid size-8 shrink-0 place-items-center rounded-full bg-realce-suave text-xs font-medium text-apoio', className)}>
      {(partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase()}
    </span>
  )
}

/* ── Peças da área "Turmas", CÓPIA da Teachy (oitava rodada, 20/09/2026) ─────────────────────────────────────
   O Gabriel viu a versão "adaptada" e pediu "um ctrl c e ctrl v da Teachy". A pergunta numerada, a alternância, o
   chip, o cartão e o seletor de período passaram a vir da caixa comum (`turmma/teachy.tsx`). Aqui ficam só os DESENHOS
   que a caixa não tem, nas medidas da Teachy:
   · `BarraDesempenho`: a barra do cartão da turma — trilho de 16 px com a pílula do percentual DENTRO;
   · `MiniEvolucao` e `MiniHistograma`: os desenhos pequenos dos cartões de métrica, que cabem nos 44 px que sobram
     num cartão de 112 px (antes tinham 55 px e pediam um cartão mais alto).
   SAÍRAM, porque a cópia não usa: `Pergunta` (virou `PerguntaT`), `Alternancia` (virou `AlternaT` e `Periodo`),
   `BarraPilula` (a barra fina de 7 px) e `PilhaIniciais` (o cartão da lista não mostra mais quem precisa de atenção).
   Cor: tudo neutro. O laranja não entra em gráfico nesta área; o único tom é o pêssego pálido da pílula da barra. */

/* Os menus desta área (Filtrar, Convidar alunos, trocar de turma, Gerenciar, ⋮): canto 8, fio de 1 px, item de 36 px
   em Inter 14. O menu abre num portal, fora da `PeleTeachy`, por isso a fonte vai na própria classe. */
export const menuT = 'rounded-[8px] border-linha p-1.5 font-teachy-corpo text-tinta shadow-flutua'
export const itemT = 'h-9 cursor-pointer gap-2.5 rounded-[6px] px-2.5 text-[14px] leading-6 text-tinta [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-sutil'

/** Cartão de métrica da Teachy ("Métricas principais" da Visão Geral; os números de "Meu uso"): 112 px, canto 12, fio
    de 1 px, respiro 16, vão 12. Em cima o rótulo (ícone de 16 px no laranja + Quicksand 14/700); embaixo o valor grande
    com o complemento ao lado e, à direita, o desenho pequeno. */
export function MetricaT({ icone: Icone, rotulo, children, className }: { icone: ComponentType<{ className?: string; strokeWidth?: number }>; rotulo: string; children: ReactNode; className?: string }) {
  return (
    <div data-metrica className={cn('flex h-[112px] min-w-0 flex-col gap-3 rounded-[12px] border border-linha bg-superficie p-4', className)}>
      <h3 className={cn(tipo.rotulo, 'flex items-center gap-2')}><Icone aria-hidden className="size-4 shrink-0 text-caramelo" strokeWidth={2} /><span className="truncate">{rotulo}</span></h3>
      <div className="flex min-h-0 flex-1 items-end justify-between gap-3">{children}</div>
    </div>
  )
}

/** O valor grande do cartão de métrica (Inter 30/600) com até duas linhas pequenas de complemento ao lado. */
export function ValorT({ valor, linhas, apagado = false }: { valor: string; linhas: [string, string?]; apagado?: boolean }) {
  return (
    <div className="flex min-w-0 items-end gap-2">
      <p className={cn('whitespace-nowrap text-[30px] font-semibold leading-9 tracking-[-0.02em]', apagado ? 'text-inativo' : 'text-tinta')}>{valor}</p>
      <p className="min-w-0 pb-[3px] text-[12px] leading-4 text-sutil"><span className="block truncate">{linhas[0]}</span>{linhas[1] && <span className="block truncate text-inativo">{linhas[1]}</span>}</p>
    </div>
  )
}

/** A barra de desempenho do cartão da turma: trilho de 16 px (canto 10) e, dentro, a pílula com a largura do
    percentual e o número escrito nela. Sem nota ainda: a pílula mínima com "-%", como na Teachy. */
export function BarraDesempenho({ valor, className }: { valor: number | null; className?: string }) {
  return (
    <div role="img" aria-label={valor === null ? 'sem nota ainda' : `${valor}% de acerto`} className={cn('h-4 w-full overflow-hidden rounded-[10px] bg-realce-suave', className)}>
      <div className="flex h-4 w-fit items-center justify-end rounded-[10px] bg-marca-cx-forte px-1.5 py-0.5 text-[9px] font-medium leading-3 text-tinta"
        style={valor === null ? undefined : { minWidth: `${Math.max(0, Math.min(100, valor))}%` }}>
        {valor === null ? '-' : valor}%
      </div>
    </div>
  )
}

/** Mini-histograma de três faixas, para o cartão de métrica: a contagem em cima, a barra, o nome curto embaixo.
    44 px de altura no total. Com `vazio`, só o tracejado de onde as barras vão nascer. */
export function MiniHistograma({ faixas, vazio = false, className }: { faixas: { nome: string; curto?: string; valor: number; tom?: string }[]; vazio?: boolean; className?: string }) {
  const max = Math.max(1, ...faixas.map((f) => f.valor))
  return (
    <div role="img" aria-label={vazio ? 'sem nota ainda' : faixas.map((f) => `${f.nome}: ${f.valor}`).join('; ')} className={cn('flex h-11 shrink-0 items-end gap-1.5', className)}>
      {faixas.map((f) => (
        <div key={f.nome} title={vazio ? undefined : `${f.nome}: ${f.valor}`} className="flex w-8 flex-col items-center">
          <span className={cn('text-[10px] font-semibold leading-3', vazio ? 'text-inativo' : 'text-tinta')}>{vazio ? '-' : f.valor}</span>
          {vazio ? <span className="mt-0.5 h-1.5 w-4 rounded-[3px] border border-dashed border-borda-campo" />
            : <span className="mt-0.5 w-4 rounded-t-[3px] rounded-b-[1px] bg-tinta" style={{ height: `${f.valor === 0 ? 1 : Math.max(3, Math.round((f.valor / max) * 18))}px` }} />}
          <span className="mt-0.5 whitespace-nowrap text-[9px] leading-[10px] text-inativo">{f.curto ?? f.nome}</span>
        </div>
      ))}
    </div>
  )
}

/** Minievolução, para o cartão de métrica: a média da turma em cada atividade (ou bimestre), numa linha fina com o
    último ponto em preto; embaixo, a primeira e a última data. 44 px de altura no total. */
export function MiniEvolucao({ pontos, className }: { pontos: { rotulo: string; valor: number }[]; className?: string }) {
  const n = pontos.length
  // sem ponto nenhum (turma sem correção aprovada): só a linha tracejada onde a evolução vai aparecer
  if (n === 0) return (
    <div role="img" aria-label="sem nota ainda" className={cn('relative h-11 w-[116px] shrink-0', className)}>
      <span className="absolute inset-x-1 top-[15px] border-t border-dashed border-borda-campo" />
    </div>
  )
  const min = Math.min(...pontos.map((p) => p.valor)), max = Math.max(...pontos.map((p) => p.valor))
  const x = (i: number) => (n === 1 ? 50 : 4 + (i / (n - 1)) * 92)
  const y = (v: number) => 84 - ((v - min) / Math.max(0.5, max - min)) * 68
  return (
    <figure className={cn('m-0 h-11 w-[116px] shrink-0', className)}>
      <div className="relative h-[30px]">
        <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <polyline points={pontos.map((p, i) => `${x(i)},${y(p.valor)}`).join(' ')} fill="none" stroke="var(--color-inativo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {pontos.map((p, i) => (
          <span key={p.rotulo} title={`${p.rotulo}: ${p.valor.toFixed(1).replace('.', ',')}`} className={cn('absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full', i === n - 1 ? 'bg-tinta' : 'border-[1.5px] border-inativo bg-superficie')}
            style={{ left: `${x(i)}%`, top: `${y(p.valor)}%` }} />
        ))}
      </div>
      <div className="mt-0.5 flex justify-between text-[9px] leading-3 text-inativo"><span>{pontos[0].rotulo}</span>{n > 1 && <span>{pontos[n - 1].rotulo}</span>}</div>
      <figcaption className="sr-only">{pontos.map((p) => `${p.rotulo}: ${p.valor.toFixed(1).replace('.', ',')}`).join('; ')}</figcaption>
    </figure>
  )
}
