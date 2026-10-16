import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Aviso, Botao, CampoTexto, Selo } from '@/components/duo'
import { Marca, Pinta } from '@/components/marca/Pinta'
import { useAvisoPorNumero, type Aviso as AvisoDoCanal } from '@/dados/avisos'
import { useEncarregado } from '@/dados/escola-estado'
import { cn } from '@/lib/utils'

/* A MOLDURA DAS PÁGINAS PÚBLICAS, sem sessão (12ª rodada; 14ª rodada, 05/10/2026: plano ux-composicao, 1.6 e 5.2).
   A divisão aprovada pelo dono fica: à esquerda o painel `bg-papel` com a Marca, a pinta laranja grande e a promessa
   "Nada chega à turma sem alguém da escola aprovar." (abaixo de 768 px, uma faixa de 96 px em cima). À direita:
   · o CARTÃO do formulário, com a mesma largura em toda a família (480 px), borda de 2 px e canto 16; no escuro, o
     fundo da página (#131F24) com a borda #37464F, como o Duolingo. No celular o cartão some (só o conteúdo);
   · o cartão fica a 1/3 do espaço livre (grade 1fr · cartão · 2fr), nunca no centro exato da altura;
   · o rodapé da coluna (`canal`): o canal da escola sem conta, preso embaixo (ECA Digital, art. 28 — lei).
   A coluna da direita rola por dentro se precisar: a página inteira nunca rola no computador. Nenhuma borda de 1 px. */
export function CascaPublica({ rodape, canal, children }: {
  /** a linha do pé do painel da esquerda (a escola e a cidade) */
  rodape?: string
  /** o pé da coluna da direita: o canal da escola (CanalDaEscola) */
  canal?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr] bg-white md:h-svh md:grid-cols-2 md:grid-rows-1">
      <aside className="relative flex h-24 items-center bg-papel px-4 md:h-auto md:flex-col md:items-stretch md:justify-between md:p-10">
        <Link to="/entrar" aria-label="Turmma, entrar" className="w-fit rounded-[8px] focus-visible:outline-3 focus-visible:outline-azul-texto">
          <Marca className="text-[22px]" />
        </Link>
        <div className="hidden flex-1 flex-col items-center justify-center gap-10 md:flex">
          <Pinta className="h-[clamp(180px,22vw,300px)] w-[clamp(180px,22vw,300px)] text-laranja" rotulo="Turmma" />
          <p className="max-w-[320px] text-balance text-center text-[17px] font-bold leading-6 text-apoio">Nada chega à turma sem alguém da escola aprovar.</p>
        </div>
        <p className="t-apoio hidden min-h-5 text-center md:block">{rodape}</p>
      </aside>
      <main className="min-w-0 bg-white md:overflow-y-auto md:overscroll-contain">
        <div className="grid min-h-full grid-rows-[auto_1fr_auto] px-4 pb-6 pt-8 md:grid-rows-[minmax(24px,1fr)_auto_minmax(24px,2fr)_auto] md:px-10 md:py-8">
          <span aria-hidden className="max-md:hidden" />
          <div className="mx-auto w-full min-w-0 md:max-w-[480px] md:rounded-[16px] md:border-2 md:border-borda md:bg-white md:p-8">
            {children}
          </div>
          <span aria-hidden />
          {canal && <div className="mx-auto mt-8 w-full min-w-0 md:mt-0 md:max-w-[480px]">{canal}</div>}
        </div>
      </main>
    </div>
  )
}

/** O canal da escola sem conta, no pé da coluna: AVISAR A ESCOLA (ECA Digital, art. 28 — lei), PEDIDO SOBRE DADOS
    (LGPD, art. 18 — lei) e o encarregado de dados, quando a escola indicou (LGPD, art. 41 — lei). */
export function CanalDaEscola({ escola, atual }: { escola: EscolaPublica; atual?: 'avisar' | 'dados' }) {
  const dpo = useEncarregado()
  const itens: { id: 'avisar' | 'dados'; rotulo: string }[] = [
    { id: 'avisar', rotulo: 'Avisar a escola' },
    { id: 'dados', rotulo: 'Pedido sobre dados' },
  ]
  return (
    <footer className="border-t-2 border-borda pt-2">
      <nav aria-label="Canal da escola" className="-ml-3 flex flex-wrap items-center">
        {itens.map((i, n) => (
          <span key={i.id} className="flex items-center">
            {n > 0 && <span aria-hidden className="text-apagado">·</span>}
            <Botao asChild variante="fantasma" tamanho="p" className={cn(atual === i.id && 'text-tinta')}>
              <Link to={`/e/${escola.slug}/${i.id}`} aria-current={atual === i.id ? 'page' : undefined}>{i.rotulo}</Link>
            </Botao>
          </span>
        ))}
      </nav>
      {escola.slug === 'colegio-aurora' && dpo && (
        <p className="t-apoio break-words">Encarregado de dados: {dpo.nome} · {dpo.contato}</p>
      )}
    </footer>
  )
}

/** O título da aba do navegador, devolvido ao sair da página. */
export function useTituloDaAba(titulo: string) {
  useEffect(() => {
    const antes = document.title
    document.title = titulo
    return () => { document.title = antes }
  }, [titulo])
}

/** O título da coluna: 28 px em 700, e uma linha de apoio quando precisa. */
export function Titulo({ titulo, linha }: { titulo: ReactNode; linha?: ReactNode }) {
  return (
    <div>
      <h1 className="text-[28px] font-bold leading-[34px] tracking-[-0.01em] text-tinta">{titulo}</h1>
      {linha && <p className="t-corpo mt-1.5 text-apoio">{linha}</p>}
    </div>
  )
}

/** O link de texto da casca: azul, em 700, sublinha no foco e no passar do mouse. */
export const classeDoLink = 'rounded-[4px] font-bold text-azul-texto underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'

/** "‹ Voltar": a linha de cima da coluna, que leva de volta (um link ou um botão). */
export function Voltar({ para, aoVoltar, children }: { para?: string; aoVoltar?: () => void; children: ReactNode }) {
  const classe = 'mb-3 -ml-1 inline-flex h-9 max-w-full items-center gap-1 rounded-[10px] pl-0.5 pr-2.5 text-[15px] font-bold text-apoio transition-colors hover:bg-fundo-suave hover:text-tinta focus-visible:outline-3 focus-visible:outline-azul-texto'
  const miolo = <><ChevronLeft aria-hidden className="size-5 shrink-0" strokeWidth={2.5} /><span className="truncate">{children}</span></>
  return para
    ? <Link to={para} className={classe}>{miolo}</Link>
    : <button type="button" onClick={aoVoltar} className={classe}>{miolo}</button>
}

/** O divisor "ou", em 2 px. */
export function DivisorOu() {
  return (
    <div className="my-5 flex items-center gap-3 text-[14px] font-bold uppercase tracking-[.04em] text-sutil">
      <span className="h-0.5 flex-1 rounded-full bg-borda" />ou<span className="h-0.5 flex-1 rounded-full bg-borda" />
    </div>
  )
}

/** O selo grande de "deu certo" no topo de uma resposta (sem confete: só o visto). */
export function SeloCerto() {
  return (
    <span aria-hidden className="mb-5 grid size-16 place-items-center rounded-full bg-verde-claro">
      <svg viewBox="0 0 24 24" className="size-8 text-verde-texto" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </span>
  )
}

/** Lê o que vem depois do `#` uma vez, ao abrir, e tira da barra (o token não fica no histórico). */
export function useHashUmaVez(): string {
  const local = useLocation()
  const navegar = useNavigate()
  const [hash] = useState(() => decodeURIComponent(local.hash.slice(1)))
  useEffect(() => {
    if (local.hash) navegar({ pathname: local.pathname, search: local.search }, { replace: true })
  }, [local.hash, local.pathname, local.search, navegar])
  return hash
}

export const TEXTO_DA_ESCOLA_INEXISTENTE = 'Não encontramos esta escola. Confira o endereço com a escola.'

/* As escolas que já recebem alunos (as duas com coordenação ativa na operação). A Entrada procura nelas; a
   entrada da escola e a página da turma leem o nome daqui. O endereço é o mesmo da coluna "Link da escola". */
export type EscolaPublica = { slug: string; nome: string; cidade: string; conta: 'Google' | 'Microsoft' }
export const ESCOLAS_PUBLICAS: EscolaPublica[] = [
  { slug: 'colegio-aurora', nome: 'Colégio Aurora', cidade: 'Joinville · SC', conta: 'Google' },
  { slug: 'rio-cachoeira', nome: 'E. M. Rio Cachoeira', cidade: 'Joinville · SC', conta: 'Microsoft' },
]
export const escolaPublica = (slug?: string) => ESCOLAS_PUBLICAS.find((e) => e.slug === slug)

/** Sem acento, sem pontuação, minúsculas: "E. M. Rio Cachoeira" → "e m rio cachoeira". */
export const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Endereço com uma escola que não existe. */
export function EscolaInexistente() {
  return (
    <CascaPublica>
      <Titulo titulo="Escola não encontrada" />
      <Aviso tom="erro" className="mt-6">{TEXTO_DA_ESCOLA_INEXISTENTE}</Aviso>
      <p className="t-apoio mt-6"><Link to="/entrar" className={classeDoLink}>Procurar a escola</Link></p>
    </CascaPublica>
  )
}

/* ── Acompanhar pelo número (o canal público: aviso e pedido sobre dados) ────────────────────────────────── */

const SITUACAO: Record<AvisoDoCanal['situacao'], { rotulo: string; familia: 'amarelo' | 'azul' | 'verde' }> = {
  aberto: { rotulo: 'Recebido', familia: 'amarelo' },
  analise: { rotulo: 'Em análise', familia: 'azul' },
  concluido: { rotulo: 'Concluído', familia: 'verde' },
}

/* Só mostra o que entrou pelo canal da escola, sem conta: o aviso de um aluno com conta não aparece aqui, nem
   para quem acerta o número. O número vem com um código de conferência, e os dois precisam bater. */
/** O código de conferência do número recém-enviado (para a tela de "Recebido"). */
export function useCodigoDoNumero(n: number | undefined): string | undefined {
  return useAvisoPorNumero(n ?? null)?.codigo
}

export function Acompanhar({ inicial, tipo, aoVoltar }: { inicial?: number; tipo: 'aviso' | 'titular'; aoVoltar: () => void }) {
  const codigoInicial = useCodigoDoNumero(inicial)
  const [texto, setTexto] = useState(inicial ? String(inicial) : '')
  const [codigo, setCodigo] = useState(codigoInicial ?? '')
  const [buscado, setBuscado] = useState<{ n: number; codigo: string } | null>(inicial && codigoInicial ? { n: inicial, codigo: codigoInicial } : null)
  const achado = useAvisoPorNumero(buscado?.n ?? null)
  // o número segue em ordem: só mostra quando o código de conferência também bate (sem ele, ninguém lê o pedido de outro)
  const vale = achado && achado.origem === 'Canal da escola · sem conta' && achado.tipo === tipo && !!achado.codigo
    && achado.codigo === buscado?.codigo ? achado : undefined
  const s = vale ? SITUACAO[vale.situacao] : null

  return (
    <div className="animate-entra">
      <Voltar aoVoltar={aoVoltar}>{tipo === 'aviso' ? 'Avisar a escola' : 'Pedido sobre dados'}</Voltar>
      <Titulo titulo="Acompanhar" />
      <form className="mt-6 grid gap-4" noValidate
        onSubmit={(e) => { e.preventDefault(); const n = Number(texto.replace(/\D/g, '')); setBuscado(n ? { n, codigo: codigo.trim().toUpperCase() } : null) }}>
        <div className="grid grid-cols-2 gap-3">
          <CampoTexto rotulo="Número" valor={texto} inputMode="numeric" autoComplete="off" autoFocus={!inicial} placeholder="Ex.: 36"
            aoMudar={(v) => { setTexto(v.replace(/[^\d]/g, '').slice(0, 6)); setBuscado(null) }} />
          <CampoTexto rotulo="Código" valor={codigo} autoComplete="off" placeholder="Ex.: K7P2" maxLength={4}
            aoMudar={(v) => { setCodigo(v.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4)); setBuscado(null) }} />
        </div>
        <Botao type="submit" largura="cheia" disabled={!texto || codigo.length < 4}>Ver a situação</Botao>
      </form>

      {buscado !== null && !vale && (
        <Aviso tom="erro" className="mt-5">Não achamos esse número com esse código. Confira e tente de novo.</Aviso>
      )}
      {vale && s && (
        <div className="mt-5 grid gap-3 rounded-[16px] border-2 border-borda p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="t-cartao">Número {vale.numero}</p>
            <Selo familia={s.familia}>{s.rotulo}</Selo>
          </div>
          <p className="t-apoio">Recebido em {vale.recebido} · resposta {vale.prazo}</p>
          {vale.resposta
            ? <Aviso tom="certo" titulo="A escola respondeu">“{vale.resposta.texto}”</Aviso>
            : <p className={cn('t-corpo text-apoio')}>Ainda sem resposta.</p>}
        </div>
      )}
    </div>
  )
}
