import { CATEGORIAS_DE_RETENCAO } from '@educa/shared'
import { TEXTO_DA_SUPERVISAO } from '../tutor'

/**
 * O aviso de privacidade do aluno (telas do aluno e primeiro acesso, 9.0; RF14; D58, D59, D62; ECA Digital, art. 16;
 * LGPD, art. 14, § 6º): o que a escola guarda, quem vê e como pedir, **em linguagem de 11 anos**. Texto fixo, em `.ts` com
 * teste: cada frase tem até 15 palavras, sem termo jurídico, e **nunca diz "nota"** (o resultado de uma tarefa não é `Nota`, D46).
 * Nada aqui varia com presença, ausência, acerto nem tempo de uso.
 *
 * O prazo da conversa com o Tutor sai do catálogo de retenção (`CATEGORIAS_DE_RETENCAO.conversa_tutor`), e não de um número
 * escrito à mão: se o piso ou o teto mudarem, o aviso muda junto. O das tarefas não leva número, porque a escola o escolhe
 * e a tela não faz chamada nova de API para saber qual.
 */

const { piso, teto } = CATEGORIAS_DE_RETENCAO.conversa_tutor

export const FALA_DO_AVISO = 'Veja o que a escola guarda de você.'

export const FRASE_DO_NOME_TURMA_MATRICULA = 'A escola guarda seu nome, sua turma e sua matrícula.'
export const FRASE_DAS_TAREFAS = 'A escola guarda suas tarefas e o resultado delas.'
export const FRASE_DA_CONVERSA = 'A escola guarda o que você escreve para o Tutor e o que ele responde.'
export const FRASE_DO_PRAZO_DA_CONVERSA = `A conversa com o Tutor fica de ${String(piso)} a ${String(teto)} meses; a escola escolhe.`
export const FRASE_DO_PRAZO_DAS_TAREFAS = 'Suas tarefas ficam pelo tempo que a escola escolhe.'
export const FRASE_DO_QUE_NAO_TEMOS = 'Não temos seu e-mail, telefone, CPF, foto, endereço nem data de nascimento.'

export const FRASE_DO_PROFESSOR = 'O professor da turma vê suas tarefas e o resultado.'
/** A mesma frase da faixa fixa do Início (D8; uma formulação só): importada, e não repetida. */
export const FRASE_DA_SUPERVISAO = TEXTO_DA_SUPERVISAO
export const FRASE_DA_COORDENACAO = 'A coordenação vê os números da turma toda.'
export const FRASE_DO_REGISTRO = 'Ver algo seu fica registrado.'
export const FRASE_DOS_COLEGAS = 'Seus colegas não veem nada seu.'
/**
 * O sinal "precisa de atenção humana": quando o aluno escreve ao Tutor sobre algo pessoal difícil, o servidor o grava e o professor
 * da turma o recebe com o nome do aluno (`supervisao.service.ts`). O aluno tem de saber disso antes de escrever (LGPD, art. 6º, VI, e
 * art. 14, § 6º; ECA Digital, art. 16). O professor **não abre a conversa** hoje (`docs/interface.md`, "O que o Tutor viu": nada na tela abre a conversa de um
 * aluno), e por isso o aviso não diz que abre.
 */
export const FRASE_DO_AVISO_DE_ATENCAO = 'Se você contar algo pessoal difícil, quem dá a aula é avisado.'

/**
 * A subtarefa 9.1 punha o que vai à IA numa frase só, de 22 palavras: mais que o limite de 15. Ficam duas, e a segunda diz de
 * quem é o programa (D62).
 */
export const FRASE_DO_QUE_VAI_A_IA = 'O que você escreve e as habilidades a rever vão a um programa de IA.'
export const FRASE_DA_EMPRESA = 'Esse programa é de uma empresa contratada.'
export const FRASE_DO_NAO_TREINA = 'Seus dados não treinam IA.'

export const FRASE_DE_COMO_VER = 'Para ver seus dados, abra Eu e depois Privacidade.'
export const FRASE_DE_COMO_PEDIR = 'Para pedir mais, fale com quem dá a aula ou com a coordenação.'

export interface GrupoDoAviso {
  readonly titulo: string
  readonly frases: readonly string[]
}

/** Os grupos, na ordem em que o aluno os lê. O título é só um rótulo: quem vê o conteúdo são as frases. */
export const GRUPOS_DO_AVISO: readonly GrupoDoAviso[] = [
  {
    titulo: 'O que a escola guarda',
    frases: [FRASE_DO_NOME_TURMA_MATRICULA, FRASE_DAS_TAREFAS, FRASE_DA_CONVERSA, FRASE_DO_PRAZO_DA_CONVERSA, FRASE_DO_PRAZO_DAS_TAREFAS, FRASE_DO_QUE_NAO_TEMOS],
  },
  {
    titulo: 'Quem vê',
    frases: [FRASE_DO_PROFESSOR, FRASE_DA_SUPERVISAO, FRASE_DO_AVISO_DE_ATENCAO, FRASE_DA_COORDENACAO, FRASE_DO_REGISTRO, FRASE_DOS_COLEGAS],
  },
  {
    titulo: 'Para onde vai',
    frases: [FRASE_DO_QUE_VAI_A_IA, FRASE_DA_EMPRESA, FRASE_DO_NAO_TREINA],
  },
  {
    titulo: 'Seus dados',
    frases: [FRASE_DE_COMO_VER, FRASE_DE_COMO_PEDIR],
  },
]

/** Todas as frases do aviso, na ordem. */
export const FRASES_DO_AVISO: readonly string[] = GRUPOS_DO_AVISO.flatMap((grupo) => grupo.frases)
