# Tarefa 8.0 — Escola › Material em tabela, com o envio num diálogo

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba Material mostra os materiais da escola em tabela, com o que falhou primeiro; "Enviar material" abre um diálogo com o formulário de hoje; e cada linha abre um painel com o que foi declarado, "Tentar de novo" e "Excluir".

## Contexto necessário

- `techspec.md` seções 5 (`?material=`), 7c ("Releitura") e 9 ("Material"); `prd.md` RF15, RF22 e seção 6 ("Licença do material")
- `mockup.md` seção 3.7
- `docs/decisoes.md` D5 e D75; `.claude/rules/20-lgpd-menores.md` item 7
- Código: `apps/web/src/areas/coordenacao/Material.tsx` inteiro e `material-envio.ts`, que **não muda** (a validação, a recusa sem licença que vai à API sem o arquivo, o que o "Tentar de novo" devolve ao formulário); `apps/web/src/api/material.ts` (`intervaloDaLista`)

## Subtarefas

- [x] 8.1 — A tabela, na região "Materiais da escola": Material (o título), Disciplina, Licença e Situação (`Estado`: "Não carregou" ou "Envio recusado", "Processando", "Pronto · N páginas"). O que falhou vem primeiro; depois, o mais novo
- [x] 8.2 — "Enviar material", o único botão `primario`, abre o `Dialogo` com os campos, os rótulos, os `data-campo` e os erros de hoje, o arquivo arrastado ou escolhido pelo botão, e a declaração
- [x] 8.3 — A linha abre o `PainelLado` (`?material=<id>`): a situação, o motivo da falha, de quem é, quem deu a licença, a licença e as páginas. No rodapé, "Tentar de novo" (só no que falhou, abre o diálogo com o que ele declarava) e "Excluir material" (a confirmação de perigo de hoje)
- [x] 8.4 — A lista continua se relendo sozinha só enquanto há material processando, e para
- [x] 8.5 — O vazio "Nenhum material ainda", com "Enviar material". Nenhuma frase nova sobre treino de IA: fica o texto de hoje
- [x] 8.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Material.tsx` | alterado |
| `apps/web/src/areas/coordenacao/PainelDoMaterial.tsx`, `apps/web/src/areas/coordenacao/Material.test.tsx` | novo |
| `e2e/material.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |
| `e2e/__fixtures__/fluxo-do-professor.ts` | alterado |
| `apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx`, `apps/web/src/areas/coordenacao/materiais-da-escola.ts`, `apps/web/src/areas/coordenacao/materiais-da-escola.test.ts` | novo |
| `apps/web/src/areas/coordenacao/pecas-da-lista.tsx`, `apps/web/src/areas/coordenacao/Professores.tsx`, `apps/web/src/areas/coordenacao/endereco-da-tela.ts`, `apps/web/src/caminhos.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | carregando; erro com "Tentar de novo"; vazio com "Enviar material"; com dado nas três situações, o que falhou primeiro; o foco depois de enviar e de excluir |
| sem licença | e2e | o caso de hoje: "Envio recusado" e por quê; o arquivo não sai do computador, nada vira material e a recusa fica na auditoria |
| formulário incompleto | e2e | o caso de hoje: o que falta em cada campo; o que não é PDF é recusado na tela, sem pedido à API |
| arrastar e teclado | e2e | o caso de hoje, dentro do diálogo: nada só funciona arrastando |
| processando vira pronto | e2e | o caso de hoje: a lista se atualiza sem recarregar e para de reler |
| excluir | e2e | o caso de hoje, pelo painel: cancelar não exclui; confirmar tira o material e os trechos |
| um botão cheio | e2e | o caso de hoje: só "Enviar material" é `primario` na tela |
| recomeço: segunda pessoa; o painel pelo endereço; falha com o diálogo aberto; reabrir o diálogo | e2e | o rascunho e o aviso da tentativa anterior saem; o `?material=` de A na sessão de B não abre nada |

## Como testar

- `e2e/material.spec.ts`: os nove casos ficam; o formulário passa a estar dentro do diálogo (`getByRole('dialog')` no lugar de `main`)
- `montarEscolaEEntrar`, de `fluxo-do-professor.ts`, que `a2-assistente` e `a3-a4-professor` usam: abre o diálogo antes de preencher
- O caso do padding do `main` e de `[data-tela]`: vale a medida da X1
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/Material.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/material.spec.ts`
- Armadilha: o `<input type="file">` escondido continua com o `data-testid` de hoje
- Telas: `coordenacao`, `/coordenacao/material`, com `text=Enviar material` e com o clique na primeira linha; também com `--vazia`; mockup `/coordenacao/escola?aba=material`

## Fora do escopo desta tarefa

"Retirar do uso" com motivo em texto; "Enviar outra versão" como ação própria; trocar os campos "De quem é o material" e "Quem deu a licença" por "Dono".

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A tabela não tem o teto de linhas com "Mostrar mais" que a seção 7 prevê para Material | A lista já vem limitada pelo teto de páginas de `consultaMateriais`, com o aviso de lista incompleta; o corte com "Mostrar mais" é comportamento novo e vai ao `TODO.md` | `techspec.md` §9 "Como ficou na 8.0" (e §7) |
| "Disciplina" e "De quem é o material" ficam empilhados no diálogo, e não lado a lado | O texto da titularidade mais longa (42 caracteres) é cortado em meia caixa de 520 px, e a titularidade declarada precisa ser legível por quem a declara (D5, D75) | `techspec.md` §9 "Como ficou na 8.0" |
| A recusa por licença é uma linha da tabela (com "Dispensar"), e o diálogo fica aberto com o motivo | Antes a recusa era um aviso do formulário; com o formulário num diálogo, a recusa precisa continuar à vista depois de fechá-lo, e o mockup 3.7 a põe na tabela | `techspec.md` §9 "Como ficou na 8.0" |
| Cada abertura do diálogo é um formulário novo, e o "Tentar de novo" abre o envio com o que o material declarava, sem a declaração marcada | A declaração é de quem envia, a cada envio; o rascunho da tentativa anterior não pode voltar | `techspec.md` §9 "Como ficou na 8.0" |
| A situação do que falhou diz "Não carregou", também na confirmação de excluir | Um só texto para o mesmo estado, em texto e não só em cor | `techspec.md` §9 "Como ficou na 8.0" |
| O texto do vazio perdeu "pelo formulário acima" | O formulário agora está num diálogo, não acima | `techspec.md` §9 "Como ficou na 8.0" |
| Arquivos além dos previstos: `DialogoDeEnvioDeMaterial.tsx`, `materiais-da-escola.ts` e seu teste, `pecas-da-lista.tsx`, `Professores.tsx`, `endereco-da-tela.ts`, `caminhos.ts` | O diálogo e a ordem da tabela ficam fora de `Material.tsx` para ter teste próprio; `CLASSES_DO_BOTAO_DA_LINHA` é compartilhada com Professores; o parâmetro novo entra no endereço | `techspec.md` §9 "Como ficou na 8.0" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/coordenacao/materiais-da-escola.ts
teste: apps/web/src/areas/coordenacao/materiais-da-escola.test.ts › o que a situação diz
- return material.estado === 'falhou' ? 'Não carregou' : textoDoEstado(material)
+ return textoDoEstado(material)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/materiais-da-escola.ts
teste: apps/web/src/areas/coordenacao/materiais-da-escola.test.ts › o que a situação diz
- return recusa.motivo === 'sem_licenca' ? 'Envio recusado · sem licença' : 'Envio recusado · sem declaração'
+ return 'Envio recusado · sem licença'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/materiais-da-escola.ts
teste: apps/web/src/areas/coordenacao/materiais-da-escola.test.ts › a ordem da tabela
- const maisNovosPrimeiro = doMaisNovoAoMaisAntigo(itens)
+ const maisNovosPrimeiro = itens
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/materiais-da-escola.ts
teste: apps/web/src/areas/coordenacao/materiais-da-escola.test.ts › a ordem da tabela
- ...recusas.map((recusa): LinhaDoMaterial => ({ tipo: 'recusa', recusa })),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/materiais-da-escola.ts
teste: apps/web/src/areas/coordenacao/materiais-da-escola.test.ts › a ordem da tabela
- ...maisNovosPrimeiro.filter((material) => material.estado === 'falhou').map((material): LinhaDoMaterial => ({ tipo: 'material', material })),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/materiais-da-escola.ts
teste: apps/web/src/areas/coordenacao/materiais-da-escola.test.ts › a ordem da tabela
- ...maisNovosPrimeiro.filter((material) => material.estado !== 'falhou').map((material): LinhaDoMaterial => ({ tipo: 'material', material })),
+ ...maisNovosPrimeiro.filter((material) => material.estado === 'pronto').map((material): LinhaDoMaterial => ({ tipo: 'material', material })),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/materiais-da-escola.ts
teste: apps/web/src/areas/coordenacao/materiais-da-escola.test.ts › o material que o endereço abre
- return materiais.find((material) => material.id === id)
+ return materiais.find((material) => material.id !== id)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/materiais-da-escola.ts
teste: apps/web/src/areas/coordenacao/materiais-da-escola.test.ts › devolve ao formulário
- declaracao: false,
+ declaracao: true,
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/materiais-da-escola.ts
teste: apps/web/src/areas/coordenacao/materiais-da-escola.test.ts › devolve ao formulário
- licenciante: material.licenciante ?? '',
+ licenciante: '',
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › confirmar tira o material da lista e do endereço
- if (new URLSearchParams(busca).get(PARAMETRO_DO_MATERIAL) === materialId) fecharPainel()
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › cuja releitura cai não afirma o vazio
- materiais.isError ? (
+ false ? (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › reabrir o diálogo começa de um formulário novo
- const semNada = lista !== undefined && lista.itens.length === 0 && recusas.length === 0
+ const semNada = lista !== undefined && lista.itens.length === 0
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › duas recusas
- definirRecusas((atuais) => [recusa, ...atuais])
+ definirRecusas((atuais) => [...atuais, recusa])
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › abrir o diálogo apaga o anúncio
- definirAnuncio('')
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › a linha abre o painel no endereço, só com o id
- const fecharPainel = (): void => navegar(enderecoComParametro(caminho, busca, PARAMETRO_DO_MATERIAL, undefined), { replace: true })
+ const fecharPainel = (): void => navegar(enderecoComParametro(caminho, busca, PARAMETRO_DO_MATERIAL, undefined))
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › já nasce aberto, sem clique
- if (document.activeElement === document.body) titulo?.focus()
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › o envio com licença: o PDF sobe
- definirAnuncio(TEXTO_DO_ENVIO)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › o envio com licença: o PDF sobe
- dialogo.fecharSeAinda(aberta)
 definirAnuncio(TEXTO_DO_ENVIO)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › abre o envio com o que o material declarava
- inicial={alvo === undefined ? RASCUNHO_VAZIO : rascunhoDoMaterialQueFalhou(alvo)}
+ inicial={RASCUNHO_VAZIO}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › o envio novo de um material que falhou o troca
- {...(alvo === undefined ? {} : { substitui: alvo.id })}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › o envio novo de um material que falhou o troca
- if (substituiu !== undefined) tirarDoEndereco(substituiu)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › com dois materiais processando, o leitor de tela ouve o número
- const emLeitura = lista === undefined ? 0 : lista.itens.filter((material) => material.estado === 'processando').length
+ const emLeitura = lista === undefined ? 0 : lista.itens.filter((material) => material.estado !== 'processando').length
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › é o único botão cheio da tela
- <Botao onClick={() => abrir('enviar')}>Enviar material</Botao>
+ <Botao variante="secundario" onClick={() => abrir('enviar')}>Enviar material</Botao>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › o aviso fica sobre a tabela
- <Botao variante="secundario" onClick={() => void materiais.refetch({ cancelRefetch: false })}>
+ <Botao onClick={() => void materiais.refetch({ cancelRefetch: false })}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › o envio novo de um material que falhou o troca
- if (substitui !== undefined) await excluirMaterial(substitui).catch(() => undefined)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › o pedido: a recusa sai sem o arquivo
- enviar({ campos, arquivo: recusa === null ? arquivo : undefined })
+ enviar({ campos, arquivo })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › o arquivo que não é PDF é recusado na tela
- if (arquivos.length > 1) return definirErroDoArquivo(TEXTO_DE_UM_ARQUIVO_POR_VEZ)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › a falha do envio some quando a pessoa escolhe outro arquivo
 async function receberArquivos(arquivos: FileList | null): Promise<void> {
- definirFalha(undefined)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › a dica do "Tentar de novo"
- {substitui !== undefined && <p className="text-apoio">Escolha o arquivo de novo, marque a declaração e envie. O material que falhou sai da lista quando o novo entrar.</p>}
+ {<p className="text-apoio">Escolha o arquivo de novo, marque a declaração e envie. O material que falhou sai da lista quando o novo entrar.</p>}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › sem disciplina na escola
- {!comFormulario ? (
+ {false ? (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › abre o envio com o que o material declarava
- <Dialogo titulo="Enviar material" aoFechar={aoFechar} focoInicial={botaoDoArquivo} focoDeReserva={focoDeReserva}>
+ <Dialogo titulo="Enviar material" aoFechar={aoFechar} focoDeReserva={focoDeReserva}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › enquanto o envio está no ar
- <Botao type="submit" disabled={mutacao.isPending || conferindo}>
+ <Botao type="submit" disabled={conferindo}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › enquanto o envio está no ar
- {mutacao.isPending ? 'Enviando…' : 'Enviar material'}
+ {'Enviar material'}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › sem licença o diálogo diz "Envio recusado"
- aoRecusar(envio.campos, motivo)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › o seletor de arquivo fechado sem escolha não fecha o diálogo
- entrada.addEventListener('cancel', reter)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › o material pronto mostra as páginas
- {material.estado === 'falhou' && (
+ {true && (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › a linha abre o painel no endereço, só com o id
- {material.falha !== null && <p className="break-words text-erro">{MENSAGEM_DA_FALHA_DE_MATERIAL[material.falha]}</p>}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › a linha abre o painel no endereço, só com o id
- {material.licenciante !== null && <Dado rotulo="Quem deu a licença">{material.licenciante}</Dado>}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › o material pronto mostra as páginas
- {material.licenciante !== null && <Dado rotulo="Quem deu a licença">{material.licenciante}</Dado>}
+ {<Dado rotulo="Quem deu a licença">{material.licenciante}</Dado>}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › a linha abre o painel no endereço, só com o id
- <Dado rotulo="Páginas">{material.paginas === null ? '—' : String(material.paginas)}</Dado>
+ <Dado rotulo="Páginas">{String(material.paginas)}</Dado>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/PainelDoMaterial.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › é o único botão cheio da tela
- <Botao variante="perigo" onClick={aoExcluir}>
+ <Botao onClick={aoExcluir}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/DialogoDeEnvioDeMaterial.tsx
teste: e2e/material.spec.ts › cabe inteiro
- <div className="grid min-w-0 gap-4">
+ <div className="grid min-w-0 gap-4 md:grid-cols-2">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › a resposta que chega com o diálogo já fechado
- dialogo.fecharSeAinda(aberta)
+ fecharDialogo()
 definirAnuncio(TEXTO_DO_ENVIO)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › cuja releitura cai não afirma o vazio
- const focarNaLista = useCallback(() => (tituloDaLista.current === null ? focarOTituloDaMoldura() : tituloDaLista.current.focus()), [focarOTituloDaMoldura])
+ const focarNaLista = useCallback(() => tituloDaLista.current?.focus(), [])
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › sem licença o diálogo diz "Envio recusado"
- <span className="font-semibold break-words text-tinta">{linha.recusa.titulo}</span>
+ <button type="button" onClick={() => aoAbrir(linha.recusa.titulo)} className={CLASSES_DO_BOTAO_DA_LINHA}>{linha.recusa.titulo}</button>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › sem licença o diálogo diz "Envio recusado"
- { chave: 'disciplina', titulo: 'Disciplina', celula: (linha) => nomeDaDisciplina(linha.tipo === 'material' ? linha.material.disciplinaId : linha.recusa.disciplinaId) },
+ { chave: 'disciplina', titulo: 'Disciplina', celula: (linha) => nomeDaDisciplina(linha.tipo === 'material' ? linha.material.disciplinaId : '') },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › sem licença o diálogo diz "Envio recusado"
- celula: (linha) => nomeDaLicenca(linha.tipo === 'material' ? linha.material.licenca : linha.recusa.licenca),
+ celula: (linha) => nomeDaLicenca(linha.tipo === 'material' ? linha.material.licenca : 'autoria_da_escola'),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › a linha abre o painel no endereço, só com o id
- const abrirPainel = (materialId: string): void => navegar(enderecoComParametro(caminho, busca, PARAMETRO_DO_MATERIAL, materialId))
+ const abrirPainel = (materialId: string): void => navegar(enderecoComParametro(caminho, busca, PARAMETRO_DO_MATERIAL, lista?.itens.find((material) => material.id === materialId)?.titulo))
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › a confirmação diz o que acontece; cancelar não exclui nada
- { rotulo: 'Situação', valor: textoDaSituacaoDoMaterial(material) },
+ { rotulo: 'Situação', valor: material.estado },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/materiais-da-escola.ts
teste: apps/web/src/areas/coordenacao/materiais-da-escola.test.ts › o nome da licença na coluna
- return OPCOES_DE_LICENCA.find((opcao) => opcao.valor === licenca)?.rotulo ?? '—'
+ return '—'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › a sessão que muda de dono fecha o diálogo e leva as recusas
- definirRecusas([])
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › a sessão que muda de dono fecha o diálogo e leva as recusas
- fecharDialogo()
 definirRecusas([])
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Material.tsx
teste: apps/web/src/areas/coordenacao/Material.test.tsx › sem licença o diálogo diz "Envio recusado"
- Dispensar <span className="sr-only">o aviso de {linha.recusa.titulo}</span>
+ Dispensar
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | Quando o "Tentar de novo" dá certo, o material que falhou é excluído por um segundo pedido, e o erro é engolido; o recomendado é a API fazer a troca numa operação só, com auditoria ligando o antigo ao novo, e avisar na tela se a exclusão falhar | `TODO.md`: muda contrato da API e a tarefa é só de tela |
| frontend-reviewer (1ª) | Tech Spec §7: "Material, Pedidos e IA têm teto de linhas com 'Mostrar mais'"; a 8.0 não o entrega | `TODO.md`; a divergência está em "Divergências resolvidas nesta tarefa", com a coluna "Onde está na spec" preenchida |
| frontend-reviewer (1ª) | A barra de abas da Escola quebra em duas linhas no celular | `TODO.md`: já existia antes da tarefa e afeta as três abas; é da moldura, fora de `Material` |
| frontend-reviewer (1ª) | O texto de "sem disciplina na escola" cita "Escola › Turmas" sem link | `TODO.md`: comportamento novo (navegação), não é ajuste de texto |
| revisor-geral (1ª) | O texto de conflito do envio diz "lista abaixo" com o formulário agora num diálogo | `TODO.md`, ou a próxima tarefa que tocar `material-envio.ts`: o arquivo está congelado por esta tarefa |
| revisor-geral (1ª) | Código morto em `material-envio.ts` (`origemDoMaterial`, ramo `'Falhou'` de `textoDoEstado`) | `TODO.md`: o arquivo está congelado por esta tarefa |
| revisor-geral (1ª) | `fila-da-coordenacao.ts:121` escreve `'material'` à mão em vez de `PARAMETRO_DO_MATERIAL` | `TODO.md`: o arquivo não é da tarefa |
| privacy-guardian (2ª) | Uma recusa que chega depois da troca de sessão ainda pode entrar na tabela de quem entrou depois; a correção seria um contador de sessão no `Material`, com um caso de teste | `TODO.md`, item (X2, 8.0): comportamento novo, não é ajuste. O texto é título de material, não dado de aluno |
| privacy-guardian (2ª) | O comentário em `Material.tsx` cita "regra 20, item 15"; a justificativa certa é a regra 10 mais o RF14 que `sessao.ts` já cita | `TODO.md`, item (X2, 8.0), ou a próxima tarefa que tocar `Material.tsx`: só comentário |
| frontend-reviewer (2ª) | A 360 px a titularidade escolhida de 42 caracteres fica cortada no `select`; encurtar o nome em `NOME_DA_TITULARIDADE` resolve; o e2e deveria medir também no `celular` | Já está no `TODO.md`, item (X2, 8.0) (g) |
| frontend-reviewer (2ª) | Foto da tabela com linhas e do painel lateral, semeando materiais na vitrine, antes de fechar a spec | `TODO.md`, item (X2, 8.0): o Validador fotografa no fim da spec; as escolas da vitrine não têm material |
| revisor-geral (2ª) | `techspec.md` §7 ainda diz "Material, Pedidos e IA têm teto de linhas com 'Mostrar mais'" e a §9 diz que Material não tem | `TODO.md`, item (X2, 8.0): a Tech Spec é do Arquiteto; a frase da §7 se ajusta no próximo commit de documento da spec |
| revisor-geral (2ª) e test-engineer (2ª) | O e2e "cabe inteiro, também na opção mais longa" sai no celular e o nome diz mais do que prova; renomear para dizer que a medida vale só na largura do computador | `TODO.md`, item (X2, 8.0) (g), junto com a correção do corte no celular |
| revisor-geral (2ª) | Confirmar com o `frontend-reviewer` que ele aceita adiar o item (g) | Respondida: o `frontend-reviewer` leu o item (g) na 2ª rodada, aprovou e o registrou como recomendação. Nenhuma ação |
| test-engineer (2ª) | O bloco de `abrirPainel` fica vermelho cedo demais: um bloco que mantém o id e acrescenta o título provaria direto a asserção do endereço | `TODO.md`, item (X2, 8.0): o bloco atual já fica vermelho; trocá-lo só melhora o diagnóstico |
| test-engineer (2ª) | O "+24" da seta e do recuo no e2e "cabe inteiro" é estimado; se ficar instável na esteira, medir a área de conteúdo do próprio `select` | `TODO.md`, item (X2, 8.0): só se o e2e ficar instável na esteira |
| test-engineer (2ª) | O teste de troca de sessão dispara os ouvintes guardados à mão; se `api/sessao` tiver função pública que dispare a troca, usá-la e tirar o `vi.mock` | `TODO.md`, item (X2, 8.0): ajuste de teste fora do que a tarefa pede |

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
| 2026-10-17 14:07:16 | 2026-10-17 14:08:27 | `privacy-guardian` | 1 | APROVADO | a440bc8be0fdbff77 |
| 2026-10-17 14:07:13 | 2026-10-17 14:08:44 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a80e7edb59906ff28 |
| 2026-10-17 14:07:21 | 2026-10-17 14:09:27 | `revisor-geral` | 1 | APROVADO | a164f907d85161fb4 |
| 2026-10-17 14:07:18 | 2026-10-17 14:10:15 | `test-engineer` | 1 | REPROVADO | a3e3accd6ab57ca9b |
| 2026-10-17 14:32:36 | 2026-10-17 14:33:05 | `frontend-reviewer` | 2 | APROVADO | abd79cd0f3d7e000e |
| 2026-10-17 14:32:40 | 2026-10-17 14:33:23 | `privacy-guardian` | 2 | APROVADO | a35e1a157cd3142a9 |
| 2026-10-17 14:32:51 | 2026-10-17 14:33:33 | `revisor-geral` | 2 | APROVADO | af4f194f05f9d02cd |
| 2026-10-17 14:32:47 | 2026-10-17 14:34:42 | `test-engineer` | 2 | APROVADO | a5e14b772a2d1d623 |
