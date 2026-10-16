import { useEffect } from 'react'
import { criarFatia } from './demo/nucleo'

/* AS PREFERÊNCIAS (13ª rodada, 04/10/2026; plano de painéis e introdução, seção 6.1).

   O que a introdução de cada papel configura e as Configurações mostram, num lugar só (antes moravam na memória de
   `Configuracoes.tsx` e sumiam ao recarregar):
   · texto: o tamanho do texto POR PAPEL (no mesmo navegador a demonstração faz aluno, professor e coordenação);
   · prova: os padrões do cartão da Prova (objetivas, alternativas, gabarito comentado);
   · coordenacao: o resumo de segunda e o alerta do Analista;
   · rede: o cartão que vem primeiro no painel da secretaria e o relatório do mês por e-mail;
   · escolaAoAbrir: a escola que abre primeiro, para quem dá aula em duas.
   "Preparar a semana" NÃO mora aqui: é `ajustesTurma` (professor/abas-turma/UsoTutor.tsx), o mesmo do ⋯ da turma.
   Fatia 'preferencias': recarregar não apaga; "Recomeçar a demonstração" volta aos padrões. */

export type TamanhoTexto = 'padrao' | 'grande' | 'maior'
export type PapelTexto = 'aluno' | 'professor' | 'coordenacao'

export type Preferencias = {
  texto: Record<PapelTexto, TamanhoTexto>
  prova: { questoes: 5 | 10 | 15 | 20; alternativas: 4 | 5; gabarito: boolean }
  coordenacao: { resumo: boolean; alerta: boolean }
  rede: { destaque: 'aprendizagem' | 'uso' | 'escolas' | 'ia'; relatorioMensal: boolean }
  escolaAoAbrir: 'ultima' | 'aurora' | 'cachoeira'
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  texto: { aluno: 'padrao', professor: 'padrao', coordenacao: 'padrao' },
  prova: { questoes: 10, alternativas: 4, gabarito: true },
  coordenacao: { resumo: true, alerta: true },
  rede: { destaque: 'aprendizagem', relatorioMensal: false },
  escolaAoAbrir: 'ultima',
}

const fatia = criarFatia<Preferencias>('preferencias', PREFERENCIAS_PADRAO)

/** Lê com os padrões por baixo (uma fatia gravada por uma versão antiga pode não ter uma chave nova). */
function completo(p: Partial<Preferencias> | undefined): Preferencias {
  const v = p ?? {}
  return {
    texto: { ...PREFERENCIAS_PADRAO.texto, ...(v.texto ?? {}) },
    prova: { ...PREFERENCIAS_PADRAO.prova, ...(v.prova ?? {}) },
    coordenacao: { ...PREFERENCIAS_PADRAO.coordenacao, ...(v.coordenacao ?? {}) },
    rede: { ...PREFERENCIAS_PADRAO.rede, ...(v.rede ?? {}) },
    escolaAoAbrir: v.escolaAoAbrir ?? PREFERENCIAS_PADRAO.escolaAoAbrir,
  }
}

let cacheBruto: Preferencias | undefined
let cacheCompleto: Preferencias = PREFERENCIAS_PADRAO
function memo(bruto: Preferencias): Preferencias {
  if (bruto !== cacheBruto) { cacheBruto = bruto; cacheCompleto = completo(bruto) }
  return cacheCompleto
}

/** As preferências, como hook (relê quando mudam, nesta aba ou noutra). */
export function usePreferencias(): Preferencias {
  return memo(fatia.useValor())
}

/** Leitura fora do React. */
export const lerPreferencias = (): Preferencias => memo(fatia.ler())

type Mudanca = { [K in keyof Preferencias]?: Preferencias[K] extends object ? Partial<Preferencias[K]> : Preferencias[K] }

export const preferencias = {
  /** Mescla por chave: `mudar({ prova: { questoes: 15 } })` mantém alternativas e gabarito. */
  mudar(p: Mudanca) {
    fatia.mudar((bruto) => {
      const a = completo(bruto)
      return {
        texto: p.texto ? { ...a.texto, ...p.texto } : a.texto,
        prova: p.prova ? { ...a.prova, ...p.prova } : a.prova,
        coordenacao: p.coordenacao ? { ...a.coordenacao, ...p.coordenacao } : a.coordenacao,
        rede: p.rede ? { ...a.rede, ...p.rede } : a.rede,
        escolaAoAbrir: p.escolaAoAbrir ?? a.escolaAoAbrir,
      }
    })
  },
}

export const ZOOM_DO_TAMANHO: Record<TamanhoTexto, string> = { padrao: '', grande: '1.1', maior: '1.2' }

/** Aplica o tamanho do texto do papel enquanto a tela dele está montada, e limpa ao sair. */
export function useTamanhoDoTexto(papel: PapelTexto): void {
  const tamanho = usePreferencias().texto[papel]
  useEffect(() => {
    const raiz = document.documentElement
    try { raiz.style.zoom = ZOOM_DO_TAMANHO[tamanho]; raiz.style.setProperty('--zoom', ZOOM_DO_TAMANHO[tamanho] || '1') } catch { /* sem zoom */ }
    return () => { try { raiz.style.zoom = ''; raiz.style.removeProperty('--zoom') } catch { /* sem zoom */ } }
  }, [tamanho])
}
