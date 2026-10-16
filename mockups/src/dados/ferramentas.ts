import {
  BookOpen, ClipboardCheck, ClipboardList, FileText, NotebookPen, PenLine, Presentation, SlidersHorizontal, Target, type LucideIcon,
} from 'lucide-react'

/* O CATÁLOGO DE FERRAMENTAS, como dado (20/09/2026; 12ª rodada, 04/10/2026).

   É FERRAMENTA a ação que entrega um OUTPUT PRÓPRIO (uma prova, um plano, uma apresentação): coisa com formato, que
   fica em Criados e pode ir para a turma. O resto o Assistente responde na conversa (`SO_PEDIR`).

   12ª RODADA (decisão do dono, plano de polimento 5.2): o catálogo fica com NOVE — Prova, Atividade e lista, Plano de
   aula, Material didático, Apresentação, Adaptação, Correção de objetiva, Redação e discursiva e Simulado ENEM.
   Das oito que tinham entrado na sétima rodada:
   · JUNTARAM: Planejamento do período → Plano de aula (sequência e bimestre são opções do "O que você quer");
     Plano de recuperação → Atividade ("Para fazer: Recuperação"); Mapa mental → Material didático (um tipo);
     Avaliação diagnóstica → Prova ("Não vale nota"); Proposta de redação → Redação e discursiva (o tema da redação);
   · SAÍRAM: Plano de projeto e Roteiro de experimento (viram pedido na conversa); "Importar prova" sai do catálogo.
   A página, o cartão da conversa e a janela "Mais" leem DAQUI: uma ferramenta é uma entrada nesta lista, não uma tela.
   Os campos de texto nascem vazios: `exemplo` é o placeholder e `valor` é o que a conversa preenche quando o pedido
   não diz o tema. Nenhum campo recebe texto sobre aluno (D35, D57, D66), e a IA não lê redação (D55). */

export type CategoriaId = 'planejar' | 'preparar' | 'avaliar' | 'corrigir'
export type Ladrilho = 'pessego' | 'cinza' | 'preto' | 'laranja'

export const CATEGORIAS: { id: CategoriaId; nome: string; apoio: string; ladrilho: Ladrilho }[] = [
  { id: 'planejar', nome: 'Planejar', apoio: 'A aula, a sequência e o bimestre', ladrilho: 'pessego' },
  { id: 'preparar', nome: 'Preparar a aula', apoio: 'O que você leva para a sala, feito do material da escola', ladrilho: 'cinza' },
  { id: 'avaliar', nome: 'Avaliar', apoio: 'Prova, lista e simulado, com a página de cada questão', ladrilho: 'preto' },
  { id: 'corrigir', nome: 'Corrigir', apoio: 'A objetiva o Assistente corrige e você aprova; a discursiva é sua', ladrilho: 'laranja' },
]

export type OpcaoCartao = {
  id: string; nome: string; detalhe: string
  /** aparece, mas não dá para escolher (o calendário do próximo bimestre ainda não saiu) */
  desabilitado?: boolean
  /** selo cinza ao lado do nome ("registrada pela coordenação") */
  etiqueta?: string
}

/** Os quatro grupos do formulário. Saem do tipo do campo; `grupo` força quando o tipo não diz. */
export type Grupo = 'quem' | 'oque' | 'como' | 'extras'

/** O campo só aparece quando outro campo (pelo `id`) tem, ou não tem, um destes valores. Chave vale 'sim' ou 'nao';
    a turma responde por 'turma' e o material por 'material'. */
export type Quando = { campo: string; igual?: string | string[]; diferente?: string | string[] }

type Comum = {
  /** nome do campo: é por ele que outro campo se condiciona e que a tela lê o valor */
  id?: string
  quando?: Quando
  /** desce para "Mais opções" */
  avancado?: boolean
  grupo?: Grupo
}

export type CampoDef = Comum & (
  | { tipo: 'turma'; padrao?: string }
  /** `varios`: intervalo de capítulos ("do cap. 7 ao cap. 9") em vez de um capítulo só */
  | { tipo: 'material'; varios?: boolean; dica?: string }
  /** `exemplo` é o placeholder; `valor` é o que "Preencher exemplo" escreve */
  | { tipo: 'texto'; rotulo: string; valor?: string; exemplo: string; larga?: boolean; opcional?: boolean; dica?: string }
  | { tipo: 'longo'; rotulo: string; exemplo: string; valor?: string; opcional?: boolean; dica?: string }
  /** `padrao` ausente + `obrigatorio` = a professora tem de escolher (declaração da D5). `personalizado` põe "Outro" no fim */
  | { tipo: 'chips'; rotulo: string; opcoes: string[]; padrao?: string; padroes?: string[]; multiplo?: boolean; obrigatorio?: boolean
      personalizado?: boolean | 'numero' | 'texto'; outro?: string; dica?: string; larga?: boolean }
  | { tipo: 'cartoes'; rotulo: string; opcoes: OpcaoCartao[]; padrao?: string; padroes?: string[]; multiplo?: boolean
      /** um cartão a mais, no fim, que abre um texto curto */
      personalizado?: { nome: string; detalhe: string; exemplo: string }; dica?: string }
  | { tipo: 'chave'; rotulo: string; detalhe?: string; ligada?: boolean }
  /** o total dos contadores É o número de questões: não existe outro campo de quantidade */
  | { tipo: 'contadores'; rotulo: string; itens: { nome: string; valor: number }[]; dica?: string }
  | { tipo: 'habilidades'; rotulo: string; modo: 'bncc' | 'diagnostico' | 'prerequisito'; opcional?: boolean }
  /** `declaracao`: pergunta de quem é o material, sem opção pré-marcada (D5). `amostra` é o arquivo do "Preencher exemplo" */
  | { tipo: 'arquivo'; rotulo: string; dica: string; opcional?: boolean; declaracao?: boolean; amostra?: string }
  /** seletor de item da biblioteca; `de` filtra pela ferramenta que gerou */
  | { tipo: 'artefato'; rotulo: string; de: string[]; padrao?: string; dica?: string }
  | { tipo: 'aviso'; texto: string; topo?: boolean }
)

/** `em` é o índice, em `vem`, da seção da folha em que este item aparece. */
export type ItemPrevia = { texto: string; pagina?: number; rotulo?: string; em?: number }

export type Extra = 'anexo' | 'web'

export type Ferramenta = {
  id: string
  nome: string
  categoria: CategoriaId
  /** traço pequeno (lucide): menu da caixa de pedido e cabeçalhos; o ilustrado mora em turmma/icones-ferramenta */
  icon: LucideIcon
  /** uma linha, no menu da caixa de pedido */
  curta: string
  /** duas linhas, no cartão da página */
  texto: string
  /** a frase da página da ferramenta */
  promessa: string
  /** formatos de saída (D67) */
  saida: string[]
  /** de onde vem o conteúdo */
  fonte: string
  /** nasce pendente: só vale depois que o professor aprova */
  pendente?: boolean
  /** pedido-modelo, para quem prefere a conversa */
  exemplo: string
  /** como mais a professora chama isto (nomes da Teachy e do dia a dia): a busca acha por aqui */
  busca: string
  /** a tela tem algo próprio além do formulário: o cartão da conversa (prova, adaptação) ou as abas (redação) */
  especial?: 'prova' | 'adaptacao' | 'redacao'
  /** abre outra rota em vez do formulário */
  para?: string
  acao?: string
  verbo: string
  campos: CampoDef[]
  /** extras transversais que a ferramenta aceita, no fim de "Mais opções". Sem a lista, nenhum. */
  extras?: Extra[]
  /** o que vem no resultado */
  vem: string[]
  /** uma linha de texto de verdade por item de `vem`, para a folha "Como vai sair" */
  amostra?: (string | null)[]
  previa: { titulo: string; resumo: string; itens: ItemPrevia[] }
}

/* O que a turma já carrega, e por isso o formulário não pergunta: disciplina, ano, tamanho, adaptações registradas.
   No produto vem do cadastro da turma; aqui é só o que falta em `dados/escola`. */
export const TURMA_CARREGA: Record<string, { adaptacoes: number; material: string; diagnostico: boolean }> = {
  '2b': { adaptacoes: 3, material: 'q2', diagnostico: true },
  '2a': { adaptacoes: 0, material: 'q2', diagnostico: true },
  '1c': { adaptacoes: 1, material: 'q2', diagnostico: true },
  '9a': { adaptacoes: 0, material: 'c9', diagnostico: false },
}

/** Os capítulos de cada material, para o intervalo do planejamento do período. */
export const CAPITULOS: Record<string, string[]> = {
  q2: ['cap. 5 · Gases', 'cap. 6 · Leis ponderais e balanceamento', 'cap. 7 · Estequiometria', 'cap. 8 · Soluções', 'cap. 9 · Termoquímica'],
  c9: ['cap. 1 · Matéria e energia', 'cap. 2 · Átomos e tabela periódica', 'cap. 3 · Reações químicas', 'cap. 4 · Resíduos e ambiente'],
}
export const CAPITULO_ATUAL: Record<string, number> = { q2: 2, c9: 2 }

/** O que o capítulo exige de ANTES: sai de capítulos e de anos anteriores do material da escola. */
export const PREREQUISITOS = [
  { codigo: 'p. 12', nome: 'Proporção e regra de três', origem: 'Matemática, 1º ano' },
  { codigo: 'p. 16', nome: 'Unidades de massa e conversão', origem: 'Química 1, cap. 1' },
  { codigo: 'p. 44', nome: 'Massa atômica na tabela periódica', origem: 'Química 1, cap. 3' },
  { codigo: 'p. 138', nome: 'Ler e balancear uma equação', origem: 'Química 2, cap. 6' },
]

/* Os tipos de adaptação. É uma LISTA FECHADA, e não existe campo de texto livre: a ferramenta recebe o tipo de
   adaptação, nunca a condição do aluno (D35, D67). É a mesma lista que a coordenação usa para registrar. */
export const TIPOS_ADAPTACAO: OpcaoCartao[] = [
  { id: 'fonte', nome: 'Fonte ampliada', detalhe: 'Corpo 18, mais espaço entre linhas, uma questão por bloco' },
  { id: 'direto', nome: 'Enunciado direto', detalhe: 'Frases curtas, uma instrução por vez, sem negação dupla' },
  { id: 'tempo', nome: 'Tempo adicional', detalhe: 'Indica +50% de tempo no cabeçalho da prova' },
  { id: 'escrita', nome: 'Resposta escrita no lugar da oral', detalhe: 'Troca apresentações e respostas faladas por escritas' },
  { id: 'visual', nome: 'Apoio visual no enunciado', detalhe: 'Esquema ou tabela junto do texto, quando o material tem' },
  { id: 'menos', nome: 'Menos itens por página', detalhe: 'Mesmo conteúdo cobrado, dividido em mais páginas' },
]
/** O que a coordenação registrou para o 2ºB: vem marcado, com a etiqueta. */
export const ADAPTACOES_REGISTRADAS = ['fonte', 'direto', 'tempo']

const DETALHES = (exemplo: string): CampoDef => ({ tipo: 'longo', rotulo: 'Detalhes', exemplo, opcional: true, avancado: true })
const BNCC: CampoDef = { tipo: 'habilidades', rotulo: 'Habilidades da BNCC', modo: 'bncc', opcional: true, avancado: true }

export const CATALOGO: Ferramenta[] = [
  /* ── Planejar ─────────────────────────────────────────────────────────────────────────────── */
  {
    id: 'plano', nome: 'Plano de aula', categoria: 'planejar', icon: NotebookPen,
    curta: 'Uma aula, a sequência ou o bimestre', texto: 'Uma aula, a sequência didática ou o bimestre inteiro: etapas com tempo, habilidades da BNCC e o que levar.',
    promessa: 'O plano sai nas datas da grade da turma, com o capítulo e a página de cada etapa.',
    saida: ['PDF'], fonte: 'Material da escola, com a página', exemplo: 'Plano de duas aulas sobre reagente limitante, com prática em dupla',
    busca: 'sequência didática plano de aula eja roteiro de aula planejamento bimestral período', verbo: 'Gerar plano',
    campos: [
      { tipo: 'cartoes', id: 'modo', grupo: 'oque', rotulo: 'O que você quer', padrao: 'aula', opcoes: [
        { id: 'aula', nome: 'Plano de aula', detalhe: 'Uma ou duas aulas, etapa por etapa, com o tempo de cada parte' },
        { id: 'sequencia', nome: 'Sequência didática', detalhe: 'Várias aulas encadeadas, nas datas da turma' },
        { id: 'bimestre', nome: 'Bimestre', detalhe: 'O que dar em cada aula até o fim do bimestre' },
      ] },
      { tipo: 'turma' }, { tipo: 'material' },
      { tipo: 'texto', rotulo: 'Tema', valor: 'Reagente limitante', exemplo: 'Ex.: Reagente limitante, a partir da receita de bolo', opcional: true, dica: 'Em branco, segue o capítulo escolhido.', larga: true },
      { tipo: 'chips', rotulo: 'Aulas', opcoes: ['1', '2'], padrao: '2', quando: { campo: 'modo', igual: 'aula' } },
      { tipo: 'chips', rotulo: 'Aulas', opcoes: ['3', '4', '6', '8'], padrao: '4', personalizado: 'numero', outro: 'Quantas?', quando: { campo: 'modo', igual: 'sequencia' } },
      { tipo: 'chips', rotulo: 'Até', opcoes: ['Próximas 2 semanas', 'Fim do bimestre'], padrao: 'Fim do bimestre', quando: { campo: 'modo', igual: 'bimestre' } },
      { tipo: 'chips', rotulo: 'Duração de cada aula', opcoes: ['45 min', '50 min', '100 min'], padrao: '50 min', personalizado: 'numero', outro: 'Minutos', dica: 'Veio da grade da turma.' },
      { tipo: 'cartoes', rotulo: 'Como a aula anda', padrao: 'dialogada', opcoes: [
        { id: 'dialogada', nome: 'Expositiva dialogada', detalhe: 'Você conduz e a turma participa com perguntas' },
        { id: 'ativa', nome: 'Aprendizagem ativa', detalhe: 'A turma resolve em dupla ou grupo; você circula' },
        { id: '5e', nome: 'Investigação (5E)', detalhe: 'Engajar, explorar, explicar, elaborar e avaliar' },
      ] },
      { tipo: 'chips', rotulo: 'O que você tem na sala', opcoes: ['Lousa', 'Projetor', 'Laboratório', 'Computadores'], multiplo: true, padroes: ['Lousa', 'Projetor'], avancado: true, dica: 'O plano só usa o que a sala tem.' },
      BNCC,
      DETALHES('Quero abrir com um exemplo de cozinha e fechar com três exercícios rápidos no caderno.'),
    ],
    extras: ['anexo', 'web'],
    vem: ['Objetivos e habilidades da BNCC', 'Etapas com o tempo de cada uma', 'O que você faz e o que a turma faz', 'Materiais para levar', 'Como verificar se aprenderam', 'Para casa'],
    amostra: ['Identificar o reagente limitante e calcular o que sobra. EM13CNT301 e EM13CNT104.', null, 'Você resolve o primeiro exemplo na lousa; a turma faz os dois seguintes em dupla.', 'Projetor, a receita impressa (uma por dupla) e a tabela periódica.', 'Bilhete de saída: um problema curto, entregue antes de sair.', null],
    previa: { titulo: 'Plano de aula · reagente limitante · 2ºB', resumo: 'Duas aulas de 50 min: terça 22/09 e quinta 24/09.', itens: [
      { rotulo: 'Aula 1 · 22/09', texto: 'Abertura com a receita de bolo (10 min); proporção em mol (15 min); três exemplos resolvidos na lousa (25 min).', pagina: 150, em: 1 },
      { rotulo: 'Aula 2 · 24/09', texto: 'Prática em dupla: quatro problemas com reagente em excesso (35 min); fechamento com rendimento (15 min).', pagina: 151, em: 1 },
      { rotulo: 'Para casa', texto: 'Exercícios 4 a 9 do capítulo.', pagina: 153, em: 5 },
    ] },
  },

  /* ── Preparar a aula ──────────────────────────────────────────────────────────────────────── */
  {
    id: 'apresentacao', nome: 'Apresentação', categoria: 'preparar', icon: Presentation,
    curta: 'Slides com roteiro de fala', texto: 'Slides com roteiro de fala, tirados do capítulo. A duração da aula define quantos slides saem.',
    promessa: 'Slides e roteiro a partir do material, prontos para abrir no PowerPoint.',
    saida: ['PPTX', 'PDF'], fonte: 'Material da escola, com a página', exemplo: 'Slides para a aula de rendimento de reação, doze no máximo',
    busca: 'slides powerpoint ppt apresentação de slides aula expositiva', verbo: 'Gerar apresentação',
    campos: [
      { tipo: 'turma' }, { tipo: 'material' },
      { tipo: 'texto', rotulo: 'Tema', valor: 'Rendimento de reação', exemplo: 'Ex.: Rendimento teórico e real, com o exemplo da amônia', larga: true },
      { tipo: 'chips', rotulo: 'Duração da aula', opcoes: ['30 min · 8 slides', '50 min · 12 slides', '100 min · 20 slides'], padrao: '50 min · 12 slides', personalizado: 'numero', outro: 'Quantos slides?', larga: true },
      { tipo: 'cartoes', rotulo: 'Quanto texto em cada slide', padrao: 'padrao', opcoes: [
        { id: 'minimo', nome: 'Mínimo', detalhe: 'Título e uma ideia: você fala o resto' },
        { id: 'padrao', nome: 'Padrão', detalhe: 'Três a quatro pontos por slide' },
        { id: 'detalhado', nome: 'Detalhado', detalhe: 'Serve de material de estudo depois' },
      ] },
      { tipo: 'chave', rotulo: 'Com roteiro de fala', ligada: true },
      { tipo: 'chave', rotulo: 'Uma pergunta para a turma a cada bloco', ligada: true },
      { tipo: 'chips', rotulo: 'Visual', opcoes: ['Claro', 'Escuro', 'Com a marca da escola'], padrao: 'Claro', avancado: true, dica: 'Os slides saem com texto, esquema e tabela do próprio material. De onde vêm as imagens ainda está em aberto.' },
      BNCC,
      DETALHES('Introduza pelo exemplo da amônia e inclua três exercícios para resolver com a turma.'),
    ],
    extras: ['anexo', 'web'],
    vem: ['Slides com título e pontos', 'Roteiro de fala por slide', 'Esquemas e tabelas do material', 'Perguntas para a turma', 'Arquivo do PowerPoint'],
    amostra: [null, 'Slide 4: “Na fábrica, o gás que sobra volta ao reator. Perguntem por quê.”', 'A tabela de rendimento teórico e real, da p. 152.', 'Se a conta dá 50 g, por que saem 40 g do balão?', 'Doze slides editáveis, no visual claro.'],
    previa: { titulo: 'Apresentação · rendimento de reação · 2ºB', resumo: 'Doze slides com roteiro de fala. Exporta em PowerPoint (PPTX).', itens: [
      { rotulo: 'Slide 1', texto: 'Por que nenhuma reação rende 100% na prática.', pagina: 151, em: 0 },
      { rotulo: 'Slide 4', texto: 'Rendimento teórico e rendimento real, com o exemplo da amônia.', pagina: 152, em: 0 },
      { rotulo: 'Slide 9', texto: 'Três exercícios para resolver com a turma.', pagina: 153, em: 0 },
    ] },
  },
  {
    id: 'material', nome: 'Material didático', categoria: 'preparar', icon: BookOpen,
    curta: 'Resumo, texto de apoio, revisão, mapa', texto: 'Resumo, texto de apoio, folha de revisão ou mapa mental, do capítulo que você escolher.',
    promessa: 'Texto para a turma estudar, escrito a partir do capítulo e com a página citada.',
    saida: ['PDF'], fonte: 'Material da escola, com a página', exemplo: 'Um resumo de uma página sobre balanceamento para revisão',
    busca: 'resumo texto de apoio revisão capítulo apostila folha de estudo mapa mental mapa conceitual', verbo: 'Gerar material',
    campos: [
      { tipo: 'cartoes', id: 'tipo', grupo: 'oque', rotulo: 'Tipo de material', padrao: 'resumo', opcoes: [
        { id: 'resumo', nome: 'Resumo', detalhe: 'As ideias do capítulo em ordem, para estudar antes da prova' },
        { id: 'apoio', nome: 'Texto de apoio', detalhe: 'Um texto corrido para ler em aula e discutir' },
        { id: 'revisao', nome: 'Folha de revisão', detalhe: 'Conceito, exemplo resolvido e exercício, lado a lado' },
        { id: 'mapa', nome: 'Mapa mental', detalhe: 'O capítulo em ramos, para projetar ou imprimir' },
      ] },
      { tipo: 'turma' }, { tipo: 'material' },
      { tipo: 'texto', rotulo: 'Tema', valor: 'Balanceamento de equações', exemplo: 'Ex.: Balanceamento por tentativas, a partir da reação do vinagre', larga: true },
      { tipo: 'chips', rotulo: 'Tipo de texto', opcoes: ['Explicativo', 'Divulgação científica', 'Notícia', 'Estudo de caso', 'Narrativo'], padrao: 'Explicativo', larga: true, quando: { campo: 'tipo', igual: 'apoio' } },
      { tipo: 'chips', rotulo: 'Tamanho', opcoes: ['Uma página', 'Duas páginas', 'Quatro páginas'], padrao: 'Uma página', larga: true },
      { tipo: 'chave', rotulo: 'Com três exercícios no fim', ligada: false, quando: { campo: 'tipo', diferente: 'apoio' } },
      { tipo: 'chave', rotulo: 'Com três perguntas para discussão', ligada: false, quando: { campo: 'tipo', igual: 'apoio' } },
      BNCC,
      DETALHES('Comece pela reação do vinagre com bicarbonato, que eles já viram, e feche com os três erros mais comuns no balanceamento.'),
    ],
    extras: ['anexo', 'web'],
    vem: ['Texto com a página do material', 'Exemplo resolvido', 'Glossário dos termos novos', 'Versão para imprimir'],
    amostra: [null, 'Balancear H₂ + O₂ → H₂O, passo a passo, em quatro linhas.', 'Coeficiente, índice, reagente, produto.', 'Uma página A4, em preto e branco.'],
    previa: { titulo: 'Resumo · balanceamento de equações · 2ºB', resumo: 'Uma página, para revisão antes da prova.', itens: [
      { texto: 'A massa se conserva: o número de átomos de cada elemento é igual dos dois lados da equação.', pagina: 138, em: 0 },
      { texto: 'Método das tentativas: comece pelo elemento que aparece em menos substâncias.', pagina: 139, em: 0 },
      { texto: 'Os coeficientes dão a proporção em mol entre reagentes e produtos.', pagina: 142, em: 0 },
    ] },
  },
  {
    id: 'adaptacao', nome: 'Adaptação', categoria: 'preparar', icon: SlidersHorizontal, especial: 'adaptacao', pendente: true,
    curta: 'Você escolhe o tipo de adaptação', texto: 'O conteúdo cobrado não muda: a mesma prova, atividade ou material em outra forma.',
    promessa: 'Você escolhe o tipo de adaptação. O sistema não pede nem guarda diagnóstico, e a versão nasce para aprovar.',
    saida: ['PDF'], fonte: 'O artefato que você escolher', exemplo: 'Adapta a lista de mol para fonte ampliada e enunciado direto',
    busca: 'adaptar material avaliações adaptadas acessibilidade inclusão nível de texto fonte ampliada', verbo: 'Gerar versão adaptada',
    /* D35 e D67: nenhum campo de texto. O formulário recebe o TIPO de adaptação, nunca a condição de um aluno.
       Desde a 13ª rodada a Adaptação abre a janela Adaptar (turmma/adaptar.tsx: o quê · que adaptação · para quem);
       estes campos ficam para o `FormAdaptacao` e para o endereço antigo. */
    campos: [
      { tipo: 'turma' },
      { tipo: 'artefato', id: 'origem', rotulo: 'O que adaptar', de: ['prova', 'atividade', 'material'], padrao: 'Prova de estequiometria · 2ºB', dica: 'Vem de Criados. O padrão é o último que você gerou para a turma.' },
      { tipo: 'arquivo', rotulo: 'Ou envie um arquivo de fora', dica: 'PDF ou Word (.docx), até 30 MB.', opcional: true, declaracao: true },
      { tipo: 'cartoes', id: 'tipos', rotulo: 'Tipo de adaptação', multiplo: true, padroes: ADAPTACOES_REGISTRADAS,
        opcoes: TIPOS_ADAPTACAO.map((t) => (ADAPTACOES_REGISTRADAS.includes(t.id) ? { ...t, etiqueta: 'da coordenação' } : t)),
        dica: 'Vêm marcadas as que a coordenação registrou para a turma. A adaptação muda a forma, nunca o que é cobrado, e o sistema não pede nem guarda diagnóstico.' },
    ],
    vem: ['As mesmas questões, em outra forma', 'Cabeçalho com o tipo de adaptação', 'Fica Para aprovar até você aprovar'],
    amostra: [null, null, 'Nada chega ao aluno antes da sua aprovação.'],
    previa: { titulo: 'Versão adaptada · Prova de estequiometria · 2ºB', resumo: 'Mesmas dez questões, outra forma.', itens: [
      { rotulo: 'Cabeçalho', texto: 'Versão adaptada: fonte ampliada e enunciado direto.', em: 1 },
      { rotulo: 'Questão 1', texto: 'Queimam-se 24 g de carbono. Qual é a massa de CO₂ formada?', pagina: 142, em: 0 },
      { rotulo: 'Questão 3', texto: 'Há 54 g de Al e 71 g de Cl₂. Qual reagente acaba primeiro?', pagina: 151, em: 0 },
    ] },
  },

  /* ── Avaliar ──────────────────────────────────────────────────────────────────────────────── */
  {
    id: 'prova', nome: 'Prova', categoria: 'avaliar', icon: ClipboardList, especial: 'prova',
    curta: 'Gabarito, versões e página citada', texto: 'Questões do material da escola, com gabarito, versões embaralhadas e a página de onde saiu cada questão.',
    promessa: 'Questões do material da escola, com gabarito e a página de cada uma.',
    saida: ['PDF'], fonte: 'Material da escola, com a página', exemplo: 'Monta uma prova de estequiometria pro 2ºB, dez questões',
    busca: 'prova avaliação teste bimestral saeb questões objetivas diagnóstica sondagem', verbo: 'Gerar prova',
    campos: [
      { tipo: 'turma' }, { tipo: 'material' },
      { tipo: 'texto', id: 'tema', rotulo: 'Tema', valor: 'Estequiometria', exemplo: 'Ex.: Estequiometria, do balanceamento ao rendimento', larga: true },
      { tipo: 'contadores', id: 'questoes', rotulo: 'Tipo de questão', dica: 'Discursiva é você quem corrige: a IA não corrige texto de aluno.', itens: [
        { nome: 'Objetiva', valor: 8 }, { nome: 'Discursiva', valor: 2 }, { nome: 'Verdadeiro ou falso', valor: 0 }, { nome: 'Relacionar colunas', valor: 0 },
        { nome: 'Completar lacunas', valor: 0 }, { nome: 'Ordenar', valor: 0 },
      ] },
      { tipo: 'chips', rotulo: 'Dificuldade', opcoes: ['Fácil', 'Média', 'Difícil', 'Misturada'], padrao: 'Misturada', dica: 'Misturada: 3 fáceis, 5 médias e 2 difíceis.' },
      { tipo: 'chips', rotulo: 'Versões', opcoes: ['1', '2', '3', '4'], padrao: '1', dica: 'Mesmas questões, ordem e alternativas embaralhadas.' },
      { tipo: 'chave', id: 'diagnostica', rotulo: 'Não vale nota (diagnóstica)', detalhe: 'Sonda o que a turma já sabe antes do capítulo.', ligada: false, avancado: true },
      /* desceu para "Mais opções" quando os tipos de questão passaram de quatro para seis: assim a Prova continua cabendo na janela sem rolar */
      { tipo: 'chave', rotulo: 'Com gabarito comentado', ligada: true, avancado: true },
      { tipo: 'chips', rotulo: 'Estilo das questões', opcoes: ['Do material', 'ENEM', 'Vestibular', 'SAEB'], padrao: 'Do material', avancado: true, larga: true },
      BNCC,
      DETALHES('Duas questões com tabela de massas molares no enunciado e nenhuma que dependa de decorar fórmula. Uma contextualizada com combustíveis.'),
    ],
    extras: ['anexo'],
    vem: ['Questões com a página do material', 'Gabarito', 'Versões embaralhadas', 'Habilidade de cada questão', 'Cabeçalho da escola'],
    amostra: [null, '1-C · 2-B · 3-A, com a resolução comentada de cada uma.', 'As mesmas questões, com a ordem e as alternativas trocadas.', 'Questão 3: EM13CNT301, reagente limitante.', 'Colégio Aurora · Química · nome, turma e data.'],
    previa: { titulo: 'Prova de estequiometria · 2ºB', resumo: 'Dez questões (oito objetivas e duas discursivas), 1 versão, com gabarito comentado.', itens: [
      { texto: 'Qual a massa de CO₂ formada na queima completa de 24 g de carbono?', pagina: 142, em: 0 },
      { texto: 'Na reação N₂ + 3 H₂ → 2 NH₃, quantos mols de amônia se formam a partir de 6 mol de H₂?', pagina: 142, em: 0 },
      { texto: 'Em 2 Al + 3 Cl₂ → 2 AlCl₃, com 54 g de Al e 71 g de Cl₂, qual é o reagente limitante?', pagina: 151, em: 0 },
    ] },
  },
  {
    id: 'atividade', nome: 'Atividade e lista', categoria: 'avaliar', icon: PenLine,
    curta: 'Exercícios ligados à turma', texto: 'Exercícios do fácil ao difícil, com o tipo de questão que você escolher e gabarito comentado.',
    promessa: 'Exercícios do capítulo, na ordem e nos tipos que você escolher, com gabarito comentado.',
    saida: ['PDF'], fonte: 'Material da escola, com a página', exemplo: 'Uma lista de oito exercícios de mol e massa molar, do fácil ao difícil',
    busca: 'lista de exercícios atividade folha de exercícios questões tarefa dever de casa recuperação reforço revisão', verbo: 'Gerar atividade',
    campos: [
      { tipo: 'turma' }, { tipo: 'material' },
      { tipo: 'texto', rotulo: 'Tema', valor: 'Mol e massa molar', exemplo: 'Ex.: Mol e massa molar, da conversão ao número de moléculas', larga: true },
      { tipo: 'contadores', rotulo: 'Tipo de questão', dica: 'O total é o número de exercícios da lista.', itens: [
        { nome: 'Objetiva', valor: 8 }, { nome: 'Discursiva curta', valor: 0 }, { nome: 'Verdadeiro ou falso', valor: 0 },
        { nome: 'Relacionar colunas', valor: 0 }, { nome: 'Completar lacunas', valor: 0 }, { nome: 'Ordenar', valor: 0 },
      ] },
      { tipo: 'chips', rotulo: 'Dificuldade', opcoes: ['Do fácil ao difícil', 'Misturada', 'Só fácil', 'Só média', 'Só difícil'], padrao: 'Do fácil ao difícil', larga: true },
      { tipo: 'chips', rotulo: 'Para fazer', opcoes: ['Em aula', 'Para casa', 'Revisão para a prova', 'Recuperação'], padrao: 'Para casa', dica: 'Para casa, vai junto um exemplo resolvido.', larga: true },
      { tipo: 'chave', rotulo: 'Com gabarito comentado', ligada: true },
      BNCC,
      DETALHES('A turma confunde massa molar com massa atômica: prática curta, um passo por vez, com a tabela periódica ao lado.'),
    ],
    extras: ['anexo'],
    vem: ['Exercícios com a página do material', 'Gabarito comentado', 'Habilidade de cada questão', 'Pronta para aplicar à turma'],
    amostra: [null, '1) n = 36 ÷ 18 = 2 mol. O erro comum é usar a massa atômica.', 'Exercícios 1 a 5: EM13CNT104.', 'Um clique e ela entra nas atividades do 2ºB.'],
    previa: { titulo: 'Lista de mol e massa molar · 2ºB', resumo: 'Oito exercícios, do fácil ao difícil, com gabarito comentado.', itens: [
      { texto: 'Quantos mols há em 36 g de água? (H = 1; O = 16)', pagina: 145, em: 0 },
      { texto: 'Qual a massa de 0,5 mol de CaCO₃? (Ca = 40; C = 12; O = 16)', pagina: 145, em: 0 },
      { texto: 'Quantas moléculas existem em 88 g de CO₂?', pagina: 146, em: 0 },
    ] },
  },
  {
    id: 'simulado', nome: 'Simulado ENEM', categoria: 'avaliar', icon: Target,
    curta: 'No formato do ENEM', texto: 'Questões no formato do ENEM, por assunto e por habilidade da matriz, com gabarito e cartão-resposta.',
    promessa: 'Questões no formato do ENEM, por área e assunto, com gabarito e cartão-resposta.',
    saida: ['PDF'], fonte: 'Matriz de referência do ENEM', exemplo: 'Simulado de 15 questões de Química do ENEM sobre cálculo estequiométrico',
    busca: 'simulado enem vestibular questões de prática provas anteriores', verbo: 'Montar simulado',
    campos: [
      { tipo: 'turma' },
      { tipo: 'texto', rotulo: 'Assunto', valor: 'Cálculo estequiométrico', exemplo: 'Ex.: Cálculo estequiométrico', opcional: true, dica: 'Ciências da Natureza, pela disciplina da turma. Em branco, vale a disciplina inteira.', larga: true },
      { tipo: 'chips', id: 'questoes', rotulo: 'Questões', opcoes: ['5', '10', '15'], padrao: '15' },
      { tipo: 'chave', rotulo: 'Com cartão-resposta para imprimir', ligada: true },
    ],
    vem: ['Questões no formato do ENEM', 'Gabarito comentado', 'Habilidade da matriz do ENEM', 'Cartão-resposta'],
    amostra: [null, 'Questão a questão, com a resolução.', 'H17, H24 e H25, de Ciências da Natureza.', 'Folha de marcar com uma linha por questão, para imprimir.'],
    previa: { titulo: 'Simulado ENEM · cálculo estequiométrico · 2ºB', resumo: 'Quinze questões de Ciências da Natureza, no formato do ENEM.', itens: [
      { texto: 'Produção de ferro-gusa e massa de CO₂ emitida.', em: 0 },
      { texto: 'Pureza de reagente e rendimento.', em: 0 },
      { texto: 'Combustão do etanol e proporção em mol.', em: 0 },
    ] },
  },

  /* ── Corrigir ─────────────────────────────────────────────────────────────────────────────── */
  {
    id: 'correcao', nome: 'Correção de objetiva', categoria: 'corrigir', icon: ClipboardCheck, pendente: true,
    curta: 'Diagnóstico por habilidade', texto: 'Só chega ao aluno depois que você aprova. O Assistente corrige e mostra o acerto por habilidade.',
    promessa: 'Correção e diagnóstico por habilidade. Nada chega ao aluno antes de você aprovar.',
    saida: ['PDF', 'XLSX'], fonte: 'As respostas da turma', exemplo: 'Corrige a prova objetiva do 2ºB e me mostra onde a turma travou',
    busca: 'corretor correção automática gabarito cartão-resposta provas em papel', verbo: 'Revisar', para: '/professor/ferramentas?corrigir=1', acao: 'Escolher a prova',
    /* Sem formulário por desenho: não é "preencher e gerar", é escolher a prova que a turma entregou e aprovar as
       notas, com registro (D33, D56). A objetiva se corrige sozinha quando a turma entrega. */
    campos: [], vem: [], previa: { titulo: '', resumo: '', itens: [] },
  },
  {
    id: 'redacao', nome: 'Redação e discursiva', categoria: 'corrigir', icon: FileText, especial: 'redacao',
    curta: 'Rubrica e lote. A IA não corrige', texto: 'A IA não corrige: quem dá a nota é você. Rubrica antes da prova, lote anônimo e correção cega.',
    promessa: 'Rubrica antes da aplicação, lote organizado e correção cega. A IA não corrige nem dá nota.',
    saida: ['PDF'], fonte: 'O enunciado e o material da escola', exemplo: 'Rubrica para a questão discursiva sobre a lei de Lavoisier',
    busca: 'corretor de redação rubrica discursiva correção cega critérios proposta de redação tema', verbo: 'Gerar rubrica',
    /* D55: tudo aqui é sobre a resposta ESPERADA, antes da aplicação. Nenhum campo recebe texto de aluno. */
    campos: [
      { tipo: 'cartoes', id: 'para', grupo: 'oque', rotulo: 'Rubrica para', padrao: 'discursiva', opcoes: [
        { id: 'discursiva', nome: 'Questão discursiva', detalhe: 'Critérios tirados do enunciado e do capítulo' },
        { id: 'redacao', nome: 'Redação', detalhe: 'Proposta, textos motivadores e critérios por competência' },
      ] },
      { tipo: 'turma', padrao: '1c' }, { tipo: 'material' },
      { tipo: 'longo', id: 'enunciado', rotulo: 'Enunciado da questão', quando: { campo: 'para', igual: 'discursiva' },
        valor: 'Explique a lei de Lavoisier e mostre, com um exemplo de reação, por que ela vale em sistema fechado.',
        exemplo: 'Cole o enunciado. Ex.: Explique a lei de Lavoisier e mostre, com um exemplo, por que ela vale em sistema fechado.' },
      { tipo: 'longo', id: 'tema', rotulo: 'Tema da redação', quando: { campo: 'para', igual: 'redacao' },
        valor: 'Caminhos para o descarte correto de resíduos químicos nas cidades brasileiras',
        exemplo: 'Ex.: Caminhos para o descarte correto de resíduos químicos nas cidades brasileiras' },
      { tipo: 'chave', rotulo: 'Com textos motivadores', detalhe: 'Do material da escola, com a página.', ligada: true, quando: { campo: 'para', igual: 'redacao' } },
      { tipo: 'longo', grupo: 'oque', rotulo: 'O que você cobra', opcional: true, dica: 'É sobre a resposta esperada, antes de aplicar. Nunca sobre o texto de um aluno.',
        valor: 'Enunciar a lei com as próprias palavras, dar um exemplo com as massas e explicar o sistema fechado. Ortografia não entra.',
        exemplo: 'Ex.: o que conta mais e o que não entra na nota.' },
      { tipo: 'chips', id: 'criterios', rotulo: 'Critérios', opcoes: ['3', '4', '5'], padrao: '4', quando: { campo: 'para', igual: 'discursiva' } },
      { tipo: 'chips', id: 'niveis', rotulo: 'Níveis por critério', opcoes: ['3', '4'], padrao: '3' },
    ],
    vem: ['Critérios tirados do enunciado e do capítulo', 'Níveis descritos, por critério', 'Lote sem nome, em ordem embaralhada', 'Correção e devolutiva: suas'],
    amostra: [null, null, 'Texto 01 a Texto 31. O nome só volta depois que você salvar.', 'Nenhum campo de correção vem preenchido pela IA.'],
    previa: { titulo: 'Rubrica · discursiva sobre Lavoisier · 1ºC', resumo: 'Quatro critérios, três níveis cada. Rascunho seu: edite antes de aplicar.', itens: [
      { rotulo: 'Critério 1', texto: 'Enuncia a lei de Lavoisier.', pagina: 131, em: 0 },
      { rotulo: 'Critério 2', texto: 'Relaciona com um exemplo de reação, com as massas.', em: 0 },
      { rotulo: 'Nível 3', texto: 'Enuncia corretamente, com as próprias palavras.', em: 1 },
    ] },
  },
]

export const ferramenta = (id: string | undefined) => CATALOGO.find((f) => f.id === id)
export const categoria = (id: CategoriaId) => CATEGORIAS.find((c) => c.id === id)!
export const rotaDa = (f: Ferramenta) => f.para ?? `/professor/ferramentas/${f.id}`

/* A ferramenta não é lugar (13ª rodada, 04/10/2026). Escolher uma (atalho da caixa ou "Mais") abre a CONVERSA nova
   com o cartão dela já preenchido. Três têm outro caminho:
   · Adaptação: a janela Adaptar em 3 passos, no Início (`/professor?adaptar=1&turma=`), que escolhe de Criados ou de
     um anexo, o tipo de adaptação e para quem;
   · Correção de objetiva: "Que prova corrigir?", ao lado da página Ferramentas (`/professor/ferramentas?corrigir=1`,
     14ª rodada; antes a janela Mais), com os lotes que esperam o professor; escolher um leva às notas
     (/professor/aprovar/<id>);
   · Redação e discursiva: a página de 3 passos (D55). */
export const ROTA_PROPRIA: Record<string, string> = { redacao: '/professor/ferramentas/redacao', correcao: '/professor/ferramentas?corrigir=1', adaptacao: '/professor?adaptar=1' }

/** Para onde vai quem escolhe a ferramenta: a rota própria (com a turma), ou a conversa nova com o cartão para a turma. */
export const destinoDa = (id: string, turmaId: string) => {
  const propria = ROTA_PROPRIA[id]
  if (propria) return id === 'correcao' || !turmaId ? propria : `${propria}${propria.includes('?') ? '&' : '?'}turma=${encodeURIComponent(turmaId)}`
  return `/professor/conversa/nova?ferramenta=${encodeURIComponent(id)}${turmaId ? `&turma=${encodeURIComponent(turmaId)}` : ''}`
}

/** Os documentos antigos de ferramentas que juntaram com outra passam a ser do tipo de agora. */
export const TIPO_DE_AGORA: Record<string, string> = { periodo: 'plano', recuperacao: 'atividade', mapa: 'material', diagnostica: 'prova', proposta: 'redacao' }
export const tipoDeAgora = (de: string) => TIPO_DE_AGORA[de] ?? de

/** Os endereços antigos de ferramentas (/professor/ferramentas/:id): os ids e os nomes por extenso que juntaram com
    outra vão para ela; o que saiu (Importar prova, Projeto, Roteiro de experimento) não tem para onde ir. */
const APELIDOS: Record<string, string> = {
  'mapa-mental': 'mapa', planejamento: 'periodo', 'planejamento-do-periodo': 'periodo', 'plano-de-recuperacao': 'recuperacao',
  'plano-recuperacao': 'recuperacao', 'avaliacao-diagnostica': 'diagnostica', 'proposta-de-redacao': 'proposta', 'proposta-redacao': 'proposta',
  'plano-de-aula': 'plano', 'material-didatico': 'material', 'atividade-e-lista': 'atividade', lista: 'atividade', 'correcao-de-objetiva': 'correcao',
  'simulado-enem': 'simulado', 'redacao-e-discursiva': 'redacao',
}
/** A ferramenta de agora para um id de endereço (antigo ou não), e se ela abre como mapa mental. Sem ferramenta: undefined. */
export function ferramentaDoEndereco(id: string | null | undefined): { id: string; mapa: boolean } | undefined {
  if (!id) return undefined
  const antigo = APELIDOS[id] ?? id
  const agora = tipoDeAgora(antigo)
  return ferramenta(agora) ? { id: agora, mapa: antigo === 'mapa' } : undefined
}

/** O que vai para a turma (e por isso passa por "Aprovar e enviar"). Plano e rubrica são só do professor. */
export const VAI_PARA_TURMA = ['prova', 'atividade', 'material', 'apresentacao', 'simulado', 'adaptacao']

/* O QUE NÃO É FERRAMENTA: o Assistente responde na conversa. Na Teachy cada item destes é uma ferramenta com
   formulário; aqui é um pedido. A tela mostra a lista para a professora que vem de lá não ficar procurando o botão.
   O que ela quiser guardar, salva da conversa para a biblioteca. Os pedidos não falam de uma disciplina: valem para
   a turma escolhida em Ferramentas (que vai junto para a caixa), e os que terminam em "sobre " pedem o tema. */
export const SO_PEDIR: { nome: string; pedido: string; busca: string }[] = [
  { nome: 'Ideias de atividade e dinâmica', pedido: 'Me dá três ideias de atividade em grupo, de 20 minutos cada, sobre ', busca: 'ideias de atividades dinâmicas jogos educativos brincadeiras' },
  { nome: 'Exemplos do dia a dia', pedido: 'Exemplos do dia a dia para explicar à turma ', busca: 'exemplos contextualizados tornar relevante transposição didática' },
  { nome: 'Questões sobre um texto ou PDF', pedido: 'Faz cinco questões de interpretação sobre o texto que vou anexar', busca: 'questões sobre um texto vídeo pdf interpretação' },
  { nome: 'Resumir um texto', pedido: 'Resume em dez linhas, para a turma, o texto que vou anexar', busca: 'resumo de texto resumo de vídeo resumir' },
  { nome: 'Reescrever em linguagem mais direta', pedido: 'Reescreve este enunciado em frases curtas, uma instrução por vez: ', busca: 'reescritor de texto adaptador de nível simplificar' },
  { nome: 'Perguntas por nível de dificuldade', pedido: 'Seis perguntas, da lembrança à avaliação, sobre ', busca: 'taxonomia de bloom perguntas quem sou eu flashcards' },
  { nome: 'Explicar uma habilidade da BNCC', pedido: 'O que pede, em palavras simples, a habilidade da BNCC ', busca: 'bncc descomplicada habilidade competência' },
  { nome: 'Tabela de dados para a aula', pedido: 'Monta uma tabela de apoio para a aula com ', busca: 'tabela de apoio dados planilha' },
  { nome: 'Recado para as famílias', pedido: 'Escreve um recado curto para as famílias da turma avisando a próxima prova e o que estudar', busca: 'e-mail email escolar comunicado bilhete recado pais responsáveis' },
  { nome: 'Responder um e-mail', pedido: 'Me ajuda a responder este e-mail da coordenação: ', busca: 'resposta de e-mail email responder' },
  { nome: 'Ideias para data ou evento da escola', pedido: 'Ideias para a turma participar da semana do meio ambiente, ligadas à minha disciplina', busca: 'datas comemorativas confraternizações evento feira' },
  { nome: 'Tirar uma dúvida de conteúdo', pedido: 'Qual o jeito mais simples de explicar ', busca: 'chatbot lara dúvida pergunta conversa' },
]
