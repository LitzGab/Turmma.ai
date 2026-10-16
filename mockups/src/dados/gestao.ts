import { TURMAS_DA_ESCOLA, listaDa } from './estrutura'
import { ESCOLAS_DA_REDE, SAIDAS_IA, USO_DE_SETEMBRO } from './rede'
import { ESCOLA, MES, PACOTE, PERIODO, inteiro, pct, porAluno } from './numeros-escola'

/* OS NÚMEROS DOS TRÊS PAINÉIS DE GESTÃO, UMA FONTE SÓ (06/10/2026; pesquisa/paineis-gestao/plano.md e a seção 8 de
   pesquisa-metricas.md). Hoje é 21/09/2026 na demonstração.

   TRÊS RECORTES, O MESMO ESQUELETO:
   · 'escola'     — Colégio Aurora, coordenação (escola ESTADUAL, 6º ao 3º EM, 612 alunos, 22 turmas; o 3ºA está sem lista);
   · 'prefeitura' — Prefeitura de Joinville, rede municipal, anos finais: 6 escolas, 4 com dados, 3.412 alunos;
   · 'estado'     — Estado de SC, Coordenadoria Regional de Joinville: 6 escolas (5 com dados, inclui o Colégio Aurora),
                    4.262 alunos. A linha do Aurora no Estado é a SOMA das turmas do painel da coordenação.

   REGRAS (valem em tudo aqui):
   1. NENHUMA MÉDIA de aluno, de frequência ou de nota. Todo número é "quantos alunos passaram de um limiar", com o
      limiar e a origem escritos. "Média mínima da rede (6,0)" é o nome do limiar no regimento, não uma conta nossa.
   2. Frequência em 4 faixas (FAIXAS): ≥ 95% · 90 a 95% · 75 a 90% (falta crônica) · abaixo de 75% (reprova por falta,
      LDB). No Estado, `abaixoDe80` marca a linha do Pé-de-Meia (80%). A faixa de baixo é a destacada.
   3. Movimento desde agosto: `pioraram` (entraram na faixa vindo de uma melhor) e `melhoraram` (vindo de uma pior).
      Nas notas: `anterior` (trimestre anterior), `entraram` e `sairam`, com alunos = anterior + entraram − sairam.
   4. Cada número leva `origem: { tipo: 'oficial' | 'turmma', fonte }`. OFICIAL = lido do diário (EVN / Professor
      Online), do APOIA, da lista do Pé-de-Meia ou do INEP. TURMMA = só existe porque o Turmma está na escola.
   5. Nas redes, grupo com menos de 5 aparece como "menos de 5" (`textoDaContagem`) e não há nome de aluno. Na
      coordenação, nome só na lista nominal (`listaNominal`), que a tela abre pedindo o motivo (D34, fluxo existente).
   6. Escolas em ordem alfabética, sem ranking. Turmas na ordem da escola.
   7. Tudo coerente: as linhas somam os totais, as faixas somam os alunos (confira com `conferirGestao()`).
   100% sintético, fora os números anuais do INEP para Joinville (pesquisa-metricas.md, seções 3.2 e 4.1).

   API (o que as telas usam):
   · painelDa(recorte) → Painel  (cabeçalho, acoes ≤ 3, frequencia, notas, colunas + linhas, habilidades, ia, anuais)
   · somarLinhas(linhas) → os totais de qualquer conjunto de linhas (para filtrar a tabela por série e refazer as faixas)
   · valorDaColuna(linha, coluna) · passaDoLimiar(coluna, valor, alunos) · textoDaContagem(n, recorte)
   · listaNominal(id, turmaId?) → a lista com nomes do 2º nível da coordenação (2ºB e o APOIA da escola)
   · FAIXAS, ROTULO_DA_FAIXA, COLUNAS, SITUACAO_DA_LINHA, conferirGestao() */

/* ── Tipos ─────────────────────────────────────────────────────────────────────────────────────────────── */

export type Recorte = 'escola' | 'prefeitura' | 'estado'
export type TipoDado = 'oficial' | 'turmma'
/** A etiqueta e a linha curta de fonte de um número ("Diário Professor Online · hoje 7h"). */
export type Origem = { tipo: TipoDado; fonte: string }

export type FaixaId = 'em-dia' | 'atencao' | 'cronica' | 'reprova'

export type ContagemFaixa = {
  id: FaixaId
  alunos: number
  /** entraram nesta faixa vindo de uma melhor, desde agosto */
  pioraram: number
  /** entraram nesta faixa vindo de uma pior, desde agosto */
  melhoraram: number
}

export type Frequencia = {
  total: number
  /** na ordem de FAIXAS: ≥ 95 · 90–95 · 75–90 · < 75 */
  faixas: ContagemFaixa[]
  pioraram: number
  melhoraram: number
  /** "agosto" */
  desde: string
  /** só no Estado: alunos abaixo de 80% (inclui os abaixo de 75%), para a marca do Pé-de-Meia */
  abaixoDe80?: number
  limiar: string
  origem: Origem
}

export type ComponenteId = 'lp' | 'mat' | 'dois'
export type NotaAbaixo = {
  id: ComponenteId
  /** "Língua Portuguesa", "Matemática", "2 ou mais componentes" */
  rotulo: string
  curto: string
  alunos: number
  /** no trimestre anterior */
  anterior: number
  /** passaram a ficar abaixo de 6,0 */
  entraram: number
  /** saíram de baixo de 6,0 */
  sairam: number
}
export type Notas = {
  /** 6 */
  limiar: number
  /** "abaixo de 6,0, a média mínima da rede" */
  limiarTexto: string
  periodo: string
  comparado: string
  itens: NotaAbaixo[]
  origem: Origem
}

export type ColunaId = 'reprova' | 'cronica' | 'abaixoDe80' | 'peDeMeia' | 'apoia' | 'apoiaVencidos' | 'lp' | 'mat' | 'primeiraSerieDois' | 'semChamada'

/** Quando a célula ganha cor: a partir de N (contagem) ou a partir de uma parcela dos alunos da linha. */
export type Alerta = { tipo: 'contagem'; a: number } | { tipo: 'parcela'; pct: number }

export type Coluna = {
  id: ColunaId
  /** o cabeçalho curto (a tela põe em caixa alta) */
  rotulo: string
  /** a frase inteira, para o title e o celular */
  titulo: string
  /** o limiar em palavras ("Colorido a partir de 1 aluno") */
  limiar: string
  alerta: Alerta
  unidade: 'alunos' | 'dias' | 'turmas'
  /** fica no celular (375) */
  essencial: boolean
  origem: Origem
}

export type DadosDaLinha = {
  faixas: Record<FaixaId, number>
  /** só no Estado */
  abaixoDe80?: number
  /** só no Estado e no Aurora: beneficiários do Pé-de-Meia e os abaixo de 80% no mês */
  peDeMeia?: { beneficiarios: number; abaixoDe80: number }
  /** no critério do APOIA, ainda sem aviso aberto */
  apoia: number
  /** APOIAs abertos com o prazo de 14 dias vencido */
  apoiaVencidos: number
  lp: number
  mat: number
  dois: number
  /** 1ª série do EM com 2 ou mais componentes abaixo de 6,0 (Estado; no Aurora, a soma do 1º ano EM) */
  primeiraSerieDois?: number
  /** na escola: dias letivos sem chamada; nas redes: turmas sem chamada há 3 dias letivos ou mais */
  semChamada: number
  pioraram: number
  melhoraram: number
}

export type SituacaoDaLinha = 'com-dados' | 'sem-lista' | 'montando' | 'convite'
export const SITUACAO_DA_LINHA: Record<SituacaoDaLinha, string> = {
  'com-dados': 'Com dados',
  'sem-lista': 'Lista ainda não subiu',
  montando: 'Montando: ainda sem dados',
  convite: 'Convite enviado: ainda sem dados',
}

export type LinhaDoPainel = {
  id: string
  /** "7ºB", "E. M. Araucária", "EEB Canela-Preta" */
  nome: string
  /** "7ºB", "Araucária", "Canela-Preta" */
  curto: string
  /** só nas turmas: "7º ano EF" */
  serie?: string
  alunos: number
  situacao: SituacaoDaLinha
  /** null = sem dados (a tela mostra "—" e a situação) */
  dados: DadosDaLinha | null
}

export type Destino =
  | { tipo: 'lista'; lista: ListaId }
  | { tipo: 'tabela'; coluna: ColunaId }
  | { tipo: 'rota'; para: string }

export type CartaoDeAcaoDados = {
  id: string
  /** o número grande */
  numero: number
  /** o que ele conta: "alunos", "turmas", "APOIAs" */
  unidade: string
  /** a frase depois do número: "no critério do APOIA, ainda sem aviso aberto" */
  frase: string
  /** o limiar e a origem dele */
  limiar: string
  /** uma linha opcional de detalhe ("7ºB há 3 dias · 9ºC há 4 dias") */
  detalhe?: string
  /** "Abrir o aviso até 24/09" */
  prazo: string
  /** o texto do botão ("Ver os 4") */
  botao: string
  /** o rótulo do ladrilho do painel, 2 a 4 palavras ("APOIA sem aviso") */
  kpi: string
  /** o prazo em 2 ou 3 palavras ("até 24/09") */
  prazoCurto: string
  destino: Destino
  origem: Origem
}

/** A série mensal do ano letivo (fev → set) dos dois limiares que mais pesam, para a tendência e os minigráficos.
    O último ponto é o número de hoje; agosto bate com o movimento ("pioraram desde agosto"). */
export type SerieMensal = {
  meses: string[]
  /** alunos abaixo de 75% de frequência no fim de cada mês */
  reprova: number[]
  /** alunos abaixo de 6,0 em Matemática nas notas lançadas até o fim de cada mês */
  mat: number[]
  /** só no Estado: beneficiários do Pé-de-Meia abaixo de 80% no mês */
  peDeMeia?: number[]
}
const MESES = ['fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set']

export type HabilidadeTravada = {
  codigo: string
  nome: string
  serie: string
  componente: string
  /** alunos abaixo de 50% de acerto nas provas aprovadas */
  alunos: number
  /** os alunos da série que fizeram as provas (quando se sabe) */
  de?: number
}

export type IaSobControle = {
  /** materiais que a IA preparou no mês */
  materiais: number
  /** % revisado por professor antes de chegar à turma (a regra é 100) */
  revisados: number
  /** esperando a revisão do professor */
  esperando: number
  /** % do pacote de IA usado no mês */
  pacote: number
  /** custo por aluno com acesso, em reais */
  porAluno: number
  origem: Origem
}

export type IndicadorAnual = {
  id: string
  rotulo: string
  /** "6,0" ou "15,7%" */
  valor: string
  /** a linha de contexto: "parado desde 2023; última meta (2021): 6,4" */
  contexto: string
  /** série histórica, quando faz sentido */
  historico?: { ano: number; valor: string }[]
  /** "o Turmma não atua nessa etapa" */
  nota?: string
  origem: Origem
}

export type PeDeMeia = { beneficiarios: number; abaixoDe80: number; limiar: string; origem: Origem }

export type ApoiasAbertos = { abertos: number; naEscola: number; noConselho: number; noMp: number; vencidos: number; origem: Origem }

export type Painel = {
  recorte: Recorte
  /** "Colégio Aurora", "Prefeitura de Joinville", "Estado de SC · Regional Joinville" */
  nome: string
  /** "Colégio Aurora · 612 alunos · 6º ao 3º EM" */
  escopo: string
  /** "Diário oficial (Professor Online) lido hoje às 7h · Turmma" */
  linhaDeFonte: string
  sistemaOficial: 'Professor Online' | 'EVN'
  totalDeAlunos: number
  /** o filtro de série (a tabela da escola filtra por `linha.serie`) */
  series: string[]
  periodo: { atual: string; anterior: string }
  /** no máximo 3 */
  acoes: CartaoDeAcaoDados[]
  frequencia: Frequencia
  notas: Notas
  apoias: ApoiasAbertos
  peDeMeia?: PeDeMeia
  /** "Turma" ou "Escola" */
  rotuloDaLinha: string
  colunas: Coluna[]
  /** turmas na ordem da escola; escolas de A a Z */
  linhas: LinhaDoPainel[]
  habilidades: { itens: HabilidadeTravada[]; origem: Origem }
  ia: IaSobControle
  anuais: IndicadorAnual[]
  tendencia: SerieMensal
}

/* ── Constantes ────────────────────────────────────────────────────────────────────────────────────────── */

export const FAIXAS: { id: FaixaId; rotulo: string; curto: string; explica: string }[] = [
  { id: 'em-dia', rotulo: '95% ou mais', curto: '≥ 95%', explica: 'Frequência em dia' },
  { id: 'atencao', rotulo: '90 a 95%', curto: '90–95%', explica: 'Começou a faltar' },
  { id: 'cronica', rotulo: '75 a 90%', curto: '75–90%', explica: 'Falta crônica: 10% ou mais de faltas' },
  { id: 'reprova', rotulo: 'Abaixo de 75%', curto: '< 75%', explica: 'Reprova por falta (LDB, art. 24)' },
]
export const ROTULO_DA_FAIXA: Record<FaixaId, string> = Object.fromEntries(FAIXAS.map((f) => [f.id, f.rotulo])) as Record<FaixaId, string>

export const LIMIAR_DO_APOIA = '5 faltas seguidas ou 7 alternadas em 30 dias (APOIA, MPSC)'
export const LIMIAR_DO_PE_DE_MEIA = 'Abaixo de 80% no mês, o aluno perde a parcela (Decreto 11.901/2024)'
export const LIMIAR_DAS_NOTAS = 'Abaixo de 6,0, a média mínima da rede'
export const LIMIAR_DA_FREQUENCIA = 'Abaixo de 75% reprova por falta (LDB, art. 24, VI)'

const PERIODO_DAS_NOTAS = { atual: `Trimestre atual · até ${PERIODO.ate}`, anterior: 'Trimestre anterior' }

/* As fontes, escritas uma vez. */
const F = {
  diarioSc: { tipo: 'oficial', fonte: 'Diário Professor Online · hoje 7h' },
  diarioJlle: { tipo: 'oficial', fonte: 'Diário EVN · hoje 7h' },
  notasSc: { tipo: 'oficial', fonte: 'Notas do Professor Online · hoje 7h' },
  notasJlle: { tipo: 'oficial', fonte: 'Notas do EVN · hoje 7h' },
  apoia: { tipo: 'oficial', fonte: 'APOIA 3 (MPSC) e diário · hoje 7h' },
  peDeMeia: { tipo: 'oficial', fonte: 'Professor Online e lista do Pé-de-Meia (MEC) · setembro' },
  provas: { tipo: 'turmma', fonte: `Provas aprovadas pelos professores · até ${PERIODO.ate}` },
  ia: { tipo: 'turmma', fonte: `Turmma · setembro até ${PERIODO.ate}` },
  ideb: { tipo: 'oficial', fonte: 'INEP · Ideb 2025' },
  censo: { tipo: 'oficial', fonte: 'INEP · Censo Escolar 2025' },
} satisfies Record<string, Origem>

/** Uma coluna da tabela, já com a origem do recorte. */
function coluna(id: ColunaId, recorte: Recorte, alerta: Alerta, essencial = true): Coluna {
  const diario = recorte === 'prefeitura' ? F.diarioJlle : F.diarioSc
  const notas = recorte === 'prefeitura' ? F.notasJlle : F.notasSc
  const limiar = alerta.tipo === 'contagem'
    ? `Colorido a partir de ${alerta.a} ${id === 'semChamada' ? (recorte === 'escola' ? (alerta.a === 1 ? 'dia' : 'dias') : (alerta.a === 1 ? 'turma' : 'turmas')) : (alerta.a === 1 ? 'aluno' : 'alunos')}`
    : `Colorido a partir de ${alerta.pct}% dos alunos ${recorte === 'escola' ? 'da turma' : 'da escola'}`
  const base: Record<ColunaId, Omit<Coluna, 'id' | 'alerta' | 'limiar' | 'essencial'>> = {
    reprova: { rotulo: '< 75%', titulo: 'Alunos abaixo de 75% de frequência (reprova por falta)', unidade: 'alunos', origem: diario },
    cronica: { rotulo: '75–90%', titulo: 'Alunos com falta crônica (75 a 90% de frequência)', unidade: 'alunos', origem: diario },
    abaixoDe80: { rotulo: '< 80%', titulo: 'Alunos abaixo de 80% de frequência', unidade: 'alunos', origem: diario },
    peDeMeia: { rotulo: 'Pé-de-Meia < 80%', titulo: 'Alunos do Pé-de-Meia abaixo de 80% em setembro', unidade: 'alunos', origem: F.peDeMeia },
    apoia: { rotulo: 'APOIA', titulo: 'Alunos no critério do APOIA, ainda sem aviso aberto', unidade: 'alunos', origem: F.apoia },
    apoiaVencidos: { rotulo: 'APOIA vencido', titulo: 'APOIAs abertos com o prazo de 14 dias vencido', unidade: 'alunos', origem: F.apoia },
    lp: { rotulo: 'LP < 6,0', titulo: 'Alunos abaixo de 6,0 em Língua Portuguesa no trimestre', unidade: 'alunos', origem: notas },
    mat: { rotulo: 'MAT < 6,0', titulo: 'Alunos abaixo de 6,0 em Matemática no trimestre', unidade: 'alunos', origem: notas },
    primeiraSerieDois: { rotulo: '1ª série: 2+ < 6,0', titulo: 'Alunos da 1ª série do EM abaixo de 6,0 em 2 ou mais componentes', unidade: 'alunos', origem: notas },
    semChamada: recorte === 'escola'
      ? { rotulo: 'Sem chamada', titulo: 'Dias letivos sem chamada lançada', unidade: 'dias', origem: diario }
      : { rotulo: 'Sem chamada', titulo: 'Turmas sem chamada há 3 dias letivos ou mais', unidade: 'turmas', origem: diario },
  }
  return { id, ...base[id], alerta, limiar, essencial }
}

/* ── Contas ────────────────────────────────────────────────────────────────────────────────────────────── */

const zeros = (): DadosDaLinha => ({
  faixas: { 'em-dia': 0, atencao: 0, cronica: 0, reprova: 0 },
  apoia: 0, apoiaVencidos: 0, lp: 0, mat: 0, dois: 0, semChamada: 0, pioraram: 0, melhoraram: 0,
})

/** Os totais de um conjunto de linhas (as sem dados ficam de fora). Serve para refazer as faixas e as notas quando
    a tela filtra a tabela por série. Os opcionais só aparecem se alguma linha os tiver. */
export function somarLinhas(linhas: LinhaDoPainel[]): { alunos: number; dados: DadosDaLinha } {
  const t = zeros()
  let alunos = 0
  for (const l of linhas) {
    const d = l.dados
    if (!d) continue
    alunos += l.alunos
    for (const f of FAIXAS) t.faixas[f.id] += d.faixas[f.id]
    t.apoia += d.apoia; t.apoiaVencidos += d.apoiaVencidos; t.lp += d.lp; t.mat += d.mat; t.dois += d.dois
    t.semChamada += d.semChamada; t.pioraram += d.pioraram; t.melhoraram += d.melhoraram
    if (d.abaixoDe80 !== undefined) t.abaixoDe80 = (t.abaixoDe80 ?? 0) + d.abaixoDe80
    if (d.primeiraSerieDois !== undefined) t.primeiraSerieDois = (t.primeiraSerieDois ?? 0) + d.primeiraSerieDois
    if (d.peDeMeia) t.peDeMeia = {
      beneficiarios: (t.peDeMeia?.beneficiarios ?? 0) + d.peDeMeia.beneficiarios,
      abaixoDe80: (t.peDeMeia?.abaixoDe80 ?? 0) + d.peDeMeia.abaixoDe80,
    }
  }
  return { alunos, dados: t }
}

/** O número de uma célula da tabela (null = linha sem dados). */
export function valorDaColuna(linha: LinhaDoPainel, c: ColunaId): number | null {
  const d = linha.dados
  if (!d) return null
  switch (c) {
    case 'reprova': return d.faixas.reprova
    case 'cronica': return d.faixas.cronica
    case 'abaixoDe80': return d.abaixoDe80 ?? null
    case 'peDeMeia': return d.peDeMeia?.abaixoDe80 ?? null
    case 'primeiraSerieDois': return d.primeiraSerieDois ?? null
    default: return d[c]
  }
}

/** A célula passou do limiar da coluna? (é o que decide a cor da CelulaLimiar) */
export function passaDoLimiar(c: Pick<Coluna, 'alerta'>, valor: number | null, alunos: number): boolean {
  if (valor === null || valor <= 0) return false
  return c.alerta.tipo === 'contagem' ? valor >= c.alerta.a : alunos > 0 && (valor / alunos) * 100 >= c.alerta.pct
}

/** Como a contagem aparece: nas redes, de 1 a 4 vira "menos de 5". Na escola, o número. */
export function textoDaContagem(n: number | null | undefined, recorte: Recorte): string {
  if (n === null || n === undefined) return '—'
  if (recorte !== 'escola' && n > 0 && n < 5) return 'menos de 5'
  return inteiro(n)
}

/** A frequência por faixa a partir dos totais e do movimento por faixa ([pioraram, melhoraram] em cada uma). */
function frequenciaDe(total: DadosDaLinha, alunos: number, mov: Record<FaixaId, [number, number]>, origem: Origem, abaixoDe80?: number): Frequencia {
  const faixas = FAIXAS.map((f) => ({ id: f.id, alunos: total.faixas[f.id], pioraram: mov[f.id][0], melhoraram: mov[f.id][1] }))
  return {
    total: alunos, faixas,
    pioraram: faixas.reduce((s, f) => s + f.pioraram, 0),
    melhoraram: faixas.reduce((s, f) => s + f.melhoraram, 0),
    desde: 'agosto', abaixoDe80, limiar: LIMIAR_DA_FREQUENCIA, origem,
  }
}

/** As notas abaixo de 6,0, com o trimestre anterior e quem entrou e saiu. `alunos` vem das linhas. */
function notasDe(total: DadosDaLinha, mov: Record<ComponenteId, [anterior: number, entraram: number]>, origem: Origem): Notas {
  const item = (id: ComponenteId, rotulo: string, curto: string): NotaAbaixo => {
    const alunos = total[id]
    const [anterior, entraram] = mov[id]
    return { id, rotulo, curto, alunos, anterior, entraram, sairam: anterior + entraram - alunos }
  }
  return {
    limiar: 6, limiarTexto: LIMIAR_DAS_NOTAS, periodo: PERIODO_DAS_NOTAS.atual, comparado: PERIODO_DAS_NOTAS.anterior,
    itens: [item('lp', 'Língua Portuguesa', 'LP'), item('mat', 'Matemática', 'MAT'), item('dois', '2 ou mais componentes', '2+')],
    origem,
  }
}

/* ══ 1. COLÉGIO AURORA (coordenação) ═════════════════════════════════════════════════════════════════════════

   Os alunos de cada turma são os com acesso de numeros-escola (somam 612). Por turma:
   [id, < 75, 75–90, 90–95, APOIA, LP, MAT, 2+, dias sem chamada, pioraram, melhoraram]; ≥ 95 = o resto.
   Totais: < 75 → 14 · 75–90 → 68 · 90–95 → 131 · ≥ 95 → 399 · APOIA 4 · LP 47 · MAT 71 · 2+ 38 · pioraram 18 · melhoraram 9.
   Sem chamada: 7ºB há 3 dias, 9ºC há 4. O 3ºA está sem lista (0 alunos, sem dados). */

const ALUNOS_DA_TURMA: Record<string, number> = {
  'au-6a': 29, 'au-6b': 25, 'au-6c': 26, 'au-7a': 28, 'au-7b': 29, 'au-7c': 28, 'au-8a': 29, 'au-8b': 29, 'au-8c': 28,
  'au-9a': 29, 'au-9b': 29, 'au-9c': 29, 'au-1a': 29, 'au-1b': 29, '1c': 34, 'au-1d': 28, '2a': 30, '2b': 32,
  'au-2c': 33, 'au-2d': 31, 'au-3a': 0, 'au-3b': 28,
}

type TuplaTurma = [id: string, reprova: number, cronica: number, atencao: number, apoia: number, lp: number, mat: number, dois: number, semChamada: number, pioraram: number, melhoraram: number]
const TURMAS_AURORA: TuplaTurma[] = [
  ['au-6a', 0, 2, 5, 0, 1, 2, 1, 0, 0, 1],
  ['au-6b', 0, 2, 5, 0, 1, 2, 0, 0, 1, 0],
  ['au-6c', 1, 3, 5, 0, 2, 2, 1, 0, 0, 0],
  ['au-7a', 0, 2, 6, 0, 2, 3, 1, 0, 1, 0],
  ['au-7b', 1, 3, 6, 0, 1, 3, 1, 3, 2, 0],
  ['au-7c', 0, 2, 5, 0, 2, 2, 1, 0, 0, 1],
  ['au-8a', 1, 3, 6, 1, 3, 4, 2, 0, 1, 0],
  ['au-8b', 0, 3, 6, 0, 2, 3, 1, 0, 0, 1],
  ['au-8c', 1, 3, 6, 0, 2, 4, 2, 0, 1, 0],
  ['au-9a', 1, 3, 6, 0, 3, 4, 2, 0, 1, 0],
  ['au-9b', 0, 3, 7, 0, 2, 3, 2, 0, 0, 1],
  ['au-9c', 1, 3, 6, 0, 3, 4, 2, 4, 2, 0],
  ['au-1a', 1, 4, 7, 0, 3, 4, 3, 0, 1, 1],
  ['au-1b', 1, 4, 7, 0, 2, 4, 2, 0, 1, 0],
  ['1c', 2, 6, 8, 1, 5, 6, 4, 0, 2, 0],
  ['au-1d', 1, 4, 7, 0, 2, 4, 3, 0, 1, 1],
  ['2a', 0, 4, 6, 0, 2, 3, 2, 0, 1, 1],
  ['2b', 2, 5, 7, 2, 4, 6, 3, 0, 2, 0],
  ['au-2c', 0, 3, 8, 0, 2, 3, 2, 0, 0, 1],
  ['au-2d', 0, 3, 6, 0, 2, 3, 2, 0, 0, 1],
  ['au-3b', 1, 3, 6, 0, 1, 2, 1, 0, 1, 0],
]

const LINHAS_AURORA: LinhaDoPainel[] = TURMAS_DA_ESCOLA.map((t): LinhaDoPainel => {
  const alunos = ALUNOS_DA_TURMA[t.id] ?? 0
  const tupla = TURMAS_AURORA.find((x) => x[0] === t.id)
  if (!tupla || alunos === 0) return { id: t.id, nome: t.nome, curto: t.nome, serie: t.serie, alunos: 0, situacao: 'sem-lista', dados: null }
  const [, reprova, cronica, atencao, apoia, lp, mat, dois, semChamada, pioraram, melhoraram] = tupla
  return {
    id: t.id, nome: t.nome, curto: t.nome, serie: t.serie, alunos, situacao: 'com-dados',
    dados: {
      faixas: { 'em-dia': alunos - reprova - cronica - atencao, atencao, cronica, reprova },
      apoia, apoiaVencidos: 0, lp, mat, dois, semChamada, pioraram, melhoraram,
      primeiraSerieDois: t.serie === '1º ano EM' ? dois : undefined,
    },
  }
})

const TOTAL_AURORA = somarLinhas(LINHAS_AURORA)
/** Só no Estado e no 2º nível: o Aurora abaixo de 80% e o Pé-de-Meia (o EM do Aurora tem 274 alunos). */
const AURORA_ABAIXO_DE_80 = 29
const AURORA_PE_DE_MEIA = { beneficiarios: 71, abaixoDe80: 6 }
const AURORA_TURMAS_SEM_CHAMADA = LINHAS_AURORA.filter((l) => (l.dados?.semChamada ?? 0) >= 3).length

function painelEscola(): Painel {
  const t = TOTAL_AURORA.dados
  const semChamada = LINHAS_AURORA.filter((l) => (l.dados?.semChamada ?? 0) >= 3)
  return {
    recorte: 'escola',
    nome: ESCOLA.nome,
    escopo: `${ESCOLA.nome} · ${inteiro(TOTAL_AURORA.alunos)} alunos · 6º ao 3º EM`,
    linhaDeFonte: 'Diário oficial (Professor Online) lido hoje às 7h · Turmma',
    sistemaOficial: 'Professor Online',
    totalDeAlunos: TOTAL_AURORA.alunos,
    series: ['6º ano EF', '7º ano EF', '8º ano EF', '9º ano EF', '1º ano EM', '2º ano EM', '3º ano EM'],
    periodo: PERIODO_DAS_NOTAS,
    acoes: [
      {
        id: 'apoia', numero: t.apoia, unidade: 'alunos', frase: 'no critério do APOIA, ainda sem aviso aberto',
        limiar: LIMIAR_DO_APOIA, detalhe: '2 no 2ºB · 1 no 1ºC · 1 no 8ºA',
        prazo: 'Abrir o aviso no APOIA até 24/09', botao: `Ver os ${t.apoia}`, kpi: 'APOIA sem aviso', prazoCurto: 'até 24/09',
        destino: { tipo: 'lista', lista: 'apoia' }, origem: F.apoia,
      },
      {
        id: 'chamada', numero: semChamada.length, unidade: 'turmas', frase: 'sem chamada lançada há 3 dias letivos ou mais',
        limiar: 'O Censo e o APOIA dependem do diário em dia',
        detalhe: semChamada.map((l) => `${l.nome} há ${l.dados!.semChamada} dias`).join(' · '),
        prazo: 'O diário de setembro fecha em 30/09', botao: 'Ver as turmas', kpi: 'Sem chamada', prazoCurto: 'diário fecha 30/09',
        destino: { tipo: 'tabela', coluna: 'semChamada' }, origem: F.diarioSc,
      },
      {
        id: 'provas', numero: 3, unidade: 'provas', frase: 'corrigidas pela IA esperando a aprovação do professor',
        limiar: 'Nota da IA só vale depois que o professor aprova',
        detalhe: '2ºB · 8ºC · 1ºA', prazo: 'Esperando há mais de 2 dias', botao: 'Ver as provas', kpi: 'Provas a aprovar', prazoCurto: 'há 2+ dias',
        destino: { tipo: 'rota', para: '/coordenacao/registros?aba=ia' }, origem: F.provas,
      },
    ],
    frequencia: frequenciaDe(t, TOTAL_AURORA.alunos, { 'em-dia': [0, 5], atencao: [6, 3], cronica: [9, 1], reprova: [3, 0] }, F.diarioSc),
    notas: notasDe(t, { lp: [41, 12], mat: [62, 17], dois: [33, 9] }, F.notasSc),
    apoias: { abertos: 3, naEscola: 2, noConselho: 1, noMp: 0, vencidos: 0, origem: F.apoia },
    peDeMeia: { ...AURORA_PE_DE_MEIA, limiar: LIMIAR_DO_PE_DE_MEIA, origem: F.peDeMeia },
    rotuloDaLinha: 'Turma',
    colunas: [
      coluna('reprova', 'escola', { tipo: 'contagem', a: 1 }),
      coluna('cronica', 'escola', { tipo: 'parcela', pct: 15 }, false),
      coluna('apoia', 'escola', { tipo: 'contagem', a: 1 }),
      coluna('lp', 'escola', { tipo: 'parcela', pct: 12 }, false),
      coluna('mat', 'escola', { tipo: 'parcela', pct: 15 }),
      coluna('semChamada', 'escola', { tipo: 'contagem', a: 3 }, false),
    ],
    linhas: LINHAS_AURORA,
    habilidades: {
      origem: F.provas,
      itens: [
        { codigo: 'EM13MAT302', nome: 'Função quadrática', serie: '1º ano EM', componente: 'Matemática', alunos: 58, de: 120 },
        { codigo: 'EM13CNT102', nome: 'Termodinâmica', serie: '2º ano EM', componente: 'Física', alunos: 57, de: 126 },
        { codigo: 'EM13CNT301', nome: 'Reagente limitante', serie: '2º ano EM', componente: 'Química', alunos: 55, de: 126 },
        { codigo: 'EF09MA09', nome: 'Equação do 2º grau', serie: '9º ano EF', componente: 'Matemática', alunos: 41, de: 87 },
        { codigo: 'EF08MA06', nome: 'Expressões algébricas', serie: '8º ano EF', componente: 'Matemática', alunos: 38, de: 86 },
      ],
    },
    ia: { materiais: MES.gerou, revisados: 100, esperando: MES.esperam, pacote: PACOTE.usado, porAluno: PACOTE.porAluno, origem: F.ia },
    anuais: [
      { id: 'ideb-af', rotulo: 'Ideb · anos finais', valor: '5,4', contexto: 'Rede estadual em Joinville: 5,0', origem: { tipo: 'oficial', fonte: 'INEP · Ideb 2025 da escola' } },
      { id: 'ideb-em', rotulo: 'Ideb · Ensino Médio', valor: '4,6', contexto: 'Rede estadual em Joinville: 4,3', origem: { tipo: 'oficial', fonte: 'INEP · Ideb 2025 da escola' } },
      { id: 'reprovacao-1em', rotulo: '1º ano EM · reprovação', valor: '11,2%', contexto: 'Rede estadual em Joinville: 15,7%', origem: { tipo: 'oficial', fonte: 'INEP · Censo Escolar 2025 da escola' } },
      { id: 'distorcao-1em', rotulo: '1º ano EM · distorção idade-série', valor: '13,5%', contexto: 'Rede estadual em Joinville: 24,8%', origem: { tipo: 'oficial', fonte: 'INEP · Censo Escolar 2025 da escola' } },
    ],
    tendencia: { meses: MESES, reprova: [3, 5, 6, 8, 9, 9, 11, t.faixas.reprova], mat: [38, 47, 55, 58, 62, 60, 64, t.mat] },
  }
}

/* ══ 2. PREFEITURA DE JOINVILLE ══════════════════════════════════════════════════════════════════════════════

   As 6 escolas de dados/rede.ts, de A a Z. Com dados: Araucária 980, Ipê Amarelo 820, Manacá 900, Rio Cachoeira 712
   (3.412). Bem-te-vi está montando e Figueira com convite enviado: sem dados.
   [id, < 75, 75–90, 90–95, APOIA, APOIA vencido, LP, MAT, 2+, turmas sem chamada, pioraram, melhoraram]
   Totais: < 75 → 96 · 75–90 → 452 · 90–95 → 803 · ≥ 95 → 2.061 · APOIA 14 · vencidos 5 · LP 268 · MAT 391 · 2+ 214. */

type TuplaEscola = [id: string, reprova: number, cronica: number, atencao: number, apoia: number, vencidos: number, lp: number, mat: number, dois: number, semChamada: number, pioraram: number, melhoraram: number]
const ESCOLAS_PREFEITURA: TuplaEscola[] = [
  ['araucaria', 31, 134, 229, 5, 2, 79, 114, 62, 3, 19, 11],
  ['ipe-amarelo', 22, 106, 192, 3, 1, 63, 94, 51, 0, 14, 8],
  ['manaca', 27, 121, 215, 4, 2, 72, 104, 57, 1, 16, 9],
  ['cachoeira', 16, 91, 167, 2, 0, 54, 79, 44, 2, 12, 6],
]

const LINHAS_PREFEITURA: LinhaDoPainel[] = [...ESCOLAS_DA_REDE]
  .sort((a, b) => a.curto.localeCompare(b.curto, 'pt-BR'))
  .map((e): LinhaDoPainel => {
    const tupla = ESCOLAS_PREFEITURA.find((x) => x[0] === e.id)
    if (!tupla || e.situacao !== 'em-uso') {
      return { id: e.id, nome: e.nome, curto: e.curto, alunos: 0, situacao: e.situacao === 'convite' ? 'convite' : 'montando', dados: null }
    }
    const [, reprova, cronica, atencao, apoia, apoiaVencidos, lp, mat, dois, semChamada, pioraram, melhoraram] = tupla
    return {
      id: e.id, nome: e.nome, curto: e.curto, alunos: e.alunos, situacao: 'com-dados',
      dados: { faixas: { 'em-dia': e.alunos - reprova - cronica - atencao, atencao, cronica, reprova }, apoia, apoiaVencidos, lp, mat, dois, semChamada, pioraram, melhoraram },
    }
  })

function pacoteDe(ids: string[], uso: Record<string, { custoIA: number; tetoIA: number }>, alunos: number) {
  const custo = ids.reduce((s, id) => s + (uso[id]?.custoIA ?? 0), 0)
  const teto = ids.reduce((s, id) => s + (uso[id]?.tetoIA ?? 0), 0)
  return { pacote: pct(custo, teto), porAluno: porAluno(custo, alunos) }
}

function painelPrefeitura(): Painel {
  const tot = somarLinhas(LINHAS_PREFEITURA)
  const t = tot.dados
  const comDados = LINHAS_PREFEITURA.filter((l) => l.dados)
  const escolasSemChamada = comDados.filter((l) => l.dados!.semChamada > 0)
  return {
    recorte: 'prefeitura',
    nome: 'Prefeitura de Joinville',
    escopo: `Rede municipal · Turmma em ${LINHAS_PREFEITURA.length} escolas de anos finais · ${inteiro(tot.alunos)} alunos`,
    linhaDeFonte: 'Diário oficial (EVN) lido hoje às 7h · Turmma',
    sistemaOficial: 'EVN',
    totalDeAlunos: tot.alunos,
    series: ['6º ano', '7º ano', '8º ano', '9º ano'],
    periodo: PERIODO_DAS_NOTAS,
    acoes: [
      {
        id: 'apoia-vencido', numero: t.apoiaVencidos, unidade: 'APOIAs', frase: 'com o prazo de 14 dias vencido',
        limiar: 'Cada etapa do APOIA tem 14 dias: escola, Conselho Tutelar, Ministério Público',
        detalhe: `${t.apoia} alunos no critério, ainda sem aviso aberto`,
        prazo: 'Vencidos: falar com as escolas esta semana', botao: 'Ver por escola', kpi: 'APOIA vencido', prazoCurto: 'esta semana',
        destino: { tipo: 'tabela', coluna: 'apoiaVencidos' }, origem: F.apoia,
      },
      {
        id: 'chamada', numero: escolasSemChamada.length, unidade: 'escolas', frase: 'com chamada atrasada há 3 dias letivos ou mais',
        limiar: 'O Censo e o APOIA dependem do diário em dia',
        detalhe: `${t.semChamada} turmas no total`,
        prazo: 'O diário de setembro fecha em 30/09', botao: 'Ver as escolas', kpi: 'Chamada atrasada', prazoCurto: 'diário fecha 30/09',
        destino: { tipo: 'tabela', coluna: 'semChamada' }, origem: F.diarioJlle,
      },
      {
        id: 'revisao', numero: 58, unidade: 'materiais', frase: 'da IA esperando a revisão do professor',
        limiar: 'Nada da IA chega ao aluno sem um professor revisar',
        prazo: 'Esperando há mais de 2 dias', botao: 'Ver por escola', kpi: 'IA para revisar', prazoCurto: 'há 2+ dias',
        destino: { tipo: 'rota', para: '/rede/escolas' }, origem: F.ia,
      },
    ],
    frequencia: frequenciaDe(t, tot.alunos, { 'em-dia': [0, 19], atencao: [24, 11], cronica: [27, 4], reprova: [10, 0] }, F.diarioJlle),
    notas: notasDe(t, { lp: [241, 71], mat: [352, 96], dois: [198, 52] }, F.notasJlle),
    apoias: { abertos: 23, naEscola: 11, noConselho: 8, noMp: 4, vencidos: t.apoiaVencidos, origem: F.apoia },
    rotuloDaLinha: 'Escola',
    colunas: [
      coluna('reprova', 'prefeitura', { tipo: 'parcela', pct: 3 }),
      coluna('cronica', 'prefeitura', { tipo: 'parcela', pct: 13 }, false),
      coluna('apoia', 'prefeitura', { tipo: 'contagem', a: 5 }, false),
      coluna('apoiaVencidos', 'prefeitura', { tipo: 'contagem', a: 1 }),
      coluna('lp', 'prefeitura', { tipo: 'parcela', pct: 9 }, false),
      coluna('mat', 'prefeitura', { tipo: 'parcela', pct: 12 }),
      coluna('semChamada', 'prefeitura', { tipo: 'contagem', a: 1 }, false),
    ],
    linhas: LINHAS_PREFEITURA,
    habilidades: {
      origem: F.provas,
      itens: [
        { codigo: 'EF08MA08', nome: 'Sistemas de equações', serie: '8º ano', componente: 'Matemática', alunos: 412, de: 837 },
        { codigo: 'EF09CI02', nome: 'Reações químicas', serie: '9º ano', componente: 'Ciências', alunos: 398, de: 805 },
        { codigo: 'EF08MA06', nome: 'Expressões algébricas', serie: '8º ano', componente: 'Matemática', alunos: 371, de: 837 },
        { codigo: 'EF09MA09', nome: 'Equação do 2º grau', serie: '9º ano', componente: 'Matemática', alunos: 344, de: 805 },
        { codigo: 'EF07MA04', nome: 'Números inteiros', serie: '7º ano', componente: 'Matemática', alunos: 309, de: 869 },
      ],
    },
    ia: {
      materiais: comDados.reduce((s, l) => s + (SAIDAS_IA[l.id] ?? 0), 0), revisados: 100, esperando: 58,
      ...pacoteDe(comDados.map((l) => l.id), USO_DE_SETEMBRO, tot.alunos), origem: F.ia,
    },
    anuais: [
      {
        id: 'ideb-af', rotulo: 'Ideb · anos finais', valor: '6,0', contexto: 'Parado em 6,0 desde 2023; última meta (2021): 6,4',
        historico: [{ ano: 2017, valor: '6,1' }, { ano: 2019, valor: '6,2' }, { ano: 2021, valor: '5,9' }, { ano: 2023, valor: '6,0' }, { ano: 2025, valor: '6,0' }],
        origem: F.ideb,
      },
      {
        id: 'ideb-ai', rotulo: 'Ideb · anos iniciais', valor: '7,1', contexto: 'Última meta (2021): 6,9',
        nota: 'O Turmma não atua nessa etapa', origem: F.ideb,
      },
      { id: 'abandono-af', rotulo: 'Anos finais · abandono', valor: '0,0%', contexto: 'Aprovação de 99,0% em 2025', origem: F.censo },
      { id: 'distorcao-af', rotulo: 'Anos finais · distorção idade-série', valor: '9,0%', contexto: '2 anos ou mais de atraso', origem: F.censo },
    ],
    tendencia: { meses: MESES, reprova: [31, 44, 52, 61, 70, 74, 86, t.faixas.reprova], mat: [228, 270, 301, 330, 352, 346, 368, t.mat] },
  }
}

/* ══ 3. ESTADO DE SC · COORDENADORIA REGIONAL DE JOINVILLE ═════════════════════════════════════════════════════

   5 escolas estaduais inventadas (nomes de árvores e aves de SC) + o Colégio Aurora, de A a Z. A EEB Saíra está
   montando (sem dados). Com dados: Bracatinga 840, Canela-Preta 1.120, Colégio Aurora 612, Gralha-Azul 760,
   Imbuia 930 (4.262). O Aurora entra com a soma das suas turmas.
   [id, < 75, 75–90, 90–95, < 80, APOIA, vencidos, Pé-de-Meia < 80, beneficiários, LP, MAT, 2+, 1ª série 2+, turmas sem chamada, pioraram, melhoraram]
   Totais: < 75 → 157 · 75–90 → 602 · 90–95 → 882 · ≥ 95 → 2.621 · < 80 → 302 · Pé-de-Meia 63 de 1.140 · APOIA 29 ·
   vencidos 10 · LP 363 · MAT 551 · 2+ 320 · 1ª série 2+ 106. */

type EscolaEstadual = { id: string; nome: string; curto: string; alunos: number; situacao: SituacaoDaLinha }
const ESCOLAS_ESTADUAIS: EscolaEstadual[] = [
  { id: 'bracatinga', nome: 'EEB Bracatinga', curto: 'Bracatinga', alunos: 840, situacao: 'com-dados' },
  { id: 'canela-preta', nome: 'EEB Canela-Preta', curto: 'Canela-Preta', alunos: 1120, situacao: 'com-dados' },
  { id: 'aurora', nome: ESCOLA.nome, curto: ESCOLA.nome, alunos: TOTAL_AURORA.alunos, situacao: 'com-dados' },
  { id: 'gralha-azul', nome: 'EEB Gralha-Azul', curto: 'Gralha-Azul', alunos: 760, situacao: 'com-dados' },
  { id: 'imbuia', nome: 'EEB Imbuia', curto: 'Imbuia', alunos: 930, situacao: 'com-dados' },
  { id: 'saira', nome: 'EEB Saíra', curto: 'Saíra', alunos: 0, situacao: 'montando' },
]

type TuplaEstadual = [id: string, reprova: number, cronica: number, atencao: number, abaixoDe80: number, apoia: number, vencidos: number, pdm: number, beneficiarios: number, lp: number, mat: number, dois: number, primeiraDois: number, semChamada: number, pioraram: number, melhoraram: number]
const DADOS_ESTADUAIS: TuplaEstadual[] = [
  ['bracatinga', 29, 118, 172, 58, 6, 2, 11, 214, 71, 112, 64, 21, 1, 17, 8],
  ['canela-preta', 52, 176, 231, 97, 9, 4, 23, 402, 104, 158, 97, 34, 3, 27, 12],
  ['gralha-azul', 24, 101, 158, 47, 3, 1, 8, 188, 58, 89, 49, 15, 0, 9, 5],
  ['imbuia', 38, 139, 190, 71, 7, 3, 15, 265, 83, 121, 72, 24, 2, 13, 7],
]

/** O Aurora visto pelo Estado: a soma das turmas, mais o que só o Estado mostra. */
function linhaDoAurora(): DadosDaLinha {
  const t = TOTAL_AURORA.dados
  return {
    ...t, faixas: { ...t.faixas }, abaixoDe80: AURORA_ABAIXO_DE_80, peDeMeia: { ...AURORA_PE_DE_MEIA },
    apoiaVencidos: 0, semChamada: AURORA_TURMAS_SEM_CHAMADA,
  }
}

const LINHAS_ESTADO: LinhaDoPainel[] = ESCOLAS_ESTADUAIS.map((e): LinhaDoPainel => {
  if (e.situacao !== 'com-dados') return { id: e.id, nome: e.nome, curto: e.curto, alunos: 0, situacao: e.situacao, dados: null }
  if (e.id === 'aurora') return { id: e.id, nome: e.nome, curto: e.curto, alunos: e.alunos, situacao: 'com-dados', dados: linhaDoAurora() }
  const [, reprova, cronica, atencao, abaixoDe80, apoia, apoiaVencidos, pdm, beneficiarios, lp, mat, dois, primeiraSerieDois, semChamada, pioraram, melhoraram] = DADOS_ESTADUAIS.find((x) => x[0] === e.id)!
  return {
    id: e.id, nome: e.nome, curto: e.curto, alunos: e.alunos, situacao: 'com-dados',
    dados: {
      faixas: { 'em-dia': e.alunos - reprova - cronica - atencao, atencao, cronica, reprova },
      abaixoDe80, peDeMeia: { beneficiarios, abaixoDe80: pdm }, apoia, apoiaVencidos, lp, mat, dois, primeiraSerieDois,
      semChamada, pioraram, melhoraram,
    },
  }
})

/** O uso da IA das estaduais (o Aurora vem de dados/rede.ts). */
const USO_ESTADUAL: Record<string, { custoIA: number; tetoIA: number; materiais: number; esperando: number }> = {
  bracatinga: { custoIA: 1_910.3, tetoIA: 4_200, materiais: 431, esperando: 11 },
  'canela-preta': { custoIA: 2_540.8, tetoIA: 5_600, materiais: 586, esperando: 14 },
  aurora: { custoIA: USO_DE_SETEMBRO.aurora.custoIA, tetoIA: USO_DE_SETEMBRO.aurora.tetoIA, materiais: MES.gerou, esperando: MES.esperam },
  'gralha-azul': { custoIA: 1_622.0, tetoIA: 3_800, materiais: 377, esperando: 6 },
  imbuia: { custoIA: 2_088.5, tetoIA: 4_650, materiais: 466, esperando: 12 },
}

function painelEstado(): Painel {
  const tot = somarLinhas(LINHAS_ESTADO)
  const t = tot.dados
  const comDados = LINHAS_ESTADO.filter((l) => l.dados).map((l) => l.id)
  const pdm = t.peDeMeia ?? { beneficiarios: 0, abaixoDe80: 0 }
  return {
    recorte: 'estado',
    nome: 'Estado de SC · Regional Joinville',
    escopo: `Rede estadual em Joinville · Turmma em ${LINHAS_ESTADO.length} escolas (inclui o Colégio Aurora) · ${inteiro(tot.alunos)} alunos`,
    linhaDeFonte: 'Diário oficial (Professor Online) lido hoje às 7h · Turmma',
    sistemaOficial: 'Professor Online',
    totalDeAlunos: tot.alunos,
    series: ['6º ano', '7º ano', '8º ano', '9º ano', '1ª série EM', '2ª série EM', '3ª série EM'],
    periodo: PERIODO_DAS_NOTAS,
    acoes: [
      {
        id: 'pe-de-meia', numero: pdm.abaixoDe80, unidade: 'alunos', frase: 'do Pé-de-Meia abaixo de 80% de frequência em setembro',
        limiar: LIMIAR_DO_PE_DE_MEIA, detalhe: `de ${inteiro(pdm.beneficiarios)} beneficiários nas escolas com Turmma`,
        prazo: 'Setembro fecha em 30/09: ainda dá para recuperar', botao: 'Ver por escola', kpi: 'Pé-de-Meia < 80%', prazoCurto: 'mês fecha 30/09',
        destino: { tipo: 'tabela', coluna: 'peDeMeia' }, origem: F.peDeMeia,
      },
      {
        id: 'apoia-vencido', numero: t.apoiaVencidos, unidade: 'APOIAs', frase: 'com o prazo de 14 dias vencido',
        limiar: 'Cada etapa do APOIA tem 14 dias: escola, Conselho Tutelar, Ministério Público',
        detalhe: `${t.apoia} alunos no critério, ainda sem aviso aberto`,
        prazo: 'Vencidos: falar com as escolas esta semana', botao: 'Ver por escola', kpi: 'APOIA vencido', prazoCurto: 'esta semana',
        destino: { tipo: 'tabela', coluna: 'apoiaVencidos' }, origem: F.apoia,
      },
      {
        id: 'primeira-serie', numero: t.primeiraSerieDois ?? 0, unidade: 'alunos', frase: 'da 1ª série do EM abaixo de 6,0 em 2 ou mais componentes',
        limiar: 'É a série com 15,7% de reprovação e 24,8% de distorção em Joinville (INEP 2025)',
        prazo: 'Antes do conselho de classe do trimestre', botao: 'Ver por escola', kpi: '1ª série: 2+ < 6,0', prazoCurto: 'antes do conselho',
        destino: { tipo: 'tabela', coluna: 'primeiraSerieDois' }, origem: F.notasSc,
      },
    ],
    frequencia: frequenciaDe(t, tot.alunos, { 'em-dia': [0, 22], atencao: [31, 14], cronica: [38, 5], reprova: [15, 0] }, F.diarioSc, t.abaixoDe80),
    notas: notasDe(t, { lp: [330, 88], mat: [497, 131], dois: [289, 74] }, F.notasSc),
    apoias: { abertos: 41, naEscola: 19, noConselho: 15, noMp: 7, vencidos: t.apoiaVencidos, origem: F.apoia },
    peDeMeia: { beneficiarios: pdm.beneficiarios, abaixoDe80: pdm.abaixoDe80, limiar: LIMIAR_DO_PE_DE_MEIA, origem: F.peDeMeia },
    rotuloDaLinha: 'Escola',
    colunas: [
      coluna('peDeMeia', 'estado', { tipo: 'contagem', a: 10 }),
      coluna('reprova', 'estado', { tipo: 'parcela', pct: 4 }),
      coluna('cronica', 'estado', { tipo: 'parcela', pct: 15 }, false),
      coluna('apoia', 'estado', { tipo: 'contagem', a: 5 }, false),
      coluna('apoiaVencidos', 'estado', { tipo: 'contagem', a: 1 }),
      coluna('lp', 'estado', { tipo: 'parcela', pct: 9 }, false),
      coluna('mat', 'estado', { tipo: 'parcela', pct: 12 }, false),
      coluna('primeiraSerieDois', 'estado', { tipo: 'contagem', a: 20 }),
    ],
    linhas: LINHAS_ESTADO,
    habilidades: {
      origem: F.provas,
      itens: [
        { codigo: 'EM13MAT302', nome: 'Função quadrática', serie: '1ª série EM', componente: 'Matemática', alunos: 702 },
        { codigo: 'EM13CNT102', nome: 'Termodinâmica', serie: '2ª série EM', componente: 'Física', alunos: 566 },
        { codigo: 'EM13MAT305', nome: 'Logaritmos', serie: '2ª série EM', componente: 'Matemática', alunos: 521 },
        { codigo: 'EF09MA09', nome: 'Equação do 2º grau', serie: '9º ano', componente: 'Matemática', alunos: 287 },
      ],
    },
    ia: {
      materiais: comDados.reduce((s, id) => s + (USO_ESTADUAL[id]?.materiais ?? 0), 0), revisados: 100,
      esperando: comDados.reduce((s, id) => s + (USO_ESTADUAL[id]?.esperando ?? 0), 0),
      ...pacoteDe(comDados, USO_ESTADUAL, tot.alunos), origem: F.ia,
    },
    anuais: [
      {
        id: 'ideb-em', rotulo: 'Ideb · Ensino Médio', valor: '4,3', contexto: 'Subiu de 4,0 (2023) para 4,3 (2025); sem meta oficial',
        historico: [{ ano: 2017, valor: '4,0' }, { ano: 2019, valor: '3,5' }, { ano: 2023, valor: '4,0' }, { ano: 2025, valor: '4,3' }],
        origem: F.ideb,
      },
      {
        id: 'ideb-af', rotulo: 'Ideb · anos finais', valor: '5,0', contexto: 'Última meta (2021): 5,8',
        historico: [{ ano: 2017, valor: '4,8' }, { ano: 2019, valor: '4,7' }, { ano: 2021, valor: '5,0' }, { ano: 2023, valor: '4,8' }, { ano: 2025, valor: '5,0' }],
        origem: F.ideb,
      },
      { id: 'reprovacao-1em', rotulo: '1ª série EM · reprovação', valor: '15,7%', contexto: 'Aprovação de 79,9% em 2025', origem: F.censo },
      { id: 'abandono-1em', rotulo: '1ª série EM · abandono', valor: '4,4%', contexto: 'Ensino Médio inteiro: 4,1%', origem: F.censo },
      { id: 'distorcao-1em', rotulo: '1ª série EM · distorção idade-série', valor: '24,8%', contexto: '2 anos ou mais de atraso; 9º ano: 21,4%', origem: F.censo },
    ],
    tendencia: {
      meses: MESES, reprova: [52, 71, 88, 101, 118, 126, 142, t.faixas.reprova], mat: [330, 388, 421, 462, 497, 488, 520, t.mat],
      peDeMeia: [21, 30, 38, 44, 51, 48, 55, pdm.abaixoDe80],
    },
  }
}

/* ── Leitura ───────────────────────────────────────────────────────────────────────────────────────────── */

const PAINEIS: Record<Recorte, Painel> = { escola: painelEscola(), prefeitura: painelPrefeitura(), estado: painelEstado() }

/** O painel inteiro de um recorte. É um objeto pronto (não muda na demonstração). */
export function painelDa(recorte: Recorte): Painel {
  return PAINEIS[recorte]
}

/** As colunas de qualquer recorte por id (para o Analista citar a mesma frase da tabela). */
export const COLUNAS: Record<Recorte, Coluna[]> = { escola: PAINEIS.escola.colunas, prefeitura: PAINEIS.prefeitura.colunas, estado: PAINEIS.estado.colunas }

/* ══ 2º NÍVEL DA COORDENAÇÃO: AS LISTAS COM NOME ════════════════════════════════════════════════════════════

   Só na coordenação, e a tela só abre depois do motivo registrado (D34). O 2ºB usa os nomes reais da turma
   (`listaDa('2b')`); as listas batem com a linha do 2ºB na tabela (< 75%: 2 · APOIA: 2 · MAT < 6,0: 6).
   A lista do APOIA da escola soma os 4 do cartão (2 do 2ºB, 1 do 1ºC, 1 do 8ºA). Datas em dias letivos
   (21/09/2026 é segunda; 07/09 é feriado). Nenhuma média: cada aluno leva o próprio número e o motivo. */

export type ListaId = 'apoia' | 'reprova' | 'mat'
export type AlunoDaLista = {
  nome: string
  matricula: string
  turma: string
  /** o motivo em uma linha: "5 faltas seguidas, de 14 a 18/09" */
  motivo: string
}
export type ListaNominal = {
  id: ListaId
  /** "2ºB" ou "Colégio Aurora" */
  recorte: string
  titulo: string
  limiar: string
  origem: Origem
  alunos: AlunoDaLista[]
}

const MOTIVOS_2B: Record<ListaId, [nome: string, motivo: string][]> = {
  apoia: [
    ['Caio Mendes', '5 faltas seguidas, de 14 a 18/09'],
    ['Thiago Barros', '7 faltas alternadas em 30 dias: 24/08, 27/08, 31/08, 03/09, 09/09, 11/09 e 16/09'],
  ],
  reprova: [
    ['Caio Mendes', 'Frequência de 72% no ano · 5 faltas seguidas nesta semana'],
    ['Vitor Hugo', 'Frequência de 74% no ano · 3 faltas em setembro'],
  ],
  mat: [
    ['Ana Beatriz', 'Nota 5,2 no trimestre · estava acima de 6,0 no trimestre anterior'],
    ['Caio Mendes', 'Nota 4,8 no trimestre · também abaixo em Química'],
    ['Davi Lucca', 'Nota 5,0 no trimestre'],
    ['Heitor Alves', 'Nota 4,5 no trimestre · também abaixo em Química'],
    ['Nicolas Dias', 'Nota 5,5 no trimestre'],
    ['Yasmin Farias', 'Nota 5,7 no trimestre · estava acima de 6,0 no trimestre anterior'],
  ],
}

const TITULO_DA_LISTA: Record<ListaId, { titulo: (onde: string) => string; limiar: string; origem: Origem }> = {
  apoia: { titulo: (onde) => `No critério do APOIA, sem aviso aberto · ${onde}`, limiar: LIMIAR_DO_APOIA, origem: F.apoia },
  reprova: { titulo: (onde) => `Abaixo de 75% de frequência · ${onde}`, limiar: LIMIAR_DA_FREQUENCIA, origem: F.diarioSc },
  mat: { titulo: (onde) => `Abaixo de 6,0 em Matemática no trimestre · ${onde}`, limiar: LIMIAR_DAS_NOTAS, origem: F.notasSc },
}

const matriculaDe = (turmaId: string, nome: string) => listaDa(turmaId).find((n) => n.nome === nome)?.matricula ?? '—'

/** A lista com nomes. `turmaId` '2b' traz a do 2ºB; sem turma, só o APOIA tem lista da escola (os 4 do cartão).
    Outras turmas ainda não têm lista montada: devolve null. */
export function listaNominal(id: ListaId, turmaId?: string): ListaNominal | null {
  const meta = TITULO_DA_LISTA[id]
  if (turmaId === '2b') {
    return {
      id, recorte: '2ºB', titulo: meta.titulo('2ºB'), limiar: meta.limiar, origem: meta.origem,
      alunos: MOTIVOS_2B[id].map(([nome, motivo]) => ({ nome, matricula: matriculaDe('2b', nome), turma: '2ºB', motivo })),
    }
  }
  if (turmaId || id !== 'apoia') return null
  const do1c = listaDa('1c')[7]
  const do8a = listaDa('au-8a')[12]
  const alunos: AlunoDaLista[] = [
    ...MOTIVOS_2B.apoia.map(([nome, motivo]) => ({ nome, matricula: matriculaDe('2b', nome), turma: '2ºB', motivo })),
    { nome: do1c.nome, matricula: do1c.matricula, turma: '1ºC', motivo: '7 faltas alternadas em 30 dias: 25/08, 28/08, 02/09, 04/09, 10/09, 15/09 e 18/09' },
    { nome: do8a.nome, matricula: do8a.matricula, turma: '8ºA', motivo: '5 faltas seguidas, de 14 a 18/09' },
  ].sort((a, b) => a.turma.localeCompare(b.turma, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'))
  return { id, recorte: ESCOLA.nome, titulo: meta.titulo(ESCOLA.nome), limiar: meta.limiar, origem: meta.origem, alunos }
}

/* ── Conferência (as contas fecham?) ───────────────────────────────────────────────────────────────────── */

/** Confere as somas dos três painéis. Mesmo formato de conferirNumerosEscola / conferirNumerosRede. */
export function conferirGestao(): { conta: string; esperado: string; obtido: string; ok: boolean }[] {
  const r: { conta: string; esperado: string; obtido: string; ok: boolean }[] = []
  const conf = (conta: string, esperado: number | string, obtido: number | string) =>
    r.push({ conta, esperado: String(esperado), obtido: String(obtido), ok: String(esperado) === String(obtido) })

  conf('Aurora: alunos', ESCOLA.alunos, PAINEIS.escola.totalDeAlunos)
  conf('Prefeitura: alunos', 3412, PAINEIS.prefeitura.totalDeAlunos)
  conf('Estado: alunos', 4262, PAINEIS.estado.totalDeAlunos)

  for (const p of Object.values(PAINEIS)) {
    const nome = p.nome
    const soma = p.frequencia.faixas.reduce((s, f) => s + f.alunos, 0)
    conf(`${nome}: faixas somam os alunos`, p.totalDeAlunos, soma)
    conf(`${nome}: pioraram (faixas = linhas)`, somarLinhas(p.linhas).dados.pioraram, p.frequencia.pioraram)
    conf(`${nome}: melhoraram (faixas = linhas)`, somarLinhas(p.linhas).dados.melhoraram, p.frequencia.melhoraram)
    for (const n of p.notas.itens) {
      conf(`${nome}: ${n.curto} anterior + entraram − saíram`, n.alunos, n.anterior + n.entraram - n.sairam)
      if (n.sairam < 0) conf(`${nome}: ${n.curto} saíram não negativo`, '≥ 0', n.sairam)
    }
    for (const l of p.linhas) {
      if (!l.dados) continue
      const s = FAIXAS.reduce((x, f) => x + l.dados!.faixas[f.id], 0)
      if (s !== l.alunos || l.dados.faixas['em-dia'] < 0) conf(`${nome} · ${l.nome}: faixas`, l.alunos, s)
    }
    if (p.acoes.length > 3) conf(`${nome}: no máximo 3 cartões`, 3, p.acoes.length)
    const tr = p.tendencia
    const ago = p.frequencia.faixas.find((f) => f.id === 'reprova')!
    conf(`${nome}: tendência < 75% termina no número de hoje`, ago.alunos, tr.reprova[tr.reprova.length - 1])
    conf(`${nome}: tendência < 75% em agosto = hoje − pioraram`, ago.alunos - ago.pioraram, tr.reprova[tr.reprova.length - 2])
    conf(`${nome}: tendência MAT termina no número de hoje`, p.notas.itens.find((n) => n.id === 'mat')!.alunos, tr.mat[tr.mat.length - 1])
  }

  const est = PAINEIS.estado.linhas.find((l) => l.id === 'aurora')!
  conf('Estado: a linha do Aurora = o painel da coordenação (< 75%)', PAINEIS.escola.frequencia.faixas[3].alunos, est.dados!.faixas.reprova)
  conf('Estado: a linha do Aurora = o painel da coordenação (APOIA)', TOTAL_AURORA.dados.apoia, est.dados!.apoia)
  conf('Estado: Pé-de-Meia abaixo de 80%', 63, PAINEIS.estado.peDeMeia?.abaixoDe80 ?? 0)
  conf('Estado: 1ª série 2+ componentes', 106, somarLinhas(PAINEIS.estado.linhas).dados.primeiraSerieDois ?? 0)

  const l2b = PAINEIS.escola.linhas.find((l) => l.id === '2b')!.dados!
  conf('2ºB: lista < 75% = tabela', l2b.faixas.reprova, listaNominal('reprova', '2b')!.alunos.length)
  conf('2ºB: lista APOIA = tabela', l2b.apoia, listaNominal('apoia', '2b')!.alunos.length)
  conf('2ºB: lista MAT = tabela', l2b.mat, listaNominal('mat', '2b')!.alunos.length)
  conf('Aurora: lista APOIA = cartão', PAINEIS.escola.acoes[0].numero, listaNominal('apoia')!.alunos.length)
  const nomes2b = new Set(listaDa('2b').map((n) => n.nome))
  for (const id of ['apoia', 'reprova', 'mat'] as ListaId[]) {
    for (const a of listaNominal(id, '2b')!.alunos) if (!nomes2b.has(a.nome)) conf(`2ºB: ${a.nome} está na turma`, 'sim', 'não')
  }
  return r
}
