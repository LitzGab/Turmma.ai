// Aninhamento (max-depth: 4, RF11): quatro níveis de `if` passam, o quinto reprova.
export function quatro(n: number): number {
  let r = 0
  if (n > 0) {
    if (n > 1) {
      if (n > 2) {
        if (n > 3) {
          r = 1
        }
      }
    }
  }
  return r
}

export function cinco(n: number): number {
  let r = 0
  if (n > 0) {
    if (n > 1) {
      if (n > 2) {
        if (n > 3) {
          if (n > 4) { // reprova: max-depth
            r = 1
          }
        }
      }
    }
  }
  return r
}
