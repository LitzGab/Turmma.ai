import { useMemo } from 'react'
import { hoje, turmaDe } from './escola'
import { criarFatia } from './demo/nucleo'
import { fatiaSessao } from './demo/sessao-base'
import { nomeDaTurma } from './demo/turmas-base'
import { ehRevisaoDeMassaEmMol, LISTA_ESTEQUIOMETRIA, REVISAO_MASSA_MOL } from './questoes'

/* A BIBLIOTECA, como dado (20/09/2026): os 18 documentos que a professora já gerou, cada um com o COMEÇO DO SEU
   CONTEÚDO DE VERDADE — o que cabe na primeira página. É disso que a miniatura do cartão é feita
   (`turmma/pagina-mini.tsx` desenha estes blocos com texto real, minúsculo, cortado embaixo, como no Google Docs):
   a professora reconhece o arquivo pelo que está escrito nele, não por uma capa.

   · `de` é o id da ferramenta que gerou (`dados/ferramentas`); `em` é [dia, mês] de 2026; "hoje" no mockup é 21/09.
   · O conteúdo é coerente com o título, a turma, o `detalhe` e a prévia da mesma ferramenta no catálogo.
   · A "Prova de estequiometria" tem AS MESMAS questões de `QUESTOES_PROVA`, no fim deste arquivo (o documento aberto
     em `turmma/documento.tsx`); a versão de fonte ampliada é a mesma prova, com enunciado direto. Mudou lá, muda aqui.
   · A miniatura é a folha do ALUNO: não tem gabarito, alternativa marcada nem a página de origem de cada questão.
   · Tudo sintético. O simulado traz questões no FORMATO do ENEM, sem ano nem número de prova: no produto a questão
     vem do banco público, com o texto oficial, o ano e o número.
   · Os MODELOS (13ª rodada; `professorId: 'modelo'`) não são de ninguém e ficam fora de Criados: são o corpo dos
     documentos que as ferramentas geram quando nenhum dos 18 serve (sequência didática, texto de apoio, folha de
     revisão, prova anexada no Adaptar, prova de Física da introdução do Marcos).
   No produto isto não existe como dado: a miniatura é uma imagem gerada do artefato salvo. */

export type Bloco =
  /** a linha "Nome · Turma · Data" de prova e de lista */
  | { t: 'identificacao' }
  /** intertítulo */
  | { t: 'sub'; x: string }
  /** parágrafo de texto corrido */
  | { t: 'p'; x: string }
  /** instrução ou ficha do documento, em itálico */
  | { t: 'nota'; x: string }
  /** linha em destaque, centralizada (o tema da redação) */
  | { t: 'destaque'; x: string }
  /** questão: `x` é o enunciado (quebra de linha com \n); `pergunta` sai em negrito (enunciado direto); `alt` são as alternativas */
  | { t: 'questao'; n: number; x: string; pergunta?: string; dados?: string; origem?: string; alt?: string[]; pagina?: number
      /** a forma do enunciado direto (frases curtas, a pergunta à parte, os dados embaixo): sai na versão adaptada */
      direta?: { x: string; pergunta: string; dados?: string }
      /** 14ª rodada: a certa (0 = A) e a resolução em uma linha, para o gabarito */
      certa?: number; resolucao?: string }
  /** item de lista: ponto, caixa de marcar ou número */
  | { t: 'item'; x: string; marca: 'ponto' | 'caixa' | number }
  /** etapa de plano ou de projeto: o tempo (ou a semana) à esquerda, o que se faz à direita */
  | { t: 'etapa'; tempo: string; quando?: string; nome: string; x: string }
  /** tabela com fio; `larguras` são as frações das colunas */
  | { t: 'tabela'; colunas: string[]; larguras: number[]; linhas: string[][]; primeiraForte?: boolean }
  /** quadro com rótulo: texto motivador, pergunta norteadora, segurança (`alerta`) */
  | { t: 'caixa'; rotulo: string; x: string; fonte?: string; alerta?: boolean }
  /** slide: título e tópicos. O primeiro slide do documento é a capa, escura, e nela `topicos` é [subtítulo, rodapé] */
  | { t: 'slide'; n: number; titulo: string; topicos: string[] }
  /** mapa mental: o conceito no centro e os ramos, cada um com as suas folhas */
  | { t: 'mapa'; centro: string; ramos: { nome: string; folhas: string[] }[] }

export type EstadoDoc = 'aprovado' | 'rascunho' | 'espera'

/** O estado numa palavra, como a lista de Criados e o documento mostram (glossário da décima rodada). O valor
    'espera' continua com esse nome no dado; na tela ele é "Para aprovar". */
export const ROTULO_ESTADO: Record<EstadoDoc, string> = { aprovado: 'Aprovado', rascunho: 'Para aprovar', espera: 'Para aprovar' }

export type ItemBiblioteca = {
  n: number
  /** o endereço do documento em Criados (`/professor/criados/<id>`) */
  id: string
  /** o id da turma em dados/escola */
  turmaId: string
  /** é versão de outro documento (o `n` dele): a versão adaptada mora DENTRO do documento de origem, não em linha própria */
  versaoDe?: number
  titulo: string
  /** o título impresso na folha, quando não é o nome do arquivo */
  folha?: string
  de: string
  turma: string
  em: [number, number]
  detalhe: string
  estado: EstadoDoc
  /** versão de fonte ampliada: a mesma folha, com letra maior */
  ampliada?: boolean
  /** veio de um arquivo que o professor anexou (no Adaptar): a linha de Criados mostra "Do arquivo", e as questões
      não citam página do livro */
  origem?: 'arquivo'
  blocos: Bloco[]
  /** nasceu de outro documento (o id dele): "Mais difícil", "Outra versão" ou o mesmo tipo pedido para outra turma */
  base?: string
  /** a continuação que o gerou: quatro questões trocadas por outras de duas etapas, ou outra ordem */
  variante?: 'dificil' | 'b'
  /** de quem é (o professor da sessão: 'camila', 'marcos'…). Sem ele, é da Camila. Só o dono vê. */
  professorId?: string
}

/** O "hoje" do mockup, em um lugar só (dados/escola): a data da lista de Criados e o carimbo de aprovação saem daqui. */
const [DIA_HOJE, MES_HOJE] = hoje.curta.split('/').map(Number)
export const HOJE: [number, number] = [DIA_HOJE, MES_HOJE]

/* As cinco primeiras questões da Prova de estequiometria: as de Artefato.tsx, palavra por palavra. */
const ALT_ESTEQ = [
  ['44 g', '66 g', '88 g', '24 g'],
  ['2 mol', '4 mol', '6 mol', '9 mol'],
  ['18 g', '36 g', '72 g', '144 g'],
  ['O alumínio', 'O cloro', 'Nenhum: a proporção é exata', 'O cloreto de alumínio'],
  ['125%', '90%', '80%', '40%'],
]

export const BIBLIOTECA: ItemBiblioteca[] = [
  {
    n: 1, id: 'prova-estequiometria', turmaId: '2b', titulo: 'Prova de estequiometria', de: 'prova', turma: '2ºB', em: [21, 9], detalhe: '10 questões', estado: 'espera',
    blocos: [
      { t: 'identificacao' },
      { t: 'nota', x: 'Dez questões objetivas, 1,0 ponto cada. Responda a caneta azul ou preta. Calculadora simples liberada; a tabela periódica está no verso.' },
      { t: 'questao', n: 1, x: 'Qual a massa de CO₂ formada na queima completa de 24 g de carbono? (C = 12; O = 16)', alt: ALT_ESTEQ[0] },
      { t: 'questao', n: 2, x: 'Na reação N₂ + 3 H₂ → 2 NH₃, quantos mols de amônia se formam a partir de 6 mol de H₂?', alt: ALT_ESTEQ[1] },
      { t: 'questao', n: 3, x: 'Calcule a massa de água produzida na combustão de 8 g de gás hidrogênio. (H = 1; O = 16)', alt: ALT_ESTEQ[2] },
      { t: 'questao', n: 4, x: 'Em 2 Al + 3 Cl₂ → 2 AlCl₃, com 54 g de Al e 71 g de Cl₂, qual é o reagente limitante? (Al = 27; Cl = 35,5)', alt: ALT_ESTEQ[3] },
      { t: 'questao', n: 5, x: 'Uma reação com rendimento teórico de 50 g produziu 40 g. Qual foi o rendimento percentual?', alt: ALT_ESTEQ[4] },
    ],
  },
  {
    n: 2, id: 'prova-estequiometria-adaptada', turmaId: '2b', versaoDe: 1, titulo: 'Prova de estequiometria · fonte ampliada', folha: 'Prova de estequiometria', de: 'adaptacao', turma: '2ºB', em: [21, 9],
    detalhe: 'fonte ampliada · enunciado direto', estado: 'espera', ampliada: true,
    blocos: [
      { t: 'identificacao' },
      { t: 'questao', n: 1, x: 'Queimamos 24 g de carbono.\nTodo o carbono vira CO₂.', pergunta: 'Qual é a massa de CO₂ formada?', dados: 'Dados: C = 12; O = 16', alt: ALT_ESTEQ[0] },
      { t: 'questao', n: 2, x: 'A reação é N₂ + 3 H₂ → 2 NH₃.\nTemos 6 mol de H₂.', pergunta: 'Quantos mols de NH₃ se formam?', alt: ALT_ESTEQ[1] },
      { t: 'questao', n: 3, x: 'Queimamos 8 g de gás hidrogênio.\nO produto é água.', pergunta: 'Qual é a massa de água formada?', dados: 'Dados: H = 1; O = 16', alt: ALT_ESTEQ[2] },
    ],
  },
  {
    n: 3, id: 'mapa-estequiometria', turmaId: '2b', titulo: 'Mapa mental · estequiometria', de: 'material', turma: '2ºB', em: [19, 9], detalhe: '5 ramos', estado: 'aprovado',
    blocos: [
      { t: 'mapa', centro: 'Estequiometria', ramos: [
        { nome: 'Lei de Lavoisier', folhas: ['a massa se conserva', 'sistema fechado'] },
        { nome: 'Mol e massa molar', folhas: ['6,02 × 10²³ partículas', 'g/mol: de grama para mol'] },
        { nome: 'Proporção', folhas: ['coeficientes da equação', 'mol : mol · massa : massa'] },
        { nome: 'Reagente limitante', folhas: ['o que acaba primeiro', 'o outro sobra: excesso'] },
        { nome: 'Rendimento', folhas: ['teórico × real', 'R% = real ÷ teórico'] },
      ] },
    ],
  },
  {
    n: 4, id: 'rendimento-de-reacao', turmaId: '2b', titulo: 'Rendimento de reação', de: 'apresentacao', turma: '2ºB', em: [18, 9], detalhe: '5 slides', estado: 'aprovado',
    blocos: [
      { t: 'slide', n: 1, titulo: 'Rendimento de reação', topicos: ['Por que nenhuma reação rende 100% na prática', 'Química · 2ºB · capítulo 7'] },
      { t: 'slide', n: 2, titulo: 'O que a equação promete', topicos: ['Rendimento teórico: a massa calculada pela proporção', 'Vale para reagente puro e reação completa', 'É o teto: na prática sai menos'] },
      { t: 'slide', n: 3, titulo: 'O que sai do balão', topicos: ['Rendimento real: a massa medida no fim', 'Reação incompleta ou reversível', 'Impureza e perda na transferência'] },
      { t: 'slide', n: 4, titulo: 'Teórico e real: a amônia', topicos: ['N₂ + 3 H₂ ⇌ 2 NH₃', 'Reversível: não vai até o fim', 'Na fábrica, o gás que sobra volta ao reator'] },
      { t: 'slide', n: 5, titulo: 'A conta', topicos: ['R% = massa real ÷ massa teórica × 100', '40 g obtidos de 50 g previstos: 80%'] },
    ],
  },
  {
    n: 5, id: 'lista-mol-massa-molar', turmaId: '2b', titulo: 'Lista de mol e massa molar', de: 'atividade', turma: '2ºB', em: [17, 9], detalhe: '8 exercícios', estado: 'aprovado',
    blocos: [
      { t: 'identificacao' },
      { t: 'nota', x: 'Do fácil ao difícil. Mostre o cálculo de cada exercício. Constante de Avogadro: 6,02 × 10²³.' },
      { t: 'questao', n: 1, x: 'Quantos mols há em 36 g de água? (H = 1; O = 16)' },
      { t: 'questao', n: 2, x: 'Qual a massa de 0,5 mol de CaCO₃? (Ca = 40; C = 12; O = 16)' },
      { t: 'questao', n: 3, x: 'Quantas moléculas existem em 88 g de CO₂? (C = 12; O = 16)' },
      { t: 'questao', n: 4, x: 'Calcule a massa molar do ácido sulfúrico, H₂SO₄. (H = 1; S = 32; O = 16)' },
      { t: 'questao', n: 5, x: 'Um comprimido tem 500 mg de ácido acetilsalicílico, C₉H₈O₄. Quantos mols da substância há no comprimido? (C = 12; H = 1; O = 16)' },
      { t: 'questao', n: 6, x: 'Onde há mais átomos: em 10 g de ferro ou em 10 g de alumínio? Justifique com o cálculo. (Fe = 56; Al = 27)' },
      { t: 'questao', n: 7, x: 'Quantos átomos de hidrogênio existem em 0,25 mol de metano, CH₄?' },
      { t: 'questao', n: 8, x: 'Uma aliança de ouro 18 quilates tem 4,0 g e 75% de ouro em massa. Quantos átomos de ouro ela contém? (Au = 197)' },
    ],
  },
  {
    n: 6, id: 'planejamento-do-bimestre', turmaId: '2b', titulo: 'Planejamento até o fim do bimestre', de: 'plano', turma: '2ºB', em: [15, 9], detalhe: '37 aulas', estado: 'rascunho',
    blocos: [
      { t: 'nota', x: 'Química · 2ºB · 37 aulas, às terças, quintas e sextas · capítulos 7 a 9 de Química 2 · nada foi salvo na Agenda ainda.' },
      { t: 'tabela', colunas: ['Data', 'Dia', 'O que dar', 'Pág.'], larguras: [1.15, 0.8, 5.4, 0.9], linhas: [
        ['22/09', 'ter', 'Reagente limitante: a ideia, com a receita de bolo', '150'],
        ['24/09', 'qui', 'Reagente em excesso: prática em dupla', '151'],
        ['25/09', 'sex', 'Rendimento de reação: teórico e real', '152'],
        ['29/09', 'ter', 'Revisão do capítulo 7', '153'],
        ['01/10', 'qui', 'Prova do capítulo 7', '—'],
        ['02/10', 'sex', 'Devolutiva da prova e retomada do que travou', '—'],
        ['06/10', 'ter', 'Cap. 8 · Soluções: soluto, solvente e solubilidade', '158'],
        ['08/10', 'qui', 'Curva de solubilidade: ler e interpretar o gráfico', '160'],
        ['09/10', 'sex', 'Concentração comum, em g/L', '163'],
        ['13/10', 'ter', 'Concentração em mol/L', '166'],
        ['15/10', 'qui', 'Sem aula · Dia do Professor', '—'],
        ['16/10', 'sex', 'Diluição: prática com suco em pó', '169'],
      ] },
    ],
  },
  {
    n: 7, id: 'plano-reagente-limitante', turmaId: '2b', titulo: 'Plano da semana · reagente limitante', de: 'plano', turma: '2ºB', em: [14, 9], detalhe: '2 aulas', estado: 'aprovado',
    blocos: [
      { t: 'nota', x: 'Química · 2ºB · 2 aulas de 50 min · Química 2, cap. 7 · Habilidade: EM13CNT301, reagente limitante e excesso.' },
      { t: 'sub', x: 'Aula 1 · terça, 22/09' },
      { t: 'etapa', tempo: '10 min', nome: 'Abertura: a receita de bolo', x: 'Com 6 ovos e 1 kg de farinha, quantos bolos saem? O ingrediente que acaba primeiro manda na conta.' },
      { t: 'etapa', tempo: '15 min', nome: 'Proporção em mol', x: 'Da receita aos coeficientes: ler 2 H₂ + O₂ → 2 H₂O como proporção entre quantidades. (p. 150)' },
      { t: 'etapa', tempo: '25 min', nome: 'Três exemplos na lousa', x: 'Dadas as massas de dois reagentes, achar o limitante, o excesso e a massa de produto.' },
      { t: 'sub', x: 'Aula 2 · quinta, 24/09' },
      { t: 'etapa', tempo: '35 min', nome: 'Prática em dupla', x: 'Quatro problemas com reagente em excesso. Circular pela sala e ouvir o raciocínio das duplas. (p. 151)' },
      { t: 'etapa', tempo: '15 min', nome: 'Fechamento', x: 'Ponte para rendimento: por que o produto real fica abaixo do teórico.' },
      { t: 'etapa', tempo: 'Casa', nome: 'Para casa', x: 'Exercícios 4 a 9 do capítulo. (p. 153)' },
    ],
  },
  {
    n: 9, id: 'revisao-para-o-simulado', turmaId: '2a', titulo: 'Revisão para o simulado', de: 'atividade', turma: '2ºA', em: [11, 9], detalhe: '6 exercícios', estado: 'espera',
    blocos: [
      { t: 'identificacao' },
      { t: 'nota', x: 'Seis exercícios dos capítulos 6 e 7, no formato do simulado: cinco alternativas, uma só correta.' },
      { t: 'questao', n: 1, x: 'Ao balancear Fe + O₂ → Fe₂O₃ com os menores coeficientes inteiros, a soma dos coeficientes é:', alt: ['5', '7', '9', '11', '13'] },
      { t: 'questao', n: 2, x: 'Em sistema fechado, 10 g de carbonato de cálcio se decompõem e formam 5,6 g de óxido de cálcio. A massa de gás carbônico liberada é:', alt: ['2,2 g', '4,4 g', '5,6 g', '10 g', '15,6 g'] },
      { t: 'questao', n: 3, x: 'A massa molar da glicose, C₆H₁₂O₆, em g/mol, é: (C = 12; H = 1; O = 16)', alt: ['96', '168', '180', '186', '342'] },
      { t: 'questao', n: 4, x: 'Quantos mols de O₂ são consumidos na combustão completa de 2 mol de etanol, C₂H₅OH?', alt: ['2', '3', '4', '6', '7'] },
      { t: 'questao', n: 5, x: 'A decomposição de 245 g de clorato de potássio, 2 KClO₃ → 2 KCl + 3 O₂, libera que massa de oxigênio? (K = 39; Cl = 35,5; O = 16)', alt: ['32 g', '48 g', '64 g', '96 g', '144 g'] },
      { t: 'questao', n: 6, x: 'Segundo a lei de Proust, se 2 g de hidrogênio reagem com 16 g de oxigênio, 5 g de hidrogênio reagem com:', alt: ['20 g', '32 g', '40 g', '45 g', '80 g'] },
    ],
  },
  {
    n: 10, id: 'proposta-residuos-quimicos', turmaId: '2a', titulo: 'Proposta · resíduos químicos nas cidades', de: 'redacao', turma: '2ºA', em: [10, 9], detalhe: 'dissertativo · com rubrica', estado: 'aprovado',
    blocos: [
      { t: 'destaque', x: 'Tema: caminhos para o descarte correto de resíduos químicos nas cidades brasileiras' },
      { t: 'caixa', rotulo: 'Texto I', x: 'Pilhas e baterias contêm metais pesados, como mercúrio, cádmio e chumbo. Jogadas no lixo comum, elas se rompem nos aterros, e esses metais chegam ao solo e à água subterrânea, onde se acumulam nos seres vivos ao longo da cadeia alimentar.', fonte: 'Química 2, p. 188' },
      { t: 'caixa', rotulo: 'Texto II', x: 'Resíduos perigosos de casa e o destino certo. Pilhas e baterias: ponto de coleta do comércio. Lâmpadas fluorescentes: a loja que vende. Remédios vencidos: farmácia. Óleo de cozinha usado: ponto de entrega, em garrafa fechada. Tintas e solventes: ecoponto do município.', fonte: 'Química 2, quadro da p. 190' },
      { t: 'sub', x: 'Proposta' },
      { t: 'p', x: 'A partir da leitura dos textos motivadores e do que você estudou, escreva um texto dissertativo-argumentativo, na norma-padrão da língua portuguesa, sobre o tema acima. Defenda um ponto de vista e proponha uma ação que a sua cidade possa pôr em prática.' },
      { t: 'nota', x: 'De 20 a 30 linhas. Não copie trechos dos textos motivadores. Dê um título ao seu texto.' },
    ],
  },
  {
    n: 12, id: 'resumo-balanceamento', turmaId: '2a', titulo: 'Resumo · balanceamento', de: 'material', turma: '2ºA', em: [8, 9], detalhe: '1 página', estado: 'aprovado',
    blocos: [
      { t: 'sub', x: 'Por que balancear' },
      { t: 'p', x: 'Em uma reação química, os átomos não são criados nem destruídos: eles só se rearranjam. Por isso o número de átomos de cada elemento tem de ser o mesmo nos reagentes e nos produtos. É o que diz a lei de Lavoisier: em um sistema fechado, a massa se conserva. (p. 138)' },
      { t: 'sub', x: 'O método das tentativas' },
      { t: 'p', x: 'Comece pelo elemento que aparece em menos substâncias e deixe o hidrogênio e o oxigênio para o fim. Mude só os coeficientes, os números na frente das fórmulas; nunca os índices, que mudariam a substância. (p. 139)' },
      { t: 'sub', x: 'Um exemplo: a queima do propano' },
      { t: 'p', x: 'C₃H₈ + O₂ → CO₂ + H₂O. Três carbonos pedem 3 CO₂; oito hidrogênios pedem 4 H₂O. À direita ficam 6 + 4 = 10 átomos de oxigênio, então são 5 O₂. Equação balanceada: C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O.' },
      { t: 'sub', x: 'O que os coeficientes dizem' },
      { t: 'p', x: 'Os coeficientes dão a proporção em mol entre reagentes e produtos: 1 mol de propano consome 5 mol de oxigênio e forma 3 mol de gás carbônico. É daí que saem todos os cálculos de estequiometria. (p. 142)' },
    ],
  },
  {
    n: 13, id: 'rubrica-lavoisier', turmaId: '1c', titulo: 'Rubrica · discursiva sobre Lavoisier', de: 'redacao', turma: '1ºC', em: [4, 9], detalhe: '4 critérios', estado: 'rascunho',
    blocos: [
      { t: 'p', x: 'Questão: a palha de aço queimada em uma balança fica mais pesada; o papel queimado fica mais leve. Explique, com a lei de Lavoisier, por que os dois resultados não contrariam a conservação da massa.' },
      { t: 'tabela', primeiraForte: true, colunas: ['Critério', 'Completo · 2,5', 'Parcial · 1,5', 'Insuficiente · 0,5'], larguras: [1.15, 1.5, 1.3, 1.3], linhas: [
        ['Enuncia a lei', 'Em sistema fechado, a massa dos reagentes é igual à dos produtos.', 'Cita a conservação, sem falar em sistema fechado.', 'Não enuncia, ou confunde com a lei de Proust.'],
        ['Explica a palha de aço', 'O ferro se combina com o O₂ do ar: o óxido pesa mais que o metal.', 'Diz que "entra ar", sem citar a reação.', 'Atribui o ganho a erro da balança.'],
        ['Explica o papel', 'CO₂ e vapor de água saem para o ar: o sistema é aberto.', 'Fala em fumaça, sem citar os gases.', 'Diz que a massa foi destruída.'],
        ['Conclui', 'Liga os dois casos: fechado o sistema, a massa se conserva nos dois.', 'Conclui sem ligar os dois casos.', 'Não conclui.'],
      ] },
      { t: 'nota', x: 'Total: 10,0. Quem corrige e escreve a devolutiva é a professora.' },
    ],
  },
  {
    n: 14, id: 'simulado-enem-estequiometria', turmaId: '2b', titulo: 'Simulado ENEM · cálculo estequiométrico', de: 'simulado', turma: '2ºB', em: [2, 9], detalhe: '15 questões', estado: 'aprovado',
    blocos: [
      { t: 'identificacao' },
      { t: 'nota', x: 'Quinze questões de Ciências da Natureza, no formato do ENEM.' },
      { t: 'questao', n: 1, origem: 'Ciências da Natureza · formato ENEM', x: 'O ferro-gusa é obtido em altos-fornos pela redução do minério de ferro com monóxido de carbono: Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂. Considerando apenas essa etapa, a massa de gás carbônico, em toneladas, emitida na produção de 1,12 t de ferro é: (Fe = 56; C = 12; O = 16)', alt: ['0,44', '0,66', '0,88', '1,32', '2,64'] },
      { t: 'questao', n: 2, origem: 'Ciências da Natureza · formato ENEM', x: 'Um calcário com 80% de pureza em CaCO₃ é aquecido para produzir cal virgem: CaCO₃ → CaO + CO₂. A massa de CaO, em kg, obtida a partir de 500 kg desse calcário é: (Ca = 40; C = 12; O = 16)', alt: ['112', '176', '224', '280', '400'] },
      { t: 'questao', n: 3, origem: 'Ciências da Natureza · formato ENEM', x: 'O etanol é usado como combustível: C₂H₅OH + 3 O₂ → 2 CO₂ + 3 H₂O. A quantidade de CO₂, em mol, liberada na queima completa de 4,6 kg de etanol é: (C = 12; H = 1; O = 16)', alt: ['50', '100', '150', '200', '300'] },
      { t: 'questao', n: 4, origem: 'Ciências da Natureza · formato ENEM', x: 'A amônia é produzida pelo processo Haber-Bosch: N₂ + 3 H₂ → 2 NH₃. A massa de amônia, em kg, obtida a partir de 56 kg de nitrogênio, com rendimento total, é: (N = 14; H = 1)', alt: ['17', '34', '68', '112', '136'] },
      { t: 'questao', n: 5, origem: 'Ciências da Natureza · formato ENEM', x: 'O bicarbonato de sódio é usado como fermento: 2 NaHCO₃ → Na₂CO₃ + H₂O + CO₂. A massa de CO₂, em gramas, liberada por 168 g de bicarbonato é: (Na = 23; H = 1; C = 12; O = 16)', alt: ['22', '44', '66', '88', '168'] },
      { t: 'questao', n: 6, origem: 'Ciências da Natureza · formato ENEM', x: 'Em um laboratório, 10 g de hidrogênio reagem com 64 g de oxigênio para formar água: 2 H₂ + O₂ → 2 H₂O. O reagente em excesso e a massa que sobra são: (H = 1; O = 16)', alt: ['H₂, 2 g', 'H₂, 4 g', 'O₂, 8 g', 'O₂, 16 g', 'Não há excesso'] },
      { t: 'questao', n: 7, origem: 'Ciências da Natureza · formato ENEM', x: 'A cal virgem reage com a água na construção civil: CaO + H₂O → Ca(OH)₂. Para obter 7,4 kg de cal hidratada, a massa necessária de cal virgem, em kg, é: (Ca = 40; O = 16; H = 1)', alt: ['2,8', '5,6', '7,4', '11,2', '14,8'] },
      { t: 'questao', n: 8, origem: 'Ciências da Natureza · formato ENEM', x: 'O gás de cozinha contém butano: 2 C₄H₁₀ + 13 O₂ → 8 CO₂ + 10 H₂O. A quantidade de O₂, em mol, consumida na queima de 4 mol de butano é:', alt: ['8', '13', '16', '26', '52'] },
      { t: 'questao', n: 9, origem: 'Ciências da Natureza · formato ENEM', x: 'Na fotossíntese, 6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂. A massa de glicose, em gramas, produzida a partir de 264 g de CO₂ é: (C = 12; H = 1; O = 16)', alt: ['44', '90', '180', '264', '360'] },
      { t: 'questao', n: 10, origem: 'Ciências da Natureza · formato ENEM', x: 'O airbag infla pela decomposição da azida de sódio: 2 NaN₃ → 2 Na + 3 N₂. A quantidade de N₂, em mol, formada por 130 g de azida é: (Na = 23; N = 14)', alt: ['1', '2', '3', '4', '6'] },
      { t: 'questao', n: 11, origem: 'Ciências da Natureza · formato ENEM', x: 'Um minério tem 60% de pureza em Fe₂O₃. A massa de ferro, em toneladas, contida em 10 t desse minério é: (Fe = 56; O = 16)', alt: ['3,0', '4,2', '6,0', '7,0', '8,4'] },
      { t: 'questao', n: 12, origem: 'Ciências da Natureza · formato ENEM', x: 'O ácido clorídrico do estômago é neutralizado por antiácido: Mg(OH)₂ + 2 HCl → MgCl₂ + 2 H₂O. A massa de Mg(OH)₂, em gramas, que neutraliza 0,2 mol de HCl é: (Mg = 24; O = 16; H = 1)', alt: ['2,9', '5,8', '11,6', '23,2', '58'] },
      { t: 'questao', n: 13, origem: 'Ciências da Natureza · formato ENEM', x: 'Na produção de 100 g de carbonato de cálcio, obteve-se 80 g. Mantido o mesmo rendimento, a massa obtida ao se prever 250 g seria:', alt: ['80 g', '125 g', '160 g', '200 g', '250 g'] },
      { t: 'questao', n: 14, origem: 'Ciências da Natureza · formato ENEM', x: 'A queima do metano gera energia: CH₄ + 2 O₂ → CO₂ + 2 H₂O. O volume de CO₂, em litros, nas CNTP, liberado na queima de 32 g de metano é: (C = 12; H = 1; volume molar = 22,4 L)', alt: ['11,2', '22,4', '44,8', '67,2', '89,6'] },
      { t: 'questao', n: 15, origem: 'Ciências da Natureza · formato ENEM', x: 'O alumínio é obtido da alumina: 2 Al₂O₃ → 4 Al + 3 O₂. A massa de alumínio, em kg, obtida a partir de 204 kg de alumina, com rendimento de 50%, é: (Al = 27; O = 16)', alt: ['27', '54', '81', '108', '204'] },
    ],
  },
  {
    n: 15, id: 'modelos-atomicos-aula-1', turmaId: '1c', titulo: 'Modelos atômicos · aula 1', de: 'plano', turma: '1ºC', em: [1, 9], detalhe: '1 aula', estado: 'aprovado',
    blocos: [
      { t: 'nota', x: 'Química · 1ºC · 1 aula de 50 min · quarta, 02/09.' },
      { t: 'sub', x: 'Objetivo' },
      { t: 'p', x: 'Reconhecer que um modelo científico muda quando uma evidência nova não cabe nele: de Dalton a Thomson.' },
      { t: 'sub', x: 'Etapas' },
      { t: 'etapa', tempo: '10 min', nome: 'A caixa fechada', x: 'Cada grupo recebe uma caixa lacrada com um objeto dentro e descreve o que há ali sem abrir. É assim que se estuda o átomo.' },
      { t: 'etapa', tempo: '15 min', nome: 'Dalton: a esfera maciça', x: 'O que o modelo de 1808 explicava: a conservação da massa e as proporções fixas.' },
      { t: 'etapa', tempo: '15 min', nome: 'Thomson: o elétron', x: 'O tubo de raios catódicos e a descoberta, em 1897, de uma partícula negativa menor que o átomo. O "pudim de passas".' },
      { t: 'etapa', tempo: '10 min', nome: 'Fechamento', x: 'Linha do tempo no caderno: o que cada modelo explica e o que ele deixa sem explicar.' },
      { t: 'etapa', tempo: 'Casa', nome: 'Para casa', x: 'Ler sobre o experimento de Rutherford com a lâmina de ouro.' },
    ],
  },
  {
    n: 16, id: 'diagnostica-estequiometria', turmaId: '1c', titulo: 'Diagnóstica · antes de estequiometria', de: 'prova', turma: '1ºC', em: [28, 8], detalhe: '8 questões', estado: 'aprovado',
    blocos: [
      { t: 'identificacao' },
      { t: 'nota', x: 'Não vale nota. Serve para a professora saber por onde começar o capítulo. Oito questões, 15 minutos.' },
      { t: 'questao', n: 1, x: 'Se 2 ovos fazem 12 biscoitos, quantos ovos são necessários para fazer 30 biscoitos?', alt: ['3', '4', '5', '6'] },
      { t: 'questao', n: 2, x: 'Qual das equações abaixo está balanceada?', alt: ['H₂ + O₂ → H₂O', '2 H₂ + O₂ → 2 H₂O', 'H₂ + 2 O₂ → 2 H₂O', '2 H₂ + 2 O₂ → H₂O'] },
      { t: 'questao', n: 3, x: 'Qual é a massa atômica aproximada do oxigênio?', alt: ['8 u', '12 u', '16 u', '32 u'] },
      { t: 'questao', n: 4, x: 'Quantos átomos de hidrogênio há em uma molécula de H₂SO₄?', alt: ['1', '2', '4', '7'] },
      { t: 'questao', n: 5, x: 'Uma receita usa 3 xícaras de farinha para 2 de açúcar. Com 9 xícaras de farinha, quantas xícaras de açúcar são necessárias?', alt: ['4', '6', '8', '12'] },
      { t: 'questao', n: 6, x: 'Na equação CH₄ + 2 O₂ → CO₂ + 2 H₂O, o número 2 na frente de O₂ indica:', alt: ['dois átomos de oxigênio', 'duas moléculas de O₂', 'a massa do oxigênio', 'a carga do oxigênio'] },
    ],
  },
  {
    n: 17, id: 'prova-modelos-atomicos', turmaId: '1c', titulo: 'Prova de modelos atômicos', de: 'prova', turma: '1ºC', em: [25, 8], detalhe: '10 questões · 2 versões', estado: 'aprovado',
    blocos: [
      { t: 'identificacao' },
      { t: 'nota', x: 'Versão A · dez questões objetivas, 1,0 ponto cada. Responda a caneta azul ou preta.' },
      { t: 'questao', n: 1, x: 'No modelo de Dalton, o átomo é:', alt: ['uma esfera maciça e indivisível', 'uma esfera positiva com elétrons incrustados', 'um núcleo pequeno cercado por elétrons', 'um núcleo com elétrons em níveis de energia'] },
      { t: 'questao', n: 2, x: 'O experimento de Rutherford com a lâmina de ouro mostrou que:', alt: ['o átomo é indivisível', 'a maior parte do átomo é espaço vazio, com um núcleo pequeno e denso', 'os elétrons têm carga positiva', 'a massa do átomo se espalha por todo o seu volume'] },
      { t: 'questao', n: 3, x: 'A descoberta do elétron, em 1897, é atribuída a:', alt: ['Dalton', 'Thomson', 'Rutherford', 'Bohr'] },
      { t: 'questao', n: 4, x: 'No modelo de Bohr, o elétron emite luz quando:', alt: ['salta para um nível mais externo', 'volta de um nível mais externo para um mais interno', 'permanece na mesma órbita', 'é capturado pelo núcleo'] },
      { t: 'questao', n: 5, x: 'Um átomo neutro de sódio tem número atômico 11 e número de massa 23. Ele tem:', alt: ['11 prótons, 11 elétrons e 12 nêutrons', '11 prótons, 12 elétrons e 11 nêutrons', '12 prótons, 11 elétrons e 23 nêutrons', '23 prótons, 23 elétrons e 11 nêutrons'] },
    ],
  },
  {
    n: 18, id: 'plano-de-recuperacao', turmaId: '2b', titulo: 'Recuperação · duas habilidades', de: 'atividade', turma: '2ºB', em: [24, 8], detalhe: '2 semanas', estado: 'aprovado',
    blocos: [
      { t: 'nota', x: 'Química · 2ºB · 2 semanas, em aula e para casa · base: o acerto da turma por habilidade. O plano é da turma, não de um aluno.' },
      { t: 'sub', x: 'EM13CNT104 · Cálculo com mol e massa molar' },
      { t: 'etapa', tempo: 'Aula 1', quando: '25 min', nome: 'Retomada', x: 'A tabela de conversão entre grama, mol e número de partículas, montada com a turma na lousa. (p. 145)' },
      { t: 'etapa', tempo: 'Aula 2', quando: '50 min', nome: 'Oito exercícios graduados', x: 'Do cálculo direto de massa molar ao problema em duas etapas. Em dupla, com a tabela na mão.' },
      { t: 'sub', x: 'EM13CNT301 · Reagente limitante e excesso' },
      { t: 'etapa', tempo: 'Aula 3', quando: '25 min', nome: 'A receita de bolo, de novo', x: 'Quem acaba primeiro manda na conta: da receita à equação balanceada. (p. 150)' },
      { t: 'etapa', tempo: 'Aula 4', quando: '50 min', nome: 'Seis exercícios graduados', x: 'Achar o limitante, depois o excesso, depois a massa de produto. Um passo novo por exercício.' },
      { t: 'sub', x: 'Checagem' },
      { t: 'p', x: 'Cinco questões objetivas no fim da segunda semana, corrigidas pelo Assistente e aprovadas pela professora.' },
    ],
  },

  /* ── Os modelos (13ª rodada): corpo dos documentos que as ferramentas geram; não são de ninguém ─────────── */
  {
    n: 101, id: 'modelo-sequencia', turmaId: '2b', titulo: 'Sequência didática · reagente limitante', de: 'plano', turma: '2ºB', em: [21, 9], detalhe: '4 aulas', estado: 'rascunho', professorId: 'modelo',
    blocos: [
      { t: 'nota', x: 'Química · 4 aulas de 50 min, encadeadas · Química 2, cap. 7 · Habilidades: EM13CNT301 e EM13CNT104.' },
      { t: 'tabela', colunas: ['Aula', 'O que a turma faz', 'Como fecha', 'Pág.'], larguras: [0.8, 3.6, 2.6, 0.7], linhas: [
        ['1', 'A receita de bolo: com 6 ovos e 1 kg de farinha, quantos bolos saem? Da receita à proporção em mol.', 'Bilhete de saída: qual ingrediente manda na conta?', '150'],
        ['2', 'Achar o limitante por comparação: quanto produto cada reagente renderia. Três exemplos na lousa.', 'Dois exercícios no caderno, corrigidos em dupla.', '150'],
        ['3', 'Reagente em excesso: quanto sobra. Prática em dupla com quatro problemas graduados.', 'Cada dupla explica um problema para a turma.', '151'],
        ['4', 'Do limitante ao rendimento: por que o produto real fica abaixo do teórico.', 'Cinco questões objetivas, corrigidas pelo Assistente e aprovadas por você.', '152'],
      ] },
      { t: 'sub', x: 'Para casa, ao longo da sequência' },
      { t: 'item', marca: 1, x: 'Depois da aula 2: exercícios 1 a 3 do capítulo (p. 153).' },
      { t: 'item', marca: 2, x: 'Depois da aula 3: exercícios 4 a 9 do capítulo (p. 153).' },
    ],
  },
  {
    n: 102, id: 'modelo-texto-apoio', turmaId: '2b', titulo: 'Texto de apoio · balanceamento de equações', de: 'material', turma: '2ºB', em: [21, 9], detalhe: '1 página', estado: 'rascunho', professorId: 'modelo',
    blocos: [
      { t: 'sub', x: 'O vinagre, o bicarbonato e a balança' },
      { t: 'p', x: 'Quem já misturou vinagre com bicarbonato de sódio viu a espuma subir. Se a mistura for feita num frasco aberto em cima de uma balança, o número no visor cai: parece que a massa sumiu. Não sumiu. O gás carbônico formado escapa para o ar, e a balança só pesa o que ficou no frasco. Com o frasco fechado por um balão, a massa do começo é a mesma do fim. É a lei de Lavoisier. (p. 138)' },
      { t: 'p', x: 'Se nenhum átomo é criado nem destruído, a equação química precisa mostrar isso. Balancear é escrever, na frente de cada fórmula, o número que deixa a quantidade de cada elemento igual dos dois lados. Esse número é o coeficiente. O índice, o número pequeno dentro da fórmula, não se mexe: trocar H₂O por H₂O₂ muda a substância, de água para água oxigenada. (p. 139)' },
      { t: 'p', x: 'O método mais usado na escola é o das tentativas. Começa-se pelo elemento que aparece em menos substâncias e deixa-se o hidrogênio e o oxigênio para o fim. Na queima do metano, CH₄ + O₂ → CO₂ + H₂O, o carbono já está igual; os quatro hidrogênios pedem 2 H₂O; e os quatro oxigênios da direita pedem 2 O₂. Fica CH₄ + 2 O₂ → CO₂ + 2 H₂O. Os coeficientes dizem também a proporção em mol: 1 mol de metano consome 2 mol de oxigênio. (p. 142)' },
      { t: 'sub', x: 'Para discutir em grupo' },
      { t: 'item', marca: 1, x: 'Por que a balança marca menos com o frasco aberto, se a massa se conserva?' },
      { t: 'item', marca: 2, x: 'O que muda se alguém trocar o índice em vez do coeficiente para balancear a água?' },
      { t: 'item', marca: 3, x: 'Que outra reação do dia a dia parece "perder" massa? Para onde ela vai?' },
    ],
  },
  {
    n: 103, id: 'modelo-folha-revisao', turmaId: '2b', titulo: 'Folha de revisão · balanceamento de equações', de: 'material', turma: '2ºB', em: [21, 9], detalhe: '1 página', estado: 'rascunho', professorId: 'modelo',
    blocos: [
      { t: 'identificacao' },
      { t: 'caixa', rotulo: 'Conceito', x: 'Balancear é igualar a quantidade de cada elemento nos dois lados da equação, mexendo só nos coeficientes. Os coeficientes dão a proporção em mol entre reagentes e produtos.', fonte: 'Química 2, p. 138 e 142' },
      { t: 'caixa', rotulo: 'Exemplo resolvido', x: 'Al + O₂ → Al₂O₃. O oxigênio: 2 à esquerda, 3 à direita; o menor múltiplo é 6, então 3 O₂ e 2 Al₂O₃. Agora há 4 Al à direita: 4 Al. Equação balanceada: 4 Al + 3 O₂ → 2 Al₂O₃.', fonte: 'Química 2, p. 139' },
      { t: 'sub', x: 'Agora é com você' },
      { t: 'questao', n: 1, x: 'Balanceie: H₂ + Cl₂ → HCl', pagina: 139 },
      { t: 'questao', n: 2, x: 'Balanceie: N₂ + H₂ → NH₃. Quantos mols de amônia saem de 3 mol de H₂?', pagina: 142 },
      { t: 'questao', n: 3, x: 'Balanceie a queima do etanol: C₂H₅OH + O₂ → CO₂ + H₂O', pagina: 139 },
    ],
  },
  {
    n: 104, id: 'modelo-prova-anexada', turmaId: '2b', titulo: 'Prova bimestral', de: 'prova', turma: '2ºB', em: [21, 9], detalhe: '8 questões', estado: 'espera', professorId: 'modelo',
    blocos: [
      { t: 'identificacao' },
      { t: 'destaque', x: 'Prova bimestral' },
      { t: 'nota', x: 'Oito questões objetivas, 1,25 ponto cada. Responda a caneta azul ou preta. A tabela periódica está no verso.' },
      { t: 'questao', n: 1, x: 'Dissolvem-se 20 g de açúcar em água até completar 500 mL de solução. A concentração comum dessa solução é:', alt: ['4 g/L', '10 g/L', '40 g/L', '100 g/L'], direta: { x: 'Dissolvemos 20 g de açúcar em água.\nA solução fica com 500 mL.', pergunta: 'Qual é a concentração comum?' } },
      { t: 'questao', n: 2, x: 'Uma solução de NaCl com 0,5 mol/L tem 200 mL. A quantidade de NaCl dissolvida é:', alt: ['0,01 mol', '0,1 mol', '1 mol', '2,5 mol'], direta: { x: 'Temos 200 mL de solução de NaCl.\nA concentração é 0,5 mol/L.', pergunta: 'Quantos mols de NaCl estão dissolvidos?' } },
      { t: 'questao', n: 3, x: 'Ao diluir 100 mL de uma solução de 2 mol/L até 400 mL, a nova concentração passa a ser:', alt: ['0,25 mol/L', '0,5 mol/L', '1 mol/L', '8 mol/L'], direta: { x: 'Temos 100 mL de solução a 2 mol/L.\nAcrescentamos água até 400 mL.', pergunta: 'Qual é a nova concentração?' } },
      { t: 'questao', n: 4, x: 'A massa molar do ácido sulfúrico, H₂SO₄, é: (H = 1; S = 32; O = 16)', alt: ['49 g/mol', '96 g/mol', '98 g/mol', '100 g/mol'], direta: { x: 'Veja a fórmula do ácido sulfúrico: H₂SO₄.', pergunta: 'Qual é a massa molar dele?', dados: 'H = 1; S = 32; O = 16' } },
      { t: 'questao', n: 5, x: 'Qual das equações abaixo está balanceada?', alt: ['Fe + O₂ → Fe₂O₃', '4 Fe + 3 O₂ → 2 Fe₂O₃', '2 Fe + O₂ → Fe₂O₃', 'Fe + 3 O₂ → 2 Fe₂O₃'], direta: { x: 'Veja as quatro equações abaixo.', pergunta: 'Qual delas está balanceada?' } },
      { t: 'questao', n: 6, x: 'Na reação 2 H₂ + O₂ → 2 H₂O, quantos mols de O₂ reagem com 4 mol de H₂?', alt: ['1 mol', '2 mol', '4 mol', '8 mol'], direta: { x: 'A reação é 2 H₂ + O₂ → 2 H₂O.\nTemos 4 mol de H₂.', pergunta: 'Quantos mols de O₂ reagem?' } },
      { t: 'questao', n: 7, x: 'O reagente que acaba primeiro numa reação e define a massa de produto é o reagente:', alt: ['em excesso', 'limitante', 'catalisador', 'inerte'], direta: { x: 'Numa reação, um reagente acaba primeiro.\nEle define a massa de produto.', pergunta: 'Como se chama esse reagente?' } },
      { t: 'questao', n: 8, x: 'Uma reação prevista para render 80 g produziu 60 g. O rendimento foi de:', alt: ['60%', '75%', '80%', '133%'], direta: { x: 'A reação devia render 80 g.\nEla rendeu 60 g.', pergunta: 'Qual foi o rendimento?' } },
    ],
  },
  {
    n: 105, id: 'modelo-prova-fisica', turmaId: 'au-3a', titulo: 'Prova de cinemática', de: 'prova', turma: '3ºA', em: [21, 9], detalhe: '10 questões', estado: 'espera', professorId: 'modelo',
    blocos: [
      { t: 'identificacao' },
      { t: 'nota', x: 'Física · movimento retilíneo uniforme. Dez questões objetivas, 1,0 ponto cada. Calculadora simples liberada.' },
      { t: 'questao', n: 1, x: 'Um ônibus percorre 120 km em 2 h, com velocidade constante. Sua velocidade média é:', alt: ['30 km/h', '60 km/h', '120 km/h', '240 km/h'] },
      { t: 'questao', n: 2, x: 'Uma bicicleta anda a 5 m/s. Em 1 minuto, ela percorre:', alt: ['5 m', '60 m', '300 m', '500 m'] },
      { t: 'questao', n: 3, x: 'A velocidade de 72 km/h, em metros por segundo, é:', alt: ['7,2 m/s', '20 m/s', '36 m/s', '259,2 m/s'] },
      { t: 'questao', n: 4, x: 'A função horária de um móvel em MRU é s = 10 + 4t (SI). A posição em t = 5 s é:', alt: ['14 m', '20 m', '30 m', '50 m'] },
      { t: 'questao', n: 5, x: 'Na função s = 10 + 4t (SI), a posição inicial e a velocidade são:', alt: ['4 m e 10 m/s', '10 m e 4 m/s', '14 m e 4 m/s', '10 m e 14 m/s'] },
      { t: 'questao', n: 6, x: 'Num gráfico de posição por tempo, o MRU aparece como:', alt: ['uma parábola', 'uma reta inclinada', 'uma reta horizontal no eixo do tempo', 'uma curva que sobe cada vez mais rápido'] },
      { t: 'questao', n: 7, x: 'Dois carros partem do mesmo ponto, no mesmo sentido, a 60 km/h e 80 km/h. Depois de 3 h, a distância entre eles é:', alt: ['20 km', '60 km', '140 km', '420 km'] },
      { t: 'questao', n: 8, x: 'Um trem de 200 m, a 20 m/s, atravessa uma ponte de 400 m. O tempo da travessia completa é:', alt: ['10 s', '20 s', '30 s', '40 s'] },
      { t: 'questao', n: 9, x: 'No gráfico de velocidade por tempo de um MRU, a área sob a reta representa:', alt: ['a aceleração', 'o deslocamento', 'a velocidade média', 'o tempo total'] },
      { t: 'questao', n: 10, x: 'Um corredor faz 100 m em 12,5 s, em ritmo constante. Sua velocidade é:', alt: ['6,0 m/s', '8,0 m/s', '10,0 m/s', '12,5 m/s'] },
    ],
  },
]

export const versoesDe = (n: number) => BIBLIOTECA.filter((b) => b.versaoDe === n)

/* ── O documento aberto (décima rodada, 04/10/2026) ────────────────────────────────────────────────────────────
   As dez questões da Prova de estequiometria, inteiras, com a página do material, a resposta certa e a forma
   adaptada (fonte ampliada e enunciado direto: frases curtas, a pergunta em negrito). As cinco primeiras são as
   da miniatura, palavra por palavra. */

export type QuestaoProva = {
  texto: string; pagina: number; alt: string[]; certa: number
  /** a mesma questão na versão adaptada: o enunciado em frases curtas, a pergunta à parte e os dados embaixo */
  adaptada: { x: string; pergunta: string; dados?: string }
  /** a resolução em uma linha (o POR QUÊ do gabarito; 14ª rodada) */
  resolucao?: string
}

export const QUESTOES_PROVA: QuestaoProva[] = [
  { texto: 'Qual a massa de CO₂ formada na queima completa de 24 g de carbono? (C = 12; O = 16)', pagina: 142, alt: ALT_ESTEQ[0], certa: 2,
    resolucao: '24 g de C são 2 mol (24 ÷ 12). Cada mol de C dá 1 mol de CO₂, que tem 44 g: 2 × 44 = 88 g.',
    adaptada: { x: 'Queimamos 24 g de carbono.\nTodo o carbono vira CO₂.', pergunta: 'Qual é a massa de CO₂ formada?', dados: 'C = 12; O = 16' } },
  { texto: 'Na reação N₂ + 3 H₂ → 2 NH₃, quantos mols de amônia se formam a partir de 6 mol de H₂?', pagina: 142, alt: ALT_ESTEQ[1], certa: 1,
    resolucao: 'A proporção é 3 H₂ para 2 NH₃. Com 6 mol de H₂, o dobro da equação: 4 mol de NH₃.',
    adaptada: { x: 'A reação é N₂ + 3 H₂ → 2 NH₃.\nTemos 6 mol de H₂.', pergunta: 'Quantos mols de NH₃ se formam?' } },
  { texto: 'Calcule a massa de água produzida na combustão de 8 g de gás hidrogênio. (H = 1; O = 16)', pagina: 145, alt: ALT_ESTEQ[2], certa: 2,
    resolucao: '8 g de H₂ são 4 mol (8 ÷ 2). 2 H₂ dão 2 H₂O, então 4 mol de H₂ dão 4 mol de água: 4 × 18 = 72 g.',
    adaptada: { x: 'Queimamos 8 g de gás hidrogênio.\nO produto é água.', pergunta: 'Qual é a massa de água formada?', dados: 'H = 1; O = 16' } },
  { texto: 'Em 2 Al + 3 Cl₂ → 2 AlCl₃, com 54 g de Al e 71 g de Cl₂, qual é o reagente limitante? (Al = 27; Cl = 35,5)', pagina: 151, alt: ALT_ESTEQ[3], certa: 1,
    resolucao: '54 g de Al são 2 mol e pediriam 3 mol de Cl₂; só há 1 mol de Cl₂ (71 ÷ 71). O cloro acaba primeiro.',
    adaptada: { x: 'A reação é 2 Al + 3 Cl₂ → 2 AlCl₃.\nTemos 54 g de Al e 71 g de Cl₂.', pergunta: 'Qual reagente acaba primeiro?', dados: 'Al = 27; Cl = 35,5' } },
  { texto: 'Uma reação com rendimento teórico de 50 g produziu 40 g. Qual foi o rendimento percentual?', pagina: 151, alt: ALT_ESTEQ[4], certa: 2,
    resolucao: 'Rendimento = real ÷ teórico × 100 = 40 ÷ 50 × 100 = 80%.',
    adaptada: { x: 'A conta prevê 50 g de produto.\nNa prática, saíram 40 g.', pergunta: 'Qual foi o rendimento, em porcentagem?' } },
  { texto: 'Quantos mols de moléculas há em 88 g de gás carbônico? (C = 12; O = 16)', pagina: 145, alt: ['1 mol', '2 mol', '4 mol', '44 mol'], certa: 1,
    resolucao: 'A massa molar do CO₂ é 44 g/mol: 88 ÷ 44 = 2 mol.',
    adaptada: { x: 'Temos 88 g de CO₂.', pergunta: 'Quantos mols são?', dados: 'C = 12; O = 16' } },
  { texto: 'Na queima do metano, CH₄ + 2 O₂ → CO₂ + 2 H₂O, que massa de oxigênio é consumida por 16 g de CH₄? (C = 12; H = 1; O = 16)', pagina: 146, alt: ['16 g', '32 g', '64 g', '48 g'], certa: 2,
    resolucao: '16 g de CH₄ são 1 mol, que consome 2 mol de O₂: 2 × 32 = 64 g.',
    adaptada: { x: 'A reação é CH₄ + 2 O₂ → CO₂ + 2 H₂O.\nQueimamos 16 g de metano.', pergunta: 'Quanto O₂ é gasto?', dados: 'C = 12; H = 1; O = 16' } },
  { texto: 'Na decomposição 2 H₂O₂ → 2 H₂O + O₂, quantos mols de oxigênio se formam a partir de 4 mol de água oxigenada?', pagina: 142, alt: ['1 mol', '2 mol', '4 mol', '8 mol'], certa: 1,
    resolucao: 'A proporção é 2 H₂O₂ para 1 O₂. Com 4 mol de H₂O₂, formam-se 2 mol de O₂.',
    adaptada: { x: 'A reação é 2 H₂O₂ → 2 H₂O + O₂.\nTemos 4 mol de H₂O₂.', pergunta: 'Quantos mols de O₂ se formam?' } },
  { texto: '4 g de H₂ reagem com 40 g de O₂ e formam água. Que massa de oxigênio sobra no fim? (H = 1; O = 16)', pagina: 151, alt: ['0 g', '4 g', '8 g', '16 g'], certa: 2,
    resolucao: '4 g de H₂ são 2 mol e consomem 1 mol de O₂ (32 g). Dos 40 g, sobram 40 − 32 = 8 g.',
    adaptada: { x: '4 g de H₂ reagem com 40 g de O₂.\nO produto é água.', pergunta: 'Quanto O₂ sobra?', dados: 'H = 1; O = 16' } },
  { texto: 'Em N₂ + 3 H₂ → 2 NH₃, 28 g de N₂ dariam 34 g de amônia. Com rendimento de 75%, quanto de amônia se obtém?', pagina: 152, alt: ['17 g', '25,5 g', '28 g', '34 g'], certa: 1,
    resolucao: 'O teórico é 34 g; com 75% de rendimento, 34 × 0,75 = 25,5 g.',
    adaptada: { x: 'A reação é N₂ + 3 H₂ → 2 NH₃.\nCom 28 g de N₂, a conta prevê 34 g de NH₃.\nO rendimento foi de 75%.', pergunta: 'Quanto de NH₃ saiu?' } },
]

/* "Mais difícil": as questões 1, 3, 6 e 8 viram problemas de duas etapas; o resto fica igual. */
const DIFICEIS: Record<number, QuestaoProva> = {
  0: { texto: 'Queimam-se 36 g de carbono com oxigênio em excesso. Que volume de CO₂ se forma, nas CNTP? (C = 12; volume molar = 22,4 L)', pagina: 146, alt: ['22,4 L', '44,8 L', '67,2 L', '134,4 L'], certa: 2,
    adaptada: { x: 'Queimamos 36 g de carbono.\nTodo o carbono vira CO₂.', pergunta: 'Que volume de CO₂ se forma, nas CNTP?', dados: 'C = 12; 1 mol de gás = 22,4 L' } },
  2: { texto: 'Aquecem-se 20 g de calcário com 80% de CaCO₃: CaCO₃ → CaO + CO₂. Que massa de CaO se forma? (Ca = 40; C = 12; O = 16)', pagina: 152, alt: ['5,6 g', '8,96 g', '11,2 g', '16 g'], certa: 1,
    adaptada: { x: 'Temos 20 g de calcário.\nSó 80% dele é CaCO₃.\nA reação é CaCO₃ → CaO + CO₂.', pergunta: 'Qual é a massa de CaO formada?', dados: 'Ca = 40; C = 12; O = 16' } },
  5: { texto: 'Quantas moléculas há em 88 g de gás carbônico? (C = 12; O = 16; 1 mol = 6 × 10²³)', pagina: 145, alt: ['6 × 10²³', '1,2 × 10²⁴', '2,4 × 10²⁴', '5,3 × 10²⁵'], certa: 1,
    adaptada: { x: 'Temos 88 g de CO₂.', pergunta: 'Quantas moléculas são?', dados: 'C = 12; O = 16; 1 mol = 6 × 10²³' } },
  7: { texto: 'Na decomposição 2 H₂O₂ → 2 H₂O + O₂, que massa de oxigênio se forma a partir de 68 g de água oxigenada? (H = 1; O = 16)', pagina: 145, alt: ['16 g', '32 g', '64 g', '68 g'], certa: 1,
    adaptada: { x: 'A reação é 2 H₂O₂ → 2 H₂O + O₂.\nTemos 68 g de H₂O₂.', pergunta: 'Qual é a massa de O₂ formada?', dados: 'H = 1; O = 16' } },
}

/** As questões da prova em cada variante: a original; a mais difícil (4 trocadas); a versão B (outra ordem, alternativas giradas). */
export function questoesDa(variante?: 'dificil' | 'b'): QuestaoProva[] {
  if (variante === 'dificil') return QUESTOES_PROVA.map((q, i) => DIFICEIS[i] ?? q)
  if (variante === 'b') return [...QUESTOES_PROVA].reverse().map((q) => ({ ...q, alt: [...q.alt.slice(1), q.alt[0]], certa: (q.certa + q.alt.length - 1) % q.alt.length }))
  return QUESTOES_PROVA
}

export const FONTES_PROVA = [
  { tipo: 'material' as const, titulo: 'Química 2 — Proporção em massa e em mol', pagina: 142 },
  { tipo: 'material' as const, titulo: 'Química 2 — Cálculos com massa molar', pagina: 145 },
  { tipo: 'material' as const, titulo: 'Química 2 — Combustão e consumo de oxigênio', pagina: 146 },
  { tipo: 'material' as const, titulo: 'Química 2 — Reagente limitante e excesso', pagina: 151 },
  { tipo: 'material' as const, titulo: 'Química 2 — Rendimento de reação', pagina: 152 },
]

/* ── O que muda na demonstração (12ª rodada, 04/10/2026) ───────────────────────────────────────────────────
   Uma fatia do estado da demonstração (dados/demo/nucleo.ts): "Recomeçar" zera, e duas abas andam juntas.
   Guarda os documentos NOVOS (como receita: de qual partiram, para que turma, com que título e de quem são), o
   documento que cada conversa gerou, os nomes trocados e os apagados.
   O ESTADO de aprovação (Para aprovar · Aprovado · Recusado) NÃO mora aqui: mora em dados/envios.ts, que registra
   quem aprovou e manda à turma. Daqui sai só o estado de partida dos documentos antigos (`estadoDe`). */

type Receita = { id: string; baseId: string; turmaId: string; de?: string; titulo?: string; professorId: string; em: [number, number]; questoes?: number; origem?: 'arquivo' }
type Ligacao = { docId: string; valores?: Record<string, unknown> }
type Criados = { receitas: Receita[]; conversas: Record<string, Ligacao>; titulos: Record<string, string>; apagados: string[] }

const fatia = criarFatia<Criados>('criados', { receitas: [], conversas: {}, titulos: {}, apagados: [] })

/** O mesmo documento, pedido para outra turma: o nome da turma muda no texto, e as datas da turma de origem saem
    (a aula "terça, 22/09" é do calendário do 2ºB, não do 2ºA). */
function paraOutraTurma(blocos: Bloco[], de: string, para: string): Bloco[] {
  const semData = (x: string) => x.replace(/\s·\s(?:segunda|terça|quarta|quinta|sexta)(?:-feira)?,\s\d{2}\/\d{2}/gi, '')
  const trocados = JSON.parse(JSON.stringify(blocos).split(de).join(para)) as Bloco[]
  return trocados.map((b) => (b.t === 'sub' || b.t === 'nota' ? { ...b, x: semData(b.x) } : b))
}

const POR_EXTENSO: Record<number, string> = { 5: 'Cinco', 10: 'Dez', 15: 'Quinze' }

const montados = new Map<string, ItemBiblioteca>()
function montar(r: Receita): ItemBiblioteca {
  const chave = JSON.stringify(r)
  const pronto = montados.get(chave)
  if (pronto) return pronto
  const base = BIBLIOTECA.find((b) => b.id === r.baseId) ?? BIBLIOTECA[0]
  /* a 3ºA (au-3a) não está em TURMAS: o nome vem da estrutura da escola, e não cai no 2ºB */
  const t = turmaDe(r.turmaId).id === r.turmaId ? turmaDe(r.turmaId).nome : nomeDaTurma(r.turmaId)
  const item: ItemBiblioteca = {
    ...base, n: 1000 + fatia.ler().receitas.findIndex((x) => x.id === r.id), id: r.id, turmaId: r.turmaId, turma: t,
    titulo: r.titulo ?? base.titulo, folha: undefined, de: r.de ?? base.de, em: r.em, estado: 'espera', versaoDe: undefined,
    base: base.id, variante: undefined, professorId: r.professorId,
    // o documento tem as questões do modelo: o rótulo não promete mais do que a folha mostra
    detalhe: r.questoes ? `${Math.min(r.questoes, base.blocos.filter((x) => x.t === 'questao').length || r.questoes)} ${base.de === 'prova' ? 'questões' : 'exercícios'}` : base.detalhe,
    blocos: r.turmaId !== base.turmaId ? paraOutraTurma(base.blocos, base.turma, t) : base.blocos,
    ...(r.origem ? { origem: r.origem } : {}),
  }
  /* o que veio de arquivo: a folha leva o nome do arquivo (o título), e não o do modelo */
  if (r.origem === 'arquivo') item.blocos = item.blocos.map((b) => (b.t === 'destaque' ? { ...b, x: item.titulo } : b))
  /* o simulado sai com o número de questões escolhido no cartão (5, 10 ou 15), e a nota diz o mesmo número */
  if ((r.de ?? base.de) === 'simulado' && r.questoes) {
    const n = Math.min(r.questoes, base.blocos.filter((b) => b.t === 'questao').length)
    item.blocos = base.blocos.filter((b) => b.t !== 'questao' || b.n <= n)
      .map((b) => (b.t === 'nota' ? { ...b, x: `${POR_EXTENSO[n] ?? n} questões de Ciências da Natureza, no formato do ENEM.` } : b))
    item.detalhe = `${n} questões`
  }
  /* a atividade nova de Química é a MESMA que o aluno vai responder (dados/questoes.ts, LISTA_ESTEQUIOMETRIA): o que
     a professora aprova é o que chega à turma, palavra por palavra */
  if ((r.de ?? base.de) === 'atividade' && r.turmaId !== '9a') {
    // a revisão de massa em mol cobra só o assunto do sinal (p. 145); os outros pedidos, a lista de estequiometria
    const qs = (ehRevisaoDeMassaEmMol(r.id) || ehRevisaoDeMassaEmMol(item.titulo) ? REVISAO_MASSA_MOL : LISTA_ESTEQUIOMETRIA).questoes
    item.blocos = [
      { t: 'identificacao' },
      { t: 'nota', x: 'Do fácil ao difícil. Mostre o cálculo de cada exercício.' },
      ...qs.map((q, i): Bloco => ({ t: 'questao', n: i + 1, x: q.enunciado, alt: q.alternativas, pagina: q.pagina, certa: q.certa })),
    ]
    item.detalhe = `${qs.length} exercícios`
  }
  montados.set(chave, item)
  return item
}

/** Todos os documentos (os de antes e os novos), sem os apagados, com o nome que o professor deu. */
function todos(c: Criados): ItemBiblioteca[] {
  const novos = [...c.receitas].reverse().map(montar)
  return [...novos, ...BIBLIOTECA].filter((b) => !c.apagados.includes(b.id)).map((b) => (c.titulos[b.id] ? { ...b, titulo: c.titulos[b.id] } : b))
}

/** Um documento pelo id em slug ou pelo número (`/professor/criados/1` também abre a prova). Apagado não abre. */
export const documentoDe = (idOuN: string | undefined): ItemBiblioteca | undefined =>
  idOuN ? todos(fatia.ler()).find((b) => b.id === idOuN || String(b.n) === idOuN) : undefined

/** O mesmo, como hook (relê quando um documento nasce, muda de nome ou é apagado). */
export function useDocumentoBiblioteca(idOuN: string | undefined): ItemBiblioteca | undefined {
  const c = fatia.useValor()
  return useMemo(() => (idOuN ? todos(c).find((b) => b.id === idOuN || String(b.n) === idOuN) : undefined), [c, idOuN])
}

/** Os documentos do professor da sessão, do mais novo para o mais velho (a lista de Criados). A versão adaptada não é
    linha: mora dentro do documento de origem. */
export function useCriados(): ItemBiblioteca[] {
  const c = fatia.useValor()
  const { professorId } = fatiaSessao.useValor()
  return useMemo(() => todos(c).filter((b) => !b.versaoDe && (b.professorId ?? 'camila') === professorId)
    .sort((a, b) => (b.em[1] * 100 + b.em[0]) - (a.em[1] * 100 + a.em[0]) || b.n - a.n), [c, professorId])
}

/** O estado de partida de um documento antigo: "Rascunho" e "Para aprovar" são a mesma coisa (só você vê). */
export const estadoDe = (b: ItemBiblioteca): 'aprovado' | 'espera' => (b.estado === 'aprovado' ? 'aprovado' : 'espera')

/** O documento que uma conversa gerou (e o que estava no cartão), se ela já gerou. */
export const documentoDaConversa = (conversaId: string): Ligacao | undefined => {
  const l = fatia.ler().conversas[conversaId]
  return l && documentoDe(l.docId) ? l : undefined
}

const slug = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)

export const documentos = {
  /** Um documento novo em Criados, feito a partir de outro (o mesmo tipo, para a turma e o tema do pedido). Nasce
      com a data de hoje e é do professor da sessão. Pedir de novo o mesmo título para a mesma turma devolve o mesmo id. */
  criar(baseId: string, o: { turmaId: string; de?: string; titulo?: string; questoes?: number; origem?: 'arquivo' }): string {
    const base = BIBLIOTECA.find((b) => b.id === baseId) ?? BIBLIOTECA[0]
    const id = slug([o.titulo ?? base.titulo, o.turmaId !== base.turmaId || o.titulo ? o.turmaId : ''].filter(Boolean).join(' '))
    const c = fatia.ler()
    if (c.receitas.some((r) => r.id === id)) {
      if (c.apagados.includes(id)) fatia.mudar((x) => ({ ...x, apagados: x.apagados.filter((a) => a !== id) }))
      return id
    }
    if (BIBLIOTECA.some((b) => b.id === id)) return id
    const receita: Receita = { id, baseId: base.id, turmaId: o.turmaId, de: o.de, titulo: o.titulo, questoes: o.questoes, ...(o.origem ? { origem: o.origem } : {}), professorId: fatiaSessao.ler().professorId, em: HOJE }
    fatia.mudar((x) => ({ ...x, receitas: [...x.receitas, receita] }))
    return id
  },
  /** A conversa gerou este documento: reaberta (ou depois de recarregar), ela abre pronta, com ele ao lado. */
  ligarConversa(conversaId: string, docId: string, valores?: Record<string, unknown>) {
    fatia.mudar((x) => ({ ...x, conversas: { ...x.conversas, [conversaId]: { docId, valores: valores ?? x.conversas[conversaId]?.valores } } }))
  },
  renomear(id: string, titulo: string) {
    const limpo = titulo.trim()
    if (limpo && limpo !== documentoDe(id)?.titulo) fatia.mudar((x) => ({ ...x, titulos: { ...x.titulos, [id]: limpo } }))
  },
  apagar(id: string) {
    fatia.mudar((x) => (x.apagados.includes(id) ? x : { ...x, apagados: [...x.apagados, id] }))
  },
}

/* ── O documento no modelo Geekie One e Plurall (14ª rodada, 05/10/2026; plano ux-composicao, seção 3) ─────────
   Só acréscimo. Cada documento ganha, quando precisa, uma ESTRUTURA (objetivos, habilidades com código e texto, as
   aulas com os momentos e os minutos, recursos, como avaliar, duração, capítulo, matéria, as notas dos slides), o
   gabarito e a resolução das questões. Quem desenha é `turmma/documento.tsx`; daqui saem os ajudantes:
   `tipoDocumento`, `metadadosDe`, `questoesDoDocumento`, `aulasDoPlano`, `semanasDoPlano`, `rubricaDe`, `slidesDe`,
   `estruturaDe` e `conversaDoDocumento`. Os minutos de cada aula somam a duração dela (conferido em `aulasDoPlano`). */

export type HabilidadeDoc = { codigo: string; texto: string }
export type MomentoDoc = { minutos?: number; nome: string; texto?: string; pagina?: number; pratique?: boolean }
export type AulaDoc = { id: string; titulo: string; duracao?: number; momentos: MomentoDoc[] }
export type LinhaSemana = { data: string; dia: string; conteudo: string; habilidade?: string; pagina?: string; selo?: 'prova' | 'sem-aula' | 'devolutiva' }
export type SemanaDoc = { titulo: string; linhas: LinhaSemana[] }
export type EstruturaDoc = {
  materia?: string
  /** "Química 2, cap. 7" */
  capitulo?: string
  /** "50 min", "2 aulas de 50 min" */
  duracao?: string
  objetivos?: string[]
  habilidades?: HabilidadeDoc[]
  aulas?: AulaDoc[]
  semanas?: SemanaDoc[]
  paraCasa?: string
  recursos?: string
  avaliar?: string
  /** o que vem depois da tabela do bimestre */
  depois?: string
  /** o nível de cada questão, na ordem */
  niveis?: string[]
  /** as notas do professor de cada slide (pelo número) */
  notas?: Record<number, string>
}

/** O texto de cada habilidade, como a escola a chama (dados/escola, HABILIDADES), e as que só aparecem aqui. */
const TEXTO_HABILIDADE: Record<string, string> = {
  EM13CNT101: 'Conservação da massa e proporções', EM13CNT104: 'Cálculo com mol e massa molar', EM13CNT205: 'Interpretar equação balanceada',
  EM13CNT301: 'Reagente limitante e excesso', EM13CNT302: 'Rendimento de reação', EM13CNT201: 'Comparar modelos científicos de épocas diferentes',
  EM13CNT307: 'Soluções: concentração e diluição',
}
const hab = (codigo: string): HabilidadeDoc => ({ codigo, texto: TEXTO_HABILIDADE[codigo] ?? codigo })

/** A habilidade de cada página do capítulo 7 de Química 2 (o metadado de cada questão). */
const HABILIDADE_DA_PAGINA: Record<number, string> = {
  138: 'EM13CNT205', 139: 'EM13CNT205', 141: 'EM13CNT101', 142: 'EM13CNT101', 144: 'EM13CNT104', 145: 'EM13CNT104', 146: 'EM13CNT104',
  150: 'EM13CNT301', 151: 'EM13CNT301', 152: 'EM13CNT302', 153: 'EM13CNT301',
}

export const ESTRUTURA: Record<string, EstruturaDoc> = {
  'prova-estequiometria': {
    materia: 'Química', capitulo: 'Química 2, cap. 7', duracao: '50 min',
    niveis: ['fácil', 'fácil', 'médio', 'difícil', 'fácil', 'fácil', 'médio', 'médio', 'difícil', 'difícil'],
  },
  'lista-mol-massa-molar': {
    materia: 'Química', capitulo: 'Química 2, cap. 7', duracao: 'para casa',
    niveis: ['fácil', 'fácil', 'médio', 'fácil', 'médio', 'médio', 'difícil', 'difícil'],
  },
  'revisao-para-o-simulado': { materia: 'Química', capitulo: 'Química 2, cap. 6 e 7', duracao: '50 min' },
  'diagnostica-estequiometria': { materia: 'Química', duracao: '15 min' },
  'prova-modelos-atomicos': { materia: 'Química', capitulo: 'Química 1, cap. 3', duracao: '50 min' },
  'simulado-enem-estequiometria': { materia: 'Ciências da Natureza', duracao: '3 min por questão' },
  'modelo-prova-anexada': { materia: 'Química', duracao: '50 min' },
  'modelo-prova-fisica': { materia: 'Física', duracao: '50 min' },
  'plano-reagente-limitante': {
    materia: 'Química', capitulo: 'Química 2, cap. 7', duracao: '2 aulas de 50 min',
    objetivos: ['Achar o reagente limitante de uma reação, dadas as massas dos reagentes', 'Calcular quanto sobra do reagente em excesso'],
    habilidades: [hab('EM13CNT301')],
    aulas: [
      { id: 'aula-1', titulo: 'Aula 1 · terça, 22/09', duracao: 50, momentos: [
        { minutos: 10, nome: 'Abertura: a receita de bolo', texto: 'Com 6 ovos e 1 kg de farinha, quantos bolos saem? O ingrediente que acaba primeiro manda na conta.' },
        { minutos: 15, nome: 'Proporção em mol', texto: 'Da receita aos coeficientes: ler 2 H₂ + O₂ → 2 H₂O como proporção entre quantidades.', pagina: 150 },
        { minutos: 25, nome: 'Três exemplos na lousa', texto: 'Dadas as massas de dois reagentes, achar o limitante, o excesso e a massa de produto.' },
      ] },
      { id: 'aula-2', titulo: 'Aula 2 · quinta, 24/09', duracao: 50, momentos: [
        { minutos: 35, nome: 'Prática em dupla', texto: 'Quatro problemas com reagente em excesso. Circule pela sala e ouça o raciocínio das duplas.', pagina: 151, pratique: true },
        { minutos: 15, nome: 'Fechamento: ponte para rendimento', texto: 'Por que o produto real fica abaixo do teórico.' },
      ] },
    ],
    paraCasa: 'Exercícios 4 a 9 do capítulo · p. 153',
    recursos: 'Química 2, p. 150, 151 e 153 · lousa · calculadora',
    avaliar: 'Bilhete de saída no fim da aula 1: qual ingrediente manda na conta? Na aula 2, o raciocínio das duplas.',
  },
  'modelos-atomicos-aula-1': {
    materia: 'Química', capitulo: 'Química 1, cap. 3', duracao: '1 aula de 50 min',
    objetivos: ['Reconhecer que um modelo científico muda quando uma evidência nova não cabe nele', 'Comparar o que os modelos de Dalton e de Thomson explicam'],
    habilidades: [hab('EM13CNT201')],
    aulas: [
      { id: 'aula-1', titulo: 'Aula 1 · quarta, 02/09', duracao: 50, momentos: [
        { minutos: 10, nome: 'A caixa fechada', texto: 'Cada grupo recebe uma caixa lacrada com um objeto dentro e descreve o que há ali sem abrir. É assim que se estuda o átomo.', pratique: true },
        { minutos: 15, nome: 'Dalton: a esfera maciça', texto: 'O que o modelo de 1808 explicava: a conservação da massa e as proporções fixas.' },
        { minutos: 15, nome: 'Thomson: o elétron', texto: 'O tubo de raios catódicos e a descoberta, em 1897, de uma partícula negativa menor que o átomo. O "pudim de passas".' },
        { minutos: 10, nome: 'Fechamento', texto: 'Linha do tempo no caderno: o que cada modelo explica e o que ele deixa sem explicar.' },
      ] },
    ],
    paraCasa: 'Ler sobre o experimento de Rutherford com a lâmina de ouro',
    recursos: 'Uma caixa lacrada por grupo · projetor · Química 1, cap. 3',
    avaliar: 'A linha do tempo no caderno: cada modelo com uma coisa que explica e uma que não explica.',
  },
  'modelo-sequencia': {
    materia: 'Química', capitulo: 'Química 2, cap. 7', duracao: '4 aulas de 50 min',
    objetivos: ['Achar o reagente limitante e o que sobra em excesso', 'Ligar o limitante ao rendimento de uma reação'],
    habilidades: [hab('EM13CNT301'), hab('EM13CNT104')],
    aulas: [
      { id: 'aula-1', titulo: 'Aula 1', duracao: 50, momentos: [
        { minutos: 15, nome: 'A receita de bolo', texto: 'Com 6 ovos e 1 kg de farinha, quantos bolos saem?', pagina: 150 },
        { minutos: 25, nome: 'Da receita à proporção em mol', texto: 'Os coeficientes como receita: quanto de cada reagente a equação pede.' },
        { minutos: 10, nome: 'Bilhete de saída', texto: 'Qual ingrediente manda na conta?' },
      ] },
      { id: 'aula-2', titulo: 'Aula 2', duracao: 50, momentos: [
        { minutos: 30, nome: 'Achar o limitante por comparação', texto: 'Quanto produto cada reagente renderia. Três exemplos na lousa.', pagina: 150 },
        { minutos: 20, nome: 'Dois exercícios no caderno', texto: 'Corrigidos em dupla.', pratique: true },
      ] },
      { id: 'aula-3', titulo: 'Aula 3', duracao: 50, momentos: [
        { minutos: 35, nome: 'Reagente em excesso', texto: 'Quanto sobra: quatro problemas graduados, em dupla.', pagina: 151, pratique: true },
        { minutos: 15, nome: 'Cada dupla explica um problema', texto: 'Para a turma, na lousa.' },
      ] },
      { id: 'aula-4', titulo: 'Aula 4', duracao: 50, momentos: [
        { minutos: 30, nome: 'Do limitante ao rendimento', texto: 'Por que o produto real fica abaixo do teórico.', pagina: 152 },
        { minutos: 20, nome: 'Cinco questões objetivas', texto: 'Corrigidas pelo Assistente e aprovadas por você.' },
      ] },
    ],
    paraCasa: 'Depois da aula 2: exercícios 1 a 3 do capítulo. Depois da aula 3: exercícios 4 a 9 · p. 153',
    recursos: 'Química 2, p. 150 a 153 · lousa · calculadora',
    avaliar: 'O bilhete da aula 1 e as cinco objetivas da aula 4.',
  },
  'plano-de-recuperacao': {
    materia: 'Química', capitulo: 'Química 2, cap. 7', duracao: '2 semanas',
    objetivos: ['Retomar a conversão entre grama, mol e partículas', 'Retomar o reagente limitante, um passo por vez'],
    habilidades: [hab('EM13CNT104'), hab('EM13CNT301')],
    aulas: [
      { id: 'semana-1', titulo: 'Semana 1 · EM13CNT104, cálculo com mol e massa molar', momentos: [
        { minutos: 25, nome: 'Aula 1 · Retomada', texto: 'A tabela de conversão entre grama, mol e número de partículas, montada com a turma na lousa.', pagina: 145 },
        { minutos: 50, nome: 'Aula 2 · Oito exercícios graduados', texto: 'Do cálculo direto de massa molar ao problema em duas etapas. Em dupla, com a tabela na mão.', pratique: true },
      ] },
      { id: 'semana-2', titulo: 'Semana 2 · EM13CNT301, reagente limitante e excesso', momentos: [
        { minutos: 25, nome: 'Aula 3 · A receita de bolo, de novo', texto: 'Quem acaba primeiro manda na conta: da receita à equação balanceada.', pagina: 150 },
        { minutos: 50, nome: 'Aula 4 · Seis exercícios graduados', texto: 'Achar o limitante, depois o excesso, depois a massa de produto. Um passo novo por exercício.', pratique: true },
      ] },
    ],
    recursos: 'Química 2, p. 145 e 150 · a tabela de conversão impressa',
    avaliar: 'Cinco questões objetivas no fim da segunda semana, corrigidas pelo Assistente e aprovadas pela professora.',
  },
  'planejamento-do-bimestre': {
    materia: 'Química', capitulo: 'Química 2, cap. 7 a 9', duracao: '37 aulas',
    objetivos: ['Fechar a estequiometria com o reagente limitante e o rendimento', 'Abrir soluções: solubilidade, concentração e diluição'],
    habilidades: [hab('EM13CNT301'), hab('EM13CNT302'), hab('EM13CNT307')],
    semanas: [
      { titulo: 'Semana 1 · 22 a 25/09', linhas: [
        { data: '22/09', dia: 'ter', conteudo: 'Reagente limitante: a ideia, com a receita de bolo', habilidade: 'EM13CNT301', pagina: '150' },
        { data: '24/09', dia: 'qui', conteudo: 'Reagente em excesso: prática em dupla', habilidade: 'EM13CNT301', pagina: '151' },
        { data: '25/09', dia: 'sex', conteudo: 'Rendimento de reação: teórico e real', habilidade: 'EM13CNT302', pagina: '152' },
      ] },
      { titulo: 'Semana 2 · 29/09 a 02/10', linhas: [
        { data: '29/09', dia: 'ter', conteudo: 'Revisão do capítulo 7', habilidade: 'EM13CNT301', pagina: '153' },
        { data: '01/10', dia: 'qui', conteudo: 'Prova do capítulo 7', selo: 'prova' },
        { data: '02/10', dia: 'sex', conteudo: 'Correção da prova com a turma e retomada do que travou', selo: 'devolutiva' },
      ] },
      { titulo: 'Semana 3 · 06 a 09/10', linhas: [
        { data: '06/10', dia: 'ter', conteudo: 'Cap. 8 · Soluções: soluto, solvente e solubilidade', habilidade: 'EM13CNT307', pagina: '158' },
        { data: '08/10', dia: 'qui', conteudo: 'Curva de solubilidade: ler e interpretar o gráfico', habilidade: 'EM13CNT307', pagina: '160' },
        { data: '09/10', dia: 'sex', conteudo: 'Concentração comum, em g/L', habilidade: 'EM13CNT307', pagina: '163' },
      ] },
      { titulo: 'Semana 4 · 13 a 16/10', linhas: [
        { data: '13/10', dia: 'ter', conteudo: 'Concentração em mol/L', habilidade: 'EM13CNT307', pagina: '166' },
        { data: '15/10', dia: 'qui', conteudo: 'Dia do Professor', selo: 'sem-aula' },
        { data: '16/10', dia: 'sex', conteudo: 'Diluição: prática com suco em pó', habilidade: 'EM13CNT307', pagina: '169' },
      ] },
    ],
    depois: 'As 11 aulas acima vão até 16/10 (15/10 é feriado escolar). As outras 26, até o fim do bimestre, seguem o capítulo 8 e o 9 no mesmo ritmo: três aulas por semana, às terças, quintas e sextas. Nada foi salvo na Agenda ainda.',
    recursos: 'Química 2, cap. 7 a 9 · laboratório na semana 4 (diluição)',
    avaliar: 'Prova do capítulo 7 em 01/10; a do capítulo 8 fica para o fim de outubro.',
  },
  'resumo-balanceamento': { materia: 'Química', capitulo: 'Química 2, cap. 7', duracao: '1 página' },
  'modelo-texto-apoio': { materia: 'Química', capitulo: 'Química 2, cap. 7', duracao: '1 página' },
  'modelo-folha-revisao': { materia: 'Química', capitulo: 'Química 2, cap. 7', duracao: '1 página' },
  'mapa-estequiometria': { materia: 'Química', capitulo: 'Química 2, cap. 7' },
  'rendimento-de-reacao': {
    materia: 'Química', capitulo: 'Química 2, cap. 7', duracao: '20 min',
    notas: {
      1: 'Abra com a pergunta: se a conta diz 50 g, por que no laboratório sai menos? Deixe a turma chutar antes de responder.',
      2: 'Lembre que o teórico sai da proporção em mol (p. 142). É o teto, nunca o resultado do balão.',
      3: 'Peça um exemplo de perda que eles já viram: o bolo que gruda na forma é um bom começo.',
      4: 'A amônia mostra a reação reversível: o gás que sobra volta ao reator. É o caso da indústria.',
      5: 'Faça a conta junto com a turma e deixe a fórmula na lousa para a lista de casa.',
    },
  },
  'rubrica-lavoisier': { materia: 'Química', capitulo: 'Química 1, cap. 2', duracao: '1 questão discursiva' },
  'proposta-residuos-quimicos': { materia: 'Química', capitulo: 'Química 2, cap. 10', duracao: '20 a 30 linhas' },
}

/** O gabarito (a certa de cada questão, 0 = A) dos documentos que não são a prova de hoje. */
const GABARITOS: Record<string, number[]> = {
  'revisao-para-o-simulado': [2, 1, 2, 3, 3, 2],
  'diagnostica-estequiometria': [2, 1, 2, 1, 1, 1],
  'prova-modelos-atomicos': [0, 1, 1, 1, 0],
  'simulado-enem-estequiometria': [3, 2, 3, 2, 1, 0, 1, 3, 2, 2, 1, 1, 3, 2, 1],
  'modelo-prova-anexada': [2, 1, 1, 2, 1, 1, 1, 1],
  'modelo-prova-fisica': [1, 2, 1, 2, 1, 1, 1, 2, 1, 1],
}

/** A resolução em uma linha das listas de Química (pela posição) e dos exercícios das listas geradas (pelo enunciado). */
const RESOLUCOES: Record<string, string[]> = {
  'lista-mol-massa-molar': [
    'A água tem 18 g/mol: 36 ÷ 18 = 2 mol.',
    'CaCO₃ tem 40 + 12 + 48 = 100 g/mol: 0,5 × 100 = 50 g.',
    '88 g de CO₂ são 2 mol (88 ÷ 44): 2 × 6,02 × 10²³ = 1,2 × 10²⁴ moléculas.',
    '2 × 1 + 32 + 4 × 16 = 98 g/mol.',
    'C₉H₈O₄ tem 180 g/mol: 0,5 g ÷ 180 = 2,8 × 10⁻³ mol.',
    'Ferro: 10 ÷ 56 = 0,18 mol. Alumínio: 10 ÷ 27 = 0,37 mol. Há mais átomos no alumínio.',
    'Cada CH₄ tem 4 H: 0,25 × 4 = 1 mol de H, ou 6,02 × 10²³ átomos.',
    '75% de 4,0 g são 3,0 g de ouro: 3,0 ÷ 197 = 0,015 mol, ou 9,2 × 10²¹ átomos.',
  ],
  'revisao-para-o-simulado': [
    '4 Fe + 3 O₂ → 2 Fe₂O₃: 4 + 3 + 2 = 9.',
    'A massa se conserva: 10 − 5,6 = 4,4 g de CO₂.',
    '6 × 12 + 12 × 1 + 6 × 16 = 180 g/mol.',
    'C₂H₅OH + 3 O₂ → 2 CO₂ + 3 H₂O: cada mol de etanol pede 3 mol de O₂; 2 mol pedem 6 mol.',
    '245 g de KClO₃ são 2 mol, que liberam 3 mol de O₂: 3 × 32 = 96 g.',
    'A proporção é fixa: 2 g de H para 16 g de O; 5 g de H pedem 40 g de O.',
  ],
  'modelo-folha-revisao': [
    'H₂ + Cl₂ → 2 HCl.',
    'N₂ + 3 H₂ → 2 NH₃. 3 mol de H₂ formam 2 mol de NH₃.',
    'C₂H₅OH + 3 O₂ → 2 CO₂ + 3 H₂O.',
  ],
}
/** O assunto de cada questão em poucas palavras, para os resultados ("5 · Mols num comprimido"), como o Geekie. */
const TEMAS: Record<string, string[]> = {
  'lista-mol-massa-molar': ['Mols de água', 'Massa de CaCO₃', 'Moléculas de CO₂', 'Massa molar do H₂SO₄', 'Mols num comprimido', 'Átomos de ferro e alumínio', 'Átomos de H no metano', 'Átomos de ouro'],
  'revisao-para-o-simulado': ['Balanceamento', 'Conservação da massa', 'Massa molar da glicose', 'Mols de O₂ no etanol', 'Massa de O₂ liberada', 'Lei de Proust'],
}
const TEMA_DO_ENUNCIADO: Record<string, string> = {
  'Qual a massa de CO₂ formada na queima completa de 24 g de carbono? (C = 12; O = 16)': 'Massa de CO₂',
  'Na reação N₂ + 3 H₂ → 2 NH₃, quantos mols de amônia se formam a partir de 6 mol de H₂?': 'Mols de amônia',
  'Calcule a massa de água produzida na combustão de 8 g de gás hidrogênio. (H = 1; O = 16)': 'Massa de água',
  'Em 2 Al + 3 Cl₂ → 2 AlCl₃, com 54 g de Al e 71 g de Cl₂, qual é o reagente limitante? (Al = 27; Cl = 35,5)': 'Reagente limitante',
  'Uma reação com rendimento teórico de 50 g produziu 40 g. Qual foi o rendimento percentual?': 'Rendimento',
  'Quantos mols de moléculas há em 88 g de gás carbônico? (C = 12; O = 16)': 'Mols de CO₂',
  'Na queima do metano, CH₄ + 2 O₂ → CO₂ + 2 H₂O, que massa de oxigênio é consumida por 16 g de CH₄? (C = 12; H = 1; O = 16)': 'O₂ na queima do metano',
  'Na decomposição 2 H₂O₂ → 2 H₂O + O₂, quantos mols de oxigênio se formam a partir de 4 mol de água oxigenada?': 'Mols de O₂',
  '4 g de H₂ reagem com 40 g de O₂ e formam água. Que massa de oxigênio sobra no fim? (H = 1; O = 16)': 'Reagente em excesso',
  'Em N₂ + 3 H₂ → 2 NH₃, 28 g de N₂ dariam 34 g de amônia. Com rendimento de 75%, quanto de amônia se obtém?': 'Rendimento da amônia',
  'Queimam-se 36 g de carbono com oxigênio em excesso. Que volume de CO₂ se forma, nas CNTP? (C = 12; volume molar = 22,4 L)': 'Volume de CO₂',
  'Aquecem-se 20 g de calcário com 80% de CaCO₃: CaCO₃ → CaO + CO₂. Que massa de CaO se forma? (Ca = 40; C = 12; O = 16)': 'Pureza do calcário',
  'Quantas moléculas há em 88 g de gás carbônico? (C = 12; O = 16; 1 mol = 6 × 10²³)': 'Moléculas de CO₂',
  'Na decomposição 2 H₂O₂ → 2 H₂O + O₂, que massa de oxigênio se forma a partir de 68 g de água oxigenada? (H = 1; O = 16)': 'Massa de O₂',
}
const RESOLUCAO_DO_ENUNCIADO: Record<string, string> = {
  'Quantos gramas tem 1 mol de O₂? (O = 16)': 'O₂ tem dois átomos de O: 2 × 16 = 32 g.',
  'Quantos mols há em 36 g de água? (H = 1; O = 16)': 'A água tem 18 g/mol: 36 ÷ 18 = 2 mol.',
  'Quantos mols há em 88 g de CO₂? (C = 12; O = 16)': 'CO₂ tem 44 g/mol: 88 ÷ 44 = 2 mol.',
  'Qual é a massa de 0,5 mol de NaCl? (Na = 23; Cl = 35,5)': 'NaCl tem 58,5 g/mol: 0,5 × 58,5 = 29,25 g.',
  'Qual é a massa de 3 mol de água? (H = 1; O = 16)': '3 × 18 = 54 g.',
  'Quantos mols há em 80 g de NaOH? (Na = 23; O = 16; H = 1)': 'NaOH tem 40 g/mol: 80 ÷ 40 = 2 mol.',
  'Quantos mols de moléculas há em 8 g de metano, CH₄? (C = 12; H = 1)': 'CH₄ tem 16 g/mol: 8 ÷ 16 = 0,5 mol.',
  'Qual é a massa de 0,25 mol de CaCO₃? (Ca = 40; C = 12; O = 16)': 'CaCO₃ tem 100 g/mol: 0,25 × 100 = 25 g.',
}

export type TipoDocumentoDado = 'prova' | 'atividade' | 'simulado' | 'adaptada' | 'plano' | 'sequencia' | 'material' | 'apresentacao' | 'rubrica' | 'redacao'

/** As ferramentas que juntaram com outra (o mesmo mapa de dados/ferramentas, sem importar de lá). */
const TIPO_AGORA: Record<string, string> = { periodo: 'plano', recuperacao: 'atividade', mapa: 'material', diagnostica: 'prova', proposta: 'redacao' }
const deAgora = (doc: ItemBiblioteca) => TIPO_AGORA[doc.de] ?? doc.de

/** A estrutura do documento: a dele, ou a do documento de que partiu. Para outra turma, as datas da aula saem (são do
    calendário da turma de origem) e o capítulo só fica se a série for a mesma. */
export function estruturaDe(doc: ItemBiblioteca): EstruturaDoc {
  const propria = ESTRUTURA[doc.id]
  if (propria) return propria
  const base = doc.base ? BIBLIOTECA.find((b) => b.id === doc.base) : undefined
  const e = base ? ESTRUTURA[base.id] : undefined
  if (!e || !base) return {}
  if (base.turmaId === doc.turmaId) return e
  const serie = (id: string) => turmaDe(id).id === id ? turmaDe(id).serie : undefined
  const mesmaSerie = !!serie(doc.turmaId) && serie(doc.turmaId) === serie(base.turmaId)
  return {
    ...e,
    capitulo: mesmaSerie ? e.capitulo : undefined,
    aulas: e.aulas?.map((a) => ({ ...a, titulo: a.titulo.replace(/\s·\s(?:segunda|terça|quarta|quinta|sexta),\s\d{2}\/\d{2}/i, '') })),
  }
}

/** O tipo do documento, para a vista dele (seção 3.4). */
export function tipoDocumento(doc: ItemBiblioteca): TipoDocumentoDado {
  if (doc.versaoDe) return 'adaptada'
  const de = deAgora(doc)
  if (de === 'prova') return 'prova'
  if (de === 'simulado') return 'simulado'
  if (de === 'atividade') return doc.blocos.some((b) => b.t === 'questao') ? 'atividade' : 'plano'
  if (de === 'plano') {
    const e = estruturaDe(doc)
    if (e.semanas || (e.aulas && e.aulas.length > 2)) return 'sequencia'
    return 'plano'
  }
  if (de === 'apresentacao') return 'apresentacao'
  if (de === 'redacao') return doc.blocos.some((b) => b.t === 'tabela') ? 'rubrica' : 'redacao'
  return 'material'
}

/** Uma questão do documento, pronta para a folha: o enunciado, as alternativas, a certa, a resolução e os metadados. */
export type QuestaoDoc = {
  n: number
  enunciado: string
  pergunta?: string
  dados?: string
  alternativas?: string[]
  certa?: number
  resolucao?: string
  /** a página do livro (só no que saiu do material da turma) */
  pagina?: number
  habilidade?: string
  nivel?: string
  /** o assunto em poucas palavras ("Mols num comprimido"), ao lado do número nos resultados */
  tema?: string
  /** a forma do enunciado direto (versão adaptada) */
  direta?: { x: string; pergunta: string; dados?: string }
}

const ehDaProva = (doc: ItemBiblioteca) => (doc.base ?? doc.id) === 'prova-estequiometria' && deAgora(doc) === 'prova'
/** A página da questão n de uma lista do capítulo 7 que não diz a página. */
const paginaPadrao = (n: number) => [145, 145, 146, 145, 145, 146, 146, 145][(n - 1) % 8]

/** As questões do documento (a prova de hoje, com a variante; ou os blocos de questão). A versão adaptada de partida
    (versoesDe) não entra aqui: ela mora dentro da original, e a folha adaptada usa `direta`. */
export function questoesDoDocumento(doc: ItemBiblioteca): QuestaoDoc[] {
  const e = estruturaDe(doc)
  const de = deAgora(doc)
  if (ehDaProva(doc)) {
    return questoesDa(doc.variante).map((q, i) => ({
      n: i + 1, enunciado: q.texto, alternativas: q.alt, certa: q.certa, resolucao: q.resolucao, pagina: q.pagina,
      habilidade: HABILIDADE_DA_PAGINA[q.pagina], nivel: doc.variante ? undefined : e.niveis?.[i], direta: q.adaptada, tema: TEMA_DO_ENUNCIADO[q.texto],
    }))
  }
  /* a página do livro só no que saiu do material da turma: o que veio de arquivo, o simulado, a turma de Ciências e a
     prova de Física não citam */
  const comPagina = doc.turmaId !== '9a' && de !== 'simulado' && doc.origem !== 'arquivo' && (doc.base ?? doc.id) !== 'modelo-prova-fisica'
  const chave = doc.base ?? doc.id
  return doc.blocos.flatMap((b): QuestaoDoc[] => {
    if (b.t !== 'questao') return []
    const pagina = comPagina && !b.origem ? b.pagina ?? (de === 'atividade' || de === 'prova' || de === 'material' ? paginaPadrao(b.n) : undefined) : undefined
    const certa = b.certa ?? GABARITOS[chave]?.[b.n - 1]
    return [{
      n: b.n, enunciado: b.x, pergunta: b.pergunta, dados: b.dados, alternativas: b.alt, certa,
      resolucao: b.resolucao ?? RESOLUCOES[chave]?.[b.n - 1] ?? RESOLUCAO_DO_ENUNCIADO[b.x],
      pagina, habilidade: pagina ? HABILIDADE_DA_PAGINA[pagina] : undefined, nivel: e.niveis?.[b.n - 1], direta: b.direta,
      tema: TEMAS[chave]?.[b.n - 1] ?? TEMA_DO_ENUNCIADO[b.x],
    }]
  })
}

/** As aulas do plano: as da estrutura, ou montadas dos blocos (cada intertítulo abre uma aula; cada etapa é um momento). */
export function aulasDoPlano(doc: ItemBiblioteca): AulaDoc[] {
  const e = estruturaDe(doc)
  if (e.aulas) {
    if (import.meta.env.DEV) for (const a of e.aulas) {
      const soma = a.momentos.reduce((s, m) => s + (m.minutos ?? 0), 0)
      if (a.duracao && soma !== a.duracao) console.warn(`Plano ${doc.id}, ${a.titulo}: os minutos somam ${soma}, a aula tem ${a.duracao}.`)
    }
    return e.aulas
  }
  const aulas: AulaDoc[] = []
  for (const b of doc.blocos) {
    if (b.t === 'sub') aulas.push({ id: `aula-${aulas.length + 1}`, titulo: b.x, momentos: [] })
    else if (b.t === 'etapa' && b.tempo !== 'Casa') {
      if (!aulas.length) aulas.push({ id: 'aula-1', titulo: 'Aula 1', momentos: [] })
      const min = Number.parseInt(b.tempo, 10)
      aulas[aulas.length - 1].momentos.push({ minutos: Number.isNaN(min) ? undefined : min, nome: b.nome, texto: b.x })
    }
  }
  return aulas.filter((a) => a.momentos.length > 0)
}

/** As semanas do bimestre (a tabela agrupada por semana). */
export const semanasDoPlano = (doc: ItemBiblioteca): SemanaDoc[] => estruturaDe(doc).semanas ?? []

/** A rubrica: o enunciado, os níveis com a nota, os critérios e o total de cada nível. */
export function rubricaDe(doc: ItemBiblioteca): { enunciado?: string; niveis: { nome: string; pontos: string }[]; criterios: { nome: string; descricoes: string[] }[]; total: string[]; nota?: string } | undefined {
  const t = doc.blocos.find((b): b is Extract<Bloco, { t: 'tabela' }> => b.t === 'tabela')
  if (!t || deAgora(doc) !== 'redacao') return undefined
  const niveis = t.colunas.slice(1).map((c) => { const [nome, pontos] = c.split(' · '); return { nome, pontos: pontos ?? '' } })
  const num = (x: string) => Number(x.replace(',', '.')) || 0
  const total = niveis.map((n) => (num(n.pontos) * t.linhas.length).toFixed(1).replace('.', ','))
  const p = doc.blocos.find((b): b is Extract<Bloco, { t: 'p' }> => b.t === 'p')
  const nota = doc.blocos.find((b): b is Extract<Bloco, { t: 'nota' }> => b.t === 'nota')?.x.replace(/^Total:\s*[\d,]+\.\s*/, '').replace('escreve a devolutiva', 'escreve o comentário para cada aluno')
  return {
    enunciado: p ? (() => { const x = p.x.replace(/^Questão:\s*/, ''); return x.charAt(0).toUpperCase() + x.slice(1) })() : undefined,
    niveis, criterios: t.linhas.map((l) => ({ nome: l[0], descricoes: l.slice(1) })), total, nota,
  }
}

/** Os slides, com as notas do professor. */
export function slidesDe(doc: ItemBiblioteca): { n: number; titulo: string; topicos: string[]; notas?: string }[] {
  const notas = estruturaDe(doc).notas ?? {}
  return doc.blocos.flatMap((b) => (b.t === 'slide' ? [{ n: b.n, titulo: b.titulo, topicos: b.topicos, notas: notas[b.n] }] : []))
}

const NOME_DO_TIPO: Record<TipoDocumentoDado, string> = {
  prova: 'Prova', atividade: 'Atividade', simulado: 'Simulado', adaptada: 'Versão adaptada', plano: 'Plano de aula', sequencia: 'Sequência didática',
  material: 'Material', apresentacao: 'Apresentação', rubrica: 'Rubrica', redacao: 'Proposta de redação',
}

/** O cabeçalho do documento: o tipo e a linha de dados ("2ºB · Química · 10 questões · 50 min · Química 2, cap. 7 ·
    Assistente, 21/09"); e o resumo curto da linha de Criados e do cartão da conversa. */
export function metadadosDe(doc: ItemBiblioteca): { tipo: string; linha: string[]; resumo: string; quantidade: string; materia?: string; capitulo?: string; duracao?: string } {
  const e = estruturaDe(doc)
  const t = tipoDocumento(doc)
  let tipo = NOME_DO_TIPO[t]
  if (t === 'atividade' && /^lista/i.test(doc.titulo)) tipo = 'Lista'
  if (t === 'sequencia' && e.semanas) tipo = 'Bimestre'
  if (t === 'plano' && deAgora(doc) === 'atividade') tipo = 'Recuperação'
  if (t === 'material') {
    const m = doc.blocos.find((b) => b.t === 'mapa') ? 'Mapa mental' : /folha de revis/i.test(doc.titulo) ? 'Folha de revisão' : /texto de apoio/i.test(doc.titulo) ? 'Texto de apoio' : 'Resumo'
    tipo = m
  }
  const nq = doc.blocos.filter((b) => b.t === 'questao').length
  const quantidade = ehDaProva(doc) ? '10 questões'
    : t === 'apresentacao' ? `${slidesDe(doc).length} slides`
      : t === 'sequencia' && e.aulas ? `${e.aulas.length} aulas`
        : (t === 'prova' || t === 'simulado' || t === 'atividade') && nq ? `${nq} ${t === 'atividade' ? 'exercícios' : 'questões'}`
          : t === 'material' && doc.blocos.find((b) => b.t === 'mapa') ? `${(doc.blocos.find((b) => b.t === 'mapa') as Extract<Bloco, { t: 'mapa' }>).ramos.length} ramos`
            : t === 'rubrica' ? `${rubricaDe(doc)?.criterios.length ?? 0} critérios`
              : doc.detalhe
  const turma = turmaDe(doc.turmaId).id === doc.turmaId ? turmaDe(doc.turmaId) : undefined
  const materia = t === 'simulado' ? undefined : turma?.disciplina ?? e.materia
  const duracao = e.duracao && e.duracao !== quantidade ? e.duracao : undefined
  const data = `${String(doc.em[0]).padStart(2, '0')}/${String(doc.em[1]).padStart(2, '0')}`
  const autor = doc.origem === 'arquivo' ? `Do arquivo, ${data}` : `Assistente, ${data}`
  const linha = [[doc.turma, materia].filter(Boolean).join(' · '), duracao?.startsWith(quantidade) ? undefined : quantidade, duracao, e.capitulo, autor].filter((x): x is string => !!x)
  return { tipo, linha, resumo: [tipo, quantidade].filter(Boolean).join(' · '), quantidade, materia, capitulo: e.capitulo, duracao }
}

/** A conversa que gerou (ou ajustou) o documento, se houver: o "Pedir ajuste ao Assistente" volta para ela. */
export function conversaDoDocumento(docId: string): string | undefined {
  const c = fatia.ler().conversas
  return Object.keys(c).reverse().find((k) => c[k].docId === docId)
}
