# Tech Spec — Telas do aluno e primeiro acesso

**PRD:** `tasks/prd-telas-do-aluno-e-primeiro-acesso/prd.md`
**Status:** rascunho

## 1. Resumo da abordagem

Quase tudo é `apps/web` e `e2e/`. As telas do aluno são recompostas com as peças da X1 e com três consultas que
**já existem**: `GET /v1/minhas-atividades`, `GET /v1/tutor/conversa` sem atividade (o uso do dia) e
`GET /v1/tutor/memoria`, que a web ainda não lia (o resultado por tarefa). A introdução é uma peça só, com uma
tabela de passos por papel, numa tela de foco **dentro** da casca. O backend é mínimo: uma coluna em `usuario`, um
campo no `GET /v1/eu` e uma rota de escrita. O desvio da primeira entrada mora só em `paginas/Inicio.tsx`: as
páginas públicas não mudam.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `packages/nucleo` (`db/schema/usuario.ts`, `drizzle/0037_*`, `titular/leitura-do-titular.ts`) | alterado | a coluna, a migration e o arquivo do titular |
| `packages/shared` (`sessao/eu.ts`, `permissao/matriz.ts`) | alterado | o campo do `/v1/eu` e a ação `eu.concluir_introducao` |
| `apps/api/src/sessao` (`eu.*`, `resolucao-de-tenant.repository.ts`) | alterado | leitura e escrita da data |
| `apps/web/src/areas/aluno/` | novo e alterado | `Inicio`, `Eu`, `BemVindo`; `Atividades`, `Atividade`, `rotas` |
| `apps/web/src/areas/professor/`, `coordenacao/` | novo | `BemVindo` e a rota dele |
| `apps/web/src/componentes/` | novo | `introducao/`, `TelaDeFoco`, `Balao`, `Comemoracao`, `TamanhoDaLetra`, poses em `onca/` |
| `CascaDaEscola.tsx`, `caminhos.ts`, `areas/navegacao.ts`, `paginas/Inicio.tsx` | alterado | foco, endereços, lugares, desvio |
| `apps/web/src/letra.ts`, `index.html`, `estilos.css` | novo e alterado | o tamanho da letra |
| `e2e/`, `tools/vitrine/`, `docs/` | alterado | fixtures, specs, documentos |

## 3. Modelo de dados

```
Usuario   + introducaoVistaEm timestamptz?   (escolaId já existe; sem anoLetivoId: a pessoa não é do ano)
```

Uma migration: `alter table usuario add column introducao_vista_em timestamptz`, sem valor padrão nem índice.

**Por que no usuário.** O vínculo é por turma e ano: a introdução voltaria em janeiro. A conta não serve ao aluno,
que não tem conta, e é a credencial global sem escola (a exceção da regra 10): seriam dois lares para o mesmo
fato. O usuário é a pessoa numa escola, com o papel dela, e é o `sub` do token.

**Duas escolas.** A escrita toca só o usuário da sessão. O `/v1/eu` devolve a data **mais antiga** entre a dele e
a dos outros usuários ativos da mesma conta **com o mesmo papel**, que `acessosDaConta` já lista para o seletor.

## 4. API

| Método | Rota | Papel | Entrada | Saída |
|---|---|---|---|---|
| GET | `/v1/eu` | coordenador, professor, aluno | — | os campos de hoje e `introducaoVistaEm` (data e hora, ou nulo) |
| POST | `/v1/eu/introducao` | os três (`eu.concluir_introducao`, `proprio`) | corpo vazio, estrito | `{ introducaoVistaEm }` |

`acessos` não ganha campo.

## 5. Fluxo

**Primeira entrada.** Todo login termina em `/`. `Inicio` lê o `/v1/eu`: com a data nula, troca o endereço por
`<área>/bem-vindo`; senão, pela tela de abertura (o aluno, `/aluno/inicio`). Endereço aberto direto não desvia.

**Concluir ou pular.** `POST /v1/eu/introducao`; a resposta entra no cache `['eu']` e a pessoa vai para a tela de
abertura. Se a gravação falha, ela vai do mesmo jeito, e a introdução volta na próxima entrada. Sair da conta no
meio não grava.

**Rever.** Um link para o mesmo endereço. Com a data já gravada, todo passo tem "Fechar", e o POST repetido não
muda nada.

**Escrita.** Uma instrução, síncrona: `update usuario set introducao_vista_em = coalesce(introducao_vista_em,
now()) where escola_id = <contexto> and id = <contexto> returning introducao_vista_em`.

**Tela de foco.** `caminhos.ts` lista os três endereços; neles a casca não desenha lateral nem barras, e mantém o
`<main>`, o relógio de inatividade e o `lembrarQuemEsta`. "Sair" fica no topo da `TelaDeFoco`.

**Tamanho da letra.** Chave `educa.letra` (`grande` ou `maior`; ausente é Padrão; voltar a Padrão apaga). O script
em linha da X1 a lê e, se o caminho começa por `/aluno`, escreve `data-letra` no `<html>`; `useTamanhoDaLetra()`,
montado na área do aluno, mantém o atributo e o tira ao sair. No CSS, `font-size` de 112,5% e de 125%.

## 6. Isolamento (obrigatório)

Leitura e escrita da própria pessoa: `escola_id` e `id` do contexto, sem id no caminho nem no corpo (regra 10, item
3). A única leitura entre escolas é a da data nos usuários ativos da mesma conta, pelo método que já é
`@SemEscopo` para o seletor, cuja justificativa ganha a data. Nada de outra escola sai no DTO.

Testes de isolamento (integração): com o contexto de B, o usuário de A não é alterado; a professora de A e B marca
em A, o `/v1/eu` em B devolve a data, e a linha de B continua nula; professora em A e coordenadora em B não herdam
uma da outra; o usuário desativado ou com eliminação agendada não empresta a data.

## 7. Dado pessoal (obrigatório)

| Item | Resposta |
|---|---|
| Campos pessoais tocados | `usuario.nome` (o primeiro nome, na saudação; já vem no `/v1/eu`) |
| Novos campos (atualizar `docs/lgpd.md`) | `usuario.introducao_vista_em`: linha nova no mapa, ao lado da marca da eliminação agendada |
| O que vai para log | nenhuma linha nova |
| O que entra em auditoria | nada: não é leitura de dado alheio nem decisão (regra 20, item 10) |
| O que é enviado a provedor externo | nada |
| Retenção e expurgo | a da tabela `usuario` (`pessoa_desativada`): sai com a linha, no expurgo e na eliminação. O catálogo não ganha classe |
| Arquivo do titular | a coluna entra em `LEITURAS_DO_ARQUIVO.usuario.colunas`; o teste de cobertura prende a escolha |
| Autorização por objeto | não há objeto: a rota age sobre quem está no token |
| DTO de saída | `introducaoVistaEm`, só da própria pessoa |

No navegador entra uma chave sem identificador, `educa.letra`, gravada só por escolha.

## 7b. Conformidade CNE (quando há IA no caminho do aluno)

O Tutor continua supervisionado, sem aprovação uma a uma (D47), e nenhuma chamada de modelo é nova. O que esta
spec escreve é texto sobre a IA, em `.ts` com teste: a faixa usa `TEXTO_DA_SUPERVISAO`, a introdução repete a
mesma frase, e as pausas usam `avisoDaPausa`. "Como estou indo" lê só o que `/v1/tutor/memoria` entrega com
`resultado` não nulo (lote aprovado) e mostra `aReforcar` como veio: a web não calcula limiar. Os `sinais` da
memória **não** são mostrados (F9). A comemoração depende só de o envio ter sido confirmado nesta tela. A pose
`acolhendo` não é desenhada. A pendência 12 de `docs/aia/tutor.md` fecha na tarefa do aviso.

## 7c. Carga e falha (obrigatório)

| Item | Resposta |
|---|---|
| Está no caminho quente? | login e tutor, de leve |
| Carga na manhã de segunda | o `/v1/eu` lê uma coluna a mais na mesma consulta. O Início soma **uma** requisição por aluno que entra: `GET /v1/tutor/conversa?limite=1`, a que a tela do Tutor já faz |
| Fila, limite por escola | nenhuma fila; o limite geral |
| Rate limit | `POST /v1/eu/introducao` usa o contador geral, por usuário e por escola, sem contador próprio |
| Corridas de concorrência | dois POST juntos (clique duplo, duas abas): o segundo espera a trava da linha, e o `coalesce` mantém a primeira data; os dois respondem 200 com a mesma data. Cenário com `Promise.all` |
| Índices novos, migration | nenhum índice; coluna nula, que o código anterior ignora |
| Quando cada dependência cai | banco: o `/v1/eu` falha e a tela mostra o `EstadoErro` de hoje; o POST que falha não prende ninguém. Tutor fora: o Início mostra o resto e, no bloco do uso, erro curto com "Tentar de novo" |
| Métrica, alerta, teste de carga | nada novo |

## 8. Uso de IA (quando aplicável)

Nenhum caso de uso novo e nenhuma chamada de modelo.

## 9. Frontend

**Lugares.** `NAVEGACAO.aluno`: Início (`/aluno/inicio`, também selecionado em `/aluno/tutor`), Tarefas
(`/aluno/atividades`) e Eu (`/aluno/eu`, também em `/aluno/privacidade`). `RODAPE_DA_LATERAL.aluno` fica vazio, e
`/aluno/minha-turma` redireciona. A tarefa dos lugares cria `Inicio.tsx` e `Eu.tsx` com o que existe (a escolha da
atividade e o cartão da turma), para as tarefas seguintes não tocarem em arquivo comum.

**Início**: saudação, faixa presa, "Para fazer" (até três, da primeira página), uso do dia e, se houver, o aviso
de pausa. **Tarefas**: `separarAtividades` passa a três grupos; `Linha` com `Ladrilho` na cor da matéria
(`materia.ts`: do nome da disciplina para família e ícone `lucide`, com reserva neutra). **Tarefa aberta**: só a
moldura e a `Comemoracao`. **Eu**: cartão da turma, "Como estou indo" e as quatro linhas; "Ajustes" abre um
`Dialogo` com `Aparencia` (X1) e `TamanhoDaLetra`.

**Peças novas**, em `componentes/`, fora da entrada: `TelaDeFoco`, `Balao`, `Comemoracao` (os `@keyframes` num CSS
ao lado, só `transform` e `opacity`, uma vez), `introducao/Introducao` e as três poses da onça. A `Introducao`
recebe passos (`pose`, `fala`, `conteudo`, `obrigatorio`) e avisa "concluiu" ou "pulou"; a fala é o `h1`, recebe o
foco a cada passo, e Enter continua. Os textos moram em `.ts` com teste.

**Nomes que não mudam:** um `<main>`; `navigation "Seções"`; os `data-*` de hoje; "Enviar a atividade", "Atividade
enviada", "Pedir ajuda ao Tutor nesta questão". **Mudam:** `h1` e título "Atividades" para "Tarefas"; as regiões
"Para responder" e "Já feitas"; a fixture `esperarAtividades`, que vira `esperarInicioDoAluno`.

**Chromebook e celular.** Telas novas por `lazy()` (`tela-<área>-*`, 30 kB); nada da entrada importa a onça. Tudo
provado a 360 px, também com a letra Maior.

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | os três grupos; `materia.ts`; os textos da introdução e o aviso (frases e termos); `letra.ts`; navegação e caminhos |
| Componente (jsdom) | os quatro estados de Início, Tarefas e Eu; a comemoração; a `Introducao` (ordem, foco, botões iguais, obrigatório, rever); a casca em foco |
| Integração | a rota (repetida, em paralelo, por papel), o `/v1/eu` com a data, o arquivo do titular |
| E2E | os lugares; a primeira entrada por papel; o tamanho da letra; e os specs do aluno, `areas`, `meus-dados`, `escola-montada` e `roteiro-da-demonstracao`, mudando só rótulo e caminho |
| Isolamento | os quatro da seção 6 |

As fixtures do e2e e a vitrine passam a criar pessoa **com a introdução vista**; quem testa a introdução pede o
contrário, e pessoa criada pela tela passa por ela no teste.

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa | Documento que registra o desvio |
|---|---|---|---|
| 00, 40, 80 | seções 4, 10 e 7c | nenhum | — |
| 10 | seção 6 | a leitura da data atravessa escolas pela conta, no método já `@SemEscopo`; a alternativa (coluna na `conta`) está recusada na seção 3 | `docs/modelo-de-dados.md` |
| 20 | seção 7 | nenhum | `docs/lgpd.md` |
| 50 | seção 9 | o mockup é contrariado nos 14 pontos do PRD | PRD, seção 6 |
| 70 | seção 7b | nenhum | `docs/aia/tutor.md` |

## 12. Premissas não verificadas

- `⚠️ NÃO VERIFICADO` — os nomes de arquivo das peças da X1 (`Linha`, `Ladrilho`, `Aparencia`, `componentes/onca/`,
  `tema.ts`): a X1 ainda não tem tarefas. Cada tarefa confere antes de importar
- `⚠️ NÃO VERIFICADO` — se a X2 ou a X3 já pousaram quando a introdução for escrita. Por isso "onde fica cada
  coisa" sai de `NAVEGACAO[papel]`, e não de texto fixo
- `⚠️ NÃO VERIFICADO` — o passo "quem dá a aula acompanha" contra o que o professor vê de fato: a tarefa confere
  com `packages/shared/src/tutor/uso.ts` e `sinal.ts`

## 13. Riscos técnicos

- **A introdução quebra toda entrada do e2e.** Por isso a primeira tarefa já põe a data nas fixtures
- **O `tenancy-guardian` veta a leitura pela conta.** Saída: a introdução passa a ser por escola, e o professor de
  duas escolas a pula na segunda; o RF12 muda junto
- **A comemoração é vetada.** Sai da tarefa aberta, e o fim da introdução fica parado
- **Letra Maior estoura a 360 px**: corrige-se a tela, e não o tamanho
