# Relatório final — reengenharia (X5)

Arquiteto, 23/10/2026, depois da validação 1 (REPROVADA por um teste vermelho, `validacao.md` §5) e antes da revalidação.
Compara com a linha de base (`LINHA-DE-BASE.md` §5, medida em 20/10 em `08dc125`) **só o que foi medido de novo**. O que
não foi medido está dito, com o porquê.

**Commit medido:** `5283042` (o último com código é `2b68e74`; depois dele só entraram documentos) · **Máquina:** a da
linha de base · **Recorte:** o de 22/10 (D81, `RECORTE.md`, `prd.md` §11): 36 tarefas na X5, o resto na X6.

## 1. O que foi feito

| Item do recorte | Tarefas | O que mudou |
|---|---|---|
| Onda 0: defeitos de conformidade | 1.0 a 5.0, 93.0, 94.0 | o `ouro` selado e medido; risco à vida com um padrão por jeito de dizer, e o modelo somando à regra (D36); julgamento de texto de aluno barrado na entrada e na saída (D55); a avaliação aberta depois do 202 pausa o Tutor; o hook bloqueia quando não carrega |
| Tenant travado por máquina | 6.0 a 9.0 | repository sem prova de escopo nem motivo reprova o teste; as cópias locais leem `exigirEscolaDoContexto`; a IA tira a escola do contexto; tabela importada fora de repository reprova o lint |
| Prova | 51.0, 53.0 | resposta atrasada não sobrescreve a mais nova (`sequencia` no banco); a escolha pendente sobrevive ao F5 e à sessão vencida |
| Entrada no padrão NestJS | 14.0 a 17.0 | toda rota valida pelo `ZodValidationPipe` e pelo `IdPipe`; o lint reprova `@Body()` e `@Query()` sem pipe em todo controller |
| Jobs tipados | 18.0, 19.0 | `DEFINICOES_DE_JOB` por zod: o payload inválido é recusado ao enfileirar e no worker |
| Resiliência | 43.0, 44.0, 48.0 | prazo por tipo de job (`TEMPO_ESGOTADO`); a falha final alerta, com runbook, e fica 30 dias; o provedor lento, o 429 e o fora falham rápido pelo `cockatiel` |
| Pastas | 33.0 a 36.0, 96.0, 97.0 | `credencial/`, `sessao/` por fluxo, `ops/` só terminal, `componentes/ui/`, uma subpasta por recurso na API e *feature folder* na web; pasta com mais de 25 arquivos reprova |
| Camadas e lint | 10.0 a 13.0 | os três ciclos somem; `dependency-cruiser` com direção, camada e ciclo; a catraca de complexidade com as supressões nativas do ESLint |
| Higiene | 24.0, 25.0, 90.0 | `knip` nas dependências; todo `throw` de produção tipado; um Dockerfile com `target` |
| Documentação | 95.0 | `docs/guia-do-desenvolvedor.md`, `docs/arquitetura.md` corrigido, o `README.md` apontando para o guia |

## 2. Contra a linha de base

| Medida | 20/10 (`08dc125`) | 23/10 (`5283042`) | Como |
|---|---|---|---|
| Ciclos e violações de camada | **3 ciclos**, 0 violação, 1.304 módulos, 6.104 dependências | **0 ciclos**, 0 violação, 1.351 módulos, 6.242 dependências | a mesma configuração da medição de 20/10 (`medicao/depcruise.cjs`, lido na tag `reengenharia/temporario`), dependency-cruiser 18.7.0 |
| Funções em produção acima de 10 de complexidade / 80 linhas / aninhamento 4 | 138 / 55 / 2 (com teste e fixture: 171 / 328 / 6) | 138 / 55 / 2 (com teste e fixture: 172 / 351 / 6) | o mesmo `eslint` da §3, sem o arquivo de supressões |
| Código morto (knip, configuração de 20/10) | 0 arquivos, 162 exports, 26 tipos; `pino` sem uso em dois apps, `tailwindcss` sem uso, 10 pacotes usados sem declarar (44 ocorrências) | 0 arquivos, **166 exports**, **30 tipos**; nenhuma dependência sem uso; `tailwindcss` (web) e `k6` (3 scripts de `infra/k6/`) | `knip@6.42.1` com `medicao/knip.json`. Na trava da 24.0 (`knip.json` da raiz, só dependências), limpo |
| Duplicação | 1,96 %, 398 clones, 4.921 linhas de 251.158, 1.427 arquivos; só produção: 49 clones, 599 linhas | 2,00 %, 412 clones, 5.280 linhas de 264.574, 1.508 arquivos; só produção: 49 clones, 599 linhas | `jscpd@5.4.1`, o mesmo comando |
| Vulnerabilidades, produção (crítica, alta, moderada) | 0 / 0 / 0 | 0 / 0 / 0 | `npm audit --omit=dev` |
| Vulnerabilidades, tudo | 0 / 2 / 4 | 0 / **3** / **6** | `npm audit`. As novas: `vite` 8.3.0 (alta, direta, correção em 8.3.5) e `vitest` 5.0.0 com o `@vitest/mocker` (moderadas, correção em 5.0.5) |
| Tipos | verde | verde | `npm run typecheck`, pelo Validador em 23/10 |
| Lint | verde | **vermelho** em `5283042` | a supressão órfã de `tools/ci/compose.ts` (validação 1, crítico 1). A correção `poda-supressao-orfa` entrou em `3c3d582`, depois desta medida |
| Dockerfiles, imagens e build | não medido (imagens do cache) | 172 → 113 linhas, 9 → 6 `npm ci`; imagens do mesmo tamanho; `build --no-cache` 80 s → 78 s | `medidas-da-onda-5.md` (90.0), commit pai contra o da tarefa |
| Esteira, de criada a concluída | 39,5 min | 46,5 min (run 39887437533, `4d0219d`, verde) | `gh run list`. É uma execução só, com a fila do GitHub dentro; não diz se a X5 deixou a esteira mais lenta |

**Leitura.**
- O que a X5 prometia medir se moveu como prometido: os ciclos foram a zero e ficaram travados, e as dependências foram
  declaradas onde são usadas.
- A complexidade não caiu, e não era para cair: a 13.0 congela o que existe e reprova a função nova. Cortar as telas e os
  serviços grandes é a onda 4, que foi para a X6.
- Os 4 exports e 4 tipos a mais sem uso não têm trava: a 24.0 trava só as dependências, e o resto do `knip` está na X6.
- A duplicação de produção ficou igual. Os 14 clones e as 359 linhas duplicadas a mais estão em teste, e2e ou infra, no
  meio de 13 mil linhas novas.
- O `vite` alto entra no `TODO.md`. A imagem `web` roda `vite preview` (`medidas-da-onda-5.md`), e por isso ele precisa
  subir antes do staging.

## 3. O que não foi medido nesta rodada

- **A suíte inteira** (casos, vermelhos e tempo de unidade, integração, e2e e infra) e a **cobertura**. Elas pedem o banco e
  a fila de carga da máquina, e a linha 1 está corrigindo o lint em paralelo. O portão completo e a esteira do commit de
  pouso dão esses números, e a revalidação os confere.
- **O JS de entrada da web e o tamanho das imagens** contra a §4. Pedem build. As imagens só foram medidas na 90.0.
- **A onda 0** não tem linha na §5 da linha de base, porque o `ouro` nasceu na 1.0. Os números dela estão no `onda-0.md`:
  - risco à vida no lote retido 1: de 8/75 para 23/75;
  - risco à vida no lote retido 2: base 31/75; com a regra, 37/75; com a regra ou o modelo, 51/75, abaixo do alvo (R59);
  - D55 no lote retido 1: saída 22/58 e entrada 33/57, abaixo do alvo (R60);
  - o `ouro` está no alvo (riscoAVida 75/75, precisão 1).

## 4. O que ficou pendente

- **Antes do pouso:** o portão completo, com o lint depois da correção `3c3d582`, a esteira verde no último commit com
  código e a revalidação. A revalidação confere também o RF31 (`saida-do-temporario.md`, R64) e este relatório.
- **Na X6** (`tasks.md`, "Saíram para a X6", e o `ROADMAP.md`):
  - antes do portão do piloto: a IA e o PDF no worker, o prazo do cliente e o Redis fora (42.0, 45.0 a 47.0, 49.0, 50.0,
    52.0, 54.0);
  - junto da X4 ou do F2: a onda 4, de tela (55.0 a 80.0);
  - o resto: o OpenAPI, as políticas em `conformidade/` com as lacunas da onda 0 (26.0 a 29.0), os subcaminhos e as
    leituras da onda 2, a onda 5 e a Etapa 9, o harness, com as perguntas do `DIAGNOSTICO.md` §5.
- **No `TODO.md`:**
  - a seção "Da X5 (reengenharia), fora dela": o §6 do diagnóstico, as recomendações das tarefas e as seis precisões do
    guia (95.0);
  - o `vite` e o `vitest`;
  - o encontro das linhas rodar o `eslint .` depois do merge, para a X6 (validação 1, menores).
- **Para o Joaquim, antes do piloto:** a AIA do Tutor, com a lacuna medida do risco à vida (`estado.md`).
