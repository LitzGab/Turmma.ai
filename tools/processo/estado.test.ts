import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  avisosDaLista,
  calcularFase,
  escolherTarefa,
  expandirTarefas,
  funcionalidadeDaVez,
  lerDependencias,
  lerEstado,
  lerPorte,
  lerRoadmap,
  lerTarefas,
  lerValidacao,
  PROXIMO_PASSO,
  relatorio,
  resumo,
  specAprovada,
  ultimaRodadaDeCadaRevisor,
  type Artefatos,
} from './estado.ts'

const ROADMAP = `# Roadmap

## F1 — \`identidade-e-tenancy\` [x]

## A0b — \`apresentacao-painel\` [x]

## F2 — \`onboarding-por-convite\` [ ]

## F3 — \`lgpd-e-titular\` [ ]

A ordem antiga punha a ## F9 — \`ambiente-do-aluno\` [x] antes desta.

## F10 — \`modo-sala-2\` [ ]

## Paralelismo
`

const TASKS = `# Tarefas — LGPD e titular

## Lista

- [x] **1.0 — O ciclo de vida mora no nucleo**
  - [x] 1.1 Mover serviço
- [x] **2.0 — A retenção da escola existe**
- [ ] **3.0 — A rotina noturna expurga**
  - [ ] 3.1 Migration própria
- [ ] **4.0 — A coordenação vê a retenção**
- [ ] **5.0 — O aviso de incidente**
- [ ] **6.0 — A carga prova**

## Dependências e paralelismo

| Tarefa | Depende de | Pode correr em paralelo com |
|---|---|---|
| 1.0 | nenhuma | 4.0 |
| 2.0 | 1.0 | 4.0 |
| 3.0 | 2.0 | 4.0 a 5.0 |
| 4.0 | 2.0 | 3.0 |
| 5.0 | 3.0, 4.0 | nenhuma |
| 6.0 | 3.0 a 5.0 | nenhuma |

## Subagentes por tarefa

| Tarefa | Subagentes obrigatórios |
|---|---|
| 9.0 | \`tenancy-guardian\` |
`

const artefatos = (mudanca: Partial<Artefatos> = {}): Artefatos => ({
  marca: 'pendente',
  temPrd: true,
  temTechspec: true,
  specAprovada: true,
  tarefas: [{ numero: 1, titulo: 'a', feita: true }],
  validacao: null,
  temRetro: false,
  branch: 'spec/lgpd-e-titular',
  ...mudanca,
})

describe('lerRoadmap', () => {
  it('lê id, nome e marca, com id de letra no fim e de dois dígitos, e ignora o título citado no meio de uma frase', () => {
    expect(lerRoadmap(ROADMAP.replace('`lgpd-e-titular` [ ]', '`lgpd-e-titular` [~]'))).toEqual([
      { id: 'F1', nome: 'identidade-e-tenancy', marca: 'concluida' },
      { id: 'A0b', nome: 'apresentacao-painel', marca: 'concluida' },
      { id: 'F2', nome: 'onboarding-por-convite', marca: 'pendente' },
      { id: 'F3', nome: 'lgpd-e-titular', marca: 'andamento' },
      { id: 'F10', nome: 'modo-sala-2', marca: 'pendente' },
    ])
  })
})

describe('funcionalidadeDaVez', () => {
  const roadmap = lerRoadmap(ROADMAP)

  it('sem marca de andamento, vale a pendente que já tem PRD, e não a primeira pendente da lista', () => {
    // O caso da F3 em 08/10/2026: quatro tarefas feitas, roadmap sem `[~]`, e a F2 antes dela na lista.
    expect(funcionalidadeDaVez(roadmap, (nome) => nome === 'lgpd-e-titular')?.id).toBe('F3')
  })

  it('a marca de andamento vence o PRD de outra funcionalidade', () => {
    const marcado = lerRoadmap(ROADMAP.replace('`onboarding-por-convite` [ ]', '`onboarding-por-convite` [~]'))
    expect(funcionalidadeDaVez(marcado, (nome) => nome === 'lgpd-e-titular')?.id).toBe('F2')
  })

  it('sem nada começado, é a primeira pendente; sem pendente, nenhuma', () => {
    expect(funcionalidadeDaVez(roadmap, () => false)?.id).toBe('F2')
    expect(funcionalidadeDaVez(roadmap.filter((item) => item.marca === 'concluida'), () => true)).toBeNull()
  })
})

describe('lerTarefas e dependências', () => {
  it('conta só a tarefa principal, com o estado de cada uma', () => {
    const tarefas = lerTarefas(TASKS)
    expect(tarefas.map((tarefa) => tarefa.numero)).toEqual([1, 2, 3, 4, 5, 6])
    expect(tarefas.filter((tarefa) => tarefa.feita).map((tarefa) => tarefa.numero)).toEqual([1, 2])
    expect(tarefas[2]?.titulo).toBe('A rotina noturna expurga')
  })

  it('expande faixa e lista, e célula sem número não depende de nada', () => {
    expect(expandirTarefas('3.0, 7.0 a 9.0')).toEqual([3, 7, 8, 9])
    expect(expandirTarefas('nenhuma')).toEqual([])
    expect(expandirTarefas('—')).toEqual([])
  })

  it('lê a coluna "Depende de", e não a de paralelismo nem a tabela da seção seguinte', () => {
    const dependencias = lerDependencias(TASKS)
    expect(dependencias.get(3)).toEqual([2])
    expect(dependencias.get(5)).toEqual([3, 4])
    expect(dependencias.get(6)).toEqual([3, 4, 5])
    expect(dependencias.has(9)).toBe(false)
  })
})

describe('escolherTarefa', () => {
  it('escolhe a primeira pendente liberada e diz o que falta nas outras', () => {
    const escolha = escolherTarefa(lerTarefas(TASKS), lerDependencias(TASKS))
    expect(escolha.proxima?.numero).toBe(3)
    expect(escolha.bloqueadas.map(({ tarefa, falta }) => [tarefa.numero, falta])).toEqual([
      [5, [3, 4]],
      [6, [3, 4, 5]],
    ])
  })

  it('pula a pendente que espera outra e pega a seguinte que está liberada', () => {
    // Com a 2.0 por fazer, a 3.0 e a 4.0 esperam; nada depois delas pode furar a fila.
    const semA2 = TASKS.replace('- [x] **2.0', '- [ ] **2.0')
    expect(escolherTarefa(lerTarefas(semA2), lerDependencias(semA2)).proxima?.numero).toBe(2)
    const tresFeita = TASKS.replace('- [ ] **3.0', '- [x] **3.0')
    expect(escolherTarefa(lerTarefas(tresFeita), lerDependencias(tresFeita)).proxima?.numero).toBe(4)
  })

  it('com toda pendente esperando, não há próxima', () => {
    const dependencias = new Map([[1, [2]], [2, [1]]])
    const tarefas = [
      { numero: 1, titulo: 'a', feita: false },
      { numero: 2, titulo: 'b', feita: false },
    ]
    expect(escolherTarefa(tarefas, dependencias).proxima).toBeNull()
  })
})

describe('lerPorte', () => {
  const cabecalho = (linhas: string) => `# Tarefa 5.0 — Exemplo\n\n${linhas}\n`

  it('o porte declarado vence a contagem de guardiões', () => {
    const declarada = cabecalho('**Porte:** pequeno\n**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`')
    expect(lerPorte(declarada)).toEqual({ porte: 'pequeno', inferido: false })
    expect(lerPorte(cabecalho('**Porte:** `grande`\n**Subagentes obrigatórios:** `frontend-reviewer`'))).toEqual({ porte: 'grande', inferido: false })
  })

  it('sem a linha, três guardiões com veto fazem a tarefa grande; os que toda tarefa tem não contam', () => {
    expect(lerPorte(cabecalho('**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`'))).toEqual({ porte: 'grande', inferido: true })
    // test-engineer e revisor-geral entram em toda tarefa; frontend-reviewer e llm-integrator não têm veto.
    const semVeto = '**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `frontend-reviewer`, `llm-integrator`, `test-engineer`'
    expect(lerPorte(cabecalho(semVeto))).toEqual({ porte: 'pequeno', inferido: true })
  })
})

describe('lerValidacao e specAprovada', () => {
  it('vale o primeiro veredito do arquivo, que é a rodada mais recente', () => {
    const duasRodadas = '# Validação\n\n**Veredito: APROVADA**\n\ntexto\n\n**Veredito: REPROVADA**\n'
    expect(lerValidacao(duasRodadas)).toEqual({ veredito: 'APROVADA', ressalvasAceitas: false })
  })

  it('distingue a ressalva aceita da que ainda espera o Joaquim', () => {
    expect(lerValidacao('**Veredito: APROVADA COM RESSALVAS**\n')).toEqual({ veredito: 'APROVADA COM RESSALVAS', ressalvasAceitas: false })
    const aceita = '**Veredito: APROVADA COM RESSALVAS** — as quatro ressalvas maiores foram **aceitas por Joaquim em 20/09**\n'
    expect(lerValidacao(aceita)).toEqual({ veredito: 'APROVADA COM RESSALVAS', ressalvasAceitas: true })
    expect(lerValidacao('O veredito não é APROVADA por um achado maior.\n')).toBeNull()
    expect(lerValidacao('Rodada 2: **Veredito: APROVADA**\n')).toBeNull()
  })

  it('a palavra "aceita" sem quem aceitou, negada, ou fora da linha do veredito não é aceite', () => {
    const naoAceita = (linha: string) => lerValidacao(linha)?.ressalvasAceitas
    expect(naoAceita('**Veredito: APROVADA COM RESSALVAS** — as ressalvas ainda não foram aceitas\n')).toBe(false)
    expect(naoAceita('**Veredito: APROVADA COM RESSALVAS** — aceitar ou corrigir fica com o Joaquim\n')).toBe(false)
    expect(naoAceita('**Veredito: APROVADA COM RESSALVAS** — não foram aceitas por Joaquim\n')).toBe(false)
    expect(naoAceita('**Veredito: APROVADA COM RESSALVAS**\n\nNa rodada anterior as ressalvas foram aceitas por Joaquim.\n')).toBe(false)
    expect(naoAceita('**Veredito: APROVADA COM RESSALVAS** — Aceitas por Gabriel em 02/10\n')).toBe(true)
  })

  it('a spec está aprovada com uma rodada APROVADA, e não com REPROVADA nem com a palavra solta', () => {
    expect(specAprovada('## Rodada 1\n\n**Veredito: REPROVADA**\n\n## Rodada 2\n\n**Veredito: APROVADA**\n')).toBe(true)
    expect(specAprovada('**Veredito: REPROVADA** — três aprovações; falta a lista\n')).toBe(false)
    expect(specAprovada('**Veredito: APROVADA COM RESSALVAS**\n')).toBe(false)
    expect(specAprovada('A rodada 2 fechou APROVADA.\n')).toBe(false)
    expect(specAprovada('| a | **Veredito: APROVADA** |\n')).toBe(false)
  })
})

describe('calcularFase', () => {
  it('segue a ordem dos artefatos, do PRD à construção', () => {
    expect(calcularFase(artefatos({ temPrd: false, temTechspec: false, tarefas: null }))).toBe('sem-prd')
    expect(calcularFase(artefatos({ temTechspec: false, tarefas: null }))).toBe('sem-techspec')
    expect(calcularFase(artefatos({ specAprovada: false, tarefas: null }))).toBe('sem-revisao-da-spec')
    expect(calcularFase(artefatos({ tarefas: null }))).toBe('sem-tarefas')
    expect(calcularFase(artefatos({ tarefas: [{ numero: 1, titulo: 'a', feita: false }] }))).toBe('construindo')
  })

  it('com todas as tarefas feitas, o veredito da validação decide', () => {
    expect(calcularFase(artefatos())).toBe('sem-validacao')
    expect(calcularFase(artefatos({ validacao: { veredito: 'REPROVADA', ressalvasAceitas: false } }))).toBe('validacao-reprovada')
    expect(calcularFase(artefatos({ validacao: { veredito: 'APROVADA COM RESSALVAS', ressalvasAceitas: false } }))).toBe('validacao-com-ressalvas')
    expect(calcularFase(artefatos({ validacao: { veredito: 'APROVADA COM RESSALVAS', ressalvasAceitas: true } }))).toBe('validada')
    expect(calcularFase(artefatos({ validacao: { veredito: 'APROVADA', ressalvasAceitas: false } }))).toBe('validada')
  })

  it('validação aprovada não fecha funcionalidade com tarefa pendente', () => {
    const pendente = artefatos({ tarefas: [{ numero: 1, titulo: 'a', feita: false }], validacao: { veredito: 'APROVADA', ressalvasAceitas: false } })
    expect(calcularFase(pendente)).toBe('construindo')
  })

  it('fechada no roadmap: na branch da spec espera o pouso; fora dela, a retro e depois nada', () => {
    expect(calcularFase(artefatos({ marca: 'concluida', branch: 'spec/lgpd-e-titular' }))).toBe('aguardando-pouso')
    expect(calcularFase(artefatos({ marca: 'concluida', branch: 'develop' }))).toBe('sem-retro')
    expect(calcularFase(artefatos({ marca: 'concluida', branch: 'develop', temRetro: true }))).toBe('concluida')
  })
})

describe('ultimaRodadaDeCadaRevisor', () => {
  it('fica com a rodada mais recente de cada revisor', () => {
    const rodada = (revisor: string, numero: number, veredito: string) => ({ inicio: '', fim: '', revisor, rodada: numero, veredito, agente: '' })
    const ultimas = ultimaRodadaDeCadaRevisor([rodada('test-engineer', 1, 'REPROVADO'), rodada('revisor-geral', 1, 'APROVADO'), rodada('test-engineer', 2, 'APROVADO')])
    expect(ultimas.map(({ revisor, rodada: numero, veredito }) => [revisor, numero, veredito])).toEqual([
      ['test-engineer', 2, 'APROVADO'],
      ['revisor-geral', 1, 'APROVADO'],
    ])
  })
})

describe('lerEstado, do disco', () => {
  function repositorio(arquivos: Record<string, string>): string {
    const raiz = mkdtempSync(join(tmpdir(), 'estado-'))
    for (const [caminho, conteudo] of Object.entries(arquivos)) {
      mkdirSync(dirname(join(raiz, caminho)), { recursive: true })
      writeFileSync(join(raiz, caminho), conteudo)
    }
    execFileSync('git', ['init', '-q', '-b', 'spec/lgpd-e-titular'], { cwd: raiz })
    return raiz
  }

  const TAREFA_3 = `# Tarefa 3.0 — A rotina noturna expurga

**Subagentes obrigatórios:** \`tenancy-guardian\`, \`privacy-guardian\`, \`infra-guardian\`

## Revisões

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-06 14:02:30 | 2026-10-06 14:06:39 | \`test-engineer\` | 1 | REPROVADO | a1 |
`

  it('junta fase, contagem, tarefa da vez com porte e rodadas, e o que está alterado na árvore', () => {
    const raiz = repositorio({
      'ROADMAP.md': ROADMAP,
      'tasks/prd-lgpd-e-titular/prd.md': '# PRD',
      'tasks/prd-lgpd-e-titular/techspec.md': '# Tech Spec',
      'tasks/prd-lgpd-e-titular/tasks.md': TASKS,
      'tasks/prd-lgpd-e-titular/3_task.md': TAREFA_3,
      'apps/api/src/exemplo.ts': 'export const exemplo = 1\n',
    })
    const estado = lerEstado(raiz)
    expect(estado.funcionalidade?.id).toBe('F3')
    expect(estado.fase).toBe('construindo')
    expect([estado.feitas, estado.total]).toEqual([2, 6])
    expect(estado.tarefa).toMatchObject({ numero: 3, porte: 'grande', inferido: true, documento: 'tasks/prd-lgpd-e-titular/3_task.md' })
    expect(estado.tarefa?.obrigatorios).toContain('revisor-geral')
    expect(estado.tarefa?.rodadas.map((rodada) => `${rodada.revisor} ${rodada.veredito}`)).toEqual(['test-engineer REPROVADO'])
    expect(estado.bloqueadas).toEqual([
      { numero: 5, falta: [3, 4] },
      { numero: 6, falta: [3, 4, 5] },
    ])
    // Só o arquivo de `apps/`: ROADMAP.md e a pasta tasks/ não são código.
    expect(estado.alteradosNaArvore).toBe(1)
    expect(estado.branch).toBe('spec/lgpd-e-titular')
  })

  it('aceita o nome ou o id, e diz quando a funcionalidade não está no roadmap', () => {
    const raiz = repositorio({ 'ROADMAP.md': ROADMAP })
    expect(lerEstado(raiz, 'f2').fase).toBe('sem-prd')
    expect(lerEstado(raiz, 'onboarding-por-convite').funcionalidade?.id).toBe('F2')
    const fora = lerEstado(raiz, 'nao-existe')
    expect(fora.fase).toBeNull()
    expect(fora.proximoPasso).toContain('nao-existe')
  })

  it('o resumo da sessão aponta a funcionalidade da vez e conta as decisões em aberto', () => {
    const raiz = repositorio({
      'ROADMAP.md': ROADMAP,
      'tasks/prd-lgpd-e-titular/prd.md': '# PRD',
      'CLAUDE.md': '# Turmma\n\n## Decisões em aberto\n\n| Decisão | Dono | Quando fecha |\n|---|---|---|\n| Provedor | Joaquim | F5 |\n| Avatares | Gabriel | a definir |\n\n## Stack\n\n| Outra | tabela |\n',
    })
    const linhas = resumo(raiz).split('\n')
    expect(linhas).toContain('Concluídas: F1 A0b')
    expect(linhas).toContain('Da vez: F3 lgpd-e-titular — sem-techspec')
    expect(linhas.find((linha) => linha.startsWith('Próximo passo:'))).toContain('/seguir lgpd-e-titular')
    expect(linhas).toContain('Decisões em aberto no CLAUDE.md: 2')
  })
})

describe('bordas que a auditoria de 08/10/2026 achou sem prova', () => {
  it('a tarefa com texto depois do título continua sendo tarefa, e o título vai só até o primeiro negrito', () => {
    const tarefas = lerTarefas('- [x] **1.0 — um**\n- [ ] **2.0 — dois** (revista) e **mais**\n  - [ ] **9.0 — citada numa subtarefa**\n- [ ] **3.1 — subtarefa em negrito**\n')
    expect(tarefas).toEqual([
      { numero: 1, titulo: 'um', feita: true },
      { numero: 2, titulo: 'dois', feita: false },
    ])
  })

  it('tasks.md sem nenhuma tarefa legível é lista por gerar, nunca funcionalidade pronta para validar', () => {
    expect(calcularFase(artefatos({ tarefas: [] }))).toBe('sem-tarefas')
    expect(calcularFase(artefatos({ tarefas: [], specAprovada: false }))).toBe('sem-revisao-da-spec')
  })

  it('a branch da spec é reconhecida pelo prefixo inteiro, no começo do nome', () => {
    expect(calcularFase(artefatos({ marca: 'concluida', branch: 'staging' }))).toBe('sem-retro')
    expect(calcularFase(artefatos({ marca: 'concluida', branch: 'correcao/spec/x' }))).toBe('sem-retro')
  })

  it('a faixa aceita "até", travessão e hífen, em qualquer ordem, sem repetir e sem ler subtarefa', () => {
    expect(expandirTarefas('3.0 até 5.0')).toEqual([3, 4, 5])
    expect(expandirTarefas('3.0–5.0')).toEqual([3, 4, 5])
    expect(expandirTarefas('3.0 - 5.0')).toEqual([3, 4, 5])
    expect(expandirTarefas('9.0 a 7.0')).toEqual([7, 8, 9])
    expect(expandirTarefas('3.0, 3.0 a 4.0')).toEqual([3, 4])
    expect(expandirTarefas('a subtarefa 3.1 e a 12.05')).toEqual([])
  })

  it('só a seção de dependências conta: tabela anterior com o mesmo formato não entra', () => {
    // A 8.0 só aparece na tabela de antes: se ela entrasse, apareceria aqui, porque a seção não a sobrescreve.
    const comTabelaAntes = TASKS.replace('## Lista', '| Tarefa | Nota |\n|---|---|\n| 8.0 | 7.0 |\n\n## Lista')
    expect(lerDependencias(comTabelaAntes).has(8)).toBe(false)
    expect(lerDependencias(comTabelaAntes).get(1)).toEqual([])
    expect(lerDependencias('# Tarefas\n\n- [ ] **1.0 — a**\n').size).toBe(0)
  })

  it('duas marcadas em andamento, ou duas pendentes com PRD: vale a primeira do roadmap', () => {
    const duas = lerRoadmap(ROADMAP.replace('`onboarding-por-convite` [ ]', '`onboarding-por-convite` [~]').replace('`lgpd-e-titular` [ ]', '`lgpd-e-titular` [~]'))
    expect(funcionalidadeDaVez(duas, () => false)?.id).toBe('F2')
    expect(funcionalidadeDaVez(lerRoadmap(ROADMAP), (nome) => nome === 'lgpd-e-titular' || nome === 'modo-sala-2')?.id).toBe('F3')
  })

  it('a concluída que espera a retrospectiva vem antes de abrir a próxima, e depois da que está em andamento', () => {
    const roadmap = lerRoadmap(ROADMAP)
    const esperaRetro = (nome: string) => nome === 'apresentacao-painel'
    expect(funcionalidadeDaVez(roadmap, (nome) => nome === 'lgpd-e-titular', esperaRetro)?.id).toBe('A0b')
    expect(funcionalidadeDaVez(roadmap, (nome) => nome === 'lgpd-e-titular')?.id).toBe('F3')
    const emAndamento = lerRoadmap(ROADMAP.replace('`lgpd-e-titular` [ ]', '`lgpd-e-titular` [~]'))
    expect(funcionalidadeDaVez(emAndamento, () => false, esperaRetro)?.id).toBe('F3')
    // Pendente com estado.md e sem retro não é "concluída esperando retro".
    expect(funcionalidadeDaVez(roadmap, () => false, (nome) => nome === 'modo-sala-2')?.id).toBe('F2')
  })

  it('o porte só é declarado pela linha "**Porte:**": a palavra na prosa não declara nada', () => {
    const prosa = '# Tarefa 5.0\n\nEsta tarefa é grande demais para um dia.\n**Subagentes obrigatórios:** `frontend-reviewer`\n'
    expect(lerPorte(prosa)).toEqual({ porte: 'pequeno', inferido: true })
    expect(lerPorte('**Porte:** grandeza\n**Subagentes obrigatórios:** `frontend-reviewer`\n')).toEqual({ porte: 'pequeno', inferido: true })
    // O modelo deixado sem preencher não declara porte: três guardiões continuam fazendo a tarefa grande.
    const literal = '**Porte:** pequeno | grande\n**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`\n'
    expect(lerPorte(literal)).toEqual({ porte: 'grande', inferido: true })
  })

  it('avisa a dependência que não existe, o roadmap fechado com pendente e o documento que falta', () => {
    const tarefas = [
      { numero: 1, titulo: 'a', feita: true },
      { numero: 2, titulo: 'b', feita: false },
    ]
    const base = { marca: 'pendente' as const, tarefas, dependencias: new Map([[2, [1, 9]]]), proxima: null, temDocumento: false }
    expect(avisosDaLista(base)).toEqual(['a 2.0 depende de 9.0, que não está na lista: ela nunca será liberada'])
    expect(avisosDaLista({ ...base, dependencias: new Map([[2, [1]]]) })).toEqual([])
    expect(avisosDaLista({ ...base, marca: 'concluida', dependencias: new Map() })).toEqual(['a funcionalidade está fechada no ROADMAP.md, mas o tasks.md tem tarefa pendente'])
    const liberada = { ...base, dependencias: new Map<number, number[]>(), proxima: tarefas[1] ?? null }
    expect(avisosDaLista(liberada)).toEqual(['a 2.0 está liberada, mas o documento 2_task.md não existe'])
    expect(avisosDaLista({ ...liberada, temDocumento: true })).toEqual([])
  })
})

describe('lerEstado e os textos, do disco', () => {
  function repositorio(arquivos: Record<string, string>, branch = 'spec/lgpd-e-titular'): string {
    const raiz = mkdtempSync(join(tmpdir(), 'estado-'))
    for (const [caminho, conteudo] of Object.entries(arquivos)) {
      mkdirSync(dirname(join(raiz, caminho)), { recursive: true })
      writeFileSync(join(raiz, caminho), conteudo)
    }
    execFileSync('git', ['init', '-q', '-b', branch], { cwd: raiz })
    return raiz
  }
  const FEITAS = '- [x] **1.0 — um**\n- [x] **2.0 — dois**\n'
  const pasta = (arquivos: Record<string, string>) =>
    Object.fromEntries(Object.entries({ 'prd.md': '# PRD', 'techspec.md': '# TS', ...arquivos }).map(([nome, conteudo]) => [`tasks/prd-lgpd-e-titular/${nome}`, conteudo]))

  it('lê do disco a validação, a revisão da spec, a retro e a marca do roadmap', () => {
    const reprovada = repositorio({ 'ROADMAP.md': ROADMAP, ...pasta({ 'tasks.md': FEITAS, 'validacao.md': '**Veredito: REPROVADA**\n' }) })
    expect(lerEstado(reprovada).fase).toBe('validacao-reprovada')
    expect(lerEstado(reprovada).proximoPasso).toBe(PROXIMO_PASSO['validacao-reprovada'])

    const semTarefas = repositorio({ 'ROADMAP.md': ROADMAP, ...pasta({ 'revisao-spec.md': '**Veredito: APROVADA**\n' }) })
    expect(lerEstado(semTarefas).fase).toBe('sem-tarefas')
    expect(lerEstado(repositorio({ 'ROADMAP.md': ROADMAP, ...pasta({}) })).fase).toBe('sem-revisao-da-spec')

    const fechado = ROADMAP.replace('`lgpd-e-titular` [ ]', '`lgpd-e-titular` [x]')
    // Sem nome: a spec do processo novo (tem estado.md) pousada e sem retro é a da vez, antes da F2; com retro, já não é.
    const pousada = repositorio({ 'ROADMAP.md': fechado, ...pasta({ 'tasks.md': FEITAS, 'estado.md': '# Estado' }) }, 'develop')
    expect([lerEstado(pousada).funcionalidade?.id, lerEstado(pousada).fase]).toEqual(['F3', 'sem-retro'])
    const comRetro = repositorio({ 'ROADMAP.md': fechado, ...pasta({ 'tasks.md': FEITAS, 'estado.md': '# Estado', 'retro.md': '# Retro' }) }, 'develop')
    expect(lerEstado(comRetro).funcionalidade?.id).toBe('F2')
    expect(lerEstado(repositorio({ 'ROADMAP.md': fechado, ...pasta({ 'tasks.md': FEITAS, 'retro.md': '# Retro' }) }, 'develop'), 'F3').fase).toBe('concluida')
    expect(lerEstado(repositorio({ 'ROADMAP.md': fechado, ...pasta({ 'tasks.md': FEITAS }) }, 'develop'), 'F3').fase).toBe('sem-retro')
    expect(lerEstado(repositorio({ 'ROADMAP.md': fechado, ...pasta({ 'tasks.md': FEITAS }) }), 'F3').fase).toBe('aguardando-pouso')
  })

  it('só código conta como alterado: .processo/, tasks/ e documento ficam de fora, e o runbook entra', () => {
    const so = (arquivos: Record<string, string>) => lerEstado(repositorio({ 'ROADMAP.md': ROADMAP, ...arquivos })).alteradosNaArvore
    expect(so({ 'apps/a.ts': 'a' })).toBe(1)
    expect(so({ 'apps/a.ts': 'a', '.processo/portao.json': '{}', '.processo/ordens/5_task-r1.md': '# ordem' })).toBe(1)
    expect(so({ 'apps/a.ts': 'a', 'tasks/prd-lgpd-e-titular/estado.md': '# Estado', 'docs/lgpd.md': '# LGPD' })).toBe(1)
    expect(so({ 'apps/a.ts': 'a', 'docs/runbook.md': '# Runbook' })).toBe(2)
    expect(so({})).toBe(0)
  })

  it('tarefa liberada sem documento vira aviso, e não "nenhuma tarefa liberada"', () => {
    const raiz = repositorio({ 'ROADMAP.md': ROADMAP, ...pasta({ 'tasks.md': '- [x] **1.0 — um**\n- [ ] **2.0 — dois**\n' }) })
    const estado = lerEstado(raiz)
    expect(estado.fase).toBe('construindo')
    expect(estado.tarefa).toBeNull()
    expect(estado.avisos).toEqual(['a 2.0 está liberada, mas o documento 2_task.md não existe'])
    expect(relatorio(estado)).toContain('ATENÇÃO: a 2.0 está liberada')
    expect(relatorio(estado)).not.toContain('Nenhuma tarefa liberada')
  })

  it('a tarefa da vez só existe na construção: fechada no roadmap com pendente, só o aviso', () => {
    const fechado = ROADMAP.replace('`lgpd-e-titular` [ ]', '`lgpd-e-titular` [x]')
    const estado = lerEstado(repositorio({ 'ROADMAP.md': fechado, ...pasta({ 'tasks.md': '- [ ] **1.0 — um**\n', '1_task.md': '# Tarefa 1.0\n' }) }), 'F3')
    expect(estado.tarefa).toBeNull()
    expect(estado.avisos).toEqual(['a funcionalidade está fechada no ROADMAP.md, mas o tasks.md tem tarefa pendente'])
  })

  it('o relatório traz a tarefa, o porte, os revisores exatos, as rodadas e o próximo passo', () => {
    const tarefa = '# Tarefa 3.0\n\n**Porte:** pequeno\n**Subagentes obrigatórios:** `privacy-guardian`\n\n## Revisões\n\n| Início | Fim | Revisor | Rodada | Veredito | Agente |\n|---|---|---|---|---|---|\n| 2026-10-06 14:02:30 | 2026-10-06 14:06:39 | `test-engineer` | 1 | REPROVADO | a1 |\n'
    const estado = lerEstado(repositorio({ 'ROADMAP.md': ROADMAP, ...pasta({ 'tasks.md': TASKS, '3_task.md': tarefa }) }))
    expect(estado.tarefa?.obrigatorios).toEqual(['privacy-guardian', 'test-engineer', 'revisor-geral'])
    const linhas = relatorio(estado).split('\n')
    expect(linhas).toContain('Funcionalidade: F3 lgpd-e-titular')
    expect(linhas).toContain('Fase: construindo (2 de 6 tarefas)')
    expect(linhas).toContain('Próxima tarefa: 3.0 — A rotina noturna expurga')
    expect(linhas).toContain('  porte: pequeno')
    expect(linhas).toContain('  revisores: privacy-guardian, test-engineer, revisor-geral')
    expect(linhas).toContain('  rodadas já registradas: test-engineer REPROVADO (1ª)')
    expect(linhas).toContain(`Próximo passo: ${PROXIMO_PASSO.construindo}`)
  })

  it('sem tarefa liberada, o relatório diz o que cada uma espera', () => {
    const presas = '- [ ] **1.0 — um**\n- [ ] **2.0 — dois**\n\n## Dependências e paralelismo\n\n| Tarefa | Depende de | Paralelo |\n|---|---|---|\n| 1.0 | 2.0 | — |\n| 2.0 | 1.0 | — |\n'
    const estado = lerEstado(repositorio({ 'ROADMAP.md': ROADMAP, ...pasta({ 'tasks.md': presas }) }))
    expect(relatorio(estado)).toContain('Nenhuma tarefa liberada: 1.0 espera 2.0; 2.0 espera 1.0')
  })

  it('o resumo em construção traz a contagem e a próxima, e sem CLAUDE.md não inventa a linha de decisões', () => {
    const raiz = repositorio({ 'ROADMAP.md': ROADMAP, ...pasta({ 'tasks.md': TASKS, '3_task.md': '# Tarefa 3.0\n' }) })
    const linhas = resumo(raiz).split('\n')
    expect(linhas).toContain('Da vez: F3 lgpd-e-titular — construindo, 2 de 6 tarefas; próxima: 3.0')
    expect(linhas.some((linha) => linha.startsWith('Decisões em aberto'))).toBe(false)
    const nada = repositorio({ 'ROADMAP.md': '# Roadmap\n\n## F2 — `onboarding-por-convite` [ ]\n' })
    expect(resumo(nada).split('\n')).toContain('Concluídas: nenhuma')
  })
})
