import { SetMetadata, type CustomDecorator } from '@nestjs/common'

export const METADADO_ROTA_ANONIMA = 'educa:rota-anonima'
export const METADADO_SEM_LIMITE = 'educa:sem-limite'
export const METADADO_LIMITE_QUE_REBAIXA = 'educa:limite-que-rebaixa'

/**
 * Marca a rota, ou o controller inteiro, como acessível sem token. Toda outra rota exige token:
 * endpoint novo que esquece a marcação nasce fechado, não aberto.
 *
 * Sem token não há usuário nem escola, e a rota anônima é a única limitada por IP (`rl:ip:{ip}`),
 * com teto que comporta uma escola inteira atrás de um NAT (regra 80, item 1).
 */
export function RotaAnonima(): CustomDecorator<string> {
  return SetMetadata(METADADO_ROTA_ANONIMA, true)
}

/**
 * Tira a rota do rate limit. Só para a sonda da borda (`/prontidao`): ela não sai pela borda, não
 * consulta dependência, e um 429 nela tiraria as duas instâncias do balanceamento de uma vez.
 * Rota de cliente nunca leva esta marcação.
 */
export function SemLimite(): CustomDecorator<string> {
  return SetMetadata(METADADO_SEM_LIMITE, true)
}

/**
 * A rota anônima de login por senha (e-mail e matrícula, identidade 15.0): o limite por IP dela não recusa. Acima dele,
 * a guarda só marca a requisição (`acimaDoLimiteDoIp`), e o login manda a tentativa para o fim do balde dela no semáforo
 * do hash. A escola inteira sai por um IP: recusar ali seria bloquear os 400 alunos por causa de um script (regra 80,
 * item 1). O balde de contagem é próprio (`rl:ip-login`), e o login lotado não gasta o limite das outras rotas anônimas.
 */
export function LimiteQueRebaixa(): CustomDecorator<string> {
  return SetMetadata(METADADO_LIMITE_QUE_REBAIXA, true)
}

export const METADADO_ACEITA_DESAFIO = 'educa:aceita-desafio'

/**
 * A rota autenticada que também aceita o desafio de login no `Authorization`, no lugar do token de acesso: só
 * `POST /v1/sessao/escola` (tarefa 12.0), que recebe o desafio `escolher` ou o token de uma sessão de e-mail
 * (Tech Spec, seção 4).
 *
 * Com o desafio (`typ: desafio+jwt` no cabeçalho do JWT), as guardas tratam a requisição como anônima: limite por IP,
 * sem sessão no contexto e sem célula da matriz, e quem verifica o desafio inteiro (assinatura, `aud`, prazo, etapa e
 * uso único) é o service da rota. Qualquer outro bearer segue o caminho de toda rota autenticada, com `@Permite`.
 * Um cabeçalho que só diz ser desafio não abre nada: sem o desafio verificado, o service recusa.
 */
export function AceitaDesafio(): CustomDecorator<string> {
  return SetMetadata(METADADO_ACEITA_DESAFIO, true)
}
