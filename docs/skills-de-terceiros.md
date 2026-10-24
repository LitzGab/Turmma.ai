# Skills de terceiros: o que fica, o que sai e onde elas conflitam conosco

> Movido da seção "Skills" do `CLAUDE.md` (X7, RF20, RF23). As skills de terceiros (instaladas pelo
> skills.sh, versões em `skills-lock.json`) são referência técnica genérica. **Quando conflitam com
> `.claude/rules/` ou com uma decisão (`docs/decisoes.md`), a regra e a decisão vencem.**

## Os conflitos

Uma linha por skill. A coluna "Linha de conflito" é o texto que vai na primeira linha depois do
frontmatter do `SKILL.md` de cada uma (tarefa 19.0); quem rodou `npx skills update -p` a copia de volta
daqui. A partir da 19.0, um teste do harness acusa a linha que sumiu ou que difere deste texto.

| Skill | Linha de conflito |
|---|---|
| `supabase-postgres-best-practices` | Conflito neste repositório: esta skill recomenda RLS, mas o escopo de tenant é aplicado no repository, a partir do token (regra 10); RLS pode entrar como segunda camada de defesa, nunca no lugar do repository. |
| `vercel-react-best-practices` | Conflito neste repositório: esta skill é escrita para Next.js e somos SPA com Vite (regra 50); ignore Server Components, Server Actions e tudo que depende de servidor Next, e valem as regras de bundle, re-render e carregamento, ainda mais no Chromebook fraco. |
| `playwright-best-practices` | Conflito neste repositório: viewport de celular, toque e rede móvel se aplicam (D51), e toda tela roda nos projetos `chromebook` e `celular`; geolocalização, permissões de aparelho, PWA instalável e app nativo não se aplicam (regra 50, item 2). |
| `lgpd-brasil` | Conflito neste repositório: esta skill resume a lei, e o que vale para o código é `docs/lgpd.md` e a regra 20, mais restritivos (aluno sem e-mail, telefone, CPF, foto, endereço, data de nascimento nem diagnóstico; a adaptação é registrada, nunca o diagnóstico, D35). |
| `nestjs-best-practices` | Conflito neste repositório: a organização em controller, service, repository e DTO de `docs/arquitetura.md` prevalece sobre qualquer outra estrutura que esta skill sugira. |

## O que saiu

| Skill | Motivo |
|---|---|
| `frontend-design` | Pedia ousadia estética; o limite aqui é Chromebook fraco, acessibilidade e a professora com quarenta minutos de intervalo (regra 50), e a pele está fechada (D80). Fonte pesada, animação e efeito que custam CPU ficam de fora. Saiu na tarefa 19.0 (pasta e `skills-lock.json`) |

## O que fica sem conflito

`drizzle-orm-patterns`, `bullmq-specialist`, `tanstack-query-best-practices`, `tailwind-design-system`,
`accessibility` e `vitest`.

## Como ler uma skill de terceiros

Instalada ou atualizada, a skill vira instrução para o Claude: leia o diff de `npx skills update -p`
antes de commitar. O que ela diz de genérico serve de referência; onde diverge de uma regra, de uma
decisão ou de uma linha desta página, vale o nosso.
