import { useState } from 'react'
import { Download, Lock } from 'lucide-react'
import { Botao, FaixaResultado, GrupoToques, Opcao, Segmentado } from '@/components/duo'
import { PainelLado } from '@/components/turmma/painel-lado'
import { listaDe } from '@/dados/acesso'
import { registrar } from '@/dados/demo/nucleo'
import { nomeDaTurma } from '@/dados/demo/turmas-base'
import { useMesIA } from './Governanca'

/* EXPORTAR DADOS (12ª rodada, polimento C1, 04/10/2026; plano 5.3). O painel que (Exportar dados) abre em Registros
   e que ?exportar=1&conjunto=<id> também abre: "uso" vem de IA (Exportar este relatório); "lista:<turmaId>" vem da
   turma (C2), para exportar a lista com finalidade.
   O quê, o formato (CSV · JSON), o período e a finalidade obrigatória → GERAR → o link de 24 h e BAIXAR, que baixa um
   arquivo de verdade e registra `exportacao` (aparece na Auditoria). O que a escola produz é dela
   e sai em formato aberto (D63). Conversa do Tutor e dado de um aluno só saem a pedido do titular (LGPD, art. 18 — lei). */

/** Baixa um arquivo gerado na hora (Blob). Serve ao Dossiê, ao pedido do titular e às exportações. */
export function baixarArquivo(nome: string, conteudo: string, tipo: string) {
  try {
    const url = URL.createObjectURL(new Blob([tipo.startsWith('text/csv') ? '﻿' + conteudo : conteudo], { type: tipo }))
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch { /* sem Blob (prévia, captura): não baixa, e a tela segue */ }
}

const COORDENACAO = { nome: 'Helena Martins', papel: 'coordenacao' as const }

type Conjunto = { id: string; nome: string; detalhe: string }

const CONJUNTOS: Conjunto[] = [
  { id: 'estrutura', nome: 'Estrutura da escola', detalhe: 'Turmas, grade e quem dá aula' },
  { id: 'documentos', nome: 'Documentos dos professores', detalhe: 'Provas, atividades e planos' },
  { id: 'notas', nome: 'Notas aprovadas', detalhe: 'Com quem aprovou e quando' },
  { id: 'uso', nome: 'Histórico de uso de IA', detalhe: 'O que a IA gerou e quem aprovou' },
  { id: 'auditoria', nome: 'Registros de auditoria', detalhe: 'Quem fez o quê, quando e para quê' },
]

const FINALIDADES = ['Guarda da escola', 'Relatório à mantenedora', 'Troca de sistema', 'Pedido de órgão público']
const PERIODOS = [{ id: 'set', rotulo: 'Setembro' }, { id: 'bim', rotulo: '3º bimestre' }, { id: 'ano', rotulo: 'Ano letivo' }]

/** O conjunto "lista:<turmaId>" (a lista de uma turma), que a turma manda pela URL. */
function conjuntoDaLista(id: string | null | undefined): Conjunto | null {
  if (!id?.startsWith('lista:')) return null
  const turmaId = id.slice(6)
  return { id, nome: `Lista do ${nomeDaTurma(turmaId)}`, detalhe: 'Nome, matrícula e situação' }
}

/** O conteúdo de cada conjunto, em linhas de CSV. */
type Mes = { gerou: number; aprovadas: number; esperam: number }

function linhasDe(id: string, mes: Mes): string[][] {
  if (id.startsWith('lista:')) {
    const lista = listaDe(id.slice(6))
    return [['nome', 'matricula', 'situacao'], ...lista.map((n) => [n.nome, n.matricula, n.estado])]
  }
  switch (id) {
    case 'estrutura': return [['turma', 'serie', 'turno'], ['2ºA', '2º ano EM', 'Manhã'], ['2ºB', '2º ano EM', 'Manhã'], ['1ºC', '1º ano EM', 'Manhã']]
    case 'documentos': return [['documento', 'turma', 'professor', 'estado'], ['Prova de mol e massa molar', '2ºB', 'Camila Souza', 'aprovado'], ['Lista de estequiometria', '2ºB', 'Camila Souza', 'aprovado']]
    case 'notas': return [['avaliacao', 'turma', 'media', 'aprovado_por', 'quando'], ['Lista de mol e massa molar', '2ºB', '6,1', 'Camila Souza', '18/09']]
    case 'uso': return [['mes', 'gerado', 'aprovado', 'esperando'], ['setembro', String(mes.gerou), String(mes.aprovadas), String(mes.esperam)]]
    default: return [['quando', 'quem', 'acao', 'finalidade'], ['19/09, 16h20', 'Helena Martins', 'Exportou dados', 'Relatório à mantenedora']]
  }
}

function conteudo(ids: string[], formato: 'csv' | 'json', nomes: Record<string, string>, mes: Mes) {
  if (formato === 'json') {
    const obj = Object.fromEntries(ids.map((id) => {
      const [cab, ...linhas] = linhasDe(id, mes)
      return [nomes[id] ?? id, linhas.map((l) => Object.fromEntries(cab.map((c, i) => [c, l[i]])))]
    }))
    return JSON.stringify({ escola: 'Colégio Aurora', ...obj }, null, 2)
  }
  return ids.map((id) => [`# ${nomes[id] ?? id}`, ...linhasDe(id, mes).map((l) => l.join(';'))].join('\n')).join('\n\n')
}

type Gerada = { ids: string[]; formato: 'csv' | 'json'; quando: string; finalidade: string }

export function PainelExportar({ aberto, aoFechar, conjuntoInicial }: { aberto: boolean; aoFechar: () => void; conjuntoInicial?: string | null }) {
  const lista = conjuntoDaLista(conjuntoInicial)
  const mes = useMesIA()
  const opcoes = lista ? [lista, ...CONJUNTOS] : CONJUNTOS
  const valido = opcoes.some((c) => c.id === conjuntoInicial)
  const [ids, setIds] = useState<string[]>(valido && conjuntoInicial ? [conjuntoInicial] : [])
  const [formato, setFormato] = useState<'csv' | 'json'>('csv')
  const [periodo, setPeriodo] = useState('set')
  const [finalidade, setFinalidade] = useState<string | null>(null)
  const [gerada, setGerada] = useState<Gerada | null>(null)

  const nomes = Object.fromEntries(opcoes.map((c) => [c.id, c.nome]))
  const alternar = (id: string, v: boolean) => { setIds((c) => (v ? [...c, id] : c.filter((x) => x !== id))); setGerada(null) }
  const podeGerar = ids.length > 0 && !!finalidade

  const gerar = () => {
    if (!podeGerar) return
    const ev = registrar('exportacao', { conjunto: ids.map((i) => nomes[i]).join(' + '), finalidade, formato: formato.toUpperCase(), periodo }, COORDENACAO)
    setGerada({ ids, formato, quando: ev.quando.rotulo, finalidade: finalidade! })
  }
  const baixar = () => {
    if (!gerada) return
    const nome = ids.length === 1 ? ids[0].replace(':', '-') : 'exportacao'
    baixarArquivo(`colegio-aurora-${nome}.${gerada.formato}`, conteudo(gerada.ids, gerada.formato, nomes, mes),
      gerada.formato === 'csv' ? 'text/csv;charset=utf-8' : 'application/json')
  }

  return (
    <PainelLado aberto={aberto} aoFechar={aoFechar} titulo="Exportar dados" className="[&>header_button:focus-visible]:-outline-offset-3"
      rodape={gerada
        ? (
          <FaixaResultado tipo="certo" titulo="Pronto" acao={<Botao variante="oficial" icone={<Download strokeWidth={2.5} />} onClick={baixar}>Baixar</Botao>}
            className="-mx-6 -mt-3 -mb-[calc(12px+env(safe-area-inset-bottom,0px))] basis-[calc(100%+48px)] border-t-0">
            O link vale 24 h · {gerada.quando}
          </FaixaResultado>
        )
        : <Botao disabled={!podeGerar} onClick={gerar}>Gerar</Botao>}>
      <div className="grid gap-6">
        <fieldset className="grid gap-2.5">
          <legend className="t-selo mb-2.5 text-sutil">O quê</legend>
          {opcoes.map((c) => (
            <Opcao key={c.id} tipo="checkbox" marcado={ids.includes(c.id)} aoMudar={(v) => alternar(c.id, v)}>
              <span className="block">{c.nome}</span>
              <span className="t-apoio block">{c.detalhe}</span>
            </Opcao>
          ))}
          <p className="t-apoio flex items-start gap-1.5"><Lock aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} /> Conversa do Tutor e dado de um aluno só saem a pedido do titular.</p>
        </fieldset>

        <div className="grid gap-2.5">
          <p className="t-selo text-sutil">Formato</p>
          <Segmentado rotulo="Formato" valor={formato} aoMudar={(v) => { setFormato(v as 'csv' | 'json'); setGerada(null) }} className="justify-self-start"
            opcoes={[{ id: 'csv', rotulo: 'CSV' }, { id: 'json', rotulo: 'JSON' }]} />
        </div>

        <div className="grid gap-2.5">
          <p className="t-selo text-sutil">Período</p>
          <Segmentado rotulo="Período" valor={periodo} aoMudar={(v) => { setPeriodo(v); setGerada(null) }} opcoes={PERIODOS} className="justify-self-start" />
        </div>

        <div className="grid gap-2.5">
          <p className="t-selo text-sutil">Para quê</p>
          <GrupoToques rotulo="Para quê" valor={finalidade} aoMudar={(v) => { setFinalidade(v as string); setGerada(null) }}
            opcoes={FINALIDADES.map((f) => ({ id: f, rotulo: f }))} />
          <p className="t-apoio">Fica registrado com seu nome.</p>
        </div>
      </div>
    </PainelLado>
  )
}
