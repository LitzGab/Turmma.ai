import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Download, FileDown, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { AvatarAgente, Estado } from '@/components/turmma/ia'
import { Cartao, NotaMockup, NumeroPainel, Tela } from '@/components/turmma/tela'
import { AGENTES, type AgenteId } from '@/dados/agentes'
import { dialogo, Par, Segmentos } from './_b-pecas'

/* Conformidade (D61): o dossiê da escola em um lugar. É a tela que a coordenação abre na reunião
   e a que responde ao checklist do MEC (docs/conformidade-mec.md). Fora do MVP de apresentação. */

const AIAS: { id: AgenteId; versao: string; revisada: string; vigente: boolean; motivo?: string }[] = [
  { id: 'tutor', versao: 'v3', revisada: '02/09/2026', vigente: true },
  { id: 'corretor', versao: 'v2', revisada: '18/08/2026', vigente: true },
  { id: 'adaptador', versao: 'v2', revisada: '18/08/2026', vigente: true },
  { id: 'analista', versao: 'v1', revisada: '04/08/2026', vigente: false, motivo: 'O prompt principal mudou em 15/09. A avaliação precisa ser revista antes da próxima segunda.' },
]

const ETAPAS_AIA = [
  'Para que serve e quem é afetado',
  'Que dado entra e que dado sai',
  'O que pode dar errado, e com quem',
  'Como um humano supervisiona e contesta',
  'O que o agente não deve fazer (escopo negativo)',
  'Como suspender o agente nesta escola',
]

const LEI: { texto: string; ok: boolean; apoio?: string }[] = [
  { texto: 'A escola é controladora dos dados; a Turmma é operadora', ok: true, apoio: 'Contrato e acordo de tratamento assinados em 03/02/2026' },
  { texto: 'Aluno não tem e-mail, telefone, CPF, foto nem data de nascimento no sistema', ok: true, apoio: 'O contato é sempre do responsável' },
  { texto: 'A adaptação é registrada sem diagnóstico, laudo ou CID', ok: true },
  { texto: 'Conversa do Tutor: retenção de 90 dias e acesso só do professor da turma', ok: true },
  { texto: 'Dado processado no Brasil, com cláusula que veda treinar modelo com dado da escola', ok: true },
  { texto: 'Canal de denúncia ativo, com prazo e recurso (ECA Digital, art. 28)', ok: true },
  { texto: 'Sem recompensa por tempo de uso, sequência de dias ou aviso fora do horário (Decreto 12.880, arts. 9º e 10)', ok: true },
  { texto: 'Encarregado de dados da escola indicado e publicado', ok: false, apoio: 'Falta indicar o nome no regimento e no site da escola' },
]

const CHECKLIST: { item: string; ok: boolean; onde: string }[] = [
  { item: 'Finalidade pedagógica declarada por escrito', ok: true, onde: 'Declaração de propósito' },
  { item: 'Faixas etárias definidas, sem IA generativa na infantil e nos anos iniciais', ok: true, onde: 'Declaração de propósito' },
  { item: 'Toda saída de IA rotulada como IA, com a fonte', ok: true, onde: 'Como funciona' },
  { item: 'Validação humana registrada em correção e nota', ok: true, onde: 'Auditoria' },
  { item: 'IA não corrige redação nem discursiva', ok: true, onde: 'Agentes' },
  { item: 'Avaliação de impacto por funcionalidade de alto risco', ok: false, onde: 'AIA do Analista em revisão' },
  { item: 'Professor não é penalizado por não usar a ferramenta', ok: true, onde: 'Governança: adoção só em agregado' },
  { item: 'Comunidade escolar consultada e informada', ok: false, onde: 'Reunião de pais marcada para 08/10' },
  { item: 'Relatório de uso disponível para a mantenedora', ok: true, onde: 'Relatório de uso' },
  { item: 'Dado e artefato exportáveis em formato aberto', ok: true, onde: 'Exportar' },
]

const MATERIAIS_CONVERSA = [
  { nome: 'Carta às famílias sobre o uso de IA na escola', tipo: 'Modelo editável · DOCX' },
  { nome: 'Roteiro da reunião de pais: o que a IA faz e o que não faz', tipo: 'Apresentação · PPTX' },
  { nome: 'Guia do professor: autonomia de cada agente', tipo: 'PDF · 6 páginas' },
  { nome: 'Política de uso de IA, para o regimento da escola', tipo: 'Modelo editável · DOCX' },
  { nome: 'Guia para bloquear outras IAs na rede da escola', tipo: 'PDF · 3 páginas' },
]

type Filtro = 'todos' | 'pendentes'

export function Conformidade() {
  const [exportando, setExportando] = useState<'parado' | 'gerando' | 'pronto'>('parado')
  const [aia, setAia] = useState<AgenteId | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const atendidos = CHECKLIST.filter((c) => c.ok).length
  const itens = filtro === 'todos' ? CHECKLIST : CHECKLIST.filter((c) => !c.ok)
  const aiaAberta = AIAS.find((a) => a.id === aia)

  const exportar = () => { setExportando('gerando'); window.setTimeout(() => setExportando('pronto'), 1800) }

  return (
    <Tela titulo="Conformidade"
      descricao="O dossiê da escola em um lugar. É o que você abre na reunião com as famílias, com a mantenedora e quando chega o checklist do MEC."
      acoes={
        <>
          {exportando === 'pronto' && <Estado tipo="ok" size="lg">Dossiê pronto · 21/09, 10h42</Estado>}
          <Button onClick={exportar} disabled={exportando === 'gerando'}>
            {exportando === 'gerando' ? <><Spinner className="motion-reduce:animate-none" /> Montando o dossiê…</> : <><FileDown /> Exportar dossiê em PDF</>}
          </Button>
        </>
      }>

      <div className="grid gap-3 sm:grid-cols-3">
        <NumeroPainel rotulo="Checklist do MEC" valor={`${atendidos} de ${CHECKLIST.length}`} apoio={<Progress value={(atendidos / CHECKLIST.length) * 100} className="mt-1 h-2 bg-ia-cx [&>div]:bg-ok" />} />
        <NumeroPainel rotulo="Avaliações de impacto" valor="3 de 4" apoio="vigentes · 1 em revisão" />
        <NumeroPainel rotulo="Dossiê atualizado em" valor="21/09" apoio="Atualiza sozinho com o uso; você revisa o texto" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Declaração de propósito e faixas etárias" acao={<Button variant="discreto" size="sm">Editar texto</Button>}>
          <p className="border-l-2 border-caramelo pl-3 text-[15px] leading-relaxed text-apoio">
            O Colégio Aurora usa a Turmma para apoiar o planejamento do professor, o estudo do aluno com um tutor supervisionado e o
            acompanhamento pedagógico da coordenação. A IA prepara e avisa; quem decide é a escola.
          </p>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4 border-t border-linha pt-2"><dt className="text-sutil">Anos finais do Fundamental</dt><dd className="font-medium text-tinta">6º ao 9º ano · 11 a 14 anos</dd></div>
            <div className="flex justify-between gap-4 border-t border-linha pt-2"><dt className="text-sutil">Ensino Médio</dt><dd className="font-medium text-tinta">1º ao 3º ano · 15 a 17 anos</dd></div>
            <div className="flex justify-between gap-4 border-t border-linha pt-2"><dt className="text-sutil">Infantil e anos iniciais</dt><dd className="font-medium text-tinta">Não usam o sistema</dd></div>
          </dl>
        </Cartao>

        <Cartao titulo="Como o sistema funciona, em linguagem simples">
          <ul className="grid gap-3 text-[15px] leading-snug text-apoio">
            {[
              ['A IA prepara, a escola aprova.', 'Nada vira nota, mensagem à família ou decisão sobre aluno sem uma pessoa aprovar, com registro.'],
              ['A IA sempre assina.', 'Toda saída leva o selo "IA", o agente que gerou e a página do material de onde veio.'],
              ['O Tutor ensina, não entrega.', 'Conduz por perguntas, dentro do conteúdo da turma, e o professor acompanha o uso.'],
              ['Cada papel vê só o seu.', 'Professor vê suas turmas; coordenação vê agregado; nominal só abre com auditoria.'],
            ].map(([forte, resto]) => (
              <li key={forte} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={2.6} />
                <p><b className="font-semibold text-tinta">{forte}</b> {resto}</p>
              </li>
            ))}
          </ul>
          <Link to="/coordenacao/agentes" className="mt-4 inline-flex h-11 items-center gap-1.5 text-sm font-medium text-caramelo-texto underline-offset-4 hover:underline md:h-9">
            Ver o que cada agente faz sozinho <ArrowRight className="size-4" />
          </Link>
        </Cartao>
      </div>

      <Cartao titulo="LGPD e ECA Digital" className="mt-4">
        <ul className="grid gap-x-8 gap-y-3 lg:grid-cols-2">
          {LEI.map((l) => (
            <li key={l.texto} className="flex items-start gap-3 border-t border-linha pt-3">
              <Estado tipo={l.ok ? 'ok' : 'pendente'} className="mt-0.5 shrink-0">{l.ok ? 'Atendido' : 'Pendente'}</Estado>
              <p className="min-w-0 text-sm leading-snug text-tinta">{l.texto}{l.apoio && <span className="block text-sutil">{l.apoio}</span>}</p>
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao titulo="Avaliações de Impacto Algorítmico" className="mt-4">
        <p className="-mt-2 mb-4 max-w-[72ch] text-sm text-sutil">Uma por agente de alto risco, escrita antes de ele existir e revista quando o modelo ou o prompt principal mudam (D60).</p>
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {AIAS.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-controle border border-linha p-3">
              <AvatarAgente id={a.id} tamanho={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-tinta">{AGENTES[a.id].nome}</p>
                <p className="text-[13px] text-sutil">{a.versao} · revisada em {a.revisada}</p>
              </div>
              <Estado tipo={a.vigente ? 'ok' : 'pendente'}>{a.vigente ? 'Vigente' : 'Em revisão'}</Estado>
              <Button variant="secundario" size="sm" className="h-11 md:h-9" onClick={() => setAia(a.id)}>Ver resumo</Button>
            </li>
          ))}
        </ul>
      </Cartao>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Cartao titulo="Relatório de uso" acao={<Button variant="secundario" size="sm" className="h-11 md:h-9"><Download /> Exportar relatório</Button>}>
          <p className="-mt-2 mb-4 text-sm text-sutil">Setembro de 2026 · por série e disciplina, sempre em agregado.</p>
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[['412', 'gerado por IA'], ['389', 'aprovado por gente'], ['23', 'esperando']].map(([n, r]) => (
              <div key={r} className="rounded-controle bg-fundo p-3">
                <dd className="numero-painel text-[22px] text-tinta">{n}</dd>
                <dt className="mt-1.5 text-xs text-sutil">{r}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-apoio">O relatório não traz uso por professor nem lista de quem adotou: adoção é agregada (D64).</p>
        </Cartao>

        <Cartao titulo="Para conversar com professores e famílias">
          <ul className="-mt-1 grid">
            {MATERIAIS_CONVERSA.map((m) => (
              <li key={m.nome} className="flex items-center gap-3 border-t border-linha py-2.5 first:border-0">
                <FileText className="size-[18px] shrink-0 text-sutil" strokeWidth={1.75} />
                <p className="min-w-0 flex-1 text-sm leading-snug text-tinta">{m.nome}<span className="block text-[13px] text-sutil">{m.tipo}</span></p>
                <Button variant="discreto" size="sm" className="h-11 md:h-9" aria-label={`Baixar: ${m.nome}`}><Download /> <span className="hidden sm:inline">Baixar</span></Button>
              </li>
            ))}
          </ul>
        </Cartao>
      </div>

      <Cartao titulo="Checklist do MEC" className="mt-4">
        <Segmentos rotulo="Filtrar o checklist" valor={filtro} aoMudar={setFiltro} opcoes={[{ id: 'todos', nome: 'Todos', n: CHECKLIST.length }, { id: 'pendentes', nome: 'Pendentes', n: CHECKLIST.length - atendidos }]} />
        <ul className="mt-3 grid">
          {itens.map((c) => (
            <li key={c.item} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-linha py-3 first:border-0">
              <p className="min-w-0 flex-1 basis-64 text-[15px] leading-snug text-tinta">{c.item}</p>
              <p className="text-sm text-sutil">{c.onde}</p>
              <Estado tipo={c.ok ? 'ok' : 'pendente'}>{c.ok ? 'Atendido' : 'Pendente'}</Estado>
            </li>
          ))}
        </ul>
      </Cartao>

      <Dialog open={aia !== null} onOpenChange={(o) => !o && setAia(null)}>
        <DialogContent className={`${dialogo} max-w-xl`}>
          {aiaAberta && (
            <>
              <DialogHeader className="space-y-2 text-left">
                <div className="flex items-center gap-3">
                  <AvatarAgente id={aiaAberta.id} tamanho={40} />
                  <div>
                    <DialogTitle className="font-corpo text-base font-semibold tracking-normal text-tinta">Avaliação de impacto · {AGENTES[aiaAberta.id].nome}</DialogTitle>
                    <DialogDescription className="text-sm text-sutil">{aiaAberta.versao} · revisada em {aiaAberta.revisada}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              {!aiaAberta.vigente && <p className="rounded-controle bg-pendente-cx p-3 text-sm leading-snug text-pendente">{aiaAberta.motivo}</p>}
              <Par rotulo="As seis etapas">
                <ol className="grid gap-1.5 text-sm">
                  {ETAPAS_AIA.map((e, i) => (
                    <li key={e} className="flex items-center gap-2.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ia-cx text-xs font-semibold tabular-nums text-apoio">{i + 1}</span>
                      <span className="flex-1 text-tinta">{e}</span>
                      <Check className="size-4 text-ok" strokeWidth={2.6} aria-label="escrita" />
                    </li>
                  ))}
                </ol>
              </Par>
              <Par rotulo="O que este agente nunca faz">
                <ul className="grid list-disc gap-1 pl-5 text-sm text-apoio">{AGENTES[aiaAberta.id].nuncaFaz.map((n) => <li key={n}>{n}</li>)}</ul>
              </Par>
              <Par rotulo="Como suspender nesta escola">
                <p className="text-sm text-apoio">A direção ou a coordenação desliga o agente em Agentes. O que ele já produziu continua guardado e marcado; nada pendente é aprovado sozinho.</p>
              </Par>
              <DialogFooter className="gap-2 sm:space-x-0">
                <Button variant="secundario" onClick={() => setAia(null)}>Fechar</Button>
                <Button variant="secundario"><Download /> Baixar a avaliação inteira</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <NotaMockup>
        F12 (governança) e F16 (conformidade) · fora do MVP de apresentação. Aplica D61 (dossiê como entregável de produto), D60 (AIA por agente de
        alto risco, com escopo negativo e suspensão), D10 (escola controladora), D64 (adoção só em agregado) e D63 (exportável). Os textos legais são
        ilustrativos: o dossiê real sai de <code>docs/conformidade-mec.md</code>.
      </NotaMockup>
    </Tela>
  )
}
