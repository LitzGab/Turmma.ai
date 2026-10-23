import { ETAPAS_DE_DEPENDENCIAS } from './etapas-de-guarda.ts'
import { encerrarCom, executarEtapas } from './executar.ts'

// `npm run guarda:dependencias`: as guardas de dependência da esteira (`ci:verificar`), para o portão local. As mesmas
// etapas, importadas de `etapas-de-guarda.ts` e não redigitadas num script do `package.json`: o `npm audit` e o knip que
// a esteira roda são os que o portão roda.
await encerrarCom(executarEtapas(ETAPAS_DE_DEPENDENCIAS))
