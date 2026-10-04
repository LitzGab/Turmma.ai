import { adaptarAtividade } from './adaptar-atividade.js'
import { gerarAtividadeObjetiva } from './gerar-atividade-objetiva.js'
import { gerarPlanoDeAula } from './gerar-plano-de-aula.js'
import { proporFerramenta } from './propor-ferramenta.js'
import { relatorioDaCorrecao } from './relatorio-da-correcao.js'
import { resumoDoAnalista } from './resumo-do-analista.js'
import { turnoDoTutor } from './turno-do-tutor.js'

/**
 * O catálogo das tarefas de IA da fatia. O domínio importa a tarefa pelo nome e a entrega ao `LLMProvider`;
 * tarefa nova entra aqui, com prompt, schemas, conferência e versão determinística.
 */
export const TAREFAS_DE_IA = {
  propor_ferramenta: proporFerramenta,
  gerar_atividade_objetiva: gerarAtividadeObjetiva,
  gerar_plano_de_aula: gerarPlanoDeAula,
  adaptar_atividade: adaptarAtividade,
  turno_do_tutor: turnoDoTutor,
  relatorio_da_correcao: relatorioDaCorrecao,
  resumo_do_analista: resumoDoAnalista,
} as const

export type NomeDaTarefaDeIa = keyof typeof TAREFAS_DE_IA
