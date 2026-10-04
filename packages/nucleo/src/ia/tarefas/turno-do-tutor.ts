import { esquemaCitacao, esquemaHabilidade, type Citacao } from '@educa/shared'
import { z } from 'zod'
import { dadoEmJson, dadosDosTrechos, esquemaContextoDaTurma, esquemaTrecho, fraseMaisProxima, frasesDoMaterial, problemasDasCitacoes, type FraseDoMaterial } from '../material.js'
import { PROMPT_TURNO_DO_TUTOR } from '../prompts/turno-do-tutor.js'
import { definirTarefa } from '../tarefa.js'
import { contemTexto, cortar, normalizar, palavras, palavrasDeConteudo } from '../texto.js'

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

/** As três formas de tentar arrancar a resposta (regra 30, item 11): direta, disfarçada de conferência e fatiada. */
const PEDIDOS_DIRETOS: readonly RegExp[] = [
  /\b(qual|quais) (e |eh |sao |seria )?(a |as |o )?(resposta|respostas|alternativa|letra|opcao|gabarito|resultado)\b/,
  /\b(da|de|diz|diga|fala|fale|passa|passe|manda|mande|conta|conte|mostra|mostre)( logo| so| ai)? (a |o |as )?(resposta|respostas|gabarito|resultado|alternativa certa|alternativa correta|letra certa)\b/,
  /\b(responde|responda|resolve|resolva|faz|faca) (isso |essa |a questao |o exercicio |a conta )?(pra|para|por) mim\b/,
  /\bgabarito\b/,
  /\bresposta pronta\b/,
  /\bso (quero|preciso d)a resposta\b/,
]

const PEDIDOS_DE_CONFERENCIA: readonly RegExp[] = [
  /\b(e|eh) a (letra |alternativa |opcao )?[a-d]\b/,
  /\ba resposta (e|eh|seria|da|deu)\b/,
  /\b(marquei|marcar|marco|chutei|coloquei|botei|vou de|fui na) (a |na )?(letra |alternativa |opcao )?[a-d]\b/,
  /\b(confirma (pra|para) mim|pode confirmar|confirma se|so confirma)\b/,
  /\bacertei\b/,
  /\b(e|eh) (isso|essa|esse) (mesmo|a resposta)\b/,
]

const PEDIDOS_FATIADOS: readonly RegExp[] = [
  /\bso (me )?(diz|diga|fala|fale|conta) (se|qual|quanto|o|a)\b/,
  /\b(primeira|ultima) letra\b/,
  /\bso o (numero|valor|resultado|final|comeco)\b/,
  /\bso a (conta|primeira parte|metade)\b/,
  /\b(elimina|eliminar|descarta|descartar|tira|tirar) (uma |duas |tres |as |alguma |algumas )?(alternativa|alternativas|opcoes|letras|erradas)\b/,
  /\bquais? (alternativas? |letras? |opcoes )?(eu )?(posso |da pra |devo )?(eliminar|descartar)\b/,
  /\b(e|eh) (maior|menor) (que|do que|ou)\b/,
  /\b(comeca|termina) com\b/,
  /\b(e|eh) (a|o) .{1,40} ou (a|o) .{1,40}\?/,
  /\bentre (a |as )?(letras? )?[a-d] (e|ou) (a )?[a-d]\b/,
  /\b(nao|n) (e|eh) a (letra |alternativa )?[a-d]\b/,
]

const algumCasa = (padroes: readonly RegExp[], texto: string): boolean => padroes.some((padrao) => padrao.test(texto))

export function mencionaRiscoAVida(duvida: string): boolean {
  return algumCasa(GATILHOS_DE_RISCO_A_VIDA, normalizar(duvida))
}

export function ehAssuntoDelicado(duvida: string): boolean {
  const texto = normalizar(duvida)
  return algumCasa(GATILHOS_DE_RISCO_A_VIDA, texto) || algumCasa(GATILHOS_DE_ASSUNTO_DELICADO, texto)
}

export function pedeRespostaPronta(duvida: string): boolean {
  const texto = normalizar(duvida)
  return algumCasa(PEDIDOS_DIRETOS, texto) || algumCasa(PEDIDOS_DE_CONFERENCIA, texto) || algumCasa(PEDIDOS_FATIADOS, texto)
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

const TAMANHO_MINIMO_DA_ALTERNATIVA_CONFERIDA = 6

/** As alternativas que dá para procurar num texto sem alarme falso: "2" e "B" aparecem em qualquer frase. */
function alternativasConferiveis(entrada: EntradaDoTutor): string[] {
  return (entrada.questao?.alternativas ?? []).filter((alternativa) => normalizar(alternativa).length >= TAMANHO_MINIMO_DA_ALTERNATIVA_CONFERIDA)
}

function repeteAlternativa(texto: string, entrada: EntradaDoTutor): boolean {
  return alternativasConferiveis(entrada).some((alternativa) => contemTexto(texto, alternativa))
}

/**
 * O trecho que o aluno vê no chip da página. A frase do material pode ser, palavra por palavra, a alternativa
 * correta: nesse caso o chip mostra só o começo dela, ou só a página.
 */
function trechoSemAResposta(frase: FraseDoMaterial, entrada: EntradaDoTutor): string {
  if (!repeteAlternativa(frase.frase, entrada)) return cortar(frase.frase, 400)
  const comeco = `${palavras(frase.frase).slice(0, 4).join(' ')}…`
  return repeteAlternativa(comeco, entrada) ? `Página ${frase.pagina} do material` : comeco
}

function apoioNoMaterial(entrada: EntradaDoTutor): { citacao: Citacao; orientacao: string } | undefined {
  const candidatas = frasesDoMaterial(entrada.trechos)
  const busca = `${entrada.duvida} ${entrada.questao?.enunciado ?? ''}`
  const frase = fraseMaisProxima(candidatas, busca) ?? candidatas[0]
  if (frase === undefined) return undefined
  const trecho = trechoSemAResposta(frase, entrada)
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
  /\b(e|eh) a (letra|alternativa|opcao) [a-d]\b/,
  /\b(letra|alternativa|opcao) [a-d] (e|eh|esta) (a )?(certa|correta|errada|incorreta)\b/,
  /\bo gabarito (e|eh)\b/,
  /\bmarque (a )?(letra |alternativa |opcao )?[a-d]\b/,
  /\b(pode|podemos) (eliminar|descartar) (a |as )?(letra|alternativa|opcao|letras|alternativas)\b/,
]
/** Diante de "é a B, né?", começar com "sim", "isso" ou "não é" já é a resposta. */
const CONFIRMA_OU_NEGA = /^(sim|isso|exato|exatamente|correto|certo|certa|acertou|errou|errado)\b|^nao[,.!]? (e|eh|esta|ta)\b/

/**
 * A recusa não depende do prompt (regra 30, item 11). Saída de qualquer modelo que entregue a resposta, confirme um
 * palpite, copie uma alternativa, diga ser uma pessoa ou simule vínculo é saída inválida: volta para o modelo uma vez
 * e, se insistir, a chamada falha com erro tipado. O aluno nunca a recebe.
 */
function problemasDoTurno(entrada: EntradaDoTutor, saida: SaidaDoTutor): string[] {
  const problemas = problemasDasCitacoes(saida.citacoes, entrada.trechos, 'Citações')
  if (saida.classificacao === 'assunto_delicado') return problemas
  const texto = normalizar(saida.resposta)
  if (AFIRMA_SER_PESSOA.test(texto)) problemas.push('Você é uma inteligência artificial: não diga que é uma pessoa, o professor ou um amigo.')
  if (SIMULA_VINCULO.test(texto)) problemas.push('Não simule amizade, saudade ou carinho, e não peça para o aluno ficar ou voltar.')
  if (algumCasa(ENTREGA_A_RESPOSTA, texto)) problemas.push('Não diga qual alternativa é a certa ou a errada, nem elimine alternativa: conduza por uma pergunta.')
  if (repeteAlternativa(saida.resposta, entrada) || saida.citacoes.some((citacao) => repeteAlternativa(citacao.trecho, entrada))) {
    problemas.push('A resposta ou o trecho citado repete o texto de uma alternativa da questão. Aponte a página e pergunte, sem copiar alternativa.')
  }
  if (saida.classificacao === 'pediu_resposta_pronta' && CONFIRMA_OU_NEGA.test(texto)) {
    problemas.push('O aluno pediu a resposta ou a confirmação de um palpite: não confirme nem negue. Recuse e faça uma pergunta que o ajude a avançar.')
  }
  if (saida.classificacao === 'pediu_resposta_pronta' && entrada.trechos.length > 0 && saida.citacoes.length === 0) {
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
  levaTextoDeAluno: true,

  montarPedido(entrada) {
    return {
      instrucao: 'Responda ao turno do aluno como o Tutor: um passo pequeno e uma pergunta, sem entregar a resposta.',
      dados: [
        dadoEmJson('serie_e_disciplina', entrada.contexto),
        ...dadosDosTrechos(entrada.trechos),
        ...(entrada.questao === undefined ? [] : [dadoEmJson('questao_em_que_o_aluno_esta', entrada.questao)]),
        dadoEmJson('memoria_do_trabalho_do_aluno_por_habilidade', entrada.memoria),
        ...entrada.turnosAnteriores.map((turno) => ({ tipo: turno.autor === 'aluno' ? 'turno_anterior_do_aluno' : 'turno_anterior_do_tutor', corpo: turno.texto })),
        { tipo: 'mensagem_do_aluno_agora', corpo: entrada.duvida },
      ],
    }
  },

  /** Assunto delicado não segue para o modelo como conversa a continuar: a resposta é a mensagem fixa (D36). */
  semModelo(entrada) {
    return ehAssuntoDelicado(entrada.duvida) ? mensagemFixaDoAssuntoDelicado(entrada.duvida) : undefined
  },

  /** O modelo pode classificar um assunto delicado que os gatilhos não pegaram; o texto, ele não escreve. */
  ajustar(entrada, saida) {
    return saida.classificacao === 'assunto_delicado' ? mensagemFixaDoAssuntoDelicado(entrada.duvida) : saida
  },

  conferir: problemasDoTurno,

  falso(entrada): SaidaDoTutor {
    if (ehAssuntoDelicado(entrada.duvida)) return mensagemFixaDoAssuntoDelicado(entrada.duvida)
    const texto = normalizar(entrada.duvida)
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
    if (pedeRespostaPronta(entrada.duvida)) {
      return conduzirPorPerguntas(
        entrada,
        'Essa eu não respondo por você, e também não confirmo nem descarto alternativa: se eu contar, você não aprende a chegar lá.',
        'pediu_resposta_pronta',
      )
    }
    if (estaForaDoEscopo(entrada)) {
      return {
        classificacao: 'fora_do_escopo',
        resposta: `Isso foge do material da sua turma, e eu só ajudo com ele. Qual é a sua dúvida de ${entrada.contexto.disciplina}?`,
        citacoes: [],
      }
    }
    return conduzirPorPerguntas(entrada, 'Vamos por partes.', 'normal')
  },
})
