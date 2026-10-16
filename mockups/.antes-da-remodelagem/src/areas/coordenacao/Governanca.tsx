import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FileDown, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AvatarAgente, Estado, SeloIA } from '@/components/turmma/ia'
import { BarraRotulada, Cartao, NotaMockup, NumeroPainel, Tela } from '@/components/turmma/tela'
import { agente, type AgenteId } from '@/dados/agentes'
import { HABILIDADES } from '@/dados/escola'
import { Aviso, DialogoNominal, RegistroAuditoria, TabelaLista, type Coluna } from './_a-pecas'

/* Governança de IA (11.7) — a tela que fecha a venda e a que a coordenação abre na reunião.
   Quatro números, a consulta "o que a IA gerou e quem aprovou" (regra 70, item 6) e o uso em AGREGADO.
   Nenhuma coluna, filtro ou ordenação por professor (D45, D64). */

type Registro = {
  id: string; quando: string; agente: AgenteId; oQue: string; turma: string
  estado: 'aprovado' | 'esperando' | 'rejeitado' | 'rascunho'; por?: string
}

// "Aprovado por" é o registro da validação humana — o nome de quem aprovou é o que a regra 70 exige.
// Não é indicador de uso: a tabela não agrupa, não filtra e não ordena por pessoa.
const REGISTROS: Registro[] = [
  { id: 'r1', quando: '21/09 · 09h50', agente: 'corretor', oQue: 'Diagnóstico de 30 provas de estequiometria', turma: '2ºB', estado: 'esperando' },
  { id: 'r2', quando: '21/09 · 09h12', agente: 'adaptador', oQue: 'Versão adaptada · fonte ampliada', turma: '2ºB', estado: 'aprovado', por: 'Camila Souza · 10h42' },
  { id: 'r3', quando: '21/09 · 08h40', agente: 'assistente', oQue: 'Prova de estequiometria, 10 questões', turma: '2ºB', estado: 'rascunho' },
  { id: 'r4', quando: '18/09 · 16h05', agente: 'corretor', oQue: 'Diagnóstico da lista de reações químicas', turma: '9ºA', estado: 'aprovado', por: 'Rafael Antunes · 18/09, 17h20' },
  { id: 'r5', quando: '18/09 · 14h31', agente: 'adaptador', oQue: 'Versão adaptada · enunciado direto', turma: '1ºC', estado: 'rejeitado', por: 'Marta Figueiredo · 18/09, 15h02' },
  { id: 'r6', quando: '18/09 · 11h18', agente: 'assistente', oQue: 'Plano de duas aulas · reagente limitante', turma: '2ºA', estado: 'rascunho' },
  { id: 'r7', quando: '17/09 · 10h02', agente: 'corretor', oQue: 'Diagnóstico do simulado de Ciências', turma: '9ºA', estado: 'esperando' },
  { id: 'r8', quando: '17/09 · 08h15', agente: 'planejador', oQue: 'Abertura do dia para 14 professores', turma: 'todas', estado: 'rascunho' },
]

const ROTULO_ESTADO = {
  aprovado: <Estado tipo="ok">Aprovado</Estado>,
  esperando: <Estado tipo="pendente">Esperando</Estado>,
  rejeitado: <Estado tipo="erro">Rejeitado</Estado>,
  rascunho: <Estado tipo="contorno">Rascunho do professor</Estado>,
}

const COLUNAS: Coluna<Registro>[] = [
  { titulo: 'Quando', celula: (r) => <span className="whitespace-nowrap tabular-nums">{r.quando}</span> },
  { titulo: 'Agente', celula: (r) => (
    <span className="inline-flex items-center gap-2"><AvatarAgente id={r.agente} tamanho={24} /><span className="font-medium text-tinta">{agente(r.agente).curto}</span></span>
  ) },
  { titulo: 'O quê', principal: true, celula: (r) => <span className="text-tinta">{r.oQue}</span> },
  { titulo: 'Turma', celula: (r) => r.turma },
  { titulo: 'Estado', celula: (r) => ROTULO_ESTADO[r.estado] },
  { titulo: 'Aprovado por', celula: (r) => r.por
    ? <span className={r.estado === 'rejeitado' ? 'text-erro' : 'font-medium text-ok'}>{r.por}</span>
    : <span className="text-sutil">{r.estado === 'esperando' ? 'esperando o professor da turma' : 'não chegou a aluno'}</span> },
]

// Uso em agregado, por série e disciplina. O recorte só aparece com dois ou mais professores (D45 revista).
const USO = [
  { serie: '2º ano EM', disciplina: 'Química', valor: 84, professores: 3 },
  { serie: '1º ano EM', disciplina: 'Matemática', valor: 71, professores: 4 },
  { serie: '9º ano EF', disciplina: 'Ciências', valor: 62, professores: 2 },
  { serie: '8º ano EF', disciplina: 'Língua Portuguesa', valor: 48, professores: 3 },
  { serie: '6º ano EF', disciplina: 'História', valor: 27, professores: 2 },
]

const DESEMPENHO_SERIE = [
  { serie: '6º ano EF', valor: 72 }, { serie: '7º ano EF', valor: 69 }, { serie: '8º ano EF', valor: 66 },
  { serie: '9º ano EF', valor: 63 }, { serie: '1º ano EM', valor: 61 }, { serie: '2º ano EM', valor: 58 },
]

export function Governanca() {
  const [filtro, setFiltro] = useState('todos')
  const [dialogo, setDialogo] = useState(false)
  const [finalidade, setFinalidade] = useState<string | null>(null)
  const linhas = REGISTROS.filter((r) => filtro === 'todos' || r.estado === filtro)

  return (
    <Tela titulo="Governança de IA · setembro"
      descricao="O que a IA gerou, quem aprovou e quanto custou. Nada daqui chega a aluno, nota ou família sem uma pessoa da escola confirmar."
      acoes={
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="secundario"><FileDown /> Exportar relatório</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-controle">
            {['Relatório de uso em PDF', 'Registros em CSV', 'Registros em JSON'].map((o) => <DropdownMenuItem key={o} className="h-10 rounded-linha">{o}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      }>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NumeroPainel rotulo="Gerado por IA" valor="412" apoio="provas, atividades, planos, diagnósticos e adaptações" />
        <NumeroPainel rotulo="Aprovado por gente" valor="389" apoio={<span className="font-medium text-ok">94% do que foi gerado</span>} />
        <NumeroPainel rotulo="Esperando" valor="23" apoio={<span className="font-medium text-pendente">aguardam o professor da turma</span>} />
        <div className="rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
          <p className="rotulo">Consumo do mês</p>
          <p className="numero-painel mt-3 text-tinta">61%</p>
          <Progress value={61} className="mt-3 h-2 rounded-full bg-ia-cx [&>div]:bg-noite" aria-label="61% do orçamento de IA usado" />
          <p className="mt-2 text-sm text-sutil">do orçamento de IA · dia 21 de 30</p>
        </div>
      </div>

      <Cartao className="mt-4" titulo={<span className="inline-flex items-center gap-2">O que a IA gerou e quem aprovou <SeloIA /></span>}
        acao={
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger aria-label="Filtrar por estado" className="h-10 w-[190px] rounded-controle border-borda-campo bg-superficie text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-controle">
              <SelectItem value="todos" className="rounded-linha">Todos os estados</SelectItem>
              <SelectItem value="esperando" className="rounded-linha">Esperando</SelectItem>
              <SelectItem value="aprovado" className="rounded-linha">Aprovado</SelectItem>
              <SelectItem value="rejeitado" className="rounded-linha">Rejeitado</SelectItem>
              <SelectItem value="rascunho" className="rounded-linha">Rascunho do professor</SelectItem>
            </SelectContent>
          </Select>
        }>
        <TabelaLista colunas={COLUNAS} linhas={linhas} chave={(r) => r.id} rotuloVazio="Nenhum registro neste estado em setembro." />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-linha pt-4">
          <p className="text-sm text-sutil">Mostrando {linhas.length} de 412. Filtra por estado, agente, turma e período. Não existe filtro nem ordenação por professor.</p>
          <Button variant="discreto" size="sm" asChild><Link to="/coordenacao/auditoria">Abrir na Auditoria <ArrowRight /></Link></Button>
        </div>
      </Cartao>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Uso por série e disciplina">
          <div className="grid gap-4">
            {USO.map((u) => <BarraRotulada key={u.serie + u.disciplina} rotulo={`${u.serie} · ${u.disciplina}`} detalhe={`${u.professores} professores no recorte`} valor={u.valor} sufixo="" tom="noite" />)}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-sutil">Artefatos gerados no mês, em agregado. Recorte com um professor só não aparece aqui: conta como nominal.</p>
        </Cartao>

        <Cartao titulo="Desempenho por série" acao={<span className="text-sm text-sutil">acerto médio em objetivas</span>}>
          <div className="grid gap-4">
            {DESEMPENHO_SERIE.map((d) => <BarraRotulada key={d.serie} rotulo={d.serie} valor={d.valor} tom="neutro" />)}
          </div>
        </Cartao>
      </div>

      <Cartao className="mt-4" titulo="2º ano EM · Química · acerto por habilidade" acao={<span className="text-sm text-sutil">2ºA e 2ºB juntos</span>}>
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {HABILIDADES.map((h) => <BarraRotulada key={h.codigo} rotulo={h.nome} detalhe={h.codigo} valor={h.acerto} tom={h.acerto < 50 ? 'caramelo' : 'neutro'} />)}
        </div>
      </Cartao>

      <section aria-labelledby="alertas" className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="alertas" className="font-corpo text-base font-semibold text-tinta">Alertas em agregado</h2>
          <Button variant="discreto" size="sm" asChild><Link to="/coordenacao/analista">Ver o resumo do Analista <ArrowRight /></Link></Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <Aviso tom="pendente" titulo="Habilidade em queda · 2º ano EM">Reagente limitante caiu de 52% para 39% em três semanas. É hipótese: coincide com a troca de capítulo.</Aviso>
          <Aviso tom="pendente" titulo="Entregas faltando · 1ºC">5 alunos com três entregas faltando. Os nomes chegam ao professor da turma; aqui aparece a contagem.</Aviso>
          <Aviso tom="info" titulo="Consumo dentro do previsto">61% do orçamento no dia 21. No ritmo atual, o mês fecha perto de 88%.</Aviso>
        </div>
      </section>

      <section aria-labelledby="nominal" className="mt-8 rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-[68ch]">
            <h2 id="nominal" className="font-corpo text-base font-semibold text-tinta">Dado nominal</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-apoio">
              Esta tela é toda em agregado. Ver o indicador das turmas de um professor, ou o nome de um aluno em risco, é uma decisão à parte:
              pede a finalidade e fica em auditoria. Não existe ranking, lista de adoção nem alerta de quem não usa.
            </p>
          </div>
          <Button variant="oficial" onClick={() => setDialogo(true)}><KeyRound /> Abrir dado nominal…</Button>
        </div>
        {finalidade && <RegistroAuditoria finalidade={finalidade} className="mt-4" />}
      </section>

      <DialogoNominal aberto={dialogo} aoMudar={setDialogo} oQue="o indicador das turmas de um professor do 2º ano EM, ou o nome dos alunos de um alerta"
        aoConfirmar={(f) => { setFinalidade(f); setDialogo(false) }} />

      <NotaMockup>
        Spec A5 (fatia do F12). Regra 70, item 6: a consulta "o que a IA gerou, quem aprovou e quando". D45 e D64: sem coluna, filtro ou
        ordenação por professor; o nominal abre por botão <i>oficial</i> com finalidade e auditoria. D14 e D39: consumo contra o orçamento.
        D46: o que se aprova no MVP é diagnóstico, não nota. Gráfico de série no tempo fica para o F12 completo; aqui vive de barra.
      </NotaMockup>
    </Tela>
  )
}
