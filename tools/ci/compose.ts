import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnv } from 'node:util'
import { executarEtapas, raizRepositorio, type Etapa } from './executar.ts'

/**
 * Testes e esteira sobem um projeto compose próprio (`educa-teste`), com os valores de
 * `.env.example` e as portas de `infra/teste.env`. Nada depende de um `.env` local, e parar
 * o Postgres num teste nunca derruba o ambiente de desenvolvimento.
 */
export const PROJETO_TESTE = 'educa-teste'
export const ARQUIVOS_AMBIENTE_TESTE = ['.env.example', 'infra/teste.env'] as const

export const ARGUMENTOS_COMPOSE = [
  'compose',
  '--project-name',
  PROJETO_TESTE,
  ...ARQUIVOS_AMBIENTE_TESTE.flatMap((arquivo) => ['--env-file', arquivo]),
  '-f',
  'infra/compose.yml',
] as const

/**
 * O que os testes de integração sobem: os dados e o `oidc-falso`, no lugar do Google e da Microsoft no login pela conta
 * da escola (13.0), para nenhum teste chamar provedor de verdade.
 */
export const SERVICOS_INFRA = ['postgres', 'redis-fila', 'redis-cache', 'storage', 'oidc-falso'] as const

export function etapaCompose(nome: string, ...argumentos: string[]): Etapa {
  return { nome, comando: 'docker', argumentos: [...ARGUMENTOS_COMPOSE, ...argumentos] }
}

/**
 * O despejo de log da falha, que é o que sobra para diagnosticar um vermelho que não reproduz.
 *
 * `--timestamps` é o que o torna cruzável: sem ele cada linha vem com o carimbo que o próprio serviço
 * imprime — o Caddy com `ts` no JSON, o Postgres e o Redis cada um no seu formato —, e correlacionar o
 * instante de uma requisição com o instante em que a borda mexeu no balanceamento vira adivinhação.
 *
 * `--tail` é por contêiner, não no total, e 4.000 é medido, não estimado: numa execução de
 * `test:infra` de 20 min, o maior log de serviço nosso foi o da `api-2`, com 3.899 linhas. Em 4.000
 * o despejo leva **o log inteiro dos doze serviços que escrevemos**. Vão truncados de propósito
 * cinco de terceiro — postgres, borda, redis-fila, redis-cache e storage —, que somam 149.322
 * linhas; neles o que serve para diagnosticar é o carimbo, não o começo. (Os outros dois de
 * terceiro, oidc-falso e observabilidade, saem completos.) Medição em
 * tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md.
 */
export const ETAPA_DO_LOG_DA_FALHA = ['logs', '--no-color', '--timestamps', '--tail', '4000'] as const

/** Os passos de encerramento, em função do código de saída. Separado para o caminho de falha ter teste. */
export function etapasDeEncerramento(codigo: number, derrubar = true): Etapa[] {
  return [
    ...(codigo === 0 ? [] : [etapaCompose('logs dos serviços', ...ETAPA_DO_LOG_DA_FALHA)]),
    ...(derrubar ? [etapaCompose('derrubar o ambiente', 'down', '--volumes', '--remove-orphans')] : []),
  ]
}

/**
 * Sobe Postgres, Redis e storage, roda o `npm run <script>` e derruba o ambiente, com os logs dos serviços
 * antes quando falha. É o corpo de `ci:integracao` e `ci:infra`.
 */
export function executarTestesComInfra(nome: string, script: string): Promise<number> {
  return executarEtapas(
    [
      etapaCompose('subir Postgres, Redis, storage e oidc-falso', 'up', '--detach', '--wait', ...SERVICOS_INFRA),
      { nome, comando: 'npm', argumentos: ['run', script] },
    ],
    (codigo) => etapasDeEncerramento(codigo),
  )
}

function lerArquivoAmbiente(caminho: string): Record<string, string> {
  const valores: Record<string, string> = {}
  for (const [chave, valor] of Object.entries(parseEnv(readFileSync(join(raizRepositorio, caminho), 'utf8')))) {
    if (valor !== undefined) valores[chave] = valor
  }
  return valores
}

export function lerAmbienteExemplo(): Record<string, string> {
  return lerArquivoAmbiente('.env.example')
}

/** Valores com que o compose de teste sobe: o último arquivo sobrepõe o anterior, como no compose. */
export function lerAmbienteDeTeste(): Record<string, string> {
  return Object.assign({}, ...ARQUIVOS_AMBIENTE_TESTE.map(lerArquivoAmbiente)) as Record<string, string>
}

/** URL do Postgres do compose de teste, vista da máquina: a mesma para a integração e para o seed do e2e. */
export function urlDoBancoDeTeste(): string {
  const ambiente = lerAmbienteDeTeste()
  const usuario = valorObrigatorio(ambiente, 'POSTGRES_USUARIO')
  const senha = valorObrigatorio(ambiente, 'POSTGRES_SENHA')
  const banco = valorObrigatorio(ambiente, 'POSTGRES_BANCO')
  return `postgres://${usuario}:${senha}@127.0.0.1:${valorObrigatorio(ambiente, 'POSTGRES_PORTA_HOST')}/${banco}`
}

export function valorObrigatorio(ambiente: Record<string, string>, chave: string): string {
  const valor = ambiente[chave]
  if (valor === undefined || valor === '') {
    throw new Error(`ambiente de teste sem ${chave}`)
  }
  return valor
}
