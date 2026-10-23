// Portão local da tarefa, com carimbo. Roda typecheck, lint e testes e, se tudo passar, grava em
// .processo/portao.json quando começou e o que rodou. O portão do commit (revisoes.ts) exige o
// carimbo mais novo que a última alteração, e o revisor-geral confere o carimbo em vez de rodar tudo
// de novo sobre a mesma árvore.
//
//   node tools/processo/portao-local.ts --tarefa [documento.md] [testes...]
//                                                               o portão da tarefa: tipos, lint, unidade, os testes alterados
//                                                               (o caso de e2e alterado que passa de metade do prazo dele, 15 s sem prazo próprio, fica vermelho: tools/ci/duracao-do-e2e.ts)
//                                                               e as mutações do documento (tools/processo/mutacoes.ts)
//   node tools/processo/portao-local.ts --e2e --infra           o portão completo, na máquina: o que a esteira roda a cada push
//   node tools/processo/portao-local.ts conferir <documento>     diz se o carimbo vale para o código atual
//   node tools/processo/portao-local.ts conferir --completo      diz se o portão completo vale para o código atual
//   node tools/processo/portao-local.ts revisores <documento>    diz o que o commit ainda encontraria: quem falta, reprovou ou caducou
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { ARGUMENTOS_COMPOSE, servicosDeJob } from '../ci/compose.ts'
import { arquivoDoRelatorioDoE2e, motivoDaDuracaoDoE2e, VARIAVEL_DO_RELATORIO_DO_E2E } from '../ci/duracao-do-e2e.ts'
import { e2eDosLiteraisRemovidos } from '../ci/e2e-que-cita-literal.ts'
import { garantirFilaDeCarga } from '../ci/fila-de-carga.ts'
import { avaliarMutacoes, conferirMutacoesDoDocumento, lerMutacoes, rodarCalado, type CarimboDasMutacoes } from './mutacoes.ts'
import {
  alteracoesDeCodigo,
  alvosDoPortao,
  arquivosAlterados,
  avaliarCarimbo,
  avaliarPortao,
  CHAVE_DO_PORTAO,
  carimbarSeNadaMudou,
  lerCarimbo,
  lerInstantaneos,
  lerRevisoes,
  revisoresObrigatorios,
  SUITES_DO_PORTAO_COMPLETO,
  suitesExigidas,
  tipoDoDocumento,
} from './revisoes.ts'
import { mutacaoDeIntegracao, sequenciaDoPortao, suitesDoPortao, type PassoDoPortao } from './sequencia-do-portao.ts'

const raiz = process.env['CLAUDE_PROJECT_DIR'] ?? process.cwd()
const argumentos = process.argv.slice(2)

function rodar(comando: string, ambiente: NodeJS.ProcessEnv = process.env): boolean {
  process.stdout.write(`\n▶ ${comando}\n`)
  return spawnSync(comando, { cwd: raiz, shell: '/bin/sh', stdio: 'inherit', env: ambiente }).status === 0
}

if (argumentos[0] === 'conferir') {
  const documento = argumentos[1]
  if (!documento) {
    process.stderr.write('uso: node tools/processo/portao-local.ts conferir <tasks/.../documento.md> | --completo\n')
    process.exit(2)
  }
  // `--completo` é a pergunta do fim da spec: o portão inteiro (e2e e infra junto) rodou sobre este código?
  const exigidas = documento === '--completo' ? SUITES_DO_PORTAO_COMPLETO : suitesExigidas()
  const motivo =
    avaliarCarimbo(lerCarimbo(raiz), exigidas, alteracoesDeCodigo(raiz, arquivosAlterados(raiz)), lerInstantaneos(raiz)[CHAVE_DO_PORTAO]) ??
    (documento === '--completo' ? null : avaliarMutacoes(lerCarimbo(raiz), documento, readFileSync(join(raiz, documento), 'utf8')))
  process.stdout.write(motivo ? `${motivo}\n` : `portão local válido para o código atual (${lerCarimbo(raiz)?.suites.join(', ')})\n`)
  process.exit(motivo ? 1 : 0)
}

if (argumentos[0] === 'revisores') {
  const documento = argumentos[1]
  if (!documento) {
    process.stderr.write('uso: node tools/processo/portao-local.ts revisores <tasks/.../documento.md>\n')
    process.exit(2)
  }
  // A mesma conta do hook do commit, sem o commit: é o que a Mesa de revisão lê para saber quem chamar, em vez de
  // descobrir pela tentativa. A mensagem leva a linha `Revisões:` só para o portão não cobrá-la aqui.
  const conteudo = readFileSync(join(raiz, documento), 'utf8')
  const { bloqueios, linhaResumo } = avaliarPortao({
    obrigatorios: revisoresObrigatorios(conteudo, tipoDoDocumento(documento)),
    revisoes: lerRevisoes(conteudo),
    alteracoes: alteracoesDeCodigo(raiz, arquivosAlterados(raiz)),
    carimbo: lerCarimbo(raiz),
    mensagemCommit: 'Revisões: conferência',
    documento,
    instantaneos: lerInstantaneos(raiz),
  })
  const mutacoes = avaliarMutacoes(lerCarimbo(raiz), documento, conteudo)
  if (mutacoes !== null) bloqueios.push(mutacoes)
  process.stdout.write(bloqueios.length > 0 ? `${bloqueios.map((bloqueio) => `- ${bloqueio}`).join('\n')}\n` : `nada pendente: ${linhaResumo}\n`)
  process.exit(bloqueios.length > 0 ? 1 : 0)
}

// Daqui em diante o portão roda suíte, e a máquina é uma só: sem o lugar na fila ele espera a vez, em vez de depender de
// quem digita `flock` (`tools/ci/fila-de-carga.ts`). `conferir` e `revisores`, acima, só leem e não entram na fila.
await garantirFilaDeCarga()

const inicio = new Date().toISOString()
// O conteúdo de agora é o que as suítes vão rodar, e é ele que vai para o instantâneo. Ler no fim faria arquivo
// editado no meio da corrida entrar como se tivesse sido testado, e o commit passaria por código que nenhuma suíte
// viu (correção `2026-09-22-hook-do-commit-ignora-o-instantaneo-de-conteudo`).
const noInicio = alteracoesDeCodigo(raiz, arquivosAlterados(raiz))
const daTarefa = argumentos.includes('--tarefa')
// No portão da tarefa, os alvos são os testes alterados na árvore, mais os que vierem na linha de comando (o teste de
// outro módulo que a tarefa pode ter quebrado, quando quem implementa ou quem revisa sabe qual é).
const extras = argumentos.filter((argumento) => !argumento.startsWith('--') && !argumento.endsWith('.md') && existsSync(join(raiz, argumento)))
/**
 * O documento cujas mutações o portão confere: o que veio na linha de comando ou, sem ele, o único documento de tarefa
 * ou de correção alterado na árvore que traz bloco `mutacao`. Com dois, quem roda diz qual.
 */
function documentoDasMutacoes(): string | null {
  const pedido = argumentos.find((argumento) => argumento.endsWith('.md') && existsSync(join(raiz, argumento)))
  if (pedido) return pedido
  const candidatos = arquivosAlterados(raiz)
    .filter((arquivo) => /^tasks\/(prd-[^/]+\/\d+_task|correcoes\/[^/]+)\.md$/.test(arquivo) && existsSync(join(raiz, arquivo)))
    .filter((arquivo) => readFileSync(join(raiz, arquivo), 'utf8').includes('```mutacao'))
  return candidatos.length === 1 ? (candidatos[0] ?? null) : null
}
// Os e2e que citam um texto que o diff tirou de `apps/web/src` também rodam: o texto é o único elo entre a tela e o spec, e o
// spec que não foi alterado quebrava na esteira (`tools/ci/e2e-que-cita-literal.ts`). Só no portão da tarefa: o completo roda todos.
const citados = daTarefa ? e2eDosLiteraisRemovidos(raiz) : []
for (const citado of citados) process.stdout.write(`▶ ${citado.arquivo} entra nos alvos: cita ${citado.literais.map((literal) => `"${literal}"`).join(', ')}, que o diff tirou de apps/web/src\n`)
const alvos = alvosDoPortao([...arquivosAlterados(raiz), ...extras, ...citados.map((citado) => citado.arquivo)])
const suites = suitesDoPortao({ daTarefa, e2e: argumentos.includes('--e2e'), infra: argumentos.includes('--infra') })

// A duração dos casos de e2e que o portão da tarefa roda: o Playwright deixa o relatório neste arquivo, e o portão o lê
// depois da corrida verde (`tools/ci/duracao-do-e2e.ts`). O de uma corrida anterior sai antes: relatório velho não mede nada.
const relatorioDoE2e = arquivoDoRelatorioDoE2e(raiz)
if (daTarefa) {
  rmSync(relatorioDoE2e, { force: true })
  mkdirSync(dirname(relatorioDoE2e), { recursive: true })
}
/**
 * O ambiente do comando: o do banco que ele começa (`PassoDoPortao.bancoNovo`) e, no e2e da tarefa, o arquivo onde o
 * Playwright grava a duração dos casos. A variável sai também do ambiente herdado, e não só deixa de ser posta.
 */
function ambienteDoPasso(passo: PassoDoPortao): NodeJS.ProcessEnv {
  const ambiente = { ...process.env, EDUCA_BANCO_NOVO: passo.bancoNovo ? '1' : undefined }
  return daTarefa && passo.comando.includes('tools/ci/e2e.ts') ? { ...ambiente, [VARIAVEL_DO_RELATORIO_DO_E2E]: relatorioDoE2e } : ambiente
}

// Com node_modules anterior ao lock (um pull que trouxe dependência nova), o typecheck falha com TS2307
// sem dizer que falta instalar.
const dependencias = rodar('[ -f node_modules/.package-lock.json ] && [ ! package-lock.json -nt node_modules/.package-lock.json ] || npm ci')
// A sequência vem de `sequencia-do-portao.ts`: a ordem dos comandos e o `stop` dos workers antes da integração têm teste lá.
// O documento e o texto das mutações são lidos aqui, e não depois das suítes: a sequência também derruba os workers antes das mutações de integração.
const documento = daTarefa ? documentoDasMutacoes() : null
const textoDoDocumento = documento ? readFileSync(join(raiz, documento), 'utf8') : null
const mutacoesDeIntegracao = textoDoDocumento !== null && mutacaoDeIntegracao(lerMutacoes(textoDoDocumento).mutacoes)
const sequencia = sequenciaDoPortao(suites, { alvos, docker: ['docker', ...ARGUMENTOS_COMPOSE], servicosDeJob: servicosDeJob(), mutacoesDeIntegracao })
const falhou = !dependencias ? 'dependências' : sequencia.find((passo) => !rodar(passo.comando, ambienteDoPasso(passo)))?.suite

if (falhou) {
  process.stdout.write(`\n✗ portão local vermelho em ${falhou}. Nenhum carimbo gravado.\n`)
  process.exit(1)
}
// O caso de e2e alterado que levou mais de metade do prazo dele aqui (15 s sem prazo próprio) estoura o prazo no runner: vermelho já, e não uma correção depois da validação.
const duracaoDoE2e = daTarefa && alvos.e2e.length > 0 ? motivoDaDuracaoDoE2e(raiz, relatorioDoE2e) : null
if (duracaoDoE2e !== null) {
  process.stdout.write(`\n✗ portão local vermelho na duração do e2e: ${duracaoDoE2e}\nNenhum carimbo gravado.\n`)
  process.exit(1)
}
// As mutações do documento, depois das suítes: só com os testes verdes um teste vermelho quer dizer que a cláusula tem
// quem a prove. Cada uma é aplicada, o teste citado roda, tem de cair, e o arquivo volta ao que era.
let carimboDasMutacoes: CarimboDasMutacoes | undefined
if (documento && textoDoDocumento !== null) {
  const conferencia = conferirMutacoesDoDocumento(raiz, documento, textoDoDocumento, rodarCalado(raiz), (texto) => process.stdout.write(texto))
  if ('vermelho' in conferencia) {
    process.stdout.write(`\n✗ portão local vermelho nas mutações de ${documento}: ${conferencia.vermelho}. Nenhum carimbo gravado.\n`)
    process.exit(1)
  }
  carimboDasMutacoes = conferencia.carimbo
}

// Carimba o conteúdo do início, que é o que as suítes provaram, ou recusa se alguém editou no meio da corrida.
const todosOsAlvos = [...alvos.integracao, ...alvos.e2e, ...alvos.infra]
const recusa = carimbarSeNadaMudou(
  raiz,
  daTarefa ? { inicio, suites, alvos: todosOsAlvos, ...(carimboDasMutacoes ? { mutacoes: carimboDasMutacoes } : {}) } : { inicio, suites },
  noInicio,
)
if (recusa) {
  // O comando sai daqui, e não da função: quem sabe as flags é o script. Quem lê esta linha acabou de perder os
  // ~20 min das suítes, e precisa saber que é só rodar de novo.
  process.stdout.write(`\n✗ ${recusa} Rode \`node ${['tools/processo/portao-local.ts', ...argumentos].join(' ')}\` de novo.\n`)
  process.exit(1)
}
if (daTarefa) {
  const lista = todosOsAlvos.length > 0 ? todosOsAlvos.join(', ') : 'nenhum teste de integração, de e2e ou de infra alterado na árvore'
  const conferidas = carimboDasMutacoes ? `; ${String(carimboDasMutacoes.total)} mutações de ${carimboDasMutacoes.documento}, todas vermelhas` : '; nenhuma mutação declarada'
  process.stdout.write(`\n✓ portão da tarefa verde (tipos, lint, segredo, dependências, unidade inteira; alvos: ${lista}${conferidas}). O resto roda na esteira do push.\n`)
} else {
  process.stdout.write(`\n✓ portão local verde (${suites.join(', ')}). Carimbo em .processo/portao.json, início ${inicio}.\n`)
}
