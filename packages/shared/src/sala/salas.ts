import { z } from 'zod'
import { TAMANHO_MAXIMO_TOKEN_DE_CONVITE } from '../sessao/convite.js'
import { TAMANHO_MAXIMO_SLUG_NO_LOGIN } from '../sessao/matricula.js'

/**
 * A entrada pública do aluno pela turma (A1, tarefa 5.0; Tech Spec da A1, seções 4 e 7): `POST /v1/salas/abrir`, sem
 * login, com o endereço da escola e o link da sala ou o código da turma. Nada de escola nem de turma vem do cliente: a
 * escola sai do slug, e a turma e o ano, da linha do acesso vigente achada por ele.
 */

/**
 * Maior código digitado aceito: os 8 caracteres com o espaço ou o hífen que o aluno pôs entre os grupos, e folga para o
 * que ele colou. O que passa daqui é `ENTRADA_INVALIDA`; o que está dentro e não é um código vigente, `NAO_ENCONTRADO`.
 */
export const TAMANHO_MAXIMO_CODIGO_DIGITADO = 32

/**
 * Mais nomes livres que a página da sala mostra de uma vez (regra 80, itens 3 e 8): a rota é anônima, e uma lista sem
 * teto numa turma seria uma leitura sem teto a cada abertura. Uma turma de verdade tem dezenas de alunos.
 */
export const MAXIMO_DE_NOMES_NA_SALA = 500

const slug = z.string().min(1).max(TAMANHO_MAXIMO_SLUG_NO_LOGIN)

/**
 * Corpo de `POST /v1/salas/abrir`: o slug e o token do link (`/e/<slug>/turma#<token>`) **ou** o código digitado, nunca
 * os dois. Estrito: `escolaId`, `turmaId` ou qualquer campo a mais é `ENTRADA_INVALIDA`. O formato do token e do código
 * não é conferido aqui: o que não é um acesso vigente responde o mesmo `NAO_ENCONTRADO`, e a página escolhe o texto pelo
 * caminho que usou.
 */
export const esquemaPedidoAbrirSala = z.union([
  z.strictObject({ slug, token: z.string().min(1).max(TAMANHO_MAXIMO_TOKEN_DE_CONVITE) }),
  z.strictObject({ slug, codigo: z.string().min(1).max(TAMANHO_MAXIMO_CODIGO_DIGITADO) }),
])

export type PedidoAbrirSala = z.infer<typeof esquemaPedidoAbrirSala>

/**
 * Resposta de `POST /v1/salas/abrir` (sai com `no-store`): o nome da turma e os nomes livres da lista dela, cada um com
 * o id (que a reivindicação leva, 6.0) e o nome, em ordem de nome, até `MAXIMO_DE_NOMES_NA_SALA`. Nunca a matrícula, o
 * nome reivindicado ou aprovado, nem id de escola, ano ou turma. Estrito.
 */
export const esquemaRespostaSalaAberta = z.strictObject({
  turma: z.strictObject({ nome: z.string().min(1) }),
  nomes: z.array(z.strictObject({ id: z.uuid(), nome: z.string().min(1) })).max(MAXIMO_DE_NOMES_NA_SALA),
})

export type RespostaSalaAberta = z.infer<typeof esquemaRespostaSalaAberta>
