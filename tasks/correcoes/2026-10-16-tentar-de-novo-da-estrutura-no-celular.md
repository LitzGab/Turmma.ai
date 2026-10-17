# Correção — o sino da coordenação, que chega depois da tela, relê sozinho o que a tela mostrou em erro, e o "Tentar de novo" some antes do toque

**Origem:** esteira run 38966083912 (sobre `b95722d`), job `e2e 4/6`: `e2e/estrutura.spec.ts:294`, só no projeto `celular`.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador (frontend-reviewer). test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`depois da virada, só o ano planejado se abre, … e "Tentar de novo" traz a estrutura` estoura os 90 s do `test.slow()` em
`e2e/estrutura.spec.ts:333` (`acionar(principal(page).getByRole('button', { name: 'Tentar de novo' }), hasTouch)`):

```
Error: locator.tap: Test timeout of 90000ms exceeded.
  - waiting for getByRole('main').getByRole('button', { name: 'Tentar de novo' })
```

A asserção do alerta, 5 linhas antes, passou: a tela chegou a mostrar o erro. O botão deixou de existir depois disso. Na
`develop` em `2029703` (sem o sino) o mesmo caso leva 41,8 s no celular; local, 38 s. Não é lentidão: é a tela que sai do erro
sozinha.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

`e2e/professores.spec.ts:220` (`celular`, esteiras 38975731581 e 38977792982, "Tentar de novo" dos quatro estados de Professores)
**tem esta mesma causa e esta mesma correção**: o mesmo passo (`reload` com a leitura caindo, alerta, `falhar = false`, toque),
e a consulta é `professores`, um dos seis observadores do sino (mutação 4 e o segundo teste). Verde contra a correção.

A outra queda da 1.0 (`e2e/privacidade.spec.ts:298`, "a aba some depois do reload") **não tem esta causa**: o caso não tem erro
nem releitura; a asserção da linha 307 espera a aba com o prazo padrão de 5 s, sem `PRAZO_DA_ENTRADA_MS`, logo depois de um
`reload` no celular com CPU ×4. Nada dela foi tocado aqui.

## Causa

Da tarefa **1.0** (`694f9d4`, o sino). `SinoDaCoordenacao` é `lazy()` e monta **depois** da tela. Os seis observadores da
fila (`useFilaDaCoordenacao`) compartilham a chave de `anos-letivos` com a Estrutura, e o TanStack, por padrão, **relê na
montagem de um observador a consulta que já está em erro** (`retryOnMount: true`). `SEM_LEITURA_SOZINHA` desliga o tempo, o
foco e a rede, mas não a montagem. No teste: a leitura dos anos cai (503), a tela mostra o alerta e o botão, o teste liga a
rede (`falhar = false`), e o sino chega nesse intervalo: relê os anos, que agora respondem, e a Estrutura sai do erro. O botão
não existe mais quando o toque o procura. No celular a rede lenta e a CPU ×4 abrem a janela; no desktop o sino chega antes.

Reproduzido com um spec temporário (já apagado) que segura o chunk `tela-coordenacao-SinoDaCoordenacao-*.js` até depois da
falha e da volta da rede: vermelho com a mesma mensagem da esteira (`waiting for getByRole('main').getByRole('button', { name:
'Tentar de novo' })`, elemento não encontrado); sem segurar o chunk, o mesmo caso passa (38 s).

## Teste que reproduz

`apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx`, no bloco "o sino não relê sozinho (RF5)":

- `o sino que monta depois de a tela já ter a leitura dos anos em erro não a relê: o "Tentar de novo" da tela continua de pé até o toque`:
  vermelho antes (`expected [ '/v1/anos-letivos', …(2) ] to have a length of 2 but got 3`), verde depois.
- `o sino que monta depois de a tela já ter em erro as outras cinco leituras (incidentes, professores, materiais, turmas e vínculos) não relê nenhuma`:
  cobre os outros cinco observadores, um a um, pelas mutações abaixo.

## Correção

`apps/web/src/areas/coordenacao/fila-da-coordenacao.ts`: os seis observadores da fila passam a usar `LEITURA_DA_FILA`
(`SEM_LEITURA_SOZINHA` + `retryOnMount: false`). `retryOnMount` só vale para a consulta que **já está em erro** quando o
observador monta: a que ainda não existe carrega normalmente, e quem relê o que falhou é o "Tentar de novo" (da tela ou do
sino). `SEM_LEITURA_SOZINHA` não muda, porque o Painel o usa nos observadores próprios dele. Nenhum arquivo de tela mudou.

## Mutações

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › o sino que monta depois de a tela já ter a leitura dos anos em erro não a relê
-const LEITURA_DA_FILA = { ...SEM_LEITURA_SOZINHA, retryOnMount: false } as const
+const LEITURA_DA_FILA = { ...SEM_LEITURA_SOZINHA } as const
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › o sino que monta depois de a tela já ter a leitura dos anos em erro não a relê
-  const anos = useQuery({ ...consultaAnosLetivos, ...LEITURA_DA_FILA })
+  const anos = useQuery({ ...consultaAnosLetivos, ...SEM_LEITURA_SOZINHA })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › o sino que monta depois de a tela já ter em erro as outras cinco leituras
-  const incidentes = useQuery({ ...consultaIncidentes, ...LEITURA_DA_FILA, staleTime: Infinity })
+  const incidentes = useQuery({ ...consultaIncidentes, ...SEM_LEITURA_SOZINHA, staleTime: Infinity })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › o sino que monta depois de a tela já ter em erro as outras cinco leituras
-  const professores = useQuery({ ...consultaProfessores, ...LEITURA_DA_FILA })
+  const professores = useQuery({ ...consultaProfessores, ...SEM_LEITURA_SOZINHA })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › o sino que monta depois de a tela já ter em erro as outras cinco leituras
-  const materiais = useQuery({ ...consultaMateriais, ...LEITURA_DA_FILA })
+  const materiais = useQuery({ ...consultaMateriais, ...SEM_LEITURA_SOZINHA })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › o sino que monta depois de a tela já ter em erro as outras cinco leituras
-  const turmas = useQuery({ ...consultaTurmas, ...LEITURA_DA_FILA, enabled: aplicaAoAno })
+  const turmas = useQuery({ ...consultaTurmas, ...SEM_LEITURA_SOZINHA, enabled: aplicaAoAno })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › o sino que monta depois de a tela já ter em erro as outras cinco leituras
-  const vinculos = useQuery({ ...consultaVinculos, ...LEITURA_DA_FILA, enabled: aplicaAoAno })
+  const vinculos = useQuery({ ...consultaVinculos, ...SEM_LEITURA_SOZINHA, enabled: aplicaAoAno })
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Rodar de novo o caso de origem, `e2e/estrutura.spec.ts:294` no projeto `celular`, depois da correção | A esteira do push desta correção roda o e2e; o Orquestrador lê o veredito ao fechar a tarefa seguinte (`tools/processo/esteira.ts`). Não é código a aplicar. Rodei os dois casos do celular (`estrutura.spec.ts:294` e `professores.spec.ts:220`) contra a correção: verdes, 40 s |
| test-engineer (1ª) | O Painel usa `SEM_LEITURA_SOZINHA` com a releitura na montagem ainda ligada; confirmar que nenhum observador do Painel monta tarde sobre consulta em erro aberta por outra tela | Fora desta correção (muda comportamento do Painel, arquivo que a correção não toca): `/retro` da spec, e `TODO.md` se o Orquestrador quiser antes |
| frontend-reviewer (1ª) | A foto do Painel (`/coordenacao`) mostrou "Página não encontrada": a rota só vira raiz na tarefa 3.0 (`caminhos.ts:174`); fotografar o Painel cheio e vazio, e confirmar que a escola nova recebe convite e próximo passo | Tarefa 3.0 da spec (`telas-da-coordenacao`): fotografar o Painel de verdade quando a rota existir |
| frontend-reviewer (1ª) | Na foto do computador, o menu lateral corta o item "Privacidade" na altura do rodapé; conferir se é a rolagem interna intencional | Validação da spec (o Validador fotografa cada requisito com tela) |
| test-engineer (2ª) | `SinoDaCoordenacao.test.tsx:329`: o teste irmão, o das cinco leituras, ainda espera só `/^Esperando você/`; afirmar `'Esperando você, parte não carregou'` antes e depois do `avancar`, igual ao dos anos | Recusada: o próprio revisor diz que a contagem por caminho com `leiturasDe()` já prova a regra e que é só para igualar os dois testes. Em rodada de aprovação, recomendação de quem aprovou não abre outro ciclo; quem tocar esse teste numa tarefa futura da spec pode igualar |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-16 22:16:20 | 2026-10-16 22:16:42 | `frontend-reviewer` | 1 | APROVADO | acccf581897b59e81 |
| 2026-10-16 22:16:23 | 2026-10-16 22:17:17 | `test-engineer` | 1 | APROVADO | aaaa261c7756ca722 |
| 2026-10-16 22:21:00 | 2026-10-16 22:21:30 | `test-engineer` | 2 | APROVADO | a4d0f1e52b8df084d |
