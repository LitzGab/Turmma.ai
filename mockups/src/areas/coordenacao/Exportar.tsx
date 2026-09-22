import { useState } from 'react'
import { Download, FileDown, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Estado } from '@/components/turmma/ia'
import { Cartao, NotaMockup, Tela } from '@/components/turmma/tela'
import { cn } from '@/lib/utils'
import { AvisoInfo, caixaMarca, campo, TabelaResponsiva, type Coluna } from './_b-pecas'

/* Exportar (D63): o que a escola e o professor produzem é deles, e sai em formato aberto,
   a qualquer momento, sem depender de nós. A exportação fica em auditoria (regra 20, item 10). */

const CONJUNTOS = [
  { id: 'estrutura', nome: 'Estrutura da escola', detalhe: 'Séries, turmas, grade, calendário e alocação' },
  { id: 'artefatos', nome: 'Artefatos dos professores', detalhe: 'Provas, atividades, planos e materiais, com a página citada' },
  { id: 'diagnosticos', nome: 'Correções e diagnósticos aprovados', detalhe: 'Por avaliação e habilidade, com quem aprovou' },
  { id: 'uso', nome: 'Histórico de uso de IA', detalhe: 'O que foi gerado, por qual agente, e quem aprovou' },
  { id: 'auditoria', nome: 'Registros de auditoria', detalhe: 'Validações, leituras nominais, exportações, permissões' },
]

const FORMATOS = [
  { id: 'csv', nome: 'CSV', detalhe: 'Abre em qualquer planilha' },
  { id: 'json', nome: 'JSON', detalhe: 'Para levar a outro sistema' },
  { id: 'pdf', nome: 'PDF', detalhe: 'Para ler e arquivar' },
]

type Situacao = 'fila' | 'pronta' | 'expirada'
type Exportacao = { id: string; oQue: string; formato: string; quando: string; finalidade: string; situacao: Situacao }

const INICIAIS: Exportacao[] = [
  { id: 'e2', oQue: 'Histórico de uso de IA · agosto', formato: 'CSV', quando: '19/09, 16h20', finalidade: 'Relatório para a mantenedora', situacao: 'pronta' },
  { id: 'e1', oQue: 'Artefatos dos professores · 1º semestre', formato: 'PDF', quando: '02/08, 9h10', finalidade: 'Guarda da escola', situacao: 'expirada' },
]

export function Exportar() {
  const [conjuntos, setConjuntos] = useState<string[]>(['artefatos', 'uso'])
  const [formato, setFormato] = useState('csv')
  const [finalidade, setFinalidade] = useState('')
  const [lista, setLista] = useState(INICIAIS)

  const alternar = (id: string) => setConjuntos((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id])
  const podeGerar = conjuntos.length > 0 && finalidade !== ''

  const gerar = () => {
    const id = `e${Date.now()}`
    const oQue = conjuntos.map((c) => CONJUNTOS.find((x) => x.id === c)!.nome).join(' + ')
    setLista((l) => [{ id, oQue, formato: formato.toUpperCase(), quando: '21/09, 10h42', finalidade, situacao: 'fila' }, ...l])
    window.setTimeout(() => setLista((l) => l.map((e) => e.id === id ? { ...e, situacao: 'pronta' } : e)), 2200)
  }
  const refazer = (id: string) => {
    setLista((l) => l.map((e) => e.id === id ? { ...e, situacao: 'fila', quando: '21/09, 10h42' } : e))
    window.setTimeout(() => setLista((l) => l.map((e) => e.id === id ? { ...e, situacao: 'pronta' } : e)), 2200)
  }

  const colunas: Coluna<Exportacao>[] = [
    { titulo: 'O quê', celula: (e) => <><span className="block font-medium leading-snug text-tinta">{e.oQue}</span><span className="text-[13px] text-sutil">{e.formato} · {e.finalidade}</span></> },
    { titulo: 'Pedida por', celula: () => 'Helena Martins' },
    { titulo: 'Quando', celula: (e) => <span className="whitespace-nowrap tabular-nums">{e.quando}</span> },
    { titulo: 'Situação', celula: (e) => e.situacao === 'fila' ? <Estado tipo="info">Na fila</Estado> : e.situacao === 'pronta' ? <Estado tipo="ok">Pronta · o link vale 24 h</Estado> : <Estado tipo="contorno">Expirada</Estado> },
  ]

  return (
    <Tela titulo="Exportar" largura="media"
      descricao="O que a escola e os professores produzem é de vocês. Sai em formato aberto, a qualquer momento, sem depender de nós.">

      <Cartao titulo="Nova exportação">
        <form onSubmit={(e) => { e.preventDefault(); if (podeGerar) gerar() }} className="grid gap-6">
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-[13px] font-semibold text-apoio">O que exportar</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {CONJUNTOS.map((c) => {
                const marcado = conjuntos.includes(c.id)
                return (
                  <label key={c.id} className={cn('flex min-h-[60px] cursor-pointer items-start gap-3 rounded-controle border p-3 transition-colors duration-150',
                    marcado ? 'border-noite bg-info-cx' : 'border-linha bg-superficie hover:bg-realce')}>
                    <Checkbox checked={marcado} onCheckedChange={() => alternar(c.id)} className={cn(caixaMarca, 'mt-0.5')} />
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold leading-snug text-tinta">{c.nome}</span>
                      <span className="block text-[13px] leading-snug text-sutil">{c.detalhe}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            <p className="mt-1 text-[13px] leading-snug text-sutil">Conversa do Tutor e dado de um aluno não entram na exportação geral: saem só pelo pedido do titular ou do responsável, em Privacidade.</p>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-apoio">Formato</legend>
            <RadioGroup value={formato} onValueChange={setFormato} className="grid gap-2 sm:grid-cols-3">
              {FORMATOS.map((f) => (
                <label key={f.id} className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-controle border p-3 transition-colors duration-150',
                  formato === f.id ? 'border-noite bg-info-cx' : 'border-linha bg-superficie hover:bg-realce')}>
                  <RadioGroupItem value={f.id} className="size-5 border-borda-campo text-noite data-[state=checked]:border-noite" />
                  <span><span className="block text-[15px] font-semibold leading-tight text-tinta">{f.nome}</span><span className="block text-[13px] text-sutil">{f.detalhe}</span></span>
                </label>
              ))}
            </RadioGroup>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="periodo-exp" className="text-[13px] font-semibold text-apoio">Período</Label>
              <Select defaultValue="ano">
                <SelectTrigger id="periodo-exp" className={campo}><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-controle">
                  {[['mes', 'Setembro de 2026'], ['bim', '3º bimestre'], ['sem', '2º semestre'], ['ano', 'Ano letivo de 2026'], ['tudo', 'Tudo desde o início']].map(([v, n]) => <SelectItem key={v} value={v} className="rounded-linha">{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="finalidade-exp" className="text-[13px] font-semibold text-apoio">Finalidade</Label>
              <Select value={finalidade} onValueChange={setFinalidade}>
                <SelectTrigger id="finalidade-exp" className={campo}><SelectValue placeholder="Escolha a finalidade" /></SelectTrigger>
                <SelectContent className="rounded-controle">
                  {['Guarda da escola', 'Relatório para a mantenedora', 'Troca de sistema', 'Pedido de órgão público'].map((f) => <SelectItem key={f} value={f} className="rounded-linha">{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-sutil">Fica no registro de auditoria, com o seu nome e a data.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {!podeGerar && <p className="text-sm text-sutil">{conjuntos.length === 0 ? 'Escolha pelo menos um conjunto.' : 'Escolha a finalidade.'}</p>}
            <Button type="submit" disabled={!podeGerar}><FileDown /> Gerar exportação</Button>
          </div>
        </form>
      </Cartao>

      <h2 className="mb-3 mt-8 font-corpo text-base font-semibold text-tinta">Exportações</h2>
      <TabelaResponsiva colunas={colunas} linhas={lista} chave={(e) => e.id}
        acao={(e) => e.situacao === 'pronta' ? <Button variant="secundario" size="sm"><Download /> Baixar</Button>
          : e.situacao === 'expirada' ? <Button variant="discreto" size="sm" onClick={() => refazer(e.id)}><RefreshCw /> Gerar de novo</Button>
          : <span className="text-sm text-sutil">Preparando…</span>} />

      <AvisoInfo className="mt-4">
        O arquivo é montado fora do horário de pico e o link expira em 24 horas. Depois disso é só gerar de novo: o dado continua aqui enquanto o contrato durar, e sai inteiro quando ele acabar.
      </AvisoInfo>

      <NotaMockup>
        F12 (com o atendimento ao titular no F3) · fora do MVP de apresentação. Aplica D63 (formato aberto, a qualquer momento), regra 20 itens 7 e 10
        (link assinado de validade curta; exportação auditada com finalidade), regra 00 item 4 (exportação vai para fila) e regra 20 item 14
        (conversa de tutor fora da exportação geral).
      </NotaMockup>
    </Tela>
  )
}
