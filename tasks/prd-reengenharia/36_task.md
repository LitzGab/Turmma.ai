# Tarefa 36.0 — O kit visual mora em `componentes/ui/` e não importa API, área nem sessão

**Funcionalidade:** reengenharia · **Depende de:** 51.0, 53.0 (uma linha só para a web)
**Subagentes obrigatórios:** `frontend-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Tarefa mecânica. Os 61 arquivos de produção do kit visual (botão, campo, diálogo, aviso, ícones, onça, peças de IA) saem de `componentes/` para `componentes/ui/`, com os testes, por script, e uma regra do ESLint barra o kit de
importar `api/`, `areas/` ou `sessao/`. Comportamento igual: nenhuma tela e nenhum chunk muda.

## Contexto necessário

- `onda-2.md`, "Onde moram" (o nome é `componentes/ui/`, e não `kit/`, pela D81), "Como se move" e §6; `prd.md` RF14
- `apps/web/nome-dos-chunks.ts` (`PASTA_DAS_PECAS_DE_IA`, `PECAS_FORA_DA_ENTRADA`, relativos a `componentes/`) e
  `nome-dos-chunks.test.ts` (:117-187, :374-376, :405-429); `componentes/casca-sem-import.test.ts` (`motivoDeFora`)
- **Onde a regra mora:** a `onda-2.md` a põe no depcruise da 12.0, que não a leva. Vale a D81: ESLint core, aqui

## O que vai e o que fica

| Destino | Arquivos de produção |
|---|---|
| `ui/` (22) | Abas, Aviso, BarraPresa, BarraRotulada, Botao, BotaoCopiar, botao-secundario, barra, Cartao, Contador, Faixa, Icone, Ladrilho, Linha, Marca, NumeroPainel, SeloDeEstado, Tabela, Tela, Toque, midia, teclado-das-abas |
| `ui/campos/` (10) | Campo, CampoDeSenha, CampoLongo, Busca, Selecao, Interruptor, Opcao, Segmentado, seletor, texto-longo |
| `ui/sobrepostos/` (9) | Dialogo, DialogoDeConfirmacao, dialogo-aberto, dialogo-modal, dialogo-prioritario, flutuante, Menu, teclado-do-menu, PainelLado |
| `ui/ia/`, `ui/icones/`, `ui/onca/` | as três pastas atuais, inteiras (18, 1 e 1) |

Ficam em `componentes/` (24 de produção, mais `estado/`, `sino/`, `meus-dados/`, `pedidos/`): a casca, o convite,
`dialogos.tsx`, `texto-da-falha.ts` e `baixar-por-url.ts`; os três e `estado/EstadoErro.tsx` importam `api/cliente`. Sem os
dois subgrupos, `ui/` teria 41 arquivos e reprovaria a trava de 25 que a 97.0 cria (R56).

## Subtarefas

- [x] 36.1 — Caracterização, antes: `npx vitest run --project unidade apps/web` verde, e a lista de chunks do build (nome e brotli) em `.processo/chunks-antes.txt`
- [x] 36.2 — `.processo/mover-kit.mjs` (ignorado pelo git), com o ts-morph numa pasta de rascunho (`npm i --prefix .processo/ts-morph ts-morph@<exata>`, sem tocar o `package.json`) e `node .processo/mover-kit.mjs <pasta>`: aplica as edições de `getEditsForFileRename` do ts-morph no tsconfig da web e só então faz `git mv`. O teste vai com o que importa (`Superficies.test.tsx` e `SeloEFaixa.test.tsx` para `ui/`; `perigo-cheio.test.ts` e `casca-sem-import.test.ts` ficam). Um commit por pasta, `(tarefa 36.0)`: `ui/onca/`, `ui/icones/`, `ui/ia/`, `ui/sobrepostos/`, `ui/campos/`, `ui/`
- [x] 36.3 — No commit de cada pasta, a fatia dela em `PECAS_FORA_DA_ENTRADA` (`'Abas'` vira `'ui/Abas'`), em `PASTA_DAS_PECAS_DE_IA` e nos literais dos testes (o script não os vê)
- [x] 36.4 — Último commit: a regra de lint, a fixture e o teste
- [x] 36.5 — `grep -rn` dos nomes antigos: comentários, docs, o `README.md` da `ia/` e o grupo do `.size-limit.json`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/ui/**` | novo (`git mv`) |
| `apps/web/src/componentes/{ia,icones,onca}/**` e os 61 arquivos do mapa, com os testes | movido |
| `apps/web/src/{areas,paginas,operacao,galeria,__fixtures__}/**` e o resto de `componentes/**` | alterado (import) |
| `apps/web/nome-dos-chunks.ts`, `apps/web/nome-dos-chunks.test.ts` | alterado |
| `apps/web/src/estilos.test.ts`, `apps/web/src/componentes/perigo-cheio.test.ts`, `apps/web/src/componentes/casca-sem-import.test.ts` | alterado (literais) |
| `apps/web/src/componentes/ui/{botao-secundario.test.ts,ia/avatar-so-nas-duas-pecas.test.ts,onca/CabecaOnca.test.tsx}` | alterado (um `'..'` a mais) |
| `eslint.config.mjs`, `tools/guardas/index.mjs`, `tools/guardas/guardas.test.ts` | alterado |
| `tools/guardas/__fixtures__/kit-importa-api.ts` | novo |
| `.size-limit.json`, `ROADMAP.md`, `docs/interface.md`, `e2e/pecas-marca-icones.spec.ts`, `e2e/pecas-marca-onca.spec.ts` | alterado (só o caminho citado) |

## Testes que provam a regra

| Cenário | Tipo | Fica vermelho se (a mutação) |
|---|---|---|
| Em `ui/**`, import de `api/`, `areas/` e `sessao/`, também `import type` e `export … from`, reprova | unidade | tirar um padrão do `no-restricted-imports` |
| `import()` de `api/` reprova | unidade | tirar o seletor `ImportExpression` |
| A mesma fixture em `componentes/estado/x.tsx` passa; `ui/` importando `../../formatar` e `./Botao` passa | unidade | o bloco valer para a web inteira |
| `eslint-disable-next-line no-restricted-imports` no kit: a passada sem comentários reprova | unidade | tirar as duas regras de `REGRAS_DAS_GUARDAS` |
| Build de verdade: cada peça da lista existe e nenhuma está na entrada (`nome-dos-chunks.test.ts:374-376`) | unidade | deixar `'Abas'` na lista, sem `ui/` |
| `motivoDeFora('./ui/Contador')` é `'peça fora da entrada'`, e `'./ui/ia/AssinaturaIA'`, `'pasta fora da entrada'` | unidade | normalizar sem `ui/` |
| Caracterização: unidade da web verde e chunks (nome e brotli) iguais antes e depois | unidade, build | nenhuma |

Sem isolamento, concorrência nem log.

## Como testar

- Lint: copie `tools/guardas/guardas.test.ts › processadores do worker: nenhuma afirmação de tipo (totais do expurgo, A0b)`
  (os dois `it`: fixture com `/* reprova: no-restricted-imports */` em `apps/web/src/componentes/ui/x.tsx`, e o "vale só …"
  em `componentes/estado/x.tsx`) e, para o comentário, `guarda desligada por comentário › a passada sem comentários do npm
  run lint ainda pega a violação`
- Armadilha: use o `no-restricted-imports` do **core**; o `@typescript-eslint/no-restricted-imports` é do bloco das guardas,
  o último, e um bloco novo o sobrescreveria. O core não vê `import()`: confirme na fixture. A 14.0 a 17.0 e a 25.0
  também editam `eslint.config.mjs` e `index.mjs`: leia o que já deixaram
- Casca: `casca-sem-import.test.ts › a casca da escola, da entrada › o detector reprova a peça e a pasta por caminho relativo …`
- Isolado: `npx vitest run --project unidade apps/web tools/guardas/guardas.test.ts`; e2e:
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-botoes.spec.ts e2e/pecas-galeria.spec.ts`
- **Telas:** nenhuma muda; o `frontend-reviewer` confere o diff do build e o `grep` do caminho velho

## Fora do escopo desta tarefa

Barril `index.ts` em `ui/` (pesaria na entrada), mover `estado/`, `sino/` e `pedidos/`, a direção entre `componentes/` e
`areas/` (12.0) e as pastas de `areas/` (97.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Um commit só para a tarefa, e não um por pasta (36.2): o hook exige carimbo do portão e revisão aprovada em todo commit `(tarefa N.0)`, e a Mesa revisa a tarefa uma vez, não seis. Os seis movimentos rodaram um a um pelo script (`onca`, `icones`, `ia`, `sobrepostos`, `campos`, `ui`), com tipos e unidade entre eles; o git guarda cada arquivo como renomeação | O processo (D78, D53) não tem como aprovar commit intermediário de uma tarefa; o histórico por arquivo é o mesmo | `onda-2.md`, "Como se move" (uma tarefa move uma coisa só); `36_task.md`, subtarefa 36.2 |
| `motivoDeFora` da `casca-sem-import.test.ts` resolve o caminho a partir da pasta do arquivo que importa (segundo parâmetro `doArquivo`), e `estados.test.tsx` compara o caminho resolvido a partir de `estado/`, no lugar do último trecho: com `Ladrilho`, `Icone`, `Marca` e `Segmentado` dentro de `ui/`, o irmão `./Contador` só é a peça `ui/Contador` olhando de onde ele é escrito; e a lista passa a ter o caminho (`ui/Aviso`), que o último trecho nunca casaria | Sem isso a casca (e os três estados) deixavam de enxergar a peça fora da entrada que importassem, e os dois testes passariam vazios | `onda-2.md`, "Onde moram"; a tabela "Testes que provam a regra" desta tarefa (`motivoDeFora('./ui/Contador')`) |
| A regra do kit mora no `eslint.config.mjs` com `REGRAS_DO_KIT = ['no-restricted-imports']` em `tools/guardas/index.mjs`; o `no-restricted-syntax` do `import()` já é de `REGRAS_DE_ENTRADA`. O seletor escreve a barra do caminho como `\x2f`, porque o esquery não aceita `/` dentro do literal de expressão regular | O depcruise da 12.0 não leva a regra (D81: ESLint core), e o `eslint-disable` dela precisa ser furado pela passada sem comentários | `36_task.md`, "Como testar" (armadilha); `onda-2.md` §2, "Como se move" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › reprova import, import type
- { regex: '(^|/)api(/|$)', message: 'O kit visual não importa a API: o dado chega por prop, e quem busca é a tela.' },
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › reprova import, import type
- { regex: '(^|/)areas(/|$)', message: 'O kit visual não importa tela: a dependência vai das áreas para o kit, nunca o contrário.' },
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › reprova import, import type
- { regex: '(^|/)sessao(/|$)', message: 'O kit visual não importa a sessão: o que ele precisa dela chega por prop.' },
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › reprova import, import type
- {
- // O `/` do caminho entra como `\x2f`: o esquery não aceita `/` dentro do literal de expressão regular.
- selector: 'ImportExpression[source.value=/(^|\\x2f)(api|areas|sessao)(\\x2f|$)/]',
- message: 'O kit visual não importa a API, as telas nem a sessão, também por `import()`.',
- },
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › vale em toda pasta do kit
- files: ['apps/web/src/componentes/ui/**/*.{ts,tsx}'],
+ files: ['apps/web/**/*.{ts,tsx}'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › vale em toda pasta do kit
- files: ['apps/web/src/componentes/ui/**/*.{ts,tsx}'],
+ files: ['apps/web/src/componentes/ui/*.{ts,tsx}'],
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › o eslint-disable-next-line de um import
- export const REGRAS_DO_KIT = ['no-restricted-imports']
+ export const REGRAS_DO_KIT = []
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › peça fora da entrada é a pasta
- const PASTA_DAS_PECAS_DE_IA = '/apps/web/src/componentes/ui/ia/'
+ const PASTA_DAS_PECAS_DE_IA = '/apps/web/src/componentes/ia/'
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › peça fora da entrada é a pasta
-   'ui/Abas',
+   'Abas',
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › as peças novas de campo
-   'ui/campos/Busca',
+   'Busca',
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › o painel ao lado
-   'ui/sobrepostos/PainelLado',
+   'PainelLado',
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › a cabeça da onça
-   'ui/onca/CabecaOnca',
+   'onca/CabecaOnca',
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › as peças novas de estado
-   'ui/Aviso',
+   'Aviso',
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › a peça nova de lista
-   'ui/Linha',
+   'Linha',
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › as peças do MVP de apresentação ficam fora
-   'ui/Cartao',
+   'Cartao',
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › as peças do MVP de apresentação ficam fora
-   'ui/sobrepostos/flutuante',
+   'flutuante',
```

```mutacao
arquivo: apps/web/src/componentes/casca-sem-import.test.ts
teste: apps/web/src/componentes/casca-sem-import.test.ts › o detector reprova a peça e a pasta
- const resolvido = posix.normalize(posix.join(posix.dirname(doArquivo), caminho))
+ const resolvido = posix.normalize(caminho)
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoVazio.tsx
teste: apps/web/src/componentes/estado/estados.test.tsx › nenhum importa
- import { Botao } from '../ui/Botao'
+ import { Aviso as Botao } from '../ui/Aviso'
```

```mutacao
arquivo: apps/web/src/componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts
teste: apps/web/src/componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts › só é importado pelo
- const RAIZ_DA_WEB = join(import.meta.dirname, '..', '..', '..')
+ const RAIZ_DA_WEB = join(import.meta.dirname, '..', '..')
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.test.tsx
teste: apps/web/src/componentes/ui/onca/CabecaOnca.test.tsx › não tem temporizador
- const RAIZ_DA_WEB = join(import.meta.dirname, '..', '..', '..')
+ const RAIZ_DA_WEB = join(import.meta.dirname, '..', '..')
```

```mutacao
arquivo: apps/web/src/componentes/ui/botao-secundario.test.ts
teste: apps/web/src/componentes/ui/botao-secundario.test.ts
- const raizDaWeb = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
+ const raizDaWeb = join(dirname(fileURLToPath(import.meta.url)), '..')
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › reprova import, import type
- selector: 'ImportExpression[source.value=/(^|\\x2f)(api|areas|sessao)(\\x2f|$)/]',
+ selector: 'ImportExpression[source.value=/(^|\\x2f)(api|areas)(\\x2f|$)/]',
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › o eslint-disable-next-line de uma importação dinâmica
- export const REGRAS_DE_ENTRADA = ['no-restricted-syntax']
+ export const REGRAS_DE_ENTRADA = []
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª), 3 | Gravar `.processo/chunks-depois.txt` no mesmo formato de `chunks-antes.txt` | Recusada: `.processo/` não entra no git, e o `frontend-reviewer` (1ª) refez o build numa pasta de rascunho e conferiu os 155 chunks com o mesmo nome e a entrada (`index-*`) em 90880 B. O `/validar` refaz o build por conta dele |
| frontend-reviewer (1ª), 4 | Os documentos de `.reengenharia/` citam os caminhos antigos | Recusada: o próprio revisor diz que estão datados no diagnóstico e não pedem ajuste |
| frontend-reviewer (1ª), 5 | A divergência de commit único está registrada | Não é pedido de mudança; o `revisor-geral` (1ª) também confirma que ela se sustenta |
| test-engineer (2ª) | A linha da tabela de testes que diz "tirar as duas regras de `REGRAS_DAS_GUARDAS`" cita as duas regras num só teste; hoje `REGRAS_DO_KIT` e `REGRAS_DE_ENTRADA` têm cada uma o seu teste | Recusada: é texto de tabela do documento da tarefa, e as 23 mutações do portão já citam cada teste pelo nome |
| revisor-geral (2ª) | `DialogoDoConvite.tsx:27` diz "o `Dialogo` de `componentes/`", e a peça mora em `componentes/ui/sobrepostos/` | Próxima tarefa que tocar `DialogoDoConvite.tsx`; o comentário é vago, não falso |
| revisor-geral (2ª), frontend-reviewer (2ª) | A linha 3 do README da `ui/ia/` passa de 120 colunas | Próxima tarefa que tocar o README; acabamento |
| frontend-reviewer (2ª) | `tasks/correcoes/2026-10-19-interface-parte-a.md:27` cita `componentes/onca/CabecaOnca.test.tsx` | Recusada: registro datado de correção fechada |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 13:56:44 | 2026-10-22 13:57:56 | `frontend-reviewer` | 1 | APROVADO | abc54d91b73837595 |
| 2026-10-22 13:56:48 | 2026-10-22 13:59:00 | `revisor-geral` | 1 | REPROVADO | a2f7b19748db683a0 |
| 2026-10-22 13:56:46 | 2026-10-22 13:59:47 | `test-engineer` | 1 | APROVADO | a1e63d534f1a7b5cd |
| 2026-10-22 14:16:55 | 2026-10-22 14:17:21 | `frontend-reviewer` | 2 | APROVADO | a009d946a143588d1 |
| 2026-10-22 14:16:59 | 2026-10-22 14:17:39 | `test-engineer` | 2 | APROVADO | a0c13a3a9032e0fe0 |
| 2026-10-22 14:17:03 | 2026-10-22 14:18:01 | `revisor-geral` | 2 | APROVADO | acef746b4b500c018 |
