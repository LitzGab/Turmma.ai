import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Botao, Cartao, Contador, EstadoVazio, LadrilhoIcone, Selo, SeloTurma, TIPO_FILA } from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { Onca } from '@/components/duo/onca'
import { TURMAS } from '@/dados/escola'
import { useCartoesDaFila, type ItemFila, type PapelFila } from '@/dados/fila'
import { cn } from '@/lib/utils'

/* "ESPERANDO VOCÊ" — 11ª rodada (04/10/2026), a pele Turmma × Duolingo (sistema-turmma-duolingo.md, seção 3.8).

   A fila única, no Início do professor e da coordenação e na aba Hoje da turma. Cada item é um CARTÃO CLICÁVEL de
   72 px (68 + 4 de degrau) que diz o que é por FORMA, sem frase:
     [ladrilho 44 na cor do tipo, com o ícone do tipo a 32]  [título curto, 2 a 4 palavras · selo da turma]  [número]
   · título: `item.curto`, ou `item.titulo` quando não houver; o `title` guarda o título longo;
   · linha 2: o selo da turma (na cor da matéria), e a hora SÓ no item urgente;
   · fim: o Contador com `item.n` na cor do tipo; com prazo, um selo vermelho "ATÉ 23/09"; urgente sem prazo, URGENTE.
   Saíram da linha: o detalhe longo (vai para o painel ou para a página do item), o avatar do agente (o ícone do tipo
   diz mais; a assinatura aparece no painel) e o chevron (o degrau já diz que aperta).
   Abrir, por padrão: o item que tem rota (`para`) navega; o que não tem abre o painel ao lado, pondo ?item=<id> na
   URL atual (com replace). Passando de `max`, VER TUDO (N) mostra o resto no MESMO lugar, rolando por dentro (R10).
   Vazia: o `vazio` recebido ou, por padrão, a onça dormindo (96) e "Tudo em dia".
   12ª rodada: `agrupar` (com o papel) troca os itens pelos CARTÕES da fila — os pedidos para entrar de turmas
   diferentes viram um cartão só, "Pedidos para entrar · 3 turmas" —, e a cor do selo da turma vem de `item.materia`. */

const ALTURA_CARTAO = 72
const VAO = 10

/** O jeito padrão de abrir um item: navega para a rota dele ou abre o painel com ?item=. */
export function useAbrirItem() {
  const navegar = useNavigate()
  const { pathname, search } = useLocation()
  return (item: ItemFila) => {
    if (item.para) { navegar(item.para); return }
    const p = new URLSearchParams(search)
    p.set('item', item.id)
    navegar(`${pathname}?${p.toString()}`, { replace: true })
  }
}

const materiaDaTurma = (item: ItemFila) => item.materia ?? (item.turmaId ? TURMAS.find((t) => t.id === item.turmaId)?.disciplina : undefined)

export function LinhaFila({ item, aoAbrir }: { item: ItemFila; aoAbrir: (item: ItemFila) => void }) {
  const tipo = TIPO_FILA[item.tipo]
  const curto = item.curto ?? item.titulo
  const hora = item.urgente && item.quando ? item.quando : null
  return (
    <li>
      <Cartao como="button" onClick={() => aoAbrir(item)} title={item.titulo} semRespiro
        aria-label={[item.titulo, item.turma, item.prazo, item.urgente ? 'urgente' : null].filter(Boolean).join(' · ')}
        className="flex h-[68px] items-center gap-3 px-3">
        <LadrilhoIcone familia={tipo.familia} tamanho={44} icone={<Icone id={tipo.icone} tamanho={32} familia={tipo.familia} />} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="t-cartao truncate text-tinta">{curto}</span>
          {(item.turma || hora) && (
            <span className="flex min-w-0 items-center gap-2">
              {item.turma && <SeloTurma turma={item.turma} materia={materiaDaTurma(item)} tamanho="p" />}
              {hora && <span className="t-apoio truncate">{hora}</span>}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {item.n !== undefined && <Contador n={item.n} familia={tipo.familia} rotulo="" />}
          {item.prazo
            ? <Selo familia="vermelho">{item.prazo}</Selo>
            : item.urgente ? <Selo familia="vermelho">Urgente</Selo> : null}
        </span>
      </Cartao>
    </li>
  )
}

export function ListaFila(props: {
  itens?: ItemFila[]
  /** troca os itens pelos cartões da fila deste papel (os pedidos do professor num cartão só) */
  agrupar?: PapelFila
  max?: number
  aoAbrir?: (item: ItemFila) => void
  /** o que mostrar quando não há nada; por padrão, a onça dormindo e "Tudo em dia" */
  vazio?: ReactNode
  className?: string
}) {
  return props.agrupar ? <ListaAgrupada {...props} papel={props.agrupar} /> : <ListaDe {...props} itens={props.itens ?? []} />
}

function ListaAgrupada(props: Parameters<typeof ListaFila>[0] & { papel: PapelFila }) {
  const cartoes = useCartoesDaFila(props.papel)
  return <ListaDe {...props} itens={cartoes} />
}

function ListaDe({ itens, max = 5, aoAbrir, vazio, className }: {
  itens: ItemFila[]
  max?: number
  aoAbrir?: (item: ItemFila) => void
  vazio?: ReactNode
  className?: string
}) {
  const abrirPadrao = useAbrirItem()
  const abrir = aoAbrir ?? abrirPadrao
  const [tudo, setTudo] = useState(false)
  const n = itens.length

  if (n === 0) {
    return (
      <section className={className} aria-label="Esperando você">
        {typeof vazio === 'string' || vazio === undefined ? (
          <div className="rounded-[16px] border-2 border-borda bg-white">
            <EstadoVazio ilustracao={<Onca pose="dormindo" tamanho={96} />} titulo={vazio ?? 'Tudo em dia'} className="py-5" />
          </div>
        ) : vazio}
      </section>
    )
  }

  const visiveis = tudo ? itens : itens.slice(0, max)
  // aberta, a lista ocupa a MESMA altura das `max` linhas e rola por dentro: a página não cresce
  const alturaMax = max * ALTURA_CARTAO + (max - 1) * VAO
  return (
    <section className={cn('flex min-h-0 flex-col', className)} aria-label={`Esperando você, ${n}`}>
      <div className="mb-3 flex shrink-0 items-center gap-2.5">
        <h2 className="t-secao text-tinta">Esperando você</h2>
        <Contador n={n} rotulo="esperando você" />
      </div>
      {/* rola por dentro também quando a tela aperta a lista (min-h-0): nunca vaza por cima do VER TUDO */}
      <ul className="-mx-1 flex min-h-0 flex-col gap-[10px] overflow-y-auto overscroll-contain px-1 pb-1"
        style={tudo ? { maxHeight: alturaMax + 4 } : undefined}>
        {visiveis.map((i) => <LinhaFila key={i.id} item={i} aoAbrir={abrir} />)}
      </ul>
      {n > max && (
        <Botao variante="fantasma" tamanho="m" onClick={() => setTudo((t) => !t)} className="-ml-3.5 mt-1.5 self-start">
          {tudo ? 'Ver menos' : `Ver tudo (${n})`}
        </Botao>
      )}
    </section>
  )
}
