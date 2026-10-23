# Tarefa 95.0 — O dev que chega acha cada coisa pelo guia do desenvolvedor

**Funcionalidade:** reengenharia · **Depende de:** —
**Subagentes obrigatórios:** `revisor-geral` (na revisão do Arquiteto)
**Porte:** pequeno

## Objetivo

Quem chega ao repositório lê um guia só e acha nele onde fica cada coisa, que comando roda o quê e qual peça técnica usar,
com o nome de mercado (D81). O `docs/arquitetura.md` passa a dizer o que existe, e não o que existia antes da X5.

## Quem faz

**O Claude Code #2** (R52; RECORTE §4). Esta tarefa não parte numa linha e não tem Implementador nem portão de código.

1. O Claude Code #2 escreve `docs/guia-do-desenvolvedor.md` e a correção de `docs/arquitetura.md` e os entrega em
   `/home/joaquimdp/Documentos/git/Educa.ia/.processo/reengenharia/guia/` (no térreo), até ~15h de 22/10.
2. O Arquiteto revisa com o `revisor-geral`. Ele confere:
   - se cada caminho, comando e nome de peça existe no andar da spec naquele momento;
   - se nada contradiz a D81, as regras 00 a 80 ou a `techspec.md`.
3. O Arquiteto aplica no andar da spec e faz a primeira tela do `README.md` apontar para o guia. O commit é de documento,
   sem marcador `(tarefa`.
4. O que o guia descreve e ainda vai mudar na X5 (a pasta movida na 33.0 a 35.0 e 96.0, as camadas da 12.0) é conferido de
   novo antes do pouso. O Arquiteto corrige o guia no commit de documento do fim da spec.

## Contexto necessário

- `tasks/prd-reengenharia/RECORTE.md` §4 e a D81 em `docs/decisoes.md`
- `README.md`, `docs/arquitetura.md` e o `tasks.md` (o que a X5 entrega e o que foi para a X6)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `docs/guia-do-desenvolvedor.md` | novo |
| `docs/arquitetura.md`, `README.md` | alterado |

## Pronto quando

- O guia existe e o `revisor-geral` aprovou sem bloqueante.
- O `README.md` aponta para o guia na primeira tela.
- O `docs/arquitetura.md` não cita caminho que não existe no andar.
- A 95.0 está marcada `[x]` no `tasks.md` até sexta às 20h (a regra do corte).

## Fora do escopo desta tarefa

Código, teste e portão. O guia da X6, que se escreve quando ela partir.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 00:34:15 | 2026-10-23 00:36:49 | `revisor-geral` | 1 | APROVADO | afeab27864a3884ce |
