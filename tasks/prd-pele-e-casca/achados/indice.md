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
