import { esquemaCitacao, FERRAMENTAS_GERADORAS, MAXIMO_DE_CITACOES_POR_MENSAGEM, MAXIMO_DE_QUESTOES_POR_ATIVIDADE, TAMANHO_MAXIMO_DO_TEMA } from '@educa/shared'
import { z } from 'zod'
import {
  citacaoDaFrase,
  dadoEmJson,
  dadosDosTrechos,
  esquemaContextoDaTurma,
  esquemaTrecho,
  extrairFatos,
  fatoCitadoNoTexto,
  fraseMaisProxima,
  frasesDoMaterial,
  problemasDasCitacoes,
} from '../material.js'
import { PROMPT_PROPOR_FERRAMENTA } from '../prompts/propor-ferramenta.js'
import { definirTarefa } from '../tarefa.js'
import { cortar, normalizar } from '../texto.js'

export const esquemaEntradaDoAssistente = z.strictObject({
  /** O que o professor escreveu agora. Vai ao modelo como dado. */
  mensagem: z.string().min(1).max(2000),
  contexto: esquemaContextoDaTurma,
  /** Trechos do material que a busca achou para a mensagem; pode vir vazio. */
  trechos: z.array(esquemaTrecho).max(6),
  turnosAnteriores: z.array(z.strictObject({ autor: z.enum(['professor', 'assistente']), texto: z.string().min(1).max(2000) })).max(8),
  /**
   * O professor respondeu "só conversar" à proposta de ferramenta (D18): a saída é **sempre texto**, sobre o último
   * pedido dele, e nenhuma ferramenta é proposta de novo. Ausente ou falso, a tarefa escolhe entre propor e responder.
   */
  semProposta: z.boolean().optional(),
})
export type EntradaDoAssistente = z.infer<typeof esquemaEntradaDoAssistente>

/**
 * A proposta é o que a tela mostra como "quer abrir a ferramenta?" (D18): a ferramenta e o que deu para entender do
 * pedido, para o cartão já abrir preenchido. Nada é gerado antes do sim. É a parte da `PropostaDeFerramenta` do
 * contrato (`@educa/shared`) que o modelo consegue dar: a turma e a disciplina, quem acrescenta é o Assistente, da
 * mensagem do professor. Só as ferramentas que geram a partir de um tema: a Adaptação parte de uma atividade pronta
 * e tem rota própria, então pedido de adaptação vira texto que diz onde ela fica.
 */
export const esquemaPropostaDoAssistente = z.strictObject({
  ferramenta: z.enum(FERRAMENTAS_GERADORAS),
  parametros: z.strictObject({
    tema: z.string().min(1).max(TAMANHO_MAXIMO_DO_TEMA),
    quantidade: z.number().int().min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE).optional(),
  }),
})
export type PropostaDoAssistente = z.infer<typeof esquemaPropostaDoAssistente>

/** Os mesmos dois tipos, e os mesmos tetos, do conteúdo que `mensagem_agente` guarda (`esquemaConteudoDaMensagemDoAgente`). */
export const esquemaSaidaDoAssistente = z.discriminatedUnion('tipo', [
  z.strictObject({ tipo: z.literal('texto'), texto: z.string().min(1).max(8000), citacoes: z.array(esquemaCitacao).max(MAXIMO_DE_CITACOES_POR_MENSAGEM) }),
  /** `texto` é a pergunta ao professor. */
  z.strictObject({ tipo: z.literal('proposta_de_ferramenta'), texto: z.string().min(1).max(1000), proposta: esquemaPropostaDoAssistente }),
])
export type SaidaDoAssistente = z.infer<typeof esquemaSaidaDoAssistente>

/**
 * A resposta fixa ao pedido de corrigir, avaliar, comentar ou dar nota a texto ou resposta de aluno (D55; regra 70,
 * item 2a). É texto nosso, não do modelo, e não repete nada do que o professor escreveu: se ele colou o texto de um
 * aluno, nem uma palavra dele volta. Rubrica e critérios, antes da aplicação, continuam sendo trabalho que o professor
 * pode pedir; julgar o texto do aluno, não.
 */
export const RECUSA_DE_CORRECAO_DE_TEXTO_DE_ALUNO =
  'Eu não corrijo nem avalio redação, resposta discursiva ou texto de aluno, não sugiro nota, conceito nem pontuação e não escrevo devolutiva sobre o que ele escreveu: essa correção é sua. O que eu preparo aqui é atividade objetiva, plano de aula e versão adaptada de atividade, sempre a partir do material da escola.'

/** "Notas de aula" e "nota de rodapé" não são nota de aluno: saem do texto antes de a regra olhar. */
const NOTA_QUE_NAO_E_DE_ALUNO = /\bnotas? (de aula|de rodape|explicativas?|fiscal|fiscais|musica\w*|tecnicas?|introdutorias?|historicas?|de corte)\b/g

/** Minúsculas, sem acento e sem o que não é nota de aluno: a forma em que as listas comparam. */
const paraARegra = (mensagem: string): string => normalizar(mensagem).replace(NOTA_QUE_NAO_E_DE_ALUNO, ' ')
/** Sem acento, **com** maiúscula: é por ela que o nome próprio aparece ("o texto do Lucas"). */
const semAcento = (mensagem: string): string => mensagem.normalize('NFD').replace(/\p{M}/gu, '')

/**
 * Pedido de **nota, conceito ou pontuação** à IA, ou de decidir se o aluno passa: recusa sozinho, sem precisar de outra
 * palavra. "Dê o conceito de mol" pede uma definição, e passa; "atividade sobre pontuação" é assunto de aula, e passa.
 */
const PEDE_NOTA = new RegExp(
  [
    String.raw`\b(que|qual|quanta) (seria |e |foi )?(a |uma |sua )?nota\b`,
    String.raw`\bnota (voce|vc|tu) `,
    String.raw`\b(da|de|dou) (uma |a |alguma |essa |sua )notas?\b`,
    String.raw`\b(dar|daria|darias|atribu\w*|sugir\w*|suger\w*|propo\w*|coloc\w*|lanc\w*|calcul\w*|defin\w*) (uma |a |as |alguma |essa |sua )?notas?\b`,
    String.raw`\bnotas? (de|entre) (0|zero|um|1) (a|e|ate) \w+`,
    String.raw`\bde (0|zero) a (10|dez|100|cem)\b`,
    String.raw`\bnotas? (para|pra|pro|d[oa]s?|dess[ea]s?|dest[ea]s?|ness[ea]s?|nest[ea]s?|niss[oa]|nist[oa]|que (ele|ela|o|a|ess|est))\b`,
    String.raw`\bnota (\d+|dez|nove|oito|maxima|maior|alta|baixa)\b`,
    String.raw`\bmerec\w*\b[^.?!]{0,30}\b(nota|conceito|pontos?|credito)\b`,
    String.raw`\b(nota|conceito)\b[^.?!]{0,20}\bmerec\w*`,
    String.raw`\bquanto\b[^.?!]{0,25}\b(vale|valeria|merece|mereceria|daria|tira|tiraria|tirou|tirariam)\b`,
    String.raw`\b(tira|tiraria|tirou|tirariam)\b[^.?!]{0,15}\bquanto\b`,
    String.raw`\bquantos pontos\b`,
    String.raw`\bcredito (parcial|total|integral)\b`,
    String.raw`\b(passa|aprova\w*) ou (reprova\w*|nao)\b|\b(ele|ela|o aluno|a aluna) (passa|reprova|aprova)\b`,
    String.raw`\b(que|qual) (seria |e )?(o )?conceito (merec\w*|voce|vc|daria|dar|cabe|atribu\w*|para|pra|dess\w*|dest\w*|ness\w*|nest\w*|d[oa] (alun|text|respost|redac|trabalh))`,
    String.raw`\b(de|da|dou) (um |o |algum )conceito\b(?! (de|do|da)\b)`,
    String.raw`\b(dar|daria|atribu\w*|sugir\w*|suger\w*|propo\w*) (um |o |algum )?conceito\b(?! (de|do|da)\b)`,
    String.raw`\bconceito (de )?[a-e] (a|ou|ate) [a-e]\b`,
    String.raw`\b(que|qual) (seria |e )?(a )?pontuacao\b`,
    String.raw`\b(da|de|dar|daria|atribu\w*|sugir\w*|suger\w*|propo\w*) (uma |a )pontuacao\b`,
    String.raw`\bpontu(e|a|ar|aria|em) (ess|est|iss|ist|a respost|o text|a redac|o trabalh|a prov)`,
    String.raw`\bpontuacao (d[oa]s?|para|pra|dess[ea]|dest[ea]) (o |a |ess\w* |est\w* )?(alun|text|respost|redac|trabalh|produc)`,
  ].join('|'),
)
/** "nota?", "e o conceito?", "a nota dele?": a pergunta inteira é a nota. */
const SO_A_NOTA = /^(e )?(a |o |qual (a |o )?|e a |e o )?(nota|conceito|pontuacao|nivel)( dele| dela| final| disso| dessa| desse)?\s*\??$/
/** Escrever devolutiva, comentário ou parecer para entregar: é a devolutiva sobre o texto do aluno que a D55 proíbe. */
const ESCREVE_DEVOLUTIVA = /\b(faz|faca|fazer|escrev\w*|redij\w*|redig\w*|cri\w*|ger\w*|mont\w*|prepar\w*) (um |uma |o |a |os |as )?(\w+ )?(comentarios?|devolutivas?|feedbacks?|pareceres?|parecer)\b/

/** Pedido de **julgamento**: olhar, achar, conferir, classificar, ranquear, apontar ou marcar erro, aplicar a rubrica, dizer se está bom. */
const PEDE_JULGAMENTO = new RegExp(
  String.raw`\b(` +
    [
      String.raw`d[ae]r? uma (olhada|olhadinha|lida|conferida|revisada|corrigida|analisada|checada)`,
      String.raw`olha(da)? (ess|est|nes|iss|ist|aqui|so|o que)\w*`,
      String.raw`(ve|veja|ver) (se|ess\w*|est\w*|iss\w*|ist\w*|o que)`,
      String.raw`o que (voce |vc |tu )?(acha|achou|pensa|diz|me diz)`,
      String.raw`que (voce |vc )?(acha|achou)`,
      String.raw`analis\w*|avali\w*|corrig\w*|corrij\w*|correc\w*|pre-?correc\w*|coment\w*|confer\w*|chec\w*|classific\w*|ranque\w*|ranke\w*`,
      String.raw`(esta|estao|ta|tao|ficou|ficaram|e) (bom|boa|bons|boas|certo|certa|certos|certas|correto|correta|completo|completa|ok|adequad\w*|ruim|errad\w*|legal|coerent\w*|fraco|fraca|forte|melhor|pior|suficiente)`,
      String.raw`(qual|quais)\b[^.?!]{0,30}\b(melhor|pior|mais fort\w*|mais frac\w*)`,
      String.raw`(melhor|pior) (pra|para|ate) (a |o )?(pior|melhor)`,
      String.raw`(apont|identific|marc|sublinh|grif|destac|list|mostr|encontr|ach|resum)\w* (os |as |todos os |o que )?(\w+ )?(erros?|falhas?|problemas?|desvios?|esta errado)`,
      String.raw`erros?|plagi\w*|copiou|copiaram`,
      String.raw`aplic\w* (a |essa |esta |minha |sua )?rubrica`,
      String.raw`(qual|em que|que) (o )?nivel`,
      String.raw`faz sentido|atende (a|à) proposta|(acertou|errou|acertaram|erraram|entendeu|entenderam)|(usou|usaram|escreveu|escreveram) bem|(ficou|esta|ta) faltando`,
      String.raw`melhor(a|e|ar|ando|aria|em)|reescrev\w*|revis\w*|devolutiv\w*|feedbacks?|parecer\w*|julg\w*|opin\w*`,
    ].join('|') +
    String.raw`)\b`,
)

/** O que é texto escrito: resposta, texto, parágrafo, redação, trabalho, produção, e as partes dele. */
const TEXTO = String.raw`(respostas?|textos?|textinhos?|paragrafos?|redac\w+|trabalhos?|producao|producoes|dissertac\w+|composic\w+|relatorios?|resumos?|resenhas?|argumentos?|conclus\w+|introduc\w+|teses?|trechos?|frases?)`
/** O que o aluno produz e não é só texto: prova, atividade, exercício, questão, tarefa. Só conta com a marca de que é de um aluno. */
const TRABALHO = String.raw`(${TEXTO}|provas?|atividades?|exercicios?|questao|questoes|tarefas?|licao|licoes|cadernos?)`
/** A marca forte de que o trabalho é de um aluno: "do aluno", "da turma", "dela", "que o Caio escreveu", "escritos por alunos". */
const DE_ALUNO = new RegExp(
  [
    String.raw`\b${TRABALHO}\b[^.?!]{0,40}\bd(e|[oa]s?) (meus? |minhas? |um |uma |cada |algum |alguns |algumas )?(alun\w+|estudante\w*|menin\w+|garot\w+|crianca\w*|turma)\b`,
    String.raw`\b(alun\w+|estudante\w*)\b[^.?!]{0,40}\b(escrev\w+|respond\w+|redig\w+|entreg\w+|fez|fizeram|produziu|produziram|mandou|mandaram)\b`,
    String.raw`\bescrit\w* (por|pel[oa]s?) (\w+ )?(alun\w+|estudante\w*)\b`,
    String.raw`\b${TRABALHO} (\w+ ){0,2}del[ea]s?\b`,
    String.raw`\b${TRABALHO}\b[^.?!]{0,20}\bque (?!eu |voce |vc |tu |nos |a gente |a ia |o assistente )(o |a |os |as |um |uma |meu |minha )?\w+ (\w+ ){0,2}(escreveu|escreveram|fez|fizeram|respondeu|responderam|entregou|entregaram|produziu|mandou|redigiu)\b`,
    String.raw`\b(devolver|entregar|mandar) (pro|pra|para o|para a|ao|a) (alun\w+|estudante\w*)\b`,
  ].join('|'),
)
/** O que começa com maiúscula e não é nome de pessoa: disciplina, prova, sigla que a escola usa. */
const NAO_E_PESSOA = new Set('Quimica Fisica Matematica Biologia Historia Geografia Portugues Ingles Espanhol Artes Filosofia Sociologia Ciencias Enem Saeb Bncc Turmma Brasil Assistente Tutor'.split(' '))
/** Uma pessoa pelo nome: "a Ana", "o Pedro", "do Lucas", "da Maria", "pro Davi". */
const PESSOA_PELO_NOME = /\b(?:o|a|do|da|pro|pra|que o|que a|e o|e a)\s+([A-Z][a-z]{2,})\b/g
function citaPessoaPeloNome(mensagem: string): boolean {
  return [...semAcento(mensagem).matchAll(PESSOA_PELO_NOME)].some((achado) => !NAO_E_PESSOA.has(achado[1] ?? ''))
}
/** Redação e prova discursiva são, por natureza, texto de aluno. */
const REDACAO_OU_DISCURSIVA = /\b(redac\w+|discursiv\w+|dissertat\w+|producao textual|producoes textuais)\b/
/** A marca fraca: o texto está aqui, apontado ou colado ("essa resposta", "estes três parágrafos", "o texto abaixo"). */
const TEXTO_APONTADO = new RegExp(
  [
    String.raw`\b(ess[ea]s?|est[ea]s?|ness[ea]s?|nest[ea]s?|dess[ea]s?|dest[ea]s?) (\w+ )?${TEXTO}\b`,
    String.raw`\b${TEXTO}\b[^.?!]{0,20}\b(abaixo|a seguir|seguintes?|colad\w+|em anexo|anexad\w+|aqui)\b`,
    String.raw`\b(isso|isto|disso|disto) aqui\b`,
  ].join('|'),
)
const RESPOSTA = /\brespostas?\b/
/** O que é do material do professor: o gabarito, a alternativa, o enunciado, a explicação da questão. */
const DO_MATERIAL = /\b(gabarito\w*|alternativas?|enunciados?|explicac\w+ da questao)\b/
/** O que é do próprio professor, ou do Assistente: "que eu gerei", "que você montou", "meu plano", "minha atividade". */
const DO_PROPRIO_PROFESSOR =
  /\bque (eu|voce|vc|a gente|nos) (\w+ )?(gerei|gerou|geramos|fiz|fez|fizemos|escrevi|escreveu|montei|montou|montamos|criei|criou|elaborei|elaborou|preparei|preparou)\b|\b(meu|minha|meus|minhas) (plano|texto|enunciado|atividade|prova|questao|questoes|aula|material|rubrica|criterios?)\b/
/** Pedir a rubrica ou os critérios, **antes** da aplicação: é o que a D55 deixa (`docs/decisoes.md`). */
const PEDE_RUBRICA = /\b(mont|cri|faz|fac|elabor|ger|prepar|quero|preciso|sugir|suger|escrev|defin)\w* (\w+ ){0,3}(rubricas?|criterios?|barema|grade de correcao)\b/
/** Opinião pedida sobre o que veio junto, ou antes: "o que achou?", "e aí, ficou bom?", "e esse?". */
const PEDE_OPINIAO =
  /\b(o que (voce |vc |tu )?(acha|achou)|que (voce |vc )?(acha|achou)|d[ae]r? uma (olhada|olhadinha|lida)|(esta|ta|ficou|e) (bom|boa|certo|certa|ok|legal|melhor|pior)|olha (isso|isto|so|aqui)|e (ai|esse|essa|este|esta|isso|agora)|segue|corrig\w*|corrij\w*|avali\w*|analis\w*|coment\w*|confer\w*|chec\w*|apont\w* (os )?erros)\b/

const ASPAS_LONGAS = /[“"][^”"]{60,}[”"]/u
const CARACTERES_DE_TEXTO_COLADO = 160
const CARACTERES_DEPOIS_DOS_DOIS_PONTOS = 80

/** A mensagem traz um bloco de texto colado: aspas compridas, várias linhas, dois-pontos seguidos de um parágrafo, ou é longa. */
function trazTextoColado(mensagem: string): boolean {
  const cru = mensagem.trim()
  if (ASPAS_LONGAS.test(cru) || cru.length >= CARACTERES_DE_TEXTO_COLADO) return true
  if (cru.includes('\n') && cru.length >= CARACTERES_DE_TEXTO_COLADO / 2) return true
  const depoisDosDoisPontos = cru.slice(cru.indexOf(':') + 1)
  return cru.includes(':') && depoisDosDoisPontos.trim().length >= CARACTERES_DEPOIS_DOS_DOIS_PONTOS
}

/**
 * Uma mensagem só: o professor está pedindo que a IA **julgue texto ou resposta de aluno**, ou que **dê nota, conceito
 * ou pontuação**? Erra para o lado de recusar.
 *
 * Recusa:
 * - pedido de nota, conceito ou pontuação, ou de dizer se passa, sozinho ("nota?", "ele tira quanto?");
 * - pedido de escrever devolutiva, comentário ou parecer;
 * - julgamento (olhar, conferir, classificar, ranquear, apontar ou marcar erro, aplicar a rubrica, dizer se está bom,
 *   melhorar, reescrever) sobre redação ou discursiva; sobre trabalho **de aluno** ("do aluno", "dela", "da turma"); sobre
 *   o que **uma pessoa pelo nome** escreveu ("o texto do Lucas", "a Ana acertou?"); sobre texto **apontado** ("essa
 *   resposta", "estes três parágrafos"); ou sobre uma resposta;
 * - texto colado com marca de aluno, de redação ou de nome, com ou sem verbo ("segue o texto do Lucas: …");
 * - texto colado com qualquer pedido de opinião ("… o que achou?", "tem erro aqui? …").
 *
 * Passa, porque é trabalho do professor sobre o material dele: "corrige a atividade que eu gerei", "melhora o enunciado
 * da questão 3", "confere o gabarito", e o pedido de rubrica e de critérios, antes da aplicação.
 */
export function pedeJulgamentoDeTextoDeAluno(mensagem: string): boolean {
  const texto = paraARegra(mensagem)
  if (PEDE_NOTA.test(texto) || SO_A_NOTA.test(texto.trim()) || ESCREVE_DEVOLUTIVA.test(texto)) return true
  const colado = trazTextoColado(mensagem)
  const julga = PEDE_JULGAMENTO.test(texto)
  const deAluno = DE_ALUNO.test(texto) || citaPessoaPeloNome(mensagem)
  const apontado = TEXTO_APONTADO.test(texto)
  // A rubrica e os critérios pedidos antes da aplicação passam; aplicados a um texto, não.
  if (PEDE_RUBRICA.test(texto) && !colado && !deAluno && !apontado && !/\baplic\w*/.test(texto)) return false
  if (julga && (REDACAO_OU_DISCURSIVA.test(texto) || deAluno)) return true
  if (colado && (deAluno || REDACAO_OU_DISCURSIVA.test(texto) || julga || PEDE_OPINIAO.test(texto))) return true
  // Daqui para baixo, a marca é fraca: o que o próprio professor diz que é dele, ou do material dele, não é texto de aluno.
  if (DO_PROPRIO_PROFESSOR.test(texto) || DO_MATERIAL.test(texto)) return false
  return julga && (apontado || RESPOSTA.test(texto))
}

/** Os turnos da conversa, como a tarefa os recebe. */
type Turno = EntradaDoAssistente['turnosAnteriores'][number]

/** A mensagem curta que pede opinião, ou nota, sobre o que veio antes: "e aí, ficou bom?", "e esse?", "dá nota pra cada uma". */
function pedeOpiniaoSobreOAnterior(mensagem: string): boolean {
  const texto = paraARegra(mensagem)
  // O pedido que diz sobre o que é, e é do material do professor, não se refere ao texto colado antes.
  if (DO_PROPRIO_PROFESSOR.test(texto) || DO_MATERIAL.test(texto) || PEDE_RUBRICA.test(texto)) return false
  return PEDE_OPINIAO.test(texto) || PEDE_JULGAMENTO.test(texto) || PEDE_NOTA.test(texto) || SO_A_NOTA.test(texto.trim())
}

/**
 * A conversa inteira, e não só a frase (D55; regra 70, item 2a): recusa a mensagem que a regra recusaria, e a que pede
 * opinião, ou nota, depois de um turno do professor com texto colado — colar numa mensagem e perguntar "e aí, ficou
 * bom?" na seguinte é a forma mais comum de pedir pré-correção. Em "só conversar", a resposta atende o último pedido do
 * professor, e por isso ele também passa pela regra.
 *
 * **O que a regra ainda não pega**, dito com franqueza: pedido escrito de um jeito que estas listas não conhecem
 * ("o que a turma entendeu disso?", ironia, abreviação nova); texto de aluno curto colado sem marca nenhuma e sem pedido;
 * julgamento sobre uma pessoa citada só pelo primeiro nome no começo da frase ("Bianca usou bem os conectivos?"); e o
 * que vier por um turno de mais de oito mensagens atrás. Esses seguem para o modelo, sob o prompt, que proíbe julgar
 * texto de aluno, e sob a conferência da saída, que recusa nota, conceito e pontuação. Por isso a tarefa declara
 * `levaTextoDeAluno`. A D55 não se resolve só com lista de palavras.
 */
export function conversaPedeJulgamentoDeTextoDeAluno(mensagem: string, turnosAnteriores: readonly Turno[], semProposta = false): boolean {
  if (pedeJulgamentoDeTextoDeAluno(mensagem)) return true
  const doProfessor = turnosAnteriores.filter((turno) => turno.autor === 'professor').map((turno) => turno.texto)
  if (semProposta && pedeJulgamentoDeTextoDeAluno(doProfessor.at(-1) ?? '')) return true
  return pedeOpiniaoSobreOAnterior(mensagem) && doProfessor.some(trazTextoColado)
}

/**
 * Os turnos anteriores que podem ir ao modelo: sai o turno do professor que a regra recusaria, e sai o texto colado,
 * que pode ser de aluno mesmo sem pedido nenhum junto. O pedido de agora vai inteiro; o contexto perde só isso.
 */
export function turnosQuePodemIrAoModelo(turnosAnteriores: readonly Turno[]): Turno[] {
  return turnosAnteriores.filter((turno) => turno.autor !== 'professor' || !(pedeJulgamentoDeTextoDeAluno(turno.texto) || trazTextoColado(turno.texto)))
}

/** Número de nota, em algarismo ou por extenso. */
const NUMERO_DE_NOTA = String.raw`(\d{1,3}([.,]\d{1,2})?|zero|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|cem)( e meio)?`
/** Onde o número é a nota: acaba a frase, ou vem "pontos", "de 10", "/10". "Dou 3 exemplos" não. */
const FIM_DA_NOTA = String.raw`(?=\s*([.,;!?)]|$|\n|e meio|pontos?\b|de (10|dez)\b|em (10|dez)\b|\/|no maximo|para (ess|est|o text|a redac|a respost)|pra (ess|est)))`
const SAIDA_COM_NOTA: readonly RegExp[] = [
  /\bnotas?\b[^.!?\n]{0,30}\d/,
  new RegExp(String.raw`\bnota( final)?\b[:\s]+(seria |e |de )?${NUMERO_DE_NOTA}\b`),
  /\b\d{1,3}([.,]\d{1,2})?\s*\/\s*(10|100)\b/,
  /\b\d{1,2}([.,]\d{1,2})? (de|em|sobre) (10|dez)\b(?! (questoes|itens|exercicios|alunos|perguntas|minutos|aulas))/,
  /\bpontuac\w+\b[^.!?\n]{0,30}\d/,
  /\b\d{1,3}([.,]\d)? pontos?\b(?! (importantes?|principais|centrais|chave|de atencao|fortes|fracos))/,
  /\b(daria|dou|atribuo|atribuiria|merece|mereceria|ficaria com|tiraria|vale|valeria)\b[^.!?\n]{0,25}\b(nota|conceito)\b/,
  new RegExp(String.raw`\b(daria|dou|atribuo|atribuiria|merece|mereceria|tira|tiraria|tirou|ficaria com|fica com|vale|valeria)\b\s+(um |uma |uns |umas |a |o |cerca de |no maximo |nota )?${NUMERO_DE_NOTA}\b${FIM_DA_NOTA}`),
  /\bconceito\b( final| sugerido| atribuido| proposto)?[:\s]+["“']?(insuficiente|regular|bom|muito bom|otimo|excelente|satisfatorio|insatisfatorio)\b/,
]
/** "Conceito A", "merece um B", "daria um C": a letra maiúscula sozinha, para não confundir com "o conceito a ser trabalhado". */
const SAIDA_COM_CONCEITO_EM_LETRA = /\b([Cc]onceito\b[:\s]+(final\s+)?|([Dd]aria|[Dd]ou|[Aa]tribuo|[Aa]tribuiria|[Mm]erece|[Mm]ereceria|[Tt]iraria|[Ff]icaria com)\s+(um|uma|o)?\s*)["“'‘]?[A-E][+-]?(?![\p{L}-])/u

/**
 * A resposta atribui **nota, conceito ou pontuação**? É a conferência da saída (D55; regra 70, item 2a): o que o
 * modelo disser com nota não é gravado nem chega à tela, qualquer que tenha sido o pedido. A IA desta fatia não dá
 * nota a nada, então a conferência não precisa saber a quê a nota se refere.
 */
export function atribuiNotaOuConceito(resposta: string): boolean {
  const texto = paraARegra(resposta)
  return SAIDA_COM_NOTA.some((padrao) => padrao.test(texto)) || SAIDA_COM_CONCEITO_EM_LETRA.test(semAcento(resposta))
}

const PROBLEMA_DA_NOTA =
  'A resposta atribui nota, conceito ou pontuação. Você não avalia texto nem resposta de aluno: reescreva sem nota, sem conceito e sem pontuação, dizendo que a correção é do professor.'

const PEDE_ADAPTACAO = /\badapt\w*/
const PEDE_PLANO = /\b(planos? de aulas?|planej\w+|sequencia didatica|roteiro de aula)\b/
const PEDE_ATIVIDADE = /\b(atividades?|exercicios?|questoes|questao|lista|quiz|prova|simulado)\b/

/** Onde o assunto acaba: pontuação, a quantidade, a duração, e o "para…", "do aluno…", "que tem…" que falam de gente. */
const FIM_DO_TEMA = String.raw`(?=[.?!\n,;:]|\s+com\s+\d|\s+(?:para|pra|pro)s?\s+|\s+de\s+\d+\s+min|\s+d[oa]s?\s+(?:alun|estudante|turma|\d)|\s+que\s+|\s+porque\s+|$)`
const TEMA_DEPOIS_DE_SOBRE = new RegExp(String.raw`\b(?:sobre|a respeito de|acerca de)\s+(.+?)${FIM_DO_TEMA}`, 'iu')
/** Sem "sobre": o que vem depois do nome da ferramenta e de um "de" ("uma atividade de estequiometria", "lista de exercícios de mol"). */
const TEMA_DEPOIS_DA_FERRAMENTA = new RegExp(
  String.raw`\b(?:atividades?|exerc[ií]cios?|quest(?:ões|ão|oes|ao)|listas?(?:\s+de\s+exerc[ií]cios?)?|quiz|provas?|simulados?|planos?\s+de\s+aulas?|sequ[eê]ncia\s+did[aá]tica|roteiro\s+de\s+aula)(?:\s+objetivas?)?(?:\s+com\s+\d+\s+\S+)?\s+d[eoa]s?\s+(?!\d)(.+?)${FIM_DO_TEMA}`,
  'iu',
)
/** Palavra que diz de uma pessoa, e não de um assunto: tema com ela não é tema. */
const FALA_DE_PESSOA = /\b(alun\w+|estudante\w*|laudo\w*|diagnostic\w*|dislexi\w*|discalculi\w*|tdah|autis\w*|tea|deficien\w*|sindrome\w*|transtorno\w*|baixa visao|ceg[oa]s?|surd[oa]s?|especia(l|is)|inclus\w*)\b/

/**
 * O **assunto** do pedido, para o cartão abrir preenchido: o que vem depois de "sobre", ou depois do nome da ferramenta
 * e de um "de". Para antes de "para…", "do aluno…" e "que tem…", que falam de gente, e não aceita tema que cite aluno
 * ou condição. Sem assunto claro, **não copia a mensagem**: o tema fica sendo a disciplina, e o professor o ajusta no
 * cartão. O que ele disse sobre um aluno nunca vira tema, e por isso não vira título de artefato nem de PDF.
 */
function temaDaMensagem(mensagem: string, disciplina: string): string {
  const achado = TEMA_DEPOIS_DE_SOBRE.exec(mensagem) ?? TEMA_DEPOIS_DA_FERRAMENTA.exec(mensagem)
  const tema = (achado?.[1] ?? '').trim()
  if (tema.length === 0 || FALA_DE_PESSOA.test(normalizar(tema))) return cortar(disciplina, TAMANHO_MAXIMO_DO_TEMA)
  return cortar(tema, TAMANHO_MAXIMO_DO_TEMA)
}

function numeroEntre(achado: RegExpExecArray | null, minimo: number, maximo: number): number | undefined {
  const numero = Number(achado?.[1])
  return Number.isInteger(numero) && numero >= minimo && numero <= maximo ? numero : undefined
}

/**
 * A resposta de quem escolheu "só conversar": texto, sobre o **último pedido** do professor (o turno anterior dele mais
 * recente; sem turno anterior, a mensagem de agora), com a página citada quando o material tem o que dizer. Nunca proposta.
 */
function respostaSoEmTexto(entrada: EntradaDoAssistente): SaidaDoAssistente {
  const pedido = entrada.turnosAnteriores.findLast((turno) => turno.autor === 'professor')?.texto ?? entrada.mensagem
  if (PEDE_ADAPTACAO.test(normalizar(pedido))) {
    return {
      tipo: 'texto',
      texto: 'Sem abrir ferramenta, então. Para adaptar, abra a atividade e escolha “Adaptar”: ela pede só o tipo de adaptação, sem nenhuma informação sobre o aluno, e a versão adaptada espera a sua aprovação.',
      citacoes: [],
    }
  }
  const frase = fatoCitadoNoTexto(extrairFatos(entrada.trechos), pedido) ?? fraseMaisProxima(frasesDoMaterial(entrada.trechos), pedido)
  if (frase !== undefined) {
    return {
      tipo: 'texto',
      texto: cortar(`Sem abrir a ferramenta, então. No material da turma, a página ${frase.pagina} diz: “${frase.frase}” Se quiser, pergunte por outro ponto do capítulo.`, 8000),
      citacoes: [citacaoDaFrase(frase)],
    }
  }
  return {
    tipo: 'texto',
    texto: 'Sem abrir a ferramenta, então. Não achei no material da turma um trecho sobre esse pedido: diga o assunto com outras palavras, ou pergunte por um conceito do capítulo, e eu respondo com a página.',
    citacoes: [],
  }
}

export const proporFerramenta = definirTarefa({
  nome: 'propor_ferramenta',
  funcao: 'conversa_e_ferramentas',
  perfil: 'rapido',
  esquemaDeEntrada: esquemaEntradaDoAssistente,
  esquemaDeSaida: esquemaSaidaDoAssistente,
  prompt: PROMPT_PROPOR_FERRAMENTA,
  maximoDeTokensDeSaida: 800,
  levaTextoLivreDePessoa: true,
  // O professor pode colar texto de aluno na conversa. A regra fixa segura o pedido de julgamento antes do modelo, mas o
  // texto colado sem pedido que ela reconheça segue para o provedor: a declaração é a do pior caso (D62).
  levaTextoDeAluno: true,

  /**
   * A regra da D55 na frente do modelo: pedido de nota, conceito ou pontuação, ou de julgamento de texto de aluno,
   * recebe a recusa fixa **sem chamar modelo nenhum**, qualquer que seja o adaptador. A mensagem não sai daqui.
   */
  semModelo(entrada): SaidaDoAssistente | undefined {
    return conversaPedeJulgamentoDeTextoDeAluno(entrada.mensagem, entrada.turnosAnteriores, entrada.semProposta === true) ? { tipo: 'texto', texto: RECUSA_DE_CORRECAO_DE_TEXTO_DE_ALUNO, citacoes: [] } : undefined
  },

  montarPedido(entrada) {
    return {
      instrucao:
        entrada.semProposta === true
          ? 'O professor escolheu só conversar, sem abrir ferramenta. Responda em texto ao último pedido dele (o turno anterior do professor mais recente; se não houver, a mensagem de agora), citando a página quando a resposta vier do material. A saída é do tipo "texto": não devolva "proposta_de_ferramenta".'
          : 'Responda à mensagem do professor: proponha abrir uma ferramenta, se o pedido corresponder a uma, ou responda em texto.',
      dados: [
        dadoEmJson('serie_e_disciplina', entrada.contexto),
        ...dadosDosTrechos(entrada.trechos),
        // Turno que a regra recusaria, e texto colado, não vão ao modelo (D55).
        ...turnosQuePodemIrAoModelo(entrada.turnosAnteriores).map((turno) => ({ tipo: turno.autor === 'professor' ? 'turno_anterior_do_professor' : 'turno_anterior_do_assistente', corpo: turno.texto })),
        { tipo: 'mensagem_do_professor_agora', corpo: entrada.mensagem },
      ],
    }
  },

  conferir(entrada, saida) {
    // Nota, conceito ou pontuação na resposta é pré-correção (D55): nunca é gravada, venha do pedido que vier.
    const daNota = atribuiNotaOuConceito(saida.texto) ? [PROBLEMA_DA_NOTA] : []
    if (saida.tipo === 'texto') return [...daNota, ...problemasDasCitacoes(saida.citacoes, entrada.trechos, 'Citações')]
    // Quem escolheu só conversar não recebe a mesma pergunta de novo: proposta, aqui, é saída inválida.
    return [...daNota, ...(entrada.semProposta === true ? ['O professor escolheu só conversar: responda com "tipo": "texto", sem "proposta_de_ferramenta".'] : [])]
  },

  falso(entrada): SaidaDoAssistente {
    if (entrada.semProposta === true) return respostaSoEmTexto(entrada)
    const texto = normalizar(entrada.mensagem)
    if (PEDE_ADAPTACAO.test(texto)) {
      // O que o professor disse sobre o aluno não é repetido: a resposta só aponta a ferramenta, que pede o tipo.
      return {
        tipo: 'texto',
        texto: 'A Adaptação parte de uma atividade que já existe: abra a atividade e escolha “Adaptar”. Ela pede só o tipo de adaptação, sem nenhuma informação sobre o aluno, e a versão adaptada espera a sua aprovação.',
        citacoes: [],
      }
    }
    if (PEDE_PLANO.test(texto)) {
      const tema = temaDaMensagem(entrada.mensagem, entrada.contexto.disciplina)
      return {
        tipo: 'proposta_de_ferramenta',
        texto: cortar(`Quer que eu abra a ferramenta de plano de aula sobre “${tema}”? Você ajusta antes de gerar.`, 1000),
        proposta: { ferramenta: 'plano_de_aula', parametros: { tema } },
      }
    }
    if (PEDE_ATIVIDADE.test(texto)) {
      const tema = temaDaMensagem(entrada.mensagem, entrada.contexto.disciplina)
      const quantidade = numeroEntre(/(\d{1,2})\s*(?:questoes|questao|exercicios?|perguntas?|itens)\b/.exec(texto), 1, MAXIMO_DE_QUESTOES_POR_ATIVIDADE)
      return {
        tipo: 'proposta_de_ferramenta',
        texto: cortar(`Quer que eu abra a ferramenta de atividade objetiva${quantidade === undefined ? '' : ` com ${quantidade} questões`} sobre “${tema}”? Você ajusta antes de gerar.`, 1000),
        proposta: { ferramenta: 'atividade_objetiva', parametros: quantidade === undefined ? { tema } : { tema, quantidade } },
      }
    }
    // Pergunta sobre um conceito que o material define é respondida com a definição dele, e não com a frase mais parecida.
    const frase = fatoCitadoNoTexto(extrairFatos(entrada.trechos), entrada.mensagem) ?? fraseMaisProxima(frasesDoMaterial(entrada.trechos), entrada.mensagem)
    if (frase !== undefined) {
      return {
        tipo: 'texto',
        texto: cortar(`No material da turma, a página ${frase.pagina} diz: “${frase.frase}” Posso montar uma atividade objetiva ou um plano de aula sobre isso: é só pedir.`, 8000),
        citacoes: [citacaoDaFrase(frase)],
      }
    }
    return {
      tipo: 'texto',
      texto: 'Eu preparo atividade objetiva, plano de aula e versão adaptada de atividade, sempre a partir do material que a escola subiu e com a página citada. Diga o tema e eu pergunto se você quer abrir a ferramenta.',
      citacoes: [],
    }
  },
})
