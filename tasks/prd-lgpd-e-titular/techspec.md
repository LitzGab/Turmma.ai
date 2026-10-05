# Tech Spec — LGPD e titular

**PRD:** `tasks/prd-lgpd-e-titular/prd.md`
**Status:** rascunho

> **Teto de 2.000 palavras excedido, com aceite do Joaquim (05/10/2026).** São três fatias independentes num documento
> só, e cortar mais tiraria o catálogo de retenção e as travas, que as tarefas teriam de redecidir. Cada tarefa lê só a
> seção dela.

## 1. Resumo da abordagem

1. **Retenção.** Catálogo de categorias em código, com padrão, piso e teto; `retencao_escola` guarda só o ajuste.
   Toda noite, uma rotina abre um job **por escola**, que roda no contexto dela (escopo no repository), apaga ou
   anonimiza o vencido e enfileira as eliminações cujo prazo chegou.
2. **Suboperador e incidente.** Tabelas da operação, escritas por `ops:*`, lidas pela escola por junção com a escola
   do token.
3. **Pedido do titular.** A API registra e enfileira; o worker monta o JSON no storage privado e elimina, com o
   `CicloDeVidaService` movido de `apps/api` para `packages/nucleo`.

Nada usa IA.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `packages/shared/src/privacidade` | novo | catálogo, prazos fixos, contratos e erros (`RETENCAO_FORA_DO_LIMITE`, `PEDIDO_EM_ESTADO_INVALIDO`) |
| `packages/nucleo/src/ciclo-de-vida` | movido de `apps/api/src/sessao` | `CicloDeVidaService` e repositórios, com os testes |
| `packages/nucleo/src/retencao` | alterado | `ExpurgoDaEscolaRepository` e `RetencaoDaEscolaRepository`, com escopo do contexto |
| `packages/nucleo/src/rotina` | novo | `EscolasDaRotinaRepository`, único `@SemEscopo` novo: ids das escolas |
| `packages/nucleo/src/titular` | novo | `LeituraDoTitular`, `TrocaDeNome`, `Compartilhamento`, porta `ArmazemDeArquivos` (S3 e falso) |
| `packages/nucleo/src/ia` | alterado | grava `consumo_ia.provedor` de `IA_PROVEDOR_ID` |
| `apps/api/src/privacidade` | novo | as rotas da seção 4 |
| `apps/api/src/sessao` | alterado | guarda e logins recusam `eliminacao_agendada_em` |
| `apps/api/src/ops` | alterado | `ops:retencao`, `ops:suboperador`, `ops:incidente`, `ops:privacidade` (contagens) |
| `apps/worker` | alterado | quatro processadores e um agendamento (seção 5) |
| `apps/web` | alterado | seção 9 |
| `docs/` | alterado | `lgpd.md` (na tarefa da migration), `modelo-de-dados.md`, `runbook.md`, `arquitetura.md` |

## 3. Modelo de dados

**Catálogo** (`CATEGORIAS_DE_RETENCAO`), em meses. Piso e teto são proposta minha, para o Joaquim aprovar (PRD 10):

| Categoria | O que o expurgo faz | Conta de | Padrão | Piso | Teto |
|---|---|---|---|---|---|
| `conversa_tutor` | apaga `mensagem_tutor` | data da mensagem | 12 | 3 | 24 |
| `sinal_tutor` | apaga `sinal_tutor` | data do sinal | 12 | 3 | 24 |
| `conversa_professor` | apaga `mensagem_agente`, e a `thread_agente` que ficou vazia | data da mensagem | 12 | 3 | 24 |
| `execucao_agente` | anula `entrada`, `resultado`, `erro` e `solicitada_por`, e **mantém a linha** | criação | 12 | 3 | 24 |
| `texto_do_modelo` | anula `consumo_ia.entrada` e `saida` | `em` | 12 | 1 | 12 |
| `consumo_por_aluno` | anula `consumo_ia.aluno_id` | `em` | 12 | 3 | 24 |
| `trabalho_do_aluno` | apaga `tentativa_atividade` (a `resposta_atividade` e a `correcao` saem em cascata) | `fim` do ano letivo encerrado | 12 | 6 | 60 |
| `reivindicacao_decidida` | apaga o pedido decidido ou encerrado | data da decisão | 60 | 12 | 60 |
| `autoria_de_artefato` | anula `artefato.criado_por` | `fim` do ano letivo | 60 | 12 | 60 |
| `material_excluido` | apaga o `material` excluído | `excluido_em` | 60 | 12 | 60 |
| `pessoa_desativada` | elimina o usuário pelo ciclo de vida | `desativado_em` | 60 | 12 | 60 |

A `execucao_agente` é anonimizada, não apagada: oito tabelas a referenciam sem `on delete`, inclusive o `artefato`, que
fica 5 anos.

**Prazos fixos** (`PRAZOS_FIXOS`): registro de acesso, sessão, convite e acesso da turma seguem no
`sistema.expurgar-acesso`; auditoria, `entrega`, `validacao_do_lote`, `suspensao_de_funcao`, `atividade_aplicada` e
`pedido_titular` ficam vigência + 5 anos (sai no fim de contrato, F12); `arquivo_titular` 7 dias; `incidente` 5 anos;
`expurgo_execucao` 90 dias. Um teste de arquitetura classifica **toda** tabela como categoria, prazo fixo ou "sem
pessoa", e quebra com tabela nova não classificada.

**Migration 0024**, só de expansão:

```
retencao_escola      escola_id*, categoria* (PK composta), meses*, referencia_contrato* (≤200),
                     alterada_em*, alterada_por* (apelido do operador)
pedido_titular       id, escola_id*, titular_id* (sem FK: sobrevive à eliminação; gatilho confere na inserção que é
                     usuário da escola), papel_titular*, tipo* (acesso|portabilidade|compartilhamento|correcao|eliminacao),
                     solicitante* (titular|responsavel_legal), chegou_em* (date), estado* (recebido|em_preparacao|pronto|
                     agendado|concluido|cancelado), eliminar_em?, nomes_trocados?, homonimo?, registrado_por*,
                     registrado_em*, concluido_por?, concluido_em?, cancelado_por?, cancelado_em?, chave_envio*
                     (única por escola)
arquivo_titular      id, escola_id*, pedido_id* (FK composta), versao* (completa|coordenacao), chave_objeto*, bytes*,
                     pronto_em*, expira_em*, apagado_em?
suboperador          id, chave* (única: o IA_PROVEDOR_ID, ou `hospedagem`), nome*, finalidade*, categorias* text[],
                     pais*, contrato*, veda_treinamento*, alcance* (todas|lista), inicio*, fim?, registrado_por*
suboperador_escola   suboperador_id*, escola_id*, inicio*, fim?
incidente            id, conhecido_em*, circunstancias* (≤1000), categorias* text[] (lista fechada),
                     titulares_estimados*, risco* (baixo|relevante|alto), contencao* (≤1000), correcao* (≤1000),
                     registrado_por*, registrado_em*
incidente_escola     incidente_id*, escola_id*, avisado_em*, confirmado_em?, confirmado_por? (gatilho, como a auditoria)
expurgo_execucao     id, escola_id*, categoria*, linhas*, em*
usuario              + eliminacao_agendada_em?
consumo_ia           + provedor?
auditoria            check `auditoria_operador_formato` aceita o autor reservado `rotina`
```

`suboperador` e `incidente` são da operação, sem `escola_id` (exceção da regra transversal 1 de
`docs/modelo-de-dados.md`); as ligações têm. Nada novo tem `ano_letivo_id`: o pedido atravessa os anos do titular.

## 4. API

Escopo da escola do token. As rotas de `/v1/privacidade` são da coordenação (com MFA, F1); as de `/v1/meus-dados`, do
aluno e do professor.

| Rota | Detalhe |
|---|---|
| `GET retencao` | categorias e prazos fixos: descrição comum, meses, origem (padrão ou contrato) |
| `GET suboperadores` | nome, finalidade, país, categorias, veda treinamento, vigência |
| `GET incidentes` · `POST incidentes/:id/confirmar` | os da escola; confirmar é idempotente (204) |
| `GET titulares?busca=` | prefixo de 3 letras ou mais; até 20 (id, nome, papel, ativo); audita `titular.buscado` |
| `GET titulares/:id/previa` | contagem por categoria e compartilhamento |
| `POST pedidos` | `titularId`, `tipo`, `solicitante`, `chegouEm`, `chaveEnvio` |
| `GET pedidos` · `GET pedidos/:id` | página de 50 por `estado`; o detalhe traz compartilhamento, `nomesTrocados`, `homonimo` |
| `POST pedidos/:id/cancelar` · `POST pedidos/:id/concluir` | cancelar só `agendado` antes do prazo; concluir acesso, compartilhamento e correção |
| `POST pedidos/:id/arquivo` | URL de 5 min da versão `coordenacao` |
| `GET /v1/meus-dados` · `POST /v1/meus-dados/:id/baixar` | os arquivos `completa` vigentes do próprio usuário; URL de 5 min |

O arquivo, o pedido e o incidente de outra escola, ou de outra pessoa, dão `NAO_ENCONTRADO`. Pedido de eliminação de si
mesmo também dá `NAO_ENCONTRADO`, como no `CicloDeVidaService`.

## 5. Fluxo

**Expurgo.** `sistema.expurgar-dado-pessoal` (1h, lote) lista as escolas e grava, no contexto de cada uma, um
`retencao.expurgar-escola` não urgente (segurado pela janela letiva). Ele percorre as categorias com o prazo da escola,
em lotes de 5.000 (`for update skip locked`, uma transação por lote), grava `expurgo_execucao` por categoria, apaga os
`arquivo_titular` vencidos (objeto, depois linha) e enfileira `titular.eliminar` para cada pedido `agendado` vencido. O
`incidente` com mais de 5 anos vira alvo do `sistema.expurgar-acesso`. Banco fora: o lote é desfeito e a fila tenta de
novo; apagar de novo não apaga nada (D49).

**Arquivo.** O pedido de acesso ou portabilidade nasce `em_preparacao` e enfileira `titular.montar-arquivo` (normal) na
mesma transação. O processador lê cada categoria, monta `{ geradoEm, titular, leiaMe, categorias, compartilhamento }`
e grava `titular/<escola>/<pedido>/<versao>.json`: sempre a `completa` e, se o titular não tem conta ativa, a
`coordenacao`, sem a conversa do professor. Depois, `pronto`. Storage fora: o job tenta de novo e a tela mostra "em
preparação"; a mesma chave sobrescreve o objeto órfão. Baixar: a API confere quem pede, audita e devolve a URL assinada
no corpo; a web baixa com `fetch`, sem navegar para ela.

**Eliminação.** Registrar, numa transação: pedido `agendado` com `eliminar_em` = agora + 7 dias,
`usuario.eliminacao_agendada_em`, sessões encerradas (`eliminacao_agendada`) e auditoria. Cancelar limpa a coluna; a
senha nunca saiu, então o acesso volta. `titular.eliminar` (lote) tem duas etapas:
1. **Troca de nome**, se o titular é aluno e nenhum outro usuário ativo da escola tem o mesmo nome normalizado: em
   lotes confirmados um a um, o nome completo (sem caixa, com fronteira de palavra) vira `[nome removido]` em
   `execucao_agente.entrada`, `consumo_ia.entrada`/`saida`, `artefato.titulo`/`conteudo`, `mensagem_agente.conteudo` e
   `entrega.justificativa` da escola do contexto. Reexecutar não acha mais nada.
2. **Uma transação:** trava o pedido (fora de `agendado`, não faz nada), anula a entrada e o texto do modelo das
   execuções do titular, roda `CicloDeVidaService.eliminar`, marca os arquivos dele e conclui o pedido com
   `nomes_trocados` e `homonimo`. Autor: quem registrou, ou `rotina` se ele já foi eliminado. Os objetos saem do
   storage depois do commit; se falhar, o expurgo seguinte tenta.

**Incidente.** `ops:incidente registrar` grava o incidente e uma linha por escola (`avisado_em`). A casca da
coordenação lê os pendentes uma vez por sessão e mostra o aviso até a confirmação.

## 6. Isolamento (obrigatório)

Todo repository novo tira a escola do contexto; o job da escola roda com a escola do `job_registro` (F0). Exceções: o
`EscolasDaRotinaRepository` (só ids) e os `ops:*`, com a justificativa do painel (regra 10, item 9). Suboperador e
incidente só são lidos por junção com a ligação da escola do token, ou por `alcance = todas`.

Testes, cada um quebrando sem a cláusula de escopo: pedido, arquivo, prévia e busca de B a partir de A dão 404; o
expurgo de A não apaga linha de B, mesmo com prazo menor em A; a troca de nome em A não toca texto de B com o mesmo
nome; eliminar em A o professor que também está em B mantém B e a conta; no incidente de A e B, cada uma vê só a
própria linha; o aluno não baixa o arquivo de colega da turma.

## 7. Dado pessoal (obrigatório)

| Item | Resposta |
|---|---|
| Campos pessoais tocados | todos os do mapa, para ler, apagar ou anonimizar |
| Novos campos | `pedido_titular`, `arquivo_titular`, `incidente_escola.confirmado_por`, `usuario.eliminacao_agendada_em`, `consumo_ia.provedor`: no mapa **na tarefa da migration** (regra 20, item 1) |
| O que vai para log | ids, categoria, contagens, estado. Nunca nome, busca, conteúdo nem URL |
| O que entra em auditoria | pedido (registrado, agendado, cancelado, concluído), `titular.buscado`, `titular.arquivo_baixado`, `retencao.ajustada`, `incidente.confirmado` |
| Enviado a provedor externo | nada |
| Retenção e expurgo | seção 3 |
| Autorização por objeto | pedido e arquivo da escola do token; "Meus dados" também por `titular_id` do contexto; a versão `coordenacao` só existe sem conta ativa |
| DTO de saída | explícito por rota; o nome só na busca da coordenação; nenhum DTO traz `chave_objeto` |

## 7b. Conformidade CNE

Sem IA no caminho. A versão da coordenação nunca traz a conversa do professor (regra 70, item 8); a do Tutor vai por
exceção declarada no PRD.

## 7c. Carga e falha (obrigatório)

| Item | Resposta |
|---|---|
| Está no caminho quente? | só a guarda da sessão, que lê uma coluna a mais da linha que já lê |
| Carga na manhã de segunda | nenhuma: expurgo e eliminação são lote segurado pela janela letiva; o arquivo é raro, com consultas indexadas por titular |
| Fila e prioridade | expurgo e eliminação no lote, não urgentes; arquivo na normal |
| Limite por escola | vaga do F0 (lote 2), lote de 5.000, `statement_timeout` |
| Rate limit | balde por usuário e por escola do F0; a busca de titular também em `rl:busca-titular`, 30/min por usuário, recusa com 429 (teste) |
| Corridas de concorrência | **Pedido duplo:** a unicidade de `chave_envio` decide, e o segundo recebe o mesmo pedido. **Duas eliminações do mesmo titular:** índice único parcial (`escola_id`, `titular_id`) em `agendado`, e o perdedor recebe `PEDIDO_EM_ESTADO_INVALIDO`, que é verificado antes da chave, para a resposta não depender da ordem. **Cancelar com executar:** os dois travam o pedido `for update`, e quem chega depois vê o estado novo. **Expurgo com eliminação:** `skip locked` e a trava do usuário. Um cenário em paralelo por linha |
| Índices novos | `(escola_id, <data>)` em `mensagem_tutor`, `sinal_tutor`, `mensagem_agente` e `execucao_agente`; parcial em `consumo_ia`; `(escola_id, decidida_em)` em `reivindicacao`; o de estado e o parcial de `agendado` em `pedido_titular`; `(escola_id, expira_em)` em `arquivo_titular` |
| Migration | compatível: colunas nulas e tabelas novas; índice sem `concurrently`, porque as tabelas do MVP são pequenas hoje |
| Quando cada dependência cai | banco: 503 tipado na rota e nova tentativa no job; Redis de fila: o pedido é aceito e despachado depois; storage: "em preparação", e baixar dá `INDISPONIVEL` |
| Métrica e alerta | `educa_retencao_ultima_conclusao_segundos{escola}` (duas noites sem conclusão) e `educa_incidente_sem_confirmacao{escola}` (mais de 24 h), cada um com parágrafo no runbook |
| Cenário de teste de carga | o "justiça entre escolas" ganha uma escola expurgando 1 milhão de linhas enquanto outra usa o Tutor |

## 8. Uso de IA

Não se aplica.

## 9. Frontend

A coordenação ganha **Privacidade** no grupo Conformidade, com quatro abas: Pedidos (lista; "Registrar pedido" com
busca, prévia e confirmação; detalhe com prazo, compartilhamento e Cancelar), Retenção, Suboperadores e Incidentes. O
aviso de incidente é um diálogo da casca que só sai com "Recebi". O aluno (Privacidade, no rodapé) e o professor (menu
da conta) ganham **Meus dados**, com o resumo por categoria e o botão de baixar. A confirmação da eliminação diz o que
sai, os 7 dias e que a escola guarda no sistema de gestão o que for obrigada a guardar. Reaproveita as peças da A1:
tabela que vira lista abaixo de 768 px, diálogo de confirmação e os quatro estados. O JSON nunca é renderizado.

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | piso e teto; normalização e fronteira da troca de nome; versão `coordenacao` sem a conversa do professor |
| Integração | por categoria, com relógio injetado: um dia antes fica, um dia depois sai; sentinela em toda tabela do titular; eliminação cancelada no 6º dia e executada no 8º; reexecução; nome completo some de três campos e o primeiro nome fica; homônimo; compartilhamento com e sem `provedor`; classificação das tabelas; as corridas da seção 7c |
| E2E | pedido de acesso que o aluno baixa; eliminação registrada e cancelada; retenção; incidente confirmado. Tudo em `chromebook` e `celular` |
| Isolamento | os da seção 6, mais sentinelas na saída de `ops:privacidade` |

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa | Documento |
|---|---|---|---|
| 00 | trabalho demorado em fila; ciclo de vida no nucleo | — | — |
| 10 | escopo do contexto | um `@SemEscopo` novo, só ids, para a rotina | seção 6 |
| 20 | mapa na tarefa da migration; storage privado; auditoria | a conversa do Tutor na versão da coordenação | PRD, seção 6 |
| 80 | lote não urgente, vaga por escola, travas no banco | índice sem `concurrently` | seção 7c |

As regras 40, 50 e 70 são atendidas sem desvio (seções 10, 9 e 7b).

## 12. Premissas não verificadas

- ⚠️ **NÃO VERIFICADO:** que o SeaweedFS do compose assine uma URL de GET compatível com o SDK S3 que o worker já usa.
  Se não assinar, a API serve o objeto por rota própria, com `no-store`. A porta `ArmazemDeArquivos` tem implementação
  falsa para os testes.
- A portabilidade não tem regulamento da ANPD (LGPD, art. 18, V). O JSON é escolha nossa até ele sair.

## 13. Riscos técnicos

- **Mover o ciclo de vida** quebra importações. Por isso é a primeira tarefa, sem mudar comportamento, com o F1 e a
  A1 verdes.
- **Troca de nome em `jsonb::text`** precisa escapar o nome para JSON e para regex. Se o resultado não for JSON
  válido, o lote falha inteiro.
- **Autor `rotina` na auditoria** muda um check do F1. O `privacy-guardian` confere que ele só aparece na retenção e
  na eliminação sem autor vivo.
- **Índice em tabela já populada** precisará de `concurrently`, fora de transação (regra 80, item 9).
