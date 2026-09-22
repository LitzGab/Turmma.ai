import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* A PELE DA TEACHY, COM AS NOSSAS CORES (20/09/2026).
   O Gabriel pediu "um ctrl c e ctrl v" da Teachy nas áreas de FERRAMENTAS e de TURMAS ("não está interessante o seu").
   As medidas abaixo foram tiradas da própria Teachy, no Chrome dele, a 1440 px (modal "Criar mais com IA" e a área
   "Turmas", aba por aba). O que ele decidiu ao ser perguntado: cópia fiel de layout, tamanhos, fontes e espaços, com
   AS NOSSAS CORES no lugar do azul, e ícones coloridos desenhados por nós.

   O mapa das cores (Teachy → aqui):
   · azul forte #476ee4 (botão, link, ícone de rótulo, sublinhado da aba) → o laranja da pinta (`caramelo`), com texto preto;
   · azul pálido de fundo #d2deff / #edf2ff (item ativo, chip, período ativo, trilho)  → cinza claro (`realce`, `realce-suave`);
   · azul pálido em selo pequeno (número da pergunta, preenchimento da barra de desempenho) → pêssego pálido (`marca-cx`);
   · borda azulada #d5e1ed / #d2deff → `linha` e `borda-campo`; fundo #fbfcfe → #FBFBFB; cabeçalho de tabela #f9fbff → #FAFAFA;
   · texto #0f151a / #313d47 / #6b7280 / #738b99 → `tinta` / `noite-alto` / `sutil` / `inativo`.
   As fontes são as dela: Quicksand 700 nos títulos, rótulos e botões (`font-teachy`), Inter no corpo (`font-teachy-corpo`).
   Nestas duas áreas vale o desenho da Teachy mesmo onde ele contraria o nosso padrão de espaço (título de página,
   botão de canto 8 em vez de pílula, página que rola como documento). Fora delas nada muda. */

/** A moldura: liga a fonte de corpo da Teachy em tudo que estiver dentro. */
export function PeleTeachy({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('font-teachy-corpo text-tinta', className)}>{children}</div>
}

/* ── Tipografia medida ─────────────────────────────────────────────────────────────────────────────── */
export const tipo = {
  /** "Criar mais com IA", "Turma sdc": Quicksand 24/700, linha 32 */
  titulo: 'font-teachy text-[24px] font-bold leading-8 text-tinta',
  /** "Turmas", "Recomendados", "Métricas principais", a pergunta numerada: Quicksand 18/700, linha 32 */
  secao: 'font-teachy text-[18px] font-bold leading-8 text-tinta',
  /** título de aba interna ("Uso de IA", "Boletim"): Quicksand 16/700 (20 na aba Alunos), linha 24 */
  aba: 'font-teachy text-[16px] font-bold leading-6 text-tinta',
  /** a linha cinza embaixo do título de aba: Inter 12/16 */
  apoio: 'text-[12px] leading-4 text-inativo',
  /** rótulo de cartão ("Média da turma"): Quicksand 14/700, linha 24 */
  rotulo: 'font-teachy text-[14px] font-bold leading-6 text-tinta',
}

/* ── Botão: canto 8, Quicksand 14/700. g = 42 px (página), m = 34 px (cabeçalho de aba), p = 28 px ("Gerenciar") ── */
const BOTAO_TAM = { g: 'h-[42px] px-4 text-[14px] leading-5', m: 'h-[34px] px-4 text-[14px] leading-5', p: 'h-7 px-3 text-[12px] leading-4 gap-1.5' }
const BOTAO_VAR = {
  primario: 'bg-caramelo text-tinta hover:bg-caramelo-claro active:bg-caramelo-fundo',
  contorno: 'border border-borda-campo bg-superficie text-tinta hover:bg-realce-suave',
  texto: 'text-tinta hover:bg-realce-suave',
}
export const botaoT = (variante: keyof typeof BOTAO_VAR = 'primario', tamanho: keyof typeof BOTAO_TAM = 'g', className?: string) =>
  cn('inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-[8px] font-teachy font-bold transition-colors duration-150 disabled:opacity-50 [&_svg]:size-[18px] [&_svg]:shrink-0',
    BOTAO_TAM[tamanho], BOTAO_VAR[variante], tamanho === 'p' && '[&_svg]:size-3.5', className)

export function BotaoT({ variante = 'primario', tamanho = 'g', className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: keyof typeof BOTAO_VAR; tamanho?: keyof typeof BOTAO_TAM }) {
  return <button type={type} className={botaoT(variante, tamanho, className)} {...props} />
}

/* ── O seletor de período: "2026 · 30D · 2M · 3M · 6M · 12M". 28 px de altura, Inter 12, fio de 1 px, canto 4 ── */
export const PERIODOS_T = ['2026', '30D', '2M', '3M', '6M', '12M'] as const
export function Periodo({ valor, aoMudar, opcoes = PERIODOS_T, className }: { valor: string; aoMudar: (v: string) => void; opcoes?: readonly string[]; className?: string }) {
  return (
    <div role="group" aria-label="Período" className={cn('inline-flex shrink-0 overflow-hidden rounded-[4px] border border-linha', className)}>
      {opcoes.map((o, i) => (
        <button key={o} type="button" aria-pressed={valor === o} onClick={() => aoMudar(o)}
          className={cn('h-[26px] px-3 text-[12px] leading-4 transition-colors duration-150', i > 0 && 'border-l border-linha',
            valor === o ? 'bg-realce-suave font-medium text-tinta' : 'bg-superficie text-inativo hover:text-tinta')}>
          {o}
        </button>
      ))}
    </div>
  )
}

/* ── Chip do cabeçalho da turma ("Arte", "Educação infantil", "Alunos (1)"): 26 px, canto 4, Inter 12 ── */
export function ChipT({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex h-[26px] shrink-0 items-center gap-1 rounded-[4px] bg-realce-suave px-2 text-[12px] leading-4 text-tinta [&_svg]:size-3.5', className)}>{children}</span>
}

/* ── Cartão: branco, canto 12, fio de 1 px, 16 px de respiro ── */
export function CartaoT({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-[12px] border border-linha bg-superficie p-4', className)}>{children}</div>
}

/* ── Cabeçalho de aba: título + linha de apoio à esquerda; à direita o período e o botão da aba ── */
export function CabecalhoAba({ titulo, apoio, children, grande = false }: { titulo: ReactNode; apoio?: ReactNode; children?: ReactNode; grande?: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 pb-6 pt-6">
      <div className="min-w-0">
        <h2 className={cn(tipo.aba, grande && 'text-[20px] leading-8')}>{titulo}</h2>
        {apoio && <p className={cn(tipo.apoio, 'mt-1', grande && 'text-[14px] leading-6')}>{apoio}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-4">{children}</div>}
    </div>
  )
}

/* ── A pergunta numerada da Visão geral: selo 24 × 24 de canto 4 + a pergunta em 18/700 ── */
export function PerguntaT({ n, children, lado }: { n: number; children: ReactNode; lado?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <h2 className={cn(tipo.secao, 'flex items-center gap-2')}>
        <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-[4px] bg-marca-cx-forte font-teachy text-[14px] font-bold leading-6 text-tinta">{n}</span>
        {children}
      </h2>
      {lado}
    </div>
  )
}

/* ── A alternância "Temas | Habilidades": botões de 40 px, canto 8, Inter 14 ── */
export function AlternaT<T extends string>({ opcoes, valor, aoMudar }: { opcoes: { id: T; nome: string }[]; valor: T; aoMudar: (v: T) => void }) {
  return (
    <div role="group" className="flex shrink-0 gap-2">
      {opcoes.map((o) => (
        <button key={o.id} type="button" aria-pressed={valor === o.id} onClick={() => aoMudar(o.id)}
          className={cn('h-10 rounded-[8px] px-4 text-[14px] leading-6 transition-colors duration-150', valor === o.id ? 'bg-realce font-semibold text-tinta' : 'font-medium text-sutil hover:bg-realce-suave')}>
          {o.nome}
        </button>
      ))}
    </div>
  )
}

/* ── Tabela: contorno de canto 8, cabeçalho de 49 px em #FAFAFA com Quicksand 14/700, célula com 12 × 16 de respiro ── */
export const tabelaT = {
  caixa: 'overflow-hidden rounded-[8px] border border-linha bg-superficie',
  tabela: 'w-full border-collapse text-left text-[14px] leading-6 text-tinta',
  cabeca: 'bg-[#FAFAFA]',
  th: 'h-[49px] whitespace-nowrap px-4 py-3 font-teachy text-[14px] font-bold leading-6 text-tinta',
  tr: 'border-t border-linha transition-colors duration-150 hover:bg-[#FAFAFA]',
  td: 'px-4 py-3 align-middle',
}

/* ── Avatar do aluno: círculo de 24 px com a inicial (na Teachy é azul; aqui, preto) ── */
export function AvatarT({ nome, className }: { nome: string; className?: string }) {
  return <span aria-hidden className={cn('grid size-6 shrink-0 place-items-center rounded-full bg-tinta font-teachy text-[11px] font-bold leading-none text-white', className)}>{nome.trim()[0]}</span>
}

/* ── Estado vazio da Teachy: faixa de ilustração, título 18/700, texto 14/24 cinza, botão de 42 px ── */
export function VazioT({ arte, titulo, texto, acao, tracejado = false, className }: { arte?: ReactNode; titulo: string; texto?: string; acao?: ReactNode; tracejado?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-5 rounded-[12px] border border-linha bg-superficie px-6 py-12 text-center', tracejado && 'border-dashed', className)}>
      {arte}
      <div>
        <h3 className={tipo.secao}>{titulo}</h3>
        {texto && <p className="mx-auto mt-1.5 max-w-[448px] text-[14px] leading-6 text-inativo">{texto}</p>}
      </div>
      {acao}
    </div>
  )
}
