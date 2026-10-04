import type { EtapaDeLogin, PapelDeUsuario } from '@educa/shared'

/**
 * A base da área de cada papel (`docs/interface.md` 11.1). Cada área vem num chunk próprio, por `import()`, e só depois
 * de a guarda de papel de `rotas.tsx` conferir que a sessão é daquele papel: o professor que digita o endereço da
 * coordenação vê "Página não encontrada" e não baixa nada da área dela.
 */
export const BASE_DA_AREA: Readonly<Record<PapelDeUsuario, string>> = { coordenador: '/coordenacao', professor: '/professor', aluno: '/aluno' }

/** As rotas da área do professor, relativas à base dela (o `Route` aninhado de `rotas.tsx`). */
export const ROTAS_DO_PROFESSOR = {
  /** "Nova conversa", a Home: a caixa de pedido do Assistente de ensino. É onde o professor abre (A2; D73; `docs/interface.md` 11.2). */
  novaConversa: '/nova-conversa',
  /** A conversa da professora com o Assistente: uma thread só, dela (A2; 11.3). */
  conversa: '/conversa',
  /** O catálogo de ferramentas, nas categorias da D74, e o que já foi gerado. */
  ferramentas: '/ferramentas',
  /** O formulário de uma ferramenta: o mesmo motor do cartão da conversa (D18). */
  ferramenta: '/ferramentas/:ferramenta',
  /** Um artefato aberto: a atividade ou o plano, com a página de origem e as versões adaptadas. */
  artefato: '/artefatos/:artefatoId',
  /** Seu time › Assistente de ensino: o que as funções dele fizeram e o que espera a professora (11.4). */
  timeDoAssistente: '/time/assistente',
  /** As turmas e disciplinas que a coordenação alocou: confirmar ou contestar cada uma (F1, RF4 e D73). */
  turmas: '/turmas',
  /** Uma turma aberta dentro de Turmas, com o acesso dos alunos (A1, 15.0; RF9) e, na 16.0, os pedidos. */
  turma: '/turmas/:turmaId',
} as const

/** O endereço da turma aberta pelo professor, **relativo à área**, como o da Estrutura (`caminhoDaTurmaNaEstrutura`). */
export function caminhoDaTurmaDoProfessor(turmaId: string): string {
  return ROTAS_DO_PROFESSOR.turma.replace(':turmaId', encodeURIComponent(turmaId))
}

/** O endereço do formulário de uma ferramenta, **relativo à área**. */
export function caminhoDaFerramentaDoProfessor(ferramenta: string): string {
  return ROTAS_DO_PROFESSOR.ferramenta.replace(':ferramenta', encodeURIComponent(ferramenta))
}

/** O nome do parâmetro que leva a atividade de origem ao formulário da Adaptação: o id do artefato, e nada sobre aluno. */
export const PARAMETRO_DA_ORIGEM = 'origem'

/** O endereço da Adaptação já com a atividade de origem escolhida, **relativo à área**: é o "Pedir versão adaptada" do artefato. */
export function caminhoDaAdaptacaoDoArtefato(artefatoId: string): string {
  return `${caminhoDaFerramentaDoProfessor('adaptacao')}?${PARAMETRO_DA_ORIGEM}=${encodeURIComponent(artefatoId)}`
}

/** O endereço de um artefato aberto, **relativo à área**. */
export function caminhoDoArtefatoDoProfessor(artefatoId: string): string {
  return ROTAS_DO_PROFESSOR.artefato.replace(':artefatoId', encodeURIComponent(artefatoId))
}

/** As rotas da área da coordenação, relativas à base dela. */
export const ROTAS_DA_COORDENACAO = {
  /** Onde a escola se monta: ano letivo, séries, disciplinas, turmas e alocação (A1, 13.0; `docs/interface.md` 3 e 11.1). */
  estrutura: '/estrutura',
  /** Uma turma aberta dentro de Estrutura, com a lista de nomes dela (13.0) e, na 16.0, os pedidos. */
  turma: '/estrutura/turmas/:turmaId',
  /** Os professores da escola e o convite de cada um: cadastrar, copiar o link, refazer e revogar (A1, 14.0; RF6). */
  professores: '/professores',
  /** O material da escola: enviar o PDF com a licença declarada e acompanhar a leitura (MVP, A2; D75). */
  material: '/material',
} as const

/**
 * O endereço da turma aberta na Estrutura, **relativo à área**: o link sai de dentro do `Route` aninhado em `/coordenacao`,
 * onde o wouter resolve o `to` a partir da base da área.
 */
export function caminhoDaTurmaNaEstrutura(turmaId: string): string {
  return ROTAS_DA_COORDENACAO.turma.replace(':turmaId', encodeURIComponent(turmaId))
}

/** As rotas da área do aluno, relativas à base dela. */
export const ROTAS_DO_ALUNO = {
  /** O Tutor pelo item da lateral: o aluno escolhe a atividade em que quer ajuda (MVP, A4; `docs/interface.md` 11.6). */
  tutor: '/tutor',
  /** A conversa com o Tutor numa atividade: é por atividade que a conversa existe. */
  tutorDaAtividade: '/tutor/:atividadeAplicadaId',
  /** O que a professora atribuiu à turma do aluno, com o estado de cada atividade. É onde o aluno abre (MVP, A3). */
  atividades: '/atividades',
  /** Uma atividade aberta: uma questão por vez e, depois de aprovada a correção, o diagnóstico. */
  atividade: '/atividades/:atividadeAplicadaId',
  /** A turma do aluno aprovado, com a escola e a série, sem colegas (A1, 12.0; RF13). */
  minhaTurma: '/minha-turma',
} as const

/** O endereço de uma atividade aberta pelo aluno, **relativo à área**. */
export function caminhoDaAtividadeDoAluno(atividadeAplicadaId: string): string {
  return ROTAS_DO_ALUNO.atividade.replace(':atividadeAplicadaId', encodeURIComponent(atividadeAplicadaId))
}

/** O nome do parâmetro que leva ao Tutor a questão em que o aluno estava: só o número dela. */
export const PARAMETRO_DA_QUESTAO = 'questao'

/**
 * O endereço da conversa com o Tutor numa atividade, **relativo à área**; com a questão, é o "Pedir ajuda ao Tutor nesta
 * questão". Vão só o id da atividade e o número da questão: nada do que o aluno marcou nem escreveu.
 */
export function caminhoDoTutorNaAtividade(atividadeAplicadaId: string, questao?: number): string {
  const caminho = ROTAS_DO_ALUNO.tutorDaAtividade.replace(':atividadeAplicadaId', encodeURIComponent(atividadeAplicadaId))
  return questao === undefined ? caminho : `${caminho}?${PARAMETRO_DA_QUESTAO}=${String(questao)}`
}

/** Os endereços da web, num lugar só. */
export const ROTAS = {
  inicio: '/',
  entrar: '/entrar',
  /** O endereço da escola, por onde o aluno entra (RF7). O slug vem do parâmetro da rota. */
  escola: '/e/:slug',
  /**
   * A página pública da turma, por onde o aluno reivindica o nome (A1, 17.0): o link da sala (`#<token>`) ou o código
   * digitado. O token vai no fragmento, como o do convite, e nunca no caminho nem na consulta.
   */
  salaDaTurma: '/e/:slug/turma',
  mfa: '/mfa',
  configurarMfa: '/mfa/configurar',
  escolherEscola: '/escolher-escola',
  /** "Nova conversa" do professor, pela raiz: é onde ele abre (A2), e o endereço que a navegação usa. */
  novaConversa: `${BASE_DA_AREA.professor}${ROTAS_DO_PROFESSOR.novaConversa}`,
  /** A conversa com o Assistente, pela raiz: dentro dela, "Nova conversa" continua selecionado na lateral. */
  conversa: `${BASE_DA_AREA.professor}${ROTAS_DO_PROFESSOR.conversa}`,
  /** "Ferramentas" do professor, pela raiz. */
  ferramentas: `${BASE_DA_AREA.professor}${ROTAS_DO_PROFESSOR.ferramentas}`,
  /** Os artefatos abertos, pela raiz: dentro deles, "Ferramentas" continua selecionado na lateral. */
  artefatos: `${BASE_DA_AREA.professor}/artefatos`,
  /** Seu time › Assistente de ensino, pela raiz: é o endereço da linha do agente na lateral. */
  timeDoAssistente: `${BASE_DA_AREA.professor}${ROTAS_DO_PROFESSOR.timeDoAssistente}`,
  /** "Turmas" do professor, pela raiz: é o endereço que a navegação usa. */
  turmas: `${BASE_DA_AREA.professor}${ROTAS_DO_PROFESSOR.turmas}`,
  /** Estrutura da coordenação, pela raiz: é o endereço que a navegação usa, e onde a coordenação abre (13.0). */
  estrutura: `${BASE_DA_AREA.coordenador}${ROTAS_DA_COORDENACAO.estrutura}`,
  /** Professores da coordenação, pela raiz: é o endereço que a navegação usa (14.0). */
  professores: `${BASE_DA_AREA.coordenador}${ROTAS_DA_COORDENACAO.professores}`,
  /** Material da coordenação, pela raiz: é o endereço que a navegação usa (MVP, A2). */
  material: `${BASE_DA_AREA.coordenador}${ROTAS_DA_COORDENACAO.material}`,
  /** O Tutor do aluno, pela raiz: é o endereço que a navegação usa. */
  tutor: `${BASE_DA_AREA.aluno}${ROTAS_DO_ALUNO.tutor}`,
  /** "Atividades" do aluno, pela raiz: é onde ele abre (MVP, A3), e o endereço que a navegação usa. */
  atividades: `${BASE_DA_AREA.aluno}${ROTAS_DO_ALUNO.atividades}`,
  /** "Minha turma" do aluno, pela raiz: é o endereço que a navegação usa. */
  minhaTurma: `${BASE_DA_AREA.aluno}${ROTAS_DO_ALUNO.minhaTurma}`,
  /** O convite da coordenação e o do professor. O token vai no fragmento `#`, e nunca no caminho nem na consulta. */
  convite: '/convite',
  /** Estado do sistema, público: é a tela que se abre justamente quando não se consegue entrar. */
  sistema: '/sistema',
  /**
   * A galeria das peças (`galeria/Galeria.tsx`): fora da navegação, sem sessão e sem API, só com dado inventado. Existe
   * para o e2e provar as peças antes de as telas existirem; ninguém chega a ela por um link do produto.
   */
  galeria: '/galeria',
} as const

/**
 * O endereço da sala da turma, por onde o aluno reivindica o nome: `/e/<slug>/turma` (Tech Spec da A1, seção 4). O token
 * do link vai no fragmento `#`, como o do convite, e nunca no caminho nem na consulta.
 */
export function caminhoDaSala(slug: string): string {
  return ROTAS.salaDaTurma.replace(':slug', encodeURIComponent(slug))
}

/** O endereço da escola, onde o aluno aprovado entra com a matrícula e a senha (RF7 do F1). */
export function caminhoDaEscola(slug: string): string {
  return ROTAS.escola.replace(':slug', encodeURIComponent(slug))
}

/**
 * A tela de cada etapa que o login pode devolver (Tech Spec, seção 5, "Etapas"). `pronta` já tem sessão e vai para
 * a área autenticada; as outras seguem para a tela da etapa, sem sessão nenhuma gravada.
 */
export const ROTA_DA_ETAPA: Readonly<Record<EtapaDeLogin, string>> = {
  pronta: ROTAS.inicio,
  mfa: ROTAS.mfa,
  configurar_mfa: ROTAS.configurarMfa,
  escolher: ROTAS.escolherEscola,
}
