import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone } from 'lucide-react'
import { AvisoIA, Balao, BarraConversa, BotaoAnexar, Botao, ColunaConversa, ConversaVazia, ProvedorGeracao, Selo, SeloIA, Sugestoes, TituloComMenu, Toque, materiaDe, useAnexos, useGeracao, type Sugestao } from '@/components/duo'
import { Onca } from '@/components/duo/onca'
import { InputBar } from '@/components/ui/input-bar'
import { MensagemIA, MensagemPessoa, Pensando, useRolarAoFim } from '@/components/turmma/conversa'
import { ChipPagina } from '@/components/turmma/ia'
import { useTutorTravado, type TutorTravado } from '@/dados/avaliacoes'
import { avisos } from '@/dados/avisos'
import { CONVERSAS_ALUNO, conversaDoAluno, conversasAluno, useConversaDoAluno, type ConversaAluno, type TrocaAluno } from '@/dados/conversas-aluno'
import type { PoseOnca } from '@/components/duo/onca'
import { cn } from '@/lib/utils'

/* A CONVERSA COM O TUTOR (14ª rodada, 05/10/2026; plano ux-composicao, 1.2 e 5.1). Uma peça só para os lugares onde o
   aluno pergunta: o Início (/aluno, ConversaVazia: o grupo a 1/3, coluna de 768, nada ao lado), a conversa
   (/aluno/c/:id, ColunaConversa + BarraConversa com o título e a matéria) e o "Tirar dúvida" da tarefa (compacta).

   · A PRIMEIRA pergunta no Início cria a conversa (conversasAluno.criar) e leva a /aluno/c/:id; ela entra no histórico
     da lateral. Cada troca fica guardada (só texto, página e matéria) e a tela redesenha a partir do dado: a conversa
     sobrevive ao recarregar e anda junto em duas abas.
   · No topo da conversa, o título e a matéria (só leitura, na cor da matéria). O Tutor deduz a matéria; quando a
     pergunta serve a duas ("massa"), ele pergunta "É de Química ou de Física?" com 2 toques, e a escolha vai ao título.
   · Toda resposta tem até 3 frases, termina numa pergunta e cita a página.
   · Roteiro pela palavra: insistir na resposta pronta, mandar a conta, perguntar se é pessoa e o ASSUNTO DELICADO: a
     mensagem combinada com a escola, o 188 e AVISAR UM ADULTO. Aí a escola recebe o encaminhamento e o professor um
     sinal sem o texto (avisos.assuntoDelicado; Lei 13.819/2019 — lei). A conversa não segue no assunto.
     Depois dela a caixa sai (a onça acolhe: "Vamos falar disso com um adulto." e NOVA CONVERSA), há um só
     encaminhamento por conversa e o título fica neutro ("Conversa com o Tutor"), para não expor o assunto na lateral.
   · A LINHA FIXA sob a caixa não fecha (D8; Decreto 12.880, art. 11).
   · Com o Tutor travado (prova aberta, escola pausou, ninguém recebe risco à vida), a onça dorme no lugar da caixa,
     aqui e no Pedir ajuda da tarefa.
   · O limite do dia só aparece quando faltam 10 ou menos (D38, D59). Nada de barra de cota. */

export type Materia = 'Química' | 'Matemática' | 'História' | 'Física' | 'Biologia' | 'Português'

export type ContextoTutor = {
  /** o nome da tarefa */
  tarefa: string
  /** o número da questão (1 a 8); 0 numa leitura */
  questao: number
  /** o texto da alternativa marcada */
  resposta?: string
  pagina?: number
  /** o primeiro passo, quando a questão não é do banco de estequiometria */
  passo?: string
  materia?: Materia
}

/* ── o livro de cada matéria, para o chip de página ── */
const LIVRO: Record<Materia, { material: string; capitulo: string; pagina: number; trecho: string }> = {
  Química: { material: 'Química 2 — Material próprio do Colégio Aurora', capitulo: 'cap. 7 · Estequiometria', pagina: 145,
    trecho: '“Para passar de massa para quantidade de matéria, divida a massa pela massa molar da substância.”' },
  Matemática: { material: 'Matemática 7 — Material próprio do Colégio Aurora', capitulo: 'cap. 3 · Frações', pagina: 62,
    trecho: '“Frações equivalentes representam a mesma parte do inteiro.”' },
  História: { material: 'História 8 — Material próprio do Colégio Aurora', capitulo: 'cap. 4 · Revolução Francesa', pagina: 88,
    trecho: '“Em 1789, a crise financeira e a fome levaram o terceiro estado a se revoltar.”' },
  Física: { material: 'Física 1 — Material próprio do Colégio Aurora', capitulo: 'cap. 2 · Movimento', pagina: 34,
    trecho: '“Massa é a quantidade de matéria de um corpo; peso é a força com que a Terra o atrai.”' },
  Biologia: { material: 'Biologia 1 — Material próprio do Colégio Aurora', capitulo: 'cap. 5 · Células', pagina: 71,
    trecho: '“Toda célula tem membrana, citoplasma e material genético.”' },
  Português: { material: 'Português 2 — Material próprio do Colégio Aurora', capitulo: 'cap. 6 · Argumentação', pagina: 103,
    trecho: '“Um argumento sustenta uma tese com fatos, exemplos ou dados.”' },
}

function Pagina({ materia, pagina }: { materia: Materia; pagina?: number }) {
  const l = LIVRO[materia]
  return <ChipPagina pagina={pagina ?? l.pagina} material={l.material} capitulo={l.capitulo} trecho={l.trecho} />
}

/** O primeiro passo de cada questão da lista de estequiometria. Uma pergunta, nunca a resposta. */
const PASSOS: { passo: string; pagina: number }[] = [
  { passo: 'quantos gramas tem 1 mol de água?', pagina: 145 },
  { passo: 'quantos gramas tem 1 mol de CO₂?', pagina: 145 },
  { passo: 'quantos gramas tem 1 mol de H₂?', pagina: 145 },
  { passo: 'quantos mols de alumínio há em 54 g?', pagina: 151 },
  { passo: 'quantos mols de carbono há em 24 g?', pagina: 145 },
  { passo: 'que parte de 50 g são 40 g?', pagina: 153 },
  { passo: 'quantos mols de água há em 36 g?', pagina: 145 },
  { passo: 'num sistema fechado, alguma coisa entra ou sai?', pagina: 140 },
]

/** O assunto que chega de "Estudar isso com o Tutor" (?assunto=). */
const ASSUNTOS: Record<string, { nome: string; passo: string; pagina: number }> = {
  'massa-molar': { nome: 'massa molar', passo: 'Para começar: quantos gramas tem 1 mol de O₂?', pagina: 145 },
  'reagente-limitante': { nome: 'reagente limitante', passo: 'Para começar: o que quer dizer um reagente acabar primeiro?', pagina: 151 },
  'proporcao': { nome: 'proporção na equação', passo: 'Para começar: em 2 H₂ + O₂ → 2 H₂O, quantos mols de água saem de 2 mols de H₂?', pagina: 142 },
  'rendimento': { nome: 'rendimento', passo: 'Para começar: se a conta dava 50 g e saíram 40 g, que parte saiu?', pagina: 152 },
  'conservacao-da-massa': { nome: 'conservação da massa', passo: 'Para começar: num sistema fechado, alguma coisa entra ou sai?', pagina: 141 },
}

/* ── as falas guardadas (texto, página) e as frases fixas ── */

/** A mensagem combinada com a escola para assunto delicado (D36). Guardada assim; a tela desenha a peça fixa. */
const FALA_DELICADA = 'Obrigado por contar. Sou um programa e não posso ajudar nisso. Fale hoje com um professor ou com a orientação da escola.'
const ESCOLHA = /^É de (\S+) ou de (\S+)\?$/

/** A abertura de hoje (/aluno/c/mol): o aluno pede a resposta pronta e o Tutor dá o primeiro passo. */
const ABERTURA_MOL: TrocaAluno[] = [
  { de: 'aluno', texto: 'qual é a resposta da questão 4 da lista de estequiometria?' },
  { de: 'tutor', texto: 'Essa eu não respondo por você, mas a gente chega lá junto.\nPrimeiro passo: quantos mols de alumínio há em 54 g?', pagina: 145 },
]

function abertura({ contexto, assunto }: { contexto?: ContextoTutor; assunto?: string }): TrocaAluno[] {
  if (contexto) {
    const materia = contexto.materia ?? 'Química'
    const base = contexto.questao > 0 ? PASSOS[contexto.questao - 1] : undefined
    const passo = contexto.passo ?? base?.passo ?? 'o que você já sabe sobre isso?'
    const abre = contexto.resposta ? `Você marcou ${contexto.resposta}.` : contexto.questao > 0 ? `Vamos olhar a questão ${contexto.questao} juntos.` : 'Vamos ler juntos.'
    const pede = materia === 'Química' && contexto.questao > 0 ? `Antes da conta: ${passo}` : passo
    return [{ de: 'tutor', texto: `${abre} ${pede}`, pagina: contexto.pagina ?? base?.pagina ?? LIVRO[materia].pagina }]
  }
  if (assunto && ASSUNTOS[assunto]) {
    const a = ASSUNTOS[assunto]
    return [{ de: 'tutor', texto: `Vamos revisar ${a.nome}.\n${a.passo}`, pagina: a.pagina }]
  }
  return []
}

/* ── o roteiro, pela palavra ── */
const normal = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const tem = (t: string, termos: string[]) => termos.some((x) => t.includes(x))

const DELICADO = ['nao to bem', 'nao estou bem', 'briguei', 'triste', 'me machucar', 'sozinho', 'sozinha']
const IDENTIDADE = ['pessoa', 'robo', 'humano']
const CONTA = ['2 mol', 'deu 2', 'da 2']
const INSISTE = ['resposta', 'me da', 'me fala', 'qual e a', 'fala logo']

/** A matéria da pergunta; null quando serve a duas (o Tutor pergunta). */
function deduzMateria(texto: string): Materia | null {
  const t = normal(texto)
  if (tem(t, ['massa', 'energia']) && !tem(t, ['molar', ' mol', 'mols'])) return null
  if (tem(t, ['fracao', 'fracoes', 'equacao do', 'porcentagem'])) return 'Matemática'
  if (tem(t, ['revolucao', 'imperio', 'guerra'])) return 'História'
  if (tem(t, ['velocidade', 'forca', 'aceleracao'])) return 'Física'
  if (tem(t, ['celula', 'dna', 'mitocondria'])) return 'Biologia'
  if (tem(t, ['redacao', 'argumento', 'crase'])) return 'Português'
  return 'Química'
}

type Tipo = 'delicado' | 'identidade' | 'conta' | 'insiste' | 'outro'
function tipoDe(texto: string): Tipo {
  const t = normal(texto)
  if (tem(t, DELICADO)) return 'delicado'
  if (tem(t, IDENTIDADE)) return 'identidade'
  if (tem(t, CONTA)) return 'conta'
  if (tem(t, INSISTE)) return 'insiste'
  return 'outro'
}

const PERGUNTA: Record<Materia, string> = {
  Química: 'Me mostre a sua conta, mesmo errada. O que você já tentou?',
  Matemática: 'O livro tem um exemplo parecido. Qual parte você já entendeu?',
  História: 'O livro conta isso no capítulo 4. O que você já sabe?',
  Física: 'Comece pelo que o problema dá. Quais números você tem?',
  Biologia: 'O livro tem um desenho disso. O que aparece nele?',
  Português: 'Vamos pela ideia principal. O que o texto defende?',
}

/** As perguntas de conceito que servem a duas matérias: a resposta muda com a matéria escolhida. */
const CONCEITO: Record<'massa' | 'energia', Partial<Record<Materia, { texto: string; pagina: number }>>> = {
  massa: {
    Física: { texto: 'Massa é quanto de matéria o corpo tem. Peso é a força da Terra puxando esse corpo.\nNa Lua, qual dos dois muda?', pagina: 34 },
    Química: { texto: 'Massa é quanto de matéria a substância tem, em gramas.\nPara contar partículas, a gente passa a massa para mol. Quantos gramas tem 1 mol de água?', pagina: 145 },
  },
  energia: {
    Física: { texto: 'Energia é o que faz algo se mover ou mudar. A do movimento se chama cinética.\nQue exemplo de movimento você lembra?', pagina: 36 },
    Química: { texto: 'Numa reação, ligações se quebram e se formam, e isso troca calor.\nUma vela acesa libera ou absorve calor?', pagina: 158 },
  },
}

/** A resposta do Tutor, em texto (o que fica guardado). */
function responder(texto: string, materia: Materia, contexto?: ContextoTutor): TrocaAluno {
  const tipo = tipoDe(texto)
  if (tipo === 'delicado') return { de: 'tutor', texto: FALA_DELICADA }
  if (tipo === 'identidade') return { de: 'tutor', texto: 'Não. Sou o Tutor, um programa da escola.\nQual é a sua dúvida da matéria?' }
  if (tipo === 'conta') return { de: 'tutor', texto: 'Isso, 2 mol de alumínio. Agora faça o mesmo com 71 g de Cl₂.\nPela proporção 2 para 3, qual dos dois acaba primeiro?', pagina: 151 }
  if (tipo === 'insiste') {
    const base = contexto && contexto.questao > 0 ? PASSOS[contexto.questao - 1] : undefined
    return base
      ? { de: 'tutor', texto: `Ainda não vou dizer. Na prova eu não estou lá, e você consegue.\nUm passo pequeno: ${base.passo}`, pagina: base.pagina }
      : { de: 'tutor', texto: 'Ainda não vou dizer. Na prova eu não estou lá, e você consegue.\nDivida 54 g por 27 g/mol. Quanto dá?', pagina: 145 }
  }
  const t = normal(texto)
  const conceito = tem(t, ['energia']) ? CONCEITO.energia[materia] : tem(t, ['massa']) && !tem(t, ['molar', ' mol', 'mols']) ? CONCEITO.massa[materia] : undefined
  if (conceito) return { de: 'tutor', ...conceito }
  return { de: 'tutor', texto: PERGUNTA[materia], pagina: LIVRO[materia].pagina }
}

/** O que o Tutor responde à última fala do aluno (null se a última fala já é do Tutor). */
function proximaResposta(trocas: TrocaAluno[], materia: Materia, contexto?: ContextoTutor, perguntaMateria = false): TrocaAluno | null {
  const ultima = trocas[trocas.length - 1]
  if (!ultima || ultima.de !== 'aluno') return null
  // depois do assunto delicado, a conversa não segue (e não abre outro encaminhamento)
  if (trocas.some((t) => t.texto === FALA_DELICADA)) return null
  // respondeu à escolha da matéria: o Tutor volta à pergunta de antes, já na matéria escolhida
  const antes = trocas[trocas.length - 2]
  if (antes?.de === 'tutor' && ESCOLHA.test(antes.texto)) {
    const original = [...trocas.slice(0, -2)].reverse().find((t) => t.de === 'aluno')
    return responder(original?.texto ?? ultima.texto, materia, contexto)
  }
  if (perguntaMateria && trocas.filter((t) => t.de === 'aluno').length === 1 && tipoDe(ultima.texto) === 'outro' && deduzMateria(ultima.texto) === null) {
    return { de: 'tutor', texto: 'É de Química ou de Física?' }
  }
  return responder(ultima.texto, materia, contexto)
}

/* A mensagem FIXA de assunto delicado (D36): acolhe, não aconselha, aponta para um humano. Combinada com a escola;
   o Tutor não improvisa aqui. */
function MensagemFixa() {
  return (
    <div className="grid gap-2.5 rounded-[16px] border-2 border-roxo-borda bg-white p-4">
      <p>{FALA_DELICADA}</p>
      <p className="flex items-start gap-2 font-bold"><Phone aria-hidden className="mt-1 size-4 shrink-0" strokeWidth={2.5} /> Se for urgente, ligue 188 (CVV). É de graça, a qualquer hora.</p>
      <div className="pt-1"><Botao variante="secundario" tamanho="m" asChild><Link to="/aluno/avisar">Avisar um adulto</Link></Botao></div>
    </div>
  )
}

/** Uma fala do Tutor desenhada a partir do texto guardado. */
function FalaTutor({ troca, materia, nova, ultima, aoEscolher }: {
  troca: TrocaAluno; materia: Materia; nova: boolean; ultima: boolean
  aoEscolher?: (m: Materia) => void
}) {
  if (troca.texto === FALA_DELICADA) return <MensagemIA agente="tutor" calmo><MensagemFixa /></MensagemIA>
  const escolha = troca.texto.match(ESCOLHA)
  if (escolha) {
    const opcoes = [escolha[1], escolha[2]] as Materia[]
    return (
      <MensagemIA agente="tutor" calmo>
        <div className="grid gap-3">
          <p>{troca.texto}</p>
          {ultima && aoEscolher && (
            <div role="group" aria-label="A matéria" className="flex flex-wrap gap-2">
              {opcoes.map((m) => <Toque key={m} selecionado={false} aoMudar={() => aoEscolher(m)}>{m}</Toque>)}
            </div>
          )}
        </div>
      </MensagemIA>
    )
  }
  const linhas = troca.texto.split('\n')
  // a resposta chega palavra a palavra; pronta, Copiar · Refazer · 👍 · 👎 (a resposta retirada pela escola, não)
  return (
    <MensagemIA agente="tutor" calmo fluxo={nova} ultima={ultima} acoes={troca.retirada ? false : {}}>
      <div className="grid gap-2.5">
        {linhas.map((l, i) => (
          <p key={i}>{l}{i === linhas.length - 1 && troca.pagina ? <> <Pagina materia={materia} pagina={troca.pagina} /></> : null}</p>
        ))}
      </div>
    </MensagemIA>
  )
}

/** A linha fixa sob a caixa, pequena e cinza (como nas IAs). Não fecha (D8; Decreto 12.880, art. 11). A conversa
    inteira só abre para o professor com motivo registrado: por isso "acompanham", não "veem". */
export function LinhaFixa({ className }: { className?: string }) {
  return (
    <AvisoIA className={className}>
      O Tutor é uma IA e pode errar · seus professores acompanham · <Link to="/aluno/eu/privacidade#tutor">Como funciona</Link>
    </AvisoIA>
  )
}

/** As sugestões da conversa vazia: dúvidas de quem está no 2º ano (até 4). */
const SUGESTOES_ALUNO: Sugestao[] = [
  { rotulo: 'Massa molar', pergunta: 'o que é massa molar?' },
  { rotulo: 'Conferir a minha conta', pergunta: 'fiz a questão 4 e deu 2 mol de alumínio, está certo?' },
  { rotulo: 'Frações equivalentes', pergunta: 'como sei se duas frações são equivalentes?' },
  { rotulo: 'Revolução Francesa', pergunta: 'por que começou a revolução francesa?' },
]

/** A frase (na primeira pessoa) e o botão de quando o Tutor não atende. */
const TAREFAS_BOTAO = { rotulo: 'Ver minhas tarefas', para: '/aluno/tarefas' }

export function motivoDoTravado(t: NonNullable<TutorTravado>): { frase: string; botao?: { rotulo: string; para: string }; apoio?: string } {
  if (t.motivo === 'prova') return { frase: 'Na prova, eu descanso.', botao: { rotulo: 'Ir para a prova', para: `/aluno/prova/${t.tarefaId}` } }
  return { frase: 'A escola pausou o Tutor por enquanto.', apoio: 'Sua dúvida pode ir para o professor na próxima aula.' }
}

/** A onça no lugar da caixa (com TUTOR e IA embaixo), a frase no balão ao lado e o que vier abaixo dele. Onça e
    balão ficam lado a lado em qualquer largura: a 375 a onça encolhe e o texto do balão é que quebra. Com `titulo`, a
    frase é o h1 da tela (no Início). */
function OncaNoLugar({ pose, frase, tamanho, centro, titulo = false, children }: {
  pose: PoseOnca; frase: string; tamanho: number; centro: boolean; titulo?: boolean; children?: ReactNode
}) {
  return (
    <div className={cn('flex items-center gap-3 py-1 md:gap-4', centro && 'justify-center')}>
      <div className="grid shrink-0 justify-items-center gap-0.5">
        <Onca pose={pose} tamanho={tamanho} animada={false} className={tamanho > 80 ? 'max-md:size-20' : undefined} />
        <span className="flex items-center gap-1.5">
          <span className="t-rotulo text-tinta">Tutor</span>
          <SeloIA tamanho="p" />
        </span>
      </div>
      <div className="grid min-w-0 justify-items-start gap-2">
        <Balao lado="esquerda">{titulo
          ? <h1 role="status" className="lg:text-[24px] lg:leading-[30px]">{frase}</h1>
          : <span role="status">{frase}</span>}</Balao>
        {children}
      </div>
    </div>
  )
}

/** A onça dormindo no lugar da caixa, com a frase e no máximo um botão. */
export function TutorDescansando({ frase, botao, apoio, tamanho = 72, centro = true, titulo = false }: {
  frase: string; botao?: { rotulo: string; para: string }; apoio?: string; tamanho?: number; centro?: boolean; titulo?: boolean
}) {
  return (
    <OncaNoLugar pose="dormindo" frase={frase} tamanho={tamanho} centro={centro} titulo={titulo}>
      {apoio && <p className="t-apoio max-w-[36ch]">{apoio}</p>}
      {botao && <Botao tamanho="m" asChild><Link to={botao.para}>{botao.rotulo}</Link></Botao>}
    </OncaNoLugar>
  )
}

/** O Início com o Tutor sem atender: o MESMO arranjo do Início ativo (a onça e o balão no lugar da saudação; no lugar
    da caixa, um aviso do mesmo tamanho e da mesma largura, com o apoio e um botão). Nada flutua fora do eixo de 768. */
export function InicioDescansando({ frase, botao, apoio }: {
  frase: string; botao?: { rotulo: string; para: string }; apoio?: string
}) {
  return (
    <ConversaVazia
      topo={<OncaNoLugar pose="dormindo" frase={frase} tamanho={96} centro titulo />}
      caixa={
        <div className="flex min-h-[88px] flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-[16px] border-2 border-borda bg-campo px-4 py-3.5">
          <p className="t-corpo min-w-0 flex-1 basis-[240px] text-apoio">{apoio ?? 'Enquanto isso, suas tarefas continuam em Tarefas.'}</p>
          {botao && <Botao tamanho="m" asChild><Link to={botao.para}>{botao.rotulo}</Link></Botao>}
        </div>
      } />
  )
}

/** Depois do assunto delicado, a caixa sai: a onça acolhe e aponta um adulto. A mensagem combinada (logo acima) já
    traz o 188 e AVISAR UM ADULTO; aqui fica só a saída para outra conversa. */
function DepoisDoDelicado({ compacta }: { compacta: boolean }) {
  return (
    <OncaNoLugar pose="acolhendo" frase="Vamos falar disso com um adulto." tamanho={72} centro={!compacta}>
      {!compacta && <Botao variante="fantasma" tamanho="p" className="[&>.face]:px-2" asChild><Link to="/aluno">Nova conversa</Link></Botao>}
    </OncaNoLugar>
  )
}

/* Ponte até a base aceitar o título (e as trocas iniciais) ao criar a conversa: regrava a conversa recém-criada na
   fatia "conversas-aluno" e avisa a própria aba pelo evento `storage`, que é como o núcleo relê a fatia. Sem
   armazenamento (modo privado), não faz nada e a conversa fica com o título da pergunta. */
const CHAVE_CONVERSAS = 'turmma-demo-v2:conversas-aluno'
function reescreverConversa(id: string, mudar: (c: ConversaAluno) => ConversaAluno) {
  try {
    const bruto = window.localStorage.getItem(CHAVE_CONVERSAS)
    if (!bruto) return
    const todas = JSON.parse(bruto) as Record<string, ConversaAluno[]>
    const novo = JSON.stringify(Object.fromEntries(Object.entries(todas).map(([aluno, lista]) => [aluno, lista.map((c) => (c.id === id ? mudar(c) : c))])))
    window.localStorage.setItem(CHAVE_CONVERSAS, novo)
    window.dispatchEvent(new StorageEvent('storage', { key: CHAVE_CONVERSAS, newValue: novo }))
  } catch { /* fica com o título da pergunta */ }
}

/** O título que não expõe o assunto pessoal (na lateral, à vista de quem passa atrás da carteira). */
const TITULO_NEUTRO = 'Conversa com o Tutor'

/* ── o limite do dia: uma conta só para todas as caixas ── */
const LIMITE = 60
let usadasHoje = 45

export function ConversaTutor({ conversaId, contexto, compacta = false, assunto, vazio, className }: {
  conversaId?: string
  contexto?: ContextoTutor
  compacta?: boolean
  assunto?: string
  /** a tela sem conversa (o Início): a saudação acima da caixa; as sugestões e o aviso embaixo */
  vazio?: { topo: ReactNode; baixo?: ReactNode }
  className?: string
}) {
  const navegar = useNavigate()
  const travado = useTutorTravado()
  const guardada = useConversaDoAluno(conversaId)
  // guardada: a conversa é do aluno e fica salva; senão, ela vive só nesta tela (Pedir ajuda, revisar um assunto)
  const [locais, setLocais] = useState<TrocaAluno[]>(() => {
    const fixa = conversaId ? (conversaDoAluno(conversaId) ?? CONVERSAS_ALUNO.find((c) => c.id === conversaId)) : undefined
    if (fixa) return fixa.trocas.length ? fixa.trocas : conversaId === 'mol' ? ABERTURA_MOL : []
    return abertura({ contexto, assunto })
  })
  const salva = !!guardada
  const trocas: TrocaAluno[] = salva ? (guardada.trocas.length ? guardada.trocas : conversaId === 'mol' ? ABERTURA_MOL : []) : locais
  const materia: Materia = (guardada?.materia as Materia | undefined) ?? contexto?.materia ?? 'Química'
  const delicada = trocas.some((x) => x.texto === FALA_DELICADA)
  // com o Tutor travado, a conversa que vive só nesta tela (Pedir ajuda, revisar) não abre com dica (auditoria Q-3)
  const visiveis = travado && !salva ? [] : trocas

  const [novas, setNovas] = useState<number[]>([])
  const [pensando, setPensando] = useState(false)
  const [usadas, setUsadas] = useState(usadasHoje)
  const rolo = useRolarAoFim(`${trocas.length}-${pensando}`)
  const faltam = LIMITE - usadas
  // o texto chegando (o enviar vira PARAR) e o anexo da caixa
  const { escrevendo, parar, valor: geracao } = useGeracao()
  const { anexos, anexar, tirar, limpar } = useAnexos()
  const espera = useRef<number | undefined>(undefined)

  const acrescentar = useCallback((t: TrocaAluno) => {
    if (salva && conversaId) {
      // a conversa de hoje (mol) começa sem trocas guardadas: grava a abertura antes
      if (conversaId === 'mol' && (conversaDoAluno('mol')?.trocas.length ?? 0) === 0) ABERTURA_MOL.forEach((a) => conversasAluno.acrescentar('mol', a))
      conversasAluno.acrescentar(conversaId, t)
    } else setLocais((l) => [...l, t])
  }, [salva, conversaId])

  // a última fala é do aluno: o Tutor responde (também logo depois de a conversa nascer no Início)
  const esperaResposta = trocas[trocas.length - 1]?.de === 'aluno'
  useEffect(() => {
    if (!esperaResposta || travado) return
    setPensando(true)
    const t = espera.current = window.setTimeout(() => {
      const atuais = salva && conversaId ? (conversaDoAluno(conversaId)?.trocas ?? []) : null
      const lista = atuais ?? trocas
      const r = proximaResposta(lista, materia, contexto, salva)
      setPensando(false)
      if (!r) return
      if (r.texto === FALA_DELICADA && !lista.some((x) => x.texto === FALA_DELICADA)) {
        avisos.assuntoDelicado(lista[lista.length - 1]?.texto)
      }
      setNovas((n) => [...n, lista.length])
      acrescentar(r)
    }, 900)
    return () => { window.clearTimeout(t); setPensando(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- responde uma vez por fala nova do aluno
  }, [esperaResposta, trocas.length, travado])

  const enviar = (texto: string) => {
    const limpo = texto.trim()
    if (!limpo || pensando || escrevendo || faltam <= 0 || travado || delicada) return
    limpar()
    usadasHoje += 1
    setUsadas(usadasHoje)
    // o Início: a primeira pergunta cria a conversa e leva a ela; o assunto delicado leva um título neutro
    if (vazio && !conversaId && !assunto && !contexto && trocas.length === 0) {
      const id = conversasAluno.criar(limpo, deduzMateria(limpo) ?? undefined)
      if (tipoDe(limpo) === 'delicado') reescreverConversa(id, (c) => ({ ...c, titulo: TITULO_NEUTRO }))
      navegar(`/aluno/c/${id}`)
      return
    }
    // revisar um assunto (?assunto=, o ESTUDAR de Eu): a primeira fala guarda a conversa, com a abertura, no histórico
    if (assunto && ASSUNTOS[assunto] && !conversaId && !contexto && !salva) {
      const id = conversasAluno.criar(limpo, 'Química')
      const titulo = tipoDe(limpo) === 'delicado' ? TITULO_NEUTRO : `Revisar ${ASSUNTOS[assunto].nome}`
      reescreverConversa(id, (c) => ({ ...c, titulo, trocas: [...locais, { de: 'aluno', texto: limpo }] }))
      navegar(`/aluno/c/${id}`)
      return
    }
    acrescentar({ de: 'aluno', texto: limpo })
  }

  /* EDITAR uma pergunta: a conversa volta até ali, a pergunta corrigida entra no lugar e o Tutor responde de novo */
  const editar = (i: number, novo: string) => {
    if (pensando || escrevendo || travado || delicada) return
    const nova: TrocaAluno = { de: 'aluno', texto: novo }
    if (salva && conversaId) conversasAluno.cortar(conversaId, i, [nova])
    else setLocais((l) => [...l.slice(0, i), nova])
  }
  /* PARAR: enquanto pensa, desiste da resposta; enquanto escreve, congela o texto onde está */
  const pararTudo = () => {
    if (pensando) { window.clearTimeout(espera.current); setPensando(false) }
    parar()
  }

  const escolherMateria = (m: Materia) => {
    if (salva && conversaId) conversasAluno.definirMateria(conversaId, m)
    acrescentar({ de: 'aluno', texto: m })
  }

  const t = travado ? motivoDoTravado(travado) : null
  const linhaFixa = <LinhaFixa className={compacta ? 'px-0 text-left' : undefined} />
  const entrada = (
    <div className="grid gap-2.5">
      {faltam <= 10 && <p role="status" className={cn('flex', !compacta && 'justify-center')}><Selo>Hoje ainda dá para {faltam} {faltam === 1 ? 'pergunta' : 'perguntas'}</Selo></p>}
      <InputBar placeholder="Pergunte ao Tutor" status={pensando || escrevendo ? 'streaming' : 'ready'} onStop={pararTudo}
        autoFocus={!compacta && !!vazio} onSend={(m) => enviar(m.content)}
        attachedFiles={anexos.map((a) => ({ id: a.id, filename: a.nome, size: a.tamanho }))} onRemoveFile={tirar}
        leftActions={<BotaoAnexar rotulo="Anexar a foto da questão" aceita="image/*,.pdf" aoEscolher={anexar} />} />
      {!vazio || trocas.length > 0 ? linhaFixa : null}
    </div>
  )
  const caixa = delicada ? (
    <DepoisDoDelicado compacta={compacta} />
  ) : t ? (
    <TutorDescansando frase={t.frase} botao={t.botao} apoio={t.apoio} centro={!compacta} />
  ) : faltam <= 0 ? (
    <TutorDescansando frase="Por hoje é isso. Amanhã eu volto." centro={!compacta} />
  ) : entrada

  // O Início: a conversa vazia (o grupo a 1/3 da altura livre). Quando o Tutor não atende, a onça dormindo toma o
  // lugar do grupo inteiro (uma onça só na tela).
  if (vazio && trocas.length === 0) {
    const atende = !delicada && !t && faltam > 0
    return atende
      ? <ConversaVazia topo={vazio.topo} caixa={caixa} baixo={(
          <div className="grid gap-5">
            <Sugestoes itens={SUGESTOES_ALUNO} rotulo="Sugestões" aoEscolher={(x) => enviar(x.pergunta)} />
            {vazio.baixo}
            {linhaFixa}
          </div>
        )} />
      : t
        ? <InicioDescansando frase={t.frase} botao={t.botao ?? TAREFAS_BOTAO} apoio={t.apoio} />
        : <InicioDescansando frase="Por hoje é isso. Amanhã eu volto." botao={TAREFAS_BOTAO} apoio="Suas tarefas continuam em Tarefas." />
  }

  // travado e sem conversa guardada (o Tirar dúvida da tarefa): só a onça, no terço de cima do painel
  if (compacta && visiveis.length === 0 && (t || faltam <= 0)) {
    return <div className={cn('grid min-h-0 flex-1 grid-rows-[1fr_auto_2fr]', className)}><span aria-hidden />{caixa}<span aria-hidden /></div>
  }

  // a matéria ainda não foi escolhida enquanto a pergunta "É de … ou de …?" espera
  const ultima = trocas[trocas.length - 1]
  const escolhendo = ultima?.de === 'tutor' && ESCOLHA.test(ultima.texto)
  const titulo = guardada?.titulo ?? (assunto && ASSUNTOS[assunto] ? `Revisar ${ASSUNTOS[assunto].nome}` : undefined)

  const falas = (
    <>
      {visiveis.map((f, i) => f.de === 'aluno'
        ? <MensagemPessoa key={i} texto={f.texto} calmo aoEditar={travado || delicada || compacta ? undefined : (novo) => editar(i, novo)} />
        : <FalaTutor key={i} troca={f} materia={materia} nova={novas.includes(i)} ultima={i === visiveis.length - 1 && !pensando}
            aoEscolher={travado ? undefined : escolherMateria} />)}
      {pensando && <Pensando agente="tutor" calmo />}
    </>
  )

  // o painel do Tutor ao lado da tarefa: a conversa e a caixa, sem barra
  if (compacta) {
    return (
      <ProvedorGeracao valor={geracao}>
        <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
          <div ref={rolo} className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid w-full gap-6 py-1">{falas}</div>
          </div>
          <div className="shrink-0 pt-3">{caixa}</div>
        </div>
      </ProvedorGeracao>
    )
  }

  // a conversa aberta: a barra de 56 com o título e a matéria; as mensagens do topo; a caixa presa embaixo
  /* o título com o menu (Renomear · Apagar), só na conversa guardada; a do assunto delicado fica sem menu */
  const tituloEl = titulo && salva && conversaId && !delicada
    ? <TituloComMenu titulo={titulo} aoRenomear={(n) => conversasAluno.renomear(conversaId, n)}
        aoApagar={() => { conversasAluno.apagar(conversaId); navegar('/aluno') }} />
    : titulo ? <span title={titulo}>{titulo}</span> : undefined
  return (
    <ProvedorGeracao valor={geracao}>
      <ColunaConversa fim={trocas.filter((x) => x.de === 'aluno').length}
        barra={tituloEl ? <BarraConversa titulo={tituloEl} selo={!escolhendo && !delicada ? <MateriaSelo materia={materia} /> : undefined} /> : <h1 className="sr-only">Conversa com o Tutor</h1>}
        caixa={caixa}>
        {falas}
      </ColunaConversa>
    </ProvedorGeracao>
  )
}

/** A matéria da conversa, só de leitura, na cor da matéria. */
function MateriaSelo({ materia }: { materia: Materia }) {
  return <Selo familia={materiaDe(materia)?.familia ?? 'azul'}>{materia}</Selo>
}
