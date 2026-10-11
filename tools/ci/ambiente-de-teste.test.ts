import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseEnv } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
import {
  AMBIENTE_DE_TESTE,
  ARGUMENTOS_COMPOSE,
  PROJETO_TESTE,
  ambienteDeTesteDo,
  argumentosDoCompose,
  arquivoDoAmbienteDerivado,
  conteudoDoAmbienteDerivado,
  deslocarPortas,
  gravarAmbienteDerivado,
  lerAmbienteDeTeste,
  numeroDoAmbienteDeTeste,
  projetoDeTeste,
  urlDoBancoDeTeste,
} from './compose.ts'
import { raizRepositorio } from './executar.ts'

// Cada checkout com o seu ambiente de teste: o número, de 0 a 3, decide o projeto compose e as portas. O 0 é o que
// existia antes de haver número, e é o da esteira: nada nele pode mudar. Os outros não podem esbarrar nele, entre si,
// no desenvolvimento nem no cenário de carga.

const lerArquivo = (caminho: string) => readFileSync(join(raizRepositorio, caminho), 'utf8')
const definidas = (valores: NodeJS.Dict<string>) => Object.fromEntries(Object.entries(valores).filter(([, valor]) => valor !== undefined)) as Record<string, string>

// Os versionados lidos aqui, sem passar por `compose.ts`: é contra eles que o ambiente 0 se confere.
const exemplo = definidas(parseEnv(lerArquivo('.env.example')))
const sobreposicaoDeTeste = definidas(parseEnv(lerArquivo('infra/teste.env')))
const carga = definidas(parseEnv(lerArquivo('infra/carga.env')))

const NUMEROS = [0, 1, 2, 3]
const ehPorta = (chave: string) => chave.endsWith('_PORTA_HOST')
const portasDe = (ambiente: Record<string, string>) => Object.entries(ambiente).filter(([chave]) => ehPorta(chave))

const semArquivo = () => undefined

describe('número do ambiente de teste', () => {
  it('sem a variável e sem o arquivo é 0, o ambiente da esteira', () => {
    expect(numeroDoAmbienteDeTeste({}, semArquivo)).toBe(0)
  })

  it('vem da variável EDUCA_AMBIENTE_TESTE, de 0 a 3', () => {
    for (const numero of NUMEROS) {
      expect(numeroDoAmbienteDeTeste({ EDUCA_AMBIENTE_TESTE: String(numero) }, semArquivo)).toBe(numero)
    }
  })

  it('sem a variável, vem de .processo/ambiente, que contém só o número', () => {
    expect(numeroDoAmbienteDeTeste({}, () => '2\n')).toBe(2)
    expect(numeroDoAmbienteDeTeste({}, () => '0')).toBe(0)
  })

  it('a variável vence o arquivo, inclusive quando pede o 0', () => {
    expect(numeroDoAmbienteDeTeste({ EDUCA_AMBIENTE_TESTE: '1' }, () => '2')).toBe(1)
    // O zero explícito é uma escolha, e não ausência: `if (variavel)` no lugar de `!== undefined` cairia no arquivo.
    expect(numeroDoAmbienteDeTeste({ EDUCA_AMBIENTE_TESTE: '0' }, () => '2')).toBe(0)
  })

  it.each(['abc', '4', '-1', '1.5', '01', '1e0', '0x1', '1 2', '', '   '])('valor inválido na variável é erro, e nunca vira 0: %j', (valor) => {
    // Com um arquivo válido ao lado: o inválido também não pode escorregar para ele.
    expect(() => numeroDoAmbienteDeTeste({ EDUCA_AMBIENTE_TESTE: valor }, () => '1')).toThrow(
      `número do ambiente de teste inválido em EDUCA_AMBIENTE_TESTE: ${JSON.stringify(valor.trim())} (esperado um inteiro de 0 a 3)`,
    )
  })

  it.each(['dois', '7', '', '1\n2\n'])('valor inválido no arquivo é erro, e diz que veio do arquivo: %j', (conteudo) => {
    expect(() => numeroDoAmbienteDeTeste({}, () => conteudo)).toThrow(/número do ambiente de teste inválido em \.processo\/ambiente: .* \(esperado um inteiro de 0 a 3\)/)
  })
})

describe('ambiente de teste 0', () => {
  it('é o projeto educa-teste, com os dois arquivos versionados e nenhum a mais', () => {
    // Escrito à mão: é a linha que a esteira roda hoje, e é ela que não pode mudar.
    expect(projetoDeTeste(0)).toBe('educa-teste')
    expect(argumentosDoCompose(0)).toEqual(['compose', '--project-name', 'educa-teste', '--env-file', '.env.example', '--env-file', 'infra/teste.env', '-f', 'infra/compose.yml'])
    expect(arquivoDoAmbienteDerivado(0)).toBeNull()
  })

  it('sobe com exatamente os valores de .env.example e as portas de infra/teste.env', () => {
    expect(ambienteDeTesteDo(0)).toEqual({ ...exemplo, ...sobreposicaoDeTeste })
    const portas = portasDe(ambienteDeTesteDo(0))
    expect(portas.length).toBeGreaterThan(10)
    for (const [chave, valor] of portas) expect(valor, chave).toBe(sobreposicaoDeTeste[chave])
  })

  it('não grava arquivo nenhum', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'educa-ambiente-'))
    try {
      expect(gravarAmbienteDerivado(0, raiz)).toBeNull()
      expect(() => statSync(join(raiz, '.processo'))).toThrow()
    } finally {
      rmSync(raiz, { recursive: true, force: true })
    }
  })
})

describe('ambientes de teste 1 a 3', () => {
  it('cada um tem o seu projeto compose', () => {
    expect([1, 2, 3].map(projetoDeTeste)).toEqual(['educa-teste-1', 'educa-teste-2', 'educa-teste-3'])
    expect(new Set(NUMEROS.map(projetoDeTeste)).size).toBe(NUMEROS.length)
  })

  it('toda porta publicada é a de infra/teste.env mais N × 1000', () => {
    for (const numero of [1, 2, 3]) {
      const ambiente = ambienteDeTesteDo(numero)
      for (const [chave, base] of Object.entries(sobreposicaoDeTeste).filter(([chave]) => ehPorta(chave))) {
        expect(ambiente[chave], `ambiente ${String(numero)}: ${chave}`).toBe(String(Number(base) + numero * 1000))
      }
    }
  })

  it('nenhuma porta se repete dentro de um ambiente nem entre ambientes', () => {
    const todas = NUMEROS.flatMap((numero) => portasDe(ambienteDeTesteDo(numero)).map(([chave, valor]) => ({ numero, chave, valor })))
    const porAmbiente = portasDe(ambienteDeTesteDo(0)).length
    expect(porAmbiente).toBeGreaterThan(10)
    expect(todas).toHaveLength(NUMEROS.length * porAmbiente)
    const donas = new Map<string, string>()
    for (const { numero, chave, valor } of todas) {
      const dona = `${chave} do ambiente ${String(numero)}`
      expect(donas.get(valor), `a porta ${valor} é de ${dona} e de ${donas.get(valor) ?? ''}`).toBeUndefined()
      donas.set(valor, dona)
    }
  })

  it('nenhuma porta cai sobre as do desenvolvimento nem sobre as do cenário de carga, que sobem na mesma máquina', () => {
    const alheias = new Set([...portasDe(exemplo), ...portasDe(carga)].map(([, valor]) => valor))
    expect(alheias.size).toBeGreaterThan(20)
    for (const numero of NUMEROS) {
      for (const [chave, valor] of portasDe(ambienteDeTesteDo(numero))) {
        expect(alheias.has(valor), `ambiente ${String(numero)}: ${chave}=${valor}`).toBe(false)
      }
    }
  })

  it('toda porta fica entre 1024 e a faixa efêmera do Linux, como as do ambiente 0', () => {
    // A mesma régua de `ambiente.test.ts` para o ambiente 0: porta publicada dentro de 32768–60999 pode ser sorteada
    // como origem de uma conexão de saída do próprio teste (correção 2026-09-23-porta-do-teste-na-faixa-efemera).
    for (const numero of NUMEROS) {
      for (const [chave, valor] of portasDe(ambienteDeTesteDo(numero))) {
        expect(Number(valor), `ambiente ${String(numero)}: ${chave}`).toBeGreaterThanOrEqual(1024)
        expect(Number(valor), `ambiente ${String(numero)}: ${chave}`).toBeLessThan(32_768)
      }
    }
  })

  it('o retorno do login pela conta da escola acompanha a porta da web do ambiente', () => {
    for (const numero of NUMEROS) {
      const ambiente = ambienteDeTesteDo(numero)
      const retorno = new URL(ambiente['LOGIN_EXTERNO_RETORNO_URL'] ?? '')
      expect(retorno.port, `ambiente ${String(numero)}`).toBe(ambiente['WEB_PORTA_HOST'])
      expect(retorno.port, `ambiente ${String(numero)}`).toBe(String(Number(sobreposicaoDeTeste['WEB_PORTA_HOST']) + numero * 1000))
      // Só a porta muda: o provedor devolve o navegador ao mesmo caminho, na mesma máquina.
      expect(`${retorno.protocol}//${retorno.hostname}${retorno.pathname}`).toBe('http://127.0.0.1/v1/sessao/externa/retorno')
    }
  })

  it('nada no ambiente N continua apontando para uma porta do ambiente 0', () => {
    // O que pega o endereço novo que alguém puser em `infra/teste.env` com a porta escrita: se ele não acompanhar,
    // o ambiente N fala com o serviço do checkout vizinho.
    const portasDoZero = portasDe(ambienteDeTesteDo(0)).map(([, valor]) => valor)
    for (const numero of [1, 2, 3]) {
      for (const [chave, valor] of Object.entries(ambienteDeTesteDo(numero)).filter(([chave]) => !ehPorta(chave))) {
        for (const porta of portasDoZero) expect(valor, `ambiente ${String(numero)}: ${chave}`).not.toContain(`:${porta}`)
      }
    }
  })

  it('o que muda de um ambiente para outro é só o que infra/teste.env sobrepõe: portas e o endereço que carrega uma', () => {
    const zero = ambienteDeTesteDo(0)
    for (const numero of [1, 2, 3]) {
      const ambiente = ambienteDeTesteDo(numero)
      expect(Object.keys(ambiente).sort()).toEqual(Object.keys(zero).sort())
      const mudaram = Object.keys(ambiente).filter((chave) => ambiente[chave] !== zero[chave])
      expect(mudaram.sort(), `ambiente ${String(numero)}`).toEqual(Object.keys(sobreposicaoDeTeste).sort())
    }
  })

  it('o banco de cada ambiente é o do Postgres dele', () => {
    expect(urlDoBancoDeTeste(0)).toBe(`postgres://educa:educa_local_sintetica@127.0.0.1:${sobreposicaoDeTeste['POSTGRES_PORTA_HOST'] ?? ''}/educa`)
    for (const numero of [1, 2, 3]) {
      expect(new URL(urlDoBancoDeTeste(numero)).port).toBe(String(Number(sobreposicaoDeTeste['POSTGRES_PORTA_HOST']) + numero * 1000))
    }
  })
})

describe('deslocamento de portas, com um ambiente escrito à mão', () => {
  const BASE = {
    WEB_PORTA_HOST: '28090',
    STORAGE_PORTA_HOST: '28343',
    LOGIN_EXTERNO_RETORNO_URL: 'http://127.0.0.1:28090/v1/sessao/externa/retorno',
    DOIS_ENDERECOS: 'http://localhost:28343/a,http://127.0.0.1:28090/b',
    LOGIN_EXTERNO_GOOGLE_EMISSOR: 'http://oidc-falso:8080/google',
    LLM_BASE_URL: 'http://127.0.0.1:8080/v1',
    OUTRA_MAQUINA: 'http://10.0.0.7:28090/',
    LIMITE_REQ_ESCOLA_MIN: '28090',
  }

  it('soma N × 1000 às portas publicadas e aos endereços da máquina que apontam para elas, e a mais nada', () => {
    expect(deslocarPortas(BASE, 2)).toEqual({
      WEB_PORTA_HOST: '30090',
      STORAGE_PORTA_HOST: '30343',
      LOGIN_EXTERNO_RETORNO_URL: 'http://127.0.0.1:30090/v1/sessao/externa/retorno',
      DOIS_ENDERECOS: 'http://localhost:30343/a,http://127.0.0.1:30090/b',
      // Dentro da rede do compose, porta que não é nossa, outra máquina, e número que só coincide com uma porta.
      LOGIN_EXTERNO_GOOGLE_EMISSOR: 'http://oidc-falso:8080/google',
      LLM_BASE_URL: 'http://127.0.0.1:8080/v1',
      OUTRA_MAQUINA: 'http://10.0.0.7:28090/',
      LIMITE_REQ_ESCOLA_MIN: '28090',
    })
  })

  it('com 0 devolve o ambiente como veio', () => {
    expect(deslocarPortas(BASE, 0)).toEqual(BASE)
  })

  it('porta publicada que não é número é erro, e não uma soma que dá NaN', () => {
    expect(() => deslocarPortas({ WEB_PORTA_HOST: 'oitenta' }, 1)).toThrow('ambiente de teste com WEB_PORTA_HOST que não é porta: "oitenta"')
  })
})

describe('arquivo de ambiente derivado', () => {
  const raizes: string[] = []
  afterEach(() => {
    for (const raiz of raizes.splice(0)) rmSync(raiz, { recursive: true, force: true })
  })

  it('entra por último entre os --env-file: no compose o último sobrepõe o anterior', () => {
    // Escrito à mão. Antes de `infra/teste.env`, as portas dele perderiam para as do ambiente 0 e os dois checkouts
    // disputariam as mesmas portas, com o projeto certo no nome.
    expect(argumentosDoCompose(2)).toEqual([
      'compose', '--project-name', 'educa-teste-2',
      '--env-file', '.env.example', '--env-file', 'infra/teste.env', '--env-file', '.processo/ambiente-de-teste-2.env',
      '-f', 'infra/compose.yml',
    ])
    expect(new Set([1, 2, 3].map(arquivoDoAmbienteDerivado)).size).toBe(3)
  })

  it('leva exatamente o que o ambiente N tem de diferente do 0, e é isso que o compose passa a ler', () => {
    for (const numero of [1, 2, 3]) {
      const doArquivo = definidas(parseEnv(conteudoDoAmbienteDerivado(numero)))
      expect(Object.keys(doArquivo).sort()).toEqual(Object.keys(sobreposicaoDeTeste).sort())
      // Os três arquivos na ordem em que o compose os lê dão o ambiente que os testes usam: uma fonte só.
      expect({ ...exemplo, ...sobreposicaoDeTeste, ...doArquivo }).toEqual(ambienteDeTesteDo(numero))
    }
  })

  it('é gravado em .processo/, que o git ignora, e não é reescrito quando já está certo', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'educa-ambiente-'))
    raizes.push(raiz)
    const caminho = gravarAmbienteDerivado(3, raiz)
    expect(caminho).toBe(join(raiz, '.processo/ambiente-de-teste-3.env'))
    expect(readFileSync(caminho ?? '', 'utf8')).toBe(conteudoDoAmbienteDerivado(3))
    const antes = statSync(caminho ?? '', { bigint: true })
    expect(gravarAmbienteDerivado(3, raiz)).toBe(caminho)
    // O mesmo inode: os processos do Vitest e do Playwright carregam o módulo juntos, e nenhum troca o arquivo que
    // o `docker compose` de outro está lendo.
    expect(statSync(caminho ?? '', { bigint: true }).ino).toBe(antes.ino)
    expect(lerArquivo('.gitignore').split('\n')).toContain('.processo/')
  })
})

describe('o que o resto do repositório lê', () => {
  it('projeto, argumentos do compose, portas e banco saem todos do número deste checkout', () => {
    // A integração, o e2e, o Playwright e a vitrine importam estes quatro. Um deles calculado por fora falaria com
    // o ambiente de outro checkout.
    expect(AMBIENTE_DE_TESTE).toBe(numeroDoAmbienteDeTeste())
    expect(PROJETO_TESTE).toBe(projetoDeTeste(AMBIENTE_DE_TESTE))
    expect([...ARGUMENTOS_COMPOSE]).toEqual(argumentosDoCompose(AMBIENTE_DE_TESTE))
    expect(lerAmbienteDeTeste()).toEqual(ambienteDeTesteDo(AMBIENTE_DE_TESTE))
    expect(urlDoBancoDeTeste()).toBe(urlDoBancoDeTeste(AMBIENTE_DE_TESTE))
  })

  it('fora do ambiente 0, o arquivo que os argumentos do compose citam já existe, com as portas do ambiente', () => {
    const relativo = arquivoDoAmbienteDerivado(AMBIENTE_DE_TESTE)
    if (relativo === null) {
      expect(ARGUMENTOS_COMPOSE.filter((argumento) => argumento === '--env-file')).toHaveLength(2)
      return
    }
    expect(lerArquivo(relativo)).toBe(conteudoDoAmbienteDerivado(AMBIENTE_DE_TESTE))
  })
})
