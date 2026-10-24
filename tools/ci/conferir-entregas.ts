// A terceira camada do RF14 (`tasks/prd-harness/techspec.md` §5a, "Limites declarados"): o que escapa do `PreToolUse` e do
// git hook nativo (papel sem `CLAUDE_CODE_AGENT`, `commit-tree`, `rebase`, `--no-verify` dentro de script) aparece no push.
//
//   npm run ci:conferir-entregas      no job `verificar`, só em `spec/**` e `correcao/**`
//
// Olha, um a um, os commits de `origin/develop..HEAD`. O commit que leva código (`ehCodigoParaAEsteira`: o de produto e a
// lista do §5e) passa de dois jeitos:
//   - a marca `(tarefa N.0)` ou `(correção <slug>)` **no título** e a linha `Revisões:` com texto no corpo; ou
//   - a linha `Fora do processo: <motivo>` com motivo, que é a do Joaquim (o hook a recusa de sessão de papel).
// Commit que só leva documento passa sem nada. O merge é cobrado só pelo que ele mesmo resolveu (`--remerge-diff`): o código
// que ele trouxe do outro lado está nos commits do outro lado, que estão no intervalo e se conferem sozinhos, ou já estão na
// `develop`.
//
// **Limite declarado:** a esteira não sabe quem escreveu a linha `Fora do processo:`. Papel que escapou do hook por script, e o
// Orquestrador, passam com ela. A barreira é o hook, que a recusa de sessão de papel; aqui o que se pega é o commit sem nada.
//
// Sai 0 quando tudo confere (e no intervalo vazio), 1 com o hash de cada commit que não confere, e 2 quando não deu para
// conferir (a `origin/develop` não existe: o checkout raso não tem o histórico). Quem não confere não passa.
//
// A saída leva só o hash, o título e os caminhos de cada commit recusado, nunca o corpo da mensagem nem o conteúdo do diff
// (regra 20, item 9): o log da esteira é público.
import { execFileSync } from 'node:child_process'
import { MARCA_DE_CORRECAO, MARCA_DE_TAREFA } from '../processo/comando-git.ts'
import { ehCodigoParaAEsteira, LINHA_FORA_DO_PROCESSO, TERMO_FORA_DO_PROCESSO } from '../processo/portao.ts'

export const BASE_DAS_ENTREGAS = 'origin/develop'

export interface Resultado {
  codigo: 0 | 1 | 2
  texto: string
}

const LINHA_DE_REVISOES = /^Revisões:[ \t]*\S/m

const git = (raiz: string, argumentos: string[]): string =>
  execFileSync('git', argumentos, {
    cwd: raiz,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  })

/**
 * Os arquivos que o commit traz, pelo nome inteiro (`-z`: sem aspas nem escape de acento e de espaço) e sem detectar rename
 * (o que sai e o que entra contam os dois: mover código para um documento não o esconde). O `--remerge-diff` só muda o merge:
 * compara o que ele gravou com o que o git juntaria sozinho, e sobra a resolução de conflito, inclusive a que ficou com um lado só.
 * O último separador deixa um nome vazio no fim da lista, que não é código e cai fora na classificação.
 * O `--remerge-diff` pede git 2.36 ou mais novo; o runner `ubuntu-24.04` cumpre, e imagem com git mais velho faz o script sair 1 por falha do `git show`.
 */
function arquivosDoCommit(raiz: string, sha: string): string[] {
  return git(raiz, ['show', '--remerge-diff', '--no-renames', '--format=', '--name-only', '-z', sha]).split('\0')
}

/** O motivo de o commit com código não valer, ou `null` quando vale. */
function recusaDoCommit(mensagem: string): string | null {
  const [titulo = '', ...corpo] = mensagem.split('\n')
  const linhasForaDoProcesso = mensagem.split('\n').filter((linha) => LINHA_FORA_DO_PROCESSO.test(linha))
  if (linhasForaDoProcesso.some((linha) => linha.slice(TERMO_FORA_DO_PROCESSO.length).trim() !== '')) return null
  if (MARCA_DE_CORRECAO.test(titulo) || MARCA_DE_TAREFA.test(titulo)) {
    return LINHA_DE_REVISOES.test(corpo.join('\n')) ? null : 'tem a marca no título, mas não a linha "Revisões:" no corpo'
  }
  if (linhasForaDoProcesso.length > 0) return `a linha "${TERMO_FORA_DO_PROCESSO}" está sem motivo`
  return `leva código sem (tarefa N.0) nem (correção <slug>) no título, e sem "${TERMO_FORA_DO_PROCESSO} <motivo>"`
}

/** Confere os commits que a `origin/develop` não tem, no checkout `raiz`. */
export function conferirEntregas(raiz: string): Resultado {
  let novos: string[]
  try {
    novos = git(raiz, ['rev-list', `${BASE_DAS_ENTREGAS}..HEAD`]).split('\n').filter((sha) => sha !== '')
  } catch {
    return {
      codigo: 2,
      texto: `Não deu para conferir: não achei ${BASE_DAS_ENTREGAS} neste checkout. O job precisa do histórico inteiro (fetch-depth: 0).`,
    }
  }
  if (novos.length === 0) return { codigo: 0, texto: `Nenhum commit novo em relação a ${BASE_DAS_ENTREGAS}.` }
  const recusas: string[] = []
  for (const sha of novos) {
    const codigo = arquivosDoCommit(raiz, sha).filter(ehCodigoParaAEsteira)
    if (codigo.length === 0) continue
    const mensagem = git(raiz, ['log', '-1', '--format=%B', sha])
    const motivo = recusaDoCommit(mensagem)
    if (motivo === null) continue
    const exemplos = `${codigo.slice(0, 3).join(', ')}${codigo.length > 3 ? ', …' : ''}`
    recusas.push(`- ${sha} "${mensagem.split('\n')[0] ?? ''}": ${motivo} (${exemplos})`)
  }
  if (recusas.length > 0) {
    return {
      codigo: 1,
      texto:
        `RECUSADO: ${String(recusas.length)} commit(s) de ${BASE_DAS_ENTREGAS}..HEAD com código fora do processo:\n${recusas.join('\n')}\n` +
        `Código entra por tarefa ou por correção, com a marca no título e a linha "Revisões:" no corpo (/seguir). O commit do Joaquim fora do processo leva a linha "${TERMO_FORA_DO_PROCESSO} <motivo>".`,
    }
  }
  return { codigo: 0, texto: `Conferidos ${String(novos.length)} commit(s) de ${BASE_DAS_ENTREGAS}..HEAD: todo commit com código tem a marca e as revisões, ou a linha "${TERMO_FORA_DO_PROCESSO}".` }
}

if (import.meta.filename === process.argv[1]) {
  const resultado = conferirEntregas(process.cwd())
  process.stdout.write(`${resultado.texto}\n`)
  process.exit(resultado.codigo)
}
