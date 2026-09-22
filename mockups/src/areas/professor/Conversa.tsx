import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, ClipboardList, Copy, FileDown, Folder, FolderOpen, MessageSquare, SlidersHorizontal, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileCard } from '@/components/ui/file-card-collections'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GenericTool } from '@/components/ui/generic-tool'
import { Escolha, Fontes, MensagemIA, MensagemPessoa, Pensando, useFluxo, useRolarAoFim } from '@/components/turmma/conversa'
import { FormAdaptacao, FormProva, TIPOS_ADAPTACAO } from '@/components/turmma/ferramentas'
import { ChipFonte, Estado, LinhaAprovacao } from '@/components/turmma/ia'
import { CaixaPedido } from '@/components/turmma/pedido'
import { useAcervo, type Conversa as TipoConversa } from '@/dados/conversas'

/* A conversa com o Assistente de ensino (11.3). O fluxo inteiro da D18 é clicável:
   pedido → "Quer usar a ferramenta Prova?" → cartão já preenchido → gera com a página citada →
   versão adaptada por TIPO, que nasce pendente → aprovação registrada.
   HISTÓRICO REAL (20/09/2026): cada conversa tem endereço próprio (`/professor/conversa/:id`) e sai do acervo
   (dados/conversas). Conversa nova roda o fluxo acima com o pedido que a professora escreveu; conversa antiga
   abre como ficou — o pedido, a resposta e o que foi salvo na biblioteca. */

const QUESTOES: { texto: string; pagina: number }[] = [
  { texto: 'Qual a massa de CO₂ formada na queima completa de 24 g de carbono? (C = 12; O = 16)', pagina: 142 },
  { texto: 'Na reação N₂ + 3 H₂ → 2 NH₃, quantos mols de amônia se formam a partir de 6 mol de H₂?', pagina: 142 },
  { texto: 'Calcule a massa de água produzida na combustão de 8 g de gás hidrogênio. (H = 1; O = 16)', pagina: 145 },
  { texto: 'Em 2 Al + 3 Cl₂ → 2 AlCl₃, com 54 g de Al e 71 g de Cl₂, qual é o reagente limitante?', pagina: 151 },
  { texto: 'Uma reação com rendimento teórico de 50 g produziu 40 g. Qual foi o rendimento percentual?', pagina: 151 },
]

type Etapa = 'pensando' | 'pergunta' | 'cartao' | 'gerando' | 'resposta' | 'so-conversa'
type Adaptacao = null | 'cartao' | 'gerando' | 'pendente' | 'aprovada' | 'rejeitada'

function AcoesResposta() {
  return (
    <>
      <Button variant="discreto" size="sm"><Copy /> Copiar</Button>
      <Button variant="discreto" size="sm" asChild><Link to="/professor/ferramentas?aba=biblioteca"><FolderOpen /> Abrir na biblioteca</Link></Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="discreto" size="sm"><FileDown /> Exportar</Button></DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="rounded-controle">
          {['Exportar em PDF', 'Exportar em PowerPoint (PPTX)', 'Exportar em Excel (XLSX)', 'Imprimir'].map((o) => (
            <DropdownMenuItem key={o} className="h-10 rounded-linha">{o}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

const PADRAO: TipoConversa = { id: 'prova-estequiometria', titulo: 'Prova de estequiometria · 2ºB', pedido: 'monta uma prova de estequiometria pro 2ºB, dez questões', ferramenta: 'conversa', turmaId: '2b', em: 0 }

export function Conversa() {
  const { id } = useParams()
  const { conversas } = useAcervo()
  const c = conversas.find((x) => x.id === id) ?? conversas.find((x) => x.id === PADRAO.id) ?? PADRAO
  return <Corpo key={c.id} c={c} />
}

function Corpo({ c }: { c: TipoConversa }) {
  const { projetos } = useAcervo()
  const projeto = projetos.find((p) => p.id === c.projetoId)
  const pedido = c.pedido
  const antiga = !!c.resposta
  // Se o professor JÁ escolheu a ferramenta na caixa, o chat não pergunta: abre o cartão direto (1.1)
  const jaEscolheu = c.ferramenta !== 'conversa'

  const [etapa, setEtapa] = useState<Etapa>('pensando')
  const [adaptacao, setAdaptacao] = useState<Adaptacao>(null)
  const [tipos, setTipos] = useState<string[]>([])
  const [texto, setTexto] = useState('')
  const [ferramenta, setFerramenta] = useState('conversa')

  useEffect(() => {
    if (antiga) return
    const t = window.setTimeout(() => setEtapa(jaEscolheu ? 'cartao' : 'pergunta'), 1100)
    return () => window.clearTimeout(t)
  }, [jaEscolheu, antiga])

  const gerar = () => { setEtapa('gerando'); window.setTimeout(() => setEtapa('resposta'), 1700) }
  const fluxo = useFluxo(QUESTOES.length + 1, etapa === 'resposta', 480)
  const fluxoConversa = useFluxo(3, etapa === 'so-conversa', 520)
  const chegando = (etapa === 'resposta' && !fluxo.fim) || (etapa === 'so-conversa' && !fluxoConversa.fim) || etapa === 'gerando' || adaptacao === 'gerando'
  const fim = useRolarAoFim(`${etapa}-${adaptacao}-${fluxo.chegou}-${fluxoConversa.chegou}`)

  return (
    <div className="flex h-[calc(100svh-56px)] flex-col md:h-svh">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-linha px-4 md:px-8">
        {projeto && <Link to={`/professor/projetos/${projeto.id}`} className="hidden shrink-0 items-center gap-1.5 text-sm text-sutil transition-colors duration-150 hover:text-tinta sm:inline-flex"><Folder className="size-4" strokeWidth={1.75} /> {projeto.nome} <ChevronRight className="size-3.5 text-inativo" /></Link>}
        <h1 className="truncate font-corpo text-[15px] font-semibold text-tinta">{c.titulo}</h1>
        <span className="ml-auto hidden shrink-0 text-sm text-sutil lg:inline">Só você vê esta conversa</span>
      </header>

      <div ref={fim} className="min-h-0 flex-1 overflow-y-auto px-4 md:px-6">
        <div className="mx-auto grid w-full max-w-[760px] gap-7 py-8">
          <MensagemPessoa texto={pedido} />
          {c.anexos && c.anexos.length > 0 && <p className="-mt-5 text-right text-[13px] text-sutil">Anexos: {c.anexos.join(' · ')}</p>}

          {/* Conversa antiga: abre como ficou. */}
          {antiga && (
            <MensagemIA agente="assistente" calmo rodape={<Button variant="discreto" size="sm"><Copy /> Copiar</Button>}>
              <p>{c.resposta}</p>
              {c.artefato && (
                <Link to="/professor/ferramentas?aba=biblioteca" className="group mt-4 flex max-w-[420px] items-center gap-4 rounded-cartao border border-linha bg-superficie p-3 pr-4 transition-[box-shadow,border-color] duration-150 hover:border-transparent hover:shadow-caixa">
                  <FileCard formatFile={c.artefato.formato} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-tinta">{c.artefato.titulo}</span><span className="block text-[13px] text-sutil">Salvo na sua biblioteca</span></span>
                  <FolderOpen className="size-4 shrink-0 text-inativo transition-colors duration-150 group-hover:text-tinta" />
                </Link>
              )}
            </MensagemIA>
          )}

          {!antiga && etapa === 'pensando' && <Pensando agente="assistente" />}

          {/* A pergunta da D18: uma frase e duas opções do MESMO peso. Nenhuma das duas é a "certa" (D59). */}
          {!antiga && etapa !== 'pensando' && !jaEscolheu && (
            <MensagemIA agente="assistente">
              <p className="mb-3">{c.id === PADRAO.id ? 'Dez questões de estequiometria para o 2ºB, certo? Dá para fazer de dois jeitos.' : 'Entendi o pedido. Dá para fazer de dois jeitos.'}</p>
              <Escolha
                pergunta="Como você prefere?"
                escolhida={etapa === 'pergunta' ? null : etapa === 'so-conversa' ? 'conversa' : 'prova'}
                aoEscolher={(id) => setEtapa(id === 'prova' ? 'cartao' : 'so-conversa')}
                opcoes={[
                  { id: 'prova', titulo: 'Usar a ferramenta Prova', descricao: 'Salva na biblioteca do 2ºB, com a página de cada questão', icone: ClipboardList },
                  { id: 'conversa', titulo: 'Só conversar', descricao: 'Respondo aqui mesmo. Nada fica salvo na biblioteca', icone: MessageSquare },
                ]} />
            </MensagemIA>
          )}

          {/* O cartão de ferramenta é o formulário da própria ferramenta, já preenchido com o que foi entendido. */}
          {!antiga && ['cartao', 'gerando', 'resposta'].includes(etapa) && (
            <Card className="animate-entra rounded-cartao border-linha shadow-none">
              <CardHeader className="flex-row items-center gap-2.5 space-y-0 border-b border-linha p-4 lg:px-5">
                <span className="grid size-8 place-items-center rounded-linha bg-realce-suave text-tinta"><ClipboardList className="size-[18px]" /></span>
                <CardTitle className="font-corpo text-base font-semibold text-tinta">Prova</CardTitle>
                {etapa === 'cartao' ? <Estado tipo="contorno">rascunho</Estado> : <Estado tipo="ok">Salvo na biblioteca</Estado>}
              </CardHeader>
              <CardContent className="p-4 lg:p-5">
                {etapa === 'cartao'
                  ? <FormProva aoCancelar={() => setEtapa('pergunta')} aoGerar={gerar} />
                  : <p className="text-[15px] text-apoio">2ºB · Estequiometria · 10 questões · Química 2, cap. 7 · 1 versão · com gabarito</p>}
              </CardContent>
            </Card>
          )}

          {etapa === 'gerando' && (
            <MensagemIA agente="assistente">
              <GenericTool icon={Sparkles} title="Gerando a prova…" subtitle="lendo Química 2, cap. 7" isPending className="motion-reduce:[&_.an-generic-shimmer]:animate-none [&_*]:!text-[15px]" />
            </MensagemIA>
          )}

          {etapa === 'resposta' && (
            <MensagemIA agente="assistente" rodape={fluxo.fim ? <AcoesResposta /> : undefined}>
              <p className="mb-3">Pronto. Dez questões do capítulo 7, do cálculo direto ao reagente limitante. As cinco primeiras:</p>
              <ol className="grid list-decimal gap-3 pl-6 marker:font-semibold marker:text-sutil">
                {QUESTOES.slice(0, fluxo.chegou).map((q) => (
                  <li key={q.texto} className="animate-entra pl-1">{q.texto} <ChipFonte pagina={q.pagina} /></li>
                ))}
              </ol>
              {!fluxo.fim && <span className="cursor-texto ml-6 mt-3" aria-hidden />}
              {fluxo.fim && (
                <>
                  <p className="mt-3 text-sutil">…e mais cinco, com o gabarito na última página.</p>
                  <Fontes itens={[
                    { tipo: 'material', titulo: 'Química 2 — Proporção em massa e em mol', pagina: 142 },
                    { tipo: 'material', titulo: 'Química 2 — Cálculos com massa molar', pagina: 145 },
                    { tipo: 'material', titulo: 'Química 2 — Reagente limitante e rendimento', pagina: 151 },
                  ]} />
                </>
              )}
            </MensagemIA>
          )}

          {/* "Só conversar": responde normalmente, sem artefato salvo, e continua citando o material. */}
          {etapa === 'so-conversa' && (
            <MensagemIA agente="assistente" rodape={fluxoConversa.fim ? <Button variant="discreto" size="sm"><Copy /> Copiar</Button> : undefined}>
              <div className="grid gap-3">
                {fluxoConversa.chegou >= 1 && <p className="animate-entra">Combinado, sem abrir a ferramenta. Para dez questões de estequiometria no 2ºB, eu seguiria a ordem do capítulo 7: proporção em mol <ChipFonte pagina={142} />, depois massa molar <ChipFonte pagina={145} /> e, por fim, reagente limitante e rendimento <ChipFonte pagina={151} />.</p>}
                {fluxoConversa.chegou >= 2 && <p className="animate-entra">A turma errou mais em reagente limitante na última lista, então vale reservar três das dez questões para isso.</p>}
                {fluxoConversa.chegou >= 3 && <p className="animate-entra text-sutil">Nada foi salvo na biblioteca. Se quiser o artefato com gabarito e versões, escolha a ferramenta Prova na caixa abaixo.</p>}
                {!fluxoConversa.fim && <span className="cursor-texto" aria-hidden />}
              </div>
            </MensagemIA>
          )}

          {/* Segundo ato do roteiro: a versão adaptada, escolhendo o TIPO de adaptação. */}
          {etapa === 'resposta' && fluxo.fim && adaptacao === null && (
            <div className="flex animate-entra flex-wrap gap-2">
              <Button variant="secundario" size="sm" onClick={() => setAdaptacao('cartao')}><SlidersHorizontal /> Pedir a versão adaptada</Button>
              <Button variant="secundario" size="sm">Gerar outra versão</Button>
              <Button variant="secundario" size="sm">Deixar as questões mais difíceis</Button>
            </div>
          )}

          {adaptacao !== null && (
            <>
              <MensagemPessoa texto="faz a versão adaptada dessa prova" />
              <Card className="animate-entra rounded-cartao border-linha shadow-none">
                <CardHeader className="flex-row items-center gap-2.5 space-y-0 border-b border-linha p-4 lg:px-5">
                  <span className="grid size-8 place-items-center rounded-linha bg-realce-suave text-tinta"><SlidersHorizontal className="size-[18px]" /></span>
                  <CardTitle className="font-corpo text-base font-semibold text-tinta">Adaptação</CardTitle>
                  {adaptacao === 'cartao' && <Estado tipo="contorno">rascunho</Estado>}
                </CardHeader>
                <CardContent className="p-4 lg:p-5">
                  {adaptacao === 'cartao'
                    ? <FormAdaptacao aoCancelar={() => setAdaptacao(null)} aoGerar={(t) => { setTipos(t); setAdaptacao('gerando'); window.setTimeout(() => setAdaptacao('pendente'), 1600) }} />
                    : <p className="text-[15px] text-apoio">Prova de estequiometria · 2ºB · {tipos.map((t) => TIPOS_ADAPTACAO.find((x) => x.id === t)?.nome).join(' + ')}</p>}
                </CardContent>
              </Card>
            </>
          )}

          {adaptacao === 'gerando' && (
            <MensagemIA agente="adaptador">
              <GenericTool icon={Sparkles} title="Preparando a versão adaptada…" subtitle="mesmo conteúdo, outra forma" isPending className="[&_*]:!text-[15px]" />
            </MensagemIA>
          )}

          {/* A versão adaptada NASCE PENDENTE: nada chega ao aluno antes de o professor aprovar (regra 70, item 3). */}
          {(adaptacao === 'pendente' || adaptacao === 'aprovada' || adaptacao === 'rejeitada') && (
            <MensagemIA agente="adaptador" extra={
              adaptacao === 'pendente' ? <Estado tipo="pendente">Esperando você</Estado>
                : adaptacao === 'rejeitada' ? <Estado tipo="erro">Rejeitada</Estado> : undefined
            }>
              <p>Preparei a versão adaptada: as mesmas dez questões, com corpo 18, uma questão por bloco e o enunciado em frases curtas. O que é cobrado não mudou. Ela só chega aos alunos com adaptação registrada depois que você aprovar.</p>
              <div className="mt-4 rounded-cartao border border-linha bg-superficie p-5">
                <p className="rotulo mb-3">Prévia · questão 1</p>
                <p className="text-[18px] leading-[1.7] text-tinta">Queimamos 24 g de carbono.<br />Todo o carbono vira CO₂.<br /><b className="font-semibold">Qual é a massa de CO₂ formada?</b></p>
                <p className="mt-2 text-sm text-sutil">Dados: C = 12; O = 16 <ChipFonte pagina={142} /></p>
              </div>
              {adaptacao === 'pendente' && (
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                  <Button variant="perigo" onClick={() => setAdaptacao('rejeitada')}>Rejeitar…</Button>
                  <Button variant="secundario">Ver a prova inteira</Button>
                  <Button variant="oficial" onClick={() => setAdaptacao('aprovada')}>Aprovar versão adaptada</Button>
                </div>
              )}
              {adaptacao === 'aprovada' && <LinhaAprovacao className="mt-4" />}
              {adaptacao === 'rejeitada' && <p className="mt-4 rounded-linha bg-erro-cx px-3 py-2 text-sm text-erro">Rejeitada por Camila Souza · 21/09, 10h44 · "O enunciado da questão 4 perdeu um dado."</p>}
            </MensagemIA>
          )}

        </div>
      </div>

      {/* Em qualquer largura, a caixa de pedido fica presa embaixo e a lista rola por trás. */}
      <div className="shrink-0 bg-fundo px-4 pb-4 pt-2 md:px-6">
        <div className="mx-auto w-full max-w-[760px]">
          <CaixaPedido valor={texto} aoMudar={setTexto} aoEnviar={() => setTexto('')} ferramenta={ferramenta} aoMudarFerramenta={setFerramenta} turmaInicial={c.turmaId}
            lado="top" status={chegando ? 'streaming' : 'ready'} aoParar={() => { fluxo.parar(); fluxoConversa.parar() }} placeholder="Peça um ajuste, outra versão, ou comece outro pedido…" />
          <p className="mt-2 text-center text-xs text-sutil">O Assistente de ensino é uma IA e pode errar. Confira antes de usar com a turma.</p>
        </div>
      </div>
    </div>
  )
}
