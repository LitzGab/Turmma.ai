# Correção — o e2e das empresas que recebem dados espera só 5 s depois de recarregar a página

**Origem:** esteira run 38944717887, sobre `e30b9ca` (fatia 3 de 5 do e2e); pedido do Orquestrador em 16/10/2026. A `develop` em `2029703` está verde.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção mexe em um arquivo de teste fora de `tasks/`, abaixo do limite de 5 e fora de `.github/`, `tools/ci/` e `tools/processo/`. -->

## Sintoma

`e2e/privacidade.spec.ts:298` (`as duas abas se alternam pelo clique ou toque, e o endereço guarda a aba`) cai na linha 307, depois do
`page.reload()`, no projeto `chromebook` na esteira e no `celular` na máquina:

```
Locator: getByRole('tab', { name: 'Empresas que recebem dados' })
Expected: "true"
Timeout: 5000ms
Error: element(s) not found
```

O endereço já é o das empresas (a linha 306 passou), mas a tela ainda é o `Carregando…` da casca: o contexto da página do Playwright
mostra só o banner e `main › status "Carregando…"`.

## Fora desta correção

Nada: nenhuma tarefa em curso na linha 2. A linha 1 tem a 2.0 na árvore dela, que é de outro checkout.

## Causa

**É a espera da asserção, e não a aba.** `page.reload()` recarrega o aplicativo inteiro: baixa a casca, renova a sessão pelo cookie
(`POST /v1/sessao/renovar`), lê `/v1/eu`, baixa o pedaço da área da coordenação e os pedaços dela, e só então desenha a Privacidade.
No perfil do `celular` e no `chromebook` com CPU ×4 e rede Fast 3G, cada requisição leva uns 600 ms, e o trace do `celular` mostra
esse caminho em ondas de pedidos: do `goto` do reload (`22:09:08.9`) até o último pedaço (`22:09:13.4`) passam 4,5 s, e o desenho vem
depois. Passa dos 5 s do prazo padrão do `expect`.

É a única recarga do arquivo sem o prazo da entrada: as linhas 159, 352 e 360, que também recarregam, esperam com
`PRAZO_DA_ENTRADA_MS` (20 s, `e2e/__fixtures__/casca.ts`: "o Chromebook com CPU ×4 e rede Fast 3G carrega a página…"), e a própria
`abrirAsEmpresas` também. As linhas 306 e 307 ficaram com os 5 s padrão, e na `develop` a recarga cabia nesse prazo com folga
mínima.

**O que a tarefa 1.0 (`694f9d4`) mudou nisso:** o sino acrescentou ao carregamento da área os pedaços dele (`SinoDaCoordenacao`,
`Sino`, `Contador` e os ícones: nove arquivos no trace) e as seis leituras da fila (`anos-letivos`, `professores`, `materiais`,
`incidentes`, e `turmas` e `vinculos` depois). Nenhum deles bloqueia a Privacidade (`<Suspense fallback={null}>`), mas disputam a mesma
rede e as mesmas seis conexões da página, e a recarga passou do prazo. O custo é do desenho do sino, que é lazy por decisão da tarefa;
esta correção não o muda. Quem quiser cortar esse custo decide pelos pedaços do sino, numa tarefa à parte.

## Teste que reproduz

`e2e/privacidade.spec.ts:298 › as duas abas se alternam pelo clique ou toque, e o endereço guarda a aba` já é o teste, e já estava
vermelho antes da correção: a esteira (`chromebook`) e a máquina (`celular`, `node tools/ci/e2e.ts --manter-ambiente
e2e/privacidade.spec.ts`: 17 verdes e 1 vermelho, em 16/10/2026). A intermitência é de carga do ambiente (o `chromebook` passou
nesta mesma execução local, e caiu na esteira), e por isso a prova do verde é a repetição.

- **Vermelho antes:** a saída acima, nos dois projetos.
- **Verde depois:** o mesmo arquivo, `--repeat-each 3 --workers 2`, nos dois projetos: o arquivo inteiro, 18 de 18, e o caso repetido, `--repeat-each 3 --workers 2`, 6 de 6 (3 no `chromebook` e 3 no
  `celular`), em 16/10/2026.

## Correção

`e2e/privacidade.spec.ts`, linhas 306 e 307: as duas asserções que esperam a tela depois do `page.reload()` ganham
`{ timeout: PRAZO_DA_ENTRADA_MS }`, como as outras três recargas do arquivo. Nenhum código de produto muda, e nenhuma cláusula nova
entra: a regra que o teste afirma (o endereço guarda a aba, a aba escolhida é a das empresas, a lista é a da escola) é a mesma, só
espera o que a recarga leva.

## Mutações

Nenhuma: a correção não acrescenta cláusula de código, só o prazo de uma asserção de teste.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | O documento da correção diz "linhas 306 e 307", mas o comentário novo empurrou as asserções para 307 e 308 | Recusada: o documento descreve o arquivo como estava quando o defeito foi achado, e nessa versão as linhas eram 306 e 307. Não é erro, e mexer no texto não muda nada do que o teste prova |
| test-engineer (1ª) | O custo do sino na recarga (pedaços lazy e seis leituras da fila disputando as conexões) é carregamento real na máquina de referência (regra 50, item 1); o prazo de 20 s só o absorve. Virar item do `TODO.md` ou tarefa à parte | `TODO.md`, a cargo do Orquestrador: a Mesa não edita o arquivo e a correção diz que esse custo é de uma tarefa à parte. Tarefa futura que toque `SinoDaCoordenacao` ou o carregamento da área |
| frontend-reviewer (1ª) | A barra lateral a 1366x768 corta o item "PRIVACIDADE" atrás do bloco do usuário e da aparência | Fora do escopo (a correção só muda prazo de asserção de e2e). Tarefa futura que toque a casca da coordenação |
| frontend-reviewer (1ª) | Os nomes "Colégio sintético da vitrine cheia" e "Coordenadora sintética" vêm do dado da vitrine | Recusada: dado sintético da vitrine, não do produto |
| test-engineer (1ª) | Não rodou o e2e; a prova do verde é a registrada no documento e a esteira | Sem ação: a esteira da spec confirma |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-16 19:45:37 | 2026-10-16 19:45:56 | `frontend-reviewer` | 1 | APROVADO | ab3b1daa8a783de0a |
| 2026-10-16 19:45:34 | 2026-10-16 19:46:09 | `test-engineer` | 1 | APROVADO | a66ed84a7d787cb17 |
