import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, MoreVertical, Paperclip, Pencil, Trash2, X } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { IconeFerramenta } from '@/components/turmma/icones-ferramenta'
import { BotaoT, botaoT, CartaoT, VazioT } from '@/components/turmma/teachy'
import { PROFESSORA, turmaDe } from '@/dados/escola'
import { ferramenta } from '@/dados/ferramentas'
import { compartilhaveisDa, docDe, haQuanto, LIMITE_POST, postsDa, tipoDoDoc, type PostMural } from '@/dados/turma-mural'
import { cn } from '@/lib/utils'

/* A ABA "MURAL" DA TURMA, cópia do Mural da Teachy (20/09/2026) — PROPOSTA do mockup: não está no roadmap.
   Coluna central de 640 px: em cima o cartão de publicar (avatar, campo com contador, "Anexar" e "Publicar"); embaixo
   os recados, do mais novo para o mais antigo. Na Teachy a conta do Gabriel estava vazia (o cartão tracejado "Ainda
   não há posts no mural"); aqui cada turma vem com os recados dela, coerentes com o resto do mockup.
   · "Publicar" só acende com texto; o recado entra no alto, com "agora", e o campo limpa.
   · "Anexar da Biblioteca" (na Teachy, "Anexar de Meus Materiais") oferece até 5 documentos da turma.
   · Do aluno só aparece a CONTAGEM de quem viu (D57, D66). O mural é recado para a turma inteira: o produto não
     abre conversa individual entre professor e aluno, e a última linha da aba diz isso.
   Contrato: bloco de altura natural; quem rola é a página da turma. */

const ABRIR = '/professor/biblioteca/prova-estequiometria'
const ALTURA_MAX = 160

/* Os menus seguem os da área (`menuT` e `itemT` de turmma/painel.tsx: canto 8, fio de 1 px, item de 36 px em Inter 14);
   o item de DOCUMENTO é mais alto, porque leva o ícone ilustrado de 32 px e duas linhas. */
const menuT = 'max-w-[calc(100vw-32px)] rounded-[8px] border-linha p-1.5 font-teachy-corpo text-tinta shadow-flutua'
const itemT = 'h-9 cursor-pointer gap-2.5 rounded-[6px] px-2.5 text-[14px] leading-6 text-tinta'
const itemDocT = 'cursor-pointer gap-3 rounded-[6px] px-2.5 py-2 text-[14px] leading-5 text-tinta'
const campoT = 'block w-full resize-none rounded-[8px] border border-borda-campo bg-superficie px-3 py-2 text-[14px] leading-6 text-tinta outline-none transition-colors duration-150 placeholder:text-inativo hover:border-inativo focus-visible:border-tinta'

export function MuralTurma({ turmaId }: { turmaId: string }) {
  return <Mural key={turmaId} turmaId={turmaId} />
}

function Mural({ turmaId }: { turmaId: string }) {
  const turma = turmaDe(turmaId)
  const [posts, setPosts] = useState<PostMural[]>(() => postsDa(turmaId))
  const [texto, setTexto] = useState('')
  const [anexo, setAnexo] = useState<number | null>(null)
  const serie = useRef(0)
  const campo = useRef<HTMLTextAreaElement>(null)
  const anexaveis = compartilhaveisDa(turmaId).slice(0, 5)
  const docAnexo = anexo === null ? undefined : docDe(anexo)

  // o campo cresce com o texto, até uns 160 px; daí em diante rola por dentro
  useLayoutEffect(() => {
    const el = campo.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight + 2, ALTURA_MAX)}px`
  }, [texto])

  const publicar = () => {
    const limpo = texto.trim()
    if (!limpo) return
    serie.current += 1
    setPosts((l) => [{ id: `novo-${serie.current}`, texto: limpo, em: 'agora', anexo: anexo ?? undefined, visto: 0 }, ...l])
    setTexto('')
    setAnexo(null)
  }

  return (
    <div className="mx-auto w-full max-w-[640px] pt-6 font-teachy-corpo">
      {/* o cartão de publicar */}
      <CartaoT>
        <div className="flex items-start gap-3">
          <AvatarProfessora />
          <div className="min-w-0 flex-1">
            <textarea ref={campo} value={texto} maxLength={LIMITE_POST} rows={2} aria-label={`Publicar no mural do ${turma.nome}`}
              placeholder="Compartilhe algo com a turma" onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) publicar() }}
              className={cn(campoT, 'min-h-[64px]')} />
            <p className="mt-1 text-right text-[11px] leading-4 text-inativo">{texto.length}/{LIMITE_POST}</p>
          </div>
        </div>

        {docAnexo && (
          <div className="mt-2 pl-11">
            <span className="inline-flex h-8 max-w-full items-center gap-2 rounded-[8px] border border-borda-campo bg-superficie pl-2.5 pr-1 text-[13px] leading-5 text-tinta">
              <IconeAnexo de={docAnexo.de} />
              <span className="truncate">{docAnexo.titulo}</span>
              <button type="button" aria-label={`Tirar o anexo ${docAnexo.titulo}`} onClick={() => setAnexo(null)}
                className="grid size-6 shrink-0 place-items-center rounded-[6px] text-inativo transition-colors duration-150 hover:bg-realce-suave hover:text-tinta">
                <X className="size-3.5" strokeWidth={2} />
              </button>
            </span>
          </div>
        )}

        <div className="-mx-4 mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-linha px-4 pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={botaoT('contorno', 'm', 'gap-2 px-3 outline-none data-[state=open]:bg-realce-suave')}>
                <Paperclip strokeWidth={1.75} /> <span className="sm:hidden">Anexar</span><span className="hidden sm:inline">Anexar da Biblioteca</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={cn(menuT, 'w-[328px]')}>
              <DropdownMenuLabel className="px-2.5 pb-1 pt-1.5 text-[12px] font-normal leading-4 text-inativo">
                {anexaveis.length > 0 ? `Da Biblioteca do ${turma.nome}` : `A Biblioteca ainda não tem documento aprovado do ${turma.nome}`}
              </DropdownMenuLabel>
              {anexaveis.map((d) => (
                <DropdownMenuItem key={d.n} className={itemDocT} onSelect={() => setAnexo(d.n)}>
                  <IconeFerramenta id={d.de} className="size-8 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium leading-5">{d.titulo}</span>
                    <span className="block truncate text-[12px] leading-4 text-inativo">{tipoDoDoc(d)}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <BotaoT variante="primario" tamanho="m" disabled={!texto.trim()} onClick={publicar}>Publicar</BotaoT>
        </div>
      </CartaoT>

      {/* os recados */}
      {posts.length === 0 ? (
        <VazioT tracejado arte={<ArteMural />} titulo="Ainda não há posts no mural" texto="Quando você publicar algo, a turma vai ver por aqui."
          className="mt-4 gap-3 border-borda-campo py-10 [&_h3]:text-[14px] [&_h3]:leading-6 [&_p]:mt-0 [&_p]:text-[12px] [&_p]:leading-4" />
      ) : (
        <ul className="mt-4 space-y-4">
          {posts.map((p) => (
            <li key={p.id}>
              <Post post={p} total={turma.alunos}
                aoSalvar={(novo) => setPosts((l) => l.map((x) => x.id === p.id ? { ...x, texto: novo } : x))}
                aoApagar={() => setPosts((l) => l.filter((x) => x.id !== p.id))} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-center text-[12px] leading-4 text-inativo">
        O mural é só de recados da turma. Conversa individual com aluno não acontece aqui.
      </p>
    </div>
  )
}

function Post({ post, total, aoSalvar, aoApagar }: { post: PostMural; total: number; aoSalvar: (texto: string) => void; aoApagar: () => void }) {
  const [rascunho, setRascunho] = useState<string | null>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  // ao escolher "Editar", o foco vai para o campo em vez de voltar para o ⋮ (que é o que o menu faria ao fechar)
  const vaiEditar = useRef(false)
  const doc = post.anexo === undefined ? undefined : docDe(post.anexo)
  const editando = rascunho !== null
  return (
    <CartaoT className="pb-0">
      <div className="flex items-center gap-3">
        <AvatarProfessora />
        <div className="min-w-0">
          <p className="truncate font-teachy text-[14px] font-bold leading-5 text-tinta">{PROFESSORA.nome}</p>
          <p className="text-[12px] leading-4 text-inativo">{post.em === 'agora' ? 'agora' : haQuanto(post.em)}</p>
        </div>
      </div>

      {editando ? (
        <div className="mt-3">
          <textarea ref={campo} autoFocus value={rascunho} maxLength={LIMITE_POST} rows={3} aria-label="Editar o recado" onChange={(e) => setRascunho(e.target.value)} className={cn(campoT, 'min-h-[88px]')} />
          <div className="mt-2 flex justify-end gap-2">
            <BotaoT variante="texto" tamanho="p" onClick={() => setRascunho(null)}>Cancelar</BotaoT>
            <BotaoT variante="primario" tamanho="p" disabled={!rascunho.trim()} onClick={() => { aoSalvar(rascunho.trim()); setRascunho(null) }}>Salvar</BotaoT>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap break-words text-[14px] leading-6 text-tinta">{post.texto}</p>
      )}

      {doc && (
        <Link to={ABRIR} className="mt-3 inline-flex h-8 max-w-full items-center gap-2 rounded-[8px] border border-borda-campo bg-superficie px-2.5 text-[13px] leading-5 text-tinta transition-colors duration-150 hover:bg-realce-suave">
          <IconeAnexo de={doc.de} />
          <span className="truncate">{doc.titulo}</span>
        </Link>
      )}

      <div className="-mx-4 mt-4 flex h-11 items-center justify-between border-t border-linha pl-4 pr-2">
        <p className="text-[12px] leading-4 text-inativo">Visto por {post.visto} de {total}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Ações do recado"
              className="grid size-8 place-items-center rounded-[8px] text-sutil outline-none transition-colors duration-150 hover:bg-realce-suave hover:text-tinta focus-visible:bg-realce-suave data-[state=open]:bg-realce-suave data-[state=open]:text-tinta">
              <MoreVertical className="size-[18px]" strokeWidth={1.75} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn(menuT, 'w-[168px]')}
            onCloseAutoFocus={(e) => { if (!vaiEditar.current) return; vaiEditar.current = false; e.preventDefault(); const el = campo.current; el?.focus(); el?.setSelectionRange(el.value.length, el.value.length) }}>
            <DropdownMenuItem className={itemT} onSelect={() => { vaiEditar.current = true; setRascunho(post.texto) }}><Pencil className="size-4 text-sutil" strokeWidth={1.75} /> Editar</DropdownMenuItem>
            <DropdownMenuItem className={cn(itemT, 'text-erro focus:text-erro')} onSelect={aoApagar}><Trash2 className="size-4" strokeWidth={1.75} /> Apagar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CartaoT>
  )
}

/** A professora, como na lateral do app: o círculo laranja com as iniciais. 32 px, como o avatar do mural da Teachy. */
function AvatarProfessora() {
  return <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-caramelo font-teachy text-[12px] font-bold leading-none text-tinta">{PROFESSORA.iniciais}</span>
}

/** O ícone pequeno do anexo: o da ferramenta que gerou o documento, em laranja. */
function IconeAnexo({ de }: { de: string }) {
  const Icone = ferramenta(de)?.icon ?? FileText
  return <Icone aria-hidden className="size-4 shrink-0 text-caramelo" strokeWidth={1.75} />
}

/** A ilustração do mural vazio, na linguagem dos ícones da rodada: chapada, sem contorno, papel cinza quente e laranja. */
function ArteMural() {
  return (
    <svg aria-hidden viewBox="0 0 72 72" className="size-[72px]" fill="none">
      <rect x="9" y="13" width="38" height="46" rx="6" fill="#E9E6E2" transform="rotate(-7 28 36)" />
      <g transform="rotate(-7 28 36)" fill="#C9C4BE">
        <rect x="16" y="23" width="24" height="3" rx="1.5" /><rect x="16" y="31" width="18" height="3" rx="1.5" /><rect x="16" y="39" width="22" height="3" rx="1.5" />
      </g>
      <path d="M30 24h28a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H46l-8 8v-8h-8a6 6 0 0 1-6-6V30a6 6 0 0 1 6-6Z" fill="#E8732E" />
      <rect x="31" y="33" width="26" height="3.5" rx="1.75" fill="#FFFFFF" /><rect x="31" y="41" width="17" height="3.5" rx="1.75" fill="#FFFFFF" />
      <path d="m58 5 1.9 5.1L65 12l-5.1 1.9L58 19l-1.9-5.1L51 12l5.1-1.9L58 5Z" fill="#F5C542" />
    </svg>
  )
}
