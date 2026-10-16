/* AS PROVAS E AS LISTAS, COM GABARITO E PÁGINA (12ª rodada, 04/10/2026).

   Uma fonte só para o aluno responder, para o Assistente corrigir (o lote de notas) e para o resultado que o aluno vê.
   Copiadas, sem mudar uma palavra, de `dados/biblioteca.ts` (QUESTOES_PROVA, a prova que a Camila aprova hoje) e de
   `areas/aluno/_pecas.tsx` (as listas). Os gabaritos das listas são os de `dados/tarefas-aluno.ts`.

   · PROVA_ESTEQUIOMETRIA: a prova de HOJE (10 questões). O gabarito sai da resposta certa de cada questão
     (`cbcbcbcbcb`); a sequência `cbcbcaadab` é o gabarito da prova de 18/09 (a de mol e massa molar, abaixo), que é a
     do lote de 26 notas que espera a professora — por isso as duas não batem.
   · PROVA_MOL: a prova de 18/09, "Prova de mol e massa molar". A questão 7 tem o gabarito CADASTRADO como a, e 24 dos
     26 alunos marcaram c (a certa: 46 g de sódio são 2 mol, e dão 117 g de NaCl). É o destaque "nota no limite, por
     causa da questão 7": quem decide trocar o gabarito é a professora.
   · LISTA_ESTEQUIOMETRIA e BALANCEAMENTO: 8 questões cada.
   · REVISAO_MASSA_MOL: a revisão sob medida do sinal do Tutor (8 questões, só massa ↔ mol, p. 145).
   Letras em maiúscula (A a D), como as respostas guardadas. */

export type QuestaoObjetiva = {
  enunciado: string
  alternativas: string[]
  /** o índice da alternativa certa (0 = A) */
  certa: number
  /** a página do material da escola */
  pagina: number
  /** na versão adaptada: o enunciado em frases curtas, a pergunta à parte e os dados embaixo */
  adaptada?: { x: string; pergunta: string; dados?: string }
}

export type BancoDeQuestoes = {
  id: string
  titulo: string
  questoes: QuestaoObjetiva[]
  /** o gabarito em letras maiúsculas, uma por questão ("CBCB…") */
  gabarito: string
}

export const LETRAS = 'ABCDE'
const gabaritoDe = (q: QuestaoObjetiva[]) => q.map((x) => LETRAS[x.certa]).join('')

/* ── A prova de hoje (dados/biblioteca.ts, QUESTOES_PROVA) ─────────────────────────────────────────────── */

const ALT_ESTEQ = [
  ['44 g', '66 g', '88 g', '24 g'],
  ['2 mol', '4 mol', '6 mol', '9 mol'],
  ['18 g', '36 g', '72 g', '144 g'],
  ['O alumínio', 'O cloro', 'Nenhum: a proporção é exata', 'O cloreto de alumínio'],
  ['125%', '90%', '80%', '40%'],
]

const QUESTOES_HOJE: QuestaoObjetiva[] = [
  { enunciado: 'Qual a massa de CO₂ formada na queima completa de 24 g de carbono? (C = 12; O = 16)', pagina: 142, alternativas: ALT_ESTEQ[0], certa: 2,
    adaptada: { x: 'Queimamos 24 g de carbono.\nTodo o carbono vira CO₂.', pergunta: 'Qual é a massa de CO₂ formada?', dados: 'C = 12; O = 16' } },
  { enunciado: 'Na reação N₂ + 3 H₂ → 2 NH₃, quantos mols de amônia se formam a partir de 6 mol de H₂?', pagina: 142, alternativas: ALT_ESTEQ[1], certa: 1,
    adaptada: { x: 'A reação é N₂ + 3 H₂ → 2 NH₃.\nTemos 6 mol de H₂.', pergunta: 'Quantos mols de NH₃ se formam?' } },
  { enunciado: 'Calcule a massa de água produzida na combustão de 8 g de gás hidrogênio. (H = 1; O = 16)', pagina: 145, alternativas: ALT_ESTEQ[2], certa: 2,
    adaptada: { x: 'Queimamos 8 g de gás hidrogênio.\nO produto é água.', pergunta: 'Qual é a massa de água formada?', dados: 'H = 1; O = 16' } },
  { enunciado: 'Em 2 Al + 3 Cl₂ → 2 AlCl₃, com 54 g de Al e 71 g de Cl₂, qual é o reagente limitante? (Al = 27; Cl = 35,5)', pagina: 151, alternativas: ALT_ESTEQ[3], certa: 1,
    adaptada: { x: 'A reação é 2 Al + 3 Cl₂ → 2 AlCl₃.\nTemos 54 g de Al e 71 g de Cl₂.', pergunta: 'Qual reagente acaba primeiro?', dados: 'Al = 27; Cl = 35,5' } },
  { enunciado: 'Uma reação com rendimento teórico de 50 g produziu 40 g. Qual foi o rendimento percentual?', pagina: 151, alternativas: ALT_ESTEQ[4], certa: 2,
    adaptada: { x: 'A conta prevê 50 g de produto.\nNa prática, saíram 40 g.', pergunta: 'Qual foi o rendimento, em porcentagem?' } },
  { enunciado: 'Quantos mols de moléculas há em 88 g de gás carbônico? (C = 12; O = 16)', pagina: 145, alternativas: ['1 mol', '2 mol', '4 mol', '44 mol'], certa: 1,
    adaptada: { x: 'Temos 88 g de CO₂.', pergunta: 'Quantos mols são?', dados: 'C = 12; O = 16' } },
  { enunciado: 'Na queima do metano, CH₄ + 2 O₂ → CO₂ + 2 H₂O, que massa de oxigênio é consumida por 16 g de CH₄? (C = 12; H = 1; O = 16)', pagina: 146, alternativas: ['16 g', '32 g', '64 g', '48 g'], certa: 2,
    adaptada: { x: 'A reação é CH₄ + 2 O₂ → CO₂ + 2 H₂O.\nQueimamos 16 g de metano.', pergunta: 'Quanto O₂ é gasto?', dados: 'C = 12; H = 1; O = 16' } },
  { enunciado: 'Na decomposição 2 H₂O₂ → 2 H₂O + O₂, quantos mols de oxigênio se formam a partir de 4 mol de água oxigenada?', pagina: 142, alternativas: ['1 mol', '2 mol', '4 mol', '8 mol'], certa: 1,
    adaptada: { x: 'A reação é 2 H₂O₂ → 2 H₂O + O₂.\nTemos 4 mol de H₂O₂.', pergunta: 'Quantos mols de O₂ se formam?' } },
  { enunciado: '4 g de H₂ reagem com 40 g de O₂ e formam água. Que massa de oxigênio sobra no fim? (H = 1; O = 16)', pagina: 151, alternativas: ['0 g', '4 g', '8 g', '16 g'], certa: 2,
    adaptada: { x: '4 g de H₂ reagem com 40 g de O₂.\nO produto é água.', pergunta: 'Quanto O₂ sobra?', dados: 'H = 1; O = 16' } },
  { enunciado: 'Em N₂ + 3 H₂ → 2 NH₃, 28 g de N₂ dariam 34 g de amônia. Com rendimento de 75%, quanto de amônia se obtém?', pagina: 152, alternativas: ['17 g', '25,5 g', '28 g', '34 g'], certa: 1,
    adaptada: { x: 'A reação é N₂ + 3 H₂ → 2 NH₃.\nCom 28 g de N₂, a conta prevê 34 g de NH₃.\nO rendimento foi de 75%.', pergunta: 'Quanto de NH₃ saiu?' } },
]

export const PROVA_ESTEQUIOMETRIA: BancoDeQuestoes = {
  id: 'prova-estequiometria', titulo: 'Prova de estequiometria', questoes: QUESTOES_HOJE, gabarito: gabaritoDe(QUESTOES_HOJE),
}

/* ── A prova de 18/09: mol e massa molar (o lote de 26 notas) ──────────────────────────────────────────── */

const QUESTOES_MOL: QuestaoObjetiva[] = [
  { enunciado: 'Qual é a massa molar da água? (H = 1; O = 16)', alternativas: ['16 g/mol', '17 g/mol', '18 g/mol', '20 g/mol'], certa: 2, pagina: 144 },
  { enunciado: 'Quantos mols há em 36 g de água? (H = 1; O = 16)', alternativas: ['1 mol', '2 mol', '18 mol', '36 mol'], certa: 1, pagina: 145 },
  { enunciado: 'Qual é a massa de 3 mol de CO₂? (C = 12; O = 16)', alternativas: ['44 g', '88 g', '132 g', '3 g'], certa: 2, pagina: 145 },
  { enunciado: 'Qual é a massa molar do NaOH? (Na = 23; O = 16; H = 1)', alternativas: ['39 g/mol', '40 g/mol', '41 g/mol', '23 g/mol'], certa: 1, pagina: 144 },
  { enunciado: 'Quantos mols de moléculas há em 64 g de O₂? (O = 16)', alternativas: ['1 mol', '4 mol', '2 mol', '32 mol'], certa: 2, pagina: 145 },
  { enunciado: 'Quantas moléculas há em 1 mol de água?', alternativas: ['6,02 × 10²³', '18', '6,02 × 10²²', '1'], certa: 0, pagina: 144 },
  { enunciado: 'Qual a massa de NaCl formada a partir de 46 g de sódio? (Na = 23; Cl = 35,5)', alternativas: ['58,5 g', '46 g', '117 g', '81,5 g'], certa: 0, pagina: 146 },
  { enunciado: 'Qual é a massa de 0,5 mol de H₂SO₄? (H = 1; S = 32; O = 16)', alternativas: ['98 g', '196 g', '24,5 g', '49 g'], certa: 3, pagina: 145 },
  { enunciado: 'Qual é a massa molar do metano, CH₄? (C = 12; H = 1)', alternativas: ['16 g/mol', '13 g/mol', '12 g/mol', '17 g/mol'], certa: 0, pagina: 144 },
  { enunciado: 'Quantos mols de átomos de hidrogênio há em 1 mol de NH₃?', alternativas: ['1 mol', '3 mol', '4 mol', '17 mol'], certa: 1, pagina: 144 },
]

/** O gabarito cadastrado da prova de 18/09 (o mesmo do lote em `professor/Aprovar.tsx`): CBCBCAADAB. */
export const PROVA_MOL: BancoDeQuestoes = {
  id: 'prova-mol', titulo: 'Prova de mol e massa molar', questoes: QUESTOES_MOL, gabarito: gabaritoDe(QUESTOES_MOL),
}
/** Na questão 7, a resposta certa de verdade é a c (117 g): trocar o gabarito é decisão da professora. */
export const GABARITO_MOL_TROCADO = 'CBCBCACDAB'

/* ── As listas (areas/aluno/_pecas.tsx), com o gabarito de dados/tarefas-aluno.ts ──────────────────────── */

const QUESTOES_LISTA: QuestaoObjetiva[] = [
  { enunciado: 'Qual é a massa de 2 mol de água? (H = 1; O = 16)', alternativas: ['18 g', '20 g', '36 g', '32 g'], certa: 2, pagina: 145 },
  { enunciado: 'Quantos mols existem em 88 g de CO₂? (C = 12; O = 16)', alternativas: ['1 mol', '2 mol', '4 mol', '44 mol'], certa: 1, pagina: 145 },
  { enunciado: 'Calcule a massa de água produzida na combustão de 8 g de gás hidrogênio. (H = 1; O = 16)', alternativas: ['18 g', '36 g', '72 g', '9 g'], certa: 2, pagina: 145 },
  { enunciado: 'Em 2 Al + 3 Cl₂ → 2 AlCl₃, com 54 g de Al e 71 g de Cl₂, qual é o reagente limitante? (Al = 27; Cl = 35,5)', alternativas: ['O alumínio', 'O cloro', 'Os dois acabam juntos', 'Nenhum dos dois'], certa: 1, pagina: 151 },
  { enunciado: 'Qual é a massa de CO₂ formada na queima completa de 24 g de carbono?', alternativas: ['44 g', '56 g', '88 g', '24 g'], certa: 2, pagina: 142 },
  { enunciado: 'Uma reação devia produzir 50 g e produziu 40 g. Qual foi o rendimento?', alternativas: ['40%', '50%', '80%', '90%'], certa: 2, pagina: 151 },
  { enunciado: 'Quantos gramas de H₂ são necessários para formar 36 g de água?', alternativas: ['2 g', '4 g', '8 g', '18 g'], certa: 1, pagina: 145 },
  { enunciado: 'A lei de Lavoisier diz que, numa reação em sistema fechado:', alternativas: ['a massa aumenta', 'a massa diminui', 'a massa se conserva', 'a massa vira energia'], certa: 2, pagina: 141 },
]

export const LISTA_ESTEQUIOMETRIA: BancoDeQuestoes = {
  id: 'lista-estequiometria', titulo: 'Lista de estequiometria', questoes: QUESTOES_LISTA, gabarito: gabaritoDe(QUESTOES_LISTA),
}

/* ── A revisão sob medida: só converter massa em mol (p. 145), do sinal do Tutor no 2ºB ─────────────────── */

const QUESTOES_REVISAO_MOL: QuestaoObjetiva[] = [
  { enunciado: 'Quantos gramas tem 1 mol de O₂? (O = 16)', alternativas: ['16 g', '8 g', '32 g', '64 g'], certa: 2, pagina: 145 },
  { enunciado: 'Quantos mols há em 36 g de água? (H = 1; O = 16)', alternativas: ['2 mol', '1 mol', '18 mol', '36 mol'], certa: 0, pagina: 145 },
  { enunciado: 'Quantos mols há em 88 g de CO₂? (C = 12; O = 16)', alternativas: ['1 mol', '4 mol', '44 mol', '2 mol'], certa: 3, pagina: 145 },
  { enunciado: 'Qual é a massa de 0,5 mol de NaCl? (Na = 23; Cl = 35,5)', alternativas: ['29,25 g', '58,5 g', '117 g', '11,7 g'], certa: 0, pagina: 145 },
  { enunciado: 'Qual é a massa de 3 mol de água? (H = 1; O = 16)', alternativas: ['18 g', '36 g', '54 g', '6 g'], certa: 2, pagina: 145 },
  { enunciado: 'Quantos mols há em 80 g de NaOH? (Na = 23; O = 16; H = 1)', alternativas: ['1 mol', '2 mol', '4 mol', '40 mol'], certa: 1, pagina: 145 },
  { enunciado: 'Quantos mols de moléculas há em 8 g de metano, CH₄? (C = 12; H = 1)', alternativas: ['0,5 mol', '1 mol', '2 mol', '8 mol'], certa: 0, pagina: 145 },
  { enunciado: 'Qual é a massa de 0,25 mol de CaCO₃? (Ca = 40; C = 12; O = 16)', alternativas: ['100 g', '50 g', '25 g', '4 g'], certa: 2, pagina: 145 },
]

export const REVISAO_MASSA_MOL: BancoDeQuestoes = {
  id: 'revisao-massa-mol', titulo: 'Revisão de massa em mol', questoes: QUESTOES_REVISAO_MOL, gabarito: gabaritoDe(QUESTOES_REVISAO_MOL),
}
/** A revisão de massa em mol (o documento nasce do sinal "travaram em converter massa em mol"). */
export const ehRevisaoDeMassaEmMol = (idOuTitulo: string) => /revis[aã]o[- ]de[- ]massa[- ]em[- ]mol/i.test(idOuTitulo)

const QUESTOES_BALANC: QuestaoObjetiva[] = [
  { enunciado: 'Qual destas equações está balanceada?', alternativas: ['H₂ + O₂ → H₂O', '2 H₂ + O₂ → 2 H₂O', 'H₂ + 2 O₂ → H₂O', '2 H₂ + 2 O₂ → H₂O'], certa: 1, pagina: 142 },
  { enunciado: 'Em __ Fe + 3 O₂ → 2 Fe₂O₃, qual é o coeficiente do ferro?', alternativas: ['1', '2', '3', '4'], certa: 3, pagina: 142 },
  { enunciado: 'Em N₂ + __ H₂ → 2 NH₃, qual é o coeficiente do H₂?', alternativas: ['1', '2', '3', '6'], certa: 2, pagina: 142 },
  { enunciado: 'Numa equação balanceada, o que é igual dos dois lados?', alternativas: ['O número de moléculas', 'O número de átomos de cada elemento', 'A cor das substâncias', 'O estado físico'], certa: 1, pagina: 141 },
  { enunciado: 'Em CH₄ + 2 O₂ → CO₂ + 2 H₂O, quantos átomos de oxigênio há em cada lado?', alternativas: ['2', '3', '4', '6'], certa: 2, pagina: 142 },
  { enunciado: 'Quantos gramas tem 1 mol de O₂? (O = 16)', alternativas: ['16 g', '32 g', '8 g', '64 g'], certa: 1, pagina: 145 },
  { enunciado: 'Quantos mols há em 36 g de água? (H = 1; O = 16)', alternativas: ['1 mol', '2 mol', '18 mol', '36 mol'], certa: 1, pagina: 145 },
  { enunciado: 'Em __ Al + 3 Cl₂ → 2 AlCl₃, qual é o coeficiente do alumínio?', alternativas: ['1', '2', '3', '6'], certa: 1, pagina: 142 },
]

export const BALANCEAMENTO: BancoDeQuestoes = {
  id: 'balanceamento', titulo: 'Atividade de balanceamento', questoes: QUESTOES_BALANC, gabarito: gabaritoDe(QUESTOES_BALANC),
}

/** O banco de questões de uma tarefa pelo id (as do aluno e as enviadas na demonstração). */
export function bancoDaTarefa(tarefaId: string, tipo?: string): BancoDeQuestoes {
  if (tarefaId === 'prova-estequiometria') return PROVA_ESTEQUIOMETRIA
  if (tarefaId === 'prova-mol') return PROVA_MOL
  if (tarefaId === 'balanceamento') return BALANCEAMENTO
  if (ehRevisaoDeMassaEmMol(tarefaId)) return REVISAO_MASSA_MOL
  if (tipo === 'prova') return PROVA_ESTEQUIOMETRIA
  return LISTA_ESTEQUIOMETRIA
}

/** Quantas questões a resposta acerta, pelo gabarito (letras maiúsculas). */
export function corrigir(respostas: Record<number, string>, gabarito: string): { acertos: number; total: number; certo: boolean[]; erradas: number[] } {
  const certo = gabarito.split('').map((g, i) => (respostas[i] ?? '').toUpperCase() === g)
  return { acertos: certo.filter(Boolean).length, total: gabarito.length, certo, erradas: certo.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0) }
}
