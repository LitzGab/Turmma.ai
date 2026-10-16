import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Ban, Check } from 'lucide-react'
import { Introducao, LadrilhoIcone, Opcao, type Familia } from '@/components/duo'
import { Icone, type IconeId } from '@/components/duo/icones'
import { sessao, useIntroducaoVista } from '@/dados/sessao'

/* A INTRODUÇÃO DA EQUIPE TURMMA (/operacao/bem-vindo; plano de painéis e introdução, seção 2.7; fluxo F21).
   Sem agente: aqui a onça é a marca falando com a equipe, não uma IA do produto. Três telas:
   1. o trabalho: criar escola e rede, convidar a 1ª coordenação só pelo e-mail (D76), o teto do pacote com aviso em
      80% (D39);
   2. o recorte: a operação nunca vê aluno nem professor (regra 10, item 8);
   3. o fim: por onde começar → /operacao?nova=1 (abre a janela Nova escola), /operacao ou /operacao?aba=uso.
   · já vista, e sem ?rever=1 nem ?como= → /operacao; o X → /operacao. */

function ItemLadrilho({ id, familia, children }: { id: IconeId; familia: Familia; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <LadrilhoIcone familia={familia} tamanho={56} icone={<Icone id={id} familia={familia} />} />
      <span className="t-cartao min-w-0 flex-1 text-tinta">{children}</span>
    </li>
  )
}

function Lista({ titulo, itens, ve }: { titulo: string; itens: string[]; ve: boolean }) {
  return (
    <section aria-label={titulo} className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
      <h2 className={ve
        ? 'flex h-11 items-center gap-2 bg-verde-claro px-3 text-[15px] font-bold uppercase tracking-[.04em] text-verde-texto'
        : 'flex h-11 items-center gap-2 bg-fundo-suave px-3 text-[15px] font-bold uppercase tracking-[.04em] text-apoio'}>
        {ve ? <Check aria-hidden className="size-5" strokeWidth={3.5} /> : <Ban aria-hidden className="size-5" strokeWidth={2.5} />}
        {titulo}
      </h2>
      <ul className="grid gap-1.5 px-3 py-2.5">
        {itens.map((i) => <li key={i} className="text-[15px] font-medium leading-5 text-tinta">{i}</li>)}
      </ul>
    </section>
  )
}

type Destino = 'nova' | 'escolas' | 'uso'

const DESTINOS: { id: Destino; rotulo: string; para: string; icone: IconeId; familia: Familia }[] = [
  { id: 'nova', rotulo: 'Criar uma escola', para: '/operacao?nova=1', icone: 'mais', familia: 'laranja' },
  { id: 'escolas', rotulo: 'Ver as escolas', para: '/operacao', icone: 'escola', familia: 'azul' },
  { id: 'uso', rotulo: 'Ver o uso do mês', para: '/operacao?aba=uso', icone: 'pacote', familia: 'turquesa' },
]

export function BemVindoOperacao() {
  const navegar = useNavigate()
  const [params] = useSearchParams()
  // lido uma vez: a raiz do app tira o ?como= da barra logo depois
  const [forcada] = useState(() => params.has('rever') || params.has('como'))
  const vista = useIntroducaoVista('operacao')
  // Lida uma vez, ao abrir: o COMEÇAR marca a introdução como vista antes de navegar, e a guarda não pode passar por cima do destino.
  const [vistaAoAbrir] = useState(() => vista)
  const [destino, setDestino] = useState<Destino>('nova')
  if (vistaAoAbrir && !forcada) return <Navigate to="/operacao" replace />

  const comecar = () => {
    sessao.verIntroducao('operacao')
    navegar(DESTINOS.find((d) => d.id === destino)!.para, { replace: true })
  }

  return (
    <Introducao rotulo="Introdução da equipe Turmma" aoSair={() => navegar('/operacao', { replace: true })}
      passos={[
        {
          id: 'trabalho', pose: 'acenando',
          fala: 'Oi! Aqui você cria escolas e acompanha uso e custo.',
          conteudo: (
            <ul className="grid gap-3">
              <ItemLadrilho id="escola" familia="azul">Cria escola e rede</ItemLadrilho>
              <ItemLadrilho id="convite" familia="amarelo">Convida a 1ª coordenação, só pelo e-mail</ItemLadrilho>
              <ItemLadrilho id="pacote" familia="turquesa">Teto do pacote, com aviso em 80%</ItemLadrilho>
            </ul>
          ),
        },
        {
          id: 'recorte', pose: 'pensando', rotuloContinuar: 'Entendi',
          fala: 'Você nunca vê aluno nem professor.',
          conteudo: (
            <div className="grid gap-3 sm:grid-cols-2">
              <Lista titulo="Vê" ve itens={['Escolas e redes', 'Convites (só o e-mail)', 'Uso e custo por escola']} />
              <Lista titulo="Não vê" ve={false} itens={['Nome', 'Nota', 'Conversa', 'Quem usa']} />
            </div>
          ),
        },
      ]}
      fim={{
        fala: 'Pronto! Por onde começamos?',
        aoComecar: comecar,
        conteudo: (
          <fieldset className="grid gap-2">
            <legend className="sr-only">Por onde começar</legend>
            {DESTINOS.map((d) => (
              <Opcao key={d.id} nome="op-destino" valor={d.id} marcado={destino === d.id} aoMudar={() => setDestino(d.id)}
                icone={<Icone id={d.icone} familia={d.familia} />}>
                {d.rotulo}
              </Opcao>
            ))}
          </fieldset>
        ),
      }} />
  )
}
