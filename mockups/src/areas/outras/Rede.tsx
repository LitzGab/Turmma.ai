import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrainCircuit, Check, ChevronRight, Download, EyeOff, Info, Landmark, Lock, Mail, MapPin, MessageCircleQuestion, ShieldCheck } from 'lucide-react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import {
  Aviso, BarraDeFaixas, BarrasHorizontais, Botao, BotaoIcone, CabecalhoPagina, CartaoGrafico, CelulaLimiar, ColunasMensais, Delta, Dialogo,
  FonteNaAjuda, LadrilhoIcone, LadrilhoKPI, Legenda, Linha, Movimento, NumeroPequeno, Pagina, Segmentado, Selo, type Familia,
} from '@/components/duo'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import {
  FAIXAS, SITUACAO_DA_LINHA, painelDa, passaDoLimiar, textoDaContagem, valorDaColuna,
  type CartaoDeAcaoDados, type Coluna, type LinhaDoPainel, type SituacaoDaLinha,
} from '@/dados/gestao'
import { recorteDoPainel } from '@/dados/numeros-rede'
import { inteiro, reais } from '@/dados/numeros-escola'
import { usePreferencias } from '@/dados/preferencias'
import { useRede } from '@/dados/rede'
import { REDES_DO_PAINEL, useRedeAtual, type RedeId } from '@/dados/rede-atual'
import { ORGAO, PERGUNTAS, baixarRelatorioDaRede, perguntaDoCartao } from '@/dados/analista-rede'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

/* O PAINEL DA REDE (/rede), painéis de gestão (07/10/2026, 2ª forma; pesquisa/paineis-gestao/plano.md). "Painel é dado.
   Não faz sentido esse monte de texto." As métricas não mudaram (QUANTOS ALUNOS passaram de um limiar, nenhuma média);
   mudou a forma. Duas redes, a do seletor da lateral (useRedeAtual); números de painelDa(rede) e recorteDoPainel(rede, série).
   De cima para baixo:
   1. cabeçalho numa linha: Painel, escopo curto, o selo SÓ NÚMEROS AGREGADOS, Série e BAIXAR RELATÓRIO (secundário);
   2. 5 ladrilhos (LadrilhoKPI): os 3 cartões de ação (borda vermelha + prazo curto; levam às Escolas filtradas pela
      coluna) e < 75% e MAT < 6,0 (delta e minigráfico; levam às Escolas com a coluna acesa);
   3. Frequência por faixa (no Estado, a marca de 80% do Pé-de-Meia), a tendência fev → set e as notas < 6,0;
      — 1, 2 e 3 cabem na primeira dobra de 1440 × 780 —
   4. a grade escola × limiar (CelulaLimiar: cor só ao passar; "< 5"; as escolas sem dados com a situação);
   5. falta por escola (barras), onde trava (barras) e os números pequenos de IA e INEP; o pé com "Como contamos".
   Lei, limiar e fonte moram no "?" de cada bloco. SÓ AGREGADO: nenhum nome, nada por professor, escolas de A a Z. */

export const analistaRede = (pergunta: string) => `/rede/analista?pergunta=${encodeURIComponent(pergunta)}`

/* ── Como protegemos os dados (?protecao=1; do pé, do menu da conta e do Analista) ───────────────────────────────── */

function protecaoDa(rede: RedeId): { icone: ReactNode; cor: Familia; titulo: string; abaixo: string }[] {
  const o = ORGAO[rede]
  const quem = rede === 'estado' ? 'A regional' : 'A secretaria'
  return [
    { icone: <Landmark />, cor: 'anil', titulo: `Controlador: ${o.controlador}`, abaixo: 'Operador: Turmma · LGPD, arts. 5º e 23' },
    { icone: <EyeOff />, cor: 'roxo', titulo: `${quem} não vê aluno`, abaixo: 'Só contagens de grupos de 5 ou mais. O sistema não tem botão de ver nomes.' },
    { icone: <ShieldCheck />, cor: 'verde', titulo: 'Professor aprova antes', abaixo: 'Nada da IA chega ao aluno sem um professor aprovar.' },
    { icone: <Lock />, cor: 'azul', titulo: 'Dado de criança e adolescente', abaixo: 'Tratado no melhor interesse do aluno (LGPD, art. 14).' },
    { icone: <MapPin />, cor: 'turquesa', titulo: 'O dado do aluno fica no Brasil', abaixo: 'Planejado, ainda não contratado. Vai além do que a LGPD exige.' },
    { icone: <BrainCircuit />, cor: 'rosa', titulo: 'Não treina IA', abaixo: 'Nenhum dado da rede treina modelo.' },
    { icone: <Mail />, cor: 'amarelo', titulo: 'Encarregado dos dados', abaixo: o.encarregado },
  ]
}

export function ComoProtegemos({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const [rede] = useRedeAtual()
  return (
    <PainelLado aberto={aberto} aoFechar={aoFechar} titulo="Como protegemos os dados">
      <div className="-m-6">
        {protecaoDa(rede).map((p) => (
          <Linha key={p.titulo} titulo={p.titulo} className="px-6 [&_.t-cartao]:whitespace-normal"
            inicio={<LadrilhoIcone familia={p.cor} tamanho={40} icone={p.icone} className="text-(--texto) [&_svg]:stroke-[2.5]" />}
            abaixo={<span className="whitespace-normal">{p.abaixo}</span>} />
        ))}
      </div>
    </PainelLado>
  )
}

/* ── O relatório do mês: PDF para ler ou planilha CSV ──────────────────────────────────────────────────────────── */

export function RelatorioDaRede({ aberto, aoMudar, rede, porEmail, serie, aoBaixar }: {
  aberto: boolean; aoMudar: (v: boolean) => void; rede: RedeId; porEmail: boolean
  /** a série filtrada na tela: o relatório é sempre o da rede inteira, e o diálogo diz */
  serie?: string | null
  aoBaixar?: (arquivo: string) => void
}) {
  const [formato, setFormato] = useState<'pdf' | 'csv'>('pdf')
  const p = painelDa(rede)
  const itens = [
    'O que pede ação esta semana',
    'Frequência por faixa e notas abaixo de 6,0',
    `As ${p.linhas.length} escolas, de A a Z, em contagens`,
    'Onde a aprendizagem trava',
    'IA sob controle e indicadores anuais (INEP)',
  ]
  return (
    <Dialogo aberto={aberto} aoMudar={aoMudar} titulo="Relatório de setembro" largura={480}
      rodape={(
        <Botao icone={<Download strokeWidth={2.5} />} onClick={() => { const arquivo = baixarRelatorioDaRede(rede, formato); aoMudar(false); aoBaixar?.(arquivo) }}>Baixar</Botao>
      )}>
      <div className="grid gap-4">
        <p className="t-cartao text-tinta">{REDES_DO_PAINEL[rede].nome}</p>
        <ul className="grid gap-2.5">
          {itens.map((t) => (
            <li key={t} className="flex items-center gap-2.5 text-[17px] font-medium text-tinta">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-verde-claro text-verde-texto"><Check aria-hidden strokeWidth={3.5} className="size-4" /></span>{t}
            </li>
          ))}
        </ul>
        <Segmentado rotulo="Formato" valor={formato} aoMudar={(v) => setFormato(v as 'pdf' | 'csv')} className="flex w-full"
          opcoes={[{ id: 'pdf', rotulo: 'PDF para ler' }, { id: 'csv', rotulo: 'Planilha CSV' }]} />
        {serie && <Aviso tom="atencao">O relatório é sempre o da rede inteira. O filtro da tela ({serie}) não entra nele.</Aviso>}
        <Aviso tom="info">Só contagens de alunos. Nenhum nome, nenhum número de professor, nenhuma média.</Aviso>
        {porEmail && <p className="t-apoio">Também chega por e-mail no dia 1º.</p>}
      </div>
    </Dialogo>
  )
}

/* ── Peças da página ───────────────────────────────────────────────────────────────────────────────────────────── */

export function Bloco({ titulo, apoio, direita, children, className, id }: {
  titulo: ReactNode; apoio?: ReactNode; direita?: ReactNode; children: ReactNode; className?: string; id?: string
}) {
  return (
    <section id={id} aria-label={typeof titulo === 'string' ? titulo : undefined}
      className={cn('flex min-w-0 flex-col rounded-[16px] border-2 border-borda bg-white p-4', className)}>
      <div className="mb-3 flex min-h-7 shrink-0 flex-wrap items-center gap-x-2 gap-y-1">
        <h2 className="t-cartao min-w-0 text-tinta">{titulo}</h2>
        {apoio && <span className="t-apoio min-w-0">{apoio}</span>}
        {direita && <div className="ml-auto flex shrink-0 items-center gap-2">{direita}</div>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  )
}

export function Perguntar({ pergunta, rotulo }: { pergunta: string; rotulo: string }) {
  const navegar = useNavigate()
  return (
    <BotaoIcone rotulo={`Perguntar ao Analista: ${rotulo}`} tamanho={40} className="-my-1 -mr-2.5 size-8 text-azul-texto [&_svg]:!size-[18px]" onClick={() => navegar(analistaRede(pergunta))}>
      <MessageCircleQuestion strokeWidth={2.5} />
    </BotaoIcone>
  )
}

export const SeloAgregado = () => (
  <Selo tamanho="p" icone={<Lock strokeWidth={2.5} />} title="Só contagens de grupos de 5 ou mais alunos; nunca nome de aluno, nunca número de professor">Só números agregados</Selo>
)

function ComoContamos({ rede }: { rede: RedeId }) {
  const itens = [
    'Cada número é quantos alunos passaram de um limiar, com o limiar escrito. O painel não faz média.',
    `Oficial: chamada e notas lidas do diário (${REDES_DO_PAINEL[rede].sistema}) todo dia às 7h, o APOIA, ${rede === 'estado' ? 'a lista do Pé-de-Meia, ' : ''}o INEP.`,
    'Turmma: o que só existe porque o Turmma está na escola (provas aprovadas pelos professores, materiais da IA).',
    'Grupo com menos de 5 alunos aparece como "menos de 5".',
    'Escolas sempre de A a Z: o painel não ordena escolas.',
  ]
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button type="button" className="inline-flex shrink-0 items-center gap-1 rounded-[8px] px-1 text-sutil transition-colors hover:bg-fundo-suave hover:text-tinta">
          <Info aria-hidden className="size-4" strokeWidth={2.5} /> Como contamos
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content side="top" align="start" sideOffset={6} collisionPadding={12}
          className="z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-[12px] border-2 border-borda bg-white px-4 py-3 text-tinta shadow-[0_4px_0_0_var(--color-borda)]">
          <p className="t-cartao mb-1.5">Como contamos</p>
          <ul className="grid gap-1.5">
            {itens.map((t) => <li key={t} className="text-[14px] font-medium leading-5 text-apoio">{t}</li>)}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

/** O filtro Série (o único da tela, além da rede, que mora na lateral). */
export function FiltroSerie({ rede, serie, mudar, largo }: { rede: RedeId; serie: string | null; mudar: (s: string | null) => void; largo?: boolean }) {
  const series = painelDa(rede).series
  return (
    <Select value={serie ?? 'todas'} onValueChange={(v) => mudar(v === 'todas' ? null : v)}>
      <SelectTrigger aria-label="Série" className={cn('h-10 gap-2 whitespace-nowrap text-[15px]', largo ? 'w-full' : 'w-auto min-w-[168px]')}>
        <span className="truncate"><span className="text-sutil">Série:</span> <b className="font-bold">{serie ?? 'Todas'}</b></span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todas">Todas as séries</SelectItem>
        {series.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

/** Para onde vai o botão de cada cartão de ação: as Escolas filtradas pela coluna do cartão. */
export function destinoDoCartao(a: CartaoDeAcaoDados): string {
  if (a.destino.tipo === 'tabela') return `/rede/escolas?coluna=${a.destino.coluna}`
  if (a.destino.tipo === 'rota' && a.id === 'revisao') return '/rede/escolas?coluna=revisao'
  if (a.destino.tipo === 'rota') return a.destino.para
  return '/rede/escolas'
}

const SITUACAO_COR: Record<SituacaoDaLinha, Familia | 'neutro'> = { 'com-dados': 'verde', 'sem-lista': 'neutro', montando: 'amarelo', convite: 'azul' }
const SITUACAO_CURTA: Record<SituacaoDaLinha, string> = { 'com-dados': 'Com dados', 'sem-lista': 'Sem lista', montando: 'Montando', convite: 'Convite' }

/** As escolas da prefeitura criadas na demonstração (a operação cria e convida): entram na lista, sem dados. */
export function useLinhasDaRede(rede: RedeId, linhas: LinhaDoPainel[]): LinhaDoPainel[] {
  const vista = useRede()
  return useMemo(() => {
    if (rede !== 'prefeitura') return linhas
    const extras = vista.escolas.filter((e) => e.criada && !linhas.some((l) => l.id === e.id)).map((e): LinhaDoPainel => ({
      id: e.id, nome: e.nome, curto: e.curto, alunos: 0, situacao: e.situacao === 'convite' ? 'convite' : 'montando', dados: null,
    }))
    return [...linhas, ...extras].sort((a, b) => a.curto.localeCompare(b.curto, 'pt-BR'))
  }, [rede, linhas, vista.escolas])
}

/** A tabela das escolas em contagens: a célula só ganha cor quando passa do limiar da coluna. */
export function TabelaDasEscolas({ rede, linhas, colunas, extra, destaque, aoAbrir, celular, rotulo }: {
  rede: RedeId
  linhas: LinhaDoPainel[]
  colunas: Coluna[]
  /** uma coluna a mais no fim (a da IA, nas Escolas) */
  extra?: { id: string; rotulo: string; titulo: string; valor: (l: LinhaDoPainel) => number | null }
  /** a coluna acesa (a do cartão que trouxe a pessoa) */
  destaque?: string | null
  aoAbrir?: (id: string) => void
  celular?: boolean
  rotulo: string
}) {
  const cols = celular ? colunas.filter((c) => c.essencial || c.id === destaque) : colunas
  const aceso = (id: string) => destaque === id
  if (celular) {
    /* a 375, uma linha por escola: o nome e, embaixo, as contagens das colunas essenciais, cada uma com o rótulo */
    return (
      <ul aria-label={rotulo} className="-mx-1 grid">
        {linhas.map((l) => (
          <li key={l.id} className="border-b-2 border-borda last:border-b-0">
            <button type="button" onClick={aoAbrir ? () => aoAbrir(l.id) : undefined} disabled={!aoAbrir}
              className="flex w-full items-center gap-2 rounded-[10px] px-1 py-2.5 text-left transition-colors hover:bg-fundo-suave">
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold leading-5 text-tinta">{l.curto}</span>
                {l.dados
                  ? (
                    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {[...cols.map((c) => ({ id: c.id, rotulo: c.rotulo, v: valorDaColuna(l, c.id), passou: passaDoLimiar(c, valorDaColuna(l, c.id), l.alunos), m5: c.unidade === 'alunos' })),
                        ...(extra ? [{ id: extra.id, rotulo: extra.rotulo, v: extra.valor(l), passou: false, m5: true }] : [])].map((x) => (
                        <span key={x.id} className={cn('inline-flex items-center gap-1 rounded-[8px]', aceso(x.id) && 'bg-azul-claro pr-1.5')}>
                          <CelulaLimiar valor={x.v} menosDe5={x.m5} passou={x.passou} className="h-6 whitespace-nowrap px-1 text-[14px]" />
                          <span className="text-[12px] font-bold uppercase leading-4 tracking-[.04em] text-sutil">{x.rotulo}</span>
                        </span>
                      ))}
                    </span>
                  )
                  : <span className="mt-1 flex items-center gap-2"><Selo tamanho="p" familia={SITUACAO_COR[l.situacao]}>{SITUACAO_CURTA[l.situacao]}</Selo><span className="text-[14px] font-medium text-sutil">ainda sem dados</span></span>}
              </span>
              {aoAbrir && <ChevronRight aria-hidden className="size-5 shrink-0 text-sutil" strokeWidth={2.5} />}
            </button>
          </li>
        ))}
      </ul>
    )
  }
  const th = 't-selo h-10 whitespace-nowrap px-2 pb-1.5 align-bottom text-[12px] text-sutil shadow-[inset_0_-2px_0_var(--color-borda)]'
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full border-collapse text-[15px] leading-5 tabular-nums">
        <caption className="sr-only">{rotulo}</caption>
        <thead>
          <tr>
            <th scope="col" className={cn(th, 'pl-0 text-left')}>Escola</th>
            <th scope="col" className={cn(th, 'text-right max-sm:hidden')}>Alunos</th>
            {cols.map((c) => (
              <th key={c.id} scope="col" title={`${c.titulo}. ${c.limiar}.`}
                className={cn(th, 'text-right', aceso(c.id) && 'bg-azul-claro text-azul-texto')}>{c.rotulo}</th>
            ))}
            {extra && <th scope="col" title={extra.titulo} className={cn(th, 'text-right', aceso(extra.id) && 'bg-azul-claro text-azul-texto')}>{extra.rotulo}</th>}
            {aoAbrir && <th scope="col" className={cn(th, 'w-8 px-0')}><span className="sr-only">Abrir</span></th>}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const abrir = aoAbrir ? () => aoAbrir(l.id) : undefined
            const td = 'h-11 border-b-2 border-borda px-2 text-right last:border-b-0'
            return (
              <tr key={l.id} onClick={abrir} className={cn('[&:last-child>*]:border-b-0', abrir && 'cursor-pointer transition-colors hover:bg-fundo-suave')}>
                <th scope="row" className="h-11 whitespace-nowrap border-b-2 border-borda pl-0 pr-3 text-left font-bold text-tinta">
                  {abrir
                    ? <button type="button" onClick={(e) => { e.stopPropagation(); abrir() }} className="text-left underline-offset-2 hover:underline focus-visible:underline">{l.curto}</button>
                    : l.curto}
                </th>
                <td className={cn(td, 'font-medium text-sutil max-sm:hidden')}>{l.dados ? inteiro(l.alunos) : ''}</td>
                {l.dados
                  ? cols.map((c) => {
                      const v = valorDaColuna(l, c.id)
                      return (
                        <td key={c.id} className={cn(td, aceso(c.id) && 'bg-azul-claro/60')}>
                          <CelulaLimiar valor={v} menosDe5={c.unidade === 'alunos'} passou={passaDoLimiar(c, v, l.alunos)} titulo={c.limiar} className="whitespace-nowrap" />
                        </td>
                      )
                    })
                  : (
                    <td colSpan={cols.length} className={cn(td, 'text-left')}>
                      <span className="flex items-center gap-2">
                        <Selo tamanho="p" familia={SITUACAO_COR[l.situacao]} title={SITUACAO_DA_LINHA[l.situacao]}>{SITUACAO_CURTA[l.situacao]}</Selo>
                        <span className="text-[14px] font-medium text-sutil max-sm:hidden">ainda sem dados</span>
                      </span>
                    </td>
                  )}
                {extra && (
                  <td className={cn(td, aceso(extra.id) && 'bg-azul-claro/60')}>
                    {l.dados ? <CelulaLimiar valor={extra.valor(l)} menosDe5 titulo={extra.titulo} className="whitespace-nowrap" /> : ''}
                  </td>
                )}
                {aoAbrir && <td className={cn(td, 'w-8 px-0 text-sutil')}><ChevronRight aria-hidden className="ml-auto size-5" strokeWidth={2.5} /></td>}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** As notas abaixo de 6,0: uma linha por componente, a contagem e o movimento desde o trimestre anterior. */
export function NotasAbaixo({ rede, itens, compacto }: { rede: RedeId; itens: ReturnType<typeof recorteDoPainel>['notas']['itens']; compacto?: boolean }) {
  return (
    <ul className="grid gap-1">
      {itens.map((n) => (
        <li key={n.id} className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-[12px] px-2', compacto ? 'py-1' : 'py-1.5', n.id === 'dois' && 'bg-fundo-suave')}>
          <span className="min-w-0">
            <span className="block text-[15px] font-bold leading-5 text-tinta">{n.rotulo}</span>
            <span className="flex flex-wrap gap-x-2">
              {n.entraram > 0 && <Movimento n={n.entraram} tipo="entraram" className="text-[13px]" />}
              {n.sairam > 0 && <Movimento n={n.sairam} tipo="sairam" className="text-[13px]" />}
            </span>
          </span>
          <b className="text-[24px] font-bold leading-8 tabular-nums text-tinta">{textoDaContagem(n.alunos, rede)}</b>
        </li>
      ))}
    </ul>
  )
}

/* ── A página ──────────────────────────────────────────────────────────────────────────────────────────────────── */

/** A série mensal proporcional ao recorte (a série filtrada): o último ponto é o número exato do recorte. */
function proporcional(valores: number[], hoje: number): number[] {
  const fim = valores[valores.length - 1]
  if (!fim || fim === hoje) return valores
  return valores.map((v, i) => (i === valores.length - 1 ? hoje : Math.round((v * hoje) / fim)))
}

const CURTO_ANUAL: Record<string, string> = {
  'ideb-af': 'Ideb AF', 'ideb-ai': 'Ideb AI', 'ideb-em': 'Ideb EM', 'abandono-af': 'Abandono AF', 'distorcao-af': 'Distorção AF',
  'reprovacao-1em': 'Reprov. 1ª EM', 'abandono-1em': 'Abandono 1ª EM', 'distorcao-1em': 'Distorção 1ª EM',
}

export function Rede() {
  const navegar = useNavigate()
  const [rede] = useRedeAtual()
  const prefs = usePreferencias()
  const celular = useIsMobile()
  const p = painelDa(rede)
  const [serieP, setSerie] = useParametro('serie')
  const serie = serieP && p.series.includes(serieP) ? serieP : null
  const r = useMemo(() => recorteDoPainel(rede, serie), [rede, serie])
  const linhas = useLinhasDaRede(rede, r.linhas)
  const [protecaoP, setProtecao] = useParametro('protecao')
  const [relatorio, setRelatorio] = useState(false)
  const [baixado, setBaixado] = useState<string | null>(null)
  useEffect(() => {
    if (!baixado) return
    const t = window.setTimeout(() => setBaixado(null), 4000)
    return () => window.clearTimeout(t)
  }, [baixado])

  const conta = (n: number) => textoDaContagem(n, rede)
  const f = r.frequencia
  const doRecorte = serie ? ` · ${serie}` : ''
  const nomeCurto = rede === 'estado' ? 'Regional Joinville' : 'Rede municipal'

  /* ── o cabeçalho ── */
  const relatorioBotao = (
    <Botao variante="secundario" tamanho={celular ? 'p' : 'm'} icone={<Download strokeWidth={2.5} />} onClick={() => setRelatorio(true)}>
      {celular ? 'Relatório' : 'Baixar relatório'}
    </Botao>
  )
  const cabecalho = (
    <CabecalhoPagina titulo="Painel" selo={<SeloAgregado />}
      complemento={`${serie ?? nomeCurto} · ${p.linhas.length} escolas · ${inteiro(r.alunos)} alunos`}
      acoes={celular ? undefined : <><FiltroSerie rede={rede} serie={serie} mudar={setSerie} />{relatorioBotao}</>}
      linha={celular ? <span className="flex items-center gap-2 pt-1"><span className="min-w-0 flex-1 [&_button]:w-full"><FiltroSerie rede={rede} serie={serie} mudar={setSerie} /></span>{relatorioBotao}</span> : undefined} />
  )

  /* ── os ladrilhos ── */
  const tr = p.tendencia
  const reprova = f.faixas.find((x) => x.id === 'reprova')!
  const mat = r.notas.itens.find((n) => n.id === 'mat')!
  const serieReprova = proporcional(tr.reprova, reprova.alunos)
  const serieMat = proporcional(tr.mat, mat.alunos)
  const acao = (a: CartaoDeAcaoDados) => (
    <LadrilhoKPI key={a.id} rotulo={a.kpi} valor={a.unidade === 'alunos' || a.unidade === 'APOIAs' ? conta(a.numero) : inteiro(a.numero)}
      origem={a.origem.tipo} alerta={a.numero > 0} prazo={a.prazoCurto} para={destinoDoCartao(a)}
      serie={a.id === 'pe-de-meia' ? tr.peDeMeia : undefined} corSerie="vermelho"
      ajuda={<><p><b>{conta(a.numero)} {a.unidade}</b> {a.frase}.</p><p>{a.limiar}.</p>{a.detalhe && <p><b>{a.detalhe}</b></p>}<p>{a.prazo}.{serie ? ' Rede toda, todas as séries.' : ''}</p><FonteNaAjuda origem={a.origem} /></>} />
  )
  const ladrilhos = (
    <section aria-label="Números da semana" className="grid grid-cols-2 gap-3 lg:grid-cols-5 [&>*:first-child]:max-lg:col-span-2">
      {acao(p.acoes[0])}
      {acao(p.acoes[1])}
      <LadrilhoKPI rotulo="Presença < 75%" valor={conta(reprova.alunos)} origem="oficial" serie={serieReprova} corSerie="vermelho"
        delta={<Delta n={reprova.pioraram} desde="ago" menosDe5 />} para={`/rede/escolas?coluna=reprova${serie ? `&serie=${encodeURIComponent(serie)}` : ''}`}
        ajuda={<><p>Alunos com frequência <b>abaixo de 75%</b> no ano: reprovam por falta (LDB, art. 24, VI).</p><p><b>{reprova.pioraram}</b> entraram nessa faixa desde agosto.</p><FonteNaAjuda origem={f.origem} /></>} />
      <LadrilhoKPI rotulo="Matemática < 6,0" valor={conta(mat.alunos)} origem="oficial" serie={serieMat} corSerie="anil"
        delta={<Delta n={mat.alunos - mat.anterior} desde="tri. ant." menosDe5 />} para={`/rede/escolas?coluna=mat${serie ? `&serie=${encodeURIComponent(serie)}` : ''}`}
        ajuda={<><p>Alunos <b>abaixo de 6,0</b> em Matemática no trimestre (a média mínima da rede).</p><p><b>{mat.entraram}</b> entraram e <b>{mat.sairam}</b> saíram desde o trimestre anterior.</p><FonteNaAjuda origem={r.notas.origem} /></>} />
      {acao(p.acoes[2])}
    </section>
  )

  /* ── os gráficos ── */
  const faixas = (
    <CartaoGrafico titulo="Frequência por faixa" origem="oficial" className="lg:col-span-5"
      direita={<Delta n={f.pioraram} desde={celular ? undefined : 'ago'} menosDe5 className="text-[13px]" />}
      ajuda={<><p>Alunos em cada faixa de frequência no ano{doRecorte}.</p><p><b>&lt; 75%</b> reprova por falta (LDB, art. 24, VI). <b>75–90%</b> é falta crônica.{rede === 'estado' ? <> A linha marca <b>80%</b>, o mínimo do Pé-de-Meia (Decreto 11.901/2024).</> : null}</p><p><b>{f.pioraram}</b> pioraram de faixa e <b>{f.melhoraram}</b> melhoraram desde agosto.</p><FonteNaAjuda origem={f.origem} /></>}>
      <BarraDeFaixas rotulo={`Frequência por faixa${doRecorte}`} desde={f.desde} menosDe5
        marca={rede === 'estado' && f.abaixoDe80 !== undefined ? { abaixo: f.abaixoDe80, rotulo: '80%' } : undefined}
        faixas={FAIXAS.map((x) => {
          const v = f.faixas.find((y) => y.id === x.id)!
          return { id: x.id, rotulo: x.curto, explica: x.explica, alunos: v.alunos, pioraram: v.pioraram, melhoraram: v.melhoraram }
        })} />
    </CartaoGrafico>
  )
  const tendencia = (
    <CartaoGrafico titulo="Fev → set" origem="oficial" className="lg:col-span-4" rotulo="Tendência no ano, fevereiro a setembro"
      ajuda={<><p>Quantos alunos estavam acima de cada limiar no fim de cada mês: <b>&lt; 75%</b> de frequência e <b>&lt; 6,0</b> em Matemática{doRecorte}.</p><p>Escalas separadas: compare a forma, não a altura.</p><FonteNaAjuda origem={f.origem} /></>}>
      <ColunasMensais rotulo="Tendência no ano" meses={tr.meses} menosDe5
        series={[{ nome: '< 75%', valores: serieReprova, cor: 'vermelho' }, { nome: 'MAT < 6', valores: serieMat, cor: 'anil' }]} />
    </CartaoGrafico>
  )
  const maxNota = Math.max(...r.notas.itens.map((n) => n.alunos))
  const notas = (
    <CartaoGrafico titulo="Notas < 6,0" origem="oficial" className="lg:col-span-3"
      ajuda={<><p>Alunos <b>abaixo de 6,0</b> no trimestre, a média mínima da rede. A seta compara com o trimestre anterior.</p>{r.notas.itens.map((n) => <p key={n.id}><b>{n.rotulo}</b>: {n.entraram} entraram, {n.sairam} saíram.</p>)}<FonteNaAjuda origem={r.notas.origem} /></>}>
      <BarrasHorizontais rotulo="Notas abaixo de 6,0 por componente" empilhado max={maxNota} menosDe5
        itens={r.notas.itens.map((n) => ({
          id: n.id, rotulo: n.rotulo, titulo: `${n.rotulo}: ${conta(n.alunos)}`,
          partes: [{ valor: n.alunos, cor: n.id === 'dois' ? 'bg-anil-texto' : 'bg-anil' }],
          depois: <Delta n={n.alunos - n.anterior} menosDe5 className="text-[12px]" />,
        }))} />
    </CartaoGrafico>
  )

  /* ── as escolas e o lado ── */
  const tabela = (
    <CartaoGrafico titulo="Escolas" className="lg:col-span-12" rotulo={`Escolas, de A a Z${doRecorte}`}
      direita={<Legenda itens={[{ rotulo: 'passou do limiar', cor: 'bg-vermelho' }]} />}
      ajuda={<><p>Escolas <b>de A a Z</b>: alunos acima de cada limiar. A célula fica <b>vermelha</b> ao passar:</p>{r.colunas.map((c) => <p key={c.id}><b>{c.rotulo}</b>: {c.limiar.replace('Colorido a partir de', 'a partir de')}.</p>)}<p>"menos de 5": grupo pequeno demais para mostrar.</p></>}>
      <TabelaDasEscolas rede={rede} linhas={linhas} colunas={r.colunas} celular={celular} rotulo={`Escolas, de A a Z${doRecorte}`}
        aoAbrir={(id) => navegar(`/rede/escolas?escola=${id}`)} />
    </CartaoGrafico>
  )
  const falta = (
    <CartaoGrafico titulo="Falta por escola" origem="oficial" rotulo={`Alunos abaixo de 90% de frequência por escola${doRecorte}`}
      direita={<Legenda itens={[{ rotulo: '< 75%', cor: 'bg-vermelho' }, { rotulo: '75–90%', cor: 'bg-anil-degrau' }]} />}
      ajuda={<><p>Alunos de cada escola <b>abaixo de 90%</b> de frequência: em vermelho os que reprovam por falta (&lt; 75%), em anil a falta crônica (75–90%). De A a Z.</p><FonteNaAjuda origem={f.origem} /></>}>
      <BarrasHorizontais rotulo="Alunos abaixo de 90% por escola" largura={96} compacto menosDe5 vazio="—"
        itens={linhas.map((l) => ({
          id: l.id, rotulo: l.curto.replace('Colégio ', ''), titulo: l.dados ? `${l.nome}: ${conta(l.dados.faixas.reprova)} abaixo de 75%, ${conta(l.dados.faixas.cronica)} entre 75 e 90%` : `${l.nome}: ${SITUACAO_DA_LINHA[l.situacao]}`,
          partes: l.dados ? [{ valor: l.dados.faixas.reprova, cor: 'bg-vermelho' }, { valor: l.dados.faixas.cronica, cor: 'bg-anil-degrau' }] : null,
          aoAbrir: () => navegar(`/rede/escolas?escola=${l.id}`),
        }))} />
    </CartaoGrafico>
  )
  const trava = (
    <CartaoGrafico titulo="Onde trava" origem="turmma" rotulo="Onde a aprendizagem trava"
      ajuda={<><p>Alunos <b>abaixo de 50% de acerto</b> em cada habilidade, nas provas aprovadas pelos professores. Não substitui Saeb nem Ideb.</p><p>Clique para perguntar ao Analista.</p><FonteNaAjuda origem={p.habilidades.origem} /></>}>
      {r.habilidades.length === 0
        ? <p className="t-apoio">Nenhuma{serie ? ` d${/série/.test(serie) ? 'a' : 'o'} ${serie}` : ''}.</p>
        : (
          <BarrasHorizontais rotulo="Habilidades com mais alunos abaixo de 50%" empilhado compacto menosDe5 max={Math.max(...r.habilidades.map((h) => h.de ?? h.alunos))}
            itens={r.habilidades.map((h) => ({
              id: h.codigo, rotulo: h.nome, sub: h.serie.replace(' série', '').replace(' ano', 'º').replace('ºº', 'º'), titulo: `${h.codigo} · ${h.componente} · ${conta(h.alunos)}${h.de ? ` de ${inteiro(h.de)}` : ''}`,
              partes: [{ valor: h.alunos, cor: 'bg-anil' }],
              aoAbrir: () => navegar(analistaRede(PERGUNTAS.trava(h.serie))),
            }))} />
        )}
    </CartaoGrafico>
  )
  const rodape = (
    <section aria-label="IA e indicadores anuais" className="grid grid-cols-2 gap-2">
      <NumeroPequeno rotulo="Materiais IA" valor={inteiro(p.ia.materiais)} origem="turmma" titulo="Materiais que a IA preparou em setembro" />
      <NumeroPequeno rotulo="Revisados" valor={`${p.ia.revisados}%`} origem="turmma" titulo="Revisados por professor antes de chegar à turma" />
      <NumeroPequeno rotulo="Pacote IA" valor={`${p.ia.pacote}%`} origem="turmma" titulo="Do pacote do mês" />
      <NumeroPequeno rotulo="Por aluno" valor={reais(p.ia.porAluno)} origem="turmma" titulo="Custo da IA por aluno com acesso, no mês" />
      {p.anuais.slice(0, 4).map((a) => (
        <NumeroPequeno key={a.id} rotulo={CURTO_ANUAL[a.id] ?? a.rotulo} valor={a.valor} origem="oficial"
          titulo={`${a.rotulo}: ${a.valor} · ${a.contexto}${a.nota ? ` · ${a.nota}` : ''} · ${a.origem.fonte}`} />
      ))}
    </section>
  )

  const pe = (
    <p className="t-apoio flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-[14px]">
      <span className="flex items-center gap-1.5"><Lock aria-hidden className="size-4" strokeWidth={2.5} />"&lt; 5" = grupo com menos de 5 alunos</span>
      <ComoContamos rede={rede} />
      <button type="button" onClick={() => setProtecao('1')}
        className="inline-flex shrink-0 items-center gap-1 rounded-[8px] px-1 text-sutil transition-colors hover:bg-fundo-suave hover:text-tinta">
        <ShieldCheck aria-hidden className="size-4" strokeWidth={2.5} /> Como protegemos os dados
      </button>
    </p>
  )

  return (
    <Pagina tipo="painel" cabecalho={cabecalho} rolagem="corpo">
      <div className="relative grid min-w-0 gap-3 lg:-mt-2">
        <h2 className="sr-only">{`${REDES_DO_PAINEL[rede].nome}${doRecorte}, setembro de 2026`}</h2>
        {ladrilhos}
        <div className="grid gap-3 lg:h-[244px] lg:grid-cols-12">
          {faixas}
          {tendencia}
          {notas}
        </div>
        <div className="grid gap-3 lg:grid-cols-12">
          {tabela}
        </div>
        <div className="grid gap-3 lg:grid-cols-12 [&>*]:lg:col-span-4">
          {falta}
          {trava}
          {rodape}
        </div>
        {pe}
      </div>

      <ComoProtegemos aberto={protecaoP === '1'} aoFechar={() => setProtecao(null)} />
      <RelatorioDaRede aberto={relatorio} aoMudar={setRelatorio} rede={rede} porEmail={prefs.rede.relatorioMensal} serie={serie} aoBaixar={setBaixado} />
      {baixado && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 max-md:bottom-24">
          <Aviso tom="certo" className="pointer-events-auto w-auto max-w-[480px] shadow-[0_4px_0_0_var(--color-borda)]">
            <b className="font-bold">{baixado}</b> baixado.
          </Aviso>
        </div>
      )}
    </Pagina>
  )
}

/** A pergunta do Analista para cada cartão (usada nas Escolas). */
export { perguntaDoCartao }
