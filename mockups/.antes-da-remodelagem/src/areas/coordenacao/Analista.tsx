import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BellOff, Check, KeyRound, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AssinaturaIA, AvatarAgente, Estado } from '@/components/turmma/ia'
import { BarraRotulada, Cartao, NotaMockup, Tela } from '@/components/turmma/tela'
import { agente } from '@/dados/agentes'
import { cn } from '@/lib/utils'
import { Aviso, DialogoNominal, RegistroAuditoria } from './_a-pecas'

/* A thread do Analista de desempenho escolar: resumo de segunda de manhã e alerta na hora,
   sempre em agregado por série e disciplina. Alerta é HIPÓTESE com contexto, nunca veredito (D32, D45 revistas).
   Ele só avisa: nunca contata professor nem família. */

type Alerta = { id: string; quando: string; titulo: string; texto: string; contexto: string; recorte: string; lido?: boolean }

const ALERTAS: Alerta[] = [
  { id: 'a1', quando: 'hoje, 9h20', titulo: 'Média fora da curva · Química · 2º ano EM',
    texto: 'Média de Química do 2º ano caiu 0,8 em três semanas. Pode ser a troca de capítulo; vale olhar com os professores da série.',
    contexto: 'O capítulo 7 (estequiometria) começou em 01/09. Nos dois últimos anos letivos a média também caiu nesse trecho e voltou em quatro semanas.',
    recorte: '2ºA e 2ºB · 3 professores no recorte' },
  { id: 'a2', quando: 'hoje, 8h05', titulo: 'Entregas faltando · 1ºC',
    texto: '1ºC tem 5 alunos com três entregas faltando. É sinal para um adulto olhar, não decisão sobre nenhum deles.',
    contexto: 'Os nomes já chegaram aos professores da turma, em "Seu time". Aqui aparece só a contagem.',
    recorte: '1ºC · 34 alunos · contagem, sem nomes' },
  { id: 'a3', quando: '18/09, 14h40', titulo: 'Consumo de IA alto · 9º ano EF', lido: true,
    texto: 'O 9º ano usou 31% do consumo do mês com 18% dos alunos. Coincide com a semana de simulado.',
    contexto: 'Dentro do orçamento da escola. Se o ritmo continuar depois do simulado, vale rever o pacote do Tutor da série.',
    recorte: '9ºA e 9ºB · 2 professores no recorte' },
]

const HABILIDADES_SEMANA = [
  { nome: 'Reagente limitante e excesso', serie: '2º ano EM · Química', antes: 52, agora: 39 },
  { nome: 'Cálculo com mol e massa molar', serie: '2º ano EM · Química', antes: 51, agora: 46 },
  { nome: 'Equações do 1º grau', serie: '8º ano EF · Matemática', antes: 58, agora: 66 },
]

// Recortes disponíveis. Com um professor só, o recorte conta como nominal e aparece travado (D45 revista).
const RECORTES = [
  { id: 'q2', rotulo: '2º ano EM · Química', professores: 3, media: '6,1', tendencia: '−0,8 em três semanas' },
  { id: 'm1', rotulo: '1º ano EM · Matemática', professores: 4, media: '6,7', tendencia: 'estável' },
  { id: 'c9', rotulo: '9º ano EF · Ciências', professores: 2, media: '6,9', tendencia: '+0,3 em três semanas' },
  { id: 'f3', rotulo: '3º ano EM · Física', professores: 1, media: null, tendencia: null },
  { id: 'a6', rotulo: '6º ano EF · Arte', professores: 1, media: null, tendencia: null },
]

export function Analista() {
  const a = agente('analista')
  const [lidos, setLidos] = useState<string[]>(ALERTAS.filter((x) => x.lido).map((x) => x.id))
  const [pedido, setPedido] = useState<string | null>(null)
  const [abertos, setAbertos] = useState<Record<string, string>>({})

  return (
    <Tela titulo="Analista de desempenho escolar"
      descricao="Resumo de segunda de manhã e alerta na hora, sempre por série e disciplina. É hipótese com contexto: quem conclui é a escola."
      acoes={<Button variant="discreto" size="sm" asChild><Link to="/coordenacao/agentes">O que ele faz sozinho <ArrowRight /></Link></Button>}>

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-cartao border border-linha bg-superficie p-4">
        <AvatarAgente id="analista" tamanho={48} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-tinta">{a.nome}</p>
          <p className="text-sm text-apoio">Autonomia: <b className="font-semibold">{a.autonomia}</b></p>
        </div>
        <p className="flex items-center gap-2 rounded-linha bg-info-cx px-3 py-2 text-[13px] leading-snug text-info">
          <BellOff className="size-4 shrink-0" strokeWidth={1.9} /> Só avisa você. Nunca contata professor nem família, e só escreve no horário útil da escola.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="grid content-start gap-5">
          {/* O resumo semanal */}
          <Cartao>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <AssinaturaIA id="analista" tamanho={32} />
              <span className="text-sm text-sutil">Resumo da semana · segunda, 21/09 · 7h10</span>
            </div>
            <div className="mt-4 grid max-w-[72ch] gap-3 text-base leading-[1.6] text-tinta">
              <p>Bom dia. Na semana de 14 a 18/09 a escola teve <b className="font-semibold">47 avaliações e atividades corrigidas</b>, em 22 turmas. O acerto médio em objetivas ficou em 64%, um ponto abaixo da semana anterior.</p>
              <p>Dois pontos merecem um olhar, os dois como hipótese: a queda em Química no 2º ano, que coincide com a entrada em estequiometria, e as entregas faltando no 1ºC. O 8º ano subiu oito pontos em equações do 1º grau depois da sequência de revisão.</p>
              <p className="text-apoio">Dos 96 artefatos gerados por IA na semana, 91 foram aprovados por professor e 5 estão esperando. O consumo está em 61% do orçamento do mês.</p>
            </div>
            <div className="mt-5 grid gap-4 border-t border-linha pt-4">
              <p className="rotulo">Habilidades que mais mudaram</p>
              {HABILIDADES_SEMANA.map((h) => (
                <BarraRotulada key={h.nome} rotulo={h.nome} detalhe={`${h.serie} · antes ${h.antes}%`} valor={h.agora} tom={h.agora < h.antes ? 'caramelo' : 'ok'} />
              ))}
            </div>
            <p className="mt-4 text-sm text-sutil">Gerado de dado agregado. Nenhum nome de aluno ou de professor entrou neste resumo.</p>
          </Cartao>

          {/* Alertas na hora */}
          <section aria-labelledby="alertas-analista">
            <h2 id="alertas-analista" className="mb-3 font-corpo text-base font-semibold text-tinta">Alertas</h2>
            <ul className="grid gap-3">
              {ALERTAS.map((al) => {
                const lido = lidos.includes(al.id)
                return (
                  <li key={al.id} className="rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <AssinaturaIA id="analista" />
                      <span className="flex items-center gap-2 text-sm text-sutil">{al.quando} {lido ? <Estado tipo="ok" size="sm">Visto</Estado> : <Estado tipo="pendente" size="sm">Novo</Estado>}</span>
                    </div>
                    <h3 className="mt-3 font-corpo text-base font-semibold text-tinta">{al.titulo}</h3>
                    <p className="mt-1 max-w-[72ch] text-[15px] leading-relaxed text-tinta">{al.texto}</p>
                    <p className="mt-3 rounded-controle bg-ia-cx p-3 text-sm leading-relaxed text-apoio"><b className="font-semibold">Contexto.</b> {al.contexto}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13px] text-sutil">Recorte: {al.recorte}</span>
                      {!lido && <Button variant="discreto" size="sm" onClick={() => setLidos((l) => [...l, al.id])}><Check /> Marcar como visto</Button>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        {/* Recortes e a regra do grupo mínimo */}
        <div className="grid content-start gap-5">
          <Cartao titulo="Recortes por série e disciplina">
            <ul className="grid gap-2">
              {RECORTES.map((r) => {
                const travado = r.professores < 2
                const aberto = abertos[r.id]
                return (
                  <li key={r.id} className={cn('rounded-controle border p-3', travado ? 'border-dashed border-borda-campo bg-fundo' : 'border-linha')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold leading-snug text-tinta">{r.rotulo}</p>
                        <p className="text-[13px] text-sutil">{r.professores} {r.professores === 1 ? 'professor' : 'professores'} no recorte</p>
                      </div>
                      {travado
                        ? <Estado tipo="contorno"><Lock className="size-3.5" /> Conta como nominal</Estado>
                        : <p className="shrink-0 text-right"><span className="numero-painel block text-[22px] text-tinta">{r.media}</span><span className="text-[13px] text-sutil">{r.tendencia}</span></p>}
                    </div>
                    {travado && !aberto && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[13px] leading-snug text-apoio">Com um professor só, o agregado é o dado dele.</p>
                        <Button variant="oficial" size="sm" onClick={() => setPedido(r.id)}><KeyRound /> Abrir com auditoria…</Button>
                      </div>
                    )}
                    {aberto && <RegistroAuditoria finalidade={aberto} className="mt-3" />}
                  </li>
                )
              })}
            </ul>
          </Cartao>

          <Aviso tom="info" titulo="Por que alguns recortes aparecem travados">
            O indicador do professor é o desempenho das turmas dele, e <b>ele vê primeiro</b>, em "Meu painel". A coordenação vê agregado só com dois
            ou mais professores no recorte. Não existe ranking, e nada daqui alimenta avaliação funcional, sanção ou dispensa.
          </Aviso>

          <Aviso tom="trava" titulo="O que o Analista nunca faz">
            Ranquear professor ou medir quem usa a ferramenta. Nomear aluno para a coordenação. Recomendar decisão sobre professor ou aluno.
            Falar com professor ou família.
          </Aviso>
        </div>
      </div>

      <DialogoNominal aberto={pedido !== null} aoMudar={(v) => { if (!v) setPedido(null) }}
        oQue={`o recorte "${RECORTES.find((r) => r.id === pedido)?.rotulo ?? ''}", que tem um professor só`}
        aoConfirmar={(f) => { if (pedido) setAbertos((m) => ({ ...m, [pedido]: f })); setPedido(null) }} />

      <NotaMockup>
        Spec A5 (fatia do F12; o Analista por evento fica para o F11 completo). D32 e D45 revistas: resumo de segunda e alerta em agregado, e a
        regra do grupo mínimo — recorte com um professor só conta como nominal e só abre com auditoria. D34: aluno em risco em contagem.
        D64: sem adoção nominal. D59: aviso só no horário útil. Alerta é hipótese com contexto, nunca veredito.
      </NotaMockup>
    </Tela>
  )
}
