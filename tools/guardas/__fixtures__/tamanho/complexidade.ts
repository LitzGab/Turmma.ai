// Complexidade (complexity: 10, RF11): cada `if` soma 1 à base de 1. Dez passa, onze reprova.
export function dez(n: number): number {
  let r = 0
  if (n === 1) r += 1
  if (n === 2) r += 1
  if (n === 3) r += 1
  if (n === 4) r += 1
  if (n === 5) r += 1
  if (n === 6) r += 1
  if (n === 7) r += 1
  if (n === 8) r += 1
  if (n === 9) r += 1
  return r
}

export function onze(n: number): number { // reprova: complexity
  let r = 0
  if (n === 1) r += 1
  if (n === 2) r += 1
  if (n === 3) r += 1
  if (n === 4) r += 1
  if (n === 5) r += 1
  if (n === 6) r += 1
  if (n === 7) r += 1
  if (n === 8) r += 1
  if (n === 9) r += 1
  if (n === 10) r += 1
  return r
}
