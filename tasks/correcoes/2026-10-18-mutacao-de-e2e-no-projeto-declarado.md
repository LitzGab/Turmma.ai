# Correção — `mutacoes.ts` roda o caso de e2e de uma mutação sempre no projeto `chromebook`, e a cláusula que só vale no celular não se prova

**Origem:** `tasks/prd-pele-e-casca/retro.md` (`TODO.md`, "(X1, retrospectiva) Código de processo", letra (c), última frase).
**Subagentes obrigatórios:** `revisor-geral`
<!-- Veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção toca `tools/processo/`. -->

## Sintoma

`comandoDoTeste` (`tools/processo/mutacoes.ts`) monta o comando do e2e com `--project=chromebook` fixo. Uma cláusula da web
que só existe no celular (o ramo `isMobile`, o menu de baixo, o toque) é mutada, o teste que a prova roda no `chromebook`,
onde a cláusula nunca é alcançada, e continua verde: o portão reprova com "falta o teste que falhe sem ela" quando o teste
existe e roda no `celular`. Ou, pior, quem escreve o bloco troca o teste por um que também cobre o computador só para o
portão passar.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa. As letras (b), (e) e (g) do mesmo item do
`TODO.md` e as recomendações sem aplicar da `2026-10-18-e2e-que-cita-literal-removido` continuam sem fazer.

## Causa

O projeto foi fixado em `chromebook` quando a mutação passou a ser conferida por máquina (M1 do F3), para a corrida de cada
mutação rodar um perfil só e não dois. O bloco `mutacao` não tem onde dizer qual projeto, então o código escolheu um por
todos.

## Teste que reproduz

`tools/processo/mutacoes.test.ts` › `o projeto do e2e vem do bloco; sem a linha "projeto:", é o chromebook`: lê um bloco com
`projeto: celular` e espera `--project=celular` no comando; vermelho antes (o bloco não tem o campo e o comando traz
`--project=chromebook`).

## Correção

- `tools/processo/mutacoes.ts`: a linha `projeto: celular|chromebook` entra no cabeçalho do bloco, depois de `teste:`. É
  opcional; sem ela, `chromebook` (nenhum bloco existente muda de comportamento nem de impressão no carimbo). Valer só para
  teste de e2e: nome fora de `chromebook` e `celular`, ou a linha num teste de unidade, integração ou infra, vira erro do
  bloco, que o portão recusa antes de rodar qualquer coisa. `comandoDoTeste` usa o projeto do bloco. A corrida limpa de antes
  é por comando, e o comando traz o projeto: a mesma mutação em dois projetos tem as duas corridas.
- `.claude/skills/executar-task/SKILL.md` e `.claude/skills/criar-tasks/task-template.md`: o formato do bloco ganha a linha.
- `TODO.md`: a última frase da letra (c) feita.

## Mutações

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o projeto do e2e vem do bloco; sem a linha "projeto:", é o chromebook
-mutacao.projeto ?? PROJETOS_DO_E2E[0]
+PROJETOS_DO_E2E[0]
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o projeto do e2e vem do bloco; sem a linha "projeto:", é o chromebook
-mutacao.projeto ?? PROJETOS_DO_E2E[0]
+mutacao.projeto ?? 'celular'
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a linha "projeto:" só vale em e2e e só com um projeto que o Playwright tem; o resto é erro do bloco
-if (!PROJETOS_DO_E2E.some(
+if (PROJETOS_DO_E2E.some(
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a linha "projeto:" só vale em e2e e só com um projeto que o Playwright tem; o resto é erro do bloco
-?? '') !== 'e2e') erro =
+?? '') === 'e2e') erro =
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › tira de cada bloco o arquivo, o teste com o caso, o trecho de hoje e o que fica; contexto entra nos dois lados
-if (!erro && projeto !== null) {
+if (!erro) {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a linha "projeto:" só vale em e2e e só com um projeto que o Playwright tem; o resto é erro do bloco
-if (!erro && projeto !== null) {
+if (projeto !== null) {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o projeto do e2e vem do bloco; sem a linha "projeto:", é o chromebook
-...(doBloco ? { projeto: doBloco } : {}),
+...{},
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › os projetos que o bloco aceita são os do playwright.config.ts
-['chromebook', 'celular'] as const
+['chromebook', 'celular', 'tablet'] as const
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a mesma mutação em dois projetos tem cada uma a sua corrida limpa e a sua corrida mutada
-const chave = comando.join(' ')
+const chave = mutacao.teste
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-18 11:49:08 | 2026-10-18 11:49:38 | `revisor-geral` | 1 | APROVADO | a0ad70e9b004b3eb2 |
| 2026-10-18 11:49:06 | 2026-10-18 11:50:08 | `test-engineer` | 1 | APROVADO | ad49c018ada8d5601 |

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a mesma mutação em dois projetos tem cada uma a sua corrida limpa e a sua corrida mutada
-${mutacao.caso ? ` › ${mutacao.caso}` : ''})${mutacao.projeto ? ` [${mutacao.projeto}]` : ''}`
+${mutacao.caso ? ` › ${mutacao.caso}` : ''})`
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | Segundo exemplo de bloco, com e2e e `projeto: celular`, em `executar-task/SKILL.md` e `task-template.md` | Recusada: marcada "opcional" pelo próprio revisor; a prosa já descreve a linha e o `it` de erros prova o formato |
| test-engineer (1ª) | `mutacoes.ts:73-77`: duas linhas `projeto:` no mesmo bloco valem a última, sem aviso; "linha repetida" seria erro (vale também para `arquivo:` e `teste:`) | `TODO.md`, junto das outras letras do item "(X1, retrospectiva) Código de processo": muda comportamento do parser nos três campos, fora do que esta correção prometeu |
| test-engineer (1ª) | `mutacoes.ts:175`: o padrão depende de `PROJETOS_DO_E2E[0]`; nomear `PROJETO_PADRAO` ou dizer no comentário do teste | Recusada: reescreveria dois blocos de "Mutações" sem mudar comportamento, e o teste de lista já fica vermelho se a ordem mudar |
| 2026-10-18 11:53:40 | 2026-10-18 11:54:30 | `test-engineer` | 2 | APROVADO | a7758632992d666a9 |
| 2026-10-18 11:53:45 | 2026-10-18 11:54:35 | `revisor-geral` | 2 | APROVADO | ad5a22057b5a2893c |
