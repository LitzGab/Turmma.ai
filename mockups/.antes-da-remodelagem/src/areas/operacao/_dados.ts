import { ESCOLA_SLUG, ESCOLAS_DA_OPERACAO, USO_POR_ESCOLA, type EscolaDaOperacao } from '@/dados/estrutura'

/* Dados de apoio do painel da operação. O que é do produto (redes, escolas, uso de setembro) mora em
   `dados/estrutura.ts`; aqui fica só o que a tela precisa a mais: o endereço de cada escola, a validade do
   convite em aberto, o uso de agosto e o uso dia a dia de setembro. Tudo sintético e tudo AGREGADO por escola:
   a operação não alcança pessoa nenhuma (nem aluno, nem professor, nem conversa). */

/** O dia de hoje no painel da operação (a escola sintética vive em 21/09; a operação, no começo de outubro). */
export const HOJE_DA_OPERACAO = { data: new Date(2026, 9, 4), curta: '04/10/2026' }

export type Coordenacao = EscolaDaOperacao['coordenacao']
export type Tipo = EscolaDaOperacao['tipo']
export const TIPOS: Tipo[] = ['Particular', 'Municipal', 'Estadual']

export type EscolaNaTela = EscolaDaOperacao & { slug: string; detalhe?: string }
export type RedeNaTela = { id: string; nome: string; tipo: Tipo }

/** Endereço da escola: minúsculas, sem acento, palavras ligadas por hífen; sigla com ponto vira uma palavra só. */
export function paraEndereco(texto: string) {
  return texto
    .replace(/\b(\p{L})\.\s*(?=\p{L}\.)/gu, '$1') // "E. M. Vila Nova" → "EM. Vila Nova" → em-vila-nova
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

const ENDERECOS: Record<string, string> = {
  aurora: ESCOLA_SLUG,
  cachoeira: 'em-rio-cachoeira',
  pirabeiraba: 'em-pirabeiraba',
  vilanova: 'em-vila-nova',
}
const DETALHES: Record<string, string> = { pirabeiraba: 'vale até 09/10' }

export const ESCOLAS_INICIAIS: EscolaNaTela[] = ESCOLAS_DA_OPERACAO.map((e) => ({
  ...e, slug: ENDERECOS[e.id] ?? paraEndereco(e.nome), detalhe: DETALHES[e.id],
}))

export const enderecoCompleto = (slug: string) => `turmma.com/e/${slug || '…'}`

/** Data de vencimento de um convite gerado hoje (vale 7 dias). */
export function validadeDeHoje(dias = 7) {
  const d = new Date(HOJE_DA_OPERACAO.data)
  d.setDate(d.getDate() + dias)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Token do convite: 22 caracteres aleatórios (~128 bits), só no navegador. O produto guarda só o resumo dele. */
export function novoToken() {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = new Uint8Array(22)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('')
}

/* ── Uso ──────────────────────────────────────────────────────────────────────────────────────────────── */

export type UsoDaEscola = { escolaId: string; alunosAtivos: number; trocasTutor: number; geracoes: number; custoIA: number; tetoIA: number }
export type Periodo = 'setembro' | 'agosto' | 'dia'

/** Agosto: só o Colégio Aurora existia (a E. M. Rio Cachoeira nasceu em 14/09). Um pouco abaixo de setembro. */
const USO_DE_AGOSTO: UsoDaEscola[] = [
  { escolaId: 'aurora', alunosAtivos: 571, trocasTutor: 38_412, geracoes: 1_788, custoIA: 1_391.7, tetoIA: 3_060 },
]

export const USO_DO_MES: Record<'setembro' | 'agosto', UsoDaEscola[]> = {
  setembro: USO_POR_ESCOLA,
  agosto: USO_DE_AGOSTO,
}

/** Escola nascida depois do mês não aparece com número: aparece com "—" e a data em que nasceu. */
export const NASCEU_DEPOIS: Record<'setembro' | 'agosto', (criadaEm: string) => boolean> = {
  setembro: (c) => depoisDe(c, 2026, 9),
  agosto: (c) => depoisDe(c, 2026, 8),
}
function depoisDe(dataBR: string, ano: number, mes: number) {
  const [, m, a] = dataBR.split('/').map(Number)
  return a > ano || (a === ano && m > mes)
}

/* Setembro dia a dia: o total do mês de cada escola, espalhado pelos dias letivos (fim de semana e o 7 de
   setembro quase sem uso; a E. M. Rio Cachoeira só a partir do dia 15). A soma dos dias fecha com o mês. */
export type Dia = { dia: number; rotulo: string; fimDeSemana: boolean; alunosAtivos: number; trocasTutor: number; geracoes: number; custoIA: number }

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const INICIO: Record<string, number> = { cachoeira: 15 }

function pesos(escolaId: string) {
  const inicio = INICIO[escolaId] ?? 1
  return Array.from({ length: 30 }, (_, i) => {
    const dia = i + 1
    if (dia < inicio) return 0
    const sem = new Date(2026, 8, dia).getDay()
    const base = sem === 0 ? 0.06 : sem === 6 ? 0.1 : dia === 7 ? 0.08 : 1
    return base * (0.86 + 0.28 * Math.abs(Math.sin(dia * 1.7 + escolaId.length)))
  })
}

function espalhar(total: number, p: number[], casas = 0) {
  const soma = p.reduce((a, b) => a + b, 0) || 1
  const f = 10 ** casas
  const bruto = p.map((x) => (total * f * x) / soma)
  const inteiro = bruto.map(Math.floor)
  let falta = Math.round(total * f) - inteiro.reduce((a, b) => a + b, 0)
  const ordem = bruto.map((b, i) => [b - Math.floor(b), i] as const).sort((a, b) => b[0] - a[0])
  for (const [, i] of ordem) { if (falta-- <= 0) break; inteiro[i] += 1 }
  return inteiro.map((v) => v / f)
}

export function usoPorDia(escolaId: string | 'todas'): Dia[] {
  const escolas = USO_POR_ESCOLA.filter((u) => u.custoIA > 0 && (escolaId === 'todas' || u.escolaId === escolaId))
  const dias: Dia[] = Array.from({ length: 30 }, (_, i) => {
    const sem = new Date(2026, 8, i + 1).getDay()
    return {
      dia: i + 1, rotulo: `${SEMANA[sem]}, ${String(i + 1).padStart(2, '0')}/09`, fimDeSemana: sem === 0 || sem === 6,
      alunosAtivos: 0, trocasTutor: 0, geracoes: 0, custoIA: 0,
    }
  })
  for (const u of escolas) {
    const p = pesos(u.escolaId)
    const trocas = espalhar(u.trocasTutor, p)
    const geracoes = espalhar(u.geracoes, p)
    const custo = espalhar(u.custoIA, p, 2)
    p.forEach((x, i) => {
      const d = dias[i]
      d.trocasTutor += trocas[i]
      d.geracoes += geracoes[i]
      d.custoIA = Math.round((d.custoIA + custo[i]) * 100) / 100
      // alunos ativos no dia: uma parte dos ativos do mês (nunca soma: o mesmo aluno volta em vários dias)
      d.alunosAtivos += x === 0 ? 0 : Math.round(u.alunosAtivos * Math.min(0.82, x * 0.62))
    })
  }
  return dias
}
