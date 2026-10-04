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

/**
 * Pedido de **nota, conceito ou pontuação** à IA: recusa sozinho, sem precisar de outra palavra. "Dê o conceito de
 * mol" pede uma definição, e passa; "atividade sobre pontuação" é assunto de aula, e passa.
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
    String.raw`\bmerec\w*\b[^.?!]{0,30}\b(nota|conceito|pontos?)\b`,
    String.raw`\b(nota|conceito)\b[^.?!]{0,20}\bmerec\w*`,
    String.raw`\bquanto (vale|valeria|merece|mereceria|voce daria|vc daria|daria|tirou|tiraria)\b`,
    String.raw`\bquantos pontos\b`,
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

/** Pedido de **julgamento**: olhar, achar, analisar, avaliar, corrigir, comentar, dizer se está bom, apontar erro, melhorar, reescrever, revisar. */
const PEDE_JULGAMENTO = new RegExp(
  String.raw`\b(` +
    [
      String.raw`d[ae]r? uma (olhada|olhadinha|lida|conferida|revisada|corrigida|analisada)`,
      String.raw`olha(da)? (ess|est|nes|iss|ist|aqui|so|o que)\w*`,
      String.raw`(ve|veja|ver) (se|ess\w*|est\w*|iss\w*|ist\w*|o que)`,
      String.raw`o que (voce |vc |tu )?(acha|achou|pensa|diz|me diz)`,
      String.raw`que (voce |vc )?(acha|achou)`,
      String.raw`analis\w*|avali\w*|corrig\w*|corrij\w*|correc\w*|pre-?correc\w*|coment\w*`,
      String.raw`(esta|estao|ta|tao|ficou|ficaram) (bom|boa|bons|boas|certo|certa|certos|certas|correto|correta|ok|adequad\w*|ruim|errad\w*|legal|coerent\w*)`,
      String.raw`apont\w* (os |as |o que )?(erros?|falhas?|problemas?|esta errado)`,
      String.raw`(os |quais (sao )?(os )?)erros (d|ness|nest|que)\w*`,
      String.raw`melhor(a|e|ar|ando|aria|em)|reescrev\w*|revis\w*|devolutiv\w*|feedbacks?|parecer\w*|julg\w*|opin\w*`,
    ].join('|') +
    String.raw`)\b`,
)

/** O que é texto escrito: resposta, texto, parágrafo, redação, trabalho, produção. */
const TEXTO = String.raw`(respostas?|textos?|textinhos?|paragrafos?|redac\w+|trabalhos?|producao|producoes|dissertac\w+|composic\w+|relatorios?|resumos?|resenhas?)`
/** O que o aluno produz e não é só texto: prova, atividade, exercício, questão, tarefa. Só conta com a marca de que é de um aluno. */
const TRABALHO = String.raw`(${TEXTO}|provas?|atividades?|exercicios?|questao|questoes|tarefas?|licao|licoes|cadernos?)`
/** A marca forte de que o trabalho é de um aluno: "do aluno", "da aluna", "dele", "dela", "que o Caio escreveu". */
const DE_ALUNO = new RegExp(
  [
    String.raw`\b${TRABALHO}\b[^.?!]{0,40}\bd(e|[oa]s?) (meus? |minhas? |um |uma |cada |algum |alguns |algumas )?(alun\w+|estudante\w*|menin\w+|garot\w+|crianca\w*)\b`,
    String.raw`\b(alun\w+|estudante\w*)\b[^.?!]{0,40}\b(escrev\w+|respond\w+|redig\w+|entreg\w+|fez|fizeram|produziu|produziram|mandou|mandaram)\b`,
    String.raw`\b${TRABALHO} (\w+ ){0,2}del[ea]s?\b`,
    String.raw`\b${TRABALHO}\b[^.?!]{0,20}\bque (?!eu |voce |vc |tu |nos |a gente |a ia |o assistente )(o |a |os |as |um |uma |meu |minha )?\w+ (\w+ ){0,2}(escreveu|escreveram|fez|fizeram|respondeu|responderam|entregou|entregaram|produziu|mandou|redigiu)\b`,
  ].join('|'),
)
/** Redação e prova discursiva são, por natureza, texto de aluno. */
const REDACAO_OU_DISCURSIVA = /\b(redac\w+|discursiv\w+|dissertat\w+|producao textual|producoes textuais)\b/
/** A marca fraca: o texto está aqui, apontado ou colado ("essa resposta", "o texto abaixo", "a redação a seguir"). */
const TEXTO_APONTADO = new RegExp(
  [
    String.raw`\b(ess[ea]s?|est[ea]s?|ness[ea]s?|nest[ea]s?|dess[ea]s?|dest[ea]s?) ${TEXTO}\b`,
    String.raw`\b${TEXTO}\b[^.?!]{0,20}\b(abaixo|a seguir|seguintes?|colad\w+|em anexo|anexad\w+|aqui)\b`,
  ].join('|'),
)
const RESPOSTA = /\brespostas?\b/
/** O gabarito e as alternativas são do material do professor: "confere se a resposta do gabarito está certa" é trabalho dele. */
const DO_GABARITO = /\b(gabarito\w*|alternativas?)\b/
/** O que é do próprio professor, ou do Assistente: "que eu gerei", "que você montou", "meu plano", "minha atividade". */
const DO_PROPRIO_PROFESSOR =
  /\bque (eu|voce|vc|a gente|nos) (\w+ )?(gerei|gerou|geramos|fiz|fez|fizemos|escrevi|escreveu|montei|montou|montamos|criei|criou|elaborei|elaborou|preparei|preparou)\b|\b(meu|minha|meus|minhas) (plano|texto|enunciado|atividade|prova|questao|questoes|aula|material|rubrica|criterios?)\b/
/** Opinião pedida sobre algo que veio junto: "o que achou?", "dá uma olhada", "está bom?". */
const PEDE_OPINIAO = /\b(o que (voce |vc |tu )?(acha|achou)|que (voce |vc )?(acha|achou)|d[ae]r? uma (olhada|olhadinha|lida)|(esta|ta|ficou) (bom|boa|certo|certa|ok|legal)|olha (isso|isto|so|aqui)|corrig\w*|corrij\w*|avali\w*|analis\w*|coment\w*|apont\w* (os )?erros)\b/

const ASPAS_LONGAS = /[“"][^”"]{60,}[”"]/u
const CARACTERES_DE_TEXTO_COLADO = 160
const CARACTERES_DEPOIS_DOS_DOIS_PONTOS = 80

/** A mensagem traz um bloco de texto colado: aspas compridas, várias linhas, ou dois-pontos seguidos de um parágrafo. */
function trazTextoColado(mensagem: string): boolean {
  const cru = mensagem.trim()
  if (ASPAS_LONGAS.test(cru) || cru.length >= CARACTERES_DE_TEXTO_COLADO) return true
  if (cru.includes('\n') && cru.length >= CARACTERES_DE_TEXTO_COLADO / 2) return true
  const depoisDosDoisPontos = cru.slice(cru.indexOf(':') + 1)
  return cru.includes(':') && depoisDosDoisPontos.trim().length >= CARACTERES_DEPOIS_DOS_DOIS_PONTOS
}

/**
 * O professor está pedindo que a IA **julgue texto ou resposta de aluno**, ou que **dê nota, conceito ou pontuação**?
 * Decide por regra, antes de qualquer chamada: com ela, a mensagem **não segue para o provedor** (`semModelo`), e por
 * isso o texto do aluno que veio colado também não. Erra para o lado de recusar.
 *
 * Recusa:
 * - pedido de nota, conceito ou pontuação, sozinho ("que nota você daria?", "que conceito merece esse texto?");
 * - pedido de julgamento (olhar, achar, analisar, avaliar, corrigir, comentar, dizer se está bom, apontar erro,
 *   melhorar, reescrever, revisar) sobre redação ou discursiva; sobre trabalho **de aluno** ("do aluno", "dela", "que o
 *   Caio escreveu"); sobre texto **apontado ou colado** ("essa resposta", "o texto abaixo"); ou sobre uma resposta;
 * - pedido de opinião com um bloco de texto colado junto ("…o que achou?").
 *
 * Passa, porque é trabalho do professor sobre o material dele: "corrige a atividade que eu gerei", "avalia se essa
 * questão está boa", "melhora o enunciado da questão 3", "monta uma rubrica de redação", "cria critérios para a
 * discursiva".
 *
 * **O que a regra não pega**: texto de aluno colado sem nenhuma palavra de julgamento nem de nota ("segue o que a
 * turma escreveu", ou só o texto), e pedido escrito de um jeito que estas listas não conhecem. Esses seguem para o
 * modelo, sob o prompt, que proíbe corrigir e avaliar, e sob a conferência da saída, que recusa nota, conceito e
 * pontuação (`atribuiNotaOuConceito`). Por isso a tarefa declara `levaTextoDeAluno`.
 */
export function pedeJulgamentoDeTextoDeAluno(mensagem: string): boolean {
  const texto = normalizar(mensagem).replace(NOTA_QUE_NAO_E_DE_ALUNO, ' ')
  if (PEDE_NOTA.test(texto)) return true
  const julga = PEDE_JULGAMENTO.test(texto)
  if (julga && (REDACAO_OU_DISCURSIVA.test(texto) || DE_ALUNO.test(texto))) return true
  // Daqui para baixo, a marca é fraca: o que o próprio professor diz que é dele, ou do gabarito, não é texto de aluno.
  if (DO_PROPRIO_PROFESSOR.test(texto)) return false
  if (julga && (TEXTO_APONTADO.test(texto) || (RESPOSTA.test(texto) && !DO_GABARITO.test(texto)))) return true
  return PEDE_OPINIAO.test(texto) && trazTextoColado(mensagem)
}

/** O que o professor pediu, para a regra: a mensagem de agora e, em "só conversar", o último pedido dele, que é o que a resposta atende. */
function pedidoParaARegra(entrada: EntradaDoAssistente): string {
  const ultimoPedido = entrada.semProposta === true ? (entrada.turnosAnteriores.findLast((turno) => turno.autor === 'professor')?.texto ?? '') : ''
  return `${ultimoPedido}\n${entrada.mensagem}`
}

const SAIDA_COM_NOTA: readonly RegExp[] = [
  /\bnotas?\b[^.!?\n]{0,30}\d/,
  /\b\d{1,3}([.,]\d{1,2})?\s*\/\s*(10|100)\b/,
  /\b\d{1,2}([.,]\d{1,2})? (de|em|sobre) (10|dez)\b(?! (questoes|itens|exercicios|alunos|perguntas|minutos|aulas))/,
  /\bpontuac\w+\b[^.!?\n]{0,30}\d/,
  /\b\d{1,3}([.,]\d)? pontos?\b(?! (importantes?|principais|centrais|chave|de atencao|fortes|fracos))/,
  /\b(daria|dou|atribuo|atribuiria|merece|mereceria|ficaria com|tiraria|vale|valeria)\b[^.!?\n]{0,25}\b(nota|conceito)\b/,
  /\b(eu )?(daria|dou|atribuo|atribuiria) (um|uma) \d/,
  /\bconceito\b( final| sugerido| atribuido| proposto)?[:\s]+["“']?(insuficiente|regular|bom|muito bom|otimo|excelente|satisfatorio|insatisfatorio)\b/,
]
/** "Conceito A", "conceito: B": a letra maiúscula sozinha, para não confundir com "o conceito a ser trabalhado". */
const SAIDA_COM_CONCEITO_EM_LETRA = /\b[Cc]onceito\b[:\s]+(final\s+)?["“'‘]?[A-E]\b(?![\p{L}-])/u

/**
 * A resposta atribui **nota, conceito ou pontuação**? É a conferência da saída (D55; regra 70, item 2a): o que o
 * modelo disser com nota não é gravado nem chega à tela, qualquer que tenha sido o pedido. A IA desta fatia não dá
 * nota a nada, então a conferência não precisa saber a quê a nota se refere.
 */
export function atribuiNotaOuConceito(resposta: string): boolean {
  const texto = normalizar(resposta).replace(NOTA_QUE_NAO_E_DE_ALUNO, ' ')
  return SAIDA_COM_NOTA.some((padrao) => padrao.test(texto)) || SAIDA_COM_CONCEITO_EM_LETRA.test(resposta)
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
    return pedeJulgamentoDeTextoDeAluno(pedidoParaARegra(entrada)) ? { tipo: 'texto', texto: RECUSA_DE_CORRECAO_DE_TEXTO_DE_ALUNO, citacoes: [] } : undefined
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
        ...entrada.turnosAnteriores.map((turno) => ({ tipo: turno.autor === 'professor' ? 'turno_anterior_do_professor' : 'turno_anterior_do_assistente', corpo: turno.texto })),
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
