import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Check, Copy, ExternalLink, Info, Lock } from 'lucide-react'
import {
  Aviso, Avatar, Botao, BotaoIcone, Busca, CabecalhoPagina, CampoTexto, Carimbo, CLASSE_CAMPO, Dialogo, Interruptor, Pagina, Segmentado, Selo,
} from '@/components/duo'
import { criarFatia } from '@/dados/demo/nucleo'
import { encarregado, equipe, useEncarregado, useEquipe, type Atribuicao } from '@/dados/escola-estado'
import { TURMAS_DA_ESCOLA } from '@/dados/estrutura'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/* CONFIGURAÇÕES DA ESCOLA (/coordenacao/configuracoes, pelo menu da pessoa; 12ª rodada, polimento C1, 04/10/2026;
   plano 5.3; fluxos F10 e F16).

   O índice à esquerda e as seções rolando por dentro (a página não rola), cada uma com âncora (#encarregado):
   · EQUIPE E ATRIBUIÇÕES: quem recebe risco à vida e quem atende o titular (D78), na hora (Interruptor); sem ninguém
     recebendo risco à vida, o Tutor fica desligado. CONVIDAR ALGUÉM DA GESTÃO: e-mail → link.
   · ENCARREGADO DE DADOS (LGPD, art. 41 — lei): aparece na página da escola e no dossiê.
   · CANAL DA ESCOLA (ECA Digital, art. 28 — lei): o link público, sem conta, com COPIAR e o texto de acolhimento.
   · TUTOR (freio, pacote, modo casa numa linha, busca em fontes), AVISOS (horário útil e a exceção), DADOS (retenção),
     SEGURANÇA ("Duas etapas: obrigatório para a coordenação."; saiu o interruptor travado) e CONTA DA ESCOLA.
   14ª rodada (plano ux-composicao, 5.2): página de painel ancorada à esquerda (o ‹ em 288, como as outras), o ‹ fora da coluna, o índice de 200 e o conteúdo de
   640 (no celular, o índice vira chips roláveis no topo); a barra de salvar presa embaixo (o rodapé da página).
   SALVAR (primário) só aparece quando algo mudou, e grava na base (o encarregado em `encarregado.definir`; o resto na
   fatia "config-escola"). */

type Config = {
  freio: string
  casa: string[]
  busca: boolean
  inicio: string
  fim: string
  retTutor: string
  retDoc: string
  acolhimento: string
  conta: 'nenhuma' | 'google' | 'microsoft'
}

const INICIAL: Config = {
  freio: '60', casa: [], busca: false, inicio: '07:00', fim: '18:00', retTutor: '90', retDoc: '5',
  acolhimento: 'Aqui você avisa a escola sobre algo que aconteceu. Uma pessoa lê e responde em até 5 dias úteis. Não precisa dizer seu nome.',
  conta: 'nenhuma',
}

const fatiaConfig = criarFatia<Config>('config-escola', INICIAL)

/** Quantos dias a conversa do Tutor fica guardada (o pedido do titular lê daqui). */
export const useRetencaoTutor = () => fatiaConfig.useValor().retTutor
/** O texto de acolhimento do canal da escola (o formulário público mostra acima de "O que aconteceu?"). */
export const useAcolhimento = () => fatiaConfig.useValor().acolhimento

const SECOES = [
  { id: 'equipe', rotulo: 'Equipe' },
  { id: 'encarregado', rotulo: 'Encarregado de dados' },
  { id: 'canal', rotulo: 'Canal da escola' },
  { id: 'tutor', rotulo: 'Tutor' },
  { id: 'avisos', rotulo: 'Avisos' },
  { id: 'dados', rotulo: 'Dados' },
  { id: 'seguranca', rotulo: 'Segurança' },
  { id: 'conta', rotulo: 'Conta da escola' },
] as const

const LINK_CANAL = 'turmma.com/e/colegio-aurora'

/** O ⓘ ao lado do título: a explicação e o artigo da lei ficam aqui, não soltos na tela. */
function PorQue({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <BotaoIcone rotulo={`Sobre: ${titulo}`} dica={false}><Info strokeWidth={2.5} /></BotaoIcone>
      </PopoverTrigger>
      <PopoverContent align="start" className="t-corpo text-apoio">{children}</PopoverContent>
    </Popover>
  )
}

function Secao({ id, titulo, info, children }: { id: string; titulo: string; info?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} data-secao={id} aria-labelledby={`${id}-t`} className="scroll-mt-2 border-t-2 border-borda py-6 first:border-t-0 first:pt-1">
      <div className="mb-4 flex items-center gap-1">
        <h2 id={`${id}-t`} className="t-secao text-tinta">{titulo}</h2>
        {info && <PorQue titulo={titulo}>{info}</PorQue>}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}

/** Uma linha de ajuste: o nome (e o apoio) à esquerda, o controle à direita. */
function Ajuste({ titulo, apoio, children }: { titulo: string; apoio?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <div className="min-w-0 flex-1 basis-56">
        <p className="text-[17px] font-bold leading-[22px] text-tinta">{titulo}</p>
        {apoio && <p className="t-apoio mt-0.5">{apoio}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const seloMembro = (m: { id: string; convidado?: boolean }) => m.convidado
  ? <Selo familia="amarelo">Convite enviado</Selo>
  : <Selo familia="azul">{m.id === 'helena' ? 'Coordenação' : 'Gestão'}</Selo>

async function copiar(texto: string) {
  try { await navigator.clipboard.writeText(texto); return true } catch { return false }
}

/* ── Equipe ────────────────────────────────────────────────────────────────────────────────────────────── */

function Equipe() {
  const membros = useEquipe()
  const [convidando, setConvidando] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [link, setLink] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const ninguemRisco = !membros.some((m) => m.atribuicoes.includes('risco'))

  const fechar = () => { setConvidando(false); setNome(''); setEmail(''); setLink(null); setCopiado(false) }
  const gerar = () => {
    equipe.convidar({ nome: nome || email.split('@')[0], email })
    setLink(`turmma.com/convite/gestao-${Math.random().toString(36).slice(2, 8)}`)
  }
  const ATRIB: { id: Atribuicao; rotulo: string }[] = [{ id: 'risco', rotulo: 'Recebe risco à vida' }, { id: 'titular', rotulo: 'Atende o titular' }]

  return (
    <>
      {ninguemRisco && <Aviso tom="atencao" titulo="Sem ninguém aqui, o Tutor fica desligado." />}
      <ul className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
        {membros.map((m) => (
          <li key={m.id} className="grid grid-cols-[minmax(0,1fr)] gap-3 border-t-2 border-borda px-4 py-3 first:border-t-0">
            <div className="flex items-center gap-3">
              <Avatar nome={m.nome} tamanho={40} />
              <span className="min-w-0 flex-1">
                <span className="t-cartao block truncate text-tinta">{m.nome}</span>
                <span className="t-apoio block truncate">{m.email}</span>
                {/* no celular, o selo desce para baixo do nome: o nome não é cortado */}
                <span className="mt-1 flex sm:hidden">{seloMembro(m)}</span>
              </span>
              <span className="hidden shrink-0 sm:flex">{seloMembro(m)}</span>
            </div>
            {!m.convidado && (
              <div className="grid gap-2 sm:grid-cols-2">
                {ATRIB.map((a) => (
                  <div key={a.id} className="flex min-h-12 items-center justify-between gap-3 rounded-[12px] bg-fundo-suave px-3">
                    <span className="text-[15px] font-bold text-tinta">{a.rotulo}</span>
                    <Interruptor rotulo={`${a.rotulo}: ${m.nome}`} ligado={m.atribuicoes.includes(a.id)} aoMudar={(v) => equipe.atribuir(m.id, a.id, v)} />
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      <Botao variante="secundario" tamanho="m" className="justify-self-start" onClick={() => setConvidando(true)}>Convidar alguém da gestão</Botao>

      <Dialogo aberto={convidando} aoMudar={(v) => { if (!v) fechar() }} titulo="Convidar alguém da gestão" largura={460}
        rodape={link
          ? <Botao variante="oficial" largura="cheia" onClick={fechar}>Pronto</Botao>
          : <Botao largura="cheia" disabled={!/.+@.+\..+/.test(email)} onClick={gerar}>Gerar convite</Botao>}>
        {link ? (
          <div className="grid gap-3">
            <p className="t-corpo text-apoio">O link aparece uma vez. Vale até 28/09.</p>
            <div className="flex items-center gap-2 rounded-[12px] border-2 border-borda bg-fundo-suave px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-tinta">{link}</span>
              <Botao variante="secundario" tamanho="p" icone={copiado ? <Check strokeWidth={3} /> : <Copy strokeWidth={2.5} />}
                onClick={async () => setCopiado(await copiar(`https://${link}`) || true)}>{copiado ? 'Copiado' : 'Copiar'}</Botao>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <CampoTexto rotulo="Nome" valor={nome} aoMudar={setNome} autoComplete="off" />
            <CampoTexto rotulo="E-mail" valor={email} aoMudar={setEmail} type="email" inputMode="email" autoComplete="off" />
          </div>
        )}
      </Dialogo>
    </>
  )
}

/* ── O formulário ──────────────────────────────────────────────────────────────────────────────────────── */

export function Configuracoes() {
  const salvo = fatiaConfig.useValor()
  const enc = useEncarregado()
  const { hash, search } = useLocation()
  // quem chegou pelo INDICAR do Dossiê volta para o Dossiê (e vê o "O que falta" atualizado)
  const doDossie = new URLSearchParams(search).get('de') === 'dossie'
  const [rascunho, setRascunho] = useState<Config>(salvo)
  const [encNome, setEncNome] = useState(enc?.nome ?? '')
  const [encContato, setEncContato] = useState(enc?.contato ?? '')
  const [salvoEm, setSalvoEm] = useState<string | null>(null)
  const [escolhendo, setEscolhendo] = useState(false)
  const [buscaTurma, setBuscaTurma] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [ativa, setAtiva] = useState<string>(SECOES[0].id)
  const rolagem = useRef<HTMLDivElement>(null)
  const campoEncarregado = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const escolhida = useRef<string | null>(null)
  const soltar = useRef<number | undefined>(undefined)

  const mudar = <K extends keyof Config>(k: K, v: Config[K]) => setRascunho((r) => ({ ...r, [k]: v }))
  const encMudou = (encNome.trim() !== (enc?.nome ?? '') || encContato.trim() !== (enc?.contato ?? '')) && !!encNome.trim() && !!encContato.trim()
  const sujo = JSON.stringify(rascunho) !== JSON.stringify(salvo) || encMudou

  const salvar = () => {
    fatiaConfig.mudar(() => rascunho)
    if (encMudou) encarregado.definir({ nome: encNome, contato: encContato })
    setSalvoEm('agora')
  }
  const descartar = () => { setRascunho(salvo); setEncNome(enc?.nome ?? ''); setEncContato(enc?.contato ?? '') }

  // o índice acende a seção que está no topo da área que rola
  useEffect(() => {
    const raiz = rolagem.current
    if (!raiz) return
    const aoRolar = () => {
      if (escolhida.current) {
        window.clearTimeout(soltar.current)
        soltar.current = window.setTimeout(() => { escolhida.current = null }, 160)
        return
      }
      const topo = raiz.getBoundingClientRect().top
      let atual: string = SECOES[0].id
      raiz.querySelectorAll<HTMLElement>('[data-secao]').forEach((s) => { if (s.getBoundingClientRect().top - topo <= 24) atual = s.dataset.secao ?? atual })
      if (raiz.scrollTop + raiz.clientHeight >= raiz.scrollHeight - 4) atual = SECOES[SECOES.length - 1].id
      setAtiva(atual)
    }
    raiz.addEventListener('scroll', aoRolar, { passive: true })
    return () => { raiz.removeEventListener('scroll', aoRolar); window.clearTimeout(soltar.current) }
  }, [])

  const irPara = (id: string, suave = true) => {
    setAtiva(id)
    escolhida.current = id
    window.clearTimeout(soltar.current)
    soltar.current = window.setTimeout(() => { escolhida.current = null }, 600)
    document.getElementById(id)?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' })
  }

  // chegar por #encarregado (o INDICAR do Dossiê) abre na seção, com o nome no foco
  useEffect(() => {
    const id = hash.replace('#', '')
    if (!SECOES.some((s) => s.id === id)) return
    const t = window.setTimeout(() => {
      irPara(id, false)
      if (id === 'encarregado') campoEncarregado.current?.focus({ preventScroll: true })
    }, 60)
    return () => window.clearTimeout(t)
  }, [hash])

  const termo = buscaTurma.trim().toLowerCase()
  const turmas = TURMAS_DA_ESCOLA.filter((t) => !termo || `${t.nome} ${t.serie}`.toLowerCase().includes(termo))
  const nCasa = rascunho.casa.length

  return (
    <Pagina tipo="painel" rolagem="nenhuma"
      cabecalho={(
        <CabecalhoPagina voltar={doDossie ? { para: '/coordenacao/registros?dossie=1', rotulo: 'Dossiê' } : { para: '/coordenacao', rotulo: 'Painel' }} titulo="Configurações da escola"
          selo={salvoEm && !sujo ? <Selo familia="verde" icone={<Check strokeWidth={3.5} />}>Salvo</Selo> : undefined} />
      )}
      rodape={sujo ? (
        <>
          <p className="t-apoio mr-auto" role="status">Há mudanças sem salvar.</p>
          <Botao variante="secundario" tamanho="m" onClick={descartar}>Descartar</Botao>
          <Botao tamanho="m" onClick={salvar}>Salvar</Botao>
        </>
      ) : undefined}>
      {/* no celular, as seções viram chips roláveis no topo */}
      <nav aria-label="Seções" className="-mx-4 mb-2 flex shrink-0 gap-2 overflow-x-auto px-4 pb-1 md:hidden">
        {SECOES.map((s) => (
          <button key={s.id} type="button" onClick={() => irPara(s.id)} aria-current={ativa === s.id ? 'true' : undefined}
            className={cn('h-9 shrink-0 rounded-full border-2 px-3 text-[14px] font-bold transition-colors duration-150',
              ativa === s.id ? 'border-azul-borda bg-azul-claro text-azul-texto' : 'border-borda text-sutil')}>
            {s.rotulo}
          </button>
        ))}
      </nav>
      <div className="flex min-h-0 w-full max-w-[880px] flex-1 gap-10">
        <nav aria-label="Seções" className="hidden w-[200px] shrink-0 md:block">
          <ul className="grid gap-1">
            {SECOES.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => irPara(s.id)} aria-current={ativa === s.id ? 'true' : undefined}
                  className={cn('flex h-11 w-full items-center rounded-[12px] border-2 px-3 text-left text-[15px] font-bold transition-colors duration-150',
                    ativa === s.id ? 'border-azul-borda bg-azul-claro text-azul-texto' : 'border-transparent text-sutil hover:bg-fundo-suave hover:text-tinta')}>
                  {s.rotulo}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div ref={rolagem} className="relative min-h-0 min-w-0 max-w-[640px] flex-1 overflow-y-auto overscroll-contain pb-10 pr-1">
          <Secao id="equipe" titulo="Equipe e atribuições"><Equipe /></Secao>

          <Secao id="encarregado" titulo="Encarregado de dados" info="Aparece na página da escola e no dossiê. É lei: LGPD, art. 41.">
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoTexto ref={campoEncarregado} rotulo="Nome" valor={encNome} aoMudar={setEncNome} placeholder="Quem cuida dos dados" autoComplete="off" />
              <CampoTexto rotulo="Contato" valor={encContato} aoMudar={setEncContato} placeholder="E-mail" autoComplete="off" />
            </div>
            {enc && !encMudou && <Carimbo verbo="Publicado:" por={`${enc.nome} · ${enc.contato}`} className="justify-self-start" />}
          </Secao>

          <Secao id="canal" titulo="Canal da escola" info="Qualquer pessoa avisa a escola, sem conta. É lei: ECA Digital, art. 28.">
            <div className="flex flex-wrap items-center gap-2 rounded-[12px] border-2 border-borda bg-fundo-suave px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-[17px] font-bold text-tinta">{LINK_CANAL}</span>
              <Botao variante="secundario" tamanho="p" icone={copiado ? <Check strokeWidth={3} /> : <Copy strokeWidth={2.5} />}
                onClick={async () => { await copiar(`https://${LINK_CANAL}`); setCopiado(true) }}>{copiado ? 'Copiado' : 'Copiar'}</Botao>
              <Botao variante="fantasma" tamanho="p" asChild icone={<ExternalLink strokeWidth={2.5} />}><Link to="/e/colegio-aurora">Abrir</Link></Botao>
            </div>
            <CampoTexto rotulo="Texto de acolhimento" valor={rascunho.acolhimento} aoMudar={(v) => mudar('acolhimento', v)} linhas={3} />
          </Secao>

          <Secao id="tutor" titulo="Tutor">
            <Ajuste titulo="Freio por dia" apoio="Por aluno. O aviso só aparece quando faltam 10.">
              <Segmentado rotulo="Freio por dia" valor={rascunho.freio} aoMudar={(v) => mudar('freio', v)}
                opcoes={[{ id: '30', rotulo: '30' }, { id: '45', rotulo: '45' }, { id: '60', rotulo: '60' }]} />
            </Ajuste>
            <Ajuste titulo="Pacote" apoio="Está no contrato. Não existe crédito para comprar.">
              <span className="text-[17px] font-bold text-tinta">300 trocas por aluno / mês</span>
            </Ajuste>
            <Ajuste titulo="Modo casa" apoio={nCasa === 0 ? 'Nenhuma turma' : `${nCasa} ${nCasa === 1 ? 'turma' : 'turmas'}`}>
              <Botao variante="secundario" tamanho="m" onClick={() => setEscolhendo(true)}>Escolher turmas</Botao>
            </Ajuste>
            <Ajuste titulo="Busca em fontes aprovadas" apoio="Libera para o professor ligar por turma. Na prova, nunca.">
              <Interruptor rotulo="Busca em fontes aprovadas" ligado={rascunho.busca} aoMudar={(v) => mudar('busca', v)} />
            </Ajuste>
          </Secao>

          <Secao id="avisos" titulo="Avisos">
            <Ajuste titulo="Horário útil" apoio="Exceção: risco à vida chega a qualquer hora.">
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor="h-inicio">Início</label>
                <input id="h-inicio" type="time" value={rascunho.inicio} onChange={(e) => mudar('inicio', e.target.value)} className={cn(CLASSE_CAMPO, 'h-11 w-[124px] tabular-nums')} />
                <span className="t-apoio">às</span>
                <label className="sr-only" htmlFor="h-fim">Fim</label>
                <input id="h-fim" type="time" value={rascunho.fim} onChange={(e) => mudar('fim', e.target.value)} className={cn(CLASSE_CAMPO, 'h-11 w-[124px] tabular-nums')} />
              </div>
            </Ajuste>
          </Secao>

          <Secao id="dados" titulo="Dados">
            <Ajuste titulo="Conversa do Tutor" apoio="Depois, fica só o resumo.">
              <Segmentado rotulo="Conversa do Tutor" valor={rascunho.retTutor} aoMudar={(v) => mudar('retTutor', v)}
                opcoes={[{ id: '30', rotulo: '30 dias' }, { id: '60', rotulo: '60' }, { id: '90', rotulo: '90' }]} />
            </Ajuste>
            <Ajuste titulo="Documentos e notas" apoio="Siga o prazo de guarda da sua rede.">
              <Segmentado rotulo="Documentos e notas" valor={rascunho.retDoc} aoMudar={(v) => mudar('retDoc', v)}
                opcoes={[{ id: '2', rotulo: '2 anos' }, { id: '5', rotulo: '5' }, { id: '10', rotulo: '10' }]} />
            </Ajuste>
            <Ajuste titulo="Registro de acesso" apoio="Marco Civil da Internet, art. 15. Não muda.">
              <Selo icone={<Lock strokeWidth={2.5} />}>6 meses</Selo>
            </Ajuste>
          </Secao>

          <Secao id="seguranca" titulo="Segurança">
            <Ajuste titulo="Duas etapas" apoio="Obrigatório para a coordenação.">
              <Selo familia="verde" icone={<Check strokeWidth={3.5} />}>Ativo</Selo>
            </Ajuste>
          </Secao>

          <Secao id="conta" titulo="Conta da escola" info="Professor e aluno entram com a conta que já têm. Guardamos só o identificador.">
            {rascunho.conta === 'nenhuma' ? (
              <div className="flex flex-wrap gap-2">
                <Botao variante="secundario" tamanho="m" onClick={() => mudar('conta', 'google')}>Conectar Google</Botao>
                <Botao variante="secundario" tamanho="m" onClick={() => mudar('conta', 'microsoft')}>Conectar Microsoft</Botao>
              </div>
            ) : (
              <Aviso tom="certo" titulo={rascunho.conta === 'google' ? 'Google Workspace conectado' : 'Microsoft 365 conectado'}
                acao={<Botao variante="secundario" tamanho="p" onClick={() => mudar('conta', 'nenhuma')}>Desconectar</Botao>}>
                684 contas de aluno reconhecidas
              </Aviso>
            )}
          </Secao>
        </div>
      </div>

      <Dialogo aberto={escolhendo} aoMudar={(v) => { setEscolhendo(v); if (!v) setBuscaTurma('') }} titulo="Modo casa" largura={520}
        rodape={<Botao variante="oficial" largura="cheia" onClick={() => { setEscolhendo(false); setBuscaTurma('') }}>Pronto</Botao>}>
        <div className="grid gap-3">
          <p className="t-apoio">Ligado, o Tutor funciona em casa e deixa um resumo para o professor.</p>
          <Busca valor={buscaTurma} aoMudar={setBuscaTurma} rotulo="Buscar turma" className="sm:w-full" />
          <ul className="overflow-hidden rounded-[16px] border-2 border-borda">
            {turmas.length === 0 && <li className="t-apoio px-4 py-3">Nenhuma turma com esse nome.</li>}
            {turmas.map((t) => {
              const ligado = rascunho.casa.includes(t.id)
              return (
                <li key={t.id} className="flex min-h-12 items-center gap-3 border-t-2 border-borda px-4 first:border-t-0">
                  <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-tinta">{t.nome} <span className="font-medium text-sutil">· {t.serie}</span></span>
                  <Interruptor rotulo={`Modo casa: ${t.nome}`} ligado={ligado}
                    aoMudar={(v) => mudar('casa', v ? [...rascunho.casa, t.id] : rascunho.casa.filter((x) => x !== t.id))} />
                </li>
              )
            })}
          </ul>
        </div>
      </Dialogo>
    </Pagina>
  )
}
