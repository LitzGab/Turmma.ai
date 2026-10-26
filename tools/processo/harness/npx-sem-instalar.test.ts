// O `npx` não baixa pacote que não está no projeto (correção 2026-10-26-npx-sem-instalar; TODO.md, "Da X4", MN7).
//
// Numa sessão do Claude Code ninguém responde "Ok to proceed?", e o `npx` instala sozinho o pacote que não acha: foi assim que
// um revisor baixou `biome` 0.3.3 do npm e o executou no checkout. `.claude/settings.json` põe `npm_config_yes=false` no ambiente
// de todo Bash da sessão (e dos subagentes), e o `npx` passa a cancelar em vez de instalar. O que está no `package-lock.json`
// continua rodando.
//
// Limite declarado: o teste prova o `npx` com o `env` que o arquivo declara; não prova que o Claude Code o entrega ao Bash de cada
// subagente (a prova da premissa, feita na retro da X4, é o `npx cowsay` cancelado numa sessão de verdade).
//
// O registro do npm é de mentira (um servidor HTTP local): nada aqui depende de rede. O que se mede é a decisão do `npx` (cancelar ou
// instalar) e, no cancelamento, que ninguém pediu o tarball. O controle olha a decisão, e não o tarball: sob carga o processo sai antes de ele
// chegar ao servidor, e o pedido corria contra a saída.
import { spawn } from 'node:child_process'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const RAIZ = join(import.meta.dirname, '..', '..', '..')
const PACOTE_DE_FORA = 'pacote-de-fora-do-lockfile'

interface Configuracao {
  env?: Record<string, string>
}

/**
 * O ambiente de quem roda o teste, sem a chave que decide o `npx`: o npm lê `npm_config_yes` e `NPM_CONFIG_YES`,
 * e o controle não pode depender de nenhuma.
 */
const semNpmConfigYes = (ambiente: NodeJS.ProcessEnv): NodeJS.ProcessEnv =>
  Object.fromEntries(Object.entries(ambiente).filter(([chave]) => !/^npm_config_yes$/i.test(chave)))

const configuracao = JSON.parse(readFileSync(join(RAIZ, '.claude/settings.json'), 'utf8')) as Configuracao

describe('o env do .claude/settings.json', () => {
  it('declara npm_config_yes como "false" no env do settings.json', () => {
    expect(configuracao.env?.['npm_config_yes']).toBe('false')
  })
})

// O `npx` sobe o npm inteiro, e na suíte inteira ele disputa a CPU com centenas de arquivos. O `spawn` o mata em 60 s e o grupo dá 90 s: os 90 s cobrem
// os 60 s com folga, para o teste falhar pela mensagem do `npx` e não pelo prazo do Vitest.
describe('o npx com o env do settings.json', { timeout: 90_000 }, () => {
  let servidor: Server
  let registro: string
  let pedidos: string[] = []
  let pasta: string

  beforeAll(async () => {
    pasta = mkdtempSync(join(tmpdir(), 'npx-sem-instalar-'))
    servidor = createServer((pedido, resposta) => {
      pedidos.push(pedido.url ?? '')
      const endereco = servidor.address() as AddressInfo
      if (pedido.url?.endsWith('.tgz')) {
        resposta.writeHead(404).end()
        return
      }
      const manifesto = {
        name: PACOTE_DE_FORA,
        version: '1.0.0',
        bin: { [PACOTE_DE_FORA]: 'index.js' },
        dist: { tarball: `http://127.0.0.1:${String(endereco.port)}/${PACOTE_DE_FORA}/-/${PACOTE_DE_FORA}-1.0.0.tgz` },
      }
      resposta.writeHead(200, { 'content-type': 'application/json' })
      resposta.end(JSON.stringify({ name: PACOTE_DE_FORA, 'dist-tags': { latest: '1.0.0' }, versions: { '1.0.0': manifesto } }))
    })
    await new Promise<void>((pronto) => servidor.listen(0, '127.0.0.1', pronto))
    registro = `http://127.0.0.1:${String((servidor.address() as AddressInfo).port)}/`
  })

  afterAll(async () => {
    await new Promise((pronto) => servidor.close(pronto))
    rmSync(pasta, { recursive: true, force: true })
  })

  /**
   * O `npx` como a sessão o roda: sem terminal, no checkout, com o `env` do settings por cima do ambiente e o cache vazio.
   * Assíncrono de propósito: o registro de mentira está neste mesmo processo e só responde se o laço de eventos estiver livre.
   */
  const npx = (argumentos: string[], env: Record<string, string>) =>
    new Promise<{ status: number | null; saida: string; pedidos: string[] }>((pronto) => {
      pedidos = []
      const filho = spawn('npx', argumentos, {
        cwd: RAIZ,
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 60_000,
        env: { ...semNpmConfigYes(process.env), npm_config_registry: registro, npm_config_cache: join(pasta, 'cache'), ...env },
      })
      let saida = ''
      filho.stdout.on('data', (trecho: Buffer) => (saida += trecho.toString()))
      filho.stderr.on('data', (trecho: Buffer) => (saida += trecho.toString()))
      filho.on('close', (status) => pronto({ status, saida, pedidos: [...pedidos] }))
    })

  it('cancela o pacote de fora do projeto, e não pede o tarball ao registro', async () => {
    const r = await npx([PACOTE_DE_FORA], configuracao.env ?? {})
    expect(r.saida).toContain('npx canceled due to missing packages and no YES option')
    expect(r.status).not.toBe(0)
    expect(r.pedidos.filter((url) => url.endsWith('.tgz'))).toEqual([])
  })

  it('o controle: sem o env, o mesmo npx decide instalar o pacote (é o que o env impede)', async () => {
    const r = await npx([PACOTE_DE_FORA], {})
    expect(r.saida).toContain(`The following package was not found and will be installed: ${PACOTE_DE_FORA}@1.0.0`)
    expect(r.saida).not.toContain('npx canceled')
  })

  it('roda o que está no package-lock.json (vitest)', async () => {
    const r = await npx(['vitest', '--version'], configuracao.env ?? {})
    expect(r.status).toBe(0)
    expect(r.saida).toMatch(/vitest\/\d+\./)
  })
})
