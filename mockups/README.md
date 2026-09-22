# ⚠️ Mockups da interface — NÃO É CÓDIGO DO PRODUTO

Esta pasta é um **protótipo só de front-end**, feito para ver o sistema inteiro antes de construir. Sem backend,
sem servidor, todo dado é sintético.

**Para não misturar:**

- **Não fazer merge** do branch `mockups/interface` no `main`, `release` ou `develop`. Ele existe só para consulta.
- **Não copiar código daqui para o `apps/web`** nem para os `packages/`. Aqui valem atalhos que o produto não aceita
  (sem teste, sem orçamento de JS, peças do 21st.dev coladas sem revisão de licença, regras do `docs/interface.md`
  quebradas de propósito para ver como fica).
- **Não é workspace** do monorepo: não entra no `npm run build`, no lint nem nos testes da raiz (o ESLint da raiz
  ignora `mockups/**`).
- O que vale é o **desenho**. O que for aprovado volta para o `docs/interface.md`, vira decisão em
  `docs/decisoes.md` e é construído no produto pelo processo normal (`/descobrir` → PRD → tarefas).
- O que as telas pedem ao produto e ainda não existe (modelo de dados, regras, riscos) está em
  `docs/pendencias-dos-mockups.md` (ainda não publicado; chega junto com o próximo commit de docs).

## Rodar

```bash
cd mockups
npm install        # só na primeira vez
npm run dev        # http://127.0.0.1:5190
```

Comece pelo mapa das telas em `/`. Organização, rodadas de revisão e decisões de desenho: [LEIAME.md](LEIAME.md).
