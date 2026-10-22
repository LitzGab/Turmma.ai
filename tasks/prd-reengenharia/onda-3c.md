# Tech Spec da X5 — Onda 3C: o provedor de IA, a D62 e a prova

**Comum:** `techspec.md` · **PRD:** RF19 a RF22 e o prazo do RF25 · **Tarefas:** 48.0 a 54.0

## 1. O que muda

Ver `techspec.md` §1, §7, §7b e §7c.

## 2. Desenho

### T10 — o provedor de IA (48.0 e 49.0)

**48.0 (C22).** `packages/nucleo/src/ia/adaptador-resiliente.ts` decora o adaptador em `criarProvedorDeIa`, com
`cockatiel` (N9).
- **A ordem:** `wrap(timeoutDaChamada, disjuntor, retry)`: o prazo cobre chamada e repetição, e o sinal aborta o `retry`.
- **A repetição:** uma, com jitter, só em 429 e conexão recusada; timeout e 5xx podem ter cobrado e não se repetem (`pedirComRecuo` sai).
- **O prazo por perfil:** `LLM_TIMEOUT_MS_RAPIDO` = 20 s, `LLM_TIMEOUT_MS_PADRAO` = 60 s; os outros, `LLM_TIMEOUT_MS`.
- **O orçamento:** 2 tentativas de `chamarAteValer` × (o prazo + 8 s da reserva da 49.0): `rapido` 56 s e `padrao` 136 s, abaixo do
  corte do perfil (60 s e 140 s, `onda-3a.md`). O menor substitui a principal, não soma.
- **A latência falsa** fica abaixo do prazo do seu perfil: o invariante de `config-ia.ts:102` passa a ser por perfil
  (`IA_LATENCIA_FALSA_MS_PADRAO` < `LLM_TIMEOUT_MS_PADRAO`, e o mesmo no `rapido`).
- **O disjuntor**, por provedor, modelo **e perfil** (o `LLM_MODELO` é um só: o Tutor não cai com as ferramentas), abre com 5 falhas e meio-abre em 30 s. Conta 5xx, timeout e conexão recusada; não conta 429 nem
  `IA_SAIDA_INVALIDA`. **A chamada lenta** conta só no `rapido`, acima de 10 s (metade do prazo, ~1,7× um turno de 6 s);
  no `padrao` a ferramenta normal leva ~50 s dos 60, e só o timeout conta. O menor tem o seu. Em memória por réplica,
  como saúde local: exceção aceita à 80.5, no ADR da onda 6.

**49.0, os tokens (C24).**
- **A porta** `LimiteDeTokens` em `packages/nucleo/src/ia/limite-de-tokens.ts`, implementada em `apps/api/src/ia/` sobre o
  `ContadorEmJanela` (34.0).
- **As variáveis** `LLM_TOKENS_POR_MINUTO` (obrigatória fora de `AMBIENTE=local` com `openai_compat`; o pico de ~1,5
  milhão, `docs/infra.md` §3.2, pede contrato acima de ~1,9 milhão) e `LLM_MODELO_MENOR_<PERFIL>`.
- **A reserva** é estimada antes da chamada (caracteres ÷ 4 + `maximoDeTokensDeSaida`) e acertada pelo uso real, num
  balde por modelo (`provedor:modelo`) com teto de 80 %; `normal` e `lote` usam até 50 %. Com o Redis fora, cada réplica
  segura o teto ÷ `IA_REPLICAS` (do `worker-ia`, padrão 2, ≥ 1).
- **A degradação 80.4:** até 8 s de "Pensando" (`aluno/Tutor.tsx:300`), o modelo menor (mesmo provedor e conferências
  da D62), e então `IA_INDISPONIVEL`. A reserva fica para a D37.

**As métricas (C32)**, sem usuário nem escola:
`ia.chamada.duracao_s{provedor,perfil,resultado}`, `ia.chamada.erros{provedor,perfil,codigo}`,
`ia.disjuntor.aberto{provedor,modelo,perfil}`, `ia.degradacao{degrau}` e `ia.tokens.uso_do_teto{modelo}`. "Provedor de IA fora"
(disjuntor aberto 2 min) e "Tokens acima de 80 %" (5 min) têm parágrafo no runbook.

### RF20 — a D62 na subida (50.0; C21)

Com `openai_compat` sem `LLM_PROCESSAMENTO_LOCAL` (que `config-ia.ts:23` só aceita com host privado), a subida da API e
do `main-worker` exige o `suboperador` vigente da `IA_PROVEDOR_ID` com `pais = 'BR'`, treinamento vedado,
`conversa_do_aluno` e as outras categorias enviadas, e `alcance = 'todas'` (`schema/suboperador.ts:33-53`). O falso e o
local passam. **Com o banco fora**, falha fechada: não fica pronto nem consome fila, e tenta de novo. Uso por menor
(20.13): pendência da D37.

### T13 — a prova (51.0 e 53.0) e o prazo do cliente (52.0)

**51.0, a sequência (C28, D15).**
- A migration cria `resposta_atividade.sequencia bigint not null default 0`, sob `lock_timeout`. A leitura (`RespostaLida`)
  devolve a `sequencia`, e o cliente segue de `max(local, servidor) + 1`.
- Com `sequencia`, o upsert grava só `where excluded.sequencia > resposta_atividade.sequencia`. O `PUT` que perde
  devolve a alternativa e a `sequencia` gravadas (`minha-atividade.repository.ts:215-226`).
- **A aba que perde não reenvia.** Adota a `sequencia` do servidor e mostra a alternativa gravada, com o aviso "Sua
  resposta foi alterada em outra janela" em lugar fixo da questão, em `role="status"`; o próximo clique sai com
  `servidor + 1` e vence. A alternativa segue com alvo de 44 px.
- **A aba que venceu** mostra a sua até o próximo `PUT` ou leitura, e então adota a do servidor com o mesmo aviso.
- Sem `sequencia` (cliente antigo), grava com `sequencia = resposta_atividade.sequencia + 1`, na mesma escala.
- **A coluna entra no arquivo do titular** (`LEITURAS_DO_ARQUIVO`, `titular/leitura-do-titular.ts`) e na linha de `resposta_atividade` de `docs/lgpd.md`: a ordem das escolhas diz quantas vezes o aluno trocou a alternativa, e a regra 20 (item 1) pede o campo na tabela de dados na mesma tarefa. A guarda `arquitetura.test.ts` ("toda coluna delas tem destino") fica vermelha sem isso.

**52.0, o prazo do cliente (RF25).**
`comPrazo(sinal, limiteMs)` em `apps/web/src/api/cliente.ts`, com `AbortController` próprio, sem `AbortSignal.timeout`
nem `any` (`chrome99`), **ligado ao sinal de quem chamou**: o estouro vira `TEMPO_ESGOTADO`, e cancelar relança o `AbortError`. Prazos: JSON 20 s, PDF 30 s, upload 180 s, `PUT` da prova 10 s. A `redeFalsa`
(`__fixtures__/tela.tsx:58`) passa a rejeitar quando o `signal` aborta. Os `fetch` de
`api/cliente.ts:85`, `api/material.ts:93` e `api/artefatos.ts:115` passam por ela; `no-restricted-globals` barra o resto.

**53.0, o espelho da prova (C29).**
`fila-de-respostas.ts` espelha a fila em `sessionStorage`, uma chave por atividade:
`{ dono: usuarioId, atividade, pendentes: [{ questao, alternativa, sequencia }] }`, só ids, por esquema estrito, hidratado
só com o mesmo dono. Limpo no envio, no "Sair" e na troca de dono, e **não** na sessão vencida (RF21: a rede cai, a
sessão vence, o mesmo aluno volta). O recuo ganha ±25 % de jitter.

### RF22 — N3 (54.0)

`#semRedis` (`sessao/desafio.ts:185`, em `credencial/` após a onda 2) devolve `INDISPONIVEL_TENTE_DE_NOVO` com
`Retry-After` (como `desafio-de-operador.ts:136`), `conferirLivre` vem antes de `contador.reservar` (`mfa.service.ts:106`),
e a web espera o `Retry-After` uma vez.

## 3. Falha

| Caso | O teste |
|---|---|
| Redis fora | MFA e escolha de escola: 503 sem gastar tentativa; a web espera o `Retry-After` uma vez (`etapas-do-login.test.ts`) |
| 5xx | um `fetch`, sem contar a troca |
| Provedor lento | `servidor-llama-falso.ts` além do prazo: `IA_TEMPO_ESGOTADO`, sem repetir, conta |
| Chamada lenta | `rapido` entre 10 s e o prazo: vale e conta; 5 ferramentas `padrao` de 50 s não abrem; `padrao` aberto, o `rapido` segue. Mutações: a lenta em todo perfil; a chave sem o perfil |
| 429 e saída inválida | 429: uma repetição, nenhuma com `Retry-After` além do prazo; cinco 429 ou cinco `IA_SAIDA_INVALIDA` não abrem o disjuntor |
| Provedor fora | 5 recusas abrem, a 6.ª sai sem `fetch`, o relógio falso meio-abre; o menor tem o seu |
| Tokens | relógio falso: 8 s, menor, `IA_INDISPONIVEL`, sem contar a troca; `normal` para nos 50 %; reserva antes; duas instâncias somam; Redis fora: teto ÷ réplicas |
| Métricas | cada degrau muda a sua; alertas em `alertas.int.test.ts` |
| D62 | `config.test.ts`, um caso por ramo: fora do Brasil, treinamento, não vigente, sem `conversa_do_aluno` ou outra categoria, alcance `lista`, local com host privado, `main-worker` |
| D62, banco fora | subida com o Postgres parado: não fica pronto nem consome fila; o banco volta e ela sobe |
| Configuração | `IA_REPLICAS` 0, vazio ou texto, ou latência falsa no prazo do perfil ou acima: a subida recusa |
| Prova | 5 e 7 em `Promise.all` fica a 7; cliente antigo, depois o novo; `PUT` pendurado não trava |
| Outra aba | `respostas.test.ts`: a que perde adota a `sequencia` do servidor e não manda nada; o clique seguinte sai com `servidor + 1`. Mutação: "reenviar sobrescreve a mais nova". Na tela (`areas/aluno/Atividade.test.tsx`, nasce na 51.0, a 61.0 estende): o aviso em `role="status"` e a alternativa que ficou; a que venceu adota a do servidor na leitura seguinte |
| Prazo do cliente | `cliente.test.ts`, relógio falso: JSON, PDF e upload pendurados dão `TEMPO_ESGOTADO`; cancelar relança o `AbortError`; a `redeFalsa` rejeita com o `signal` |
| Espelho | sessão vencida, mesmo dono: fica; outro dono, também na aba reaberta (o Chrome devolve o `sessionStorage`): descarta; "Sair": limpa; duas atividades: cada uma hidrata a sua, e o "Sair" limpa as duas |

## 4. Isolamento, dado pessoal, conformidade, carga

A sequência e o espelho são do aluno da sessão, e o espelho guarda só ids (`docs/lgpd.md`, 53.0); o menor passa pela D62.

## 5. Tarefas

Todas dependem do fim da onda 2.

| # | Título | RF | Depende de | Veto | Porte |
|---|---|---|---|---|---|
| 48.0 | Provedor lento, 429 ou fora falha rápido, com orçamento | 19 | — | infra, llm | grande |
| 49.0 | Tokens por minuto, degradação 80.4 e métricas de IA | 19 | 48.0, 50.0 | infra, llm, conformidade | grande |
| 50.0 | Provedor fora do Brasil ou sem a categoria não sobe | 20 | — | conformidade, privacy | pequeno |
| 51.0 | Resposta atrasada não sobrescreve, nem depois do F5 nem em outra aba | 21 | — | infra, tenancy, frontend | grande |
| 52.0 | Rede pendurada dá "Tentar de novo" | 25 | — | frontend | pequeno |
| 53.0 | Pendente sobrevive ao F5 e à sessão vencida | 21 | 51.0, 52.0 | privacy, infra | pequeno |
| 54.0 | Redis fora: 503 sem gastar tentativa | 22 | — | infra | pequeno |

**Não correm juntas:** 48.0, 49.0 e 50.0.

## 6. Riscos

- **O teto de tokens** depende do contrato da D37; até lá, a 49.0 usa o falso.
