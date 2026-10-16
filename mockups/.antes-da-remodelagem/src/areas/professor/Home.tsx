import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { Contador } from '@/components/turmma/ia'
import { CaixaPedido } from '@/components/turmma/pedido'
import { funcao, type FuncaoId } from '@/dados/agentes'
import { acervo } from '@/dados/conversas'
import { PROFESSORA } from '@/dados/escola'
import { useConversaTime } from '@/dados/time'

/* Home do professor (11.2), no desenho da Home do ChatGPT: uma pergunta centralizada, em peso normal, e a caixa de
   pedido em pílula com sombra suave. Os atalhos em pílula saíram (19/09/2026): as ferramentas já estão no menu da
   caixa e nas favoritas da lateral. No lugar deles fica o que ESPERA a professora — o que o Assistente fez por
   conta própria e só vale depois dela. */

/* `msg` é a mensagem do Assistente em dados/mensagens-time: quando ela responde lá (aprova, rejeita), o cartão sai daqui. */
const ESPERANDO: { msg: string; de: FuncaoId; titulo: string; detalhe: string; quando: string; acao: string; para: string }[] = [
  { msg: 'correcao-2b', de: 'correcao', titulo: '30 provas do 2ºB corrigidas', detalhe: 'Abra os 5 destaques antes de aprovar', quando: '9h50', acao: 'Revisar', para: '/professor/aprovar' },
  { msg: 'adaptada-2b', de: 'adaptacao', titulo: 'Versão adaptada da prova', detalhe: 'Fonte ampliada e enunciado direto · 2ºB', quando: '10h44', acao: 'Ver e aprovar', para: '/professor/time/assistente' },
]

export function Home() {
  // Quem chega da página de Ferramentas ("é só pedir", "pedir na conversa") traz o pedido já escrito, para editar e enviar.
  const chegada = useLocation().state as { pedido?: string; ferramenta?: string } | null
  const [texto, setTexto] = useState(chegada?.pedido ?? '')
  const [ferramenta, setFerramenta] = useState(chegada?.ferramenta ?? 'conversa')
  const navegar = useNavigate()
  const { resolvidas } = useConversaTime('assistente')
  const esperando = ESPERANDO.filter((e) => !resolvidas[e.msg])

  return (
    <div className="mx-auto flex min-h-[calc(100svh-56px)] w-full max-w-[768px] flex-col justify-center px-4 pb-24 pt-10 md:min-h-svh md:px-6">
      {/* A linha com que o Assistente abriu o dia: o feed nunca aparece vazio. */}
      <Link to="/professor/calendario"
        className="group mx-auto mb-6 inline-flex h-9 max-w-full items-center gap-2 rounded-full border border-borda-campo bg-superficie pl-2.5 pr-3 text-[13px] text-sutil transition-colors duration-150 hover:bg-realce-suave">
        <CalendarDays className="size-4 shrink-0 text-tinta" strokeWidth={1.75} />
        <span className="truncate"><span className="font-medium text-tinta">Hoje</span> · 3 aulas e 1 entrega em atraso</span>
        <ArrowRight className="size-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
      </Link>

      <h1 className="saudacao mb-7 text-center text-tinta">Bom dia, {PROFESSORA.primeiro}. O que vamos preparar hoje?</h1>

      <CaixaPedido valor={texto} aoMudar={setTexto} ferramenta={ferramenta} aoMudarFerramenta={setFerramenta} autoFocus
        aoEnviar={(t, extra) => navegar(`/professor/conversa/${acervo.criarConversa({ pedido: t, ferramenta, ...extra }).id}`)} />

      {/* "Esperando você" só existe quando há entrega pendente. Sem pendência, não há cartão nem enfeite no lugar.
          Dois cartões lado a lado, logo abaixo da caixa: ladrilho preto com o ícone da função, o ponto laranja
          (o único laranja), o que foi feito, e a ação que fica preta ao passar o mouse. */}
      {esperando.length > 0 && (
      <section aria-labelledby="esperando" className="mt-7 w-full">
        <header className="mb-2.5 flex items-center justify-between gap-3 px-1">
          <h2 id="esperando" className="rotulo flex items-center gap-2">Esperando você <Contador n={esperando.length} /></h2>
          <Link to="/professor/time/assistente" className="group inline-flex items-center gap-1 text-[13px] text-sutil transition-colors duration-150 hover:text-tinta">
            Tudo que o Assistente fez <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </header>
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-2.5 sm:grid-cols-2">
          {esperando.map((e) => {
            const f = funcao(e.de)
            const Icone = f.icone
            return (
              <li key={e.de}>
                <Link to={e.para} className="group flex h-full min-w-0 flex-col rounded-[20px] border border-linha bg-superficie p-3.5 transition-[box-shadow,border-color] duration-150 hover:border-transparent hover:shadow-caixa">
                  <span className="flex items-center gap-2.5">
                    <span className="relative grid size-9 shrink-0 place-items-center rounded-[11px] bg-tinta text-white">
                      <Icone className="size-[18px]" strokeWidth={1.75} />
                      <span aria-hidden className="absolute -right-1 -top-1 size-3 rounded-full bg-caramelo ring-2 ring-superficie" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] leading-tight text-sutil">{f.nome} · {e.quando}</span>
                      <span className="block truncate text-[14.5px] font-medium leading-snug text-tinta">{e.titulo}</span>
                    </span>
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-3 border-t border-linha pt-2.5">
                    <span className="min-w-0 truncate text-[13px] text-sutil">{e.detalhe}</span>
                    <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-realce-suave px-3 text-[12.5px] font-medium text-tinta transition-colors duration-150 group-hover:bg-tinta group-hover:text-white">
                      {e.acao} <ArrowRight className="size-3" />
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
      )}
    </div>
  )
}
