import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { BarraProgresso, Botao, Carimbo, CampoTexto, Dialogo, DialogoConfirmar, Linha, GrupoToques } from '@/components/duo'
import { acervo, useAcervo } from '@/dados/conversas'
import { agora, registrar } from '@/dados/demo/nucleo'
import { useProfessorAtual } from '@/dados/sessao'
import { baixar } from './Notas'

/* PRIVACIDADE E DADOS, com o MEU USO dentro (12ª rodada, 04/10/2026; plano de polimento 5.2; auditoria 2.15).
   O espelho do professor (D45, D64) deixou de ser página do menu e virou o miolo desta seção das Configurações
   (`/professor/meu-uso` redireciona para `?config=privacidade`). Na ordem:
   · a frase que tira o medo: não usar não gera número, e a coordenação não vê as conversas;
   · os números do mês em texto e o que mais usou (barras neutras);
   · quem abriu o dado com nome, com a finalidade registrada (a coordenação só abre assim, D45);
   · PEDIR REVISÃO DE UM NÚMERO (LGPD, art. 20: revisão de decisão automatizada; lei);
   · Exportar tudo (o que é do professor sai quando ele quiser, em formato aberto; D63) e Apagar o histórico (o que
     está em Criados continua). Nenhum número daqui avalia professor. */

const NUMEROS = [
  { id: 'criados', valor: 14, texto: 'criados' },
  { id: 'usados', valor: 11, texto: 'usados com turma' },
  { id: 'aprovados', valor: 9, texto: 'aprovados' },
  { id: 'recusados', valor: 1, texto: 'recusado' },
] as const

const MAIS_USADO = [['Prova', 5], ['Atividade', 4], ['Plano de aula', 3], ['Material', 2]] as const

export function MeuUso() {
  const prof = useProfessorAtual()
  const { conversas } = useAcervo()
  const [pedindo, setPedindo] = useState(false)
  const [numero, setNumero] = useState<string>('')
  const [motivo, setMotivo] = useState('')
  const [enviado, setEnviado] = useState<string | null>(null)
  const [exportado, setExportado] = useState<string | null>(null)
  const [apagando, setApagando] = useState(false)
  const [apagado, setApagado] = useState<string | null>(null)
  const novo = prof.novo

  const exportar = () => {
    const dados = { professor: prof.nome, exportadoEm: agora().rotulo, conversas: conversas.map((c) => ({ titulo: c.titulo, pedido: c.pedido, ferramenta: c.ferramenta, turma: c.turmaId })) }
    baixar(`turmma-${prof.primeiro.toLowerCase()}-tudo.json`, JSON.stringify(dados, null, 2), 'application/json;charset=utf-8')
    registrar('exportacao', { o: 'tudo do professor', professor: prof.nome, conversas: conversas.length })
    setExportado(agora().rotulo)
  }
  const apagar = () => {
    const n = conversas.length
    for (const c of conversas) acervo.apagarConversa(c.id)
    setApagado(`${n} ${n === 1 ? 'conversa apagada' : 'conversas apagadas'}`)
  }
  const fechar = () => { setPedindo(false); setNumero(''); setMotivo('') }

  return (
    <div className="grid gap-6">
      <p className="flex items-start gap-2.5 rounded-[12px] bg-verde-claro px-4 py-3 text-[15px] font-bold leading-5 text-verde-texto">
        <ShieldCheck aria-hidden className="mt-px size-5 shrink-0" strokeWidth={2.5} />
        Não usar não gera número sobre você. A coordenação não vê suas conversas.
      </p>

      <section className="grid gap-2">
        <h3 className="t-selo text-sutil">Setembro</h3>
        {novo ? <p className="t-corpo text-apoio">Nada ainda.</p> : (
          <p className="t-corpo text-apoio">
            {NUMEROS.map((n, i) => <span key={n.id}>{i > 0 && ' · '}<b className="font-bold tabular-nums text-tinta">{n.valor}</b> {n.texto}</span>)}
          </p>
        )}
      </section>

      {!novo && (
        <section className="grid gap-3">
          <h3 className="t-selo text-sutil">O que você mais usou</h3>
          {MAIS_USADO.map(([n, v]) => (
            <div key={n} className="grid grid-cols-[120px_minmax(0,1fr)_24px] items-center gap-3">
              <span className="text-[15px] font-bold text-tinta">{n}</span>
              <BarraProgresso valor={v} max={5} altura={12} familia="azul" rotulo={`${n}: ${v}`} />
              <span className="text-right text-[15px] font-bold tabular-nums text-apoio">{v}</span>
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-1">
        <h3 className="t-selo text-sutil">Quem abriu seu dado com nome</h3>
        {novo ? <p className="t-apoio">Ninguém.</p> : (
          <div className="[&>*]:px-0">
            <Linha titulo="Helena Martins · 15/09, 16h05" abaixo="Para quê: conversa pedagógica, a seu pedido" />
          </div>
        )}
      </section>

      <div className="grid gap-3 border-t-2 border-borda pt-5">
        {enviado ? <Carimbo verbo="Pedido de revisão enviado" por="à coordenação" quando={enviado} />
          : !novo && <Botao variante="secundario" tamanho="m" className="justify-self-start" onClick={() => setPedindo(true)}>Pedir revisão de um número</Botao>}
        <div className="flex flex-wrap gap-2">
          <Botao variante="secundario" tamanho="m" onClick={exportar}>Exportar tudo</Botao>
          <Botao variante="perigo" tamanho="m" onClick={() => setApagando(true)} disabled={conversas.length === 0}>Apagar histórico</Botao>
        </div>
        {exportado && <Carimbo verbo="Arquivo baixado" por="" quando={exportado} className="justify-self-start" />}
        {apagado && <Carimbo verbo={apagado} por="" className="justify-self-start" />}
      </div>

      <Dialogo aberto={pedindo} aoMudar={(v) => { if (!v) fechar() }} titulo="Pedir revisão de um número" largura={480}
        rodape={<Botao disabled={!numero || !motivo.trim()} onClick={() => {
          const n = NUMEROS.find((x) => x.id === numero)
          setEnviado(`${n?.valor} ${n?.texto} · ${agora().rotulo}`)
          fechar()
        }}>Enviar pedido</Botao>}>
        <div className="grid gap-4">
          <GrupoToques rotulo="Qual número" valor={numero || null} aoMudar={(v) => setNumero(String(v))}
            opcoes={NUMEROS.map((n) => ({ id: n.id, rotulo: `${n.valor} ${n.texto}` }))} />
          <CampoTexto rotulo="O que não está certo" valor={motivo} aoMudar={setMotivo} linhas={3} />
        </div>
      </Dialogo>
      <DialogoConfirmar aberto={apagando} aoMudar={setApagando} titulo="Apagar o histórico?" frase="As conversas somem. O que está em Criados continua."
        confirmar={{ rotulo: 'Apagar', variante: 'perigoCheio', aoConfirmar: apagar }} />
    </div>
  )
}
