# Correção — a nota do teste de redação de log colide com o carimbo de hora, e reprova 1% das execuções

**Origem:** achado durante a correção `2026-09-21-log-da-falha-sem-carimbo-de-hora`, no portão dela
**Subagentes obrigatórios:** `privacy-guardian` (é o teste que guarda a regra 20 no log)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`packages/nucleo/src/log/logger.test.ts` › "remove nome de aluno aninhado, nota aninhada e
authorization, mantendo os ids" falhou no portão, em 11 ms:

```
AssertionError: expected '{"level":"info","time":"2026-09-22T01…' not to contain '7.5'

+ {"level":"info","time":"2026-09-22T01:45:37.569Z","servico":"teste",
+  "aluno":{"id":"a1","nome":"[removido]","matricula":"[removido]"},
+  "correcao":{"avaliacaoId":"v1","nota":"[removido]","resposta":"[removido]"},
+  "authorization":"[removido]"}
```

**A redação está correta.** Todo campo pessoal saiu como `[removido]`: nome, matrícula, nota, resposta,
authorization. O teste não pegou nenhuma falha de privacidade — ele falhou por outro motivo.

## Causa

O teste loga `nota: 7.5` e depois afirma `expect(bruto).not.toContain('7.5')` sobre a **linha crua**,
que inclui o carimbo de hora com milissegundos (`timestamp: stdTimeFunctions.isoTime`,
`packages/nucleo/src/log/logger.ts:170`).

O único `7.5` daquela linha está **dentro do carimbo**: `"time":"2026-09-22T01:45:37.569Z"` —
`37.569` contém a substring `7.5`.

O ponto só aparece entre segundos e milissegundos, então a colisão exige segundo terminando em `7`
e milissegundo começando em `5`: 1/10 × 1/10. Medido sobre um milhão de instantes sorteados:

```
'7.5'  casa no carimbo em 1,00% das execuções
nenhum outro valor da lista de :48 colide
```

O `test-engineer` reproduziu de forma determinística fixando o relógio no instante que falhou, e
mediu 1,009% de forma independente. Ele também varreu o repositório pela mesma classe (negativa sobre
texto que carrega carimbo) e este é **o único caso real**: `procurados` em
`sessao-externa.int.test.ts:381`, `sentinela` em `borda.int.test.ts:518` e `'(8)'` em
`estrutura.int.test.ts:152` são longos demais ou não passam por linha de log.

**Por que 1% importa mais do que parece.** O teste roda no projeto `unidade`, ou seja, em todo portão
local e em todo push da esteira. E ele falha *parecendo* que a redação de dado pessoal quebrou — um
vermelho que grita regra 20 sem motivo. Enquanto ele existe, vermelho na suíte deixou de significar
uma coisa só, e a regra 40 depende exatamente disso.

## Teste que reproduz

O próprio caso, com o relógio fixado no instante colidente (`2026-09-22T01:45:37.569Z`). Vermelho
antes: sem o conserto, a asserção falha **em toda execução**, não em 1% — o que é justamente o que se
quer de um caso de regressão.

## Correção

Três coisas, e a ordem entre elas é o que faz a correção não enfraquecer o teste:

1. **Tirar o carimbo da conta da asserção, sem tirar o escopo da linha inteira.** A negativa sobre a
   linha crua é mais forte de propósito: ela pega o valor vazando em **qualquer** chave, inclusive uma
   que o `toMatchObject` não enumera ("a nota reapareceu em `msg`"). Mover a asserção para o campo,
   que foi a minha primeira ideia, a transformaria em duplicata do `toMatchObject` — o
   `test-engineer` recusou, com razão. O conserto substitui só o **valor de `time`** antes do `join`.
2. **Fixar o relógio no instante colidente.** Sem isso a correção "funciona" e o defeito desaparece
   sem deixar rastro; com isso, remover o conserto do item 1 fica vermelho em 100% das execuções.
3. **Afirmar que o carimbo continua no registro.** Sem esta asserção, o item 1 passaria a esconder o
   `time` desaparecendo do log — trocar um defeito por outro, mais silencioso.

**O que foi recusado, e por quê.** "Escolher um valor que não colida" é frágil e é adivinhação: o
`test-engineer` mediu que `7.55` cai para 1/1.000 mas não a zero, e que **`10.5` continua colidindo**
(`...T01:45:10.569Z`). Só forma impossível, como segundo `77`, escaparia de verdade — e ninguém
reler esse raciocínio em seis meses.

## Evidência

**O defeito, isolado.** A linha que falhou não tem dado pessoal nenhum — tudo `[removido]`. O único
`7.5` está em `"time":"2026-09-22T01:45:37.569Z"`, dentro de `37.569`.

**A frequência, medida** sobre um milhão de instantes sorteados no formato do `isoTime`:

```
'7.5'  casa no carimbo em 1,00% das execuções
'Enzo Martins', '2026001', 'letra C', 'segredo-sintetico'  →  nunca casam
```

O `test-engineer` mediu 1,009% de forma independente e reproduziu fixando o relógio.

**Vermelho antes, verde depois** — e o ponto é a *frequência*, não só o sinal:

| `logger.test.ts` | 3 execuções |
|---|---|
| relógio fixo, asserção sobre a linha crua (o defeito, agora determinístico) | ❌ ❌ ❌ — 1 de 53 falha, sempre |
| relógio fixo, asserção sobre a linha com o carimbo substituído (como ficou) | ✅ ✅ ✅ — 53 de 53 |

Antes desta correção o defeito aparecia em 1% das execuções; com o relógio fixado no instante
colidente ele aparece em 100%. **Essa é a correção**: quem apagar o `semCarimbo()` descobre pelo
vermelho, e não por uma reprovação aleatória seis meses depois.

**O que o teste continua provando, e é o que importa:** a negativa segue sendo sobre a **linha
inteira**, não sobre o campo. Se a nota, o nome ou o token vazarem para qualquer outra chave — `msg`,
uma chave nova, um erro serializado —, o caso fica vermelho. Só o valor de `time` sai da conta. E há
asserção de que o carimbo continua lá, **com o valor exato do instante fixado** (o que prova de quebra
que o relógio falso pegou), e de que a linha crua **realmente contém** o `7.5` nesta execução, o que
prova que a substituição não é atalho para passar.

**O resíduo que a revisão achou, e que a versão inicial tinha.** A substituição usava `/g`, então
apagaria **qualquer** chave `time`, não só o carimbo do pino — e `time` não está em `CHAVES_PESSOAIS`
nem em `CHAVES_DE_IDENTIDADE`, ou seja, o redact não a cobre e a asserção ficaria cega para ela. É
exatamente o tipo de enfraquecimento silencioso que eu temia ao mexer numa asserção de privacidade, e
que motivou perguntar em vez de confiar no meu raciocínio.

Conserto de um caractere: sem `/g`, `replace` troca só a **primeira** ocorrência, que é sempre o
carimbo do pino (ele escreve `level` e depois `time`). Medido com o logger real:

```
payload { time: 'Enzo Martins', outro: { time: 'Enzo Martins' } }
  com /g → 'Enzo Martins' desaparece da linha   ← a asserção ficaria cega
  sem /g → 'Enzo Martins' permanece             ← a asserção continua pegando
```

O revisor também mediu o vetor que mais preocupava — valor **imitando** o carimbo,
`{ msg: 'a"time":"Enzo Martins' }` — e ele não escapa nas duas versões, porque o pino escapa as aspas
(`\"time\":\"`) e a regex exige `"time":` sem escape. E conferiu o que eu não havia testado: o mesmo
vale para **chave** imitando o carimbo, porque `JSON.stringify` escapa aspas em chave também.

**A asserção que parece redundante e não é.** Ao aplicar a recomendação de trocar `toMatch(CARIMBO_ISO)`
por `toBe(INSTANTE_COLIDENTE)`, notei que deixei de afirmar o **formato** do carimbo em qualquer lugar,
e perguntei. A resposta, medida pelo `test-engineer` por execução na rodada 3: trocando `isoTime` por
`epochTime`, **as duas** asserções ficam vermelhas — mas o `toBe` volta ao verde se alguém atualizar o
`INSTANTE_COLIDENTE` para o número, e a do `7.5` não volta, porque epoch em ms é inteiro e `JSON.stringify`
não escreve ponto:

```
{"level":"info","time":1790045905729,...}
linha crua contém '7.5'?  false   ← a asserção fica vermelha
```

Sem o ponto entre segundo e milissegundo, o `7.5` desaparece da linha — e fica vermelho **mesmo que
alguém atualize o `INSTANTE_COLIDENTE` junto**. O único jeito de silenciar a troca de formato é apagar
essa asserção, que por isso ganhou comentário dizendo para não apagá-la por parecer redundante.
Acrescentar um regex de forma seria mais fraco do que ela.

**Ordem dos `afterEach`, medida pelo `test-engineer` na rodada 3** (Vitest 5.0.0, três sondas
executadas, não leitura de código — a atribuição importa porque comportamento de ferramenta escrito a
partir de medição de terceiro foi o vício que a correção anterior registrou):

```
pai/filho:               [... "afterEach-interno", "afterEach-arquivo"]   ← o de arquivo é o último
hook interno que lança:  ["corpo", "afterEach-interno-lanca"]             ← o de arquivo NÃO roda
corpo do caso falha:     ["afterEach-arquivo"]                            ← roda mesmo com vermelho
e o vazamento é real:    caso seguinte lê new Date() → 2026-09-22T01:45:37.569Z
```

A terceira e a quarta linhas são o que importa: com um `afterEach` interno que lance, o relógio falso
**chega ao caso seguinte**. Não existe `afterEach` interno neste arquivo hoje; ficou escrito no
comentário para quem acrescentar um.

**Frequência, medida três vezes por duas partes** — por mim (1,00%) e pelo `test-engineer` em duas
rodadas independentes (1,009% e 0,985%), sempre sobre um milhão de instantes. Os valores recusados
continuam colidindo: `7.55` em 0,095%, `10.5` em 0,171%.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-21 23:43:22 | 2026-09-21 23:48:23 | `test-engineer` | 1 | APROVADO | a0cede1e42d34adb9 |
| 2026-09-21 23:57:02 | 2026-09-22 00:01:08 | `test-engineer` | 2 | APROVADO | ac586def59f612fa4 |
| 2026-09-22 00:09:01 | 2026-09-22 00:12:36 | `test-engineer` | 3 | APROVADO | ab26b88f2524abcab |
| 2026-09-22 00:20:26 | 2026-09-22 00:22:02 | `test-engineer` | 4 | APROVADO | afdd265b3bd8d4a54 |
| 2026-09-22 00:22:38 | 2026-09-22 00:25:54 | `privacy-guardian` | 1 | APROVADO | afe2d36bf6ba00c13 |
