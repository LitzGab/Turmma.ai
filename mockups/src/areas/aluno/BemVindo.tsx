import { useMemo, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpen, Bot, Eye } from 'lucide-react'
import { Introducao, LadrilhoIcone, Opcao, Selo, materiaDe, type PassoIntroducao } from '@/components/duo'
import { AvatarIA } from '@/components/duo/onca'
import { Icone } from '@/components/duo/icones'
import { ChipPagina } from '@/components/turmma/ia'
import { cn } from '@/lib/utils'
import { praFazer, useTarefasDoAluno } from '@/dados/avaliacoes'
import { useAlocacoes } from '@/dados/escola-estado'
import { preferencias, ZOOM_DO_TAMANHO, type TamanhoTexto } from '@/dados/preferencias'
import { sessao, useAlunoAtual, useIntroducaoVista } from '@/dados/sessao'

/* A INTRODUÇÃO DO ALUNO (/aluno/bem-vindo; plano de painéis e introdução, seção 2.3). Cinco telas na peça Introducao.
   1 · o Tutor é um programa da escola, pode errar e mostra a página (Decreto 12.880, art. 11 — lei);
   2 · os professores veem o que ele pergunta, com o professor confirmado da turma (D8; Decreto 12.880, art. 11 — lei);
   3 · o tamanho da letra, que grava em preferencias.texto.aluno (o mesmo de Eu › Ajustes);
   4 · o treino de "Avisar um adulto", com o mesmo desenho e peso da casca (D61; ECA Digital, art. 28, e
       Decreto 12.880, art. 41 — lei). Nada é enviado;
   5 · o fim, com a primeira tarefa pendente (ou o lugar da primeira dúvida).
   Uma vez por aluno; ?rever=1 ou ?como= (Mapa) mostra de novo. Nada de pontos, sequência, meta ou notificação (lei).
   Para um aluno de 11 anos: uma ideia por balão; sem "dados", "IA", "LGPD" nem "monitorar". */

const TAMANHOS: { id: TamanhoTexto; rotulo: string; px: number }[] = [
  { id: 'padrao', rotulo: 'Normal', px: 17 },
  { id: 'grande', rotulo: 'Grande', px: 20 },
  { id: 'maior', rotulo: 'Bem grande', px: 24 },
]
const NOME_DA_LETRA: Record<TamanhoTexto, string> = { padrao: 'normal', grande: 'grande', maior: 'bem grande' }

function LinhaLadrilho({ ladrilho, children }: { ladrilho: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      {ladrilho}
      <span className="t-corpo min-w-0 flex-1 text-tinta">{children}</span>
    </li>
  )
}

export function BemVindo() {
  const aluno = useAlunoAtual()
  const navegar = useNavigate()
  const [params] = useSearchParams()
  // lido uma vez: a raiz do app tira o ?como= da barra logo depois
  const [forcada] = useState(() => params.has('rever') || params.has('como'))
  const vista = useIntroducaoVista('aluno')
  // Lida uma vez, ao abrir: o COMEÇAR marca a introdução como vista antes de navegar, e a guarda não pode passar por cima do destino.
  const [vistaAoAbrir] = useState(() => vista)

  const [letra, setLetra] = useState<TamanhoTexto | null>(null)
  const [treinou, setTreinou] = useState(false)

  // quem acompanha a turma: os professores com a alocação confirmada nela
  const alocacoes = useAlocacoes()
  const quem = useMemo(() => {
    const nomes = [...new Set(alocacoes.filter((a) => a.turmaId === aluno.turmaId && a.estado === 'confirmado').map((a) => a.professor))]
    if (nomes.length === 1) return `Prof. ${nomes[0].split(' ')[0]} acompanha a ${aluno.turma}.`
    if (nomes.length > 1) return `Seus professores acompanham a ${aluno.turma}.`
    return 'Seus professores acompanham.'
  }, [alocacoes, aluno.turmaId, aluno.turma])

  // a mini conversa é da disciplina da turma: a 3ºA da Alice só tem Física (o Marcos)
  const fisica = useMemo(() => {
    const ds = new Set(alocacoes.filter((a) => a.turmaId === aluno.turmaId && a.estado === 'confirmado').map((a) => a.disciplina))
    return ds.size === 1 && ds.has('Física')
  }, [alocacoes, aluno.turmaId])
  const exemplo = fisica
    ? { pergunta: 'como passo km/h para m/s?', resposta: 'Divida por 3,6. 72 km/h viram 20 m/s.', pagina: 0 }
    : { pergunta: 'como acho o reagente limitante?', resposta: 'Divida os mols pelo coeficiente. O menor limita.', pagina: 151 }

  const primeira = praFazer(useTarefasDoAluno())[0]

  if (vistaAoAbrir && !forcada) return <Navigate to="/aluno" replace />

  const sair = () => navegar('/aluno', { replace: true })
  const comecar = () => {
    sessao.verIntroducao('aluno')
    navegar(primeira ? `/aluno/tarefas/${primeira.id}` : '/aluno', { replace: true })
  }

  const passos: PassoIntroducao[] = [
    {
      id: 'tutor', pose: 'acenando', obrigatorio: !forcada,
      fala: <>Oi, {aluno.primeiro}! Eu sou o Tutor, um programa da escola.</>,
      conteudo: (
        <ul className="grid gap-4 pt-2">
          <LinhaLadrilho ladrilho={<LadrilhoIcone familia="laranja" tamanho={40} icone={<Bot className="text-(--texto)" strokeWidth={2.5} />} />}>
            Posso errar. Confira no livro.
          </LinhaLadrilho>
          <LinhaLadrilho ladrilho={<LadrilhoIcone familia="azul" tamanho={40} icone={<BookOpen className="text-(--texto)" strokeWidth={2.5} />} />}>
            Mostro a página de onde tirei.
          </LinhaLadrilho>
        </ul>
      ),
    },
    {
      id: 'professores', pose: 'apontando', obrigatorio: !forcada, rotuloContinuar: 'Entendi',
      fala: 'Seus professores veem o que você me pergunta.',
      conteudo: (
        <div className="grid gap-4">
          {/* a mini conversa, só de leitura */}
          <div aria-label="Exemplo de conversa" className="grid gap-2.5 rounded-[16px] border-2 border-borda bg-fundo-suave p-3">
            <p className="t-corpo ml-auto max-w-[85%] rounded-[16px] bg-azul-claro px-3.5 py-2 text-azul-texto">{exemplo.pergunta}</p>
            <div className="flex items-start gap-2">
              <AvatarIA agente="tutor" tamanho={32} />
              <p className="t-corpo max-w-[85%] rounded-[16px] border-2 border-borda bg-white px-3.5 py-2 text-tinta">
                {exemplo.resposta} {exemplo.pagina > 0 && <ChipPagina pagina={exemplo.pagina} />}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LadrilhoIcone familia="azul" tamanho={40} icone={<Eye className="text-(--texto)" strokeWidth={2.5} />} />
            <p className="t-corpo min-w-0 flex-1 text-tinta">{quem}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'letra', pose: 'pensando', pronto: !!letra, reacao: 'Assim fica bom!',
      fala: 'Qual tamanho de letra fica bom pra você?',
      aoContinuar: () => { if (letra) preferencias.mudar({ texto: { aluno: letra } }) },
      conteudo: (
        <div className="grid gap-3">
          <div role="radiogroup" aria-label="Tamanho da letra" className="grid gap-3">
            {TAMANHOS.map((t) => (
              <Opcao key={t.id} nome="letra" valor={t.id} marcado={letra === t.id} aoMudar={() => setLetra(t.id)}
                icone={<span className="font-bold leading-none" style={{ fontSize: t.px }}>Aa</span>}>
                {t.rotulo}
              </Opcao>
            ))}
          </div>
          {/* a prévia ao vivo: o zoom fica só aqui, nunca no documento */}
          <div aria-hidden className="flex items-center gap-2 overflow-hidden">
            <AvatarIA agente="tutor" tamanho={32} />
            <p className="t-corpo w-fit rounded-[16px] border-2 border-borda bg-white px-3.5 py-2 text-tinta transition-[zoom] duration-150"
              style={{ zoom: ZOOM_DO_TAMANHO[letra ?? 'padrao'] || '1' }}>
              Assim fica a minha letra.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'avisar', pose: 'acolhendo', obrigatorio: !forcada, pronto: treinou,
      reacao: 'Isso! Aqui é só treino. Ninguém foi avisado.',
      fala: 'Se algo te incomodar, toque em Avisar um adulto.',
      conteudo: (
        <div className="grid gap-3">
          <div className="relative rounded-[16px] border-2 border-dashed border-borda-forte p-3 pt-5">
            <Selo familia="roxo" tamanho="p" className="absolute -top-2.5 left-3">Treino</Selo>
            {/* a réplica do item da casca: 52 px, ícone de 32 numa caixa de 36, rótulo em caixa alta a 14 px (D61) */}
            <button type="button" onClick={() => setTreinou(true)} aria-pressed={treinou}
              className={cn(
                'flex h-[52px] w-full items-center gap-4 rounded-[12px] border-2 px-2 py-1 text-left transition-colors duration-150',
                treinou ? 'border-azul-borda bg-azul-claro text-azul-texto' : 'border-transparent text-sutil hover:bg-fundo-suave hover:text-tinta',
              )}>
              <span className="grid size-9 shrink-0 place-items-center"><Icone id="avisar" tamanho={32} /></span>
              <span className="t-rotulo min-w-0 flex-1 truncate text-[14px]">Avisar um adulto</span>
            </button>
          </div>
          {treinou && <p className="t-corpo animate-entra text-apoio">Lá, quem lê é a orientação da escola.</p>}
        </div>
      ),
    },
  ]

  const materia = primeira ? materiaDe(primeira.materia) : undefined

  return (
    <Introducao rotulo="Introdução do aluno" agente="tutor" aoSair={sair} passos={passos}
      fim={{
        fala: <>Pronto, {aluno.primeiro}!</>,
        resumo: [`Letra ${NOME_DA_LETRA[letra ?? 'padrao']}`, 'Avisar um adulto fica no menu'],
        conteudo: primeira ? (
          <div className="flex items-center gap-3 rounded-[16px] border-2 border-borda bg-white p-4">
            <LadrilhoIcone familia={materia?.familia ?? 'azul'} tamanho={44} icone={<Icone id={materia?.icone ?? 'lista'} />} />
            <div className="min-w-0 flex-1">
              <p className="t-cartao truncate text-tinta">{primeira.titulo}</p>
              <p className="t-apoio">{primeira.prazo}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[16px] border-2 border-dashed border-borda p-4">
            <AvatarIA agente="tutor" tamanho={40} />
            <p className="t-corpo text-apoio">Sua primeira dúvida vai aqui.</p>
          </div>
        ),
        aoComecar: comecar,
      }} />
  )
}
