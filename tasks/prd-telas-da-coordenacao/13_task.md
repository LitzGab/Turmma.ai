# Tarefa 13.0 — Registros › Privacidade: prazos, empresas e incidentes num seletor

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba Privacidade de Registros mostra, uma por vez, as três telas que eram abas: por quanto tempo a escola guarda cada dado, as empresas que recebem dados e os incidentes, compostas com as peças novas, nos endereços de hoje.

## Contexto necessário

- `techspec.md` seções 5 (os três endereços) e 9 ("Privacidade"); `prd.md` RF17, RF22, RF23
- `mockup.md`: o mockup não tem estas telas; valem o padrão de página da D80 (item 6) e a tabela da seção 5.3
- `.claude/rules/20-lgpd-menores.md` itens 15, 16 e 19
- Código: `apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx` (o `Segmentado` já entrou na 3.0), `Retencao.tsx`, `EmpresasQueRecebemDados.tsx`, `Incidentes.tsx`, `DetalhesDoIncidente.tsx` e `confirmar-o-incidente.ts`; os cinco `textos-*.ts`, que **não mudam**

## Subtarefas

- [x] 13.1 — O seletor "Prazos de guarda", "Empresas" e "Incidentes": grupo de rádio pelas setas, com a escolha no endereço; cada seção guarda o título por extenso de hoje ("Por quanto tempo guardamos", "Empresas que recebem dados", "Incidentes")
- [x] 13.2 — Prazos: as categorias em `Tabela` (o dado, o prazo que vale e de onde ele vem) e a região "Prazos que não mudam"
- [x] 13.3 — Empresas: as vigentes e as passadas em `Tabela`, com o que cada uma faz, recebe e onde processa; os vazios de hoje
- [x] 13.4 — Incidentes: os sem confirmação primeiro, cada aviso num `Cartao` com todos os campos (`white-space: pre-line`) e "Confirmo que recebi" em botão oficial; a falha fica só no cartão que falhou
- [x] 13.5 — O `AvisoDeIncidente` (diálogo e faixa) não muda de comportamento: uma leitura por sessão, e a faixa some quando a aba confirma
- [x] 13.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx`, `apps/web/src/areas/coordenacao/privacidade/Retencao.tsx` | alterado |
| `apps/web/src/areas/coordenacao/privacidade/EmpresasQueRecebemDados.tsx`, `apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx` | alterado |
| `apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx` | novo |
| `e2e/privacidade.spec.ts`, `e2e/incidentes.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | cada uma das três: carregando; erro com "Tentar de novo"; vazio só com a leitura terminada; com dado; "só passadas" nas empresas |
| o endereço guarda a escolha | componente | cada endereço abre a opção dele; o que não existe cai em Pedidos, como hoje; trocar de opção navega |
| a retenção de hoje | e2e | o prazo que vale, de onde vem e os prazos fixos; a troca de escola não mostra a retenção da anterior, nem enquanto a nova não chegou |
| as empresas de hoje | e2e | vigentes e passadas da escola dela, e nenhuma de outra escola |
| a confirmação do incidente | e2e | os casos de `incidentes.spec.ts`: duas coordenadoras, a primeira confirmação é a que vale; o clique duplo manda uma só; a falha só no cartão |
| os sem confirmação primeiro | e2e | `incidentes.spec.ts › dois incidentes: os dois esperam…`: o que espera a confirmação vem antes do confirmado, na ordem que a API dá (a unidade só prova que a tela a mantém) |
| a faixa do aviso adiado não faz a página rolar | e2e | `incidentes.spec.ts › com seis avisos longos esperando…` (miolo com abas, em Registros) e `› com o aviso adiado, a Analista…` (miolo sem abas), a 1366 × 600; e a unidade (`AvisoDeIncidente.test.tsx`) prova que a faixa é observada, mede de novo, e para de medir quando sai |
| recomeço: segunda pessoa; troca de escola; falha da confirmação | e2e | os casos de hoje, sem perder asserção |
| 360 px e teclado | e2e | o seletor pelas setas, numa parada de Tab; os botões do aviso com a mesma altura, de 44 px ou mais; sem rolagem de lado; axe |

## Como testar

- `e2e/privacidade.spec.ts`: onde hoje há `getByRole('tab', { name: 'Por quanto tempo guardamos' })`, a 3.0 já pôs o rádio do seletor; aqui muda só o que está dentro de cada seção
- `e2e/incidentes.spec.ts › carregando, erro com "Tentar de novo", vazio e com dado…` e `› a falha da confirmação aparece só no cartão…`
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/privacidade.spec.ts`
- A vitrine não semeia retenção, empresa nem incidente: semeie à mão e diga em "Telas vistas"
- Telas: `coordenacao`, `/coordenacao/privacidade/retencao`, `/coordenacao/privacidade/suboperadores`, `/coordenacao/privacidade/incidentes`; sem mockup

## Fora do escopo desta tarefa

Editar a retenção pela tela (é comando da operação); os Pedidos (12.0); "Configurações da escola" e Dossiê (F12).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O `Cartao` ganha a prop opcional `refDoTitulo` (o título passa a ter `tabIndex={-1}` e a ref) | O aviso confirmado perde o botão que tinha o foco, e o foco tem de ir ao título do cartão (comportamento de hoje, provado por `incidentes.spec`); o `Cartao` não deixava alcançar o título. Sem a prop nada muda nos outros cartões | `techspec.md` §2 (linha de `Cartao.tsx`) e §9 ("Como ficou na 13.0") |
| O cartão do incidente deixa de ser `article` e vira a região do `Cartao` (nome "Incidente conhecido em <data>"), e a seção "Incidentes de segurança que afetaram a escola" some: a frase de apoio dela passa para o `h2` da tela | A subtarefa 13.4 manda o `Cartao`, que é `section` rotulada; a seção com título viraria um `h3` ao lado dos cartões `h3`. O `e2e` `cartaoDa` passa a procurar a região, e o título por extenso da 13.1 é o `h2` que `Privacidade.tsx` desenha | `techspec.md` §9 ("Como ficou na 13.0") |
| A faixa do aviso de incidente (depois de "Ver depois") passa a medir a si mesma e gravar a altura em `--faixa-de-incidente`; as duas constantes do miolo (`O_MIOLO_QUE_ROLA`, `O_MIOLO_SEM_ABAS_QUE_ROLA`) descontam a variável | Achado ao medir a 13.0: com um aviso adiado a faixa fica fora do miolo e a página rola inteira (84 px a 1366 × 768), contra o RF23, em toda tela da coordenação. A tela dos incidentes é onde o aviso mora, e o teste de página que não rola não passa sem isto | `techspec.md` §9 ("Altura" e "Como ficou na 13.0") |
| As duas seções dos prazos e as duas das empresas descem para `h3` (`nivel={3}`), com os mesmos títulos e as mesmas regiões | A 13.1 põe o título por extenso da tela num `h2`; a ordem dos títulos não pode pular nem repetir o nível | `techspec.md` §9 ("Como ficou na 13.0") |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › o endereço /retencao
- retencao: { titulo: 'Por quanto tempo guardamos' },
+ retencao: { titulo: 'Prazos' },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › o endereço /suboperadores
- suboperadores: { titulo: 'Empresas que recebem dados' },
+ suboperadores: { titulo: 'Empresas' },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › o endereço /incidentes
  suboperadores: { titulo: 'Empresas que recebem dados' },
- incidentes: { titulo: 'Incidentes', apoio: 'O que a Turmma registrou sobre incidentes de segurança que afetaram a sua escola, só dela. Aqui a coordenação confirma que recebeu cada aviso.' },
+ incidentes: { titulo: 'Registro de incidentes', apoio: 'O que a Turmma registrou sobre incidentes de segurança que afetaram a sua escola, só dela. Aqui a coordenação confirma que recebeu cada aviso.' },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › o título dos incidentes leva a frase de apoio
  suboperadores: { titulo: 'Empresas que recebem dados' },
- incidentes: { titulo: 'Incidentes', apoio: 'O que a Turmma registrou sobre incidentes de segurança que afetaram a sua escola, só dela. Aqui a coordenação confirma que recebeu cada aviso.' },
+ incidentes: { titulo: 'Incidentes', apoio: 'O que a Turmma registrou sobre incidentes de segurança que afetaram a sua escola, só dela.' },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › o título dos incidentes leva a frase de apoio
- <CabecalhoDeSecao titulo={titulo} {...(apoio === undefined ? {} : { apoio })} />
+ <CabecalhoDeSecao titulo={titulo} />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Retencao.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › com dado: o prazo que vale
  id="titulo-das-categorias"
- nivel={3}
  titulo="O que a escola guarda, e por quanto tempo"
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Retencao.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › com dado: o prazo que vale
  id="titulo-dos-prazos-fixos"
- nivel={3}
  titulo="Prazos que não mudam"
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/EmpresasQueRecebemDados.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › com dado: as vigentes e as passadas
  id="titulo-das-vigentes"
- nivel={3}
  titulo="Empresas que recebem dado da escola hoje"
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/EmpresasQueRecebemDados.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › com dado: as vigentes e as passadas
  id="titulo-das-passadas"
- nivel={3}
  titulo="Empresas que já receberam dado da escola"
```

```mutacao
arquivo: apps/web/src/componentes/Cartao.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › o título só é focável por programa
- <Titulo id={idDoTitulo} ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="t-cartao min-w-0 break-words text-tinta">
+ <Titulo id={idDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="t-cartao min-w-0 break-words text-tinta">
```

```mutacao
arquivo: apps/web/src/componentes/Cartao.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › o título só é focável por programa
- <Titulo id={idDoTitulo} ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="t-cartao min-w-0 break-words text-tinta">
+ <Titulo id={idDoTitulo} ref={refDoTitulo} tabIndex={-1} className="t-cartao min-w-0 break-words text-tinta">
```

```mutacao
arquivo: apps/web/src/componentes/Cartao.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › o título só é focável por programa
- <Titulo id={idDoTitulo} ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="t-cartao min-w-0 break-words text-tinta">
+ <Titulo id={idDoTitulo} ref={refDoTitulo} className="t-cartao min-w-0 break-words text-tinta">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › com dado: cada aviso é um cartão
  titulo={`Incidente conhecido em ${textoDoConhecimento(incidente)}`}
- nivel={3}
  refDoTitulo={titulo}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › confirmar: o botão desliga
  nivel={3}
- refDoTitulo={titulo}
  acao={<Estado familia={pendente ? 'pendente' : 'ok'}>{textoDaConfirmacao(incidente)}</Estado>}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › com dado: cada aviso é um cartão
- acao={<Estado familia={pendente ? 'pendente' : 'ok'}>{textoDaConfirmacao(incidente)}</Estado>}
+ acao={<Estado familia="ok">{textoDaConfirmacao(incidente)}</Estado>}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › com dado: cada aviso é um cartão
- {pendente && (
+ {true && (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › a falha da confirmação aparece só no cartão que falhou
- {falha?.id === incidente.id ? falha.texto : ''}
+ {falha?.texto ?? ''}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › confirmar: o botão desliga
- disabled={confirmando !== undefined}
+ disabled={false}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › confirmar: o botão desliga
- {esteConfirmando ? 'Confirmando…' : 'Confirmo que recebi'}
+ {'Confirmo que recebi'}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Privacidade.test.tsx › confirmar: o botão desliga
- if (confirmou) titulo.current?.focus()
+ if (!confirmou) titulo.current?.focus()
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx
teste: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.test.tsx › com o diálogo aberto não há variável
- const VAO_DA_FAIXA_PX = 24
+ const VAO_DA_FAIXA_PX = 0
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx
teste: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.test.tsx › com o diálogo aberto não há variável
- raiz.style.removeProperty('--faixa-de-incidente')
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx
teste: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.test.tsx › a faixa acompanha a altura dela
- const medir = () => raiz.style.setProperty('--faixa-de-incidente', `${String(elemento.offsetHeight + VAO_DA_FAIXA_PX)}px`)
+ const medir = () => raiz.style.setProperty('--faixa-de-incidente', `${String(VAO_DA_FAIXA_PX)}px`)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx
teste: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.test.tsx › a faixa acompanha a altura dela
- const observador = new ResizeObserver(medir)
+ const observador = new ResizeObserver(() => undefined)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/miolo-que-rola.ts
teste: e2e/incidentes.spec.ts › com seis avisos longos esperando
- export const O_MIOLO_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-17rem-var(--faixa-de-incidente,0px))] md:overflow-y-auto'
+ export const O_MIOLO_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-17rem)] md:overflow-y-auto'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/miolo-que-rola.ts
teste: e2e/incidentes.spec.ts › com o aviso adiado, a Analista
- export const O_MIOLO_SEM_ABAS_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-13rem-var(--faixa-de-incidente,0px))] md:overflow-y-auto'
+ export const O_MIOLO_SEM_ABAS_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-13rem)] md:overflow-y-auto'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx
teste: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.test.tsx › a faixa acompanha a altura dela
- observador.observe(elemento)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx
teste: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.test.tsx › a faixa acompanha a altura dela
- observador.disconnect()
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx
teste: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.test.tsx › com o diálogo aberto não há variável
- medir()
  const observador = new ResizeObserver(medir)
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | `VAO_DA_FAIXA_PX = 24` copia o `gap-6` do `main` da casca; nada amarra os dois | `TODO.md`: muda o desenho da medição (medir até o próximo irmão, ou constante da casca usada pelos dois), e não cabe em poucas linhas |
| frontend-reviewer (1ª) | "Quando o Turmma contratar" contra "a Turmma" no vazio das empresas | `TODO.md`, para a tarefa que tocar os `textos-*.ts`, que esta tarefa não muda (Contexto necessário) |
| frontend-reviewer (1ª) | Nos cartões dos prazos no celular, fixar o valor embaixo quando passa de uma palavra | `TODO.md`: muda o layout do `Tabela` em cartões, componente de várias telas |
| frontend-reviewer (1ª) | O seletor no computador, de 36 px para 40 px | `TODO.md`: o 36 px é do `Segmentado` (3.0) e passa na regra 50, item 2a; a mudança é do componente, não desta tarefa |
| revisor-geral (1ª) | Título `h2` e `h3` da tela das empresas quase iguais, um sob o outro | Recusada: é hierarquia visual, o `frontend-reviewer` viu as mesmas fotos e aprovou, e a repetição de nomes vem da divergência declarada dos títulos (13.1 manda o título por extenso) |
| frontend-reviewer (1ª) | A foto da faixa não mostra que a página não rola | Sem ação: é limite da foto, e o e2e prova a conta |
| revisor-geral (2ª) e test-engineer (2ª) | `e2e/incidentes.spec.ts`, o teste novo da Analista: dois `if (largura >= 768)` seguidos, que cabem num bloco só | `TODO.md`, para a próxima tarefa que tocar `e2e/incidentes.spec.ts`: mudar o arquivo agora caduca `test-engineer` e `revisor-geral` e custa uma rodada inteira por um ajuste de estilo |
| revisor-geral (2ª) | O teste novo ganhou mais um `test.setTimeout(60_000)` local, o padrão que o `TODO.md` já marca para limpar | Junta-se ao item que já existe no `TODO.md` ("e2e de Privacidade: o prazo de 90 s repetido…"): acrescentar `e2e/incidentes.spec.ts` à mesma passada de limpeza |
| test-engineer (2ª) | No projeto `celular` o e2e novo só prova que não há rolagem para o lado, porque `paginaNaoRola` encerra antes de 768 px; falta um comentário de uma linha dizendo isso | `TODO.md`, junto do item dos dois `if`: é só comentário, mas no arquivo de e2e, e mexer nele caduca os revisores |
| test-engineer (2ª) | A folga de 12 px do miolo sem abas faz o teste depender de a faixa ter mais de 12 px mais o vão (hoje cerca de 84 px) | Registrada, sem ação: junta-se ao item `VAO_DA_FAIXA_PX` do `TODO.md` (se o desenho da faixa mudar, rever a margem do teste) |
| frontend-reviewer (2ª) | A 1366 × 768 o diálogo do aviso ocupa a altura toda e os botões ficam abaixo da dobra, dentro da rolagem do diálogo; sugere rodapé fixo no `Dialogo` (propriedade `rodape`) ou disposição mais compacta | `TODO.md`, e o Validador pode vê-lo no `/validar`: o diálogo é o mesmo de antes da tarefa (`AvisoDeIncidente`, já aprovado) e o `Dialogo` é componente de várias telas, fora do escopo da 13.0 |
| frontend-reviewer (2ª) | O "Turmma" no masculino do vazio das empresas e o seletor de 36 px | Já estão no `TODO.md` (recomendações da 1ª rodada) |

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
| 2026-10-17 02:45:16 | 2026-10-17 02:45:59 | `privacy-guardian` | 1 | APROVADO | ad684d994443b5b91 |
| 2026-10-17 02:45:09 | 2026-10-17 02:46:04 | `frontend-reviewer` | 1 | APROVADO | a26614a0c960b132b |
| 2026-10-17 02:45:29 | 2026-10-17 02:46:50 | `revisor-geral` | 1 | APROVADO | ac8cfca967131a857 |
| 2026-10-17 02:45:22 | 2026-10-17 02:47:00 | `test-engineer` | 1 | REPROVADO | aadd139be995142cc |
| 2026-10-17 10:24:33 | 2026-10-17 10:25:01 | `revisor-geral` | 2 | APROVADO | acfb7db15e23a8a8e |
| 2026-10-17 10:24:44 | 2026-10-17 10:25:26 | `frontend-reviewer` | 2 | APROVADO | a96257dcfd56af231 |
| 2026-10-17 10:24:54 | 2026-10-17 10:25:28 | `privacy-guardian` | 2 | APROVADO | a153fbded3c5508a6 |
| 2026-10-17 10:24:22 | 2026-10-17 10:25:37 | `test-engineer` | 2 | APROVADO | ac9e3f8d1605f1e03 |
