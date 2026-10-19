import { randomUUID } from 'node:crypto'
import { expect, type Locator, type Page } from '@playwright/test'
import { entregaDoLote, loteSintetico, simularAssistente, type ApiDoAssistente } from '../assistente.ts'
import { entrarPorEmail, esperarNovaConversa, PRAZO_DA_ENTRADA_MS } from '../casca.ts'
import { acionar } from '../fluxo-do-professor.ts'
import { sinoDe } from './sino.ts'
import { confirmarVinculosNoBanco, criarAlocacaoDoProfessor, criarEquipeComSenha, type EquipeDeTeste } from '../sessao.ts'

export { acionar }

/** O prazo de uma tela do professor aparecer, com a API das telas simulada na página. */
export const PRAZO_DA_TELA_MS = 15_000
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** A tela inteira não fala em nota: é diagnóstico (D46). */
export const VOCABULARIO_DE_NOTA = /\bnotas?\b|\bconceitos?\b|pontuaç/i

export interface Cena {
  readonly api: ApiDoAssistente
  readonly professora: EquipeDeTeste
  readonly turmaId: string
  readonly turmaNome: string
  readonly disciplinaId: string
}

/** O sino da professora, aberto: o pé dele leva às duas telas do que a IA fez (telas do professor, 2.0). */
export async function abrirOSino(page: Page, hasTouch: boolean): Promise<void> {
  await acionar(sinoDe(page), hasTouch)
}

/** Abre o sino e vai a um link do pé dele. A lista fecha ao se ir a um item. */
export async function irPeloPeDoSino(page: Page, rotulo: string, hasTouch: boolean): Promise<void> {
  await abrirOSino(page, hasTouch)
  await acionar(page.getByRole('dialog', { name: 'Esperando você' }).getByRole('region', { name: 'Acompanhar a IA' }).getByRole('link', { name: rotulo }), hasTouch)
}

/** Navega dentro da aplicação, sem recarregar: a sessão e a memória da aba continuam, como num clique. */
export async function irPara(page: Page, caminho: string): Promise<void> {
  await page.evaluate((destino) => {
    window.history.pushState(null, '', destino)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, caminho)
}

/**
 * A professora entra, com a API do Assistente simulada. `comTurma` dá a ela uma turma de Química com o vínculo confirmado (de
 * verdade, no banco). `antes` monta o que a escola já tinha antes de ela entrar: a Home lê o time logo na entrada.
 */
export async function entrar(
  page: Page,
  hasTouch: boolean,
  { comTurma = true, antes }: { comTurma?: boolean; antes?: (api: ApiDoAssistente, turmaId: string) => void } = {},
): Promise<Cena> {
  const api = await simularAssistente(page)
  const professora = await criarEquipeComSenha()
  let turmaId = ''
  let turmaNome = ''
  if (comTurma) {
    const alocacao = await criarAlocacaoDoProfessor(professora.escolaId, professora.usuarioId, ['Química'])
    await confirmarVinculosNoBanco(professora.escolaId, alocacao.vinculoIds)
    turmaId = alocacao.turmaId
    turmaNome = alocacao.turmaNome
  }
  antes?.(api, turmaId)
  await page.goto('/entrar')
  // A professora abre em "Nova conversa", que lê as turmas dela: a resposta de verdade é esperada desde antes da entrada.
  const vinculos = page.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/v1/meus-vinculos' && resposta.ok())
  await entrarPorEmail(page, professora, hasTouch)
  await esperarNovaConversa(page, professora.nome)
  let disciplinaId = ''
  if (comTurma) {
    // A disciplina da turma, como a API de verdade a devolve: é com ela que as respostas simuladas falam da mesma turma.
    const { itens } = (await (await vinculos).json()) as { itens: { disciplina?: { id: string } }[] }
    disciplinaId = itens[0]?.disciplina?.id ?? ''
    expect(disciplinaId).toMatch(UUID)
  }
  return { api, professora, turmaId, turmaNome, disciplinaId }
}

/**
 * Recarrega a página depois de o teste mudar o que a API simulada devolve: é a professora que volta à tela mais tarde. Sem
 * isto a tela usaria a leitura de segundos atrás, que ainda vale (o que muda por uma ação dela a própria tela relê).
 */
export async function recarregar(page: Page): Promise<void> {
  await page.reload()
  // A tela da área só existe com a sessão de volta e o `/v1/eu` lido: antes disso a lateral ainda não tem os itens.
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeAttached({ timeout: PRAZO_DA_ENTRADA_MS })
}

export const selosDeIA = (alvo: Page | Locator) => alvo.locator('[data-selo-ia]')

/** Uma atividade encerrada, com o lote de correção pendente e a entrega dele (a que o sino e a tela do Assistente mostram). */
export function comLote(api: ApiDoAssistente, turmaId: string): { atividadeId: string; titulo: string } {
  const aplicada = { id: randomUUID(), titulo: 'Atividade de estequiometria' }
  const lote = loteSintetico(aplicada)
  api.correcoes.set(aplicada.id, lote)
  api.entregas = [entregaDoLote(lote, turmaId)]
  api.aplicadas = [
    { id: aplicada.id, artefatoId: randomUUID(), turmaId, titulo: aplicada.titulo, avaliativa: true, estado: 'encerrada', questoes: 2, aplicadaEm: '2026-10-05T13:00:00.000Z', encerradaEm: '2026-10-05T13:50:00.000Z', participacao: { alunos: 30, iniciaram: 28, enviaram: 26 }, entrega: lote.entrega },
  ]
  return { atividadeId: aplicada.id, titulo: aplicada.titulo }
}
