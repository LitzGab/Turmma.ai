# Tarefas — Telas do professor

**PRD:** `prd.md` · **Tech Spec:** `techspec.md` · **Mockup:** `mockup.md` (inventário da área do professor)
<!-- Quantas estão concluídas não se escreve aqui: `node tools/processo/estado.ts` conta pela lista. -->

São 14, acima da mira de 12, porque cada tela e o diálogo de convidar têm tarefa própria. A 1.0 e a 2.0 são o
tronco; da 3.0 em diante as telas correm em linhas. O corte possível, se a spec precisar pousar em duas, é 1.0 a
8.0 (o sino, os lugares, Início, Conversa, Criados e Ferramentas) e 9.0 a 14.0 (Turmas, a turma aberta e Aprovar).

## Lista

- [x] **1.0 — O sino mostra à professora o que espera por ela**
  - [x] 1.1 A peça `Sino`: a da X2, se já existir em `componentes/`; senão, criada com a lista por prop
  - [x] 1.2 `fila-do-professor.ts`: os quatro tipos de item, agrupados por turma; `esperandoVoce` muda de casa
  - [x] 1.3 `consultaContagemDePedidos`, que guarda só o número; as leituras por turma em série, até 12 por nome, e o `incompleto` além disso
  - [x] 1.3a A releitura do sino como na X2: sem foco, reconexão nem tempo; "Atualizar" e "Tentar de novo" por chave exata
  - [x] 1.4 `SinoDoProfessor` e o mapa `sino-do-papel.ts`, montados na casca por `lazy()`; a seção da galeria
  - [x] 1.5 Testes: a conta, tipo a tipo; os estados e a leitura parcial; nenhuma releitura por tempo, foco ou reconexão; mais de 12 turmas; recusa por limite; permissão; entrega decidida em outra aba; contador sem animação; troca de escola e segunda pessoa

- [x] **2.0 — A lateral do professor fica com Início, Turmas e Ferramentas, e "Seu time" sai dela**
  - [x] 2.1 `navegacao.ts`: a ordem da D80 e `SEU_TIME` vazio; a casca e `itens-da-lateral` sem o grupo
  - [x] 2.2 O pé do sino: "O que o Assistente fez" e "O que o Tutor viu"
  - [x] 2.3 Nenhum texto de tela diz "Seu time": títulos, links e avisos
  - [x] 2.4 `e2e/__fixtures__/professor/`: como os specs chegam às entregas, aos sinais e ao que foi gerado
  - [x] 2.5 `professor-assistente.spec.ts` e `professor-turma.spec.ts` viram um spec por tela, sem mudar título nem asserção
  - [x] 2.6 `docs/interface.md`, Parte A: os lugares, o sino e o que saiu de "Seu time"
  - [x] 2.7 Testes: os lugares nas três larguras; os sete blocos de "Seu time" alcançados pelo sino; a contagem de casos do e2e igual

- [x] **3.0 — Início: a saudação com a onça, a caixa de pedido e os atalhos**
  - [x] 3.1 `Home.tsx`: a composição nova, sem "Esperando você"
  - [x] 3.2 `AtalhosDeFerramenta`; a caixa do Início sem o menu "Ferramenta"
  - [x] 3.3 `icones-de-ferramenta.tsx`, que exporta o mapa de ferramenta para ícone (a 4.0 e a 7.0 só o consomem)
  - [x] 3.4 Testes: os quatro estados; a saudação com o relógio fixo; o atalho abre o cartão, e a Adaptação nunca leva o texto da caixa

- [x] **4.0 — Conversa e cartão da ferramenta na pele nova**
  - [x] 4.1 `Conversa.tsx`: a coluna, a caixa presa e o aviso de IA
  - [x] 4.2 O cartão da ferramenta com ícone e nome; o resultado com as ações de hoje
  - [x] 4.3 Testes: os estados; a pergunta da D18 com duas opções iguais; nenhum cartão sem o "sim"

- [ ] **5.0 — Criados: o que a professora já gerou, por turma, com filtros**
  - [ ] 5.1 `/professor/criados`: a rota, o lugar na lateral e o ícone
  - [ ] 5.2 `Criados.tsx` e `criados.ts`: grupos por turma, filtros no endereço, "Ver mais"
  - [ ] 5.3 "O que você já gerou" sai de Ferramentas; a fixture `professor/criados.ts` aponta para Criados
  - [ ] 5.4 Testes: os quatro estados; filtro sem resultado; o filtro de turma vai ao servidor; o voltar devolve os filtros

- [ ] **6.0 — O documento aberto em folha**
  - [ ] 6.1 `Artefato.tsx`: cabeçalho, abas no endereço e a folha sobre a mesa
  - [ ] 6.2 `EncerramentoDaAtividade`, extraído de `AplicacaoDoArtefato`, sem mudar comportamento
  - [ ] 6.3 Testes: os quatro estados; aplicar e encerrar com a confirmação; a versão rejeitada não exporta; a aba pelo endereço

- [ ] **7.0 — Ferramentas: o catálogo por categoria**
  - [ ] 7.1 `Ferramentas.tsx`: uma seção por categoria com ferramenta, em cartões com ícone ilustrado
  - [ ] 7.2 Testes: só as três ferramentas; categoria vazia não aparece; a função suspensa no cartão

- [ ] **8.0 — O formulário da ferramenta com "Como vai sair"**
  - [ ] 8.1 `Ferramenta.tsx` em duas colunas; o texto fixo por ferramenta, em `ferramentas.ts`
  - [ ] 8.2 Testes: o texto por ferramenta e o vocabulário; os estados do formulário; a Adaptação sem campo de texto

- [x] **9.0 — Turmas: os cartões e "Confirme sua turma"**
  - [x] 9.1 `Turmas.tsx`: a faixa de confirmar, os cartões e o que espera em cada turma
  - [x] 9.2 A contestação no `PainelLado`, com o texto guardado na página
  - [x] 9.3 Testes: os quatro estados; confirmar em oficial; contestar; o texto sobrevive à releitura

- [ ] **10.0 — A turma aberta em três abas, com Hoje**
  - [ ] 10.1 `Turma.tsx`: Hoje, Atividades e Alunos no endereço; os blocos de hoje mudam de aba sem mudar de conteúdo ("Por aluno" e o acesso vão para Alunos; "Atividades da turma", para Atividades); a tarefa liga as três abas e cria `AtividadesDaTurma.tsx` e `AlunosDaTurma.tsx` como cascas, que a 11.0 e a 12.0 preenchem sem tocar em `Turma.tsx`
  - [ ] 10.2 `TurmaHoje.tsx`: a atenção humana, os sinais, o acerto por habilidade e o painel por aluno
  - [ ] 10.3 `Tutor.tsx` vira redirecionamento; a fixture `professor/tutor.ts` aponta para Hoje
  - [ ] 10.4 Testes: a aba pelo endereço; os estados de Hoje; Hoje relê aos 15 s e não mostra nome; sem painel, sem rota nominal; nada abre conversa de aluno; o endereço antigo do Tutor

- [ ] **11.0 — Turma › Atividades**
  - [ ] 11.1 `AtividadesDaTurma.tsx`: as linhas com estado, o filtro e o painel da atividade
  - [ ] 11.2 Encerrar pelo painel; "Aplicar uma atividade" leva a Criados com a turma
  - [ ] 11.3 Testes: o estado de cada linha; encerrar com a confirmação; os quatro estados

- [ ] **12.0 — Turma › Alunos**
  - [ ] 12.1 `api/alunos-da-turma.ts` e `AlunosDaTurma.tsx`: os alunos em ordem de nome, com os acertos
  - [ ] 12.2 Os pedidos de nome no alto, com as regras de hoje
  - [ ] 12.3 Testes: a ordem de nome; aluno sem correção aprovada; os estados; a lista não fica no cache

- [ ] **13.0 — "Convidar alunos" num diálogo**
  - [ ] 13.1 `ConvidarAlunos.tsx`: o acesso da turma em passos de um diálogo só
  - [ ] 13.2 `?convidar=1` e o convite depois de confirmar a turma
  - [ ] 13.3 Testes: os nove casos do acesso, pelo diálogo; o link e o código uma vez; nada legível atrás de "Acesso gerado"

- [x] **14.0 — Aprovar na pele nova**
  - [x] 14.1 `Aprovar.tsx`: os números, as abas e o destaque no painel ao lado
  - [x] 14.2 A barra presa com o oficial, visível nas três abas
  - [x] 14.3 Testes: o oficial desligado até `podeAprovar`; abrir registra uma vez; a confirmação; nenhum botão laranja

## Dependências e paralelismo

| Tarefa | Depende de | Pode correr em paralelo com |
|---|---|---|
| 1.0 | — | — |
| 2.0 | 1.0 | — |
| 3.0 | 2.0 | 9.0, 10.0, 14.0 |
| 4.0 | 3.0 | 5.0, 6.0, 7.0, 9.0, 10.0, 14.0 |
| 5.0 | 3.0 | 4.0, 10.0, 14.0 |
| 6.0 | 5.0 | 4.0, 7.0, 8.0, 9.0, 10.0, 12.0, 14.0 |
| 7.0 | 5.0 | 4.0, 6.0, 9.0, 10.0, 12.0, 14.0 |
| 8.0 | 7.0 | 6.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0 |
| 9.0 | 2.0 | 3.0, 4.0, 6.0, 7.0, 8.0, 10.0, 11.0, 12.0, 14.0 |
| 10.0 | 2.0 | 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 14.0 |
| 11.0 | 6.0, 10.0 | 8.0, 9.0, 12.0, 13.0, 14.0 |
| 12.0 | 10.0 | 6.0, 7.0, 8.0, 9.0, 11.0, 14.0 |
| 13.0 | 9.0, 12.0 | 8.0, 11.0, 14.0 |
| 14.0 | 2.0 | 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0 |

A 5.0 e a 9.0 não correm juntas: as duas editam `e2e/areas.spec.ts`.

## Subagentes por tarefa

| Tarefa | Subagentes obrigatórios |
|---|---|
| 1.0 | `frontend-reviewer`, `privacy-guardian`, `infra-guardian`, `tenancy-guardian` |
| 2.0 | `frontend-reviewer`, `conformidade-reviewer` |
| 3.0 | `frontend-reviewer`, `conformidade-reviewer` |
| 4.0 | `frontend-reviewer`, `conformidade-reviewer` |
| 5.0 | `frontend-reviewer`, `tenancy-guardian` |
| 6.0 | `frontend-reviewer`, `conformidade-reviewer` |
| 7.0 | `frontend-reviewer` |
| 8.0 | `frontend-reviewer`, `conformidade-reviewer` |
| 9.0 | `frontend-reviewer`, `privacy-guardian` |
| 10.0 | `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian`, `tenancy-guardian` |
| 11.0 | `frontend-reviewer`, `conformidade-reviewer` |
| 12.0 | `frontend-reviewer`, `privacy-guardian`, `tenancy-guardian` |
| 13.0 | `frontend-reviewer`, `privacy-guardian` |
| 14.0 | `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian` |

`test-engineer` e `revisor-geral` valem em todas, marcados ou não.

## Critério de pronto da funcionalidade

Do `ROADMAP.md`, X3: a professora faz, pelos quatro lugares e pelo sino, tudo o que faz hoje; nada do que estava em
"Seu time" some, e o lote continua sem liberar com destaque fechado (D33, D56); a tela do professor não ganha
ranking, tempo ocioso nem texto livre sobre aluno; cada tela cabe em 1366 × 768 e funciona a 360 px; e o e2e da A1 à
A4 continua provando as mesmas regras.

Em detalhe: os 23 requisitos do PRD têm teste apontado na tarefa que os entrega; a contagem de casos do e2e não
diminui em nenhuma tarefa; nenhum endereço de hoje deixa de abrir; o teto de cada pedaço `tela-professor-*` e o da
fachada passam no teste do build; cada tela tem foto no claro e no escuro, no computador e no celular, ao lado da
seção do `mockup.md`; e o `docs/interface.md`, Parte A, descreve o que foi construído.
