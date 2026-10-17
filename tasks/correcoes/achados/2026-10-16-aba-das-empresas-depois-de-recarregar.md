# Achados das revisões — `tasks/correcoes/2026-10-16-aba-das-empresas-depois-de-recarregar.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-16 19:45:56 · `tasks/correcoes/2026-10-16-aba-das-empresas-depois-de-recarregar.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas, cheia e vazia, computador e celular, aba "Empresas que recebem dados"). A tarefa não alterou tela nenhuma. A mudança é só o prazo de duas asserções do e2e, em `e2e/privacidade.spec.ts:306-308`. `PRAZO_DA_ENTRADA_MS` já estava importado na linha 2.
Estados: ok. Vazio e com dado aparecem nas fotos, e o vazio convida: diz quando a empresa aparece e o que mostra. Carregando e erro não mudaram, e a correção descreve o "Carregando…" da casca como causa da espera.
Acessibilidade: sem mudança. A aba tem `aria-selected`, o foco visível não foi tocado, e as abas são localizadas por papel e nome.
Chromebook fraco: o prazo de 20 s da entrada é o mesmo que as outras três recargas do arquivo já usam. Não toca produto nem peso de bundle.
Celular: a 360 px não há rolagem horizontal nem texto cortado, e as quatro abas ficam empilhadas e legíveis. Não medi a altura dos alvos de toque. A tarefa é só de teste e o e2e roda também no projeto `celular`.
Ação oficial protegida: não se aplica. A aba só lista empresas.
Bloqueantes: nenhum.
Recomendações:
- A barra lateral a 1366x768 (`coordenacao--coordenacao-privacidade-suboperadores--computador.png`, e a vazia igual) corta o item "PRIVACIDADE", escondido atrás do bloco do usuário e da aparência. Não é desta tarefa e a lista pode rolar, mas o item da página aberta fica pela metade. Vale conferir a rolagem da navegação lateral na casca, em outra tarefa.
- Os nomes "Colégio sintético da vitrine cheia 2c88b5b2" e "Coordenadora sintética 5bae289f" vêm do dado da vitrine, não do produto.
- Na rodada de correção, `tasks/correcoes/2026-10-16-aba-das-empresas-depois-de-recarregar.md` já declara que o custo do sino na recarga fica para uma tarefa à parte. Isso está certo e não bloqueia.

## test-engineer · 1ª rodada · APROVADO · 2026-10-16 19:46:09 · `tasks/correcoes/2026-10-16-aba-das-empresas-depois-de-recarregar.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta correção não acrescenta regra nova. O teste já existente em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/privacidade.spec.ts:298` (`as duas abas se alternam pelo clique ou toque, e o endereço guarda a aba`) precisa continuar provando, depois do `page.reload()`, três coisas:
- o endereço continua sendo o da aba das empresas;
- a aba das empresas é a que aparece escolhida (`aria-selected="true"`);
- a lista mostra a empresa desta escola.

Ele também precisa continuar provando a volta para a aba da retenção, sem mostrar as empresas. Isso nos dois projetos, `chromebook` e `celular`.

**Cobertos:**
- **As asserções não mudaram.** O diff só acrescenta `{ timeout: PRAZO_DA_ENTRADA_MS }` (20 s, definido em `e2e/__fixtures__/casca.ts:116`) nas linhas 307 e 308. Nenhuma asserção foi removida nem afrouxada.
- **O teste ainda falha sem a regra.** Se a recarga não guardasse a aba, a tela abriria na aba dos pedidos, e a asserção de `aria-selected` da linha 308 ficaria vermelha ao fim dos 20 s. Ela confere a aba na tela, e não só o endereço. Isso também pega o caso em que a página redireciona depois de carregar: a linha 307 passaria antes do redirecionamento, mas a 308 cai. Prazo maior não deixa a regra passar sem estar certa: o teste só tolera uma carga mais lenta.
- **O prazo segue o resto do arquivo.** As outras recargas (linhas 159, 352–353 e 360–361) e o `abrirAsEmpresas` (linhas 248 e 250) já usam o mesmo prazo. Não é um prazo inventado para passar só com a máquina folgada: é o prazo do Chromebook com CPU ×4 e rede Fast 3G que o arquivo inteiro já declara.
- **Mutações:** "Nenhuma" está certo. O `git diff` mexe só num arquivo de teste e não traz cláusula de produto.
- **Nada escondido:** não há `.skip`, `.only` nem `.fixme` no arquivo, e nenhum mock novo.
- Não toca IA nem concorrência. O isolamento das empresas continua no caso da linha 254, que esta correção não alterou.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O documento da correção (linhas 9, 19 e 58) diz "linhas 306 e 307", mas o comentário novo empurrou as asserções para 307 e 308. É só o texto, para quem procurar depois.
2. A causa registrada é que os pedaços do sino e as seis leituras da fila disputam as conexões na recarga. É custo real de carregamento na máquina de referência (regra 50, item 1), e o prazo de 20 s só o absorve. Vale virar item no `TODO.md` ou uma tarefa à parte, para o `/retro` não perder, antes de outra recarga encostar nos 20 s.
3. Não rodei o e2e: ele precisa do ambiente completo, e o pedido era não pôr a máquina sob carga. A aprovação vem da leitura do diff e do teste. A prova de verde (18 de 18 no arquivo e 6 de 6 no caso repetido, nos dois projetos) é a que o documento registra, e a esteira desta spec a confirma.
