import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Botao, Busca, MenuMais, Selo, Tabela, type ColunaTabela, type ItemMenuMais } from '@/components/duo'
import type { Familia } from '@/components/duo'
import type { CoordenacaoDaEscola, EscolaDaOperacao, Rede } from '@/dados/rede'
import { cn } from '@/lib/utils'
import { enderecoCompleto, usoCurto } from './_dados'

/* Aba ESCOLAS (12ª rodada; plano 5.5): as escolas agrupadas por rede. Nenhuma coluna com pessoa: a coordenação
   aparece pelo estado do convite, nunca pelo nome. Um botão cheio só (NOVA ESCOLA, no cabeçalho); o raro mora no ⋯
   (REVOGAR, desde a 14ª rodada). Colunas proporcionais: Escola · Link 24% · Coordenação 25% (o selo e CONVIDAR ou
   REFAZER) · Uso 24% · ⋯.
   A Tabela duo não agrupa: no computador, a mesma tabela é composta aqui com a linha da rede entre os grupos
   (cabeçalho uma vez só); no celular, cada rede ganha o seu título e a Tabela duo vira cartões. */

export type AcaoDeConvite = 'convidar' | 'refazer' | 'revogar'

const COORDENACAO: Record<CoordenacaoDaEscola, { rotulo: string; familia: Familia | 'neutro' }> = {
  ativa: { rotulo: 'Ativa', familia: 'verde' },
  'convite em aberto': { rotulo: 'Convite em aberto', familia: 'amarelo' },
  'convite vencido': { rotulo: 'Vencido', familia: 'vermelho' },
  'sem convite': { rotulo: 'Sem convite', familia: 'neutro' },
}

type Grupo = { rede: Rede; escolas: EscolaDaOperacao[] }

export function AbaEscolas({ redes, escolas, destaque, aoNovaEscola, aoConvite, menuDaRede, menuDaEscola }: {
  redes: Rede[]
  /** o link (slug) da escola recém-criada: a lista rola até ela e a linha acende por um instante */
  destaque?: string
  escolas: EscolaDaOperacao[]
  aoNovaEscola: (redeId?: string) => void
  aoConvite: (acao: AcaoDeConvite, escola: EscolaDaOperacao) => void
  menuDaRede: (rede: Rede) => ItemMenuMais[]
  menuDaEscola: (escola: EscolaDaOperacao) => ItemMenuMais[]
}) {
  const [busca, setBusca] = useState('')

  const grupos: Grupo[] = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    /* a escola criada sem rede é a sua própria rede de uma escola só (como o Colégio Aurora): ganha o seu grupo */
    const conhecidas = new Set(redes.map((r) => r.id))
    const avulsas: Rede[] = escolas.filter((e) => !conhecidas.has(e.redeId))
      .map((e) => ({ id: e.redeId, nome: e.rede, tipo: e.tipo, cidade: e.cidade, escolas: 1, criada: true }))
    return [...redes, ...avulsas]
      .map((rede) => ({
        rede,
        escolas: escolas
          .filter((e) => e.redeId === rede.id)
          .filter((e) => !termo || [e.nome, e.slug, e.cidade, rede.nome].some((t) => t.toLowerCase().includes(termo)))
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
      }))
      .filter((g) => g.escolas.length > 0 || (!termo && g.rede.criada))
  }, [redes, escolas, busca])

  /* a ação do convite mora na coluna Coordenação, ao lado do selo; revogar foi para o ⋯ (menuDaEscola) */
  const acao = (e: EscolaDaOperacao) => {
    if (e.coordenacao === 'sem convite') return <Botao tamanho="p" variante="secundario" onClick={() => aoConvite('convidar', e)}>Convidar</Botao>
    if (e.coordenacao === 'convite vencido') return <Botao tamanho="p" variante="secundario" onClick={() => aoConvite('refazer', e)}>Refazer</Botao>
    return null
  }

  const colunas: ColunaTabela<EscolaDaOperacao>[] = [
    { titulo: 'Escola', celula: (e) => (
      <span className="grid min-w-0">
        <span className="truncate font-bold text-tinta" title={e.nome}>{e.nome}</span>
        <span className="truncate text-[14px] font-medium text-sutil">{e.cidade}</span>
      </span>
    ) },
    { titulo: 'Link', soComputador: true, classe: 'w-[24%]', celula: (e) => <span className="block truncate whitespace-nowrap text-apoio" title={enderecoCompleto(e.slug)}>{enderecoCompleto(e.slug)}</span> },
    { titulo: 'Coordenação', classe: 'w-[25%]', celula: (e) => {
      const c = COORDENACAO[e.coordenacao]
      return (
        <span className="inline-flex flex-wrap items-center justify-end gap-x-3 gap-y-1 md:justify-start">
          <span className="inline-flex flex-col items-end gap-0.5 md:items-start">
            <Selo familia={c.familia}>{c.rotulo}</Selo>
            {e.conviteAte && <span className="whitespace-nowrap text-[14px] font-medium leading-[18px] text-sutil">{e.conviteAte}</span>}
          </span>
          {acao(e)}
        </span>
      )
    } },
    { titulo: 'Uso', classe: 'w-[24%]', celula: (e) => e.alunos
      ? <span className="block truncate whitespace-nowrap tabular-nums text-apoio" title={usoCurto(e)}>{usoCurto(e)}</span>
      : <span className="text-sutil">Sem turma ainda</span> },
    { titulo: '', classe: 'w-[72px] text-right', celula: (e) => <MenuMais rotulo={`Mais opções da ${e.nome}`} itens={menuDaEscola(e)} /> },
  ]

  /* no celular, o ⋯ da escola sobe para o canto de cima do cartão, ao lado do nome (como no grupo da rede) */
  const colunasCelular: ColunaTabela<EscolaDaOperacao>[] = [
    { titulo: 'Escola', celula: (e) => (
      <span className="flex min-w-0 items-start gap-2">
        <span className="min-w-0 flex-1">{colunas[0].celula(e)}</span>
        <span className="-my-1 -mr-2 shrink-0"><MenuMais rotulo={`Mais opções da ${e.nome}`} itens={menuDaEscola(e)} /></span>
      </span>
    ) },
    ...colunas.slice(1, -1),
  ]

  const nEscolas = grupos.reduce((n, g) => n + g.escolas.length, 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Busca valor={busca} aoMudar={setBusca} rotulo="Buscar escola ou cidade" className="max-sm:flex-1" />
        <span className="t-apoio max-md:hidden" aria-live="polite">{`${nEscolas} ${nEscolas === 1 ? 'escola' : 'escolas'} em ${grupos.length} ${grupos.length === 1 ? 'rede' : 'redes'}`}</span>
        {/* no computador, NOVA ESCOLA fica no cabeçalho da página; no celular, aqui */}
        <Botao className="w-full sm:hidden" largura="auto" icone={<Plus strokeWidth={3} />} onClick={() => aoNovaEscola()}>Nova escola</Botao>
      </div>

      {grupos.length === 0 ? (
        <div className="rounded-[16px] border-2 border-borda bg-white px-4 py-8 text-center t-apoio">{`Nenhuma escola com “${busca.trim()}”.`}</div>
      ) : (
        <>
          {/* computador: uma tabela, a rede como linha de grupo */}
          <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border-2 border-borda bg-white md:flex">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <table className="w-full table-fixed border-collapse text-left" aria-label="Escolas por rede">
                <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-2px_0_var(--color-borda)]">
                  <tr>{colunas.map((c) => <th key={c.titulo} scope="col" className={cn('t-selo h-11 px-4 align-middle text-sutil', c.classe)}>{c.titulo || <span className="sr-only">Ação</span>}</th>)}</tr>
                </thead>
                <tbody>
                  {grupos.map((g) => (
                    <GrupoNaTabela key={g.rede.id} grupo={g} colunas={colunas} menu={menuDaRede(g.rede)} aoNovaEscola={aoNovaEscola} destaque={destaque} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* celular: um bloco por rede */}
          <div className="-mx-1 grid min-h-0 min-w-0 flex-1 content-start gap-5 overflow-y-auto overscroll-contain px-1 pb-1 md:hidden">
            {grupos.map((g) => (
              <section key={g.rede.id} aria-label={g.rede.nome} className="grid min-w-0 gap-2">
                <CabecaDoGrupo grupo={g} menu={menuDaRede(g.rede)} />
                <Tabela colunas={colunasCelular} linhas={g.escolas} chave={(e) => e.id} rotulo={g.rede.nome}
                  vazio={<Botao variante="fantasma" tamanho="p" icone={<Plus strokeWidth={3} />} onClick={() => aoNovaEscola(g.rede.id)}>Criar a primeira escola</Botao>} />
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function CabecaDoGrupo({ grupo, menu }: { grupo: Grupo; menu: ItemMenuMais[] }) {
  const n = grupo.escolas.length
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 md:flex-nowrap">
        <span className="t-cartao min-w-0 text-tinta max-md:w-full md:truncate" title={grupo.rede.nome}>{grupo.rede.nome}</span>
        <Selo familia={grupo.rede.tipo === 'Particular' ? 'roxo' : 'anil'}>{grupo.rede.tipo}</Selo>
        <span className="t-apoio shrink-0 tabular-nums">{`${n} ${n === 1 ? 'escola' : 'escolas'}`}</span>
      </span>
      <MenuMais rotulo={`Mais opções da rede ${grupo.rede.nome}`} itens={menu} />
    </div>
  )
}

/** A linha da escola recém-criada entra na vista (sem rolar a página) e acende em laranja-claro, que some. */
function rolarAte(el: HTMLTableRowElement | null) {
  if (!el) return
  el.scrollIntoView({ block: 'nearest' })
  el.style.backgroundColor = 'var(--color-laranja-claro)'
  window.setTimeout(() => { el.style.backgroundColor = '' }, 1600)
}

function GrupoNaTabela({ grupo, colunas, menu, aoNovaEscola, destaque }: {
  destaque?: string
  grupo: Grupo
  colunas: ColunaTabela<EscolaDaOperacao>[]
  menu: ItemMenuMais[]
  aoNovaEscola: (redeId?: string) => void
}) {
  return (
    <>
      <tr className="border-t-2 border-borda bg-fundo-suave first:border-t-0">
        <td colSpan={colunas.length} className="h-12 px-4 py-1"><CabecaDoGrupo grupo={grupo} menu={menu} /></td>
      </tr>
      {grupo.escolas.length === 0 ? (
        <tr className="border-t-2 border-borda">
          <td colSpan={colunas.length} className="h-16 px-4">
            <Botao variante="fantasma" tamanho="p" icone={<Plus strokeWidth={3} />} onClick={() => aoNovaEscola(grupo.rede.id)}>Criar a primeira escola</Botao>
          </td>
        </tr>
      ) : grupo.escolas.map((e) => (
        <tr key={e.id} ref={e.slug === destaque ? rolarAte : undefined}
          className="h-14 border-t-2 border-borda text-[15px] font-medium text-tinta transition-colors duration-1000">
          {colunas.map((c) => <td key={c.titulo} className={cn('px-4 py-1.5 align-middle', c.classe)}>{c.celula(e)}</td>)}
        </tr>
      ))}
    </>
  )
}
