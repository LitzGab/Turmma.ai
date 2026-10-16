import { useState } from 'react'
import { Check, Download, FileSearch, Search, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AvatarAgente, Estado, LinhaAprovacao, SeloIA } from '@/components/turmma/ia'
import { NotaMockup, Tela } from '@/components/turmma/tela'
import { AGENTES, type AgenteId } from '@/dados/agentes'
import { campo, dialogo, Par, TabelaResponsiva, type Coluna } from './_b-pecas'

/* Auditoria: para qualquer item, o que a IA gerou, quem aprovou e quando (regra 70, item 6).
   Auditoria não é log técnico: é registro consultável, com autor, data e FINALIDADE (regra 20, item 10). */

type Tipo = 'aprovacao' | 'nominal' | 'exportacao' | 'conversa' | 'permissao'

const TIPOS: Record<Tipo, string> = {
  aprovacao: 'Aprovação de saída de IA',
  nominal: 'Leitura nominal de indicador',
  exportacao: 'Exportação',
  conversa: 'Abertura de conversa de aluno',
  permissao: 'Alteração de permissão',
}

type Registro = { id: string; quando: string; tipo: Tipo; oQue: string; autor: string; papel: string; finalidade: string; agente?: AgenteId }

const REGISTROS: Registro[] = [
  { id: 'a1', quando: '21/09, 10h42', tipo: 'aprovacao', oQue: '32 correções · Prova de estequiometria · 2ºB', autor: 'Camila Souza', papel: 'Professora da turma', finalidade: 'Liberar o diagnóstico aos alunos', agente: 'corretor' },
  { id: 'a2', quando: '21/09, 10h44', tipo: 'aprovacao', oQue: 'Versão adaptada · Prova de estequiometria · 2ºB', autor: 'Camila Souza', papel: 'Professora da turma', finalidade: 'Entregar a versão adaptada a quem tem adaptação registrada', agente: 'adaptador' },
  { id: 'a3', quando: '21/09, 8h15', tipo: 'nominal', oQue: 'Desempenho por turma · Química · 2º ano EM', autor: 'Helena Martins', papel: 'Coordenação', finalidade: 'Acompanhar a habilidade em queda apontada pelo Analista' },
  { id: 'a4', quando: '19/09, 16h20', tipo: 'exportacao', oQue: 'Histórico de uso de IA · agosto · CSV', autor: 'Helena Martins', papel: 'Coordenação', finalidade: 'Relatório para a mantenedora' },
  { id: 'a5', quando: '19/09, 8h05', tipo: 'conversa', oQue: 'Trecho de sessão do Tutor · 9ºA · notificação N-2026-0030', autor: 'Marta Silveira', papel: 'Orientação educacional', finalidade: 'Analisar notificação feita pelo aluno' },
  { id: 'a6', quando: '18/09, 11h30', tipo: 'aprovacao', oQue: 'Lista de mol e massa molar · 2ºA', autor: 'Camila Souza', papel: 'Professora da turma', finalidade: 'Atribuir a atividade à turma', agente: 'assistente' },
  { id: 'a7', quando: '17/09, 9h02', tipo: 'permissao', oQue: 'Vínculo encerrado · professor substituto · 1ºC', autor: 'Helena Martins', papel: 'Coordenação', finalidade: 'Fim do contrato de substituição' },
  { id: 'a8', quando: '16/09, 14h48', tipo: 'aprovacao', oQue: 'Diagnóstico por habilidade · Atividade de reações · 9ºA', autor: 'Rafael Antunes', papel: 'Professor da turma', finalidade: 'Liberar o diagnóstico aos alunos', agente: 'corretor' },
  { id: 'a9', quando: '15/09, 10h10', tipo: 'nominal', oQue: 'Aluno em risco · 1ºC · 5 alunos com três entregas faltando', autor: 'Helena Martins', papel: 'Coordenação', finalidade: 'Combinar plano de recuperação com o professor' },
]

const APRESENTADO = ['32 correções, média 6,4 e a distribuição das notas', '5 destaques fora da curva, no topo', 'Relatório por questão, com a questão 7 marcada (28 erros em 32)']
/* Sem nome de aluno: o nominal é do professor da turma (D34). E saída da aba não aparece para a coordenação (D70). */
const ABERTOS = [
  ['Nota muito abaixo do histórico do aluno', '10h36'], ['Prova em branco', '10h37'],
  ['Questão 7 com erro em 26 de 30', '10h38'], ['Questão 4 com padrão de erro suspeito', '10h39'], ['Nota muito acima do histórico do aluno', '10h41'],
]

export function Auditoria() {
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState<'todos' | Tipo>('todos')
  const [abertoId, setAbertoId] = useState<string | null>(null)

  const termo = busca.trim().toLowerCase()
  const visiveis = REGISTROS.filter((r) => (tipo === 'todos' || r.tipo === tipo)
    && (!termo || `${r.oQue} ${r.autor} ${r.finalidade}`.toLowerCase().includes(termo)))
  const aberto = REGISTROS.find((r) => r.id === abertoId)

  const colunas: Coluna<Registro>[] = [
    { titulo: 'O quê', celula: (r) => (
      <span className="flex items-start gap-2.5">
        {r.agente ? <AvatarAgente id={r.agente} tamanho={24} className="mt-0.5" /> : <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-[24%] bg-ia-cx text-apoio"><FileSearch className="size-3.5" /></span>}
        <span className="min-w-0"><span className="block font-medium leading-snug text-tinta">{r.oQue}</span><span className="text-[13px] text-sutil">{TIPOS[r.tipo]}</span></span>
      </span>
    ) },
    { titulo: 'Quando', celula: (r) => <span className="whitespace-nowrap tabular-nums">{r.quando}</span> },
    { titulo: 'Autor', celula: (r) => <><span className="block text-tinta">{r.autor}</span><span className="text-[13px] text-sutil">{r.papel}</span></> },
    { titulo: 'Finalidade', celula: (r) => <span className="leading-snug">{r.finalidade}</span>, classe: 'max-w-[260px]' },
  ]

  return (
    <Tela titulo="Auditoria"
      descricao="Para qualquer item: o que a IA gerou, quem aprovou e quando. Não é log técnico — é registro consultável, com autor, data e finalidade."
      acoes={<Button variant="secundario"><Download /> Exportar esta consulta</Button>}>

      <div className="grid gap-3 rounded-cartao border border-linha bg-superficie p-4 sm:grid-cols-[1.6fr_1fr_.8fr] lg:p-5">
        <div className="grid gap-1.5">
          <Label htmlFor="busca-aud" className="text-[13px] font-semibold text-apoio">Buscar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sutil" />
            <Input id="busca-aud" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Avaliação, turma, autor, finalidade…" className={`${campo} pl-9`} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tipo-aud" className="text-[13px] font-semibold text-apoio">Tipo de evento</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as 'todos' | Tipo)}>
            <SelectTrigger id="tipo-aud" className={campo}><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-controle">
              <SelectItem value="todos" className="rounded-linha">Todos os eventos</SelectItem>
              {(Object.keys(TIPOS) as Tipo[]).map((t) => <SelectItem key={t} value={t} className="rounded-linha">{TIPOS[t]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="periodo-aud" className="text-[13px] font-semibold text-apoio">Período</Label>
          <Select defaultValue="set">
            <SelectTrigger id="periodo-aud" className={campo}><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-controle">
              {[['set', 'Setembro de 2026'], ['ago', 'Agosto de 2026'], ['bim', '3º bimestre'], ['ano', 'Ano letivo de 2026']].map(([v, n]) => <SelectItem key={v} value={v} className="rounded-linha">{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="mb-3 mt-5 text-sm text-sutil" role="status">{visiveis.length} {visiveis.length === 1 ? 'registro' : 'registros'} · do mais recente para o mais antigo. Não há ordenação nem filtro por professor.</p>

      {visiveis.length === 0 ? (
        <EmptyState className="mx-auto max-w-none rounded-cartao border border-dashed border-linha bg-superficie p-10 hover:bg-superficie [&_.shadow-lg]:shadow-none"
          icons={[SearchX]} title="Nenhum registro com esse filtro" description="Tente outro período ou outro tipo de evento."
          action={{ label: 'Limpar a busca', onClick: () => { setBusca(''); setTipo('todos') } }} />
      ) : (
        <TabelaResponsiva colunas={colunas} linhas={visiveis} chave={(r) => r.id}
          acao={(r) => <Button variant="secundario" size="sm" onClick={() => setAbertoId(r.id)}>Ver registro</Button>} />
      )}

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAbertoId(null)}>
        <DialogContent className={`${dialogo} max-w-xl`}>
          {aberto && (
            <>
              <DialogHeader className="space-y-1.5 pr-6 text-left">
                <p className="rotulo">{aberto.tipo === 'aprovacao' ? 'Registro da validação' : TIPOS[aberto.tipo]}</p>
                <DialogTitle className="font-corpo text-base font-semibold leading-snug tracking-normal text-tinta">{aberto.oQue}</DialogTitle>
                <DialogDescription className="text-sm text-sutil">{aberto.quando} · {aberto.autor} · {aberto.papel}</DialogDescription>
              </DialogHeader>

              {aberto.tipo === 'aprovacao' && aberto.agente ? (
                <>
                  <Par rotulo="O que a IA gerou">
                    <p className="flex flex-wrap items-center gap-2 text-apoio"><AvatarAgente id={aberto.agente} tamanho={24} /><b className="font-semibold text-tinta">{AGENTES[aberto.agente].nome}</b><SeloIA /> · a partir de Química 2, cap. 7 · gerado em 21/09, 9h50</p>
                  </Par>
                  <Par rotulo="O que foi apresentado a quem validou">
                    <ul className="grid list-disc gap-1 pl-5 text-sm text-apoio">{APRESENTADO.map((a) => <li key={a}>{a}</li>)}</ul>
                  </Par>
                  <Par rotulo="O que foi aberto antes de confirmar · 5 de 5">
                    <ul className="grid gap-1.5 text-sm">
                      {ABERTOS.map(([d, h]) => (
                        <li key={d} className="flex items-center gap-2.5 rounded-linha bg-ok-cx px-2.5 py-1.5 text-ok">
                          <Check className="size-3.5 shrink-0" strokeWidth={2.6} /><span className="min-w-0 flex-1">{d}</span><span className="shrink-0 tabular-nums">aberto às {h}</span>
                        </li>
                      ))}
                    </ul>
                  </Par>
                  <p className="-mt-2 text-[13px] text-sutil">O nome de cada aluno aparece só para o professor da turma.</p>
                  <Par rotulo="Quem confirmou e quando"><LinhaAprovacao verbo="Validação registrada ·" por={aberto.autor} quando={aberto.quando} /></Par>
                  <Par rotulo="O que aconteceu depois"><p className="text-sm text-apoio">{aberto.finalidade}. Não é nota: é diagnóstico formativo por habilidade (D46).</p></Par>
                </>
              ) : (
                <>
                  <Par rotulo="Finalidade declarada"><p className="text-apoio">{aberto.finalidade}</p></Par>
                  <Par rotulo="O que foi acessado"><p className="text-sm text-apoio">{aberto.oQue}. O acesso ficou limitado a este recorte e a esta sessão.</p></Par>
                  {aberto.tipo === 'nominal' && <Estado tipo="info">O professor foi avisado de que o dado das turmas dele foi aberto</Estado>}
                </>
              )}

              <DialogFooter className="gap-2 sm:space-x-0">
                <Button variant="secundario" onClick={() => setAbertoId(null)}>Fechar</Button>
                <Button variant="secundario"><Download /> Exportar este registro</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <NotaMockup>
        F12 (com o registro nascendo no F6 e no F11) · fora do MVP de apresentação como tela própria; no MVP a consulta aparece dentro da Governança (A5).
        Aplica regra 70 item 6, D56 (registro da validação: o que foi apresentado, o que foi aberto, quem confirmou), D45 e D34 (nominal só com auditoria),
        D64 (sem filtro nem ordenação por professor) e regra 20 item 10 (auditoria tem autor, data e finalidade).
      </NotaMockup>
    </Tela>
  )
}
