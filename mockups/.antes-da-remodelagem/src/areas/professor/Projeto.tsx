import { useState } from 'react'
import type React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, FolderPlus, MessageSquare, Pencil, Pin, PinOff, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileCard } from '@/components/ui/file-card-collections'
import { Folder } from '@/components/ui/folder'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CaixaPedido } from '@/components/turmma/pedido'
import { Tela } from '@/components/turmma/tela'
import { acervo, quando, useAcervo, type Projeto as TipoProjeto } from '@/dados/conversas'
import { TURMAS } from '@/dados/escola'
import { cn } from '@/lib/utils'

/* PROJETOS, como no Claude e no ChatGPT (pedido do Gabriel, 20/09/2026). Um projeto é uma pasta do professor que
   junta conversas, arquivos e instruções que valem só ali. Item do menu, logo abaixo de "Nova conversa"; os
   FIXADOS aparecem na lateral.
   A tela do projeto foi REORGANIZADA (a primeira "ficou muito confusa": caixa de pedido, arquivos, instruções e
   conversas disputavam o mesmo lugar). Agora são duas colunas, como no Claude:
   · à esquerda, o TRABALHO — começar uma conversa e as conversas do projeto;
   · à direita, o CONTEXTO — o que o Assistente sabe aqui: a turma, as instruções e os arquivos.
   No mockup funciona de verdade só o que cabe no navegador (criar, fixar, conversar, editar instruções). O que o
   produto precisa para isto existir está em docs/pendencias-dos-mockups.md, no repositório do produto:
   arquivo de projeto é material e só entra com titularidade e licença (D5), preso à escola (regra 10); instrução é
   texto livre e não pode virar lugar de escrever sobre aluno (D35, D66); projeto é do professor e a coordenação
   não vê (regra 70, item 8). */

const ORIGEM = { meu: 'É meu', escola: 'Da escola', licenca: 'Com licença' }
const nomeTurma = (id: string) => { const t = TURMAS.find((x) => x.id === id); return t ? `${t.nome} · ${t.disciplina}` : '' }

function BotaoFixar({ p, className }: { p: TipoProjeto; className?: string }) {
  return (
    <button type="button" onClick={() => acervo.alternarFixado(p.id)} aria-pressed={p.fixado} title={p.fixado ? 'Tirar da lateral' : 'Fixar na lateral'}
      className={cn('inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors duration-150',
        p.fixado ? 'border-tinta bg-tinta text-white hover:bg-noite-alto' : 'border-borda-campo bg-superficie text-sutil hover:bg-realce-suave hover:text-tinta', className)}>
      {p.fixado ? <PinOff className="size-4" /> : <Pin className="size-4" />} {p.fixado ? 'Fixado' : 'Fixar'}
    </button>
  )
}

/** Todos os projetos: uma pasta por projeto. Passar o mouse abre a pasta. */
export function Projetos() {
  const { projetos, conversas } = useAcervo()
  const navegar = useNavigate()
  const [busca, setBusca] = useState('')
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')
  const [turmaId, setTurmaId] = useState('2b')
  const q = busca.trim().toLowerCase()
  const lista = projetos.filter((p) => !q || p.nome.toLowerCase().includes(q)).sort((a, b) => Number(b.fixado) - Number(a.fixado) || b.criadoEm - a.criadoEm)

  return (
    <Tela titulo="Projetos" acoes={
      <>
        <Button variant="oficial" size="sm" onClick={() => { setNome(''); setCriando(true) }}><FolderPlus /> Novo projeto</Button>
        <label className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-inativo" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar projeto" aria-label="Buscar projeto"
            className="h-9 w-full rounded-full border border-borda-campo bg-superficie pl-10 pr-3 text-sm text-tinta outline-none placeholder:text-inativo focus-visible:border-tinta" />
        </label>
      </>
    }>
      {lista.length === 0 ? (
        <p className="rounded-cartao border border-dashed border-borda-campo px-6 py-12 text-center text-sm text-sutil">{q ? 'Nenhum projeto com esse nome.' : 'Nenhum projeto ainda. Um projeto junta as conversas, os arquivos e as instruções de um assunto.'}</p>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {lista.map((p) => {
            const n = conversas.filter((c) => c.projetoId === p.id).length
            return (
              <li key={p.id} className="group/pasta relative flex gap-4 rounded-[20px] border border-linha bg-superficie p-4 transition-[box-shadow,border-color] duration-150 hover:border-transparent hover:shadow-caixa">
                <Folder tom="preto" escala={0.4} className="mt-1" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link to={`/professor/projetos/${p.id}`} className="font-corpo text-[15.5px] font-semibold leading-snug text-tinta after:absolute after:inset-0 after:rounded-[20px]">{p.nome}</Link>
                  <p className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug text-sutil">{p.resumo || 'Sem descrição ainda'}</p>
                  <p className="mt-auto pt-2.5 text-[12.5px] text-inativo">{nomeTurma(p.turmaId)} · {n} {n === 1 ? 'conversa' : 'conversas'} · {p.arquivos.length} {p.arquivos.length === 1 ? 'arquivo' : 'arquivos'}</p>
                </div>
                <button type="button" onClick={() => acervo.alternarFixado(p.id)} aria-pressed={p.fixado} aria-label={p.fixado ? `Tirar ${p.nome} da lateral` : `Fixar ${p.nome} na lateral`} title={p.fixado ? 'Tirar da lateral' : 'Fixar na lateral'}
                  className={cn('relative z-10 grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-150', p.fixado ? 'bg-tinta text-white hover:bg-noite-alto' : 'text-inativo hover:bg-realce-suave hover:text-tinta')}>
                  <Pin className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={criando} onOpenChange={setCriando}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-md gap-4 rounded-[24px] border-0 bg-superficie p-5 shadow-flutua sm:rounded-[24px] sm:p-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="font-corpo text-lg font-semibold tracking-normal text-tinta">Novo projeto</DialogTitle>
            <DialogDescription className="text-[13.5px] leading-snug text-sutil">Uma pasta para um assunto: as conversas, os arquivos e as instruções ficam juntos.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); if (nome.trim()) navegar(`/professor/projetos/${acervo.criarProjeto(nome, turmaId).id}`) }}>
            <Input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: 4º bimestre · 2ºB" aria-label="Nome do projeto" className="h-11 rounded-controle border-borda-campo bg-superficie text-[15px] md:h-10" />
            <label className="grid gap-1.5 text-[13px] font-medium text-apoio">Turma do projeto
              <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="h-11 rounded-controle border border-borda-campo bg-superficie px-3 text-[15px] font-normal text-tinta outline-none focus-visible:border-tinta md:h-10">
                {TURMAS.map((t) => <option key={t.id} value={t.id}>{t.nome} · {t.disciplina}</option>)}
              </select>
            </label>
            <DialogFooter className="flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end sm:space-x-0">
              <Button type="button" variant="secundario" onClick={() => setCriando(false)}>Cancelar</Button>
              <Button type="submit" variant="oficial" disabled={!nome.trim()}>Criar projeto</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Tela>
  )
}

/** Bloco da coluna de contexto: título, uma ação, e o conteúdo. */
function Contexto({ titulo, acao, children }: { titulo: string; acao?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-b border-linha p-4 last:border-0">
      <div className="mb-2 flex min-h-8 items-center justify-between gap-2">
        <h2 className="font-corpo text-[13px] font-semibold text-tinta">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  )
}

export function Projeto() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { projetos, conversas } = useAcervo()
  const projeto = projetos.find((p) => p.id === id)
  const [texto, setTexto] = useState('')
  const [ferramenta, setFerramenta] = useState('conversa')
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState('')

  if (!projeto) {
    return (
      <Tela titulo="Projeto" largura="conversa">
        <p className="rounded-cartao border border-dashed border-borda-campo px-6 py-12 text-center text-sm text-sutil">Este projeto não existe mais. <Link to="/professor/projetos" className="font-medium text-tinta underline underline-offset-4">Ver todos os projetos</Link></p>
      </Tela>
    )
  }
  const doProjeto = conversas.filter((c) => c.projetoId === projeto.id).sort((a, b) => b.em - a.em)

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-10 pt-4 md:px-6 md:pt-5">
      <header className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <Link to="/professor/projetos" aria-label="Todos os projetos" className="grid size-9 shrink-0 place-items-center rounded-full text-sutil transition-colors duration-150 hover:bg-realce-suave hover:text-tinta"><ArrowLeft className="size-[18px]" /></Link>
        <Folder tom="preto" escala={0.22} aberta />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[21px] font-semibold leading-tight tracking-[-0.015em] text-tinta">{projeto.nome}</h1>
          <p className="truncate text-sm text-sutil">{projeto.resumo || 'Sem descrição ainda'}</p>
        </div>
        <BotaoFixar p={projeto} />
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* O TRABALHO: conversar e retomar conversa */}
        <div className="min-w-0">
          <CaixaPedido key={projeto.id} valor={texto} aoMudar={setTexto} ferramenta={ferramenta} aoMudarFerramenta={setFerramenta} turmaInicial={projeto.turmaId}
            placeholder={`Nova conversa em ${projeto.nome}…`}
            aoEnviar={(t, extra) => navegar(`/professor/conversa/${acervo.criarConversa({ pedido: t, ferramenta, projetoId: projeto.id, ...extra }).id}`)} />

          <h2 className="rotulo mb-1.5 mt-6 px-1">Conversas deste projeto{doProjeto.length > 0 && ` · ${doProjeto.length}`}</h2>
          {doProjeto.length === 0 ? (
            <p className="rounded-[20px] border border-dashed border-borda-campo px-5 py-8 text-center text-[13.5px] leading-snug text-sutil">Nenhuma conversa ainda. O que você pedir aí em cima fica guardado aqui, e o Assistente já começa sabendo o que está ao lado.</p>
          ) : (
            <ul className="divide-y divide-linha overflow-hidden rounded-[20px] border border-linha bg-superficie">
              {doProjeto.map((c) => (
                <li key={c.id}><Link to={`/professor/conversa/${c.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-realce-suave">
                  <MessageSquare className="size-[18px] shrink-0 text-sutil" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-tinta">{c.titulo}</span>
                    <span className="block truncate text-[13px] text-sutil">{c.artefato ? `Salvou na biblioteca: ${c.artefato.titulo}` : c.pedido}</span>
                  </span>
                  {c.artefato && <FileCard formatFile={c.artefato.formato} tamanho="sm" className="mr-2 hidden sm:block" />}
                  <span className="shrink-0 text-xs text-inativo">{quando(c.em)}</span>
                </Link></li>
              ))}
            </ul>
          )}
        </div>

        {/* O CONTEXTO: o que o Assistente sabe dentro deste projeto */}
        <aside aria-label="O que o Assistente sabe neste projeto" className="overflow-hidden rounded-[20px] border border-linha bg-superficie lg:sticky lg:top-5">
          <p className="border-b border-linha bg-lateral px-4 py-2.5 text-[12.5px] leading-snug text-sutil">O que o Assistente já sabe em toda conversa daqui</p>
          <Contexto titulo="Turma"><p className="inline-flex h-7 items-center rounded-full bg-realce-suave px-2.5 text-[13px] font-medium text-tinta">{nomeTurma(projeto.turmaId)}</p></Contexto>

          <Contexto titulo="Instruções" acao={!editando && <Button variant="discreto" size="sm" className="h-8 px-2.5" onClick={() => { setRascunho(projeto.instrucoes); setEditando(true) }}><Pencil /> {projeto.instrucoes ? 'Editar' : 'Escrever'}</Button>}>
            {editando ? (
              <div className="grid gap-2">
                <Textarea autoFocus rows={5} value={rascunho} onChange={(e) => setRascunho(e.target.value)} placeholder="Como o Assistente deve trabalhar neste projeto" className="min-h-[112px] rounded-controle border-borda-campo bg-superficie text-sm" />
                <div className="flex justify-end gap-2">
                  <Button variant="secundario" size="sm" onClick={() => setEditando(false)}>Cancelar</Button>
                  <Button variant="oficial" size="sm" onClick={() => { acervo.salvarInstrucoes(projeto.id, rascunho.trim()); setEditando(false) }}><Check /> Salvar</Button>
                </div>
              </div>
            ) : projeto.instrucoes
              ? <p className="text-[13.5px] leading-relaxed text-apoio">{projeto.instrucoes}</p>
              : <p className="text-[13.5px] leading-snug text-sutil">Nada escrito. Diga, por exemplo, a ordem dos capítulos ou o formato das suas provas.</p>}
            <p className="mt-2 text-xs leading-snug text-inativo">Não é lugar para escrever sobre alunos.</p>
          </Contexto>

          <Contexto titulo={`Arquivos · ${projeto.arquivos.length}`} acao={<Button variant="discreto" size="sm" className="h-8 px-2.5"><Plus /> Adicionar</Button>}>
            {projeto.arquivos.length === 0 ? <p className="text-[13.5px] leading-snug text-sutil">Nenhum arquivo. Só entra material seu, da escola ou com licença.</p> : (
              <ul className="grid gap-0.5">
                {projeto.arquivos.map((a) => (
                  <li key={a.nome} className="-mx-1.5 flex items-center gap-3.5 rounded-controle px-1.5 py-1.5 transition-colors duration-150 hover:bg-realce-suave">
                    <FileCard formatFile={a.formato} tamanho="sm" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-tinta">{a.nome}</span><span className="block text-xs text-sutil">{ORIGEM[a.origem]}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Contexto>
        </aside>
      </div>
    </div>
  )
}
