# ⚠️ Mockups da interface — NÃO É CÓDIGO DO PRODUTO

Esta pasta é um **protótipo só de front-end**, feito para ver o sistema inteiro antes de construir. Sem backend,
sem servidor, todo dado é sintético.

**Para não misturar:**

- **Só para consulta.** A pasta entrou na `develop` em 23/09/2026 (merge do branch `mockups/interface`), isolada
  do produto pelas regras abaixo. Em 16/10/2026 passou à **versão de outubro** (`Prototipo_Turmma`, branch
  `mockups/interface`, commit `a95568d`), a que a D80 descreve, por decisão do Joaquim. A cópia é fiel, com duas
  exceções: este `README.md` e o `LEIAME.md` dizem onde a pasta mora, e três linhas foram reescritas sem mudar o
  que a tela faz, porque o gitleaks da esteira as lia como chave (a constante `DO_TOKEN`, que virou
  `ALFABETO_DO_LINK`, em `src/dados/acesso.ts` e em `.antes-da-remodelagem/…/ConvidarAlunos.tsx`, e a palavra
  "token" num comentário de `src/dados/escola-estado.ts`)
- **Os números de decisão nos comentários daqui** (D61, D70, D78 a D80) são os do protótipo, **não** os de
  `docs/decisoes.md` (D80)
- **Não copiar código daqui para o `apps/web`** nem para os `packages/`. Aqui valem atalhos que o produto não aceita
  (sem teste, sem orçamento de JS, peças do 21st.dev coladas sem revisão de licença, regras do `docs/interface.md`
  quebradas de propósito para ver como fica). A única exceção é o traço da onça (`src/components/duo/onca/`), copiado
  para `apps/web/src/componentes/ui/onca/` e guardado por teste contra o original (D80, revista em 28/10/2026).
- **Não é workspace** do monorepo: não entra no `npm run build`, no lint nem nos testes da raiz (o ESLint da raiz
  ignora `mockups/**`).
- O que vale é o **desenho**. O que for aprovado volta para o `docs/interface.md`, vira decisão em
  `docs/decisoes.md` e é construído no produto pelo processo normal (`/descobrir` → PRD → tarefas).
- O que as telas pedem ao produto e ainda não existe (modelo de dados, regras, riscos) está em
  `docs/pendencias-dos-mockups.md`: 31 itens, P01 a P31.

## Rodar

```bash
cd mockups
npm install        # só na primeira vez
npm run dev        # http://127.0.0.1:5190
```

Comece pelo mapa das telas em `/`. Organização, rodadas de revisão e decisões de desenho: [LEIAME.md](LEIAME.md).
