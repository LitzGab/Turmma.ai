import { listaDa, TURMAS_DA_ESCOLA } from './estrutura'
import {
  FAIXAS, LIMIAR_DA_FREQUENCIA, LIMIAR_DAS_NOTAS, LIMIAR_DO_APOIA, listaNominal, painelDa,
  type AlunoDaLista, type FaixaId, type HabilidadeTravada, type LinhaDoPainel, type Origem,
} from './gestao'

/* O QUE SÓ A COORDENAÇÃO USA DOS PAINÉIS DE GESTÃO (06/10/2026; pesquisa/paineis-gestao/plano.md, tarefa T1).
   dados/gestao.ts é a fonte única dos números (só leitura aqui); este arquivo acrescenta o que a tela e o Analista
   da escola precisam e que não cabe lá:
   · listaDaCelula(coluna, turmaId?) → a lista com nomes por trás de uma célula da tabela ou de um cartão. A do 2ºB e
     a do APOIA da escola são as de `listaNominal` (gestao.ts); as outras turmas ganham nomes da própria lista
     (`listaDa`), na quantidade exata da célula, e um motivo em uma linha. A tela só mostra depois do MOTIVO (D34).
   · FREQUENCIA_ANTERIOR: as faixas do trimestre anterior, da escola inteira (o filtro Período).
   · HABILIDADES_POR_SERIE: onde cada série trava (alunos abaixo de 50% de acerto), para o Analista. As da escola
     (painel.habilidades) estão aqui com os mesmos números; as outras ficam abaixo de 38, o 5º lugar da escola.
   Nenhuma média: cada aluno leva o próprio número. 100% sintético. */

export type ColunaComNome = 'reprova' | 'cronica' | 'apoia' | 'lp' | 'mat'

export type ListaDaCelula = {
  /** o alvo legível na auditoria: "Lista · abaixo de 75% · 2ºB" */
  alvo: string
  titulo: string
  limiar: string
  origem: Origem
  alunos: AlunoDaLista[]
}

const painel = painelDa('escola')
const ORIGEM_DA_COLUNA = Object.fromEntries(painel.colunas.map((c) => [c.id, c.origem])) as Record<string, Origem>

const NOME_DA_COLUNA: Record<ColunaComNome, { titulo: string; curto: string; limiar: string }> = {
  reprova: { titulo: 'Abaixo de 75% de frequência', curto: 'abaixo de 75%', limiar: LIMIAR_DA_FREQUENCIA },
  cronica: { titulo: 'Falta crônica (75 a 90% de frequência)', curto: 'falta crônica', limiar: '10% ou mais de faltas no ano: ainda passa, mas aprende menos' },
  apoia: { titulo: 'No critério do APOIA, sem aviso aberto', curto: 'APOIA', limiar: LIMIAR_DO_APOIA },
  lp: { titulo: 'Abaixo de 6,0 em Língua Portuguesa', curto: 'LP abaixo de 6,0', limiar: LIMIAR_DAS_NOTAS },
  mat: { titulo: 'Abaixo de 6,0 em Matemática', curto: 'MAT abaixo de 6,0', limiar: LIMIAR_DAS_NOTAS },
}

export const ehColunaComNome = (c: string): c is ColunaComNome => c in NOME_DA_COLUNA

const linhaDa = (turmaId: string) => painel.linhas.find((l) => l.id === turmaId)
const valorDa = (l: LinhaDoPainel, c: ColunaComNome) => {
  const d = l.dados
  if (!d) return 0
  return c === 'reprova' ? d.faixas.reprova : c === 'cronica' ? d.faixas.cronica : d[c]
}

/** Um número "aleatório" fixo, a partir de um texto (a mesma turma dá sempre os mesmos nomes). */
function semente(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296 }
}

const virgula = (n: number) => n.toFixed(1).replace('.', ',')

function motivoGerado(c: ColunaComNome, r: () => number): string {
  switch (c) {
    case 'reprova': return `Frequência de ${70 + Math.floor(r() * 5)}% no ano · ${3 + Math.floor(r() * 4)} faltas em setembro`
    case 'cronica': return `Frequência de ${76 + Math.floor(r() * 13)}% no ano`
    case 'apoia': return `5 faltas seguidas, de 14 a 18/09`
    default: return `Nota ${virgula(3.5 + Math.floor(r() * 25) / 10)} no trimestre`
  }
}

/** A lista com nomes de uma célula. Sem turma: a da escola (só o APOIA tem). null quando não há ninguém. */
export function listaDaCelula(c: ColunaComNome, turmaId?: string): ListaDaCelula | null {
  const meta = NOME_DA_COLUNA[c]
  const origem = ORIGEM_DA_COLUNA[c] ?? painel.frequencia.origem
  if (!turmaId) {
    if (c !== 'apoia') return null
    const l = listaNominal('apoia')
    return l && { alvo: `Lista · APOIA · ${painel.nome}`, titulo: `${meta.titulo} · ${painel.nome}`, limiar: meta.limiar, origem, alunos: l.alunos }
  }
  const linha = linhaDa(turmaId)
  if (!linha?.dados) return null
  const n = valorDa(linha, c)
  if (n <= 0) return null
  const base = { alvo: `Lista · ${meta.curto} · ${linha.nome}`, titulo: `${meta.titulo} · ${linha.nome}`, limiar: meta.limiar, origem }

  // o 2ºB e o APOIA têm a lista pronta em gestao.ts
  if (c === 'apoia') {
    const daTurma = (turmaId === '2b' ? listaNominal('apoia', '2b') : listaNominal('apoia'))?.alunos.filter((a) => a.turma === linha.nome) ?? []
    if (daTurma.length === n) return { ...base, alunos: daTurma }
  }
  if (turmaId === '2b' && (c === 'reprova' || c === 'mat')) {
    const l = listaNominal(c, '2b')
    if (l && l.alunos.length === n) return { ...base, alunos: l.alunos }
  }

  // as outras: nomes da própria turma, sem repetir quem já está abaixo de 75% na falta crônica
  const nomes = listaDa(turmaId)
  if (nomes.length === 0) return null
  const fora = new Set(c === 'cronica' ? (listaDaCelula('reprova', turmaId)?.alunos.map((a) => a.nome) ?? []) : [])
  const r = semente(`${turmaId}:${c}`)
  const livres = nomes.filter((x) => !fora.has(x.nome))
  const escolhidos: typeof nomes = []
  while (escolhidos.length < Math.min(n, livres.length)) {
    const x = livres[Math.floor(r() * livres.length)]
    if (!escolhidos.includes(x)) escolhidos.push(x)
  }
  const alunos = escolhidos
    .map((x) => ({ nome: x.nome, matricula: x.matricula, turma: linha.nome, motivo: motivoGerado(c, r) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  return { ...base, alunos }
}

/** As turmas que passaram do limiar de uma coluna (para o cartão "sem chamada" e as respostas). */
export function turmasNaColuna(colunaId: string): { linha: LinhaDoPainel; valor: number }[] {
  const col = painel.colunas.find((c) => c.id === colunaId)
  if (!col) return []
  return painel.linhas.flatMap((l) => {
    const d = l.dados
    if (!d) return []
    const v = colunaId === 'reprova' ? d.faixas.reprova : colunaId === 'cronica' ? d.faixas.cronica : (d as unknown as Record<string, number>)[colunaId]
    const passou = col.alerta.tipo === 'contagem' ? v >= col.alerta.a : l.alunos > 0 && (v / l.alunos) * 100 >= col.alerta.pct
    return v > 0 && passou ? [{ linha: l, valor: v }] : []
  })
}

/** As faixas do trimestre anterior, da escola inteira (somam os 612). Por série não há: o filtro avisa. */
export const FREQUENCIA_ANTERIOR: Record<FaixaId, number> = { 'em-dia': 412, atencao: 125, cronica: 62, reprova: 13 }
export const conferirFrequenciaAnterior = () => FAIXAS.reduce((s, f) => s + FREQUENCIA_ANTERIOR[f.id], 0) === painel.totalDeAlunos

/* ── Onde cada série trava ─────────────────────────────────────────────────────────────────────────────── */

const ESCOLA_HAB = painel.habilidades.itens
const daEscola = (codigo: string) => ESCOLA_HAB.find((h) => h.codigo === codigo)!
const hab = (codigo: string, nome: string, serie: string, componente: string, alunos: number, de: number): HabilidadeTravada => ({ codigo, nome, serie, componente, alunos, de })

/** Por série, da habilidade com mais alunos abaixo de 50% para a com menos. O 3º EM fica de fora (um professor só). */
export const HABILIDADES_POR_SERIE: Record<string, HabilidadeTravada[]> = {
  '6º ano EF': [
    hab('EF06MA07', 'Frações equivalentes', '6º ano EF', 'Matemática', 24, 80),
    hab('EF06LP04', 'Concordância verbal', '6º ano EF', 'Língua Portuguesa', 19, 80),
  ],
  '7º ano EF': [
    hab('EF07MA04', 'Números inteiros', '7º ano EF', 'Matemática', 31, 85),
    hab('EF07CI07', 'Ecossistemas brasileiros', '7º ano EF', 'Ciências', 22, 85),
  ],
  '8º ano EF': [
    daEscola('EF08MA06'),
    hab('EF08MA08', 'Sistemas de equações', '8º ano EF', 'Matemática', 33, 86),
    hab('EF08LP03', 'Argumentação em artigo de opinião', '8º ano EF', 'Língua Portuguesa', 21, 86),
  ],
  '9º ano EF': [
    daEscola('EF09MA09'),
    hab('EF09CI02', 'Reações químicas', '9º ano EF', 'Ciências', 29, 87),
  ],
  '1º ano EM': [
    daEscola('EM13MAT302'),
    hab('EM13LGG302', 'Argumentação e ponto de vista', '1º ano EM', 'Língua Portuguesa', 34, 120),
  ],
  '2º ano EM': [
    daEscola('EM13CNT102'),
    daEscola('EM13CNT301'),
    hab('EM13MAT305', 'Logaritmos', '2º ano EM', 'Matemática', 36, 126),
  ],
}

/** "8º ano EF" → "8º ano"; "1º ano EM" → "1º ano EM" (para frases). */
export const serieCurta = (s: string) => s.replace(' EF', '')

/** O id da turma pelo nome ("2ºB" → "2b"). */
export const turmaPeloNome = (nome: string) => TURMAS_DA_ESCOLA.find((t) => t.nome === nome)?.id
