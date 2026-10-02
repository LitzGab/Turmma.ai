import type { EtapaDeLogin, PapelDeUsuario } from '@educa/shared'

/**
 * A base da área de cada papel (`docs/interface.md` 11.1). Cada área vem num chunk próprio, por `import()`, e só depois
 * de a guarda de papel de `rotas.tsx` conferir que a sessão é daquele papel: o professor que digita o endereço da
 * coordenação vê "Página não encontrada" e não baixa nada da área dela.
 */
export const BASE_DA_AREA: Readonly<Record<PapelDeUsuario, string>> = { coordenador: '/coordenacao', professor: '/professor', aluno: '/aluno' }

/** As rotas da área do professor, relativas à base dela (o `Route` aninhado de `rotas.tsx`). */
export const ROTAS_DO_PROFESSOR = {
  /** As turmas e disciplinas que a coordenação alocou: confirmar ou contestar cada uma (F1, RF4 e D73). */
  turmas: '/turmas',
} as const

/** As rotas da área da coordenação, relativas à base dela. */
export const ROTAS_DA_COORDENACAO = {
  /** Onde a escola se monta: ano letivo, séries, disciplinas, turmas e alocação (A1, 13.0; `docs/interface.md` 3 e 11.1). */
  estrutura: '/estrutura',
  /** Uma turma aberta dentro de Estrutura, com a lista de nomes dela (13.0) e, na 16.0, os pedidos. */
  turma: '/estrutura/turmas/:turmaId',
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
  /** A turma do aluno aprovado, com a escola e a série, sem colegas (A1, 12.0; RF13). */
  minhaTurma: '/minha-turma',
} as const

/** Os endereços da web, num lugar só. */
export const ROTAS = {
  inicio: '/',
  entrar: '/entrar',
  /** O endereço da escola, por onde o aluno entra (RF7). O slug vem do parâmetro da rota. */
  escola: '/e/:slug',
  mfa: '/mfa',
  configurarMfa: '/mfa/configurar',
  escolherEscola: '/escolher-escola',
  /** "Turmas" do professor, pela raiz: é o endereço que a navegação usa. */
  turmas: `${BASE_DA_AREA.professor}${ROTAS_DO_PROFESSOR.turmas}`,
  /** Estrutura da coordenação, pela raiz: é o endereço que a navegação usa, e onde a coordenação abre (13.0). */
  estrutura: `${BASE_DA_AREA.coordenador}${ROTAS_DA_COORDENACAO.estrutura}`,
  /** "Minha turma" do aluno, pela raiz: é o endereço que a navegação usa. */
  minhaTurma: `${BASE_DA_AREA.aluno}${ROTAS_DO_ALUNO.minhaTurma}`,
  /** O convite do primeiro coordenador. O token vai no fragmento `#`, e nunca no caminho nem na consulta. */
  convite: '/convite',
  /** Estado do sistema, público: é a tela que se abre justamente quando não se consegue entrar. */
  sistema: '/sistema',
} as const

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
