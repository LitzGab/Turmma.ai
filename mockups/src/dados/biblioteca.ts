/* A BIBLIOTECA, como dado (20/09/2026): os 18 documentos que a professora já gerou, cada um com o COMEÇO DO SEU
   CONTEÚDO DE VERDADE — o que cabe na primeira página. É disso que a miniatura do cartão é feita
   (`turmma/pagina-mini.tsx` desenha estes blocos com texto real, minúsculo, cortado embaixo, como no Google Docs):
   a professora reconhece o arquivo pelo que está escrito nele, não por uma capa.

   · `de` é o id da ferramenta que gerou (`dados/ferramentas`); `em` é [dia, mês] de 2026; "hoje" no mockup é 21/09.
   · O conteúdo é coerente com o título, a turma, o `detalhe` e a prévia da mesma ferramenta no catálogo.
   · A "Prova de estequiometria" tem AS MESMAS questões de `areas/professor/Artefato.tsx` (o documento aberto); a
     versão de fonte ampliada é a mesma prova, com enunciado direto. Mudou lá, muda aqui.
   · A miniatura é a folha do ALUNO: não tem gabarito, alternativa marcada nem a página de origem de cada questão.
   · Tudo sintético. As referências de ano e número do simulado ENEM são inventadas, como as do catálogo: no
     produto a questão vem do banco público, com o texto oficial.
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
  | { t: 'questao'; n: number; x: string; pergunta?: string; dados?: string; origem?: string; alt?: string[] }
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

export type ItemBiblioteca = {
  n: number
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
  blocos: Bloco[]
}

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
    n: 1, titulo: 'Prova de estequiometria', de: 'prova', turma: '2ºB', em: [21, 9], detalhe: '10 questões · 1 versão', estado: 'aprovado',
    blocos: [
      { t: 'identificacao' },
      { t: 'nota', x: 'Dez questões objetivas, 1,0 ponto cada. Responda a caneta azul ou preta. Calculadora simples liberada; a tabela periódica está no verso.' },
      { t: 'questao', n: 1, x: 'Qual a massa de CO₂ formada na queima completa de 24 g de carbono? (C = 12; O = 16)', alt: ALT_ESTEQ[0] },
      { t: 'questao', n: 2, x: 'Na reação N₂ + 3 H₂ → 2 NH₃, quantos mols de amônia se formam a partir de 6 mol de H₂?', alt: ALT_ESTEQ[1] },
      { t: 'questao', n: 3, x: 'Calcule a massa de água produzida na combustão de 8 g de gás hidrogênio. (H = 1; O = 16)', alt: ALT_ESTEQ[2] },
      { t: 'questao', n: 4, x: 'Em 2 Al + 3 Cl₂ → 2 AlCl₃, com 54 g de Al e 71 g de Cl₂, qual é o reagente limitante?', alt: ALT_ESTEQ[3] },
      { t: 'questao', n: 5, x: 'Uma reação com rendimento teórico de 50 g produziu 40 g. Qual foi o rendimento percentual?', alt: ALT_ESTEQ[4] },
    ],
  },
  {
    n: 2, titulo: 'Prova de estequiometria · fonte ampliada', folha: 'Prova de estequiometria', de: 'adaptacao', turma: '2ºB', em: [21, 9],
    detalhe: 'fonte ampliada · enunciado direto', estado: 'espera', ampliada: true,
    blocos: [
      { t: 'identificacao' },
      { t: 'questao', n: 1, x: 'Queimamos 24 g de carbono.\nTodo o carbono vira CO₂.', pergunta: 'Qual é a massa de CO₂ formada?', dados: 'Dados: C = 12; O = 16', alt: ALT_ESTEQ[0] },
      { t: 'questao', n: 2, x: 'A reação é N₂ + 3 H₂ → 2 NH₃.\nTemos 6 mol de H₂.', pergunta: 'Quantos mols de NH₃ se formam?', alt: ALT_ESTEQ[1] },
      { t: 'questao', n: 3, x: 'Queimamos 8 g de gás hidrogênio.\nO produto é água.', pergunta: 'Qual é a massa de água formada?', dados: 'Dados: H = 1; O = 16', alt: ALT_ESTEQ[2] },
    ],
  },
  {
    n: 3, titulo: 'Mapa mental · estequiometria', de: 'mapa', turma: '2ºB', em: [19, 9], detalhe: '5 ramos', estado: 'aprovado',
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
    n: 4, titulo: 'Rendimento de reação', de: 'apresentacao', turma: '2ºB', em: [18, 9], detalhe: '12 slides', estado: 'aprovado',
    blocos: [
      { t: 'slide', n: 1, titulo: 'Rendimento de reação', topicos: ['Por que nenhuma reação rende 100% na prática', 'Química · 2ºB · capítulo 7'] },
      { t: 'slide', n: 2, titulo: 'O que a equação promete', topicos: ['Rendimento teórico: a massa calculada pela proporção', 'Vale para reagente puro e reação completa', 'É o teto: na prática sai menos'] },
      { t: 'slide', n: 3, titulo: 'O que sai do balão', topicos: ['Rendimento real: a massa medida no fim', 'Reação incompleta ou reversível', 'Impureza e perda na transferência'] },
      { t: 'slide', n: 4, titulo: 'Teórico e real: a amônia', topicos: ['N₂ + 3 H₂ ⇌ 2 NH₃', 'Reversível: não vai até o fim', 'Na fábrica, o gás que sobra volta ao reator'] },
      { t: 'slide', n: 5, titulo: 'A conta', topicos: ['R% = massa real ÷ massa teórica × 100', '40 g obtidos de 50 g previstos: 80%'] },
    ],
  },
  {
    n: 5, titulo: 'Lista de mol e massa molar', de: 'atividade', turma: '2ºB', em: [17, 9], detalhe: '8 exercícios', estado: 'aprovado',
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
    n: 6, titulo: 'Planejamento até o fim do bimestre', de: 'periodo', turma: '2ºB', em: [15, 9], detalhe: '38 aulas', estado: 'rascunho',
    blocos: [
      { t: 'nota', x: 'Química · 2ºB · 38 aulas, às terças, quintas e sextas · capítulos 7 a 9 de Química 2 · nada foi salvo no calendário ainda.' },
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
    n: 7, titulo: 'Plano da semana · reagente limitante', de: 'plano', turma: '2ºB', em: [14, 9], detalhe: '2 aulas', estado: 'aprovado',
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
    n: 8, titulo: 'Roteiro · conservação da massa', de: 'experimento', turma: '1ºC', em: [12, 9], detalhe: '50 min · em sala', estado: 'aprovado',
    blocos: [
      { t: 'nota', x: 'Prática em sala · 50 min · grupos de quatro · materiais de cozinha.' },
      { t: 'sub', x: 'Objetivo' },
      { t: 'p', x: 'Verificar que a massa se conserva em uma reação química quando o sistema está fechado, e explicar por que ela parece diminuir quando o sistema está aberto.' },
      { t: 'sub', x: 'Materiais, por grupo' },
      { t: 'item', marca: 'caixa', x: 'Garrafa PET de 500 mL, limpa e seca, e um balão de festa' },
      { t: 'item', marca: 'caixa', x: '50 mL de vinagre e 5 g de bicarbonato de sódio' },
      { t: 'item', marca: 'caixa', x: 'Balança de cozinha e um funil de papel' },
      { t: 'sub', x: 'Passo a passo' },
      { t: 'item', marca: 1, x: 'Ponha o vinagre na garrafa e, com o funil, o bicarbonato dentro do balão.' },
      { t: 'item', marca: 2, x: 'Prenda o balão na boca da garrafa, tombado para o lado. Pese o conjunto e anote (m₁).' },
      { t: 'item', marca: 3, x: 'Levante o balão para o bicarbonato cair. Espere a efervescência acabar e pese de novo (m₂).' },
      { t: 'item', marca: 4, x: 'Tire o balão, espere um minuto e pese outra vez (m₃). Compare as três massas.' },
      { t: 'caixa', alerta: true, rotulo: 'Segurança e descarte', x: 'Use óculos de proteção. Não aponte a boca da garrafa para o rosto de ninguém. Não passe da quantidade indicada: o balão pode se soltar. O resíduo vai para a pia, com água corrente.' },
      { t: 'sub', x: 'Para o relatório' },
      { t: 'p', x: 'Por que m₃ é menor que m₁? O que isso diz sobre a lei de Lavoisier? O balão cheio sofre o empuxo do ar: uma diferença de até 1 g entre m₁ e m₂ é esperada.' },
    ],
  },
  {
    n: 9, titulo: 'Revisão para o simulado', de: 'atividade', turma: '2ºA', em: [11, 9], detalhe: '12 exercícios', estado: 'rascunho',
    blocos: [
      { t: 'identificacao' },
      { t: 'nota', x: 'Doze exercícios dos capítulos 6 e 7, no formato do simulado: cinco alternativas, uma só correta.' },
      { t: 'questao', n: 1, x: 'Ao balancear Fe + O₂ → Fe₂O₃ com os menores coeficientes inteiros, a soma dos coeficientes é:', alt: ['5', '7', '9', '11', '13'] },
      { t: 'questao', n: 2, x: 'Em sistema fechado, 10 g de carbonato de cálcio se decompõem e formam 5,6 g de óxido de cálcio. A massa de gás carbônico liberada é:', alt: ['2,2 g', '4,4 g', '5,6 g', '10 g', '15,6 g'] },
      { t: 'questao', n: 3, x: 'A massa molar da glicose, C₆H₁₂O₆, em g/mol, é: (C = 12; H = 1; O = 16)', alt: ['96', '168', '180', '186', '342'] },
      { t: 'questao', n: 4, x: 'Quantos mols de O₂ são consumidos na combustão completa de 2 mol de etanol, C₂H₅OH?', alt: ['2', '3', '4', '6', '7'] },
      { t: 'questao', n: 5, x: 'A decomposição de 245 g de clorato de potássio, 2 KClO₃ → 2 KCl + 3 O₂, libera que massa de oxigênio? (K = 39; Cl = 35,5; O = 16)', alt: ['32 g', '48 g', '64 g', '96 g', '144 g'] },
      { t: 'questao', n: 6, x: 'Segundo a lei de Proust, se 2 g de hidrogênio reagem com 16 g de oxigênio, 5 g de hidrogênio reagem com:', alt: ['20 g', '32 g', '40 g', '45 g', '80 g'] },
    ],
  },
  {
    n: 10, titulo: 'Proposta · resíduos químicos nas cidades', de: 'proposta', turma: '2ºA', em: [10, 9], detalhe: 'dissertativo · com rubrica', estado: 'aprovado',
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
    n: 11, titulo: 'Projeto · resíduos químicos da escola', de: 'projeto', turma: '9ºA', em: [9, 9], detalhe: '4 semanas · feira de ciências', estado: 'aprovado',
    blocos: [
      { t: 'nota', x: 'Ciências · 9ºA · 4 semanas · grupos de 4 a 5 · produto final: estande na feira de ciências de 23/10.' },
      { t: 'caixa', rotulo: 'Pergunta norteadora', x: 'Para onde vão as pilhas, as lâmpadas e os restos do laboratório da nossa escola, e para onde deveriam ir?' },
      { t: 'sub', x: 'Etapas e entregas' },
      { t: 'etapa', tempo: 'Semana 1', quando: '28/09 a 02/10', nome: 'A pergunta e a escolha do resíduo', x: 'Cada grupo escolhe um resíduo gerado na escola (pilhas, lâmpadas, óleo da cantina, restos do laboratório) e lê o capítulo. Entrega: o nome do grupo e o resíduo. (p. 88)' },
      { t: 'etapa', tempo: 'Semana 2', quando: '05/10 a 09/10', nome: 'Investigação', x: 'De onde vem, do que é feito, para onde vai hoje e qual é o risco. Entrevista com a equipe da limpeza. Entrega parcial: ficha do resíduo. (p. 91)' },
      { t: 'etapa', tempo: 'Semana 3', quando: '13/10 a 16/10', nome: 'Proposta de descarte e estande', x: 'Proposta de descarte correto para a escola e montagem do estande: cartaz, amostra segura e ponto de coleta. (p. 94)' },
      { t: 'etapa', tempo: 'Semana 4', quando: '19/10 a 23/10', nome: 'Feira de ciências', x: 'Ensaio na terça, feira na sexta, 23/10. O produto é avaliado pela rubrica.' },
      { t: 'sub', x: 'Papéis no grupo' },
      { t: 'p', x: 'Coordenação, pesquisa, registro, montagem e apresentação. Os papéis trocam na semana 3.' },
    ],
  },
  {
    n: 12, titulo: 'Resumo · balanceamento', de: 'material', turma: '2ºA', em: [8, 9], detalhe: '1 página', estado: 'aprovado',
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
    n: 13, titulo: 'Rubrica · discursiva sobre Lavoisier', de: 'redacao', turma: '1ºC', em: [4, 9], detalhe: '4 critérios', estado: 'rascunho',
    blocos: [
      { t: 'p', x: 'Questão: a palha de aço queimada em uma balança fica mais pesada; o papel queimado fica mais leve. Explique, com a lei de Lavoisier, por que os dois resultados não contrariam a conservação da massa.' },
      { t: 'tabela', primeiraForte: true, colunas: ['Critério', 'Completo · 2,5', 'Parcial · 1,5', 'Insuficiente · 0,5'], larguras: [1.15, 1.5, 1.3, 1.3], linhas: [
        ['Enuncia a lei', 'Em sistema fechado, a massa dos reagentes é igual à dos produtos.', 'Cita a conservação, sem falar em sistema fechado.', 'Não enuncia, ou confunde com a lei de Proust.'],
        ['Explica a palha de aço', 'O ferro se combina com o O₂ do ar: o óxido pesa mais que o metal.', 'Diz que "entra ar", sem citar a reação.', 'Atribui o ganho a erro da balança.'],
        ['Explica o papel', 'CO₂ e vapor de água saem para o ar: o sistema é aberto.', 'Fala em fumaça, sem citar os gases.', 'Diz que a massa foi destruída.'],
        ['Conclui', 'Liga os dois casos: fechado o sistema, a massa se conserva nos dois.', 'Conclui sem ligar os dois casos.', 'Não conclui.'],
      ] },
      { t: 'nota', x: 'Total: 10,0. A rubrica é entregue à turma antes da aplicação. Quem corrige e escreve a devolutiva é a professora.' },
    ],
  },
  {
    n: 14, titulo: 'Simulado ENEM · cálculo estequiométrico', de: 'simulado', turma: '2ºB', em: [2, 9], detalhe: '15 questões', estado: 'aprovado',
    blocos: [
      { t: 'identificacao' },
      { t: 'nota', x: 'Quinze questões do banco público do ENEM, com o ano e o número de cada uma. Duração: 50 minutos.' },
      { t: 'questao', n: 1, origem: 'ENEM 2022 · Q. 117', x: 'O ferro-gusa é obtido em altos-fornos pela redução do minério de ferro com monóxido de carbono: Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂. Considerando apenas essa etapa, a massa de gás carbônico, em toneladas, emitida na produção de 1,12 t de ferro é: (Fe = 56; C = 12; O = 16)', alt: ['0,44', '0,66', '0,88', '1,32', '2,64'] },
      { t: 'questao', n: 2, origem: 'ENEM 2019 · Q. 103', x: 'Um calcário com 80% de pureza em CaCO₃ é aquecido para produzir cal virgem: CaCO₃ → CaO + CO₂. A massa de CaO, em kg, obtida a partir de 500 kg desse calcário é: (Ca = 40; C = 12; O = 16)', alt: ['112', '176', '224', '280', '400'] },
      { t: 'questao', n: 3, origem: 'ENEM 2021 · Q. 124', x: 'O etanol é usado como combustível: C₂H₅OH + 3 O₂ → 2 CO₂ + 3 H₂O. A quantidade de CO₂, em mol, liberada na queima completa de 4,6 kg de etanol é: (C = 12; H = 1; O = 16)', alt: ['50', '100', '150', '200', '300'] },
    ],
  },
  {
    n: 15, titulo: 'Modelos atômicos · aula 1', de: 'plano', turma: '1ºC', em: [1, 9], detalhe: '1 aula', estado: 'aprovado',
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
    n: 16, titulo: 'Diagnóstica · antes de estequiometria', de: 'diagnostica', turma: '1ºC', em: [28, 8], detalhe: '8 questões', estado: 'aprovado',
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
    n: 17, titulo: 'Prova de modelos atômicos', de: 'prova', turma: '1ºC', em: [25, 8], detalhe: '10 questões · 2 versões', estado: 'aprovado',
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
    n: 18, titulo: 'Plano de recuperação · duas habilidades', de: 'recuperacao', turma: '2ºB', em: [24, 8], detalhe: '2 semanas', estado: 'aprovado',
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
]
