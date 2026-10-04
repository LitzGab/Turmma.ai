import type { Locator, Page } from '@playwright/test'
import { entrarComoCoordenacaoNaMesmaAba, entrarPorEmail, esperarGovernanca, esperarNovaConversa, irPelaNavegacao, PRAZO_DA_ENTRADA_MS } from './casca.ts'
import { CAMINHO_DO_PDF_DE_DEMONSTRACAO } from './material.ts'
import { expect } from './perfis.ts'
import { confirmarVinculosNoBanco, criarAlocacaoDoProfessor, criarCoordenadoraNaEscola, criarEquipeComSenha, type EquipeDeTeste } from './sessao.ts'

/**
 * O começo de todo fluxo de verdade do professor (A2, A3 e A4), contra a API real e o adaptador falso: a escola com a
 * turma de Química confirmada, o material que a coordenação sobe pela tela, e a professora na tela em que ela abre.
 */

/** A leitura do PDF e cada geração passam pela fila curta da API e pela consulta da execução, com a CPU ×4 do perfil. */
export const PRAZO_DA_IA_MS = 45_000
export const TITULO_DO_MATERIAL = 'Química 2, capítulo 7: Estequiometria'
export const DISCIPLINA = 'Química'

export interface Escola {
  readonly professora: EquipeDeTeste
  readonly turmaId: string
  readonly turmaNome: string
}

export async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  await (hasTouch ? alvo.tap() : alvo.click())
}

export const principal = (page: Page) => page.getByRole('main')
export const caixa = (page: Page) => page.getByRole('textbox', { name: 'Pedido ao Assistente de ensino' })
export const conversa = (page: Page) => page.getByRole('log', { name: 'Conversa com o Assistente de ensino' })

/**
 * A escola como a demonstração a encontra: a professora com a turma de Química confirmada (A1), e o material que a
 * **coordenação sobe pela tela**, com titularidade e licença declaradas (D75). Depois a coordenação sai, e a professora
 * entra na mesma aba, em "Nova conversa".
 */
export async function montarEscolaEEntrar(page: Page, hasTouch: boolean): Promise<Escola> {
  const professora = await criarEquipeComSenha()
  const alocacao = await criarAlocacaoDoProfessor(professora.escolaId, professora.usuarioId, [DISCIPLINA])
  await confirmarVinculosNoBanco(professora.escolaId, alocacao.vinculoIds)
  const coordenadora = await criarCoordenadoraNaEscola(professora)

  await page.goto('/entrar')
  await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
  await esperarGovernanca(page)
  await irPelaNavegacao(page, 'Material', hasTouch)
  await expect(page).toHaveURL(/\/coordenacao\/material$/)
  await page.getByTestId('arquivo-do-material').setInputFiles(CAMINHO_DO_PDF_DE_DEMONSTRACAO)
  await principal(page).getByLabel('Título').fill(TITULO_DO_MATERIAL)
  await principal(page).getByLabel('Disciplina').selectOption({ label: DISCIPLINA })
  await principal(page).getByLabel('De quem é o material').selectOption({ label: 'Material próprio da escola' })
  await principal(page).getByLabel('Licença de uso (obrigatória)').selectOption({ label: 'Autoria da escola ou de professor dela' })
  await principal(page).getByLabel(/^Declaro que a escola pode usar este material/).check()
  await acionar(principal(page).getByRole('button', { name: 'Enviar material' }), hasTouch)
  const material = principal(page).getByRole('region', { name: 'Materiais da escola' }).getByRole('listitem').filter({ hasText: TITULO_DO_MATERIAL })
  await expect(material.getByText('Pronto · 6 páginas')).toBeVisible({ timeout: PRAZO_DA_IA_MS })

  // A coordenação sai, e a professora entra no mesmo computador.
  await acionar(page.getByRole('button', { name: 'Sair' }).first(), hasTouch)
  await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
  await entrarPorEmail(page, professora, hasTouch)
  await esperarNovaConversa(page, professora.nome)
  return { professora, turmaId: alocacao.turmaId, turmaNome: alocacao.turmaNome }
}

/** Gera a atividade de estequiometria pelo formulário da ferramenta, com a turma já escolhida, e espera o resultado. */
export async function gerarAtividade(cartao: Locator, hasTouch: boolean, questoes: string): Promise<void> {
  await cartao.getByLabel('Tema').fill('Estequiometria')
  await cartao.getByLabel('Questões').fill(questoes)
  await acionar(cartao.getByRole('button', { name: 'Gerar atividade' }), hasTouch)
  await expect(cartao.locator('[data-motor="pronto"]').getByText('Atividade — Estequiometria')).toBeVisible({ timeout: PRAZO_DA_IA_MS })
}

