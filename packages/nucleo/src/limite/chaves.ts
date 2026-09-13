import { isIP } from 'node:net'

/**
 * Prefixos das chaves de limite no Redis de cache. A chave final é `{prefixo}:{id}`, com o id que
 * veio do token verificado (usuário e escola) ou o IP do cliente (só em rota anônima). Toda chave
 * vive uma janela e expira: nada fica guardado além dela (regra 20, IP com retenção curta).
 */
export const PREFIXO_LIMITE_USUARIO = 'rl:u'
export const PREFIXO_LIMITE_ESCOLA = 'rl:e'
export const PREFIXO_LIMITE_IP = 'rl:ip'

/** Janela de todo limite. Os limites da configuração são "por minuto". */
export const JANELA_LIMITE_SEGUNDOS = 60

/** Endereço que o sistema não conseguiu ler (socket já destruído). Todos esses dividem uma chave. */
export const IP_DESCONHECIDO = 'desconhecido'

const PREFIXO_IPV4_MAPEADO = '::ffff:'

/**
 * Forma única do endereço, para o mesmo cliente não virar duas chaves: IPv4 mapeado em IPv6
 * (`::ffff:10.0.0.1`) vira IPv4, e IPv6 fica em minúsculas. O que não é IP devolve `undefined`.
 */
export function normalizarIp(endereco: string | undefined): string | undefined {
  if (endereco === undefined) return undefined
  const aparado = endereco.trim().toLowerCase()
  const semMapeamento = aparado.startsWith(PREFIXO_IPV4_MAPEADO) && isIP(aparado.slice(PREFIXO_IPV4_MAPEADO.length)) === 4
    ? aparado.slice(PREFIXO_IPV4_MAPEADO.length)
    : aparado
  return isIP(semMapeamento) === 0 ? undefined : semMapeamento
}

/**
 * O IP que a borda viu, tirado do `X-Forwarded-For`. Vale só a última entrada: é a que o proxy
 * mais próximo escreveu. As anteriores são texto do cliente, e um cliente que manda
 * `X-Forwarded-For` forjado não escolhe a própria chave.
 */
export function ipEncaminhado(cabecalho: string | string[] | undefined): string | undefined {
  // Cabeçalho repetido: o Node junta as ocorrências com vírgula, e vale a última do mesmo jeito.
  const texto = Array.isArray(cabecalho) ? cabecalho.join(',') : cabecalho
  if (texto === undefined) return undefined
  return normalizarIp(texto.split(',').at(-1))
}

/**
 * IP da chave de limite anônimo. O `X-Forwarded-For` só é lido quando a conexão vem de um proxy
 * confiável (a borda); de qualquer outra origem, vale o endereço da própria conexão.
 */
export function ipDoCliente(enderecoDaConexao: string | undefined, cabecalhoEncaminhado: string | string[] | undefined, conexaoDaBorda: boolean): string {
  const daConexao = normalizarIp(enderecoDaConexao) ?? IP_DESCONHECIDO
  if (!conexaoDaBorda) return daConexao
  return ipEncaminhado(cabecalhoEncaminhado) ?? daConexao
}

/**
 * Divisão do limite para o seguro em memória: com o Redis fora, cada instância conta sozinha, e a
 * soma das instâncias não passa do limite configurado. Nunca abaixo de 1.
 */
export function limiteDoSeguro(limite: number, instancias: number): number {
  return Math.max(1, Math.floor(limite / instancias))
}

/** Segundos do `Retry-After`: arredonda para cima, e nunca menos de 1 (zero mandaria repetir já). */
export function segundosParaTentarDeNovo(msAteLiberar: number): number {
  return Math.max(1, Math.ceil(msAteLiberar / 1_000))
}
