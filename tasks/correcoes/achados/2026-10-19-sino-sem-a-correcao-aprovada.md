# Achados das revisões — `tasks/correcoes/2026-10-19-sino-sem-a-correcao-aprovada.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 16:21:21 · `tasks/correcoes/2026-10-19-sino-sem-a-correcao-aprovada.md`

VEREDITO: APROVADO

Cenários exigidos:
- Caminho feliz 1: a professora aprova o lote na tela Aprovar e a correção sai do sino na mesma aba, sem recarregar a página.
- Caminho feliz 2: a professora confirma a turma em Turmas, "Confirme sua turma" sai do sino e a turma passa a ter os pedidos de nome lidos.
- O teste precisa falhar quando cada invalidação é tirada: a das entregas em `recarregarDepoisDoLote` e a dos vínculos em `Turmas.recarregar`.
- Borda: o item só sai porque a API registrou a decisão. Se a aprovação não chegar ao servidor, o item fica no sino.
- Borda: a turma recém-confirmada entra na leitura dos pedidos de nome, e não só some como pendência.
- Isolamento e permissão: não se aplicam a esta correção. Ela só acrescenta teste de tela com rede falsa, e o escopo da API não muda.

Cobertos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/SinoDoProfessor.test.tsx`, no describe "o que a professora decide em outra tela tira o item do sino, na mesma aba (RF3)":
  - **Primeiro caso:** monta Aprovar e o sino no mesmo cliente de consultas e aprova pelo diálogo de verdade. A rede só devolve a lista de entregas vazia depois que o servidor falso recebe o pedido de aprovação, então o caso não passa se a aprovação não sair. Ele confere o sino em "nada", que o link "Correção para revisar" sumiu e que a lista mostra "Tudo em dia".
  - **Segundo caso:** monta Turmas e o sino, confirma o vínculo e confere o sino em "nada" e o link "Confirme sua turma" fora da lista. Também confere que os pedidos da turma foram lidos uma vez (`vezesQue(...) === 1`). Isso prova que a turma passou a ter os pedidos lidos, e não só que o item saiu.
- As duas mutações do documento têm bloco próprio, cada uma ligada ao caso que reproduz o defeito, e apontam exatamente as cláusulas citadas como causa: `apps/web/src/api/atividades.ts:88` e `apps/web/src/areas/professor/Turmas.tsx:73`. Elas tiram o mecanismo que o teste exige e chegam à asserção de "nada", então o vermelho vem pelo motivo certo.
- Rodei o arquivo e passaram os 29 testes. Não há `.skip`. Não há mock de código nosso: o mock é só da rede. Os `stubGlobal` de `matchMedia` e `ResizeObserver` são desfeitos por `prepararTela()` (`vi.unstubAllGlobals` em `apps/web/src/__fixtures__/tela.tsx:99`). O prazo de espera está no próprio teste (5 s no `findByRole`) e não depende de a máquina estar folgada.

Bloqueantes: nenhum.

Recomendações:
- Rejeitar o lote também passa por `recarregarDepoisDoLote` (`Aprovar.tsx:204`), e contestar o vínculo passa pelo mesmo `recarregar` (`Turmas.tsx:93`). Nenhum dos dois caminhos tem caso no sino. A mesma invalidação cobre os dois hoje, mas um caso de rejeitar e um de contestar deixariam o sino protegido se cada caminho ganhar uma recarga própria.
- O caso de erro tipado da aprovação (`ENTREGA_JA_DECIDIDA` vindo de outra aba, em `Aprovar.tsx:212-220`) também relê as entregas. Um caso que prove que o item sai do sino quando outra aba já decidiu cobriria o lote decidido em duas abas.
- O nome do primeiro caso diz "as entregas são relidas", mas o teste não conta as leituras de `/v1/entregas`. O segundo caso conta as leituras de pedidos. Para os dois ficarem simétricos, o primeiro poderia conferir que `/v1/entregas` foi lido de novo depois da aprovação.
