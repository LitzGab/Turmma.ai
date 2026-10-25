import { rmSync } from 'node:fs'
import { arquivosAlterados } from '../processo/revisoes.ts'
import { etapasDoSegredo } from './etapas-do-segredo.ts'
import { encerrarCom, executarEtapas, raizRepositorio } from './executar.ts'

// `npm run guarda:segredo`: as etapas estão em `etapas-do-segredo.ts`, que o teste chama.

const { etapas, pastaTemporaria } = etapasDoSegredo(raizRepositorio, arquivosAlterados(raizRepositorio))
await encerrarCom(
  executarEtapas(etapas, () => {
    if (pastaTemporaria !== null) rmSync(pastaTemporaria, { recursive: true, force: true })
    return []
  }),
)
