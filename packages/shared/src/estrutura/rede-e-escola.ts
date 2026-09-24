/**
 * O que define rede e escola, num lugar só, para o banco (checks de `rede` e `escola`), o comando `ops:escola` e o
 * contrato do painel da operação (`operacao/painel.ts`) lerem a mesma regra.
 */

/** Os tipos de rede: prefeitura ou estado, grupo educacional, ou a escola independente como rede de uma unidade. */
export const TIPOS_DE_REDE = ['prefeitura', 'grupo', 'independente'] as const
export type TipoDeRede = (typeof TIPOS_DE_REDE)[number]

/** Endereço da escola: letras minúsculas e dígitos, com hífen só entre eles (`colegio-horizonte`). */
export const FORMATO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const TAMANHO_MAXIMO_SLUG = 63
