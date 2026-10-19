# Correção — a página rola a 1366 × 768 no formulário da Adaptação e em "O que o Assistente fez"

**Origem:** `tasks/prd-telas-do-professor/validacao.md` §4, achado C4 (RF22), só estas duas telas; pedido do Orquestrador em 19/10/2026. Hoje e Alunos (as outras duas do C4) são de outra correção.
**Subagentes obrigatórios:** `frontend-reviewer`, `revisor-geral`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção toca 7 arquivos fora de `tasks/` (4 de `apps/web`, 1 teste novo, 2 specs de e2e), acima do limite de 5 do passo 5 do `/corrigir`. -->

## Sintoma

A 1366 × 768 (`chromebook`) a página inteira rola, e não só o miolo (`validacao.md` §4, C4):

- o formulário da Adaptação (`/professor/ferramentas/adaptacao`): 782 px de página contra os 768 da janela;
- "O que o Assistente fez" (`/professor/time/assistente`) com entregas: 887 px.

O RF22 diz "cabe em 1366 × 768". O documento do professor já resolveu o mesmo problema (`miolo-do-documento.ts`: o painel da aba rola por dentro, o cabeçalho fica parado).

## Fora desta correção

Nada: nenhuma tarefa em curso na árvore (`git status` limpo).

## Causa

As duas telas são uma `Tela` solta: o conteúdo é filho direto da coluna, sem um miolo que rola. A altura da página é a do conteúdo, e ela só cabe nos 768 px quando o conteúdo é curto:

- **Formulário de ferramenta** (`Ferramenta.tsx`): a grade com o cartão do formulário e "Como vai sair" não tinha limite de altura. A Adaptação, a que tem mais campos, passa 14 px da janela (782 px de página, medido).
- **"O que o Assistente fez"** (`Time.tsx`): a conversa cresce com o número de entregas, e nada a limitava (1154 px de sobra com seis entregas, medido; o `validacao.md` mediu 887 px com outro conjunto). O "Ver mais entregas" ficava depois das abas, fora de qualquer miolo.

O padrão já existia no documento do professor (`O_MIOLO_DO_DOCUMENTO` e `useTopoDoPainel`, em `miolo-do-documento.ts`): a altura do painel é a da janela menos **onde ele começa**, medido, e não somado em `rem`, porque o cabeçalho destas telas muda de altura (título que quebra, descrição, a faixa "Esperando você" aberta). As duas telas ficaram de fora dele porque o RF22 e a 6.0 falam só do documento.

## Teste que reproduz

- `e2e/professor-entregas.spec.ts › a 1366 × 768 a página não rola com a conversa cheia…` (`chromebook`): seis entregas, `paginaNaoRola`, a conversa rola por dentro, a faixa e as abas não saem do lugar, a última entrega termina dentro do painel, e abrir a lista da faixa não faz a página rolar. **Vermelho antes:** `a página inteira rola a partir de 768 px`, 1154 px de sobra. Verde depois.
- `e2e/professor-ferramentas.spec.ts › a 1366 × 768 a página não rola em nenhum formulário…` (`chromebook`): as três ferramentas, com a Adaptação aberta primeiro; `paginaNaoRola`, o título não sai do lugar com o formulário rolando, o botão de gerar chega à vista. **Vermelho antes:** 14 px de sobra (a Adaptação). Verde depois, nos dois projetos (no `celular` o caso mede só a rolagem de lado).
- `apps/web/src/areas/professor/Time.test.tsx` e `Ferramenta.test.tsx › …a grade do formulário é o miolo…` (componente): as classes do miolo só com o prefixo `md:`, a faixa, as abas, o título e o "Voltar" fora dele, o "Ver mais entregas" dentro, e a variável `--topo-do-painel` gravada na caixa certa e retirada ao sair. São o que o `jsdom` alcança; a altura é do e2e.

## Correção

- **`miolo-do-documento.ts`**: `useTopoDoMiolo`, o irmão de `useTopoDoPainel` para o miolo sem abas: a `ref` vai no próprio elemento que rola, e ele grava `--topo-do-painel` nele mesmo. Medir o topo de quem tem a altura limitada não gira em círculo, porque a altura máxima não muda onde ele começa. A constante `O_MIOLO_DO_DOCUMENTO` é a mesma, e o comentário dela passou a dizer que as três telas a usam.
- **`Ferramenta.tsx`**: a grade (formulário e "Como vai sair") é o miolo (`data-miolo-da-ferramenta`). O título e o "Voltar" ficam parados. Abaixo de 768 px nada muda: a página rola inteira.
- **`Time.tsx`**: as abas ficam numa caixa com `useTopoDoPainel`, e o painel da aba ativa recebe `O_MIOLO_DO_DOCUMENTO` (`classeDoPainel`). O "Ver mais entregas" passou para dentro do painel, porque fora dele a página passaria da janela. A faixa "Esperando você" continua acima, parada.
- **Depois da 1ª rodada** (ordem `r1`): `md:pb-1` embaixo do miolo do formulário, para a borda do cartão da Adaptação não ficar colada no corte; o recuo do `<Abas>` dentro da caixa nova; o comentário e o `md:top-0` da faixa "Esperando você", que já não valiam (a partir de 768 px a página não rola); e o caso de componente das duas medidas do `useTopoDoMiolo` (`resize` e `ResizeObserver`), com um bloco de mutação para cada cláusula.
- Não mudou nenhum texto da tela nem regra: só a casca de rolagem.

## Mutações

Cada bloco tira uma cláusula do miolo, e o teste de componente tem de ficar vermelho.

```mutacao
arquivo: apps/web/src/areas/professor/Ferramenta.tsx
teste: apps/web/src/areas/professor/Ferramenta.test.tsx › atividade_objetiva: a grade do formulário é o miolo que rola a partir de 768 px, com o título fora dela e a medida do topo gravada nela
-      <div ref={miolo} data-miolo-da-ferramenta="" className={`grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start md:pb-1 ${O_MIOLO_DO_DOCUMENTO}`}>
+      <div ref={miolo} data-miolo-da-ferramenta="" className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start md:pb-1">
```

```mutacao
arquivo: apps/web/src/areas/professor/Ferramenta.tsx
teste: apps/web/src/areas/professor/Ferramenta.test.tsx › atividade_objetiva: a grade do formulário é o miolo que rola a partir de 768 px, com o título fora dela e a medida do topo gravada nela
-      <div ref={miolo} data-miolo-da-ferramenta="" className={`grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start md:pb-1 ${O_MIOLO_DO_DOCUMENTO}`}>
+      <div data-miolo-da-ferramenta="" className={`grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start md:pb-1 ${O_MIOLO_DO_DOCUMENTO}`}>
```

```mutacao
arquivo: apps/web/src/areas/professor/miolo-do-documento.ts
teste: apps/web/src/areas/professor/Ferramenta.test.tsx › atividade_objetiva: a grade do formulário é o miolo que rola a partir de 768 px, com o título fora dela e a medida do topo gravada nela
-      no.style.removeProperty('--topo-do-painel')
     }
   }, [])
   return miolo
```

```mutacao
arquivo: apps/web/src/areas/professor/Time.tsx
teste: apps/web/src/areas/professor/Time.test.tsx › só o painel do filtro rola, a partir de 768 px: a faixa e as abas ficam fora dele, e o "Ver mais entregas" dentro
-            classeDoPainel={O_MIOLO_DO_DOCUMENTO}
```

```mutacao
arquivo: apps/web/src/areas/professor/Time.tsx
teste: apps/web/src/areas/professor/Time.test.tsx › o painel mede onde começa: a variável `--topo-do-painel` fica na caixa das abas, e sai com a tela
-          <div ref={topoDoPainel} className="min-w-0">
+          <div className="min-w-0">
```

```mutacao
arquivo: apps/web/src/areas/professor/Time.tsx
teste: apps/web/src/areas/professor/Time.test.tsx › só o painel do filtro rola, a partir de 768 px: a faixa e as abas ficam fora dele, e o "Ver mais entregas" dentro
-            {/* Dentro do miolo: fora dele, a página passaria da janela (RF22). */}
-            {entregas.hasNextPage && (
-              <div className="flex justify-center pt-4">
-                <Botao variante="secundario" onClick={() => void entregas.fetchNextPage()} disabled={entregas.isFetchingNextPage}>
-                  {entregas.isFetchingNextPage ? 'Carregando…' : 'Ver mais entregas'}
-                </Botao>
-              </div>
-            )}
-          </Abas>
+          </Abas>
+          {entregas.hasNextPage && (
+            <Botao variante="secundario" onClick={() => void entregas.fetchNextPage()} disabled={entregas.isFetchingNextPage}>
+              {entregas.isFetchingNextPage ? 'Carregando…' : 'Ver mais entregas'}
+            </Botao>
+          )}
```

```mutacao
arquivo: apps/web/src/areas/professor/Ferramenta.tsx
teste: apps/web/src/areas/professor/Ferramenta.test.tsx › atividade_objetiva: a grade do formulário é o miolo que rola a partir de 768 px, com o título fora dela e a medida do topo gravada nela
-      <div ref={miolo} data-miolo-da-ferramenta="" className={`grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start md:pb-1 ${O_MIOLO_DO_DOCUMENTO}`}>
+      <div ref={miolo} data-miolo-da-ferramenta="" className={`grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start ${O_MIOLO_DO_DOCUMENTO}`}>
```

```mutacao
arquivo: apps/web/src/areas/professor/miolo-do-documento.ts
teste: apps/web/src/areas/professor/Ferramenta.test.tsx › o topo do miolo é medido de novo quando a janela muda e quando a tela por cima muda de altura, e nenhuma das duas medidas sobrevive à tela
-    window.addEventListener('resize', medir)
     return () => {
       vigia?.disconnect()
       window.removeEventListener('resize', medir)
       no.style.removeProperty('--topo-do-painel')
     }
   }, [])
```

```mutacao
arquivo: apps/web/src/areas/professor/miolo-do-documento.ts
teste: apps/web/src/areas/professor/Ferramenta.test.tsx › o topo do miolo é medido de novo quando a janela muda e quando a tela por cima muda de altura, e nenhuma das duas medidas sobrevive à tela
-    vigia?.observe(no.closest('[data-tela]') ?? document.body)
     window.addEventListener('resize', medir)
     return () => {
       vigia?.disconnect()
       window.removeEventListener('resize', medir)
       no.style.removeProperty('--topo-do-painel')
     }
   }, [])
```

```mutacao
arquivo: apps/web/src/areas/professor/miolo-do-documento.ts
teste: apps/web/src/areas/professor/Ferramenta.test.tsx › o topo do miolo é medido de novo quando a janela muda e quando a tela por cima muda de altura, e nenhuma das duas medidas sobrevive à tela
-      vigia?.disconnect()
       window.removeEventListener('resize', medir)
       no.style.removeProperty('--topo-do-painel')
     }
   }, [])
   return miolo
```

```mutacao
arquivo: apps/web/src/areas/professor/miolo-do-documento.ts
teste: apps/web/src/areas/professor/Ferramenta.test.tsx › o topo do miolo é medido de novo quando a janela muda e quando a tela por cima muda de altura, e nenhuma das duas medidas sobrevive à tela
-      window.removeEventListener('resize', medir)
       no.style.removeProperty('--topo-do-painel')
     }
   }, [])
   return miolo
```

## Recomendações sem aplicar

Da 1ª rodada (ordem `.processo/ordens/2026-10-19-formulario-e-assistente-rolam-a-pagina-r1.md`): os três revisores aprovaram, e as recomendações abaixo ficaram de fora, com o destino de cada uma.

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) e revisor-geral (1ª) | Faixa "Esperando você" aberta com muitas pendências, junto de "O que cada função faz sozinha" aberto: o `max-h` do painel pode chegar a perto de zero e a conversa some; "Vale um teto de altura com rolagem própria na lista da faixa" (frontend) / "uma altura mínima do `md` para cima, por exemplo `md:min-h-48`, ou um caso no e2e com as duas partes abertas" (geral) | Não aplicar: muda comportamento da tela, e as duas saídas propostas se contradizem (o teto de rolagem na faixa mantém a página parada; a altura mínima a faz rolar de novo). É correção própria, com decisão de desenho. Destino: `TODO.md`, e o Orquestrador decide se abre a correção |
| revisor-geral (1ª) | Código duplicado entre `useTopoDoMiolo` e `useTopoDoPainel`: "Dá para tirar um ajudante comum que recebe o elemento a medir" | Não aplicar: mexe em `useTopoDoPainel`, já aprovado e usado pelo documento do professor, e os blocos de mutação de `miolo-do-documento.ts` (deste documento e da 6.0) apontam para o texto atual. Destino: `TODO.md`, junto da próxima tarefa que tocar `miolo-do-documento.ts` |
| revisor-geral (1ª) | Tech Spec: "A seção "(8) A página não rola, rola a mesa" (`tasks/prd-telas-do-professor/techspec.md:211-213`) ainda fala só do documento" | Não aplicar: a Tech Spec é do Arquiteto, e a correção não edita documento de spec. Destino: o Orquestrador repassa ao Arquiteto, no fechamento da spec |
| test-engineer (1ª) | Formulário com mais conteúdo: `paginaNaoRola` depois de gerar sem preencher (mensagens de erro) e com o resultado da geração no cartão | Não aplicar: é caso novo de e2e (lento, e pode revelar defeito de altura que pede outra correção). Destino: `TODO.md` |
| test-engineer (1ª) | "Ver" da faixa com a rolagem dentro do painel: `scrollIntoView` e o `scroll-mt-48` do cartão, a 1366 × 768 | Não aplicar: é caso novo de e2e que pode revelar defeito (o `scroll-mt-48` foi pensado para a página). Destino: `TODO.md`, junto da recomendação da faixa com muitas pendências acima |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 17:05:37 | 2026-10-19 17:06:42 | `frontend-reviewer` | 1 | APROVADO | ab49fa395bc6fbaea |
| 2026-10-19 17:05:41 | 2026-10-19 17:06:51 | `revisor-geral` | 1 | APROVADO | a1a9e35847bdbcb56 |
| 2026-10-19 17:05:45 | 2026-10-19 17:07:37 | `test-engineer` | 1 | APROVADO | a27eddf32e01a01d0 |
| 2026-10-19 17:19:10 | 2026-10-19 17:19:41 | `frontend-reviewer` | 2 | APROVADO | a984a76efa40d2506 |
| 2026-10-19 17:19:16 | 2026-10-19 17:20:07 | `revisor-geral` | 2 | APROVADO | a725638f13e2a4aa7 |
| 2026-10-19 17:19:22 | 2026-10-19 17:20:31 | `test-engineer` | 2 | APROVADO | a8f1fa8e0246e8dce |
