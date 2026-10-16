import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Bookmark, Clock3, Eye, Moon, Save, type LucideIcon } from 'lucide-react'
import { Aviso, Botao, Comemoracao, DialogoConfirmar, Selo, TelaFoco } from '@/components/duo'
import { Onca } from '@/components/duo/onca'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import { avaliacoes, useSaidas, useTarefa, useTutorTravado } from '@/dados/avaliacoes'
import { bancoDaTarefa } from '@/dados/questoes'
import { sessao } from '@/dados/sessao'
import { depoisDeEnviar } from '@/dados/avisos'
import { FormularioAvisar } from './Avisar'
import { Alternativas, LadrilhoMateria, NavQuestoes, RespostaSalva, type MarcaQuestao } from './_pecas'
import { cn } from '@/lib/utils'

/* A PROVA (/aluno/prova/:id), 12ª rodada, 04/10/2026 (plano de polimento, 5.1 e fluxos F2, F3, F5; auditoria do
   aluno, 1.6, Q-1 e Q-11). Tela de foco, FORA da casca, sem lateral (R2). As questões vêm de dados/questoes.ts (as
   10 do documento da professora), e cada resposta vai ao estado da demonstração na hora (`avaliacoes.responder`).
   · ANTES: o ladrilho na cor da matéria, o nome, "Química · 10 questões · 50 minutos", três linhas e AGORA NÃO e
     COMEÇAR do mesmo tamanho (D70; recusar nunca é mais difícil, D59).
   · AINDA NÃO ABRIU (enviada "na próxima aula"): "Abre terça, 7h30." e VOLTAR. O Tutor não dorme.
   · DURANTE: no topo, "Questão 3 de 10", o relógio em minutos (sem segundos, sem piscar) e AVISAR UM ADULTO e SAIR
     DA PROVA, fantasmas do mesmo tamanho (D61). Avisar abre o formulário POR CIMA da prova: o relógio para e nada
     conta como saída (Q-1; ECA Digital, art. 28, lei). Trocar de aba conta (`avaliacoes.saiuDaProva`), e só o
     professor vê (D70): o aluno não vê contador.
   · SEM INTERNET (?rede=caiu): o aviso calmo, e o relógio para.
   · 14ª rodada (05/10/2026; plano ux-composicao, 5.2; as portas do Plurall): MARCAR PARA REVISAR em cada questão e,
     antes de entregar, REVISAR: as questões em grade, as em branco e as marcadas à vista, cada uma clicável; depois a
     pergunta "Entregar?". O que não tem prova (ainda não chegou, abre depois, entregue) fica a 1/3 da altura.
   · ENTREGUE: a onça comemora a ENTREGA, "O Tutor já voltou." e VOLTAR AO INÍCIO. A nota só depois da professora
     aprovar (regra 70): aqui não aparece nota nenhuma.
   Aberta pela URL ANTES do envio: vai para Tarefas (nada chega sem a professora aprovar). O formulário de Avisar é o MESMO da tela
   Avisar (`FormularioAvisar`, origem "prova"). */

const ANTES: { icone: LucideIcon; texto: string }[] = [
  { icone: Moon, texto: 'Na prova, o Tutor descansa.' },
  { icone: Eye, texto: 'Se você sair desta tela, a professora fica sabendo.' },
  { icone: Save, texto: 'Cada resposta fica salva, mesmo se a internet cair.' },
  { icone: Bookmark, texto: 'Antes de entregar, você revisa as que marcou.' },
]


/* A prova já começada nesta visita à demonstração: o tempo que resta, por prova. Se ele sai e volta, a prova abre
   na questão em que parou, com o tempo que resta (e não de novo na tela de antes). Fora disso (recarregou a página),
   "começada" vem da base: há respostas salvas ou saídas registradas. */
const restaPorProva = new Map<string, number>()

export function Prova() {
  const { id = 'prova-estequiometria' } = useParams()
  return <ProvaDe key={id} id={id} />
}

function ProvaDe({ id }: { id: string }) {
  const navegar = useNavigate()
  const [rede] = useParametro('rede')
  const semRede = rede === 'caiu'
  const t = useTarefa(id)
  // depois da entrega, o Tutor volta, a não ser que a escola o tenha pausado (ou falte quem receba o risco à vida)
  const travado = useTutorTravado()
  const banco = bancoDaTarefa(id, 'prova')
  const questoes = banco.questoes
  const nome = t?.titulo ?? banco.titulo
  const materia = t?.materia ?? 'Química'
  const minutos = t?.minutos ?? 50
  // a linha leva direto aqui: o NOVO da prova enviada some quando ele a abre
  const [chave] = useState(() => (t?.novo ? t.chaveNovo : ''))
  useEffect(() => { if (chave) sessao.marcarVisto(chave) }, [chave])

  // Já começada (saiu e voltou): abre direto na primeira questão sem resposta, com o tempo que resta.
  const saidas = useSaidas(id)
  const [retomada] = useState(() => !semRede && (restaPorProva.has(id) || (t?.feitas ?? 0) > 0 || saidas > 0))
  // Quem chega pelo link "sem internet" do Mapa já está no meio da prova.
  const [fase, setFase] = useState<'antes' | 'andamento' | 'entregue'>(semRede || retomada ? 'andamento' : 'antes')
  const [respostas, setRespostas] = useState<Record<number, string>>(() => {
    const salvas = t?.respostas ?? {}
    return semRede && Object.keys(salvas).length === 0 ? { 0: 'C', 1: 'B', 2: 'C' } : { ...salvas }
  })
  const [atual, setAtual] = useState(() => {
    if (semRede) return 2
    if (!retomada) return 0
    const vazia = questoes.findIndex((_, i) => !respostas[i])
    return vazia === -1 ? questoes.length - 1 : vazia
  })
  const [resta, setResta] = useState(() => semRede ? 41
    : restaPorProva.get(id) ?? (retomada ? Math.max(5, minutos - 2 - 3 * Object.keys(respostas).length) : minutos))
  const [voltou, setVoltou] = useState(retomada)
  useEffect(() => { if (fase === 'andamento' && !semRede) restaPorProva.set(id, resta) }, [fase, semRede, id, resta])
  const [avisando, setAvisando] = useState(false)
  const [avisoN, setAvisoN] = useState<number | null>(null)
  const [entregar, setEntregar] = useState(false)
  const [sair, setSair] = useState(false)
  // as questões marcadas para revisar (só nesta tela) e a revisão antes de entregar
  const [revisar, setRevisar] = useState<number[]>([])
  const [revisando, setRevisando] = useState(false)
  const feitas = Object.keys(respostas).length
  const parado = semRede || avisando

  // O relógio é do servidor; aqui só simulamos, de minuto em minuto. Parado sem internet e enquanto avisa um adulto.
  useEffect(() => {
    if (fase !== 'andamento' || parado) return
    const r = window.setInterval(() => setResta((m) => Math.max(0, m - 1)), 60_000)
    return () => window.clearInterval(r)
  }, [fase, parado])

  // Trocar de aba durante a prova conta, e só o professor vê (D70). Avisar um adulto não é saída.
  useEffect(() => {
    if (fase !== 'andamento' || avisando) return
    const mudou = () => { if (document.visibilityState === 'hidden') avaliacoes.saiuDaProva(id) }
    document.addEventListener('visibilitychange', mudou)
    return () => document.removeEventListener('visibilitychange', mudou)
  }, [fase, avisando, id])

  // Já entregue (ou corrigida): a prova não abre de novo; o resultado mora na tarefa.
  if (fase !== 'entregue' && t && (t.estadoVivo === 'entregue' || t.estadoVivo === 'corrigida')) {
    return <Navigate to={`/aluno/tarefas/${id}`} replace />
  }

  // Sem envio, a prova não existe para o aluno: nada chega à turma sem a professora aprovar (regra 10). O endereço
  // aberto antes do envio leva às Tarefas (nunca uma tela vazia).
  if (!t && fase !== 'entregue') return <Navigate to="/aluno/tarefas" replace />

  if (fase === 'entregue') {
    return (
      <TelaFoco topo={{ voltar: false }} classeMiolo="grid grid-rows-[1fr_auto_2fr] justify-items-center px-4">
        <span aria-hidden />
        <div className="grid justify-items-center gap-3 py-8 text-center">
          <Comemoracao ilustracao={<Onca pose="comemorando" tamanho={96} />} titulo="Entregue!" />
          <p className="t-corpo max-w-[34ch] text-apoio">Sua professora vê antes de você.{travado?.motivo === 'pausado' ? ' O Tutor está pausado pela escola.' : travado ? '' : ' O Tutor já voltou.'}</p>
          <Botao variante="primario" className="mt-2" asChild><Link to="/aluno">Voltar ao início</Link></Botao>
        </div>
        <span aria-hidden />
      </TelaFoco>
    )
  }

  if (t?.estadoVivo === 'abre-em' && t.abre) {
    return (
      <TelaFoco topo={{ voltar: false }} classeMiolo="grid grid-rows-[1fr_auto_2fr] justify-items-center px-4">
        <span aria-hidden />
        <div className="grid w-full max-w-[420px] justify-items-center gap-4 py-8 text-center">
          <LadrilhoMateria materia={materia} tipo="prova" tamanho={56} />
          <h1 className="t-titulo text-tinta">{nome}</h1>
          <p className="t-corpo text-apoio">Abre {t.abre.rotulo}.</p>
          <Botao variante="secundario" asChild><Link to="/aluno/tarefas">Voltar às tarefas</Link></Botao>
        </div>
        <span aria-hidden />
      </TelaFoco>
    )
  }

  if (fase === 'antes') {
    return (
      <TelaFoco topo={{ voltar: false }} classeMiolo="grid grid-rows-[1fr_auto_2fr] justify-items-center px-4">
        <span aria-hidden />
        <div className="w-full max-w-[480px] py-8">
          <LadrilhoMateria materia={materia} tipo="prova" tamanho={56} />
          <h1 className="t-titulo mt-4 text-tinta">{nome}</h1>
          <p className="t-apoio mt-1">{materia} · {questoes.length} questões · {minutos} minutos</p>
          <ul className="mt-6 grid gap-3">
            {ANTES.map(({ icone: I, texto }) => (
              <li key={texto} className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-fundo-suave text-apoio"><I className="size-5" strokeWidth={2.5} /></span>
                <span className="t-cartao text-tinta">{texto}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Botao variante="secundario" largura="cheia" asChild><Link to="/aluno/tarefas">Agora não</Link></Botao>
            <Botao variante="primario" largura="cheia" onClick={() => setFase('andamento')}>Começar</Botao>
          </div>
        </div>
        <span aria-hidden />
      </TelaFoco>
    )
  }

  const q = questoes[atual]
  const marcas: Record<number, MarcaQuestao> = Object.fromEntries(Object.keys(respostas).map((k) => [Number(k), 'feita' as const]))
  const marcada = revisar.includes(atual)
  const alternarRevisar = () => setRevisar((r) => (r.includes(atual) ? r.filter((i) => i !== atual) : [...r, atual]))
  const emBranco = questoes.map((_, i) => i).filter((i) => !respostas[i])
  const irPara = (i: number) => { setAtual(i); setRevisando(false) }
  const responder = (letra: string) => {
    setRespostas((r) => ({ ...r, [atual]: letra }))
    avaliacoes.responder(id, atual, letra)
    setVoltou(false)
  }

  return (
    <TelaFoco
      topo={{
        voltar: false,
        titulo: <span className="hidden md:inline">{nome}</span>,
        meio: (
          <p className="flex items-center gap-3 whitespace-nowrap text-[15px] font-bold text-tinta md:gap-4">
            <span><span className="hidden sm:inline">Questão </span>{atual + 1} de {questoes.length}</span>
            <span role="timer" aria-label={`Faltam ${resta} minutos${parado ? ', relógio parado' : ''}`} className="inline-flex items-center gap-1.5 tabular-nums">
              <Clock3 aria-hidden className="size-[18px] text-sutil" strokeWidth={2.5} /> {resta} min
            </span>
          </p>
        ),
        acoes: (
          <>
            <Botao variante="fantasma" tamanho="m" className="w-[76px] sm:w-[176px]" onClick={() => setAvisando(true)} aria-label="Avisar um adulto">
              <span className="sm:hidden">Avisar</span><span className="hidden sm:inline">Avisar um adulto</span>
            </Botao>
            <Botao variante="fantasma" tamanho="m" className="w-[76px] sm:w-[176px]" onClick={() => setSair(true)} aria-label="Sair da prova">
              <span className="sm:hidden">Sair</span><span className="hidden sm:inline">Sair da prova</span>
            </Botao>
          </>
        ),
      }}
      rodape={revisando ? undefined : (
        <div className="mx-auto w-full max-w-[760px]">
          <NavQuestoes total={questoes.length} atual={atual} aoIr={setAtual} marcas={marcas}
            fim={<Botao variante="primario" tamanho="m" onClick={() => setRevisando(true)}>Revisar e entregar</Botao>} />
        </div>
      )}>
      <div className="mx-auto grid w-full max-w-[760px] gap-3 px-4 py-6 md:px-6">
        {semRede && <Aviso tom="atencao">Sem internet. O tempo parou. Sua resposta está guardada.</Aviso>}
        {voltou && <Aviso tom="info">Você voltou. {feitas === 1 ? 'Sua resposta está salva' : `Suas ${feitas} respostas estão salvas`}. Faltam {resta} minutos.</Aviso>}
        {revisando ? (
          <section aria-labelledby="revisar" className="grid gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="revisar" className="t-titulo text-tinta">Revisar a prova</h2>
              <p className="t-apoio">{feitas} de {questoes.length} respondidas{emBranco.length ? ` · ${emBranco.length} em branco` : ''}{revisar.length ? ` · ${revisar.length} para revisar` : ''}</p>
            </div>
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {questoes.map((_, i) => {
                const branco = !respostas[i]
                const rev = revisar.includes(i)
                return (
                  <li key={i}>
                    <button type="button" onClick={() => irPara(i)}
                      className={cn('grid h-20 w-full content-center justify-items-start gap-1 rounded-[12px] border-2 px-3 text-left transition-colors duration-150 hover:bg-fundo-suave',
                        branco ? 'border-dashed border-borda-forte' : rev ? 'border-amarelo-borda bg-amarelo-claro' : 'border-borda')}>
                      <span className="t-selo text-sutil">Questão {i + 1}</span>
                      <span className="flex items-center gap-1.5 text-[17px] font-bold text-tinta">
                        {branco ? <span className="text-[15px] font-bold text-apoio">Em branco</span> : <>Letra {respostas[i]}</>}
                        {rev && <Bookmark aria-label="marcada para revisar" className="size-4 text-amarelo-texto" strokeWidth={2.5} />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-borda pt-4">
              <p className="t-apoio min-w-0 flex-1 basis-64">Toque numa questão para voltar a ela. Depois de entregar, não dá para mudar.</p>
              <div className="ml-auto flex gap-2">
                <Botao variante="secundario" tamanho="m" onClick={() => setRevisando(false)}>Voltar à prova</Botao>
                <Botao variante="primario" tamanho="m" onClick={() => setEntregar(true)}>Entregar</Botao>
              </div>
            </div>
          </section>
        ) : (
          <section aria-label={`Questão ${atual + 1}`} className="grid gap-4">
            <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <h2 className="t-selo text-sutil">Questão {atual + 1}</h2>
                {marcada && <Selo familia="amarelo" tamanho="p" icone={<Bookmark strokeWidth={2.5} />}>Para revisar</Selo>}
              </span>
              <span className="ml-auto flex items-center gap-2">
                <RespostaSalva salvo={!!respostas[atual]} />
                <Botao variante="fantasma" tamanho="p" aria-pressed={marcada} onClick={alternarRevisar} icone={<Bookmark strokeWidth={2.5} />}>
                  {marcada ? 'Tirar a marca' : 'Marcar para revisar'}
                </Botao>
              </span>
            </div>
            <p className="t-corpo max-w-[68ch] text-tinta">{q.enunciado}</p>
            <Alternativas questao={q} nome={`p${atual}`} valor={respostas[atual]} aoEscolher={responder} />
          </section>
        )}
      </div>

      <DialogoConfirmar aberto={entregar} aoMudar={setEntregar} titulo="Entregar?"
        frase={`Você respondeu ${feitas} de ${questoes.length}${emBranco.length ? ` (${emBranco.length} em branco)` : ''}. Depois não dá para mudar. A nota chega depois que a professora aprovar.`}
        confirmar={{ rotulo: 'Entregar', variante: 'primario', aoConfirmar: () => { avaliacoes.entregar(id); restaPorProva.delete(id); setFase('entregue') } }} />

      <DialogoConfirmar aberto={sair} aoMudar={setSair} titulo="Sair agora?"
        frase="Suas respostas ficam salvas e a professora fica sabendo."
        confirmar={{ rotulo: 'Sair', variante: 'secundario', aoConfirmar: () => { avaliacoes.saiuDaProva(id); navegar('/aluno/tarefas') } }} />

      <PainelLado aberto={avisando} aoFechar={() => { setAvisando(false); setAvisoN(null) }} titulo="Avisar um adulto"
        descricao="O relógio da prova está parado enquanto você escreve.">
        {avisoN === null ? (
          <div className="grid gap-4">
            <p className="inline-flex items-center gap-2 text-[15px] font-bold text-apoio"><Clock3 aria-hidden className="size-4" strokeWidth={2.5} /> O relógio da prova parou.</p>
            <FormularioAvisar origem="prova" aoEnviar={setAvisoN} />
          </div>
        ) : (
          <div className="grid gap-4">
            <Aviso tom="info" titulo={depoisDeEnviar()}>Aviso {avisoN} · a resposta chega em Avisar um adulto</Aviso>
            <Botao variante="secundario" largura="cheia" onClick={() => { setAvisando(false); setAvisoN(null) }}>Voltar à prova</Botao>
          </div>
        )}
      </PainelLado>
    </TelaFoco>
  )
}

