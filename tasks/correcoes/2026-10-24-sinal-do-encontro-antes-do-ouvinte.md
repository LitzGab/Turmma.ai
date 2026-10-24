# Correção — o encontro que recebe SIGINT, SIGTERM ou SIGHUP logo depois de a verificação nascer morre sem matar o grupo

**Origem:** esteira run 40113432287 (job `verificar`, unidade): `tools/processo/linhas.test.ts › o encontro que recebe SIGHUP mata o grupo, volta a linha e sai com o código da verificação` estourou os 30000 ms (30043 ms); passou na `develop` em `6adad87`. Teste intermitente.
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `infra-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. O `revisor-geral` entra porque a correção toca `tools/processo/` (passo 5 de `corrigir`). -->

## Sintoma

O caso de sinal do encontro leva cerca de 1 s e, de vez em quando, passa dos 30 s do `describe` e cai por "Test timed out". Na esteira foi o SIGHUP; sob
carga na máquina local (12 execuções ao mesmo tempo, presas a 2 núcleos) caíram também o SIGTERM e o SIGINT: **4 falhas em 48 execuções** do arquivo
(`-t "recebe SIG"`), todas com 30 s, enquanto as outras terminavam o arquivo inteiro em cerca de 7 s. Não é lentidão: é espera sem fim.

## Fora desta correção

Nada: a árvore estava limpa. A M4 da retro da X7 já está feita e commitada nesta branch (`b1011e94`, `2e216780`); esta correção não mexe nela.

## Causa

Corrida entre o `spawn` e o ouvinte de sinal, em `rodarEmGrupo` (`tools/processo/linhas.ts`). Os ouvintes de SIGINT, SIGTERM e SIGHUP subiam **depois** do
`spawn` da verificação. O filho roda em outro processo e, em poucos ms, o neto já escreveu o `neto.pid`, que é o que o teste espera para mandar o
sinal. Se o processo do encontro é tirado da CPU entre o `spawn` e o `process.on` (ou o teste enxerga o arquivo antes de ele voltar), o sinal chega sem ouvinte
e o Node morre pela ação padrão do sinal: o grupo da verificação fica vivo, o merge não é desfeito e nada é impresso.

Evidência, de um teste instrumentado (cópia temporária, já apagada) que despejava a árvore de processos 12 s depois do sinal, nas três travadas:

- o processo do encontro já não existia (`/proc/<pid>` sumido) e o texto parcial não tinha `VERIFICAÇÃO RECUSADA`;
- o neto (`trap "" TERM`) continuava vivo, segurando o stderr do encontro; por isso o evento `close` não disparava e o teste esperava até os 30 s.

No produto o risco é o mesmo, só que raro: um Ctrl-C ou `kill` no encontro nessa janela deixa a linha com o merge feito e a verificação rodando solta.

## Teste que reproduz

`tools/processo/linhas-sinal.test.ts › rodarEmGrupo: o sinal de fim que chega logo depois de a verificação nascer › os ouvintes de SIGINT, SIGTERM e SIGHUP já estão de pé quando o filho nasce, e saem quando ele acaba`.
Um espião na frente do `spawn` de verdade anota quantos ouvintes de cada sinal o processo tem quando o filho nasce. **Vermelho antes** (`expected [[0,0,0]] to deeply equal [[1,1,1]]`),
verde depois. A janela em si é de microssegundos e só o sistema operacional a abre, então o que se prova de forma determinística é a ordem; a prova do efeito é a estabilidade abaixo.

## Correção

- `tools/processo/linhas.ts`: em `rodarEmGrupo`, a promessa que sobe os ouvintes (e o relógio do prazo) passa para **antes** do `spawn`; a função agora é exportada para o teste chamá-la.
  O `spawn` e o `await` da corrida ficam num `try/finally` que desliga relógio e ouvintes (rodada 1, item 1): com os ouvintes subindo antes, um `spawn` que lançasse os deixaria
  presos, engolindo o Ctrl-C do encontro, e o relógio o seguraria vivo até o fim do prazo. O `matarGrupo` continua depois do desligar, como antes.
- `tools/processo/linhas-sinal.test.ts`: três casos. A ordem (acima); o efeito, com `process.emit('SIGHUP')` no instante em que o `spawn` volta, que dá `'interrompida'` e não
  `'passou'` (rodada 1, item 3; `process.emit` e não `process.kill`, porque no código quebrado o sinal de verdade derrubaria o worker do Vitest); e o `spawn` que lança
  (rodada 1, item 1), que não deixa ouvinte nem relógio (`vi.getTimerCount()` é 0 com o relógio falso). Os números dos comentários saíram: a contagem fica neste documento (item 2).

## Estabilidade

Mesma carga que reproduziu (12 execuções do arquivo ao mesmo tempo, presas a 2 núcleos, `-t "recebe SIG"`):

- antes: 4 falhas em 48 execuções;
- depois: **0 falhas em 72 execuções** (dois lotes de 36), e **0 em mais 36** com o `try/finally` da rodada 1, que é o código final.

O teste de sinal rodado sozinho dez vezes seguidas, sem carga (os três casos de sinal do `linhas.test.ts` e o caso novo): **10 de 10 verdes**.

## Mutações

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas-sinal.test.ts › os ouvintes de SIGINT, SIGTERM e SIGHUP já estão de pé
-      process.on(sinal, aoSinal)
+      setImmediate(() => process.on(sinal, aoSinal))
```

O mesmo defeito (o ouvinte só sobe depois de o `spawn` voltar), visto pelo efeito: o `SIGHUP` emitido no instante em que o `spawn` volta não tem quem o ouça, e a verificação segue até o fim.

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas-sinal.test.ts › o SIGHUP que chega no instante em que o spawn volta é ouvido
-      process.on(sinal, aoSinal)
+      setImmediate(() => process.on(sinal, aoSinal))
```

O que o `finally` fecha: o desligar volta a rodar só depois do `await`, como antes da correção.

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas-sinal.test.ts › o spawn que lança não deixa ouvinte de sinal nem relógio para trás
-  } finally {
-    for (const fechar of desligar) fechar()
-  }
+  } finally {
+  }
+  for (const fechar of desligar) fechar()
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Mutação: "tirar o `desligar.push(() => process.off(...))`, que a linha 33 já pegaria" | Recusada: o próprio revisor diz que a asserção que já existe a pega; um bloco a mais seria repetição |
| revisor-geral (2ª) | Tirar o `const nascido = filho` e o `let filho: ChildProcess`, guardando só o `pid` fora do `try` | Recusada: é só forma. O `const nascido` existe para o tipo fechar nos closures, e mexer em `linhas.ts` caducaria os três revisores por nada |
| revisor-geral (2ª) | Acrescentar ao texto da 3ª mutação "e não roda quando o `spawn` lança" | Recusada: o bloco de mutação é o diff e o teste que o pega; o caso 3 já diz isso |
| test-engineer (2ª) | `it.each` com SIGINT, SIGTERM e SIGHUP no caso de efeito | Recusada: os três ouvintes saem do mesmo laço, e o caso 1 prova que os três estão de pé antes do `spawn`; o efeito de um prova o do laço |
| test-engineer (2ª) | Afirmar que `matarGrupo` não é chamado quando o `spawn` lança | Recusada: a exceção sobe antes de `filho.pid`, não há filho para matar; o próprio revisor a chama de baixo risco |

A mutação que o test-engineer sugeriu para o item 3 ("subir o `spawn` de volta para antes da promessa `interrompido`") foi trocada pela de uma linha acima (`setImmediate`),
que quebra a mesma coisa (o ouvinte depois do `spawn`) sem um bloco de 15 linhas que o portão teria de casar de novo a cada edição do trecho.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 15:04:12 | 2026-10-24 15:04:37 | `revisor-geral` | 1 | APROVADO | a32453d8edf963fd6 |
| 2026-10-24 15:04:13 | 2026-10-24 15:04:41 | `infra-guardian` | 1 | APROVADO | ad7fc61031102a198 |
| 2026-10-24 15:04:11 | 2026-10-24 15:04:58 | `test-engineer` | 1 | APROVADO | a6e5b49cf1343ed1b |
| 2026-10-24 15:15:23 | 2026-10-24 15:15:44 | `revisor-geral` | 2 | APROVADO | a0cc90ee7556a610e |
| 2026-10-24 15:15:26 | 2026-10-24 15:15:50 | `infra-guardian` | 2 | APROVADO | a4e2781aef36c0b7b |
| 2026-10-24 15:15:19 | 2026-10-24 15:15:54 | `test-engineer` | 2 | APROVADO | a1fe33f5041e4e971 |
