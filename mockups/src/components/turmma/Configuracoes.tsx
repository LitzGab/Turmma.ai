import { useState, useSyncExternalStore, type ReactNode } from 'react'
import { Check, ChevronLeft, IdCard, KeyRound, Laptop, Lock, ScrollText, Settings, Smartphone, Sparkles, Bell, X, type LucideIcon } from 'lucide-react'
import { Botao, Carimbo, CampoSenha, CampoTexto, Dialogo, DialogoConfirmar, Interruptor, Linha, Segmentado, Selo } from '@/components/duo'
import { MeuUso } from '@/areas/professor/abas-turma/MeuUso'
import { ajustesTurma, useAjustesTurma } from '@/areas/professor/abas-turma/UsoTutor'
import { preferencias, usePreferencias, type PapelTexto, type Preferencias, type TamanhoTexto as Tamanho } from '@/dados/preferencias'
import { ESCOLAS } from '@/dados/escola'
import { useProfessoresDaEscola } from '@/dados/escola-estado'
import { useProfessorAtual } from '@/dados/sessao'
import { useTurmasDoProfessor } from '@/dados/turmas-professora'
import { aparencia, useAparencia, useTemaForcado, type Aparencia as TipoAparencia } from '@/dados/tema'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import type { Papel } from './Casca'

/* CONFIGURAÇÕES (12ª rodada, 04/10/2026; plano de polimento 5.2; auditoria do professor 2.16). Um `Dialogo` grande com o
   índice em `Linha` à esquerda; no celular, o índice primeiro e a seção depois, com ‹ para voltar. A casca abre com
   `?config=<seção>`; os ids não mudam (geral · notificacoes · assistente · tutor · perfil · privacidade · seguranca ·
   ia). Uma seção que o papel não tem cai na primeira.
   · PROFESSOR: Geral (tamanho do texto; escola ao abrir, só com 2 escolas) · Assistente (padrões e Preparar a semana) ·
     Perfil e vínculos · Privacidade e dados, com o MEU USO dentro (D45, D64) · Segurança (senha, duas etapas opcional,
     aparelhos) · Como a IA funciona. SAÍRAM Idioma, "Turma que já vem na caixa", Notificações (o silenciar mora na
     turma), Tutor nas turmas e a seção solta "Personalizar".
   · ALUNO (Ajustes): Aparência, Tamanho do texto e Trocar a senha (8 ou mais).
   · 14ª rodada: Aparência (Sistema · Claro · Escuro) no topo de Geral de todos; a SECRETARIA (rede) só com ela.
   · COORDENAÇÃO (Minha conta): Geral · Notificações · Perfil · Segurança (duas etapas obrigatórias, sem link para um
     interruptor travado). "Como a IA funciona" mora em IA › Como cada IA trabalha.
   Peças duo; nenhum título com descrição. 13ª rodada: o tamanho do texto (por papel), os padrões da prova, a escola ao
   abrir e os avisos da coordenação vêm de `dados/preferencias.ts` (os mesmos que a introdução configura; recarregar não
   apaga); "Preparar a semana" lê e grava `ajustesTurma`, o mesmo do ⋯ da turma. Só "Duas etapas" fica na memória da
   página. */

type SecaoId = 'geral' | 'notificacoes' | 'assistente' | 'tutor' | 'perfil' | 'privacidade' | 'seguranca' | 'ia'
type Secao = { id: SecaoId; nome: string; icone: LucideIcon }

const DO_PAPEL: Record<Papel, Secao[]> = {
  professor: [
    { id: 'geral', nome: 'Geral', icone: Settings },
    { id: 'assistente', nome: 'Assistente', icone: Sparkles },
    { id: 'perfil', nome: 'Perfil e vínculos', icone: IdCard },
    { id: 'privacidade', nome: 'Privacidade e dados', icone: Lock },
    { id: 'seguranca', nome: 'Segurança', icone: KeyRound },
    { id: 'ia', nome: 'Como a IA funciona', icone: ScrollText },
  ],
  coordenacao: [
    { id: 'geral', nome: 'Geral', icone: Settings },
    { id: 'notificacoes', nome: 'Notificações', icone: Bell },
    { id: 'perfil', nome: 'Perfil', icone: IdCard },
    { id: 'seguranca', nome: 'Segurança', icone: KeyRound },
  ],
  aluno: [{ id: 'geral', nome: 'Ajustes', icone: Settings }],
  rede: [{ id: 'geral', nome: 'Geral', icone: Settings }],
} as Record<Papel, Secao[]>

/* ── O que fica na memória da página: só "Duas etapas" (o resto mora em dados/preferencias.ts) ──────────── */

let duasEtapas = false
const ouvintes = new Set<() => void>()
const mudarDuasEtapas = (v: boolean) => { duasEtapas = v; ouvintes.forEach((f) => f()) }
const useDuasEtapas = () => useSyncExternalStore((f) => { ouvintes.add(f); return () => { ouvintes.delete(f) } }, () => duasEtapas)

/* ── Peças locais ────────────────────────────────────────────────────────────────────────────────────────── */

/** Uma linha de ajuste: o nome à esquerda, o controle à direita (empilha no celular). */
function Ajuste({ rotulo, children, empilha }: { rotulo: ReactNode; children?: ReactNode; empilha?: boolean }) {
  return (
    <div className={cn('flex min-h-16 gap-x-6 gap-y-2 border-t-2 border-borda py-3 first:border-t-0', empilha ? 'flex-col justify-center' : 'flex-wrap items-center justify-between')}>
      <span className="text-[17px] font-bold leading-[22px] text-tinta">{rotulo}</span>
      {children && <div className={cn('flex min-w-0 items-center gap-2', empilha && 'w-full')}>{children}</div>}
    </div>
  )
}

const Grupo = ({ children }: { children: ReactNode }) => <h3 className="t-selo pb-1 pt-6 text-sutil first:pt-0">{children}</h3>
const Valor = ({ children }: { children: ReactNode }) => <span className="text-[15px] font-medium text-apoio">{children}</span>

/** 14ª rodada: a Aparência (Sistema · Claro · Escuro), no topo de Geral, para todos os papéis. Guardada no navegador,
    fora da demonstração (dados/tema.ts): RECOMEÇAR não apaga. */
function Aparencia() {
  const a = useAparencia()
  const forcado = useTemaForcado()
  return (
    <Ajuste rotulo={forcado
      ? <span className="grid">Aparência<span className="text-[13px] font-medium leading-4 text-sutil">Nesta aba: {forcado === 'escuro' ? 'Escuro' : 'Claro'}</span></span>
      : 'Aparência'}>
      <Segmentado rotulo="Aparência" valor={forcado ?? a} aoMudar={(v) => aparencia.mudar(v as TipoAparencia)}
        opcoes={[{ id: 'sistema', rotulo: 'Sistema' }, { id: 'claro', rotulo: 'Claro' }, { id: 'escuro', rotulo: 'Escuro' }]} />
    </Ajuste>
  )
}

function TamanhoTexto({ papel }: { papel: PapelTexto }) {
  const p = usePreferencias()
  return (
    <Ajuste rotulo="Tamanho do texto">
      <Segmentado rotulo="Tamanho do texto" valor={p.texto[papel]} aoMudar={(v) => preferencias.mudar({ texto: { [papel]: v as Tamanho } })}
        opcoes={[{ id: 'padrao', rotulo: 'Padrão' }, { id: 'grande', rotulo: 'Grande' }, { id: 'maior', rotulo: 'Maior' }]} />
    </Ajuste>
  )
}

/** Trocar a senha ali mesmo: a de agora e a nova (8 ou mais). */
function TrocarSenha() {
  const [aberto, setAberto] = useState(false)
  const [feito, setFeito] = useState(false)
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  if (feito) return <Ajuste rotulo="Senha"><Carimbo verbo="Senha trocada" por="" /></Ajuste>
  if (!aberto) return <Ajuste rotulo="Senha"><Botao variante="secundario" tamanho="m" onClick={() => setAberto(true)}>Trocar a senha</Botao></Ajuste>
  const curta = nova.length > 0 && nova.length < 8
  return (
    <Ajuste rotulo="Trocar a senha" empilha>
      <form className="grid w-full max-w-sm gap-3" onSubmit={(e) => { e.preventDefault(); if (atual && nova.length >= 8) setFeito(true) }}>
        <CampoSenha rotulo="Senha de agora" valor={atual} aoMudar={setAtual} autoFocus />
        <CampoSenha rotulo="Senha nova" valor={nova} aoMudar={setNova} autoComplete="new-password" dica="8 ou mais letras ou números." erro={curta ? 'Faltam letras: 8 ou mais.' : undefined} />
        <div className="flex gap-2">
          <Botao type="submit" tamanho="m" disabled={!atual || nova.length < 8}>Trocar a senha</Botao>
          <Botao variante="fantasma" tamanho="m" onClick={() => setAberto(false)}>Cancelar</Botao>
        </div>
      </form>
    </Ajuste>
  )
}

function Aparelhos({ papel }: { papel: Papel }) {
  const [celular, setCelular] = useState(true)
  const [saindo, setSaindo] = useState(false)
  return (
    <>
      <Grupo>Aparelhos</Grupo>
      <div className="[&>*]:px-0">
        <Linha inicio={<Laptop aria-hidden className="size-6 text-sutil" strokeWidth={2.5} />} titulo={papel === 'professor' ? 'Computador da sala 12' : 'Computador da coordenação'}
          abaixo="Agora" fim={<Selo familia="verde" tamanho="p">Este aparelho</Selo>} />
        {celular && <Linha inicio={<Smartphone aria-hidden className="size-6 text-sutil" strokeWidth={2.5} />} titulo="Celular" abaixo="Ontem, 19h12"
          fim={<Botao variante="secundario" tamanho="p" onClick={() => setCelular(false)}>Sair</Botao>} />}
      </div>
      {celular
        ? <Botao variante="secundario" tamanho="m" className="mt-2" onClick={() => setSaindo(true)}>Sair de todos</Botao>
        : <Carimbo verbo="Só este aparelho continua conectado" por="" className="mt-2" />}
      <DialogoConfirmar aberto={saindo} aoMudar={setSaindo} titulo="Sair de todos os aparelhos?" frase="Este aparelho continua conectado."
        confirmar={{ rotulo: 'Sair de todos', aoConfirmar: () => setCelular(false) }} />
    </>
  )
}

/* ── As seções ───────────────────────────────────────────────────────────────────────────────────────────── */

function GeralProfessor() {
  const prof = useProfessorAtual()
  const p = usePreferencias()
  return (
    <>
      <Aparencia />
      <TamanhoTexto papel="professor" />
      {prof.escolas.length > 1 && (
        <Ajuste rotulo="Escola ao abrir">
          <Segmentado rotulo="Escola ao abrir" valor={p.escolaAoAbrir} aoMudar={(v) => preferencias.mudar({ escolaAoAbrir: v as Preferencias['escolaAoAbrir'] })}
            opcoes={[{ id: 'ultima', rotulo: 'A última' }, ...prof.escolas.map((id) => ({ id, rotulo: id === 'aurora' ? 'Aurora' : 'Rio Cachoeira' }))]} />
        </Ajuste>
      )}
    </>
  )
}

/** "Preparar a semana" de uma turma: o mesmo ajuste do ⋯ da turma (ajustesTurma). */
function SemanaDaTurma({ id, nome, disciplina }: { id: string; nome: string; disciplina: string }) {
  const a = useAjustesTurma(id)
  return (
    <Ajuste rotulo={`${nome} · ${disciplina}`}>
      <Interruptor rotulo={`Preparar a semana do ${nome}`} ligado={a.semana} aoMudar={(v) => ajustesTurma.mudar(id, 'semana', v)} />
    </Ajuste>
  )
}

function Assistente() {
  const p = usePreferencias()
  const turmas = useTurmasDoProfessor()
  return (
    <>
      <Grupo>Padrões das ferramentas</Grupo>
      <Ajuste rotulo="Questões por prova">
        <Segmentado rotulo="Questões por prova" valor={String(p.prova.questoes)}
          aoMudar={(v) => preferencias.mudar({ prova: { questoes: Number(v) as Preferencias['prova']['questoes'] } })}
          opcoes={['5', '10', '15', '20'].map((n) => ({ id: n, rotulo: n }))} />
      </Ajuste>
      <Ajuste rotulo="Alternativas">
        <Segmentado rotulo="Alternativas por questão" valor={String(p.prova.alternativas)}
          aoMudar={(v) => preferencias.mudar({ prova: { alternativas: Number(v) as Preferencias['prova']['alternativas'] } })}
          opcoes={[{ id: '4', rotulo: 'a até d' }, { id: '5', rotulo: 'a até e' }]} />
      </Ajuste>
      <Ajuste rotulo="Sempre com gabarito"><Interruptor rotulo="Sempre com gabarito" ligado={p.prova.gabarito} aoMudar={(v) => preferencias.mudar({ prova: { gabarito: v } })} /></Ajuste>
      <Grupo>Preparar a semana, toda segunda</Grupo>
      {turmas.length === 0 && <p className="t-apoio">Nenhuma turma ainda.</p>}
      {turmas.map((t) => <SemanaDaTurma key={t.id} id={t.id} nome={t.nome} disciplina={t.disciplina} />)}
    </>
  )
}

function PerfilProfessor() {
  const prof = useProfessorAtual()
  const profs = useProfessoresDaEscola()
  const turmas = useTurmasDoProfessor()
  const email = profs.find((x) => x.id === prof.profId)?.email ?? `${prof.primeiro.toLowerCase()}@colegioaurora.example`
  const [avisando, setAvisando] = useState(false)
  const [texto, setTexto] = useState('')
  const [avisado, setAvisado] = useState(false)
  const escolas = ESCOLAS.filter((e) => turmas.some((t) => t.escolaId === e.id))
  return (
    <>
      <Ajuste rotulo="Nome"><Valor>{prof.nome}</Valor></Ajuste>
      <Ajuste rotulo="E-mail"><Valor>{email}</Valor></Ajuste>
      <Grupo>Escolas e turmas</Grupo>
      <div className="[&>*]:px-0">
        {escolas.length === 0 && <Linha titulo="Nenhuma turma ainda" />}
        {escolas.map((e) => {
          const dela = turmas.filter((t) => t.escolaId === e.id)
          return <Linha key={e.id} titulo={e.nome} abaixo={`${dela.map((t) => t.nome).join(', ')} · ${dela[0]?.disciplina ?? ''}`} fim={<Selo familia="verde" tamanho="p">Confirmado</Selo>} />
        })}
      </div>
      {avisado
        ? <Carimbo verbo="Aviso enviado" por="à coordenação" className="mt-3" />
        : <Botao variante="secundario" tamanho="m" className="mt-3" onClick={() => setAvisando(true)}>Avisar a coordenação</Botao>}
      <Dialogo aberto={avisando} aoMudar={setAvisando} titulo="O que está errado?" largura={460}
        rodape={<Botao disabled={!texto.trim()} onClick={() => { setAvisado(true); setAvisando(false) }}>Enviar</Botao>}>
        <CampoTexto rotulo="Escola, turma ou disciplina" rotuloOculto valor={texto} aoMudar={setTexto} linhas={3} placeholder="Ex.: não dou mais aula no 1ºC" />
      </Dialogo>
    </>
  )
}

function SegurancaProfessor() {
  const ligado = useDuasEtapas()
  return (
    <>
      <Ajuste rotulo="Como você entra"><Valor>E-mail e senha</Valor></Ajuste>
      <TrocarSenha />
      <Ajuste rotulo="Duas etapas"><Interruptor rotulo="Verificação em duas etapas" ligado={ligado} aoMudar={mudarDuasEtapas} /></Ajuste>
      <Aparelhos papel="professor" />
    </>
  )
}

const DO_ASSISTENTE: [string, boolean, string[]][] = [
  ['Faz sozinho', true, ['Rascunha prova, atividade e plano', 'Corrige questão objetiva', 'Avisa o que espera você']],
  ['Espera você aprovar', true, ['Nota', 'Envio para a turma', 'Versão adaptada']],
  ['Nunca faz', false, ['Dar nota sem você', 'Falar com a família', 'Decidir sobre um aluno', 'Corrigir redação']],
]

function ComoIA() {
  return (
    <>
      <p className="rounded-[12px] bg-fundo-suave px-4 py-3 text-[15px] font-bold leading-5 text-tinta">A IA prepara e avisa. Você aprova. Ela pode errar.</p>
      {DO_ASSISTENTE.map(([titulo, sim, itens]) => (
        <div key={titulo}>
          <Grupo>{titulo}</Grupo>
          <ul className="grid gap-2">
            {itens.map((i) => (
              <li key={i} className="flex items-center gap-2.5 text-[15px] font-medium text-tinta">
                {sim ? <Check aria-hidden className="size-5 shrink-0 text-verde-texto" strokeWidth={3} /> : <X aria-hidden className="size-5 shrink-0 text-vermelho-texto" strokeWidth={3} />}{i}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <Grupo>Seus dados</Grupo>
      <Ajuste rotulo="Onde é processado"><Selo familia="neutro">Planejado: Brasil</Selo></Ajuste>
      <Ajuste rotulo="Treina algum modelo?"><Selo familia="verde">Não</Selo></Ajuste>
    </>
  )
}

function NotificacoesCoordenacao() {
  const p = usePreferencias().coordenacao
  return (
    <>
      <p className="mb-2 rounded-[12px] bg-roxo-claro px-4 py-3 text-[15px] font-bold leading-5 text-roxo-texto">Fora do horário, só chega risco à vida, e só para quem tem a atribuição.</p>
      <Ajuste rotulo="Resumo de segunda"><Interruptor rotulo="Resumo de segunda de manhã" ligado={p.resumo} aoMudar={(v) => preferencias.mudar({ coordenacao: { resumo: v } })} /></Ajuste>
      <Ajuste rotulo="Alerta do Analista"><Interruptor rotulo="Alerta do Analista" ligado={p.alerta} aoMudar={(v) => preferencias.mudar({ coordenacao: { alerta: v } })} /></Ajuste>
    </>
  )
}

function PerfilCoordenacao() {
  return (
    <>
      <Ajuste rotulo="Nome"><Valor>Helena Martins</Valor></Ajuste>
      <Ajuste rotulo="Função"><Valor>Coordenação pedagógica</Valor></Ajuste>
      <Ajuste rotulo="Escola"><Valor>{ESCOLAS[0].nome}</Valor></Ajuste>
      <Ajuste rotulo="E-mail"><Valor>helena.martins@colegioaurora.example</Valor></Ajuste>
    </>
  )
}

function SegurancaCoordenacao() {
  return (
    <>
      <Ajuste rotulo="Como você entra"><Valor>E-mail e senha</Valor></Ajuste>
      <TrocarSenha />
      <Ajuste rotulo="Duas etapas"><Valor>Obrigatório para a coordenação.</Valor></Ajuste>
      <Aparelhos papel="coordenacao" />
    </>
  )
}

function Conteudo({ secao, papel }: { secao: SecaoId; papel: Papel }) {
  if (papel === 'aluno') return <><Aparencia /><TamanhoTexto papel="aluno" /><TrocarSenha /></>
  if (papel === 'rede') return <Aparencia />
  if (papel === 'coordenacao') {
    if (secao === 'notificacoes') return <NotificacoesCoordenacao />
    if (secao === 'perfil') return <PerfilCoordenacao />
    if (secao === 'seguranca') return <SegurancaCoordenacao />
    return <><Aparencia /><TamanhoTexto papel="coordenacao" /></>
  }
  switch (secao) {
    case 'assistente': return <Assistente />
    case 'perfil': return <PerfilProfessor />
    case 'privacidade': return <MeuUso />
    case 'seguranca': return <SegurancaProfessor />
    case 'ia': return <ComoIA />
    default: return <GeralProfessor />
  }
}

const TITULO: Record<string, string> = { professor: 'Configurações', coordenacao: 'Minha conta', aluno: 'Ajustes', rede: 'Configurações' }

export function Configuracoes({ papel, aberta, aoFechar }: { papel: Papel; aberta: string | null; aoFechar: () => void }) {
  const secoes = DO_PAPEL[papel] ?? DO_PAPEL.professor
  const celular = useIsMobile()
  const [atual, setAtual] = useState<SecaoId | null>(null)
  const [noIndice, setNoIndice] = useState(false)
  const pedida = secoes.find((s) => s.id === aberta)?.id
  const id = atual ?? pedida ?? secoes[0].id
  const secao = secoes.find((s) => s.id === id) ?? secoes[0]
  const fechar = () => { aoFechar(); setAtual(null); setNoIndice(false) }
  const titulo = TITULO[papel] ?? 'Configurações'

  if (papel === 'aluno' || papel === 'rede') {
    return (
      <Dialogo aberto={aberta !== null} aoMudar={(v) => { if (!v) fechar() }} titulo={titulo} largura={480}>
        <Conteudo secao="geral" papel={papel} />
      </Dialogo>
    )
  }

  const indice = (
    <nav aria-label={`Seções de ${titulo.toLowerCase()}`} className="overflow-hidden rounded-[16px] border-2 border-borda">
      {secoes.map((s) => (
        <Linha key={s.id} onClick={() => { setAtual(s.id); setNoIndice(false) }} aria-label={s.nome}
          className={cn(!celular && s.id === secao.id && 'bg-azul-claro hover:bg-azul-claro [&_.t-cartao]:text-azul-texto')}
          inicio={<s.icone aria-hidden className={cn('size-6', !celular && s.id === secao.id ? 'text-azul-texto' : 'text-sutil')} strokeWidth={2.5} />}
          titulo={s.nome} chevron={celular} />
      ))}
    </nav>
  )
  const conteudo = (
    <section aria-label={secao.nome} className="min-w-0">
      {celular && (
        <Botao variante="fantasma" tamanho="p" className="-ml-3 mb-1" onClick={() => setNoIndice(true)} icone={<ChevronLeft strokeWidth={2.5} />}>{titulo}</Botao>
      )}
      <h2 className="t-secao pb-3 text-tinta">{secao.nome}</h2>
      <div key={secao.id}><Conteudo secao={secao.id} papel={papel} /></div>
    </section>
  )

  return (
    <Dialogo aberto={aberta !== null} aoMudar={(v) => { if (!v) fechar() }} titulo={titulo} largura={920}
      className="h-[min(700px,calc(100svh-32px))]">
      {celular
        ? (noIndice || (atual === null && (aberta === 'geral' || !pedida)) ? indice : conteudo)
        : (
          <div className="grid min-h-full grid-cols-[248px_minmax(0,1fr)] items-start gap-8">
            <div className="sticky top-0">{indice}</div>
            {conteudo}
          </div>
        )}
    </Dialogo>
  )
}
