# Correção — o vazio sem asserção no carregando e no erro de seis telas e do consumo do Painel, e a seção 3 do `docs/interface.md` ainda no estado de antes da X2

**Origem:** `tasks/prd-telas-da-coordenacao/validacao.md` (rodada 1, 17/10/2026, `f01ecbd`), seção 4: o achado **C4** (RF22) e o **Maior** (`docs/interface.md`). Pedido do Orquestrador.
**Subagentes obrigatórios:** `frontend-reviewer` · `revisor-geral`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção mexe em 8 arquivos fora de `tasks/` (7 testes e `docs/interface.md`), acima do limite de 5 do passo 5 de `corrigir`. -->

## Sintoma

RF22 pede que o vazio só apareça "com a leitura terminada e sem erro". Os casos de carregando e de erro de seis telas conferem que a tabela não existe, mas não que o texto do vazio não aparece: uma tela que mostrasse "Nenhum pedido registrado" durante a leitura, ou ao lado do erro, passaria em todos eles. O bloco de consumo do Painel não tinha asserção do vazio nem no carregando nem no erro. Onde:

| Tela | Teste | Texto do vazio |
|---|---|---|
| Turmas | `Estrutura.test.tsx` › carregando · erro | "Comece pelo ano letivo", "Nenhuma turma ainda" |
| Pedidos | `privacidade/Pedidos.test.tsx` › carregando · erro | "Nenhum pedido registrado" |
| Operação, Escolas | `operacao/paginas/Escolas.test.tsx` › carrega · o 503 | "Nenhuma escola ainda." |
| Operação, Uso | `operacao/paginas/Uso.test.tsx` › carrega · o 503 | "Nenhuma escola ainda." |
| Professores | `Professores.test.tsx` › carregando | "Nenhum professor ainda" |
| Lista da turma | `ListaDaTurma.test.tsx` › carregando, e depois a tela com a turma | "Nenhum nome nesta turma ainda", "Nenhum professor nesta turma", "Nenhum pedido esperando" |
| Painel, consumo | `Painel.test.tsx` › o consumo do mês | "Nenhuma função da IA trabalhou neste mês." (e a linha "Consumo do mês: …") |

E, fora de teste: `docs/interface.md` (seção 3, a tabela "O que cada papel vê" e a frase de onde a coordenação abre) ainda descrevia a coordenação com os sete itens e "A coordenação abre em Governança (depois, no Painel)", quando a X2 já a pôs nos quatro lugares, abrindo no Painel.

## Fora desta correção

Nada: nenhuma tarefa em curso na árvore (`git status` limpo). Ficam de fora, por ordem do pedido, o C1, o C2 e o C3 (alturas do Painel e do detalhe do pedido, e a ordem dos dois modais) e os Menores da validação.

## Causa

A 2.0, a 4.0, a 8.0, a 10.0, a 11.0 e a 13.0 escreveram o vazio com o caso que o mostra e, nos casos de carregando e de erro, conferiram a ausência da **tabela** (o que o dado seria), e não a ausência do **texto do vazio**. Os dois são condições diferentes do mesmo ternário: tirar o ramo do carregando ou o do erro faz a tela cair no vazio (a lista ainda não chegou), e a tabela continua ausente. O consumo do Painel entrou na 2.0 com um caso só que passa pelos quatro estados, e o `vazio` dele foi conferido só depois da leitura pronta.

O `docs/interface.md` não foi atualizado na 1.0 (que mudou a navegação) nem na 14.0: a seção 3 e a tabela dizem "até a X2", "são sete" e "abre em Governança (depois, no Painel)".

## Teste que reproduz

Não há código de produção errado: a falta é de prova. Em vez do vermelho do defeito, a prova de cada asserção nova é a sua **mutação**, na seção abaixo: cada bloco faz a tela mostrar o texto do vazio **junto** do carregando ou do erro, e o caso tem de ficar vermelho **pela asserção nova** (o texto do carregando ou do erro continua na tela, então as asserções de antes seguem verdes e só a nova pode cair).

- `Estrutura.test.tsx`: carregando e erro da leitura dos anos, sem "Comece pelo ano letivo" nem "Nenhuma turma ainda".
- `privacidade/Pedidos.test.tsx`: carregando e erro, sem "Nenhum pedido registrado".
- `operacao/paginas/Escolas.test.tsx` e `Uso.test.tsx`: carregando e 503, sem "Nenhuma escola ainda."
- `Professores.test.tsx`: carregando, sem "Nenhum professor ainda".
- `ListaDaTurma.test.tsx`: a turma carregando e o erro da leitura dela, sem os três convites da turma (o erro entrou na 1ª ordem da Mesa, item 2).
- `Painel.test.tsx`: o consumo carregando e com erro, sem "Nenhuma função da IA trabalhou neste mês." nem a linha "Consumo do mês: …".

## Correção

Só asserções, `queryByText(<texto do vazio>)` com `toBeNull()`, no ponto de cada estado em que a tela já está pronta para ser conferida (depois de o texto de carregando ou o alerta de erro aparecer). Nenhum arquivo de produção mudou.

`docs/interface.md`: a seção 3 diz que os quatro lugares **chegaram** com a X2 (e não que "até a X2 a lateral é a lista plana de sete itens"); a linha da coordenação na tabela "O que cada papel vê" passa a dizer que os sete itens só valeram até a X2 e que os quatro lugares cabem na barra de baixo do celular (a regra de até quatro itens da seção 11.1); e a frase de onde a coordenação abre diz "no Painel (X2); Governança é a aba IA de Registros".

## Mutações

Cada bloco faz a tela mostrar o vazio junto do carregando, ou junto do erro, e o caso do estado tem de ficar vermelho: uma mutação por texto de vazio e por estado, porque cada asserção prova só o seu texto.

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › carregando: a leitura dos anos no ar
- if (anos.isPending) return <EstadoCarregando rotulo="Carregando a estrutura da escola…" />
+ if (anos.isPending) return <><EstadoCarregando rotulo="Carregando a estrutura da escola…" /><EstadoVazio titulo="Comece pelo ano letivo" descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › carregando: a leitura dos anos no ar
- if (anos.isPending) return <EstadoCarregando rotulo="Carregando a estrutura da escola…" />
+ if (anos.isPending) return <><EstadoCarregando rotulo="Carregando a estrutura da escola…" /><EstadoVazio titulo="Nenhuma turma ainda" descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › erro: a mensagem curta
- if (anos.isError) return <EstadoErro erro={anos.error} tentando={anos.isFetching} aoTentarDeNovo={() => void anos.refetch({ cancelRefetch: false })} />
+ if (anos.isError) return <><EstadoErro erro={anos.error} tentando={anos.isFetching} aoTentarDeNovo={() => void anos.refetch({ cancelRefetch: false })} /><EstadoVazio titulo="Comece pelo ano letivo" descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › erro: a mensagem curta
- if (anos.isError) return <EstadoErro erro={anos.error} tentando={anos.isFetching} aoTentarDeNovo={() => void anos.refetch({ cancelRefetch: false })} />
+ if (anos.isError) return <><EstadoErro erro={anos.error} tentando={anos.isFetching} aoTentarDeNovo={() => void anos.refetch({ cancelRefetch: false })} /><EstadoVazio titulo="Nenhuma turma ainda" descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx › carregando: diz o que espera
- if (consulta.isPending) return <EstadoCarregando rotulo="Carregando os pedidos…" />
+ if (consulta.isPending) return <><EstadoCarregando rotulo="Carregando os pedidos…" /><EstadoVazio titulo="Nenhum pedido registrado" descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx › erro: diz o que fazer
  if (consulta.data === undefined) {
- return <EstadoErro erro={consulta.error} tentando={consulta.isFetching} aoTentarDeNovo={() => void consulta.refetch({ cancelRefetch: false })} />
+ return <><EstadoErro erro={consulta.error} tentando={consulta.isFetching} aoTentarDeNovo={() => void consulta.refetch({ cancelRefetch: false })} /><EstadoVazio titulo="Nenhum pedido registrado" descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Escolas.tsx
teste: apps/web/src/operacao/paginas/Escolas.test.tsx › carrega, mostra a lista, e a página é a que a API deu
  escolas.isPending ? (
- <EstadoCarregando rotulo="Carregando as escolas…" />
+ <><EstadoCarregando rotulo="Carregando as escolas…" /><EstadoVazio titulo="Nenhuma escola ainda." descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Escolas.tsx
teste: apps/web/src/operacao/paginas/Escolas.test.tsx › o 503 mostra a mensagem e a tela fica
  ) : escolas.isError && dados === undefined ? (
- <ErroDaOperacao erro={escolas.error} aoTentarDeNovo={() => void escolas.refetch()} tentando={escolas.isFetching} />
+ <><ErroDaOperacao erro={escolas.error} aoTentarDeNovo={() => void escolas.refetch()} tentando={escolas.isFetching} /><EstadoVazio titulo="Nenhuma escola ainda." descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Uso.tsx
teste: apps/web/src/operacao/paginas/Uso.test.tsx › carrega e mostra a tabela, pela sessão do operador
  uso.isPending ? (
- <EstadoCarregando rotulo="Carregando o uso das escolas…" />
+ <><EstadoCarregando rotulo="Carregando o uso das escolas…" /><EstadoVazio titulo="Nenhuma escola ainda." descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/operacao/paginas/Uso.tsx
teste: apps/web/src/operacao/paginas/Uso.test.tsx › o 503 mostra a mensagem dentro da tela
  ) : uso.isError && dados === undefined ? (
- <ErroDaOperacao erro={uso.error} aoTentarDeNovo={() => void uso.refetch()} tentando={uso.isFetching} />
+ <><ErroDaOperacao erro={uso.error} aoTentarDeNovo={() => void uso.refetch()} tentando={uso.isFetching} /><EstadoVazio titulo="Nenhuma escola ainda." descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/coordenacao/Professores.test.tsx › carregando: a leitura da lista no ar
- <EstadoCarregando rotulo="Carregando os professores…" />
+ <><EstadoCarregando rotulo="Carregando os professores…" /><EstadoVazio titulo="Nenhum professor ainda" descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › carregando, e depois a tela com a turma
- <EstadoCarregando rotulo="Carregando a turma…" />
+ <><EstadoCarregando rotulo="Carregando a turma…" /><EstadoVazio titulo="Nenhum nome nesta turma ainda" descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › carregando, e depois a tela com a turma
- <EstadoCarregando rotulo="Carregando a turma…" />
+ <><EstadoCarregando rotulo="Carregando a turma…" /><EstadoVazio titulo="Nenhum professor nesta turma" descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › carregando, e depois a tela com a turma
- <EstadoCarregando rotulo="Carregando a turma…" />
+ <><EstadoCarregando rotulo="Carregando a turma…" /><EstadoVazio titulo="Nenhum pedido esperando" descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Painel.tsx
teste: apps/web/src/areas/coordenacao/Painel.test.tsx › o consumo do mês: carregando, erro que relê só o consumo
  ) : (
- <EstadoCarregando rotulo="Carregando o consumo do mês…" />
+ <><EstadoCarregando rotulo="Carregando o consumo do mês…" /><p className="t-apoio text-sutil">Nenhuma função da IA trabalhou neste mês.</p></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Painel.tsx
teste: apps/web/src/areas/coordenacao/Painel.test.tsx › o consumo do mês: carregando, erro que relê só o consumo
  ) : (
- <EstadoCarregando rotulo="Carregando o consumo do mês…" />
+ <><EstadoCarregando rotulo="Carregando o consumo do mês…" /><p className="t-apoio text-sutil">Consumo do mês: x.</p></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Painel.tsx
teste: apps/web/src/areas/coordenacao/Painel.test.tsx › o consumo do mês: carregando, erro que relê só o consumo
  return consumo.isError ? (
- <EstadoErro erro={consumo.error} tentando={consumo.isFetching} aoTentarDeNovo={() => void consumo.refetch()} />
+ <><EstadoErro erro={consumo.error} tentando={consumo.isFetching} aoTentarDeNovo={() => void consumo.refetch()} /><p className="t-apoio text-sutil">Nenhuma função da IA trabalhou neste mês.</p></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Painel.tsx
teste: apps/web/src/areas/coordenacao/Painel.test.tsx › o consumo do mês: carregando, erro que relê só o consumo
  return consumo.isError ? (
- <EstadoErro erro={consumo.error} tentando={consumo.isFetching} aoTentarDeNovo={() => void consumo.refetch()} />
+ <><EstadoErro erro={consumo.error} tentando={consumo.isFetching} aoTentarDeNovo={() => void consumo.refetch()} /><p className="t-apoio text-sutil">Consumo do mês: x.</p></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › o erro da leitura da turma diz o que fazer
- <EstadoErro erro={turma.error} tentando={turma.isFetching} aoTentarDeNovo={() => void turma.refetch({ cancelRefetch: false })} />
+ <><EstadoErro erro={turma.error} tentando={turma.isFetching} aoTentarDeNovo={() => void turma.refetch({ cancelRefetch: false })} /><EstadoVazio titulo="Nenhum nome nesta turma ainda" descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › o erro da leitura da turma diz o que fazer
- <EstadoErro erro={turma.error} tentando={turma.isFetching} aoTentarDeNovo={() => void turma.refetch({ cancelRefetch: false })} />
+ <><EstadoErro erro={turma.error} tentando={turma.isFetching} aoTentarDeNovo={() => void turma.refetch({ cancelRefetch: false })} /><EstadoVazio titulo="Nenhum professor nesta turma" descricao="x" /></>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › o erro da leitura da turma diz o que fazer
- <EstadoErro erro={turma.error} tentando={turma.isFetching} aoTentarDeNovo={() => void turma.refetch({ cancelRefetch: false })} />
+ <><EstadoErro erro={turma.error} tentando={turma.isFetching} aoTentarDeNovo={() => void turma.refetch({ cancelRefetch: false })} /><EstadoVazio titulo="Nenhum pedido esperando" descricao="x" /></>
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | `Professores.tsx:183`: o ramo `professores.isError ?` com a lista ainda vazia (nova leitura falha depois do primeiro cadastro) não tem teste; novo caso em `Professores.test.tsx` com a mutação do ramo | `TODO.md`. É anterior a esta correção e fora do C4 da validação; pede caso novo e mutação nova, e não só asserção |
| frontend-reviewer (1ª) | `apps/web/src/componentes/Linha.tsx:58`: o título do cartão "Incidente de segurança…" corta com reticências em 360 px (`truncate`, com o título só em `title`) | `TODO.md`, para a correção do Painel que trata o C1 a C3. É arquivo de produção, anterior a esta correção e fora do pedido |
| frontend-reviewer (1ª) | O modal de incidente ocupa a altura toda e rola por dentro | Já é o C1/C2 da validação, fora desta correção por ordem do pedido do Orquestrador |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 17:55:50 | 2026-10-17 17:56:13 | `frontend-reviewer` | 1 | APROVADO | affec0f6ebb9ebf75 |
| 2026-10-17 17:55:54 | 2026-10-17 17:56:52 | `revisor-geral` | 1 | APROVADO | a8e47387468b2e4c6 |
| 2026-10-17 17:55:57 | 2026-10-17 17:57:26 | `test-engineer` | 1 | APROVADO | a5b58e59a113314ae |
| 2026-10-17 18:02:14 | 2026-10-17 18:02:33 | `revisor-geral` | 2 | APROVADO | ae37c7d6523d94dde |
| 2026-10-17 18:02:21 | 2026-10-17 18:02:51 | `test-engineer` | 2 | APROVADO | ac18b152585e87708 |
