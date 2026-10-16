import { useId, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Download } from 'lucide-react'
import { Botao, Linha, Secao, Selo } from '@/components/duo'
import { Icone, type IconeId } from '@/components/duo/icones'
import { PainelLado } from '@/components/turmma/painel-lado'
import { registrar } from '@/dados/demo/nucleo'
import { cn } from '@/lib/utils'
import { useEncarregado, type Encarregado } from '@/dados/escola-estado'
import { AIA, textoAIA, type IdIA } from './Agentes'
import { useMesIA } from './Governanca'
import { baixarArquivo } from './Exportar'

/* DOSSIÊ (14ª rodada, 05/10/2026; plano ux-composicao, 1.4; fluxos F10, F16 e F40). Deixou de ser aba: é o botão
   DOSSIÊ do cabeçalho de Registros, que abre este painel de 640 ao lado (?dossie=1; /coordenacao/conformidade e
   ?aba=dossie chegam aqui). O dossiê da escola num lugar (D61): o que a coordenação abre na reunião com as famílias,
   com a mantenedora e com o jurídico.
   · No topo, O QUE FALTA, com a lei primeiro: "Encarregado de dados · LGPD art. 41" (lei) com INDICAR, que leva a
     Configurações da escola › Encarregado; indicado, o item fica marcado como feito. Depois o que é nosso: a AIA do
     Analista em revisão e a comunidade consultada.
   · O resto, recolhido. "Relatório de uso" e "Avaliações de impacto" levam a Registros › IA (a casa do número).
   · BAIXAR O DOSSIÊ, preso no rodapé, é o único botão cheio do painel: gera um .html de verdade (que guarda as
     cores dele; não acompanha o tema da tela).
   A AIA de cada IA é a MESMA que "Como cada IA trabalha" mostra (uma versão só, vinda de Agentes.tsx). */

const LEI: { texto: string; ok: boolean }[] = [
  { texto: 'A escola é controladora; a Turmma é operadora', ok: true },
  { texto: 'Aluno sem e-mail, CPF, foto ou nascimento no sistema', ok: true },
  { texto: 'Adaptação sem diagnóstico, laudo ou CID', ok: true },
  { texto: 'Conversa do Tutor guardada 90 dias', ok: true },
  { texto: 'Dado não treina IA', ok: true },
  { texto: 'Canal de aviso com prazo e resposta por escrito (ECA Digital, art. 28)', ok: true },
  { texto: 'Sem recompensa por tempo de uso (Decreto 12.880)', ok: true },
]

const CHECKLIST: { item: string; ok: boolean }[] = [
  { item: 'Finalidade pedagógica declarada', ok: true },
  { item: 'Sem IA generativa na infantil e nos anos iniciais', ok: true },
  { item: 'Toda saída de IA marcada, com a fonte', ok: true },
  { item: 'Aprovação humana registrada em nota', ok: true },
  { item: 'IA não corrige redação nem discursiva', ok: true },
  { item: 'Avaliação de impacto de cada função de alto risco', ok: false },
  { item: 'Professor não é penalizado por não usar', ok: true },
  { item: 'Comunidade escolar consultada', ok: false },
  { item: 'Dado exportável em formato aberto', ok: true },
]

const MATERIAIS = [
  { nome: 'Carta às famílias sobre IA na escola', arquivo: 'carta-as-familias.txt' },
  { nome: 'Roteiro da reunião de pais', arquivo: 'roteiro-reuniao-de-pais.txt' },
  { nome: 'Guia do professor', arquivo: 'guia-do-professor.txt' },
]

const IAS: IdIA[] = ['assistente', 'tutor', 'analista']

/** No celular, o título do que falta quebra em duas linhas (não corta) e o selo fica junto do artigo. */
const QUEBRA = 'max-sm:[&_.t-cartao]:whitespace-normal max-sm:[&_.t-cartao]:line-clamp-2 [&_.t-apoio]:flex-nowrap [&_.t-apoio]:whitespace-nowrap'

function Marca({ ok }: { ok: boolean }) {
  return ok
    ? <Selo familia="verde" tamanho="p" icone={<Check strokeWidth={3.5} />}>Feito</Selo>
    : <Selo familia="amarelo" tamanho="p">Falta</Selo>
}

function ListaMarcas({ itens }: { itens: { texto: string; ok: boolean }[] }) {
  return (
    <ul className="grid">
      {itens.map((l) => (
        <li key={l.texto} className="flex min-h-11 items-center gap-3 border-t-2 border-borda first:border-t-0">
          <span className="min-w-0 flex-1 text-[15px] font-medium leading-5 text-tinta">{l.texto}</span>
          <Marca ok={l.ok} />
        </li>
      ))}
    </ul>
  )
}

/** Uma linha do cartão que abre embaixo dela: o mesmo desenho da Linha (ícone · título · apoio · › à direita); o ›
    gira para baixo quando aberta. */
function LinhaAbre({ icone, titulo, apoio, inicial = false, children }: { icone: IconeId; titulo: string; apoio: string; inicial?: boolean; children: ReactNode }) {
  const [aberta, setAberta] = useState(inicial)
  const id = useId()
  return (
    <li className="border-t-2 border-borda">
      <button type="button" aria-expanded={aberta} aria-controls={id} onClick={() => setAberta((v) => !v)}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-150 hover:bg-fundo-suave">
        <Icone id={icone} tamanho={40} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="t-cartao truncate text-tinta">{titulo}</span>
          <span className="t-apoio truncate">{apoio}</span>
        </span>
        <ChevronRight aria-hidden strokeWidth={2.5} className={cn('size-5 shrink-0 text-apagado transition-transform duration-150', aberta && 'rotate-90')} />
      </button>
      {aberta && <div id={id} className="px-4 pb-3 pl-[68px]">{children}</div>}
    </li>
  )
}

/** O dossiê inteiro num .html simples, para baixar. */
function dossieHtml(enc: Encarregado | null, quando: string, mes: { gerou: number; aprovadas: number; esperam: number }) {
  const li = (t: string, ok: boolean) => `<li>${ok ? '✓' : '○'} ${t}</li>`
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Dossiê · Colégio Aurora</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;color:#1f1f1f}h1{font-size:26px}h2{font-size:19px;margin-top:28px}li{margin:4px 0}</style></head><body>
<h1>Dossiê de uso de IA · Colégio Aurora</h1>
<p>Gerado em ${quando} por Helena Martins (coordenação).</p>
<h2>Encarregado de dados (LGPD, art. 41)</h2>
<p>${enc ? `${enc.nome} · ${enc.contato}` : 'Ainda não indicado.'}</p>
<h2>Declaração de propósito</h2>
<p>A escola usa a Turmma para apoiar o planejamento do professor, o estudo do aluno com um tutor acompanhado e o acompanhamento pedagógico da coordenação. A IA prepara e avisa; quem decide é a escola. Do 6º ano do Fundamental ao 3º do Médio.</p>
<h2>LGPD e ECA Digital</h2><ul>${LEI.map((l) => li(l.texto, l.ok)).join('')}${li('Encarregado de dados indicado e publicado', !!enc)}</ul>
<h2>Avaliações de impacto</h2><ul>${IAS.map((id) => li(`${id[0].toUpperCase()}${id.slice(1)} · ${textoAIA(id)} · ${AIA[id].vigente ? 'vigente' : 'em revisão'}`, AIA[id].vigente)).join('')}</ul>
<h2>Relatório de uso · setembro</h2>
<p>A IA gerou ${mes.gerou}; professores aprovaram ${mes.aprovadas}; ${mes.esperam} esperam. Sem uso por professor.</p>
<h2>Checklist do MEC</h2><ul>${CHECKLIST.map((c) => li(c.item, c.ok)).join('')}</ul>
</body></html>`
}

/** O painel do Dossiê, aberto pelo botão DOSSIÊ de Registros (?dossie=1). */
export function Dossie({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const navegar = useNavigate()
  const enc = useEncarregado()
  const mes = useMesIA()
  const [materiais, setMateriais] = useState(0) // muda a chave para abrir "Materiais para famílias"
  const atendidos = CHECKLIST.filter((c) => c.ok).length
  const lei = [...LEI, { texto: 'Encarregado de dados indicado e publicado', ok: !!enc }]
  const falta = (enc ? 0 : 1) + 2

  const baixar = () => {
    const ev = registrar('exportacao', { conjunto: 'Dossiê da escola', finalidade: 'Dossiê da escola', formato: 'HTML' }, { nome: 'Helena Martins', papel: 'coordenacao' })
    baixarArquivo('dossie-colegio-aurora.html', dossieHtml(enc, ev.quando.rotulo, mes), 'text/html;charset=utf-8')
  }

  return (
    <PainelLado aberto={aberto} aoFechar={aoFechar} titulo="Dossiê da escola" largura={640} className="[&>header_button:focus-visible]:-outline-offset-3"
      rodape={(
        <>
          <p className="t-apoio mr-auto max-sm:hidden">Um arquivo com tudo abaixo, para a reunião.</p>
          <Botao icone={<Download strokeWidth={2.5} />} onClick={baixar}>Baixar o dossiê</Botao>
        </>
      )}>
      <div className="grid gap-8">
        <Secao titulo="O que falta" n={falta}>
          <ul className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
            <li>
              {enc ? (
                <Linha titulo="Encarregado de dados" className={QUEBRA}
                  inicio={<Icone id="titular" tamanho={40} familia="verde" />}
                  abaixo={<span className="truncate">LGPD, art. 41 · {enc.nome} · {enc.contato}</span>}
                  fim={<Marca ok />} />
              ) : (
                <Linha titulo="Encarregado de dados" className={QUEBRA}
                  inicio={<Icone id="titular" tamanho={40} familia="vermelho" />}
                  abaixo={<><Selo tamanho="p" familia="vermelho">É lei</Selo><span>LGPD, art. 41</span></>}
                  fim={<Botao variante="secundario" tamanho="p" onClick={() => navegar('/coordenacao/configuracoes?de=dossie#encarregado')}>Indicar</Botao>} />
              )}
            </li>
            <li className="border-t-2 border-borda">
              <Linha titulo="Avaliação de impacto do Analista" className={cn('border-t-0', QUEBRA)} chevron para="/coordenacao/registros?aba=ia&ver=como&ia=analista"
                inicio={<Icone id="alerta" tamanho={40} />} abaixo="Em revisão até segunda" />
            </li>
            <li className="border-t-2 border-borda">
              <Linha titulo="Comunidade consultada" className={cn('border-t-0', QUEBRA)} chevron onClick={() => setMateriais((n) => n + 1)}
                inicio={<Icone id="convite" tamanho={40} />} abaixo="Reunião de pais em 08/10" />
            </li>
          </ul>
        </Secao>

        <Secao titulo="No dossiê">
          {/* um cartão só, uma linha só: ícone · título · apoio · › à direita; o que se lê aqui abre embaixo da linha */}
          <ul className="overflow-hidden rounded-[16px] border-2 border-borda bg-white">
            <li><Linha titulo="Relatório de uso" chevron para="/coordenacao/registros?aba=ia" inicio={<Icone id="ia" tamanho={40} />}
              abaixo={`Setembro · ${mes.gerou} gerados · ${mes.aprovadas} aprovados`} /></li>
            <li className="border-t-2 border-borda">
              <Linha titulo="Avaliações de impacto" className="border-t-0" chevron para="/coordenacao/registros?aba=ia&ver=como" inicio={<Icone id="alerta" tamanho={40} />}
                abaixo={IAS.map((id) => `${id[0].toUpperCase()}${id.slice(1)} ${AIA[id].versao}`).join(' · ')} />
            </li>
            <LinhaAbre icone="dossie" titulo="LGPD e ECA Digital" apoio={`${lei.filter((l) => l.ok).length} de ${lei.length} feitos`}>
              <ListaMarcas itens={lei} />
            </LinhaAbre>
            <LinhaAbre icone="aprovado" titulo="Checklist do MEC" apoio={`${atendidos} de ${CHECKLIST.length} feitos`}>
              <ListaMarcas itens={CHECKLIST.map((c) => ({ texto: c.item, ok: c.ok }))} />
            </LinhaAbre>
            <LinhaAbre icone="leitura" titulo="Declaração de propósito" apoio="6º ano do Fundamental ao 3º do Médio">
              <p className="t-corpo max-w-[68ch] text-apoio">
                A escola usa a Turmma para apoiar o planejamento do professor, o estudo do aluno com um tutor acompanhado e o
                acompanhamento da coordenação. A IA prepara e avisa; quem decide é a escola.
              </p>
            </LinhaAbre>
            <LinhaAbre key={`materiais-${materiais}`} inicial={materiais > 0} icone="criados" titulo="Materiais para famílias" apoio={`${MATERIAIS.length} arquivos`}>
              <ul className="grid">
                {MATERIAIS.map((m) => (
                  <li key={m.nome} className="flex min-h-12 items-center gap-3 border-t-2 border-borda first:border-t-0">
                    <span className="min-w-0 flex-1 text-[15px] font-medium text-tinta">{m.nome}</span>
                    <Botao variante="fantasma" tamanho="p" icone={<Download strokeWidth={2.5} />} aria-label={`Baixar: ${m.nome}`}
                      onClick={() => baixarArquivo(m.arquivo, `${m.nome}\n\nColégio Aurora.\n`, 'text/plain;charset=utf-8')}>Baixar</Botao>
                  </li>
                ))}
              </ul>
            </LinhaAbre>
          </ul>
        </Secao>
      </div>
    </PainelLado>
  )
}
