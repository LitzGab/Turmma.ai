import { HABILIDADES, TURMAS } from './escola'

/* Os alunos de cada turma, 100% sintéticos (D71; regra 20, item 17), para a sala de aula do professor.
   O que existe sobre cada um é TRABALHO: nota das atividades que a professora aprovou, entrega, acerto por
   habilidade e presença. Não existe, nem aqui, campo sobre jeito, atenção ou comportamento (D57, D66).
   Aluno não tem foto, e-mail nem data de nascimento (regra 20, item 2): o avatar são as iniciais.
   Os números saem de um sorteio com semente fixa por turma, para a tela não mudar a cada recarga. */

export type NotaAtividade = { atividade: string; data: string; habilidade: string; valor: number | null }
export type Habilidade = { codigo: string; nome: string; curto: string; pagina: number; acerto: number }

export type Aluno = {
  id: string
  numero: number
  nome: string
  primeiro: string
  iniciais: string
  notas: NotaAtividade[]
  /** média das atividades corrigidas e aprovadas, de 0 a 10; null se ainda não há nenhuma */
  media: number | null
  faltas: number
  datasFaltas: string[]
  aulasDadas: number
  entregas: { feitas: number; total: number }
  habilidades: Habilidade[]
}

const NOMES = [
  'Ana Beatriz', 'Bruno Tavares', 'Caio Mendes', 'Daniela Rocha', 'Eduarda Lima', 'Felipe Nunes', 'Gabriela Reis', 'Heitor Alves',
  'Isabela Pinto', 'João Vitor', 'Larissa Melo', 'Lucas Pereira', 'Marina Costa', 'Nicolas Dias', 'Olívia Ramos', 'Pedro Henrique',
  'Rafael Moura', 'Sofia Martins', 'Thiago Barros', 'Valentina Cruz', 'Vitor Hugo', 'Yasmin Farias', 'Arthur Lopes', 'Beatriz Nogueira',
  'Camila Duarte', 'Davi Lucca', 'Enzo Gabriel', 'Fernanda Paz', 'Giovana Teles', 'Henrique Sá', 'Júlia Andrade', 'Kauã Ribeiro',
  'Letícia Prado', 'Miguel Antunes', 'Natália Vieira', 'Otávio Rangel', 'Paula Siqueira', 'Renan Coelho', 'Sara Bittencourt', 'Tomás Freire',
  'Alice Monteiro', 'Bernardo Pires', 'Clara Azevedo', 'Diego Fontes', 'Elisa Cardoso', 'Fábio Leal', 'Helena Queiroz', 'Igor Matos',
  'Joana Brito', 'Leonardo Assis', 'Manuela Rios', 'Noah Carvalho', 'Pietra Gomes', 'Samuel Torres', 'Tainá Borges', 'Ulisses Campos',
  'Vanessa Luz', 'Wesley Amaral', 'Lívia Sampaio', 'Murilo Dantas', 'Bianca Falcão', 'Cauê Meireles', 'Débora Pacheco', 'Eduardo Viana',
]

const CURTO: Record<string, [string, number]> = {
  EM13CNT101: ['Conservação da massa', 142], EM13CNT104: ['Mol e massa molar', 145], EM13CNT205: ['Equação balanceada', 142],
  EM13CNT301: ['Reagente limitante', 151], EM13CNT302: ['Rendimento', 151],
}

const ATIVIDADES = [
  { atividade: 'Atividade de balanceamento', data: '28/08', habilidade: 'EM13CNT205', media: 52 },
  { atividade: 'Lista 1 de proporção', data: '04/09', habilidade: 'EM13CNT101', media: 58 },
  { atividade: 'Lista de mol e massa molar', data: '17/09', habilidade: 'EM13CNT104', media: 49 },
  { atividade: 'Prova de estequiometria', data: '18/09', habilidade: 'EM13CNT301', media: 64 },
]

const DIAS_DE_AULA = ['24/08', '25/08', '31/08', '01/09', '08/09', '10/09', '14/09', '15/09', '17/09', '18/09', '21/09']
const AJUSTE: Record<string, number> = { '2b': 0, '2a': 9, '1c': 0, '9a': -4 }

/** mulberry32: sorteio repetível a partir de uma semente. */
function sorteio(semente: number) {
  let a = semente
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

const limita = (v: number, min = 5, max = 100) => Math.max(min, Math.min(max, Math.round(v)))

function montar(turmaId: string): Aluno[] {
  const turma = TURMAS.find((t) => t.id === turmaId)!
  const indice = TURMAS.findIndex((t) => t.id === turmaId)
  const r = sorteio(1000 + indice * 97)
  const semDiagnostico = turmaId === '1c'
  const d = AJUSTE[turmaId] ?? 0

  // cada turma pega uma fatia diferente da lista de nomes; a chamada é em ordem alfabética
  const nomes = [...NOMES.slice(indice * 9), ...NOMES.slice(0, indice * 9)].slice(0, turma.alunos).sort((a, b) => a.localeCompare(b, 'pt-BR'))

  return nomes.map((nome, i) => {
    const nivel = (r() + r()) / 2 // 0 a 1, concentrado no meio
    const desvio = (nivel - 0.5) * 70
    const habilidades: Habilidade[] = HABILIDADES.map((h) => ({
      codigo: h.codigo, nome: h.nome, curto: CURTO[h.codigo][0], pagina: CURTO[h.codigo][1],
      acerto: limita(h.acerto + d + desvio + (r() - 0.5) * 34),
    }))
    const notas: NotaAtividade[] = ATIVIDADES.map((a) => ({
      atividade: a.atividade, data: a.data, habilidade: a.habilidade,
      // a nota não é só o acerto: soma o que a professora considera na atividade, e por isso fica um pouco acima dele
      valor: semDiagnostico ? null : r() < 0.05 ? null : limita(a.media + 11 + d + desvio * 0.75 + (r() - 0.5) * 24, 0) / 10,
    }))
    const sorteFalta = r()
    const faltas = sorteFalta < 0.42 ? 0 : sorteFalta < 0.68 ? 1 : sorteFalta < 0.84 ? 2 : sorteFalta < 0.93 ? 3 : sorteFalta < 0.975 ? 4 : 6
    const datasFaltas = [...DIAS_DE_AULA].sort(() => r() - 0.5).slice(0, faltas).sort((a, b) => a.slice(3).localeCompare(b.slice(3)) || a.localeCompare(b))
    const sorteEntrega = r()
    const feitas = sorteEntrega < 0.72 ? 5 : sorteEntrega < 0.9 ? 4 : sorteEntrega < 0.97 ? 3 : 2
    const partes = nome.split(' ')
    const aluno: Aluno = {
      id: `${turmaId}-${i + 1}`, numero: i + 1, nome, primeiro: partes[0], iniciais: (partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase(),
      notas, media: null, faltas, datasFaltas, aulasDadas: 16, entregas: { feitas, total: 5 }, habilidades,
    }
    return ajustar(aluno, turmaId)
  }).map((a) => {
    const feitas = a.notas.filter((n) => n.valor !== null)
    return { ...a, media: feitas.length ? Math.round((feitas.reduce((s, n) => s + n.valor!, 0) / feitas.length) * 10) / 10 : null }
  })
}

/* Os alunos que já aparecem em outras telas do 2ºB precisam contar a mesma história aqui. */
function ajustar(a: Aluno, turmaId: string): Aluno {
  if (turmaId !== '2b') return a
  const hab = (codigo: string, acerto: number) => a.habilidades.map((h) => h.codigo === codigo ? { ...h, acerto } : h)
  const nota = (i: number, valor: number | null) => a.notas.map((n, j) => j === i ? { ...n, valor } : n)
  switch (a.nome) {
    case 'Ana Beatriz': return { ...a, habilidades: hab('EM13CNT104', 20), notas: [{ ...a.notas[0], valor: 7.5 }, { ...a.notas[1], valor: 7.5 }, { ...a.notas[2], valor: 2 }, { ...a.notas[3], valor: 5.5 }], entregas: { feitas: 5, total: 5 } }
    case 'Caio Mendes': return { ...a, notas: nota(3, null), entregas: { feitas: 2, total: 5 }, faltas: 5, datasFaltas: ['31/08', '08/09', '14/09', '17/09', '18/09'] }
    case 'Heitor Alves': return { ...a, habilidades: hab('EM13CNT301', 32), notas: [a.notas[0], a.notas[1], { ...a.notas[2], valor: 3.8 }, { ...a.notas[3], valor: 3.5 }], entregas: { feitas: 4, total: 5 } }
    case 'Larissa Melo': return { ...a, habilidades: hab('EM13CNT205', 35), entregas: { feitas: 5, total: 5 } }
    case 'Lucas Pereira': return { ...a, habilidades: hab('EM13CNT301', 44), entregas: { feitas: 5, total: 5 }, faltas: 1, datasFaltas: ['08/09'] }
    default: return a
  }
}

const CACHE = new Map<string, Aluno[]>()
export function alunosDa(turmaId: string): Aluno[] {
  if (!CACHE.has(turmaId)) CACHE.set(turmaId, montar(turmaId))
  return CACHE.get(turmaId)!
}

/** As habilidades em que o aluno está pior, da mais baixa para a mais alta. Só conteúdo, nunca comportamento. */
export const dificuldades = (a: Aluno, corte = 50) => [...a.habilidades].filter((h) => h.acerto < corte).sort((x, y) => x.acerto - y.acerto)
