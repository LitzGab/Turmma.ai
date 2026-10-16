import { useMemo, useState } from 'react'
import { Eye, EyeOff, FileCheck2, Lock, Trophy, UserCheck } from 'lucide-react'
import { LeaderboardCard } from '@/components/ui/leaderboard-card'
import { LeaderboardRankings, type LeaderboardRankingItem } from '@/components/ui/leaderboard-rankings'
import { BotaoT, CabecalhoAba, Periodo, tipo } from '@/components/turmma/teachy'
import { PERIODOS, PONTOS, rankingDeParticipacao, type PeriodoId } from '@/dados/ranking'
import { FraseDoPe } from './Atividades'

/* ABA "RANKING" DA TURMA ABERTA (pedido do Gabriel, 20/09/2026: "dentro de turmas, quero estabelecer um rank também").
   A Teachy não tem ranking: a aba usa O MESMO MOLDE das outras abas dela (oitava rodada) — o cabeçalho com título, a
   linha de apoio, o seletor de período (aqui Semana · Mês · Bimestre) e o botão da aba ("Esconder nomes"); embaixo, em
   duas colunas a partir de ~900 px, o cartão de canto 12 com o pódio e a regra, e a turma inteira numa tabela de canto
   8 (posição · aluno · fato · variação · pontos). Altura natural: quem rola é a página da turma; com janela alta o
   cartão do pódio acompanha a rolagem da lista.
   DE ONDE VÊM AS PEÇAS: trophyso/leaderboard-card e leaderboard-podium, do 21st.dev, coladas por ele em 20/09/2026, e
   a terceira da família, leaderboard-rankings, buscada no catálogo no mesmo dia. Estão em src/components/ui, com a
   anatomia que vieram: saiu a foto (aluno não tem foto), saíram ouro, prata e bronze (laranja da pinta, preto e cinza)
   e, nesta rodada, cantos e tipografia foram para os da Teachy (12 no cartão, 8 na tabela, Quicksand em nome e número).
   A REGRA DOS PONTOS (src/dados/ranking.ts): presença na aula +10 · atividade entregue +20. **Nota, acerto e
   dificuldade não entram.** No empate fica na frente quem entregou mais cedo (outro fato de participação).
   NA TELA a palavra é PARTICIPAÇÃO: presença e entrega são fatos registrados, e é só isso que pontua. Nada aqui infere
   atenção, humor ou jeito do aluno (D57, D66). O ranking é do professor: tela de aluno não mostra dado de colega
   (regra 50, item 9), e "Esconder nomes" existe para quando a tela do professor estiver projetada. */

const NOMES = PERIODOS.map((p) => p.nome)

/** "Ana Beatriz" → "A. B." */
const soIniciais = (iniciais: string) => iniciais.split('').join('. ') + '.'

const NO_PERIODO: Record<PeriodoId, string> = { semana: 'na semana', mes: 'no mês', bimestre: 'no bimestre' }
const DO_PERIODO: Record<PeriodoId, string> = { semana: 'da semana', mes: 'do mês', bimestre: 'do bimestre' }

function Regra({ icone: Icone, texto, quantas, pontos }: { icone: typeof UserCheck; texto: string; quantas: string; pontos: number }) {
  return (
    <li className="flex items-center gap-2">
      <Icone aria-hidden className="size-3.5 shrink-0 text-sutil" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate text-[13px] leading-5 text-tinta">{texto} <span className="text-sutil">· {quantas}</span></span>
      <span className="shrink-0 font-teachy text-[14px] font-bold leading-5 text-tinta">+{pontos}</span>
    </li>
  )
}

export function RankingTurma({ turmaId }: { turmaId: string }) {
  const [periodo, setPeriodo] = useState<PeriodoId>('bimestre')
  const [semNomes, setSemNomes] = useState(false)
  const r = useMemo(() => rankingDeParticipacao(turmaId, periodo), [turmaId, periodo])

  const linhas = useMemo<LeaderboardRankingItem[]>(() => r.linhas.map((l) => ({
    userId: l.aluno.id, userName: semNomes ? soIniciais(l.aluno.iniciais) : l.aluno.nome, initials: l.aluno.iniciais,
    rank: l.posicao, value: l.pontos, byline: l.byline, bylineDetail: l.desempate, rankChange: l.variacao,
  })), [r, semNomes])
  const podio = linhas.filter((l) => l.rank <= 3)

  return (
    <section className="@container font-teachy-corpo text-tinta">
      <CabecalhoAba titulo="Ranking de participação" apoio="Pontua presença na aula e atividade entregue. Nota não conta.">
        <Periodo valor={r.periodo.nome} opcoes={NOMES} aoMudar={(nome) => setPeriodo(PERIODOS.find((p) => p.nome === nome)?.id ?? 'bimestre')} />
        <BotaoT variante="texto" tamanho="m" aria-pressed={semNomes} onClick={() => setSemNomes((v) => !v)} title="Para quando a tela estiver projetada">
          {semNomes ? <Eye aria-hidden /> : <EyeOff aria-hidden />} {semNomes ? 'Mostrar nomes' : 'Esconder nomes'}
        </BotaoT>
      </CabecalhoAba>

      <div className="grid items-start gap-5 @4xl:grid-cols-[minmax(0,392px)_minmax(0,1fr)]">
        {/* ESQUERDA: o cartão do pódio, com a regra embaixo */}
        <LeaderboardCard
          className="@4xl:top-5 @4xl:[@media(min-height:720px)]:sticky"
          icon={<Trophy strokeWidth={2} />}
          title={`Pódio ${DO_PERIODO[periodo]}`}
          fromDate={r.periodo.de} toDate={r.periodo.ate}
          description={`${r.aulas} ${r.aulas === 1 ? 'aula' : 'aulas'} · ${r.atividades} ${r.atividades === 1 ? 'entrega' : 'entregas'}`}
          podiumRankings={podio} podiumSize="lg"
          podiumProps={{ maxStack: 8, valueSuffix: 'pts', tieLabel: (n) => `${n} alunos`, className: 'gap-3 border-b border-linha sm:gap-6' }}
        >
          <div className="mt-4 rounded-[8px] bg-realce-suave px-3.5 py-3">
            <p className="flex items-baseline justify-between gap-3">
              <span className={tipo.rotulo}>Como se pontua</span>
              <span className="text-[12px] leading-4 text-sutil">até {r.maximo} pts {NO_PERIODO[periodo]}</span>
            </p>
            <ul className="mt-1.5 grid gap-1.5">
              <Regra icone={UserCheck} texto="Presença na aula" quantas={`${r.aulas} ${r.aulas === 1 ? 'aula' : 'aulas'}`} pontos={PONTOS.presenca} />
              <Regra icone={FileCheck2} texto="Atividade entregue" quantas={`${r.atividades} ${r.atividades === 1 ? 'atividade' : 'atividades'}`} pontos={PONTOS.entrega} />
            </ul>
            <p className="mt-2 border-t border-linha pt-2 text-[12px] leading-4 text-sutil">Nota e dificuldade não contam. No empate, fica na frente quem entregou mais cedo.</p>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-4 text-sutil">
            <Lock aria-hidden className="size-3.5 shrink-0" strokeWidth={1.75} />
            Só você vê este ranking. O aluno vê apenas os próprios pontos.
          </p>
        </LeaderboardCard>

        {/* DIREITA: a turma inteira, em altura natural */}
        <div className="min-w-0">
          <LeaderboardRankings rankings={linhas} changeLabel={r.periodo.anterior} columns={{ byline: 'Presença e entregas' }} />
          <FraseDoPe>{linhas.length} alunos · {r.completos} com participação completa ({r.maximo} pts). A variação compara com {r.periodo.anterior}.</FraseDoPe>
        </div>
      </div>
    </section>
  )
}
