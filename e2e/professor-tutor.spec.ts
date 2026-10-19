import { randomUUID } from 'node:crypto'
import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { ALUNOS_DO_LOTE, erroDaApi } from './__fixtures__/assistente.ts'
import { PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { principal } from './__fixtures__/fluxo-do-professor.ts'
import { abrirOSino, acionar, entrar, PRAZO_DA_TELA_MS } from './__fixtures__/professor/cena.ts'
import { peDoSino } from './__fixtures__/professor/sino.ts'
import { abrirSinaisDoTutor } from './__fixtures__/professor/tutor.ts'
import { larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'
import { expect, test } from './__fixtures__/perfis.ts'

/**
 * O Tutor visto pela professora (11.4, A4, pacote W): sinais, atenção humana e uso da turma, na tela que o pé do sino abre. Separado de
 * `professor-turma.spec.ts` pela 2.5.
 */

test.describe('Seu time com a correção e o Tutor (11.4)', () => {
  test('o Tutor na lateral, sem contador; a conversa dele mostra sinais e uso da turma, a atenção humana à parte e sem conteúdo, e nada abre a conversa de um aluno', async ({ page, hasTouch }) => {
    test.slow()
    const atividade = { id: randomUUID(), titulo: 'Atividade de estequiometria' }
    const [ana, bruno, caio] = ALUNOS_DO_LOTE.map((aluno) => ({ id: aluno.alunoId, nome: aluno.nome }))
    if (ana === undefined || bruno === undefined || caio === undefined) throw new Error('faltou aluno sintético')
    const { api, turmaId } = await entrar(page, hasTouch)

    await abrirSinaisDoTutor(page, hasTouch)
    await expect(page).toHaveURL(/\/professor\/time\/tutor$/)
    await expect(page).toHaveTitle('Tutor · Turmma', { timeout: PRAZO_DA_TELA_MS })

    // Sem sinal e sem uso, a tela não fica vazia: diz o que o Tutor avisa, e que ninguém usou ainda.
    await expect(page.getByText('Nenhum sinal desta turma ainda')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(page.getByText('Nenhum aluno desta turma usou o Tutor ainda')).toBeVisible()
    await expect(principal(page).locator('[data-selo-ia]')).toHaveCount(1)
    expect(await violacoesGraves(page)).toEqual([])

    // A turma passa a ter atividade, sinais e uso; e a leitura dos sinais falha: a mensagem e "Tentar de novo".
    api.aplicadas = [{ id: atividade.id, artefatoId: randomUUID(), turmaId, titulo: atividade.titulo, avaliativa: false, estado: 'aberta', questoes: 5, aplicadaEm: '2026-10-05T13:00:00.000Z', encerradaEm: null, participacao: { alunos: 30, iniciaram: 20, enviaram: 3 }, entrega: null }]
    api.sinais = {
      itens: [
        { id: randomUUID(), tipo: 'atencao_humana', aluno: caio, criadoEm: '2026-10-05T13:40:00.000Z' },
        { id: randomUUID(), tipo: 'travou', aluno: ana, atividadeAplicadaId: atividade.id, questao: 3, materialId: null, pagina: null, criadoEm: '2026-10-05T13:20:00.000Z' },
        { id: randomUUID(), tipo: 'resposta_pronta', aluno: bruno, atividadeAplicadaId: atividade.id, questao: 1, materialId: null, pagina: null, criadoEm: '2026-10-05T13:25:00.000Z' },
      ],
      grupos: [{ tipo: 'travou', atividadeAplicadaId: atividade.id, questao: 3, alunos: 8 }],
    }
    api.uso = {
      turmaId,
      limiteDoDia: 60,
      trocasDaTurmaNoMes: 412,
      pacoteDaTurmaNoMes: 9000,
      alunos: [
        { aluno: ana, trocasHoje: 12, ultimaTrocaEm: '2026-10-05T13:42:00.000Z', ultimaReferencia: { atividadeAplicadaId: atividade.id, questao: 3, materialId: null, pagina: null } },
        { aluno: bruno, trocasHoje: 2, ultimaTrocaEm: '2026-10-05T13:26:00.000Z', ultimaReferencia: { atividadeAplicadaId: null, questao: null, materialId: null, pagina: null } },
      ],
    }
    api.trocar('sinais', () => erroDaApi(503, 'INDISPONIVEL_TENTE_DE_NOVO'))
    await page.reload()
    await expect(page.getByRole('region', { name: 'Sinais da turma' }).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })

    // Com dado.
    api.trocar('sinais')
    await acionar(page.getByRole('region', { name: 'Sinais da turma' }).getByRole('button', { name: 'Tentar de novo' }), hasTouch)

    // A atenção humana vem à parte, no alto: quem e quando, sem conteúdo e sem caminho para conversa.
    const atencao = page.locator('[data-atencao-humana]')
    await expect(atencao).toContainText('Um aluno precisa de um adulto', { timeout: PRAZO_DA_TELA_MS })
    await expect(atencao).toContainText('Caio Sintético · 05/10, 10h40')
    await expect(atencao).toContainText('O que foi dito não aparece aqui')
    await expect(atencao.getByRole('link')).toHaveCount(0)
    await expect(atencao.getByRole('button')).toHaveCount(0)

    // O grupo, sem nome de ninguém, assinado pela função do Tutor; e os sinais por aluno, com a questão.
    const sinais = page.getByRole('region', { name: 'Sinais da turma' })
    await expect(sinais.getByRole('log')).toContainText('8 alunos travaram na questão 3 de "Atividade de estequiometria".')
    await expect(sinais.getByRole('log').getByText('Tutor · sinais para o professor')).toBeVisible()
    await expect(sinais).toContainText('Travou na questão 3 de "Atividade de estequiometria"')
    await expect(sinais).toContainText('Pediu a resposta pronta na questão 1 de "Atividade de estequiometria"')
    // A atenção humana não se repete entre os sinais de trabalho.
    await expect(sinais).not.toContainText('Caio Sintético')

    // O uso: por aluno, as trocas de hoje, a hora da última troca como hora, e em que estava.
    const uso = page.getByRole('region', { name: 'Uso do Tutor pela turma' })
    await expect(uso).toContainText('412 de 9000')
    await expect(uso).toContainText('12 de 60')
    await expect(uso).toContainText('05/10, 10h42')
    await expect(uso).toContainText('Na questão 3 de "Atividade de estequiometria"')
    await expect(uso).toContainText('Sem atividade nem material')
    // Sem tempo relativo, sem ociosidade, sem lista de quem não usou.
    await expect(principal(page)).not.toContainText(/há \d+ (min|hora|segundo)|ocios|não usou|não usaram/i)
    // Nada nesta tela abre a conversa de um aluno: nos sinais e no uso não há link nem botão.
    await expect(sinais.getByRole('link')).toHaveCount(0)
    await expect(uso.getByRole('link')).toHaveCount(0)
    await expect(uso.getByRole('button')).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])

    // O cabeçalho diz o que o Tutor faz sozinho, com o texto da API, e quando ele avisa.
    await acionar(page.getByText('O que o Tutor faz sozinho, e o que você vê aqui'), hasTouch)
    await expect(page.locator('[data-funcao="sinais_para_o_professor"]')).toBeVisible()
    await expect(principal(page)).toContainText('Travou: a quarta troca seguida na mesma questão ou página, no mesmo dia.')
    // O Tutor não espera ninguém: o link dele no pé do sino não leva número.
    await abrirOSino(page, hasTouch)
    await expect(peDoSino(page).getByRole('link', { name: 'O que o Tutor viu' })).toHaveAccessibleName('O que o Tutor viu')
  })
})
