# Correção — o e2e do Tutor pausado procurava o aviso da avaliação dentro do link do título, que a 3.0 separou do cartão

**Origem:** esteira run 40185086983 (e2e 1/7 `chromebook` e 4/7 `celular`)
**Subagentes obrigatórios:** `test-engineer`, `frontend-reviewer`, `conformidade-reviewer`, `tenancy-guardian`, `privacy-guardian`, `infra-guardian`

## Sintoma

`e2e/aluno-fluxo.spec.ts:167` (« com a avaliação aberta o Tutor aparece pausado… ») falha nos dois projetos, na linha 175:

```
Expected substring: "Avaliação: o Tutor fica pausado até quem dá a aula encerrar."
Received string:    "Prova de estequiometria"
Timeout: 20000ms
```

É o único caso vermelho da corrida. `gh run view 40185086983 --log-failed`.

## Fora desta correção

nada

## Causa

Veio da **tarefa 3.0** (`fca784ad`, o Início do aluno). Antes dela, o Início abria o Tutor por um link único, que levava o título e o
aviso da avaliação (`EscolhaDaAtividade.tsx`, que continua assim em `/aluno/tutor`). A 3.0 trocou o cartão do Início por
`TarefaParaFazer` (`Inicio.tsx`): o **título** é um link para a tarefa; o aviso é um `<p>` **fora** dele; e o caminho até o Tutor é um
segundo link, "Pedir ajuda ao Tutor", e nenhum está dentro do outro. A tela está certa e coberta (`Inicio.test.tsx`, `aluno-inicio.spec.ts`,
que já procura o `listitem`). O e2e do fluxo ficou com o desenho antigo: `getByRole('link', { name: /título/ })` agora acha só o link do
título, sem o aviso, e, mesmo achando o aviso, o clique levaria à tarefa, não ao Tutor (`/aluno/tutor/<id>`, que o teste espera na linha 179).

Não é defeito do produto: o aviso aparece antes de abrir (RF5) e o caminho até o Tutor continua aberto (D36).

## Teste que reproduz

`e2e/aluno-fluxo.spec.ts › o fluxo do aluno contra a API real › com a avaliação aberta o Tutor aparece pausado, a pergunta comum é recusada, e a mensagem de assunto delicado ainda recebe o 188`:
vermelho antes (o do log acima, reproduzido no ambiente local), verde depois.

## Correção

Só o teste muda (`e2e/aluno-fluxo.spec.ts`, no caso das linhas 167 a 175). Nenhum arquivo de `apps/` ou `packages/` é tocado: a tela da 3.0
está certa e já tem o seu teste.

- `naLista` deixa de ser o link do título e passa a ser o **cartão** da tarefa (`listitem` com o título, o mesmo recorte de
  `aluno-inicio.spec.ts`), onde o aviso da avaliação está;
- o clique vai no link **"Pedir ajuda ao Tutor"** daquele cartão, que é o caminho até o Tutor no Início (D36), e a URL esperada
  (`/aluno/tutor/<id>`) continua a mesma.

O resto do caso (a pausa, a recusa da pergunta comum, o 188) não muda. O caso que o diff toca levou 15,6 s (`chromebook`) e 17,1 s
(`celular`) no ambiente local, com `test.setTimeout(180_000)` no HEAD: o portão o mede contra a metade desse prazo, e não contra 15 s.

Vermelho antes: o teste do HEAD, rodado no mesmo ambiente local, falha nos dois projetos com a mensagem do log da esteira. Verde
depois: os quatro casos de `aluno-fluxo.spec.ts` passam nos dois projetos.

## Mutações

O aviso do cartão é o que o teste passa a provar: sem ele no cartão, o caso fica vermelho.

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: e2e/aluno-fluxo.spec.ts › com a avaliação aberta o Tutor aparece pausado
        <p className="min-w-0 text-sm break-words text-sutil">{resumoDaAtividade(atividade)}</p>
-        {atividade.avaliativa && <p className="min-w-0 text-sm break-words text-apoio">{AVISO_DA_AVALIACAO}</p>}
      </div>
```

Da ordem de correção da 1ª rodada (item 1): o cartão passou a ser o item da lista cujo **link tem exatamente o título**, e não o que o cita no texto. Com o título do link mudado, o cartão não é achado:

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: e2e/aluno-fluxo.spec.ts › com a avaliação aberta o Tutor aparece pausado
-          <span className="min-w-0 break-words">{atividade.titulo}</span>
+          <span className="min-w-0 break-words">{atividade.titulo} (nova)</span>
```

Do item 2 da ordem (`not.toContainText(colega.nome)` no Início e no Tutor pausado): não tem bloco de mutação. Nenhuma tela do aluno recebe o nome do colega, então não há trecho de `apps/` que, tirado, faça a asserção ficar vermelha; para vê-la vermelha seria preciso inventar um caminho que vaze o nome. Ela guarda contra o vazamento futuro (regra 50, item 9), como a do caso do diagnóstico, na linha 159 do mesmo arquivo.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Importar `AVISO_DA_AVALIACAO` no e2e em vez de repetir o texto | Recusada: o e2e prova o texto que o aluno lê; importar a constante faria o teste passar com qualquer texto |
| frontend-reviewer (1ª), conformidade-reviewer (1ª) | Dar à vitrine (`tools/vitrine/`) uma avaliação aberta para o aluno, para fotografar o cartão com o aviso | Já está em `TODO.md:139` («A vitrine cheia semeia atividade aplicada»); toca `tools/vitrine/`, fora desta correção, que só mexe em `e2e/aluno-fluxo.spec.ts`. O aviso está provado pelo e2e e por `Inicio.test.tsx` |
| test-engineer (1ª) | O caso não prova que o aviso fica fora do link do título | Recusada: `Inicio.test.tsx` e `aluno-inicio.spec.ts` já cobrem a estrutura, como o próprio revisor diz |
| test-engineer (2ª) | O comentário em `e2e/aluno-fluxo.spec.ts:186` ("Nem o Início nem o Tutor pausado mostram o nome do colega") promete mais do que a asserção da linha 187 faz, que roda já no Tutor pausado; o mesmo texto está no documento ("no Início e no Tutor pausado"). Repetir a asserção no Início, ou corrigir o comentário e o documento | Não aplicada: regra da Mesa, a recomendação de quem aprovou só entra em ordem na primeira ordem do documento. Não muda comportamento nem o que o teste prova; o Implementador pode acertar o comentário se tocar o arquivo de novo |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 14:48:21 | 2026-10-25 14:48:32 | `tenancy-guardian` | 1 | APROVADO | a85edaedd2e56337f |
| 2026-10-25 14:48:15 | 2026-10-25 14:48:32 | `frontend-reviewer` | 1 | APROVADO | a60752fff2514fed6 |
| 2026-10-25 14:48:27 | 2026-10-25 14:48:42 | `infra-guardian` | 1 | APROVADO | af33f0020a6289894 |
| 2026-10-25 14:48:18 | 2026-10-25 14:48:42 | `conformidade-reviewer` | 1 | APROVADO | ad93c69f1ade1f3dc |
| 2026-10-25 14:48:24 | 2026-10-25 14:48:46 | `privacy-guardian` | 1 | APROVADO | a676d4f93caaa5fe6 |
| 2026-10-25 14:48:11 | 2026-10-25 14:48:52 | `test-engineer` | 1 | APROVADO | adb0ea793b781cf63 |
| 2026-10-25 14:58:56 | 2026-10-25 14:59:38 | `test-engineer` | 2 | APROVADO | a54d709e16c8f31dd |
