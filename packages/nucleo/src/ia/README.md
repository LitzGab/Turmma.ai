# Camada de IA

O domínio pede uma **tarefa** à porta `LLMProvider` e recebe a saída **já validada** e a medição. Ele não conhece
provedor, modelo nem prompt (regra 30). Qual adaptador atende é `IA_ADAPTADOR`: `falso` (determinístico, padrão em
teste e desenvolvimento) ou `openai_compat` (`llama-server` local, ou o provedor contratado).

```ts
import { ErroDeIa, gerarAtividadeObjetiva, type LLMProvider } from '@educa/nucleo'

const { saida, medicao } = await ia.gerar({
  tarefa: gerarAtividadeObjetiva,        // já declara a função (D9), o perfil e o prompt
  escolaId,                              // do contexto ou da execução gravada, nunca do cliente
  entrada: { tema, quantidade: 5, contexto: { serie, disciplina }, habilidades, trechos },
  execucaoId, sinal,                     // o que o ExecutorDeAgente entrega ao trabalho
})
// saida: ConteudoDeAtividade, com a página citada conferida contra os trechos
// falha: sempre ErroDeIa (codigoDeIa: IA_INDISPONIVEL | IA_TEMPO_ESGOTADO | IA_SAIDA_INVALIDA | …)
```

- **Tarefas** (`tarefas/`, catálogo em `TAREFAS_DE_IA`): `propor_ferramenta`, `gerar_atividade_objetiva`,
  `gerar_plano_de_aula`, `adaptar_atividade`, `turno_do_tutor`, `relatorio_da_correcao`, `resumo_do_analista`.
  A entrada é estrita: não existe chave para nome de aluno ou de professor. No Tutor, `alunoId` vai no pedido.
- **Toda chamada** confere `SuspensaoDeFuncao` (função suspensa pela escola recusa com `IA_FUNCAO_SUSPENSA`), consulta
  `OrcamentoDeIa` antes de gastar e grava em `RegistroDeConsumo` depois. Entrada e saída vão para o registro, nunca
  para o log; em tarefa que leva texto de aluno (o Tutor) nem para o registro.
- **Função que roda sem modelo** (a correção de objetiva) chama `exigirFuncaoAtiva(suspensao, escolaId, funcao)` antes.
- **Prompt** é arquivo versionado em `prompts/`; a versão determinística de cada tarefa é o `falso` dela.
- **`ExecutorDeAgente`** roda o trabalho depois do `202`: `executor.agendar({ id, escolaId, chave }, (sinal) => …)`.
  No boot, `executor.iniciar()` encerra o que ficou preso. Roda no processo da API (`TODO(fila)`, D77).
