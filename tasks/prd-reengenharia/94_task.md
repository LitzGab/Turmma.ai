# Tarefa 94.0 — Frase de risco à vida que só o modelo reconhece recebe o 188 e o sinal

**Funcionalidade:** reengenharia · **Depende de:** 93.0
**Subagentes obrigatórios:** `conformidade-reviewer`, `llm-integrator`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Quando o padrão não reconhece a frase e o modelo a classifica como risco à vida, o aluno recebe a mensagem fixa com o 188
e o professor, o sinal `atencao_humana`, como na frase que o padrão pega; a regra continua decidindo, e o modelo só soma.

## Contexto necessário

- `onda-0.md` §2.2a (o desenho e o alvo) e §2.1 ("O lote retido")
- `prd.md` RF1; `docs/aia/ouro/README.md`, as categorias de `riscoAVida` e as decisões 4, 5 e 5a
- `.claude/rules/30-camada-ia.md` (itens 3, 6 e 7), `.claude/rules/70-conformidade-cne.md` (itens 4, 4a e 7), D36 e D57
- Código: `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`: `CLASSIFICACOES_DO_TURNO` (:23), `esquemaSaidaDoTutor` (:60),
  `mensagemFixaDoAssuntoDelicado` (:337), `problemasDoTurno` (:527), `turnoDoTutor.ajustar` (:588);
  `packages/nucleo/src/ia/prompts/turno-do-tutor.ts`; `apps/api/src/tutor/tutor.service.ts` (:231, :307), que **não muda**
- `docs/aia/tutor.md` §1.4, §1.5 e as limitações conhecidas
- **Não abra** `docs/aia/ouro/*.json` nem `docs/aia/ouro-retido/`

## Subtarefas

- [ ] 94.1 — `risco_a_vida` na saída do modelo; o `ajustar` a troca por `assunto_delicado` com `MENSAGEM_DE_RISCO_A_VIDA`, e
  nenhuma saída da tarefa leva `risco_a_vida` (o serviço, o check do banco, `packages/shared` e a web não mudam)
- [ ] 94.2 — O prompt: `risco_a_vida` é o que o aluno escreveu sobre tirar a própria vida, se machucar de propósito, outra
  pessoa que vai fazer isso, ou o meio; nunca o que ele sente. Ameaça a terceiro continua `assunto_delicado`. Sobe a `versao`
- [ ] 94.3 — `tools/ia/medir-risco-a-vida.ts <lote.json>`: roda `mencionaRiscoAVida` e o `turnoDoTutor` com o adaptador da
  configuração (`IA_ADAPTADOR=ollama`), e imprime, por categoria, o padrão sozinho e o padrão ou o modelo, em três
  execuções, valendo a pior; a precisão e os pisos como no `ouro.ts` (`medir`). Não roda no portão
- [ ] 94.4 — `docs/aia/tutor.md`: o modelo que classifica o risco (escopo positivo), o que ele não faz (escopo negativo:
  não infere estado emocional), a medida que fica com o Arquiteto e a limitação até a D37
- [ ] 94.5 — Testes, como na tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` | alterado |
| `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts` | alterado |
| `packages/nucleo/src/ia/prompts/turno-do-tutor.ts` | alterado |
| `apps/api/src/tutor/tutor-modelo.int.test.ts` | alterado |
| `tools/ia/medir-risco-a-vida.ts`, `tools/ia/medir-risco-a-vida.test.ts` | novo |
| `docs/aia/tutor.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | Mutação que deixa vermelho |
|---|---|---|
| Frase sem gatilho, modelo diz `risco_a_vida` com texto próprio: sai `assunto_delicado` com `MENSAGEM_DE_RISCO_A_VIDA` | unidade, `turno-do-tutor.test.ts` | tirar o ramo de `risco_a_vida` do `ajustar` |
| Frase sem gatilho, modelo diz `assunto_delicado`: a mensagem continua a sem 188 | unidade | mensagem de risco para todo delicado |
| Nenhuma das cinco classificações do modelo sai da tarefa como `risco_a_vida` (`it.each`) | unidade | devolver a saída do modelo sem trocar |
| Frase com gatilho e modelo dizendo `normal`: continua a de risco, sem modelo | unidade (caracterização, já existe) | — |
| O prompt nomeia `risco_a_vida` pelo que o aluno escreveu e a `versao` mudou | unidade | voltar a `versao` |
| Rota: modelo diz `risco_a_vida`, 202, mensagem fixa com o 188, `atencao_humana` sem referência | integração, `tutor-modelo.int.test.ts` | tirar o ramo do `ajustar` |
| Rota com a avaliação aberta antes da conclusão e o modelo dizendo `risco_a_vida`: a mensagem e o sinal ficam, e a troca conta | integração | tirar o ramo do `ajustar` |
| A ferramenta: padrão ou modelo por categoria, a pior de três, com `AdaptadorRoteirizado` que muda entre execuções | unidade, `medir-risco-a-vida.test.ts` | tomar a melhor execução |

Isolamento, log e concorrência não mudam: a saída é a de hoje, no mesmo turno.

## Como testar

- Unidade: copie `turno-do-tutor.test.ts › se o modelo classificar como delicado o que os gatilhos não pegaram, o texto
  dele é trocado pela mensagem fixa` (`:427`), com `classificacao: 'risco_a_vida'` e `MENSAGEM_DE_RISCO_A_VIDA`
- Rota: `tutor-modelo.int.test.ts › quando é o modelo que classifica o turno como assunto delicado, o aluno recebe a
  mensagem fixa, e o professor, o sinal sem referência` (`:335`) e `› abre antes da conclusão e o modelo classificou
  assunto delicado…` (`:414`), com `subirModeloDeMentira` (`apps/api/test/escola-com-tutor.ts`)
- Rodar: `npx vitest run --project unidade packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts tools/ia/medir-risco-a-vida.test.ts`
  e `npx vitest run --project integracao apps/api/src/tutor/tutor-modelo.int.test.ts`
- A ferramenta com o Ollama se roda à mão, só sobre as `dev`; o lote retido é do Arquiteto
- Armadilha: frase com gatilho não vai ao modelo (`semModelo`); a frase de teste da rota tem de escapar do padrão

## Fora do escopo desta tarefa

Os padrões (93.0); a resposta à ameaça a terceiro (`TODO.md`); o lote retido 2 e a sua medida (Arquiteto); o provedor de
produção (D37).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
