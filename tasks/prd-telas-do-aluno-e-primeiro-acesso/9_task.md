# Tarefa 9.0 — A introdução do aluno, com o aviso de privacidade em linguagem de 11 anos

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 5.0, 8.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Na primeira entrada, o aluno vê quatro passos (o Tutor erra, quem dá a aula acompanha, o aviso de privacidade, o tamanho da letra) e
pode rever em Eu.

## Contexto necessário

- `techspec.md` seção 5 e 7b; `prd.md` RF12 a RF14 e RF16 a RF19; `mockup.md` seção 2.8 e fecho (b)
- Regras 20 (item 12) e 70 (itens 4a e 4b); D58, D59 e D64
- Código: `paginas/Inicio.tsx`; `areas/aluno/tutor.ts`; `concluirIntroducao` (1.0); `Introducao` (5.0)

## Subtarefas

- [ ] 9.1 — `aviso-de-privacidade.ts` e `textos-da-introducao.ts`, em `areas/aluno/`. O aviso: "Veja o que a escola
  guarda de você." "Guardamos seu nome, sua turma e sua matrícula." "Guardamos suas tarefas, suas notas aprovadas e o que você estudou
  com o Tutor." "Não temos seu e-mail, telefone, CPF, foto, endereço nem data de nascimento." "Quem dá a aula acompanha como você usa o
  Tutor." (`TEXTO_DA_SUPERVISAO`) "A coordenação vê os números da turma toda. Ver algo seu fica registrado." "Seus colegas não veem
  nada seu." "Seus dados não treinam IA." "Para ver seus dados, abra Eu e depois Privacidade." "Para pedir mais, fale com quem dá a aula
  ou com a coordenação."
- [ ] 9.2 — `BemVindo.tsx` (`lazy()`, `tela-aluno-BemVindo`) e a rota de 2.1. Passos 1 a 3: sem "Pular", sem X, Esc não sai; o 4 tem "Pular"
  igual ao "Continuar". "Começar" e "Pular" chamam `concluirIntroducao()` e vão a `/aluno/inicio`, mesmo se a gravação falhar.
  "Sair" não grava. Revendo, todo passo fecha. O desvio em `paginas/Inicio.tsx` é uma tabela por papel só com o aluno: a 10.0 e a 11.0
  acrescentam o delas
- [ ] 9.3 — Linha "Rever a introdução" em Eu
- [ ] 9.4 — `docs/aia/tutor.md` (pendência 12), `docs/lgpd.md` seção 9, `docs/conformidade-mec.md`
- [ ] 9.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `areas/aluno/aviso-de-privacidade.ts`, `textos-da-introducao.ts`, `BemVindo.tsx` e os dois testes, `e2e/aluno-introducao.spec.ts` | novo |
| `areas/aluno/rotas.tsx`, `Eu.tsx`, `paginas/Inicio.tsx`, `e2e/__fixtures__/casca.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts`, os três documentos | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| texto do aviso (RF14) | unidade | até 15 palavras por frase; sem "titular", "controlador", "LGPD", "consentimento", "tratamento"; cita os seis dados que não temos; diz que não treina IA; a supervisão é o `TEXTO_DA_SUPERVISAO`; sem fala de sentimento |
| avisos sem "Pular" | componente | passos 1 a 3 sem "Pular" nem X; o 4 com "Pular" do mesmo tamanho |
| sair no meio; POST que falha | componente + e2e | "Sair" e fechar a aba não gravam e a introdução volta; se o POST falha, a pessoa segue |
| primeira e segunda entrada | e2e | pessoa `introducao: 'por_ver'` cai na introdução; depois de concluir, vai ao Início |
| rever; duplo clique | e2e | todo passo fecha e a data não muda; dois cliques em "Começar", um POST |
| recomeço da tela | e2e | o aluno seguinte no mesmo computador vê a introdução dele |
| 360 px | e2e | sem rolagem lateral, botões de 44 px |

Isolamento e concorrência da data são da 1.0; carregando e erro são os da `Inicio`.

## Como testar

- Copie `ListaDePedidos.test.tsx` (`componentes/pedidos/`); no e2e, `entrarComoAluno` com `introducao: 'por_ver'`
- `escola-montada` e `roteiro-da-demonstracao`: a aluna criada pela tela passa pela introdução (helper em `casca.ts`)
- Rodar: `npx vitest run --project unidade apps/web/src/areas/aluno/textos-da-introducao.test.ts` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/aluno-introducao.spec.ts`
- Telas: `aluno`, `/aluno/bem-vindo` (login com matrícula, primeira vez; ou Eu › "Rever a introdução"); mockup `/aluno/bem-vindo`

## Fora do escopo desta tarefa

"Avisar um adulto" e o passo dele (F9); pedido de dados; aviso ao responsável (ECA Digital, art. 24).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->
