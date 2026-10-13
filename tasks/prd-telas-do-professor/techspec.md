# Tech Spec — Telas do professor

**PRD:** `tasks/prd-telas-do-professor/prd.md`
**Status:** rascunho

## 1. Resumo da abordagem

Só `apps/web`, `e2e/` e `docs/interface.md`. As telas de `areas/professor/` são recompostas com as peças e os
tipos de página da X1, lendo as rotas que a API já tem. O que espera a professora vira uma conta feita
no cliente e mostrada pelo sino, preso na casca por `lazy()`. Os dois specs de várias telas viram um arquivo por
tela antes de qualquer tela mudar, para as tarefas correrem em linhas.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `apps/web/src/componentes/sino/` | novo (a peça, se a X2 não a criou) | o sino, a fila do professor e a montagem por papel |
| `CascaDaEscola.tsx`, `itens-da-lateral.tsx`, `areas/navegacao.ts` | alterado | o sino; os quatro lugares; "Seu time" sai |
| `apps/web/src/areas/professor/` | alterado e novo | todas as telas; `Criados`, `TurmaHoje`, `AtividadesDaTurma`, `AlunosDaTurma`, `ConvidarAlunos`, `Folha` |
| `apps/web/src/api/` | alterado | `artefatos.ts` (filtro de turma), `pedidos.ts` (contagem), `alunos-da-turma.ts` (novo) |
| `caminhos.ts`, `areas/professor/rotas.tsx` | alterado | `/professor/criados` |
| `e2e/`, `e2e/__fixtures__/professor/` | alterado e novo | um spec e uma fixture por tela |
| `docs/interface.md` | alterado | Parte A, seções 1 e 11.2 a 11.5 |

## 3. Modelo de dados

Nenhuma tabela.

## 4. API

Nenhuma rota nova. A web passa a fazer três leituras de rotas que existem: `GET /v1/artefatos?turmaId=` (o
parâmetro já está no contrato), `GET /v1/turmas/:id/reivindicacoes` pelo sino (só a contagem) e
`GET /v1/turmas/:id/alunos` (matriz `aluno_da_turma: turma_vinculada`).

## 5. Fluxo

**A fila do professor.** `filaDoProfessor` é função pura: recebe as entregas pendentes, os vínculos e a contagem
de pedidos por turma confirmada, e devolve os itens, agrupados por turma, em ordem de nome:

| Item | De onde vem | Destino |
|---|---|---|
| Correção para revisar | entrega `lote_de_correcao` pendente | `/professor/aprovar/:atividadeAplicadaId` |
| Versão adaptada para decidir | entrega `versao_adaptada` pendente | `/professor/time/assistente` |
| Pedidos de nome, com a quantidade | contagem maior que zero na turma | `/professor/turmas/:turmaId?aba=alunos` |
| Confirme sua turma | vínculo `pendente` (o contestado espera a coordenação e não conta) | `/professor/turmas` |

A regra de `esperandoVoce`, hoje em `areas/professor/entregas.ts`, muda de casa para a fila, com o teste dela. O
sino lê ao montar, quando a aba volta a ter foco e quando uma decisão invalida a consulta; **não relê por tempo**,
e abrir a lista não faz leitura. Leitura que falha marca a fila como incompleta: o sino mostra o que leu e diz o
que faltou.

**Montagem.** `sino-do-papel.ts` é um mapa de papel para componente carregado por `lazy()`; a casca só importa o
mapa. Com a X2 pousada, o mapa e a peça já existem, e a X3 acrescenta a linha dela.

**Abas no endereço.** A turma aberta, o documento e Aprovar leem `?aba=`; trocar de aba usa `replace`, valor
desconhecido cai na primeira, e o painel ao lado também fica no endereço (`?ver=`, `?atividade=`).

**"Seu time".** `/professor/time/assistente` continua tela (`Time.tsx`). `Tutor.tsx` vira redirecionamento: uma
turma confirmada leva a `…/turmas/:id?aba=hoje`; mais de uma, a `/professor/turmas`. O pé do sino tem os dois
links: "O que o Assistente fez" e "O que o Tutor viu".

## 6. Isolamento (obrigatório)

Nenhuma consulta nova no servidor: o escopo continua no repository, a partir do token. No cliente, o risco é o
cache atravessar a troca de escola ou de pessoa. As consultas do sino usam chaves que começam pelas de hoje
(`entregas`, `meus-vinculos`, `pedidos-da-turma`), que `main.tsx` esvazia em toda troca de sessão. Testes: o sino
de A não aparece em B depois da troca de escola, nem para a segunda pessoa na mesma aba; o documento e a turma de
outra escola respondem como os inexistentes (os e2e de hoje).

## 7. Dado pessoal (obrigatório)

| Item | Resposta |
|---|---|
| Campos pessoais tocados | nome do aluno, em Alunos, nos sinais, no uso do Tutor e nos destaques: os de hoje |
| Novos campos, log, envio a provedor externo | nenhum |
| O que entra em auditoria | o que já entra: abrir destaque, aprovar, aplicar, decidir pedido |
| Retenção, autorização por objeto, DTO de saída | inalterados: quem decide é a API |

O sino **não guarda nome de aluno**: a consulta de contagem descarta a lista antes do cache e fica só com o
número e "há mais". As leituras nominais das telas continuam com `gcTime: 0`, inclusive a nova de alunos. Nenhum
endereço leva nome. A contestação e a justificativa mantêm o aviso de não escrever sobre aluno.

## 7b. Conformidade CNE (quando há IA no caminho do aluno)

Nenhuma função muda de risco nem de autonomia. A versão adaptada continua decidida por
`POST /v1/entregas/:id/decidir`; a atividade só vai à turma por "Aplicar à turma"; o lote, por `aprovar-lote`, que
a API recusa com destaque fechado. As abas de Aprovar não mudam a ordem: o oficial fica na barra presa, visível
nas três, e quem o libera é `podeAprovar`. A supervisão do Tutor (regra 70, item 4) fica na aba Hoje, com os
textos de hoje: sinal e uso, nunca conversa. O teste de vocabulário de `aprovar.test.ts` (sem nota, conceito nem
pontuação) é estendido aos textos novos.

## 7c. Carga e falha (obrigatório)

| Item | Resposta |
|---|---|
| Está no caminho quente? | nenhum do servidor é novo; o sino lê em toda tela do professor |
| Carga na manhã de segunda | por professor que abre a casca: 2 leituras de hoje (entregas e vínculos) e 1 por turma confirmada (pedidos), até 12. Com 30 professores e 6 turmas, 240 leituras curtas, contra 400 logins de alunos |
| Fila, limite por escola, índices, migration | não se aplicam |
| Rate limit | nenhuma rota nova. As leituras por turma saem **em série** e param na primeira recusa por limite, que vira "incompleto" |
| Corridas de concorrência | nenhuma nova: decidir entrega, aprovar lote e gerar acesso mantêm o envio único e o tratamento de `ENTREGA_JA_DECIDIDA` e `CONFLITO` |
| Quando cada dependência cai | a tela mostra `EstadoErro` com "Tentar de novo"; o sino diz que não leu e não afirma "Tudo em dia" |
| Métrica, alerta e cenário de carga | o teto do `size-limit` e o teste do build; cenário inalterado |

**Orçamento.** O sino não entra na entrada: só o mapa e o `lazy()`. As abas e os painéis ficam em pedaços
`tela-professor-*` (30 kB cada); `Turmas` e `Turma` continuam na fachada, cujo teto a 10.0 mede. Os ícones das
ferramentas moram em `areas/professor/icones-de-ferramenta.tsx`; o de Criados, no arquivo de lugares da X1.

## 9. Frontend

Peças e tipos de página são os da X1 (`Tela`, `Linha`, `Ladrilho`, `Segmentado`, `Toque`, `Interruptor`, `Aviso`,
`Contador`, `PainelLado`, `Abas`, `estado/`), sem redefinir nenhuma. O vazio usa o `EstadoVazio` como a X1 o
entregar: nenhuma pose da onça é desenhada aqui.

| Tela | Tipo | Composição |
|---|---|---|
| Início | conversa | onça com função e selo, saudação, caixa com a turma, atalhos, aviso de IA |
| Conversa | conversa | balões, assinatura, a `Escolha`, o cartão com ícone e nome, a caixa presa com o menu "Ferramenta" |
| Ferramentas | grade | uma seção por categoria; cartão com ícone ilustrado |
| Formulário | formulário | o motor e, ao lado a partir de 1024 px, "Como vai sair" |
| Criados | grade | filtros à direita do título; grupos por turma, em `Linha` |
| Documento | formulário, com a folha de 760 sobre `mesa` | abas Conteúdo · Versões adaptadas · Na turma; interruptor "Gabarito" |
| Turmas | grade | faixa "Confirme sua turma"; cartões; contestação no `PainelLado` |
| Turma aberta | grade | Hoje · Atividades · Alunos |
| Aprovar | leitura | números do lote; Destaques · Outras · Resumo; barra presa com o oficial |

**Nomes que não mudam** (contrato com o e2e): um `<main>`; `h1` "Turmas", "Ferramentas", "Turma <nome>", "Revisar a
correção"; `log` "Conversa com o Assistente de ensino"; regiões "Sinais da turma", "Acerto por habilidade",
"Confirme suas turmas", "Suas turmas", "Pedidos de nome"; `group` "Aprovação do lote" e "Código da turma";
títulos "Acesso dos alunos", "Acesso gerado", "Gerar acesso", "Gerar novo acesso", "Revogar o acesso"; links
"Abrir o artefato", "Revisar a correção", "Voltar para Turmas"; botões "Contestar", "Aplicar à turma", "Encerrar a
atividade", "Exportar em PDF", "Pedir versão adaptada"; e todos os `data-*` do inventário, menos
`data-contador-do-time`, que vira `data-contador-do-sino`, e `data-esperando-voce`, que passa ao item do sino.
**Nomes que mudam:** as abas da turma; "Voltar para Ferramentas", no documento, vira "Voltar para Criados"; "Voltar
para o Seu time" vira "Voltar para a turma"; "Ver e decidir em Seu time" vira "Ver e decidir"; o `h1` das telas
do time perde "Seu time: ".

**Texto da pessoa.** O que a professora escreve (pedido, contestação, justificativa) mora no estado da página:
releitura e sessão vencida não o apagam.

**Chromebook e celular.** Nenhuma biblioteca nova. A 360 px, os filtros viram um botão "Filtrar" com diálogo, o
painel ao lado vira folha de baixo, e a barra presa de Aprovar fica acima da barra de baixo da casca.

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | `filaDoProfessor`, tipo a tipo, com o contestado, as duas disciplinas na mesma turma e "100 ou mais"; filtros de Criados; estado da atividade aplicada; "Como vai sair"; vocabulário; a aba pelo endereço |
| Componente (jsdom, `__fixtures__/tela.tsx`) | por tela: carregando, vazio, erro, com dado e o foco depois de cada ação; o sino com leitura parcial e contando as chamadas; o oficial desligado até `podeAprovar` |
| E2E | um spec por tela, nos dois projetos, com axe e largura; os fluxos `a2-assistente`, `a3-a4-professor` e `roteiro-da-demonstracao`, por fixtures de tela |
| Isolamento | os de hoje, mais o sino na troca de escola e na segunda pessoa |

**A separação dos specs** (tarefa 2.0) move casos sem mudar título nem asserção: a contagem de `test(` em `e2e/` é
conferida antes e depois.

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa | Documento que registra o desvio |
|---|---|---|---|
| 00, 10, 20 | só a web; seções 6 e 7 | nenhum | — |
| 40 | estado em teste de componente, fluxo em e2e | dois specs são divididos, sem perder caso | esta seção |
| 50 | seção 9; quatro estados por tela | o mockup é contrariado onde afrouxa regra | `prd.md`, seção 6; D80, item 7 |
| 70, 80 | seções 7b e 7c | nenhum | — |

## 12. Premissas não verificadas

- `⚠️ NÃO VERIFICADO` — o nome e as props da peça do sino da X2, escrita em paralelo. Saída: a 1.0 procura a peça
  em `componentes/`; não achando, cria `componentes/sino/Sino.tsx`, com a lista por prop
- `⚠️ NÃO VERIFICADO` — as props das peças novas da X1, que não existem neste checkout. Saída: cada tarefa lê a
  peça antes de usar e registra a divergência
- `⚠️ NÃO VERIFICADO` — a web nunca leu `GET /v1/turmas/:id/alunos` como professor, e a API devolve em ordem de
  id. Saída: a 12.0 ordena por nome e confere a rota em `apps/api/test/turma-acesso.int.test.ts`
- `⚠️ NÃO VERIFICADO` — como o teste do build nomeia o pedaço de `componentes/sino/`. Saída: `PECAS_FORA_DA_ENTRADA`
- `⚠️ NÃO VERIFICADO` — o limite por usuário das leituras do sino. Saída: a série (seção 7c)

## 13. Riscos técnicos

- **Sete specs chegam às telas do time pela lateral.** A 2.0 troca o caminho por fixtures
- **Mover caso de e2e perde caso sem ninguém ver.** A contagem entra na 2.0
- **Item do sino que não sai.** Cada decisão já invalida a consulta dela; a 1.0 prova tipo a tipo
- **O acesso num diálogo esbarra em nove casos de e2e.** Os títulos de cada passo não mudam (seção 9)
