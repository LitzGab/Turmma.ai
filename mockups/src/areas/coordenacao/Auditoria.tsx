import { useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
import { Busca, Carimbo, Selo } from '@/components/duo'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AssinaturaIA } from '@/components/turmma/ia'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import { useAuditoriaDaDemo, type LinhaAuditoria } from '@/dados/ia'
import { FraseSemRanking, TabelaGrade, type ColunaGrade } from './_estrutura-pecas'

/* AUDITORIA, a aba de Registros (12ª rodada, polimento C1, 04/10/2026; plano 5.3). Não é log técnico: é o registro
   consultável de quem fez o quê, quando e para quê (regra 70; regra 20, item 10).
   No topo, a busca (turma, pessoa, aluno ou finalidade), o tipo e o período. As ações da demonstração
   (`useAuditoriaDaDemo`) entram no TOPO, antes das de sempre. A linha (56 px: O quê · Tipo · Quem · Quando, um selo
   só, o AGORA) abre ao lado (?item=). Saiu o "Exportar esta
   consulta" do ⋯: exportar mora em (Exportar dados), com finalidade. Não há ordem nem filtro por professor (D64). */

type Tipo = 'aprovacao' | 'nome' | 'exportacao' | 'conversa' | 'aviso' | 'permissao' | 'pausa'

const TIPOS: Record<Tipo, string> = {
  aprovacao: 'Aprovação',
  nome: 'Dados com nome',
  exportacao: 'Exportação',
  conversa: 'Trecho de conversa',
  aviso: 'Avisos e pedidos',
  permissao: 'Permissão',
  pausa: 'Pausa ou reativação',
}

type Registro = { id: string; quando: string; tipo: Tipo; oQue: string; autor: string; papel: string; finalidade: string; ia?: boolean; novo?: boolean }

const REGISTROS: Registro[] = [
  { id: 'a1', quando: '21/09, 9h50', tipo: 'aprovacao', oQue: 'Lista de estequiometria · 2ºB', autor: 'Camila Souza', papel: 'Professora da turma', finalidade: 'Enviar a atividade à turma', ia: true },
  { id: 'a2', quando: '21/09, 8h15', tipo: 'nome', oQue: 'Química abaixo de 6,0 por turma · 2º ano EM', autor: 'Helena Martins', papel: 'Coordenação', finalidade: 'Conversa com os professores da série' },
  { id: 'a3', quando: '19/09, 16h20', tipo: 'exportacao', oQue: 'Histórico de uso de IA · agosto · CSV', autor: 'Helena Martins', papel: 'Coordenação', finalidade: 'Relatório à mantenedora' },
  { id: 'a4', quando: '19/09, 8h05', tipo: 'conversa', oQue: 'Trecho do Tutor · 9ºA · aviso 30', autor: 'Helena Martins', papel: 'Coordenação', finalidade: 'Entender o que o aluno avisou' },
  { id: 'a5', quando: '18/09, 11h30', tipo: 'aprovacao', oQue: 'Lista de mol e massa molar · 2ºA', autor: 'Camila Souza', papel: 'Professora da turma', finalidade: 'Enviar a atividade à turma', ia: true },
  { id: 'a6', quando: '17/09, 9h02', tipo: 'permissao', oQue: 'Vínculo encerrado · professor substituto · 1ºC', autor: 'Helena Martins', papel: 'Coordenação', finalidade: 'Fim do contrato de substituição' },
  { id: 'a7', quando: '16/09, 14h48', tipo: 'aprovacao', oQue: 'Correção da atividade de vetores · 2ºB', autor: 'Rafael Antunes', papel: 'Professor da turma', finalidade: 'Enviar a correção aos alunos', ia: true },
  { id: 'a8', quando: '15/09, 10h10', tipo: 'nome', oQue: '1ºC · 5 alunos com três entregas faltando', autor: 'Helena Martins', papel: 'Coordenação', finalidade: 'Apoio aos alunos, com o professor da turma' },
  { id: 'a9', quando: '12/09, 9h40', tipo: 'pausa', oQue: 'Adaptação pausada e reativada no mesmo dia', autor: 'Helena Martins', papel: 'Coordenação', finalidade: 'Conferir a lista de tipos de adaptação' },
]

const PAPEL: Record<string, string> = { coordenacao: 'Coordenação', professor: 'Professor', aluno: 'Aluno', publico: 'Sem conta', operacao: 'Operação', rede: 'Secretaria', sistema: 'Sistema' }

/** De que tipo é uma ação da demonstração. */
function tipoDe(l: LinhaAuditoria): Tipo {
  if (/trecho|conversa/i.test(l.acao)) return 'conversa'
  if (/dado com nome/i.test(l.acao)) return 'nome'
  if (/Exportou/i.test(l.acao)) return 'exportacao'
  if (/Pausou|Reativou/i.test(l.acao)) return 'pausa'
  if (/Conselho|Retirou|Atendeu/i.test(l.acao)) return 'aviso'
  if (/pedido|nota/i.test(l.acao)) return 'aprovacao'
  return 'permissao'
}

const ALVO_LEGIVEL: Record<string, string> = { 'alerta-a1': 'Química do 2º ano', 'alerta-a2': '1ºC, entregas faltando' }

const daDemo = (l: LinhaAuditoria): Registro => ({
  id: l.id, quando: l.quando, tipo: tipoDe(l), oQue: [l.acao, ALVO_LEGIVEL[l.alvo] ?? l.alvo].filter(Boolean).join(' · '),
  autor: l.quem, papel: PAPEL[l.papel] ?? l.papel, finalidade: l.finalidade || '—', novo: true,
})

const PERIODOS: [string, string][] = [['set', 'Setembro'], ['ago', 'Agosto'], ['ano', 'Ano letivo']]

function PainelRegistro({ r, aoFechar }: { r: Registro | undefined; aoFechar: () => void }) {
  return (
    <PainelLado aberto={!!r} aoFechar={aoFechar} titulo={r ? TIPOS[r.tipo] : ''}>
      {r && (
        <div className="grid gap-5">
          <p className="t-cartao text-tinta">{r.oQue}</p>
          <dl className="grid gap-3">
            {[['Quem', `${r.autor} · ${r.papel}`], ['Quando', r.quando], ['Para quê', r.finalidade]].map(([t, v]) => (
              <div key={t}>
                <dt className="t-selo text-sutil">{t}</dt>
                <dd className="t-corpo text-tinta">{v}</dd>
              </div>
            ))}
          </dl>
          {r.ia && (
            <div className="grid gap-2">
              <AssinaturaIA id="assistente" />
              <Carimbo por={r.autor} quando={r.quando} className="justify-self-start" />
            </div>
          )}
          <p className="t-apoio flex items-start gap-1.5"><Lock aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} /> Só este recorte, nesta sessão.</p>
        </div>
      )}
    </PainelLado>
  )
}

/** A aba "Auditoria" de Registros. */
export function Auditoria() {
  const demo = useAuditoriaDaDemo()
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState<'todos' | Tipo>('todos')
  const [periodo, setPeriodo] = useState('set')
  const [item, setItem] = useParametro('item')

  const todos = useMemo(() => [...demo.map(daDemo), ...REGISTROS], [demo])
  const termo = busca.trim().toLowerCase()
  const visiveis = todos.filter((r) => (tipo === 'todos' || r.tipo === tipo)
    && (periodo !== 'ago' || r.quando.includes('/08'))
    && (!termo || `${r.oQue} ${r.autor} ${r.finalidade}`.toLowerCase().includes(termo)))
  const aberto = todos.find((r) => r.id === item)

  const novo = (r: Registro) => r.novo && <Selo familia="azul" tamanho="p">Agora</Selo>
  const colunas: ColunaGrade<Registro>[] = [
    { titulo: 'O quê', largura: 'minmax(0,3fr)', celula: (r) => (
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate" title={r.oQue}>{r.oQue}</span>
        {novo(r)}
      </span>
    ) },
    { titulo: 'Tipo', largura: 'minmax(0,1.2fr)', celula: (r) => <span className="truncate text-apoio">{TIPOS[r.tipo]}</span> },
    { titulo: 'Quem', largura: 'minmax(0,1.2fr)', celula: (r) => <span className="truncate text-apoio">{r.autor}</span> },
    { titulo: 'Quando', largura: '120px', alinhar: 'fim', celula: (r) => <span className="whitespace-nowrap tabular-nums text-apoio">{r.quando}</span> },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col max-md:overflow-y-auto">
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2">
        <Busca valor={busca} aoMudar={setBusca} rotulo="Turma, pessoa, aluno ou finalidade" className="min-w-0 flex-1 basis-full sm:basis-auto sm:flex-none sm:w-[380px]" />
        <Select value={tipo} onValueChange={(v) => setTipo(v as 'todos' | Tipo)}>
          <SelectTrigger aria-label="Tipo" className="min-w-0 flex-1 sm:w-56 sm:flex-none"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {(Object.keys(TIPOS) as Tipo[]).map((t) => <SelectItem key={t} value={t}>{TIPOS[t]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger aria-label="Período" className="min-w-0 flex-1 sm:w-40 sm:flex-none"><SelectValue /></SelectTrigger>
          <SelectContent>{PERIODOS.map(([v, n]) => <SelectItem key={v} value={v}>{n}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <TabelaGrade rotulo="Auditoria" colunas={colunas} grupos={[{ id: 'todos', linhas: visiveis }]} chave={(r) => r.id} altura={56}
        aoAbrir={(r) => setItem(r.id)} ativa={item} vazio="Nada com essa busca."
        celular={(r) => ({ titulo: r.oQue, apoio: `${r.quando} · ${TIPOS[r.tipo]} · ${r.autor}`, fim: novo(r) || undefined })} />
      <p className="t-apoio flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 px-1 pt-2.5"><span>Do mais novo para o mais antigo.</span><FraseSemRanking /></p>

      <PainelRegistro r={aberto} aoFechar={() => setItem(null)} />
    </div>
  )
}
