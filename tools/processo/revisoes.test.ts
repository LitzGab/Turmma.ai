import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  acrescentarRevisao,
  avaliarPortao,
  caminhoDaTarefa,
  ehCommit,
  extrairVeredito,
  lerHora,
  lerRevisoes,
  lerTranscript,
  portao,
  registrar,
  revisoresObrigatorios,
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
)

const portaoDe = (conteudo: string, alteradoEm: string | null, mensagem = 'Implementa x (tarefa 9.0)\n\nRevisões: ...') =>
  avaliarPortao({
    obrigatorios: revisoresObrigatorios(conteudo),
    revisoes: lerRevisoes(conteudo),
    ultimaAlteracao: alteradoEm ? { arquivo: 'apps/worker/src/executor.ts', quando: lerHora(alteradoEm) } : null,
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

  it('obrigatórios são só os revisores, não o pesquisador', () => {
    expect(revisoresObrigatorios(TAREFA)).toEqual(['infra-guardian', 'tenancy-guardian', 'frontend-reviewer', 'test-engineer'])
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
    expect(bloqueios.map((bloqueio) => bloqueio.split(':')[0])).toEqual(['infra-guardian', 'tenancy-guardian', 'frontend-reviewer', 'test-engineer'])
  })

  it('bloqueia correção feita enquanto a rodada corria, mesmo que o veredito tenha saído depois', () => {
    // infra começou 10:00 e aprovou 10:05; a alteração é de 10:02.
    const { bloqueios } = portaoDe(tudoAprovadoAs10, '2026-09-13 10:02:00')
    expect(bloqueios.some((bloqueio) => bloqueio.startsWith('infra-guardian:'))).toBe(true)
  })

  it('revisor sem veto com AJUSTES NECESSÁRIOS não bloqueia, se rodou sobre o código atual', () => {
    const { bloqueios } = portaoDe(tudoAprovadoAs10, '2026-09-13 09:59:00')
    expect(bloqueios.some((bloqueio) => bloqueio.startsWith('frontend-reviewer'))).toBe(false)
  })

  it('bloqueia a mensagem sem a linha de revisões e sugere a linha', () => {
    const { bloqueios, linhaResumo } = portaoDe(tudoAprovadoAs10, '2026-09-13 09:59:00', 'Implementa x (tarefa 9.0)')
    expect(bloqueios).toHaveLength(1)
    expect(linhaResumo).toBe(
      'Revisões: infra-guardian APROVADO (1ª rodada), tenancy-guardian APROVADO (1ª rodada), frontend-reviewer AJUSTES NECESSÁRIOS (1ª rodada), test-engineer APROVADO (1ª rodada)',
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

    for (const revisor of ['infra-guardian', 'tenancy-guardian', 'test-engineer']) {
      const veredito = revisor === 'tenancy-guardian' ? 'REPROVADO' : 'APROVADO'
      registrar(
        { agent_type: revisor, agent_id: `a-${revisor}`, agent_transcript_path: transcript(raiz, revisor, '2026-09-13T10:00:00'), last_assistant_message: `VEREDITO: ${veredito}` },
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
    ])
    expect(portao(commit, raiz)).toMatch(/tenancy-guardian: a última rodada/)

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
    expect(motivo).not.toMatch(/tenancy-guardian/)

    for (const revisor of ['infra-guardian', 'test-engineer']) {
      registrar(
        { agent_type: revisor, agent_transcript_path: transcript(raiz, `${revisor}-2`, '2026-09-13T10:12:00'), last_assistant_message: 'VEREDITO: APROVADO' },
        raiz,
        new Date('2026-09-13T10:16:00'),
      )
    }
    expect(portao(commit, raiz)).toBeNull()
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
