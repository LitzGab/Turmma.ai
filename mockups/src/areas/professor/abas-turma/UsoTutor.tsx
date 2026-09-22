import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpenCheck, ChartLine, ChevronRight, FastForward, MessageCircleQuestion, Milestone, Users, type LucideIcon } from 'lucide-react'
import { ChipFonte } from '@/components/turmma/ia'
import { Trilho } from '@/components/turmma/painel'
import { AvatarT, CabecalhoAba, CartaoT, Periodo, tabelaT, tipo } from '@/components/turmma/teachy'
import { turmaDe } from '@/dados/escola'
import { PERIODOS_USO, comVirgula, historicoTutorDa, usoNoTempoDa, usoTutorDa, type AcaoTutor, type PeriodoUso, type UsoNoTempo } from '@/dados/turma-atividades'
import { cn } from '@/lib/utils'
import { CaixaTabela, FraseDoPe, RotuloCartao } from './Atividades'

/* ABA "USO DE IA" (o arquivo continua UsoTutor.tsx), cópia do layout da Teachy: o cabeçalho com o seletor de período
   ("Personalizado · 30D · 2M · 3M · 6M · 12M"); uma linha de dois cartões de 267 px — o estreito com a porcentagem
   ENORME de alunos usando o Tutor e o largo com o gráfico de linhas das conversas por dia, por assunto; o "Histórico"
   em tabela (quem, o que fez no Tutor, quando); e, por último, o que já existia aqui: as dúvidas que mais se repetiram
   e onde os alunos travaram, por habilidade, com o chip da página do material.
   Continua sendo FATO e AGREGADO, no espírito "sinal, não conversa": o histórico diz o que o aluno fez (tirou dúvida de
   um assunto, pediu resposta pronta, revisou) e quando; não tem duração, texto da conversa, humor nem navegação (D57,
   D66, D69). Abrir a conversa de um aluno é outra ação, com motivo e auditoria, e mora na tela do Tutor.
   O gráfico é SVG feito à mão, sem biblioteca: três séries (laranja, grafite e cinza), eixo y com 0 e o máximo, eixo x
   com as datas, e a leitura por ponto ao passar o mouse (ou com as setas do teclado). */

const CORES = ['#E8732E', '#2F2F2F', '#8F8F8F']
const POR_PASSO: Record<UsoNoTempo['passo'], string> = { dia: 'por dia', semana: 'por semana', mês: 'por mês' }

const ACAO: Record<AcaoTutor, { icone: LucideIcon; cor: string }> = {
  duvida: { icone: MessageCircleQuestion, cor: 'text-sutil' },
  pronta: { icone: FastForward, cor: 'text-caramelo' },
  revisao: { icone: BookOpenCheck, cor: 'text-sutil' },
}

/* ── O gráfico de linhas ─────────────────────────────────────────────────────────────────────────────────── */

/** Curva que passa pelos pontos sem inventar pico nem vale entre eles (tangente pela média harmônica). */
function caminhoSuave(p: [number, number][]) {
  const n = p.length
  if (n < 3) return p.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')
  const m = p.slice(0, -1).map(([x, y], i) => (p[i + 1][1] - y) / (p[i + 1][0] - x))
  const t = p.map((_, i) => (i === 0 ? m[0] : i === n - 1 ? m[n - 2] : m[i - 1] * m[i] <= 0 ? 0 : (2 * m[i - 1] * m[i]) / (m[i - 1] + m[i])))
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const h = (p[i + 1][0] - p[i][0]) / 3
    d += `C${(p[i][0] + h).toFixed(1)} ${(p[i][1] + t[i] * h).toFixed(1)},${(p[i + 1][0] - h).toFixed(1)} ${(p[i + 1][1] - t[i + 1] * h).toFixed(1)},${p[i + 1][0].toFixed(1)} ${p[i + 1][1].toFixed(1)}`
  }
  return d
}

function GraficoLinhas({ dados }: { dados: UsoNoTempo }) {
  const caixa = useRef<HTMLDivElement>(null)
  const [t, setT] = useState({ w: 0, h: 0 })
  const [ativo, setAtivo] = useState<number | null>(null)
  useLayoutEffect(() => {
    const el = caixa.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setT({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = dados.rotulos.length
  const m = { e: 30, d: 12, c: 8, b: 22 }
  const larg = Math.max(1, t.w - m.e - m.d)
  const alt = Math.max(1, t.h - m.c - m.b)
  const x = (i: number) => m.e + (n <= 1 ? larg / 2 : (i / (n - 1)) * larg)
  const y = (v: number) => m.c + alt - (v / dados.teto) * alt
  const marcas = [0, dados.teto / 2, dados.teto]
  // os rótulos do eixo x contam do fim para o começo, para o dia de hoje sempre aparecer
  const passo = Math.max(1, Math.ceil(n / (t.w < 480 ? 4 : 7)))
  const comRotulo = (i: number) => (n - 1 - i) % passo === 0
  const maisPerto = (px: number) => Math.max(0, Math.min(n - 1, Math.round(((px - m.e) / larg) * (n - 1))))
  const tituloDoPonto = (i: number) => (dados.passo === 'semana' ? `Semana de ${dados.rotulos[i]}` : dados.rotulos[i])
  const total = dados.series.reduce((s, serie) => s + serie.valores.reduce((a, v) => a + v, 0), 0)

  return (
    <div ref={caixa} tabIndex={0} role="img"
      aria-label={`Conversas com o Tutor ${POR_PASSO[dados.passo]}, de ${dados.de} a ${dados.ate}: ${total} conversas nos três assuntos mais perguntados (${dados.series.map((s) => s.assunto).join(', ')}).`}
      onPointerMove={(e) => setAtivo(maisPerto(e.clientX - e.currentTarget.getBoundingClientRect().left))} onPointerLeave={() => setAtivo(null)} onBlur={() => setAtivo(null)}
      onKeyDown={(e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setAtivo((a) => Math.max(0, Math.min(n - 1, (a ?? n - 1) + (e.key === 'ArrowRight' ? 1 : -1)))) } }}
      className="relative min-h-0 flex-1 cursor-crosshair rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-borda-campo">
      {t.w > 0 && (
        <svg aria-hidden width={t.w} height={t.h} className="absolute inset-0 block font-teachy-corpo">
          {marcas.map((v) => (
            <g key={v}>
              <line x1={m.e} x2={t.w - m.d} y1={y(v)} y2={y(v)} stroke={v === 0 ? '#D9D9D9' : '#ECECEC'} strokeWidth={1} shapeRendering="crispEdges" />
              <text x={m.e - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={10} fill="#8F8F8F">{Number.isInteger(v) ? v : comVirgula(v)}</text>
            </g>
          ))}
          {dados.rotulos.map((r, i) => comRotulo(i) && <text key={i} x={x(i)} y={t.h - 5} textAnchor={i === n - 1 ? 'end' : 'middle'} fontSize={10} fill="#8F8F8F">{r}</text>)}
          {ativo !== null && <line x1={x(ativo)} x2={x(ativo)} y1={m.c} y2={m.c + alt} stroke="#BDBDBD" strokeWidth={1} shapeRendering="crispEdges" />}
          {/* a série mais perguntada por cima das outras */}
          {[...dados.series.keys()].reverse().map((k) => (
            <path key={k} d={caminhoSuave(dados.series[k].valores.map((v, i) => [x(i), y(v)]))} fill="none" stroke={CORES[k]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {ativo !== null && dados.series.map((s, k) => <circle key={k} cx={x(ativo)} cy={y(s.valores[ativo])} r={4} fill={CORES[k]} stroke="#FFFFFF" strokeWidth={2} />)}
        </svg>
      )}
      {ativo !== null && t.w > 0 && (
        <div className="pointer-events-none absolute top-1 z-10 w-max max-w-[220px] rounded-[8px] border border-linha bg-superficie px-3 py-2 shadow-flutua"
          style={x(ativo) > t.w * 0.58 ? { right: t.w - x(ativo) + 12 } : { left: x(ativo) + 12 }}>
          <p className="font-teachy text-[12px] font-bold leading-4 text-tinta">{tituloDoPonto(ativo)}</p>
          <ul className="mt-1 grid gap-0.5">
            {dados.series.map((s, k) => (
              <li key={s.assunto} className="flex items-center gap-1.5 text-[11px] leading-4 text-sutil">
                <i aria-hidden className="block h-0.5 w-3 shrink-0 rounded-full" style={{ background: CORES[k] }} />
                <b className="w-4 text-right font-semibold text-tinta">{s.valores[ativo]}</b>
                <span className="truncate">{s.assunto}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ── A aba ───────────────────────────────────────────────────────────────────────────────────────────────── */

export function UsoTutorTurma({ turmaId }: { turmaId: string }) {
  const [periodo, setPeriodo] = useState<PeriodoUso>('30D')
  const uso = usoTutorDa(turmaId)
  const noTempo = usoNoTempoDa(turmaId, periodo)
  const historico = historicoTutorDa(turmaId)
  const turma = turmaDe(turmaId)
  const maisVezes = Math.max(1, ...uso.duvidas.map((d) => d.vezes))

  return (
    <section className="font-teachy-corpo text-tinta">
      <CabecalhoAba titulo="Uso de IA" apoio="Acompanhe o uso do Tutor pelos seus alunos">
        <Periodo valor={periodo} aoMudar={(v) => setPeriodo(v as PeriodoUso)} opcoes={PERIODOS_USO} />
      </CabecalhoAba>

      {/* os dois cartões da Teachy: a porcentagem enorme e o gráfico de linhas */}
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="flex flex-col rounded-[12px] border border-linha bg-superficie lg:h-[267px]">
          <div className="p-4"><RotuloCartao icone={Users} titulo="Alunos usando IA" apoio="Porcentagem de alunos usando o Tutor" /></div>
          <div className="grid flex-1 place-items-center border-t border-linha px-4 py-6 text-center">
            <div>
              <p className="text-[40px] font-semibold leading-[48px] tracking-[-0.02em] text-tinta">{noTempo.pct}%</p>
              <p className="mt-1 text-[12px] leading-4 text-inativo">{noTempo.usaram} de {noTempo.alunos} alunos</p>
            </div>
          </div>
        </div>

        <div className="flex h-[267px] min-w-0 flex-col rounded-[12px] border border-linha bg-superficie">
          <div className="p-4">
            <RotuloCartao icone={ChartLine} titulo="Uso de IA ao longo do tempo" apoio={`Conversas com o Tutor ${POR_PASSO[noTempo.passo]}, por assunto`}
              lado={<span className="shrink-0 whitespace-nowrap text-[11px] leading-5 text-inativo">{noTempo.de} a {noTempo.ate}</span>} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col border-t border-linha px-4 pb-2 pt-3">
            <ul aria-label="Legenda" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {noTempo.series.map((s, k) => (
                <li key={s.assunto} className="flex items-center gap-1.5 text-[11px] leading-4 text-sutil"><i aria-hidden className="block size-2.5 shrink-0 rounded-full" style={{ background: CORES[k] }} />{s.assunto}</li>
              ))}
            </ul>
            <GraficoLinhas dados={noTempo} />
          </div>
        </div>
      </div>

      {/* o histórico */}
      <div className="mb-4 mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div className="min-w-0">
          <h3 className={tipo.aba}>Histórico</h3>
          <p className={cn(tipo.apoio, 'mt-1')}>
            Nesta semana: {uso.conversas} conversas de {uso.usaram} alunos · {uso.resolvidas} resolvidas sem resposta pronta · {uso.prontas.pedidos} pedidos de resposta pronta, de {uso.prontas.alunos} {uso.prontas.alunos === 1 ? 'aluno' : 'alunos'}
          </p>
        </div>
        <Link to="/professor/time/tutor" className="inline-flex shrink-0 items-center gap-0.5 font-teachy text-[14px] font-bold leading-5 text-caramelo-texto underline-offset-4 hover:underline">Abrir o Tutor <ChevronRight aria-hidden className="size-4" strokeWidth={2.2} /></Link>
      </div>
      <CaixaTabela rotulo={`Histórico de uso do Tutor no ${turma.nome}`} minimo="min-w-[640px]">
        <colgroup><col className="w-[32%]" /><col /><col className="w-[150px]" /><col className="w-[56px]" /></colgroup>
        <thead className={tabelaT.cabeca}>
          <tr><th className={tabelaT.th}>Aluno</th><th className={tabelaT.th}>O que fez no Tutor</th><th className={tabelaT.th}>Quando</th><th className={tabelaT.th}><span className="sr-only">Abrir</span></th></tr>
        </thead>
        <tbody>
          {historico.map((h) => {
            const Icone = ACAO[h.acao].icone
            return (
              <tr key={h.id} className={tabelaT.tr}>
                <td className={cn(tabelaT.td, 'h-14 py-0')}><span className="flex min-w-0 items-center gap-2.5"><AvatarT nome={h.aluno.nome} /><span className="truncate">{h.aluno.nome}</span></span></td>
                <td className={cn(tabelaT.td, 'py-0')}>
                  <span className="flex min-w-0 items-center gap-2">
                    <Icone aria-hidden className={cn('size-4 shrink-0', ACAO[h.acao].cor)} strokeWidth={1.9} />
                    <span className="truncate">{h.texto}{h.assunto && <span className="text-sutil"> · {h.assunto}</span>}</span>
                  </span>
                </td>
                <td className={cn(tabelaT.td, 'whitespace-nowrap py-0 text-sutil')}>{h.quando}</td>
                <td className={cn(tabelaT.td, 'py-0 text-right')}>
                  <Link to="/professor/time/tutor" aria-label={`Abrir o Tutor: ${h.aluno.nome}`} className="inline-grid size-7 place-items-center rounded-[8px] text-inativo transition-colors duration-150 hover:bg-realce-suave hover:text-tinta"><ChevronRight className="size-[18px]" strokeWidth={2} /></Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </CaixaTabela>

      {/* o que já existia: as dúvidas repetidas e onde travaram, sempre com a página do material */}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <CartaoT className="flex flex-col pb-1">
          <RotuloCartao icone={MessageCircleQuestion} titulo="Dúvidas que mais se repetiram" apoio="Quantas vezes apareceu, e de quantos alunos" />
          <ul className="-mx-4 mt-3 flex flex-1 flex-col">
            {uso.duvidas.map((d, i) => (
              <li key={d.texto} className="grid min-h-[52px] flex-1 grid-cols-[16px_minmax(0,1fr)_56px_auto] items-center gap-x-3 border-t border-linha px-4 py-2">
                <span className="text-[12px] leading-4 text-inativo">{i + 1}</span>
                <span>
                  <span title={d.texto} className="line-clamp-2 text-[14px] leading-5 text-tinta">“{d.texto}”</span>
                  <Trilho valor={(d.vezes / maisVezes) * 100} className="mt-1.5 h-1" />
                </span>
                <span className="text-right text-[12px] leading-4 text-sutil"><b className="block text-[14px] font-semibold leading-5 text-tinta">{d.vezes}×</b>{d.alunos} alunos</span>
                <span className="whitespace-nowrap"><ChipFonte pagina={d.pagina} material={uso.material.titulo} capitulo={uso.material.capitulo} /></span>
              </li>
            ))}
          </ul>
        </CartaoT>

        <CartaoT className="flex flex-col pb-1">
          <RotuloCartao icone={Milestone} titulo="Onde travaram, por habilidade" apoio={`Entre os ${uso.usaram} alunos que usaram o Tutor nesta semana`} />
          <ul className="-mx-4 mt-3 flex flex-1 flex-col">
            {uso.travaram.map((tr, i) => (
              <li key={tr.nome} className="grid min-h-[52px] flex-1 grid-cols-[minmax(0,1fr)_56px_auto] items-center gap-x-3 border-t border-linha px-4 py-2">
                <span>
                  <span className="flex min-w-0 items-baseline gap-2"><span title={tr.nome} className="truncate text-[14px] leading-5 text-tinta">{tr.nome}</span>{tr.codigo && <span className="shrink-0 text-[11px] leading-4 text-inativo max-sm:hidden">{tr.codigo}</span>}</span>
                  <Trilho valor={(tr.alunos / Math.max(1, uso.usaram)) * 100} tom={i === 0 && tr.alunos > 0 ? 'caramelo' : 'tinta'} className="mt-1.5 h-1" />
                </span>
                <span className="text-right text-[12px] leading-4 text-sutil"><b className={cn('block text-[14px] leading-5', tr.alunos === 0 ? 'font-normal text-inativo' : i === 0 ? 'font-semibold text-pendente' : 'font-semibold text-tinta')}>{tr.alunos}</b>de {uso.usaram}</span>
                <span className="whitespace-nowrap"><ChipFonte pagina={tr.pagina} material={uso.material.titulo} capitulo={uso.material.capitulo} /></span>
              </li>
            ))}
          </ul>
        </CartaoT>
      </div>
      <FraseDoPe>O Tutor não mede tempo parado, não lê humor e não acompanha a navegação.</FraseDoPe>
    </section>
  )
}
