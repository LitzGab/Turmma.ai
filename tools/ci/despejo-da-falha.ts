/**
 * Ajudante do teste de integração `compose.int.test.ts`: lê uma linha do que o despejo da falha produz
 * (`docker compose logs --no-color --timestamps`, `ETAPA_DO_LOG_DA_FALHA`). O despejo de verdade, em `compose.ts`, não
 * lê linha nenhuma: nenhum código de produção consome este arquivo.
 *
 * O compose imprime `<serviço>  | <RFC3339Nano do Docker> <mensagem do próprio serviço>`. O que o despejo
 * promete é o **carimbo do Docker logo depois do prefixo**: é ele que ordena linhas de serviços diferentes.
 * O `|` do prefixo é apresentação do compose, e não faz parte da promessa.
 */
export interface LinhaDoDespejo {
  readonly servico: string
  /** O carimbo do Docker, em milissegundos desde a época. */
  readonly instante: number
}

// A fração é opcional: o RFC3339Nano do Go corta zeros à direita, e nanossegundo exatamente 0 sai `...:09Z`.
// O `|` é opcional: a esteira 40095652612 recebeu do compose uma linha com o carimbo do Docker intacto e sem o `|`.
// O serviço começa por letra, para um carimbo solto não passar por nome de serviço. É restrição do projeto, escolhida de
// propósito: o compose aceita nome que começa por dígito, mas nenhum serviço nosso começa (`compose.int.test.ts`, lista de
// serviços). Se um dia houver um, o vermelho "linha sem carimbo do Docker" vem daqui.
const PARTIDA = /^([A-Za-z][\w.-]*)\s+(?:\|\s+)?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z)\s/

/** `undefined` quando a linha não traz o carimbo do Docker logo depois do prefixo do serviço. */
export function lerLinhaDoDespejo(linha: string): LinhaDoDespejo | undefined {
  const partida = PARTIDA.exec(linha)
  if (partida === null) return undefined
  const [, servico = '', carimbo = ''] = partida
  const instante = Date.parse(carimbo)
  if (Number.isNaN(instante)) return undefined
  return { servico, instante }
}
