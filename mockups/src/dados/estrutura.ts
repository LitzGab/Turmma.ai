import { alunosDa, nomeGerado, type Aluno } from './alunos'
import { ESCOLAS_ESTATICAS_DA_OPERACAO, REDES as REDES_DA_OPERACAO, USO_DE_SETEMBRO } from './rede'

/* A ESTRUTURA DA ESCOLA E O CAMINHO DE ENTRADA (04/10/2026) — o que o produto real (Joaquim, A1 · `apresentacao-escola`)
   construiu e o mockup ainda não mostrava: o roteiro de montagem da escola pela coordenação, a lista de nomes de cada
   turma com prévia linha a linha, o cadastro do professor com convite de cópia única, a alocação que o professor
   confirma ou contesta, o acesso da turma (link e código com validade) e os pedidos de nome que uma pessoa aprova.
   Tudo 100% sintético (regra 20, item 17). Aluno não tem e-mail, CPF, telefone, foto nem data de nascimento: a lista
   leva só NOME e MATRÍCULA (regra 20, item 2). Os textos que o produto já usa estão aqui, para as telas falarem igual. */

export const ESCOLA_SLUG = 'colegio-aurora'
/** Onde o aluno digita o código da turma (o produto real: `/e/<slug>/turma`). */
export const ENDERECO_DA_TURMA = `turmma.com/e/${ESCOLA_SLUG}/turma`
/** A entrada da escola para o aluno já aprovado: escola + matrícula + senha (D48). */
export const ENDERECO_DA_ESCOLA = `turmma.com/e/${ESCOLA_SLUG}`

/* ── Ano letivo, séries e disciplinas ──────────────────────────────────────────────────────────────────── */

export type SituacaoDoAno = 'planejado' | 'em_curso' | 'encerrado'
export const SITUACAO_DO_ANO: Record<SituacaoDoAno, string> = { planejado: 'Planejado', em_curso: 'Em curso', encerrado: 'Encerrado' }
export const ANOS_LETIVOS: { ano: number; situacao: SituacaoDoAno; inicio: string; fim: string }[] = [
  { ano: 2027, situacao: 'planejado', inicio: '01/02/2027', fim: '10/12/2027' },
  { ano: 2026, situacao: 'em_curso', inicio: '02/02/2026', fim: '11/12/2026' },
  { ano: 2025, situacao: 'encerrado', inicio: '03/02/2025', fim: '12/12/2025' },
]

export const SERIES = ['6º ano EF', '7º ano EF', '8º ano EF', '9º ano EF', '1º ano EM', '2º ano EM', '3º ano EM']
export const DISCIPLINAS = ['Matemática', 'Português', 'Ciências', 'Química', 'Física', 'Biologia', 'História', 'Geografia', 'Inglês', 'Arte', 'Educação Física']

/* ── As turmas do ano em curso (Colégio Aurora) ────────────────────────────────────────────────────────── */

export type TurmaDaEscola = {
  id: string
  nome: string
  serie: string
  turno: 'Manhã' | 'Tarde'
  /** nomes na lista que a coordenação subiu */
  nomes: number
  /** pedidos de nome esperando a decisão do professor ou da coordenação */
  pedidos: number
  /** nomes livres: ninguém pediu ainda */
  livres: number
  /** quando a lista subiu; vazio = a lista ainda não subiu */
  listaEm?: string
}

/* 22 turmas, 684 nomes nas listas. O 2ºB, o 2ºA e o 1ºC são as turmas da professora Camila (mesmos ids de
   dados/escola.ts, para a lista mostrar os mesmos alunos). O 3ºA acabou de ser criado: está sem lista e com a
   alocação da Camila esperando ela confirmar — é a turma da demonstração "do zero ao primeiro aluno". */
export const TURMAS_DA_ESCOLA: TurmaDaEscola[] = [
  { id: 'au-6a', nome: '6ºA', serie: '6º ano EF', turno: 'Tarde', nomes: 33, pedidos: 0, livres: 1, listaEm: '02/02' },
  { id: 'au-6b', nome: '6ºB', serie: '6º ano EF', turno: 'Tarde', nomes: 30, pedidos: 2, livres: 3, listaEm: '02/02' },
  { id: 'au-6c', nome: '6ºC', serie: '6º ano EF', turno: 'Tarde', nomes: 31, pedidos: 0, livres: 0, listaEm: '02/02' },
  { id: 'au-7a', nome: '7ºA', serie: '7º ano EF', turno: 'Tarde', nomes: 33, pedidos: 0, livres: 2, listaEm: '02/02' },
  { id: 'au-7b', nome: '7ºB', serie: '7º ano EF', turno: 'Tarde', nomes: 33, pedidos: 0, livres: 2, listaEm: '02/02' },
  { id: 'au-7c', nome: '7ºC', serie: '7º ano EF', turno: 'Tarde', nomes: 32, pedidos: 0, livres: 0, listaEm: '03/02' },
  { id: 'au-8a', nome: '8ºA', serie: '8º ano EF', turno: 'Tarde', nomes: 34, pedidos: 0, livres: 1, listaEm: '02/02' },
  { id: 'au-8b', nome: '8ºB', serie: '8º ano EF', turno: 'Tarde', nomes: 33, pedidos: 0, livres: 0, listaEm: '02/02' },
  { id: 'au-8c', nome: '8ºC', serie: '8º ano EF', turno: 'Tarde', nomes: 32, pedidos: 0, livres: 2, listaEm: '03/02' },
  { id: 'au-9a', nome: '9ºA', serie: '9º ano EF', turno: 'Manhã', nomes: 34, pedidos: 0, livres: 0, listaEm: '02/02' },
  { id: 'au-9b', nome: '9ºB', serie: '9º ano EF', turno: 'Manhã', nomes: 33, pedidos: 0, livres: 1, listaEm: '02/02' },
  { id: 'au-9c', nome: '9ºC', serie: '9º ano EF', turno: 'Manhã', nomes: 33, pedidos: 0, livres: 0, listaEm: '02/02' },
  { id: 'au-1a', nome: '1ºA', serie: '1º ano EM', turno: 'Manhã', nomes: 34, pedidos: 0, livres: 1, listaEm: '02/02' },
  { id: 'au-1b', nome: '1ºB', serie: '1º ano EM', turno: 'Manhã', nomes: 34, pedidos: 0, livres: 0, listaEm: '02/02' },
  { id: '1c', nome: '1ºC', serie: '1º ano EM', turno: 'Manhã', nomes: 34, pedidos: 2, livres: 4, listaEm: '02/02' },
  { id: 'au-1d', nome: '1ºD', serie: '1º ano EM', turno: 'Manhã', nomes: 32, pedidos: 0, livres: 0, listaEm: '04/02' },
  { id: '2a', nome: '2ºA', serie: '2º ano EM', turno: 'Manhã', nomes: 30, pedidos: 1, livres: 0, listaEm: '02/02' },
  { id: '2b', nome: '2ºB', serie: '2º ano EM', turno: 'Manhã', nomes: 32, pedidos: 3, livres: 3, listaEm: '02/02' },
  { id: 'au-2c', nome: '2ºC', serie: '2º ano EM', turno: 'Manhã', nomes: 33, pedidos: 0, livres: 1, listaEm: '02/02' },
  { id: 'au-2d', nome: '2ºD', serie: '2º ano EM', turno: 'Manhã', nomes: 31, pedidos: 0, livres: 0, listaEm: '04/02' },
  { id: 'au-3a', nome: '3ºA', serie: '3º ano EM', turno: 'Manhã', nomes: 0, pedidos: 0, livres: 0 },
  { id: 'au-3b', nome: '3ºB', serie: '3º ano EM', turno: 'Manhã', nomes: 33, pedidos: 0, livres: 2, listaEm: '02/02' },
]
export const turmaDaEscola = (id: string) => TURMAS_DA_ESCOLA.find((t) => t.id === id)
export const NOMES_NAS_LISTAS = TURMAS_DA_ESCOLA.reduce((s, t) => s + t.nomes, 0)
export const PEDIDOS_ABERTOS = TURMAS_DA_ESCOLA.reduce((s, t) => s + t.pedidos, 0)

/* ── O roteiro da montagem (o produto real abre a Estrutura com ele) ───────────────────────────────────── */

export const ROTEIRO = [
  { id: 'ano', titulo: 'Ano letivo', texto: 'Crie o ano letivo e abra: as turmas nascem no ano em curso.' },
  { id: 'series', titulo: 'Séries', texto: 'Do 6º ao 9º ano e do 1º ao 3º do Ensino Médio.' },
  { id: 'disciplinas', titulo: 'Disciplinas', texto: 'As que os professores dão.' },
  { id: 'turmas', titulo: 'Turmas', texto: 'Cada turma numa série do ano em curso.' },
  { id: 'listas', titulo: 'Lista de nomes', texto: 'Abra cada turma e cole a lista ou envie o arquivo, com nome e matrícula.' },
  { id: 'professores', titulo: 'Professores', texto: 'Cadastre cada professor com o e-mail dele e mande o convite.' },
  { id: 'alocacao', titulo: 'Alocação', texto: 'Ligue cada professor à turma e à disciplina. Ele confirma pelo convite.' },
] as const

/* ── Professores e convites ────────────────────────────────────────────────────────────────────────────── */

export type EstadoDoProfessor = 'pendente' | 'vencido' | 'revogado' | 'aceito' | 'ativo' | 'desativado'
export const TEXTO_DO_ESTADO_DO_PROFESSOR: Record<EstadoDoProfessor, string> = {
  pendente: 'Convite em aberto, ainda não aceito.',
  vencido: 'Convite vencido. Refaça o convite para gerar um link novo.',
  revogado: 'Convite revogado. Para convidar de novo, cadastre o mesmo e-mail.',
  aceito: 'Convite aceito.',
  ativo: 'Ativo.',
  desativado: 'Desativado. Para convidar de novo, cadastre o mesmo e-mail.',
}
export type ProfessorDaEscola = { id: string; nome: string; estado: EstadoDoProfessor; disciplinas: string; quando: string }
/* A lista mostra só o nome: o e-mail é dado da conta, e a tela não o traz (o produto real faz assim). */
export const PROFESSORES: ProfessorDaEscola[] = [
  { id: 'p-camila', nome: 'Camila Souza', estado: 'ativo', disciplinas: 'Química', quando: 'entrou em 02/02' },
  { id: 'p-rafael', nome: 'Rafael Antunes', estado: 'ativo', disciplinas: 'Física', quando: 'entrou em 03/02' },
  { id: 'p-paulo', nome: 'Paulo Ribeiro', estado: 'ativo', disciplinas: 'Português', quando: 'entrou em 03/02' },
  { id: 'p-silvia', nome: 'Sílvia Moraes', estado: 'aceito', disciplinas: 'Biologia', quando: 'aceitou em 16/09' },
  { id: 'p-marta', nome: 'Marta Figueiredo', estado: 'pendente', disciplinas: 'Matemática', quando: 'vale até 25/09' },
  { id: 'p-jonas', nome: 'Jonas Barreto', estado: 'vencido', disciplinas: 'História', quando: 'venceu em 17/09 sem uso' },
  { id: 'p-renata', nome: 'Renata Lopes', estado: 'revogado', disciplinas: 'Inglês', quando: 'revogado em 15/09' },
]
export const TOTAL_DE_PROFESSORES = 31
export const VALIDADE_DO_CONVITE_DIAS = 7
export const TEXTO_DA_VALIDADE_DO_CONVITE = `O convite vale ${VALIDADE_DO_CONVITE_DIAS} dias e entra uma vez só.`
export const TEXTO_DO_LINK_UMA_VEZ = 'O link aparece uma vez, logo depois de gerar. Copie e mande à pessoa antes de fechar.'

/* ── Alocação: professor × turma × disciplina. Nasce pendente; o professor confirma ou contesta (D3) ────── */

export type EstadoDoVinculo = 'pendente' | 'confirmado' | 'contestado' | 'encerrado'
export const TEXTO_DO_VINCULO: Record<EstadoDoVinculo, string> = {
  pendente: 'Esperando o professor confirmar',
  confirmado: 'Confirmado pelo professor',
  contestado: 'Contestado pelo professor',
  encerrado: 'Encerrado',
}
export type Contestacao = 'nao_leciono' | 'turma_errada' | 'disciplina_errada' | 'outro'
export const NOME_DA_CONTESTACAO: Record<Contestacao, string> = {
  nao_leciono: 'Não dou aula nesta turma',
  turma_errada: 'A turma está errada',
  disciplina_errada: 'A disciplina está errada',
  outro: 'Outro motivo',
}
export const AVISO_DO_COMPLEMENTO = 'Não escreva nome de aluno aqui.'
export const EFEITO_DA_CONTESTACAO = 'A coordenação recebe a contestação e corrige a alocação. Até lá, a turma não abre para você.'

export type Alocacao = {
  id: string
  /** o id do professor em PROFESSORES (12ª rodada) */
  professorId?: string
  professor: string
  turmaId: string
  turma: string
  disciplina: string
  estado: EstadoDoVinculo
  quando: string
  contestacao?: { motivo: Contestacao; complemento?: string }
}
export const ALOCACOES: Alocacao[] = [
  { id: 'v1', professorId: 'p-camila', professor: 'Camila Souza', turmaId: '2b', turma: '2ºB', disciplina: 'Química', estado: 'confirmado', quando: 'confirmou em 02/02' },
  { id: 'v2', professorId: 'p-camila', professor: 'Camila Souza', turmaId: '2a', turma: '2ºA', disciplina: 'Química', estado: 'confirmado', quando: 'confirmou em 02/02' },
  { id: 'v3', professorId: 'p-camila', professor: 'Camila Souza', turmaId: '1c', turma: '1ºC', disciplina: 'Química', estado: 'confirmado', quando: 'confirmou em 02/02' },
  { id: 'v4', professorId: 'p-camila', professor: 'Camila Souza', turmaId: 'au-3a', turma: '3ºA', disciplina: 'Química', estado: 'pendente', quando: 'alocada em 19/09' },
  { id: 'v5', professorId: 'p-rafael', professor: 'Rafael Antunes', turmaId: '2b', turma: '2ºB', disciplina: 'Física', estado: 'confirmado', quando: 'confirmou em 03/02' },
  { id: 'v6', professorId: 'p-paulo', professor: 'Paulo Ribeiro', turmaId: 'au-8b', turma: '8ºB', disciplina: 'Português', estado: 'contestado', quando: 'avisou em 18/09',
    contestacao: { motivo: 'turma_errada', complemento: 'Dou Português no 8ºC, não no 8ºB.' } },
  { id: 'v7', professorId: 'p-silvia', professor: 'Sílvia Moraes', turmaId: '1c', turma: '1ºC', disciplina: 'Biologia', estado: 'pendente', quando: 'alocada em 16/09' },
  { id: 'v8', professorId: 'p-marta', professor: 'Marta Figueiredo', turmaId: '1c', turma: '1ºC', disciplina: 'Matemática', estado: 'pendente', quando: 'alocada em 18/09 · convite em aberto' },
  { id: 'v9', professorId: 'p-jonas', professor: 'Jonas Barreto', turmaId: 'au-6a', turma: '6ºA', disciplina: 'História', estado: 'pendente', quando: 'alocado em 10/09 · convite vencido' },
  { id: 'v10', professorId: 'p-renata', professor: 'Renata Lopes', turmaId: 'au-9a', turma: '9ºA', disciplina: 'Inglês', estado: 'encerrado', quando: 'encerrado em 15/09' },
]

/* ── A lista de nomes de uma turma, com o estado de cada nome ─────────────────────────────────────────── */

export type EstadoDoNome = 'livre' | 'reivindicado' | 'aprovado'
export const TEXTO_DO_NOME: Record<EstadoDoNome, string> = {
  livre: 'Livre: esperando o aluno pedir o nome',
  reivindicado: 'O aluno pediu o nome: esperando a decisão',
  aprovado: 'Aprovado',
}
export type NomeDaLista = { id: string; nome: string; matricula: string; estado: EstadoDoNome }
export type PedidoDeNome = { id: string; nome: string; quando: string; matriculaErrada: boolean }

/* Quem pediu o nome, quem ainda não pediu. No 2ºB, os três pedidos são os mesmos do diálogo do acesso da turma;
   o Lucas Pereira (o aluno da demonstração) já está aprovado. */
const NO_2B = {
  pedidos: [['Júlia Andrade', 'hoje, 10h38', false], ['Enzo Gabriel', 'hoje, 10h21', true], ['Henrique Sá', 'ontem, 19h12', false]] as const,
  livres: ['Fernanda Paz', 'Giovana Teles', 'Kauã Ribeiro'],
}

const matriculaDe = (turmaId: string, numero: number) => {
  const base = { '2b': 430, '2a': 300, '1c': 100 }[turmaId] ?? 0
  return `2026-0${String(base + numero).padStart(3, '0')}`
}

/** A lista de nomes da turma, em ordem de chamada. O 2ºB, o 2ºA e o 1ºC usam os alunos sintéticos das telas do
    professor (os mesmos nomes da sala e da tabela de alunos); as outras turmas tiram nomes do mesmo banco sintético,
    com sorteio fixo. O 3ºA está vazio: a lista ainda não subiu. */
export function listaDa(turmaId: string): NomeDaLista[] {
  const turma = turmaDaEscola(turmaId)
  if (!turma || turma.nomes === 0) return []
  const doProfessor = ['2b', '2a', '1c'].includes(turmaId)
  const indice = TURMAS_DA_ESCOLA.indexOf(turma)
  // cada turma tem os seus nomes: nenhum aluno aparece em duas turmas (o banco gerado começa depois dos das turmas do professor)
  const inicio = 120 + TURMAS_DA_ESCOLA.slice(0, indice).filter((t) => !['2b', '2a', '1c'].includes(t.id)).reduce((s, t) => s + t.nomes, 0)
  const nomes = doProfessor
    ? alunosDa(turmaId).map((a: Aluno) => a.nome)
    : Array.from({ length: turma.nomes }, (_, i) => nomeGerado(inicio + i)).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const pedidos = turmaId === '2b' ? NO_2B.pedidos.map((p) => p[0] as string) : nomes.slice(-turma.pedidos || nomes.length)
  const livres = turmaId === '2b' ? NO_2B.livres : nomes.slice(3, 3 + turma.livres)
  return nomes.map((nome, i) => ({
    id: `${turmaId}-${i + 1}`,
    nome,
    matricula: nome === 'Lucas Pereira' ? '2026-0412' : matriculaDe(turmaId, doProfessor ? i + 1 : i + 1 + indice * 40),
    estado: turma.pedidos > 0 && pedidos.includes(nome) ? 'reivindicado' : livres.includes(nome) ? 'livre' : 'aprovado',
  }))
}

export function pedidosDa(turmaId: string): PedidoDeNome[] {
  if (turmaId === '2b') return NO_2B.pedidos.map(([nome, quando, errada], i) => ({ id: `ped-${i}`, nome, quando, matriculaErrada: errada }))
  return listaDa(turmaId).filter((n) => n.estado === 'reivindicado').map((n, i) => ({ id: `ped-${turmaId}-${i}`, nome: n.nome, quando: i === 0 ? 'hoje, 7h48' : 'há 12 min', matriculaErrada: false }))
}
/** Os nomes que o aluno vê na página pública da turma: só os livres, sem matrícula (o produto real faz assim). */
export const nomesLivresDa = (turmaId: string) => listaDa(turmaId).filter((n) => n.estado === 'livre').map((n) => ({ id: n.id, nome: n.nome }))

/* Textos dos pedidos, como o produto fala. */
export const MAXIMO_DE_PEDIDOS_POR_DECISAO = 40
export const TEXTO_DA_MATRICULA_ERRADA = 'Houve tentativa com matrícula errada neste nome; pode ter sido erro de digitação'
export const TEXTO_DE_COMO_DECIDIR = `Marque os pedidos que você conferiu para aprovar ou recusar, até ${MAXIMO_DE_PEDIDOS_POR_DECISAO} por vez. Cada nome é conferido: não há como aprovar todos de uma vez.`
export const EFEITO_DA_DECISAO = {
  aprovar: 'Cada pedido aprovado vira a conta do aluno: ele passa a entrar no Turmma com a matrícula da lista e a senha que criou, já nesta turma. Confira se cada nome é mesmo de um aluno da turma antes de aprovar.',
  recusar: 'Cada pedido recusado é fechado, e o nome volta à lista da turma, livre para ser pedido de novo. A senha criada no pedido é apagada.',
} as const
export const TEXTO_DA_AUDITORIA_DA_DECISAO = 'Esta decisão fica registrada na auditoria, em seu nome, como decisão da coordenação.'
export const TEXTO_DA_AUDITORIA_DA_LEITURA = 'Cada consulta aos pedidos fica registrada na auditoria, em seu nome. Por isso a lista só é lida quando você clica em Atualizar.'

/* ── A colagem da lista: a prévia aponta o erro linha a linha e só grava a lista limpa ───────────────── */

export type ResultadoDaLinha = 'entra' | 'ja_existe' | 'erro'
export const TEXTO_DO_ERRO_DA_LINHA = {
  sem_nome: 'Falta o nome.',
  sem_matricula: 'Falta a matrícula.',
  matricula_parece_documento: 'Parece CPF ou data de nascimento, e não matrícula: confira esta linha.',
  matricula_repetida: 'Esta matrícula aparece em mais de uma linha do texto.',
  matricula_em_uso: 'Esta matrícula já é de um aluno da escola ou está na lista de outra turma.',
} as const
export const TEXTO_DO_RESULTADO = { entra: 'Entra na lista.', ja_existe: 'Já está na lista desta turma, por esta matrícula: nada muda.' } as const

/** O texto que a coordenadora "cola" no 3ºA na demonstração: 34 linhas, duas com erro (um CPF no lugar da
    matrícula e uma matrícula repetida). Corrigindo as duas, a lista grava limpa. */
export const COLAGEM_DE_EXEMPLO = [
  'Alice Monteiro; 2026-0801', 'Bernardo Pires; 2026-0802', 'Clara Azevedo; 2026-0803', 'Diego Fontes; 2026-0804',
  'Elisa Cardoso; 123.456.789-09', 'Fábio Leal; 2026-0806', 'Helena Queiroz; 2026-0807', 'Igor Matos; 2026-0808',
  'Joana Brito; 2026-0809', 'Leonardo Assis; 2026-0810', 'Manuela Rios; 2026-0811', 'Noah Carvalho; 2026-0812',
  'Pietra Gomes; 2026-0813', 'Samuel Torres; 2026-0814', 'Tainá Borges; 2026-0815', 'Ulisses Campos; 2026-0816',
  'Vanessa Luz; 2026-0817', 'Wesley Amaral; 2026-0818', 'Lívia Sampaio; 2026-0819', 'Murilo Dantas; 2026-0820',
  'Bianca Falcão; 2026-0821', 'Cauê Meireles; 2026-0822', 'Débora Pacheco; 2026-0823', 'Eduardo Viana; 2026-0824',
  'Isaac Esteves; 2026-0825', 'Isadora Fernandes; 2026-0826', 'Joaquim Figueiredo; 2026-0827', 'Kevin Godoy; 2026-0828',
  'Laura Guimarães; 2026-0829', 'Lorena Hoffmann; 2026-0829', 'Luan Jardim; 2026-0831', 'Luiza Klein; 2026-0832',
  'Mateus Krüger; 2026-0833', 'Melissa Lacerda; 2026-0834',
].join('\n')

/* ── O acesso da turma: link da sala e código, com validade, que "Gerar novo" derruba na hora ─────────── */

export const VALIDADES_DO_ACESSO = [1, 7, 30] as const
export type ValidadeDoAcesso = (typeof VALIDADES_DO_ACESSO)[number]
export const rotuloDaValidade = (dias: ValidadeDoAcesso) => (dias === 1 ? '1 dia' : `${dias} dias`)
/** O código tem 8 letras e números, sem os que se confundem (0/O, 1/I), e aparece em dois grupos de 4. */
export const CODIGO_DO_2B = 'K7M2QX9B'
export const codigoEmDoisGrupos = (codigo: string) => `${codigo.slice(0, 4)} ${codigo.slice(4)}`
export const TEXTO_DO_ACESSO_NOVO = 'O link da sala e o código da turma levam os alunos à lista de nomes desta turma, onde cada um pede o próprio nome. Quem aprova é você.'
export const TEXTO_DO_ACESSO_QUE_CAI = 'O link e o código de agora deixam de valer na hora, também se quem gerou foi outro professor da turma. Os nomes que ficaram travados por tentativas com a matrícula errada destravam.'
export const TEXTO_DE_QUEM_VE_A_LISTA = 'Quem tem o link ou o código vê os nomes da lista que ainda estão livres: mande só para a turma. Pelo WhatsApp vão o nome da escola e o link, nunca nome de aluno.'
export const TEXTO_DO_REVOGAR = 'O link da sala e o código da turma deixam de valer na hora: quem ainda não pediu o nome não entra mais por eles. Os pedidos já feitos continuam esperando a decisão.'
export const textoDoWhatsApp = (escola: string, link: string) =>
  `${escola} no Turmma.\nAbra o link, escolha o seu nome na lista da turma, informe a sua matrícula e crie a sua senha:\n${link}`

/* ── A página pública da turma (o que o aluno vê) ─────────────────────────────────────────────────────── */

export const TEXTO_DO_PEDIDO_ENVIADO = {
  agora: 'Agora o seu pedido espera o professor. Quem aprova ou recusa é uma pessoa: o professor da turma ou a coordenação.',
  recusa: 'Se o pedido for recusado, o seu nome volta para a lista, e você pode pedir de novo.',
}

/* ── O painel da operação Turmma (D76): cria rede e escola, convida a coordenação, acompanha uso e custo,
      SEM ver dado de pessoa (nem nome de aluno, nem de professor, nem conversa) ───────────────────────────── */

export type EscolaDaOperacao = {
  id: string
  nome: string
  rede: string
  tipo: 'Particular' | 'Municipal' | 'Estadual'
  cidade: string
  coordenacao: 'ativa' | 'convite em aberto' | 'convite vencido' | 'sem convite'
  criadaEm: string
  alunos: number
}
/* 12ª rodada: a operação e a rede leem a MESMA lista (dados/rede.ts). Estes exports continuam, derivados de lá. */
export const REDES = REDES_DA_OPERACAO.map((r) => ({ id: r.id, nome: r.nome, tipo: r.tipo, escolas: r.escolas }))
export const ESCOLAS_DA_OPERACAO: EscolaDaOperacao[] = ESCOLAS_ESTATICAS_DA_OPERACAO.map((e) => ({
  id: e.id, nome: e.nome, rede: e.rede, tipo: e.tipo, cidade: e.cidade, coordenacao: e.coordenacao, criadaEm: e.criadaEm, alunos: e.alunos,
}))
/** Uso de setembro, por escola. Só número agregado: a operação não alcança pessoa nenhuma. */
export const USO_POR_ESCOLA = ESCOLAS_ESTATICAS_DA_OPERACAO.map((e) => ({
  escolaId: e.id, ...(USO_DE_SETEMBRO[e.id] ?? { alunosAtivos: 0, trocasTutor: 0, geracoes: 0, custoIA: 0, tetoIA: 0 }),
}))
