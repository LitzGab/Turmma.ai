import { useSyncExternalStore } from 'react'
import type { FormatoArquivo } from '@/components/ui/file-card-collections'

/* CONVERSAS E PROJETOS DO PROFESSOR — o que faz o histórico da lateral ser REAL (pedido do Gabriel, 20/09/2026):
   toda conversa que começa na Home ou dentro de um projeto entra aqui, ganha título a partir do pedido, aparece no
   histórico agrupada por data e abre pelo próprio endereço (`/professor/conversa/:id`). Projeto fixado aparece na lateral.

   SÓ NO MOCKUP isto mora no navegador (memória + localStorage), para o Gabriel recarregar e o histórico continuar lá.
   No PRODUTO é estado de servidor: TanStack Query sobre a API, com escopo de escola no repository, e NADA de conversa
   em localStorage (regra 50, itens 3 e 7; regra 10). O que o produto precisa para isto existir está anotado em
   docs/pendencias-dos-mockups.md, no repositório do produto. */

export type ArquivoProjeto = { nome: string; formato: FormatoArquivo; origem: 'meu' | 'escola' | 'licenca' }

export type Projeto = {
  id: string
  nome: string
  resumo: string
  /** a turma que já vem escolhida na caixa de pedido dentro do projeto */
  turmaId: string
  instrucoes: string
  arquivos: ArquivoProjeto[]
  fixado: boolean
  criadoEm: number
}

export type Conversa = {
  id: string
  titulo: string
  pedido: string
  ferramenta: string
  turmaId: string
  projetoId?: string
  em: number
  /** conversa antiga já terminada: o que o Assistente respondeu, e o que ficou salvo na biblioteca */
  resposta?: string
  artefato?: { titulo: string; formato: FormatoArquivo }
  anexos?: string[]
}

/** O "agora" do mockup: segunda-feira, 21/09/2026, 10h42 — o mesmo do calendário e das threads. */
export const AGORA = new Date(2026, 8, 21, 10, 42).getTime()
const dia = (d: number, h = 9, m = 0) => new Date(2026, 8, d, h, m).getTime()

const PROJETOS_INICIAIS: Projeto[] = [
  { id: 'bimestre-2b', nome: '3º bimestre · 2ºB', resumo: 'Estequiometria, do balanceamento ao rendimento', turmaId: '2b', fixado: true, criadoEm: dia(1),
    instrucoes: 'Tudo aqui é para o 2ºB, 3º bimestre. Siga a ordem do capítulo 7 e retome mol antes de reagente limitante. Provas com 10 questões e gabarito.',
    arquivos: [{ nome: 'Química 2 · cap. 7.pdf', formato: 'pdf', origem: 'escola' }, { nome: 'Planejamento do bimestre.docx', formato: 'docx', origem: 'meu' }, { nome: 'Notas de aula · mol.pptx', formato: 'pptx', origem: 'meu' }, { nome: 'Cronograma.xlsx', formato: 'xlsx', origem: 'meu' }] },
  { id: 'feira', nome: 'Feira de ciências', resumo: 'Projetos do 9ºA para a feira de novembro', turmaId: '9a', fixado: true, criadoEm: dia(8),
    instrucoes: 'Projetos em grupo de quatro alunos, com material barato e seguro. Cada projeto tem pergunta, hipótese, experimento e conclusão.',
    arquivos: [{ nome: 'Regulamento da feira.pdf', formato: 'pdf', origem: 'escola' }, { nome: 'Ciências 9 · cap. 3.pdf', formato: 'pdf', origem: 'escola' }] },
  { id: 'recuperacao', nome: 'Recuperação · 2ºA', resumo: 'Retomada de mol e massa molar para quem ficou abaixo de 6', turmaId: '2a', fixado: false, criadoEm: dia(15),
    instrucoes: '', arquivos: [] },
]

const CONVERSAS_INICIAIS: Conversa[] = [
  { id: 'prova-estequiometria', titulo: 'Prova de estequiometria · 2ºB', pedido: 'monta uma prova de estequiometria pro 2ºB, dez questões', ferramenta: 'conversa', turmaId: '2b', projetoId: 'bimestre-2b', em: dia(21, 10, 38) },
  { id: 'revisao-simulado', titulo: 'Revisão para o simulado', pedido: 'me ajuda a montar uma revisão de uma aula para o simulado do 2ºA', ferramenta: 'conversa', turmaId: '2a', em: dia(21, 8, 5),
    resposta: 'Para uma aula só, eu faria três blocos de quinze minutos: balanceamento, mol e massa molar, e reagente limitante — que foi onde a turma mais errou na última lista. Em cada bloco, um exemplo resolvido no quadro e dois exercícios em dupla. Nada foi salvo na biblioteca: se quiser a lista de exercícios pronta, escolha a ferramenta Atividade.' },
  { id: 'rubrica-lavoisier', titulo: 'Rubrica da discursiva de Lavoisier', pedido: 'rubrica para a questão discursiva sobre a lei de Lavoisier, 1ºC', ferramenta: 'redacao', turmaId: '1c', em: dia(18, 15, 20),
    resposta: 'Montei a rubrica com quatro critérios — enuncia a lei, relaciona com o experimento, usa os dados, conclui — e três níveis em cada um. É só a rubrica: a correção e a nota da discursiva são suas, eu não leio nem avalio o texto do aluno.', artefato: { titulo: 'Rubrica · discursiva sobre Lavoisier', formato: 'rubrica' } },
  { id: 'lista-mol', titulo: 'Lista de mol e massa molar', pedido: 'uma lista de oito exercícios de mol e massa molar, do fácil ao difícil', ferramenta: 'atividade', turmaId: '2b', projetoId: 'bimestre-2b', em: dia(17, 9, 12),
    resposta: 'Pronto: oito exercícios do capítulo 7, começando por conversão direta de massa em mol e terminando em número de moléculas. Cada um cita a página de onde saiu.', artefato: { titulo: 'Lista de mol e massa molar', formato: 'lista' } },
  { id: 'plano-semana', titulo: 'Plano da semana · reagente limitante', pedido: 'plano de duas aulas sobre reagente limitante, com prática em dupla', ferramenta: 'plano', turmaId: '2b', projetoId: 'bimestre-2b', em: dia(14, 16, 40),
    resposta: 'Duas aulas de 50 minutos. Na primeira, retomada de proporção em mol e o conceito de reagente limitante com o exemplo do sanduíche; na segunda, prática em dupla com três problemas e fechamento no quadro.', artefato: { titulo: 'Plano da semana · reagente limitante', formato: 'plano' } },
  { id: 'adaptada-mol', titulo: 'Lista de mol · fonte ampliada', pedido: 'adapta a lista de mol para fonte ampliada e enunciado direto', ferramenta: 'adaptacao', turmaId: '2b', projetoId: 'bimestre-2b', em: dia(10, 11, 2),
    resposta: 'Preparei a versão adaptada: os mesmos oito exercícios, em corpo 18, um por bloco, com o enunciado em frases curtas. O que é cobrado não mudou. Você aprovou em 10/09, às 11h20.', artefato: { titulo: 'Lista de mol · fonte ampliada', formato: 'adaptada' } },
  { id: 'feira-ideias', titulo: 'Ideias de projeto com material barato', pedido: 'dez ideias de projeto de reações químicas para a feira, com material que os alunos têm em casa', ferramenta: 'conversa', turmaId: '9a', projetoId: 'feira', em: dia(16, 14, 30),
    resposta: 'Separei dez ideias do capítulo 3, todas com material de cozinha: indicador de repolho roxo, vulcão de bicarbonato com medição de gás, ferrugem em diferentes meios, entre outras. Para cada uma: a pergunta, o que medir e o cuidado de segurança.' },
  { id: 'reacoes-dia', titulo: 'Reações químicas do dia a dia', pedido: 'atividade de seis exercícios sobre reações do dia a dia para o 9ºA', ferramenta: 'atividade', turmaId: '9a', em: dia(9, 13, 15),
    resposta: 'Seis exercícios do capítulo 3, com situações de cozinha e de limpeza. Cada um cita a página.', artefato: { titulo: 'Reações químicas do dia a dia', formato: 'lista' } },
  { id: 'resumo-balanceamento', titulo: 'Resumo de balanceamento', pedido: 'um resumo de uma página sobre balanceamento para revisão', ferramenta: 'material', turmaId: '2a', em: dia(8, 10, 0),
    resposta: 'Uma página: o que é balancear, o método das tentativas em quatro passos, dois exemplos resolvidos e os três erros mais comuns.', artefato: { titulo: 'Resumo · balanceamento', formato: 'material' } },
]

type Estado = { projetos: Projeto[]; conversas: Conversa[] }

const CHAVE = 'turmma-mockup-conversas-v1'
const inicial = (): Estado => ({ projetos: PROJETOS_INICIAIS, conversas: CONVERSAS_INICIAIS })

function carregar(): Estado {
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return inicial()
    const lido = JSON.parse(bruto) as Estado
    return Array.isArray(lido.projetos) && Array.isArray(lido.conversas) ? lido : inicial()
  } catch { return inicial() }
}

let estado: Estado = typeof window === 'undefined' ? inicial() : carregar()
const ouvintes = new Set<() => void>()

function mudar(proximo: Estado) {
  estado = proximo
  try { window.localStorage.setItem(CHAVE, JSON.stringify(estado)) } catch { /* modo privado: fica só na memória */ }
  ouvintes.forEach((f) => f())
}

const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f) } }

export function useAcervo(): Estado {
  return useSyncExternalStore(assinar, () => estado, () => estado)
}

const novoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** O título nasce do pedido, como no ChatGPT: a primeira frase, sem ponto, com a inicial maiúscula e até 44 letras. */
export function tituloDe(pedido: string) {
  const frase = pedido.trim().split(/[.\n?!]/)[0].trim()
  const curto = frase.length > 44 ? `${frase.slice(0, 43).trimEnd()}…` : frase
  return curto.charAt(0).toUpperCase() + curto.slice(1) || 'Nova conversa'
}

export const acervo = {
  criarConversa(dados: { pedido: string; ferramenta: string; turmaId: string; projetoId?: string; anexos?: string[] }): Conversa {
    // cada conversa nova cai um minuto depois da anterior, para a ordem do histórico ficar certa
    const em = Math.max(AGORA, ...estado.conversas.map((c) => c.em)) + 60_000
    const conversa: Conversa = { id: novoId(), titulo: tituloDe(dados.pedido), em, ...dados }
    mudar({ ...estado, conversas: [conversa, ...estado.conversas] })
    return conversa
  },
  renomearConversa(id: string, titulo: string) {
    const limpo = titulo.trim()
    if (limpo) mudar({ ...estado, conversas: estado.conversas.map((c) => (c.id === id ? { ...c, titulo: limpo } : c)) })
  },
  moverConversa(id: string, projetoId?: string) {
    mudar({ ...estado, conversas: estado.conversas.map((c) => (c.id === id ? { ...c, projetoId } : c)) })
  },
  apagarConversa(id: string) {
    mudar({ ...estado, conversas: estado.conversas.filter((c) => c.id !== id) })
  },
  criarProjeto(nome: string, turmaId: string): Projeto {
    const projeto: Projeto = { id: novoId(), nome: nome.trim(), resumo: '', turmaId, instrucoes: '', arquivos: [], fixado: false, criadoEm: Math.max(AGORA, ...estado.projetos.map((p) => p.criadoEm)) + 1 }
    mudar({ ...estado, projetos: [projeto, ...estado.projetos] })
    return projeto
  },
  alternarFixado(id: string) {
    mudar({ ...estado, projetos: estado.projetos.map((p) => (p.id === id ? { ...p, fixado: !p.fixado } : p)) })
  },
  salvarInstrucoes(id: string, instrucoes: string) {
    mudar({ ...estado, projetos: estado.projetos.map((p) => (p.id === id ? { ...p, instrucoes } : p)) })
  },
  recomecar() { mudar(inicial()) },
}

/** "Hoje", "Ontem", "7 dias anteriores", "Setembro" — como o histórico do ChatGPT. */
export function grupoDe(em: number) {
  const meiaNoite = (t: number) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() }
  const dias = Math.round((meiaNoite(AGORA) - meiaNoite(em)) / 86_400_000)
  if (dias <= 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  if (dias <= 7) return '7 dias anteriores'
  const mes = new Date(em).toLocaleDateString('pt-BR', { month: 'long' })
  return mes.charAt(0).toUpperCase() + mes.slice(1)
}

export function quando(em: number) {
  const g = grupoDe(em)
  const d = new Date(em)
  if (g === 'Hoje') return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`
  if (g === 'Ontem') return 'ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
