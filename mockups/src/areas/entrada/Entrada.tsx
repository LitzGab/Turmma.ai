import { useId, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CircleAlert, Search } from 'lucide-react'
import { Aviso, Botao, CampoSenha, CampoTexto, CLASSE_CAMPO, CLASSE_FLUTUA } from '@/components/duo'
import { useParametro } from '@/components/turmma/tela'
import { useProfessoresDaEscola } from '@/dados/escola-estado'
import { sessao } from '@/dados/sessao'
import { cn } from '@/lib/utils'
import {
  CascaPublica, ESCOLAS_PUBLICAS, Titulo, Voltar, classeDoLink, semAcento, useTituloDaAba, type EscolaPublica,
} from '@/areas/publico/_casca'

/* A ENTRADA (/entrar), como o Google: uma caixa, "Qual é a sua escola?". O autocompletar ignora acento e pontuação
   ("colegio" acha o Colégio Aurora; "rio cach" acha a E. M. Rio Cachoeira) e leva a /e/<escola>, onde o aluno entra.
   Embaixo, "Sou da equipe da escola" troca a caixa por e-mail e senha (?quem=equipe). O E-MAIL DECIDE O PAPEL:
   · camila.souza@…, ou o e-mail de um professor que aceitou o convite na demonstração → /professor;
   · helena.martins@… (coordenação), secretaria@educacao.joinville… (rede) e equipe@turmma… (operação) passam
     antes pelo segundo fator (/entrar/verificacao?para=…).
   "Esqueci a senha" responde sempre igual, tenha ou não conta (D78; regra 20, item 6). Não existe "Cadastre-se":
   quem dá o acesso é a escola (D2). Saiu "Entrar com a conta da escola", que pulava o segundo fator. */

export function Entrada() {
  // Quem vem do aceite de um convite pode chegar com um aviso: abre direto em e-mail e senha.
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso
  const [quem, setQuem] = useParametro('quem')
  const equipe = quem === 'equipe' || !!aviso
  useTituloDaAba('Entrar · Turmma')

  return (
    <CascaPublica>
      {equipe
        ? <EntradaDaEquipe aviso={aviso} aoVoltar={() => setQuem(null)} />
        : <QualEscola aoEquipe={() => setQuem('equipe')} />}
    </CascaPublica>
  )
}

/* ── O aluno: qual é a sua escola? ─────────────────────────────────────────────────────────────────────── */

function QualEscola({ aoEquipe }: { aoEquipe: () => void }) {
  const navegar = useNavigate()
  const id = useId()
  const [texto, setTexto] = useState('')
  const [ativa, setAtiva] = useState(0)
  const [aberta, setAberta] = useState(false)
  const [erro, setErro] = useState('')

  const achadas = useMemo(() => {
    const t = semAcento(texto)
    if (!t) return []
    return ESCOLAS_PUBLICAS.filter((e) => semAcento(`${e.nome} ${e.cidade}`).includes(t))
  }, [texto])
  const mostrar = aberta && achadas.length > 0

  const ir = (e: EscolaPublica) => navegar(`/e/${e.slug}`)
  const enviar = (ev: React.FormEvent) => {
    ev.preventDefault()
    const escolhida = achadas[ativa] ?? achadas[0]
    if (escolhida) ir(escolhida)
    else setErro(texto.trim() ? 'Não achamos essa escola. Confira o nome com o professor.' : 'Digite o nome da sua escola.')
  }
  const teclas = (ev: React.KeyboardEvent) => {
    if (!achadas.length) return
    if (ev.key === 'ArrowDown') { ev.preventDefault(); setAberta(true); setAtiva((a) => (a + 1) % achadas.length) }
    if (ev.key === 'ArrowUp') { ev.preventDefault(); setAtiva((a) => (a - 1 + achadas.length) % achadas.length) }
    if (ev.key === 'Escape') setAberta(false)
  }

  return (
    <div className="animate-entra">
      <Titulo titulo="Qual é a sua escola?" />
      <form className="mt-7 grid gap-5" onSubmit={enviar} noValidate>
        <div className="relative">
          <label htmlFor={`${id}-campo`} className="sr-only">Nome da escola</label>
          <Search aria-hidden strokeWidth={2.5} className="pointer-events-none absolute left-3.5 top-6 size-5 -translate-y-1/2 text-sutil" />
          <input id={`${id}-campo`}
            role="combobox" aria-expanded={mostrar} aria-controls={`${id}-lista`} aria-autocomplete="list"
            aria-activedescendant={mostrar ? `${id}-${ativa}` : undefined} aria-invalid={!!erro || undefined}
            aria-describedby={erro ? `${id}-erro` : undefined}
            value={texto} placeholder="Comece a digitar o nome" autoFocus autoComplete="off" spellCheck={false}
            onChange={(e) => { setTexto(e.target.value); setAtiva(0); setAberta(true); setErro('') }}
            onFocus={() => setAberta(true)} onBlur={() => window.setTimeout(() => setAberta(false), 120)} onKeyDown={teclas}
            className={cn(CLASSE_CAMPO, 'h-12 pl-11')} />
          {mostrar && (
            <ul id={`${id}-lista`} role="listbox" aria-label="Escolas"
              className={cn(CLASSE_FLUTUA, 'absolute inset-x-0 top-[56px] z-20 grid gap-0.5 p-1.5')}>
              {achadas.map((e, i) => (
                <li key={e.slug} id={`${id}-${i}`} role="option" aria-selected={i === ativa}
                  onMouseDown={(ev) => { ev.preventDefault(); ir(e) }} onMouseEnter={() => setAtiva(i)}
                  className={cn('flex cursor-pointer items-baseline justify-between gap-3 rounded-[12px] px-3.5 py-3', i === ativa && 'bg-azul-claro')}>
                  <span className="t-cartao min-w-0 truncate">{e.nome}</span>
                  <span className="t-apoio shrink-0">{e.cidade}</span>
                </li>
              ))}
            </ul>
          )}
          {erro && (
            <p id={`${id}-erro`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[15px] font-bold leading-5 text-vermelho-texto">
              <CircleAlert aria-hidden className="mt-px size-[18px] shrink-0" strokeWidth={2.5} /> {erro}
            </p>
          )}
        </div>
        <Botao type="submit" largura="cheia">Continuar</Botao>
      </form>
      <p className="t-apoio mt-7">
        <button type="button" onClick={aoEquipe} className={classeDoLink}>Sou da equipe da escola</button>
      </p>
    </div>
  )
}

/* ── A equipe: e-mail e senha ──────────────────────────────────────────────────────────────────────────── */

/** Para onde vai cada e-mail. `null`: não é de ninguém (a resposta não diz se o e-mail existe). */
function destinoDoEmail(email: string, professores: ReturnType<typeof useProfessoresDaEscola>): { para: string; professor?: string } | null {
  const e = email.trim().toLowerCase()
  if (e.startsWith('camila.souza@')) return { para: '/professor?como=camila', professor: 'camila' }
  if (e.startsWith('helena.martins@')) return { para: '/entrar/verificacao?para=/coordenacao' }
  if (e.startsWith('secretaria@educacao.joinville')) return { para: '/entrar/verificacao?para=/rede' }
  if (e.startsWith('equipe@turmma')) return { para: '/entrar/verificacao?para=/operacao' }
  const p = professores.find((x) => x.email?.toLowerCase() === e && x.sessaoId && x.estado === 'ativo')
  if (p?.sessaoId) return { para: `/professor?como=${p.sessaoId}`, professor: p.sessaoId }
  return null
}

function EntradaDaEquipe({ aviso, aoVoltar }: { aviso?: string; aoVoltar: () => void }) {
  const navegar = useNavigate()
  const professores = useProfessoresDaEscola()
  const [email, setEmail] = useState('camila.souza@colegioaurora.example')
  const [senha, setSenha] = useState('demonstracao')
  const [erro, setErro] = useState('')
  const [esqueci, setEsqueci] = useState(false)

  const entrar = (e: React.FormEvent) => {
    e.preventDefault()
    setEsqueci(false)
    const destino = senha ? destinoDoEmail(email, professores) : null
    if (!destino) { setSenha(''); setErro('E-mail ou senha incorretos.'); return }
    if (destino.professor) sessao.entrarComoProfessor(destino.professor)
    navegar(destino.para)
  }

  return (
    <div className="animate-entra">
      <Voltar aoVoltar={aoVoltar}>Sou aluno</Voltar>
      <Titulo titulo="Entrar na Turmma" />
      {aviso && <Aviso tom="certo" className="mt-5">{aviso}</Aviso>}

      <form className="mt-6 grid gap-4" onSubmit={entrar} noValidate>
        <CampoTexto rotulo="E-mail" type="email" inputMode="email" autoComplete="username" valor={email}
          aoMudar={(v) => { setEmail(v); setErro(''); setEsqueci(false) }} />
        <CampoSenha rotulo="Senha" valor={senha} erro={erro}
          aoMudar={(v) => { setSenha(v); setErro('') }} />
        <Botao type="submit" largura="cheia">Entrar</Botao>
      </form>

      <div className="mt-5 grid gap-3">
        {esqueci
          ? <Aviso tom="info">Se o e-mail estiver cadastrado, enviamos um link.</Aviso>
          : <p className="t-apoio"><button type="button" onClick={() => { setEsqueci(true); setErro('') }} className={classeDoLink}>Esqueci a senha</button></p>}
        <p className="t-apoio">Não tem acesso? Peça um convite à coordenação.</p>
      </div>
    </div>
  )
}
