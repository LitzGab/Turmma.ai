import { BarraProgresso, NumeroGrande } from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { ChipFonte } from '@/components/turmma/ia'
import { criarFatia } from '@/dados/demo/nucleo'
import { usoNoTempoDa, usoTutorDa } from '@/dados/turma-atividades'

/* OS AJUSTES DA TURMA (o ⋯ da turma aberta, a porta única deles): Busca do Tutor nesta turma (a 2ª chave; a 1ª é da
   escola, e nunca vale em avaliação; D68) · Preparar a semana toda segunda · Silenciar o Tutor hoje. Guardados na
   demonstração (andam nas duas abas e zeram no Recomeçar). Moram aqui, junto do Tutor da turma, para a aba Hoje e a
   moldura lerem a mesma coisa; o lado do aluno lê por `useAjustesTurma(turmaId)`. */
export type AjustesTurma = { busca: boolean; semana: boolean; silencio: boolean }
const PADRAO_AJUSTES: AjustesTurma = { busca: false, semana: false, silencio: false }
const fatiaAjustes = criarFatia<Record<string, AjustesTurma>>('ajustes-turma', { '2b': { ...PADRAO_AJUSTES, semana: true } })

/** Os ajustes de uma turma: se o Tutor está silenciado hoje, se a busca está ligada e se a semana se prepara sozinha. */
export function useAjustesTurma(turmaId: string | undefined): AjustesTurma {
  const todos = fatiaAjustes.useValor()
  return (turmaId && todos[turmaId]) || PADRAO_AJUSTES
}

export const ajustesTurma = {
  mudar(turmaId: string, chave: keyof AjustesTurma, valor: boolean) {
    fatiaAjustes.mudar((x) => ({ ...x, [turmaId]: { ...(x[turmaId] ?? PADRAO_AJUSTES), [chave]: valor } }))
  },
}

/* "O QUE O TUTOR VIU" — o miolo do painel que a aba Hoje abre em VER MAIS (?ver=tutor). 12ª rodada (04/10/2026), no
   sistema Turmma × Duolingo. Só número da turma inteira (D57, D66, D69): a tabela com nome, ação e horário de cada aluno
   SAIU, e não volta. Abrir a conversa de UM aluno é outra coisa: só com motivo registrado, no ⋯ da ficha.
   · quantos usaram e quantas conversas (NumeroGrande);
   · o uso por assunto e onde travaram, em barras;
   · as dúvidas que se repetiram, com a página do material;
   · quantos pediram a resposta pronta (só a contagem). */

export function UsoTutorTurma({ turmaId }: { turmaId: string }) {
  const uso = usoTutorDa(turmaId)
  // a semana que termina hoje: os últimos 7 dias da série diária
  const semana = usoNoTempoDa(turmaId, '30D').series.map((s) => ({ assunto: s.assunto, n: s.valores.slice(-7).reduce((a, v) => a + v, 0) }))
  const maisAssunto = Math.max(1, ...semana.map((s) => s.n))
  const duvidas = uso.duvidas.slice(0, 3)
  const travaram = uso.travaram.filter((x) => x.alunos > 0).slice(0, 3)
  const maisTravou = Math.max(1, ...travaram.map((x) => x.alunos))

  return (
    <div className="grid gap-7 text-tinta">
      <div className="grid grid-cols-2 gap-3">
        <NumeroGrande familia="verde" icone={<Icone id="alunos" />} valor={<>{uso.usaram}<span className="text-[17px] text-sutil"> de {uso.alunos}</span></>} rotulo="Usaram" />
        <NumeroGrande familia="laranja" icone={<Icone id="tutor" />} valor={uso.conversas} rotulo="Conversas" />
      </div>

      <section>
        <h3 className="t-selo mb-3 text-sutil">Por assunto</h3>
        <ul className="grid gap-3">
          {semana.map((s) => (
            <li key={s.assunto} className="grid gap-1.5">
              <span className="flex items-baseline justify-between gap-3 text-[15px] font-medium"><span className="truncate">{s.assunto}</span><span className="t-apoio shrink-0 tabular-nums">{s.n}</span></span>
              <BarraProgresso valor={s.n} max={maisAssunto} familia="azul" altura={12} rotulo={`Conversas sobre ${s.assunto}`} />
            </li>
          ))}
        </ul>
      </section>

      {travaram.length > 0 && (
        <section>
          <h3 className="t-selo mb-3 text-sutil">Onde travaram</h3>
          <ul className="grid gap-3">
            {travaram.map((x) => (
              <li key={x.nome} className="grid gap-1.5">
                <span className="flex items-center justify-between gap-3 text-[15px] font-medium">
                  <span className="truncate">{x.nome}</span>
                  <span className="t-apoio flex shrink-0 items-center gap-1 tabular-nums">{x.alunos} {x.alunos === 1 ? 'aluno' : 'alunos'} <ChipFonte pagina={x.pagina} material={uso.material.titulo} capitulo={uso.material.capitulo} /></span>
                </span>
                <BarraProgresso valor={x.alunos} max={maisTravou} familia="amarelo" altura={12} rotulo={`Travaram em ${x.nome}`} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="t-selo mb-1 text-sutil">Dúvidas que voltaram</h3>
        <ul>
          {duvidas.map((d) => (
            <li key={d.texto} className="flex items-center gap-3 border-t-2 border-borda py-2.5 first:border-t-0">
              <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug">“{d.texto}”</span>
              <span className="t-apoio shrink-0">{d.vezes}×</span>
              <ChipFonte pagina={d.pagina} material={uso.material.titulo} capitulo={uso.material.capitulo} />
            </li>
          ))}
        </ul>
      </section>

      <p className="t-apoio">{uso.prontas.alunos} {uso.prontas.alunos === 1 ? 'aluno pediu' : 'alunos pediram'} a resposta pronta. O Tutor devolve uma pergunta.</p>
    </div>
  )
}
