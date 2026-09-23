import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, FileCheck2, Info } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { AvatarAgente, Estado, LinhaAprovacao, SeloIA } from '@/components/turmma/ia'
import { Cartao, NotaMockup } from '@/components/turmma/tela'
import { ALUNOS_2B } from '@/dados/escola'
import { cn } from '@/lib/utils'
import { dialogo, Par } from './_pecas'

/* Aprovar (11.5) — a ação que não pode virar clique reflexo (regra 50, item 8; regra 70).
   O botão de aprovar é o ÚNICO `oficial` da tela, mora numa barra presa embaixo e fica inativo até o
   último destaque ser aberto, com o contador ao lado dizendo por quê (D33). A tela mostra, enquanto
   acontece, o que o REGISTRO DA VALIDAÇÃO vai guardar (D56). No MVP o que se aprova é DIAGNÓSTICO, não nota (D46). */

type Destaque = { id: string; titulo: string; quem: string; resumo: string; fato?: boolean }

const DESTAQUES: Destaque[] = [
  { id: 'abaixo', titulo: 'Resultado muito abaixo do histórico', quem: 'Ana Beatriz', resumo: '2 de 10 (costuma acertar 7 ou 8)' },
  { id: 'branco', titulo: 'Prova em branco', quem: 'Caio Mendes', resumo: 'nenhuma questão respondida' },
  { id: 'q7', titulo: 'Questão 7 com erro em 26 de 30', quem: 'Toda a turma', resumo: '24 marcaram a mesma alternativa' },
  { id: 'acima', titulo: 'Resultado muito acima do histórico', quem: 'Nicolas Dias', resumo: '9 de 10 (costuma acertar 4)' },
  { id: 'aba', titulo: 'Saiu da aba da prova 3 vezes', quem: 'Felipe Nunes', resumo: 'fato, sem consequência automática', fato: true },
]

const MAIS_NOMES = ['Rafaela Souza', 'Samuel Costa', 'Tainá Oliveira', 'Ulisses Prado', 'Valentina Cruz', 'William Santos', 'Yasmin Ferreira', 'Arthur Moraes',
  'Bianca Teixeira', 'Davi Lopes', 'Helena Prado', 'Igor Martins', 'Júlia Barros', 'Kauã Ribeiro', 'Lívia Campos', 'Miguel Andrade']
const FORA = ['Ana Beatriz', 'Caio Mendes', 'Nicolas Dias', 'Felipe Nunes']
const ACERTOS = [7, 6, 8, 5, 9, 7, 6, 4, 8, 7, 6, 10, 5, 7, 8, 6, 3, 7, 9, 6, 7, 5, 8, 6, 7, 4, 8, 6]
const DIFICULDADE = ['Reagente limitante', 'Mol e massa molar', 'Rendimento', 'Reagente limitante', 'Equação balanceada']
const OUTRAS = [...ALUNOS_2B, ...MAIS_NOMES].filter((n) => !FORA.includes(n)).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  .map((nome, i) => ({ nome, acertos: ACERTOS[i % ACERTOS.length], dificuldade: DIFICULDADE[i % DIFICULDADE.length] }))

const DISTRIBUICAO = [['0–2', 2], ['2–4', 4], ['4–6', 8], ['6–8', 11], ['8–10', 7]] as const

function Respostas({ marcadas }: { marcadas: string }) {
  const gabarito = 'cbcbcaadab'
  return (
    <ol className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
      {gabarito.split('').map((g, i) => {
        const m = marcadas[i]
        const certo = m === g
        return (
          <li key={i} className={cn('rounded-linha px-1 py-1.5 text-center text-xs', m === '-' ? 'bg-ia-cx text-sutil' : certo ? 'bg-ok-cx text-ok' : 'bg-erro-cx text-erro')}>
            <span className="block tabular-nums text-sutil">{i + 1}</span>
            <b className="block text-sm font-semibold">{m === '-' ? '—' : m}</b>
            <span className="block">{m === '-' ? 'vazio' : certo ? 'certo' : `era ${g}`}</span>
          </li>
        )
      })}
    </ol>
  )
}

function CorpoDestaque({ id, gabaritoTrocado, aoTrocar }: { id: string; gabaritoTrocado: boolean; aoTrocar: () => void }) {
  if (id === 'abaixo') return (
    <>
      <Respostas marcadas="cadaabccdb" />
      <dl className="mt-1"><Par rotulo="Nas últimas 4 avaliações">7 · 8 · 7 · 8 de 10</Par><Par rotulo="Errou mais em">Mol e massa molar</Par></dl>
      <p className="text-sm leading-snug text-sutil">O Assistente não conclui nada sobre quem fez a prova. Ele só põe o caso na sua frente antes de o diagnóstico chegar ao aluno.</p>
    </>
  )
  if (id === 'branco') return (
    <>
      <Respostas marcadas="----------" />
      <dl className="mt-1"><Par rotulo="Entrou na prova">8h22</Par><Par rotulo="Entregou">8h25</Par></dl>
      <p className="text-sm leading-snug text-sutil">Se ele vai refazer, tire do lote: o diagnóstico dele não é gerado e a prova volta a ficar disponível quando você liberar.</p>
    </>
  )
  if (id === 'q7') return (
    <>
      <p className="text-[15px] leading-snug text-apoio">"Qual a massa de NaCl formada a partir de 46 g de sódio?" O gabarito cadastrado é <b className="font-semibold text-tinta">a</b>.</p>
      <ul className="grid gap-1.5">
        {[['a', 4, 'gabarito cadastrado'], ['b', 1, ''], ['c', 24, ''], ['d', 1, '']].map(([l, n, nota]) => (
          <li key={l as string} className="grid grid-cols-[28px_1fr_auto] items-center gap-2 text-sm">
            <b className="font-semibold text-tinta">{l})</b>
            <span className="h-2.5 overflow-hidden rounded-full bg-ia-cx"><span className="block h-full rounded-full bg-noite" style={{ width: `${((n as number) / 30) * 100}%` }} /></span>
            <span className="tabular-nums text-apoio">{n} alunos{nota ? ` · ${nota}` : ''}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm leading-snug text-sutil">Quando quase toda a turma marca a mesma alternativa "errada", o mais comum é gabarito trocado. Quem decide é você.</p>
      {gabaritoTrocado
        ? <Estado tipo="ok">Gabarito trocado para c por você · o Assistente recorrigiu as 30</Estado>
        : <Button variant="secundario" size="sm" onClick={aoTrocar} className="justify-self-start">Trocar o gabarito para c e recorrigir</Button>}
    </>
  )
  if (id === 'acima') return (
    <>
      <Respostas marcadas="cbcbcacdaa" />
      <dl className="mt-1"><Par rotulo="Nas últimas 4 avaliações">4 · 3 · 5 · 4 de 10</Par></dl>
      <p className="text-sm leading-snug text-sutil">Subir muito também é destaque. O sistema não supõe motivo nenhum: só mostra a distância do histórico.</p>
    </>
  )
  return (
    <>
      <dl><Par rotulo="Saídas da aba">8h31 · 8h40 · 8h52</Par><Par rotulo="Resultado">7 de 10</Par><Par rotulo="O aluno foi avisado antes">Sim, na tela de início da prova</Par></dl>
      <p className="flex items-start gap-2 rounded-controle bg-info-cx p-3 text-sm leading-snug text-info">
        <Info className="mt-0.5 size-4 shrink-0" /> É um fato, não um veredito. Nada aconteceu sozinho com a prova nem com o resultado. Aparece só para você, só nesta avaliação, não vira histórico do aluno e a coordenação não vê.
      </p>
    </>
  )
}

function Celula({ children, className }: { children: ReactNode; className?: string }) {
  return <TableCell className={cn('px-4 py-3 text-[15px] text-tinta', className)}>{children}</TableCell>
}

export function Aprovar() {
  const [abertos, setAbertos] = useState<Record<string, string>>({ q7: '10h38', acima: '10h39', aba: '10h39' })
  const [vendo, setVendo] = useState<Destaque | null>(null)
  const [gabaritoTrocado, setGabaritoTrocado] = useState(false)
  const [foraDoLote, setForaDoLote] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [rejeitando, setRejeitando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [estado, setEstado] = useState<'revisando' | 'aprovado' | 'rejeitado'>('revisando')
  const [todas, setTodas] = useState(false)

  const nAbertos = Object.keys(abertos).length
  const faltam = DESTAQUES.length - nAbertos
  const total = foraDoLote ? 29 : 30
  const media = gabaritoTrocado ? '7,1' : '6,4'
  const hora = (i: number) => `10h4${Math.min(i, 9)}`

  const fechar = () => {
    if (vendo && !abertos[vendo.id]) setAbertos((a) => ({ ...a, [vendo.id]: hora(Object.keys(a).length - 3) }))
    setVendo(null)
  }

  const visiveis = todas ? OUTRAS : OUTRAS.slice(0, 8)

  return (
    <div className="flex min-h-[calc(100svh-56px)] flex-col md:min-h-svh">
      <div className="mx-auto w-full max-w-[1180px] flex-1 px-4 pb-10 pt-6 md:px-8 md:pt-9">
        <header className="mb-6">
          <Link to="/professor/time/assistente" className="mb-3 inline-flex h-9 items-center gap-1.5 rounded-linha pr-2 text-sm font-medium text-apoio hover:text-tinta"><ArrowLeft className="size-4" /> Corretor</Link>
          <h1 className="titulo-tela text-tinta">Revisar correções</h1>
          <p className="mt-1.5 text-[15px] text-sutil">Prova de estequiometria · 2ºB · aplicada na sexta, 18/09 · objetiva, 10 questões</p>
        </header>

        {estado === 'aprovado' && (
          <Cartao className="mb-5 animate-entra border-ok bg-ok-cx" titulo={<span className="flex items-center gap-2 text-ok"><FileCheck2 className="size-5" /> Registro da validação</span>}>
            <dl className="rounded-controle bg-superficie px-4">
              <Par rotulo="O que foi apresentado">{total} correções · média {media} · distribuição · 5 destaques</Par>
              <Par rotulo="O que foi aberto">{DESTAQUES.map((d) => `${d.quem.split(' ')[0]} ${abertos[d.id]}`).join(' · ')}</Par>
              <Par rotulo="O que você mudou">{[gabaritoTrocado && 'gabarito da questão 7: a → c', foraDoLote && 'Caio Mendes fora do lote'].filter(Boolean).join(' · ') || 'nada'}</Par>
              <Par rotulo="Quem confirmou">Camila Souza · 21/09, 10h42</Par>
              <Par rotulo="O que aconteceu">O diagnóstico por habilidade chegou a {total} alunos</Par>
            </dl>
            <p className="mt-3 text-sm leading-snug text-ok">É este registro que mostra, para a escola e para a fiscalização, que houve validação de verdade, e não um clique. Ele fica em Auditoria, na coordenação.</p>
          </Cartao>
        )}
        {estado === 'rejeitado' && (
          <p className="mb-5 animate-entra rounded-cartao bg-erro-cx p-4 text-[15px] leading-snug text-erro">
            <b className="font-semibold">Lote rejeitado por Camila Souza · 21/09, 10h42.</b> Motivo: "{motivo}". Nada chegou aos alunos. O Assistente refaz e avisa em "Seu time".
          </p>
        )}

        {/* O resumo: o que o professor vê antes de decidir */}
        <section aria-label="Resumo do lote" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_1.5fr]">
          <div className="rounded-cartao border border-linha bg-superficie p-4 lg:p-5"><p className="rotulo">Provas</p><p className="numero-painel mt-3 text-tinta">{total}</p><p className="mt-2 text-sm text-sutil">{foraDoLote ? '1 fora do lote, por você' : 'de 32 alunos'}</p></div>
          <div className="rounded-cartao border border-linha bg-superficie p-4 lg:p-5"><p className="rotulo">Média de acertos</p><p className="numero-painel mt-3 text-tinta">{media}</p><p className="mt-2 text-sm text-sutil">{gabaritoTrocado ? 'depois da troca do gabarito' : 'de 10 questões'}</p></div>
          <div className="rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
            <p className="rotulo">Distribuição</p>
            <div className="mt-3 flex h-[52px] items-end gap-1.5" role="img" aria-label={DISTRIBUICAO.map(([f, n]) => `${n} alunos entre ${f}`).join(', ')}>
              {DISTRIBUICAO.map(([f, n]) => <span key={f} className="flex-1 rounded-t-[4px] bg-noite" style={{ height: `${(n / 11) * 100}%` }} />)}
            </div>
            <div className="mt-1 flex gap-1.5 text-center text-xs tabular-nums text-sutil">{DISTRIBUICAO.map(([f, n]) => <span key={f} className="flex-1">{f}<b className="block font-semibold text-apoio">{n}</b></span>)}</div>
          </div>
          <div className="rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
            <p className="rotulo">Quem corrigiu</p>
            <p className="mt-3 flex items-center gap-2 text-[15px] font-semibold text-tinta"><AvatarAgente id="assistente" tamanho={24} /> Assistente · correção de objetiva <SeloIA /></p>
            <p className="mt-2 text-sm leading-snug text-sutil">Hoje, 9h50, pelo gabarito da prova. Esperando você: nada chegou aos alunos.</p>
          </div>
        </section>

        <p className="mt-3 flex items-start gap-2 rounded-controle bg-info-cx p-3 text-sm leading-snug text-info">
          <Info className="mt-0.5 size-4 shrink-0" /> O que você aprova aqui é o <b className="font-semibold">diagnóstico por habilidade</b> que chega a cada aluno. Ainda não é nota de boletim: a nota oficial entra depois, com esta mesma tela.
        </p>

        {/* Os destaques: fechado é `pendente`; aberto vira `ok`, com a hora */}
        <section aria-labelledby="destaques" className="mt-7">
          <h2 id="destaques" className="font-corpo text-base font-semibold text-tinta">Abra estes 5 antes de aprovar</h2>
          <ul className="mt-3 grid gap-2">
            {DESTAQUES.map((d) => {
              const aberto = abertos[d.id]
              return (
                <li key={d.id} className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 rounded-cartao border p-3.5 transition-colors duration-150 md:px-4', aberto ? 'border-linha bg-superficie' : 'border-caramelo bg-pendente-cx')}>
                  <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', aberto ? 'bg-ok-cx text-ok' : 'bg-superficie text-pendente')}>
                    {aberto ? <Check className="size-4" strokeWidth={2.6} /> : <AlertTriangle className="size-4" strokeWidth={2.2} />}
                  </span>
                  <p className="min-w-0 flex-1 basis-[240px] text-[15px] leading-snug text-apoio">
                    <b className="font-semibold text-tinta">{d.titulo}</b> · {d.quem} · {d.resumo}
                    {d.id === 'branco' && foraDoLote && <span className="text-sutil"> · fora do lote</span>}
                  </p>
                  {aberto ? <Estado tipo="ok">Aberto às {aberto}</Estado> : <Estado tipo="pendente">Falta abrir</Estado>}
                  <Button variant={aberto ? 'discreto' : 'secundario'} size="sm" onClick={() => setVendo(d)} disabled={estado !== 'revisando'}>{aberto ? 'Abrir de novo' : 'Abrir'}</Button>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="outras" className="mt-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="outras" className="font-corpo text-base font-semibold text-tinta">As outras {OUTRAS.length} provas</h2>
            <p className="text-sm text-sutil">Dentro do esperado para cada aluno. Em ordem alfabética: aqui não existe ranking.</p>
          </div>
          {/* No computador, tabela (shadcn/table); no celular, lista */}
          <div className="hidden overflow-hidden rounded-cartao border border-linha bg-superficie md:block">
            <Table>
              <TableHeader><TableRow className="hover:bg-transparent">
                {['Aluno', 'Acertos', 'Habilidade com mais erro', ''].map((h) => <TableHead key={h} className="rotulo h-11 px-4">{h}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>
                {visiveis.map((o) => (
                  <TableRow key={o.nome} className="hover:bg-fundo">
                    <Celula className="font-medium">{o.nome}</Celula>
                    <Celula className="tabular-nums">{o.acertos} de 10</Celula>
                    <Celula className="text-apoio">{o.dificuldade}</Celula>
                    <Celula className="text-right"><button type="button" className="text-sm font-medium text-caramelo-texto underline-offset-4 hover:underline">Ver a prova</button></Celula>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="grid gap-1.5 md:hidden">
            {visiveis.map((o) => (
              <li key={o.nome} className="flex min-h-[60px] items-center justify-between gap-3 rounded-controle border border-linha bg-superficie px-3.5 py-2">
                <span className="min-w-0"><span className="block truncate text-[15px] font-medium text-tinta">{o.nome}</span><span className="block truncate text-sm text-sutil">Mais erro em {o.dificuldade.toLowerCase()}</span></span>
                <span className="shrink-0 text-[15px] font-semibold tabular-nums text-tinta">{o.acertos} de 10</span>
              </li>
            ))}
          </ul>
          <Button variant="discreto" size="sm" className="mt-2" onClick={() => setTodas((t) => !t)}>{todas ? 'Mostrar só 8' : `Mostrar as ${OUTRAS.length}`}</Button>
        </section>

        <NotaMockup>
          A3 (aprovação com os destaques abertos e o registro da validação). D33: lote só libera com todos os destaques abertos. D56: o registro guarda o que foi mostrado, o que foi aberto e quem confirmou.
          D46: no MVP é diagnóstico formativo, não nota. D70: "saiu da aba" entra como fato entre os destaques, e é do F6 (prova online), fora do MVP.
          Os destaques somam 4 alunos e 1 questão, por isso "as outras 28" e não as 27 do desenho. Peças: shadcn/dialog, alert-dialog, table, textarea.
        </NotaMockup>
      </div>

      {/* A barra presa embaixo, com o único botão `oficial` da tela */}
      <div className="sticky bottom-0 z-20 border-t border-linha bg-fundo">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3 md:px-8 md:pr-[152px]">
          {estado === 'revisando' ? (
            <>
              <p className="min-w-0 flex-1 basis-[220px] text-[15px] leading-snug text-apoio" aria-live="polite">
                <b className="font-semibold tabular-nums text-tinta">{nAbertos} de {DESTAQUES.length} destaques abertos.</b>{' '}
                {faltam > 0 ? `Abra ${faltam === 1 ? 'o que falta' : `os ${faltam} que faltam`} para liberar a aprovação.` : 'Tudo aberto. Pode aprovar ou rejeitar.'}
              </p>
              <Button variant="perigo" onClick={() => setRejeitando(true)}>Rejeitar…</Button>
              <Button variant="oficial" disabled={faltam > 0} onClick={() => setConfirmando(true)}>Aprovar {total} correções</Button>
            </>
          ) : estado === 'aprovado' ? (
            <LinhaAprovacao verbo="Validação registrada ·" className="text-sm" />
          ) : (
            <Estado tipo="erro" size="lg">Rejeitado · devolvido ao Assistente</Estado>
          )}
        </div>
      </div>

      {/* O destaque aberto. Fechar é o que conta como "aberto", e a hora fica no registro. */}
      <Dialog open={vendo !== null} onOpenChange={(v) => !v && fechar()}>
        <DialogContent className={cn(dialogo, 'sm:max-w-xl')}>
          {vendo && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle className="pr-6 font-corpo text-lg font-semibold text-tinta">{vendo.titulo}</DialogTitle>
                <DialogDescription className="text-[15px] text-apoio">{vendo.quem} · {vendo.resumo}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3"><CorpoDestaque id={vendo.id} gabaritoTrocado={gabaritoTrocado} aoTrocar={() => setGabaritoTrocado(true)} /></div>
              <DialogFooter className="gap-2 sm:space-x-0">
                {vendo.id === 'branco' && !foraDoLote && <Button variant="secundario" onClick={() => { setForaDoLote(true); fechar() }}>Tirar do lote: vai refazer</Button>}
                <Button variant="secundario" onClick={fechar}>{vendo.id === 'branco' ? 'Manter em branco' : vendo.fato ? 'Entendi' : 'Manter a correção'}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar mostra o que vai acontecer (regra 50, item 8) */}
      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent className={dialogo}>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="font-corpo text-lg font-semibold text-tinta">Aprovar {total} correções do 2ºB?</AlertDialogTitle>
            <AlertDialogDescription className="text-[15px] leading-relaxed text-apoio">Confira o que vai acontecer quando você confirmar.</AlertDialogDescription>
          </AlertDialogHeader>
          <dl className="rounded-controle bg-fundo px-4">
            <Par rotulo="Avaliação">Prova de estequiometria</Par>
            <Par rotulo="Turma">2ºB · Química</Par>
            <Par rotulo="Correções">{total}, com média {media}</Par>
            <Par rotulo="Chega aos alunos">O diagnóstico por habilidade, agora</Par>
            <Par rotulo="Fica registrado">Os 5 destaques abertos, quem confirmou e quando</Par>
          </dl>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel className="mt-0">Voltar para a revisão</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: 'oficial' })} onClick={() => { setEstado('aprovado'); window.scrollTo({ top: 0 }) }}>Aprovar {total} correções</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejeitar pede justificativa */}
      <Dialog open={rejeitando} onOpenChange={setRejeitando}>
        <DialogContent className={dialogo}>
          <DialogHeader className="text-left">
            <DialogTitle className="font-corpo text-lg font-semibold text-tinta">Rejeitar o lote</DialogTitle>
            <DialogDescription className="text-[15px] leading-relaxed text-apoio">Nada chega aos alunos. O Assistente recebe o motivo, refaz e avisa em "Seu time".</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="motivo" className="text-[13px] font-semibold text-apoio">Por que você está rejeitando</Label>
            <Textarea id="motivo" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: o gabarito das questões 7 e 9 está trocado." className="rounded-controle border-borda-campo bg-superficie text-[15px]" />
            <p className="text-xs text-sutil">Escreva sobre a correção, não sobre um aluno.</p>
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="secundario" onClick={() => setRejeitando(false)}>Voltar</Button>
            <Button variant="destructive" disabled={motivo.trim().length < 8} onClick={() => { setEstado('rejeitado'); setRejeitando(false); window.scrollTo({ top: 0 }) }}>Rejeitar {total} correções</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
