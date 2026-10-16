import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Botao, TelaFoco } from '@/components/duo'
import { ChipFonte } from '@/components/turmma/ia'
import { useParametro } from '@/components/turmma/tela'
import { useAlocacoes } from '@/dados/escola-estado'
import { useProfessorAtual } from '@/dados/sessao'
import { turmaDaProfessora } from '@/dados/turmas-professora'
import { FichaDoAluno, LegendaFatos, SalaTurma, TRAVOU_EM, aoVivoDa } from './abas-turma/Sala'

/* COMEÇAR AULA (/professor/turmas/:turma/aula), em tela de foco, fora da casca (12ª rodada, 04/10/2026).

   A tela que a professora deixa aberta enquanto a turma trabalha:
   · no topo, ‹ (volta à turma: sair é sair, não há o que encerrar), "2ºB · Química · 3ª aula, agora" e ESCONDER NOMES
     (fantasma), para quando a tela está projetada;
   · a frase grande, com o que vale fazer agora ("8 travaram em converter massa em mol (p. 145). Vale explicar na lousa.");
   · as carteiras (abas-turma/Sala.tsx), em cartões claros, com o fato de cada aluno; tocar abre a ficha ao lado, sem
     conversa;
   · no pé, a legenda das cores com quantos em cada fato (8 travou · 2 pediu resposta…) e a supervisão declarada:
     "Os alunos sabem que você acompanha. Aqui aparece sinal, não conversa." A página do livro fica no fim da frase.
   SAÍRAM a Chamada (decisão do dono), ENCERRAR AULA (juntou com o ‹), os cartões de número e a busca do Tutor. Não há
   caixa de texto: o Tutor manda sinal, não conversa (regra 50, item 10; D69). */

export function Sala() {
  const { turma: id = '2b' } = useParams()
  const t = turmaDaProfessora(id) ?? turmaDaProfessora('2b')!
  const prof = useProfessorAtual()
  const aloc = useAlocacoes(prof.profId)
  const disciplina = aloc.find((a) => a.turmaId === t.id)?.disciplina ?? t.disciplina
  const [aluno, setAluno] = useParametro('aluno')
  const [semNomes, setSemNomes] = useState(false)

  const vivo = aoVivoDa(t.id)
  const travaram = vivo.filter((v) => v.fato === 'travou').length
  const passo = TRAVOU_EM[t.id] ?? TRAVOU_EM['2b']

  return (
    <TelaFoco
      topo={{
        voltar: `/professor/turmas/${t.id}`,
        titulo: <>{t.nome} <span className="font-medium text-sutil">· {disciplina} · 3ª aula, agora</span></>,
        acoes: (
          <Botao variante="fantasma" tamanho="m" aria-pressed={semNomes} onClick={() => setSemNomes((v) => !v)}
            icone={semNomes ? <Eye strokeWidth={2.5} /> : <EyeOff strokeWidth={2.5} />}>
            <span className="max-sm:sr-only">{semNomes ? 'Mostrar nomes' : 'Esconder nomes'}</span>
          </Botao>
        ),
      }}
      rodape={(
        <div className="mx-auto flex w-full max-w-[1232px] flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <LegendaFatos turmaId={t.id} />
          <p className="t-apoio">Os alunos sabem que você acompanha. Aqui aparece sinal, não conversa.</p>
        </div>
      )}
      classeMiolo="flex flex-col overflow-hidden"
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1280px] flex-col gap-4 px-4 pt-4 md:px-6 md:pt-5">
        {travaram > 0 && (
          <p className="shrink-0 text-balance text-[20px] font-bold leading-[27px] text-tinta md:text-[24px] md:leading-[32px]">
            {travaram} travaram em {passo.passo}. Vale explicar na lousa. <span className="inline-block align-middle"><ChipFonte pagina={passo.pagina} /></span>
          </p>
        )}
        <div className="min-h-0 flex-1 pb-3">
          <SalaTurma turmaId={t.id} semNomes={semNomes} aoAbrirAluno={(a) => setAluno(a)} alunoAberto={aluno} />
        </div>
      </div>
      <FichaDoAluno turmaId={t.id} alunoId={aluno} aoFechar={() => setAluno(null)} semConversa />
    </TelaFoco>
  )
}
