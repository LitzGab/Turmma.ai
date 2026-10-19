# Correção — o e2e da A2 conta seis "Gabarito" onde espera cinco

**Origem:** esteira runs 39280361322 e 39281985715 (`gh run view <id> --log-failed`)
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`e2e/a2-assistente.spec.ts:86` (projetos `chromebook` e `celular`): `page.getByText('Gabarito', { exact: true })`
conta 6 onde o teste espera 5. Determinístico, não é prazo.

## Fora desta correção

nada

## Causa

A tarefa 6.0 (`5762f90`) abriu o artefato como documento em folha e pôs, acima da folha, o interruptor
"Gabarito" (`Artefato.tsx`: `<span className="t-rotulo">Gabarito</span>` ao lado do `Interruptor`). O teste da A2
conta o texto na página inteira: as cinco questões da atividade (o selo "Gabarito" da alternativa certa, dentro da
folha) mais o rótulo do interruptor, que está fora dela. O produto está certo; o seletor do teste ficou largo. O
`e2e/professor-artefato.spec.ts` já conta dentro de `[data-folha]`.

## Teste que reproduz

`e2e/a2-assistente.spec.ts › o fluxo real da A2` (a linha 86): vermelho antes (6 em vez de 5), verde depois.

## Correção

`e2e/a2-assistente.spec.ts`, linha 86: a contagem passa a ser feita dentro de `[data-folha]` (a folha do
documento), onde só os selos "Gabarito" das alternativas certas existem. Nenhum código de `apps/` muda: o rótulo do
interruptor é parte do desenho da 6.0, e o `professor-artefato.spec.ts` já mede o interruptor à parte.

## Mutações

A asserção estreitada continua mordendo: sem o selo da alternativa certa, a folha tem 0 "Gabarito" e o caso fica vermelho.

```mutacao
arquivo: apps/web/src/areas/professor/ConteudoDoArtefato.tsx
teste: e2e/a2-assistente.spec.ts › a coordenação sobe o material; a professora pede a atividade, usa a ferramenta, vê a página citada, exporta o PDF, pede a versão adaptada e aprova, e a tela diz quem aprovou e quando
                              <Check aria-hidden="true" size={14} strokeWidth={2.4} />
-                              Gabarito
                            </span>
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer 1ª | Em `Artefato.tsx:269-270`, o `<span>Gabarito</span>` visível e o `rotulo="Gabarito"` do `Interruptor` repetem o texto dentro do mesmo `<label>`; o leitor de tela pode anunciar o nome duas vezes. Vale conferir na validação se o `Interruptor` já esconde um dos dois | Não aplicar: mexe em código de `apps/` que esta correção (só de teste) não toca, e o `professor-artefato.spec.ts` já mede o interruptor pelo nome acessível. Destino: conferir na validação da spec (fotos e leitor de tela do artefato) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 15:14:12 | 2026-10-19 15:14:27 | `frontend-reviewer` | 1 | APROVADO | a675cbc1c48b71a22 |
| 2026-10-19 15:14:10 | 2026-10-19 15:14:37 | `test-engineer` | 1 | APROVADO | aba63f3f3ef6e86a8 |
