import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { comLimpeza, decidir, estaTrabalhando, LIMPEZA_DEMORA_MS, limpezaPerdida, nomesDoTime, SEM_OLHAR_MS } from './vigia.ts'

// A vigia que não acorda o modelo à toa. O erro caro é o contrário: ficar calada com o time parado. Por isso todo
// caso de dúvida acorda.

const PARADO = ['● Pronto.', '', '✻ Churned for 5s · done 15:59', '─────', '❯ ', '─────', '  ⏵⏵ bypass permissions on (shift+tab to cycle)'].join('\n')
const TRABALHANDO = ['● Rodando o portão da tarefa…', '', '✶ Forging… (2m 14s · ↓ 3.1k tokens · esc to interrupt)', '─────', '❯ ', '─────'].join('\n')
const agora = new Date('2026-10-12T10:00:00.000Z')
const ha = (minutos: number) => new Date(agora.getTime() - minutos * 60_000).toISOString()

const RAIZ = join(import.meta.dirname, '../..')
const FIXTURE_DO_LIST = join(import.meta.dirname, '__fixtures__/maestri-list.txt')

describe('quem é do time', () => {
  it('só os papéis, com ou sem número de linha, entre os agentes ligados', () => {
    const lista = [
      'You:',
      '  - name: "Claude Code"',
      '',
      'Connected agents:',
      '  - name: "Arquiteto"',
      '  - name: "Implementador"',
      '  - name: "Mesa 2"',
      '  - name: "Implementador 2"',
      '  - name: "Validador"',
      '  - name: "Claude Code #2"',
      '  - name: "Mesa de bar"',
    ].join('\n')
    expect(nomesDoTime(lista)).toEqual(['Arquiteto', 'Implementador', 'Mesa 2', 'Implementador 2', 'Validador'])
    expect(nomesDoTime('You:\n  - name: "Arquiteto"\n')).toEqual([])
  })

  it('trabalha quem mostra "esc to interrupt" no fim da tela, e não quem o tem lá em cima, de um turno antigo', () => {
    expect(estaTrabalhando(TRABALHANDO)).toBe(true)
    expect(estaTrabalhando(PARADO)).toBe(false)
    expect(estaTrabalhando(`${TRABALHANDO}\n${'linha\n'.repeat(30)}${PARADO}`)).toBe(false)
  })
})

describe('acordar ou não', () => {
  it('com alguém trabalhando, não acorda, e guarda desde quando', () => {
    const decisao = decidir({ Implementador: PARADO, Mesa: TRABALHANDO }, {}, agora)
    expect(decisao).toEqual({ acordar: false, motivo: 'Mesa trabalhando', visto: { Mesa: agora.toISOString() } })
    expect(decidir({ Mesa: TRABALHANDO }, { Mesa: ha(90) }, agora).visto).toEqual({ Mesa: ha(90) })
  })

  it('com todos parados, acorda: alguém deve um relatório, ou há pergunta na tela', () => {
    expect(decidir({ Implementador: PARADO, Mesa: PARADO }, { Mesa: ha(30) }, agora)).toEqual({ acordar: true, motivo: 'ninguém trabalhando', visto: {} })
  })

  it('sem terminal do time, ou com tela vazia, acorda', () => {
    expect(decidir({}, {}, agora).acordar).toBe(true)
    expect(decidir({ Implementador: '' }, {}, agora).acordar).toBe(true)
  })

  it('quem trabalha há duas horas sem a vigia olhar acorda o modelo uma vez, e o relógio recomeça', () => {
    const limite = SEM_OLHAR_MS / 60_000
    expect(decidir({ Implementador: TRABALHANDO }, { Implementador: ha(limite - 1) }, agora).acordar).toBe(false)
    const demorou = decidir({ Implementador: TRABALHANDO, 'Implementador 2': TRABALHANDO }, { Implementador: ha(limite), 'Implementador 2': ha(10) }, agora)
    expect(demorou.acordar).toBe(true)
    expect(demorou.motivo).toBe('Implementador trabalha há duas horas sem a vigia olhar')
    expect(demorou.visto).toEqual({ Implementador: agora.toISOString(), 'Implementador 2': ha(10) })
  })

  it('quem parou e voltou a trabalhar recomeça a contagem', () => {
    const parou = decidir({ Implementador: PARADO, Mesa: TRABALHANDO }, { Implementador: ha(119) }, agora)
    expect(parou.visto).toEqual({ Mesa: agora.toISOString() })
  })
})

describe('a saída real do maestri list (RF28)', () => {
  it('lê os terminais do time entre os agentes ligados, e não o do bloco "You" nem o Orquestrador', () => {
    const lista = readFileSync(FIXTURE_DO_LIST, 'utf8')
    // A fixture é a saída crua de `maestri list`, gravada em 24/10/2026 no terminal do Implementador (tarefa 20.0): o do
    // Orquestrador, onde a vigia roda, pode trazer outros blocos e as linhas numeradas (`Implementador 2`). Regrave-a quando o
    // Maestri mudar o formato. Os dois blocos que o código lê têm de estar nela.
    expect(lista).toContain('Connected agents:')
    expect(lista).toContain('You:')
    expect(nomesDoTime(lista)).toEqual(['Mesa'])
  })
})

describe('docs/processo-sem-maestri.md (RF28)', () => {
  const documento = () => readFileSync(join(RAIZ, 'docs/processo-sem-maestri.md'), 'utf8')

  it('cita o comando dos quatro papéis, com o nome do arquivo que cada um tem em .claude/agents/', () => {
    for (const papel of ['arquiteto', 'implementador', 'mesa-de-revisao', 'validador']) {
      expect(existsSync(join(RAIZ, `.claude/agents/${papel}.md`))).toBe(true)
      expect(documento()).toMatch(new RegExp(`claude --dangerously-skip-permissions --agent ${papel}( |\\n|$)`, 'm'))
    }
  })

  it('traz o socorro do hook, com o que ele perde e o que não apaga', () => {
    const texto = documento()
    expect(texto).toContain('git -C <checkout> checkout origin/develop -- tools/processo .claude/settings.json')
    expect(texto).toMatch(/perde/)
    expect(texto).toMatch(/não apaga/)
  })
})

describe('a limpeza pedida e não feita (RF27)', () => {
  const pedida = (minutos: number) => ({ pedida: new Date(agora.getTime() - minutos * 60_000).toISOString() })

  it('pedida há 11 minutos sem feita: se perdeu. Há 9: ainda não', () => {
    expect(limpezaPerdida(pedida(11), agora)).toBe(true)
    expect(limpezaPerdida(pedida(9), agora)).toBe(false)
  })

  it('o limite é "mais de 10 minutos": em 10 em ponto ainda não, um milissegundo depois sim', () => {
    expect(LIMPEZA_DEMORA_MS).toBe(10 * 60_000)
    expect(limpezaPerdida({ pedida: new Date(agora.getTime() - LIMPEZA_DEMORA_MS).toISOString() }, agora)).toBe(false)
    expect(limpezaPerdida({ pedida: new Date(agora.getTime() - LIMPEZA_DEMORA_MS - 1).toISOString() }, agora)).toBe(true)
  })

  it('feita igual ou depois da pedida: aconteceu. Feita de antes dela não vale', () => {
    const { pedida: quando } = pedida(11)
    expect(limpezaPerdida({ pedida: quando, feita: ha(5) }, agora)).toBe(false)
    expect(limpezaPerdida({ pedida: quando, feita: quando }, agora)).toBe(false)
    expect(limpezaPerdida({ pedida: quando, feita: ha(30) }, agora)).toBe(true)
  })

  it('sem pedida, ou só com a feita, não há o que acusar', () => {
    expect(limpezaPerdida({}, agora)).toBe(false)
    expect(limpezaPerdida({ feita: ha(60) }, agora)).toBe(false)
  })

  it('data que não se lê conta como perdida: na dúvida, acorda', () => {
    expect(limpezaPerdida({ pedida: 'ontem' }, agora)).toBe(true)
    expect(limpezaPerdida({ pedida: ha(11), feita: 'ontem' }, agora)).toBe(true)
  })

  it('a limpeza perdida acorda mesmo com o time trabalhando, e guarda o relógio de quem trabalha', () => {
    const trabalhando = decidir({ Mesa: TRABALHANDO }, {}, agora)
    expect(trabalhando.acordar).toBe(false)
    const acordada = comLimpeza(trabalhando, pedida(11), agora)
    expect(acordada.acordar).toBe(true)
    expect(acordada.motivo).toBe(`a limpeza pedida às ${pedida(11).pedida} não aconteceu`)
    expect(acordada.visto).toEqual({ Mesa: agora.toISOString() })
  })

  it('a limpeza em dia deixa a decisão como estava', () => {
    const trabalhando = decidir({ Mesa: TRABALHANDO }, {}, agora)
    expect(comLimpeza(trabalhando, pedida(9), agora)).toEqual(trabalhando)
    expect(comLimpeza(trabalhando, {}, agora)).toEqual(trabalhando)
  })
})

describe('a vigia como a rotina a roda (RF27)', () => {
  const pastas: string[] = []
  afterAll(() => {
    for (const pasta of pastas) rmSync(pasta, { recursive: true, force: true })
  })

  /** Um repositório com a cópia do `vigia.ts` e um `maestri` falso, que mostra o time trabalhando. */
  function montar(limpeza: object | null): string {
    const raiz = mkdtempSync(join(tmpdir(), 'vigia-'))
    pastas.push(raiz)
    mkdirSync(join(raiz, 'tools/processo'), { recursive: true })
    cpSync(join(RAIZ, 'tools/processo/vigia.ts'), join(raiz, 'tools/processo/vigia.ts'))
    mkdirSync(join(raiz, 'bin'))
    writeFileSync(join(raiz, 'tela.txt'), `${TRABALHANDO}\n`)
    writeFileSync(join(raiz, 'bin/maestri'), `#!/bin/sh\ncase "$1" in\n  list) cat '${FIXTURE_DO_LIST}' ;;\n  check) cat '${join(raiz, 'tela.txt')}' ;;\nesac\n`)
    chmodSync(join(raiz, 'bin/maestri'), 0o755)
    if (limpeza !== null) {
      mkdirSync(join(raiz, '.processo'))
      writeFileSync(join(raiz, '.processo/limpeza.json'), JSON.stringify(limpeza))
    }
    return raiz
  }

  function rodar(raiz: string): string {
    const resultado = spawnSync(process.execPath, [join(raiz, 'tools/processo/vigia.ts')], {
      cwd: raiz,
      env: { ...process.env, PATH: `${join(raiz, 'bin')}:${process.env['PATH'] ?? ''}` },
      encoding: 'utf8',
    })
    expect(resultado.status).toBe(0)
    return resultado.stdout
  }

  const haMinutos = (minutos: number) => new Date(Date.now() - minutos * 60_000).toISOString()

  it('com o time trabalhando e a limpeza em dia, ou sem arquivo de limpeza, não imprime nada', () => {
    expect(rodar(montar(null))).toBe('')
    expect(rodar(montar({ pedida: haMinutos(9) }))).toBe('')
    expect(rodar(montar({ pedida: haMinutos(11), feita: haMinutos(5) }))).toBe('')
  })

  it('com o time trabalhando e a limpeza pedida há 11 minutos sem feita, imprime /vigia', () => {
    expect(rodar(montar({ pedida: haMinutos(11) }))).toBe('/vigia\n')
  })

  it('limpeza.json que não se lê acorda: na dúvida, acorda', () => {
    const raiz = montar(null)
    mkdirSync(join(raiz, '.processo'))
    writeFileSync(join(raiz, '.processo/limpeza.json'), '{ isto não é json')
    expect(rodar(raiz)).toBe('/vigia\n')
  })
})

describe('o início de sessão grava a limpeza feita (RF27)', () => {
  const pastas: string[] = []
  afterAll(() => {
    for (const pasta of pastas) rmSync(pasta, { recursive: true, force: true })
  })

  const ambienteGit: NodeJS.ProcessEnv = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }
  const git = (cwd: string, ...argumentos: string[]) => execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...argumentos], { cwd, env: ambienteGit, stdio: 'pipe' })

  /** O térreo: um checkout principal com o `ROADMAP.md` que o `contexto-inicial.sh` reconhece, e um commit. */
  function terreo(): string {
    const raiz = mkdtempSync(join(tmpdir(), 'limpeza-'))
    pastas.push(raiz)
    git(raiz, 'init', '-q')
    writeFileSync(join(raiz, 'ROADMAP.md'), '# Roadmap\n')
    git(raiz, 'add', 'ROADMAP.md')
    git(raiz, 'commit', '-q', '-m', 'raiz')
    return raiz
  }

  function iniciar(raiz: string, source: string, papel?: string): void {
    const ambiente: NodeJS.ProcessEnv = { ...ambienteGit, CLAUDE_PROJECT_DIR: raiz }
    delete ambiente['CLAUDE_CODE_AGENT']
    if (papel !== undefined) ambiente['CLAUDE_CODE_AGENT'] = papel
    const resultado = spawnSync('bash', [join(RAIZ, '.claude/hooks/contexto-inicial.sh')], { cwd: raiz, env: ambiente, input: JSON.stringify({ source }), encoding: 'utf8' })
    expect(resultado.status).toBe(0)
  }

  const limpezaDe = (raiz: string): Record<string, string> | null => {
    const arquivo = join(raiz, '.processo/limpeza.json')
    return existsSync(arquivo) ? (JSON.parse(readFileSync(arquivo, 'utf8')) as Record<string, string>) : null
  }

  it('source clear, sem papel, no térreo: grava a feita agora e mantém a pedida', () => {
    const raiz = terreo()
    mkdirSync(join(raiz, '.processo'))
    writeFileSync(join(raiz, '.processo/limpeza.json'), JSON.stringify({ pedida: '2026-10-24T10:00:00Z' }))
    const antes = Date.now()
    iniciar(raiz, 'clear')
    const limpeza = limpezaDe(raiz)
    expect(limpeza?.['pedida']).toBe('2026-10-24T10:00:00Z')
    expect(Date.parse(limpeza?.['feita'] ?? '')).toBeGreaterThanOrEqual(antes)
    expect(Date.parse(limpeza?.['feita'] ?? '')).toBeLessThanOrEqual(Date.now())
  })

  it('sem arquivo antes, cria só a feita; arquivo que não se lê é refeito', () => {
    const semArquivo = terreo()
    iniciar(semArquivo, 'clear')
    expect(Object.keys(limpezaDe(semArquivo) ?? {})).toEqual(['feita'])
    // Não é JSON, e é JSON que não é um objeto: lista, nulo e texto.
    for (const conteudo of ['[1, 2', '[1, 2]', 'null', '"texto"']) {
      const estragado = terreo()
      mkdirSync(join(estragado, '.processo'))
      writeFileSync(join(estragado, '.processo/limpeza.json'), conteudo)
      iniciar(estragado, 'clear')
      expect(Object.keys(limpezaDe(estragado) ?? {})).toEqual(['feita'])
    }
  })

  it('com papel: não grava', () => {
    const raiz = terreo()
    iniciar(raiz, 'clear', 'mesa-de-revisao')
    expect(limpezaDe(raiz)).toBeNull()
  })

  it.each(['startup', 'compact', 'resume'])('source %s: não grava', (source) => {
    const raiz = terreo()
    iniciar(raiz, source)
    expect(limpezaDe(raiz)).toBeNull()
  })

  it('fora do térreo, num andar (worktree) do mesmo repositório: não grava', () => {
    const raiz = terreo()
    const andar = `${raiz}-andar`
    pastas.push(andar)
    git(raiz, 'worktree', 'add', '-q', '-b', 'spec/x', andar)
    iniciar(andar, 'clear')
    expect(limpezaDe(andar)).toBeNull()
    expect(readdirSync(raiz)).not.toContain('.processo')
  })

  it('fora de um repositório git: não grava', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'sem-git-'))
    pastas.push(raiz)
    writeFileSync(join(raiz, 'ROADMAP.md'), '# Roadmap\n')
    iniciar(raiz, 'clear')
    expect(limpezaDe(raiz)).toBeNull()
  })
})

describe('o comando da limpeza grava a pedida que a vigia lê (RF27)', () => {
  /** O bloco `bash` do passo que tem o comando da limpeza, como o Orquestrador o copia. */
  function comandoDo(passo: string): string {
    const texto = readFileSync(join(RAIZ, `.claude/skills/seguir/passos/${passo}`), 'utf8')
    const blocos = [...texto.matchAll(/```bash\n([\s\S]*?)```/g)].map((achado) => achado[1] ?? '').filter((bloco) => bloco.includes('Limpa o Orquestrador'))
    expect(blocos).toHaveLength(1)
    return (blocos[0] ?? '').trim()
  }

  it.each(['6-tarefa.md', '9-vigia-e-contexto.md'])('%s: roda no térreo, grava a pedida de agora e dispara a rotina', async (passo) => {
    const raiz = mkdtempSync(join(tmpdir(), 'comando-'))
    try {
      mkdirSync(join(raiz, 'bin'))
      const marca = join(raiz, 'disparou.txt')
      writeFileSync(join(raiz, 'bin/maestri'), `#!/bin/sh\necho "$@" > '${marca}'\n`)
      chmodSync(join(raiz, 'bin/maestri'), 0o755)
      const antes = Date.now()
      // O `sleep 25` é a espera do turno acabar: aqui não há turno.
      const resultado = spawnSync('sh', ['-c', comandoDo(passo).replace('sleep 25', 'sleep 0')], { cwd: raiz, env: { ...process.env, PATH: `${join(raiz, 'bin')}:${process.env['PATH'] ?? ''}` }, encoding: 'utf8' })
      expect(resultado.status).toBe(0)
      const limpeza = JSON.parse(readFileSync(join(raiz, '.processo/limpeza.json'), 'utf8')) as { pedida: string; feita?: string }
      expect(Object.keys(limpeza)).toEqual(['pedida'])
      // A data tem a precisão de segundo do `date`: cabe numa janela de um segundo antes do comando e de um minuto depois.
      expect(Date.parse(limpeza.pedida)).toBeGreaterThanOrEqual(antes - 1000)
      expect(Date.parse(limpeza.pedida)).toBeLessThanOrEqual(Date.now())
      // E é o que a vigia lê: em dia agora, perdida onze minutos depois.
      expect(limpezaPerdida(limpeza, new Date())).toBe(false)
      expect(limpezaPerdida(limpeza, new Date(Date.now() + 11 * 60_000))).toBe(true)
      for (let tentativa = 0; tentativa < 50 && !existsSync(marca); tentativa++) await new Promise((resolver) => setTimeout(resolver, 100))
      expect(readFileSync(marca, 'utf8').trim()).toBe('routine run Limpa o Orquestrador')
    } finally {
      rmSync(raiz, { recursive: true, force: true })
    }
  })
})
