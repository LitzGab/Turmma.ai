# Tarefa 17.0 — Web: página pública da turma e o e2e do fluxo inteiro (W1)

**Funcionalidade:** apresentacao-escola · **Depende de:** 16.0, 12.0, 6.0 · **Paralelo com:** nenhuma
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O aluno abre `/e/<slug>/turma` pelo link ou digita o código, escolhe o nome, informa a matrícula e cria a senha, num
envio só que sobrevive ao sistema cheio; e o fluxo inteiro, da escola vazia ao aluno aprovado, roda de ponta a ponta.

## Contexto necessário

- `docs/interface.md` 11.1 (casca pública) e a regra 50 inteira; `docs/lgpd.md`, lista de nomes
- `techspec.md` seções 4 (`salas/*`), 5 (passo 3), 9 ("Página pública", "Textos") e 7c (`Retry-After`)
- `cenarios.md`: W1, W8, W9, W11, W4 (linha "Pública"), W12
- Regras 20 (itens 4, 8), 80 (itens 1, 6)
- Código:
  - `apps/web/src/paginas/EntrarNaEscola.tsx` (`/e/:slug`) e `CascaPublica.tsx`
  - `apps/web/src/paginas/Convite.tsx` — o token tirado do fragmento antes da primeira chamada
  - A normalização do código (4.0), `REIVINDICACAO_RECUSADA` (6.0) e `packages/shared/src/erros/mensagens.ts`
  - `.size-limit.json`: a página fica na entrada, abaixo de 150 kB

## Subtarefas

- [ ] 17.1 — `MENSAGENS_DA_SALA` em `packages/shared`, com os textos exatos do W9; o de `NAO_ENCONTRADO` escolhido
  pelo caminho que a página usou; o N do limite arredondado para cima, mínimo 1, com singular
- [ ] 17.2 — Rota `/e/<slug>/turma`: o fragmento sai do endereço antes da primeira requisição; sem token, o campo
  do código (`autocapitalize="characters"`); vencido pelo link, o texto do link e o campo do código com o foco
- [ ] 17.3 — Nomes livres, escolha, matrícula (`inputmode="text"`, `autocomplete="off"`) e senha ("mostrar", 12
  caracteres avisados). Nomes e `chaveEnvio` só em memória; um envio no ar; o botão em carregamento também na
  espera de 1 s; o 503 reenvia a mesma chave até 3 vezes, pelo `Retry-After` com variação aleatória, e depois
  "Tentar de novo"; a recusa recarrega os nomes; `role="status"` e `role="alert"` com `aria-describedby`
- [ ] 17.4 — Depois do pedido, a tela avisa que "matrícula ou senha incorretas" antes da aprovação é espera
- [ ] 17.5 — W1: o fluxo inteiro; a entrada continua abaixo de 150 kB no `.size-limit.json`
- [ ] 17.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/shared/src/sala/mensagens-da-sala.ts` (e teste) | novo |
| `apps/web/src/paginas/TurmaPublica.tsx`, `reenvio-da-sala.ts` (e teste) | novo |
| `apps/web/src/api/salas.ts`, `caminhos.ts`, `rotas.tsx` | novo, alterado |
| `e2e/turma-publica.spec.ts`, `e2e/escola-montada.spec.ts` | novo |
| `.size-limit.json` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W1 | e2e | coordenação, professor e aluno, com nomes gerados, até o aluno ver só a própria turma, nos dois projetos |
| W8 | e2e | sem `#` na primeira requisição; nada em `localStorage`, `sessionStorage`, IndexedDB, Cache Storage nem no endereço; clique duplo; o reenvio pelo relógio falso; os textos pelo caminho; o 429 pelo nome e pelo `rl:ip`; os `role` |
| W9 | unidade | cada texto exato; 60 s dá 1 minuto e 61 s dá 2; nenhum com código de erro nem "computador" |
| W11 | e2e | os atributos de cada campo |
| W4, W12 (pública) | e2e | vazio com "chame o professor"; vencido com o texto do caminho; 360 px sem rolagem; tudo só com teclado |
| recomeço da tela | e2e | segunda pessoa: depois do envio, outro aluno no mesmo computador não vê nome, matrícula nem senha do anterior; mesmo link colado de novo na aba abre a turma sem ficar preso com o token na barra; resposta atrasada: o `salas/abrir` de um código anterior que chega depois não troca a turma; falha: a recusa recarrega os nomes, e o aviso, o foco e a senha da tentativa anterior saem |
| log novo | — | a tarefa não escreve log |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [ ] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral` e os guardiões, com
  rodada que vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Contador por navegador (7c); contagem de quem entrou (D59); reset de senha (F2).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| spec, rodadas 1 a 5 | Como o aluno escolhe entre dois nomes iguais (E24): a 11.1 não decide, e a página mostra os dois iguais | `/validar` |
