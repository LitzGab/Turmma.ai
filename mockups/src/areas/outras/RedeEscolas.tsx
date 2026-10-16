import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, MessageCircleQuestion, X } from 'lucide-react'
import { BarraDeFaixas, Botao, CabecalhoPagina, LinhaDeFonte, Pagina, Selo, type Familia } from '@/components/duo'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import { FAIXAS, SITUACAO_DA_LINHA, painelDa, textoDaContagem, valorDaColuna, type ColunaId, type LinhaDoPainel, type SituacaoDaLinha } from '@/dados/gestao'
import { IA_POR_ESCOLA, recorteDoPainel } from '@/dados/numeros-rede'
import { inteiro } from '@/dados/numeros-escola'
import { PERGUNTAS, artigoDa, daEscola } from '@/dados/analista-rede'
import { REDES_DO_PAINEL, useRedeAtual, type RedeId } from '@/dados/rede-atual'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { FiltroSerie, NotasAbaixo, SeloAgregado, TabelaDasEscolas, analistaRede, useLinhasDaRede } from './Rede'

/* AS ESCOLAS DA REDE (/rede/escolas), painéis de gestão (06/10/2026; pesquisa/paineis-gestao/plano.md).
   As escolas da rede escolhida na lateral (useRedeAtual), de A a Z, em CONTAGENS de alunos por limiar: as mesmas
   colunas do Painel (dados/gestao.ts) e mais "Esperando revisão" (o que a IA preparou e ainda não passou pelo
   professor). No Estado, o Colégio Aurora aparece aqui: é escola estadual.
   · ?coluna=<id> (vem dos cartões "Pede ação" do Painel: apoiaVencidos, peDeMeia, semChamada, primeiraSerieDois,
     revisao): acende a coluna e mostra só as escolas que têm alguém nela, com a faixa "Mostrando…" e VER TODAS;
   · ?serie=: a fatia da série (recorteDoPainel);
   · ?escola=<id>: abre ao lado a escola — as faixas de frequência, as notas abaixo de 6,0, o APOIA, a chamada, o
     Pé-de-Meia (Estado) e a IA — e PERGUNTAR AO ANALISTA SOBRE A <ESCOLA>.
   SÓ AGREGADO: nenhum aluno, nenhuma turma, nenhum professor; "menos de 5"; nenhuma média; nunca ordenada por valor.
   As escolas montando ou com convite (e as criadas na demonstração, na prefeitura) aparecem sem dados. */

const SITUACAO_COR: Record<SituacaoDaLinha, Familia | 'neutro'> = { 'com-dados': 'verde', 'sem-lista': 'neutro', montando: 'amarelo', convite: 'azul' }

type Filtro = ColunaId | 'revisao'

/** A frase da faixa "Mostrando…" de cada coluna. */
const MOSTRANDO: Partial<Record<Filtro, string>> = {
  apoiaVencidos: 'com APOIA de prazo vencido',
  apoia: 'com alunos no critério do APOIA, sem aviso aberto',
  peDeMeia: 'com alunos do Pé-de-Meia abaixo de 80% em setembro',
  semChamada: 'com turma sem chamada há 3 dias letivos ou mais',
  primeiraSerieDois: 'com alunos da 1ª série do EM abaixo de 6,0 em 2 ou mais componentes',
  reprova: 'com alunos abaixo de 75% de frequência',
  cronica: 'com alunos em falta crônica',
  lp: 'com alunos abaixo de 6,0 em Língua Portuguesa',
  mat: 'com alunos abaixo de 6,0 em Matemática',
  revisao: 'com material da IA esperando a revisão do professor',
}

const esperandoDe = (rede: RedeId, l: LinhaDoPainel) => (l.dados ? IA_POR_ESCOLA[rede][l.id]?.esperando ?? 0 : null)

/** Um número pequeno do painel ao lado. */
function Numero({ rotulo, valor, apoio }: { rotulo: string; valor: string; apoio?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-[14px] border-2 border-borda px-3.5 py-2.5">
      <span className="t-selo truncate text-sutil" title={rotulo}>{rotulo}</span>
      <span className="text-[22px] font-bold leading-7 tabular-nums text-tinta">{valor}</span>
      {apoio && <span className="text-[13px] font-medium leading-4 text-sutil">{apoio}</span>}
    </div>
  )
}

/** A escola ao lado: contagens dela, nunca nomes. */
function PainelDaEscola({ rede, l, serie, aoFechar }: { rede: RedeId; l: LinhaDoPainel | null; serie: string | null; aoFechar: () => void }) {
  const navegar = useNavigate()
  const celular = useIsMobile()
  const p = painelDa(rede)
  const conta = (n: number) => textoDaContagem(n, rede)
  const d = l?.dados
  const notas = useMemo(() => {
    if (!d) return []
    const daRede = recorteDoPainel(rede, serie).notas.itens
    // na escola, só a contagem de agora (o movimento é da rede)
    return daRede.map((n) => ({ ...n, alunos: d[n.id], entraram: 0, sairam: 0 }))
  }, [d, rede, serie])
  const ia = l ? IA_POR_ESCOLA[rede][l.id] : undefined
  return (
    <PainelLado aberto={!!l} aoFechar={aoFechar} largura={600} titulo={l?.nome ?? ''}
      rodape={l && (
        <Botao variante="secundario" icone={<MessageCircleQuestion strokeWidth={2.5} />} className="max-sm:w-full"
          onClick={() => navegar(analistaRede(`Como está ${artigoDa(l.curto)} ${l.curto}?`))}>
          {celular ? 'Perguntar ao Analista' : `Perguntar ao Analista sobre ${artigoDa(l.curto)} ${l.curto}`}
        </Botao>
      )}>
      {l && (
        <div className="grid gap-5">
          <p className="t-apoio flex flex-wrap items-center gap-x-3 gap-y-1">
            <Selo familia={SITUACAO_COR[l.situacao]}>{SITUACAO_DA_LINHA[l.situacao]}</Selo>
            {d ? `${inteiro(l.alunos)} alunos${serie ? ` no ${serie}` : ''} · ${rede === 'estado' ? 'escola estadual' : 'escola municipal'}` : null}
          </p>
          {d ? (
            <>
              <section aria-label="Frequência por faixa" className="grid gap-2">
                <h3 className="t-cartao text-tinta">Frequência por faixa</h3>
                <BarraDeFaixas rotulo={`Frequência por faixa ${daEscola(l.curto)}`} menosDe5
                  marca={rede === 'estado' && d.abaixoDe80 !== undefined ? { abaixo: d.abaixoDe80, rotulo: 'Pé-de-Meia · 80%' } : undefined}
                  faixas={FAIXAS.map((x) => ({ id: x.id, rotulo: x.rotulo, alunos: d.faixas[x.id] }))} />
                <LinhaDeFonte origem={p.frequencia.origem} />
              </section>
              <section aria-label="Notas abaixo de 6,0" className="grid gap-2">
                <h3 className="t-cartao text-tinta">Notas abaixo de 6,0</h3>
                <NotasAbaixo rede={rede} itens={notas} compacto />
                <LinhaDeFonte origem={p.notas.origem} />
              </section>
              <div className="grid grid-cols-2 gap-3">
                <Numero rotulo="APOIA, sem aviso" valor={conta(d.apoia)} apoio="no critério" />
                <Numero rotulo="APOIA vencido" valor={conta(d.apoiaVencidos)} apoio="prazo de 14 dias" />
                <Numero rotulo="Sem chamada" valor={String(d.semChamada)} apoio={d.semChamada === 1 ? 'turma há 3 dias ou mais' : 'turmas há 3 dias ou mais'} />
                {d.peDeMeia
                  ? <Numero rotulo="Pé-de-Meia < 80%" valor={conta(d.peDeMeia.abaixoDe80)} apoio={`de ${inteiro(d.peDeMeia.beneficiarios)} beneficiários`} />
                  : ia && <Numero rotulo="IA esperando" valor={conta(ia.esperando)} apoio={`de ${inteiro(ia.materiais)} materiais`} />}
              </div>
              <p className="t-apoio">Só contagens, de grupos de 5 ou mais alunos. Nomes, só na escola.</p>
            </>
          ) : (
            <div className="grid gap-2">
              <p className="t-corpo text-tinta">Ainda sem dados.</p>
              <p className="t-apoio">{l.situacao === 'montando'
                ? 'A escola está montando as turmas. Os números aparecem quando o diário dela chegar ao Turmma.'
                : 'A escola recebeu o convite e ainda não montou as turmas.'}</p>
            </div>
          )}
        </div>
      )}
    </PainelLado>
  )
}

export function RedeEscolas() {
  const navegar = useNavigate()
  const [rede] = useRedeAtual()
  const celular = useIsMobile()
  const p = painelDa(rede)
  const [serieP, setSerie] = useParametro('serie')
  const serie = serieP && p.series.includes(serieP) ? serieP : null
  const r = useMemo(() => recorteDoPainel(rede, serie), [rede, serie])
  const todas = useLinhasDaRede(rede, r.linhas)
  const [escolaP, setEscola] = useParametro('escola')
  const [colunaP, setColuna] = useParametro('coluna')

  const extra = { id: 'revisao', rotulo: 'IA esperando', titulo: 'Materiais da IA esperando a revisão do professor', valor: (l: LinhaDoPainel) => esperandoDe(rede, l) }
  const filtro: Filtro | null = colunaP === 'revisao' || r.colunas.some((c) => c.id === colunaP) ? (colunaP as Filtro) : null
  const valorDe = (l: LinhaDoPainel, c: Filtro) => (c === 'revisao' ? esperandoDe(rede, l) : valorDaColuna(l, c))
  const visiveis = filtro ? todas.filter((l) => (valorDe(l, filtro) ?? 0) > 0) : todas
  const aberta = todas.find((l) => l.id === escolaP) ?? null
  const comDados = todas.filter((l) => l.dados).length

  const filtroColuna = (
    <Select value={filtro ?? 'todas'} onValueChange={(v) => setColuna(v === 'todas' ? null : v)}>
      <SelectTrigger aria-label="Mostrar" className={cn('h-10 gap-2 whitespace-nowrap text-[15px]', celular ? 'w-full' : 'w-auto min-w-[180px] max-w-[260px]')}>
        <span className="truncate"><span className="text-sutil">Mostrar:</span> <b className="font-bold">{filtro ? (filtro === 'revisao' ? extra.rotulo : r.colunas.find((c) => c.id === filtro)?.rotulo) : 'Todas'}</b></span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todas">Todas as escolas</SelectItem>
        {r.colunas.map((c) => <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>)}
        <SelectItem value="revisao">{extra.titulo}</SelectItem>
      </SelectContent>
    </Select>
  )

  const semDados = todas.filter((l) => !l.dados)

  return (
    <Pagina tipo="painel" rolagem="corpo"
      cabecalho={<CabecalhoPagina titulo="Escolas" complemento={`${todas.length} · de A a Z`}
        selo={celular ? undefined : <SeloAgregado />}
        acoes={celular ? undefined : <><FiltroSerie rede={rede} serie={serie} mudar={setSerie} />{filtroColuna}</>}
        linha={celular
          ? <span className="flex flex-col items-start gap-3 pt-1"><SeloAgregado /><FiltroSerie rede={rede} serie={serie} mudar={setSerie} largo />{filtroColuna}</span>
          : (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{REDES_DO_PAINEL[rede].nome} · {comDados} com dados{serie ? ` · ${serie}` : ''}</span>
              <LinhaDeFonte origem={p.frequencia.origem} />
            </span>
          )} />}>
      {filtro && (
        <div className="mb-3 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] border-2 border-azul-borda bg-azul-claro px-4 py-2">
          <p className="min-w-0 flex-1 text-[15px] font-semibold leading-5 text-azul-texto">
            Mostrando {visiveis.length} de {comDados} escolas: as {MOSTRANDO[filtro] ?? 'com alunos nessa coluna'}.
          </p>
          <Botao variante="fantasma" tamanho="p" className="-my-1 -mr-2" icone={<X strokeWidth={2.5} />} onClick={() => setColuna(null)}>Ver todas</Botao>
        </div>
      )}
      <div className="shrink-0 rounded-[16px] border-2 border-borda bg-white px-4 pb-1 pt-2 md:px-5">
        {visiveis.length === 0
          ? <p className="t-apoio py-4">Nenhuma escola {MOSTRANDO[filtro!] ?? 'nesse filtro'}{serie ? ` no ${serie}` : ''}.</p>
          : (
            <TabelaDasEscolas rede={rede} linhas={visiveis} colunas={r.colunas}
              /* no Estado a tabela já tem 8 colunas: a da IA aparece quando é ela que está filtrada */
              extra={rede === 'prefeitura' || filtro === 'revisao' ? extra : undefined} destaque={filtro} celular={celular}
              rotulo={`Escolas, de A a Z${serie ? `, ${serie}` : ''}`} aoAbrir={setEscola} />
          )}
      </div>
      {semDados.length > 0 && !filtro && (
        <p className="t-apoio mt-3 flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-[12px] bg-fundo-suave px-4 py-2.5">
          <b className="font-bold text-tinta">A caminho:</b>
          {semDados.map((l, i) => (
            <span key={l.id}>{l.curto} {l.situacao === 'convite' ? 'com convite enviado' : 'montando as turmas'}{i < semDados.length - 1 ? ' ·' : ''}</span>
          ))}
        </p>
      )}
      <div className="t-apoio flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 pt-3">
        <span className="flex items-center gap-1.5"><Lock aria-hidden className="size-4" strokeWidth={2.5} />Contagens de alunos; grupo com menos de 5 aparece como "menos de 5". A cor marca quem passou do limiar da coluna.</span>
        <button type="button" onClick={() => navegar(analistaRede(PERGUNTAS.escolas))} className="t-selo -mx-1 rounded-[6px] px-1 text-azul-texto transition-colors hover:bg-fundo-suave">Perguntar ao Analista</button>
      </div>
      <PainelDaEscola rede={rede} l={aberta} serie={serie} aoFechar={() => setEscola(null)} />
    </Pagina>
  )
}
