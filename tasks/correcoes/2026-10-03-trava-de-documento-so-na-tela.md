# Correção — a trava contra matrícula com forma de CPF ou de data existia só na tela

**Origem:** validacao.md de prd-apresentacao-escola (1ª rodada, ressalva maior G2); `TODO.md`, "A lista de nomes colada
pela coordenação"
**Subagentes obrigatórios:** privacy-guardian, tenancy-guardian, frontend-reviewer, revisor-geral
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`pareceDocumento` (`apps/web/src/areas/coordenacao/previa-da-lista.ts`) segurava, na tela, a lista colada e o nome
avulso cuja matrícula tinha forma de CPF (`000.000.000-00`) ou de data (`01/02/2012`, `2012-02-01`). A API não conhecia
a regra: `POST /v1/turmas/:id/lista/previa` devolvia a linha como `entra`, `POST /v1/turmas/:id/lista` a gravava e
`POST /v1/turmas/:id/lista/nome` gravava o avulso, vindos de qualquer cliente que não a tela (regra 00, item 1; regra 20,
item 2: aluno não tem CPF nem data de nascimento). E o CPF sem pontuação, como o Excel exporta (número de 11
algarismos), passava também pela tela.

## Causa

A regra nasceu na 13.0 como aviso de tela e ficou no módulo da web, fora do contrato de `packages/shared`. O leitor da
API (`errosDasLinhas`, `apps/api/src/estrutura/leitor-da-lista.ts`) confere nome e matrícula pelas regras do
`esquemaMatriculaDigitada` (tamanho e caractere de controle) e não tinha conferência de forma; o
`esquemaPedidoNomeAvulso` também não. O CPF sem pontuação não estava em critério nenhum.

## Teste que reproduz

- `packages/shared/src/estrutura/documento-na-matricula.test.ts` (unidade): CPF pontuado, CPF sem pontuação com e sem
  dígito verificador válido, as datas que a tela já pegava, matrícula normal que passa, e a coluna com maioria de CPF
- `apps/api/test/lista.int.test.ts` › "G2: a matrícula com forma de CPF ou de data é recusada pela API…" e "G2: a lista
  com maioria de CPF sem pontuação…" (integração, Postgres real, chamando a API sem a tela)

## Correção

- **A regra no contrato** (regra 00, itens 1 e 6): `packages/shared/src/estrutura/documento-na-matricula.ts`, com
  `pareceDocumento` (CPF pontuado e data, o mesmo critério que a tela tinha), `pareceCpfSemPontuacao` (11 algarismos,
  dígitos verificadores do CPF certos, fora os 11 iguais) e `matriculasQueParecemDocumento` (a lista posição a posição).
  A web e a API importam as mesmas funções; as expressões saíram de `apps/web`.
- **Prévia e gravação da lista**: um código novo de erro de linha, `matricula_parece_documento`, em
  `ERROS_DA_LINHA_DA_LISTA`, conferido em `errosDasLinhas` (leitor da API) depois de `matricula_invalida` e antes de
  `matricula_repetida`. É erro que o texto sozinho mostra, e por isso segue o caminho dos outros: a prévia devolve a
  linha com o código, e a gravação com essa linha responde `ENTRADA_INVALIDA` antes de abrir a transação. **Por que um
  código de linha e não um código de erro novo da API:** a prévia já fala por linha, e o `ENTRADA_INVALIDA` é o que a
  gravação responde a todo erro que o texto mostra; um código de topo à parte faria a mesma linha ter dois contratos.
- **Avulso**: `esquemaPedidoNomeAvulso` recusa a matrícula com forma de CPF pontuado ou de data, e a rota responde
  `ENTRADA_INVALIDA`, como ao avulso sem matrícula. O CPF sem pontuação sozinho passa.
- **O critério da coluna de CPF sem pontuação**: mais da metade das matrículas preenchidas **e pelo menos duas**. O
  "pelo menos duas" é o ajuste ao critério pedido: uma lista de uma linha com 11 algarismos e dígito certo é o mesmo
  caso do avulso sozinho (matrícula numérica, 1 em 100 por acaso) e passa como ele; duas ao acaso saem 1 em 10 mil, e uma
  coluna de CPF de verdade passa da metade sempre. Só as linhas com a forma de CPF são marcadas; as outras ficam com o
  resultado delas, e a gravação é recusada inteira, como com qualquer linha de erro.
- **O erro não leva o valor** (regra 20, item 9): a resposta de erro é a do catálogo, fixa por código, e a prévia
  devolve a linha que a própria coordenação mandou, como já fazia. O teste do log ganhou a sentinela de CPF recusado.
- **Tela**: o aviso da coluna, o texto da linha e o motivo de não gravar continuam os mesmos. A linha marcada passa a
  vir da API como erro: aparece entre as de erro, no tom de erro, com "Erro: Parece CPF ou data de nascimento…", e a
  contagem a conta como linha com erro (o `e2e/estrutura.spec.ts` foi ajustado nisso). O nome avulso segue recusando
  antes de enviar, agora com o `pareceDocumento` do contrato.
- **Fora desta correção** (decisão do orquestrador): a saída para o falso positivo da matrícula com forma de data e as
  colunas a mais continuam no `TODO.md`, para as entrevistas do piloto.
- Documentos: Tech Spec da A1 (erros da linha, avulso, tela), `cenarios.md` (E4a, W10, RF4), `docs/lgpd.md` (lista de
  nomes) e `TODO.md` (as duas partes fechadas, riscadas e apontando para cá).

## Mutações

Cada cláusula e o teste que a derruba (conferido pelo `test-engineer` na 1ª rodada):

| Cláusula | Teste que falha sem ela |
|---|---|
| A conferência de forma em `errosDasLinhas` | `leitor-da-lista.test.ts` (G2); `lista.int.test.ts`, os dois primeiros G2 |
| O `refine` de `esquemaPedidoNomeAvulso` | `lista.int.test.ts`, G2 de CPF e data (avulso, com e sem espaço nas pontas); o teste do log (status 400) |
| O mínimo de duas na coluna de CPF | `documento-na-matricula.test.ts`, o caso `[a]` |
| "Mais da metade", e não "metade ou mais" | `documento-na-matricula.test.ts`, `[a, b, '1003', '1004']` |
| A vazia fora da conta | `documento-na-matricula.test.ts`, `[a, '', b, '1004']` |
| O dígito verificador e os 11 iguais | `documento-na-matricula.test.ts`, `12345678900`, `52998224724`, `11111111111` |
| A forma de documento antes da repetição | `leitor-da-lista.test.ts`, `01/02/2012` duas vezes |
| `podeGravar` pelos outros erros | `previa-da-lista.test.ts`, o motivo da coluna |
| O aviso pelo código da API e por `pareceDocumento` | `previa-da-lista.test.ts`, `12345678909` e o `sem_nome` com forma de CPF |

## Recomendações

- Aplicadas: o risco aceito do CPF sem pontuação sozinho, e onde a prévia devolve a linha recusada, na tabela de furos de `docs/lgpd.md` (`privacy-guardian`); o nome avulso traduz o `ENTRADA_INVALIDA` com o que fazer (`frontend-reviewer`); esta seção de mutações
  (`test-engineer`).
- Aplicadas, do `revisor-geral` (1ª rodada): o comentário do `gravar` realinhado; uma linha em `errosDasLinhas`
  dizendo que a maioria conta também a matrícula de linha com outro erro, de propósito (é a coluna que se julga); o
  `soErroDeDocumento` com nome em `podeGravar`; as linhas largas da Tech Spec e do `cenarios.md`.
- Para o `TODO.md`: o CPF sem o zero à esquerda (10 algarismos), e o e2e da coluna com maioria de CPF sem pontuação
  (os dois revisores; o job de e2e está perto do teto de 45 min).
- O e2e do nome avulso com CPF e data já existe (`e2e/estrutura.spec.ts`, o laço de `123.456.789-09` e `01/02/2012`), e
  prova a trava da tela antes de enviar, não o texto novo do `ENTRADA_INVALIDA`, que só aparece se a tela e a API
  divergirem. Um teste desse texto (unidade do mapa ou interceptação com 400 no Playwright) entra quando o e2e da lista
  for dividido, junto do item do `TODO.md` (`test-engineer`, 2ª rodada).

## Recomendações sem aplicar

- `frontend-reviewer`, 3ª rodada: contar o `soErroDeDocumento` de `previa.linhas`, e não do `comErro`. **Recusada:** o
  `comErro` e as linhas vêm da mesma resposta, contados num lugar só (`quantas('erro')`, `ListaService.previa`) e
  conferidos pelo `esquemaRespostaPreviaDaLista`; divergir exigiria mudar essa função, e o teste de integração E4 trava
  as contagens.
- `frontend-reviewer`, 3ª rodada: trocar o motivo para "enquanto houver matrícula que pareça CPF ou data de
  nascimento". **Recusada nesta correção:** a ordem do orquestrador foi manter o comportamento da tela, e o texto é o que
  o e2e e a unidade travam; vai junto do item do falso positivo no `TODO.md`, que revisa os textos da trava.
- `revisor-geral`, 2ª rodada: o texto do `ENTRADA_INVALIDA` no nome avulso começar por "Confira o nome e a matrícula" e
  citar a forma de documento como um dos casos. **Já atendida:** o texto aplicado é exatamente esse ("Confira o nome e a
  matrícula: a matrícula não pode ter forma de CPF ou de data de nascimento.").
- `revisor-geral`, 2ª rodada: a última frase da docstring de `errosDasLinhas` numa linha larga. **Recusada:** a linha é
  anterior a esta correção (2.0), e mexer nela só por largura caducaria o carimbo sem mudar nada.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-03 21:19:10 | 2026-10-03 21:20:02 | `test-engineer` | 1 | APROVADO | af3aa52d67b25b3ca |
| 2026-10-03 21:20:14 | 2026-10-03 21:20:45 | `frontend-reviewer` | 1 | APROVADO | ad41cd5cc8e15814f |
| 2026-10-03 21:21:30 | 2026-10-03 21:21:49 | `test-engineer` | 2 | APROVADO | ab0b90697c882004b |
| 2026-10-03 21:21:35 | 2026-10-03 21:21:49 | `frontend-reviewer` | 2 | APROVADO | a950cf727702aa858 |
| 2026-10-03 21:22:05 | 2026-10-03 21:22:21 | `tenancy-guardian` | 1 | APROVADO | a5bff164aa3748475 |
| 2026-10-03 21:22:00 | 2026-10-03 21:22:21 | `privacy-guardian` | 1 | APROVADO | a2e48aa0efd9c4bde |
| 2026-10-03 21:22:10 | 2026-10-03 21:22:39 | `revisor-geral` | 1 | REPROVADO | a0991e6f96d502f33 |
| 2026-10-03 21:23:30 | 2026-10-03 21:23:41 | `test-engineer` | 3 | APROVADO | a4cb0f0f9d839d040 |
| 2026-10-03 21:23:46 | 2026-10-03 21:23:57 | `frontend-reviewer` | 3 | APROVADO | a008072a4dbd9cc12 |
| 2026-10-03 21:24:21 | 2026-10-03 21:24:32 | `tenancy-guardian` | 2 | APROVADO | ad6a9c28f142602a7 |
| 2026-10-03 21:24:17 | 2026-10-03 21:24:33 | `privacy-guardian` | 2 | APROVADO | a09ef9cee0716bd17 |
| 2026-10-03 21:44:46 | 2026-10-03 21:45:04 | `revisor-geral` | 2 | APROVADO | a4d163694339ec6ad |
