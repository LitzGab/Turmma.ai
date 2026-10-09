import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { etapaCompose } from './compose.ts'
import { raizRepositorio, type Etapa } from './executar.ts'

/**
 * O que uma fatia do e2e custa no runner, arredondado para cima a partir dos logs da esteira
 * (`tasks/correcoes/2026-10-02-teto-do-e2e-na-esteira.md` e `tasks/correcoes/2026-10-03-e2e-em-fatias.md`):
 *
 * - fixo: preparo do job, navegador, build, subida do compose e derrubada. Medido de 2 min 30 s a 3 min 37 s;
 * - por caso: relógio do runner, com os 2 trabalhadores que ele dá. Medido de 5,0 a 6,7 s (6,7 s nos 380 casos da
 *   execução 37165931582, cancelada aos 45 min).
 *
 * É piso, não previsão: conta caso, não peso. Caso de tela com muita ida à API custa mais que o dobro da média.
 */
export const MINUTOS_FIXOS_DO_E2E = 4
export const SEGUNDOS_POR_CASO_DO_E2E = 7

/**
 * Quanto do teto uma fatia pode ocupar. Os 40% que sobram são a variação do runner e o peso dos casos que a média
 * não vê: com o job inteiro cabendo pela média em 44 de 45 min, ele foi cancelado duas vezes seguidas.
 */
export const FRACAO_DE_FOLGA_DO_E2E = 0.6

/** Minutos que uma fatia com esse número de casos custa no runner, pela média. */
export function minutosEstimadosDoE2e(casos: number): number {
  return Math.ceil(MINUTOS_FIXOS_DO_E2E + (casos * SEGUNDOS_POR_CASO_DO_E2E) / 60)
}

/** O `timeout-minutes` do job de e2e, lido do workflow: o teto é um só, e mora lá. */
export function tetoDoE2e(): number {
  const workflow = parse(readFileSync(join(raizRepositorio, '.github/workflows/ci.yml'), 'utf8')) as {
    jobs?: { e2e?: { 'timeout-minutes'?: unknown } }
  }
  const teto = Number(workflow.jobs?.e2e?.['timeout-minutes'])
  if (!Number.isFinite(teto) || teto <= 0) throw new Error('o job de e2e de .github/workflows/ci.yml não declara timeout-minutes')
  return teto
}

/** Até onde a etapa de testes de uma fatia pode ir antes do aviso: a folga do teto, menos o custo fixo do job. */
export function limiarDosTestesEmMinutos(teto: number): number {
  return teto * FRACAO_DE_FOLGA_DO_E2E - MINUTOS_FIXOS_DO_E2E
}

/**
 * O aviso de que a etapa de testes passou do limiar, ou `null` se coube. É o sinal que faltava: execução verde
 * de 43 min num teto de 45 não chamava ninguém, e o teto chegou duas vezes sem aviso.
 */
export function avisoDePrazoDoE2e(duracaoMs: number, teto: number): string | null {
  const minutos = duracaoMs / 60_000
  const limiar = limiarDosTestesEmMinutos(teto)
  if (minutos <= limiar) return null
  return (
    `os testes desta fatia do e2e levaram ${minutos.toFixed(1)} min, acima do limiar de ${limiar.toFixed(1)} min ` +
    `(${String(Math.round(FRACAO_DE_FOLGA_DO_E2E * 100))}% do teto de ${String(teto)} min, menos o custo fixo do job). ` +
    'O teto está chegando: acrescente fatias ao e2e (docs/runbook.md, "Esteira vermelha no e2e").'
  )
}

/**
 * Lê `--shard=<i>/<n>` dos argumentos. Sem ele, `null`: a suíte inteira, que é o `npm run test:e2e` da máquina.
 * Formato errado reprova antes de subir qualquer coisa, em vez de rodar a suíte inteira numa fatia que não cabe.
 */
export function fatiaDosArgumentos(argumentos: readonly string[]): string | null {
  const fatias = argumentos.filter((argumento) => argumento.startsWith('--shard'))
  if (fatias.length === 0) return null
  const fatia = /^--shard=(\d+)\/(\d+)$/.exec(fatias.length === 1 ? (fatias[0] ?? '') : '')
  const indice = Number(fatia?.[1])
  const total = Number(fatia?.[2])
  if (fatia === null || indice < 1 || indice > total) {
    throw new Error(`fatia do e2e inválida: ${fatias.join(' ')} (esperado um só --shard=<i>/<n>, com 1 ≤ i ≤ n)`)
  }
  return `${String(indice)}/${String(total)}`
}

/**
 * A etapa dos testes do e2e, na fatia pedida, com o aviso do prazo ligado ao fim dela. O teto chegou duas vezes
 * seguidas sem aviso, porque execução verde perto dele não chama ninguém. Na esteira, o aviso vira anotação da
 * execução (`::warning`), que aparece no resumo dela; na máquina, uma linha no log. Avisa também quando a etapa
 * fica vermelha: lentidão e falha juntas são justamente o caso em que o prazo mais importa.
 */
/**
 * Os arquivos de teste pedidos na linha de comando (`node tools/ci/e2e.ts --manter-ambiente e2e/x.spec.ts`): o que não é
 * opção. Sem nenhum, o e2e roda inteiro. Existe para o portão da tarefa rodar só o que a tarefa alterou: na 6.0 do F3
 * cada tentativa de acertar um teste custou o e2e inteiro, uns 30 minutos, porque não havia como pedir um arquivo.
 */
export function arquivosDosArgumentos(argumentos: readonly string[]): string[] {
  return argumentos.filter((argumento) => !argumento.startsWith('-'))
}

export function etapaDosTestesDoE2e(
  fatia: string | null,
  teto: number,
  naEsteira: boolean,
  escrever: (texto: string) => void = (texto) => process.stdout.write(texto),
  arquivos: readonly string[] = [],
): Etapa {
  return {
    nome: fatia === null ? 'testes e2e' : `testes e2e, fatia ${fatia}`,
    comando: 'npx',
    argumentos: ['playwright', 'test', ...(fatia === null ? [] : [`--shard=${fatia}`]), ...arquivos],
    aoTerminar: (_codigo, duracaoMs) => {
      const aviso = avisoDePrazoDoE2e(duracaoMs, teto)
      if (aviso !== null) escrever(naEsteira ? `::warning title=e2e perto do teto::${aviso}\n` : `\n⚠ ${aviso}\n`)
    },
  }
}

/**
 * As etapas que o `ci:e2e` roda, em ordem, montadas aqui e não no `e2e.ts` para que o teste alcance a lista que roda
 * de verdade, com o aviso de prazo ligado à etapa dos testes. A finalização (derrubar o compose) fica no `e2e.ts`.
 */
export function etapasDoE2e(
  argumentos: readonly string[],
  teto: number,
  naEsteira: boolean,
  escrever?: (texto: string) => void,
): Etapa[] {
  // A esteira roda o e2e em fatias (`--shard=<i>/<n>`, da matriz do job); sem fatia, a suíte inteira, como na máquina.
  const fatia = fatiaDosArgumentos(argumentos)
  return [
    {
      nome: 'navegador do Playwright',
      comando: 'npx',
      argumentos: ['playwright', 'install', ...(naEsteira ? ['--with-deps'] : []), 'chromium'],
    },
    // O teto do bundle antes de subir o compose: é barato e reprova cedo (RF14).
    // Com a galeria das peças, como o build do compose da esteira (`.env.example`): é o build que o e2e usa, e o teto
    // das peças mede a galeria enquanto só ela as leva.
    { nome: 'build da web', comando: 'npm', argumentos: ['run', 'build', '-w', '@educa/web'], ambiente: { VITE_COM_GALERIA: '1' } },
    { nome: 'teto do bundle da web', comando: 'npx', argumentos: ['size-limit'] },
    etapaCompose('subir o ambiente completo', 'up', '--detach', '--build', '--wait'),
    etapaDosTestesDoE2e(fatia, teto, naEsteira, escrever, arquivosDosArgumentos(argumentos)),
  ]
}
