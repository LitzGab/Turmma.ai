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

## Rodadas fora do hook

As rodadas 1 a 4 do `revisor-geral` (22/10/2026, a 4ª APROVADO) correram no térreo, sobre o texto entregue em
`.processo/reengenharia/guia/`, e o hook não as registrou. A cópia literal está em `95_revisao-rodadas-1-a-4.md`, nesta
pasta (validação 1, maior 1). O fecho `c88231a`, que conferiu o guia e a arquitetura contra a árvore depois das pastas,
teve rodada própria em 23/10/2026, registrada pelo hook abaixo e em `achados/95_task.md`: APROVADO, sem bloqueante (o hook
a numera 1, porque não viu as quatro de antes).

## Recomendações sem aplicar

Da rodada sobre o `c88231a`. São precisões do texto, sem frase falsa; mudar o guia agora pediria rodada nova no
fechamento. Vão juntas para o `TODO.md` ("Da X5 (reengenharia), fora dela"), para a X6, que reescreve a documentação na
Etapa 11 completa.

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (5ª, hook 1ª) | `guia-do-desenvolvedor.md:146-148`: dizer que `credencial/` também guarda seis repositories da sessão | `TODO.md`, X6 |
| revisor-geral (5ª, hook 1ª) | guia `:148` e `arquitetura.md:53-54`: citar a exceção do `operacao/token-do-convite.ts` ao "só pelo `index.ts`" | `TODO.md`, X6 |
| revisor-geral (5ª, hook 1ª) | `arquitetura.md:30-31`: dizer que `app-nao-importa-app` e a regra repository → service não valem para teste nem para o `expurgo-da-escola.repository.ts` | `TODO.md`, X6 |
| revisor-geral (5ª, hook 1ª) | guia `:419`: citar `sessao-nao-importa-operacao`, `api-nao-importa-ops` e as três cercas por import | `TODO.md`, X6 |
| revisor-geral (5ª, hook 1ª) | `arquitetura.md:51` e guia `:139`: o exemplo `estrutura/turma/` não tem os testes ao lado | `TODO.md`, X6 |
| revisor-geral (5ª, hook 1ª) | guia `:418`: o `erro-tipado` não cobre `packages/shared/src` | `TODO.md`, X6 |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 00:34:15 | 2026-10-23 00:36:49 | `revisor-geral` | 1 | APROVADO | afeab27864a3884ce |
