# TODO fora do código

O que trava o projeto e não se resolve programando. Vários têm prazo externo.

## LGPD e conformidade — prioridade máxima

- [ ] Contrato de tratamento de dados escola↔nós, com advogado (escola controladora)
- [ ] Contrato com provedor de IA vedando treinamento com nosso dado
- [ ] Política de privacidade e termos, com seção de menor de idade
- [ ] Indicar encarregado (DPO) e publicar canal de contato
- [ ] Relatório de impacto (RIPD) — dado de menor, volume alto, IA no fluxo
- [ ] Definir prazos de retenção com uma escola real (varia por rede)
- [ ] Escrever e ensaiar o processo de incidente
- [x] ~~Decidir região de hospedagem~~ — Brasil (D28)

## Infra e operação

- [ ] Escolher provedor de hospedagem em região Brasil, com Postgres + pgvector, Redis e
      storage S3 gerenciados (D26, D28)
- [ ] Contrato com provedor de modelo: veda treinamento, limite de tokens por minuto
      compatível com o pico (~1,5 mi/min em 10 escolas), e região de processamento (D29)
- [ ] Provedor de modelo de reserva configurado e testado
- [ ] Levantar a região de processamento dos provedores e se a rede pública aceita
      transferência internacional de dado minimizado
- [ ] Escolher ferramenta de observabilidade e de alerta no celular (região Brasil ou
      hospedada por nós)
- [ ] Levantar com a escola piloto: horário letivo real, banda da rede, se há proxy ou
      filtro de conteúdo que bloqueie WebSocket

## Regulação educacional

- [ ] Ler as diretrizes do CNE na íntegra e revisar a regra 70 contra o texto oficial
- [ ] Transformar a conformidade em material de venda: "já estamos dentro do prazo de 12 meses"
- [ ] Confirmar exigências de registro escolar da rede alvo

## Material didático

- [ ] Modelo de autorização escrita da escola para cada fonte de material
- [ ] Levantar quais sistemas de ensino as escolas alvo usam (decide o primeiro adaptador, D22)
- [x] ~~Decidir: adaptador por fonte ou extração genérica~~ — upload primeiro, adaptador por
      fonte quando houver escola real (D22)
- [ ] Conjunto fixo de amostras para medir qualidade da extração e da classificação BNCC
- [ ] Baixar e organizar as provas oficiais do ENEM do INEP para o banco público (D21)
- [ ] Verificar licença de uso das provas de vestibular antes de incluir qualquer uma

## Produto

- [ ] Fechar a lista de agentes e o nível de autonomia de cada um (`/descobrir agentes`)
- [ ] Definir teto de uso do tutor por aluno e orçamento de tokens (`/descobrir teto do tutor`)
- [ ] Decidir o modelo de cobrança: contrato por aluno, créditos, ou os dois
- [x] ~~Decidir se o aluno acessa de casa desde o início~~ — escola decide por turma (D19)
- [x] ~~Definir o que o coordenador precisa ver na primeira semana~~ — as quatro coisas do D24

## Marca e interface

- [ ] Identidade visual (cores, tipografia, logo) para o frontend seguir — Gabriel
- [ ] Landing page — Gabriel

## Comercial

- [ ] Planilha de custo de IA por aluno/mês → validar a margem do R$ 30
- [ ] Escola piloto (contatos existem, nada decidido com base neles)
- [ ] Roteiro de demonstração para coordenador e para assembleia de pais
- [ ] Aproveitar setembro como pico de compra para o ano seguinte

## Marca

- [ ] Nome definitivo, busca no INPI, domínio. "Educa.ia" é provisório e há vizinhos
      próximos no mercado ("IA Educa Brasil", "Eduka.ai")

## Fase posterior

- [ ] Iniciar aprovação da API oficial do WhatsApp (prazo de semanas — comece antes de precisar)
- [ ] Portal da família sobre o motor de eventos
