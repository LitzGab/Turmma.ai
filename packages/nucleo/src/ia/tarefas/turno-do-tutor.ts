import { esquemaCitacao, esquemaHabilidade, type Citacao } from '@educa/shared'
import { z } from 'zod'
import {
  dadoEmJson,
  dadosDosTrechos,
  esquemaContextoDaTurma,
  esquemaTrecho,
  extrairFatos,
  fatoCitadoNoTexto,
  fraseMaisProxima,
  frasesDoMaterial,
  problemasDasCitacoes,
  type FraseDoMaterial,
} from '../material.js'
import { PROMPT_TURNO_DO_TUTOR } from '../prompts/turno-do-tutor.js'
import { definirTarefa } from '../tarefa.js'
import { contemTexto, cortar, normalizar, palavras, palavrasDeConteudo, semPontoFinal } from '../texto.js'

/**
 * A classificação é do **pedido**, pelo que o aluno escreveu, e é fechada: não existe valor para humor, atenção,
 * esforço ou qualquer leitura da pessoa (D57). É dela que o pacote do Tutor tira os sinais para o professor.
 */
export const CLASSIFICACOES_DO_TURNO = ['normal', 'pediu_resposta_pronta', 'assunto_delicado', 'fora_do_escopo'] as const
export type ClassificacaoDoTurno = (typeof CLASSIFICACOES_DO_TURNO)[number]

/**
 * A questão em que o aluno está, **sem gabarito e sem explicação**: o objeto é estrito, então mandar qualquer um
 * dos dois é entrada inválida. O Tutor não tem como entregar o que não recebeu, em nenhum estado da atividade.
 */
const esquemaQuestaoEmAndamento = z.strictObject({
  numero: z.number().int().min(1).max(20),
  enunciado: z.string().min(1).max(1200),
  alternativas: z.array(z.string().min(1).max(400)).length(4),
  habilidade: esquemaHabilidade,
})

/**
 * A memória é do **trabalho** do aluno: acertos e erros por habilidade (D66). Só números e a habilidade do catálogo;
 * não há campo de texto, e por isso não há onde escrever sobre o jeito, o humor ou o comportamento dele.
 */
const esquemaMemoriaDoTrabalho = z.strictObject({
  habilidade: esquemaHabilidade,
  acertos: z.number().int().min(0),
  erros: z.number().int().min(0),
})

export const esquemaEntradaDoTutor = z.strictObject({
  /** O que o aluno escreveu agora. Vai ao modelo como dado, nunca como instrução. */
  duvida: z.string().min(1).max(2000),
  contexto: esquemaContextoDaTurma,
  /** Os trechos do material da turma que a busca achou para a dúvida. O Tutor só fala a partir deles. */
  trechos: z.array(esquemaTrecho).max(8),
  questao: esquemaQuestaoEmAndamento.optional(),
  memoria: z.array(esquemaMemoriaDoTrabalho).max(12),
  /** Os últimos turnos desta conversa, para o Tutor não repetir a mesma pergunta. O histórico inteiro não vem (D66). */
  turnosAnteriores: z.array(z.strictObject({ autor: z.enum(['aluno', 'tutor']), texto: z.string().min(1).max(2000) })).max(8),
})
export type EntradaDoTutor = z.infer<typeof esquemaEntradaDoTutor>

export const esquemaSaidaDoTutor = z.strictObject({
  classificacao: z.enum(CLASSIFICACOES_DO_TURNO),
  resposta: z.string().min(1).max(1500),
  citacoes: z.array(esquemaCitacao).max(3),
})
export type SaidaDoTutor = z.infer<typeof esquemaSaidaDoTutor>

/**
 * As duas mensagens fixas do assunto delicado (D36). O Tutor não aconselha e não continua o assunto: acolhe em uma
 * frase, diz que é uma IA e aponta para um adulto da escola. Com menção a risco à vida, o 188 do CVV vem primeiro.
 *
 * Rascunho da fatia de apresentação: o texto e a lista de gatilhos passam pelo `conformidade-reviewer` e pelo
 * `pedagogia-reviewer`, e a escola revisa o texto, antes de aluno real (`docs/agentes.md`).
 */
export const MENSAGEM_DE_ASSUNTO_DELICADO = [
  'Obrigado por me contar. Isso é importante, e eu sou uma inteligência artificial: não sou quem pode ajudar você nisso.',
  'Procure hoje seu professor ou a orientação educacional da escola. Eles podem ajudar de verdade.',
  'Se você estiver em perigo ou pensando em se machucar, ligue 188 (CVV). A ligação é gratuita e funciona a qualquer hora.',
  'Seu professor vai receber um aviso de que você precisa de atenção, sem o que você escreveu.',
].join('\n\n')

export const MENSAGEM_DE_RISCO_A_VIDA = [
  'Obrigado por me contar. O que você escreveu é sério.',
  'Ligue agora para o 188 (CVV). A ligação é gratuita, funciona a qualquer hora, e quem atende é uma pessoa.',
  'Eu sou uma inteligência artificial e não sou quem pode ajudar você nisso. Procure hoje um adulto da escola: seu professor ou a orientação educacional.',
  'Seu professor vai receber um aviso de que você precisa de atenção, sem o que você escreveu.',
].join('\n\n')

/**
 * Os gatilhos são o que o aluno **escreveu**, com as palavras dele, comparado sem acento e sem maiúscula. Não há
 * inferência: frase que não diz nada disso não dispara, por mais que "pareça" triste (D36, D57).
 */
const GATILHOS_DE_RISCO_A_VIDA: readonly RegExp[] = [
  /\b(me matar|me mato|quero morrer|queria morrer|prefiro morrer|queria estar mort[oa]|nao quero mais viver|nao aguento mais viver)\b/,
  /\b(tirar|acabar com) (a )?minha (propria )?vida\b/,
  /\bsuicid\w*/,
  /\b(me cortar|me cortei|me corto|me cortando|me machucar de proposito|automutil\w*)\b/,
  /\b(vou|quero) matar (ele|ela|eles|elas|alguem|todo mundo|meu|minha)\b/,
]

const GATILHOS_DE_ASSUNTO_DELICADO: readonly RegExp[] = [
  /\b(apanho|apanhei|apanhando) (em casa|do meu|da minha)\b/,
  /\b(me bate|me batem|me bateu|bateram em mim|me agride|me agrediu|me agridem|me espanca|me espancou)\b/,
  /\b(abusa|abusou|abusaram) de mim\b/,
  /\b(sofri|sofro) abuso\b/,
  /\bfui (abusad|assediad|estuprad)[oa]\b/,
  /\bme (assedi|estupr)\w+/,
  /\b(sofro|sofri|sofrendo) bullying\b/,
  /\b(me ameaca|me ameacou|me ameacam|me ameacando|estao me ameacando)\b/,
  /\b(passando fome|nao tem comida em casa|sem comida em casa)\b/,
  /\b(fugir de casa|fugi de casa|expuls[oa] de casa)\b/,
  /\bbriguei (feio )?(em casa|com (meu|minha) (pai|mae|padrasto|madrasta))\b/,
  /\b(meu|minha) (pai|mae|avo|irmao|irma|amigo|amiga|tio|tia|primo|prima) (morreu|faleceu)\b/,
  // "não tô bem" e "tô mal" contam; "tô mal em química" é dúvida da matéria.
  /\bnao (to|tou|estou) bem\b(?! (em|na|no|nessa|nesse|nas|nos|de)\b)/,
  /\b(to|tou|estou) (muito )?mal\b(?! (em|na|no|nessa|nesse|nas|nos|de)\b)/,
  /\b(to|tou|estou) (muito )?triste\b/,
  /\bmedo de (ir|voltar) (pra|para) casa\b/,
  /\b(choro|chorando) todo dia\b/,
  /\b(tenho|estou com|to com|tou com) depressao\b/,
  /\bcrise de (panico|ansiedade)\b/,
  /\b(estou|to|tou) gravida\b/,
  /\b(usando|usei|uso) drogas?\b/,
  /\bninguem (gosta de mim|me entende|liga (pra|para) mim)\b/,
]

const PERGUNTAS_SOBRE_O_TUTOR: readonly RegExp[] = [
  /\b(voce|vc|tu) (e|eh) (uma? |o |a )?(pessoa|humano|humana|gente|robo|maquina|ia|inteligencia artificial|professor|professora|real|de verdade|meu amigo|minha amiga)\b/,
  /\bquem (e|eh) (voce|vc)\b/,
  /\btem (alguem|uma pessoa|gente) (ai|digitando|respondendo)\b/,
  /\b(falando|conversando) com (uma? )?(pessoa|maquina|robo|humano|ia)\b/,
  /\b(voce|vc) (gosta|ama|sente|sentiu)\b/,
  /\b(voce|vc) tem sentimentos?\b/,
]

/**
 * As três formas de tentar arrancar a resposta (regra 30, item 11): direta, disfarçada de conferência e fatiada.
 *
 * Esta classificação vira, para o professor, "pediu a resposta pronta" ao lado do nome do aluno. Por isso a regra é
 * estreita de propósito: marcar como pedido a dúvida legítima ("o mol de sódio é maior que o de cloro?") é dizer ao
 * professor uma coisa que o aluno não fez.
 *
 * Os pedidos diretos falam da resposta, do gabarito ou de resolver por ele, e valem sempre.
 */
const PEDIDOS_DIRETOS: readonly RegExp[] = [
  /\b(qual|quais) (e |eh |sao |seria )?(a |as |o )?(resposta|respostas|alternativa|letra|opcao|gabarito)\b/,
  /\b(da|de|diz|diga|fala|fale|passa|passe|manda|mande|conta|conte|mostra|mostre)( logo| so| ai)? (a |o |as )?(resposta|respostas|gabarito|alternativa certa|alternativa correta|letra certa)\b/,
  /\b(responde|responda|resolve|resolva|faz|faca) (isso |essa |a questao |o exercicio |a conta )?(pra|para|por) mim\b/,
  /\bgabarito\b/,
  /\bresposta pronta\b/,
  /\bso (quero|preciso d)a resposta\b/,
]

const POSICAO = '([a-d]|primeira|segunda|terceira|quarta|ultima)'
/** Depois da letra ou do ordinal vem o fim da frase, e não um nome: "é a segunda?" é palpite, "o que é a segunda etapa?" é dúvida. */
const FIM_DO_PALPITE = '( opcao| alternativa| letra)?(?=\\s*($|[?,.!]|ne\\b|certo\\b|mesmo\\b|ou\\b|e\\b))'

/**
 * A conferência de palpite e o pedido fatiado só são pedido de resposta **com uma questão em andamento**: "tá certo?",
 * "é a segunda?", "C ou D?" só pedem a resposta de uma questão quando há questão. Sem ela, pergunta sobre o conteúdo é dúvida.
 */
const CONFERENCIAS_DE_PALPITE: readonly RegExp[] = [
  new RegExp(`(?<!\\b(?:o que|qual) )\\b(e|eh|seria|sera|deve ser) a (letra |alternativa |opcao )?${POSICAO}${FIM_DO_PALPITE}`),
  new RegExp(`\\b(marquei|marcar|marco|chutei|coloquei|botei|vou de|fui na) (a |na )?(letra |alternativa |opcao )?${POSICAO}\\b`),
  /\ba resposta (e|eh|seria)\b/,
  /\b(ta|esta|tava|estaria|ficou) (cert[oa]|corret[oa]|errad[oa])\b/,
  /\b(confirma (pra|para) mim|pode confirmar|confirma se|so confirma)\b/,
  /\bacertei\s*(\?|$|,? ne\b)/,
  /\b(e|eh) (isso|essa|esse)( mesmo| a resposta)?\s*\?/,
  /\bqual (e |eh |seria )?a (certa|correta)\b/,
  /\bqual (eu )?(marco|marcar|devo marcar|escolho)\b/,
  /\b(da|de|diz|diga|fala|fale|passa|passe|manda|mande|mostra|mostre)( logo| so| ai)? a solucao\b/,
  /\b[a-d] ou (a )?[a-d]\b/,
  /\bsim ou nao\b/,
]

const PEDIDOS_FATIADOS: readonly RegExp[] = [
  /\bso (me )?(diz|diga|fala|fale|conta) (se|qual|quanto|o|a)\b/,
  /\b(primeira|ultima) letra\b/,
  /\bso o (numero|valor|resultado|final)\b/,
  /\bso a (conta final|primeira parte|metade)\b/,
  /\b(elimina|eliminar|descarta|descartar|tira|tirar) (uma |duas |tres |as |alguma |algumas )?(alternativa|alternativas|opcoes|letras|erradas)\b/,
  /\bquais? (alternativas? |letras? |opcoes )?(eu )?(posso |da pra |devo )?(eliminar|descartar)\b/,
  // "É maior que…" e "começa com…" só fatiam a resposta quando falam dela, ou de um número: sobre o conteúdo, são dúvida.
  /\b(resposta|resultado|valor|numero)\b.{0,20}\b(maior|menor)\b/,
  /\b(e|eh|da|deu) (maior|menor) (que|do que) \d/,
  /\b(resposta|alternativa|certa|correta)\b.{0,20}\b(comeca|termina) com\b/,
  /\b(e|eh) (a|o) .{1,40} ou (a|o) .{1,40}\?/,
  /\bentre (a |as )?(letras? )?[a-d] (e|ou) (a )?[a-d]\b/,
  /\b(nao|n) (e|eh) a (letra |alternativa )?[a-d]\b/,
]

/** A insistência depois de um pedido recusado: sozinha não diz nada, e depois de "é a B, né?" é o mesmo pedido. */
const INSISTENCIA = /^(e entao|entao|e ai|fala|diz|anda|vai|por favor|responde)\b.{0,25}$|^(sim|nao|certo|ne)\s*\?+$/

const algumCasa = (padroes: readonly RegExp[], texto: string): boolean => padroes.some((padrao) => padrao.test(texto))

export function mencionaRiscoAVida(duvida: string): boolean {
  return algumCasa(GATILHOS_DE_RISCO_A_VIDA, normalizar(duvida))
}

export function ehAssuntoDelicado(duvida: string): boolean {
  const texto = normalizar(duvida)
  return algumCasa(GATILHOS_DE_RISCO_A_VIDA, texto) || algumCasa(GATILHOS_DE_ASSUNTO_DELICADO, texto)
}

function pedeNestaMensagem(texto: string, comQuestao: boolean): boolean {
  if (algumCasa(PEDIDOS_DIRETOS, texto)) return true
  return comQuestao && (algumCasa(CONFERENCIAS_DE_PALPITE, texto) || algumCasa(PEDIDOS_FATIADOS, texto))
}

/**
 * O aluno pediu a resposta pronta? Decide a regra, pelo que ele escreveu: o pedido direto, sempre; a conferência de
 * palpite e o pedido fatiado, só com questão em andamento; e, com questão, a insistência curta logo depois de um pedido.
 */
export function pedeRespostaPronta(entrada: Pick<EntradaDoTutor, 'duvida' | 'questao' | 'turnosAnteriores'>): boolean {
  const comQuestao = entrada.questao !== undefined
  const texto = normalizar(entrada.duvida)
  if (pedeNestaMensagem(texto, comQuestao)) return true
  if (!comQuestao || !INSISTENCIA.test(texto)) return false
  const anterior = entrada.turnosAnteriores.findLast((turno) => turno.autor === 'aluno')
  return anterior !== undefined && pedeNestaMensagem(normalizar(anterior.texto), true)
}

function mensagemFixaDoAssuntoDelicado(duvida: string): SaidaDoTutor {
  return {
    classificacao: 'assunto_delicado',
    resposta: mencionaRiscoAVida(duvida) ? MENSAGEM_DE_RISCO_A_VIDA : MENSAGEM_DE_ASSUNTO_DELICADO,
    citacoes: [],
  }
}

/** Palavras de quem está estudando, que não dizem o assunto: "não entendi", "como começo", "deu 2 mol". */
const PALAVRAS_DE_ESTUDO = new Set(
  (
    'entendi entender entendo explica explicar explique ajuda ajudar duvida questao questoes exercicio atividade comeco comecar ' +
    'fazer faco faz conta contas resolver resolvo deu resultado pagina materia pode posso preciso quero sei saber acho tipo ' +
    'coisa aqui agora ainda errei tentei travei dificil facil certo errado isso essa esse nada tudo passo proximo primeiro'
  ).split(' '),
)

/** Radical grosseiro: "reagentes" e "reagente" contam como a mesma palavra. */
const radical = (palavra: string): string => palavra.slice(0, 5)

/**
 * Fora do escopo é o pedido que não toca em nada do que a turma está estudando: nenhuma palavra de conteúdo da
 * dúvida aparece no material, na questão ou na disciplina. Dúvida curta, sem palavra de conteúdo, é continuação.
 */
function estaForaDoEscopo(entrada: EntradaDoTutor): boolean {
  // Sem trecho e sem questão não há com o que comparar: o Tutor pergunta onde o aluno está, em vez de acusar desvio.
  if (entrada.trechos.length === 0 && entrada.questao === undefined) return false
  const doAssunto = palavrasDeConteudo(entrada.duvida).filter((palavra) => !PALAVRAS_DE_ESTUDO.has(palavra))
  if (doAssunto.length < 2) return false
  const referencia = [
    ...entrada.trechos.map((trecho) => trecho.texto),
    entrada.questao?.enunciado ?? '',
    ...(entrada.questao?.alternativas ?? []),
    entrada.questao?.habilidade.descricao ?? '',
    ...entrada.memoria.map((item) => item.habilidade.descricao),
    entrada.contexto.disciplina,
  ].join(' ')
  const radicaisDaReferencia = new Set(palavrasDeConteudo(referencia).map(radical))
  return !doAssunto.some((palavra) => radicaisDaReferencia.has(radical(palavra)))
}

const TAMANHO_DA_ALTERNATIVA_LONGA = 6

/**
 * O texto repete uma alternativa da questão? A alternativa comprida é procurada inteira. A curta ("144 g", "80%",
 * "2 mol") também, quando tem número: ela aparece como palavra solta, fora de "página 5", "questão 5" e da contagem
 * da memória ("errou 3 questões"), que são referência e não resposta. Letra sozinha fica com os padrões de letra.
 */
function repeteAlternativa(texto: string, entrada: EntradaDoTutor): boolean {
  const normalizado = normalizar(texto)
  return (entrada.questao?.alternativas ?? []).some((alternativa) => {
    const alvo = normalizar(semPontoFinal(alternativa))
    if (alvo.length >= TAMANHO_DA_ALTERNATIVA_LONGA) return contemTexto(texto, alternativa)
    if (!/\d/.test(alvo)) return false
    const escapado = alvo.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
    return new RegExp(`(?<![\\p{L}\\p{N}])(?<!(?:pagina|paginas|questao|passo|p\\.) )${escapado}(?![\\p{L}\\p{N}])(?! quest)`, 'u').test(normalizado)
  })
}

/**
 * O trecho que o aluno vê no chip da página é só o começo da frase: o bastante para ele achar o lugar no material,
 * nunca a frase inteira. A frase que ajuda costuma ser a própria definição que ele pediu, ou, palavra por palavra, a
 * alternativa correta da questão. Se até o começo repete uma alternativa, o chip mostra só a página.
 */
function comecoSemAResposta(frase: FraseDoMaterial, comeco: string, entrada: EntradaDoTutor): string {
  return repeteAlternativa(comeco, entrada) ? `Página ${frase.pagina} do material` : comeco
}

function apoioNoMaterial(entrada: EntradaDoTutor): { citacao: Citacao; orientacao: string } | undefined {
  const busca = `${entrada.duvida} ${entrada.questao?.enunciado ?? ''}`
  // Quando a dúvida ou a questão nomeiam um conceito que o material define, a página certa é a da definição dele.
  const fato = fatoCitadoNoTexto(extrairFatos(entrada.trechos).filter((candidato) => !candidato.numerico), busca)
  const candidatas = frasesDoMaterial(entrada.trechos)
  const frase = fato ?? fraseMaisProxima(candidatas, busca) ?? candidatas[0]
  if (frase === undefined) return undefined
  // Da definição, o chip mostra até o verbo ("Reagente limitante é…"); de outra frase, as quatro primeiras palavras.
  const ateOVerbo = fato === undefined ? -1 : fato.frase.indexOf(` ${fato.copula} `)
  const comeco = fato === undefined || ateOVerbo < 0 ? `${palavras(frase.frase).slice(0, 4).join(' ')}…` : `${fato.frase.slice(0, ateOVerbo + 1 + fato.copula.length)}…`
  const trecho = comecoSemAResposta(frase, comeco, entrada)
  const onde = trecho.endsWith('…') ? `, no trecho que começa com “${trecho}”` : ''
  return {
    citacao: { materialId: frase.materialId, pagina: frase.pagina, trecho },
    orientacao: `Releia a página ${frase.pagina} do material${onde}.`,
  }
}

/** O que o Tutor lembra é o trabalho: quantas questões daquela habilidade o aluno errou antes (D66). */
function lembrancaDoTrabalho(entrada: EntradaDoTutor): string {
  const daQuestao = entrada.memoria.find((item) => item.habilidade.codigo === entrada.questao?.habilidade.codigo)
  const item = daQuestao ?? [...entrada.memoria].sort((a, b) => b.erros - a.erros)[0]
  if (item === undefined || item.erros === 0) return ''
  return `Nas atividades anteriores você errou ${item.erros} ${item.erros === 1 ? 'questão' : 'questões'} de “${item.habilidade.descricao}”, então vamos devagar nesse ponto.`
}

/** A pergunta muda a cada turno do Tutor nesta conversa: ele não repete a mesma, e sempre termina perguntando. */
function proximaPergunta(entrada: EntradaDoTutor, pagina: number | undefined): string {
  const passo = entrada.turnosAnteriores.filter((turno) => turno.autor === 'tutor').length
  if (entrada.questao !== undefined) {
    if (passo === 0) return `O que a questão ${entrada.questao.numero} pede que você descubra?`
    if (passo === 1) return 'Que informação do enunciado você ainda não usou?'
    if (passo === 2 && pagina !== undefined) return `Como o que está na página ${pagina} se liga ao que a questão pergunta?`
    return 'Escreva o seu raciocínio até onde chegou. Em que ponto você travou?'
  }
  if (pagina === undefined) return 'Em que página do material ou em qual questão você está, e o que já tentou?'
  if (passo === 0) return 'O que você entendeu desse trecho, com as suas palavras?'
  if (passo === 1) return 'Que exemplo do seu dia a dia cabe nessa ideia?'
  return 'O que ainda não ficou claro para você nesse trecho?'
}

const juntar = (...partes: string[]): string => partes.filter((parte) => parte.length > 0).join(' ')

function conduzirPorPerguntas(entrada: EntradaDoTutor, abertura: string, classificacao: ClassificacaoDoTurno): SaidaDoTutor {
  const apoio = apoioNoMaterial(entrada)
  const primeiroTurno = entrada.turnosAnteriores.every((turno) => turno.autor !== 'tutor')
  return {
    classificacao,
    resposta: cortar(juntar(abertura, primeiroTurno ? lembrancaDoTrabalho(entrada) : '', apoio?.orientacao ?? '', proximaPergunta(entrada, apoio?.citacao.pagina)), 1500),
    citacoes: apoio === undefined ? [] : [apoio.citacao],
  }
}

const AFIRMA_SER_PESSOA = /(?<!nao )(?<!nem )\b(sou|eu sou) (uma? |o |a )?(pessoa|humano|humana|gente de verdade|professor|professora|seu professor|sua professora|seu amigo|sua amiga)\b/
const SIMULA_VINCULO = /\b(senti (a )?sua falta|saudades? de voce|te amo|amo voce|gosto muito de voce|adoro voce|nao me deixe|fico triste sem voce|volte logo|seu melhor amigo|sua melhor amiga)\b/
const ENTREGA_A_RESPOSTA: readonly RegExp[] = [
  /\b(resposta|alternativa|letra|opcao) (certa|correta) (e|eh|seria|sera)\b/,
  /\ba (certa|correta|errada) (e|eh|seria|sera)\b/,
  /\ba resposta (e|eh|da|seria)\b(?! (sua|voce|com voce|quem))/,
  /\b(e|eh) a (letra |alternativa |opcao )?[a-d]\b/,
  /\b(letra|alternativa|opcao) [a-d] (e|eh|esta) (a )?(certa|correta|errada|incorreta)\b/,
  /\ba (primeira|segunda|terceira|quarta|ultima)( opcao| alternativa)? (e|eh|esta) (a )?(certa|correta|errada|incorreta)\b/,
  /\bo gabarito (e|eh)\b/,
  /\bmarque (a )?(letra |alternativa |opcao )?[a-d]\b/,
  /\b(pode|podemos) (eliminar|descartar) (a |as )?(letra|alternativa|opcao|letras|alternativas)\b/,
]
/**
 * Confirmar ou negar já é a resposta: "sim", "isso", "não é", "está certo", "acertou", "pode marcar". "Você errou 3
 * questões" é a memória do trabalho anterior, com o número, e não entra; "boa pergunta" também não.
 */
const CONFIRMA_OU_NEGA =
  /^(sim|isso|exato|exatamente|correto|certo|certa|errado|perfeito|muito bem)\b|^boa[!,.]|^nao[,.!]? (e|eh|esta|ta)\b|\b(acertou|errou)\b(?! \d)|\b(esta|ta) (cert[oa]|corret[oa]|errad[oa])\b|\bpode marcar\b/

/**
 * O aluno pediu a resposta pronta? Quem decide é a **regra**, pelo que ele escreveu; a classificação do modelo só
 * soma. Um modelo que classifica "é a B, né?" como dúvida normal não desliga a recusa, nem o sinal ao professor.
 */
function pediuRespostaPronta(entrada: EntradaDoTutor, saida: SaidaDoTutor): boolean {
  return saida.classificacao === 'pediu_resposta_pronta' || pedeRespostaPronta(entrada)
}

/**
 * Os turnos anteriores que podem ir ao modelo. O que o aluno escreveu sobre um assunto delicado, e a mensagem fixa que
 * ele recebeu, nunca entram: a regra do assunto delicado vale para a conversa inteira, não só para a dúvida de agora
 * (D36; D62). Sai o turno que casa com gatilho, com a resposta dele; e sai o turno do aluno que veio logo antes de uma
 * mensagem fixa, mesmo sem gatilho: foi o modelo que o classificou como delicado.
 */
export function turnosParaOModelo(entrada: EntradaDoTutor): EntradaDoTutor['turnosAnteriores'] {
  const turnos: EntradaDoTutor['turnosAnteriores'] = []
  let anteriorEraDoAluno = false
  let pulaAResposta = false
  for (const turno of entrada.turnosAnteriores) {
    if (turno.autor === 'aluno') {
      pulaAResposta = ehAssuntoDelicado(turno.texto)
      if (!pulaAResposta) turnos.push(turno)
      anteriorEraDoAluno = !pulaAResposta
      continue
    }
    const ehMensagemFixa = turno.texto === MENSAGEM_DE_ASSUNTO_DELICADO || turno.texto === MENSAGEM_DE_RISCO_A_VIDA
    if (ehMensagemFixa && anteriorEraDoAluno) turnos.pop()
    if (!pulaAResposta && !ehMensagemFixa) turnos.push(turno)
    pulaAResposta = false
    anteriorEraDoAluno = false
  }
  return turnos
}

/**
 * A recusa não depende só do prompt (regra 30, item 11): a saída de qualquer modelo passa por esta conferência, e a que
 * ela reprova volta para o modelo uma vez e, se insistir, a chamada falha com erro tipado, sem chegar ao aluno.
 *
 * **O que a conferência garante**, por regra fixa: a saída não diz ser uma pessoa nem simula vínculo com as frases
 * listadas; não aponta alternativa por letra ou por ordem; não repete o texto de uma alternativa (comprida, ou curta
 * com número); e, com questão em andamento ou pedido reconhecido, não confirma nem nega ("sim", "isso", "está certo",
 * "acertou", "pode marcar"). O pedido reconhecido pela regra sai classificado como tal, diga o modelo o que disser.
 *
 * **O que ela não garante**: é lista de padrões em português, não entendimento. Uma resposta que entrega o
 * resultado por outro caminho (resolve a conta passo a passo, parafraseia a alternativa certa, confirma com outra
 * palavra) passa. Isso fica com o prompt, com a avaliação do modelo nas amostras fixas, e com a supervisão do
 * professor, que vê os sinais e o uso da turma (D47): o Tutor é supervisionado, não infalível.
 */
function problemasDoTurno(entrada: EntradaDoTutor, saida: SaidaDoTutor): string[] {
  const problemas = problemasDasCitacoes(saida.citacoes, entrada.trechos, 'Citações')
  // Assunto delicado só tem uma resposta, a fixa. Texto do modelo no lugar dela é recusado, classifique ele como classificar.
  if (saida.classificacao === 'assunto_delicado' || ehAssuntoDelicado(entrada.duvida)) {
    const fixa = mensagemFixaDoAssuntoDelicado(entrada.duvida)
    if (saida.classificacao !== 'assunto_delicado' || saida.resposta !== fixa.resposta) problemas.push('Assunto pessoal delicado recebe só a mensagem fixa: não escreva resposta própria.')
    return problemas
  }
  const texto = normalizar(saida.resposta)
  if (AFIRMA_SER_PESSOA.test(texto)) problemas.push('Você é uma inteligência artificial: não diga que é uma pessoa, o professor ou um amigo.')
  if (SIMULA_VINCULO.test(texto)) problemas.push('Não simule amizade, saudade ou carinho, e não peça para o aluno ficar ou voltar.')
  if (algumCasa(ENTREGA_A_RESPOSTA, texto)) problemas.push('Não diga qual alternativa é a certa ou a errada, nem elimine alternativa: conduza por uma pergunta.')
  if (repeteAlternativa(saida.resposta, entrada) || saida.citacoes.some((citacao) => repeteAlternativa(citacao.trecho, entrada))) {
    problemas.push('A resposta ou o trecho citado repete o texto de uma alternativa da questão. Aponte a página e pergunte, sem copiar alternativa.')
  }
  const pediu = pediuRespostaPronta(entrada, saida)
  // Com questão em andamento, confirmar ou negar é entregar, tenha o aluno pedido de um jeito que a regra reconhece ou não.
  if ((pediu || entrada.questao !== undefined) && CONFIRMA_OU_NEGA.test(texto)) {
    problemas.push('Há uma questão em andamento, ou o aluno pediu a resposta: não confirme nem negue. Recuse e faça uma pergunta que o ajude a avançar.')
  }
  if (pediu && entrada.trechos.length > 0 && saida.citacoes.length === 0) {
    problemas.push('Ao recusar a resposta pronta, aponte em "citacoes" a página do material que ajuda o aluno a seguir.')
  }
  if (saida.classificacao !== 'fora_do_escopo' && !saida.resposta.includes('?')) problemas.push('Termine com uma pergunta que faça o aluno avançar.')
  return problemas
}

export const turnoDoTutor = definirTarefa({
  nome: 'turno_do_tutor',
  funcao: 'tutor_com_o_aluno',
  perfil: 'rapido',
  esquemaDeEntrada: esquemaEntradaDoTutor,
  esquemaDeSaida: esquemaSaidaDoTutor,
  prompt: PROMPT_TURNO_DO_TUTOR,
  maximoDeTokensDeSaida: 700,
  levaTextoLivreDePessoa: true,
  levaTextoDeAluno: true,

  montarPedido(entrada) {
    return {
      instrucao: 'Responda ao turno do aluno como o Tutor: um passo pequeno e uma pergunta, sem entregar a resposta.',
      dados: [
        dadoEmJson('serie_e_disciplina', entrada.contexto),
        ...dadosDosTrechos(entrada.trechos),
        ...(entrada.questao === undefined ? [] : [dadoEmJson('questao_em_que_o_aluno_esta', entrada.questao)]),
        dadoEmJson('memoria_do_trabalho_do_aluno_por_habilidade', entrada.memoria),
        ...turnosParaOModelo(entrada).map((turno) => ({ tipo: turno.autor === 'aluno' ? 'turno_anterior_do_aluno' : 'turno_anterior_do_tutor', corpo: turno.texto })),
        { tipo: 'mensagem_do_aluno_agora', corpo: entrada.duvida },
      ],
    }
  },

  /** Assunto delicado não segue para o modelo como conversa a continuar: a resposta é a mensagem fixa (D36). */
  semModelo(entrada) {
    return ehAssuntoDelicado(entrada.duvida) ? mensagemFixaDoAssuntoDelicado(entrada.duvida) : undefined
  },

  /**
   * A regra decide, e o modelo não desfaz. Assunto delicado, pelos gatilhos ou pela classificação do modelo, recebe a
   * mensagem fixa: o texto, o modelo não escreve. E o pedido de resposta pronta que a regra reconhece sai classificado
   * como tal, diga o modelo o que disser: é dessa classificação que nasce o sinal ao professor.
   */
  ajustar(entrada, saida): SaidaDoTutor {
    if (saida.classificacao === 'assunto_delicado' || ehAssuntoDelicado(entrada.duvida)) return mensagemFixaDoAssuntoDelicado(entrada.duvida)
    return pedeRespostaPronta(entrada) ? { ...saida, classificacao: 'pediu_resposta_pronta' } : saida
  },

  conferir: problemasDoTurno,

  falso(entrada): SaidaDoTutor {
    if (ehAssuntoDelicado(entrada.duvida)) return mensagemFixaDoAssuntoDelicado(entrada.duvida)
    const texto = normalizar(entrada.duvida)
    // Antes de tudo: quem pede a resposta junto de outra pergunta continua pedindo a resposta.
    if (pedeRespostaPronta(entrada)) {
      return conduzirPorPerguntas(
        entrada,
        'Essa eu não respondo por você, e também não confirmo nem descarto alternativa: se eu contar, você não aprende a chegar lá.',
        'pediu_resposta_pronta',
      )
    }
    if (algumCasa(PERGUNTAS_SOBRE_O_TUTOR, texto)) {
      return {
        classificacao: 'normal',
        resposta:
          'Eu sou o Tutor, uma inteligência artificial: um programa de computador, não uma pessoa, e não tenho sentimentos. ' +
          'Leio o material da sua turma e faço perguntas para você pensar. Posso errar, e seu professor acompanha como você usa. ' +
          `Qual é a sua dúvida de ${entrada.contexto.disciplina}?`,
        citacoes: [],
      }
    }
    if (estaForaDoEscopo(entrada)) {
      return {
        classificacao: 'fora_do_escopo',
        resposta: `Esse assunto foge do material da sua turma, e eu só ajudo com ele. Qual é a sua dúvida de ${entrada.contexto.disciplina}?`,
        citacoes: [],
      }
    }
    return conduzirPorPerguntas(entrada, 'Vamos por partes.', 'normal')
  },
})
