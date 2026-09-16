import {
  DURACAO_DA_SESSAO_HORAS,
  EmissorDeToken,
  ErroDeDominio,
  erroDoPostgresEm,
  executarNoContexto,
  TAMANHO_MINIMO_CHAVE_ASSINATURA,
  validarAmbiente,
  type Banco,
} from '@educa/nucleo'
import { CodigoDeErro, type PapelDeUsuario } from '@educa/shared'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { CriacaoDeSessaoRepository } from './criacao-de-sessao.repository.js'
import { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'

/** Sessões de uma vez, no máximo: o cenário de carga pede cerca de mil de uma escola. */
export const QUANTIDADE_MAXIMA_DE_SESSOES_SINTETICAS = 5_000

/** Nome fixo de toda pessoa sintética: nenhum nome real, nem parecido com um, entra pelo comando. */
export const NOME_SINTETICO = 'Pessoa sintética'

export const MOTIVO_SESSAO_SINTETICA_FORA_DO_LOCAL = 'ops:sessao-sintetica só roda com AMBIENTE=local: sessão de teste não existe em staging nem em produção'

const esquemaAmbiente = z
  .object({
    // Opcional só para a ausência cair na mesma recusa, com o motivo: nada além de `local` passa.
    AMBIENTE: z.string().optional(),
    IDENTIDADE_CHAVE_ASSINATURA: z.string().min(TAMANHO_MINIMO_CHAVE_ASSINATURA),
  })
  .superRefine((valores, contexto) => {
    if (valores.AMBIENTE !== 'local') contexto.addIssue({ code: 'custom', path: ['AMBIENTE'], message: MOTIVO_SESSAO_SINTETICA_FORA_DO_LOCAL })
  })

export interface PedidoDeSessoesSinteticas {
  readonly escolaId: string
  readonly papel: PapelDeUsuario
  readonly quantidade: number
}

export interface SessaoSintetica {
  readonly usuarioId: string
  readonly sessaoId: string
  readonly token: string
}

/**
 * O emissor da chave do ambiente, só com `AMBIENTE=local`. Com `AMBIENTE` ausente ou diferente, recusa com
 * `ConfiguracaoInvalida` antes de qualquer banco: a sessão sintética não vira porta em staging nem em produção.
 */
export function emissorDeTokenSintetico(ambiente: Record<string, string | undefined>): EmissorDeToken {
  const { IDENTIDADE_CHAVE_ASSINATURA: chave } = validarAmbiente(esquemaAmbiente, ambiente)
  return new EmissorDeToken(new TextEncoder().encode(chave))
}

/** Hash de um refresh sorteado que ninguém guarda: a sessão sintética não se renova. */
function refreshHashDescartavel(): string {
  return createHash('sha256').update(randomBytes(32)).digest('hex')
}

/**
 * Cria, na escola pedida, `quantidade` usuários sintéticos com o papel pedido e uma sessão para cada, e emite o
 * token de cada sessão pelo `EmissorDeToken`. É o que `ops:sessao-sintetica` e os testes usam para montar a sessão
 * real que a `GuardaDeSessao` lê.
 *
 * - Só com `AMBIENTE=local` (ver `emissorDeTokenSintetico`).
 * - Tudo numa transação, no contexto da escola pedida: usuário e sessão são gravados nela, nunca em outra.
 * - Professor e coordenador precisam de conta (a equipe entra por e-mail): cada um ganha uma conta com e-mail
 *   sintético no domínio reservado `.invalid`, que não recebe mensagem. Aluno não tem conta.
 * - Escola inexistente sai como `NAO_ENCONTRADO`, sem o id na mensagem.
 */
export async function criarSessoesSinteticas(
  banco: Banco,
  ambiente: Record<string, string | undefined>,
  pedido: PedidoDeSessoesSinteticas,
): Promise<SessaoSintetica[]> {
  const emissor = emissorDeTokenSintetico(ambiente)
  if (!Number.isInteger(pedido.quantidade) || pedido.quantidade < 1 || pedido.quantidade > QUANTIDADE_MAXIMA_DE_SESSOES_SINTETICAS) {
    throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
  }
  let criadas: Array<{ usuarioId: string; sessaoId: string }>
  try {
    criadas = await executarNoContexto({ requisicaoId: randomUUID(), escolaId: pedido.escolaId }, () =>
      banco.transaction(async (tx) => {
        const criacao = new CriacaoDeSessaoRepository(tx)
        const contas: Array<string | null> =
          pedido.papel === 'aluno'
            ? Array.from({ length: pedido.quantidade }, () => null)
            : await new ResolucaoDeTenantRepository(tx).criarContas(Array.from({ length: pedido.quantidade }, () => `sintetico-${randomUUID()}@educa.invalid`))
        const usuarios = await criacao.criarUsuarios(contas.map((contaId) => ({ contaId, papel: pedido.papel, nome: NOME_SINTETICO })))
        const sessoes = await criacao.criarSessoes(
          usuarios.map(({ id: usuarioId, contaId }) => ({
            usuarioId,
            contaId,
            metodo: pedido.papel === 'aluno' ? 'matricula' : 'email',
            refreshHash: refreshHashDescartavel(),
            duracaoHoras: DURACAO_DA_SESSAO_HORAS,
          })),
        )
        return sessoes.map(({ id: sessaoId, usuarioId }) => ({ usuarioId, sessaoId }))
      }),
    )
  } catch (erro) {
    // foreign_key_violation: a escola informada não existe.
    if (erroDoPostgresEm(erro)?.code === '23503') throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    throw erro
  }
  return Promise.all(
    criadas.map(async ({ usuarioId, sessaoId }) => ({
      usuarioId,
      sessaoId,
      token: (await emissor.emitir({ escolaId: pedido.escolaId, usuarioId, sessaoId })).token,
    })),
  )
}
