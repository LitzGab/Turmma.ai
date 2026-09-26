# Tarefa 11.0 — Web: casca por papel, guarda de papel, título por rota, menu da pessoa e fronteira genérica

**Funcionalidade:** apresentacao-escola · **Depende de:** nenhuma · **Paralelo com:** 1.0 a 10.0
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Cada papel entra numa casca com a pele da D72 e só os itens da fase dele; a área vem por `import()`, com fronteira e
carregamento; o endereço de outro papel cai em "não encontrada"; a aba diz a tela.

## Contexto necessário

- `docs/interface.md` 11.1 e 9.1; D72 e D73; `techspec.md` seção 9 ("Casca", "Fronteira")
- `cenarios.md`: W2, W5, W4 (linha "Turmas"), W12; `.claude/rules/50-frontend.md` inteira
- `TODO.md`: o `componentWillUnmount` de `apps/web/src/rotas.tsx:53` sem teste
- Código:
  - `apps/web/src/rotas.tsx` — a `FronteiraDaOperacao` e o `Suspense` da operação, que viram genéricos
  - `apps/web/nome-dos-chunks.ts` e o teste dele; `.size-limit.json`
  - `apps/web/src/componentes/estado/`, `Marca.tsx`, `Botao.tsx`; tokens e logotipo já em `estilos.css` e
    `public/marca/` (confira contra `mockups/`)
  - `apps/web/src/paginas/Vinculos.tsx` — o confirmar e contestar do F1, que vira "Turmas"
  - `e2e/casca.spec.ts`, `e2e/__fixtures__/verificacoes.ts` (largura, alvo de toque, axe)

## Subtarefas

- [ ] 11.1 — A fronteira sai de `rotas.tsx` para `componentes/`, genérica (título e texto por área); a operação a usa
  sem mudar de comportamento
- [ ] 11.2 — Áreas `coordenacao-*`, `professor-*` e `aluno-*` por `import()`, cada uma com a fronteira, `Suspense`
  e `EstadoCarregando`; guarda de papel em `rotas.tsx`; título por rota
- [ ] 11.3 — A casca da 11.1 (lateral, trilho, gaveta abaixo de 768 px, as três pistas do selecionado); a navegação
  numa tabela por papel, e cada tarefa de tela acrescenta a linha do item dela (Minha turma na 12.0, Estrutura na
  13.0, Professores na 14.0). Aqui entra "Turmas", sobre o `Vinculos` do F1, com os vazios do W4. Até a 13.0, a
  coordenação abre na página inicial que já existe
- [ ] 11.4 — Menu da pessoa (P18): o nome, o papel e "Sair", a um clique e do mesmo tamanho dos outros itens
- [ ] 11.5 — Teto de cada chunk novo no `.size-limit.json`
- [ ] 11.6 — Testes; o e2e da A0b roda junto

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/FronteiraDaArea.tsx`, `CascaDaEscola.tsx`, `MenuDaPessoa.tsx`; `areas/*/rotas.tsx`, `areas/navegacao.ts` | novo |
| `apps/web/src/rotas.tsx`, `caminhos.ts`, `apps/web/nome-dos-chunks.ts`, `paginas/Vinculos.tsx` (vira `areas/professor/Turmas.tsx`) | alterado |
| `.size-limit.json`, `e2e/casca.spec.ts`; `e2e/areas.spec.ts` | alterado, novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W2 | e2e | só os itens da tabela, nenhum sem tela; o professor no endereço da coordenação cai em "não encontrada"; o título muda por rota |
| W5 | e2e | `import()` de `coordenacao-*` e `professor-*` abortado: o texto e o título da falha, e o anterior de volta ao sair |
| W4 (Turmas) | e2e | os quatro estados, com os textos da tabela; vazio e erro com a rota interceptada |
| W12 (casca) | e2e | 360 px sem rolagem horizontal; gaveta abaixo de 768 px; alvos de 44 px; Tab percorre a lateral |
| recomeço da tela | e2e | segunda pessoa: a coordenação entra na aba do professor sem item nem cache dele; mesma entrada: a rota aberta de novo não duplica a área; resposta atrasada: o `import()` lento da área anterior não aparece depois da troca; falha com a gaveta aberta: a fronteira assume e o foco sai da gaveta |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [ ] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral`, com rodada que vale
  para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O seletor (12.0); as telas dos outros itens (12.0 a 17.0); "Seu time" (A2); as outras entradas do menu (P09).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

Pendências de tela que a 11.1 não decide, anotadas antes dos revisores:

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| spec, rodadas 1 a 5 | "Sair" no celular: dentro da gaveta, fica a dois ou três toques, e a D59 pede a um clique | `/validar` |
| spec, rodadas 1 a 5 | Rodapé do aluno ("Avisar um adulto" e "Privacidade", D61): na 11.1 é proposta | `/validar` |
| spec, rodadas 1 a 5 | "Como a IA funciona aqui" no menu: a 11.1 a põe na A1, mas a A1 não tem IA nem a tela, e o W2 proíbe item sem tela | `/validar` |
