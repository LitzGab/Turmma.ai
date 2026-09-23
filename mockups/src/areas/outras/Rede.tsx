import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Marca } from '@/components/marca/Pinta'
import { BarraRotulada, Cartao, NotaMockup, NumeroPainel } from '@/components/turmma/tela'
import { AvisoInfo, campo, Segmentos, TabelaResponsiva, type Coluna } from '@/areas/coordenacao/_b-pecas'

/* Área da rede (seção 4, F14): consolidado por escola, comparativo e adoção — SEMPRE em agregado.
   A rede nunca alcança dado individual de aluno nem conversa de tutor (regra 10, item 8).
   Página própria, sem a casca dos três papéis: quem entra aqui é a secretaria, não a escola. */

type Escola = { nome: string; alunos: number; turmasTutor: string; geradas: number; aprovadas: number; consumo: number }

/* Rede e escolas 100% sintéticas. */
const ESCOLAS_REDE: Escola[] = [
  { nome: 'E. M. Rio Cachoeira', alunos: 712, turmasTutor: '14 de 22', geradas: 486, aprovadas: 95, consumo: 64 },
  { nome: 'E. M. Araucária', alunos: 648, turmasTutor: '11 de 20', geradas: 402, aprovadas: 93, consumo: 58 },
  { nome: 'E. M. Ipê Amarelo', alunos: 590, turmasTutor: '9 de 18', geradas: 351, aprovadas: 96, consumo: 52 },
  { nome: 'E. M. Manacá', alunos: 534, turmasTutor: '12 de 17', geradas: 377, aprovadas: 91, consumo: 71 },
  { nome: 'E. M. Bem-te-vi', alunos: 498, turmasTutor: '6 de 16', geradas: 214, aprovadas: 97, consumo: 39 },
  { nome: 'E. M. Figueira', alunos: 430, turmasTutor: '8 de 14', geradas: 268, aprovadas: 94, consumo: 55 },
]

const ACERTO_SERIE: Record<string, [string, number, string][]> = {
  matematica: [['6º ano', 68, '31 turmas'], ['7º ano', 61, '29 turmas'], ['8º ano', 57, '28 turmas'], ['9º ano', 63, '27 turmas']],
  ciencias: [['6º ano', 72, '31 turmas'], ['7º ano', 66, '29 turmas'], ['8º ano', 64, '28 turmas'], ['9º ano', 59, '27 turmas']],
  portugues: [['6º ano', 70, '31 turmas'], ['7º ano', 69, '29 turmas'], ['8º ano', 62, '28 turmas'], ['9º ano', 65, '27 turmas']],
}

const nf = new Intl.NumberFormat('pt-BR')

export function Rede() {
  const [disciplina, setDisciplina] = useState<'matematica' | 'ciencias' | 'portugues'>('matematica')

  const colunas: Coluna<Escola>[] = [
    { titulo: 'Escola', celula: (e) => <span className="font-semibold text-tinta">{e.nome}</span> },
    { titulo: 'Alunos', celula: (e) => <span className="tabular-nums">{nf.format(e.alunos)}</span> },
    { titulo: 'Turmas com Tutor', celula: (e) => <span className="tabular-nums">{e.turmasTutor}</span> },
    { titulo: 'Saídas de IA no mês', celula: (e) => <span className="tabular-nums">{nf.format(e.geradas)}</span> },
    { titulo: 'Aprovadas por gente', celula: (e) => <span className="font-medium tabular-nums text-ok">{e.aprovadas}%</span> },
    { titulo: 'Consumo de IA', celula: (e) => (
      <span className="inline-flex w-full min-w-[120px] items-center justify-end gap-2.5 md:justify-start">
        <Progress value={e.consumo} aria-label={`Consumo de ${e.nome}`} className="h-2 w-20 bg-ia-cx [&>div]:bg-noite" />
        <span className="tabular-nums">{e.consumo}%</span>
      </span>
    ) },
  ]

  return (
    <div className="min-h-svh bg-fundo">
      <header className="sticky top-0 z-30 border-b border-linha bg-fundo">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-3 px-4 md:h-16 md:px-8">
          <Marca />
          <span className="hidden h-5 w-px bg-linha sm:block" />
          <p className="hidden min-w-0 truncate text-sm text-apoio sm:block"><b className="font-semibold text-tinta">Secretaria Municipal de Educação</b> · visão de rede</p>
          <Button variant="discreto" size="sm" className="ml-auto mr-28 h-11 md:mr-0 md:h-9" asChild><Link to="/entrar"><LogOut /> Sair</Link></Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 md:px-8 md:pt-9">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="mb-1.5 text-sm text-apoio sm:hidden"><b className="font-semibold text-tinta">Secretaria Municipal de Educação</b> · visão de rede</p>
            <h1 className="titulo-tela text-tinta">Rede · setembro</h1>
            <p className="mt-1.5 max-w-[72ch] text-[15px] text-sutil">Seis escolas, em agregado. Para acompanhar adoção, conformidade e orçamento — não para olhar aluno nem professor.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select defaultValue="set">
              <SelectTrigger aria-label="Período" className={`${campo} w-48`}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-controle">
                {[['set', 'Setembro de 2026'], ['ago', 'Agosto de 2026'], ['bim', '3º bimestre']].map(([v, n]) => <SelectItem key={v} value={v} className="rounded-linha">{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="secundario" className="md:h-10"><Download /> Exportar relatório da rede</Button>
          </div>
        </div>

        <AvisoInfo icone={ShieldCheck} titulo="Aqui só existe dado agregado">
          A rede nunca alcança dado individual de aluno, nem conversa com o Tutor, nem indicador de um professor. Cada escola é controladora dos próprios dados;
          o que chega à secretaria é a soma.
        </AvisoInfo>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <NumeroPainel rotulo="Escolas na rede" valor="6" apoio="todas com a estrutura importada" />
          <NumeroPainel rotulo="Alunos ativos" valor={nf.format(3412)} apoio="6º ao 9º ano" />
          <NumeroPainel rotulo="Aprovado por gente" valor="94%" apoio="do que a IA gerou no mês; o resto espera" />
          <NumeroPainel rotulo="Consumo do mês" valor="58%" apoio={<Progress value={58} aria-label="Consumo do orçamento da rede" className="mt-1 h-2 bg-ia-cx [&>div]:bg-noite" />} />
        </div>

        <h2 className="mb-3 mt-8 font-corpo text-base font-semibold text-tinta">Consolidado por escola</h2>
        <TabelaResponsiva colunas={colunas} linhas={ESCOLAS_REDE} chave={(e) => e.nome} />
        <p className="mt-2 text-[13px] text-sutil">Em ordem de número de alunos. Não é classificação: escolas de tamanho e contexto diferentes não se comparam por posição.</p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Cartao titulo="Acerto médio por série, na rede">
            <div className="-mt-1 mb-5">
              <Segmentos rotulo="Disciplina" valor={disciplina} aoMudar={setDisciplina}
                opcoes={[{ id: 'matematica', nome: 'Matemática' }, { id: 'ciencias', nome: 'Ciências' }, { id: 'portugues', nome: 'Português' }]} />
            </div>
            <div className="grid gap-4">
              {ACERTO_SERIE[disciplina].map(([serie, valor, turmas]) => <BarraRotulada key={serie} rotulo={serie} detalhe={turmas} valor={valor} />)}
            </div>
            <p className="mt-5 text-[13px] leading-snug text-sutil">Só avaliações objetivas com diagnóstico aprovado pelo professor. Recorte com menos de dois professores não aparece.</p>
          </Cartao>

          <Cartao titulo="Adoção: turmas com uso na semana">
            <div className="grid gap-4">
              {ESCOLAS_REDE.map((e) => {
                const [com, de] = e.turmasTutor.split(' de ').map(Number)
                return <BarraRotulada key={e.nome} rotulo={e.nome} detalhe={`${com} de ${de} turmas`} valor={Math.round((com / de) * 100)} tom="neutro" />
              })}
            </div>
            <p className="mt-5 text-[13px] leading-snug text-sutil">Adoção é por escola e por turma. Não existe lista de quem usa nem alerta de professor que não usa: recusar a ferramenta não gera indicador.</p>
          </Cartao>
        </div>

        <NotaMockup>
          F14 (governança de rede) · fora do MVP de apresentação. Aplica regra 10 item 8 (a rede lê apenas agregado), D45 revista (grupo mínimo de dois
          professores no recorte), D64 (sem adoção nominal, sem ranking), D41 (orçamento de IA por rede) e D10 (cada escola é controladora). Escolas e
          números são sintéticos.
        </NotaMockup>
      </main>
    </div>
  )
}
