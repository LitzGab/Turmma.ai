import { proporFerramenta, type DefinicaoDeTarefa, type EntradaDoAssistente, type SaidaDoAssistente } from '@educa/nucleo'

/**
 * A resposta fixa ao pedido de corrigir, avaliar ou dar nota a redação ou resposta discursiva de aluno (D55; regra 70,
 * item 2a). É texto nosso, não do modelo, e não repete nada do que o professor escreveu: se ele colou o texto de um
 * aluno, nem uma palavra dele volta.
 */
export const RECUSA_DE_CORRECAO_DE_TEXTO_DE_ALUNO =
  'Eu não corrijo nem avalio redação ou resposta discursiva de aluno, não sugiro nota nem conceito e não escrevo devolutiva sobre o texto dele: essa correção é sua. O que eu preparo aqui é atividade objetiva, plano de aula e versão adaptada de atividade, sempre a partir do material da escola.'

/** Minúsculas e sem acento, para a regra não depender de como o professor digitou. */
function semAcentoNemCaixa(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

/** O que se pede: corrigir, avaliar, dar nota, conceito ou pontuação, comentar, dar devolutiva, revisar, pré-corrigir. */
const PEDE_JULGAMENTO = /\b(corrig\w*|corrij\w*|correc\w*|pre-?correc\w*|avali\w*|notas?|pontu\w*|conceitos?|devolutiv\w*|feedbacks?|coment\w*|revis\w*|parecer\w*)\b/
/** Sobre o quê: redação, questão ou prova discursiva, dissertativa, produção textual, texto ou resposta escrita de aluno. */
const SOBRE_TEXTO_DE_ALUNO =
  /\b(redac\w*|discursiv\w*|dissertat\w*|producao textual|producoes textuais|textos? d[eoa]s? (meus? |minhas? )?(alun\w+|estudante\w*)|respostas? (escrita|aberta|dissertativa)s?)\b/

/**
 * O professor está pedindo que a IA julgue texto de aluno? Decide por regra, antes de qualquer chamada: com ela, o
 * texto do aluno que veio na mensagem **não segue para o provedor**. Erra para o lado de recusar: "avalia esta redação",
 * "dá uma nota para a discursiva", "faz a devolutiva do texto do aluno" e "revisa a redação" caem aqui; "monta uma
 * atividade sobre redação" não tem pedido de julgamento, e passa.
 */
export function pedeCorrecaoDeTextoDeAluno(mensagem: string): boolean {
  const texto = semAcentoNemCaixa(mensagem)
  return PEDE_JULGAMENTO.test(texto) && SOBRE_TEXTO_DE_ALUNO.test(texto)
}

/**
 * A tarefa `propor_ferramenta` como o Assistente a usa: a mesma definição da camada de IA (função, perfil, prompt,
 * schemas, conferência), com a regra fixa da D55 na frente. Pedido de corrigir redação ou discursiva recebe a recusa
 * sem chamar modelo nenhum, qualquer que seja o adaptador; o resto segue como estava. A resposta fixa passa pelo mesmo
 * schema e pela mesma conferência, e o consumo dela é registrado como `regra_fixa`, sem entrada nem saída.
 */
export const proporFerramentaDoAssistente: DefinicaoDeTarefa<EntradaDoAssistente, SaidaDoAssistente> = {
  ...proporFerramenta,
  semModelo(entrada) {
    return pedeCorrecaoDeTextoDeAluno(entrada.mensagem) ? { tipo: 'texto', texto: RECUSA_DE_CORRECAO_DE_TEXTO_DE_ALUNO, citacoes: [] } : undefined
  },
}
