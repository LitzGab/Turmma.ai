/* AS TAREFAS DO LUCAS (décima rodada, 04/10/2026): o que os professores passaram a ele, e só a ele.
   Uma lista para três telas: "Pra fazer" sob a caixa do Tutor (até 3), Tarefas (Pra fazer · Feitas) e a própria tarefa.
   · O prazo é texto calmo, escrito como a criança fala ("até quinta, 24/09"). O atraso diz que ainda dá (D59).
   · `ordem` é a ordem do prazo, mas o atraso não pula para o topo: nada de urgência fabricada.
   · A corrigida só existe porque a professora aprovou (regra 70): `devolutiva.aprovadoPor` e `quando` são obrigatórios.
     Na objetiva quem escreve é o Tutor; na discursiva, a professora (D55).
   · As questões vêm de `_pecas` (QUESTOES_ESTEQUIOMETRIA e QUESTOES_BALANCEAMENTO), pelo campo `banco`; a 12ª rodada
     acrescentou `questoesId`, que aponta para dados/questoes.ts (com gabarito e página).
   · O estado VIVO (o que o aluno respondeu, entregou, o que a professora aprovou e o que chegou de novo) mora em
     dados/avaliacoes.ts: `useTarefasDoAluno()` e `useTarefa(id)`. Esta lista é o começo da demonstração. */

export type TipoTarefa = 'lista' | 'prova' | 'leitura'
export type EstadoTarefa = 'pra-fazer' | 'atrasada' | 'entregue' | 'corrigida'
/** As matérias que o aluno vê (as mesmas do Tutor). */
export type MateriaAluno = 'Química' | 'Matemática' | 'História' | 'Física' | 'Biologia' | 'Português'

export type Devolutiva = { texto: string; autor: 'tutor' | 'professora'; aprovadoPor: string; quando: string }
export type Reforco = { assunto: string; pagina: number; slug: string }

export type TarefaAluno = {
  id: string
  tipo: TipoTarefa
  materia: MateriaAluno
  titulo: string
  /** o prazo em texto calmo; na entregue, quando foi entregue */
  prazo: string
  estado: EstadoTarefa
  questoes: number
  feitas: number
  ordem: number
  banco?: 'estequiometria' | 'balanceamento'
  /** o banco de questões de dados/questoes.ts (12ª rodada): 'prova-mol', 'lista-estequiometria', 'balanceamento'… */
  questoesId?: string
  /** prova: a duração */
  minutos?: number
  /** leitura: as páginas */
  paginas?: string
  /** respostas já marcadas, por questão (índice → letra) */
  respostas?: Record<number, string>
  /** o lote de notas que a professora aprova (a entregue "a professora está vendo" até lá) */
  loteId?: string
  /* só a corrigida */
  acertos?: number
  total?: number
  gabarito?: string[]
  certo?: boolean[]
  devolutiva?: Devolutiva
  reforcar?: Reforco[]
}

/* 12ª rodada (04/10/2026): a história única do plano de polimento (seção 1).
   · A Prova de estequiometria de HOJE não está aqui: ela chega pelo envio da professora (dados/envios.ts), e só
     depois de aprovada.
   · A prova de 18/09 é a "Prova de mol e massa molar": entregue, espera o lote `prova-2b`; aprovado o lote, vira
     corrigida, 7 de 10 (dados/avaliacoes.ts). */
export const TAREFAS_ALUNO: TarefaAluno[] = [
  { id: 'estequiometria', tipo: 'lista', materia: 'Química', titulo: 'Lista de estequiometria', prazo: 'até quinta, 24/09',
    estado: 'pra-fazer', questoes: 8, feitas: 2, ordem: 1, banco: 'estequiometria', questoesId: 'lista-estequiometria', respostas: { 0: 'C', 2: 'B' } },
  { id: 'leitura-cap4', tipo: 'leitura', materia: 'História', titulo: 'Leitura do capítulo 4', prazo: 'até sexta',
    estado: 'pra-fazer', questoes: 0, feitas: 0, ordem: 2, paginas: '84 a 97' },
  { id: 'reagente', tipo: 'lista', materia: 'Química', titulo: 'Lista de reagente limitante', prazo: 'era para 17/09 · ainda dá',
    estado: 'atrasada', questoes: 8, feitas: 0, ordem: 3, banco: 'estequiometria', questoesId: 'lista-estequiometria' },
  { id: 'prova-mol', tipo: 'prova', materia: 'Química', titulo: 'Prova de mol e massa molar', prazo: 'entregue em 18/09',
    estado: 'entregue', questoes: 10, feitas: 10, ordem: 4, minutos: 50, banco: 'estequiometria', questoesId: 'prova-mol', loteId: 'prova-2b',
    respostas: { 0: 'C', 1: 'B', 2: 'B', 3: 'B', 4: 'A', 5: 'A', 6: 'C', 7: 'D', 8: 'A', 9: 'B' },
    reforcar: [{ assunto: 'Massa molar', pagina: 145, slug: 'massa-molar' }] },
  { id: 'mol', tipo: 'lista', materia: 'Química', titulo: 'Lista de mol e massa molar', prazo: 'entregue em 17/09',
    estado: 'corrigida', questoes: 8, feitas: 8, ordem: 5, banco: 'estequiometria', questoesId: 'lista-estequiometria',
    respostas: { 0: 'C', 1: 'B', 2: 'A', 3: 'A', 4: 'A', 5: 'C', 6: 'A', 7: 'C' },
    gabarito: ['C', 'B', 'C', 'B', 'C', 'C', 'B', 'C'],
    certo: [true, true, false, false, false, true, false, true],
    acertos: 4, total: 8,
    devolutiva: {
      texto: 'Você acertou as contas de um passo só. Errou quando a conta tinha dois passos: primeiro passe a massa para mol, depois use a proporção da equação. Revise a página 145.',
      autor: 'tutor', aprovadoPor: 'Prof. Camila', quando: '18/09, 16h20',
    },
    reforcar: [{ assunto: 'Massa molar', pagina: 145, slug: 'massa-molar' }, { assunto: 'Reagente limitante', pagina: 151, slug: 'reagente-limitante' }] },
  // a coluna "Proporção · lista 1" do boletim do 2ºB: 6 de 8 (7,5), aprovada em 08/09
  { id: 'proporcao', tipo: 'lista', materia: 'Química', titulo: 'Lista 1 de proporção', prazo: 'entregue em 04/09',
    estado: 'corrigida', questoes: 8, feitas: 8, ordem: 6, banco: 'estequiometria', questoesId: 'lista-estequiometria',
    respostas: { 0: 'C', 1: 'B', 2: 'C', 3: 'B', 4: 'A', 5: 'C', 6: 'B', 7: 'A' },
    gabarito: ['C', 'B', 'C', 'B', 'C', 'C', 'B', 'C'],
    certo: [true, true, true, true, false, true, true, false],
    acertos: 6, total: 8,
    devolutiva: {
      texto: 'Você montou bem a proporção da equação. Errou as duas em que era preciso passar a massa para mol antes. Revise a página 145.',
      autor: 'tutor', aprovadoPor: 'Prof. Camila', quando: '08/09, 15h30',
    },
    reforcar: [{ assunto: 'Massa molar', pagina: 145, slug: 'massa-molar' }] },
  { id: 'balanceamento', tipo: 'lista', materia: 'Química', titulo: 'Atividade de balanceamento', prazo: 'entregue em 28/08',
    estado: 'corrigida', questoes: 8, feitas: 8, ordem: 7, banco: 'balanceamento', questoesId: 'balanceamento',
    respostas: { 0: 'B', 1: 'D', 2: 'C', 3: 'B', 4: 'C', 5: 'A', 6: 'D', 7: 'B' },
    gabarito: ['B', 'D', 'C', 'B', 'C', 'B', 'B', 'B'],
    certo: [true, true, true, true, true, false, false, true],
    acertos: 6, total: 8,
    devolutiva: {
      texto: 'Você balanceou todas as equações. Errou as duas de massa molar: o O₂ tem dois átomos de oxigênio. Revise a página 145 antes da próxima lista.',
      autor: 'tutor', aprovadoPor: 'Prof. Camila', quando: '31/08, 14h10',
    },
    reforcar: [{ assunto: 'Massa molar', pagina: 145, slug: 'massa-molar' }] },
]

export const tarefaDoAluno = (id: string) => TAREFAS_ALUNO.find((t) => t.id === id)

/** Pra fazer: o que ainda não foi entregue, pela ordem do prazo. */
export const TAREFAS_PRA_FAZER = TAREFAS_ALUNO.filter((t) => t.estado === 'pra-fazer' || t.estado === 'atrasada').sort((a, b) => a.ordem - b.ordem)
/** Feitas: entregues (a professora ainda está vendo) e corrigidas (já aprovadas). */
export const TAREFAS_FEITAS = TAREFAS_ALUNO.filter((t) => t.estado === 'entregue' || t.estado === 'corrigida').sort((a, b) => a.ordem - b.ordem)

/** Para onde a linha leva: a prova ainda por fazer abre em tela de foco; o resto (e a prova entregue), na tarefa. */
export const paraTarefa = (t: Pick<TarefaAluno, 'id' | 'tipo' | 'estado'>) =>
  (t.tipo === 'prova' && t.estado !== 'entregue' && t.estado !== 'corrigida' ? `/aluno/prova/${t.id}` : `/aluno/tarefas/${t.id}`)

/* COMO ESTOU INDO (Eu): só do Lucas, por assunto, com o nome do assunto no livro (não o código da BNCC).
   Conta só o que a professora já aprovou (regra 70). Sem média da turma (regra 50, item 9). */
export type DesempenhoAssunto = { nome: string; acertos: number; total: number }
export const DESEMPENHO: { materia: 'Química' | 'Matemática' | 'História'; assuntos: DesempenhoAssunto[] }[] = [
  { materia: 'Química', assuntos: [
    { nome: 'Conservação da massa', acertos: 7, total: 8 },
    { nome: 'Balanceamento', acertos: 6, total: 6 },
    { nome: 'Massa molar', acertos: 4, total: 10 },
    { nome: 'Reagente limitante', acertos: 2, total: 6 },
  ] },
  { materia: 'Matemática', assuntos: [
    { nome: 'Frações equivalentes', acertos: 5, total: 6 },
    { nome: 'Porcentagem', acertos: 4, total: 6 },
    { nome: 'Equações do 1º grau', acertos: 3, total: 5 },
  ] },
  { materia: 'História', assuntos: [
    { nome: 'Antigo Regime', acertos: 4, total: 5 },
    { nome: 'Revolução Francesa', acertos: 3, total: 5 },
  ] },
]

/** Vale revisar: até 2 assuntos, com a página do livro. */
export const VALE_REVISAR: Reforco[] = [
  { assunto: 'Massa molar', pagina: 145, slug: 'massa-molar' },
  { assunto: 'Reagente limitante', pagina: 151, slug: 'reagente-limitante' },
]
