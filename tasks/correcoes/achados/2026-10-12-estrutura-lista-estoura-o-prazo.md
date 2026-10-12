# Achados das revisões — `tasks/correcoes/2026-10-12-estrutura-lista-estoura-o-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-12 13:37:51 · `tasks/correcoes/2026-10-12-estrutura-lista-estoura-o-prazo.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta correção não muda nenhuma regra. Ela parte em dois um e2e que estourava o limite de 90 s na esteira. Por isso, o que precisa ser provado é:
- nenhuma asserção saiu ou mudou na partição;
- o caso novo chega de fato a cada trecho que herdou, e as mutações ficam vermelhas pelo motivo certo;
- os dois casos são independentes, cada um com a sua escola, e nenhum depende de prazo maior;
- o caso de cima continua cobrindo o que cobria;
- nada de `.skip`, nem mock que esconda a regra.

**Cobertos:**
- **Nada se perdeu.** No `git diff`, do caso de cima só sai a chamada `abrirTurma`, que só preparava o fim. O título muda para dizer o que o caso cobre agora (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/e2e/estrutura.spec.ts:732`). O fim volta como caso próprio (linhas 1037-1103) com o corpo idêntico: o erro da leitura da lista com "Tentar de novo" e `violacoesGraves`, o carregando e o erro da turma aberta, e a turma excluída entre a prévia e o "Gravar lista". Os seletores declarados de novo em 1060-1063 são os mesmos do caso de cima (796-798 e 917).
- **Os dois casos são independentes.** O caso novo cria a própria coordenadora e a própria escola, com uma turma, e põe dois nomes na lista. Antes de mexer em rota, confere que a lista carregou ("Primeira da lista"). Então o `page.route` de `lista?*` e o "Tentar de novo" agem sobre uma leitura que existiu. O `apagarTurmaNoBanco` só alcança a escola deste caso.
- **As três mutações chegam à cláusula.** Conferi cada alvo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/apps/web/src/areas/coordenacao/ListaDaTurma.tsx`:
  - linha 119, "Carregando a turma…": a linha 1083 procura esse texto exato no status.
  - linha 196, `nomes.isError` com `itens.length > 0`: depois do reload a lista começa vazia, então o alerta da linha 1069 não aparece.
  - linha 416: o contexto `ENTRADA_INVALIDA` deixa o alvo único (o mesmo texto existe na 581, no avulso, sem esse contexto), e a linha 1101 compara o texto exato.
  
  Nenhuma das três fica vermelha por motivo errado.
- **Nenhum prazo aumentou.** Não há `test.setTimeout`, e o `test.slow()` continua o mesmo nos dois casos. O registro de reprodução aperta o limite para 60 s: o caso antigo cai no mesmo ponto da esteira, e os dois novos passam com folga, 12 de 12 execuções.
- **Sem `.skip`, sem asserção trivial.** As rotas simuladas são da nossa própria API, para fabricar a falha. Não substituem a regra testada.
- **IA e concorrência não se aplicam.** A correção não toca IA, e nenhuma operação concorrente foi introduzida.

**Bloqueantes:** nenhum.

**Recomendações:**
- O comentário em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-teste-de-componente/e2e/estrutura.spec.ts:1041-1042` cita a execução 38261610727 e "66 s a 78 s". É histórico que envelhece no código e já está no documento da correção. Basta dizer por que o caso monta a própria escola.
- O caso de cima ainda soma muita coisa: paginação, as travas antes de enviar, a resposta atrasada, a gravação recusada, o avulso e a navegação. Com 40 s de 90, a margem está boa hoje. Vale levar ao `/retro` um limite para e2e de fluxo (por exemplo, partir quando passar da metade do limite na máquina local), para isso não voltar por soma.
- Não rodei o Playwright, porque outros revisores usam a mesma máquina ao mesmo tempo. Os números verdes acima são os do documento da correção e do portão da tarefa, que provou as três mutações.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-12 13:38:11 · `tasks/correcoes/2026-10-12-estrutura-lista-estoura-o-prazo.md`

VEREDITO: APROVADO

Tela vista: sim (11 fotos lidas das 18 do diretório: `coordenacao--coordenacao-estrutura--computador-1/2`, `celular-1/2`, `vazia--…--computador`, `vazia--…--celular-1/2`, `a-has-text-Lista-de-nomes--computador`, `--celular-1/2` e a vazia `--computador`/`--celular`; cheia e vazia). Nenhum arquivo de `apps/web` mudou, então as fotos mostram telas que esta correção não tocou. As demais são `Lista-de-nomes--*` e as duas `sessao-*.json`, ficaram sem leitura: a diferença para os nomes `a-has-text-…` é só o rótulo do clique, e a obs. do prompt diz que a tarefa não alterou tela.

Estados: ok. A correção só reparte um caso de e2e e preserva a cobertura dos quatro estados da lista de nomes e da turma aberta (`e2e/estrutura.spec.ts:1062-1092`):
- Carregando: `Carregando a turma…` segurado por `portao()`.
- Erro: a lista cai (503) com `alert` e "Tentar de novo", e a turma cai com "Voltar para Estrutura" e "Tentar de novo".
- Vazio: a foto mostra "Nenhum nome nesta turma ainda" com "Cole a lista ou envie o arquivo…", que convida a agir.
- Com dado: a lista com 3 nomes, com a matrícula e o estado de cada um.

Acessibilidade: a verificação de acessibilidade (`violacoesGraves`) foi mantida na lista em erro, na linha 1065 do caso novo. Nas fotos há rótulo em todos os campos, foco no padrão e contraste legível.

Chromebook fraco: sem mudança de produto. O caso novo roda em paralelo com o primeiro (`fullyParallel`), e o prazo (`test.slow()`) não foi aumentado.

Celular: as fotos de 360 px não têm rolagem horizontal nem texto cortado. Os botões "Retirar", "Lista de nomes", "Renomear" e "Excluir" têm altura de toque confortável, e os da lista ocupam a largura toda. Esta correção não alterou nada disso.

Ação oficial protegida: sim. A correção não cria nem altera ação oficial; a asserção "Nada foi gravado" da turma excluída entre a prévia e o "Gravar lista" foi mantida (`e2e/estrutura.spec.ts:1088-1091`).

Checagens feitas na árvore:
- `npx tsc -p e2e/tsconfig.json` e `npx eslint e2e/estrutura.spec.ts --max-warnings=0` saem limpos, então não há variável solta do corte.
- O caso novo é autossuficiente: monta a própria escola, a turma e dois nomes, e declara de novo `campo`, `verPrevia`, `subir` e `previa`. O trecho do corte não usava `leituras` nem `previas`.
- Os três trechos foram movidos sem mudar nenhuma asserção.
- As três mutações da tarefa casam com o código da tela e derrubam o caso novo:
  - `ListaDaTurma.tsx:119`: o rótulo `Carregando a turma…`. O caso procura esse texto.
  - `ListaDaTurma.tsx:196`: `nomes.isError ?`. Com a condição `&& itens.length > 0`, a lista vazia cai no `EstadoVazio` e o `alert` esperado some.
  - `ListaDaTurma.tsx:416`: a mensagem de `NAO_ENCONTRADO` da gravação. O contexto da linha anterior (`ENTRADA_INVALIDA`) a distingue da cópia da linha 581.
- O nome novo do caso de cima não aparece em nenhum outro documento ou mutação (grep em todo o repositório).

Bloqueantes: nenhum.

Recomendações:
- O campo de arquivo nativo aparece em inglês, "Choose File / No file chosen", nas fotos 1366 e 360 de `a-has-text-Lista-de-nomes` (cheia e vazia). O ponto de partida é `apps/web/src/areas/coordenacao/ListaDaTurma.tsx` (campo "Ou escolha o arquivo"). O texto nativo segue o idioma do navegador, não o da página, então no Chromebook em pt-BR sai "Escolher arquivo", e a vitrine roda Chromium em en-US. Não bloqueia e não pertence a esta correção. Se a escola tiver máquina com navegador em inglês, vale trocar por um botão próprio com `<label>` e `input` oculto, em uma tarefa de tela.
- A correção cita "de 66 s a 78 s" e "37 s a 41 s" por caso. Quando a esteira rodar a fatia de novo, registre o tempo do primeiro caso para confirmar a folga (o limite é 90 s, e o desenho diz ~41 s). Isso é só acompanhamento.
