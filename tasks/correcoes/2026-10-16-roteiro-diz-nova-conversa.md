# Correção — o roteiro da demonstração manda clicar em "Nova conversa", que a X1 renomeou para "Início"

**Origem:** `tasks/prd-pele-e-casca/validacao.md` (seção "Maiores"): "`docs/roteiro-da-demonstracao.md:166` manda clicar num item que não existe mais (RF16)".
**Subagentes obrigatórios:** `revisor-geral`
<!-- Os guardiões vieram no PEDIDO do Orquestrador (revisor-geral, test-engineer). test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

O passo 4 do roteiro (`docs/roteiro-da-demonstracao.md:166`) diz "Perfil **Professora** → **Nova conversa**". Na
navegação do professor esse item se chama **Início** desde a tarefa 12.0 da X1 (`apps/web/src/areas/navegacao.ts:63`, mesmo
endereço, `ROTAS.novaConversa`). Quem conduz a demonstração procura um item que não existe. O spec do mesmo roteiro já usa
"Início" (`e2e/roteiro-da-demonstracao.spec.ts:356`); o documento, que é o que a pessoa lê, não.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

A 12.0 renomeou o item na navegação e atualizou o spec do roteiro, mas o documento `docs/roteiro-da-demonstracao.md` não
estava entre os arquivos da tarefa e ficou com o nome antigo. Conferi o resto do roteiro: a linha 166 é a **única
instrução ao apresentador** com "Nova conversa" em `docs/`. O nome ainda aparece, sem ser instrução, em
`docs/interface.md` (`:53`, no desenho ASCII da lateral do professor; `:72`, `:1519` e `:1544`, onde o texto diz que a X1
trocou o rótulo), `docs/mvp-rapido.md` (`:174`, `:177` e `:229`, registro histórico da A2 a A5),
`docs/pendencias-dos-mockups.md` (`:198` e `:228`) e `docs/decisoes.md` (`:878`): são registro, decisão ou nota da troca,
e ficam. As outras menções do repositório estão em `e2e/*.spec.ts` e em `apps/web`, onde são comentário sobre o nome antigo
ou título de exemplo de um teste do componente `Tela`, e não instrução ao apresentador; os comentários ficam, por serem
código fora do pedido. As demais palavras "conversa" do roteiro
(linhas 229, 321 e 326) descrevem a conversa com o Assistente ou o Tutor, não o item da navegação.

## Teste que reproduz

Não há. O defeito está num texto de apoio à demonstração, e nenhum teste lê esse documento (o `e2e/roteiro-da-demonstracao.spec.ts`
só o cita em comentário e já segue o nome novo). Escrever um teste que compare o texto do documento com o rótulo da
navegação seria teste de cópia: não prova regra de negócio (regra 40). A evidência que substitui o vermelho é o
`grep -n "Nova conversa" docs/roteiro-da-demonstracao.md`, que devolvia a linha 166 antes e nada depois.

## Correção

`docs/roteiro-da-demonstracao.md:166`: "**Nova conversa**" passa a "**Início**". Mais nada: o restante do passo (digitar a
frase exata, **Enviar**, o que aparece) continua verdadeiro.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | "o desenho em `docs/interface.md:53` ainda mostra "✎ Nova conversa" na lateral... Vale uma tarefa própria que atualize o desenho, quando a X3 recompuser a tela" | Não aplicar aqui: arquivo que a correção não toca e mudança de desenho de tela, não de texto de apoio. Destino: a X3 (`telas-do-professor`), que recompõe a tela de Início e já é citada em `docs/interface.md:72` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-16 07:44:21 | 2026-10-16 07:44:37 | `revisor-geral` | 1 | APROVADO | a595fe51651a8c2e7 |
| 2026-10-16 07:44:22 | 2026-10-16 07:44:45 | `test-engineer` | 1 | APROVADO | aee7523089e8c2d14 |
