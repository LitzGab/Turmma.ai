# Correção — a onça do mockup em mais lugares (o m1 da validação) e as duas linhas do aceno (o m2)

**Origem:** `tasks/correcoes/2026-10-28-onca-do-mockup-validacao.md`, menores m1 e m2, e o pedido do Joaquim ("a onça do mockup em tudo"), com a escolha delegada ao Orquestrador.
**Subagentes obrigatórios:** `test-engineer`, `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian`, `revisor-geral`, `tenancy-guardian`, `infra-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: `frontend-reviewer` e `conformidade-reviewer`. O `test-engineer` é obrigatório em toda
     correção. O `revisor-geral` entra porque a correção altera mais de 5 arquivos fora de `tasks/` (passo 5 de `corrigir`).
     `privacy-guardian`, `tenancy-guardian` e `infra-guardian` são o conjunto do padrão que o portão exige para os arquivos alterados
     (`portao-local.ts revisores`); a correção não toca tenant, API, banco, dado de pessoa nem infra, e cada um deve dizer isso. -->

## Sintoma

1. **m1, "em tudo" ficou "onde ela já estava".** O mockup põe a onça em lugares onde o `apps/web` não tem nenhuma, em telas que já
   existem aqui: o vazio de Criados, o "Eu" do aluno sem nota, o roteiro da Estrutura da coordenação, a atividade que não existe, e ao
   lado da conversa do Tutor.
2. **m2, a pata que acena se lê pouco.** Na tela (120 e 88 px) a pata da pose `acenando` fica entre o corpo e o rabo; no mockup duas linhas
   curtas ao lado dela ajudam a ler o gesto, e a correção anterior não as trouxe.

## Fora desta correção

Nada: a árvore estava limpa.

## O que entra e o que não entra (D80, item 3; D58; D59; D73; regra 70, itens 4a e 4b)

**Cada lugar e pose nova precisa de parecer do `conformidade-reviewer`; o que ele vetar sai, e vai ao relatório.** Por isso cada coisa mora
num lugar só, e tirá-la é apagar esse lugar. Foi o que a rodada 1 fez: pediu-se parecer dos seis, e o `conformidade-reviewer` aprovou dois
e vetou quatro lugares (e a pose nova que um deles pedia). Nenhuma onça nova anima (`animada={false}`), nenhuma tem balão com texto, e todas
vão assinadas pela função de quem produz o que a tela mostra, com o selo "IA".

**Entra (parecer ENTRA, rodada 1):**

| Lugar no mockup | Na web | Pose · tamanho · quem assina | Observação |
|---|---|---|---|
| `Criados.tsx:179`, o vazio "Nada criado ainda" | `areas/professor/artefatos/Criados.tsx`, o vazio "Nada gerado ainda" | apontando · 120 · Assistente de ensino | Só o vazio de verdade; o "Nada com estes filtros" não leva onça (e um caso confere) |
| as duas linhas ao lado da pata (m2) | `Onca.tsx`, pose `acenando` (`DesenhoDasLinhasDoAceno`) | traço parado, na cor da sombra | Nenhum movimento |

**Não trouxe, e vai para o relatório:**

- **Vetados pelo `conformidade-reviewer` na rodada 1 (saíram da árvore):**
  - **A pausa do Tutor com a pose nova `dormindo`** (`_conversa-tutor.tsx:290`). A revisão da D80 de 28/10 diz que `acolhendo` e `dormindo` continuam fora. E a
    `Pausa` aparece também no limite do dia e no pacote do mês: uma onça dormindo com "z" porque o aluno gastou as perguntas é o agente com estado de corpo
    reagindo ao uso de uma pessoa (D80, item 3; D59). Em `suspenso` e `fora` o desenho contradiria o texto, que diz que a pausa é escolha da escola. A `Pausa`
    segue com os ícones por motivo.
  - **O roteiro da Estrutura, assinado pelo Analista.** O roteiro é uma lista fixa e determinística; a função do Analista é "Resumo e alerta", em agregado.
    A assinatura sugere autoria de IA sobre o que a IA não produziu, justo para a coordenadora que precisa responder "o que essa IA faz sozinha?" (regra 70, itens 4a e 5).
  - **"Esta atividade não está disponível" com a pose `pensando`, assinada pelo Tutor.** O texto é a resposta de acesso do sistema, que o Tutor não produz, e o balão de
    três pontos é o sinal de "a IA está trabalhando" onde nenhuma IA processa nada: sinal falso de estado, assinado como IA, para um menor (D58).
  - **O vazio de "Como estou indo" em Eu, assinado pelo Tutor.** A região mostra a correção de objetiva aprovada pelo professor, que a governança declara do Assistente de
    ensino, não do Tutor: a assinatura borra quem corrigiu e quem aprovou (regra 70, itens 4a e 5; D58). **Pode voltar com parecer novo** se a seção passar a se apresentar,
    em todos os estados, como "o que o Tutor sabe de você" (D66; regra 70, item 4d).
- **Não existem na web (D73):** o "Ninguém entrou ainda" da aba Hoje (`abas-turma/Hoje.tsx:83`; a turma sem aluno aparece na aba Alunos, "A lista ainda não chegou") e o
  "Vale revisar" da atividade (`aluno/Atividade.tsx:324`).
- **`acolhendo`** no assunto delicado do Tutor (`_conversa-tutor.tsx:339`): a D80, item 3, escreve que a expressão de preocupação não entra. A mensagem fixa do 188 segue como está (D36).
- **A frase no balão** da onça do Tutor e do roteiro ("Vamos falar disso com um adulto.", "Faltam N coisas."): a onça não fala (D58).
- **`dormindo` nos outros vazios do mockup** ("Tudo em dia" do sino, da fila, de Calendário, Catálogo e Turmas): a web tem esses vazios sem mascote, e a pose segue fora.

## Causa

A correção anterior trouxe a onça aos lugares onde a web já a tinha (as introduções, a comemoração e o avatar), e deixou os outros em
aberto por falta de parecer (m1), e as duas linhas do aceno por serem "marca de movimento" (m2). O Joaquim disse que quer a onça do mockup
em tudo, e delegou a escolha.

## Teste que reproduz

- **O lugar de Criados:** `Criados.test.tsx › vazio: "Nada gerado ainda" com o caminho para Ferramentas…` confere a pose, a assinatura, o selo e que a onça está parada;
  `… sem mais páginas, diz "Nada com estes filtros"…` confere que o vazio do filtro não leva onça. Vermelho antes: a tela não desenhava a onça.
- **A prop do vazio:** `estados.test.tsx › a ilustração, quando a tela a passa, vem antes do título…`.
- **A cadeia fechada:** `avatar-so-nas-duas-pecas.test.ts` lista a tela que pode importar a `Onca` (`TELAS_COM_A_ONCA`, hoje só Criados).
- **As linhas do aceno:** `fidelidade-ao-mockup.test.tsx › as duas linhas ao lado da pata que acena são as do mockup…` e `Onca.test.tsx › só a acenando leva as duas linhas…`.

## Correção

- `componentes/ui/onca/Onca.tsx`: as duas linhas do aceno (`DesenhoDasLinhasDoAceno`), e o comentário da peça diz quem pode importá-la.
- `componentes/estado/EstadoVazio.tsx`: a prop `ilustracao` (a tela a passa; a peça não importa a onça e continua morando na entrada).
- `areas/professor/artefatos/Criados.tsx`: a onça apontando no vazio, assinada pelo Assistente de ensino.
- Testes: `Criados.test.tsx`, `estados.test.tsx`, `avatar-so-nas-duas-pecas.test.ts`, `Onca.test.tsx` e `fidelidade-ao-mockup.test.tsx`; e em `Estrutura.test.tsx` o seletor
  do painel "O que falta" passa a `'img, [data-onca]'` (o antigo, `svg[data-onca]`, nunca achava nada, porque o atributo fica no `<figure>`).
- `docs/interface.md` (9.7 e 10.2): a tabela de poses e lugares, o critério da assinatura ("só entra numa região que guarda produção daquele agente") e a linha da `dormindo`, que
  agora diz que não entra (antes dizia "X2, com parecer"). `CLAUDE.md` e `ROADMAP.md` não mudam: a D80, item 3, já diz que pose e lugar novos entram com parecer.

## Divergências resolvidas

Nenhuma.

## Recomendações sem aplicar

Da rodada 1 (`.processo/ordens/2026-10-28-onca-do-mockup-v3-r1.md`, seção "Sem aplicar"):

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Alinhar a onça à esquerda no vazio padrão, ou centralizar o vazio inteiro quando há ilustração; senão, corrigir o comentário de `EstadoVazio.tsx` e o teste de `estados.test.tsx`, que dizem "à esquerda" | `TODO.md`: escolha de desenho; só o vazio de Criados usa a `ilustracao` |
| conformidade-reviewer (1ª) | No vazio de Criados, o texto "peça ao Assistente no Início" e a onça assinada pelo Assistente se reforçam: manter assim se o vazio mudar | Sem ação: o revisor pede só que se mantenha |
| test-engineer (1ª) | Os casos que caíam com os lugares vetados (Eu com dado, `@ts-expect-error` com `dormindo`, a `Pausa` com os cinco motivos, `animada={false}` da pausa) | Caem com os itens 1 a 4: os lugares saíram |

Da rodada 2 (`.processo/ordens/2026-10-28-onca-do-mockup-v3-r2.md`, os sete aprovaram; as entradas com destino `TODO.md` estão lá):

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª e 2ª), revisor-geral (2ª), conformidade-reviewer (2ª) | `EstadoVazio.tsx` e `estados.test.tsx` dizem que no padrão a onça fica "à esquerda", e a tela a mostra centralizada sobre texto à esquerda (a `figure` da `Onca` é `items-center`): alinhar a onça à esquerda, ou corrigir o comentário e o teste | `TODO.md`. É escolha de desenho: alinhar muda o que se vê, e o outro caminho muda só texto. Só Criados usa a `ilustracao` |
| revisor-geral (2ª) | O ramo do `tracejado` do `TopoDoVazio` (`EstadoVazio.tsx`) não tem tela que o chame com ilustração | `TODO.md`, junto com a linha acima: é o mesmo arquivo e a mesma decisão. Hoje fica, porque `estados.test.tsx` o prova |
| privacy-guardian (2ª), conformidade-reviewer (2ª) | O comentário de `Onca.tsx` e o de `Onca.test.tsx` dizem que a `dormindo` "ainda não tem lugar no produto"; a 9.7 diz "não entra": escrever igual, para ninguém ler "ainda" como convite | `TODO.md` (a tarefa futura que tocar `Onca.tsx`) |
| privacy-guardian (2ª) | O critério da 9.7 (a assinatura só onde a IA produziu o que a tela mostra) só existe na revisão e na lista fechada `TELAS_COM_A_ONCA` | Retro desta correção: registrar que o critério depende de revisão humana, sem trava própria |
| test-engineer (2ª) | Escrever no documento por que o bloco de mutação do `Roteiro` pedido na rodada 1 não foi declarado | A prop `ilustracao` saiu do `Roteiro` com o veto do `conformidade-reviewer`, e a regra de que o painel "O que falta" não leva onça fica guardada pela lista fechada `TELAS_COM_A_ONCA` (`avatar-so-nas-duas-pecas.test.ts`) e pelo seletor `'img, [data-onca]'` de `Estrutura.test.tsx` |
| test-engineer (2ª) | `Onca.test.tsx`: conferir que o `<g data-parte="movimento">` das linhas do aceno não tem classe (`getAttribute('class')` nulo) | `TODO.md` (a tarefa futura que tocar `Onca.test.tsx`) |
| test-engineer (2ª) | Vazio de Criados: conferir que a onça mede 120 | `TODO.md` (a tarefa futura que tocar `Criados.test.tsx`) |
| revisor-geral (2ª) | A seção "Sintoma" ainda lista os cinco lugares do m1: pôr uma remissão curta a "Não trouxe" | Recusada: o "Sintoma" é a origem da correção, e a seção "Não trouxe" fica abaixo dele |
| frontend-reviewer (2ª) | Fotos da Estrutura sem ano letivo e da pausa do Tutor na validação | Cai: os dois lugares saíram desta correção (itens 2 e 5 da rodada 1) |
| infra-guardian (2ª) | Nenhuma ação: só `Criados.tsx` importa a `Onca` além das peças de antes | Sem ação |

## Mutações

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › as duas linhas ao lado da pata que acena são as do mockup: traço de 5 na cor da sombra, parado
-    linhasDoAceno: true,
+    linhasDoAceno: false,
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › só a acenando leva as duas linhas ao lado da pata, e elas são traço parado
-          {c.linhasDoAceno === true && <DesenhoDasLinhasDoAceno />}
+          {<DesenhoDasLinhasDoAceno />}
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoVazio.tsx
teste: apps/web/src/componentes/estado/estados.test.tsx › a ilustração, quando a tela a passa, vem antes do título, e no tracejado ela toma o lugar do ícone; sem ela, nada muda
-  if (ilustracao !== undefined) return <div className={`mb-3 ${tracejado ? 'flex justify-center' : ''}`}>{ilustracao}</div>
+  if (ilustracao !== undefined) return <div className={`mb-3 ${tracejado ? '' : ''}`}>{ilustracao}</div>
```

```mutacao
arquivo: apps/web/src/areas/professor/artefatos/Criados.tsx
teste: apps/web/src/areas/professor/artefatos/Criados.test.tsx › vazio: "Nada gerado ainda" com o caminho para Ferramentas, e nenhum "Limpar filtros", que só existe com filtro
-            ilustracao={<Onca pose="apontando" agente="assistente_de_ensino" tamanho={120} animada={false} />}
+            ilustracao={<Onca pose="apontando" agente="tutor" tamanho={120} animada={false} />}
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoVazio.tsx
teste: apps/web/src/componentes/estado/estados.test.tsx › a ilustração, quando a tela a passa, vem antes do título, e no tracejado ela toma o lugar do ícone; sem ela, nada muda
-  if (ilustracao !== undefined) return <div className={`mb-3 ${tracejado ? 'flex justify-center' : ''}`}>{ilustracao}</div>
+  if (false) return <div className={`mb-3 ${tracejado ? 'flex justify-center' : ''}`}>{ilustracao}</div>
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoVazio.tsx
teste: apps/web/src/componentes/estado/estados.test.tsx › o tracejado é de 2 px em `borda-campo`, nas duas variantes, e o ícone só aparece no tracejado
-  if (tracejado && Icone !== undefined) return <Icone aria-hidden="true" size={24} strokeWidth={1.75} className="mb-3 text-sutil" />
+  if (Icone !== undefined) return <Icone aria-hidden="true" size={24} strokeWidth={1.75} className="mb-3 text-sutil" />
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-28 22:38:29 | 2026-10-28 22:38:42 | `tenancy-guardian` | 1 | APROVADO | a7f54d8fda807ccfc |
| 2026-10-28 22:38:22 | 2026-10-28 22:38:46 | `privacy-guardian` | 1 | APROVADO | a68aa34320a1f67f0 |
| 2026-10-28 22:38:33 | 2026-10-28 22:38:47 | `infra-guardian` | 1 | APROVADO | a97bf4a512d2f6aab |
| 2026-10-28 22:38:07 | 2026-10-28 22:39:09 | `frontend-reviewer` | 1 | APROVADO | ad33143da89105766 |
| 2026-10-28 22:38:25 | 2026-10-28 22:40:11 | `revisor-geral` | 1 | REPROVADO | af5fb18e3a47da020 |
| 2026-10-28 22:38:00 | 2026-10-28 22:40:16 | `test-engineer` | 1 | REPROVADO | abf9d2c0a4913fab1 |
| 2026-10-28 22:38:18 | 2026-10-28 22:41:26 | `conformidade-reviewer` | 1 | REPROVADO | a708adad00134e949 |
| 2026-10-28 22:51:59 | 2026-10-28 22:52:34 | `frontend-reviewer` | 2 | APROVADO | a81c84ab6f9fd1237 |
| 2026-10-28 22:52:24 | 2026-10-28 22:52:42 | `privacy-guardian` | 2 | APROVADO | aed792a6595c80426 |
| 2026-10-28 22:51:52 | 2026-10-28 22:52:47 | `test-engineer` | 2 | APROVADO | a80578d857ecac85d |
| 2026-10-28 22:52:34 | 2026-10-28 22:52:49 | `infra-guardian` | 2 | APROVADO | a499a3f17d21cd993 |
| 2026-10-28 22:52:29 | 2026-10-28 22:52:49 | `tenancy-guardian` | 2 | APROVADO | ad4e5fbe57c6f2691 |
| 2026-10-28 22:52:11 | 2026-10-28 22:53:09 | `conformidade-reviewer` | 2 | APROVADO | a89c62282a6ee72e6 |
| 2026-10-28 22:52:19 | 2026-10-28 22:53:21 | `revisor-geral` | 2 | APROVADO | a973dc7dde2a989f7 |
