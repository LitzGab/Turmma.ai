import { useMemo } from 'react'
import { agora, criarFatia } from './demo/nucleo'
import { fatiaSessao } from './demo/sessao-base'
import type { MateriaAluno } from './tarefas-aluno'

/* O HISTÓRICO DO ALUNO (décima rodada, 04/10/2026): as conversas do Lucas com o Tutor, no grupo "Conversas" da
   lateral, como no ChatGPT. Cada uma abre em /aluno/c/<id>.
   · `mol` é a conversa de hoje: abre a mesma abertura do Tutor.
   · `fracoes` e `revolucao` são de dias anteriores, com duas trocas curtas cada.
   As respostas do Tutor seguem a regra dele: até 3 frases, terminando numa pergunta, com a página.
   12ª rodada: as conversas NASCEM na demonstração (a primeira pergunta no Início cria a conversa e ela entra no
   histórico), cada aluno com as suas, numa fatia do estado (dados/demo/nucleo.ts). O Lucas começa com estas 4.
   · `agua` é a conversa de hoje cedo em que o Tutor errou a massa molar da água (20 g/mol; o certo é 18). É dela o
     trecho que vai com "O Tutor disse algo errado" no Avisar um adulto; quando a coordenação retira o conteúdo, a
     resposta some da conversa e fica "Esta resposta foi retirada pela escola." (`conversasAluno.retirarResposta`). */

export type TrocaAluno = {
  de: 'aluno' | 'tutor'
  texto: string
  pagina?: number
  /** a escola retirou esta resposta do Tutor (ECA Digital, arts. 29 e 30 — lei): quando. O texto já vem trocado. */
  retirada?: string
}

/** O que fica no lugar da resposta que a escola retirou. */
export const TEXTO_DA_RESPOSTA_RETIRADA = 'Esta resposta foi retirada pela escola.'

export type ConversaAluno = {
  id: string
  titulo: string
  materia: MateriaAluno
  quando: string
  /** vazio na conversa de hoje: quem abre usa a abertura do Tutor */
  trocas: TrocaAluno[]
}

export const CONVERSAS_ALUNO: ConversaAluno[] = [
  { id: 'mol', titulo: 'Mol e massa molar', materia: 'Química', quando: 'Hoje', trocas: [] },
  { id: 'agua', titulo: 'Mols em 18 g de água', materia: 'Química', quando: 'Hoje', trocas: [
    { de: 'aluno', texto: 'quantos mols tem 18 g de água?' },
    { de: 'tutor', texto: 'A massa molar da água é 20 g/mol. Então 18 g dão 0,9 mol. Quer conferir a conta na p. 145?', pagina: 145 },
  ] },
  { id: 'fracoes', titulo: 'Frações equivalentes', materia: 'Matemática', quando: 'Ontem', trocas: [
    { de: 'aluno', texto: 'como sei se 2/4 é igual a 1/2?' },
    { de: 'tutor', texto: 'Multiplique ou divida em cima e embaixo pelo mesmo número. Se 2/4 virar 1/2, são equivalentes. Por quanto você dividiria?', pagina: 62 },
    { de: 'aluno', texto: 'por 2' },
    { de: 'tutor', texto: 'Isso. Agora tente com 3/9: por quanto dá para dividir os dois?', pagina: 62 },
  ] },
  { id: 'revolucao', titulo: 'Revolução Francesa', materia: 'História', quando: '18/09', trocas: [
    { de: 'aluno', texto: 'por que começou a revolução francesa?' },
    { de: 'tutor', texto: 'O livro aponta a crise de dinheiro do reino e a fome nas cidades. O terceiro estado pagava quase todos os impostos. Qual dessas causas você acha que pesou mais?', pagina: 88 },
    { de: 'aluno', texto: 'os impostos' },
    { de: 'tutor', texto: 'Faz sentido. Na p. 89 tem a tabela de quem pagava o quê. O que chama atenção nela?', pagina: 89 },
  ] },
]

const fatia = criarFatia<Record<string, ConversaAluno[]>>('conversas-aluno', { lucas: CONVERSAS_ALUNO })

/** Uma conversa pelo id: as do aluno da sessão (inclusive as novas) e, por fim, as de sempre. */
export const conversaDoAluno = (id: string) =>
  (fatia.ler()[fatiaSessao.ler().alunoId] ?? []).find((c) => c.id === id) ?? CONVERSAS_ALUNO.find((c) => c.id === id)

/** As conversas do aluno (o da sessão, quando não passado), da mais nova para a mais velha. */
/** As conversas de um aluno, fora do React (para o arquivo do pedido de dados). */
export const conversasDoAlunoAgora = (alunoId: string): ConversaAluno[] => fatia.ler()[alunoId] ?? []

export function useConversasDoAluno(alunoId?: string): ConversaAluno[] {
  const todas = fatia.useValor()
  const s = fatiaSessao.useValor()
  return todas[alunoId ?? s.alunoId] ?? []
}

export function useConversaDoAluno(id: string | undefined): ConversaAluno | undefined {
  const lista = useConversasDoAluno()
  return useMemo(() => (id ? lista.find((c) => c.id === id) : undefined), [lista, id])
}

/** O título nasce da primeira pergunta: a primeira frase, sem ponto, com a inicial maiúscula e até 40 letras. */
function tituloDaPergunta(p: string) {
  const frase = p.trim().split(/[.\n?!]/)[0].trim()
  const curto = frase.length > 40 ? `${frase.slice(0, 39).trimEnd()}…` : frase
  return (curto.charAt(0).toUpperCase() + curto.slice(1)) || 'Nova conversa'
}

/** A resposta do Tutor que um aviso "O Tutor disse algo errado" aponta: a última fala do Tutor na conversa (a `agua`,
    no Lucas; a mais recente com fala do Tutor, nos outros alunos), com a pergunta de antes. Fora do React. */
export function respostaParaAvisar(alunoId: string, conversaId?: string): { conversaId: string; indice: number; trecho: { quem: string; texto: string }[] } | null {
  const lista = fatia.ler()[alunoId] ?? []
  const temFala = (c: ConversaAluno) => c.trocas.some((t) => t.de === 'tutor' && !t.retirada)
  const conversa = (conversaId ? lista.find((c) => c.id === conversaId && temFala(c)) : undefined)
    ?? lista.find((c) => c.id === 'agua' && temFala(c))
    ?? lista.find((c) => c.trocas.some((t) => t.de === 'tutor' && !t.retirada))
  if (!conversa) return null
  const indice = conversa.trocas.map((t) => t.de === 'tutor' && !t.retirada).lastIndexOf(true)
  const pergunta = conversa.trocas.slice(0, indice).reverse().find((t) => t.de === 'aluno')
  return {
    conversaId: conversa.id, indice,
    trecho: [...(pergunta ? [{ quem: 'Aluno', texto: pergunta.texto }] : []), { quem: 'Tutor', texto: conversa.trocas[indice].texto }],
  }
}

export const conversasAluno = {
  /** A escola retira uma resposta do Tutor (ECA Digital, arts. 29 e 30 — lei): o texto sai da conversa do aluno. */
  retirarResposta(alunoId: string, conversaId: string, indice: number, quando: string) {
    fatia.mudar((t) => ({ ...t, [alunoId]: (t[alunoId] ?? []).map((c) => (c.id !== conversaId ? c : {
      ...c, trocas: c.trocas.map((x, i) => (i === indice && x.de === 'tutor' ? { de: 'tutor', texto: TEXTO_DA_RESPOSTA_RETIRADA, retirada: quando } : x)),
    })) }))
  },
  /** A primeira pergunta cria a conversa (com a pergunta como a primeira troca). Devolve o id. */
  criar(primeiraPergunta: string, materia?: MateriaAluno): string {
    const alunoId = fatiaSessao.ler().alunoId
    const id = `c${Date.now().toString(36)}`
    const conversa: ConversaAluno = { id, titulo: tituloDaPergunta(primeiraPergunta), materia: materia ?? 'Química', quando: `Hoje, ${agora().hora}`, trocas: [{ de: 'aluno', texto: primeiraPergunta.trim() }] }
    fatia.mudar((t) => ({ ...t, [alunoId]: [conversa, ...(t[alunoId] ?? [])] }))
    return id
  },
  /** Acrescenta uma troca (do aluno ou do Tutor) a uma conversa do aluno da sessão. */
  acrescentar(id: string, troca: TrocaAluno) {
    const alunoId = fatiaSessao.ler().alunoId
    fatia.mudar((t) => ({ ...t, [alunoId]: (t[alunoId] ?? []).map((c) => (c.id === id ? { ...c, trocas: [...c.trocas, troca] } : c)) }))
  },
  /** 15ª rodada: o ⋯ da conversa (na lateral e no título) renomeia e apaga; Editar uma pergunta corta a conversa
      ali (a pergunta corrigida entra no lugar dela e o Tutor responde de novo). */
  renomear(id: string, titulo: string) {
    const limpo = titulo.trim()
    if (!limpo) return
    const alunoId = fatiaSessao.ler().alunoId
    fatia.mudar((t) => ({ ...t, [alunoId]: (t[alunoId] ?? []).map((c) => (c.id === id ? { ...c, titulo: limpo } : c)) }))
  },
  apagar(id: string) {
    const alunoId = fatiaSessao.ler().alunoId
    fatia.mudar((t) => ({ ...t, [alunoId]: (t[alunoId] ?? []).filter((c) => c.id !== id) }))
  },
  /** Fica só com as trocas antes de `indice` e acrescenta as novas. */
  cortar(id: string, indice: number, novas: TrocaAluno[] = []) {
    const alunoId = fatiaSessao.ler().alunoId
    fatia.mudar((t) => ({ ...t, [alunoId]: (t[alunoId] ?? []).map((c) => (c.id === id ? { ...c, trocas: [...c.trocas.slice(0, indice), ...novas] } : c)) }))
  },
  /** A matéria que o Tutor deduziu (ou que o aluno escolheu quando houve dúvida) fica no título. */
  definirMateria(id: string, materia: MateriaAluno) {
    const alunoId = fatiaSessao.ler().alunoId
    fatia.mudar((t) => ({ ...t, [alunoId]: (t[alunoId] ?? []).map((c) => (c.id === id ? { ...c, materia } : c)) }))
  },
}
