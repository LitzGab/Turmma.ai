import { useMemo, useState, type ReactElement } from 'react'
import { Plus, Search, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Estado } from '@/components/turmma/ia'
import { cn } from '@/lib/utils'
import { TabelaLista, type Coluna } from '../coordenacao/_a-pecas'
import { enderecoCompleto, type EscolaNaTela, type RedeNaTela } from './_dados'

/* Aba Escolas: as redes e as escolas de cada uma, o endereço, o estado da coordenação e a ação do convite.
   Nenhuma coluna com pessoa: a coordenadora convidada não aparece pelo nome; aparece o estado do convite. */

export type AcaoDeConvite = 'convidar' | 'refazer' | 'revogar'

const ESTADO_DA_COORDENACAO: Record<EscolaNaTela['coordenacao'], ReactElement> = {
  ativa: <Estado tipo="ok">Ativa</Estado>,
  'convite em aberto': <Estado tipo="pendente">Convite em aberto</Estado>,
  'convite vencido': <Estado tipo="erro">Convite vencido</Estado>,
  'sem convite': <Estado tipo="contorno">Sem convite</Estado>,
}

export function AbaEscolas({ redes, escolas, aoNovaRede, aoNovaEscola, aoConvite }: {
  redes: RedeNaTela[]; escolas: EscolaNaTela[]
  aoNovaRede: () => void; aoNovaEscola: (redeId?: string) => void
  aoConvite: (acao: AcaoDeConvite, escola: EscolaNaTela) => void
}) {
  const [busca, setBusca] = useState('')
  const [filtroRede, setFiltroRede] = useState('todas')

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return redes
      .filter((r) => filtroRede === 'todas' || r.id === filtroRede)
      .map((r) => {
        const daRede = escolas.filter((e) => e.rede === r.nome)
        const achadas = daRede.filter((e) => !termo || [e.nome, e.slug, e.cidade].some((t) => t.toLowerCase().includes(termo)))
        return { rede: r, total: daRede.length, escolas: achadas }
      })
      .filter((g) => !termo || g.escolas.length > 0 || g.rede.nome.toLowerCase().includes(termo))
  }, [redes, escolas, busca, filtroRede])

  const acao = (e: EscolaNaTela) => {
    if (e.coordenacao === 'sem convite') return <Button variant="secundario" size="sm" onClick={() => aoConvite('convidar', e)}><Send /> Convidar coordenação</Button>
    if (e.coordenacao === 'convite vencido') return <Button variant="secundario" size="sm" onClick={() => aoConvite('refazer', e)}><Send /> Refazer convite</Button>
    if (e.coordenacao === 'convite em aberto') return <Button variant="perigo" size="sm" onClick={() => aoConvite('revogar', e)}>Revogar convite</Button>
    return null
  }

  const colunas: Coluna<EscolaNaTela>[] = [
    { titulo: 'Escola', principal: true, celula: (e) => <span className="font-medium text-tinta">{e.nome}</span> },
    { titulo: 'Endereço', celula: (e) => <span className="whitespace-nowrap text-apoio">{enderecoCompleto(e.slug)}</span> },
    { titulo: 'Cidade', celula: (e) => <span className="whitespace-nowrap">{e.cidade}</span> },
    { titulo: 'Coordenação', celula: (e) => (
      <span className="inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-1 md:justify-start">
        {ESTADO_DA_COORDENACAO[e.coordenacao]}
        {e.detalhe && <span className="whitespace-nowrap text-[13px] text-sutil">{e.detalhe}</span>}
      </span>
    ) },
    { titulo: 'Criada em', celula: (e) => <span className="tabular-nums">{e.criadaEm}</span> },
    { titulo: 'Alunos com acesso', className: 'text-right', celula: (e) => e.alunos
      ? <span className="tabular-nums text-tinta">{e.alunos.toLocaleString('pt-BR')}</span>
      : <span className="text-inativo">—</span> },
  ]
  const colunasCelular: Coluna<EscolaNaTela>[] = [...colunas, { titulo: 'Ação', celula: (e) => acao(e) ?? <span className="text-inativo">nenhuma</span> }]

  const nEscolas = grupos.reduce((n, g) => n + g.escolas.length, 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-56 sm:max-w-[300px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-sutil" />
          <Input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar escola"
            placeholder="Buscar escola, endereço ou cidade" className="h-11 rounded-full border-borda-campo bg-superficie pl-10 text-sm md:h-9" />
        </div>
        <Select value={filtroRede} onValueChange={setFiltroRede}>
          <SelectTrigger aria-label="Filtrar por rede" className="h-11 w-full rounded-full border-borda-campo bg-superficie px-4 text-sm sm:w-[260px] md:h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-controle">
            <SelectItem value="todas" className="rounded-linha">Todas as redes</SelectItem>
            {redes.map((r) => <SelectItem key={r.id} value={r.id} className="rounded-linha">{r.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2 max-sm:w-full">
          <Button variant="secundario" className="max-sm:flex-1 md:h-9" onClick={aoNovaRede}><Plus /> Nova rede</Button>
          <Button variant="primario" className="max-sm:flex-1 md:h-9" onClick={() => aoNovaEscola(filtroRede === 'todas' ? undefined : filtroRede)}><Plus /> Nova escola</Button>
        </div>
      </div>

      <section aria-label="Escolas por rede" className="flex min-h-0 flex-col overflow-hidden rounded-cartao border border-linha bg-superficie">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {grupos.length === 0 ? (
            <p className="p-8 text-center text-[15px] text-sutil">Nenhuma escola com “{busca.trim()}”.</p>
          ) : (
            <>
              {/* computador: uma tabela só, com a rede como linha de grupo */}
              <Table className="hidden text-sm md:table">
                <TableHeader className="sticky top-0 z-10 bg-superficie shadow-[inset_0_-1px_0_var(--color-linha)]">
                  <TableRow className="border-0 hover:bg-transparent">
                    {colunas.map((c) => <TableHead key={c.titulo} className={cn('rotulo h-10 px-3 first:pl-4', c.className)}>{c.titulo}</TableHead>)}
                    <TableHead className="rotulo h-10 px-3 pr-4 text-right"><span className="sr-only">Ação</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grupos.map((g) => (
                    <GrupoDaTabela key={g.rede.id} grupo={g} colunas={colunas} acao={acao} aoNovaEscola={aoNovaEscola} />
                  ))}
                </TableBody>
              </Table>

              {/* celular: um bloco por rede, e a tabela vira lista */}
              <div className="grid min-w-0 gap-4 p-3 md:hidden">
                {grupos.map((g) => (
                  <section key={g.rede.id} aria-label={g.rede.nome} className="min-w-0">
                    <CabecaDoGrupo grupo={g} className="mb-2 px-1" />
                    {g.escolas.length
                      ? <TabelaLista colunas={colunasCelular} linhas={g.escolas} chave={(e) => e.id} />
                      : <SemEscola aoNovaEscola={() => aoNovaEscola(g.rede.id)} />}
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
        <p className="border-t border-linha px-4 py-2.5 text-[13px] text-sutil" aria-live="polite">
          {nEscolas} {nEscolas === 1 ? 'escola' : 'escolas'} em {grupos.length} {grupos.length === 1 ? 'rede' : 'redes'}
          <span className="max-sm:hidden"> · a coordenação de cada escola monta turmas, professores e alunos; a operação não entra na escola.</span>
        </p>
      </section>
    </div>
  )
}

type Grupo = { rede: RedeNaTela; total: number; escolas: EscolaNaTela[] }

function CabecaDoGrupo({ grupo, className }: { grupo: Grupo; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1', className)}>
      <span className="min-w-0 text-[15px] font-semibold leading-snug text-tinta md:truncate">{grupo.rede.nome}</span>
      <Estado tipo="contorno" size="sm">{grupo.rede.tipo}</Estado>
      <span className="text-[13px] tabular-nums text-sutil">{grupo.total} {grupo.total === 1 ? 'escola' : 'escolas'}</span>
    </div>
  )
}

function SemEscola({ aoNovaEscola }: { aoNovaEscola: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-controle border border-dashed border-borda-campo px-3 py-2.5 text-sm text-sutil">
      Esta rede ainda não tem escola.
      <Button variant="discreto" size="sm" onClick={aoNovaEscola} className="-my-1 text-tinta"><Plus /> Criar a primeira escola</Button>
    </div>
  )
}

function GrupoDaTabela({ grupo, colunas, acao, aoNovaEscola }: {
  grupo: Grupo; colunas: Coluna<EscolaNaTela>[]; acao: (e: EscolaNaTela) => ReactElement | null; aoNovaEscola: (redeId?: string) => void
}) {
  return (
    <>
      <TableRow className="border-linha bg-lateral hover:bg-lateral">
        <TableCell colSpan={colunas.length + 1} className="px-4 py-2"><CabecaDoGrupo grupo={grupo} /></TableCell>
      </TableRow>
      {grupo.escolas.length === 0 ? (
        <TableRow className="border-linha hover:bg-transparent">
          <TableCell colSpan={colunas.length + 1} className="px-4 py-2.5"><SemEscola aoNovaEscola={() => aoNovaEscola(grupo.rede.id)} /></TableCell>
        </TableRow>
      ) : grupo.escolas.map((e) => (
        <TableRow key={e.id} className="border-linha hover:bg-lateral/60">
          {colunas.map((c) => <TableCell key={c.titulo} className={cn('h-12 px-3 py-1.5 text-apoio first:pl-4', c.className)}>{c.celula(e)}</TableCell>)}
          <TableCell className="h-12 px-3 py-1.5 pr-4 text-right">{acao(e)}</TableCell>
        </TableRow>
      ))}
    </>
  )
}
