import { z } from 'zod'

/** Ambientes em que o sistema sobe. O mesmo conjunto que a configuração da API valida no boot. */
export const AMBIENTES_DO_SISTEMA = ['local', 'staging', 'producao'] as const

/** Partes do sistema que a casca mostra. Só o que a API consegue verificar sem token e sem custo. */
export const COMPONENTES_DO_SISTEMA = ['api', 'banco'] as const

export const SITUACOES_DE_COMPONENTE = ['disponivel', 'indisponivel'] as const

/**
 * Corpo de `GET /v1/sistema/estado`, rota anônima. Não carrega dado de escola nem de pessoa: versão
 * do código, ambiente e a situação de cada componente, com a hora da verificação.
 */
export const esquemaRespostaEstado = z
  .object({
    versao: z.string().min(1).max(64),
    ambiente: z.enum(AMBIENTES_DO_SISTEMA),
    componentes: z.array(
      z
        .object({
          nome: z.enum(COMPONENTES_DO_SISTEMA),
          situacao: z.enum(SITUACOES_DE_COMPONENTE),
          verificadoEm: z.iso.datetime(),
        })
        .strict(),
    ),
  })
  .strict()

export type RespostaEstado = z.infer<typeof esquemaRespostaEstado>
export type ComponenteDoSistema = RespostaEstado['componentes'][number]
