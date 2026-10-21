# Tech Spec da X5 — Onda 4B: os cortes da web e o sino

**Comum:** `techspec.md` · **PRD:** RF15 (a tela), RF24, RF26 · **Tarefas:** 66.0 a 80.0
**A leva 1 (a rede, o molde e os mecanismos) está em `onda-4a.md`.** Caminhos relativos a `apps/web/src/`.

## 1. O que muda

As 51 funções de tela acima de 80 linhas são cortadas no molde de `onda-4a.md` §2.2 e migram para `useSessao`,
`<Leitura>` e `Botao`. A entrada de senha e segundo fator vira uma só (RF26). O sino e o Painel da coordenação leem as
rotas prontas (37.0 a 39.0). A pessoa só vê mudar o que as linhas "mudança aceita" da §2.3 e da §2.4 dizem: o sino, os selos de
Turmas e dois blocos do Painel.

## 2. Desenho

### 2.1 O corte

A prova é a de `onda-4a.md` §2.2, com `--prune-suppressions` a cada corte; a 80.0 fecha com zero supressão de
`max-lines-per-function` em tela.

**A 70.0, a 73.0 e a 74.0 não têm caracterização na leva 1:** valem os testes de hoje, intocados no commit do corte,
com a mutação de cada um (linha do `it`, em `areas/`).
- **70.0:** `coordenacao/Painel.test.tsx:298` (D45, D64): o número ao lado de nome de professor.
- **73.0** (regra 70, itens 4 e 7), em `professor/`:
  - `TurmaHoje.test.tsx:227`: o nome no DOM antes de "Ver quem";
  - `:551`: um link para a conversa, ou o tempo parado;
  - `:563`: nota ou conceito na aba;
  - `AlunosDaTurma.test.tsx:135`: "0 de 0" no lugar de "Sem correção aprovada";
  - `:190`: um controle que ordena por acerto.
- **74.0:** `Artefato.test.tsx:183`: tirar a `<AssinaturaIA>` (`Artefato.tsx:212`); `Conversa.test.tsx:305` (a IA se
  identifica): tirar o selo "IA"; `:286` (a Adaptação): o texto da caixa chegar ao cartão (D35, D67).
- **A recusa da D55** não tem caso: a 74.0 o escreve antes do corte, em commit próprio ("a recusa do servidor aparece
  como resposta do Assistente, com o selo, sem nota nem conceito"), com a mutação de tirar o selo.

### 2.2 RF26 — a entrada comum (75.0)

`kit/entrada/` recebe valores e texto, nunca o erro nem a sessão, e substitui `paginas/Mfa.tsx:84-120`, `operacao/paginas/Mfa.tsx:89-125`, `paginas/Entrar.tsx:69-92`,
`operacao/paginas/Entrar.tsx:63-86` e 10 linhas de `ConfigurarMfa`. Travas: sem `api/sessao` nem `operacao/api`;
`autoComplete="one-time-code"` e `maxLength={TAMANHO_MAXIMO_SENHA}` só ali; `operacao.spec.ts:406` verde.

### 2.3 O sino pela leitura pronta (79.0)

`useFilaDoProfessor` e a fila da coordenação viram um `useQuery` de
`GET /v1/professor/esperando` e de `/v1/coordenacao/esperando`. Saem `relerEmSerie`, `serie`, `TETO_DE_TURMAS_LIDAS` e
os módulos da §2.4. Em `componentes/sino/Sino.tsx` o `parcial` (`:44`, `:98`, `:196`), por onde hoje sai o aviso sem ano da professora (`fila-do-professor.ts:185`), dá lugar a `sem-ano-letivo`, do `semAnoLetivo` da rota: o `aviso` da área, sem botão nem itens. A coordenação sem ano segue em "Tudo em dia". A regra do sino continua: **nunca "Tudo em dia" sem ter lido tudo** (`fila-do-professor.ts:144`).

Fora da tabela, tudo fica igual: lendo, o texto de `AVISO_SEM_ANO_LETIVO`, o vazio ("Tudo em dia" só com a resposta
lida), "100 ou mais", os tipos de item dos dois papéis e os selos de Turmas (`Turmas.tsx:26-29`).

| Papel · estado | Antes | Depois (mudança aceita) |
|---|---|---|
| Professora · erro | só com entregas e vínculos em erro (`fila-do-professor.ts:186`) | a chamada falhou |
| Professora · parcial | "Parte da lista não carregou. Não foi possível ler …" (`naoLeu`) | não existe: a rota é uma |
| Professora · sem ano | o aviso pelo `parcial`, com "Tentar de novo" (`Sino.tsx:196`) | `sem-ano-letivo`, sem botão |
| Professora · página cheia | "N ou mais pedidos esperando a decisão" (`:119`) | a contagem é exata |
| Professora · grupo sem nome | "Outras turmas" (`:37`) | sai: o alcance é o vínculo confirmado |
| Professora · teto | 12 turmas lidas (`:40`) | sem teto |
| Professora · "Não lida" | leitura falhou, recusada, truncada ou além das 12 (`Turmas.tsx:22`) | só com a chamada em erro |
| Coordenação · erro | só sem leitura lida (`fila-da-coordenacao.ts:162`) | a chamada falhou |
| Coordenação · parcial | "Parte da lista não carregou" (`fila-da-coordenacao.ts:165`) | sai; tipo com `haMais` dá "N ou mais" |

**Os testes.** A montagem vira função pura sobre a resposta e o estado da consulta, testada linha a linha em
`fila-do-professor.test.ts` e `fila-da-coordenacao.test.ts`, reescritos; os casos apagados já estão na API (37.0, 38.0).
O selo fica em `Turmas.test.tsx`, a tela em `SinoDoProfessor.test.tsx` e `SinoDaCoordenacao.test.tsx`, e
`professor-sino.spec.ts` e `sino-da-coordenacao.spec.ts` seguem verdes.
- O sem ano: `SinoDoProfessor.test.tsx:298` exige o aviso sem "Tentar de novo", com a mutação "sem ano em `pronta`";
  `SinoDaCoordenacao.test.tsx:159` pega a mutação "a coordenação sem ano em `sem-ano-letivo`".
- `sino-por-area.test.tsx`, reescrito: cada papel lê a sua rota uma vez, o professor nenhuma da coordenação, o aluno
  nenhuma das duas; `LEITURAS_DA_FILA` (`:22`) troca para as rotas novas.
- `recarregarDepoisDoLote` (`api/atividades.ts:51-53`, `:88`) e a confirmação de vínculo invalidam o "esperando"; o teste
  da correção `2026-10-19-sino-sem-a-correcao-aprovada` fica.

### 2.4 O Painel e o roteiro pela leitura pronta (79.0)

A 79.0 migra os outros consumidores do que apaga:
- "Esperando você" (`Painel.tsx:168-211`) lê o `useQuery` do sino;
- "Para terminar a escola" (`:228-300`, seis leituras), `Estrutura.tsx:61` e `OQueFalta.tsx` leem `GET /v1/escola/roteiro`:
  textos e links ficam na web, `feito` e `montada` vêm da rota (RF15), e sem ela lida o passo fica sem marca;
- `turmas-da-escola.ts`, `o-que-falta-da-escola.ts` e os testes deles só saem com zero importador (`rg`).

Fora da tabela, os dois blocos ficam iguais (carregando, vazio, itens, passos e "A escola está montada").

| Bloco · estado | Antes | Depois (mudança aceita) |
|---|---|---|
| Esperando · erro | só com a fila inteira em erro (`Painel.tsx:174`) | a chamada falhou |
| Esperando · parcial | "Parte da lista não carregou", com "Tentar de novo" (`:175-186`) | sai; `haMais` dá "N ou mais" |
| Terminar · erro | só da leitura dos anos | a chamada falhou |
| Terminar · parcial | "Parte do que falta não carregou", uma das cinco leituras em erro | sai: a rota é uma |
| Terminar · sem ano | "Comece pelo ano letivo" só sem nenhum ano; com ano só planejado, o passo do ano na lista | "Comece pelo ano letivo" com `anoEmCurso: false`, nos dois casos |

**A prova.** `Painel.test.tsx` troca a rede falsa pelas rotas: os casos de leitura parcial (`:387`, `:409`) saem
para a API (37.0 a 39.0); o de leituras (`:342`) lista as rotas novas; o do clique duplo em "Tentar de novo" (`:428`)
fica, com uma leitura só da rota única (regra 80.7). A mutação "Tudo em dia com a leitura em erro"
fica vermelha em `Painel.test.tsx › a fila inteira em erro…` (`:455`) e num caso novo do roteiro em erro.
`painel-da-coordenacao.spec.ts` segue verde (a `:83` cita a rota); `Estrutura.test.tsx` prova a marca e, no `:185`, o "Comece pelo ano letivo" (`Estrutura.tsx:241`) com `anoEmCurso: false`.

## 3. Falha

- **A rota do "esperando" falha:** "Esperando você, não carregou", com "Tentar de novo"; teste com a rota derrubada,
  nos dois papéis.

## 4. Isolamento, dado pessoal, conformidade, carga

- **Isolamento:** o sino só lê a rota do próprio papel (`sino-por-area.test.tsx`).
- **Dado pessoal:** o sino deixa `GET /turmas/:id/reivindicacoes` (até 100 nomes de menor) e fica com números.
- **Conformidade:** os textos de aprovação (D46) ficam idênticos; nenhum item da coordenação vem do trabalho do
  professor.
- **Carga:** o sino cai de até 14 chamadas para 1, e o Painel de seis para uma; a folga do chunk se mede na 70.0 a 72.0
  e na 78.0 (`nome-dos-chunks.test.ts`).

## 5. Tarefas (leva 2)

Número, título, RF, dependência, veto. **Toda a leva 2 depende também da 58.0 e da 59.0.**

- 66.0 `Aprovar` · RF24 · 60.0 · conformidade
- 67.0 `Time`, `AplicacaoDoArtefato`, `EncerramentoDaAtividade` · RF24 · 66.0 · conformidade
- 68.0 `Atividade` · RF24 · 61.0 · conformidade, privacy
- 69.0 `Tutor` · RF24 · 61.0 · conformidade, privacy
- 70.0 `Estrutura`, `AnoEDisciplinas` e hooks de anúncio, painel e ano · RF24 · 65.0 · conformidade
- 71.0 `Material`, `DialogoDeEnvioDeMaterial`, `ListaDaTurma` · RF24 · 70.0
- 72.0 `Professores`, `PainelDoProfessor`, `DetalheDoPedido`, `Agentes`, `Governanca`, `Analista` · RF24 · 71.0 · conformidade, privacy
- 73.0 `Turmas`, `TurmaHoje`, `AlunosDaTurma`, `AtividadesDaTurma`, `ConvidarAlunos` · RF24 · — · privacy, conformidade
- 74.0 `Artefato`, `Criados`, `Conversa` · RF24 · — · conformidade
- 75.0 Entrada comum: `Mfa`, `Entrar`, `ConfigurarMfa`, `Convite` · RF26 · 62.0, 64.0 · privacy
- 76.0 `NovaEscola`, `Escolas`, `NovaRede` · RF24 · 64.0
- 77.0 `TurmaPublica`, `Convite`, `LoginPorCima`, `CascaDaEscola`, `Menu`, `SeletorDeEscola` · RF24 · 57.0, 62.0, 63.0 · privacy
- 78.0 `DialogoDoConvite`, `ListaDePedidos`, `DialogoDeDecisao`, `MotorFormulario`, `CaixaPedido` · RF24 · 63.0 · privacy
- 79.0 Sino, fila e Painel da coordenação pela leitura pronta · RF15, RF24 · 37.0, 38.0, 39.0, 70.0, 73.0 · conformidade, privacy
- 80.0 Galeria e lints em zero · RF24 · 66.0–79.0

`frontend-reviewer` em toda a onda. A 75.0 e a 80.0 dividem o `eslint.config.mjs`.

## 6. Riscos

- **A 83.0** toca os mesmos e2e e fica para o fim.
- **O sino** já teve duas correções (`tasks/correcoes/2026-10-19-sino-*`): mudança fora das tabelas é divergência.
