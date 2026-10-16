import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, Lock, SlidersHorizontal } from 'lucide-react'
import {
  BarraDeFaixas, BarrasHorizontais, Botao, CabecalhoPagina, CartaoGrafico, CelulaLimiar, ColunasMensais, Delta, Dialogo,
  FonteNaAjuda, LadrilhoIcone, LadrilhoKPI, Legenda, LinhaDeFonte, NumeroPequeno, Pagina, Selo, TIPO_FILA, familia as estiloFamilia,
} from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useAbrirItemDoSino, useItensDoSino } from '@/components/turmma/sino'
import { useParametro } from '@/components/turmma/tela'
import { PERGUNTAS_ESCOLA } from '@/dados/analista-escola'
import {
  FAIXAS, painelDa, passaDoLimiar, somarLinhas, valorDaColuna, type CartaoDeAcaoDados, type Coluna, type ColunaId, type LinhaDoPainel,
} from '@/dados/gestao'
import { FREQUENCIA_ANTERIOR, HABILIDADES_POR_SERIE, ehColunaComNome, serieCurta, turmasNaColuna } from '@/dados/gestao-escola'
import { inteiro, reais } from '@/dados/numeros-escola'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { FaixaPausas } from './Agentes'
import { useMesIA } from './Governanca'
import { ListaComMotivo, type PedidoDeLista } from './_lista-com-motivo'

/* O PAINEL DA COORDENAÇÃO (07/10/2026; pesquisa/paineis-gestao/plano.md, T1, 2ª forma). "Painel é dado. Não faz sentido
   esse monte de texto." As métricas são as mesmas (QUANTOS ALUNOS passaram de um limiar, nenhuma média); mudou a forma:
   · cabeçalho numa linha: Painel, escola e alunos, o selo "nomes com motivo", Série, Período e RELATÓRIO;
   · a faixa roxa do encaminhamento urgente (e a pausa de uma IA), quando há;
   · 5 ladrilhos: os 3 que pedem ação (borda vermelha, prazo curto; levam à lista com motivo, às turmas, às provas) e
     os 2 limiares que mais pesam (< 75% e MAT < 6,0, com delta e minigráfico; acendem a coluna na grade);
   · gráficos: as faixas de frequência, a tendência fev → set, as notas < 6,0 por componente;
   · a grade turma × limiar (só números, cor ao passar; a célula abre a lista com motivo, D34) e, ao lado, as
     habilidades que travam, o risco de falta por série e os números do rodapé (IA e INEP).
   O limiar, a lei e a fonte de cada número moram no "?" (Ajuda). Turmas na ordem da escola; nada por professor. */

const painel = painelDa('escola')
const analista = (pergunta: string) => `/coordenacao/analista?pergunta=${encodeURIComponent(pergunta)}`

type Periodo = 'atual' | 'anterior'

/** Os dois filtros: Série e Período. O trimestre anterior só existe para a escola inteira. */
function CamposFiltro({ serie, periodo, mudarSerie, mudarPeriodo, empilhado }: {
  serie: string | null
  periodo: Periodo
  mudarSerie: (s: string | null) => void
  mudarPeriodo: (p: Periodo) => void
  empilhado?: boolean
}) {
  const classe = cn('h-10 gap-2 whitespace-nowrap text-[15px]', empilhado ? 'w-full' : 'w-auto min-w-[132px]')
  const rotulo = (r: string, v: string) => <span className="truncate"><span className="text-sutil">{r}:</span> <b className="font-bold">{v}</b></span>
  return (
    <>
      <Select value={serie ?? 'todas'} onValueChange={(v) => mudarSerie(v === 'todas' ? null : v)}>
        <SelectTrigger aria-label="Série" className={classe}>{rotulo('Série', serie ? serieCurta(serie) : 'Todas')}</SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as séries</SelectItem>
          {painel.series.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={periodo} onValueChange={(v) => mudarPeriodo(v === 'anterior' ? 'anterior' : 'atual')}>
        <SelectTrigger aria-label="Período" className={classe}>{rotulo('Trimestre', periodo === 'anterior' ? 'Anterior' : 'Atual')}</SelectTrigger>
        <SelectContent>
          <SelectItem value="atual">{painel.periodo.atual}</SelectItem>
          <SelectItem value="anterior" disabled={!!serie}>{serie ? 'Trimestre anterior (só a escola inteira)' : painel.periodo.anterior}</SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}

/** As turmas que passaram do limiar de uma coluna, num painel ao lado (o ladrilho "sem chamada"). Sem nome de professor. */
function PainelTurmas({ colunaId, aoFechar }: { colunaId: string | null; aoFechar: () => void }) {
  const col = painel.colunas.find((c) => c.id === colunaId)
  const turmas = colunaId ? turmasNaColuna(colunaId) : []
  const dias = col?.unidade === 'dias'
  return (
    <PainelLado aberto={!!col} aoFechar={aoFechar} titulo={dias ? 'Turmas sem chamada' : col?.titulo ?? ''}
      descricao="As turmas que passaram do limiar da coluna.">
      {col && (
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <p className="t-apoio">{dias ? 'Sem chamada lançada há 3 dias letivos ou mais. O Censo e o APOIA dependem do diário em dia; o diário de setembro fecha em 30/09.' : col.limiar}</p>
            <LinhaDeFonte origem={col.origem} />
          </div>
          <ul className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
            {turmas.map(({ linha, valor }) => (
              <li key={linha.id} className="border-t-2 border-borda first:border-t-0">
                <Link to={`/coordenacao/escola/turmas/${linha.id}`}
                  className="flex min-h-14 items-center gap-3 px-4 transition-colors duration-150 hover:bg-fundo-suave">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[17px] font-bold leading-6 text-tinta">{linha.nome}</span>
                    <span className="t-apoio">{linha.serie} · {linha.alunos} alunos</span>
                  </span>
                  <span className="shrink-0 text-[15px] font-bold tabular-nums text-vermelho-texto">
                    {dias ? `há ${valor} dias letivos` : `${valor} ${valor === 1 ? 'aluno' : 'alunos'}`}
                  </span>
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-sutil" strokeWidth={2.5} />
                </Link>
              </li>
            ))}
          </ul>
          {dias && <p className="t-apoio">A pendência é da turma. Quem lança a chamada vê o aviso no próprio diário.</p>}
        </div>
      )}
    </PainelLado>
  )
}

/** A série mensal proporcional ao recorte (a série filtrada): o último ponto é o número exato do recorte. */
function proporcional(valores: number[], hoje: number): number[] {
  const fim = valores[valores.length - 1]
  if (!fim || fim === hoje) return valores
  return valores.map((v, i) => (i === valores.length - 1 ? hoje : Math.round((v * hoje) / fim)))
}

/* ── A página ───────────────────────────────────────────────────────────────────────────────────────────── */

const CURTO_SERIE = (s: string) => serieCurta(s).replace(' ano', '').replace(' EF', '')

export function InicioCoordenacao() {
  const navegar = useNavigate()
  const celular = useIsMobile()
  const [serieP, setSerie] = useParametro('serie')
  const [periodoP, setPeriodo] = useParametro('periodo')
  const serie = serieP && painel.series.includes(serieP) ? serieP : null
  const periodo: Periodo = periodoP === 'anterior' && !serie ? 'anterior' : 'atual'
  const mudarSerie = (s: string | null) => setSerie(s)
  const mudarPeriodo = (p: Periodo) => setPeriodo(p === 'anterior' ? 'anterior' : null)
  const nFiltros = Number(!!serie) + Number(periodo === 'anterior')
  const [, setParams] = useSearchParams()
  // os dois de uma vez (duas chamadas seguidas leriam a URL velha)
  const limpar = () => setParams((atual) => { const p = new URLSearchParams(atual); p.delete('serie'); p.delete('periodo'); return p }, { replace: true })
  const [filtrando, setFiltrando] = useState(false)
  const [lista, setLista] = useState<PedidoDeLista | null>(null)
  const [turmasDe, setTurmasDe] = useState<string | null>(null)
  const [acesa, setAcesa] = useState<ColunaId | null>(null)
  const gradeRef = useRef<HTMLDivElement>(null)

  // a urgência: o item urgente ou de risco da fila da coordenação (o sino guarda o resto)
  const itens = useItensDoSino('coordenacao')
  const urgente = itens.find((i) => i.tipo === 'risco') ?? itens.find((i) => i.urgente && !i.prazo)
  const abrirItem = useAbrirItemDoSino()
  const mesIA = useMesIA()

  /* ── o recorte: com série, as faixas e as notas são refeitas a partir das turmas dela ── */
  const linhas = useMemo(() => painel.linhas.filter((l) => !serie || l.serie === serie), [serie])
  const soma = useMemo(() => somarLinhas(linhas), [linhas])
  const alunos = serie ? soma.alunos : painel.totalDeAlunos
  const atual = periodo === 'atual'

  const faixas = FAIXAS.map((f) => {
    const daEscola = painel.frequencia.faixas.find((x) => x.id === f.id)!
    const n = periodo === 'anterior' ? FREQUENCIA_ANTERIOR[f.id] : serie ? soma.dados.faixas[f.id] : daEscola.alunos
    const mov = !serie && atual
    return { id: f.id, rotulo: f.curto, explica: f.explica, alunos: n, pioraram: mov ? daEscola.pioraram : undefined, melhoraram: mov ? daEscola.melhoraram : undefined }
  })
  const pioraram = serie ? soma.dados.pioraram : painel.frequencia.pioraram
  const melhoraram = serie ? soma.dados.melhoraram : painel.frequencia.melhoraram
  const reprova = faixas.find((f) => f.id === 'reprova')!
  const reprovaEscola = painel.frequencia.faixas.find((f) => f.id === 'reprova')!

  const notas = painel.notas.itens.map((n) => ({
    ...n,
    valor: periodo === 'anterior' ? n.anterior : serie ? soma.dados[n.id] : n.alunos,
  }))
  const mat = notas.find((n) => n.id === 'mat')!
  const tr = painel.tendencia
  const serieReprova = proporcional(tr.reprova, atual ? reprova.alunos : tr.reprova[tr.reprova.length - 1])
  const serieMat = proporcional(tr.mat, atual ? mat.valor : tr.mat[tr.mat.length - 1])

  /* ── o cabeçalho ── */
  const relatorio = () => navegar(analista(PERGUNTAS_ESCOLA.R6))
  const cabecalho = (
    <CabecalhoPagina titulo="Painel"
      complemento={`${serie ? serieCurta(serie) : painel.nome} · ${inteiro(alunos)} alunos`}
      selo={!celular && <Selo tamanho="p" icone={<Lock strokeWidth={2.5} />} title="Nomes de alunos só aparecem depois de registrar o motivo">Nomes com motivo</Selo>}
      acoes={celular
        ? <Botao variante="secundario" tamanho="p" icone={<SlidersHorizontal strokeWidth={2.5} />} onClick={() => setFiltrando(true)}>{nFiltros ? `Filtrar (${nFiltros})` : 'Filtrar'}</Botao>
        : <><CamposFiltro serie={serie} periodo={periodo} mudarSerie={mudarSerie} mudarPeriodo={mudarPeriodo} /><Botao variante="secundario" tamanho="m" onClick={relatorio}>Relatório</Botao></>} />
  )

  const urgencia = urgente && (
    <div role="status" style={estiloFamilia('roxo')}
      className="flex min-h-10 shrink-0 items-center gap-3 rounded-[12px] border-2 border-(--borda) bg-(--claro) py-0.5 pl-2 pr-1">
      <LadrilhoIcone familia={TIPO_FILA[urgente.tipo].familia} tamanho={32} icone={<Icone id={TIPO_FILA[urgente.tipo].icone} tamanho={24} />} />
      <p className="min-w-0 flex-1 truncate text-[15px] font-medium leading-5 text-tinta">
        <b className="font-bold">{urgente.curto ?? urgente.titulo}</b>
        {urgente.turma && ` · ${urgente.turma}`}
        {urgente.quando && <span className="text-apoio"> · chegou às {urgente.quando}</span>}
      </p>
      <Botao variante="secundario" tamanho="p" onClick={() => abrirItem(urgente)}>Abrir</Botao>
    </div>
  )

  /* ── os ladrilhos ── */
  const acender = (c: ColunaId) => {
    setAcesa((a) => (a === c ? null : c))
    gradeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const abrirAcao = (a: CartaoDeAcaoDados) => {
    if (a.destino.tipo === 'lista') { if (ehColunaComNome(a.destino.lista)) setLista({ coluna: a.destino.lista }) }
    else if (a.destino.tipo === 'tabela') setTurmasDe(a.destino.coluna)
  }
  const acao = (id: string) => {
    const a = painel.acoes.find((x) => x.id === id)!
    // as provas: a quantidade viva (o que a professora aprova na demonstração some daqui)
    const numero = a.id === 'provas' ? Math.min(a.numero, mesIA.esperam) : a.numero
    return (
      <LadrilhoKPI key={a.id} rotulo={a.kpi} valor={inteiro(numero)} origem={a.origem.tipo} alerta={numero > 0} prazo={a.prazoCurto}
        para={a.destino.tipo === 'rota' ? a.destino.para : undefined}
        aoAbrir={a.destino.tipo === 'rota' ? undefined : () => abrirAcao(a)}
        ajuda={<><p><b>{inteiro(numero)} {a.unidade}</b> {a.frase}.</p><p>{a.limiar}.</p>{a.detalhe && <p><b>{a.detalhe}</b></p>}<p>{a.prazo}.</p><FonteNaAjuda origem={a.origem} /></>} />
    )
  }
  const desde = atual ? (serie ? undefined : 'ago') : undefined
  const ladrilhos = (
    <section aria-label="Números da semana" className="grid grid-cols-2 gap-3 lg:grid-cols-5 [&>*:first-child]:max-lg:col-span-2">
      {acao('apoia')}
      <LadrilhoKPI rotulo="Presença < 75%" valor={inteiro(reprova.alunos)} origem="oficial" serie={serieReprova} corSerie="vermelho"
        delta={atual && !serie ? <Delta n={reprovaEscola.pioraram - reprovaEscola.melhoraram} desde={desde} /> : undefined}
        aoAbrir={() => acender('reprova')} ativo={acesa === 'reprova'}
        ajuda={<><p>Alunos com frequência <b>abaixo de 75%</b> no ano: reprovam por falta (LDB, art. 24, VI).</p><p>Clique para acender a coluna na grade por turma.</p><FonteNaAjuda origem={painel.frequencia.origem} /></>} />
      <LadrilhoKPI rotulo="Matemática < 6,0" valor={inteiro(mat.valor)} origem="oficial" serie={serieMat} corSerie="anil"
        delta={atual && !serie ? <Delta n={mat.alunos - mat.anterior} desde="tri. ant." /> : undefined}
        aoAbrir={() => acender('mat')} ativo={acesa === 'mat'}
        ajuda={<><p>Alunos <b>abaixo de 6,0</b> em Matemática no trimestre (a média mínima da rede).</p>{atual && !serie && <p><b>{mat.entraram}</b> entraram e <b>{mat.sairam}</b> saíram desde o trimestre anterior.</p>}<FonteNaAjuda origem={painel.notas.origem} /></>} />
      {acao('chamada')}
      {acao('provas')}
    </section>
  )

  /* ── os gráficos ── */
  const frequencia = (
    <CartaoGrafico titulo="Frequência por faixa" origem="oficial" className="lg:col-span-5"
      direita={atual && <Delta n={pioraram} desde={celular ? undefined : 'ago'} className="text-[13px]" />}
      ajuda={<><p>Alunos em cada faixa de frequência no ano{periodo === 'anterior' ? ', como o trimestre anterior fechou' : ''}.</p><p><b>&lt; 75%</b> reprova por falta (LDB, art. 24, VI). <b>75–90%</b> é falta crônica.</p>{atual && <p><b>{pioraram}</b> pioraram de faixa e <b>{melhoraram}</b> melhoraram desde agosto.</p>}<FonteNaAjuda origem={painel.frequencia.origem} /></>}>
      <BarraDeFaixas rotulo={`Frequência por faixa${serie ? `, ${serie}` : ''}${periodo === 'anterior' ? ', trimestre anterior' : ''}`} faixas={faixas} desde="agosto" />
    </CartaoGrafico>
  )
  const tendencia = (
    <CartaoGrafico titulo="Fev → set" origem="oficial" className="lg:col-span-4" rotulo="Tendência no ano, fevereiro a setembro"
      ajuda={<><p>Quantos alunos estavam acima de cada limiar no fim de cada mês: <b>&lt; 75%</b> de frequência e <b>&lt; 6,0</b> em Matemática.</p><p>Escalas separadas: compare a forma, não a altura.</p><FonteNaAjuda origem={painel.frequencia.origem} /></>}>
      <ColunasMensais rotulo="Tendência no ano" meses={tr.meses}
        series={[{ nome: '< 75%', valores: serieReprova, cor: 'vermelho' }, { nome: 'MAT < 6', valores: serieMat, cor: 'anil' }]} />
    </CartaoGrafico>
  )
  const maxNota = Math.max(...notas.map((n) => n.valor))
  const notasBloco = (
    <CartaoGrafico titulo={periodo === 'anterior' ? '< 6,0 · tri. anterior' : 'Notas < 6,0'} origem="oficial" className="lg:col-span-3"
      ajuda={<><p>Alunos <b>abaixo de 6,0</b> no trimestre, a média mínima da rede. A seta compara com o trimestre anterior.</p>{notas.map((n) => <p key={n.id}><b>{n.rotulo}</b>: {n.entraram} entraram, {n.sairam} saíram.</p>)}<FonteNaAjuda origem={painel.notas.origem} /></>}>
      <BarrasHorizontais rotulo="Notas abaixo de 6,0 por componente" empilhado max={maxNota}
        itens={notas.map((n) => ({
          id: n.id, rotulo: n.rotulo, titulo: `${n.rotulo}: ${n.valor}`,
          partes: [{ valor: n.valor, cor: n.id === 'dois' ? 'bg-anil-texto' : 'bg-anil' }],
          depois: atual && !serie ? <Delta n={n.alunos - n.anterior} className="text-[12px]" /> : undefined,
        }))} />
    </CartaoGrafico>
  )

  /* ── a grade turma × limiar ── */
  const colunas: Coluna[] = painel.colunas.filter((c) => !celular || c.essencial || c.id === acesa)
  const abrirCelula = (l: LinhaDoPainel, c: Coluna) => {
    if (ehColunaComNome(c.id)) setLista({ coluna: c.id, turmaId: l.id })
    else navegar(`/coordenacao/escola/turmas/${l.id}`)
  }
  const th = 'h-9 px-2 text-right text-[12px] font-bold uppercase leading-4 tracking-[.04em] text-sutil last:pr-4'
  const grade = (
    <div ref={gradeRef} className="flex min-w-0 scroll-mt-2 lg:col-span-8">
      <CartaoGrafico titulo="Por turma" className="flex-1" rotulo="Por turma, em contagem de alunos"
        direita={<Legenda itens={[{ rotulo: 'passou do limiar', cor: 'bg-vermelho' }]} />}
        ajuda={<><p>Alunos de cada turma acima de cada limiar. A célula fica <b>vermelha</b> ao passar:</p>{painel.colunas.map((c) => <p key={c.id}><b>{c.rotulo}</b>: {c.limiar.replace('Colorido a partir de', 'a partir de')}.</p>)}<p>Clique num número para ver os nomes, com motivo registrado.</p></>}>
        <div className="-mx-4 -mb-4 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Turmas{serie ? ` do ${serie}` : ''}: alunos em cada limiar. Clique numa contagem para ver os nomes, com motivo.</caption>
            <thead>
              <tr className="border-y-2 border-borda bg-fundo-suave">
                <th scope="col" className="h-9 pl-4 pr-2 text-[12px] font-bold uppercase leading-4 tracking-[.04em] text-sutil">Turma</th>
                {!celular && <th scope="col" className={th}>Alunos</th>}
                {colunas.map((c) => (
                  <th key={c.id} scope="col" title={`${c.titulo}. ${c.limiar}.`}
                    className={cn(th, acesa === c.id && 'bg-azul-claro text-azul-texto')}>{c.rotulo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id} className="border-t-2 border-borda first:border-t-0 hover:bg-fundo-suave/60">
                  <th scope="row" className="h-9 pl-4 pr-2">
                    <Link to={`/coordenacao/escola/turmas/${l.id}`} className="inline-flex items-center gap-0.5 rounded-[6px] text-[15px] font-bold text-tinta hover:text-azul-texto">
                      {l.nome}<ChevronRight aria-hidden className="size-4 text-sutil" strokeWidth={2.5} />
                    </Link>
                  </th>
                  {!celular && <td className="h-9 px-2 text-right text-[14px] font-medium tabular-nums text-sutil">{l.dados ? l.alunos : '—'}</td>}
                  {l.dados
                    ? colunas.map((c) => {
                        const v = valorDaColuna(l, c.id)
                        const passou = passaDoLimiar(c, v, l.alunos)
                        const celula = <CelulaLimiar valor={v} passou={passou} titulo={c.limiar} className="h-7" />
                        return (
                          <td key={c.id} className={cn('h-9 px-1 text-right last:pr-3', acesa === c.id && 'bg-azul-claro/60')}>
                            {v
                              ? (
                                <button type="button" onClick={() => abrirCelula(l, c)}
                                  aria-label={`${l.nome}, ${c.titulo}: ${v}. ${ehColunaComNome(c.id) ? 'Ver os nomes, com motivo' : 'Abrir a turma'}`}
                                  className="rounded-[8px] outline-none transition-colors hover:bg-fundo-suave focus-visible:ring-[3px] focus-visible:ring-azul">
                                  {celula}
                                </button>
                              )
                              : <span className="px-1">{celula}</span>}
                          </td>
                        )
                      })
                    : <td colSpan={colunas.length} className="h-9 px-2 text-right text-[13px] font-semibold text-sutil">sem lista</td>}
                </tr>
              ))}
              <tr className="border-t-2 border-borda bg-fundo-suave">
                <th scope="row" className="h-9 pl-4 pr-2 text-[12px] font-bold uppercase tracking-[.04em] text-sutil">{serie ? 'Série' : 'Escola'}</th>
                {!celular && <td className="h-9 px-2 text-right text-[14px] font-bold tabular-nums text-tinta">{inteiro(soma.alunos)}</td>}
                {colunas.map((c) => {
                  const d = soma.dados
                  const v = c.id === 'reprova' || c.id === 'cronica' ? d.faixas[c.id] : (d as unknown as Record<string, number>)[c.id]
                  // dias sem chamada não se somam: o total diz quantas turmas passaram do limiar
                  const texto = c.unidade === 'dias' ? `${linhas.filter((l) => passaDoLimiar(c, valorDaColuna(l, c.id), l.alunos)).length} t.` : inteiro(v ?? 0)
                  return <td key={c.id} className="h-9 whitespace-nowrap px-2.5 text-right text-[15px] font-bold tabular-nums text-tinta last:pr-4">{texto}</td>
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </CartaoGrafico>
    </div>
  )

  /* ── ao lado da grade: onde trava, risco por série, rodapé ── */
  const habilidades = serie ? HABILIDADES_POR_SERIE[serie] ?? [] : painel.habilidades.itens
  const trava = (
    <CartaoGrafico titulo="Onde trava" origem="turmma" rotulo="Onde a aprendizagem trava"
      ajuda={<><p>Alunos <b>abaixo de 50% de acerto</b> em cada habilidade, nas provas aprovadas pelos professores.</p><p>Clique para perguntar ao Analista.</p><FonteNaAjuda origem={painel.habilidades.origem} /></>}>
      {habilidades.length === 0
        ? <p className="t-apoio">3º EM: um professor só, fica de fora.</p>
        : (
          <BarrasHorizontais rotulo="Habilidades com mais alunos abaixo de 50%" empilhado max={Math.max(...habilidades.map((h) => h.de ?? h.alunos))}
            itens={habilidades.map((h) => ({
              id: h.codigo, rotulo: h.nome, sub: `${CURTO_SERIE(h.serie)} · ${h.componente}`, titulo: `${h.codigo} · ${h.alunos}${h.de ? ` de ${h.de}` : ''}`,
              partes: [{ valor: h.alunos, cor: 'bg-anil' }],
              aoAbrir: () => navegar(analista(`Em que habilidade o ${serieCurta(h.serie)} mais trava?`)),
            }))} />
        )}
    </CartaoGrafico>
  )
  const porSerie = useMemo(() => painel.series.map((s) => {
    const t = somarLinhas(painel.linhas.filter((l) => l.serie === s))
    return { serie: s, alunos: t.alunos, reprova: t.dados.faixas.reprova, cronica: t.dados.faixas.cronica }
  }), [])
  const risco = (
    <CartaoGrafico titulo="Falta por série" origem="oficial" rotulo="Alunos abaixo de 90% de frequência por série"
      direita={<Legenda itens={[{ rotulo: '< 75%', cor: 'bg-vermelho' }, { rotulo: '75–90%', cor: 'bg-anil-degrau' }]} />}
      ajuda={<><p>Alunos de cada série <b>abaixo de 90%</b> de frequência: em vermelho os que reprovam por falta (&lt; 75%), em anil a falta crônica (75–90%).</p><FonteNaAjuda origem={painel.frequencia.origem} /></>}>
      <BarrasHorizontais rotulo="Alunos abaixo de 90% por série" largura={56} compacto
        itens={porSerie.map((x) => ({
          id: x.serie, rotulo: CURTO_SERIE(x.serie), titulo: `${x.serie}: ${x.reprova} abaixo de 75%, ${x.cronica} entre 75 e 90%`,
          partes: x.alunos ? [{ valor: x.reprova, cor: 'bg-vermelho' }, { valor: x.cronica, cor: 'bg-anil-degrau' }] : null,
          aoAbrir: x.alunos ? () => mudarSerie(serie === x.serie ? null : x.serie) : undefined,
        }))} vazio="sem lista" />
    </CartaoGrafico>
  )
  const ia = painel.ia
  const rodape = (
    <section aria-label="IA e indicadores anuais" className="grid grid-cols-2 gap-2">
      <NumeroPequeno rotulo="Materiais IA" valor={inteiro(mesIA.gerou)} origem="turmma" titulo="Materiais que a IA preparou em setembro" />
      <NumeroPequeno rotulo="Revisados" valor={`${ia.revisados}%`} origem="turmma" titulo="Revisados por professor antes de chegar à turma" />
      <NumeroPequeno rotulo="Pacote IA" valor={`${ia.pacote}%`} origem="turmma" titulo={`Do pacote do mês · ${reais(ia.porAluno)} por aluno`} />
      <NumeroPequeno rotulo="Por aluno" valor={reais(ia.porAluno)} origem="turmma" titulo="Custo da IA por aluno com acesso, no mês" />
      {painel.anuais.map((a) => (
        <NumeroPequeno key={a.id} rotulo={a.rotulo.replace('Ideb · anos finais', 'Ideb AF').replace('Ideb · Ensino Médio', 'Ideb EM').replace('1º ano EM · reprovação', 'Reprov. 1º EM').replace('1º ano EM · distorção idade-série', 'Distorção 1º EM')}
          valor={a.valor} origem="oficial" titulo={`${a.rotulo}: ${a.valor} · ${a.contexto} · ${a.origem.fonte}`} />
      ))}
    </section>
  )

  return (
    <Pagina tipo="painel" cabecalho={cabecalho}>
      <div className="grid min-w-0 gap-3 lg:-mt-2">
        <div className="grid gap-3 empty:hidden [&>*]:min-w-0 lg:grid-cols-[minmax(0,max-content)_minmax(0,1fr)] lg:[&>*:only-child]:col-span-2">
          {urgencia}
          <FaixaPausas className="grid-cols-[minmax(0,1fr)]" aoVer={(a) => navegar(`/coordenacao/registros?aba=ia&ver=como&ia=${a}`)} />
        </div>
        {ladrilhos}
        <div className="grid gap-3 lg:h-[236px] lg:grid-cols-12">
          {frequencia}
          {tendencia}
          {notasBloco}
        </div>
        <div className="grid gap-3 lg:grid-cols-12">
          {grade}
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-4 [&>section:last-child]:mt-auto">
            {trava}
            {risco}
            {rodape}
          </div>
        </div>
      </div>

      <ListaComMotivo pedido={lista} aoFechar={() => setLista(null)} />
      <PainelTurmas colunaId={turmasDe} aoFechar={() => setTurmasDe(null)} />

      <Dialogo aberto={filtrando} aoMudar={setFiltrando} titulo="Filtrar o painel" largura={420}
        rodape={<Botao variante="oficial" onClick={() => setFiltrando(false)}>Ver</Botao>}>
        <div className="grid gap-3"><CamposFiltro serie={serie} periodo={periodo} mudarSerie={mudarSerie} mudarPeriodo={mudarPeriodo} empilhado /></div>
        {nFiltros > 0 && <Botao variante="fantasma" tamanho="p" className="mt-2 -ml-3" onClick={limpar}>Limpar filtros</Botao>}
        <Botao variante="secundario" tamanho="m" className="mt-3 w-full" onClick={() => { setFiltrando(false); relatorio() }}>Relatório</Botao>
      </Dialogo>
    </Pagina>
  )
}
