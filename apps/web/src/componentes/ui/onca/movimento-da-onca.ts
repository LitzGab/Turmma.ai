import { useEffect, useState } from 'react'

/**
 * O movimento da onça de corpo inteiro que o JavaScript decide: o acenar da primeira vez (`Onca.css` faz o resto). Não há
 * temporizador: o piscar por temporizador foi vetado (parecer do `conformidade-reviewer`, D59). É o **único arquivo** da pasta
 * com efeito e estado (`Onca.test.tsx` reprova os outros), e nada aqui liga com "reduzir movimento": o navegador diz.
 */

const CHAVE_DE_JA_ACENOU = 'turmma-onca-acenou'

export function reduzMovimento(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function acenouNestaSessao(): boolean {
  try {
    return sessionStorage.getItem(CHAVE_DE_JA_ACENOU) !== null
  } catch {
    return false
  }
}

function marcarQueAcenou(): void {
  try {
    sessionStorage.setItem(CHAVE_DE_JA_ACENOU, '1')
  } catch {
    // Armazenamento negado (modo privado): a onça acena e segue, e a próxima também pode acenar.
  }
}

/**
 * `acenando` acena uma vez só por sessão: a primeira onça que aparece. As seguintes ficam paradas. A leitura é na montagem, e a
 * marca de "já acenou" é gravada logo depois, num efeito: sem estado mudado dentro do efeito.
 */
export function useAcenarNaPrimeiraVez(acenando: boolean): boolean {
  const [acena] = useState(() => acenando && !reduzMovimento() && !acenouNestaSessao())
  useEffect(() => {
    if (acena) marcarQueAcenou()
  }, [acena])
  return acena
}
