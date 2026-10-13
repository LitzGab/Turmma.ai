# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-10-13 01:57:55 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `revisao-spec` | O texto do botão desligado se contradiz entre os documentos, e a versão que a tarefa implementa reprova 4,5:1 no escuro. |
| 2026-10-13 01:58:22 | `conformidade-reviewer` | 1ª | REPROVADO | `revisao-spec` | A 10.2 manda a onça dormindo para a X1. `docs/interface.md:1340`, na tabela "O catálogo das peças da X1", diz para os três de `estado/`: "O vazio 'Tudo em dia'… |
| 2026-10-13 01:59:20 | `infra-guardian` | 1ª | REPROVADO | `revisao-spec` | A troca de `public/` por asset com hash foi feita só na seção 7c. Em dois lugares a spec ainda manda para `public/`, e o teto próprio não tem número. |
| 2026-10-13 02:01:47 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | O desligado está em duas cores, e nenhum teste liga a classe do botão ao par. |
| 2026-10-13 02:05:06 | `frontend-reviewer` | 2ª | APROVADO | `revisao-spec` | `1_task.md:127` cita como fonte a linha "Texto sobre o desligado de hoje" da tabela de pares, mas a linha se chama "desligado de antes" (`docs/interface.md`… |
| 2026-10-13 02:05:24 | `conformidade-reviewer` | 2ª | APROVADO | `revisao-spec` | A regra do teste de arquitetura falha contra o próprio avatar. Como está escrita na Tech Spec §10 e no 8.4 ("só `AssinaturaIA` e `Mensagem.tsx` importam o… |
| 2026-10-13 02:05:34 | `infra-guardian` | 2ª | APROVADO | `revisao-spec` | da rodada anterior que fecharam: |
| 2026-10-13 02:06:13 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | `2_task.md`, linha 80 (RF24): o valor da lateral recolhida está errado. A tabela exige `educa.lateral-recolhida` com valor do conjunto `1`. O código grava… |
| 2026-10-13 02:09:02 | `test-engineer` | 3ª | APROVADO | `revisao-spec` | O parêntese da linha 80 do `2_task.md` diz "abaixo de 768 não há o que recolher". Pelo código, entre 768 e 1023 px também não há botão de recolher: só o… |
| 2026-10-13 02:14:00 | `frontend-reviewer` | 1ª | APROVADO | `1_task` | `apps/web/src/estilos.css` (regra `.bg-noite :focus-visible`, cerca de linha 295). No escuro, `noite` vira `#f1f7fb`. O anel `caramelo-noite` (`#f2a25b`) sobre… |
| 2026-10-13 02:15:06 | `test-engineer` | 1ª | REPROVADO | `1_task` | A guarda não reprova `text-tinta` sobre face forte. O cenário "o texto sobre face forte" exige isso, e a fixture em `apps/web/src/estilos.test.ts:249` ainda… |
| 2026-10-13 02:15:46 | `revisor-geral` | 1ª | REPROVADO | `1_task` | A guarda deixa passar `text-tinta` sobre o laranja. Em `apps/web/src/estilos.test.ts:146-165` (`classesReprovadas`) e `:249`, a guarda não reprova `text-tinta`… |
| 2026-10-13 02:25:00 | `frontend-reviewer` | 2ª | APROVADO | `1_task` | Foco `.bg-noite :focus-visible` no escuro. |
| 2026-10-13 02:25:39 | `test-engineer` | 2ª | APROVADO | `1_task` | A guarda só compara classes com o mesmo prefixo de variante. Por isso `bg-superficie text-tinta hover:bg-caramelo` passa, e na tela o hover fica com `tinta`… |
| 2026-10-13 02:26:21 | `revisor-geral` | 2ª | REPROVADO | `1_task` | `apps/web/src/estilos.test.ts:148` e `:186-192`: a guarda não pega toda cor escrita dentro do `style={{…}}`. A correção pedia reprovar qualquer hex, `rgb(` ou… |
| 2026-10-13 02:35:52 | `frontend-reviewer` | 3ª | APROVADO | `1_task` | Foco `.bg-noite :focus-visible` no escuro. |
| 2026-10-13 02:36:39 | `test-engineer` | 3ª | APROVADO | `1_task` | . |
| 2026-10-13 02:36:53 | `revisor-geral` | 3ª | REPROVADO | `1_task` | `apps/web/src/estilos.test.ts:186-187` |
| 2026-10-13 07:59:06 | `test-engineer` | 4ª | REPROVADO | `1_task` | A seção Mutações de `tasks/prd-pele-e-casca/1_task.md` (blocos das linhas 202-230) não tem bloco para duas mudanças novas desta rodada: |
| 2026-10-13 07:59:08 | `revisor-geral` | 4ª | REPROVADO | `1_task` | A Tech Spec não diz o que o `1_task.md` afirma que ela diz. |
| 2026-10-13 08:05:45 | `test-engineer` | 5ª | APROVADO | `1_task` | `apps/web/src/estilos.test.ts:147`: a linha nova do comentário ficou bem mais longa que as outras do bloco, porque juntou "Quem cair num deles troca o nome. O… |
| 2026-10-13 08:05:53 | `revisor-geral` | 5ª | REPROVADO | `1_task` | `tasks/prd-pele-e-casca/techspec.md:198`: a correção pedida na 4ª rodada foi feita, mas quebrou a frase seguinte. |
| 2026-10-13 08:13:39 | `revisor-geral` | 6ª | REPROVADO | `1_task` | `tasks/prd-pele-e-casca/techspec.md:198` (linha Unidade, "Guarda de cor") e `tasks/prd-pele-e-casca/cenarios.md:199` (U3, "oráculo novo"). |
| 2026-10-13 08:20:43 | `revisor-geral` | 7ª | APROVADO | `1_task` | `tasks/prd-pele-e-casca/1_task.md:97`: troque "na mesma classe de uma face forte" por "na mesma lista de classes e com a mesma variante de uma face forte".… |
| 2026-10-13 09:34:05 | `privacy-guardian` | 1ª | APROVADO | `2_task` | Pôr no `docs/lgpd.md` uma linha que diga "o navegador guarda só preferência de aparelho, sem identificador" e que aponte para `docs/interface.md` seção 6.… |
| 2026-10-13 09:35:50 | `revisor-geral` | 1ª | REPROVADO | `2_task` | Duas subtarefas da Tech Spec ficaram sem dono. Estão em `tasks/prd-pele-e-casca/tasks.md:23` (subtarefa 2.4 da tarefa 2.0) e em… |
| 2026-10-13 09:36:00 | `test-engineer` | 1ª | REPROVADO | `2_task` | `apps/web/src/tema.ts:84` — regra sem teste. |
| 2026-10-13 09:37:34 | `frontend-reviewer` | 1ª | APROVADO | `2_task` | Foco do `Segmentado` dentro da faixa da operação. `apps/web/src/estilos.css:306` (`.bg-noite :focus-visible`) pinta o anel das opções em `caramelo-noite`… |
| 2026-10-13 09:52:14 | `revisor-geral` | 2ª | APROVADO | `2_task` | Tabela partida em `tasks/prd-pele-e-casca/2_task.md:164`. Uma linha em branco separa as duas linhas novas do resto da tabela de "Divergências". Sem cabeçalho,… |
| 2026-10-13 09:52:21 | `privacy-guardian` | 2ª | APROVADO | `2_task` | Continua em aberto a da 1ª rodada, já anotada em `TODO.md:1008-1012` e sem bloquear: quando o F16 servir a política de segurança de conteúdo, conferir que o… |
| 2026-10-13 09:52:34 | `test-engineer` | 2ª | APROVADO | `2_task` | `apps/web/src/componentes/Segmentado.tsx:55`: a volta na outra ponta, `(indice + 1) % total`, não tem bloco próprio. Ela tem teste: `Segmentado.test.tsx:92-93`… |
| 2026-10-13 09:54:45 | `frontend-reviewer` | 2ª | APROVADO | `2_task` | `apps/web/src/componentes/CaixaPedido.tsx:112-125` (`escuro--coordenacao--galeria--celular-4.png`, igual no claro): a 360 px o placeholder "Peça uma atividade,… |
