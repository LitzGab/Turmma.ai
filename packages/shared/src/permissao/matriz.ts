/**
 * Quem pode chamar o quê, declarado num lugar só (RF17). Toda rota autenticada da API aponta para uma célula
 * daqui com `@Permite(recurso, acao)`, e a guarda de permissão barra pelo papel da sessão.
 *
 * O alcance diz até onde a célula chega, e é o repository que o aplica ao objeto (regra 10, item 4):
 * - `nunca`: o papel não chama a rota, e ela responde como inexistente;
 * - `proprio`: só o que é da própria pessoa (a sessão, o próprio vínculo, o próprio indicador);
 * - `turma_vinculada`: só turma com vínculo confirmado da pessoa;
 * - `unidade`: a escola do contexto inteira;
 * - `agregado`: só números somados, nunca uma pessoa identificável;
 * - `nominal_auditado`: pessoa identificada, com finalidade e registro em auditoria.
 *
 * A matriz de visibilidade da regra 60, item 11: a rede vê agregado; a coordenação vê a unidade; o professor
 * vê as turmas dele; o aluno vê a si. O indicador de professor segue a regra 70, item 8 (D45).
 */

/** O papel da pessoa na escola. A rede só é declarada aqui: no F1 ela não tem usuário nem rota (F14). */
export const PAPEIS = ['rede', 'coordenador', 'professor', 'aluno'] as const
export type Papel = (typeof PAPEIS)[number]

/** Os papéis que um `usuario` pode ter numa escola. */
export const PAPEIS_DE_USUARIO = ['coordenador', 'professor', 'aluno'] as const satisfies readonly Papel[]
export type PapelDeUsuario = (typeof PAPEIS_DE_USUARIO)[number]

export const ALCANCES = ['nunca', 'proprio', 'turma_vinculada', 'unidade', 'agregado', 'nominal_auditado'] as const
export type Alcance = (typeof ALCANCES)[number]

/** Os alcances que identificam uma pessoa. A rede nunca tem nenhum deles (regra 10, item 8). */
export const ALCANCES_INDIVIDUAIS = ['proprio', 'turma_vinculada', 'unidade', 'nominal_auditado'] as const satisfies readonly Alcance[]

/** Os recursos e as ações de cada um: as rotas do F1 (Tech Spec, seção 4), as do F0 e o indicador de professor. */
export const RECURSOS = {
  /** `GET /v1/sistema/contexto`: a própria sessão. */
  sistema_contexto: ['ler'],
  /** `/v1/sistema/jobs-sinteticos`: só teste e carga, com `ROTAS_SINTETICAS=true`. */
  sistema_job_sintetico: ['criar', 'ler'],
  /** `GET /v1/eu`. */
  eu: ['ler'],
  /** `POST /v1/sessao/atividade`, `DELETE /v1/sessao` e `POST /v1/sessao/escola` com token. */
  sessao: ['registrar_atividade', 'encerrar', 'trocar_escola'],
  /** `PUT /v1/escola/provedores` e `PUT /v1/escola/sessao`. */
  escola_configuracao: ['alterar'],
  ano_letivo: ['ler', 'criar', 'abrir', 'encerrar'],
  serie: ['ler', 'criar'],
  /** `renomear` e `excluir` são `PATCH` e `DELETE /v1/disciplinas/:id` (A1, 1.0), só da coordenação. */
  disciplina: ['ler', 'criar', 'renomear', 'excluir'],
  /**
   * `ler` é a turma aberta por id (`GET /v1/turmas/:id`, 9.0); `listar` é a listagem do ano em curso, só da coordenação;
   * `renomear` e `excluir` são `PATCH` e `DELETE /v1/turmas/:id` (A1, 1.0), também só dela.
   */
  turma: ['ler', 'listar', 'criar', 'renomear', 'excluir'],
  /** `GET /v1/turmas/:id/alunos`. */
  aluno_da_turma: ['ler'],
  /** Criar e encerrar é da coordenação; confirmar e contestar, do professor dono. */
  vinculo: ['ler', 'criar', 'encerrar', 'ler_proprios', 'confirmar', 'contestar'],
  /** `POST /v1/usuarios/:id/mfa/redefinir`. */
  usuario_mfa: ['redefinir'],
  /** Uso e desempenho das turmas de um professor (D45): o agregado e o nominal são leituras diferentes. */
  indicador_professor: ['ler_agregado', 'ler_nominal'],
} as const satisfies Record<string, readonly string[]>

export type Recurso = keyof typeof RECURSOS
export type AcaoDe<R extends Recurso> = (typeof RECURSOS)[R][number]

type CelulasDoPapel = { readonly [R in Recurso]: { readonly [A in AcaoDe<R>]: Alcance } }

export const MATRIZ: { readonly [P in Papel]: CelulasDoPapel } = {
  rede: {
    sistema_contexto: { ler: 'nunca' },
    sistema_job_sintetico: { criar: 'nunca', ler: 'nunca' },
    eu: { ler: 'nunca' },
    sessao: { registrar_atividade: 'nunca', encerrar: 'nunca', trocar_escola: 'nunca' },
    escola_configuracao: { alterar: 'nunca' },
    ano_letivo: { ler: 'nunca', criar: 'nunca', abrir: 'nunca', encerrar: 'nunca' },
    serie: { ler: 'nunca', criar: 'nunca' },
    disciplina: { ler: 'nunca', criar: 'nunca', renomear: 'nunca', excluir: 'nunca' },
    turma: { ler: 'nunca', listar: 'nunca', criar: 'nunca', renomear: 'nunca', excluir: 'nunca' },
    aluno_da_turma: { ler: 'nunca' },
    vinculo: { ler: 'nunca', criar: 'nunca', encerrar: 'nunca', ler_proprios: 'nunca', confirmar: 'nunca', contestar: 'nunca' },
    usuario_mfa: { redefinir: 'nunca' },
    indicador_professor: { ler_agregado: 'agregado', ler_nominal: 'nunca' },
  },
  coordenador: {
    sistema_contexto: { ler: 'proprio' },
    sistema_job_sintetico: { criar: 'unidade', ler: 'unidade' },
    eu: { ler: 'proprio' },
    sessao: { registrar_atividade: 'proprio', encerrar: 'proprio', trocar_escola: 'proprio' },
    escola_configuracao: { alterar: 'unidade' },
    ano_letivo: { ler: 'unidade', criar: 'unidade', abrir: 'unidade', encerrar: 'unidade' },
    serie: { ler: 'unidade', criar: 'unidade' },
    disciplina: { ler: 'unidade', criar: 'unidade', renomear: 'unidade', excluir: 'unidade' },
    turma: { ler: 'unidade', listar: 'unidade', criar: 'unidade', renomear: 'unidade', excluir: 'unidade' },
    aluno_da_turma: { ler: 'nominal_auditado' },
    vinculo: { ler: 'unidade', criar: 'unidade', encerrar: 'unidade', ler_proprios: 'nunca', confirmar: 'nunca', contestar: 'nunca' },
    usuario_mfa: { redefinir: 'unidade' },
    indicador_professor: { ler_agregado: 'agregado', ler_nominal: 'nominal_auditado' },
  },
  professor: {
    sistema_contexto: { ler: 'proprio' },
    sistema_job_sintetico: { criar: 'unidade', ler: 'unidade' },
    eu: { ler: 'proprio' },
    sessao: { registrar_atividade: 'proprio', encerrar: 'proprio', trocar_escola: 'proprio' },
    escola_configuracao: { alterar: 'nunca' },
    ano_letivo: { ler: 'nunca', criar: 'nunca', abrir: 'nunca', encerrar: 'nunca' },
    serie: { ler: 'nunca', criar: 'nunca' },
    disciplina: { ler: 'nunca', criar: 'nunca', renomear: 'nunca', excluir: 'nunca' },
    turma: { ler: 'turma_vinculada', listar: 'nunca', criar: 'nunca', renomear: 'nunca', excluir: 'nunca' },
    aluno_da_turma: { ler: 'turma_vinculada' },
    vinculo: { ler: 'nunca', criar: 'nunca', encerrar: 'nunca', ler_proprios: 'proprio', confirmar: 'proprio', contestar: 'proprio' },
    usuario_mfa: { redefinir: 'nunca' },
    indicador_professor: { ler_agregado: 'nunca', ler_nominal: 'proprio' },
  },
  aluno: {
    sistema_contexto: { ler: 'proprio' },
    sistema_job_sintetico: { criar: 'nunca', ler: 'nunca' },
    eu: { ler: 'proprio' },
    sessao: { registrar_atividade: 'proprio', encerrar: 'proprio', trocar_escola: 'nunca' },
    escola_configuracao: { alterar: 'nunca' },
    ano_letivo: { ler: 'nunca', criar: 'nunca', abrir: 'nunca', encerrar: 'nunca' },
    serie: { ler: 'nunca', criar: 'nunca' },
    disciplina: { ler: 'nunca', criar: 'nunca', renomear: 'nunca', excluir: 'nunca' },
    turma: { ler: 'nunca', listar: 'nunca', criar: 'nunca', renomear: 'nunca', excluir: 'nunca' },
    aluno_da_turma: { ler: 'nunca' },
    vinculo: { ler: 'nunca', criar: 'nunca', encerrar: 'nunca', ler_proprios: 'nunca', confirmar: 'nunca', contestar: 'nunca' },
    usuario_mfa: { redefinir: 'nunca' },
    indicador_professor: { ler_agregado: 'nunca', ler_nominal: 'nunca' },
  },
}

/**
 * O alcance da célula. Recurso, ação ou papel fora da matriz dão `nunca`: o que ninguém declarou nasce
 * fechado, mesmo chegando por um texto que o tipo não pegou.
 */
export function alcanceDe(papel: string, recurso: string, acao: string): Alcance {
  if (!Object.hasOwn(MATRIZ, papel)) return 'nunca'
  const celulas: Readonly<Record<string, Readonly<Record<string, Alcance>>>> = MATRIZ[papel as Papel]
  if (!Object.hasOwn(celulas, recurso)) return 'nunca'
  const doRecurso = celulas[recurso] ?? {}
  return Object.hasOwn(doRecurso, acao) ? (doRecurso[acao] ?? 'nunca') : 'nunca'
}
