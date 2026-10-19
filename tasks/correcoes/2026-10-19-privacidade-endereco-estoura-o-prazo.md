# Correção — o caso "o endereço sem aba, e um endereço com aba que não existe…" de `privacidade` estoura os 30 s no celular da esteira

**Origem:** esteira run 39308966590 (job `e2e 7/7`, 30,3 s); nas verdes 39306863687 e 39301124128 levou 27,1–29,6 s
**Subagentes obrigatórios:** `infra-guardian`

## Sintoma

`[celular] › e2e/privacidade.spec.ts:142 › o endereço sem aba, e um endereço com aba que não existe, abrem a aba dos pedidos`, `Test timeout of 30000ms exceeded` (30,3 s) na 39308966590. Nas corridas verdes 39306863687 e 39301124128 o mesmo caso levou 27,1 a 29,6 s. `gh run view <id> --log-failed`.

## Fora desta correção

Nada: nenhum arquivo de tarefa em curso.

## Causa

O caso é lento por construção, e a esteira só mostrou o que a máquina já tinha: isolado, com o ambiente de pé e dois trabalhadores, ele levava 25,8 a 26,0 s no chromebook e 27,9 a 28,0 s no celular, contra os 30 s do runner, que leva perto do dobro. Não é regressão nem defeito do produto. O tempo vai em tudo o que o caso faz **antes** de provar o que prova: a entrada pela tela da coordenadora (primeiro acesso: login, configuração do segundo fator, volta à entrada, segundo login com o código, com argon2 duas vezes e CPU ×4), a espera do Painel, e depois duas cargas frias de página (`page.goto` duas vezes) na rede do perfil, que paga a latência inteira do Fast 3G ou da rede móvel lenta por rodada de pedidos. O que o caso afirma é só para onde dois endereços levam (`/coordenacao/privacidade` e `/coordenacao/privacidade/nao-existe` abrem a aba dos pedidos). Mesma causa da correção `2026-10-19-acesso-suspenso-passa-do-prazo`. Esta falha é do caso `privacidade.spec.ts` (tarefa 13.0, aba Privacidade), não de uma tarefa pendente.

## Teste que reproduz

Não dá para reproduzir de forma determinística: o estouro depende da carga do runner. A evidência que substitui o vermelho é a duração medida: antes, 25,8–26,0 s (chromebook) e 27,9–28,0 s (celular), três execuções por projeto; depois, 16 execuções verdes (8 por projeto, 2 trabalhadores) de 1,9 a 2,4 s (números em "Correção").

## Correção

`e2e/privacidade.spec.ts`, só o caso de `:160` (antes `:142`): a entrada pela tela deu lugar a um ajudante local, `entrarPelaApiComSegundoFator`, que configura o segundo fator pela API (`configurarSegundoFatorPelaApi`, do `segundo-fator.ts`), entra pela API no contexto da página (`POST /v1/sessao/email`, depois `POST /v1/sessao/mfa` com o código do passo seguinte, como a entrada pela tela já fazia) e deixa o cookie de renovação no contexto. As duas cargas frias (`page.goto` seguido da asserção do endereço) rodam em `carregarSemRedeLenta`, que tira a rede do perfil só enquanto a página abre; a CPU ×4 continua. Nenhuma asserção saiu: o endereço sem aba abre `/coordenacao/privacidade/pedidos`, o endereço com aba que não existe também, e a aba Pedidos fica selecionada. Saiu só a espera do Painel (`esperarPainel`), que provava a entrada pela tela, que o caso não afirma e que os outros casos do arquivo ainda fazem (`entrarNaPrivacidade`). O argumento `hasTouch` do caso saiu junto, porque nada nele toca na tela. **Isso não tira cobertura do celular:** o caso continua rodando nos dois projetos (`chromebook` e `celular`, 8 execuções verdes em cada um), e o que ele afirma, para onde dois endereços levam, não depende de toque; o toque na aba Privacidade segue coberto pelos outros casos do arquivo, que passam `hasTouch`.

Medido depois: 1,9 a 2,4 s nos dois projetos, 16 execuções verdes.

## Mutações

```mutacao
arquivo: apps/web/src/areas/coordenacao/rotas.tsx
teste: e2e/privacidade.spec.ts › o endereço sem aba, e um endereço com aba que não existe, abrem a aba dos pedidos
         <Route path={ROTAS_DA_COORDENACAO.privacidade}>
-          <Redirect to={ROTAS_DA_COORDENACAO.pedidos} replace />
+          <Redirect to={ROTAS_DA_COORDENACAO.agentes} replace />
         </Route>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
teste: e2e/privacidade.spec.ts › o endereço sem aba, e um endereço com aba que não existe, abrem a aba dos pedidos
-  if (!ehTelaDoSeletorDaPrivacidade(aba)) return <Redirect to={ROTAS_DA_COORDENACAO.pedidos} replace />
+  if (!ehTelaDoSeletorDaPrivacidade(aba)) return <Redirect to={ROTAS_DA_COORDENACAO.agentes} replace />
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 18:35:59 | 2026-10-19 18:36:20 | `infra-guardian` | 1 | APROVADO | a0a0a2d72bdc2edf1 |
| 2026-10-19 18:36:00 | 2026-10-19 18:36:57 | `test-engineer` | 1 | APROVADO | a193e91f945c6c450 |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) e test-engineer (1ª) | `entrarPelaApiComSegundoFator` (`e2e/privacidade.spec.ts:72`) repete `entrarPelaApi` (`casca.ts`) e `segundo-fator.ts`; levá-lo para o fixture em vez de uma segunda cópia local | Não aplicar, com destino: a próxima correção de e2e lento que precise do mesmo atalho (a `2026-10-19-acesso-suspenso-passa-do-prazo` teve a mesma causa) leva o ajudante para `e2e/__fixtures__/casca.ts` ou `segundo-fator.ts`. Mover agora mexe em fixture compartilhada que esta correção não toca e caduca `test-engineer` e `revisor-geral` |
| infra-guardian (1ª) | Comentário no ajudante dizendo de qual tolerância do servidor o código do passo seguinte depende (`JANELA_TOTP = 1`) | Recusada: o revisor a condiciona a o ajudante ir para o fixture, e ele fica onde está; o mesmo padrão já existe sem comentário em `painel-da-coordenacao`, `roteiro-da-demonstracao` e `sino-da-coordenacao` |
| test-engineer (1ª) | Os outros casos do mesmo arquivo (`entrarNaPrivacidade`, "os estados", "a troca de escola", o ajudante das empresas) pagam a mesma entrada pela tela com CPU ×4; medir na esteira antes de estourarem. Os dois "segunda pessoa na mesma aba" ficam como estão, porque afirmam algo sobre o cache da aba | Não aplicar: o revisor pede medir, não mudar. Cada caso que estourar na esteira vira correção própria, pelo mesmo caminho desta |
