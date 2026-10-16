import { useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Bell, Check, Eye, PencilLine } from 'lucide-react'
import {
  Botao, CampoTexto, DialogoConfirmar, GrupoToques, Interruptor, Introducao, LadrilhoIcone, Opcao, Selo, materiaDe,
  type PassoIntroducao,
} from '@/components/duo'
import { AvatarIA } from '@/components/duo/onca'
import { Icone } from '@/components/duo/icones'
import { ChipPagina } from '@/components/turmma/ia'
import { ajustesTurma, useAjustesTurma } from '@/areas/professor/abas-turma/UsoTutor'
import { documentoDe, documentos, questoesDoDocumento } from '@/dados/biblioteca'
import { envios, lerEnvios } from '@/dados/envios'
import { alocacoes, useAlocacoes } from '@/dados/escola-estado'
import { AVISO_DO_COMPLEMENTO, EFEITO_DA_CONTESTACAO, NOME_DA_CONTESTACAO, type Contestacao } from '@/dados/estrutura'
import { preferencias } from '@/dados/preferencias'
import { sessao, useIntroducaoVista, useProfessorAtual } from '@/dados/sessao'
import { useEscolaAtiva } from '@/dados/escola-ativa'
import { useTurmasDoProfessor } from '@/dados/turmas-professora'

/* A INTRODUÇÃO DO PROFESSOR (/professor/bem-vindo; plano de painéis e introdução, seção 2.4). Seis telas na peça
   Introducao, com o Assistente:
   1 · eu preparo, você revê, só então vai à turma (regra 70); sou um programa e posso errar (D58; Decreto 12.880,
       art. 11 — lei);
   2 · as turmas dele: confirma as novas (alocacoes.confirmar) ou avisa a coordenação (alocacoes.contestar) (D3);
   3 · quantas questões numa prova e o gabarito comentado (preferencias.prova; o cartão da Prova e Configurações ›
       Assistente leem o mesmo);
   4 · preparar a semana toda segunda, por turma (ajustesTurma, o mesmo do ⋯ da turma);
   5 · a primeira prova: GERAR cria o rascunho em Criados (documentos.criar + envios.novoRascunho), Para aprovar. É a
       mesma que aparece no passo 1 do ADAPTAR. Nada vai à turma sem aprovação (regra 70);
   6 · o fim, que leva à página da prova gerada (/professor/criados/:id), para revê-la e aprovar (ou ao Início, se não
       gerou). 14ª rodada: o fim diz que o que espera fica no sino e que as ferramentas têm uma aba.
   Uma vez por pessoa; ?rever=1 ou ?como= (Mapa) mostra de novo. O ?como= troca a pessoa pela raiz do app. */

type Sugestao = { id: string; rotulo: string; base: string; de: 'prova' | 'atividade'; titulo: string; turmaId: string; questoes: number }

const QUESTOES = [5, 10, 15, 20] as const
type NQuestoes = (typeof QUESTOES)[number]

function Etapa({ ladrilho, rotulo }: { ladrilho: ReactNode; rotulo: string }) {
  return (
    <li className="flex w-[88px] flex-col items-center gap-2 text-center sm:w-[110px]">
      {ladrilho}
      <span className="text-[14px] font-bold leading-[18px] text-tinta">{rotulo}</span>
    </li>
  )
}

/** Celular estreito: no 2 × 2 das questões o ícone sai, para "15 questões" caber no cartão. */
const ESTREITO = '(max-width: 639px)'
function useEstreito() {
  return useSyncExternalStore(
    (avisar) => { const m = window.matchMedia(ESTREITO); m.addEventListener('change', avisar); return () => m.removeEventListener('change', avisar) },
    () => window.matchMedia(ESTREITO).matches,
    () => false,
  )
}

const Seta = () => <ArrowRight aria-hidden className="mt-3 size-5 shrink-0 text-sutil" strokeWidth={2.5} />

/** Uma turma no passo 4: lê o que está gravado e mostra a escolha desta tela por cima. */
function LinhaSemana({ turmaId, nome, disciplina, valor, aoMudar }: {
  turmaId: string; nome: string; disciplina: string; valor: boolean | undefined; aoMudar: (v: boolean) => void
}) {
  const gravado = useAjustesTurma(turmaId).semana
  const ligado = valor ?? gravado
  const m = materiaDe(disciplina)
  return (
    <li className="flex min-h-14 items-center gap-3 px-3 py-2">
      <LadrilhoIcone familia={m?.familia ?? 'azul'} tamanho={40} icone={<Icone id={m?.icone ?? 'turmas'} />} />
      <span className="t-cartao min-w-0 flex-1 text-tinta">{nome} · {disciplina}</span>
      <Interruptor ligado={ligado} aoMudar={aoMudar} rotulo={`Preparar a semana do ${nome}`} />
    </li>
  )
}

/* O fim diz onde as coisas ficam na casca nova (14ª rodada): o que espera por ele fica no SINO, no canto de cima; as
   ferramentas têm uma aba própria na lateral. */
function OndeFica() {
  return (
    <ul aria-label="Onde fica cada coisa" className="mx-auto grid w-full max-w-[480px] overflow-hidden rounded-[16px] border-2 border-borda">
      <li className="flex min-h-16 items-center gap-3 px-3 py-2">
        <LadrilhoIcone familia="laranja" tamanho={40} icone={<Bell className="text-(--texto)" strokeWidth={2.5} />} />
        <span className="min-w-0 flex-1">
          <span className="t-cartao block text-tinta">O que espera por você fica no sino</span>
          <span className="t-apoio block">No canto de cima, com o número.</span>
        </span>
      </li>
      <li className="flex min-h-16 items-center gap-3 border-t-2 border-borda px-3 py-2">
        <LadrilhoIcone familia="azul" tamanho={40} icone={<Icone id="mais" tamanho={28} />} />
        <span className="min-w-0 flex-1">
          <span className="t-cartao block text-tinta">As ferramentas têm uma aba</span>
          <span className="t-apoio block">Na lateral; os atalhos seguem sob a caixa.</span>
        </span>
      </li>
    </ul>
  )
}

/** "1 prova de 10 questões para aprovar em Criados": conta as questões que a folha mostra (não a preferência). */
function rotuloDoGerado(id: string) {
  const doc = documentoDe(id)
  const n = doc ? questoesDoDocumento(doc).length : 0
  const lista = doc?.de === 'atividade'
  if (!n) return `1 ${lista ? 'lista' : 'prova'} para aprovar em Criados`
  return `1 ${lista ? 'lista' : 'prova'} de ${n} ${lista ? 'exercícios' : 'questões'} para aprovar em Criados`
}

export function BemVindoProfessor() {
  const navegar = useNavigate()
  const [params] = useSearchParams()
  // lido uma vez: a raiz do app tira o ?como= da barra logo depois
  const [forcada] = useState(() => params.has('rever') || params.has('como'))
  const vista = useIntroducaoVista('professor')
  // Lida uma vez, ao abrir: o COMEÇAR marca a introdução como vista antes de navegar, e a guarda não pode passar por cima do destino.
  const [vistaAoAbrir] = useState(() => vista)
  const prof = useProfessorAtual()
  const estreito = useEstreito()

  // passo 2 · as turmas
  const minhas = useAlocacoes(prof.profId).filter((a) => a.estado !== 'encerrado')
  const pendentes = minhas.filter((a) => a.estado === 'pendente')
  const [desmarcadas, setDesmarcadas] = useState<string[]>([])
  const [confirmadasAqui, setConfirmadasAqui] = useState<string[]>([])
  const [contestando, setContestando] = useState(false)
  const [alvo, setAlvo] = useState<string | null>(null)
  const [motivo, setMotivo] = useState<Contestacao | null>(null)
  const [complemento, setComplemento] = useState('')

  // passo 3 · a prova
  const [questoes, setQuestoes] = useState<NQuestoes | null>(null)
  const [gabarito, setGabarito] = useState(true)

  // passo 4 · a semana (só o que mudou nesta tela), só da escola em que ele está (como em Turmas)
  const escola = useEscolaAtiva()
  const turmas = useTurmasDoProfessor(escola.id)
  const [semana, setSemana] = useState<Record<string, boolean>>({})

  // passo 5 · a primeira prova
  const sugestoes = useMemo<Sugestao[]>(() => {
    const turmaDele = turmas[0] ?? undefined
    const turmaId = turmaDele?.id ?? minhas[0]?.turmaId ?? '2a'
    const turmaNome = turmaDele?.nome ?? minhas[0]?.turma ?? '2ºA'
    if (prof.disciplina === 'Química') {
      return [
        { id: 'prova', rotulo: 'Prova de estequiometria · 2ºA · 10 questões', base: 'prova-estequiometria', de: 'prova', titulo: 'Prova de estequiometria', turmaId: '2a', questoes: 10 },
        { id: 'lista', rotulo: 'Lista de estequiometria · 1ºC · 8 exercícios', base: 'lista-mol-massa-molar', de: 'atividade', titulo: 'Lista de estequiometria', turmaId: '1c', questoes: 8 },
      ]
    }
    if (prof.disciplina === 'Física') {
      return [{ id: 'prova', rotulo: `Prova de cinemática · ${turmaNome} · 10 questões`, base: 'modelo-prova-fisica', de: 'prova', titulo: 'Prova de cinemática', turmaId, questoes: 10 }]
    }
    return [{ id: 'prova', rotulo: `Prova de estequiometria · ${turmaNome} · 10 questões`, base: 'prova-estequiometria', de: 'prova', titulo: 'Prova de estequiometria', turmaId, questoes: 10 }]
  }, [prof.disciplina, turmas, minhas])
  const [sugestao, setSugestao] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [gerado, setGerado] = useState<string | null>(null)

  if (vistaAoAbrir && !forcada) return <Navigate to="/professor" replace />

  const sair = () => navegar('/professor', { replace: true })
  const comecar = () => {
    sessao.verIntroducao('professor')
    navegar(gerado ? `/professor/criados/${gerado}` : '/professor', { replace: true })
  }

  const confirmarTurmas = () => {
    const marcadas = pendentes.filter((a) => !desmarcadas.includes(a.id))
    marcadas.forEach((a) => alocacoes.confirmar(a.id))
    setConfirmadasAqui((nomes) => [...nomes, ...marcadas.map((a) => a.turma).filter((t) => !nomes.includes(t))])
  }

  const abrirContestacao = () => {
    const candidatas = minhas.filter((a) => a.estado !== 'contestado')
    setAlvo(pendentes[0]?.id ?? candidatas[0]?.id ?? null)
    setMotivo(null)
    setComplemento('')
    setContestando(true)
  }

  const gerar = () => {
    const s = sugestoes.find((x) => x.id === sugestao)
    if (!s || gerando) return
    setGerando(true)
    window.setTimeout(() => {
      const id = documentos.criar(s.base, { turmaId: s.turmaId, de: s.de, titulo: s.titulo, questoes: s.questoes })
      if (!lerEnvios().info[id]) {
        envios.novoRascunho(id, { titulo: s.titulo, tipo: s.de === 'prova' ? 'prova' : 'lista', turmaId: s.turmaId, questoes: s.questoes, materia: prof.disciplina })
      }
      setGerado(id)
      setGerando(false)
    }, 900)
  }

  const previa = gerado ? (documentoDe(gerado)?.blocos ?? []).flatMap((b) => (b.t === 'questao' ? [b] : [])).slice(0, 2) : []

  const passos: PassoIntroducao[] = [
    {
      id: 'regra', pose: 'acenando',
      fala: <>Oi, {prof.primeiro}! Sou o Assistente: eu preparo, você aprova.</>,
      conteudo: (
        <div className="grid gap-5 pt-2">
          <ol className="flex items-start justify-center gap-1 sm:gap-2">
            <Etapa rotulo="Eu preparo" ladrilho={<LadrilhoIcone familia="azul" tamanho={56} icone={<PencilLine className="text-(--texto)" strokeWidth={2.5} />} />} />
            <Seta />
            <Etapa rotulo="Você revê" ladrilho={<LadrilhoIcone familia="amarelo" tamanho={56} icone={<Eye className="text-(--texto)" strokeWidth={2.5} />} />} />
            <Seta />
            <Etapa rotulo="Só então vai à turma" ladrilho={<LadrilhoIcone familia="verde" tamanho={56} icone={<Check className="text-(--texto)" strokeWidth={3} />} />} />
          </ol>
          <p className="t-corpo text-center text-apoio">Sou um programa e posso errar.</p>
        </div>
      ),
    },
    {
      id: 'turmas', pose: 'apontando', rotuloContinuar: 'Sim, estão certas',
      fala: 'Estas são as suas turmas?',
      aoContinuar: confirmarTurmas,
      conteudo: (
        <div className="grid gap-3">
          {minhas.length === 0 && <p className="t-corpo text-apoio">A coordenação ainda não pôs você numa turma.</p>}
          <div className="grid gap-2.5">
            {minhas.map((a) => {
              const m = materiaDe(a.disciplina)
              const confirmada = a.estado === 'confirmado'
              const contestada = a.estado === 'contestado'
              const marcada = confirmada || (a.estado === 'pendente' && !desmarcadas.includes(a.id))
              return (
                <Opcao key={a.id} tipo="checkbox" valor={a.id} marcado={marcada} disabled={confirmada || contestada}
                  aoMudar={(v) => setDesmarcadas((d) => (v ? d.filter((x) => x !== a.id) : [...d, a.id]))}
                  icone={<Icone id={m?.icone ?? 'turmas'} tamanho={40} />}>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{a.turma} · {a.disciplina}</span>
                    {confirmada && <Selo familia="verde" tamanho="p">Confirmada</Selo>}
                    {a.estado === 'pendente' && <Selo familia="azul" tamanho="p">Nova</Selo>}
                    {contestada && <Selo familia="amarelo" tamanho="p">Com a coordenação</Selo>}
                  </span>
                </Opcao>
              )
            })}
          </div>
          {minhas.length > 0 && (
            <Botao variante="fantasma" tamanho="m" className="justify-self-start" onClick={abrirContestacao}>Falta ou sobra uma</Botao>
          )}
          <DialogoConfirmar aberto={contestando} aoMudar={setContestando} titulo="O que está errado?" frase={EFEITO_DA_CONTESTACAO}
            confirmar={{
              rotulo: 'Enviar à coordenação', variante: 'primario', desligado: !alvo || !motivo,
              aoConfirmar: () => { if (alvo && motivo) alocacoes.contestar(alvo, motivo, complemento) },
            }}>
            {minhas.filter((a) => a.estado !== 'contestado').length > 1 && (
              <GrupoToques rotulo="Qual turma" valor={alvo} aoMudar={(v) => setAlvo(v as string)}
                opcoes={minhas.filter((a) => a.estado !== 'contestado').map((a) => ({ id: a.id, rotulo: `${a.turma} · ${a.disciplina}` }))} />
            )}
            <GrupoToques rotulo="Motivo" valor={motivo} aoMudar={(v) => setMotivo(v as Contestacao)}
              opcoes={(Object.keys(NOME_DA_CONTESTACAO) as Contestacao[]).map((k) => ({ id: k, rotulo: NOME_DA_CONTESTACAO[k] }))} />
            <CampoTexto rotulo="O que está errado?" valor={complemento} aoMudar={setComplemento} dica={AVISO_DO_COMPLEMENTO} maxLength={200} />
          </DialogoConfirmar>
        </div>
      ),
    },
    {
      id: 'questoes', pose: 'pensando', pronto: questoes !== null, reacao: 'Anotado!',
      fala: 'Quantas questões costuma pedir numa prova?',
      aoContinuar: () => { if (questoes) preferencias.mudar({ prova: { questoes, gabarito } }) },
      conteudo: (
        <div className="grid gap-4">
          <div role="radiogroup" aria-label="Questões numa prova" className="grid grid-cols-2 gap-3">
            {QUESTOES.map((n) => (
              <Opcao key={n} nome="questoes" valor={String(n)} marcado={questoes === n} aoMudar={() => setQuestoes(n)}
                icone={estreito ? undefined : <Icone id="prova" tamanho={40} />}>
                {n} questões
              </Opcao>
            ))}
          </div>
          <div className="flex min-h-14 items-center gap-3 rounded-[12px] border-2 border-borda px-3 py-2">
            <span className="t-cartao min-w-0 flex-1 text-tinta">Sempre com gabarito comentado</span>
            <Interruptor ligado={gabarito} aoMudar={setGabarito} rotulo="Sempre com gabarito comentado" />
          </div>
        </div>
      ),
    },
    {
      id: 'semana', pose: 'pensando', agoraNao: true,
      fala: 'Quer que eu deixe a semana pronta toda segunda?',
      aoContinuar: () => { Object.entries(semana).forEach(([id, v]) => ajustesTurma.mudar(id, 'semana', v)) },
      conteudo: turmas.length === 0
        ? <p className="t-corpo text-apoio">Quando uma turma for confirmada, você liga aqui ou no ⋯ dela.</p>
        : (
          <ul className="divide-y-2 divide-borda rounded-[16px] border-2 border-borda">
            {turmas.map((t) => (
              <LinhaSemana key={t.id} turmaId={t.id} nome={t.nome} disciplina={t.disciplina} valor={semana[t.id]}
                aoMudar={(v) => setSemana((s) => ({ ...s, [t.id]: v }))} />
            ))}
          </ul>
        ),
    },
    {
      id: 'prova', pose: 'apontando', agoraNao: true, pronto: !!gerado,
      fala: 'Vamos fazer sua primeira prova? Leva 1 minuto.',
      conteudo: gerado ? (
        <div className="grid gap-3 animate-entra">
          <ol className="grid gap-2.5 rounded-[16px] border-2 border-borda bg-white p-4">
            {previa.map((q) => (
              <li key={q.n} className="t-corpo line-clamp-3 text-tinta">
                <span className="font-bold">{q.n}.</span> {q.x}{q.pagina ? <> <ChipPagina pagina={q.pagina} /></> : null}
              </li>
            ))}
          </ol>
          <p className="t-corpo flex items-start gap-2 text-apoio">
            <Check aria-hidden className="mt-1 size-5 shrink-0 text-verde-texto" strokeWidth={3} />
            Ficou em Criados. Nada vai à turma até você aprovar.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          <div role="radiogroup" aria-label="Sugestões" className="grid gap-2.5">
            {sugestoes.map((s) => (
              <Opcao key={s.id} nome="sugestao" valor={s.id} marcado={sugestao === s.id} aoMudar={() => setSugestao(s.id)} disabled={gerando}
                icone={<Icone id={s.de === 'prova' ? 'prova' : 'lista'} tamanho={40} />}>
                {s.rotulo}
              </Opcao>
            ))}
          </div>
          {questoes !== null && sugestoes.some((s) => s.de === 'prova' && s.questoes !== questoes) && (
            <p className="t-apoio">Esta primeira sai do modelo da escola, com 10 questões; as próximas seguem as suas {questoes}.</p>
          )}
          {gerando ? (
            <p role="status" className="t-corpo flex h-12 items-center justify-center gap-3 text-apoio">
              <AvatarIA agente="assistente" tamanho={32} pensando /> Preparando…
            </p>
          ) : (
            <Botao largura="cheia" disabled={!sugestao} onClick={gerar}>Gerar</Botao>
          )}
        </div>
      ),
    },
  ]

  const resumo = [
    ...(confirmadasAqui.length > 0
      ? [confirmadasAqui.length === 1 ? `${confirmadasAqui[0]} confirmada` : `${confirmadasAqui.join(', ')} confirmadas`]
      : []),
    ...(questoes ? [`${gerado ? 'Próximas provas' : 'Provas'} com ${questoes} questões${gabarito ? ' e gabarito' : ''}`] : []),
    // o número real da prova gerada (o modelo da escola), e não o da preferência: a folha mostra o que o rótulo diz
    ...(gerado ? [rotuloDoGerado(gerado)] : []),
  ]

  return (
    <Introducao rotulo="Introdução do professor" agente="assistente" aoSair={sair} passos={passos}
      fim={{ fala: <>Tudo pronto, {prof.primeiro}!</>, resumo, aoComecar: comecar, conteudo: <OndeFica /> }} />
  )
}
