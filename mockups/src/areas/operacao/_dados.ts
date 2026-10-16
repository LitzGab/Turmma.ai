import { USO_DE_AGOSTO, USO_DE_SETEMBRO, type EscolaDaOperacao, type TipoRede } from '@/dados/rede'

/* Dados de apoio do painel da operação (12ª rodada, 04/10/2026; plano de polimento, 5.5).
   Não inventa número: as escolas, as redes e o uso de setembro vêm de `dados/rede.ts`, a MESMA fonte que a
   secretaria lê (6 escolas municipais, 3.412 alunos). Aqui fica só o que a tela precisa a mais: o link, a forma
   de escrever número e dinheiro, e agosto (um pouco abaixo de setembro, com a mesma lista de escolas).
   Tudo AGREGADO por escola: a operação não alcança pessoa nenhuma (D76; regra 10, item 8). */

export type Tipo = TipoRede
export const TIPOS: Tipo[] = ['Particular', 'Municipal', 'Estadual']

export const enderecoCompleto = (slug: string) => `turmma.com/e/${slug || '…'}`

/** Link da escola: minúsculas, sem acento, palavras ligadas por hífen; sigla com ponto vira uma palavra só. */
export function paraEndereco(texto: string) {
  return texto
    .replace(/\b(\p{L})\.\s*(?=\p{L}\.)/gu, '$1')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

/** Enquanto digita: deixa o hífen do fim (a pessoa ainda vai escrever a próxima palavra). */
export const digitarEndereco = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-/, '').slice(0, 48)

export const inteiro = (n: number) => n.toLocaleString('pt-BR')
export const reais = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** "612 alunos · 22 turmas · 31 prof." */
export const usoCurto = (e: Pick<EscolaDaOperacao, 'alunos' | 'turmas' | 'professores'>) =>
  `${inteiro(e.alunos)} alunos · ${e.turmas} turmas · ${e.professores} prof.`

/* ── Uso ──────────────────────────────────────────────────────────────────────────────────────────────── */

export type UsoDaEscola = { alunosAtivos: number; trocasTutor: number; geracoes: number; custoIA: number; tetoIA: number }
export type Mes = 'setembro' | 'agosto'

/* Agosto mora em `dados/rede.ts` (USO_DE_AGOSTO), a mesma fonte da rede e do Analista. */

/** O uso de uma escola num mês; `undefined` quando a escola ainda não tinha uso. */
export function usoDe(escolaId: string, mes: Mes): UsoDaEscola | undefined {
  const u = (mes === 'setembro' ? USO_DE_SETEMBRO : USO_DE_AGOSTO)[escolaId]
  return u && u.custoIA > 0 ? u : undefined
}

/** O teto de IA do mês, em reais (o que a operação mexe pelo ⋯ vale por cima deste). */
export const tetoPadrao = (escolaId: string) => USO_DE_SETEMBRO[escolaId]?.tetoIA ?? 0
