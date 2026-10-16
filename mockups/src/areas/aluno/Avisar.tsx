import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Clock3, EyeOff, Frown, MessageCircleMore, Phone } from 'lucide-react'
import { Botao, CabecalhoPagina, CampoTexto, Cartao, FaixaResultado, Linha, Opcao, Pagina, Secao, Selo, SeloNovo } from '@/components/duo'
import { CabecaOnca } from '@/components/duo/onca'
import { avisos, depoisDeEnviar, quemLe, TOQUES, useAvisosDoAluno, type Aviso } from '@/dados/avisos'
import { respostaParaAvisar } from '@/dados/conversas-aluno'
import { useAlunoAtual } from '@/dados/sessao'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

/** Do que o aviso tratava: o toque escolhido ou o começo do texto. */
const sobre = (a: Aviso) => TOQUES.find((t) => t.id === a.toque)?.rotulo ?? (a.apontado.startsWith('Tocou em') ? '' : a.apontado)

/* AVISAR UM ADULTO (/aluno/avisar), 14ª rodada, 05/10/2026 (plano ux-composicao, 1.2 e 5.2). O canal do ECA Digital,
   art. 28 (lei), com o mesmo peso de qualquer lugar (D61): o título "Avisar um adulto", como Tarefas e Eu.
   · O 188 (CVV) num bloco fixo logo sob o título: não rola, está sempre à vista.
   · O formulário na coluna inteira de 880, como Tarefas e Eu: as 4 opções em grade 2 × 2 de cartões de 64 com ícone
     (opcionais; tocar de novo desmarca), a caixa de texto de 160, "Quem lê…" como apoio e ENVIAR à direita, na
     largura do botão. ENVIAR acende com o texto OU com uma opção.
   · QUEM LÊ muda com a opção (ECA Digital, art. 29, § 2º — lei; D79): a orientação, nos de pessoa; a coordenação, com
     o trecho da conversa, em "O Tutor disse algo errado" (arts. 29 e 30 — lei).
   · Enviado, o aviso chega à coordenação com o número curto ("Aviso 34") e a tela mostra a FaixaResultado.
   · SEUS AVISOS: a resposta da escola, com NOVO; abrir marca como lido e zera o contador de AVISAR na casca. Com
     resposta nova, Seus avisos vem ANTES do formulário e já aberto nela (o 1 do AVISAR leva direto à resposta).
   · `FormularioAvisar` é a mesma forma; a prova usa num painel por cima (relógio parado), numa coluna e com o 188. */

const ICONE: Record<string, ReactNode> = {
  'tratou-mal': <Frown strokeWidth={2.5} />,
  assustou: <EyeOff strokeWidth={2.5} />,
  'tutor-errado': <CabecaOnca tamanho={28} />,
  outra: <MessageCircleMore strokeWidth={2.5} />,
}

/** O 188, sempre à vista. */
export function Bloco188({ className }: { className?: string }) {
  return (
    <a href="tel:188" className={cn('flex items-center gap-3 rounded-[12px] border-2 border-roxo-borda bg-roxo-claro px-4 py-2.5 text-roxo-texto transition-colors duration-150 hover:bg-fundo-suave', className)}>
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-roxo text-sobre-cor"><Phone className="size-[18px]" strokeWidth={2.5} /></span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold leading-5">Se for urgente, ligue 188 (CVV).</span>
        <span className="block text-[15px] font-medium leading-5">É de graça, a qualquer hora.</span>
      </span>
    </a>
  )
}

export function FormularioAvisar({ origem = 'aluno', aoEnviar, className }: {
  origem?: 'aluno' | 'prova'
  aoEnviar?: (numero: number, toque?: string) => void
  className?: string
}) {
  const [texto, setTexto] = useState('')
  const [toque, setToque] = useState<string | null>(null)
  const [params] = useSearchParams()
  const aluno = useAlunoAtual()
  const pode = texto.trim().length > 0 || toque !== null
  const naProva = origem === 'prova'
  // na prova o Tutor está desligado: não há resposta dele para avisar
  const toques = naProva ? TOQUES.filter((t) => t.id !== 'tutor-errado') : TOQUES
  // "O Tutor disse algo errado": o aluno vê de qual resposta está falando antes de enviar
  const conversaId = params.get('conversa') ?? undefined
  const sobreEsta = toque === 'tutor-errado' ? respostaParaAvisar(aluno.id, conversaId)?.trecho.at(-1)?.texto : undefined

  const enviar = () => {
    if (!pode) return
    const n = avisos.enviar({ origem, toque: toque ?? undefined, texto, conversaId })
    const t = toque ?? undefined
    setTexto('')
    setToque(null)
    aoEnviar?.(n, t)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); enviar() }} className={cn('grid gap-5', className)}>
      <fieldset className="grid gap-3">
        <legend className="mb-3 text-[15px] font-bold leading-5 text-tinta">Sobre o quê? <span className="font-medium text-sutil">Se quiser, toque numa opção.</span></legend>
        <div className={cn('grid gap-3', !naProva && 'sm:grid-cols-2')}>
          {toques.map((t) => (
            <Opcao key={t.id} tipo="checkbox" valor={t.id} marcado={toque === t.id} aoMudar={(m) => setToque(m ? t.id : null)}
              icone={<span className={cn('grid size-10 place-items-center rounded-[10px] [&_svg]:size-6', toque === t.id ? 'bg-white text-azul-texto' : 'bg-fundo-suave text-apoio')}>{ICONE[t.id]}</span>}>
              {t.rotulo}
            </Opcao>
          ))}
        </div>
      </fieldset>

      <CampoTexto rotulo="Conte o que aconteceu, do seu jeito" valor={texto} aoMudar={setTexto} linhas={5} className="[&_textarea]:min-h-40" />

      {sobreEsta && (
        <p className="t-apoio rounded-[12px] bg-fundo-suave px-3 py-2">
          Sobre esta resposta do Tutor: <span className="font-bold text-tinta">“{sobreEsta.length > 90 ? `${sobreEsta.slice(0, 90).trimEnd()}…` : sobreEsta}”</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="t-apoio min-w-0 flex-1 basis-64" aria-live="polite">{quemLe(toque ?? undefined)}</p>
        <Botao type="submit" disabled={!pode} className="ml-auto">Enviar</Botao>
      </div>

      {naProva && <Bloco188 />}
    </form>
  )
}

function SeuAviso({ a, aberto, novo, aoAbrir }: { a: Aviso; aberto: boolean; novo: boolean; aoAbrir: () => void }) {
  const respondido = !!a.resposta
  // a resposta da orientação ao encaminhamento do Tutor (assunto delicado) chega aqui com um nome neutro
  const risco = a.tipo === 'risco'
  return (
    <div className="border-t-2 border-borda first:border-t-0">
      <Linha titulo={risco ? 'Conversa com a orientação' : `Aviso ${a.numero}`} className="border-t-0" onClick={aoAbrir} chevron={respondido && !aberto}
        abaixo={(
          <>
            {!risco && sobre(a) && <span className="block w-full truncate" title={sobre(a)}>{sobre(a)}</span>}
            {respondido
              ? <Selo familia="verde" tamanho="p" icone={<Check strokeWidth={3.5} />}>Respondido</Selo>
              : <Selo familia="amarelo" tamanho="p" icone={<Clock3 strokeWidth={3} />}>A escola está vendo</Selo>}
            {respondido && novo && <SeloNovo tamanho="p" />}
          </>
        )} />
      {aberto && respondido && (
        <div className="grid gap-1.5 px-4 pb-4">
          <p className="t-apoio">A escola respondeu:</p>
          <p className="t-corpo text-tinta">{a.resposta!.texto}</p>
          <p className="t-apoio">Lido por uma pessoa da escola · {a.resposta!.quando}</p>
          {!risco && <p className="t-apoio">Não concordou? Envie um novo aviso em até 10 dias.</p>}
        </div>
      )}
    </div>
  )
}

export function Avisar() {
  // o mesmo filtro do contador de AVISAR na casca: os avisos e, respondido, o encaminhamento do Tutor
  const meus = useAvisosDoAluno().filter((a) => a.tipo === 'aviso' || (a.tipo === 'risco' && !!a.resposta))
  const [enviado, setEnviado] = useState<{ numero: number; toque?: string } | null>(null)
  const celular = useIsMobile()
  // Chegou resposta da escola (o 1 no AVISAR): a página abre JÁ nela, antes do formulário, e o NOVO vale para esta
  // visita. A ordem fica a de quando abriu (marcar como lido não faz a lista pular para baixo).
  const [novoAoChegar] = useState(() => meus.find((a) => a.resposta && !a.lido)?.id ?? null)
  const [aberto, setAberto] = useState<string | null>(novoAoChegar)
  useEffect(() => { if (novoAoChegar) avisos.marcarLido(novoAoChegar) }, [novoAoChegar])

  const abrir = (a: Aviso) => {
    const fechar = aberto === a.id
    setAberto(fechar ? null : a.id)
    if (!fechar && a.resposta) avisos.marcarLido(a.id)
  }

  const seusAvisos = meus.length > 0 && (
    <Secao titulo="Seus avisos" n={meus.length}>
      <Cartao semRespiro className="overflow-hidden">
        {meus.map((a) => <SeuAviso key={a.id} a={a} aberto={aberto === a.id} novo={!a.lido || a.id === novoAoChegar} aoAbrir={() => abrir(a)} />)}
      </Cartao>
    </Secao>
  )

  return (
    /* no computador o 188 fica no cabeçalho, que não rola. No celular a página rola inteira: o 188 vai para o alto do
       corpo, preso (sticky) com o fundo da página, e continua à vista quando o aluno desce até ENVIAR */
    <Pagina tipo="leitura"
      cabecalho={<CabecalhoPagina titulo="Avisar um adulto" linha={celular ? undefined : <div className="mt-1 border-b-2 border-borda pb-4"><Bloco188 /></div>} />}>
      {celular && (
        <div className="sticky top-0 z-[2] -mt-4 mb-4 border-b-2 border-borda bg-fundo pb-3 pt-2">
          <Bloco188 />
        </div>
      )}
      <div className="grid content-start gap-8">
        {novoAoChegar && seusAvisos}
        {enviado ? (
          <Cartao semRespiro className="overflow-hidden">
            <FaixaResultado tipo="info" titulo={depoisDeEnviar(enviado.toque)} className="border-t-0"
              acao={<Botao variante="fantasma" tamanho="p" onClick={() => setEnviado(null)}>Novo aviso</Botao>}>
              Aviso {enviado.numero} · a resposta chega aqui, em Seus avisos
            </FaixaResultado>
          </Cartao>
        ) : (
          <FormularioAvisar aoEnviar={(numero, toque) => setEnviado({ numero, toque })} />
        )}
        {!novoAoChegar && seusAvisos}
      </div>
    </Pagina>
  )
}
