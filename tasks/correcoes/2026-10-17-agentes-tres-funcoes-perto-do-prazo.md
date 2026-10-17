# Correção — o caso "três funções no Assistente…" (`agentes.spec.ts:186`) é o único do arquivo sem `test.slow()` e leva 25,5 s no celular da esteira, contra o limite de 30 s

**Origem:** achado à parte da correção `2026-10-17-agentes-carregando-estoura-o-prazo` (commit `4a3835f`): o vizinho `:164` caiu quatro vezes na esteira, no `celular`, pelo relógio de 30 s; este, na mesma esteira, levou 25,5 s. Ainda não caiu; o Orquestrador pediu a correção antes que caia.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção mexe em um arquivo fora de `tasks/` (o spec), abaixo do limite de 5, e fora de `.github/`, `tools/ci/` e `tools/processo/`. -->

## Sintoma

Não há falha ainda: o caso passa na esteira com 25,5 s de 30 s no projeto `celular` (CPU ×4, rede móvel). É o único dos sete casos de `e2e/agentes.spec.ts` que roda no relógio padrão; os outros seis já têm `test.slow()`. Uma esteira um pouco mais lenta que a das três em que o `:164` caiu leva o caso a `Test timeout of 30000ms exceeded`, sem nada travado.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

**Achado à parte, não corrigido aqui:** no primeiro portão desta correção, `agentes.spec.ts:307` ("a coordenação de B entra na aba da de A…", que já tem `test.slow()`) caiu uma vez no `celular`, com 6 trabalhadores, aos 37,4 s: o cartão do Assistente não apareceu em 20 s porque a tela mostrava "Não foi possível carregar esta parte do Turmma / A página não chegou até aqui" (a carga do trecho da rota falhou, e não o relógio). Repetido logo depois, `-g "a coordenação de B entra" --repeat-each 6 --workers 6`: 12 de 12 verdes (25,3 a 26,9 s). Uma ocorrência, sem reprodução; fica para o Orquestrador decidir se vira correção própria se voltar na esteira.

## Causa

**Tempo do teste, e não da tela.** O caso faz uma entrada completa (`entrar`: login, Painel), abre a aba de IA (`abrirAgentes`), confere o cartão do Assistente, abre o diálogo de suspensão, grava a suspensão, espera a tela reler, retoma e confere o banco quatro vezes. Medido nesta máquina, sem mudar nada, `--repeat-each 4 --workers 2`: **19,9 a 20,0 s no `chromebook` e 21,1 a 21,2 s no `celular`**, 8 de 8 verdes. Na esteira, que é mais lenta, foram 25,5 s no `celular`: 85% do relógio de 30 s. Nada espera de propósito, mas o caso é longo, o relógio é curto e a diferença de máquina entre esta e o runner já passou de 20% (o `:164` mediu 29,6 s aqui e 30,2 s lá, no limite).

## Teste que reproduz

Reproduzir o relógio do runner não é determinístico. O que o produz é: com um relógio menor, o mesmo caso, **antes da correção**:

```
npx playwright test e2e/agentes.spec.ts -g "três funções no Assistente" --timeout=16000 --repeat-each 2 --workers 2
```

Resultado: **4 de 4 vermelhos** (dois por projeto), `Test timeout of 16000ms exceeded`. Com `test.slow()` o relógio é multiplicado por 3, e o mesmo `--timeout=16000` passa a valer 48 s.

## Correção

Só teste muda; o produto não.

- `e2e/agentes.spec.ts`: o caso ganha `test.slow()` na primeira linha, com o motivo num comentário, como os outros seis do arquivo. Nenhuma asserção muda ou sai.

O que **não** muda: as asserções, o `PRAZO_DA_ENTRADA_MS`, os helpers e a tela.

## Estabilidade

Depois da correção:

- o comando do vermelho (`--timeout=16000`, duas repetições por projeto): **4 de 4 verdes**, contra os 4 vermelhos de antes;
- `npx playwright test e2e/agentes.spec.ts -g "três funções no Assistente" --repeat-each 10 --workers 2`, relógio normal: **20 de 20 verdes** (dez por projeto), de 19,7 a 19,9 s no `chromebook` e de 21,0 a 21,3 s no `celular`. Com `test.slow()` o relógio é de 90 s, e o mais lento usa 24% dele (contra 85% dos 30 s na esteira, antes).

## Mutações

Correção só de relógio de teste: não há cláusula de produto nem asserção nova a mutar. O relógio se prova pelo vermelho com o relógio menor e pela estabilidade, acima.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | `test.slow()` dá 90 s ao caso e a folga deixa de avisar se ele ficar lento de verdade; o `/retro` registra o tempo de referência (cerca de 21 s no `celular` local, 25,5 s na esteira) | `/retro` da spec: não muda código, e o tempo já está escrito em "Causa" do documento |
| test-engineer (1ª) | Se o `:307` ("Não foi possível carregar esta parte do Turmma") voltar na esteira, abrir correção própria que olhe a carga do trecho da rota no `celular` com 6 trabalhadores, e não mais um `test.slow()` | Já registrado em "Fora desta correção"; o Orquestrador decide se voltar |
| frontend-reviewer (1ª) | Conferir na validação de `/coordenacao/agentes`, com o diálogo "Aviso de incidente de segurança" aberto, que o botão de confirmar fica visível ou alcançável por rolagem em 360 px e em 1366×768 (a foto o mostra cortado na borda inferior) | Validação da spec (Validador): é de outra tarefa, e esta não altera tela |
| frontend-reviewer (1ª) | Esperar para ver se o `:307` volta na esteira antes de abrir correção própria | Mesmo destino da linha do `:307` acima |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 19:33:22 | 2026-10-17 19:33:42 | `frontend-reviewer` | 1 | APROVADO | a2609662fbc46192c |
| 2026-10-17 19:33:24 | 2026-10-17 19:33:43 | `test-engineer` | 1 | APROVADO | a861bbe7a54498835 |
