import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleSlash, ExternalLink, MoreVertical, Plus, Send, Users, UsersRound } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { IconeFerramenta } from '@/components/turmma/icones-ferramenta'
import { botaoT, CabecalhoAba, ChipT, Periodo, tabelaT, VazioT } from '@/components/turmma/teachy'
import { compartilhaveisDa, dataCurta, diasAtras, docDe, haQuanto, HOJE, nomeDo, recursosDa, tipoDoDoc, totalDo, type RecursoEnviado } from '@/dados/turma-mural'
import { cn } from '@/lib/utils'

/* A ABA "RECURSOS" DA TURMA, cópia de "Recursos enviados" da Teachy (20/09/2026) — PROPOSTA do mockup: não está no
   roadmap. Lá a conta do Gabriel estava vazia (a faixa com a ilustração, o título e o botão "Enviar recursos"); aqui
   ela vem CHEIA: os documentos da Biblioteca que a professora já compartilhou com a turma, numa tabela da Teachy.
   · "Enviar recursos" abre os documentos desta turma que ainda não foram enviados; escolher um põe a linha no alto.
   · Do aluno só aparece a CONTAGEM de quem abriu (D57, D66): nunca quem, quando ou por quanto tempo.
   · ⋮ : Abrir (o único documento que o mockup abre é a prova de estequiometria) · Reenviar · Parar de compartilhar.
   Contrato: bloco de altura natural; quem rola é a página da turma. */

const ABRIR = '/professor/biblioteca/prova-estequiometria'
const DIAS: Record<string, number> = { '30D': 30, '2M': 61, '3M': 92, '6M': 183, '12M': 365 }

/* Os menus seguem os da área (`menuT` e `itemT` de turmma/painel.tsx: canto 8, fio de 1 px, item de 36 px em Inter 14);
   o item de DOCUMENTO é mais alto, porque leva o ícone ilustrado de 32 px e duas linhas. */
const menuT = 'max-w-[calc(100vw-32px)] rounded-[8px] border-linha p-1.5 font-teachy-corpo text-tinta shadow-flutua'
const itemT = 'h-9 cursor-pointer gap-2.5 rounded-[6px] px-2.5 text-[14px] leading-6 text-tinta'
const itemDocT = 'cursor-pointer gap-3 rounded-[6px] px-2.5 py-2 text-[14px] leading-5 text-tinta'
const rotuloMenuT = 'px-2.5 pb-1 pt-1.5 text-[12px] font-normal leading-4 text-inativo'

export function RecursosTurma({ turmaId }: { turmaId: string }) {
  return <Recursos key={turmaId} turmaId={turmaId} />
}

function Recursos({ turmaId }: { turmaId: string }) {
  const [periodo, setPeriodo] = useState('2026')
  const [enviados, setEnviados] = useState<RecursoEnviado[]>(() => recursosDa(turmaId))

  const porEnviar = compartilhaveisDa(turmaId).filter((d) => !enviados.some((r) => r.doc === d.n))
  const enviar = (doc: number) => setEnviados((l) => [{ doc, destino: { tipo: 'turma' }, em: 'agora', abriram: 0 }, ...l.filter((r) => r.doc !== doc)])
  const reenviar = (doc: number) => setEnviados((l) => {
    const r = l.find((x) => x.doc === doc)
    return r ? [{ ...r, em: 'agora' }, ...l.filter((x) => x.doc !== doc)] : l
  })
  const parar = (doc: number) => setEnviados((l) => l.filter((r) => r.doc !== doc))

  const limite = DIAS[periodo]
  const visiveis = enviados.filter((r) => r.em === 'agora' || limite === undefined || diasAtras(r.em) <= limite)

  return (
    <div className="font-teachy-corpo">
      <CabecalhoAba titulo="Recursos enviados" apoio="Acompanhe e edite os recursos compartilhados com sua turma">
        <Periodo valor={periodo} aoMudar={setPeriodo} />
        {enviados.length > 0 && <MenuEnviar porEnviar={porEnviar} aoEnviar={enviar} />}
      </CabecalhoAba>

      {enviados.length === 0 ? (
        <VazioT arte={<ArteRecursos />} titulo="Envie recursos para seus alunos"
          texto="Você pode apoiar toda a turma ou grupos específicos com acompanhamento fácil."
          acao={<MenuEnviar porEnviar={porEnviar} aoEnviar={enviar} tamanho="g" centro />} />
      ) : (
        <div className={tabelaT.caixa}>
          <table className={cn(tabelaT.tabela, 'table-fixed')}>
            <colgroup>
              <col />
              <col className="hidden w-[248px] md:table-column" />
              <col className="hidden w-[132px] md:table-column" />
              <col className="w-[96px] sm:w-[168px]" />
              <col className="w-[52px]" />
            </colgroup>
            <thead className={tabelaT.cabeca}>
              <tr>
                <th className={tabelaT.th}>Recurso</th>
                <th className={cn(tabelaT.th, 'hidden md:table-cell')}>Para quem</th>
                <th className={cn(tabelaT.th, 'hidden md:table-cell')}>Enviado em</th>
                <th className={tabelaT.th}>Abriram</th>
                <th className={cn(tabelaT.th, 'px-0')}><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((r) => <Linha key={r.doc} r={r} turmaId={turmaId} aoReenviar={reenviar} aoParar={parar} />)}
              {visiveis.length === 0 && (
                <tr className="border-t border-linha"><td colSpan={5} className="px-4 py-8 text-center text-[14px] leading-6 text-inativo">Nenhum recurso enviado neste período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Linha({ r, turmaId, aoReenviar, aoParar }: { r: RecursoEnviado; turmaId: string; aoReenviar: (doc: number) => void; aoParar: (doc: number) => void }) {
  const navegar = useNavigate()
  const doc = docDe(r.doc)
  if (!doc) return null
  const total = totalDo(r.destino, turmaId)
  const data = r.em === 'agora' ? 'agora' : dataCurta(r.em)
  return (
    <tr className={tabelaT.tr}>
      <td className={tabelaT.td}>
        <div className="flex min-w-0 items-center gap-3">
          <IconeFerramenta id={doc.de} className="size-8 shrink-0" />
          <div className="min-w-0">
            <Link to={ABRIR} className="line-clamp-2 break-words text-[14px] font-medium leading-5 text-tinta underline-offset-2 hover:underline md:line-clamp-1 md:leading-6">{doc.titulo}</Link>
            <p className="truncate text-[12px] leading-4 text-inativo">
              <span className="md:hidden">{data} · {r.destino.tipo === 'grupo' ? r.destino.nome : 'Toda a turma'}</span>
              <span className="hidden md:inline">{tipoDoDoc(doc)}</span>
            </p>
          </div>
        </div>
      </td>
      <td className={cn(tabelaT.td, 'hidden md:table-cell')}>
        <ChipT className="max-w-full">{r.destino.tipo === 'grupo' ? <UsersRound strokeWidth={1.75} className="text-sutil" /> : <Users strokeWidth={1.75} className="text-sutil" />}<span className="truncate">{nomeDo(r.destino)}</span></ChipT>
      </td>
      <td className={cn(tabelaT.td, 'hidden md:table-cell')}>
        <p className="leading-6">{dataCurta(r.em === 'agora' ? HOJE : r.em)}</p>
        <p className="text-[12px] leading-4 text-inativo">{r.em === 'agora' ? 'agora' : haQuanto(r.em)}</p>
      </td>
      <td className={tabelaT.td}>
        <p className="whitespace-nowrap leading-6"><b className="font-semibold">{r.abriram}</b> de {total}</p>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-realce" role="img" aria-label={`${r.abriram} de ${total} alunos abriram`}>
          <div className="h-full rounded-full bg-tinta" style={{ width: `${Math.round((r.abriram / total) * 100)}%` }} />
        </div>
      </td>
      <td className={cn(tabelaT.td, 'px-0')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={`Ações de ${doc.titulo}`}
              className="grid size-8 place-items-center rounded-[8px] text-sutil outline-none transition-colors duration-150 hover:bg-realce-suave hover:text-tinta focus-visible:bg-realce-suave data-[state=open]:bg-realce-suave data-[state=open]:text-tinta">
              <MoreVertical className="size-[18px]" strokeWidth={1.75} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn(menuT, 'w-[224px]')}>
            <DropdownMenuItem className={itemT} onSelect={() => navegar(ABRIR)}><ExternalLink className="size-4 text-sutil" strokeWidth={1.75} /> Abrir</DropdownMenuItem>
            <DropdownMenuItem className={itemT} onSelect={() => aoReenviar(r.doc)}><Send className="size-4 text-sutil" strokeWidth={1.75} /> Reenviar</DropdownMenuItem>
            <DropdownMenuSeparator className="-mx-1.5 my-1.5 bg-linha" />
            <DropdownMenuItem className={cn(itemT, 'text-erro focus:text-erro')} onSelect={() => aoParar(r.doc)}><CircleSlash className="size-4" strokeWidth={1.75} /> Parar de compartilhar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

/** O botão "Enviar recursos" e o menu dele: o que a Biblioteca tem desta turma e ainda não foi enviado. */
function MenuEnviar({ porEnviar, aoEnviar, tamanho = 'm', centro = false }: { porEnviar: ReturnType<typeof compartilhaveisDa>; aoEnviar: (doc: number) => void; tamanho?: 'm' | 'g'; centro?: boolean }) {
  const navegar = useNavigate()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={botaoT('primario', tamanho, 'gap-2 outline-none')}><Send strokeWidth={2} /> Enviar recursos</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={centro ? 'center' : 'end'} className={cn(menuT, 'w-[328px]')}>
        <DropdownMenuLabel className={rotuloMenuT}>
          {porEnviar.length > 0 ? 'Da Biblioteca desta turma, ainda não enviados' : 'Tudo o que a Biblioteca tem desta turma já foi enviado'}
        </DropdownMenuLabel>
        {porEnviar.map((d) => (
          <DropdownMenuItem key={d.n} className={itemDocT} onSelect={() => aoEnviar(d.n)}>
            <IconeFerramenta id={d.de} className="size-8 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium leading-5">{d.titulo}</span>
              <span className="block truncate text-[12px] leading-4 text-inativo">{tipoDoDoc(d)}</span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="-mx-1.5 my-1.5 bg-linha" />
        <DropdownMenuItem className={itemDocT} onSelect={() => navegar('/professor/ferramentas')}>
          <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-realce-suave"><Plus className="size-4 text-caramelo" strokeWidth={2} /></span>
          Criar um recurso novo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** A faixa de ilustração do estado vazio (na Teachy, um caça-palavras e uma folha): aqui, dois ícones das nossas ferramentas. */
function ArteRecursos() {
  return (
    <div aria-hidden className="flex h-[124px] w-full max-w-[448px] items-center justify-center gap-5 rounded-[12px] bg-realce-suave">
      <IconeFerramenta id="atividade" className="size-16 -rotate-6" />
      <IconeFerramenta id="apresentacao" className="size-16 translate-y-1 rotate-6" />
    </div>
  )
}
