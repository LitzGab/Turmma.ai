import { useState } from 'react'
import { CalendarDays, Check, FileSpreadsheet, Link2, ListChecks, RefreshCw, Send, Upload, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger,
} from '@/components/ui/stepper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PintaTurma } from '@/components/marca/Pinta'
import { Estado } from '@/components/turmma/ia'
import { Cartao, NotaMockup, NumeroPainel, Tela } from '@/components/turmma/tela'
import { TURMAS } from '@/dados/escola'
import { cn } from '@/lib/utils'
import { Aviso, CANTO_DIALOGO, TabelaLista, type Coluna } from './_a-pecas'

/* Estrutura: a primeira coisa que a coordenação faz, e precisa ser rápida (D24).
   Séries, turmas, listas de nomes, grade e calendário IMPORTADOS; a escola aloca o professor, que só confirma (D3 revista).
   Importação em passos com originui/stepper (21st.dev · 778). */

const aba = 'h-9 rounded-linha px-3.5 text-sm font-medium text-apoio data-[state=active]:bg-superficie data-[state=active]:font-semibold data-[state=active]:text-tinta data-[state=active]:shadow-none'

type Alocacao = { id: string; professor: string; turma: string; disciplina: string; aulas: number; vinculo: 'confirmado' | 'esperando' }
const ALOCACOES: Alocacao[] = [
  { id: 'a1', professor: 'Camila Souza', turma: '2ºB', disciplina: 'Química', aulas: 3, vinculo: 'confirmado' },
  { id: 'a2', professor: 'Camila Souza', turma: '2ºA', disciplina: 'Química', aulas: 3, vinculo: 'confirmado' },
  { id: 'a3', professor: 'Camila Souza', turma: '1ºC', disciplina: 'Química', aulas: 2, vinculo: 'confirmado' },
  { id: 'a4', professor: 'Rafael Antunes', turma: '9ºA', disciplina: 'Ciências', aulas: 4, vinculo: 'confirmado' },
  { id: 'a5', professor: 'Marta Figueiredo', turma: '1ºC', disciplina: 'Matemática', aulas: 5, vinculo: 'esperando' },
  { id: 'a6', professor: '—', turma: '9ºA', disciplina: 'Geografia', aulas: 2, vinculo: 'esperando' },
]

type Convite = { id: string; professor: string; turmas: string; estado: 'confirmado' | 'enviado' | 'expirado'; detalhe: string }
const CONVITES: Convite[] = [
  { id: 'c1', professor: 'Camila Souza', turmas: '2ºA, 2ºB, 1ºC', estado: 'confirmado', detalhe: 'confirmou em 02/02' },
  { id: 'c2', professor: 'Rafael Antunes', turmas: '9ºA', estado: 'confirmado', detalhe: 'confirmou em 03/02' },
  { id: 'c3', professor: 'Marta Figueiredo', turmas: '1ºC', estado: 'enviado', detalhe: 'vale até 25/09 · uso único' },
  { id: 'c4', professor: 'Jonas Barreto', turmas: '6ºA, 6ºB', estado: 'expirado', detalhe: 'venceu em 12/09 sem uso' },
]
const ESTADO_CONVITE = {
  confirmado: <Estado tipo="ok">Confirmado</Estado>,
  enviado: <Estado tipo="pendente">Enviado</Estado>,
  expirado: <Estado tipo="erro">Expirado</Estado>,
}

const PASSOS = ['Arquivo', 'Conferir colunas', 'Corrigir o que veio torto', 'Importar']
const TORTOS = [
  { veio: ['2 B', '2º B', '2ºB'], sugestao: '2ºB', linhas: 32 },
  { veio: ['1o C', '1ºC'], sugestao: '1ºC', linhas: 34 },
  { veio: ['9 ano A'], sugestao: '9ºA', linhas: 28 },
]
const COLUNAS_PLANILHA = [
  { coluna: 'Coluna A · "Nome do aluno"', vira: 'Nome' },
  { coluna: 'Coluna B · "Matr."', vira: 'Matrícula' },
  { coluna: 'Coluna C · "Turma"', vira: 'Turma' },
  { coluna: 'Coluna D · "E-mail"', vira: 'Não importar' },
]

function Importacao({ aoFechar }: { aoFechar: () => void }) {
  const [passo, setPasso] = useState(1)
  const [aceitos, setAceitos] = useState<number[]>([])
  const pronto = aceitos.length === TORTOS.length
  return (
    <div className="grid gap-5">
      <Stepper value={passo} onValueChange={setPasso} className="gap-1">
        {PASSOS.map((p, i) => (
          <StepperItem key={p} step={i + 1} className="flex-1 max-md:items-start [&:last-child]:flex-none">
            <StepperTrigger className="gap-2 rounded-linha py-1 pr-1 max-md:flex-col max-md:items-start">
              <StepperIndicator className="size-7 bg-ia-cx text-[13px] text-apoio data-[state=active]:bg-noite data-[state=completed]:bg-ok data-[state=active]:text-white data-[state=completed]:text-white" />
              <StepperTitle className="font-corpo text-[13px] font-semibold text-tinta max-md:sr-only">{p}</StepperTitle>
            </StepperTrigger>
            {i < PASSOS.length - 1 && <StepperSeparator className="mx-2 bg-linha group-data-[state=completed]/step:bg-ok" />}
          </StepperItem>
        ))}
      </Stepper>
      <p className="rotulo md:hidden">Passo {passo} de 4 · {PASSOS[passo - 1]}</p>

      {passo === 1 && (
        <div className="grid gap-3">
          <div className="flex items-center gap-3 rounded-controle border border-linha p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-linha bg-ok-cx text-ok"><FileSpreadsheet className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-tinta">listas-2026-ensino-medio.xlsx</p>
              <p className="text-[13px] text-sutil">3 abas · 94 linhas · enviado agora</p>
            </div>
            <Button variant="discreto" size="sm"><RefreshCw /> Trocar</Button>
          </div>
          <p className="text-sm leading-relaxed text-apoio">Basta a lista de nomes por turma. Não pedimos cadastro completo: aluno não tem e-mail, telefone, CPF nem foto no sistema.</p>
        </div>
      )}

      {passo === 2 && (
        <div className="grid gap-2">
          {COLUNAS_PLANILHA.map((c) => (
            <div key={c.coluna} className="grid items-center gap-2 rounded-controle border border-linha p-3 sm:grid-cols-[1fr_200px]">
              <p className="text-[15px] text-tinta">{c.coluna}</p>
              <Select defaultValue={c.vira}>
                <SelectTrigger aria-label={`O que fazer com ${c.coluna}`} className="h-11 rounded-controle border-borda-campo bg-superficie text-[15px] md:h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-controle">
                  {['Nome', 'Matrícula', 'Turma', 'Não importar'].map((o) => <SelectItem key={o} value={o} className="rounded-linha">{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
          <Aviso tom="info">A coluna de e-mail fica de fora por padrão. O contato é sempre do responsável, nunca do aluno.</Aviso>
        </div>
      )}

      {passo === 3 && (
        <div className="grid gap-2">
          <p className="text-[15px] leading-relaxed text-apoio">A turma veio escrita de três jeitos. Confirme a sugestão de cada uma antes de importar.</p>
          {TORTOS.map((t, i) => {
            const ok = aceitos.includes(i)
            return (
              <div key={t.sugestao} className={cn('flex flex-wrap items-center gap-3 rounded-controle border p-3', ok ? 'border-transparent bg-ok-cx' : 'border-linha')}>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-tinta">{t.veio.map((v) => <code key={v} className="mr-1.5 rounded-[6px] bg-ia-cx px-1.5 py-0.5 font-corpo text-sm text-apoio">{v}</code>)}<span className="text-sutil">→</span> <b className="font-semibold">{t.sugestao}</b></p>
                  <p className="text-[13px] text-sutil">{t.linhas} linhas</p>
                </div>
                {ok ? <Estado tipo="ok">Conferido</Estado>
                  : <Button variant="secundario" size="sm" onClick={() => setAceitos((a) => [...a, i])}><Check /> É a mesma turma</Button>}
              </div>
            )
          })}
          <p className="text-[13px] text-sutil">Dois alunos com o mesmo nome no 2ºB: ficam os dois, diferenciados pela matrícula.</p>
        </div>
      )}

      {passo === 4 && (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <NumeroPainel rotulo="Turmas" valor="3" />
            <NumeroPainel rotulo="Nomes" valor="94" />
            <NumeroPainel rotulo="Ficaram de fora" valor="0" apoio="nenhuma linha recusada" />
          </div>
          <Aviso tom="info" titulo="O que acontece ao importar">As listas entram nas turmas. Cada aluno ainda precisa reivindicar o nome e ser aprovado pelo professor, ou entrar pela conta da escola. Nada aqui cria acesso sozinho.</Aviso>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-2 border-t border-linha pt-4">
        <Button variant="discreto" onClick={() => (passo === 1 ? aoFechar() : setPasso(passo - 1))}>{passo === 1 ? 'Cancelar' : 'Voltar'}</Button>
        {passo < 4
          ? <Button variant="secundario" disabled={passo === 3 && !pronto} onClick={() => setPasso(passo + 1)}>{passo === 3 && !pronto ? `Faltam ${TORTOS.length - aceitos.length} para conferir` : 'Continuar'}</Button>
          : <Button onClick={aoFechar}>Importar 94 nomes</Button>}
      </div>
    </div>
  )
}

export function Estrutura() {
  const [importando, setImportando] = useState(false)
  const [reenviados, setReenviados] = useState<string[]>([])
  const [conta, setConta] = useState<'nenhuma' | 'google'>('nenhuma')

  const colunasAlocacao: Coluna<Alocacao>[] = [
    { titulo: 'Professor', principal: true, celula: (a) => <span className={a.professor === '—' ? 'text-pendente' : 'font-medium text-tinta'}>{a.professor === '—' ? 'Sem professor alocado' : a.professor}</span> },
    { titulo: 'Turma', celula: (a) => <span className="inline-flex items-center gap-2"><PintaTurma turma={a.turma} className="h-6 w-6" />{a.turma}</span> },
    { titulo: 'Disciplina', celula: (a) => a.disciplina },
    { titulo: 'Aulas por semana', celula: (a) => <span className="tabular-nums">{a.aulas}</span> },
    { titulo: 'Vínculo', celula: (a) => a.professor === '—' ? <Button variant="secundario" size="sm">Alocar professor</Button>
      : a.vinculo === 'confirmado' ? <Estado tipo="ok">Confirmado pelo professor</Estado> : <Estado tipo="pendente">Esperando o professor confirmar</Estado> },
  ]

  const colunasConvite: Coluna<Convite>[] = [
    { titulo: 'Professor', principal: true, celula: (c) => <span className="font-medium text-tinta">{c.professor}</span> },
    { titulo: 'Turmas', celula: (c) => c.turmas },
    { titulo: 'Estado', celula: (c) => reenviados.includes(c.id) ? <Estado tipo="pendente">Enviado</Estado> : ESTADO_CONVITE[c.estado] },
    { titulo: 'Validade', celula: (c) => <span className="text-sutil">{reenviados.includes(c.id) ? 'vale até 28/09 · uso único' : c.detalhe}</span> },
    { titulo: '', className: 'text-right', celula: (c) => c.estado === 'confirmado' ? <span className="text-[13px] text-sutil">—</span>
      : reenviados.includes(c.id) ? <Button variant="perigo" size="sm">Revogar</Button>
      : <Button variant="discreto" size="sm" onClick={() => setReenviados((r) => [...r, c.id])}><Send /> {c.estado === 'expirado' ? 'Gerar novo convite' : 'Reenviar'}</Button> },
  ]

  return (
    <Tela titulo="Estrutura da escola"
      descricao="Séries, turmas, listas, grade e calendário entram por importação. O professor não monta nada: só confirma o vínculo."
      acoes={<Button onClick={() => setImportando(true)}><Upload /> Importar planilha</Button>}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NumeroPainel rotulo="Séries" valor="7" apoio="6º ao 9º ano e 1º ao 3º EM" />
        <NumeroPainel rotulo="Turmas" valor="22" apoio="ano letivo de 2026" />
        <NumeroPainel rotulo="Alunos nas listas" valor="684" apoio={<span className="font-medium text-ok">612 já com acesso</span>} />
        <NumeroPainel rotulo="Professores" valor="31" apoio={<span className="font-medium text-pendente">2 convites em aberto</span>} />
      </div>

      <Tabs defaultValue="turmas" className="mt-6">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-controle bg-ia-cx p-1 sm:w-auto">
          <TabsTrigger value="turmas" className={aba}>Turmas</TabsTrigger>
          <TabsTrigger value="alocacao" className={aba}>Alocação</TabsTrigger>
          <TabsTrigger value="convites" className={aba}>Convites</TabsTrigger>
          <TabsTrigger value="grade" className={aba}>Grade e calendário</TabsTrigger>
          <TabsTrigger value="contas" className={aba}>Conta da escola</TabsTrigger>
        </TabsList>

        <TabsContent value="turmas" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {TURMAS.map((t) => (
              <article key={t.id} className="rounded-cartao border border-linha bg-superficie p-4">
                <div className="flex items-center gap-3">
                  <PintaTurma turma={t.nome} className="h-10 w-10" />
                  <div><h2 className="font-corpo text-base font-semibold text-tinta">{t.nome}</h2><p className="text-[13px] text-sutil">{t.serie} · {t.turno}</p></div>
                </div>
                <dl className="mt-4 grid gap-1.5 text-sm">
                  <div className="flex justify-between"><dt className="text-sutil">Na lista</dt><dd className="font-medium tabular-nums text-tinta">{t.alunos} nomes</dd></div>
                  <div className="flex justify-between"><dt className="text-sutil">Com acesso</dt><dd className="font-medium tabular-nums text-tinta">{t.alunos - (t.id === '1c' ? 6 : 1)}</dd></div>
                  <div className="flex justify-between"><dt className="text-sutil">Lista importada em</dt><dd className="text-apoio">02/02/2026</dd></div>
                </dl>
                <Button variant="discreto" size="sm" className="mt-3 -ml-2"><Users /> Ver lista de nomes</Button>
              </article>
            ))}
          </div>
          <p className="mt-3 text-sm text-sutil">Mostrando 4 de 22 turmas. Cada turma tem a pinta dela, sempre a mesma, e pertence ao ano letivo de 2026.</p>
        </TabsContent>

        <TabsContent value="alocacao" className="mt-4">
          <Cartao titulo="Professor × turma × disciplina">
            <TabelaLista colunas={colunasAlocacao} linhas={ALOCACOES} chave={(a) => a.id} />
            <p className="mt-4 text-sm leading-relaxed text-sutil">O vínculo é definido pela escola, aqui ou pela grade importada. Vínculo declarado pelo próprio professor não dá acesso a aluno.</p>
          </Cartao>
        </TabsContent>

        <TabsContent value="convites" className="mt-4">
          <Cartao titulo="Convites de professor" acao={<Button variant="secundario" size="sm"><Send /> Convidar professor</Button>}>
            <TabelaLista colunas={colunasConvite} linhas={CONVITES} chave={(c) => c.id} />
            <p className="mt-4 text-sm leading-relaxed text-sutil">Cada convite é um link único, com validade de sete dias, que funciona uma vez só e pode ser revogado. Não existe cadastro aberto.</p>
          </Cartao>
        </TabsContent>

        <TabsContent value="grade" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Cartao titulo={<span className="inline-flex items-center gap-2"><ListChecks className="size-[18px] text-sutil" /> Grade horária</span>} acao={<Estado tipo="ok">Importada</Estado>}>
              <p className="text-[15px] leading-relaxed text-apoio">138 aulas por semana, em 22 turmas. Importada de <b className="font-semibold text-tinta">grade-2026.xlsx</b> em 02/02/2026.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] border-separate border-spacing-1 text-center text-[13px]">
                  <thead><tr>{['2ºB', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((d) => <th key={d} className="rotulo pb-1.5">{d}</th>)}</tr></thead>
                  <tbody>
                    {[['7h30', 'Mat', 'Quí', 'Port', 'Fís', 'Mat'], ['8h20', 'Mat', 'Quí', 'Hist', 'Fís', 'Bio'], ['9h10', 'Port', 'Geo', 'Quí', 'Ing', 'Bio']].map((l) => (
                      <tr key={l[0]}>{l.map((c, i) => <td key={i} className={cn('rounded-linha px-1 py-2', i === 0 ? 'text-sutil tabular-nums' : c === 'Quí' ? 'bg-creme font-semibold text-caramelo-texto' : 'bg-ia-cx text-apoio')}>{c}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Cartao>
            <Cartao titulo={<span className="inline-flex items-center gap-2"><CalendarDays className="size-[18px] text-sutil" /> Calendário letivo</span>} acao={<Estado tipo="ok">Importado</Estado>}>
              <ul className="grid gap-2 text-[15px]">
                {[['3º bimestre', '03/08 a 02/10'], ['Semana de provas', '28/09 a 02/10'], ['Feriado · Nossa Senhora Aparecida', '12/10'], ['4º bimestre', '05/10 a 11/12']].map(([n, d]) => (
                  <li key={n} className="flex justify-between gap-3 rounded-controle border border-linha px-3 py-2.5"><span className="text-tinta">{n}</span><span className="shrink-0 tabular-nums text-sutil">{d}</span></li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-sutil">É daqui que sai o calendário de cada professor. Ele preenche o que vai dar na aula; não inventa a grade.</p>
            </Cartao>
          </div>
        </TabsContent>

        <TabsContent value="contas" className="mt-4">
          <Cartao titulo="Entrar com a conta da escola" acao={conta === 'google' ? <Estado tipo="ok">Conectada</Estado> : <Estado tipo="contorno">Opcional · desligada</Estado>}>
            <p className="max-w-[72ch] text-[15px] leading-relaxed text-apoio">
              Se a escola usa Google ou Microsoft, professor e aluno entram com a conta que já têm, e as turmas podem vir de lá.
              Guardamos <b className="font-semibold text-tinta">só o identificador da conta</b>. E-mail e foto que o provedor devolve são descartados antes de gravar.
            </p>
            {conta === 'nenhuma' ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button variant="secundario" onClick={() => setConta('google')}><Link2 /> Conectar Google Workspace</Button>
                <Button variant="secundario"><Link2 /> Conectar Microsoft 365</Button>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-controle bg-ok-cx p-3.5">
                <p className="text-[15px] text-ok"><b className="font-semibold">Google Workspace</b> · domínio da escola · 684 contas de aluno reconhecidas</p>
                <Button variant="perigo" size="sm" onClick={() => setConta('nenhuma')}>Desconectar</Button>
              </div>
            )}
            <p className="mt-3 text-sm text-sutil">Sem conta da escola, o aluno entra com escola + matrícula + senha. Desconectar leva um clique, igual a conectar.</p>
          </Cartao>
        </TabsContent>
      </Tabs>

      <Dialog open={importando} onOpenChange={setImportando}>
        <DialogContent className={cn(CANTO_DIALOGO, 'max-h-[92svh] max-w-2xl overflow-y-auto')}>
          <DialogHeader className="text-left">
            <DialogTitle className="font-titulo text-[20px] font-semibold tracking-[-0.02em] text-tinta">Importar listas de nomes</DialogTitle>
            <DialogDescription className="text-[15px] text-apoio">Quatro passos. Nada entra antes de você conferir.</DialogDescription>
          </DialogHeader>
          <Importacao aoFechar={() => setImportando(false)} />
        </DialogContent>
      </Dialog>

      <NotaMockup>
        No MVP de apresentação (A1) esta tela é <b>só leitura</b>, vinda do seed sintético; importação, convites e conta da escola são do F2
        (e o login federado, do F1). D3 revista: a coordenação importa e aloca, o professor só confirma. D48: só o identificador opaco da conta.
        Regra 20, itens 2 e 8: aluno sem e-mail; convite com validade, uso único e revogação. Regra 60, itens 5 e 8: tudo pertence ao ano letivo,
        e o calendário do professor deriva daqui.
      </NotaMockup>
    </Tela>
  )
}
