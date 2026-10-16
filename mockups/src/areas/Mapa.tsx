import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Copy, RotateCcw } from 'lucide-react'
import { Botao, Cartao, DialogoConfirmar, Interruptor, Recolhivel, Selo, type Familia } from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { Marca } from '@/components/marca/Pinta'
import { useAcesso } from '@/dados/acesso'
import { recomecarDemonstracao, useEventos, type Evento, type TipoEvento } from '@/dados/demo/nucleo'
import { useEnvios } from '@/dados/envios'
import { useProfessoresDaEscola } from '@/dados/escola-estado'
import { codigoEmDoisGrupos, COLAGEM_DE_EXEMPLO } from '@/dados/estrutura'
import '@/dados/sessao'
import { aparencia, useTema } from '@/dados/tema'
import { cn } from '@/lib/utils'

/* O MAPA (/), 12ª rodada (04/10/2026; plano de polimento, seção 5.8). Não é tela do produto: é o roteiro de quem
   apresenta. No alto, RECOMEÇAR A DEMONSTRAÇÃO (apaga o que foi feito, nas abas abertas também). Depois, os três
   roteiros, com os passos dos fluxos (seção 6): quem faz (o selo do papel), o que fazer, a dica e o link — com
   `?como=` quando a pessoa precisa ser outra. O ✓ aparece quando o passo já aconteceu (lido dos eventos), e os links
   que dependem do estado (o convite do Marcos, o código da 3ºA e do 2ºB) são lidos do estado.
   13ª rodada: a seção "Primeiro acesso, por papel" (as 5 introduções), o ADAPTAR no Roteiro 2 e a secretaria com o
   painel e o Analista no Roteiro 3.
   14ª rodada (05/10/2026; plano ux-composicao, 1.8 e 6): os caminhos novos (o sino, o cartão e a página do documento,
   a aba Ferramentas, Painel e Analista separados, Registros › IA, o botão DOSSIÊ, a secretaria com a lateral), os
   atalhos dos 9 tipos de documento, dos Painéis e dos Analistas (com ?pergunta=) e o interruptor "Ver no escuro".
   Embaixo: os atalhos, os estados para demonstrar, as frases para o Tutor e, recolhidos, todas as telas, o que fica
   para depois e o que está fora do caminho. A página pode rolar. */

type PapelMapa = 'Coordenação' | 'Professor' | 'Aluno' | 'Turmma' | 'Secretaria' | 'Público'
const COR_PAPEL: Record<PapelMapa, Familia> = {
  'Coordenação': 'anil', Professor: 'turquesa', Aluno: 'azul', Turmma: 'amarelo', Secretaria: 'rosa', 'Público': 'lima',
}

type Passo = {
  papel: PapelMapa
  oQue: string
  dica?: ReactNode
  /** sem link: o passo diz o que fazer antes */
  para?: string | null
  antes?: string
  feito?: boolean
}

function LinhaPasso({ n, p }: { n: number; p: Passo }) {
  const miolo = (
    <>
      <span aria-label={p.feito ? 'Feito' : `Passo ${n}`}
        className={cn('grid size-9 shrink-0 place-items-center rounded-full border-2 text-[15px] font-bold tabular-nums',
          p.feito ? 'border-verde-degrau bg-verde text-sobre-cor' : 'border-borda bg-white text-apoio')}>
        {p.feito ? <Check className="size-5" strokeWidth={3.5} /> : n}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <Selo familia={COR_PAPEL[p.papel]} tamanho="p">{p.papel}</Selo>
          <span className="t-cartao text-tinta">{p.oQue}</span>
        </span>
        {(p.dica || (!p.para && p.antes)) && (
          <span className="t-apoio mt-1 block">{p.para ? p.dica : p.antes}</span>
        )}
      </span>
      {p.para && <ArrowRight aria-hidden className="size-5 shrink-0 text-apagado transition-transform duration-150 group-hover:translate-x-0.5" strokeWidth={2.5} />}
    </>
  )
  const classe = 'group flex min-h-16 items-center gap-3 border-t-2 border-borda px-4 py-3 first:border-t-0'
  return (
    <li>
      {p.para
        ? <Link to={p.para} className={cn(classe, 'transition-colors duration-150 hover:bg-fundo-suave')}>{miolo}</Link>
        : <div className={cn(classe, 'opacity-70')}>{miolo}</div>}
    </li>
  )
}

function Roteiro({ titulo, apoio, passos }: { titulo: string; apoio: string; passos: Passo[] }) {
  const feitos = passos.filter((p) => p.feito).length
  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="t-secao text-tinta">{titulo}</h2>
        <span className="t-apoio">{feitos ? `${feitos} de ${passos.length} feitos` : apoio}</span>
      </div>
      <Cartao semRespiro>
        <ol>{passos.map((p, i) => <LinhaPasso key={i} n={i + 1} p={p} />)}</ol>
      </Cartao>
    </section>
  )
}

type Atalho = { para: string; nome: string; oque: string }

/** Os atalhos da prova só abrem depois que a Camila envia a prova ao 2ºB (Roteiro 2, passo 2). Antes disso, o atalho
    leva ao documento, para fazer o envio, e diz por quê: sem isso, cairia em "Esta prova ainda não chegou". */
function useAtalhoDaProva() {
  const enviada = useEnvios('2b').some((x) => x.docId === 'prova-estequiometria' && x.versao === 'original')
  return (a: Atalho): Atalho => (enviada || !(a.para.startsWith('/aluno/prova/prova-estequiometria') || a.para.startsWith('/aluno?estado=prova')) ? a
    : { para: '/professor/criados/prova-estequiometria?como=camila', nome: a.nome, oque: 'Envie a prova ao 2ºB antes (Roteiro 2, passo 2): o link abre o documento' })
}

function ListaLinks({ itens: brutos }: { itens: Atalho[] }) {
  const daProva = useAtalhoDaProva()
  const itens = brutos.map(daProva)
  return (
    <ul className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
      {itens.map((l) => (
        <li key={l.para + l.nome} className="border-t-2 border-borda first:border-t-0">
          <Link to={l.para} className="group flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-fundo-suave">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold leading-5 text-tinta">{l.nome}</span>
              <span className="t-apoio block">{l.oque}</span>
            </span>
            <ArrowRight aria-hidden className="size-5 shrink-0 text-apagado" strokeWidth={2.5} />
          </Link>
        </li>
      ))}
    </ul>
  )
}

const ESTADOS: Atalho[] = [
  { para: '/aluno?estado=prova&como=lucas', nome: 'Tutor em dia de prova', oque: '“Na prova, eu descanso.”' },
  { para: '/aluno?estado=fora&como=lucas', nome: 'Tutor fora da aula', oque: '“Volto na próxima aula.”' },
  { para: '/aluno?estado=limite&como=lucas', nome: 'Tutor no limite do dia', oque: '“Por hoje é isso. Amanhã eu volto.”' },
  { para: '/aluno/prova/prova-estequiometria?rede=caiu&como=lucas', nome: 'Prova sem internet', oque: '“Sem internet. O tempo parou.”' },
  { para: '/aluno/tarefas/balanceamento?como=lucas', nome: 'Tarefa corrigida', oque: '6 de 8, o recado e “Isso está errado?”' },
  { para: '/professor/turmas/9a?como=camila', nome: 'Turma da outra escola', oque: 'O 9ºA da E. M. Rio Cachoeira, à tarde' },
  { para: '/aluno/bem-vindo?como=lucas&rever=1', nome: 'Primeiro acesso com a onça', oque: '5 telas e COMEÇAR' },
]

const FRASES: Atalho[] = [
  { para: '/aluno?como=lucas', nome: '“me dá a resposta da questão 4”', oque: 'O Tutor dá o primeiro passo e a página' },
  { para: '/aluno?como=lucas', nome: '“deu 2 mol”', oque: 'Confere a conta e puxa o passo seguinte' },
  { para: '/aluno?como=lucas', nome: '“você é uma pessoa?”', oque: '“Não. Sou o Tutor, um programa da escola.”' },
  { para: '/aluno?como=lucas', nome: '“não tô bem, briguei em casa”', oque: 'A mensagem combinada, o 188 e Avisar um adulto' },
]

/** A introdução de cada papel (13ª rodada; plano de painéis e introdução, seção 2.8). */
const PRIMEIRO_ACESSO: { papel: PapelMapa; para: string; nome: string; telas: number }[] = [
  { papel: 'Aluno', para: '/aluno/bem-vindo?como=lucas&rever=1', nome: 'O Lucas conhece o Tutor', telas: 5 },
  { papel: 'Professor', para: '/professor/bem-vindo?como=camila&rever=1', nome: 'A Camila conhece o Assistente', telas: 6 },
  { papel: 'Coordenação', para: '/coordenacao/bem-vindo?rever=1', nome: 'A Helena conhece a coordenação e o Analista', telas: 5 },
  { papel: 'Secretaria', para: '/rede/bem-vindo?rever=1', nome: 'A secretaria conhece o painel da rede', telas: 5 },
  { papel: 'Turmma', para: '/operacao/bem-vindo?rever=1', nome: 'A equipe Turmma conhece a operação', telas: 3 },
]

function PrimeiroAcesso() {
  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="t-secao text-tinta">Primeiro acesso, por papel</h2>
        <span className="t-apoio">A introdução de cada um, com a onça</span>
      </div>
      <Cartao semRespiro>
        <ul>
          {PRIMEIRO_ACESSO.map((p) => (
            <li key={p.para} className="border-t-2 border-borda first:border-t-0">
              <Link to={p.para} className="group flex min-h-16 items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-fundo-suave">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Selo familia={COR_PAPEL[p.papel]} tamanho="p">{p.papel}</Selo>
                    <span className="t-cartao text-tinta">{p.nome}</span>
                  </span>
                  <span className="t-apoio mt-1 block">{p.telas} telas</span>
                </span>
                <ArrowRight aria-hidden className="size-5 shrink-0 text-apagado transition-transform duration-150 group-hover:translate-x-0.5" strokeWidth={2.5} />
              </Link>
            </li>
          ))}
        </ul>
      </Cartao>
    </section>
  )
}

/** Um documento de cada tipo (F34): a página própria, no modelo Geekie One e Plurall. */
const DOCUMENTOS: Atalho[] = [
  { para: '/professor/criados/prova-estequiometria?como=camila', nome: 'Prova', oque: 'Questões (10) · Adaptada (3), o gabarito e o sumário' },
  { para: '/professor/criados/lista-mol-massa-molar?aba=resultados&como=camila', nome: 'Atividade e lista, com resultados', oque: 'A faixa de 5 números, por questão e por aluno' },
  { para: '/professor/criados/simulado-enem-estequiometria?como=camila', nome: 'Simulado ENEM', oque: 'Ciências da Natureza, A a E' },
  { para: '/professor/criados/prova-estequiometria?versao=adaptada&como=camila', nome: 'Versão adaptada', oque: 'Lado a lado com a original, para 3 alunos' },
  { para: '/professor/criados/plano-reagente-limitante?como=camila', nome: 'Plano de aula', oque: 'Objetivos, a linha do tempo das aulas e o Pratique' },
  { para: '/professor/criados/planejamento-do-bimestre?como=camila', nome: 'Sequência e bimestre', oque: 'A tabela por semana' },
  { para: '/professor/criados/resumo-balanceamento?como=camila', nome: 'Material didático', oque: 'O resumo em coluna de leitura' },
  { para: '/professor/criados/mapa-estequiometria?como=camila', nome: 'Mapa mental', oque: 'O centro e 5 ramos ligados' },
  { para: '/professor/criados/rendimento-de-reacao?como=camila', nome: 'Apresentação', oque: 'Os slides 16:9 e as notas do professor' },
  { para: '/professor/criados/rubrica-lavoisier?como=camila', nome: 'Rubrica e redação', oque: 'O enunciado, a tabela e o total' },
]

/** Os Painéis e os Analistas da coordenação e da secretaria (F38 a F43). */
const PAINEIS: Atalho[] = [
  { para: '/coordenacao', nome: 'Painel da escola', oque: 'O que pede ação, frequência por faixa, notas abaixo de 6,0 e as turmas, sem média' },
  { para: '/coordenacao/analista', nome: 'Analista da escola', oque: 'Pergunte o que quiser sobre a escola' },
  { para: '/coordenacao/analista?pergunta=qual%20o%20acerto%20do%209%C2%BA%20ano%20por%20disciplina%3F', nome: '“qual o acerto do 9º ano por disciplina?”', oque: 'Não faz média: conta os alunos abaixo de 50%, por disciplina' },
  { para: '/coordenacao/analista?pergunta=quantos%20alunos%20do%201%C2%BAC%20est%C3%A3o%20com%20entregas%20atrasadas%3F%20quem%20s%C3%A3o%3F', nome: '“quem são os atrasados do 1ºC?”', oque: 'O motivo, os nomes e o registro na auditoria' },
  { para: '/rede?rede=prefeitura', nome: 'Painel da Prefeitura de Joinville', oque: 'Contagens por limiar, escolas de A a Z' },
  { para: '/rede?rede=estado', nome: 'Painel do Estado de SC · Regional Joinville', oque: 'Pé-de-Meia abaixo de 80%; inclui o Colégio Aurora' },
  { para: '/rede/analista', nome: 'Analista da rede', oque: 'Pergunte sobre as escolas e as séries' },
  { para: '/rede/analista?pergunta=quantos%20alunos%20do%208%C2%BA%20ano%20usaram%20em%20setembro%3F', nome: '“quantos alunos do 8º ano usaram em setembro?”', oque: 'O total e por escola, de A a Z' },
  { para: '/rede/analista?pergunta=qual%20a%20melhor%20escola%3F', nome: '“qual a melhor escola?”', oque: 'Não ordena: todas, de A a Z' },
  { para: '/rede/escolas', nome: 'Escolas da rede', oque: 'A tabela de A a Z e os números de cada uma' },
]

const TODAS: { titulo: string; linhas: Atalho[] }[] = [
  { titulo: 'Introduções e Adaptar', linhas: [
    ...PRIMEIRO_ACESSO.map((p) => ({ para: p.para, nome: `Introdução · ${p.papel}`, oque: `${p.telas} telas` })),
    { para: '/professor?adaptar=1&como=camila', nome: 'Adaptar', oque: 'O que adaptar, que adaptação e para quem' },
  ] },
  { titulo: 'Aluno · Início, Tarefas, Eu, Avisar um adulto', linhas: [
    { para: '/aluno?como=lucas', nome: 'Início', oque: 'Só a conversa com o Tutor' },
    { para: '/aluno/c/fracoes?como=lucas', nome: 'Uma conversa', oque: 'Frações equivalentes' },
    { para: '/aluno/tarefas?como=lucas', nome: 'Tarefas', oque: 'Para fazer · Entregues · Corrigidas, com o número na lateral' },
    { para: '/aluno/tarefas/estequiometria?como=lucas', nome: 'Uma tarefa', oque: 'As questões e Pedir ajuda' },
    { para: '/aluno/prova/prova-estequiometria?como=lucas', nome: 'Prova', oque: 'Tela de foco' },
    { para: '/aluno/eu?como=lucas', nome: 'Eu', oque: 'Como estou indo' },
    { para: '/aluno/eu/privacidade?como=lucas', nome: 'Privacidade', oque: 'O que o Tutor lembra, quem vê o quê, pedir meus dados' },
    { para: '/aluno/avisar?como=lucas', nome: 'Avisar um adulto', oque: 'O texto, os toques e quem lê' },
  ] },
  { titulo: 'Professor · Início, Turmas, Ferramentas, Criados', linhas: [
    { para: '/professor?como=camila', nome: 'Início', oque: 'Só a conversa com o Assistente, os atalhos e o sino' },
    { para: '/professor?sino=1&como=camila', nome: 'O sino aberto', oque: 'Esperando você, por turma' },
    { para: '/professor?item=sinal-2b&como=camila', nome: 'Um item do sino', oque: 'O sinal do Tutor no 2ºB' },
    { para: '/professor/ferramentas?como=camila', nome: 'Ferramentas', oque: 'As 9 ferramentas, em 4 grupos' },
    { para: '/professor/aprovar/prova-2b?como=camila', nome: 'Notas para aprovar', oque: '26 provas, 5 destaques' },
    { para: '/professor/conversa/prova-estequiometria?como=camila', nome: 'Conversa', oque: 'O cartão do documento, que abre a página' },
    { para: '/professor/turmas?como=camila', nome: 'Turmas', oque: 'Turmas · Semana' },
    { para: '/professor/turmas/2b?como=camila', nome: 'A turma', oque: 'Hoje · Atividades · Alunos' },
    { para: '/professor/turmas/2b/aula?como=camila', nome: 'Começar aula', oque: 'As carteiras, em tela de foco' },
    { para: '/professor/criados?como=camila', nome: 'Criados', oque: 'Tudo o que ela criou' },
    { para: '/professor/ferramentas/redacao?como=camila', nome: 'Redação e discursiva', oque: 'Rubrica, lote anônimo e correção' },
  ] },
  { titulo: 'Coordenação · Painel, Analista, Escola, Registros', linhas: [
    { para: '/coordenacao', nome: 'Painel', oque: 'O dashboard da escola em tela inteira' },
    { para: '/coordenacao/analista', nome: 'Analista', oque: 'A conversa em tela inteira' },
    { para: '/coordenacao?sino=1', nome: 'O sino aberto', oque: 'O que precisa da coordenação' },
    { para: '/coordenacao?item=alerta-a1', nome: 'Um item do sino', oque: 'Química do 2º ano: 19 alunos entraram abaixo de 6,0' },
    { para: '/coordenacao/escola', nome: 'Escola', oque: 'Turmas · Professores · Material' },
    { para: '/coordenacao/escola/turmas/2b', nome: 'Uma turma', oque: 'A lista, os pedidos e as adaptações' },
    { para: '/coordenacao/registros', nome: 'Registros', oque: 'IA · Avisos e pedidos · Auditoria, e o botão Dossiê' },
    { para: '/coordenacao/registros?aba=ia&ver=como', nome: 'Como cada IA trabalha', oque: 'Pausar e reativar uma IA' },
    { para: '/coordenacao/registros?dossie=1', nome: 'Dossiê', oque: 'O que falta e BAIXAR O DOSSIÊ' },
    { para: '/coordenacao/configuracoes', nome: 'Configurações da escola', oque: 'Equipe, encarregado, canal da escola' },
  ] },
  { titulo: 'Entrada, páginas públicas, operação e rede', linhas: [
    { para: '/entrar', nome: 'Entrar', oque: 'A escola, e o e-mail decide o papel' },
    { para: '/entrar/verificacao', nome: 'Segundo fator', oque: 'Obrigatório na coordenação' },
    { para: '/e/colegio-aurora', nome: 'Entrada da escola', oque: 'Matrícula e senha; o rodapé com o canal da escola' },
    { para: '/e/colegio-aurora/turma', nome: 'Página da turma', oque: 'O aluno pede o próprio nome' },
    { para: '/e/colegio-aurora/avisar', nome: 'Avisar a escola', oque: 'Sem conta' },
    { para: '/e/colegio-aurora/dados', nome: 'Pedido sobre dados', oque: 'Sem conta' },
    { para: '/convite#t9KQ2xLmP4aR', nome: 'Convite do professor', oque: 'A Camila, que já tem conta' },
    { para: '/operacao', nome: 'Operação Turmma', oque: 'Escolas e uso, sem dado de pessoa' },
    { para: '/rede', nome: 'Secretaria · Painel', oque: 'Só agregado, com a lateral' },
    { para: '/rede/analista', nome: 'Secretaria · Analista', oque: 'Grupos de 5 ou mais, nunca nome' },
    { para: '/rede/escolas', nome: 'Secretaria · Escolas', oque: 'De A a Z' },
  ] },
]

function Atalhos({ codigo3a, codigo2b }: { codigo3a: string | null; codigo2b: string | null }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try { await navigator.clipboard.writeText(COLAGEM_DE_EXEMPLO) } catch { /* sem permissão: segue */ }
    setCopiado(true)
    window.setTimeout(() => setCopiado(false), 1800)
  }
  const item = (rotulo: string, valor: ReactNode) => (
    <div className="flex min-h-14 items-center justify-between gap-3 border-t-2 border-borda px-4 py-2 first:border-t-0">
      <span className="t-apoio">{rotulo}</span>
      <span className="min-w-0 text-right text-[17px] font-bold tabular-nums text-tinta [overflow-wrap:anywhere]">{valor}</span>
    </div>
  )
  return (
    <section className="mt-10">
      <h2 className="t-secao mb-3 text-tinta">Atalhos de quem apresenta</h2>
      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
        <Cartao className="flex flex-col items-start gap-3">
          <span className="flex items-center gap-3">
            <Icone id="pedidos" tamanho={40} />
            <span className="t-cartao">A lista do 3ºA</span>
          </span>
          <span className="t-apoio">34 linhas, 2 com erro: corrija para 2026-0805 e 2026-0830.</span>
          <Botao variante="secundario" icone={copiado ? <Check strokeWidth={3} /> : <Copy strokeWidth={2.5} />} onClick={copiar}>
            {copiado ? 'Copiado' : 'Copiar a lista do 3ºA'}
          </Botao>
        </Cartao>
        <Cartao semRespiro>
          {item('Senha', 'qualquer uma com 8 letras ou números')}
          {item('Código do segundo fator', 'qualquer 6 dígitos')}
          {item('Matrícula da Alice', '2026-0801')}
          {item('E-mail da secretaria', 'secretaria@educacao.joinville.example')}
          {item('E-mail da equipe Turmma', 'equipe@turmma.example')}
          {item('Código da 3ºA', codigo3a ? codigoEmDoisGrupos(codigo3a) : 'ainda não gerado')}
          {item('Código do 2ºB', codigo2b ? codigoEmDoisGrupos(codigo2b) : 'revogado')}
        </Cartao>
      </div>
    </section>
  )
}

/** "Ver no escuro": muda a Aparência (a mesma escolha de Configurações). */
function VerNoEscuro() {
  const tema = useTema()
  return (
    <label className="flex h-11 items-center gap-3 rounded-[12px] border-2 border-borda px-3">
      <span className="t-rotulo text-[14px] text-apoio">Ver no escuro</span>
      <Interruptor rotulo="Ver no escuro" ligado={tema === 'escuro'} aoMudar={(v) => aparencia.mudar(v ? 'escuro' : 'claro')} />
    </label>
  )
}

export function Mapa() {
  const [recomecar, setRecomecar] = useState(false)
  const eventos = useEventos()
  const acesso3a = useAcesso('au-3a')
  const acesso2b = useAcesso('2b')
  const profs = useProfessoresDaEscola()
  const marcos = profs.find((p) => p.criado && p.disciplina === 'Física') ?? profs.find((p) => p.criado)
  const linkMarcos = marcos?.token && marcos.estado === 'pendente' ? `/convite#${marcos.token}` : null
  const sessaoMarcos = marcos?.sessaoId ?? 'marcos'
  // o ✓ de cada passo: o mesmo teste de `useAconteceu` (dados/demo/nucleo.ts), sobre a lista de eventos lida uma vez
  const e = (tipo: TipoEvento, f?: (x: Evento) => boolean) => eventos.some((x) => x.tipo === tipo && (!f || f(x)))
  const d = (x: Evento, k: string) => x.dados[k]
  const profAceitou = (x: Evento) => d(x, 'papel') !== 'coordenacao'

  const roteiro1: Passo[] = [
    { papel: 'Coordenação', oQue: 'A coordenação entra pela primeira vez', dica: 'Crie a senha, confirme com 6 dígitos e siga a introdução', para: '/convite?papel=coordenacao#hm-aurora', feito: e('introducao-vista', (x) => d(x, 'papel') === 'coordenacao') || e('convite-aceito', (x) => d(x, 'papel') === 'coordenacao') || e('lista-gravada') },
    { papel: 'Coordenação', oQue: 'Grava a lista do 3ºA', dica: 'Escola › Turmas › 3ºA › cole a lista (atalho abaixo) e corrija as 2 linhas', para: '/coordenacao/escola/turmas/au-3a', feito: e('lista-gravada', (x) => d(x, 'turmaId') === 'au-3a') },
    { papel: 'Coordenação', oQue: 'Convida o professor Marcos Vieira', dica: 'Professores › Convidar: marcos.vieira@colegioaurora.example, Física, 3ºA', para: '/coordenacao/escola?aba=professores', feito: e('professor-convidado') },
    { papel: 'Professor', oQue: 'Marcos aceita o convite e vê a introdução', dica: 'Crie a senha e entre; na introdução, confirme a 3ºA (passo 2)', para: linkMarcos ?? (e('convite-aceito', profAceitou) ? `/professor?como=${sessaoMarcos}` : null), antes: 'Faça o passo 3 antes: o link nasce do convite', feito: e('convite-aceito', profAceitou) },
    { papel: 'Professor', oQue: 'Gera o acesso da 3ºA', dica: 'Se a 3ºA ficou sem confirmar, confirme pelo cartão Confirme sua turma', para: e('convite-aceito', profAceitou) ? `/professor/turmas/au-3a?aba=alunos&convidar=1&como=${sessaoMarcos}` : null, antes: 'Faça o passo 4 antes', feito: e('acesso-gerado', (x) => d(x, 'turmaId') === 'au-3a') },
    { papel: 'Aluno', oQue: 'Alice pede o próprio nome', dica: <>Código {acesso3a ? <b className="font-bold text-tinta">{codigoEmDoisGrupos(acesso3a.codigo)}</b> : 'da 3ºA'} · Alice Monteiro · 2026-0801 · senha com 8 ou mais</>, para: acesso3a ? `/e/colegio-aurora/turma?codigo=${acesso3a.codigo}` : null, antes: 'Faça o passo 5 antes: o código nasce do acesso', feito: e('pedido-nome', (x) => d(x, 'turmaId') === 'au-3a') },
    { papel: 'Professor', oQue: 'Marcos aprova o pedido', dica: 'Cartão "Pedidos para entrar · 3ºA" › marque Alice › Aprovar marcados', para: e('convite-aceito', profAceitou) ? `/professor?como=${sessaoMarcos}` : null, antes: 'Faça o passo 6 antes', feito: e('pedidos-decididos', (x) => d(x, 'turmaId') === 'au-3a') },
    { papel: 'Aluno', oQue: 'Alice entra pela primeira vez', dica: '2026-0801 e a senha que ela criou › a introdução de 5 telas › Começar', para: '/e/colegio-aurora', feito: e('onboarding-visto', (x) => d(x, 'alunoId') !== 'lucas') },
  ]

  const roteiro2: Passo[] = [
    { papel: 'Professor', oQue: 'Camila pede a prova pelo atalho', dica: 'Gerar prova › o cartão do documento › Abrir: a página da prova, Para aprovar', para: '/professor/conversa/nova?ferramenta=prova&turma=2b&como=camila', feito: e('documento-gerado', (x) => d(x, 'docId') === 'prova-estequiometria') || e('documento-enviado', (x) => d(x, 'docId') === 'prova-estequiometria') },
    { papel: 'Professor', oQue: 'Aprova e envia ao 2ºB', dica: 'Aprovar e enviar ao 2ºB › Para quem: a turma toda › Quando: agora', para: '/professor/criados/prova-estequiometria?como=camila', feito: e('documento-enviado', (x) => d(x, 'docId') === 'prova-estequiometria' && d(x, 'versao') === 'original') },
    { papel: 'Professor', oQue: 'Camila adapta a prova pelo atalho ADAPTAR', dica: 'Adaptar › a prova do 2ºB › que adaptação › para quem › Gerar › Aprovar e enviar', para: '/professor?adaptar=1&como=camila', feito: e('documento-enviado', (x) => d(x, 'versao') === 'adaptada') },
    { papel: 'Aluno', oQue: 'Lucas faz a prova e entrega', dica: 'O Tutor dorme na prova; a onça comemora a entrega', para: '/aluno/tarefas?como=lucas', feito: e('tarefa-entregue') },
    { papel: 'Professor', oQue: 'Camila aprova a nota', dica: 'O sino › "Notas · estequiometria" › Aprovar a nota', para: '/professor?sino=1&como=camila', feito: e('notas-aprovadas') },
    { papel: 'Aluno', oQue: 'Lucas vê a nota e pede revisão', dica: 'Feitas › a prova › Isso está errado? (questão 3)', para: '/aluno/tarefas?como=lucas', feito: e('revisao-pedida') },
    { papel: 'Professor', oQue: 'Camila responde a revisão', dica: 'O sino › a revisão › Manter a nota, com o motivo que o Lucas vai ler', para: '/professor?sino=1&como=camila', feito: e('revisao-respondida') },
    { papel: 'Aluno', oQue: 'Lucas avisa um adulto', dica: '"um colega me xingou no intervalo" + Alguém me tratou mal', para: '/aluno/avisar?como=lucas', feito: e('aviso-enviado', (x) => d(x, 'origem') !== 'publico') },
    { papel: 'Coordenação', oQue: 'A coordenação responde e conclui', dica: 'Registros › Avisos e pedidos › Responder e concluir', para: '/coordenacao/registros?aba=avisos', feito: e('aviso-respondido') },
    { papel: 'Aluno', oQue: 'Assunto delicado no Tutor', dica: 'Digite "não tô bem, briguei em casa"', para: '/aluno?como=lucas', feito: e('assunto-delicado') },
    { papel: 'Professor', oQue: 'Camila vê o sinal, sem o texto', dica: 'O sino › "Lucas · atenção" › Marcar como visto', para: '/professor?sino=1&como=camila', feito: e('atencao-vista') },
    { papel: 'Coordenação', oQue: 'Encaminhamento e Conselho Tutelar', dica: 'O sino › Encaminhamento › Ver o trecho (com motivo) › Registrar notificação', para: '/coordenacao?sino=1', feito: e('conselho-tutelar') },
    { papel: 'Professor', oQue: 'O sinal do Tutor vira revisão', dica: 'Do sino: Gerar revisão › Gerar atividade › o cartão › Aprovar e enviar', para: '/professor?item=sinal-2b&como=camila', feito: e('documento-enviado', (x) => d(x, 'docId') !== 'prova-estequiometria') },
  ]

  const roteiro3: Passo[] = [
    { papel: 'Secretaria', oQue: 'A secretaria entra pela primeira vez', dica: 'secretaria@educacao.joinville.example, uma senha e 6 dígitos › a introdução', para: '/entrar?quem=equipe', feito: e('introducao-vista', (x) => d(x, 'papel') === 'rede') },
    { papel: 'Secretaria', oQue: 'O Painel da rede, em contagens de alunos', dica: 'O que pede ação, frequência por faixa e as escolas de A a Z; nenhuma média, nenhum nome', para: '/rede?rede=prefeitura' },
    { papel: 'Secretaria', oQue: 'O Analista calcula o que se perguntar', dica: 'Digite "quantos alunos do 8º ano usaram em setembro?" e depois "e em agosto?"', para: '/rede/analista' },
    { papel: 'Secretaria', oQue: 'Pede nome de aluno: o Analista recusa', dica: 'Digite "quais alunos da araucária foram mal em matemática?"', para: '/rede/analista' },
    { papel: 'Secretaria', oQue: 'Baixa o relatório do mês', dica: '"Gere o relatório do mês" › Baixar (PDF)', para: '/rede/analista', feito: e('exportacao', (x) => d(x, 'conjunto') === 'rede') },
    { papel: 'Coordenação', oQue: 'O painel da escola: os 5 do 1ºC, com motivo e auditoria', dica: 'Analista: "quantos alunos do 1ºC estão com entregas atrasadas? quem são?" › o motivo › Mostrar os nomes', para: '/coordenacao/analista', feito: e('dados-com-nome') },
    { papel: 'Turmma', oQue: 'A operação cria uma escola', dica: 'E. M. Pirabeiraba › rede de Joinville › convidar a coordenação', para: '/operacao', feito: e('escola-criada') },
    { papel: 'Coordenação', oQue: 'O que a IA gerou, e pausar o Tutor', dica: 'Registros › IA › Como cada IA trabalha › Tutor › Pausar (motivo)', para: '/coordenacao/registros?aba=ia&ver=como', feito: e('ia-pausada') },
    { papel: 'Aluno', oQue: 'O aluno vê o Tutor pausado', dica: 'Depois, de volta à coordenação: Reativar', para: '/aluno?como=lucas', feito: e('ia-reativada') },
    { papel: 'Coordenação', oQue: 'Indica o encarregado de dados', dica: 'Registros › Dossiê › O que falta › Indicar › Helena Martins · dados@colegioaurora.example', para: '/coordenacao/registros?dossie=1', feito: e('encarregado-indicado') },
    { papel: 'Aluno', oQue: 'Privacidade e o pedido de dados', dica: 'O que guardamos, quem vê o quê, Pedir meus dados › o número segue a ordem do que já foi feito', para: '/aluno/eu/privacidade?como=lucas', feito: e('titular-pedido', (x) => d(x, 'origem') === 'aluno') },
    { papel: 'Público', oQue: 'O canal da escola, sem conta', dica: 'O rodapé › Avisar a escola › guarde o número e o código e veja a resposta em Acompanhar', para: '/e/colegio-aurora', feito: e('aviso-enviado', (x) => d(x, 'origem') === 'publico') },
  ]

  const roteiro4: Passo[] = [
    { papel: 'Coordenação', oQue: 'O Painel da escola, sem média', dica: 'Cada número é quantos alunos passaram de um limiar, com a origem escrita', para: '/coordenacao' },
    { papel: 'Coordenação', oQue: 'Abre o cartão do APOIA, dá o motivo e vê os nomes', dica: 'Pede ação › "Ver os 4" › Para quê › Ver e registrar: os 4 alunos, cada um com o motivo', para: '/coordenacao', feito: e('dados-com-nome', (x) => String(d(x, 'alertaId') ?? '').includes('APOIA')) },
    { papel: 'Secretaria', oQue: 'Troca para a rede do Estado', dica: 'A pílula da rede no topo da lateral › Estado de SC · Regional Joinville', para: '/rede?rede=prefeitura' },
    { papel: 'Secretaria', oQue: 'Pé-de-Meia: as escolas com aluno abaixo de 80%', dica: 'Pede ação › Pé-de-Meia › Ver por escola: só as escolas com alguém na coluna', para: '/rede?rede=estado' },
  ]

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 pb-24 pt-8 md:px-8 md:pt-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Marca className="text-[24px]" />
          <h1 className="mt-6 text-[clamp(28px,3.8vw,40px)] font-bold leading-[1.1] tracking-[-0.02em] text-tinta">O Turmma, tela por tela.</h1>
          <p className="t-corpo mt-2 text-apoio">Dados de demonstração. Recarregar não apaga o que você fez.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <VerNoEscuro />
          <Botao variante="perigo" icone={<RotateCcw strokeWidth={2.5} />} onClick={() => setRecomecar(true)}>Recomeçar a demonstração</Botao>
        </div>
      </div>
      <DialogoConfirmar aberto={recomecar} aoMudar={setRecomecar} titulo="Recomeçar a demonstração?"
        frase="Tudo o que foi feito some, também nas outras abas abertas."
        confirmar={{ rotulo: 'Recomeçar', variante: 'perigoCheio', aoConfirmar: recomecarDemonstracao }} />

      <Roteiro titulo="Roteiro 1 · A escola do zero ao primeiro aluno" apoio="Coordenação, professor e aluno, em 8 passos" passos={roteiro1} />
      <Roteiro titulo="Roteiro 2 · A IA supervisionada em sala" apoio="Nada chega ao aluno sem um professor aprovar" passos={roteiro2} />
      <Roteiro titulo="Roteiro 3 · Para a prefeitura e o jurídico" apoio="Agregado, controlador, encarregado e o canal da lei" passos={roteiro3} />
      <Roteiro titulo="Roteiro 4 · Painéis sem média" apoio="Contagem de alunos por limiar, na escola e nas duas redes" passos={roteiro4} />

      <PrimeiroAcesso />

      <div className="mt-10 grid gap-x-8 gap-y-10 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4"><h2 className="t-secao text-tinta">Documentos, um de cada tipo</h2><span className="t-apoio">A página própria</span></div>
          <ListaLinks itens={DOCUMENTOS} />
        </section>
        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4"><h2 className="t-secao text-tinta">Painéis e Analistas</h2><span className="t-apoio">Escola e rede</span></div>
          <ListaLinks itens={PAINEIS} />
        </section>
      </div>

      <Atalhos codigo3a={acesso3a?.codigo ?? null} codigo2b={acesso2b?.codigo ?? null} />

      <div className="mt-10 grid gap-x-8 gap-y-10 lg:grid-cols-2">
        <section>
          <h2 className="t-secao mb-3 text-tinta">Estados para demonstrar</h2>
          <ListaLinks itens={ESTADOS} />
        </section>
        <section>
          <h2 className="t-secao mb-3 text-tinta">Frases para o Tutor</h2>
          <ListaLinks itens={FRASES} />
        </section>
      </div>

      <div className="mt-10 grid gap-3">
        <Recolhivel titulo="Todas as telas" apoio="Por papel">
          <div className="grid gap-6 py-2 lg:grid-cols-2">
            {TODAS.map((b) => (
              <div key={b.titulo}>
                <h3 className="t-selo mb-2 text-sutil">{b.titulo}</h3>
                <ListaLinks itens={b.linhas} />
              </div>
            ))}
          </div>
        </Recolhivel>
        <Recolhivel titulo="Depois" apoio="Fora desta demonstração">
          <ListaLinks itens={[{ para: '/familia', nome: 'Família', oque: 'Depende do parecer do art. 24 do ECA Digital' }]} />
        </Recolhivel>
        <Recolhivel titulo="Fora do caminho" apoio="Para quem constrói">
          <ListaLinks itens={[
            { para: '/fundamentos', nome: 'Fundamentos', oque: 'As cores, a letra e as peças do sistema' },
            { para: '/fundamentos/onca', nome: 'Bancada da onça', oque: 'As poses e a cabeça' },
          ]} />
        </Recolhivel>
      </div>
    </main>
  )
}
