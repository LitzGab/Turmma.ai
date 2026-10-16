import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, Home, Lock, MoonStar, PenLine, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InputBar } from '@/components/ui/input-bar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MensagemIA, MensagemPessoa, Pensando, useRolarAoFim } from '@/components/turmma/conversa'
import { ChipFonte } from '@/components/turmma/ia'
import { NotaMockup } from '@/components/turmma/tela'
import { BarraCalma, Explica } from './_pecas'

/* O Tutor do aluno (11.6, A4). A mesma casca, mais calma: faixa fixa de supervisão (D8),
   caixa só com texto e enviar, o uso do dia em texto com barra neutra (D38, D59), e a
   assinatura igual à dos outros agentes — avatar, "Tutor", selo "IA" (D58).
   Sem saudação animada, sem pílula, sem coreografia de entrada: tudo com `calmo`. */

type Estado = 'ligado' | 'avaliacao' | 'fora' | 'limite'
type Fala = { de: 'aluno'; texto: string } | { de: 'tutor'; corpo: ReactNode }
const LIMITE = 60

/* A mensagem FIXA de assunto delicado (D36): acolhe, não aconselha, aponta para um humano.
   O texto é revisado pela escola; o Tutor não improvisa aqui. */
function MensagemFixa() {
  return (
    <div className="grid gap-3 rounded-cartao border border-linha bg-info-cx p-4 text-info lg:p-5">
      <p className="rotulo text-info">Mensagem combinada com a sua escola</p>
      <p>Obrigado por contar. Isso é importante, e eu sou um programa de computador: não sou quem pode ajudar você nisso.</p>
      <p>Fale hoje com seu professor ou com a orientação educacional da escola. Eles podem ajudar de verdade.</p>
      <p className="flex items-start gap-2 font-medium"><Phone className="mt-1 size-4 shrink-0" /> Se você estiver em perigo ou pensando em se machucar, ligue 188 (CVV). É de graça e funciona a qualquer hora.</p>
      <p className="text-apoio">Seu professor vai receber um aviso de que você precisa de atenção. Ele não vê o que você escreveu.</p>
      <div><Button variant="secundario" className="text-base" asChild><Link to="/aluno/avisar">Avisar um adulto da escola</Link></Button></div>
    </div>
  )
}

const ABERTURA: Fala[] = [
  { de: 'aluno', texto: 'qual é a resposta da questão 4 da lista de estequiometria?' },
  { de: 'tutor', corpo: (
    <div className="grid gap-3">
      <p>Essa eu não vou responder por você. Mas a gente chega lá junto, um passo de cada vez.</p>
      <p>A questão 4 tem 54 g de alumínio e 71 g de cloro. Primeiro passo: quantos mols de alumínio existem em 54 g? A massa molar está na tabela do seu livro <ChipFonte pagina={145} trecho="“Para passar de massa para quantidade de matéria, divida a massa pela massa molar da substância.”" />.</p>
      <p className="text-apoio">Na lista de mol e massa molar você errou 3 das 4 contas de passar massa para mol. Por isso começo por aqui, com calma.</p>
    </div>
  ) },
]

/* O que cada resposta de demonstração provoca. No produto estes botões não existem:
   a caixa do aluno não tem texto de exemplo (11.6). */
const ROTEIRO = {
  insistir: {
    aluno: 'só me fala se é o alumínio ou o cloro, por favor',
    tutor: (
      <div className="grid gap-3">
        <p>Ainda não vou dizer qual é. Se eu contar, você não aprende a achar sozinho, e na prova eu não estou lá.</p>
        <p>O próximo passo é pequeno: divida 54 g por 27 g/mol. Quanto dá?</p>
      </div>
    ),
  },
  conta: {
    aluno: 'deu 2 mol',
    tutor: (
      <div className="grid gap-3">
        <p>Isso. 2 mol de alumínio.</p>
        <p>Agora faça a mesma conta com o cloro: 71 g de Cl₂, e a massa molar do Cl₂ é 71 g/mol. Depois compare os dois números com a proporção 2 para 3 da equação <ChipFonte pagina={151} trecho="“O reagente limitante é o que acaba primeiro. Para achar, compare a quantidade que você tem com a proporção da equação balanceada.”" />. Qual dos dois acaba primeiro?</p>
      </div>
    ),
  },
  pessoa: {
    aluno: 'você é uma pessoa?',
    tutor: (
      <div className="grid gap-3">
        <p>Não. Sou o Tutor, um programa de computador. Posso errar. Seu professor vê como você usa.</p>
        <p>Eu funciono assim: leio o material da sua turma e faço perguntas para você pensar. Se eu disser algo estranho ou errado, avise seu professor.</p>
      </div>
    ),
  },
  delicado: { aluno: 'não tô bem, briguei feio em casa e não consigo estudar', tutor: <MensagemFixa /> },
} as const
type Passo = keyof typeof ROTEIRO

const ROTULO_PASSO: Record<Passo, string> = {
  insistir: 'Insistir na resposta pronta',
  conta: 'Responder a conta: "deu 2 mol"',
  pessoa: 'Perguntar: "você é uma pessoa?"',
  delicado: 'Falar de um assunto pessoal delicado',
}

export function Tutor() {
  const [estado, setEstado] = useState<Estado>('ligado')
  const [falas, setFalas] = useState<Fala[]>(ABERTURA)
  const [feitos, setFeitos] = useState<Passo[]>([])
  const [pensando, setPensando] = useState(false)
  const [usadas, setUsadas] = useState(12)
  const rolo = useRolarAoFim(`${falas.length}-${pensando}-${estado}`)

  const perguntas = estado === 'limite' ? LIMITE : usadas
  const acabou = estado === 'limite' || usadas >= LIMITE

  const enviar = (texto: string, resposta: ReactNode, passo?: Passo) => {
    if (pensando || acabou) return
    setFalas((f) => [...f, { de: 'aluno', texto }])
    if (passo) setFeitos((p) => [...p, passo])
    setUsadas((n) => n + 1)
    setPensando(true)
    window.setTimeout(() => { setFalas((f) => [...f, { de: 'tutor', corpo: resposta }]); setPensando(false) }, 1000)
  }

  const passos = (Object.keys(ROTEIRO) as Passo[]).filter((p) => !feitos.includes(p) && (p !== 'conta' || feitos.includes('insistir')))

  return (
    <div className="flex h-[calc(100svh-56px)] flex-col md:h-svh">
      {/* Faixa fixa, família info. Não fecha (D8). */}
      <div role="note" className="flex shrink-0 items-center justify-center gap-2 bg-info-cx px-4 py-2.5 text-center text-base text-info">
        <Eye className="size-[18px] shrink-0" strokeWidth={1.75} /> Seu professor acompanha como você usa o Tutor.
      </div>

      <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-linha px-4 py-2 md:px-8">
        <h1 className="font-corpo text-base font-semibold text-tinta">Tutor <span className="font-normal text-sutil">· Química · 2ºB</span></h1>
        <label className="flex items-center gap-2 rounded-controle border border-dashed border-linha py-1 pl-2.5 pr-1">
          <span className="text-xs font-medium text-sutil">Ver o estado</span>
          <Select value={estado} onValueChange={(v) => setEstado(v as Estado)}>
            <SelectTrigger className="h-9 w-[190px] rounded-linha border-linha bg-superficie text-sm" aria-label="Estado do Tutor"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-controle">
              <SelectItem value="ligado" className="rounded-linha">Ligado</SelectItem>
              <SelectItem value="avaliacao" className="rounded-linha">Em avaliação (travado)</SelectItem>
              <SelectItem value="fora" className="rounded-linha">Fora da sala (desligado)</SelectItem>
              <SelectItem value="limite" className="rounded-linha">Limite do dia atingido</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </header>

      {estado === 'avaliacao' && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Explica icone={Lock} titulo="O Tutor está pausado durante a prova."
            acao={<Button variant="secundario" className="text-base" asChild><Link to="/aluno/prova">Ir para a prova</Link></Button>}>
            <p>Você tem uma avaliação aberta agora: Prova de estequiometria. Quando você entregar a prova, o Tutor volta.</p>
          </Explica>
        </div>
      )}

      {estado === 'fora' && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Explica icone={Home} titulo="O Tutor funciona na sala de aula."
            acao={<Button variant="secundario" className="text-base" asChild><Link to="/aluno/atividades">Ver minhas atividades</Link></Button>}>
            <p>Sua escola deixou o Tutor ligado só durante as aulas. Não é um erro: na próxima aula de Química ele está aqui.</p>
            <p>Suas atividades continuam abertas para você fazer em casa.</p>
          </Explica>
        </div>
      )}

      {(estado === 'ligado' || estado === 'limite') && (
        <>
          <div ref={rolo} className="min-h-0 flex-1 overflow-y-auto px-4 md:px-6">
            <div className="mx-auto grid w-full max-w-[760px] gap-7 py-8">
              {falas.map((f, i) => f.de === 'aluno'
                ? <MensagemPessoa key={i} texto={f.texto} calmo />
                : <MensagemIA key={i} agente="tutor" calmo>{f.corpo}</MensagemIA>)}
              {pensando && <Pensando agente="tutor" calmo />}

              {acabou && (
                <div className="flex items-start gap-3 rounded-cartao border border-linha bg-superficie p-4 text-base text-apoio lg:p-5">
                  <MoonStar className="mt-0.5 size-5 shrink-0 text-sutil" strokeWidth={1.75} />
                  <p><b className="font-semibold text-tinta">Por hoje acabou.</b> Você fez as {LIMITE} perguntas de hoje. Amanhã o Tutor volta. Suas atividades continuam abertas.</p>
                </div>
              )}

              {!acabou && !pensando && passos.length > 0 && (
                <div className="grid gap-2.5 rounded-cartao border border-dashed border-linha p-4">
                  <p className="text-[13px] leading-snug text-sutil">
                    Respostas do aluno para demonstrar. No produto estes botões não existem: a caixa do aluno não sugere texto.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {passos.map((p) => (
                      <Button key={p} variant="secundario" className="text-base" onClick={() => enviar(ROTEIRO[p].aluno, ROTEIRO[p].tutor, p)}>{ROTULO_PASSO[p]}</Button>
                    ))}
                  </div>
                </div>
              )}
              <Nota />
            </div>
          </div>

          <div className="shrink-0 bg-fundo px-4 pb-4 pt-2 md:px-6">
            <div className="mx-auto grid w-full max-w-[760px] gap-3">
              {/* Atalho só para o que o professor atribuiu. Não envia nada sozinho. */}
              {!acabou && (
                <div>
                  <Button variant="secundario" size="sm" className="h-11 text-base md:h-10" asChild>
                    <Link to="/aluno/atividades/estequiometria"><PenLine /> Continuar a atividade de estequiometria <ArrowRight /></Link>
                  </Button>
                </div>
              )}
              <BarraCalma rotulo={`Hoje: ${perguntas} de ${LIMITE} perguntas`} valor={perguntas} maximo={LIMITE}
                texto={acabou ? 'amanhã volta' : `faltam ${LIMITE - perguntas}`} />
              <InputBar disabled={acabou} placeholder={acabou ? 'O Tutor volta amanhã.' : 'Escreva sua dúvida sobre a matéria…'}
                status={pensando ? 'submitted' : 'ready'}
                onSend={(m) => enviar(m.content, (
                  <div className="grid gap-3">
                    <p>Boa pergunta. Antes de eu ajudar: o que você já tentou? Escreva a sua conta, mesmo que esteja errada.</p>
                    <p className="text-apoio">Eu só falo do conteúdo da sua turma, e sempre mostro a página do livro.</p>
                  </div>
                ))} />
              <p className="text-center text-base text-sutil">O Tutor é um programa de computador. Ele pode errar.</p>
            </div>
          </div>
        </>
      )}

      {(estado === 'avaliacao' || estado === 'fora') && (
        <div className="shrink-0 px-4 pb-4 md:px-8"><div className="mx-auto max-w-[760px]"><Nota /></div></div>
      )}
    </div>
  )
}

function Nota() {
  return (
    <NotaMockup>
      A4 (fatia do F9). Tutor socrático com página citada e identidade de agente (D58, D65), mensagem fixa para assunto delicado (D36),
      memória do trabalho e não da pessoa (D66), trava em avaliação e modo casa desligado como tela que explica (D19),
      pacote do dia como salvaguarda (D38, D59). Supervisão sempre visível (D8).
    </NotaMockup>
  )
}
