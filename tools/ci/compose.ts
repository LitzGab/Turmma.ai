import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnv } from 'node:util'
import { raizRepositorio, type Etapa } from './executar.ts'

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

export const SERVICOS_INFRA = ['postgres', 'redis-fila', 'redis-cache', 'storage'] as const

export function etapaCompose(nome: string, ...argumentos: string[]): Etapa {
  return { nome, comando: 'docker', argumentos: [...ARGUMENTOS_COMPOSE, ...argumentos] }
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

export function valorObrigatorio(ambiente: Record<string, string>, chave: string): string {
  const valor = ambiente[chave]
  if (valor === undefined || valor === '') {
    throw new Error(`ambiente de teste sem ${chave}`)
  }
  return valor
}
