import { useState } from 'react'
import { Plus, SlidersHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PintaTurma } from '@/components/marca/Pinta'
import { Campo, TIPOS_ADAPTACAO } from '@/components/turmma/ferramentas'
import { Estado } from '@/components/turmma/ia'
import { Cartao, NotaMockup, NumeroPainel, Tela } from '@/components/turmma/tela'
import { ALUNOS_2B, COORDENADORA, TURMAS, hoje } from '@/dados/escola'
import { cn } from '@/lib/utils'
import { Aviso, CANTO_DIALOGO, TabelaLista, type Coluna } from './_a-pecas'

/* Adaptações: a coordenação registra a ADAPTAÇÃO NECESSÁRIA por aluno — nunca o diagnóstico, o laudo ou o CID (D35).
   Os tipos são a mesma lista fechada da ferramenta Adaptação, e não existe campo de texto livre em lugar nenhum desta tela.
   O professor da turma vê; todo acesso fica em auditoria. É dado sensível de menor (regra 20, item 3). */

type Registro = { id: string; aluno: string; turma: string; tipos: string[]; validade: string; por: string }

const INICIAIS: Registro[] = [
  { id: 'r1', aluno: 'Daniela Rocha', turma: '2ºB', tipos: ['fonte'], validade: 'Ano letivo de 2026', por: 'Helena Martins · 10/02' },
  { id: 'r2', aluno: 'Nicolas Dias', turma: '2ºB', tipos: ['fonte', 'tempo'], validade: 'Ano letivo de 2026', por: 'Helena Martins · 10/02' },
  { id: 'r3', aluno: 'Rafael Moura', turma: '1ºC', tipos: ['direto', 'menos'], validade: 'Até 02/10/2026', por: 'Helena Martins · 03/08' },
  { id: 'r4', aluno: 'Sofia Andrade', turma: '9ºA', tipos: ['escrita'], validade: 'Ano letivo de 2026', por: 'Helena Martins · 12/02' },
]

const VALIDADES = ['Ano letivo de 2026', 'Até o fim do 3º bimestre (02/10/2026)', 'Até o fim do 4º bimestre (11/12/2026)']
const nomeTipo = (id: string) => TIPOS_ADAPTACAO.find((t) => t.id === id)?.nome ?? id
const campo = 'h-11 rounded-controle border-borda-campo bg-superficie text-[15px] md:h-10'

export function Adaptacoes() {
  const [registros, setRegistros] = useState(INICIAIS)
  const [turma, setTurma] = useState('todas')
  const [aberto, setAberto] = useState(false)
  // campos do diálogo
  const [aluno, setAluno] = useState('')
  const [tipos, setTipos] = useState<string[]>([])
  const [validade, setValidade] = useState(VALIDADES[0])

  const linhas = registros.filter((r) => turma === 'todas' || r.turma === turma)
  const alternar = (id: string) => setTipos((t) => t.includes(id) ? t.filter((x) => x !== id) : [...t, id])
  const fechar = () => { setAberto(false); setAluno(''); setTipos([]); setValidade(VALIDADES[0]) }
  const salvar = () => {
    setRegistros((l) => [{ id: `n${l.length}`, aluno, turma: '2ºB', tipos, validade: validade.replace(/ \(.*/, ''), por: `${COORDENADORA.nome} · ${hoje.curta}` }, ...l])
    fechar()
  }

  const colunas: Coluna<Registro>[] = [
    { titulo: 'Aluno', principal: true, celula: (r) => <span className="font-medium text-tinta">{r.aluno}</span> },
    { titulo: 'Turma', celula: (r) => <span className="inline-flex items-center gap-2"><PintaTurma turma={r.turma} className="h-6 w-6" />{r.turma}</span> },
    { titulo: 'Adaptação necessária', celula: (r) => <span className="inline-flex flex-wrap justify-end gap-1.5 md:justify-start">{r.tipos.map((t) => <Estado key={t} tipo="info">{nomeTipo(t)}</Estado>)}</span> },
    { titulo: 'Vale', celula: (r) => r.validade },
    { titulo: 'Registrado por', celula: (r) => <span className="text-sutil">{r.por}</span> },
    { titulo: '', className: 'text-right', celula: (r) => (
      <Button variant="perigo" size="sm" aria-label={`Encerrar a adaptação de ${r.aluno}`} onClick={() => setRegistros((l) => l.filter((x) => x.id !== r.id))}><Trash2 /> Encerrar</Button>
    ) },
  ]

  return (
    <Tela titulo="Adaptações"
      descricao="Aqui a escola registra a adaptação de que o aluno precisa — a forma da prova e da atividade. Nunca o diagnóstico."
      acoes={<Button onClick={() => setAberto(true)}><Plus /> Registrar adaptação</Button>}>
      <div className="grid gap-3 sm:grid-cols-3">
        <NumeroPainel rotulo="Alunos com adaptação" valor={registros.length} apoio="em 3 turmas" />
        <NumeroPainel rotulo="Tipo mais registrado" valor={<span className="text-[22px]">Fonte ampliada</span>} apoio="2 alunos" />
        <NumeroPainel rotulo="Vencem neste bimestre" valor="1" apoio="1ºC · até 02/10" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Aviso tom="info" titulo="O que entra aqui, e o que não entra">
          Entra <b>o que fazer</b>: fonte ampliada, tempo adicional, enunciado direto. Não entra laudo, CID, diagnóstico nem observação sobre o
          aluno — por isso não existe campo de texto nesta tela. O plano individual (PEI) continua sendo feito pela equipe da escola, fora do sistema.
        </Aviso>
        <Aviso tom="trava" titulo="Quem vê">
          Só o professor da turma vê a adaptação do aluno dele, e o Adaptador recebe apenas o tipo. Todo acesso a esta tela fica em auditoria,
          com nome, data e finalidade.
        </Aviso>
      </div>

      <Cartao className="mt-4" titulo="Adaptações registradas"
        acao={
          <Select value={turma} onValueChange={setTurma}>
            <SelectTrigger aria-label="Filtrar por turma" className="h-10 w-[160px] rounded-controle border-borda-campo bg-superficie text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-controle">
              <SelectItem value="todas" className="rounded-linha">Todas as turmas</SelectItem>
              {TURMAS.map((t) => <SelectItem key={t.id} value={t.nome} className="rounded-linha">{t.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        }>
        {linhas.length > 0
          ? <TabelaLista colunas={colunas} linhas={linhas} chave={(r) => r.id} />
          : (
            <EmptyState className="mx-auto max-w-none rounded-cartao border border-dashed border-linha bg-fundo p-10 hover:bg-fundo"
              icons={[SlidersHorizontal]} title="Nenhuma adaptação nesta turma"
              description="Registre a adaptação de que o aluno precisa. O professor da turma passa a ver, e o Adaptador prepara a versão para ele aprovar."
              action={{ label: 'Registrar adaptação', onClick: () => setAberto(true) }} />
          )}
      </Cartao>

      <Dialog open={aberto} onOpenChange={(v) => (v ? setAberto(true) : fechar())}>
        <DialogContent className={cn(CANTO_DIALOGO, 'max-h-[92svh] max-w-xl overflow-y-auto')}>
          <DialogHeader className="text-left">
            <DialogTitle className="font-titulo text-[20px] font-semibold tracking-[-0.02em] text-tinta">Registrar adaptação</DialogTitle>
            <DialogDescription className="text-[15px] text-apoio">Escolha o aluno, o tipo de adaptação e até quando vale. Só isso fica guardado.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); salvar() }}>
            <div className="grid gap-4 sm:grid-cols-[.7fr_1.3fr]">
              <Campo rotulo="Turma">{(id) => (
                <Select defaultValue="2ºB">
                  <SelectTrigger id={id} className={campo}><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-controle">{TURMAS.map((t) => <SelectItem key={t.id} value={t.nome} className="rounded-linha">{t.nome}</SelectItem>)}</SelectContent>
                </Select>
              )}</Campo>
              <Campo rotulo="Aluno">{(id) => (
                <Select value={aluno} onValueChange={setAluno}>
                  <SelectTrigger id={id} className={campo}><SelectValue placeholder="Escolha na lista da turma" /></SelectTrigger>
                  <SelectContent className="max-h-64 rounded-controle">{ALUNOS_2B.map((a) => <SelectItem key={a} value={a} className="rounded-linha">{a}</SelectItem>)}</SelectContent>
                </Select>
              )}</Campo>
            </div>

            <fieldset>
              <legend className="mb-2 text-[13px] font-semibold text-apoio">Tipo de adaptação</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {TIPOS_ADAPTACAO.map((t) => {
                  const marcado = tipos.includes(t.id)
                  return (
                    <label key={t.id} className={cn('flex min-h-[60px] cursor-pointer items-start gap-3 rounded-controle border p-3 transition-colors duration-150',
                      marcado ? 'border-noite bg-info-cx' : 'border-linha bg-superficie hover:bg-realce')}>
                      <Checkbox checked={marcado} onCheckedChange={() => alternar(t.id)}
                        className="mt-0.5 size-5 rounded-[6px] border-borda-campo data-[state=checked]:border-noite data-[state=checked]:bg-noite data-[state=checked]:text-white" />
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold leading-snug text-tinta">{t.nome}</span>
                        <span className="block text-[13px] leading-snug text-sutil">{t.detalhe}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <Campo rotulo="Vale até">{(id) => (
              <Select value={validade} onValueChange={setValidade}>
                <SelectTrigger id={id} className={campo}><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-controle">{VALIDADES.map((v) => <SelectItem key={v} value={v} className="rounded-linha">{v}</SelectItem>)}</SelectContent>
              </Select>
            )}</Campo>

            <p className="rounded-controle bg-ia-cx p-3 text-[13px] leading-snug text-apoio">
              Precisa de um tipo que não está na lista? Fale com a gente: a lista cresce, mas continua fechada — é o que impede um diagnóstico de acabar escrito aqui.
            </p>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button type="button" variant="discreto" onClick={fechar}>Cancelar</Button>
              <Button type="submit" variant="oficial" disabled={!aluno || tipos.length === 0}>Registrar adaptação</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <NotaMockup>
        Entra no roteiro pelo seed (A2: a turma já tem adaptação registrada quando a professora pede a versão adaptada); a tela completa é do F12.
        D35 e D67: registra-se a adaptação necessária, por tipo, sem texto livre. Regra 20, itens 3 e 10: dado sensível, com acesso auditado.
        "Registrar" é botão <i>oficial</i> porque é decisão sobre aluno, tomada por uma pessoa da escola. Base legal da adaptação a confirmar com advogado (TODO.md).
      </NotaMockup>
    </Tela>
  )
}
