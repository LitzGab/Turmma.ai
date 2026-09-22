import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  acrescentarRevisao,
  alteracaoQueCaduca,
  alteracoesDeCodigo,
  arquivosDoCommit,
  avaliarCarimbo,
  avaliarPortao,
  caminhoDaTarefa,
  ehCommit,
  extrairVeredito,
  gravarCarimbo,
  lerHora,
  lerRevisoes,
  lerTranscript,
  portao,
  registrar,
  revisoresObrigatorios,
  type Carimbo,
  type Revisao,
} from './revisoes.ts'

const TAREFA = `# Tarefa 9.0 — Exemplo

**Funcionalidade:** exemplo · **Depende de:** 7.0
**Subagentes obrigatórios:** \`infra-guardian\`, \`tenancy-guardian\`, \`frontend-reviewer\`, \`domain-researcher\`, \`test-engineer\`

## Critério de conclusão

- [ ] Revisão aprovada
`

const rodada = (revisor: string, veredito: string, inicio: string, fim = inicio): Omit<Revisao, 'rodada'> => ({
  revisor,
  veredito,
  inicio,
  fim,
  agente: `a-${revisor}`,
})

function tarefaCom(...revisoes: Omit<Revisao, 'rodada'>[]): string {
  return revisoes.reduce((conteudo, revisao) => acrescentarRevisao(conteudo, revisao), TAREFA)
}

const tudoAprovadoAs10 = tarefaCom(
  rodada('infra-guardian', 'APROVADO', '2026-09-13 10:00:00', '2026-09-13 10:05:00'),
  rodada('tenancy-guardian', 'APROVADO', '2026-09-13 10:00:00', '2026-09-13 10:04:00'),
  rodada('frontend-reviewer', 'AJUSTES NECESSÁRIOS', '2026-09-13 10:00:00', '2026-09-13 10:03:00'),
  rodada('test-engineer', 'APROVADO', '2026-09-13 10:00:00', '2026-09-13 10:06:00'),
  rodada('revisor-geral', 'APROVADO', '2026-09-13 10:00:00', '2026-09-13 10:07:00'),
)

// O portão local passou às 09:59:30, com o e2e e o infra que o frontend-reviewer e o infra-guardian exigem.
const carimboVerde: Carimbo = { inicio: new Date(lerHora('2026-09-13 09:59:30')).toISOString(), suites: ['typecheck', 'lint', 'test', 'e2e', 'infra'] }

const portaoDe = (
  conteudo: string,
  alteradoEm: string | null,
  mensagem = 'Implementa x (tarefa 9.0)\n\nRevisões: ...',
  arquivo = 'apps/worker/src/executor.ts',
  carimbo: Carimbo | null = carimboVerde,
) =>
  avaliarPortao({
    obrigatorios: revisoresObrigatorios(conteudo),
    revisoes: lerRevisoes(conteudo),
    alteracoes: alteradoEm ? [{ arquivo, quando: lerHora(alteradoEm), hash: 'hash-do-conteudo-atual' }] : [],
    carimbo,
    mensagemCommit: mensagem,
  })

describe('veredito e tarefa do revisor', () => {
  it('lê o veredito nos formatos que os revisores escrevem', () => {
    expect(extrairVeredito('VEREDITO: APROVADO')).toBe('APROVADO')
    expect(extrairVeredito('**VEREDITO:** REPROVADO\n\nProblemas...')).toBe('REPROVADO')
    expect(extrairVeredito('VEREDITO: **APROVADO**, desde que a integração, que ficou REPROVADO antes, passe')).toBe('APROVADO')
    expect(extrairVeredito('VEREDITO: VETO')).toBe('REPROVADO')
    expect(extrairVeredito('VEREDITO: AJUSTES NECESSÁRIOS')).toBe('AJUSTES NECESSÁRIOS')
    expect(extrairVeredito('Parece tudo certo, aprovado.')).toBeNull()
  })

  it('a linha "Tarefa:" do prompt vence a menção a outra tarefa usada como contexto', () => {
    const prompt = 'Contexto: o despachante de tasks/prd-fundacao-tecnica/7_task.md.\nTarefa: tasks/prd-fundacao-tecnica/9_task.md'
    expect(caminhoDaTarefa(prompt)).toBe('tasks/prd-fundacao-tecnica/9_task.md')
  })

  it('a rodada começa na última mensagem de quem chamou, não no último resultado de ferramenta', () => {
    const transcript = [
      { type: 'user', timestamp: '2026-09-13T13:00:00.000Z', message: { content: 'Tarefa: tasks/prd-x/9_task.md' } },
      { type: 'user', timestamp: '2026-09-13T13:01:00.000Z', message: { content: [{ type: 'tool_result', content: 'ok' }] } },
      { type: 'user', timestamp: '2026-09-13T13:20:00.000Z', message: { content: [{ type: 'text', text: 'Corrigido, revise de novo' }] } },
      { type: 'user', timestamp: '2026-09-13T13:21:00.000Z', message: { content: [{ type: 'tool_result', content: 'ok' }] } },
    ]
    const lido = lerTranscript(transcript.map((linha) => JSON.stringify(linha)).join('\n'))
    expect(lido.inicioDaRodada?.toISOString()).toBe('2026-09-13T13:20:00.000Z')
    expect(caminhoDaTarefa(lido.prompt)).toBe('tasks/prd-x/9_task.md')
  })
})

describe('seção Revisões', () => {
  it('cria a seção uma vez e numera a rodada por revisor', () => {
    const conteudo = tarefaCom(
      rodada('infra-guardian', 'REPROVADO', '2026-09-13 09:00:00'),
      rodada('test-engineer', 'APROVADO', '2026-09-13 09:01:00'),
      rodada('infra-guardian', 'APROVADO', '2026-09-13 09:30:00'),
    )
    expect(conteudo.match(/## Revisões/g)).toHaveLength(1)
    expect(lerRevisoes(conteudo).map((revisao) => [revisao.revisor, revisao.rodada, revisao.veredito])).toEqual([
      ['infra-guardian', 1, 'REPROVADO'],
      ['test-engineer', 1, 'APROVADO'],
      ['infra-guardian', 2, 'APROVADO'],
    ])
  })

  it('obrigatórios são só os revisores, não o pesquisador, e toda tarefa tem revisor-geral', () => {
    expect(revisoresObrigatorios(TAREFA)).toEqual(['infra-guardian', 'tenancy-guardian', 'frontend-reviewer', 'test-engineer', 'revisor-geral'])
    expect(revisoresObrigatorios('**Subagentes obrigatórios:** `tenancy-guardian`')).toEqual(['tenancy-guardian', 'test-engineer', 'revisor-geral'])
    expect(revisoresObrigatorios('**Subagentes obrigatórios:** `privacy-guardian`', 'correcao')).toEqual(['privacy-guardian', 'test-engineer'])
  })

  it('reconhece a revisão de spec e a correção como documentos, e não o arquivo de achados', () => {
    expect(caminhoDaTarefa('Tarefa: tasks/prd-x/revisao-spec.md')).toBe('tasks/prd-x/revisao-spec.md')
    expect(caminhoDaTarefa('Tarefa: tasks/correcoes/2026-09-15-dns-lento.md')).toBe('tasks/correcoes/2026-09-15-dns-lento.md')
    expect(caminhoDaTarefa('Veja tasks/correcoes/achados-revisoes.md')).toBeNull()
  })
})

describe('portão do commit', () => {
  it('passa com todos os obrigatórios revisados depois da última alteração e a linha de revisões', () => {
    expect(portaoDe(tudoAprovadoAs10, '2026-09-13 09:59:00').bloqueios).toEqual([])
  })

  it('bloqueia revisor obrigatório que nunca rodou', () => {
    const semTenancy = tarefaCom(
      rodada('infra-guardian', 'APROVADO', '2026-09-13 10:00:00'),
      rodada('frontend-reviewer', 'APROVADO', '2026-09-13 10:00:00'),
      rodada('test-engineer', 'APROVADO', '2026-09-13 10:00:00'),
      rodada('revisor-geral', 'APROVADO', '2026-09-13 10:00:00'),
    )
    const { bloqueios } = portaoDe(semTenancy, '2026-09-13 09:00:00')
    expect(bloqueios).toHaveLength(1)
    expect(bloqueios[0]).toMatch(/^tenancy-guardian: nenhuma rodada/)
  })

  it('bloqueia quando a última rodada de um revisor com veto reprovou, mesmo com aprovação antes (caso da 5.0)', () => {
    const conteudo = acrescentarRevisao(tudoAprovadoAs10, rodada('infra-guardian', 'REPROVADO', '2026-09-13 10:20:00'))
    const { bloqueios } = portaoDe(conteudo, '2026-09-13 09:59:00')
    expect(bloqueios).toHaveLength(1)
    expect(bloqueios[0]).toMatch(/^infra-guardian: a última rodada \(2ª/)
  })

  it('bloqueia aprovação anterior a uma correção: a revisão vale para o código que o revisor viu', () => {
    const { bloqueios } = portaoDe(tudoAprovadoAs10, '2026-09-13 10:30:00')
    expect(bloqueios.map((bloqueio) => bloqueio.split(':')[0])).toEqual([
      'infra-guardian',
      'tenancy-guardian',
      'frontend-reviewer',
      'test-engineer',
      'revisor-geral',
      'portão local',
    ])
  })

  it('correção só em teste caduca test-engineer e revisor-geral, e não os guardiões', () => {
    const { bloqueios } = portaoDe(tudoAprovadoAs10, '2026-09-13 10:30:00', undefined, 'apps/api/test/sessao-guarda.int.test.ts')
    expect(bloqueios.map((bloqueio) => bloqueio.split(':')[0])).toEqual(['test-engineer', 'revisor-geral', 'portão local'])
  })

  it('bloqueia sem carimbo do portão local, com carimbo velho, e com carimbo sem a suíte que a tarefa exige', () => {
    expect(portaoDe(tudoAprovadoAs10, '2026-09-13 09:59:00', undefined, undefined, null).bloqueios).toEqual([
      expect.stringMatching(/^portão local: nunca passou.*--e2e --infra/),
    ])
    const velho = { ...carimboVerde, inicio: new Date(lerHora('2026-09-13 09:58:00')).toISOString() }
    expect(portaoDe(tudoAprovadoAs10, '2026-09-13 09:59:00', undefined, undefined, velho).bloqueios).toEqual([
      expect.stringMatching(/^portão local: apps\/worker\/src\/executor.ts mudou/),
    ])
    const semE2e = { ...carimboVerde, suites: ['typecheck', 'lint', 'test', 'infra'] }
    expect(portaoDe(tudoAprovadoAs10, '2026-09-13 09:59:00', undefined, undefined, semE2e).bloqueios).toEqual([
      expect.stringMatching(/^portão local: o último não rodou e2e/),
    ])
  })

  it('bloqueia correção feita enquanto a rodada corria, mesmo que o veredito tenha saído depois', () => {
    // infra começou 10:00 e aprovou 10:05; a alteração é de 10:02.
    const { bloqueios } = portaoDe(tudoAprovadoAs10, '2026-09-13 10:02:00')
    expect(bloqueios.some((bloqueio) => bloqueio.startsWith('infra-guardian:'))).toBe(true)
  })

  it('revisor-geral reprovado bloqueia como veto', () => {
    const conteudo = acrescentarRevisao(tudoAprovadoAs10, rodada('revisor-geral', 'REPROVADO', '2026-09-13 10:20:00'))
    expect(portaoDe(conteudo, '2026-09-13 09:59:00').bloqueios).toEqual([expect.stringMatching(/^revisor-geral: a última rodada \(2ª/)])
  })

  it('revisor sem veto com AJUSTES NECESSÁRIOS não bloqueia, se rodou sobre o código atual', () => {
    const { bloqueios } = portaoDe(tudoAprovadoAs10, '2026-09-13 09:59:00')
    expect(bloqueios.some((bloqueio) => bloqueio.startsWith('frontend-reviewer'))).toBe(false)
  })

  it('bloqueia a mensagem sem a linha de revisões e sugere a linha', () => {
    const { bloqueios, linhaResumo } = portaoDe(tudoAprovadoAs10, '2026-09-13 09:59:00', 'Implementa x (tarefa 9.0)')
    expect(bloqueios).toHaveLength(1)
    expect(linhaResumo).toBe(
      'Revisões: infra-guardian APROVADO (1ª rodada), tenancy-guardian APROVADO (1ª rodada), frontend-reviewer AJUSTES NECESSÁRIOS (1ª rodada), test-engineer APROVADO (1ª rodada), revisor-geral APROVADO (1ª rodada)',
    )
  })
})

describe('hooks sobre um repositório de verdade', () => {
  function repositorio() {
    const raiz = mkdtempSync(join(tmpdir(), 'revisoes-'))
    const git = (...args: string[]) => execFileSync('git', args, { cwd: raiz, stdio: 'pipe' })
    git('init', '-q')
    mkdirSync(join(raiz, 'tasks/prd-exemplo'), { recursive: true })
    mkdirSync(join(raiz, 'apps'), { recursive: true })
    writeFileSync(join(raiz, 'tasks/prd-exemplo/9_task.md'), TAREFA.replace(', `frontend-reviewer`', ''))
    writeFileSync(join(raiz, 'apps/codigo.ts'), 'export const a = 1\n')
    return raiz
  }

  // O transcript mora fora do repositório, como em ~/.claude/projects.
  const pastaTranscripts = mkdtempSync(join(tmpdir(), 'transcripts-'))
  function transcript(_raiz: string, nome: string, inicio: string) {
    const caminho = join(pastaTranscripts, `${nome}-${Math.random().toString(36).slice(2)}.jsonl`)
    const prompt = 'Audite a tarefa.\nTarefa: tasks/prd-exemplo/9_task.md\nVeja também tasks/prd-exemplo/7_task.md'
    writeFileSync(caminho, JSON.stringify({ type: 'user', timestamp: new Date(inicio).toISOString(), message: { content: prompt } }))
    return caminho
  }

  const tocar = (raiz: string, arquivo: string, quando: string) => {
    const data = new Date(quando)
    utimesSync(join(raiz, arquivo), data, data)
  }

  it('o revisor registra a própria rodada, e o commit só passa quando todos aprovaram depois da correção', () => {
    const raiz = repositorio()
    const commit = { tool_input: { command: 'git add -A && git commit -m "Implementa x (tarefa 9.0)\n\nRevisões: ok"' } }
    tocar(raiz, 'apps/codigo.ts', '2026-09-13T09:00:00')

    expect(portao(commit, raiz)).toMatch(/nenhuma rodada/)

    for (const revisor of ['infra-guardian', 'tenancy-guardian', 'test-engineer', 'revisor-geral']) {
      const veredito = revisor === 'tenancy-guardian' ? 'REPROVADO' : 'APROVADO'
      const mensagem = veredito === 'REPROVADO' ? 'VEREDITO: REPROVADO\nBloqueantes:\n- apps/codigo.ts:1 sem escopo de escola' : `VEREDITO: ${veredito}`
      registrar(
        { agent_type: revisor, agent_id: `a-${revisor}`, agent_transcript_path: transcript(raiz, revisor, '2026-09-13T10:00:00'), last_assistant_message: mensagem },
        raiz,
        new Date('2026-09-13T10:05:00'),
      )
    }
    // Quem não é revisor não escreve na tarefa.
    registrar({ agent_type: 'Explore', last_assistant_message: 'VEREDITO: APROVADO Tarefa: tasks/prd-exemplo/9_task.md' }, raiz)

    const registradas = lerRevisoes(readFileSync(join(raiz, 'tasks/prd-exemplo/9_task.md'), 'utf8'))
    expect(registradas.map((revisao) => `${revisao.revisor} ${revisao.veredito} ${revisao.inicio}`)).toEqual([
      'infra-guardian APROVADO 2026-09-13 10:00:00',
      'tenancy-guardian REPROVADO 2026-09-13 10:00:00',
      'test-engineer APROVADO 2026-09-13 10:00:00',
      'revisor-geral APROVADO 2026-09-13 10:00:00',
    ])
    expect(portao(commit, raiz)).toMatch(/tenancy-guardian: a última rodada/)
    // Só a rodada que reprovou vai para os achados, com o que o revisor exigiu.
    const achados = readFileSync(join(raiz, 'tasks/prd-exemplo/achados/9_task.md'), 'utf8')
    expect(achados).toMatch(/## tenancy-guardian · 1ª rodada · REPROVADO · 2026-09-13 10:05:00 · `tasks\/prd-exemplo\/9_task.md`/)
    expect(achados).toMatch(/sem escopo de escola/)
    expect(achados).not.toMatch(/infra-guardian/)

    // Corrige às 10:10 e só o tenancy revisa de novo: infra e test-engineer viram código antigo.
    tocar(raiz, 'apps/codigo.ts', '2026-09-13T10:10:00')
    registrar(
      { agent_type: 'tenancy-guardian', agent_transcript_path: transcript(raiz, 'tenancy-2', '2026-09-13T10:11:00'), last_assistant_message: 'VEREDITO: APROVADO' },
      raiz,
      new Date('2026-09-13T10:15:00'),
    )
    const motivo = portao(commit, raiz)
    expect(motivo).toMatch(/infra-guardian: apps\/codigo.ts mudou/)
    expect(motivo).toMatch(/test-engineer: apps\/codigo.ts mudou/)
    expect(motivo).toMatch(/revisor-geral: apps\/codigo.ts mudou/)
    expect(motivo).not.toMatch(/tenancy-guardian/)

    for (const revisor of ['infra-guardian', 'test-engineer', 'revisor-geral']) {
      registrar(
        { agent_type: revisor, agent_transcript_path: transcript(raiz, `${revisor}-2`, '2026-09-13T10:12:00'), last_assistant_message: 'VEREDITO: APROVADO' },
        raiz,
        new Date('2026-09-13T10:16:00'),
      )
    }
    expect(portao(commit, raiz)).toMatch(/portão local: nunca passou/)
    gravarCarimbo(raiz, { inicio: new Date('2026-09-13T10:11:00').toISOString(), suites: ['typecheck', 'lint', 'test', 'infra'] })
    expect(portao(commit, raiz)).toBeNull()
  })

  it('correção passa pelo mesmo portão, com o documento em tasks/correcoes', () => {
    const raiz = repositorio()
    tocar(raiz, 'apps/codigo.ts', '2026-09-13T09:00:00')
    const commit = { tool_input: { command: 'git add apps/codigo.ts && git commit -m "Corrige x (correção 2026-09-13-x)\n\nRevisões: ok"' } }
    expect(portao(commit, raiz)).toMatch(/não tem tasks\/correcoes\/2026-09-13-x.md/)

    mkdirSync(join(raiz, 'tasks/correcoes'), { recursive: true })
    writeFileSync(join(raiz, 'tasks/correcoes/2026-09-13-x.md'), '# Correção\n\n**Subagentes obrigatórios:** `tenancy-guardian`\n')
    expect(portao(commit, raiz)).toMatch(/tenancy-guardian: nenhuma rodada[\s\S]*test-engineer: nenhuma rodada/)
    expect(portao(commit, raiz)).not.toMatch(/revisor-geral/)
  })

  it('bloqueia commit que leva código sem tarefa nem correção, e deixa passar o que não é código', () => {
    const raiz = repositorio()
    writeFileSync(join(raiz, 'docs.md'), 'texto\n')
    expect(portao({ tool_input: { command: 'git add apps/codigo.ts && git commit -m "Ajusta x"' } }, raiz)).toMatch(/leva código \(apps\/codigo.ts\)/)
    expect(portao({ tool_input: { command: 'git add -A && git commit -m "Ajusta x"' } }, raiz)).toMatch(/leva código/)
    expect(portao({ tool_input: { command: 'git add docs.md && git commit -m "Ajusta o texto"' } }, raiz)).toBeNull()
    // Código sujo de outra tarefa na árvore não bloqueia o commit que não o leva.
    expect(portao({ tool_input: { command: 'git commit -m "Registra decisão D53"' } }, raiz)).toBeNull()
  })

  it('lê do comando os arquivos que o commit leva', () => {
    const alterados = ['apps/a.ts', 'apps/b/c.ts', '.claude/x.md', 'tools/y.ts']
    expect(arquivosDoCommit('git add .claude tools/y.ts && git commit -m "x"', '/r', alterados, [])).toEqual(['.claude/x.md', 'tools/y.ts'])
    expect(arquivosDoCommit('git add "apps/b/" && git commit -F- <<EOF', '/r', alterados, [])).toEqual(['apps/b/c.ts'])
    expect(arquivosDoCommit('git commit -am "x -a"', '/r', alterados, [])).toEqual(alterados)
    expect(arquivosDoCommit('git commit -m "use git commit -a"', '/r', alterados, ['tools/y.ts'])).toEqual(['tools/y.ts'])
    expect(arquivosDoCommit('git add /r/apps/a.ts && git commit -m x', '/r', alterados, [])).toEqual(['apps/a.ts'])
  })

  it('reconhece commit em posição de comando, não texto que só menciona commit', () => {
    expect(ehCommit('git commit -m "x (tarefa 9.0)"')).toBe(true)
    expect(ehCommit('git add a b && git commit -F- <<EOF')).toBe(true)
    expect(ehCommit('cd /repo; GIT_EDITOR=true git -C /repo commit')).toBe(true)
    expect(ehCommit('echo \'{"command":"git commit -m (tarefa 9.0)"}\' | node hook.ts')).toBe(false)
    expect(ehCommit('git log --grep "git commit"')).toBe(false)
  })

  it('não interfere em comando que não é commit de tarefa', () => {
    const raiz = repositorio()
    expect(portao({ tool_input: { command: 'npm run test' } }, raiz)).toBeNull()
    expect(portao({ tool_input: { command: 'git commit -m "Registra decisão D43"' } }, raiz)).toBeNull()
  })
})

describe('o que conta como alteração depois do portão e da rodada', () => {
  // As três correções vieram da retrospectiva do F1: 10 reprovações por carimbo, 6 delas sem nenhum
  // bloqueante de código, e 63 das 200 rodadas caducadas sem reprovação.

  const carimbo: Carimbo = { inicio: '2026-09-20T10:00:00.000Z', suites: ['typecheck', 'lint', 'test'] }
  const exigidas = ['typecheck', 'lint', 'test']

  it('arquivo salvo no mesmo segundo, mas antes do início do portão, não invalida o carimbo', () => {
    // O caso real das tarefas 7.0 e 16.0: 39 ms antes do início, recusado porque a comparação
    // truncava para segundo inteiro. Duas rodadas de revisão gastas por arredondamento.
    const antes = [{ arquivo: 'apps/api/src/ops/comando.ts', quando: Date.parse('2026-09-20T10:00:00.000Z') - 39, hash: 'a' }]
    expect(avaliarCarimbo(carimbo, exigidas, antes)).toBeNull()
    const depois = [{ arquivo: 'apps/api/src/ops/comando.ts', quando: Date.parse('2026-09-20T10:00:00.000Z') + 1, hash: 'a' }]
    expect(avaliarCarimbo(carimbo, exigidas, depois)).toContain('mudou em')
  })

  it('arquivo que voltou ao mesmo conteúdo não invalida o carimbo nem a rodada', () => {
    // O revisor prova a guarda mutando o arquivo e restaurando. O mtime anda, o conteúdo não.
    const alteracao = { arquivo: '.github/workflows/ci.yml', quando: Date.parse('2026-09-20T11:00:00.000Z'), hash: 'mesmo-conteudo' }
    const alteracoes = [alteracao]
    const instantaneo = { '.github/workflows/ci.yml': 'mesmo-conteudo' }
    expect(avaliarCarimbo(carimbo, exigidas, alteracoes, instantaneo)).toBeNull()
    expect(alteracaoQueCaduca('test-engineer', '2026-09-20 07:00:00', alteracoes, instantaneo)).toBeNull()

    // E continua pegando a mudança de verdade.
    const outroConteudo = [{ ...alteracao, hash: 'conteudo-novo' }]
    expect(avaliarCarimbo(carimbo, exigidas, outroConteudo, instantaneo)).toContain('mudou em')
    expect(alteracaoQueCaduca('test-engineer', '2026-09-20 07:00:00', outroConteudo, instantaneo)?.arquivo).toBe('.github/workflows/ci.yml')
  })

  it('documento que nenhuma suíte lê não é código; o runbook, que uma guarda lê, é', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'retro-'))
    for (const arquivo of ['TODO.md', 'docs/runbook.md', 'apps/api/src/x.ts']) {
      mkdirSync(join(raiz, dirname(arquivo)), { recursive: true })
      writeFileSync(join(raiz, arquivo), 'conteúdo')
    }
    const alteracoes = alteracoesDeCodigo(raiz, ['TODO.md', 'docs/runbook.md', 'apps/api/src/x.ts'])
    expect(alteracoes.map(({ arquivo }) => arquivo).sort()).toEqual(['apps/api/src/x.ts', 'docs/runbook.md'])
    expect(alteracoes.every(({ hash }) => hash.length === 64)).toBe(true)
  })
})

describe('achados separados por documento, com índice', () => {
  // O arquivo único da pasta chegou a 646 KB / 158 rodadas no F1, e o passo 2 do /executar-task
  // manda lê-lo antes de cada tarefa. Ou não era lido, ou consumia a janela antes de começar.

  function repositorio() {
    const raiz = mkdtempSync(join(tmpdir(), 'achados-'))
    execFileSync('git', ['init', '-q'], { cwd: raiz, stdio: 'pipe' })
    mkdirSync(join(raiz, 'tasks/prd-exemplo'), { recursive: true })
    return raiz
  }

  // Seis revisores distintos: o hook só registra agent_type que ele conhece.
  const REVISORES_DE_TESTE_PARALELO = ['test-engineer', 'revisor-geral', 'tenancy-guardian', 'privacy-guardian', 'infra-guardian', 'conformidade-reviewer']

  const linhasDoIndice = (indice: string) => indice.split('\n').filter((linha) => /^\| 20\d\d-/.test(linha))

  // Um item como os revisores escrevem de verdade: caminho absoluto da máquina, `|` no meio, e
  // muito mais que os 160 caracteres que cabem numa linha de índice.
  const ITEM_LONGO =
    '`/home/joaquim/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:88` — começo do parágrafo: ' +
    'a guarda aceita `falhou() || vencido()` sem distinguir os dois casos, e quem lê o log não sabe qual ' +
    'aconteceu. Isso atrapalha o diagnóstico da manhã de segunda, quando sessenta turmas entram juntas e ' +
    'o socorro precisa saber se a conta travou ou se a sessão venceu. fim do parágrafo'

  const pasta = mkdtempSync(join(tmpdir(), 'transcripts-achados-'))
  let sequencia = 0

  function rodada(raiz: string, documento: string, revisor: string, mensagem: string, fim: string) {
    const conteudo = join(raiz, documento)
    if (!existsSync(conteudo)) writeFileSync(conteudo, `# ${documento}\n\n**Subagentes obrigatórios:** \`${revisor}\`\n`)
    const caminhoTranscript = join(pasta, `t-${String(sequencia++)}.jsonl`)
    writeFileSync(caminhoTranscript, JSON.stringify({ type: 'user', timestamp: new Date(fim).toISOString(), message: { content: `Tarefa: ${documento}` } }))
    registrar({ agent_type: revisor, agent_id: 'a1', agent_transcript_path: caminhoTranscript, last_assistant_message: mensagem }, raiz, new Date(fim))
  }

  it('guarda o achado no arquivo do documento, não num arquivo único da pasta', () => {
    const raiz = repositorio()
    rodada(
      raiz,
      'tasks/prd-exemplo/3_task.md',
      'tenancy-guardian',
      'VEREDITO: REPROVADO\n\nBloqueantes:\n- `apps/api/src/turma.repository.ts:40` — query sem escopo de escola',
      '2026-09-13T10:05:00',
    )
    rodada(
      raiz,
      'tasks/prd-exemplo/20_task.md',
      'test-engineer',
      'VEREDITO: APROVADO\n\nBloqueantes: nenhum\n\nRecomendações:\n- `apps/web/src/sessao.ts:12` — o vencimento não tem folga de relógio',
      '2026-09-14T11:00:00',
    )

    const daTres = readFileSync(join(raiz, 'tasks/prd-exemplo/achados/3_task.md'), 'utf8')
    const daVinte = readFileSync(join(raiz, 'tasks/prd-exemplo/achados/20_task.md'), 'utf8')
    expect(daTres).toMatch(/query sem escopo de escola/)
    expect(daTres).not.toMatch(/folga de relógio/)
    expect(daVinte).toMatch(/folga de relógio/)
    expect(daVinte).not.toMatch(/query sem escopo de escola/)
    // O arquivo único da pasta deixa de existir: quem o lesse leria as vinte tarefas de uma vez.
    expect(existsSync(join(raiz, 'tasks/prd-exemplo/achados-revisoes.md'))).toBe(false)
  })

  it('o índice resume o que o revisor exigiu e aponta o bloco', () => {
    const raiz = repositorio()
    rodada(
      raiz,
      'tasks/prd-exemplo/3_task.md',
      'tenancy-guardian',
      'VEREDITO: REPROVADO\n\nBloqueantes:\n- `apps/api/src/turma.repository.ts:40` — query sem escopo de escola',
      '2026-09-13T10:05:00',
    )
    // As formas que os revisores usam de verdade: negrito, título, "(não bloqueiam)", item abaixo.
    rodada(
      raiz,
      'tasks/prd-exemplo/20_task.md',
      'revisor-geral',
      'VEREDITO: APROVADO\n\n**Bloqueantes:** nenhum.\n\n## Recomendações (não bloqueiam)\n\n1. `apps/web/src/sessao.ts:12` — o vencimento não tem folga de relógio',
      '2026-09-14T11:00:00',
    )
    // Revisor que escreve um parágrafo, com `|` no meio e caminho absoluto da máquina.
    rodada(raiz, 'tasks/prd-exemplo/4_task.md', 'infra-guardian', `VEREDITO: REPROVADO\n\nBloqueantes:\n- ${ITEM_LONGO}`, '2026-09-15T09:00:00')

    const indice = readFileSync(join(raiz, 'tasks/prd-exemplo/achados/indice.md'), 'utf8')
    const linhas = linhasDoIndice(indice)
    expect(linhas).toHaveLength(3)
    expect(linhas[0]).toContain('`tenancy-guardian`')
    expect(linhas[0]).toContain('REPROVADO')
    expect(linhas[0]).toContain('3_task')
    expect(linhas[0]).toContain('query sem escopo de escola')
    expect(linhas[1]).toContain('o vencimento não tem folga de relógio')
    // "nenhum" não vira resumo: a linha teria de dizer o que fazer, e diria "nenhum".
    expect(linhas[1]).not.toMatch(/nenhum/)

    // O parágrafo é cortado: sem corte, uma rodada sozinha põe 400 caracteres no índice.
    const longa = linhas[2] ?? ''
    expect(longa).toContain('começo do parágrafo')
    expect(longa).not.toContain('fim do parágrafo')
    expect(longa).toMatch(/…/)
    // O caminho absoluto da máquina sai; o do repositório fica, que é o que serve para abrir.
    expect(longa).toContain('apps/api/src/sessao/login.service.ts:88')
    expect(longa).not.toContain('/home/')
    // `|` no texto do revisor não abre coluna nova: a linha tem as seis colunas da tabela.
    const colunas = longa.split(/(?<!\\)\|/)
    expect(colunas).toHaveLength(8)
    // E o resumo cabe no limite: sem o corte, esta célula sozinha teria 380+ caracteres.
    expect((colunas[6] ?? '').trim().length).toBeLessThanOrEqual(161)
    expect(ITEM_LONGO.length).toBeGreaterThan(350)

    // Pelo fim da rodada se acha o bloco inteiro no arquivo do documento.
    expect(readFileSync(join(raiz, 'tasks/prd-exemplo/achados/3_task.md'), 'utf8')).toContain('2026-09-13 10:05:00')
    expect(linhas[0]).toContain('2026-09-13 10:05:00')
  })

  it('"nenhuma" é resposta quando vem pontuada, e é conteúdo quando continua a frase', () => {
    // A fronteira decide se o achado existe. `Recomendações: nenhuma` descarta a rodada aprovada;
    // `nenhuma das três guardas cobre a virada` é exigência e precisa sobreviver. Sem a pontuação
    // separando as duas, o segundo caso some sem deixar rastro — era o defeito do `TODO.md`.
    const raiz = repositorio()
    rodada(
      raiz,
      'tasks/prd-exemplo/5_task.md',
      'test-engineer',
      'VEREDITO: APROVADO\n\nBloqueantes: nenhum\n\nRecomendações:\n- nenhuma das três guardas cobre a virada de ano letivo; acrescente a quarta',
      '2026-09-16T10:00:00',
    )
    rodada(raiz, 'tasks/prd-exemplo/6_task.md', 'test-engineer', 'VEREDITO: APROVADO\n\nBloqueantes: nenhum\n\nRecomendações: nenhuma', '2026-09-16T11:00:00')

    // O que exigiu virou bloco e linha de índice.
    expect(readFileSync(join(raiz, 'tasks/prd-exemplo/achados/5_task.md'), 'utf8')).toContain('nenhuma das três guardas cobre a virada')
    // O que não exigiu nada não virou nem arquivo.
    expect(existsSync(join(raiz, 'tasks/prd-exemplo/achados/6_task.md'))).toBe(false)

    const linhas = linhasDoIndice(readFileSync(join(raiz, 'tasks/prd-exemplo/achados/indice.md'), 'utf8'))
    expect(linhas).toHaveLength(1)
    expect(linhas[0]).toContain('acrescente a quarta')
  })

  it('o revisor que resume dentro de uma cerca: a declaração vale, e a cerca não vira resumo', () => {
    // Forma real, em 9 lugares de 5 documentos: o resumo do veredito fica dentro de ``` e a prosa
    // vem depois. Guardar usa só a declaração — quem escreveu "nenhum/nenhuma" não exigiu nada, e a
    // prosa seguinte é justificativa. Já o resumo do índice recua para a prosa, porque a rodada que
    // reprovou vai ser guardada de qualquer jeito e a célula não pode sair vazia nem com ```.
    const raiz = repositorio()
    const cercado = (veredito: string) =>
      `VEREDITO: ${veredito}\n\n\`\`\`\nAuditoria: não se aplica ao diff\nBloqueantes: nenhum\nRecomendações: nenhuma\n\`\`\`\n\n` +
      '## Sobre o `useRef` do segredo TOTP\n\nO ref pertence ao fiber do componente e vai com a tela quando ela desmonta.'

    rodada(raiz, 'tasks/prd-exemplo/7_task.md', 'privacy-guardian', cercado('APROVADO'), '2026-09-17T10:00:00')
    rodada(raiz, 'tasks/prd-exemplo/8_task.md', 'privacy-guardian', cercado('REPROVADO'), '2026-09-17T11:00:00')

    // Aprovada e sem exigência: não guarda, mesmo com prosa depois da cerca.
    expect(existsSync(join(raiz, 'tasks/prd-exemplo/achados/7_task.md'))).toBe(false)
    // Reprovada: guarda, e o resumo é a prosa — nunca a linha da cerca.
    const linhas = linhasDoIndice(readFileSync(join(raiz, 'tasks/prd-exemplo/achados/indice.md'), 'utf8'))
    expect(linhas).toHaveLength(1)
    expect(linhas[0]).toContain('8_task')
    expect(linhas[0]).toContain('pertence ao fiber do componente')
    expect(linhas[0]).not.toMatch(/```/)

    // E a cerca de fechamento logo abaixo do cabeçalho da seção também não vira resumo: é a forma
    // que pôs uma célula com ``` no índice real (`tasks/correcoes/achados/indice.md`).
    rodada(
      raiz,
      'tasks/prd-exemplo/9_task.md',
      'infra-guardian',
      'VEREDITO: REPROVADO\n\n```\nBloqueantes: nenhum\nRecomendações:\n```\n\nA fila de lote não tem limite de concorrência por escola, e uma escola atrasa a outra.',
      '2026-09-17T12:00:00',
    )
    const comCerca = linhasDoIndice(readFileSync(join(raiz, 'tasks/prd-exemplo/achados/indice.md'), 'utf8'))[1] ?? ''
    expect(comCerca).toContain('9_task')
    expect(comCerca).not.toMatch(/```/)
    expect(comCerca).toContain('não tem limite de concorrência por escola')
  })

  it('seção escrita e vazia não é declaração de que nada foi exigido', () => {
    // Forma real: `test-engineer · 2ª rodada · APROVADO · 2026-09-21 17:26:58`, que tem
    // `Recomendações:` como última linha dentro da cerca e R1 a R5 em prosa depois dela. Tratar a
    // seção vazia como "declarou nada" descarta o bloco inteiro — cinco recomendações sumiram assim
    // quando o filtro de cerca entrou sozinho.
    const raiz = repositorio()
    rodada(
      raiz,
      'tasks/prd-exemplo/11_task.md',
      'test-engineer',
      'VEREDITO: APROVADO\n\n```\nBloqueantes: nenhum. Os dois da rodada 1 estão fechados\nRecomendações:\n```\n\n' +
        '**R1 — as três mutações que sobreviveram**, e as três morrem com uma mudança só: afirmar o argv inteiro, não a presença.',
      '2026-09-18T10:00:00',
    )

    // Aprovada, mas a seção existe e o conteúdo está fora dela: guarda, com a prosa no resumo.
    expect(existsSync(join(raiz, 'tasks/prd-exemplo/achados/11_task.md'))).toBe(true)
    expect(readFileSync(join(raiz, 'tasks/prd-exemplo/achados/11_task.md'), 'utf8')).toContain('as três mutações que sobreviveram')
    const linhas = linhasDoIndice(readFileSync(join(raiz, 'tasks/prd-exemplo/achados/indice.md'), 'utf8'))
    expect(linhas).toHaveLength(1)
    expect(linhas[0]).toContain('as três mutações que sobreviveram')
    expect(linhas[0]).not.toMatch(/```/)
  })

  it('o bloqueante vence a recomendação, e o corte recua até a fronteira de palavra', () => {
    // A precedência decide o texto de 63 das 241 células reais do corpus: invertê-la troca o
    // bloqueante por uma recomendação em todas elas, que é o defeito que esta correção fecha.
    const raiz = repositorio()
    const PALAVRA = 'abcdefghij'
    const LONGO = `${PALAVRA} `.repeat(30).trim()
    rodada(
      raiz,
      'tasks/prd-exemplo/12_task.md',
      'infra-guardian',
      `VEREDITO: REPROVADO\n\nBloqueantes:\n- o bloqueante que tem de aparecer\n\nRecomendações:\n- a recomendação que não pode roubar a célula`,
      '2026-09-19T10:00:00',
    )
    rodada(raiz, 'tasks/prd-exemplo/13_task.md', 'infra-guardian', `VEREDITO: REPROVADO\n\nBloqueantes:\n- ${LONGO}`, '2026-09-19T11:00:00')

    const celula = (linha: string) => (linha.split(/(?<!\\)\|/)[6] ?? '').trim()
    const linhas = linhasDoIndice(readFileSync(join(raiz, 'tasks/prd-exemplo/achados/indice.md'), 'utf8'))
    expect(celula(linhas[0] ?? '')).toBe('o bloqueante que tem de aparecer')
    expect(linhas[0]).not.toContain('roubar a célula')

    // O corte não parte palavra: ele recua até o último espaço, e o que sobra é prefixo do original.
    const cortada = celula(linhas[1] ?? '')
    expect(cortada.endsWith('…')).toBe(true)
    const semReticencias = cortada.slice(0, -1)
    expect(LONGO.startsWith(semReticencias)).toBe(true)
    expect(LONGO[semReticencias.length]).toBe(' ')
    expect(semReticencias.endsWith(PALAVRA)).toBe(true)
  })

  it('o índice compartilhado não perde linha com rodadas terminando ao mesmo tempo', async () => {
    // O índice é o único arquivo que dois documentos da mesma pasta escrevem. Não é hipótese: uma
    // tarefa e uma correção em sessões diferentes escrevem em `tasks/correcoes/achados/indice.md`
    // ao mesmo tempo. Sem a trava, a última escrita apaga a anterior (regra 80, item 7).
    const raiz = repositorio()
    const quantos = 6
    const corredor = join(raiz, 'corredor.ts')
    writeFileSync(
      corredor,
      `import { registrar } from ${JSON.stringify(join(import.meta.dirname, 'revisoes.ts'))}\n` +
        'const [, , raiz, revisor, transcript, fim] = process.argv\n' +
        "registrar({ agent_type: revisor, agent_id: 'a', agent_transcript_path: transcript, last_assistant_message: `VEREDITO: REPROVADO\\n\\nBloqueantes:\\n- achado de ${revisor}` }, raiz, new Date(fim))\n",
    )

    const processos = Array.from({ length: quantos }, (_, indice) => {
      const documento = `tasks/prd-exemplo/${String(indice + 1)}_task.md`
      writeFileSync(join(raiz, documento), `# ${documento}\n\n**Subagentes obrigatórios:** \`revisor-geral\`\n`)
      const caminhoTranscript = join(pasta, `paralelo-${String(indice)}-${String(sequencia++)}.jsonl`)
      const fim = `2026-09-13T1${String(indice)}:00:00`
      writeFileSync(caminhoTranscript, JSON.stringify({ type: 'user', timestamp: new Date(fim).toISOString(), message: { content: `Tarefa: ${documento}` } }))
      return new Promise<number>((resolve) => {
        spawn('node', [corredor, raiz, REVISORES_DE_TESTE_PARALELO[indice] ?? 'revisor-geral', caminhoTranscript, fim], { stdio: 'ignore' }).on('exit', (codigo) => {
          resolve(codigo ?? 1)
        })
      })
    })
    expect(await Promise.all(processos)).toEqual(Array.from({ length: quantos }, () => 0))

    // Uma linha por rodada, nenhuma sobrescrita, e cada bloco no arquivo do seu documento.
    const indice = readFileSync(join(raiz, 'tasks/prd-exemplo/achados/indice.md'), 'utf8')
    const linhas = linhasDoIndice(indice)
    expect(linhas).toHaveLength(quantos)
    // Os seis revisores distintos, um por linha: contagem sozinha deixaria passar linha duplicada.
    expect(REVISORES_DE_TESTE_PARALELO.filter((revisor) => linhas.some((linha) => linha.includes(`\`${revisor}\``)))).toEqual(REVISORES_DE_TESTE_PARALELO)
    for (let numero = 1; numero <= quantos; numero++) {
      expect(existsSync(join(raiz, `tasks/prd-exemplo/achados/${String(numero)}_task.md`))).toBe(true)
    }
  })

  it('o índice de uma funcionalidade inteira cabe no que se lê antes de cada tarefa', () => {
    const raiz = repositorio()
    const paragrafo = 'Texto do revisor com detalhe de arquivo e linha. '.repeat(120)
    for (let tarefa = 1; tarefa <= 20; tarefa++) {
      for (let numero = 1; numero <= 5; numero++) {
        // Uma rodada em cada cinco escreve um item longo: sem isso, a asserção da célula abaixo
        // passaria mesmo com `encurtar` desligado, e o teto do índice não estaria provado aqui.
        const exigencia = numero === 3 ? ITEM_LONGO : `exigência ${String(numero)} da tarefa ${String(tarefa)}`
        rodada(
          raiz,
          `tasks/prd-exemplo/${String(tarefa)}_task.md`,
          'revisor-geral',
          `VEREDITO: REPROVADO\n\nBloqueantes:\n- ${exigencia}\n\n${paragrafo}`,
          `2026-09-${String(tarefa).padStart(2, '0')}T1${String(numero)}:00:00`,
        )
      }
    }
    const achados = readdirSync(join(raiz, 'tasks/prd-exemplo/achados'))
      .filter((arquivo) => arquivo !== 'indice.md')
      .map((arquivo) => statSync(join(raiz, 'tasks/prd-exemplo/achados', arquivo)).size)
      .reduce((total, tamanho) => total + tamanho, 0)
    const indice = readFileSync(join(raiz, 'tasks/prd-exemplo/achados/indice.md'), 'utf8')

    // O corpo tem o tamanho do F1; o índice, que é o que se lê antes de cada tarefa, não.
    expect(achados).toBeGreaterThan(600_000)
    expect(indice.length).toBeLessThan(40_000)
    // O total sozinho é frouxo: o que decide o custo é o da rodada. Mas o teto por linha inteira não
    // serve de asserção, porque metade dela é o nome do documento, que é dado e não orçamento: o
    // máximo real vai de 238 bytes por linha (`N_task`) a 305 (slug de correção), e esse número mudou
    // três vezes numa semana. O que o código controla é a célula do resumo, e é ela que tem de caber
    // — sem `encurtar`, uma só passa de 380.
    const celulas = linhasDoIndice(indice).map((linha) => (linha.split(/(?<!\\)\|/)[6] ?? '').trim())
    expect(celulas).toHaveLength(100)
    expect(Math.max(...celulas.map((celula) => celula.length))).toBeLessThanOrEqual(161)
    // E o índice não perde rodada: uma linha para cada uma das 100.
    expect(linhasDoIndice(indice)).toHaveLength(100)
  })
})
