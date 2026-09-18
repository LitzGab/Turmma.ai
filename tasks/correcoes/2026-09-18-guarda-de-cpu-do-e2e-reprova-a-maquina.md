# Correção — a guarda de CPU do e2e compara com um número fixo, e reprova a máquina ocupada em vez da configuração

**Origem:** esteira run 35080942567 (commit `c86a25f`, job e2e); antes, run 34988208412 (commit `2e7beac`)
**Subagentes obrigatórios:** `test-engineer`

## Sintoma

`e2e/guardas.spec.ts › o perfil do projeto está aplicado: a rede tem a latência do perfil e a CPU
fica mais lenta` falhou na esteira, no projeto `celular`:

```
Error: expect(received).toBeGreaterThanOrEqual(expected)
Expected: >= 2
Received:    1.3512195121956898
 ❯ e2e/guardas.spec.ts:81:30
```

Já tinha falhado antes com 1,32, e a correção `34da674` trocou a amostra solta pelo menor de cinco.
Não bastou.

## Causa

O teste mede um laço com a limitação de CPU que a fixture aplicou, desliga a limitação, mede de
novo e exige que o primeiro seja pelo menos 2× o segundo (o perfil pede 4×).

A limitação de CPU do Chromium (`Emulation.setCPUThrottlingRate`) não é um atraso fixo: é um
**teto na fatia de CPU** que a aba recebe, de 1/4. Quando o runner está disputado e a aba já
recebe menos que isso, o teto quase não aperta. Com a aba recebendo uma fração `f` de um núcleo,
a razão medida fica perto de `4 × f`. Os 1,35 da esteira correspondem a uma aba com ~1/3 de
núcleo, num runner de 4 vCPU com o compose inteiro e outros navegadores de pé.

Por isso "o menor de cinco" não resolve: a disputa não é um pico que some na amostra, ela afeta
os dois lados da comparação ao mesmo tempo. Com a limitação corretamente aplicada, o teste
reprova a máquina, e não a configuração que ele deveria vigiar.

## Teste que reproduz

O teste antigo, com a limitação aplicada normalmente, rodado com o navegador preso a 4 núcleos e
dois processos concorrentes em cada um (a aba fica com uma fração de núcleo, como no runner):

```
Error: expect(received).toBeGreaterThanOrEqual(expected)
Received:    1.6435480276357233
```

A razão cai abaixo de 2 sem nada errado na fixture. As outras execuções dessa medição estouraram
o tempo antes de chegar à asserção: com a disputa pesada, o laço limitado fica lento demais. É o
mesmo mecanismo levado ao extremo.

## Correção

A comparação deixou de ser com um número fixo e passou a ser com referências medidas na hora, na
mesma máquina e sob a mesma carga:

1. mede-se o estado que a fixture deixou, antes de qualquer outra coisa;
2. a sessão do teste desliga a limitação e mede a aba livre;
3. a sessão do teste aplica a limitação do perfil e mede a aba limitada agora.

O teste exige que o estado da fixture pareça com a aba limitada e não com a livre: que fique acima
da média geométrica das duas. Sem a limitação da fixture, ele fica igual à aba livre e reprova, e
isso não depende da carga, porque a referência limitada sofre a mesma disputa.

Para decidir, a máquina precisa mostrar alguma separação entre limitada e livre (pelo menos 1,5×).
Abaixo disso ela está ocupada demais para medir, o teste diz isso na mensagem, e tenta de novo com
página nova: o teste está num `describe` próprio com `retries: 2`, e é o único do e2e com nova
tentativa. Uma fixture que não aplica a limitação reprova em todas as tentativas.

Uma ressalva que o `test-engineer` apontou, e que ficou escrita no teste: o Playwright repete
qualquer falha, não só a de máquina ocupada, e o teste que passa na segunda tentativa sai como
"flaky", sem ficar vermelho. O que segura isso é o defeito vigiado ser determinístico: a fixture
sem limitação reprovou 3/3 aqui e 30/30 e 16/16 nas medições do revisor, com a máquina livre e
disputada. Cada nova tentativa fica anotada no relatório do Playwright (`nova-tentativa`). Os reporters da
esteira (`list` e `github`) talvez não imprimam anotações; o que a `/retro` enxerga com certeza é a
contagem "flaky" no resumo do `list`.

A verificação da rede não mudou: a latência só aumenta com a carga, e aquela asserção nunca
oscilou.

### Evidência da correção

- **Sem disputa:** o teste novo passou 10/10 (cinco repetições nos dois projetos). A aba limitada
  mede ~51 ms e a livre ~12,7 ms, uma separação de 4×, a do perfil.
- **Com a CPU disputada** (navegador preso a 4 núcleos, um processo concorrente por núcleo, prazo
  de 120 s só para o experimento): passou 4/4, já na primeira tentativa.
- **Mutação, a fixture sem a limitação de CPU:** reprovou nas três tentativas e nos dois projetos,
  com a mensagem que aponta a causa:

  ```
  Error: a página não está com a CPU do perfil (perfil 12.6 ms, livre 12.7 ms, limitado agora 51.3 ms)
  ```

  Sem a limitação, o estado da fixture fica igual ao livre. A guarda continua pegando o defeito
  que ela existe para pegar.
- **E2e inteiro** (`npm run test:e2e`): 32 passaram.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-18 01:24:44 | 2026-09-18 01:53:19 | `test-engineer` | 1 | APROVADO | adad1649a310a454c |
| 2026-09-18 01:53:51 | 2026-09-18 01:54:17 | `test-engineer` | 2 | APROVADO | a763f4fb5dc8cdf44 |
