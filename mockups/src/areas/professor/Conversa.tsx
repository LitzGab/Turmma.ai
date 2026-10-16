import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { BookmarkPlus, BookmarkCheck } from 'lucide-react'
import { Acao, AvisoIA, BarraConversa, Botao, CartaoDocumento, ColunaConversa, EstadoVazio, PensandoIA, ProvedorGeracao, Selo, SeloEstadoDocumento, TituloComMenu, useGeracao } from '@/components/duo'
import { MensagemIA, MensagemPessoa } from '@/components/turmma/conversa'
import { estadoDoDocumento } from '@/components/turmma/documento'
import { PassosAdaptar, documentoDoPedido, useAdaptaveis, type ResultadoAdaptar } from '@/components/turmma/adaptar'
import { MotorFormulario, chaveDe, type Valores } from '@/components/turmma/ferramentas'
import { ChipPagina } from '@/components/turmma/ia'
import { IconeFerramenta } from '@/components/turmma/icones-ferramenta'
import { CaixaPedido, useTurmaDaSessao } from '@/components/turmma/pedido'
import { BIBLIOTECA, documentoDaConversa, documentoDe, documentos, metadadosDe, questoesDoDocumento, useDocumentoBiblioteca } from '@/dados/biblioteca'
import { acervo, useAcervo, type Conversa as TipoConversa } from '@/dados/conversas'
import { envios, lerEnvios, useEstadoDocumento, type TipoDoc } from '@/dados/envios'
import { lerEventos } from '@/dados/demo/nucleo'
import { lerPreferencias } from '@/dados/preferencias'
import { TIPOS_ADAPTACAO, TURMA_CARREGA, VAI_PARA_TURMA, destinoDa, ferramenta, ferramentaDoEndereco, tipoDeAgora, type Ferramenta } from '@/dados/ferramentas'
import { turmaDaProfessora } from '@/dados/turmas-professora'

/* A CONVERSA COM O ASSISTENTE (/professor/conversa/:id), 12ª rodada (04/10/2026; plano de polimento, 5.2).

   · No topo, o título e o selo com cadeado "Só você vê esta conversa". Saiu a trilha do projeto (Projetos saiu).
   · `nova?ferramenta&turma&pedido` cria a conversa (acervo.criarConversa) e troca o endereço.
   · O Assistente NÃO pergunta "ferramenta ou conversa": se a conversa veio de uma ferramenta (atalho, "Mais",
     "Gerar revisão" da fila) ou o pedido fala de prova, plano, atividade, lista, material, apresentação, adaptação
     ou simulado, ele responde com o CARTÃO já preenchido — turma, tema e quantidade ("Objetivas 10 · Discursivas 0"),
     "Mais opções" fechado e GERAR PROVA (o primário). Enquanto gera, a onça do Assistente pensa.
   · Gerado: o cartão vira UM item: a frase ("Pronto. Confira antes de aprovar."; depois do envio, "Enviado ao 2ºB.")
     e o CARTÃO DO DOCUMENTO (14ª rodada: PROVA · 2ºB · QUÍMICA, o título, "10 questões · 50 min · Química 2, cap. 7",
     o selo do estado e "Editar o pedido"), que leva à página do documento (/professor/criados/<id>?de=conversa&c=<id>).
     O documento NÃO abre mais ao lado: a conversa ocupa a coluna de 768, como uma IA (plano ux-composicao, 3.2 e 3.6).
     O documento nasce Para aprovar (envios.novoRascunho registra `documento-gerado`); quem aprova é a página dele.
   · Com o documento gerado, pergunta continua sendo pergunta (resposta em texto, com o ⋯); o resto é ajuste, e o
     Assistente diz que anotou para a próxima versão (não finge que mudou a que está em Criados).
   · A conversa aberta por um clique, sem nada escrito, só fica na lateral depois do primeiro GERAR ou mensagem.
   · Endereço antigo de ferramenta que juntou vai para a de agora (mapa mental → Material, tipo Mapa mental); a que
     saiu vai para a aba Ferramentas.
   · O título do documento nasce do pedido quando ele traz tema ("Revisão: converter massa em mol" vira "Revisão de
     massa em mol"). O pedido de prova do 2ºB abre a "Prova de estequiometria" da demonstração.
   · A pergunta comum é respondida em texto; no ⋯, Copiar · Salvar em Criados.
   · A caixa "Peça um ajuste…" fica sem a pílula de turma; embaixo, a linha da D58.
   13ª RODADA (plano de painéis e introdução, seções 3 e 4):
   · a Prova abre com os padrões do professor (preferencias.prova: objetivas e gabarito comentado) quando o pedido não
     diz o número; o Plano de aula e o Material geram o modelo que o "O que você quer" / "Tipo de material" pediu (a
     sequência sai sequência, o texto de apoio sai texto de apoio), com o título certo;
   · a Adaptação: o cartão é a peça Adaptar em linha (o quê · como · para quem), já com o documento de Criados que o
     pedido cita; quem chega do atalho ADAPTAR (state.gerando) vê a onça preparando a versão por 1,2 s e, depois, a
     o cartão da versão adaptada, para aprovar na página do documento. */

/** O pedido escrito que casa com uma ferramenta. A ordem importa: "adapta a lista" é adaptação, não lista. */
const CASA: [RegExp, string][] = [
  [/adapt/i, 'adaptacao'], [/simulado/i, 'simulado'], [/diagn[oó]stic|prova/i, 'prova'], [/plano|planejamento|sequ[eê]ncia/i, 'plano'],
  [/revis[aã]o\s*:|atividade|lista|exerc[ií]cio|recupera/i, 'atividade'], [/mapa mental|resumo|material|texto de apoio/i, 'material'],
  [/apresenta|slides?/i, 'apresentacao'],
]

function ferramentaDa(c: TipoConversa): Ferramenta | undefined {
  const direta = c.ferramenta !== 'conversa' ? ferramenta(tipoDeAgora(c.ferramenta)) : undefined
  if (direta) return direta
  const achou = CASA.find(([re]) => re.test(c.pedido))
  return achou ? ferramenta(achou[1]) : undefined
}

const NUMEROS: Record<string, number> = { cinco: 5, seis: 6, oito: 8, dez: 10, doze: 12, quinze: 15, vinte: 20 }

const EH_REVISAO = /^\s*revis[aã]o\s*:\s*/i

/** O que a conversa entendeu do pedido: o tema e quantas questões. "Revisão: …" é o tema inteiro (vem da fila). */
function entender(pedido: string, f?: Ferramenta): { quantas?: number; tema: string } {
  const n = pedido.match(/(\d+|cinco|seis|oito|dez|doze|quinze|vinte)\s+(quest|exerc)/i)
  const quantas = n ? Number(n[1]) || NUMEROS[n[1].toLowerCase()] : undefined
  /* "Revisão: converter massa em mol (p. 145)" (vem da fila): o campo Tema fica com "Converter massa em mol (p. 145)" */
  if (EH_REVISAO.test(pedido)) {
    const t = pedido.replace(EH_REVISAO, '').trim()
    return { quantas, tema: t.charAt(0).toUpperCase() + t.slice(1) }
  }
  const t = pedido.match(/\b(?:de|sobre)\s+([a-zà-ú ]+?)(?:\s+(?:pro|pra|para|no|na|com)\b|[,.]|$)/i)
  const achado = t ? t[1].trim() : ''
  const ehNome = !!f && !!achado && (f.nome.toLowerCase().split(/\s+/).includes(achado.toLowerCase()) || f.nome.toLowerCase() === achado.toLowerCase())
  const tema = ehNome ? '' : achado
  return { quantas, tema: tema ? tema.charAt(0).toUpperCase() + tema.slice(1) : '' }
}

/** O modelo e o nome de cada "O que você quer" do Plano de aula e de cada "Tipo de material". */
/* `tema`: o modelo só existe para um assunto (o mapa mental é o de estequiometria). O título segue o corpo, e não o tema
   que veio no cartão, para os dois não se contradizerem. */
const MODELO_PLANO: Record<string, { base: string; nome: string; tema?: string }> = {
  aula: { base: 'plano-reagente-limitante', nome: 'Plano de aula' },
  sequencia: { base: 'modelo-sequencia', nome: 'Sequência didática' },
  bimestre: { base: 'planejamento-do-bimestre', nome: 'Bimestre' },
}
const MODELO_MATERIAL: Record<string, { base: string; nome: string; tema?: string }> = {
  resumo: { base: 'resumo-balanceamento', nome: 'Resumo' },
  mapa: { base: 'mapa-estequiometria', nome: 'Mapa mental', tema: 'estequiometria' },
  apoio: { base: 'modelo-texto-apoio', nome: 'Texto de apoio' },
  revisao: { base: 'modelo-folha-revisao', nome: 'Folha de revisão' },
}
/** O modelo que o cartão pediu (Plano de aula e Material didático), pelo valor escolhido. */
const modeloDe = (f: Ferramenta, v?: Valores) =>
  f.id === 'plano' ? MODELO_PLANO[String(v?.modo ?? 'aula')] ?? MODELO_PLANO.aula
    : f.id === 'material' ? MODELO_MATERIAL[String(v?.tipo ?? 'resumo')] ?? MODELO_MATERIAL.resumo : undefined

/** O título do documento, do pedido: "Revisão: converter massa em mol (p. 145)" vira "Revisão de massa em mol". */
function tituloDoDocumento(f: Ferramenta, tema: string, v?: Valores): string {
  const limpo = tema.replace(/\s*\(p\.\s*\d+\)\s*$/i, '').trim()
  const revisao = limpo.match(/^revis[aã]o\s*:\s*(?:converter|calcular|entender|achar|resolver)?\s*(.+)$/i)
  if (revisao) return `Revisão de ${revisao[1].trim().toLowerCase()}`
  const t = limpo.toLowerCase()
  const modelo = modeloDe(f, v)
  if (!t) return f.id === 'prova' ? 'Prova' : modelo?.nome ?? f.nome
  switch (f.id) {
    case 'prova': return `Prova de ${t}`
    case 'atividade': return `Lista de ${t}`
    case 'plano': case 'material': return `${modelo!.nome} · ${modelo!.tema ?? t}`
    case 'simulado': return `Simulado ENEM · ${t}`
    default: return limpo.charAt(0).toUpperCase() + limpo.slice(1)
  }
}

const tipoDoEnvio = (fid: string, titulo: string): TipoDoc =>
  fid === 'prova' || fid === 'simulado' ? 'prova' : fid === 'atividade' ? (/^lista/i.test(titulo) ? 'lista' : 'atividade')
    : fid === 'apresentacao' ? 'apresentacao' : fid === 'plano' ? 'plano' : 'material'

/** O documento que a ferramenta abre: a prova de estequiometria do 2ºB (a da demonstração), ou um documento novo em
    Criados, para a turma e o tema do pedido, feito a partir do último daquele tipo. */
function documentoDaFerramenta(f: Ferramenta, turmaId: string, tema: string, questoes?: number, v?: Valores): { id: string; titulo: string } {
  const titulo = tituloDoDocumento(f, tema, v)
  if (f.id === 'prova' && turmaId === '2b' && (!tema || /estequiometria/i.test(tema))) return { id: 'prova-estequiometria', titulo: 'Prova de estequiometria' }
  /* Plano de aula e Material: o modelo segue o que o cartão pediu; os outros, o último documento daquele tipo */
  const modelo = modeloDe(f, v)
  const doTipo = BIBLIOTECA.filter((b) => !b.versaoDe && b.professorId !== 'modelo' && tipoDeAgora(b.de) === f.id)
  const base = (modelo && BIBLIOTECA.find((b) => b.id === modelo.base)) || doTipo.find((b) => b.turmaId === turmaId) || doTipo[0] || BIBLIOTECA[0]
  const id = documentos.criar(base.id, { turmaId, de: f.id, titulo, questoes })
  return { id, titulo }
}

export function Conversa() {
  const { id } = useParams()
  const { conversas } = useAcervo()
  const navegar = useNavigate()
  if (!id) return <Navigate to="/professor" replace />
  if (id === 'nova') return <NovaConversa />
  const c = conversas.find((x) => x.id === id)
  /* link antigo, conversa apagada ou de outro professor: diz que não achou, e não abre outra no lugar */
  if (!c) return (
    <div className="altura-tela grid place-items-center px-4">
      <EstadoVazio titulo="Esta conversa não existe mais" acao={<Botao variante="secundario" tamanho="m" onClick={() => navegar('/professor')}>Voltar ao Início</Botao>} />
    </div>
  )
  return <Corpo key={c.id} c={c} />
}

/** As conversas abertas por um clique, sem nada escrito: se a professora sair sem gerar nem escrever, elas saem da
    lateral (não fica "Apresentação para o 2ºB" vazia). A saída espera um instante, porque o React de
    desenvolvimento desmonta e monta de novo na hora. */
const RASCUNHOS = new Set<string>()
const SAINDO = new Map<string, number>()
function useRascunho(id: string) {
  useEffect(() => {
    const t = SAINDO.get(id)
    if (t !== undefined) { window.clearTimeout(t); SAINDO.delete(id) }
    return () => {
      if (!RASCUNHOS.has(id)) return
      SAINDO.set(id, window.setTimeout(() => { SAINDO.delete(id); RASCUNHOS.delete(id); acervo.apagarConversa(id) }, 50))
    }
  }, [id])
}

/** /professor/conversa/nova?ferramenta=&turma=&pedido=: cria a conversa e troca o endereço. */
function NovaConversa() {
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const daSessao = useTurmaDaSessao()
  const feito = useRef(false)
  useEffect(() => {
    /* o link do Mapa traz `?como=`: a Raiz troca a pessoa e tira o `como` do endereço com replace. Esperar ele sair,
       senão os dois replaces disputam e a tela fica em branco em /conversa/nova. O mesmo com o `?tema=`. */
    if (feito.current || params.has('como') || params.has('tema')) return
    feito.current = true
    const pedida = params.get('ferramenta') ?? undefined
    const turmaId = params.get('turma') || daSessao
    const escrito = (params.get('pedido') ?? '').trim()
    /* endereço antigo: a ferramenta que juntou vira a de agora; a que saiu vai para a aba Ferramentas */
    const achou = ferramentaDoEndereco(pedida)
    if (pedida && !achou) { navegar('/professor/ferramentas', { replace: true }); return }
    if (!pedida && !escrito) { navegar('/professor', { replace: true }); return }
    /* quem tem tela própria vai para ela (a Redação; a Correção, para as notas) */
    if (achou && (achou.id === 'redacao' || achou.id === 'correcao' || (achou.id === 'adaptacao' && !escrito))) { navegar(destinoDa(achou.id, turmaId), { replace: true }); return }
    const f = achou ? ferramenta(achou.id) : undefined
    const turma = turmaDaProfessora(turmaId)?.nome ?? ''
    /* "Estequiometria" sozinho (vindo da Semana) vira uma frase; um pedido escrito fica como foi escrito */
    const curto = escrito && escrito.split(/\s+/).length <= 3
    const nome = achou?.mapa ? 'Mapa mental' : f?.nome
    const pedido = f
      ? (escrito && !curto ? escrito : `${nome}${escrito ? ` de ${escrito.toLowerCase()}` : ''}${turma ? ` para o ${turma}` : ''}`)
      : escrito
    const c = acervo.criarConversa({ pedido, ferramenta: f?.id ?? 'conversa', turmaId })
    /* aberta por um clique (atalho, Mais, Semana), sem nada escrito: só fica na lateral depois do primeiro GERAR */
    if (f && (!escrito || curto)) RASCUNHOS.add(c.id)
    /* o pedido que vem da fila ("Revisão: converter massa em mol (p. 145)") dá nome à conversa sem a página */
    if (f && /^\s*revis[aã]o\s*:/i.test(pedido)) acervo.renomearConversa(c.id, tituloDoDocumento(f, pedido))
    navegar(`/professor/conversa/${c.id}`, { replace: true })
  }, [params, navegar, daSessao])
  return <div className="altura-tela" />
}

/** A pergunta comum: uma resposta que reconhece o tema perguntado (respostas prontas por palavra-chave, com a
    página do material). O que não casa recebe uma resposta que repete o tema e oferece o próximo passo. */
const RESPOSTAS: { re: RegExp; r: (turma: string) => ReactNode }[] = [
  { re: /massa molar|massa molecular/i, r: () => <>
    <p>As duas somam as massas atômicas, mas medem coisas diferentes. A <b>massa molecular</b> é a massa de uma molécula, em u. A <b>massa molar</b> é a massa de 1 mol dessas moléculas, em g/mol <ChipPagina pagina={145} />.</p>
    <p>O número é o mesmo: a água tem 18 u e 18 g/mol. Só a unidade muda.</p>
  </> },
  { re: /reagente limitante|excesso/i, r: () => <>
    <p>O <b>reagente limitante</b> é o que acaba primeiro e define quanto produto se forma; o outro sobra, em excesso <ChipPagina pagina={151} />.</p>
    <p>Um jeito de mostrar: comparar quanto cada reagente renderia de produto. O que rende menos é o limitante.</p>
  </> },
  { re: /\bmol\b|estequiometria|propor[cç][aã]o/i, r: (turma) => <>
    <p>Para {turma ? `o ${turma}` : 'a turma'}, eu seguiria a ordem do capítulo 7: proporção em mol <ChipPagina pagina={142} />, depois massa molar <ChipPagina pagina={145} /> e, por fim, reagente limitante <ChipPagina pagina={151} />.</p>
    <p>Nesta semana, oito alunos travaram em converter massa em mol. Vale abrir com um exemplo resolvido no quadro.</p>
  </> },
  { re: /balancea/i, r: () => <>
    <p>Balancear é igualar a quantidade de cada átomo dos dois lados da equação, mexendo só nos coeficientes <ChipPagina pagina={138} />.</p>
    <p>Comece pelo elemento que aparece em menos substâncias e deixe hidrogênio e oxigênio para o fim.</p>
  </> },
]

function RespostaTexto({ pedido, turma }: { pedido: string; turma: string }) {
  const achou = RESPOSTAS.find((x) => x.re.test(pedido))
  if (achou) return <div className="grid gap-3">{achou.r(turma)}</div>
  const tema = pedido.replace(/[?.!]+\s*$/, '').trim()
  return (
    <div className="grid gap-3">
      <p>Sobre “{tema.length > 80 ? `${tema.slice(0, 80)}…` : tema}”: eu busco no material da turma e trago com a página de onde tirei.</p>
      <p>Se quiser isso como documento para {turma ? `o ${turma}` : 'a turma'}, é só dizer “faz uma atividade” ou usar um atalho do Início.</p>
    </div>
  )
}

/** É pergunta (e não ajuste)? O ponto de interrogação, uma palavra de pergunta no começo, ou um tema conhecido. */
const ehPergunta = (t: string) =>
  /\?\s*$/.test(t) || /^\s*(o que|qual|quais|quanto|quantos|como|por ?que|porque|quando|onde|quem|explica|me explica|me diz)\b/i.test(t)
  || (RESPOSTAS.some((x) => x.re.test(t)) && !/\b(mais|menos|troca|tira|p[oõ]e|coloca|muda|deixa|aumenta|diminui)\b/i.test(t))

type Etapa = 'pensando' | 'cartao' | 'gerando' | 'pronto' | 'texto'
type Troca = { pedido: string; resposta: ReactNode; texto?: boolean; nova?: boolean }

/** A onça do Assistente pensando, com o que ela está fazendo. */
function Pensando({ texto }: { texto?: string }) {
  return <PensandoIA agente="assistente" texto={texto} />
}

/** O cartão do documento na conversa (plano ux-composicao, 3.6): o tipo, a turma e a matéria; o título; a linha de
    dados; o selo do estado; o cartão inteiro leva à página do documento; "Editar o pedido" volta ao cartão da
    ferramenta. A versão adaptada aparece como "VERSÃO ADAPTADA · 2ºB · QUÍMICA" e abre a aba Adaptada. */
function CartaoDoDocumento({ docId, conversaId, adaptacao, aoEditar }: { docId: string; conversaId: string; adaptacao?: boolean; aoEditar?: () => void }) {
  const doc = useDocumentoBiblioteca(docId)
  const vivo = useEstadoDocumento(docId)
  if (!doc) return null
  const meta = metadadosDe(doc)
  const turma = turmaDaProfessora(doc.turmaId)?.nome ?? doc.turma
  const materia = meta.materia ?? turmaDaProfessora(doc.turmaId)?.disciplina
  const v = adaptacao ? vivo?.adaptada : undefined
  const nPara = v?.para?.length
  const tipos = (v?.tipos ?? []).map((x) => TIPOS_ADAPTACAO.find((o) => o.id === x)?.nome.toLowerCase() ?? x)
  const estado = adaptacao ? (v?.estado === 'aprovado' ? 'aprovado' : v?.estado === 'recusado' ? 'recusado' : 'espera') : estadoDoDocumento(doc, vivo)
  const linha = adaptacao
    ? [nPara ? `para ${nPara} ${nPara === 1 ? 'aluno' : 'alunos'}` : '', tipos.join(', ')].filter(Boolean).join(' · ')
    : [meta.quantidade, meta.duracao, meta.capitulo].filter(Boolean).join(' · ')
  return (
    <div className="mt-1">
      <CartaoDocumento icone={<IconeFerramenta id={adaptacao ? 'adaptacao' : tipoDeAgora(doc.de)} className="size-10" />}
        tipo={[adaptacao ? 'Versão adaptada' : meta.tipo, turma, materia].filter(Boolean).join(' · ')} titulo={doc.titulo} linha={linha}
        selo={<SeloEstadoDocumento estado={estado} />}
        para={`/professor/criados/${doc.id}?de=conversa&c=${conversaId}${adaptacao ? '&aba=adaptada' : ''}`} aoEditar={aoEditar} />
    </div>
  )
}

function Corpo({ c }: { c: TipoConversa }) {
  const { conversas } = useAcervo()
  const antiga = !!c.resposta
  const f = antiga ? undefined : ferramentaDa(c)
  const turma = turmaDaProfessora(c.turmaId)?.nome ?? ''

  /* a conversa que já gerou abre PRONTA, com o cartão do documento */
  const ligado = documentoDaConversa(c.id)
  const jaFeito = f ? (ligado?.docId ?? (c.id === 'prova-estequiometria' ? 'prova-estequiometria' : undefined)) : undefined
  /* quem chega do atalho ADAPTAR vê a onça preparando a versão antes de o cartão aparecer */
  const local = useLocation()
  const navegar = useNavigate()
  const chegouGerando = !!jaFeito && !!(local.state as { gerando?: boolean } | null)?.gerando
  /* "Pedir ajuste ao Assistente", na página do documento, volta para cá com a caixa em foco */
  const pediuAjuste = !!(local.state as { ajuste?: boolean } | null)?.ajuste
  const [etapa, setEtapa] = useState<Etapa>(jaFeito ? (chegouGerando ? 'gerando' : 'pronto') : 'pensando')
  const [valores, setValores] = useState<Valores>()
  const [docGerado, setDocGerado] = useState<string | undefined>(jaFeito)
  const [salvo, setSalvo] = useState(false)
  const [recado, setRecado] = useState<string | null>(null)
  /* chegou aqui porque pediu de novo a mesma prova em outra conversa: o pedido entra no fim, com a explicação */
  const reaberta = (local.state as { reaberta?: string } | null)?.reaberta
  const [trocas, setTrocas] = useState<Troca[]>(() => reaberta ? [{
    pedido: reaberta,
    resposta: <p>Esta prova já existia, nesta conversa, e está em Criados. Abri a mesma em vez de fazer outra igual: ela continua como estava. Se quiser mudar algo, é só pedir aqui.</p>,
  }] : [])
  useEffect(() => {
    if (reaberta) navegar(local.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [texto, setTexto] = useState('')
  useRascunho(c.id)
  // o texto chegando (o enviar vira PARAR) e a geração do documento, que PARAR cancela
  const { escrevendo, parar, valor: geracao } = useGeracao()
  const timerGerar = useRef<number | undefined>(undefined)

  /* o documento de uma conversa antiga é o que ela salvou */
  const docAntigo = c.artefato ? BIBLIOTECA.find((b) => b.titulo === c.artefato?.titulo) : undefined
  const docId = f ? docGerado : docAntigo?.id
  const doc = useDocumentoBiblioteca(docId)

  useEffect(() => {
    if (!chegouGerando) return
    const t = window.setTimeout(() => {
      setEtapa('pronto')
      navegar(local.pathname, { replace: true, state: null })
    }, 1200)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chegouGerando])
  useEffect(() => {
    if (antiga || jaFeito) return
    const t = window.setTimeout(() => setEtapa(f ? 'cartao' : 'texto'), 900)
    return () => window.clearTimeout(t)
  }, [antiga, jaFeito, f])
  useEffect(() => {
    if (!recado) return
    const t = window.setTimeout(() => setRecado(null), 2400)
    return () => window.clearTimeout(t)
  }, [recado])

  /* o que já vem preenchido no cartão: a turma, o tema e a quantidade que o pedido disse */
  const iniciais: Valores = (() => {
    if (!f) return {}
    const { quantas, tema } = entender(c.pedido, f)
    const v: Valores = c.turmaId ? { turma: c.turmaId } : {}
    const i = f.campos.findIndex((x) => (x.tipo === 'texto' || x.tipo === 'longo') && !x.avancado)
    /* sem tema no pedido, vale o do capítulo em curso (Estequiometria, no 2ºB) */
    const campo = i >= 0 ? f.campos[i] : undefined
    const doCapitulo = campo && 'valor' in campo && TURMA_CARREGA[c.turmaId]?.material === 'q2' ? campo.valor : undefined
    if (campo && (tema || doCapitulo)) v[chaveDe(campo, i)] = tema || doCapitulo || ''
    if (f.id === 'prova') {
      /* sem número no pedido, valem os padrões do professor (a introdução e Configurações › Assistente) */
      const prefs = lerPreferencias().prova
      v.questoes = [quantas ?? prefs.questoes, 0, 0, 0, 0, 0]
      const ig = f.campos.findIndex((x) => x.tipo === 'chave' && x.rotulo === 'Com gabarito comentado')
      if (ig >= 0) v[chaveDe(f.campos[ig], ig)] = prefs.gabarito
    }
    /* "Mapa mental" é um tipo do Material didático (a ferramenta Mapa mental juntou com ele) */
    if (f.id === 'material' && /mapa mental/i.test(c.pedido)) {
      const it = f.campos.findIndex((x) => x.tipo === 'cartoes' && x.id === 'tipo')
      if (it >= 0) v[chaveDe(f.campos[it], it)] = 'mapa'
    }
    return v
  })()

  const temaDe = (v: Valores) => {
    if (!f) return ''
    const i = f.campos.findIndex((x) => (x.tipo === 'texto' || x.tipo === 'longo') && !x.avancado)
    return i >= 0 ? String(v[chaveDe(f.campos[i], i)] ?? '') : ''
  }
  /* o total dos contadores É o número de questões (na prova, o campo `questoes`; na atividade, o contador sem id) */
  const somaQuestoes = (v?: Valores) => {
    if (!f || !v) return undefined
    const i = f.campos.findIndex((x) => x.tipo === 'contadores')
    const lista = i >= 0 ? v[chaveDe(f.campos[i], i)] : undefined
    return Array.isArray(lista) ? (lista as number[]).reduce((a, b) => a + b, 0) : undefined
  }

  const gerar = (pedidos: Valores) => {
    RASCUNHOS.delete(c.id)
    /* o modelo de um assunto só (o mapa mental é o de estequiometria): o tema passa a ser o dele, e o resumo do
       pedido, o título e o corpo dizem a mesma coisa */
    let v = pedidos
    const modelo = f ? modeloDe(f, pedidos) : undefined
    const iTema = f ? f.campos.findIndex((x) => (x.tipo === 'texto' || x.tipo === 'longo') && !x.avancado) : -1
    if (f && modelo?.tema && iTema >= 0) v = { ...pedidos, [chaveDe(f.campos[iTema], iTema)]: modelo.tema.charAt(0).toUpperCase() + modelo.tema.slice(1) }
    setValores(v)
    setEtapa('gerando')
    timerGerar.current = window.setTimeout(() => {
      if (!f) return
      const turmaId = String(v.turma ?? c.turmaId)
      /* o simulado conta pelo chip "Questões" (5, 10 ou 15); a prova e a atividade, pelos contadores */
      const n = f.id === 'simulado' ? Number(v.questoes) || 15 : somaQuestoes(v)
      /* o pedido de revisão dá o título ("Revisão de massa em mol"), mesmo com o tema curto no campo */
      const tema = temaDe(v)
      const { id, titulo } = documentoDaFerramenta(f, turmaId, EH_REVISAO.test(c.pedido) && tema && !EH_REVISAO.test(tema) ? `Revisão: ${tema}` : tema, n, v)
      /* o número que fica registrado é o da FOLHA (o que o documento tem de fato), nunca o do pedido */
      const gerado = documentoDe(id)
      const naFolha = gerado ? questoesDoDocumento(gerado).length : 0
      /* a prova já foi feita por quem pede: gerada nesta sessão (evento documento-gerado) ou aprovada. A semeada que
         nunca foi pedida não conta: o primeiro pedido dela é a geração, nesta conversa. */
      const jaFeita = lerEnvios().docs[id]?.original?.estado === 'aprovado'
        || lerEventos().some((e) => e.tipo === 'documento-gerado' && e.dados.docId === id)
      if (lerEnvios().docs[id]?.original?.estado !== 'aprovado') {
        envios.novoRascunho(id, { titulo, tipo: tipoDoEnvio(f.id, titulo), turmaId, questoes: naFolha || n, materia: turmaDaProfessora(turmaId)?.disciplina })
      }
      /* a prova da demonstração foi pedida de novo DEPOIS de feita: o pedido igual REABRE a mesma prova, na conversa onde
         ela nasceu (que continua na lateral, com o histórico). Esta conversa nova, que só tinha o pedido, sai. */
      const daSemente = id === 'prova-estequiometria' && c.id !== 'prova-estequiometria' && conversas.some((x) => x.id === 'prova-estequiometria')
      if (daSemente && jaFeita) {
        documentos.ligarConversa('prova-estequiometria', id, v)
        acervo.apagarConversa(c.id)
        navegar('/professor/conversa/prova-estequiometria', { replace: true, state: { reaberta: c.pedido } })
        return
      }
      /* o primeiro pedido da prova semeada: esta conversa passa a ser a dela, e a semeada sai da lateral (senão ficariam
         duas "Prova de estequiometria · 2ºB") */
      if (daSemente) acervo.apagarConversa('prova-estequiometria')
      /* pronto o documento, a conversa ganha o nome dele ("Prova de estequiometria · 2ºB"), na barra e na lateral */
      const nomeTurma = turmaDaProfessora(turmaId)?.nome
      acervo.renomearConversa(c.id, nomeTurma && !titulo.includes(nomeTurma) ? `${titulo} · ${nomeTurma}` : titulo)
      setDocGerado(id)
      documentos.ligarConversa(c.id, id, v)
      setEtapa('pronto')
    }, 1700)
  }

  /* a Adaptação em linha: o documento de Criados que o pedido cita já vem escolhido */
  const adaptaveis = useAdaptaveis(c.turmaId)
  const docDoPedido = f?.id === 'adaptacao' ? documentoDoPedido(c.pedido, adaptaveis) : undefined
  const gerarAdaptada = (r: ResultadoAdaptar) => {
    RASCUNHOS.delete(c.id)
    setValores({ tipos: r.tipos, para: r.para, turma: r.turmaId })
    setEtapa('gerando')
    timerGerar.current = window.setTimeout(() => {
      envios.gerarAdaptada(r.docId, r.tipos, r.para)
      documentos.ligarConversa(c.id, r.docId, { tipos: r.tipos, para: r.para, turma: r.turmaId })
      setDocGerado(r.docId)
      setEtapa('pronto')
    }, 1200)
  }

  const nomeCurto = f ? f.nome.split(' e ')[0] : ''
  /* a frase do resultado muda com o estado: depois de enviado, ela não pede mais para conferir */
  const estadoVivo = useEstadoDocumento(docId ?? '')
  const daVez = f?.id === 'adaptacao' ? estadoVivo?.adaptada : estadoVivo?.original
  const turmaDoDoc = doc ? turmaDaProfessora(doc.turmaId)?.nome ?? doc.turma : turma
  const pronto = daVez?.estado === 'aprovado'
    ? (f?.id === 'adaptacao' ? 'Enviada aos alunos com adaptação.' : `Enviado ao ${turmaDoDoc}.`)
    : daVez?.estado === 'recusado' ? 'Recusado. Nada chegou à turma.'
      : f?.id === 'adaptacao' ? 'Pronto: a versão adaptada, para você aprovar.'
        /* plano de aula é do professor: não vai à turma, então não há o que aprovar */
        : f && !VAI_PARA_TURMA.includes(f.id) ? 'Pronto. Ficou em Criados; confira e imprima quando quiser.' : 'Pronto. Confira antes de aprovar.'

  const enviar = (t: string) => {
    if (!t.trim()) return
    setTexto('')
    RASCUNHOS.delete(c.id)
    /* com o documento gerado, só é ajuste o que não é pergunta: "O que é reagente limitante?" é respondida em texto */
    const ajuste = !!doc && (etapa === 'pronto' || antiga) && !ehPergunta(t)
    setTrocas((l) => [...l, {
      pedido: t,
      nova: true,
      texto: !ajuste,
      resposta: ajuste
        ? <p>Anotei para a próxima versão: “{t.trim().replace(/[.!]+$/, '')}”. A que está em Criados continua como estava.</p>
        : RespostaTexto({ pedido: t, turma }),
    }])
  }

  const salvarEmCriados = () => {
    documentos.criar('resumo-balanceamento', { turmaId: c.turmaId || '2b', de: 'material', titulo: c.titulo })
    setSalvo(true)
    setRecado('Salvo em Criados.')
  }
  const copiar = () => {
    try { void navigator.clipboard?.writeText('Para o 2ºB: proporção em mol (p. 142), massa molar (p. 145) e reagente limitante (p. 151).') } catch { /* sem área de transferência */ }
    setRecado('Copiado.')
  }
  /* pronta a resposta em texto: Copiar · Refazer · 👍 · 👎 e SALVAR EM CRIADOS */
  const acoesTexto = { extra: (
    <Acao rotulo={salvo ? 'Salvo em Criados' : 'Salvar em Criados'} pressionado={salvo} onClick={() => { if (!salvo) salvarEmCriados() }}>
      {salvo ? <BookmarkCheck strokeWidth={2.25} /> : <BookmarkPlus strokeWidth={2.25} />}
    </Acao>
  ) }
  void copiar
  /* PARAR: na geração do documento, volta ao cartão; no texto, congela onde está */
  const pararTudo = () => {
    if (etapa === 'gerando') { window.clearTimeout(timerGerar.current); setEtapa(f && !docGerado ? 'cartao' : 'pronto'); return }
    parar()
  }
  /* EDITAR um pedido depois do primeiro: a conversa volta até ali e o pedido corrigido entra no lugar */
  const editar = (i: number, novo: string) => { setTrocas((l) => l.slice(0, i)); enviar(novo) }


  const caixa = (
    <div>
      <CaixaPedido valor={texto} aoMudar={setTexto} aoEnviar={(t) => enviar(t)} turmaInicial={c.turmaId} semTurma autoFocus={pediuAjuste}
        lado="top" status={etapa === 'gerando' || escrevendo ? 'streaming' : 'ready'} aoParar={pararTudo} placeholder={doc ? 'Peça um ajuste… (ex.: mais difícil)' : 'Pergunte ou peça mais…'} />
      <AvisoIA className="mt-2">O Assistente é uma IA e pode errar · Nada chega à turma sem você aprovar</AvisoIA>
    </div>
  )

  return (
    <ProvedorGeracao valor={geracao}>
    <div className="relative flex min-h-0 w-full flex-col">
      <ColunaConversa fim={trocas.length} caixa={caixa}
        barra={<BarraConversa titulo={(
          <TituloComMenu titulo={c.titulo} aoRenomear={(n) => acervo.renomearConversa(c.id, n)}
            aoApagar={() => { acervo.apagarConversa(c.id); navegar('/professor') }} />
        )} selo={(
          <Selo icone={<Lock strokeWidth={2.5} />} className="normal-case tracking-normal" title="Só você vê esta conversa">
            <span className="max-sm:sr-only">Só você vê esta conversa</span>
          </Selo>
        )} />}>
        <MensagemPessoa texto={c.pedido} anexos={c.anexos} />

        {/* Conversa antiga: abre como ficou. */}
        {antiga && (
          <MensagemIA agente="assistente" calmo acoes={!docAntigo ? acoesTexto : false} ultima={trocas.length === 0}>
            <p>{c.resposta}</p>
            {docAntigo && <CartaoDoDocumento docId={docAntigo.id} conversaId={c.id} />}
          </MensagemIA>
        )}

        {!antiga && etapa === 'pensando' && <Pensando />}

        {/* Pergunta comum: resposta em texto, com Copiar e Salvar em Criados no ⋯. */}
        {etapa === 'texto' && (
          <MensagemIA agente="assistente" fluxo acoes={acoesTexto} ultima={trocas.length === 0}>
            {RespostaTexto({ pedido: c.pedido, turma })}
          </MensagemIA>
        )}

        {/* O cartão da ferramenta, já preenchido. Depois de gerar, vira o cartão do documento. */}
        {f && (etapa === 'cartao' || etapa === 'pronto') && (
          <MensagemIA agente="assistente">
            {etapa === 'cartao' && f.id === 'adaptacao' ? (
              <PassosAdaptar emLinha turmaId={c.turmaId} docId={docDoPedido} aoGerar={gerarAdaptada} />
            ) : etapa === 'cartao' ? (
              <section className="animate-entra rounded-[16px] border-2 border-borda bg-white">
                <header className="flex items-center gap-3 border-b-2 border-borda px-4 py-3">
                  <IconeFerramenta id={f.id} className="size-8 shrink-0" />
                  <h2 className="t-cartao text-tinta">{f.nome}</h2>
                </header>
                <div className="px-4 py-4">
                  <MotorFormulario compacto campos={f.campos} extras={f.extras} verbo={f.verbo} iniciais={valores ?? iniciais}
                    aviso={f.fonte} aoGerar={gerar} />
                </div>
              </section>
            ) : docId ? (
              /* gerado: a frase e o cartão do documento, que leva à página dele */
              <>
                <p>{pronto}</p>
                <CartaoDoDocumento docId={docId} conversaId={c.id} adaptacao={f.id === 'adaptacao'}
                  aoEditar={daVez?.estado === 'aprovado' ? undefined : () => setEtapa('cartao')} />
              </>
            ) : null}
          </MensagemIA>
        )}

        {etapa === 'gerando' && f && <Pensando texto={f.id === 'adaptacao' ? 'Preparando a versão adaptada…' : `Gerando ${nomeCurto.toLowerCase()}…`} />}

        {trocas.map((t, i) => (
          <div key={i} className="grid gap-6">
            <MensagemPessoa texto={t.pedido} aoEditar={(novo) => editar(i, novo)} />
            <MensagemIA agente="assistente" fluxo={t.nova} acoes={t.texto ? acoesTexto : {}} ultima={i === trocas.length - 1}>{t.resposta}</MensagemIA>
          </div>
        ))}
      </ColunaConversa>
      {recado && <p role="status" className="pointer-events-none absolute bottom-32 left-1/2 z-10 -translate-x-1/2 animate-entra whitespace-nowrap rounded-[12px] bg-tinta px-4 py-2 text-[15px] font-bold text-white">{recado}</p>}
    </div>
    </ProvedorGeracao>
  )
}
