// O jeito certo de lançar: erro com tipo, motivo fixo, e o relançamento. Nenhuma linha aqui pode sair com guarda.
declare const condicao: boolean
declare const erro: Error
declare class ErroDeInvariante extends Error {}
declare class ErroDeDominio extends Error {
  constructor(codigo: string)
}
declare class ErroDoModulo extends Error {
  constructor(valor: string)
}
declare const valor: string

export function lancamentos(): void {
  if (condicao) throw new ErroDeInvariante('turma não criada')
  if (condicao) throw new ErroDeInvariante(`turma não criada`)
  if (condicao) throw new ErroDeDominio('NAO_ENCONTRADO')
  if (condicao) throw new ErroDoModulo(valor)
  if (condicao) throw erro
  if (condicao) throw (condicao ? new ErroDeInvariante('a') : new ErroDeInvariante('b'))
}

export class ComCampo extends ErroDeInvariante {
  constructor(readonly lista: readonly string[]) {
    super('lista com problema')
  }

  descrever(): string {
    return String(this.lista)
  }
}

export class ComOutroPai extends Error {
  constructor(valor: string) {
    super(`valor fora: ${valor}`)
  }
}
