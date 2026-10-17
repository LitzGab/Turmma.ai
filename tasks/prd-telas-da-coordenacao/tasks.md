# Tarefas — Telas da coordenação

**PRD:** `prd.md` · **Tech Spec:** `techspec.md` · **Mockup:** `mockup.md` (inventário das telas do mockup)
<!-- Quantas estão concluídas não se escreve aqui: `node tools/processo/estado.ts` conta pela lista. -->

São 14, acima da mira de 12: uma tela por tarefa, e a área tem doze telas, mais o sino e a operação. O corte
possível, se a spec precisar pousar em duas, é 1.0 a 9.0 e 14.0 (o sino, os lugares, o Painel, o Analista, a Escola
e a operação) e 10.0 a 13.0 (Registros).

## Lista

- [x] **1.0 — A coordenação vê no sino o que espera por ela**
  - [ ] 1.1 A âncora do sino na casca (`useAncoraDoSino`)
  - [ ] 1.2 A peça `Sino`, com a lista por prop, o `Contador` parado e o `PainelLado`
  - [ ] 1.3 Os estados: carregando, erro, leitura parcial, e o vazio com ícone ilustrado e "Tudo em dia"
  - [ ] 1.4 `montarFila` (pura) e `useFilaDaCoordenacao`, só com consultas que já existem; `completa: false` em turmas ou vínculos suprime "sem professor"; `refetchInterval`, `refetchOnWindowFocus` e `refetchOnReconnect` desligados; "Atualizar" por chave exata
  - [ ] 1.5 `SinoDaCoordenacao` por `lazy()`; galeria; `PECAS_FORA_DA_ENTRADA`
  - [ ] 1.6 Testes: a conta, tipo a tipo; nenhum pedido novo ao abrir a lista nem por tempo, foco ou retry; lista truncada; vínculo encerrado; sem ano letivo; só a coordenação monta o sino; nada pisca; a segunda pessoa não vê a fila da anterior

- [x] **2.0 — O Painel mostra os números da escola, a fila e o que falta**
  - [ ] 2.1 `o-que-falta-da-escola.ts`: os passos do roteiro saem da Estrutura para um módulo puro
  - [ ] 2.2 A tela `Painel`, na rota nova: função suspensa, os quatro números de hoje e o consumo do mês
  - [ ] 2.3 "Esperando você", com os itens da fila e a porta fixa "Pedidos dos titulares", sem número
  - [ ] 2.4 "Para terminar a escola", só com os passos que faltam
  - [ ] 2.5 Cada bloco com o seu carregando e o seu erro
  - [ ] 2.6 Testes: nenhum número é de um professor nem de uma turma; os quatro estados de cada bloco

- [x] **3.0 — A coordenação navega por quatro lugares e abre no Painel**
  - [x] 3.1 `navegacao.ts`: os quatro lugares, com ícone; a coordenação abre no Painel
  - [x] 3.2 As molduras `Escola` (Turmas, Professores, Material) e `Registros` (IA, Pedidos, Privacidade)
  - [x] 3.3 `rotas.tsx`: cada rota na moldura dela, nos endereços de hoje
  - [x] 3.4 `Privacidade.tsx`: as três abas que sobram viram um seletor, nos mesmos endereços
  - [x] 3.5 As fixtures do e2e: `irPelaCoordenacao`, e onde a coordenação abre, num lugar só
  - [x] 3.6 Nos specs, troca mecânica do caminho de navegação, do `h1` e do título; nenhuma outra asserção muda
  - [x] 3.7 Specs grandes divididos por tela, movendo sem editar
  - [x] 3.8 Testes: os quatro lugares nas três larguras; cada endereço de hoje abre a tela dele; cliques até cada tela

- [x] **4.0 — O Analista numa página de leitura, com o dado nominal**
  - [ ] 4.1 A página de leitura, com a assinatura do Analista e "Gerar resumo"
  - [ ] 4.2 O miolo de hoje nas peças da X1: números, alertas como hipótese, acerto por série e disciplina
  - [ ] 4.3 O vazio e o aviso de fila, como hoje
  - [ ] 4.4 `DadoNominal` sai da Governança e entra no fim da página; reabrir pede a finalidade de novo
  - [ ] 4.5 Nenhum campo de pergunta, anexo, relatório nem "Baixar"
  - [ ] 4.6 Testes: uma auditoria por leitura; a regra dos dois professores; nenhum `textbox`

- [x] **5.0 — Escola › Turmas em tabela, com o ano e as disciplinas num painel ao lado**
  - [ ] 5.1 `turmas-da-escola.ts` (puro): turmas por série, com os professores de cada uma
  - [ ] 5.2 A tabela, com a linha inteira levando à lista da turma
  - [ ] 5.3 O seletor "Todas" e "Sem professor", no endereço
  - [ ] 5.4 "Nova turma" como o único botão cheio
  - [ ] 5.5 "Ano letivo e disciplinas" num painel ao lado, com as regiões de hoje
  - [ ] 5.6 "Para terminar a escola", com os sete passos
  - [ ] 5.7 Sem ano letivo e sem ano em curso: os vazios de hoje
  - [ ] 5.8 Testes: o e2e `estrutura` sem perder asserção; a 360 px; professor com duas disciplinas na mesma turma

- [x] **6.0 — Escola › Professores em tabela, com o painel do professor**
  - [ ] 6.1 `professores-da-escola.ts` (puro): por professor, as turmas e as disciplinas
  - [ ] 6.2 A tabela, sem e-mail, sem busca e sem ordem por uso
  - [ ] 6.3 A linha abre o painel do professor, só com as ações que o estado permite
  - [ ] 6.4 Os diálogos de cadastrar, refazer e revogar de hoje; o foco volta a quem abriu
  - [ ] 6.5 O vazio, com "Cadastrar professor"
  - [ ] 6.6 Testes: o link aparece uma vez; clique duplo; recomeço; nenhum e-mail na tela

- [ ] **7.0 — A alocação no painel do professor**
  - [ ] 7.1 A seção "Turmas" do painel: um item por vínculo, com o estado em texto e a contestação
  - [ ] 7.2 "Acrescentar turma", só para quem é alocável
  - [ ] 7.3 Sem turma ou sem disciplina: o vazio de hoje
  - [ ] 7.4 As falhas de hoje, no diálogo
  - [ ] 7.5 A seção sai da Estrutura; o passo "Alocação" de "O que falta" leva a Professores
  - [ ] 7.6 Testes: o vínculo nasce esperando a confirmação; duas alocações iguais ao mesmo tempo; o e2e de alocação sem perder asserção

- [ ] **8.0 — Escola › Material em tabela, com o envio num diálogo**
  - [ ] 8.1 A tabela, com o que falhou primeiro
  - [ ] 8.2 "Enviar material" num diálogo, com os campos e os erros de hoje
  - [ ] 8.3 A linha abre o painel, com "Tentar de novo" e "Excluir"
  - [ ] 8.4 A lista só se relê sozinha enquanto há material processando
  - [ ] 8.5 O vazio de hoje
  - [ ] 8.6 Testes: sem licença, nada é enviado; a recusa continua auditada; o e2e `material` sem perder asserção

- [x] **9.0 — A lista da turma em duas colunas, com os professores da turma**
  - [ ] 9.1 O cabeçalho, com "‹ Escola"
  - [ ] 9.2 "Nomes da turma" em tabela, com a contagem de aprovados sem o nome
  - [ ] 9.3 "Subir a lista de nomes", com a prévia e os erros por linha, como hoje
  - [ ] 9.4 A coluna do lado: os professores da turma e os pedidos de nome, lidos só no "Atualizar"
  - [ ] 9.5 A turma que não existe, a que saiu do ano e a leitura que falha
  - [ ] 9.6 Testes: cada leitura de pedidos é auditada e só acontece no clique; dois alunos com o mesmo nome; planilha suja

- [ ] **10.0 — Registros › IA: os números, a tabela com filtro por estado e o consumo**
  - [ ] 10.1 Os quatro números e o link "Como cada IA trabalha"
  - [ ] 10.2 O seletor de estado, no endereço, com o parâmetro que a API já aceita
  - [ ] 10.3 A tabela "O que a IA gerou e quem aprovou", sem turma nem quem decidiu
  - [ ] 10.4 "Consumo do mês por função", com as barras neutras
  - [ ] 10.5 Os vazios de hoje, e o do filtro
  - [ ] 10.6 Testes: nenhum nome de professor, filtro ou ordem por professor; o e2e `governanca` sem perder asserção

- [ ] **11.0 — "Como cada IA trabalha", uma IA por vez**
  - [ ] 11.1 A página de leitura, com "‹ Registros"
  - [ ] 11.2 O seletor "Qual IA", no endereço
  - [ ] 11.3 O agente escolhido: o que faz sozinho e o que espera aprovação, por função
  - [ ] 11.4 Suspender e retomar por função, com confirmação e motivo de lista fechada
  - [ ] 11.5 "O que a IA nunca faz", sempre à vista
  - [ ] 11.6 Testes: suspender uma função não desliga as outras; a auditoria da suspensão; função e selo "IA" em todo agente

- [x] **12.0 — Registros › Pedidos com o prazo na lista, e o detalhe do pedido**
  - [ ] 12.1 A coluna "Prazo", com o vencido em texto (m3 do F3)
  - [ ] 12.2 A linha inteira é o link do detalhe; "Registrar pedido" é o único botão cheio
  - [ ] 12.3 Os textos de hoje, com o link "Ir para as turmas"
  - [ ] 12.4 O detalhe na página de leitura, com "‹ Pedidos" e as ações de hoje
  - [ ] 12.5 `TODO.md`: o m3 feito; m4 e m5 ficam
  - [ ] 12.6 Testes: os dois e2e de pedidos sem perder asserção; homônimos; a eliminação continua em perigo

- [ ] **13.0 — Registros › Privacidade: prazos, empresas e incidentes num seletor**
  - [ ] 13.1 O seletor de três, no endereço
  - [ ] 13.2 Prazos em tabela, com "Prazos que não mudam"
  - [ ] 13.3 Empresas, vigentes e passadas, em tabela
  - [ ] 13.4 Incidentes, os sem confirmação primeiro, com "Confirmo que recebi" em botão oficial
  - [ ] 13.5 O aviso de incidente ao entrar não muda de comportamento
  - [ ] 13.6 Testes: a confirmação idempotente entre duas pessoas; os e2e `privacidade` e `incidentes` sem perder asserção

- [x] **14.0 — A operação numa página, com Escolas e Uso**
  - [ ] 14.1 O cabeçalho, com a frase fixa de que a operação não vê dado de pessoa
  - [ ] 14.2 Escolas em tabela, com os sete estados da coordenação em texto
  - [ ] 14.3 Uso em tabela, com o dia e o mês de referência
  - [ ] 14.4 Abaixo de 768 px, cada tabela vira lista
  - [ ] 14.5 Os vazios e os erros de hoje, nas peças de estado
  - [ ] 14.6 A fixture de teste de componente da operação
  - [ ] 14.7 Testes: nenhuma resposta nem tela com nome, e-mail ou matrícula de pessoa da escola; os e2e `operacao-*` sem perder asserção

## Dependências e paralelismo

| Tarefa | Depende de | Pode correr em paralelo com |
|---|---|---|
| 1.0 | — | 14.0 |
| 2.0 | 1.0 | 14.0 |
| 3.0 | 2.0 | 14.0 |
| 4.0 | 3.0 | 5.0, 6.0, 8.0, 9.0, 11.0, 12.0, 14.0 |
| 5.0 | 3.0 | 4.0, 6.0, 8.0, 9.0, 11.0, 12.0, 14.0 |
| 6.0 | 3.0 | 4.0, 5.0, 8.0, 9.0, 11.0, 12.0, 14.0 |
| 7.0 | 5.0, 6.0 | 4.0, 8.0, 9.0, 10.0, 11.0, 12.0, 14.0 |
| 8.0 | 3.0 | 4.0, 5.0, 6.0, 7.0, 9.0, 11.0, 12.0, 14.0 |
| 9.0 | 3.0 | 4.0, 5.0, 6.0, 7.0, 8.0, 11.0, 12.0, 14.0 |
| 10.0 | 4.0 | 7.0, 8.0, 9.0, 11.0, 12.0, 14.0 |
| 11.0 | 3.0 | 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 12.0, 14.0 |
| 12.0 | 3.0 | 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 14.0 |
| 13.0 | 12.0 | 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 14.0 |
| 14.0 | — | todas as outras |

A 7.0 depende também da 5.0 porque as duas mexem em `Estrutura.tsx`; a 13.0 espera a 12.0 porque as duas mexem na
pasta `privacidade/`. Quem confere o par de verdade é `tools/processo/linhas.ts`, pelos "Arquivos previstos".

## Subagentes por tarefa

| Tarefa | Subagentes obrigatórios |
|---|---|
| 1.0 | `frontend-reviewer`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer` |
| 2.0 | `frontend-reviewer`, `conformidade-reviewer`, `infra-guardian` |
| 3.0 | `frontend-reviewer` |
| 4.0 | `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian` |
| 5.0 | `frontend-reviewer` |
| 6.0 | `frontend-reviewer`, `privacy-guardian` |
| 7.0 | `frontend-reviewer`, `privacy-guardian` |
| 8.0 | `frontend-reviewer`, `privacy-guardian` |
| 9.0 | `frontend-reviewer`, `privacy-guardian` |
| 10.0 | `frontend-reviewer`, `conformidade-reviewer` |
| 11.0 | `frontend-reviewer`, `conformidade-reviewer` |
| 12.0 | `frontend-reviewer`, `privacy-guardian` |
| 13.0 | `frontend-reviewer`, `privacy-guardian` |
| 14.0 | `frontend-reviewer`, `privacy-guardian` |

`test-engineer` e `revisor-geral` valem em todas, marcados ou não.

## Critério de pronto da funcionalidade

Do `ROADMAP.md`, X2: a coordenação faz, pelos quatro lugares e pelo sino, tudo o que faz hoje pelos sete itens, sem
nenhum caminho mais longo que o de hoje (medido como no RF3 do PRD: toda tela a até dois cliques, e Empresas e
Incidentes a três); nenhuma tela mostra indicador nominal de professor nem contagem de grupo pequeno que o servidor
já não mostrasse (D45, D64); cada tela cabe em 1366 × 768 sem rolar a página e funciona a 360 px; e o e2e da A0b, da
A1, da A5 e do F3 continua provando as mesmas regras.

Em detalhe: os 24 requisitos do PRD têm teste apontado na tarefa que os entrega; a contagem de casos do e2e não
diminui; nenhuma rota, tabela ou permissão é criada; e o vazio do sino não leva mascote (a onça nele é decisão do Joaquim, Tech Spec seção 12).
