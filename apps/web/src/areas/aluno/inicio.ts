import type { MinhaAtividade } from '@educa/shared'
import { estaParaResponder } from './atividades'

/**
 * O que o Início do aluno diz e escolhe (telas do aluno e primeiro acesso, 3.0; RF4, RF5, RF10; D58, D59). Aqui mora a
 * regra, sem tela e sem rede. **A saudação é fixa**: o mesmo texto para qualquer nome, a qualquer hora, sem "de volta",
 * sem "faz tempo" e sem número de uso. O Início não mede nem mostra quanto o aluno usou o Tutor: o "Hoje: N de 60" fica
 * na tela do Tutor (Tech Spec, 7c).
 */

/** Quantas tarefas o Início mostra em "Para fazer": as primeiras da primeira página. As outras estão em "Tarefas". */
export const MAXIMO_DE_TAREFAS_NO_INICIO = 3

/** O que o Início diz quando não há tarefa para fazer. Não promete o Tutor: diz que ele ajuda quando houver tarefa. */
export const TITULO_DO_VAZIO = 'Nenhuma tarefa por agora'
export const TEXTO_DO_VAZIO = 'O Tutor ajuda nas tarefas. Quando houver uma, ela aparece aqui.'

/** O primeiro nome, ou `undefined` quando o nome ainda não chegou (ou veio vazio). */
export function primeiroNome(nome: string | undefined): string | undefined {
  const primeiro = nome?.trim().split(/\s+/)[0]
  return primeiro === undefined || primeiro === '' ? undefined : primeiro
}

/** "Oi, Ana." — e só "Oi." enquanto o nome não chegou. Nunca varia com presença, ausência nem tempo de uso. */
export function saudacaoDoAluno(nome: string | undefined): string {
  const primeiro = primeiroNome(nome)
  return primeiro === undefined ? 'Oi.' : `Oi, ${primeiro}.`
}

/** As tarefas de "Para fazer": as que ainda esperam resposta, **na ordem em que a API entregou**, até o máximo do Início. */
export function tarefasParaFazer<Atividade extends Pick<MinhaAtividade, 'situacao'>>(primeiraPagina: readonly Atividade[]): Atividade[] {
  return primeiraPagina.filter(estaParaResponder).slice(0, MAXIMO_DE_TAREFAS_NO_INICIO)
}
