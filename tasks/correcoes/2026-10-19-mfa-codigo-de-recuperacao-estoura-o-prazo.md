# Correção — o caso do e2e do código de recuperação do segundo fator configura pela tela, entra duas vezes e passa dos 30 s da esteira

**Origem:** esteira run 39186346916, em `143f000` (job e2e 5/6): `e2e/mfa.spec.ts:85` `[celular]`, `código de recuperação entra sem o aplicativo, e o mesmo código não passa de novo`, `Test timeout of 30000ms exceeded`. Nas verdes o caso levava de 25 a 28 s (39169496367, 39150054306).
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `infra-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. `revisor-geral` marcado a pedido dele; a correção altera 2 arquivos fora de `tasks/`. -->

## Sintoma

O caso configurava o segundo fator **pela tela** (`configurarSegundoFator`: a entrada, a tela de configuração e a ativação), entrava
com o código de recuperação e esperava o painel, saía, entrava de novo para provar que o mesmo código não passa, e ainda entrava com
o segundo. Medido aqui, um worker entre seis: 25,6 s no `chromebook` e 28,2 s no `celular`; o runner da esteira leva perto do dobro
e o caso passou do prazo de 30 s sem nada de errado no produto.

## Fora desta correção

Nada: a árvore estava limpa ao receber o pedido.

## Causa

Falta de folga de tempo, e não de comportamento: o caso juntava a **configuração pela tela** (uns 8 s, três cargas de página), duas
entradas pela tela, duas cargas do painel e a saída. A configuração pela tela é o que o primeiro caso do arquivo prova; aqui ela só
prepara a conta. É o mesmo desenho da correção `2026-10-18-professor-em-area-alheia-estoura-o-prazo` (43067f8). O caso foi escrito
na 6.0 do F1 e não se alterou depois; a oscilação da esteira é a de uma máquina carregada com os seis projetos em paralelo.

## Teste que reproduz

O próprio caso antigo, medido: 25,6 s (`chromebook`) e 28,2 s (`celular`), no limite do prazo de 30 s e acima dos 15 s do portão. Não
dá para reproduzir o estouro de forma determinística (ele depende da carga do runner); a evidência é a medida. O depois, medido nas
mesmas condições (os oito casos do arquivo juntos, seis workers): `código de recuperação entra sem o aplicativo` em 10,8 s
(`chromebook`) e 11,8 s (`celular`); `o código de recuperação já usado não passa de novo, e um ainda não usado entra` em 11,6 s e 12,3 s.

## Correção

Só teste, em `e2e/mfa.spec.ts` e `e2e/__fixtures__/segundo-fator.ts`; o código da API e o da web não mudam.

- **Fixtures novas** `configurarSegundoFatorPelaApi` e `gastarCodigoDeRecuperacaoPelaApi`, sobre um auxiliar de entrada pela API: entra com a senha pela API (`POST /v1/sessao/email`),
  configura e ativa o segundo fator com o desafio (`/v1/conta/mfa/configurar` e `/ativar`) e devolve o segredo e os códigos de
  recuperação. Usa o contexto de requisição do Playwright, à parte da aba: nenhum cookie vai para ela.
- **O caso único virou dois:** `código de recuperação entra sem o aplicativo` (a entrada pela tela com o primeiro código até o painel) e
  `o código de recuperação já usado não passa de novo, e um ainda não usado entra`.

| Asserção do caso original | Onde está agora |
|---|---|
| a tela do código aceita o código de recuperação e a coordenação chega ao painel | primeiro caso |
| o código já usado volta o alerta de `NAO_AUTENTICADO` e a URL continua em `/mfa` | segundo caso |
| um código ainda não usado entra | segundo caso |

O que muda, e é dito aqui: no segundo caso o primeiro código é **gasto pela API** (`POST /v1/sessao/mfa` com o desafio do login), e não
pela entrada na tela seguida do clique em "Sair". A regra provada é a do código de uso único (RF12), que mora no repository; a entrada
pela tela com um código de recuperação continua provada no primeiro caso, e "Sair" é provado em outros casos. A configuração pela tela
continua provada no primeiro caso do arquivo e no dos cinco códigos errados.

## Mutações

O uso único do código de recuperação é a cláusula `usado_em is null` do repository: sem ela o código gasto passa de novo e o segundo
caso reprova. A entrada com o código de recuperação passa por `#fatorConfere`: sem ela, o primeiro caso reprova.

```mutacao
arquivo: apps/api/src/sessao/resolucao-de-tenant.repository.ts
teste: e2e/mfa.spec.ts › o código de recuperação já usado não passa de novo, e um ainda não usado entra
-      .where(and(eq(codigoRecuperacao.contaId, contaId), eq(codigoRecuperacao.hmac, hmac), isNull(codigoRecuperacao.usadoEm)))
+      .where(and(eq(codigoRecuperacao.contaId, contaId), eq(codigoRecuperacao.hmac, hmac)))
```

```mutacao
arquivo: apps/api/src/sessao/mfa.service.ts
teste: e2e/mfa.spec.ts › código de recuperação entra sem o aplicativo
-    return codigo !== undefined && (await this.dependencias.resolucao.usarCodigoDeRecuperacao(conta.id, hmacDaRecuperacao(this.dependencias.chaveRecuperacao, codigo)))
+    return false
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | `PRAZO_DA_ENTRADA_MS` definido duas vezes, em `e2e/mfa.spec.ts:9` e em `e2e/__fixtures__/segundo-fator.ts:10`: "Exportar da fixture evitaria que os dois valores se separem." | `TODO.md`. Já era assim antes da correção, e a mesma constante de 20_000 está também em `e2e/__fixtures__/casca.ts:116` e `e2e/__fixtures__/tela-da-operacao.ts:6`: juntar as quatro é limpeza que toca arquivos fora da correção |
| infra-guardian (1ª) | "A confirmação definitiva é o job e2e 5/6 da esteira no `celular`. Vale conferir esse job antes de fechar a spec." | Orquestrador: lê o veredito da esteira ao fechar a tarefa seguinte; a spec só fecha com ela verde (regra 40) |
| test-engineer (1ª) | A troca (o primeiro código gasto pela API, e não pela tela seguida de "Sair") "só fica registrada para o `/validar`." | Já declarada em "Correção" do documento; sem ação |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 03:54:11 | 2026-10-19 03:54:44 | `infra-guardian` | 1 | APROVADO | af7c6f50b882c8e2f |
| 2026-10-19 03:54:10 | 2026-10-19 03:55:09 | `revisor-geral` | 1 | APROVADO | aa1d7b727daebd593 |
| 2026-10-19 03:54:09 | 2026-10-19 03:55:36 | `test-engineer` | 1 | APROVADO | a3f195727fde896e5 |
| 2026-10-19 04:09:03 | 2026-10-19 04:09:30 | `test-engineer` | 2 | APROVADO | a69b1130882810bc5 |
| 2026-10-19 04:09:06 | 2026-10-19 04:09:33 | `revisor-geral` | 2 | APROVADO | a01569a6d21cc1e64 |
