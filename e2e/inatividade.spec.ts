import type { Page, Route } from '@playwright/test'
import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { NOME_DA_CONTESTACAO } from '../packages/shared/src/estrutura/vinculo.ts'
import {
  criarAlocacaoDoProfessor,
  criarAlunoComMatricula,
  criarEquipeComSenha,
  definirInatividadeDaEscola,
  encerrarSessoesDoUsuario,
  type EquipeDeTeste,
} from './__fixtures__/sessao.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'

const ROTA_ATIVIDADE = '**/v1/sessao/atividade'
const ROTA_EU = '**/v1/eu'
/** O Chromebook com CPU ×4 e rede Fast 3G carrega a página e ainda faz o hash da senha no servidor. */
const PRAZO_DA_ENTRADA_MS = 20_000

/**
 * A inatividade que esta escola configurou, diferente do padrão de 120 min que a escola nasce com
 * (`escola.inatividade_equipe_min`, Tech Spec, seção 3). É de propósito: a tela precisa vencer pelo valor que o
 * `/v1/eu` devolve, e não por um número fixo no código, senão a escola que escolher 30 min no F2 não desloga ninguém
 * antes das duas horas.
 */
const INATIVIDADE_CONFIGURADA_MIN = 30
const INTERVALO_DA_ATIVIDADE_MIN = 5
/** O canal por onde as abas contam umas às outras que há gente mexendo (`apps/web/src/sessao/inatividade.ts`). */
const CANAL_DE_ATIVIDADE = 'educa-atividade'

const campoEmail = (page: Page) => page.getByLabel('E-mail')
const campoSenha = (page: Page) => page.getByLabel('Senha')
const dialogo = (page: Page) => page.getByRole('dialog')

/** Toque no celular, clique no Chromebook: a mesma ação pela entrada que cada aparelho tem. */
async function acionar(page: Page, nome: string | RegExp, hasTouch: boolean, papel: 'button' | 'link' = 'button'): Promise<void> {
  const alvo = page.getByRole(papel, { name: nome })
  if (hasTouch) await alvo.tap()
  else await alvo.click()
}

async function entrarPorEmail(page: Page, equipe: EquipeDeTeste, hasTouch: boolean): Promise<void> {
  await campoEmail(page).fill(equipe.email)
  await campoSenha(page).fill(equipe.senha)
  await acionar(page, /^Entrar$/, hasTouch)
}

async function esperarAreaAutenticada(page: Page, nome: string): Promise<void> {
  await expect(page.getByRole('heading', { name: `Olá, ${nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
}

/** Minutos no formato que o relógio simulado do Playwright entende. */
const minutos = (quantidade: number): string => `${String(Math.floor(quantidade / 60)).padStart(2, '0')}:${String(quantidade % 60).padStart(2, '0')}:00`

test.describe('inatividade e login por cima da tela', () => {
  test('a sessão vence sozinha, o login abre por cima, e o que a professora escreveu continua lá quando ela volta', async ({ page, hasTouch }) => {
    const professora = await criarEquipeComSenha()
    await criarAlocacaoDoProfessor(professora.escolaId, professora.usuarioId, ['História'])
    // Esta escola configurou 30 min, e não os 120 do padrão: é o valor do `/v1/eu` que precisa mandar no relógio.
    await definirInatividadeDaEscola(professora.escolaId, { equipe: INATIVIDADE_CONFIGURADA_MIN })
    // O relógio da aba é simulado: ninguém espera meia hora no e2e, e o servidor continua no tempo real.
    await page.clock.install()

    await page.goto('/entrar')
    await entrarPorEmail(page, professora, hasTouch)
    await esperarAreaAutenticada(page, professora.nome)
    await acionar(page, 'Meus vínculos', hasTouch, 'link')

    const historia = page.getByRole('listitem').filter({ hasText: 'História' })
    await expect(historia).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    if (hasTouch) await historia.getByRole('button', { name: 'Contestar' }).tap()
    else await historia.getByRole('button', { name: 'Contestar' }).click()
    await historia.getByRole('radio', { name: NOME_DA_CONTESTACAO.turma_errada }).check()
    const escrito = 'A turma que eu pego é a da tarde, e não esta.'
    await historia.getByRole('textbox').fill(escrito)

    // Um minuto antes do limite que a escola configurou, a sessão ainda vale: ninguém é interrompido antes da hora.
    await page.clock.fastForward(minutos(INATIVIDADE_CONFIGURADA_MIN - 1))
    await expect(dialogo(page)).toBeHidden()
    await expect(historia.getByRole('textbox')).toHaveValue(escrito)

    // Passado o limite, com a folga do relógio, a sessão vence sozinha. Com um número fixo no lugar do valor da
    // escola, este é o passo que não aconteceria.
    await page.clock.fastForward(minutos(2))

    await expect(dialogo(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(dialogo(page)).toContainText('Sua sessão expirou')
    // O login por cima é modal: o foco fica preso nele, e o que estava atrás não é alcançável por engano.
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    expect(await dialogo(page).evaluate((elemento) => elemento.contains(document.activeElement))).toBe(true)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // A mesma pessoa volta: a tela continua onde estava, com o rascunho inteiro (regra 80, item 6).
    await campoEmail(page).fill(professora.email)
    await campoSenha(page).fill(professora.senha)
    await acionar(page, /^Entrar$/, hasTouch)

    await expect(dialogo(page)).toBeHidden({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page).toHaveURL(/\/vinculos$/)
    await expect(historia.getByRole('textbox')).toHaveValue(escrito, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(historia.getByRole('radio', { name: NOME_DA_CONTESTACAO.turma_errada })).toBeChecked()
  })

  test('aba esquecida não renova nada: só ponteiro e teclado avisam atividade, e no máximo uma vez a cada 5 minutos', async ({ page, hasTouch }) => {
    const professora = await criarEquipeComSenha()
    let avisos = 0
    await page.route(ROTA_ATIVIDADE, async (rota: Route) => {
      avisos++
      await rota.continue()
    })
    await page.clock.install()

    await page.goto('/entrar')
    await entrarPorEmail(page, professora, hasTouch)
    await esperarAreaAutenticada(page, professora.nome)

    // Ninguém na frente do Chromebook: é exatamente esta aba que precisa vencer antes de o aluno seguinte sentar.
    await page.clock.fastForward(minutos(INTERVALO_DA_ATIVIDADE_MIN * 2))
    expect(avisos, 'aba parada não pode renovar a sessão sozinha').toBe(0)

    // Alguém mexe: um aviso, e só um, por mais que o ponteiro ande.
    await page.mouse.move(10, 10)
    await page.mouse.move(40, 40)
    await page.mouse.move(80, 80)
    await expect.poll(() => avisos, { timeout: PRAZO_DA_ENTRADA_MS }).toBe(1)

    // Ainda dentro dos 5 min: continuar mexendo não manda nada.
    await page.clock.fastForward(minutos(INTERVALO_DA_ATIVIDADE_MIN - 1))
    await page.mouse.move(120, 120)
    expect(avisos).toBe(1)

    // Passados os 5 min, o toque seguinte avisa de novo.
    await page.clock.fastForward(minutos(2))
    await page.mouse.move(160, 160)
    await expect.poll(() => avisos, { timeout: PRAZO_DA_ENTRADA_MS }).toBe(2)
  })

  test('"Entrar com outra conta" descarta a tela da pessoa anterior, e o Voltar não a traz de volta', async ({ page, hasTouch }) => {
    const professora = await criarEquipeComSenha()
    await criarAlocacaoDoProfessor(professora.escolaId, professora.usuarioId, ['História'])
    await definirInatividadeDaEscola(professora.escolaId, { equipe: INATIVIDADE_CONFIGURADA_MIN })
    await page.clock.install()

    await page.goto('/entrar')
    await entrarPorEmail(page, professora, hasTouch)
    await esperarAreaAutenticada(page, professora.nome)
    await acionar(page, 'Meus vínculos', hasTouch, 'link')
    const historia = page.getByRole('listitem').filter({ hasText: 'História' })
    await expect(historia).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    if (hasTouch) await historia.getByRole('button', { name: 'Contestar' }).tap()
    else await historia.getByRole('button', { name: 'Contestar' }).click()
    const escrito = 'rascunho de quem estava aqui antes'
    await historia.getByRole('textbox').fill(escrito)

    await page.clock.fastForward(minutos(INATIVIDADE_CONFIGURADA_MIN + 1))
    await expect(dialogo(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })

    // Quem sentou no computador diz que é outra pessoa: a tela de trás sai junto com o que estava escrito nela.
    await acionar(page, 'Entrar com outra conta', hasTouch)
    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.locator('body')).not.toContainText(escrito)
    await expect(page.locator('body')).not.toContainText(professora.nome)

    // E o Voltar do navegador não remonta a tela dela com o diálogo por cima: sem sessão, o caminho é a entrada.
    await page.goBack()
    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(dialogo(page)).toBeHidden()
    await expect(page.locator('body')).not.toContainText(escrito)
  })

  test('duas abas, uma sessão: a aba esquecida não encerra a sessão de quem está trabalhando na outra', async ({ page, context, hasTouch }) => {
    const professora = await criarEquipeComSenha()
    await definirInatividadeDaEscola(professora.escolaId, { equipe: INATIVIDADE_CONFIGURADA_MIN })
    await page.clock.install()

    await page.goto('/entrar')
    await entrarPorEmail(page, professora, hasTouch)
    await esperarAreaAutenticada(page, professora.nome)

    // A segunda aba abre pela mesma sessão, pelo cookie. É o professor que deixou a turma aberta numa aba e trabalha
    // na outra: as duas dividem a sessão, e o `DELETE` de uma derrubaria a outra.
    const abaEsquecida = page
    const abaEmUso = await context.newPage()
    await abaEmUso.goto('/')
    await esperarAreaAutenticada(abaEmUso, professora.nome)

    // O aviso entre abas é um `BroadcastChannel` (`apps/web/src/sessao/inatividade.ts`). O teste escuta o mesmo canal
    // dentro da aba esquecida para saber quando a mensagem chegou ao navegador dela: sem essa espera, o relógio dela
    // poderia avançar antes da entrega, e o teste mediria a corrida, não a regra.
    await abaEsquecida.evaluate((canal) => {
      const janela = window as unknown as { avisosDeOutraAba?: number }
      janela.avisosDeOutraAba = 0
      new BroadcastChannel(canal).addEventListener('message', () => {
        janela.avisosDeOutraAba = (janela.avisosDeOutraAba ?? 0) + 1
      })
    }, CANAL_DE_ATIVIDADE)

    // O relógio simulado é do navegador inteiro, e não de uma aba: avançá-lo uma vez move as duas, como na máquina
    // da escola. Quem tem gente na frente é só a aba em uso.
    await page.clock.fastForward(minutos(INATIVIDADE_CONFIGURADA_MIN - 1))
    await abaEmUso.mouse.move(40, 40)
    await expect
      .poll(() => abaEsquecida.evaluate(() => (window as unknown as { avisosDeOutraAba?: number }).avisosDeOutraAba ?? 0), { timeout: PRAZO_DA_ENTRADA_MS })
      .toBeGreaterThan(0)
    await page.clock.fastForward(minutos(2))

    // A prova é positiva: a aba em uso continua alcançando a API, o que só acontece com a sessão viva no servidor.
    await acionar(abaEmUso, 'Meus vínculos', hasTouch, 'link')
    await expect(abaEmUso.getByText('Nenhuma turma alocada ainda')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(dialogo(abaEmUso)).toBeHidden()
    await expect(dialogo(abaEsquecida)).toBeHidden()
  })

  test('falha da API não desloga: 5xx e rede cortada mantêm a tela, sem login por cima', async ({ page, hasTouch }) => {
    const professora = await criarEquipeComSenha()
    await page.goto('/entrar')
    await entrarPorEmail(page, professora, hasTouch)
    await esperarAreaAutenticada(page, professora.nome)

    let falha: 'servidor' | 'rede' | 'nenhuma' = 'servidor'
    let cortes = 0
    await page.route(ROTA_EU, (rota: Route) => {
      if (falha === 'rede') {
        cortes++
        return rota.abort('internetdisconnected')
      }
      if (falha === 'servidor') {
        return rota.fulfill({
          status: 503,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } }),
        })
      }
      return rota.continue()
    })

    await page.reload()
    await expect(page.getByRole('alert')).toContainText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })
    // Só o `NAO_AUTENTICADO` que persiste depois da renovação desloga: a queda do Postgres não pode virar login.
    await expect(dialogo(page)).toBeHidden()
    await expect(page).not.toHaveURL(/\/entrar$/)

    falha = 'rede'
    await acionar(page, 'Tentar de novo', hasTouch)
    await expect(page.getByRole('alert')).toContainText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(dialogo(page)).toBeHidden()
    // O toque e a repetição automática que vem 1 s depois: com as duas gastas, a tela para de tentar sozinha e o
    // botão fica firme para o toque seguinte.
    await expect.poll(() => cortes, { timeout: PRAZO_DA_ENTRADA_MS }).toBeGreaterThanOrEqual(2)

    falha = 'nenhuma'
    await acionar(page, 'Tentar de novo', hasTouch)
    await esperarAreaAutenticada(page, professora.nome)
  })

  test('sessão encerrada no servidor: o aluno recebe o login da matrícula por cima, no endereço da escola dele', async ({ page, hasTouch }) => {
    const aluno = await criarAlunoComMatricula()
    await page.clock.install()

    await page.goto(`/e/${aluno.slug}`)
    await page.getByLabel('Matrícula').fill(aluno.matricula)
    await campoSenha(page).fill(aluno.senha)
    await acionar(page, /^Entrar$/, hasTouch)
    await esperarAreaAutenticada(page, aluno.nome)

    // A coordenação desativou o aluno, ou a sessão foi encerrada: a requisição seguinte já não vale (RF5).
    await encerrarSessoesDoUsuario(aluno.usuarioId)
    await page.clock.fastForward(minutos(INTERVALO_DA_ATIVIDADE_MIN + 1))
    await page.mouse.move(30, 30)

    await expect(dialogo(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    // O aluno não tem e-mail (regra 20, item 2): o caminho de volta dele é a matrícula, na escola dele.
    await expect(dialogo(page).getByLabel('Matrícula')).toBeVisible()
    await expect(dialogo(page).getByLabel('E-mail')).toHaveCount(0)
    expect(await violacoesGraves(page)).toEqual([])
    expect(await larguraExcedente(page)).toBe(0)

    await dialogo(page).getByLabel('Matrícula').fill(aluno.matricula)
    await dialogo(page).getByLabel('Senha').fill(aluno.senha)
    await acionar(page, /^Entrar$/, hasTouch)
    await expect(dialogo(page)).toBeHidden({ timeout: PRAZO_DA_ENTRADA_MS })
    await esperarAreaAutenticada(page, aluno.nome)
  })

  test('Chromebook do carrinho: quem entra no login por cima é outra pessoa, e a tela da anterior sai da frente dela', async ({ page, hasTouch }) => {
    const primeira = await criarEquipeComSenha()
    const segunda = await criarEquipeComSenha()
    await criarAlocacaoDoProfessor(primeira.escolaId, primeira.usuarioId, ['História'])
    await definirInatividadeDaEscola(primeira.escolaId, { equipe: INATIVIDADE_CONFIGURADA_MIN })
    await page.clock.install()

    await page.goto('/entrar')
    await entrarPorEmail(page, primeira, hasTouch)
    await esperarAreaAutenticada(page, primeira.nome)
    await acionar(page, 'Meus vínculos', hasTouch, 'link')

    const historia = page.getByRole('listitem').filter({ hasText: 'História' })
    await expect(historia).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    if (hasTouch) await historia.getByRole('button', { name: 'Contestar' }).tap()
    else await historia.getByRole('button', { name: 'Contestar' }).click()
    const escrito = 'rascunho da professora anterior'
    await historia.getByRole('textbox').fill(escrito)

    await page.clock.fastForward(minutos(INATIVIDADE_CONFIGURADA_MIN + 1))
    await expect(dialogo(page)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })

    // Sentou outra pessoa: nada do que estava na tela pode continuar na frente dela.
    await campoEmail(page).fill(segunda.email)
    await campoSenha(page).fill(segunda.senha)
    await acionar(page, /^Entrar$/, hasTouch)

    await esperarAreaAutenticada(page, segunda.nome)
    expect(new URL(page.url()).pathname).toBe('/')
    await expect(page.locator('body')).not.toContainText(escrito)
    await expect(page.locator('body')).not.toContainText(primeira.nome)
    await expect(page.locator('body')).not.toContainText(primeira.escolaNome)
  })
})
