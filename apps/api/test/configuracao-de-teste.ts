import type { ConfiguracaoBanco } from '@educa/nucleo'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../../tools/ci/compose.ts'
import { lerConfiguracao, type ConfiguracaoApi } from '../src/config.js'

export interface SobreposicaoDeTeste {
  banco?: Partial<ConfiguracaoBanco>
  /** Variáveis que trocam as de `.env.example`, como `ACEITAR_TOKEN_SINTETICO`. */
  ambiente?: Record<string, string>
}

/**
 * Configuração da API nos testes de integração, lida pelo mesmo `lerConfiguracao` do boot a partir
 * do ambiente de teste (`.env.example` e `infra/teste.env`), com o banco e o Redis de cache do
 * compose de teste. A porta não importa: o teste escuta numa porta livre.
 */
export function configuracaoDeTeste(sobreposicao: SobreposicaoDeTeste = {}): ConfiguracaoApi {
  // Espera curta da drenagem: no teste não há borda a avisar, e todo `app.close()` passa por ela.
  const ambiente = { ...lerAmbienteDeTeste(), DRENAGEM_ESPERA_BORDA_MS: '10', ...sobreposicao.ambiente }
  const usuario = valorObrigatorio(ambiente, 'POSTGRES_USUARIO')
  const senha = valorObrigatorio(ambiente, 'POSTGRES_SENHA')
  const banco = valorObrigatorio(ambiente, 'POSTGRES_BANCO')
  const porta = valorObrigatorio(ambiente, 'POSTGRES_PORTA_HOST')
  const config = lerConfiguracao({
    ...ambiente,
    API_PORTA: '3000',
    BANCO_URL: `postgres://${usuario}:${senha}@127.0.0.1:${porta}/${banco}`,
    REDIS_CACHE_URL: `redis://127.0.0.1:${valorObrigatorio(ambiente, 'REDIS_CACHE_PORTA_HOST')}`,
  })
  return { ...config, banco: { ...config.banco, ...sobreposicao.banco } }
}
