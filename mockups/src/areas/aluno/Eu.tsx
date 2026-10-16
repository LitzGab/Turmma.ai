import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Lock, LogOut, RotateCcw, Settings } from 'lucide-react'
import { BarraProgresso, Botao, CabecalhoPagina, Cartao, Pagina, Secao, Segmentado, Selo, materiaDe } from '@/components/duo'
import { Onca } from '@/components/duo/onca'
import { Icone } from '@/components/duo/icones'
import { Configuracoes } from '@/components/turmma/Configuracoes'
import { useTarefasDoAluno } from '@/dados/avaliacoes'
import { useAlunoAtual } from '@/dados/sessao'
import { DESEMPENHO, VALE_REVISAR } from '@/dados/tarefas-aluno'
import { cn } from '@/lib/utils'

/* EU (/aluno/eu), 14ª rodada, 05/10/2026 (plano ux-composicao, 1.2 e 5.2). Página de leitura (880), cabe na janela.
   · O título "Eu", com "2ºB · Colégio Aurora" ao lado.
   · COMO ESTOU INDO, com as matérias (Segmentado, com o ícone) à direita do título. Linha de tópico de 56 px, em
     colunas que alinham: o nome · a barra de 160 e "7 de 8" · os selos VALE REVISAR e A PROFESSORA PEDIU · ESTUDAR.
     Só do aluno, sem média da turma (regra 50, item 9), e só o que a professora aprovou (regra 70): quando ela aprova
     a prova de mol, a conta muda.
   · 32 px abaixo, a conta: Privacidade (com o que o Tutor lembra) · Ajustes (Aparência, Tamanho do texto) · Rever a
     introdução · Sair (um clique, D59). */

type Assunto = { nome: string; acertos: number; total: number }

/** As provas aprovadas na demonstração entram na conta do assunto delas. */
const ASSUNTO_DA_TAREFA: Record<string, { materia: string; assunto: string }> = {
  'prova-mol': { materia: 'Química', assunto: 'Massa molar' },
  'prova-estequiometria': { materia: 'Química', assunto: 'Reagente limitante' },
}
/** O que a professora pediu para reforçar (o mesmo da memória do Tutor). */
const PEDIU: Record<string, string> = { 'Massa molar': 'A prof. Camila pediu' }

function useComoEstouIndo() {
  const tarefas = useTarefasDoAluno()
  return useMemo(() => DESEMPENHO.map((d) => ({
    materia: d.materia as string,
    assuntos: d.assuntos.map((a): Assunto => {
      let { acertos, total } = a
      for (const t of tarefas) {
        const alvo = ASSUNTO_DA_TAREFA[t.id]
        if (t.resultado && alvo && alvo.materia === d.materia && alvo.assunto === a.nome) { acertos += t.resultado.acertos; total += t.resultado.total }
      }
      return { nome: a.nome, acertos, total }
    }),
  })), [tarefas])
}

function LinhaAssunto({ a, materia }: { a: Assunto; materia: string }) {
  const fraco = a.acertos / a.total < 0.5
  const slug = VALE_REVISAR.find((v) => v.assunto === a.nome)?.slug
  const pediu = PEDIU[a.nome]
  return (
    <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-t-2 border-borda px-4 py-2 first:border-t-0 md:grid-cols-[200px_216px_minmax(0,1fr)_96px] md:py-0">
      <p className="t-cartao min-w-0 truncate text-tinta" title={a.nome}>{a.nome}</p>
      <span className="order-last col-span-2 flex items-center gap-3 md:order-none md:col-span-1">
        <BarraProgresso valor={a.acertos} max={a.total} altura={12} familia={materiaDe(materia)?.familia ?? 'azul'}
          rotulo={`${a.nome}: ${a.acertos} de ${a.total} certas`} className="w-28 md:w-40" />
        <span className="shrink-0 text-[15px] font-bold tabular-nums text-apoio" aria-hidden>{a.acertos} de {a.total}</span>
        {/* no celular, os selos seguem a barra na mesma linha */}
        <span className="flex min-w-0 flex-wrap gap-1.5 md:hidden">
          {fraco && <Selo familia="amarelo" tamanho="p">Vale revisar</Selo>}
          {pediu && <Selo familia="roxo" tamanho="p">{pediu}</Selo>}
        </span>
      </span>
      <span className="hidden min-w-0 flex-wrap gap-1.5 md:flex">
        {fraco && <Selo familia="amarelo" tamanho="p">Vale revisar</Selo>}
        {pediu && <Selo familia="roxo" tamanho="p">{pediu}</Selo>}
      </span>
      <span className="flex justify-end">
        {fraco && slug ? <Botao variante="fantasma" tamanho="p" className="-mr-2" asChild><Link to={`/aluno?assunto=${slug}`}>Estudar</Link></Botao> : null}
      </span>
    </div>
  )
}

function LinhaConta({ icone, titulo, para, aoClicar }: { icone: ReactNode; titulo: string; para?: string; aoClicar?: () => void }) {
  const classe = 'group/linha flex min-h-14 w-full items-center gap-3 border-t-2 border-borda px-4 text-left transition-colors duration-150 first:border-t-0 hover:bg-fundo-suave md:[&:nth-child(2)]:border-t-0 md:odd:border-r-2'
  const miolo = (
    <>
      <span aria-hidden className="grid size-8 shrink-0 place-items-center text-apoio [&_svg]:size-6">{icone}</span>
      <span className="t-cartao min-w-0 flex-1 truncate text-tinta">{titulo}</span>
      {(para || titulo === 'Ajustes') && <ChevronRight aria-hidden strokeWidth={2.5} className="size-5 shrink-0 text-apagado transition-transform duration-150 group-hover/linha:translate-x-0.5" />}
    </>
  )
  return para ? <Link to={para} className={classe}>{miolo}</Link> : <button type="button" onClick={aoClicar} className={classe}>{miolo}</button>
}

export function Eu() {
  const navegar = useNavigate()
  const aluno = useAlunoAtual()
  const como = useComoEstouIndo()
  const [materia, setMateria] = useState(como[0]?.materia ?? 'Química')
  const [ajustes, setAjustes] = useState(false)
  const assuntos = como.find((d) => d.materia === materia)?.assuntos ?? []

  const materias = !aluno.novo && como.length <= 4 ? (
    <Segmentado rotulo="Matéria" className="max-sm:[&>button]:gap-1 max-sm:[&>button]:px-1.5 max-sm:[&>button]:text-[13px] max-sm:[&_svg]:!size-5" valor={materia} aoMudar={setMateria}
      opcoes={como.map((d) => {
        const m = materiaDe(d.materia)
        return { id: d.materia, rotulo: d.materia, icone: m ? <Icone id={m.icone} tamanho={24} /> : undefined }
      })} />
  ) : undefined

  return (
    <Pagina tipo="leitura" cabecalho={<CabecalhoPagina titulo="Eu" complemento={`${aluno.turma} · ${aluno.escola}`} />}>
      <div className="grid content-start gap-8">
        <Secao titulo="Como estou indo" acao={materias} className="[&>div:first-child]:max-sm:flex-col [&>div:first-child]:max-sm:items-start [&>div:first-child>div]:max-sm:ml-0">
          {aluno.novo ? (
            <Cartao className="flex items-center gap-4">
              <Onca pose="apontando" tamanho={72} animada={false} />
              <div>
                <p className="t-cartao text-tinta">Suas notas aparecem aqui</p>
                <p className="t-apoio">Depois que a professora aprovar a primeira correção.</p>
              </div>
            </Cartao>
          ) : (
            <Cartao semRespiro className="overflow-hidden">
              {assuntos.map((a) => <LinhaAssunto key={a.nome} a={a} materia={materia} />)}
            </Cartao>
          )}
        </Secao>

        <nav aria-label="Conta">
          <Cartao semRespiro className={cn('grid overflow-hidden md:grid-cols-2')}>
            <LinhaConta icone={<Lock strokeWidth={2.5} />} titulo="Privacidade" para="/aluno/eu/privacidade" />
            <LinhaConta icone={<Settings strokeWidth={2.5} />} titulo="Ajustes" aoClicar={() => setAjustes(true)} />
            <LinhaConta icone={<RotateCcw strokeWidth={2.5} />} titulo="Rever a introdução" para="/aluno/bem-vindo?rever=1" />
            <LinhaConta icone={<LogOut strokeWidth={2.5} />} titulo="Sair" aoClicar={() => navegar('/e/colegio-aurora')} />
          </Cartao>
        </nav>
      </div>

      <Configuracoes papel="aluno" aberta={ajustes ? 'geral' : null} aoFechar={() => setAjustes(false)} />
    </Pagina>
  )
}
