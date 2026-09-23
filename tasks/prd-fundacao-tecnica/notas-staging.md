# Notas para quando o staging for criado

> Saiu do F0 em 13/09/2026, quando ele passou a ser só local (D31). O que está aqui foi
> pesquisado e revisado pelo `infra-guardian` durante a Tech Spec do F0. Não é decisão: é
> ponto de partida para o PRD ou a tarefa que criar o staging. O provedor é escolhido nesse
> momento (D42).

## Requisitos que saíram do PRD do F0

- Todo commit verde no `main` chega ao staging sem passo manual; o staging mostra o sha
- Staging fechado e não indexável; acesso nomeado revogável na hora
- Link de demonstração que expira sozinho
- Check externo de disponibilidade
- Alertas chegando ao celular, silenciáveis fora de ensaio
- Custo mensal total do ambiente consultável, com rateio pela marcação de uso do F0

## Provedor (pesquisa de 13/09/2026)

- **AWS São Paulo:** única com todos os critérios da D42 confirmados em fonte oficial.
  - Staging ≈ US$ 170/mês; produção do primeiro ano ≈ US$ 1.000–1.300/mês.
  - ElastiCache por nó, não Serverless, que não permite `noeviction`.
  - Fatura em BRL com NFS-e.
- **Google São Paulo:** segunda opção. WebSocket no Cloud Run corta em 60 min, e o preço não
  foi verificado.
- **Azure Brazil South:** eliminada, porque o Blob não tem API S3.
- **Magalu Cloud:** eliminada, porque não tem Redis gerenciado.
- **Custo zero:** Oracle Always Free em São Paulo.
  - Desde 15/06/2026 são 2 OCPU e 12 GB.
  - Recupera VM ociosa quando CPU, rede e memória ficam abaixo de 20% em 7 dias.
  - Exige cartão.
  - Mede comportamento, não capacidade.

## Desenho proposto

- **Borda:**
  - Caddy com HTTPS automático (hostname DuckDNS enquanto não houver domínio),
    `X-Robots-Tag: noindex` e `forward_auth` para um portão mínimo.
  - O portão aceita cookie de demonstração com HMAC e `exp`, emitido por
    `ops:link-demo --validade 1h`. Sem cookie, consulta o oauth2-proxy (login GitHub,
    `--github-user`).
  - Revogar = tirar o usuário e rotacionar `COOKIE_SECRET`.
  - ⚠️ Remover o usuário pode não matar o cookie emitido.
- **Deploy:**
  - Job `deploy-staging` depois do `ci.yml` verde, com
    `concurrency: {group: staging, cancel-in-progress: false}`.
  - `deploy.sh <sha>` recusa sha que não descende do publicado
    (`git merge-base --is-ancestor`).
  - Build, `migrar` e troca de uma instância por vez usando a drenagem do F0.
  - Smoke `versao == sha`; se falhar, `rollback.sh` volta para `ultima-verde`.
  - Em produção, o script recusa horário letivo sem `--justificativa`.
  - Numa VM, usar runner self-hosted (não abre SSH e não gasta minuto).
- **Observabilidade:**
  - Grafana Cloud grátis na região São Paulo (`prod-sa-east-1`): 10 mil séries e 14 dias.
    Recebe só id.
  - Grafana Alloy na máquina lendo OTLP e logs do Docker.
- **Check e alerta:**
  - UptimeRobot grátis em `/saude` a cada 5 min.
  - Alertas do Grafana por webhook para o ntfy.sh (tópico secreto, só nome do alerta).
  - Mute timing fora de ensaio e `ops:alertas:ensaio`.
  - ⚠️ Webhook Grafana→ntfy, webhook e pausa no UptimeRobot grátis e mute no Grafana grátis
    não foram verificados. Reserva: Telegram.
  - Runbook "Sistema fora do ar" preenchido junto.
- **Custo:** tabela `custo_infra_mensal (ambiente, mes, valor_centavos, fonte,
  registrado_por)`, `ops:custo:registrar` e a view `rateio_custo_mensal` sobre
  `uso_infra_diario`.
- **Suboperadores a registrar no F3:** provedor de hospedagem, Grafana Cloud, UptimeRobot e
  ntfy.sh, todos só com id ou dado sintético.
- **Painel da operação (A0, D76):** antes do staging, a borda restringe `/operacao` e
  `/v1/operacao/*` — lista de IPs da equipe, host separado ou rede interna, a decidir com o
  provedor (D42) —, com teste em `tools/ci/borda.test.ts`. No MVP local os dois caminhos saem pela
  mesma borda, porque tudo é sintético e roda na nossa máquina.
