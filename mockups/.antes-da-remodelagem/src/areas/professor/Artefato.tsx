import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Check, FileDown, Printer, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PintaTurma } from '@/components/marca/Pinta'
import { Fontes } from '@/components/turmma/conversa'
import { AssinaturaIA, ChipFonte, Estado, LinhaAprovacao } from '@/components/turmma/ia'
import { Cartao, NotaMockup, Tela } from '@/components/turmma/tela'
import { abaGatilho, abasLista, dialogo, Par } from './_pecas'

/* O artefato na biblioteca (1.2): salvo, ligado à turma e ao calendário, com a página de origem,
   e exportável em PDF, PPTX e XLSX (D67). É seu e da escola: sai em formato aberto quando quiser (D63). */

const QUESTOES = [
  { texto: 'Qual a massa de CO₂ formada na queima completa de 24 g de carbono? (C = 12; O = 16)', pagina: 142, alt: ['44 g', '66 g', '88 g', '24 g'], certa: 2 },
  { texto: 'Na reação N₂ + 3 H₂ → 2 NH₃, quantos mols de amônia se formam a partir de 6 mol de H₂?', pagina: 142, alt: ['2 mol', '4 mol', '6 mol', '9 mol'], certa: 1 },
  { texto: 'Calcule a massa de água produzida na combustão de 8 g de gás hidrogênio. (H = 1; O = 16)', pagina: 145, alt: ['18 g', '36 g', '72 g', '144 g'], certa: 2 },
  { texto: 'Em 2 Al + 3 Cl₂ → 2 AlCl₃, com 54 g de Al e 71 g de Cl₂, qual é o reagente limitante?', pagina: 151, alt: ['O alumínio', 'O cloro', 'Nenhum: a proporção é exata', 'O cloreto de alumínio'], certa: 1 },
  { texto: 'Uma reação com rendimento teórico de 50 g produziu 40 g. Qual foi o rendimento percentual?', pagina: 151, alt: ['125%', '90%', '80%', '40%'], certa: 2 },
]
const LETRAS = ['a', 'b', 'c', 'd']

export function Artefato() {
  const [atribuida, setAtribuida] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const [adaptada, setAdaptada] = useState<'pendente' | 'aprovada'>('pendente')

  return (
    <Tela objeto largura="media"
      titulo={<span className="flex items-center gap-3"><PintaTurma turma="2ºB" className="h-9 w-9" /> Prova de estequiometria</span>}
      descricao="Prova · 2ºB · Química · 10 questões · 1 versão · criada em 21/09, com o Assistente de ensino"
      acoes={
        <>
          <Button variant="discreto" size="sm" asChild><Link to="/professor/ferramentas?aba=biblioteca"><ArrowLeft /> Biblioteca</Link></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="secundario"><FileDown /> Exportar</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-controle">
              {['Exportar em PDF', 'Exportar em PowerPoint (PPTX)', 'Exportar em Excel (XLSX)'].map((o) => <DropdownMenuItem key={o} className="h-10 rounded-linha"><FileDown /> {o}</DropdownMenuItem>)}
              <DropdownMenuItem className="h-10 rounded-linha"><Printer /> Imprimir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {atribuida
            ? <Estado tipo="ok" size="lg">Atribuída ao 2ºB · quinta, 24/09</Estado>
            : <Button onClick={() => setConfirmar(true)}><Send /> Atribuir ao 2ºB</Button>}
        </>
      }>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <Tabs defaultValue="questoes">
            <TabsList className={abasLista}>
              <TabsTrigger value="questoes" className={abaGatilho}>Questões</TabsTrigger>
              <TabsTrigger value="gabarito" className={abaGatilho}>Gabarito</TabsTrigger>
              <TabsTrigger value="adaptada" className={abaGatilho}>Versão adaptada</TabsTrigger>
            </TabsList>

            <TabsContent value="questoes" className="mt-4">
              <Cartao>
                <AssinaturaIA id="assistente" className="mb-4" />
                <ol className="grid list-decimal gap-5 pl-6 text-base leading-[1.6] text-tinta marker:font-semibold marker:text-sutil">
                  {QUESTOES.map((q) => (
                    <li key={q.texto} className="pl-1">
                      {q.texto} <ChipFonte pagina={q.pagina} />
                      <ol className="mt-2 grid gap-1 text-[15px] text-apoio sm:grid-cols-2">
                        {q.alt.map((a, i) => <li key={a}><b className="font-semibold text-tinta">{LETRAS[i]})</b> {a}</li>)}
                      </ol>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-[15px] text-sutil">…e mais cinco questões.</p>
                <Fontes itens={[
                  { tipo: 'material', titulo: 'Química 2 — Proporção em massa e em mol', pagina: 142 },
                  { tipo: 'material', titulo: 'Química 2 — Cálculos com massa molar', pagina: 145 },
                  { tipo: 'material', titulo: 'Química 2 — Reagente limitante e rendimento', pagina: 151 },
                ]} />
              </Cartao>
            </TabsContent>

            <TabsContent value="gabarito" className="mt-4">
              <Cartao titulo="Gabarito · só você vê">
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {QUESTOES.map((q, i) => (
                    <li key={i} className="flex min-h-11 items-center gap-3 rounded-controle bg-ia-cx px-3 text-[15px] text-tinta">
                      <span className="w-6 font-semibold tabular-nums text-sutil">{i + 1}.</span>
                      <b className="font-semibold">{LETRAS[q.certa]})</b> <span className="min-w-0 truncate text-apoio">{q.alt[q.certa]}</span>
                      <span className="ml-auto"><ChipFonte pagina={q.pagina} /></span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-sutil">O gabarito é o que o Assistente usa na correção da objetiva. Você pode trocar uma alternativa antes de atribuir.</p>
              </Cartao>
            </TabsContent>

            <TabsContent value="adaptada" className="mt-4">
              <Cartao>
                <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <AssinaturaIA id="adaptador" />
                  {adaptada === 'pendente' ? <Estado tipo="pendente">Esperando você</Estado> : null}
                </div>
                <p className="text-[15px] text-apoio">Tipo de adaptação: <b className="font-semibold text-tinta">Fonte ampliada + Enunciado direto</b>. As mesmas dez questões; muda a forma, nunca o que é cobrado.</p>
                <div className="mt-4 rounded-cartao border border-linha bg-fundo p-5">
                  <p className="rotulo mb-3">Prévia · questão 1</p>
                  <p className="text-[18px] leading-[1.7] text-tinta">Queimamos 24 g de carbono.<br />Todo o carbono vira CO₂.<br /><b className="font-semibold">Qual é a massa de CO₂ formada?</b></p>
                  <p className="mt-2 text-sm text-sutil">Dados: C = 12; O = 16 <ChipFonte pagina={142} /></p>
                </div>
                {adaptada === 'pendente' ? (
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <Button variant="perigo">Rejeitar…</Button>
                    <Button variant="oficial" onClick={() => setAdaptada('aprovada')}>Aprovar versão adaptada</Button>
                  </div>
                ) : <LinhaAprovacao className="mt-4" quando="21/09, 10h58" />}
                <p className="mt-3 text-sm text-sutil">Só recebe esta versão quem tem a adaptação registrada pela coordenação. O sistema não guarda diagnóstico.</p>
              </Cartao>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="grid content-start gap-4">
          <Cartao titulo="Sobre este artefato">
            <dl>
              <Par rotulo="Estado">{atribuida ? 'Atribuída' : 'Rascunho seu'}</Par>
              <Par rotulo="Turma">2ºB · Química</Par>
              <Par rotulo="Material">Química 2, cap. 7</Par>
              <Par rotulo="Habilidades">EM13CNT101 · 104 · 301</Par>
              <Par rotulo="Gerado por">Assistente de ensino</Par>
            </dl>
          </Cartao>
          <Cartao titulo="No calendário">
            <Link to="/professor/calendario" className="flex items-center gap-3 rounded-controle border border-linha p-3 transition-colors duration-150 hover:bg-realce">
              <span className="grid size-10 shrink-0 place-items-center rounded-controle bg-realce-suave text-tinta"><CalendarDays className="size-5" /></span>
              <span className="min-w-0 text-sm"><b className="block font-semibold text-tinta">Quinta, 24/09 · 2ª aula</b><span className="text-sutil">{atribuida ? 'Avaliação marcada para o 2ºB' : 'Sugestão: a próxima aula do 2ºB'}</span></span>
            </Link>
          </Cartao>
        </aside>
      </div>

      <Dialog open={confirmar} onOpenChange={setConfirmar}>
        <DialogContent className={dialogo}>
          <DialogHeader className="text-left">
            <DialogTitle className="font-corpo text-lg font-semibold text-tinta">Atribuir a prova ao 2ºB?</DialogTitle>
            <DialogDescription className="text-[15px] leading-relaxed text-apoio">Os 32 alunos do 2ºB recebem a prova em "Atividades e provas" na quinta, 24/09, na 2ª aula. Quem tem adaptação registrada recebe a versão adaptada, se você já tiver aprovado.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="secundario" onClick={() => setConfirmar(false)}>Agora não</Button>
            <Button onClick={() => { setAtribuida(true); setConfirmar(false) }}><Check /> Atribuir ao 2ºB</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotaMockup>
        A2 (artefato salvo, ligado à turma, com a página citada e PDF); PPTX e XLSX são do F7 (D67). A versão adaptada nasce pendente e só o botão de aprovar é "oficial" (regra 70, item 3).
        Aprovar aqui e aprovar na conversa são a mesma entrega do Assistente (função Adaptação). Peças: shadcn/tabs, dialog, dropdown-menu.
      </NotaMockup>
    </Tela>
  )
}
