import {
  BookOpen, CalendarRange, ClipboardCheck, ClipboardList, FileInput, FileText, FlaskConical, LifeBuoy, Milestone,
  Network, NotebookPen, PenLine, Presentation, Quote, SearchCheck, SlidersHorizontal, Target, type LucideIcon,
} from 'lucide-react'

/* O CATÁLOGO DE FERRAMENTAS, como dado (20/09/2026).

   A regra que o Gabriel deu para separar as 77 ferramentas da Teachy:
   · É FERRAMENTA a ação específica que entrega um OUTPUT PRÓPRIO — um plano completo, uma apresentação, um mapa
     mental, uma prova: coisa com formato, que fica guardada na biblioteca, sai em arquivo e pode ser aplicada.
   · NÃO É ferramenta o que o chat já responde: e-mail, ideia de atividade, resumo de um texto, exemplo do dia a
     dia, pergunta sobre um PDF. Isso mora em `SO_PEDIR`, e a tela mostra como "é só pedir ao Assistente".
   A separação inteira, ferramenta por ferramenta, está em ~/Code/Turmma/pesquisa/ferramenta-ou-chat.md.

   A página, o menu da caixa de pedido e o formulário leem DAQUI: uma ferramenta nova é uma entrada nesta lista,
   não uma tela nova — o mesmo desenho do motor de formulário da Teachy (mapa, seção 1).

   SÉTIMA RODADA (20/09/2026, à noite): os campos foram conferidos, um a um, contra o mapa da Teachy
   (~/Code/Turmma/pesquisa/teachy-mapa-de-ferramentas.md). O que mudou:
   · Prova, Adaptação e Redação deixaram de ter formulário escrito à mão: têm `campos` como as outras, e o motor
     (`components/turmma/ferramentas`) desenha. `especial` continua dizendo que a TELA tem algo próprio (o cartão da
     conversa, as abas de lote e correção), não que o formulário é outro. Correção de objetiva segue sem formulário:
     é aprovação com registro (D33, D56), e abre a fila.
   · O motor ganhou o que faltava, sempre dentro dos tipos que já existiam: campo condicional (`quando`), campo que
     desce para "Mais opções" (`avancado`), grupo forçado (`grupo`), texto opcional, chips de múltipla escolha, chips
     obrigatório SEM padrão (a declaração da D5 é ato da professora), "Outro" com número ou com texto, cartões de
     múltipla escolha, cartão "outro" que abre um texto curto, cartão desabilitado, material com intervalo de
     capítulos, habilidades em modo pré-requisito, arquivo com a declaração de origem embutida. Tipo novo, um só:
     `artefato`, o seletor de item da biblioteca (Adaptação e Redação).
   · Os campos de texto NASCEM VAZIOS: `exemplo` é o placeholder (um pedido-modelo, nunca "digite aqui") e `valor` é o
     que o botão "Preencher exemplo" escreve. Estático e de graça — o exemplo gerado por IA da Teachy não entra.
   · `extras` diz quais extras transversais a ferramenta aceita: anexar arquivo (sempre com a pergunta "de quem é
     este material", D5) e buscar na web (desligada, vale só para aquela geração, e o que vier sai rotulado, D68).
   · `amostra` dá uma linha de texto de verdade para cada item de `vem`: é o que a folha "Como vai sair" mostra
     embaixo de cada cabeçalho quando a prévia não tem um item para ele. Sem barrinha de esqueleto.
   REVISÃO (20/09/2026, de madrugada), de novo contra o mapa da Teachy, procurando o que tinha ficado de fora sem
   motivo. Entrou: na Prova, "Completar lacunas" e "Ordenar" (a Teachy conta seis tipos, e a nossa Atividade já
   contava); no Planejamento do período e no Projeto, "Anexar arquivo" (o plano de ensino, o edital da feira); no
   Plano de recuperação, "Outro assunto" para o que não está no diagnóstico e "Outro" no tempo (na Teachy é texto
   livre: "5 dias"); na Diagnóstica, "Outro" no número de questões, "Dificuldade" e "Anexar arquivo".
   O que ficou de fora de propósito: disciplina e ano (a turma já diz), idioma (só em turma de língua), qualquer
   texto livre sobre aluno (D35, D57, D66), a IA lendo redação (D55), banco de questões de professores (D5),
   FUVEST/UNICAMP (D21), imagem e áudio, e o custo em créditos no botão (D40). */

export type CategoriaId = 'planejar' | 'preparar' | 'avaliar' | 'corrigir'
export type Ladrilho = 'pessego' | 'cinza' | 'preto' | 'laranja'

export const CATEGORIAS: { id: CategoriaId; nome: string; apoio: string; ladrilho: Ladrilho }[] = [
  { id: 'planejar', nome: 'Planejar', apoio: 'A aula, a sequência e o bimestre, nas datas do seu calendário', ladrilho: 'pessego' },
  { id: 'preparar', nome: 'Preparar a aula', apoio: 'O que você leva para a sala, feito do material da escola', ladrilho: 'cinza' },
  { id: 'avaliar', nome: 'Avaliar', apoio: 'Prova, lista, simulado e proposta, com a página de cada questão', ladrilho: 'preto' },
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
  '2b': { adaptacoes: 2, material: 'q2', diagnostico: true },
  '2a': { adaptacoes: 1, material: 'q2', diagnostico: true },
  '1c': { adaptacoes: 0, material: 'q2', diagnostico: true },
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
  { id: 'tempo', nome: 'Tempo adicional', detalhe: 'Indica +50% de tempo no cabeçalho e no calendário' },
  { id: 'escrita', nome: 'Resposta escrita no lugar da oral', detalhe: 'Troca apresentações e respostas faladas por escritas' },
  { id: 'visual', nome: 'Apoio visual no enunciado', detalhe: 'Esquema ou tabela junto do texto, quando o material tem' },
  { id: 'menos', nome: 'Menos itens por página', detalhe: 'Mesmo conteúdo cobrado, dividido em mais páginas' },
]
/** O que a coordenação registrou para o 2ºB: vem marcado, com a etiqueta. */
export const ADAPTACOES_REGISTRADAS = ['fonte', 'tempo']

const DETALHES = (exemplo: string): CampoDef => ({ tipo: 'longo', rotulo: 'Detalhes', exemplo, opcional: true, avancado: true })
const BNCC: CampoDef = { tipo: 'habilidades', rotulo: 'Habilidades da BNCC', modo: 'bncc', opcional: true, avancado: true }

export const CATALOGO: Ferramenta[] = [
  /* ── Planejar ─────────────────────────────────────────────────────────────────────────────── */
  {
    id: 'plano', nome: 'Plano de aula', categoria: 'planejar', icon: NotebookPen,
    curta: 'Uma aula ou a sequência inteira', texto: 'Uma aula ou a sequência didática inteira: etapas com tempo, habilidades da BNCC e o que levar.',
    promessa: 'O plano sai nas datas do seu calendário, com o capítulo e a página de cada etapa.',
    saida: ['PDF'], fonte: 'Material da escola, com a página', exemplo: 'Plano de duas aulas sobre reagente limitante, com prática em dupla',
    busca: 'sequência didática plano de aula eja roteiro de aula', verbo: 'Gerar plano',
    campos: [
      { tipo: 'cartoes', id: 'modo', grupo: 'oque', rotulo: 'O que você quer', padrao: 'aula', opcoes: [
        { id: 'aula', nome: 'Plano de aula', detalhe: 'Uma ou duas aulas, etapa por etapa, com o tempo de cada parte' },
        { id: 'sequencia', nome: 'Sequência didática', detalhe: 'Várias aulas encadeadas, já nas datas da turma no calendário' },
      ] },
      { tipo: 'turma' }, { tipo: 'material' },
      { tipo: 'texto', rotulo: 'Tema', valor: 'Reagente limitante', exemplo: 'Ex.: Reagente limitante, a partir da receita de bolo', opcional: true, dica: 'Em branco, segue o capítulo escolhido.', larga: true },
      { tipo: 'chips', rotulo: 'Aulas', opcoes: ['1', '2'], padrao: '2', quando: { campo: 'modo', igual: 'aula' } },
      { tipo: 'chips', rotulo: 'Aulas', opcoes: ['3', '4', '6', '8'], padrao: '4', personalizado: 'numero', outro: 'Quantas?', quando: { campo: 'modo', igual: 'sequencia' } },
      { tipo: 'chips', rotulo: 'Duração de cada aula', opcoes: ['45 min', '50 min', '100 min'], padrao: '50 min', personalizado: 'numero', outro: 'Minutos', dica: 'Veio do seu calendário.' },
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
  {
    id: 'periodo', nome: 'Planejamento do período', categoria: 'planejar', icon: CalendarRange,
    curta: 'O que dar em cada aula do bimestre', texto: 'O que dar em cada aula das próximas semanas ou do bimestre, direto no seu calendário.',
    promessa: 'O Assistente distribui os capítulos pelas aulas que já existem no calendário. Você revisa antes de salvar.',
    saida: ['PDF', 'XLSX'], fonte: 'Material da escola e o seu calendário', exemplo: 'Distribui o capítulo 7 pelas aulas do 2ºB até o fim do bimestre',
    busca: 'planejamento de calendário anual bimestral semanal cronograma planejamento', verbo: 'Montar planejamento',
    campos: [
      { tipo: 'aviso', topo: true, texto: 'Os dias, os horários e os feriados vêm do calendário da escola. Aqui você decide o que dar em cada aula.' },
      { tipo: 'turma' }, { tipo: 'material', varios: true },
      { tipo: 'cartoes', rotulo: 'Para qual período', padrao: 'bimestre', dica: 'As datas e o número de aulas vieram do calendário da escola.', opcoes: [
        { id: 'semanas', nome: 'Próximas 2 semanas', detalhe: '22/09 a 02/10 · 8 aulas do 2ºB' },
        { id: 'bimestre', nome: 'Até o fim do bimestre', detalhe: '22/09 a 27/11 · 38 aulas do 2ºB' },
        { id: 'proximo', nome: 'Próximo bimestre', detalhe: 'A escola ainda não publicou o calendário', desabilitado: true },
      ] },
      { tipo: 'chave', id: 'distribuir', rotulo: 'Deixar o Assistente distribuir os capítulos', detalhe: 'Usa a ordem do material e o número de aulas. Você revisa tudo antes de salvar.', ligada: true },
      { tipo: 'longo', grupo: 'como', rotulo: 'O que dar, na ordem', quando: { campo: 'distribuir', igual: 'nao' },
        valor: 'Cap. 7 estequiometria até 16/10; cap. 8 soluções em novembro; cap. 9 termoquímica só a introdução.',
        exemplo: 'Cap. 7 estequiometria até 16/10; cap. 8 soluções em novembro; cap. 9 termoquímica só a introdução.' },
      { tipo: 'chave', rotulo: 'Reservar uma aula de revisão antes de cada avaliação', ligada: true },
      DETALHES('Quero fechar estequiometria antes da prova de 01/10 e deixar soluções para novembro.'),
    ],
    extras: ['anexo'],
    vem: ['Uma linha por aula do calendário', 'Capítulo e páginas de cada aula', 'Avaliações e entregas já marcadas', 'Aulas de revisão', 'Feriados respeitados'],
    amostra: [null, 'Cap. 7, p. 150 a 153, nas quatro primeiras aulas; o cap. 8 começa em 06/10.', 'Prova do capítulo 7 em 01/10; entrega da lista em 25/09.', '29/09 e 24/11: revisão antes de cada avaliação.', '12/10 e 02/11 ficam sem aula.'],
    previa: { titulo: 'Planejamento · 2ºB · até o fim do bimestre', resumo: '38 aulas, do capítulo 7 ao 9. Nada foi salvo no calendário ainda.', itens: [
      { rotulo: '22/09 · ter', texto: 'Reagente limitante: a ideia, com a receita de bolo.', pagina: 150, em: 0 },
      { rotulo: '24/09 · qui', texto: 'Reagente em excesso: prática em dupla.', pagina: 151, em: 0 },
      { rotulo: '25/09 · sex', texto: 'Rendimento de reação: teórico e real.', pagina: 152, em: 0 },
      { rotulo: '29/09 · ter', texto: 'Revisão do capítulo 7 antes da prova.', pagina: 153, em: 0 },
    ] },
  },
  {
    id: 'projeto', nome: 'Projeto', categoria: 'planejar', icon: Milestone,
    curta: 'Etapas, entregas e rubrica do produto', texto: 'Projeto de semanas: pergunta norteadora, etapas com data, papéis no grupo e a rubrica do produto final.',
    promessa: 'Do tema ao produto final, com as entregas parciais nas datas do calendário.',
    saida: ['PDF'], fonte: 'Material da escola, com a página', exemplo: 'Um projeto de um mês sobre descarte de resíduos químicos, terminando na feira de ciências',
    busca: 'projeto interdisciplinar feira de ciências abp aprendizagem baseada em projetos', verbo: 'Gerar projeto',
    campos: [
      { tipo: 'turma', padrao: '9a' }, { tipo: 'material' },
      { tipo: 'longo', rotulo: 'O projeto que você quer', valor: 'Cada grupo investiga um resíduo químico do dia a dia da escola e propõe um descarte correto, terminando na feira de ciências.',
        exemplo: 'Cada grupo investiga um resíduo químico da escola (pilha, óleo de cozinha, reagente vencido), descobre para onde ele vai hoje e propõe um descarte correto. Termina com estande na feira de ciências.' },
      { tipo: 'chips', rotulo: 'Duração', opcoes: ['2 semanas', '1 mês', '1 bimestre'], padrao: '1 mês' },
      { tipo: 'chips', rotulo: 'Termina em', opcoes: ['Feira de ciências · 23/10', 'Fim do bimestre · 27/11', 'Sem data marcada'], padrao: 'Feira de ciências · 23/10', dica: 'Veio do calendário da escola.', larga: true },
      { tipo: 'chips', rotulo: 'Como a turma trabalha', opcoes: ['Individual', 'Duplas', 'Grupos de 4 a 5'], padrao: 'Grupos de 4 a 5' },
      { tipo: 'chips', rotulo: 'Produto final', opcoes: ['Estande', 'Relatório', 'Vídeo', 'Protótipo', 'A turma escolhe'], padrao: 'Estande', personalizado: 'texto', outro: 'Qual produto?', larga: true },
      { tipo: 'chave', rotulo: 'Com rubrica para o produto final', detalhe: 'Critérios e níveis, feitos antes de a turma começar.', ligada: true },
      { tipo: 'texto', rotulo: 'Outras disciplinas no projeto', valor: 'Biologia e Geografia', exemplo: 'Ex.: Biologia e Geografia', opcional: true, avancado: true, larga: true },
      BNCC,
    ],
    extras: ['anexo', 'web'],
    vem: ['Pergunta norteadora', 'Etapas com as datas do calendário', 'Papéis dentro do grupo', 'Entregas parciais', 'Rubrica do produto final', 'Habilidades da BNCC'],
    amostra: ['Para onde vai o resíduo químico que a nossa escola produz?', null, 'Quem pesquisa, quem registra, quem monta o estande e quem apresenta.', 'Ficha do resíduo em 02/10; proposta de descarte em 09/10.', 'Quatro critérios, três níveis: investigação, proposta, estande e fala.', 'EF09CI13 e EF09CI02, do capítulo 3.'],
    previa: { titulo: 'Projeto · resíduos químicos da escola · 9ºA', resumo: 'Quatro semanas, grupos de 4 a 5, estande na feira de 23/10.', itens: [
      { rotulo: 'Semana 1', texto: 'Pergunta norteadora e escolha do resíduo de cada grupo; leitura do capítulo.', pagina: 88, em: 1 },
      { rotulo: 'Semana 2', texto: 'Investigação: de onde vem, para onde vai, qual o risco. Entrega parcial: ficha do resíduo.', pagina: 91, em: 1 },
      { rotulo: 'Semana 3', texto: 'Proposta de descarte e montagem do estande.', pagina: 94, em: 1 },
      { rotulo: 'Semana 4', texto: 'Feira de ciências e avaliação do produto pela rubrica.', em: 1 },
    ] },
  },
  {
    id: 'recuperacao', nome: 'Plano de recuperação', categoria: 'planejar', icon: LifeBuoy,
    curta: 'Das habilidades em que a turma travou', texto: 'Parte do diagnóstico da turma: retoma as habilidades com mais erro, com exercícios graduados e uma checagem no fim.',
    promessa: 'O plano é da turma e das habilidades. Aqui não existe campo para descrever um aluno.',
    saida: ['PDF'], fonte: 'Diagnóstico da turma e material da escola', exemplo: 'Plano de duas semanas para recuperar reagente limitante e cálculo com mol no 2ºB',
    busca: 'recuperação reforço recuperação paralela retomada', verbo: 'Gerar plano de recuperação',
    campos: [
      { tipo: 'turma' }, { tipo: 'material' },
      { tipo: 'habilidades', rotulo: 'Habilidades para recuperar', modo: 'diagnostico' },
      { tipo: 'texto', rotulo: 'Ou escreva o assunto', valor: 'Conversão entre grama e mol', exemplo: 'Ex.: Conversão entre grama e mol', opcional: true, larga: true,
        dica: 'Esta turma ainda não tem avaliação corrigida: o plano parte do assunto.', quando: { campo: 'turma', igual: '9a' } },
      { tipo: 'texto', rotulo: 'Outro assunto', valor: 'Balanceamento de equações', exemplo: 'Ex.: Balanceamento de equações, do capítulo 6', opcional: true, larga: true,
        dica: 'Para retomar o que não caiu na prova e por isso não está na lista.', quando: { campo: 'turma', diferente: '9a' } },
      { tipo: 'chips', rotulo: 'Onde a turma mais erra', opcoes: ['Ver pela correção', 'No conceito', 'Na conta', 'Na leitura do enunciado'], padrao: 'Ver pela correção', dica: 'É sobre a turma, não sobre um aluno.', larga: true },
      { tipo: 'chips', rotulo: 'Em quanto tempo', opcoes: ['1 semana', '2 semanas', '3 semanas', '1 mês'], padrao: '2 semanas', personalizado: 'texto', outro: 'Ex.: 5 dias', larga: true },
      { tipo: 'cartoes', rotulo: 'Onde acontece', padrao: 'os-dois', opcoes: [
        { id: 'comeco', nome: 'No começo de cada aula', detalhe: '15 min por encontro, sem parar o capítulo' },
        { id: 'inteiras', nome: 'Em aulas inteiras', detalhe: 'Usa aulas do seu calendário' },
        { id: 'casa', nome: 'Para casa', detalhe: 'Uma lista curta por dia' },
        { id: 'os-dois', nome: 'Em aula e para casa', detalhe: 'Retomada em sala, prática em casa' },
      ] },
      { tipo: 'chips', rotulo: 'Checagem no fim', opcoes: ['5 questões objetivas', '10 questões objetivas', 'Sem checagem'], padrao: '5 questões objetivas', larga: true },
      { tipo: 'chave', rotulo: 'Avisar o Tutor do que a turma está recuperando', detalhe: 'Ele passa a puxar esses assuntos quando o aluno abrir uma sessão.', ligada: true, avancado: true },
    ],
    vem: ['Retomada do conceito, por habilidade', 'Exercícios do fácil ao difícil', 'Checagem curta no fim', 'O que o Tutor passa a reforçar'],
    amostra: [null, 'Seis exercícios por habilidade: dois diretos, dois com tabela e dois contextualizados.', null, 'Reagente limitante e conversão entre grama e mol, nas sessões de quem abrir o Tutor.'],
    previa: { titulo: 'Plano de recuperação · 2ºB · duas habilidades', resumo: 'Duas semanas, em aula e para casa. Base: a correção da prova de 18/09.', itens: [
      { rotulo: 'EM13CNT301', texto: 'Reagente limitante: retomada com a receita de bolo e seis exercícios graduados.', pagina: 150, em: 0 },
      { rotulo: 'EM13CNT104', texto: 'Cálculo com mol e massa molar: tabela de conversão e oito exercícios.', pagina: 145, em: 0 },
      { rotulo: 'Checagem', texto: 'Cinco questões objetivas no dia 02/10, corrigidas pelo Assistente e aprovadas por você.', em: 2 },
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
    curta: 'Resumo, texto de apoio, revisão', texto: 'Resumo, texto de apoio ou folha de revisão, do capítulo que você escolher e no tamanho que pedir.',
    promessa: 'Texto para a turma estudar, escrito a partir do capítulo e com a página citada.',
    saida: ['PDF'], fonte: 'Material da escola, com a página', exemplo: 'Um resumo de uma página sobre balanceamento para revisão',
    busca: 'resumo texto de apoio revisão capítulo apostila folha de estudo', verbo: 'Gerar material',
    campos: [
      { tipo: 'cartoes', id: 'tipo', grupo: 'oque', rotulo: 'Tipo de material', padrao: 'resumo', opcoes: [
        { id: 'resumo', nome: 'Resumo', detalhe: 'As ideias do capítulo em ordem, para estudar antes da prova' },
        { id: 'apoio', nome: 'Texto de apoio', detalhe: 'Um texto corrido para ler em aula e discutir' },
        { id: 'revisao', nome: 'Folha de revisão', detalhe: 'Conceito, exemplo resolvido e exercício, lado a lado' },
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
    id: 'mapa', nome: 'Mapa mental', categoria: 'preparar', icon: Network,
    curta: 'O capítulo em ramos, para projetar', texto: 'O capítulo em ramos: conceito no centro, ideias ligadas e a página do material em cada ramo.',
    promessa: 'Um mapa para projetar na aula ou imprimir, com a página de onde saiu cada ramo.',
    saida: ['PDF'], fonte: 'Material da escola, com a página', exemplo: 'Mapa mental do capítulo de estequiometria para projetar na revisão',
    busca: 'mapa mental mapa conceitual esquema organizador gráfico', verbo: 'Gerar mapa mental',
    campos: [
      { tipo: 'cartoes', grupo: 'oque', rotulo: 'Tipo de mapa', padrao: 'padrao', opcoes: [
        { id: 'padrao', nome: 'Padrão', detalhe: 'Palavras-chave em ramos, bom para projetar' },
        { id: 'texto', nome: 'Com frases', detalhe: 'Cada ramo explica a ideia em uma linha' },
        { id: 'niveis', nome: 'Em níveis', detalhe: 'Hierarquia de cima para baixo, bom para imprimir' },
      ] },
      { tipo: 'turma' }, { tipo: 'material' },
      { tipo: 'texto', rotulo: 'Assunto', valor: 'Estequiometria', exemplo: 'Ex.: Estequiometria, do mol ao rendimento', larga: true },
      { tipo: 'chips', rotulo: 'Profundidade', opcoes: ['2 níveis', '3 níveis'], padrao: '2 níveis' },
      { tipo: 'chips', rotulo: 'Ramos principais', opcoes: ['O Assistente decide', '4', '5', '6'], padrao: 'O Assistente decide', dica: 'Até seis ramos cabem bem no projetor.' },
      { tipo: 'chave', rotulo: 'Também uma versão com ramos em branco', detalhe: 'Para a turma completar na revisão.', ligada: false },
      DETALHES('Quero um ramo só para os erros mais comuns da turma.'),
    ],
    extras: ['anexo', 'web'],
    vem: ['Conceito central e ramos', 'A página do material em cada ramo', 'Versão para projetar', 'Versão em preto e branco para imprimir'],
    amostra: [null, 'Cada ramo leva a página de onde saiu: p. 131, 142, 145, 150 e 152.', 'Em paisagem, com letra grande e fundo branco.', 'A mesma hierarquia, sem cor, em uma página A4.'],
    previa: { titulo: 'Mapa mental · estequiometria · 2ºB', resumo: 'Cinco ramos em dois níveis, do capítulo 7.', itens: [
      { rotulo: 'Ramo 1', texto: 'Lei de Lavoisier: a massa se conserva.', pagina: 131, em: 0 },
      { rotulo: 'Ramo 2', texto: 'Mol e massa molar: a ponte entre grama e quantidade.', pagina: 145, em: 0 },
      { rotulo: 'Ramo 3', texto: 'Proporção: os coeficientes da equação balanceada.', pagina: 142, em: 0 },
      { rotulo: 'Ramo 4', texto: 'Reagente limitante: o que acaba primeiro manda na conta.', pagina: 150, em: 0 },
      { rotulo: 'Ramo 5', texto: 'Rendimento: teórico e real.', pagina: 152, em: 0 },
    ] },
  },
  {
    id: 'experimento', nome: 'Roteiro de experimento', categoria: 'preparar', icon: FlaskConical,
    curta: 'Passo a passo, com segurança e descarte', texto: 'Prática com o que você tem à mão: materiais, passo a passo, segurança e descarte, e as perguntas do relatório.',
    promessa: 'Todo roteiro traz a seção de segurança. Confira antes de levar à turma.',
    saida: ['PDF'], fonte: 'Material da escola, com a página', exemplo: 'Um experimento simples de conservação da massa com vinagre e bicarbonato',
    busca: 'experimento científico laboratório prática aula prática', verbo: 'Gerar roteiro',
    campos: [
      { tipo: 'turma', padrao: '1c' }, { tipo: 'material' },
      { tipo: 'texto', rotulo: 'Assunto', valor: 'Conservação da massa', exemplo: 'Ex.: Conservação da massa numa reação que solta gás', larga: true },
      { tipo: 'longo', grupo: 'oque', rotulo: 'O que você tem à mão', valor: 'Vinagre, bicarbonato, garrafa PET, balão e uma balança de cozinha.', exemplo: 'Vinagre, bicarbonato, garrafa PET, balão e uma balança de cozinha.', opcional: true },
      { tipo: 'cartoes', id: 'onde', rotulo: 'Onde vai ser', padrao: 'sala', opcoes: [
        { id: 'sala', nome: 'Sala de aula', detalhe: 'Sem fogo, sem ácido, sem vidraria' },
        { id: 'laboratorio', nome: 'Laboratório', detalhe: 'Vidraria e reagentes, com óculos e avental' },
        { id: 'demonstracao', nome: 'Demonstração sua', detalhe: 'Só você manipula; pode ter aquecimento' },
      ] },
      { tipo: 'chips', rotulo: 'Como a turma se divide', opcoes: ['Duplas', 'Grupos de 4', 'Grupos de 6'], padrao: 'Grupos de 4', dica: 'Define as quantidades de material.', quando: { campo: 'onde', diferente: 'demonstracao' } },
      { tipo: 'chips', rotulo: 'Tempo', opcoes: ['20 min', '50 min', '100 min'], padrao: '50 min', dica: 'Veio do seu calendário.' },
      BNCC,
      DETALHES('Quero que cada grupo escreva a hipótese antes e compare a massa com a garrafa aberta e fechada.'),
    ],
    extras: ['anexo', 'web'],
    vem: ['Objetivo e hipótese', 'Materiais e quantidades', 'Passo a passo', 'Segurança e descarte', 'Perguntas para o relatório'],
    amostra: ['Verificar se a massa se conserva numa reação que solta gás. Cada grupo escreve a hipótese antes de começar.', null, null, null, null],
    previa: { titulo: 'Roteiro · conservação da massa · 1ºC', resumo: '50 minutos, em sala, grupos de quatro. Materiais de cozinha.', itens: [
      { rotulo: 'Materiais', texto: 'Garrafa PET de 500 mL, balão, 50 mL de vinagre, 5 g de bicarbonato, balança de cozinha.', em: 1 },
      { rotulo: 'Passo a passo', texto: 'Pesar o sistema fechado antes e depois da reação; repetir com a garrafa aberta e comparar.', pagina: 131, em: 2 },
      { rotulo: 'Segurança', texto: 'Óculos de proteção; não apontar a garrafa para o rosto; o resíduo vai para a pia com água corrente.', em: 3 },
      { rotulo: 'Relatório', texto: 'Por que a massa "sumiu" com a garrafa aberta? O que isso diz sobre a lei de Lavoisier?', pagina: 132, em: 4 },
    ] },
  },
  {
    id: 'adaptacao', nome: 'Adaptação', categoria: 'preparar', icon: SlidersHorizontal, especial: 'adaptacao', pendente: true,
    curta: 'Você escolhe o tipo de adaptação', texto: 'A mesma prova, atividade ou material em outra forma. Você escolhe o tipo de adaptação; o conteúdo cobrado não muda.',
    promessa: 'Você escolhe o tipo de adaptação. O sistema não pede nem guarda diagnóstico, e a versão nasce esperando você.',
    saida: ['PDF'], fonte: 'O artefato que você escolher', exemplo: 'Adapta a lista de mol para fonte ampliada e enunciado direto',
    busca: 'adaptar material avaliações adaptadas acessibilidade inclusão nível de texto fonte ampliada', verbo: 'Gerar versão adaptada',
    /* D35 e D67: nenhum campo de texto. O formulário recebe o TIPO de adaptação, nunca a condição de um aluno. */
    campos: [
      { tipo: 'turma' },
      { tipo: 'artefato', id: 'origem', rotulo: 'O que adaptar', de: ['prova', 'atividade', 'diagnostica', 'material', 'proposta'], padrao: 'Prova de estequiometria · 2ºB', dica: 'Vem da sua biblioteca. O padrão é o último que você gerou para a turma.' },
      { tipo: 'arquivo', rotulo: 'Ou envie um arquivo de fora', dica: 'PDF ou Word (.docx), até 30 MB.', opcional: true, declaracao: true },
      { tipo: 'cartoes', id: 'tipos', rotulo: 'Tipo de adaptação', multiplo: true, padroes: ADAPTACOES_REGISTRADAS,
        opcoes: TIPOS_ADAPTACAO.map((t) => (ADAPTACOES_REGISTRADAS.includes(t.id) ? { ...t, etiqueta: 'da coordenação' } : t)),
        dica: 'Vêm marcadas as que a coordenação registrou para a turma. A adaptação muda a forma, nunca o que é cobrado, e o sistema não pede nem guarda diagnóstico.' },
    ],
    vem: ['As mesmas questões, em outra forma', 'Cabeçalho com o tipo de adaptação', 'Fica pendente até você aprovar'],
    amostra: [null, null, 'Nada chega ao aluno antes da sua aprovação.'],
    previa: { titulo: 'Versão adaptada · Prova de estequiometria · 2ºB', resumo: 'Mesmas dez questões, outra forma.', itens: [
      { rotulo: 'Cabeçalho', texto: 'Versão adaptada: fonte ampliada e tempo adicional (+50%).', em: 1 },
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
    busca: 'prova avaliação teste bimestral saeb questões objetivas', verbo: 'Gerar prova',
    campos: [
      { tipo: 'turma' }, { tipo: 'material' },
      { tipo: 'texto', id: 'tema', rotulo: 'Tema', valor: 'Estequiometria', exemplo: 'Ex.: Estequiometria, do balanceamento ao rendimento', larga: true },
      { tipo: 'contadores', id: 'questoes', rotulo: 'Tipo de questão', dica: 'Discursiva é você quem corrige: a IA não corrige texto de aluno.', itens: [
        { nome: 'Objetiva', valor: 8 }, { nome: 'Discursiva', valor: 2 }, { nome: 'Verdadeiro ou falso', valor: 0 }, { nome: 'Relacionar colunas', valor: 0 },
        { nome: 'Completar lacunas', valor: 0 }, { nome: 'Ordenar', valor: 0 },
      ] },
      { tipo: 'chips', rotulo: 'Dificuldade', opcoes: ['Fácil', 'Média', 'Difícil', 'Misturada'], padrao: 'Misturada', dica: 'Misturada: 3 fáceis, 5 médias e 2 difíceis.' },
      { tipo: 'chips', rotulo: 'Versões', opcoes: ['1', '2', '3', '4'], padrao: '1', dica: 'Mesmas questões, ordem e alternativas embaralhadas.' },
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
    busca: 'lista de exercícios atividade folha de exercícios questões tarefa dever de casa taxonomia de bloom', verbo: 'Gerar atividade',
    campos: [
      { tipo: 'turma' }, { tipo: 'material' },
      { tipo: 'texto', rotulo: 'Tema', valor: 'Mol e massa molar', exemplo: 'Ex.: Mol e massa molar, da conversão ao número de moléculas', larga: true },
      { tipo: 'contadores', rotulo: 'Tipo de questão', dica: 'O total é o número de exercícios da lista.', itens: [
        { nome: 'Objetiva', valor: 5 }, { nome: 'Discursiva curta', valor: 2 }, { nome: 'Verdadeiro ou falso', valor: 1 },
        { nome: 'Relacionar colunas', valor: 0 }, { nome: 'Completar lacunas', valor: 0 }, { nome: 'Ordenar', valor: 0 },
      ] },
      { tipo: 'chips', rotulo: 'Dificuldade', opcoes: ['Do fácil ao difícil', 'Misturada', 'Só fácil', 'Só média', 'Só difícil'], padrao: 'Do fácil ao difícil', larga: true },
      { tipo: 'chips', rotulo: 'Para fazer', opcoes: ['Em aula', 'Para casa', 'Revisão para a prova'], padrao: 'Para casa', dica: 'Para casa, vai junto um exemplo resolvido.', larga: true },
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
    id: 'diagnostica', nome: 'Avaliação diagnóstica', categoria: 'avaliar', icon: SearchCheck,
    curta: 'O que a turma já sabe antes do capítulo', texto: 'Sondagem curta antes de começar um assunto: cada questão mira um pré-requisito, e o resultado sai por habilidade.',
    promessa: 'Questões que sondam pré-requisito. Depois de aplicada, o resultado aparece por habilidade em Minhas turmas.',
    saida: ['PDF'], fonte: 'Material da escola, com a página', exemplo: 'Uma diagnóstica de oito questões sobre o que o 1ºC precisa saber antes de estequiometria',
    busca: 'avaliação diagnóstica sondagem pré-teste nivelamento', verbo: 'Gerar diagnóstica',
    campos: [
      { tipo: 'turma', padrao: '1c' }, { tipo: 'material', dica: 'As questões podem sair de capítulos e de anos anteriores do material da escola.' },
      { tipo: 'texto', rotulo: 'O que você vai começar a ensinar', valor: 'Estequiometria', exemplo: 'Ex.: Estequiometria (começo em 06/10)', larga: true },
      { tipo: 'habilidades', grupo: 'como', rotulo: 'Pré-requisitos para sondar', modo: 'prerequisito', opcional: true },
      { tipo: 'chips', rotulo: 'Questões', opcoes: ['6', '8', '10', '12'], padrao: '8', personalizado: 'numero', outro: 'Quantas?', dica: 'Pelo menos duas por pré-requisito, para o resultado por habilidade valer.' },
      { tipo: 'cartoes', rotulo: 'Tipo de questão', padrao: 'objetiva', opcoes: [
        { id: 'objetiva', nome: 'Só objetiva', detalhe: 'O Assistente corrige e você aprova o diagnóstico' },
        { id: 'mista', nome: 'Objetiva e discursiva curta', detalhe: 'A discursiva é você quem corrige: a IA não corrige texto de aluno' },
      ] },
      { tipo: 'chips', rotulo: 'Dificuldade', opcoes: ['Fácil', 'Média', 'Misturada'], padrao: 'Fácil', avancado: true, dica: 'Sondagem mede o que veio antes: o padrão é fácil.' },
      DETALHES('Quero sondar proporção, leitura de equação química e uso da tabela periódica. Nada de mol ainda.'),
    ],
    extras: ['anexo'],
    vem: ['Questões por pré-requisito', 'O que cada questão sonda', 'Gabarito', 'Depois de aplicada: resultado por habilidade'],
    amostra: [null, 'Questões 1 e 2: proporção. Questões 3 e 4: leitura de equação.', 'Oito respostas, cada uma com a justificativa em uma linha.', 'Em Minhas turmas, o acerto do 1ºC em cada pré-requisito.'],
    previa: { titulo: 'Diagnóstica · antes de estequiometria · 1ºC', resumo: 'Oito questões objetivas, quatro pré-requisitos.', itens: [
      { rotulo: 'Proporção', texto: 'Se 2 ovos fazem 12 biscoitos, quantos ovos para 30 biscoitos?', pagina: 12, em: 0 },
      { rotulo: 'Equação', texto: 'Qual das equações abaixo está balanceada?', pagina: 138, em: 0 },
      { rotulo: 'Tabela periódica', texto: 'Qual é a massa atômica aproximada do oxigênio?', pagina: 44, em: 0 },
    ] },
  },
  {
    id: 'simulado', nome: 'Simulado ENEM', categoria: 'avaliar', icon: Target,
    curta: 'Do banco público de questões', texto: 'Questões oficiais do ENEM, por assunto e por habilidade, com o ano e o número de cada uma.',
    promessa: 'Só questões de provas oficiais do ENEM, com o ano, o número e o gabarito oficial.',
    saida: ['PDF'], fonte: 'Banco público do ENEM', exemplo: 'Simulado de 15 questões de Química do ENEM sobre cálculo estequiométrico',
    busca: 'simulado enem vestibular questões de prática provas anteriores', verbo: 'Montar simulado',
    campos: [
      { tipo: 'cartoes', id: 'modo', grupo: 'oque', rotulo: 'Que simulado', padrao: 'assunto', opcoes: [
        { id: 'assunto', nome: 'Por assunto', detalhe: 'Você escolhe o tema e o número de questões' },
        { id: 'caderno', nome: 'Caderno da área', detalhe: '45 questões, na proporção da prova oficial' },
      ] },
      { tipo: 'turma' },
      { tipo: 'chips', id: 'area', grupo: 'oque', rotulo: 'Área', opcoes: ['Ciências da Natureza', 'Matemática', 'Linguagens', 'Ciências Humanas'], padrao: 'Ciências da Natureza', larga: true },
      { tipo: 'chips', grupo: 'oque', rotulo: 'Disciplinas', opcoes: ['Química', 'Física', 'Biologia'], multiplo: true, padroes: ['Química'], dica: 'Veio da turma. Sem marcar as outras, não entra questão de Física nem de Biologia.', larga: true, quando: { campo: 'area', igual: 'Ciências da Natureza' } },
      { tipo: 'texto', rotulo: 'Assunto', valor: 'Cálculo estequiométrico', exemplo: 'Ex.: Cálculo estequiométrico', opcional: true, dica: 'Em branco, vale a disciplina inteira.', larga: true, quando: { campo: 'modo', igual: 'assunto' } },
      { tipo: 'chips', rotulo: 'Questões', opcoes: ['10', '15', '30', '45'], padrao: '15', personalizado: 'numero', outro: 'Quantas?', quando: { campo: 'modo', igual: 'assunto' } },
      { tipo: 'chips', rotulo: 'Anos das provas', opcoes: ['2019 a 2025', '2015 a 2025', 'Desde 2009'], padrao: '2019 a 2025', larga: true },
      { tipo: 'chave', rotulo: 'Com cartão-resposta para imprimir', ligada: true },
    ],
    vem: ['Questões oficiais, com ano e número', 'Gabarito oficial', 'Habilidade da matriz do ENEM', 'Cartão-resposta'],
    amostra: [null, 'O do INEP, questão a questão.', 'H17, H24 e H25, de Ciências da Natureza.', 'Folha de marcar com quinze linhas, para imprimir.'],
    previa: { titulo: 'Simulado ENEM · cálculo estequiométrico · 2ºB', resumo: 'Quinze questões do banco público, com o ano e o número de cada uma.', itens: [
      { texto: 'ENEM 2022, questão 117 — produção de ferro-gusa e massa de CO₂ emitida.', em: 0 },
      { texto: 'ENEM 2019, questão 103 — pureza de reagente e rendimento.', em: 0 },
      { texto: 'ENEM 2021, questão 124 — combustão do etanol e proporção em mol.', em: 0 },
    ] },
  },
  {
    id: 'proposta', nome: 'Proposta de redação', categoria: 'avaliar', icon: Quote,
    curta: 'Tema, textos motivadores e rubrica', texto: 'Tema, comando e textos motivadores do material da escola, com a rubrica por competência já pronta.',
    promessa: 'A proposta sai com a rubrica antes de qualquer aluno escrever. A correção é sua: a IA não corrige redação.',
    saida: ['PDF'], fonte: 'Material da escola, com a página', exemplo: 'Proposta de redação sobre descarte de resíduos químicos nas cidades, modelo ENEM',
    busca: 'proposta de redação tema de redação textos motivadores dissertação', verbo: 'Gerar proposta',
    campos: [
      { tipo: 'turma', padrao: '2a' }, { tipo: 'material' },
      { tipo: 'longo', rotulo: 'Tema ou recorte', valor: 'O descarte de resíduos químicos nas cidades brasileiras',
        exemplo: 'O descarte de pilhas e reagentes vencidos nas cidades: de quem é a responsabilidade? Quero que usem o que viram no capítulo de metais pesados.' },
      { tipo: 'arquivo', rotulo: 'Já tem uma proposta pronta?', dica: 'PDF ou Word (.docx). Ela vira uma proposta editável, com a rubrica. Foto ainda não entra.', opcional: true, declaracao: true },
      { tipo: 'cartoes', rotulo: 'Gênero', padrao: 'enem', dica: 'A rubrica segue o gênero: não existe um campo de rubrica para preencher.',
        personalizado: { nome: 'Outro gênero', detalhe: 'Carta aberta, resenha, crônica, conto: escreva qual', exemplo: 'Ex.: Carta aberta ao prefeito' }, opcoes: [
        { id: 'enem', nome: 'Dissertativo-argumentativo', detalhe: 'No modelo do ENEM; a rubrica sai com as cinco competências' },
        { id: 'opiniao', nome: 'Artigo de opinião', detalhe: 'Tese, argumentos e um leitor definido' },
        { id: 'relatorio', nome: 'Relatório científico', detalhe: 'Objetivo, método, resultado e conclusão' },
      ] },
      { tipo: 'chips', rotulo: 'Tamanho do texto', opcoes: ['Até 30 linhas (ENEM)', '15 a 20 linhas', 'Uma página'], padrao: 'Até 30 linhas (ENEM)', dica: 'Entra no comando e define a folha de redação.', larga: true },
      { tipo: 'chave', id: 'motivadores', rotulo: 'Incluir textos motivadores', detalhe: 'Só do material da escola ou de fonte aberta, com a referência.', ligada: true },
      { tipo: 'chips', rotulo: 'Quantos textos motivadores', opcoes: ['2', '3', '4'], padrao: '2', quando: { campo: 'motivadores', igual: 'sim' } },
      { tipo: 'chave', rotulo: 'Com folha de redação para imprimir', ligada: true },
    ],
    extras: ['web'],
    vem: ['Tema e comando', 'Textos motivadores, com a fonte', 'Rubrica por competência', 'Folha de redação'],
    amostra: [null, null, null, 'Trinta linhas numeradas, com o cabeçalho da escola.'],
    previa: { titulo: 'Proposta de redação · resíduos químicos · 2ºA', resumo: 'Dissertativo-argumentativo, dois textos motivadores, rubrica de cinco competências.', itens: [
      { rotulo: 'Comando', texto: 'A partir dos textos e do que você estudou, escreva sobre os caminhos para o descarte correto de resíduos químicos nas cidades.', em: 0 },
      { rotulo: 'Texto 1', texto: 'Trecho sobre metais pesados em pilhas e baterias.', pagina: 188, em: 1 },
      { rotulo: 'Texto 2', texto: 'Tabela de tempo de decomposição e risco de contaminação.', pagina: 190, em: 1 },
      { rotulo: 'Rubrica', texto: 'Cinco competências, quatro níveis cada. Rascunho seu: edite antes de aplicar.', em: 2 },
    ] },
  },
  {
    id: 'importar', nome: 'Importar prova', categoria: 'avaliar', icon: FileInput,
    curta: 'Seu PDF ou Word vira prova editável', texto: 'A prova que você já tem em PDF ou Word vira prova editável: questão a questão, com gabarito e habilidade.',
    promessa: 'O arquivo vira uma prova editável na biblioteca. O original fica guardado junto.',
    saida: ['PDF'], fonte: 'O arquivo que você enviar', exemplo: 'Importa a prova que eu anexei e liga cada questão a uma habilidade',
    busca: 'importar prova pdf word digitalizar prova antiga', verbo: 'Importar',
    campos: [
      { tipo: 'aviso', topo: true, texto: 'Envie a prova em branco. Arquivo com nome ou resposta de aluno não entra.' },
      { tipo: 'turma', padrao: '1c' },
      /* D5: a declaração de origem é ato da professora — nasce sem nenhuma opção marcada. */
      { tipo: 'arquivo', rotulo: 'Arquivo da prova', dica: 'PDF ou Word (.docx), até 30 MB.', declaracao: true, amostra: 'prova-modelos-2025.pdf' },
      { tipo: 'chave', rotulo: 'Ligar cada questão a uma habilidade da BNCC', ligada: true },
      { tipo: 'chave', rotulo: 'Reconhecer o gabarito, se vier no arquivo', ligada: true },
      { tipo: 'arquivo', rotulo: 'Gabarito, se estiver em outro arquivo', dica: 'PDF ou Word (.docx).', opcional: true, avancado: true },
    ],
    vem: ['Prova editável, questão a questão', 'Gabarito reconhecido', 'Habilidade sugerida por questão', 'O arquivo original, guardado junto'],
    amostra: [null, 'Oito das dez respostas vieram do arquivo.', 'Questão 1: EM13CNT201, modelos atômicos. Você confirma.', 'prova-modelos-2025.pdf fica ao lado da versão editável.'],
    previa: { titulo: 'Prova importada · modelos atômicos · 1ºC', resumo: 'Dez questões reconhecidas em "prova-modelos-2025.pdf". Duas precisam da sua revisão.', itens: [
      { rotulo: 'Questão 1', texto: 'Reconhecida: objetiva, cinco alternativas, gabarito C.', em: 0 },
      { rotulo: 'Questão 4', texto: 'Tem imagem: confira se o esquema do átomo de Bohr veio inteiro.', em: 0 },
      { rotulo: 'Questão 9', texto: 'Gabarito não encontrado no arquivo: marque a resposta certa.', em: 0 },
    ] },
  },

  /* ── Corrigir ─────────────────────────────────────────────────────────────────────────────── */
  {
    id: 'correcao', nome: 'Correção de objetiva', categoria: 'corrigir', icon: ClipboardCheck, pendente: true,
    curta: 'Diagnóstico por habilidade', texto: 'O Assistente corrige a objetiva e monta o diagnóstico por habilidade. Só chega ao aluno depois que você aprova.',
    promessa: 'Correção e diagnóstico por habilidade. Nada chega ao aluno antes de você aprovar.',
    saida: ['PDF', 'XLSX'], fonte: 'As respostas da turma', exemplo: 'Corrige a prova objetiva do 2ºB e me mostra onde a turma travou',
    busca: 'corretor correção automática gabarito cartão-resposta provas em papel', verbo: 'Revisar', para: '/professor/aprovar', acao: 'Revisar o lote do 2ºB',
    /* Sem formulário por desenho: não é "preencher e gerar", é aprovação com registro (D33, D56). */
    campos: [], vem: [], previa: { titulo: '', resumo: '', itens: [] },
  },
  {
    id: 'redacao', nome: 'Redação e discursiva', categoria: 'corrigir', icon: FileText, especial: 'redacao',
    curta: 'Rubrica e lote. A IA não corrige', texto: 'Rubrica antes da aplicação, lote organizado e correção cega. Quem corrige e escreve a devolutiva é você.',
    promessa: 'Rubrica antes da aplicação, lote organizado e correção cega. A IA não corrige nem dá nota.',
    saida: ['PDF'], fonte: 'O enunciado e o material da escola', exemplo: 'Rubrica para a questão discursiva sobre a lei de Lavoisier',
    busca: 'corretor de redação rubrica discursiva correção cega critérios', verbo: 'Gerar rubrica',
    /* D55: tudo aqui é sobre a resposta ESPERADA, antes da aplicação. Nenhum campo recebe texto de aluno. */
    campos: [
      { tipo: 'cartoes', id: 'para', grupo: 'oque', rotulo: 'Rubrica para', padrao: 'discursiva', opcoes: [
        { id: 'discursiva', nome: 'Questão discursiva', detalhe: 'Critérios tirados do enunciado e do capítulo' },
        { id: 'redacao', nome: 'Redação', detalhe: 'Critérios por competência, do gênero da proposta' },
      ] },
      { tipo: 'turma', padrao: '1c' }, { tipo: 'material' },
      { tipo: 'longo', id: 'enunciado', rotulo: 'Enunciado da questão', quando: { campo: 'para', igual: 'discursiva' },
        valor: 'Explique a lei de Lavoisier e mostre, com um exemplo de reação, por que ela vale em sistema fechado.',
        exemplo: 'Cole o enunciado. Ex.: Explique a lei de Lavoisier e mostre, com um exemplo, por que ela vale em sistema fechado.' },
      { tipo: 'artefato', id: 'proposta', rotulo: 'Proposta', de: ['proposta'], dica: 'A proposta já sai com a rubrica por competência. Aqui você ajusta os níveis.', quando: { campo: 'para', igual: 'redacao' } },
      { tipo: 'longo', grupo: 'oque', rotulo: 'O que você cobra', opcional: true, dica: 'É sobre a resposta esperada, antes de aplicar. Nunca sobre o texto de um aluno.',
        valor: 'Enunciar a lei com as próprias palavras, dar um exemplo com as massas e explicar o sistema fechado. Ortografia não entra.',
        exemplo: 'Enunciar a lei com as próprias palavras, dar um exemplo com as massas e explicar o sistema fechado. Ortografia não entra.' },
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

/* O QUE NÃO É FERRAMENTA: o Assistente responde na conversa. Na Teachy cada item destes é uma ferramenta com
   formulário; aqui é um pedido. A tela mostra a lista para a professora que vem de lá não ficar procurando o botão.
   O que ela quiser guardar, salva da conversa para a biblioteca. */
export const SO_PEDIR: { nome: string; pedido: string; busca: string }[] = [
  { nome: 'Ideias de atividade e dinâmica', pedido: 'Me dá três ideias de atividade em grupo sobre reagente limitante, de 20 minutos cada', busca: 'ideias de atividades dinâmicas jogos educativos brincadeiras' },
  { nome: 'Exemplos do dia a dia', pedido: 'Exemplos do cotidiano para explicar mol a uma turma de 2º ano', busca: 'exemplos contextualizados tornar relevante transposição didática' },
  { nome: 'Questões sobre um texto ou PDF', pedido: 'Faz cinco questões de interpretação sobre o texto que vou anexar', busca: 'questões sobre um texto vídeo pdf interpretação' },
  { nome: 'Resumir um texto', pedido: 'Resume em dez linhas, para o 9ºA, o texto que vou anexar', busca: 'resumo de texto resumo de vídeo resumir' },
  { nome: 'Reescrever em linguagem mais direta', pedido: 'Reescreve este enunciado em frases curtas, uma instrução por vez: ', busca: 'reescritor de texto adaptador de nível simplificar' },
  { nome: 'Perguntas por nível de dificuldade', pedido: 'Seis perguntas sobre a lei de Lavoisier, da lembrança à avaliação', busca: 'taxonomia de bloom perguntas quem sou eu flashcards' },
  { nome: 'Explicar uma habilidade da BNCC', pedido: 'O que a habilidade EM13CNT101 pede, em palavras simples, e como ela aparece no capítulo 7?', busca: 'bncc descomplicada habilidade competência' },
  { nome: 'Tabela de dados para a aula', pedido: 'Monta uma tabela com a massa molar dos vinte primeiros elementos', busca: 'tabela de apoio dados planilha' },
  { nome: 'Recado para as famílias', pedido: 'Escreve um recado curto para as famílias do 2ºB avisando a prova de 25/09 e o que estudar', busca: 'e-mail email escolar comunicado bilhete recado pais responsáveis' },
  { nome: 'Responder um e-mail', pedido: 'Me ajuda a responder este e-mail da coordenação: ', busca: 'resposta de e-mail email responder' },
  { nome: 'Ideias para data ou evento da escola', pedido: 'Ideias de Química para a semana do meio ambiente, com o 9ºA', busca: 'datas comemorativas confraternizações evento feira' },
  { nome: 'Tirar uma dúvida de conteúdo', pedido: 'Qual o jeito mais simples de explicar por que o reagente em excesso sobra?', busca: 'chatbot lara dúvida pergunta conversa' },
]
