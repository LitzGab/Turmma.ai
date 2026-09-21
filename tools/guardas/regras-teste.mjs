/**
 * Guarda dos testes que derrubam e levantam serviço do compose (regra 40, e regra 80 item 2).
 *
 * `docker compose start` devolve quando o Docker aceitou o comando, **não** quando o serviço
 * responde. Um teste que sobe o serviço e vai direto para o `expect.poll` paga a subida do container
 * com o mesmo orçamento que deveria medir só a regra — e a subida cresce com a carga da máquina.
 * Numa esteira com quatro tarefas em paralelo, ela sozinha passa do prazo, e o vermelho não reproduz
 * na máquina de quem escreveu o teste.
 *
 * Foi a causa de três correções em cinco dias (16/09, 18/09 e 20/09 de 2026) e, na retrospectiva do
 * F1, de sete das oito correções fora de tarefa. A regra é simples: quem sobe um serviço espera ele
 * ficar são antes de medir qualquer coisa.
 */

/** Como se sobe um serviço nos testes. `restart` também conta: o serviço volta do zero. */
const COMANDOS_QUE_SOBEM = new Set(['start', 'up', 'restart'])
/**
 * Quem chama o compose nos testes (`tools/testes/compose.ts`). A lista cobre as variantes assíncronas
 * mesmo sem uso hoje: deixar uma de fora é o furo pelo qual a classe volta.
 */
const CHAMADAS_DE_COMPOSE = new Set(['compose', 'composeOuFalha', 'composeAssincrono', 'composeAssincronoCom', 'composeAssincronoOuFalha'])
const ESPERA = 'aguardarSaudavel'

export const MENSAGEM_ESPERAR_SERVICO =
  `Depois de subir um serviço do compose, espere-o ficar são com \`${ESPERA}('<serviço>')\` antes de medir qualquer coisa. ` +
  'Sem isso, a subida do container gasta o orçamento do teste e o vermelho só aparece na esteira carregada (regra 40).'

/** O nome do serviço, quando é literal. Argumento montado em variável não é analisável: não reprova. */
function servicos(no) {
  return no.arguments
    .slice(1)
    .filter((argumento) => argumento.type === 'Literal' && typeof argumento.value === 'string')
    .map((argumento) => argumento.value)
    .filter((valor) => !valor.startsWith('-'))
}

function comandoDeSubida(no) {
  const callee = no.callee
  const nome = callee.type === 'Identifier' ? callee.name : null
  if (nome === null || !CHAMADAS_DE_COMPOSE.has(nome)) return null
  const primeiro = no.arguments[0]
  if (primeiro?.type !== 'Literal' || typeof primeiro.value !== 'string') return null
  if (!COMANDOS_QUE_SOBEM.has(primeiro.value)) return null
  // `up --wait` já espera a saúde: é o próprio compose que segura, e o teste não paga a subida.
  const temEspera = no.arguments.some((argumento) => argumento.type === 'Literal' && argumento.value === '--wait')
  return temEspera ? null : servicos(no)
}

/** O corpo onde a chamada está, para procurar a espera nas instruções seguintes. */
function instrucaoQueContem(no) {
  let atual = no
  while (atual.parent && atual.parent.type !== 'BlockStatement' && atual.parent.type !== 'Program') atual = atual.parent
  return atual.parent ? { instrucao: atual, corpo: atual.parent.body } : null
}

function esperaAlgumServico(texto, servicosSubidos) {
  if (!texto.includes(`${ESPERA}(`)) return false
  // `aguardarSaudavel` com o serviço em variável ou em laço conta: o que se quer é que a espera exista.
  return servicosSubidos.length === 0 || servicosSubidos.some((servico) => texto.includes(servico)) || !/'|"/.test(texto.split(`${ESPERA}(`)[1] ?? '')
}

export const esperarServicoDoCompose = {
  meta: {
    type: 'problem',
    docs: { description: `Exige ${ESPERA} depois de subir um serviço do compose num teste (regra 40).` },
    schema: [],
    messages: { esperar: MENSAGEM_ESPERAR_SERVICO },
  },
  create(context) {
    const codigo = context.sourceCode ?? context.getSourceCode()
    return {
      CallExpression(no) {
        const servicosSubidos = comandoDeSubida(no)
        if (servicosSubidos === null) return
        const posicao = instrucaoQueContem(no)
        if (!posicao) return
        const daqui = posicao.corpo.slice(posicao.corpo.indexOf(posicao.instrucao))
        const textoSeguinte = daqui.map((instrucao) => codigo.getText(instrucao)).join('\n')
        if (!esperaAlgumServico(textoSeguinte, servicosSubidos)) context.report({ node: no, messageId: 'esperar' })
      },
    }
  },
}
