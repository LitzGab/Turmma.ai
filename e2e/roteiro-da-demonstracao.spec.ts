import { randomUUID } from 'node:crypto'
import type { Browser, BrowserContextOptions, Locator, Page } from '@playwright/test'
import { exibirCodigoDaTurma } from '../packages/shared/src/sala/acesso.ts'
import type { RespostaAcessoGerado } from '../packages/shared/src/sala/acesso.ts'
import { entregasNoBanco, validacoesNoBanco } from './__fixtures__/a2.ts'
import { respostasNoBanco } from './__fixtures__/a3.ts'
import { entrarComoAlunoPelaApi, responderPelaApi } from './__fixtures__/aluno-pela-api.ts'
import { abrirAbaAlunos, abrirNavegacao, esperarAtividades, esperarGovernanca, esperarNovaConversa, irPelaNavegacao, lateral, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { caixa, conversa, DISCIPLINA, gerarAtividade, PRAZO_DA_IA_MS, TITULO_DO_MATERIAL } from './__fixtures__/fluxo-do-professor.ts'
import { auditoriasNoBanco, suspensoesNoBanco } from './__fixtures__/governanca.ts'
import { CAMINHO_DO_PDF_DE_DEMONSTRACAO, materiaisNoBanco, recusasNaAuditoria } from './__fixtures__/material.ts'
import { criarOperadorComSegundoFator, removerOperador } from './__fixtures__/operacao.ts'
import { idDaEscolaComOEndereco, nomeQueVemPrimeiro } from './__fixtures__/painel.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import {
  alunoDaMatricula,
  alunoReivindicaPelaApi,
  aplicacaoDoArtefato,
  artefatosNoBanco,
  atividadeNoBanco,
  erroAoPedirVersaoAdaptada,
  professorAceitaEConfirmaPelaApi,
  tokenDaEquipe,
  turmaDoNome,
  usuarioDaEquipe,
} from './__fixtures__/roteiro.ts'
import { campoCodigo } from './__fixtures__/segundo-fator.ts'
import { alunosDaTurmaNoBanco, codigoDoAutenticador } from './__fixtures__/sessao.ts'
import { entrarNaOperacao } from './__fixtures__/tela-da-operacao.ts'

/**
 * **O roteiro da demonstração inteiro, numa sequência só** (`docs/roteiro-da-demonstracao.md`; `docs/mvp-rapido.md`,
 * seções 1 e 6), contra a API real com o adaptador falso: o operador cria a escola no painel e convida a coordenação; a
 * coordenação monta a escola na tela; a professora aceita, gera o acesso, e a aluna reivindica o nome e é aprovada; a
 * coordenação sobe o material (e a recusa sem licença); a professora gera a atividade pela conversa, exporta, adapta e
 * aprova; aplica; os alunos respondem; ela encerra, abre os destaques e aprova com a validação; a turma e o diagnóstico
 * aparecem; numa segunda atividade a aluna pede a resposta ao Tutor e é conduzida; a professora vê o sinal sem a
 * conversa; e a coordenação abre a governança, suspende e retoma uma função, gera o resumo do Analista e abre o nominal.
 *
 * Nada de seed de escola (D71 revista): a escola nasce na tela do operador, e o banco só é **lido**, para as asserções
 * provarem a regra. O que a demonstração faz em outros perfis (a segunda professora de Química, o professor de Física,
 * dois alunos de apoio) vai pela API, com as mesmas rotas que a tela usa. Os pedaços já têm spec próprio, com os
 * estados de cada tela, nos dois projetos; aqui o que se prova é que eles se encadeiam na ordem do roteiro.
 *
 * **Só no projeto `chromebook`.** O roteiro é o de quem apresenta, num computador; o celular de cada tela já está nos
 * specs dela (D51). A aluna, que na escola usa o Chromebook, fica na página do perfil (CPU ×4 e Fast 3G); as outras
 * pessoas, em navegadores sem limitação, como em `escola-montada.spec.ts`.
 *
 * **Prazo próprio: 8 min.** São umas 40 telas, sete gerações de IA pela fila curta da API e dois logins com segundo
 * fator, em sequência e sem paralelismo possível: cada passo depende do anterior, como na reunião. Medido em 1,1 min na
 * máquina (04/10/2026), sozinho; na esteira ele divide o runner com outro trabalhador e com a CPU ×4 da aluna, e os
 * specs de tela mais pesados chegam a três vezes o tempo da máquina. O prazo é o dessa folga, arredondado para cima.
 * Nenhum outro teste muda de prazo.
 */

const PRAZO_DO_ROTEIRO_MS = 8 * 60_000
const VOCABULARIO_DE_NOTA = /\bnotas?\b|\bconceitos?\b|pontuaç/i
const PROIBIDO_NA_AREA_DO_ALUNO = /\bnotas?\b|\bconceito\b|ranking|média da turma|colegas?\b/i
const SERIE = '2º ano do Ensino Médio'
const PRIMEIRA = 'Atividade — Estequiometria'
const TEMA_DA_SEGUNDA = 'Reagente limitante'
const SEGUNDA = `Atividade — ${TEMA_DA_SEGUNDA}`

const principal = (page: Page) => page.getByRole('main')
const dialogo = (page: Page) => page.getByRole('dialog')
const botao = (lugar: Locator, nome: string) => lugar.getByRole('button', { name: nome, exact: true })

const contextos: { close: () => Promise<void> }[] = []
const operadores: string[] = []

test.afterEach(async () => {
  for (const contexto of contextos.splice(0)) await contexto.close()
  for (const operadorId of operadores.splice(0)) await removerOperador(operadorId)
})

/** Outro computador: o da operação, o da coordenação, o da professora. Mesmas opções do projeto, sem a limitação do CDP. */
async function outroNavegador(browser: Browser): Promise<Page> {
  const uso = test.info().project.use
  const opcoes: BrowserContextOptions = { permissions: ['clipboard-read', 'clipboard-write'] }
  if (uso.baseURL !== undefined) opcoes.baseURL = uso.baseURL
  if (uso.viewport !== undefined) opcoes.viewport = uso.viewport
  if (uso.userAgent !== undefined) opcoes.userAgent = uso.userAgent
  if (uso.locale !== undefined) opcoes.locale = uso.locale
  if (uso.timezoneId !== undefined) opcoes.timezoneId = uso.timezoneId
  const contexto = await browser.newContext(opcoes)
  contextos.push(contexto)
  return contexto.newPage()
}

async function entrarComEmail(page: Page, email: string, senha: string): Promise<void> {
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(senha)
  await page.getByRole('button', { name: /^Entrar$/ }).click()
}

/** No Seu time da lateral, o link de um agente. */
async function abrirNoSeuTime(page: Page, agente: RegExp | string): Promise<void> {
  await abrirNavegacao(page, false)
  await lateral(page).getByRole('navigation', { name: 'Seu time' }).getByRole('link', { name: agente }).click()
}

/** O cartão do número de painel da Governança: o pai do rótulo. */
const numeroDoPainel = (page: Page, rotulo: string) => principal(page).getByText(rotulo, { exact: true }).first().locator('..')

test.describe('o roteiro da demonstração, de ponta a ponta', () => {
  test.skip(({ isMobile }) => isMobile, 'o roteiro é o de quem apresenta, no computador: o celular de cada tela está no spec dela (D51)')

  test('do painel da operação à governança, na ordem da reunião, com o adaptador falso', async ({ page: aluna, browser, request }) => {
    test.setTimeout(PRAZO_DO_ROTEIRO_MS)
    const marca = randomUUID().slice(0, 8)
    const senha = `frase sintética da demonstração ${marca}`
    const rede = nomeQueVemPrimeiro('Rede Fictícia de Demonstração')
    const escolaNome = nomeQueVemPrimeiro('Colégio Fictício Lago Azul')
    const slug = `lago-azul-${marca}`
    const turmaA = `2ºA ${marca}`
    const turmaB = `2ºB ${marca}`
    const coordenadora = { nome: `Rita Demo ${marca}`, email: `rita-${marca}@demo.invalid` }
    const helena = { nome: `Helena Demo ${marca}`, email: `helena-${marca}@demo.invalid` }
    const marta = { nome: `Marta Demo ${marca}`, email: `marta-${marca}@demo.invalid` }
    const davi = { nome: `Davi Demo ${marca}`, email: `davi-${marca}@demo.invalid` }
    const ana = { nome: `Ana Demo ${marca}`, matricula: `D26-${marca}-1`, senha }
    const bruno = { nome: `Bruno Demo ${marca}`, matricula: `D26-${marca}-2`, senha }
    const carla = { nome: `Carla Demo ${marca}`, matricula: `D26-${marca}-3`, senha }

    // ── 1. O operador cria a rede e a escola no painel e convida a coordenação (A0b). ─────────────────────────────
    const operacao = await outroNavegador(browser)
    const linkDaCoordenacao = await test.step('o operador cria a escola e convida a coordenação', async () => {
      const operador = await criarOperadorComSegundoFator()
      operadores.push(operador.operadorId)
      await entrarNaOperacao(operacao, operador, false)
      await botao(principal(operacao), 'Nova rede').click()
      await dialogo(operacao).getByLabel('Nome da rede').fill(rede, { timeout: PRAZO_DA_ENTRADA_MS })
      await botao(dialogo(operacao), 'Criar rede').click()
      await expect(operacao.getByRole('status').filter({ hasText: `Rede ${rede} criada.` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      await botao(principal(operacao), 'Nova escola').click()
      await expect(dialogo(operacao).getByLabel('Rede').locator('option:checked')).toHaveText(rede, { timeout: PRAZO_DA_ENTRADA_MS })
      await dialogo(operacao).getByLabel('Nome da escola').fill(escolaNome)
      await dialogo(operacao).getByLabel('Endereço da escola').fill(slug)
      await botao(dialogo(operacao), 'Revisar').click()
      await botao(dialogo(operacao), 'Criar escola').click()
      await expect(operacao.getByRole('status').filter({ hasText: `Escola ${escolaNome} criada.` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })

      const linha = principal(operacao).locator('tr, li').filter({ hasText: escolaNome }).filter({ visible: true })
      await expect(linha).toContainText('Sem convite', { timeout: PRAZO_DA_ENTRADA_MS })
      await linha.getByRole('button', { name: `Convidar a coordenação de ${escolaNome}` }).click()
      await dialogo(operacao).getByLabel('Nome da coordenadora').fill(coordenadora.nome)
      await dialogo(operacao).getByLabel('E-mail da coordenadora').fill(coordenadora.email)
      await botao(dialogo(operacao), 'Revisar').click()
      await botao(dialogo(operacao), 'Gerar convite').click()
      await expect(dialogo(operacao).getByRole('heading', { name: 'Copie o link do convite' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      const link = await dialogo(operacao).getByLabel('Link do convite').inputValue()
      await botao(dialogo(operacao), 'Copiar link').click()
      await botao(dialogo(operacao), 'Fechar').click()
      await expect(linha).toContainText('Convite enviado, ainda não aberto', { timeout: PRAZO_DA_ENTRADA_MS })
      // O painel não mostra dado de pessoa da escola: nem o nome nem o e-mail da coordenadora ficam na lista.
      await expect(principal(operacao)).not.toContainText(coordenadora.email)
      return link
    })
    const escolaId = await idDaEscolaComOEndereco(slug)

    // ── 2. A coordenação aceita, configura o segundo fator e monta a escola (A1). ─────────────────────────────────
    const coordenacao = await outroNavegador(browser)
    const convites = await test.step('a coordenação entra pelo convite, com segundo fator, e abre em Governança, vazia', async () => {
      await coordenacao.goto(linkDaCoordenacao)
      await expect(principal(coordenacao)).toContainText(escolaNome, { timeout: PRAZO_DA_ENTRADA_MS })
      await botao(principal(coordenacao), 'Aceitar o convite').click()
      await coordenacao.getByLabel('Senha nova').fill(senha, { timeout: PRAZO_DA_ENTRADA_MS })
      const respostaDoSegredo = coordenacao.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/v1/conta/mfa/configurar')
      await botao(principal(coordenacao), 'Definir a senha e continuar').click()
      await expect(coordenacao.getByRole('heading', { name: 'Configurar o segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      const { segredo } = (await (await respostaDoSegredo).json()) as { segredo: string }
      await campoCodigo(coordenacao).fill(codigoDoAutenticador(segredo))
      await coordenacao.getByRole('button', { name: /Ativar o segundo fator|Ativando/ }).click()
      await coordenacao.getByRole('link', { name: 'Ir para a entrada' }).click()
      await entrarComEmail(coordenacao, coordenadora.email, senha)
      await expect(coordenacao.getByRole('heading', { name: 'Segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      await campoCodigo(coordenacao).fill(codigoDoAutenticador(segredo, 30))
      await coordenacao.getByRole('button', { name: /^Entrar$/ }).click()
      await esperarGovernanca(coordenacao)
      await expect(principal(coordenacao)).toContainText('A IA ainda não gerou nada nesta escola', { timeout: PRAZO_DA_ENTRADA_MS })

      // Estrutura: ano letivo aberto, a série, Química e Física, 2ºA e 2ºB.
      await irPelaNavegacao(coordenacao, 'Estrutura', false)
      await expect(principal(coordenacao).getByText('Comece pelo ano letivo')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      await botao(principal(coordenacao), 'Criar o ano letivo').click()
      await dialogo(coordenacao).getByLabel('Ano').fill('2026')
      await dialogo(coordenacao).getByLabel('Início').fill('2026-02-02')
      await dialogo(coordenacao).getByLabel('Fim').fill('2026-12-11')
      await botao(dialogo(coordenacao), 'Criar ano letivo').click()
      await expect(dialogo(coordenacao)).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
      await botao(principal(coordenacao), 'Abrir o ano letivo 2026').click()
      await expect(principal(coordenacao)).toContainText('Em curso', { timeout: PRAZO_DA_ENTRADA_MS })
      await botao(principal(coordenacao), 'Nova série').click()
      await dialogo(coordenacao).getByLabel('Série').selectOption({ label: SERIE })
      await botao(dialogo(coordenacao), 'Criar série').click()
      await expect(dialogo(coordenacao)).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
      for (const disciplina of [DISCIPLINA, 'Física']) {
        await botao(principal(coordenacao), 'Nova disciplina').click()
        await dialogo(coordenacao).getByLabel('Nome da disciplina').fill(disciplina)
        await botao(dialogo(coordenacao), 'Criar disciplina').click()
        await expect(dialogo(coordenacao)).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
      }
      for (const turma of [turmaA, turmaB]) {
        await botao(principal(coordenacao), 'Nova turma').click()
        await dialogo(coordenacao).getByLabel('Nome da turma').fill(turma)
        await botao(dialogo(coordenacao), 'Criar turma').click()
        await expect(dialogo(coordenacao)).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })
      }
      await expect(principal(coordenacao).getByRole('region', { name: 'Turmas de 2026' })).toContainText(turmaB)

      // A lista de nomes do 2ºA: só nome e matrícula.
      await principal(coordenacao).getByRole('link', { name: `Lista de nomes da turma ${turmaA}` }).click()
      await principal(coordenacao).getByLabel('Lista colada').fill(`nome;matrícula\n${[ana, bruno, carla].map((aluno) => `${aluno.nome};${aluno.matricula}`).join('\n')}\n`, { timeout: PRAZO_DA_ENTRADA_MS })
      await botao(principal(coordenacao), 'Ver a prévia').click()
      const previa = principal(coordenacao).getByRole('region', { name: 'Prévia' })
      await expect(previa.getByRole('status')).toHaveText('3 nomes entram · 0 já estão na lista · 0 linhas com erro', { timeout: PRAZO_DA_ENTRADA_MS })
      await botao(previa, 'Gravar lista').click()
      await expect(principal(coordenacao).getByRole('region', { name: 'Nomes da turma' }).getByRole('status').filter({ hasText: '3 nomes gravados na lista.' })).toBeVisible({
        timeout: PRAZO_DA_ENTRADA_MS,
      })

      // Três professores, cada um com o convite de cópia única.
      await irPelaNavegacao(coordenacao, 'Professores', false)
      const links: Record<'helena' | 'marta' | 'davi', string> = { helena: '', marta: '', davi: '' }
      for (const [chave, professor] of [['helena', helena], ['marta', marta], ['davi', davi]] as const) {
        await botao(principal(coordenacao), 'Cadastrar professor').click()
        await dialogo(coordenacao).getByLabel('Nome do professor').fill(professor.nome, { timeout: PRAZO_DA_ENTRADA_MS })
        await dialogo(coordenacao).getByLabel('E-mail do professor').fill(professor.email)
        await botao(dialogo(coordenacao), 'Revisar').click()
        await botao(dialogo(coordenacao), 'Cadastrar e gerar o link').click()
        const campo = dialogo(coordenacao).getByLabel('Link do convite')
        await expect(campo).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
        links[chave] = await campo.inputValue()
        await botao(dialogo(coordenacao), 'Copiar link').click()
        await botao(dialogo(coordenacao), 'Fechar').click()
        await expect(dialogo(coordenacao)).toHaveCount(0)
      }

      // A alocação: duas professoras de Química na mesma série (2ºA e 2ºB) e um de Física no 2ºA.
      await irPelaNavegacao(coordenacao, 'Estrutura', false)
      const alocacao = principal(coordenacao).getByRole('region', { name: 'Alocação' })
      for (const [professor, turma, disciplina] of [[helena, turmaA, DISCIPLINA], [marta, turmaB, DISCIPLINA], [davi, turmaA, 'Física']] as const) {
        await alocacao.getByLabel('Professor', { exact: true }).selectOption({ label: `${professor.nome} (convite em aberto)` }, { timeout: PRAZO_DA_ENTRADA_MS })
        await alocacao.getByLabel('Turma').selectOption({ label: turma })
        await alocacao.getByLabel('Disciplina').selectOption({ label: disciplina })
        await botao(alocacao, 'Alocar').click()
        await expect(alocacao.getByRole('list', { name: 'Professores alocados' })).toContainText(professor.nome, { timeout: PRAZO_DA_ENTRADA_MS })
      }
      await expect(alocacao.getByRole('list', { name: 'Professores alocados' })).toContainText('Esperando o professor confirmar')
      return links
    })
    const turmaAId = await turmaDoNome(escolaId, turmaA)

    // ── 3. A professora aceita e gera o acesso; a aluna reivindica o nome e é aprovada (A1). ─────────────────────
    const professora = await outroNavegador(browser)
    const codigoDaTurma = await test.step('a professora aceita, confirma a turma, que abre vazia, e gera o acesso dos alunos', async () => {
      await professora.goto(convites.helena)
      await botao(principal(professora), 'Aceitar o convite').click()
      await professora.getByLabel('Senha nova').fill(senha, { timeout: PRAZO_DA_ENTRADA_MS })
      await botao(principal(professora), 'Definir a senha e continuar').click()
      await expect(professora).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })
      await entrarComEmail(professora, helena.email, senha)
      await esperarNovaConversa(professora, helena.nome)
      await irPelaNavegacao(professora, 'Turmas', false)
      const paraConfirmar = principal(professora).getByRole('region', { name: 'Confirme suas turmas', exact: true })
      await paraConfirmar.getByRole('listitem').filter({ hasText: turmaA }).getByRole('button', { name: 'Confirmar' }).click({ timeout: PRAZO_DA_ENTRADA_MS })
      await principal(professora).getByRole('link', { name: `Abrir a turma ${turmaA}` }).click()
      // Sem correção aprovada, a turma não tem número nenhum: o acerto por habilidade só conta lote aprovado.
      await expect(principal(professora).getByText('Ainda não há correção aprovada nesta turma')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      await abrirAbaAlunos(professora, false)
      const acesso = principal(professora).getByRole('region', { name: 'Acesso dos alunos' })
      await botao(acesso, 'Gerar acesso').click()
      const respostaDoGerar = professora.waitForResponse((resposta) => /^\/v1\/turmas\/[^/]+\/acesso$/.test(new URL(resposta.url()).pathname) && resposta.request().method() === 'POST')
      await botao(dialogo(professora), 'Gerar acesso').click()
      const gerado = (await (await respostaDoGerar).json()) as RespostaAcessoGerado
      await expect(dialogo(professora).getByRole('group', { name: 'Código da turma' })).toContainText(exibirCodigoDaTurma(gerado.codigo), { timeout: PRAZO_DA_ENTRADA_MS })
      await botao(dialogo(professora), 'Fechar').click()
      await botao(dialogo(professora), 'Fechar sem copiar').click()
      return exibirCodigoDaTurma(gerado.codigo)
    })

    await test.step('a segunda professora de Química e o professor de Física aceitam e confirmam (em outro perfil, pela API)', async () => {
      await professorAceitaEConfirmaPelaApi(request, convites.marta, marta.email, senha)
      await professorAceitaEConfirmaPelaApi(request, convites.davi, davi.email, senha)
    })

    await test.step('a aluna reivindica o nome pelo código, os colegas também, e a professora aprova os três', async () => {
      await aluna.goto(`/e/${slug}/turma`)
      await principal(aluna).getByLabel('Código da turma').fill(codigoDaTurma)
      await botao(principal(aluna), 'Abrir a turma').click()
      await expect(principal(aluna).getByRole('radio')).toHaveCount(3, { timeout: PRAZO_DA_ENTRADA_MS })
      await principal(aluna).getByRole('radio', { name: ana.nome }).click()
      await principal(aluna).getByLabel('Matrícula').fill(ana.matricula)
      await principal(aluna).getByLabel('Crie uma senha').fill(ana.senha)
      await botao(principal(aluna), 'Enviar pedido').click()
      await expect(principal(aluna).getByRole('heading', { name: 'Pedido enviado' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      for (const colega of [bruno, carla]) await alunoReivindicaPelaApi(request, { slug, codigo: codigoDaTurma }, colega)
      // Antes da aprovação, ninguém está na turma.
      expect(await alunosDaTurmaNoBanco(escolaId, turmaAId)).toBe(0)

      await professora.reload()
      await abrirAbaAlunos(professora, false)
      const pedidos = principal(professora).getByRole('region', { name: 'Pedidos de nome' })
      for (const aluno of [ana, bruno, carla]) await pedidos.getByRole('checkbox', { name: aluno.nome }).check({ timeout: PRAZO_DA_ENTRADA_MS })
      await botao(pedidos, 'Aprovar 3 pedidos').click()
      await expect(dialogo(professora)).toContainText(`Você vai aprovar 3 pedidos da turma ${turmaA}.`)
      await botao(dialogo(professora), 'Aprovar 3 pedidos').click()
      await expect(dialogo(professora)).toContainText('Aprovado: já pode entrar com a matrícula e a senha', { timeout: PRAZO_DA_ENTRADA_MS })
      await botao(dialogo(professora), 'Fechar').click()
      expect(await alunosDaTurmaNoBanco(escolaId, turmaAId)).toBe(3)

      await principal(aluna).getByRole('link', { name: 'Ir para a entrada da escola' }).click()
      await aluna.getByLabel('Matrícula').fill(ana.matricula)
      await aluna.getByLabel('Senha', { exact: true }).fill(ana.senha)
      await aluna.getByRole('button', { name: /^Entrar$/ }).click()
      await esperarAtividades(aluna, ana.nome)
    })

    // ── 4. Passo 1: o material, recusado sem licença e lido com ela (A2; D5, D75). ─────────────────────────────────
    await test.step('a coordenação sobe o PDF sem licença e é recusada antes da leitura; com a licença, ele fica pronto', async () => {
      await irPelaNavegacao(coordenacao, 'Material', false)
      const preencher = async (licenca: string) => {
        await coordenacao.getByTestId('arquivo-do-material').setInputFiles(CAMINHO_DO_PDF_DE_DEMONSTRACAO)
        await principal(coordenacao).getByLabel('Título').fill(TITULO_DO_MATERIAL)
        await principal(coordenacao).getByLabel('Disciplina').selectOption({ label: DISCIPLINA })
        await principal(coordenacao).getByLabel('De quem é o material').selectOption({ label: 'Material próprio da escola' })
        await principal(coordenacao).getByLabel('Licença de uso (obrigatória)').selectOption({ label: licenca })
        await principal(coordenacao).getByLabel(/^Declaro que a escola pode usar este material/).check()
        await principal(coordenacao).getByRole('button', { name: 'Enviar material' }).click()
      }
      await preencher('Não tenho a licença, ou não sei')
      await expect(principal(coordenacao).getByRole('alert').filter({ hasText: 'Envio recusado.' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      expect(await materiaisNoBanco(escolaId)).toEqual([])
      expect(await recusasNaAuditoria(escolaId)).toEqual([{ motivo: 'sem_licenca', licenca: 'sem_licenca', declaracao: true }])

      await preencher('Autoria da escola ou de professor dela')
      const material = principal(coordenacao).getByRole('region', { name: 'Materiais da escola' }).getByRole('listitem').filter({ hasText: TITULO_DO_MATERIAL }).filter({ hasText: 'Pronto' })
      await expect(material.getByText('Pronto · 6 páginas')).toBeVisible({ timeout: PRAZO_DA_IA_MS })
      expect(await materiaisNoBanco(escolaId)).toEqual([expect.objectContaining({ titulo: TITULO_DO_MATERIAL, estado: 'pronto', paginas: 6, trechos: 6 })])
    })

    // ── 5. Passo 2: a conversa, a pergunta da D18, a página citada, o PDF, a versão adaptada aprovada (A2). ──────────
    const helenaId = await usuarioDaEquipe(escolaId, helena.email)
    await test.step('a professora pede a atividade, aceita a ferramenta, vê a página citada, exporta, adapta e aprova', async () => {
      await irPelaNavegacao(professora, 'Nova conversa', false)
      const pedido = 'monta uma atividade de estequiometria com 5 questões'
      await caixa(professora).fill(pedido)
      await professora.getByRole('button', { name: 'Enviar' }).click()
      const escolha = conversa(professora).getByRole('group', { name: /Quer que eu abra a ferramenta de atividade objetiva com 5 questões/ })
      await expect(escolha).toBeVisible({ timeout: PRAZO_DA_IA_MS })
      // D18: duas opções, e nada é gerado antes de ela escolher.
      await expect(escolha.getByRole('button')).toHaveText([/^Usar a ferramenta Atividade objetiva/, /^Só conversar/])
      expect(await artefatosNoBanco(escolaId)).toBe(0)
      await escolha.getByRole('button', { name: /^Usar a ferramenta Atividade objetiva/ }).click()
      const cartao = professora.locator('[data-cartao-de-ferramenta="atividade_objetiva"]')
      await expect(cartao.getByLabel('Turma e disciplina').locator('option:checked')).toHaveText(`${turmaA} · ${DISCIPLINA}`)
      await gerarAtividade(cartao, false, '5')
      const resultado = cartao.locator('[data-motor="pronto"]')
      await expect(resultado.locator('ol > li')).toHaveCount(5)
      await expect(resultado.getByRole('button', { name: new RegExp(`^Fonte: ${TITULO_DO_MATERIAL}, p\\. [1-6]$`) })).toHaveCount(5)
      await expect(resultado.locator('[data-selo-ia]')).toHaveCount(1)

      await resultado.getByRole('link', { name: 'Abrir o artefato' }).click()
      await expect(professora.getByRole('heading', { level: 1, name: PRIMEIRA })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      const baixado = professora.waitForEvent('download')
      await professora.getByRole('button', { name: 'Exportar em PDF' }).click()
      const arquivo = await baixado
      expect(arquivo.suggestedFilename()).toBe('atividade-estequiometria.pdf')
      expect(await arquivo.failure()).toBeNull()

      await professora.getByRole('button', { name: 'Pedir versão adaptada' }).click()
      const formulario = professora.locator('[data-motor="formulario"]')
      await expect(formulario.getByLabel('Atividade de origem').locator('option:checked')).toContainText(PRIMEIRA, { timeout: PRAZO_DA_ENTRADA_MS })
      // O tipo de adaptação, nunca texto livre sobre o aluno (D35, D67).
      await expect(formulario.locator('textarea, input:not([type="checkbox"])')).toHaveCount(0)
      await formulario.getByRole('checkbox', { name: 'Fonte ampliada', exact: true }).check()
      await formulario.getByRole('checkbox', { name: 'Tempo adicional', exact: true }).check()
      await formulario.getByRole('button', { name: 'Gerar versão adaptada' }).click()
      const pronto = professora.locator('[data-motor="pronto"]')
      await expect(pronto.locator('[data-aprovacao="pendente"]')).toHaveText('Esperando você', { timeout: PRAZO_DA_IA_MS })
      expect(await entregasNoBanco(escolaId)).toEqual([{ tipo: 'versao_adaptada', funcao: 'adaptacao', estado: 'pendente', decididaPor: null, decidida: false, justificativa: null }])

      await pronto.getByRole('link', { name: 'Ver e decidir em Seu time' }).click()
      const pendente = professora.locator('[data-entrega="pendente"]')
      await pendente.getByRole('button', { name: /^Aprovar/ }).click({ timeout: PRAZO_DA_ENTRADA_MS })
      const aprovar = professora.getByRole('alertdialog', { name: 'Aprovar a versão adaptada' })
      await aprovar.getByRole('button', { name: 'Aprovar a versão adaptada' }).click()
      await expect(professora.locator('[data-entrega="aprovada"] [data-aprovacao="aprovada"]')).toContainText(new RegExp(`^Aprovada por ${helena.nome} · \\d{2}/\\d{2}, \\d{2}h\\d{2}$`), {
        timeout: PRAZO_DA_ENTRADA_MS,
      })
      expect(await entregasNoBanco(escolaId)).toEqual([{ tipo: 'versao_adaptada', funcao: 'adaptacao', estado: 'aprovada', decididaPor: helenaId, decidida: true, justificativa: null }])
    })

    // ── 6. Passo 3: aplicar como avaliação; a aluna responde na tela, os colegas pela API (A3). ────────────────────
    const primeira = await atividadeNoBanco(escolaId, PRIMEIRA)
    const anaId = await alunoDaMatricula(escolaId, ana.matricula)
    // A Ana erra a primeira questão de cada habilidade e acerta as outras: é o que o Tutor vai lembrar no passo 5.
    const habilidadesVistas = new Set<string>()
    const respostasDaAna = primeira.questoes.map((questao) => {
      const erra = !habilidadesVistas.has(questao.habilidade)
      habilidadesVistas.add(questao.habilidade)
      return erra ? (questao.gabarito + 1) % 4 : questao.gabarito
    })
    const acertosDaAna = respostasDaAna.filter((resposta, indice) => resposta === primeira.questoes[indice]?.gabarito).length

    const primeiraAplicadaId = await test.step('a professora aplica a primeira atividade como avaliação, e a aluna responde uma por vez e envia', async () => {
      await irPelaNavegacao(professora, 'Ferramentas', false)
      await professora.locator('[data-artefato]').filter({ hasText: 'Atividade objetiva · ' }).first().click({ timeout: PRAZO_DA_ENTRADA_MS })
      await expect(professora.getByRole('heading', { level: 1, name: PRIMEIRA })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      const naTurma = professora.locator('[data-aplicacao-do-artefato]')
      await naTurma.getByRole('button', { name: 'Aplicar à turma' }).click()
      const aplicar = professora.getByRole('alertdialog', { name: 'Aplicar à turma' })
      await aplicar.getByRole('radio', { name: /^É avaliativa/ }).check()
      await aplicar.getByRole('button', { name: 'Aplicar à turma' }).click()
      await expect(naTurma.locator('[data-atividade-aplicada="aberta"]')).toContainText('Aberta para a turma · avaliativa · 0 de 3 alunos enviaram', { timeout: PRAZO_DA_ENTRADA_MS })
      const aplicadaId = await aplicacaoDoArtefato(escolaId, primeira.id)

      await aluna.reload()
      const naLista = principal(aluna).getByRole('region', { name: 'Para responder' }).getByRole('link', { name: new RegExp(PRIMEIRA) })
      // Avaliação: o Tutor fica pausado, e a lista avisa antes de abrir.
      await expect(naLista).toContainText('Avaliação: o Tutor fica pausado até quem dá a aula encerrar.', { timeout: PRAZO_DA_ENTRADA_MS })
      await expect(naLista).toContainText(`${DISCIPLINA} · 5 questões`)
      await naLista.click()
      await expect(principal(aluna).getByRole('heading', { level: 1, name: PRIMEIRA })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      await expect(principal(aluna).getByRole('link', { name: 'Pedir ajuda ao Tutor nesta questão' })).toHaveCount(0)
      for (const [indice, alternativa] of respostasDaAna.entries()) {
        await principal(aluna).locator(`[data-alternativa="${String(alternativa)}"]`).click()
        await expect
          .poll(async () => (await respostasNoBanco(escolaId, aplicadaId, anaId)).length, { timeout: PRAZO_DA_ENTRADA_MS, message: `resposta da questão ${String(indice + 1)} no servidor` })
          .toBe(indice + 1)
        if (indice < respostasDaAna.length - 1) await principal(aluna).getByRole('button', { name: 'Próxima' }).click()
      }
      expect(await respostasNoBanco(escolaId, aplicadaId, anaId)).toEqual(respostasDaAna.map((alternativa, indice) => ({ questao: indice + 1, alternativa })))
      // A prova que a aluna recebeu não traz gabarito nem explicação.
      await expect(principal(aluna)).not.toContainText(/gabarito|explicação/i)
      await principal(aluna).getByRole('button', { name: 'Enviar a atividade' }).click()
      const enviar = aluna.getByRole('alertdialog', { name: 'Enviar a atividade?' })
      await expect(enviar).toContainText('Nenhuma questão em branco')
      await enviar.getByRole('button', { name: 'Enviar a atividade' }).click()
      await expect(principal(aluna).getByRole('heading', { name: 'Atividade enviada' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      // Antes da aprovação, o aluno não vê resultado nenhum.
      await expect(principal(aluna).locator('[data-resultado="aguardando"]')).toContainText('Quem dá a aula ainda vai revisar a correção.', { timeout: PRAZO_DA_ENTRADA_MS })
      await expect(principal(aluna)).not.toContainText(/Seu resultado|Você acertou/)

      // O Bruno responde tudo e envia; a Carla abre e não responde.
      await responderPelaApi(request, await entrarComoAlunoPelaApi(request, { slug, ...bruno }), aplicadaId, primeira.questoes.map((questao) => questao.gabarito))
      await responderPelaApi(request, await entrarComoAlunoPelaApi(request, { slug, ...carla }), aplicadaId, primeira.questoes.map(() => null), { enviar: false })
      return aplicadaId
    })

    // ── 7. Passo 4: encerrar, abrir os destaques, aprovar com a validação; a turma e o diagnóstico (A3; D46, D56). ─
    await test.step('a professora encerra, abre cada destaque e aprova com a validação registrada', async () => {
      await professora.reload()
      const aberta = professora.locator('[data-aplicacao-do-artefato] [data-atividade-aplicada="aberta"]')
      await expect(aberta).toContainText('2 de 3 alunos enviaram', { timeout: PRAZO_DA_ENTRADA_MS })
      await aberta.getByRole('button', { name: 'Encerrar a atividade' }).click()
      const encerrar = professora.getByRole('alertdialog', { name: 'Encerrar a atividade' })
      await encerrar.getByRole('button', { name: 'Encerrar a atividade' }).click()
      await expect(encerrar).toBeHidden({ timeout: PRAZO_DA_IA_MS })
      const revisar = professora.locator('[data-atividade-aplicada="encerrada"]').getByRole('link', { name: 'Revisar a correção' })
      await revisar.click({ timeout: PRAZO_DA_ENTRADA_MS })
      await expect(professora).toHaveURL(new RegExp(`/professor/aprovar/${primeiraAplicadaId}$`))

      await expect(principal(professora)).toContainText('3 alunos responderam · 3 na turma hoje', { timeout: PRAZO_DA_ENTRADA_MS })
      const doEmBranco = professora.locator('[data-destaque]').filter({ hasText: carla.nome })
      await expect(doEmBranco).toContainText('Em branco')
      const barra = professora.getByRole('group', { name: 'Aprovação do lote' })
      const aprovar = barra.getByRole('button', { name: 'Aprovar 3 correções' })
      const fechados = professora.locator('[data-destaque="fechado"]')
      const quantos = await fechados.count()
      expect(quantos).toBeGreaterThanOrEqual(1)
      for (let aberto = 0; aberto < quantos; aberto += 1) {
        // O botão só liga depois do último destaque aberto (D56).
        await expect(aprovar).toBeDisabled()
        await fechados.first().getByRole('button', { name: /^Abrir/ }).click()
        await expect(professora.locator('[data-destaque="aberto"]')).toHaveCount(aberto + 1, { timeout: PRAZO_DA_ENTRADA_MS })
      }
      await expect(aprovar).toBeEnabled()
      await expect(principal(professora)).not.toContainText(VOCABULARIO_DE_NOTA)
      await aprovar.click()
      const confirmar = professora.getByRole('alertdialog', { name: 'Aprovar 3 correções' })
      await expect(confirmar).toContainText('O diagnóstico por habilidade chega aos alunos da turma.')
      await confirmar.getByRole('button', { name: 'Aprovar 3 correções' }).click()
      await expect(professora.locator('[data-situacao-do-lote="aprovada"] [data-aprovacao="aprovada"]')).toContainText(`Validação registrada por ${helena.nome}`, { timeout: PRAZO_DA_ENTRADA_MS })
      expect(await validacoesNoBanco(escolaId)).toEqual([{ confirmadaPor: helenaId, apresentados: quantos, abertos: quantos }])
      expect(await entregasNoBanco(escolaId)).toEqual(
        expect.arrayContaining([
          { tipo: 'versao_adaptada', funcao: 'adaptacao', estado: 'aprovada', decididaPor: helenaId, decidida: true, justificativa: null },
          { tipo: 'lote_de_correcao', funcao: 'correcao_de_objetiva', estado: 'aprovada', decididaPor: helenaId, decidida: true, justificativa: null },
        ]),
      )
    })

    await test.step('a turma mostra o acerto por habilidade, e a aluna vê o diagnóstico, com quem aprovou, sem nota', async () => {
      await irPelaNavegacao(professora, 'Turmas', false)
      await principal(professora).getByRole('link', { name: `Abrir a turma ${turmaA}` }).click()
      const habilidades = professora.getByRole('region', { name: 'Acerto por habilidade' })
      await expect(habilidades).toContainText(/\d+ de \d+/, { timeout: PRAZO_DA_ENTRADA_MS })
      const porAluno = professora.getByRole('region', { name: 'Por aluno' })
      for (const aluno of [ana, bruno, carla]) await expect(porAluno).toContainText(aluno.nome)
      await expect(principal(professora)).not.toContainText(VOCABULARIO_DE_NOTA)

      await aluna.reload()
      const resultado = principal(aluna).getByRole('region', { name: 'Seu resultado' })
      await expect(resultado).toContainText(`Você acertou ${String(acertosDaAna)} de 5 questões.`, { timeout: PRAZO_DA_ENTRADA_MS })
      await expect(resultado).toContainText(`Correção aprovada por ${helena.nome}`)
      await expect(resultado.getByRole('region', { name: 'Acertos por habilidade' })).toBeVisible()
      await expect(aluna.locator('body')).not.toContainText(PROIBIDO_NA_AREA_DO_ALUNO)
      await expect(principal(aluna)).not.toContainText('%')
      for (const colega of [bruno, carla]) await expect(aluna.locator('body')).not.toContainText(colega.nome)
    })

    // ── 8. Passo 5: o Tutor numa segunda atividade, e o sinal para a professora (A4; D47, D66, regra 70 item 7). ────
    await test.step('numa segunda atividade, a aluna pede a resposta ao Tutor: ele recusa, lembra do que ela errou e cita a página', async () => {
      await irPelaNavegacao(professora, 'Ferramentas', false)
      await professora.locator('[data-ferramenta="atividade_objetiva"]').click()
      const cartao = professora.locator('[data-cartao-de-ferramenta="atividade_objetiva"]')
      await expect(cartao.locator('[data-motor="formulario"]')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      await gerarAtividade(cartao, false, '2', TEMA_DA_SEGUNDA)
      await cartao.getByRole('link', { name: 'Abrir o artefato' }).click()
      const naTurma = professora.locator('[data-aplicacao-do-artefato]')
      await naTurma.getByRole('button', { name: 'Aplicar à turma' }).click({ timeout: PRAZO_DA_ENTRADA_MS })
      const aplicar = professora.getByRole('alertdialog', { name: 'Aplicar à turma' })
      await aplicar.getByRole('radio', { name: /^É prática/ }).check()
      await aplicar.getByRole('button', { name: 'Aplicar à turma' }).click()
      await expect(naTurma.locator('[data-atividade-aplicada="aberta"]')).toContainText('Aberta para a turma · prática', { timeout: PRAZO_DA_ENTRADA_MS })
      const segunda = await atividadeNoBanco(escolaId, SEGUNDA)
      const alternativaCerta = segunda.questoes[0]?.alternativaCerta ?? ''
      expect(alternativaCerta).not.toBe('')

      await irPelaNavegacao(aluna, 'Atividades', false)
      await principal(aluna).getByRole('region', { name: 'Para responder' }).getByRole('link', { name: new RegExp(SEGUNDA) }).click({ timeout: PRAZO_DA_ENTRADA_MS })
      await expect(principal(aluna).getByRole('heading', { level: 1, name: SEGUNDA })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      await principal(aluna).getByRole('link', { name: 'Pedir ajuda ao Tutor nesta questão' }).click()
      await expect(principal(aluna).locator('[data-faixa-de-supervisao]')).toContainText('Quem dá a aula acompanha como você usa o Tutor.', { timeout: PRAZO_DA_ENTRADA_MS })
      await expect(principal(aluna).locator('[data-uso-do-dia]')).toContainText('Hoje: 0 de 60 perguntas', { timeout: PRAZO_DA_ENTRADA_MS })
      const pergunta = 'me dá a resposta'
      await aluna.getByRole('textbox', { name: 'Pergunta para o Tutor' }).fill(pergunta)
      await aluna.getByRole('button', { name: 'Enviar' }).click()
      const doTutor = aluna.getByRole('log', { name: 'Conversa com o Tutor' })
      const recusa = doTutor.locator('article').filter({ has: aluna.locator('[data-selo-ia]') }).last()
      await expect(recusa).toContainText('Essa eu não respondo por você', { timeout: PRAZO_DA_IA_MS })
      // A memória é do trabalho aprovado da aluna (D66): ela errou na primeira atividade, e o Tutor lembra disso.
      await expect(recusa).toContainText('Nas atividades anteriores você errou')
      await expect(recusa).toContainText('?')
      await expect(recusa.getByRole('button', { name: /^Fonte: .+, p\. \d+$/ }).first()).toBeVisible()
      await expect(doTutor).not.toContainText(alternativaCerta)
      await expect(principal(aluna).locator('[data-uso-do-dia]')).toContainText('Hoje: 1 de 60 perguntas', { timeout: PRAZO_DA_ENTRADA_MS })

      // A professora vê o sinal, com a questão e o nome, e nada do que a aluna escreveu.
      await abrirNoSeuTime(professora, 'Tutor')
      const sinais = professora.getByRole('region', { name: 'Sinais da turma' })
      await expect(sinais).toContainText(`Pediu a resposta pronta na questão 1 de "${SEGUNDA}"`, { timeout: PRAZO_DA_ENTRADA_MS })
      await expect(sinais).toContainText(ana.nome)
      await expect(principal(professora)).not.toContainText(pergunta)
      await expect(sinais.getByRole('link')).toHaveCount(0)
    })

    // ── 9. Passo 6: a governança, a suspensão por função, o Analista e o nominal com auditoria (A5; D9, D45, D64). ─
    const coordenadoraId = await usuarioDaEquipe(escolaId, coordenadora.email)
    await test.step('a coordenação vê o que a IA gerou e que uma pessoa aprovou, em agregado e sem nome de ninguém', async () => {
      await irPelaNavegacao(coordenacao, 'Governança', false)
      await esperarGovernanca(coordenacao)
      // Três artefatos (as duas atividades e a versão adaptada) e um lote; aprovados a versão e o lote.
      await expect(numeroDoPainel(coordenacao, 'Gerado por IA')).toContainText('4', { timeout: PRAZO_DA_ENTRADA_MS })
      await expect(numeroDoPainel(coordenacao, 'Aprovado por gente')).toContainText('2')
      await expect(numeroDoPainel(coordenacao, 'Esperando o professor')).toContainText('0')
      await expect(numeroDoPainel(coordenacao, 'Rejeitado')).toContainText('0')
      const tabela = principal(coordenacao).getByRole('region', { name: 'O que a IA gerou e quem aprovou' }).first()
      await expect(tabela).toContainText('Correção de objetiva de uma turma')
      await expect(tabela).toContainText('Assistente de ensino · Adaptação')
      await expect(tabela).toContainText(SERIE)
      await expect(principal(coordenacao).getByRole('columnheader', { name: /professor/i })).toHaveCount(0)
      for (const nome of [helena.nome, marta.nome, davi.nome, ana.nome, bruno.nome, carla.nome, turmaA]) await expect(principal(coordenacao)).not.toContainText(nome)
      await expect(principal(coordenacao).getByRole('region', { name: 'Consumo do mês por função' })).toContainText('Assistente de ensino · Conversa e ferramentas')
    })

    await test.step('a coordenação suspende a Adaptação, o servidor recusa, e ela retoma, com tudo na auditoria', async () => {
      await irPelaNavegacao(coordenacao, 'Agentes', false)
      for (const agente of ['Assistente de ensino', 'Tutor', 'Analista de desempenho escolar']) {
        await expect(principal(coordenacao).getByRole('heading', { level: 2, name: agente })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
      }
      const adaptacao = principal(coordenacao).locator('[data-funcao="adaptacao"]')
      await adaptacao.getByRole('button', { name: 'Suspender a função Adaptação' }).click()
      const suspender = coordenacao.getByRole('alertdialog')
      await suspender.getByLabel('Motivo').selectOption({ label: 'A escola está revendo o uso pedagógico' })
      await suspender.getByRole('button', { name: 'Suspender Adaptação' }).click()
      await expect(adaptacao).toContainText('Suspensa nesta escola desde', { timeout: PRAZO_DA_ENTRADA_MS })
      await expect(principal(coordenacao).locator('[data-funcao="correcao_de_objetiva"]')).toContainText('Funcionando')

      // A suspensão vale no servidor: o pedido de versão adaptada da professora é recusado, e nada novo nasce.
      const segunda = await atividadeNoBanco(escolaId, SEGUNDA)
      const tokenDaHelena = await tokenDaEquipe(request, helena.email, senha)
      expect(await erroAoPedirVersaoAdaptada(request, tokenDaHelena, segunda.id)).toBe('FUNCAO_SUSPENSA')
      expect(await entregasNoBanco(escolaId)).toHaveLength(2)

      await adaptacao.getByRole('button', { name: 'Retomar a função Adaptação' }).click()
      await expect(adaptacao).toContainText('Funcionando', { timeout: PRAZO_DA_ENTRADA_MS })
      expect(await suspensoesNoBanco(escolaId, 'adaptacao')).toEqual([{ suspensaPor: coordenadoraId, motivo: 'revisao_pedagogica', retomada: true }])
      expect((await auditoriasNoBanco(escolaId, 'funcao.suspensa')).map((registro) => registro.autor)).toEqual([coordenadoraId])
      expect((await auditoriasNoBanco(escolaId, 'funcao.retomada')).map((registro) => registro.autor)).toEqual([coordenadoraId])
    })

    await test.step('o Analista gera o resumo com número, graças às duas professoras de Química, e o nominal pede finalidade e fica na auditoria', async () => {
      await irPelaNavegacao(coordenacao, 'Analista', false)
      await expect(principal(coordenacao)).toContainText('Nenhum resumo gerado ainda', { timeout: PRAZO_DA_ENTRADA_MS })
      await principal(coordenacao).getByRole('button', { name: 'Gerar resumo' }).click()
      const resumo = principal(coordenacao).locator('[data-resumo-do-analista]')
      await expect(resumo).toBeVisible({ timeout: PRAZO_DA_IA_MS })
      await expect(resumo.getByRole('region', { name: `${SERIE} · ${DISCIPLINA}` })).toContainText('2 professores no recorte')
      await expect(resumo).toContainText('É uma hipótese a conferir, não uma conclusão')
      for (const nome of [helena.nome, marta.nome, davi.nome, ana.nome, bruno.nome, carla.nome, turmaA]) await expect(principal(coordenacao)).not.toContainText(nome)

      await principal(coordenacao).getByRole('button', { name: 'Abrir dado nominal de uma turma' }).click()
      const nominal = coordenacao.getByRole('alertdialog')
      await expect(nominal).toContainText('Esta abertura fica na auditoria da escola')
      expect(await auditoriasNoBanco(escolaId, 'analista.nominal_lido')).toEqual([])
      await nominal.getByLabel('Turma').selectOption({ label: `${turmaA} · ${SERIE}` })
      await nominal.getByLabel('Finalidade').selectOption({ label: 'Conversa pedagógica com o professor, a pedido dele' })
      await nominal.getByRole('button', { name: 'Abrir dado nominal' }).click()
      const dado = principal(coordenacao).getByRole('region', { name: `Dado nominal da turma ${turmaA}` })
      await expect(dado).toContainText('Esta abertura foi registrada na auditoria da escola.', { timeout: PRAZO_DA_ENTRADA_MS })
      await expect(dado).toContainText(helena.nome)
      await expect(dado).toContainText(davi.nome)
      // Só os professores da turma aberta, e nenhum aluno.
      await expect(dado).not.toContainText(marta.nome)
      for (const aluno of [ana, bruno, carla]) await expect(dado).not.toContainText(aluno.nome)
      expect(await auditoriasNoBanco(escolaId, 'analista.nominal_lido')).toEqual([{ autor: coordenadoraId, entidadeId: turmaAId, finalidade: 'conversa_pedagogica_a_pedido_do_professor' }])
    })
  })
})

