import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Avatar, BarraProgresso, Botao, Cartao, CartaoPainel, EstadoVazio, Faixa, GradePainel, LadrilhoIcone, Linha, Selo, materiaDe,
} from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { Onca } from '@/components/duo/onca'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import { useAlunosDaTurma } from '@/dados/acesso'
import { alunosDa, dificuldades, mediaSem, useForaDaMedia, type Aluno } from '@/dados/alunos'
import { useEnvios, type Envio } from '@/dados/envios'
import { proximaAulaDe, useSemana } from '@/dados/grade'
import { useProfessorAtual } from '@/dados/sessao'
import { useTurmasDoProfessor, type TurmaProfessora } from '@/dados/turmas-professora'
import { capitulosDa } from '@/dados/turmas-resumo'
import { usoTutorDa } from '@/dados/turma-atividades'
import { cn } from '@/lib/utils'
import { ConviteNaTela } from './ConvidarAlunos'
import { aoVivoDa } from './Sala'
import { UsoTutorTurma, useAjustesTurma } from './UsoTutor'

/* A ABA "HOJE" DA TURMA — 14ª rodada (05/10/2026; plano ux-composicao 1.3, 5.1 e 5.2).
   O que a professora faz AGORA com esta turma, numa grade de 12 colunas (GradePainel), sem rolar a 1440 × 780:
   · 1ª linha, as duas com 96 px: a FAIXA da aula (8 colunas), na cor da matéria: AGORA · 10H30 e o conteúdo, com
     COMEÇAR AULA; fora da hora, PRÓXIMA · TERÇA 7H30 e PREPARAR (dados/grade.ts; quem não tem grade não tem faixa, e
     o assunto ocupa a linha toda). E o ASSUNTO PARA REVISAR (4): o de menor acerto, a barra, a página e GERAR
     REVISÃO (a conversa nova, com a Atividade); já enviada, "Enviada", que leva à atividade.
   · 2ª linha, com a mesma altura: QUEM PRECISA DE ATENÇÃO (8), linhas de 56 px, cada uma com UM fato do trabalho em
     até 4 palavras ("3 entregas faltando", "abaixo de 50% · mol"); nunca falta nem comportamento (D57); leva à ficha.
     E O QUE O TUTOR VIU (4): três números da turma inteira (usaram · travaram · pediram a resposta) e VER MAIS
     (?ver=tutor), sem nome nem horário.
   · "Esperando você nesta turma" SAIU: mora no sino, filtrado pela turma ("5 esperando" no cabeçalho).
   · Turma sem ninguém (a 3ºA recém-confirmada): a onça apontando e o convite na tela. */

/* A revisão já enviada de um assunto: um envio à turma cujo título começa por "Revisão" e divide uma palavra com o
   nome do assunto ("Revisão de massa em mol" × "Mol e massa molar"). */
const VAZIAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o', 'na', 'no', 'revisão', 'revisao'])
const palavras = (s: string) => s.toLowerCase().split(/[^a-zà-ú0-9]+/).filter((w) => w && !VAZIAS.has(w))
function revisaoEnviada(envios: Envio[], assunto: string): Envio | undefined {
  const doAssunto = new Set(palavras(assunto))
  return envios.find((e) => /^revis/i.test(e.titulo) && palavras(e.titulo).some((w) => doAssunto.has(w)))
}

/** Quem precisa de atenção: só quem já entrou, com um fato só. Entra quem tem 2 ou mais entregas faltando, média
    abaixo de 5, ou 3 ou mais assuntos abaixo de 50% com média abaixo de 6. Falta não entra (a chamada saiu; D57). */
function useAtencao(turmaId: string, dentro: Set<string>): { aluno: Aluno; fato: string }[] {
  const fora = useForaDaMedia(turmaId)
  return useMemo(() => alunosDa(turmaId)
    .filter((a) => dentro.has(a.nome))
    .map((a) => {
      const media = mediaSem(a, fora)
      const fracas = media === null ? [] : dificuldades(a)
      const faltando = a.entregas.total - a.entregas.feitas
      const entra = faltando >= 2 || (media !== null && media < 5) || (fracas.length >= 3 && media !== null && media < 6)
      const fato = faltando >= 2 ? `${faltando} entregas faltando`
        : fracas.length ? `abaixo de 50% · ${fracas[0].curto.toLowerCase().split(/\s+/)[0]}` : faltando === 1 ? '1 entrega faltando' : ''
      const peso = faltando * 1.5 + fracas.length * 2 + (media !== null && media < 6 ? 2 : 0)
      return { aluno: a, fato, entra, peso }
    })
    .filter((x) => x.entra && x.fato)
    .sort((x, y) => y.peso - x.peso)
    .slice(0, 8)
    .map(({ aluno, fato }) => ({ aluno, fato })), [turmaId, dentro, fora])
}

export function HojeTurma({ turmaId }: { turmaId: string }) {
  const t = useTurmasDoProfessor().find((x) => x.id === turmaId)
  const nomes = useAlunosDaTurma(turmaId)
  const dentro = useMemo(() => new Set(nomes.filter((n) => n.situacao === 'na-turma').map((n) => n.nome)), [nomes])
  if (!t) return null
  if (t.nova) return <HojeNova t={t} entraram={dentro.size} total={nomes.length} />
  return <Hoje t={t} dentro={dentro} />
}

/* ── A turma nova (a 3ºA): ninguém ainda, ou os primeiros entrando ─────────────────────────────────────────── */

function HojeNova({ t, entraram, total }: { t: TurmaProfessora; entraram: number; total: number }) {
  return (
    <div className="mx-auto grid w-full max-w-[640px] content-start gap-5 pt-2">
      {entraram === 0 ? (
        <>
          <EstadoVazio className="py-2" ilustracao={<Onca pose="apontando" tamanho={72} />} titulo="Ninguém entrou ainda" />
          <ConviteNaTela turmaId={t.id} />
        </>
      ) : (
        <Cartao semRespiro>
          <Linha para={`/professor/turmas/${t.id}?aba=alunos`} chevron titulo="Alunos na turma"
            inicio={<LadrilhoIcone familia="verde" tamanho={40} icone={<Icone id="alunos" />} />}
            abaixo={<span>{entraram} de {total} entraram</span>} />
        </Cartao>
      )}
    </div>
  )
}

/* ── A turma com gente ─────────────────────────────────────────────────────────────────────────────────── */

function Hoje({ t, dentro }: { t: TurmaProfessora; dentro: Set<string> }) {
  const atencao = useAtencao(t.id, dentro)
  const [ver, setVer] = useParametro('ver')
  // um assunto só (o de menor acerto); o resto mora em Notas
  const revisar = capitulosDa(t.id).filter((c) => c.acerto < 60).sort((x, y) => x.acerto - y.acerto)[0]
  const temFaixa = useTemFaixa(t)

  return (
    <GradePainel className={cn('content-start lg:min-h-[420px] lg:flex-1', temFaixa || revisar ? 'lg:grid-rows-[96px_minmax(0,1fr)]' : 'lg:grid-rows-[minmax(0,1fr)]')}>
      {temFaixa && <FaixaDaAula t={t} className={cn('col-span-12', revisar && 'lg:col-span-8')} />}
      {revisar && <AssuntoParaRevisar t={t} c={revisar} className={cn('col-span-12', temFaixa && 'lg:col-span-4')} />}

      <CartaoPainel titulo="Quem precisa de atenção" className="col-span-12 lg:col-span-8 [&>div:last-child]:-mx-4 lg:[&>div:last-child]:-mx-5 [&>div:last-child]:-mb-4 lg:[&>div:last-child]:-mb-5">
        {atencao.length === 0 ? (
          <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto_2fr] px-4 pb-4 lg:px-5">
            <span aria-hidden />
            <EstadoVazio ilustracao={<Onca pose="dormindo" tamanho={72} />} titulo="Ninguém com entrega faltando ou nota baixa agora" className="gap-2 py-2" />
            <span aria-hidden />
          </div>
        ) : (
          <ul aria-label="Quem precisa de atenção" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {atencao.map(({ aluno, fato }) => (
              <li key={aluno.id}>
                <Linha para={`/professor/turmas/${t.id}?aba=alunos&aluno=${aluno.id}`} chevron titulo={aluno.nome}
                  inicio={<Avatar nome={aluno.nome} tamanho={32} />} fim={<span className="t-apoio max-md:hidden">{fato}</span>}
                  abaixo={<span className="md:hidden">{fato}</span>}
                  className="min-h-14 py-1.5 lg:px-5 md:[&>span:nth-child(2)>span:nth-child(2)]:hidden" />
              </li>
            ))}
          </ul>
        )}
      </CartaoPainel>

      <OQueOTutorViu t={t} className="col-span-12 lg:col-span-4" aoVerMais={() => setVer('tutor')} />

      <PainelLado aberto={ver === 'tutor'} aoFechar={() => setVer(null)} titulo="O que o Tutor viu"
        descricao="Só números da turma inteira. Sem nome, sem horário e sem o texto das conversas.">
        <UsoTutorTurma turmaId={t.id} />
      </PainelLado>
    </GradePainel>
  )
}

/** Assunto para revisar: 96 px, a mesma altura da faixa da aula. */
function AssuntoParaRevisar({ t, c, className }: { t: TurmaProfessora; c: ReturnType<typeof capitulosDa>[number]; className?: string }) {
  const envios = useEnvios(t.id)
  const nome = c.nome.replace(/^\d+(\.\d+)*\s+/, '')
  const pedido = `Revisão: ${nome} (p. ${c.pagina})`
  const enviada = revisaoEnviada(envios, nome)
  return (
    <section aria-labelledby="revisar" className={cn('flex h-24 min-w-0 flex-col justify-center gap-1.5 rounded-[16px] border-2 border-borda bg-white px-4 lg:px-5', className)}>
      <div className="flex min-w-0 items-center gap-2">
        <h2 id="revisar" className="t-selo min-w-0 flex-1 truncate text-sutil"><span className="max-sm:hidden">Assunto para revisar</span><span className="sm:hidden">Revisar</span></h2>
        {enviada ? (
          <Link to={`/professor/turmas/${t.id}?aba=atividades&atividade=envio-${enviada.docId}`} aria-label="Revisão enviada: ver a atividade"
            className="-mr-1 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] px-1 text-[13px] font-bold uppercase tracking-[0.04em] text-verde-texto hover:underline">
            <Icone id="aprovado" tamanho={18} />Enviada
          </Link>
        ) : (
          <Botao asChild variante="fantasma" tamanho="p" className="-mr-3 shrink-0">
            <Link to={`/professor/conversa/nova?ferramenta=atividade&turma=${t.id}&pedido=${encodeURIComponent(pedido)}`}>Gerar revisão</Link>
          </Botao>
        )}
      </div>
      <p className="t-cartao truncate text-tinta" title={nome}>{nome}</p>
      <div className="flex min-w-0 items-center gap-3">
        <BarraProgresso valor={c.acerto} familia={c.acerto < 50 ? 'vermelho' : 'amarelo'} altura={12} rotulo={`Acerto em ${nome}`} className="min-w-0 flex-1" />
        <span className="t-apoio shrink-0 tabular-nums">{c.acerto}% · p. {c.pagina}</span>
      </div>
    </section>
  )
}

/** O que o Tutor viu: três números da turma inteira e VER MAIS. */
function OQueOTutorViu({ t, className, aoVerMais }: { t: TurmaProfessora; className?: string; aoVerMais: () => void }) {
  const uso = usoTutorDa(t.id)
  const silenciado = useAjustesTurma(t.id).silencio
  const travaram = aoVivoDa(t.id).filter((v) => v.fato === 'travou').length
  const duvidas = uso.duvidas.slice(0, 3)
  const numeros = [
    { rotulo: 'Usaram', valor: <>{uso.usaram}<span className="text-[15px] text-sutil"> de {uso.alunos}</span></> },
    { rotulo: 'Travaram', valor: travaram },
    { rotulo: 'Pediram a resposta', valor: uso.prontas.alunos },
  ]
  return (
    <CartaoPainel className={className} titulo="O que o Tutor viu"
      acao={silenciado ? <Selo familia="neutro" tamanho="p">Silenciado hoje</Selo> : undefined}>
      <dl className="grid grid-cols-[minmax(0,1fr)]">
        {numeros.map((n) => (
          <div key={n.rotulo} className="flex min-h-14 min-w-0 items-center justify-between gap-3 border-t-2 border-borda first:border-t-0">
            <dt className="t-apoio">{n.rotulo}</dt>
            <dd className="text-[24px] font-bold leading-[30px] tabular-nums text-tinta">{n.valor}</dd>
          </div>
        ))}
      </dl>
      {duvidas.length > 0 && (
        <div className="mt-2 grid gap-1.5 rounded-[12px] bg-fundo-suave px-3 py-2.5">
          <p className="t-selo text-sutil">{duvidas.length > 1 ? 'As dúvidas que mais voltaram' : 'A dúvida que mais voltou'}</p>
          <ul className="grid gap-1">
            {duvidas.map((d) => (
              <li key={d.texto} className="flex min-w-0 items-baseline gap-2 text-[15px] font-medium leading-[21px] text-tinta">
                <span className="min-w-0 flex-1 truncate" title={d.texto}>“{d.texto}”</span>
                <span className="shrink-0 tabular-nums text-sutil">{d.vezes}×</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Botao variante="fantasma" tamanho="p" className="-ml-3 mt-auto self-start pt-2" onClick={aoVerMais}>Ver mais</Botao>
    </CartaoPainel>
  )
}

/** A turma tem aula hoje (agora) ou uma próxima na grade? */
function useTemFaixa(t: TurmaProfessora) {
  const prof = useProfessorAtual()
  const semana = useSemana(prof.id, t.escolaId)
  return !!aulaDaFaixa(t, semana)
}

function aulaDaFaixa(t: TurmaProfessora, semana: ReturnType<typeof useSemana>) {
  const agora = (semana[0]?.aulas ?? []).find((a) => a.turmaId === t.id && a.agora)
  if (agora) return { aula: agora, agora: true, rotulo: `Agora · ${agora.hora}` }
  const prox = proximaAulaDe(t.id)
  const aula = prox ? semana.flatMap((d) => d.aulas).find((a) => a.turmaId === t.id && a.data === prox.data && a.hora === prox.hora) : undefined
  return aula && prox ? { aula, agora: false, rotulo: `Próxima · ${prox.dia} ${prox.hora}` } : null
}

/** A faixa da aula, na cor da matéria, com 96 px. Agora: COMEÇAR AULA. Fora da hora: a próxima aula e PREPARAR. */
function FaixaDaAula({ t, className }: { t: TurmaProfessora; className?: string }) {
  const prof = useProfessorAtual()
  const semana = useSemana(prof.id, t.escolaId)
  const materia = materiaDe(t.disciplina)
  const f = aulaDaFaixa(t, semana)
  if (!f) return null
  const { aula } = f
  return (
    <Faixa familia={materia?.familia ?? 'azul'} className={cn('h-24 flex-nowrap py-0 pl-5 pr-4 max-sm:h-auto max-sm:flex-wrap max-sm:py-4', className)}
      rotulo={f.rotulo}
      titulo={aula.conteudo ?? 'Aula ainda em branco'}
      acao={(
        <Botao asChild variante="secundario" tamanho="m">
          {f.agora
            ? <Link to={`/professor/turmas/${t.id}/aula`}>Começar aula</Link>
            : <Link to={`/professor/conversa/nova?turma=${t.id}${aula.conteudo ? `&pedido=${encodeURIComponent(aula.conteudo)}` : ''}`}>Preparar</Link>}
        </Botao>
      )}
      icone={materia ? <Icone id={materia.icone} tamanho={48} familia={materia.familia} /> : undefined} />
  )
}
