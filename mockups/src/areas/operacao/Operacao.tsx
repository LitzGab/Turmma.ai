import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Ban, KeyRound, Lock, LogOut, Gauge, Plus, RotateCcw, Send, CalendarDays } from 'lucide-react'
import { Aviso, BarraApp, Botao, BotaoIcone, CabecalhoPagina, DialogoConfirmar, MenuMais, type ItemMenuMais } from '@/components/duo'
import { useParametro } from '@/components/turmma/tela'
import { operacao, useEscolasDaOperacao, useRedes, type EscolaDaOperacao, type Rede } from '@/dados/rede'
import { tetoPadrao } from './_dados'
import { DialogoConvite, DialogoNovaEscola, DialogoRevogar, DialogoTeto } from './_dialogos'
import { AbaEscolas, type AcaoDeConvite } from './_escolas'
import { AbaUso } from './_uso'

/* A OPERAÇÃO TURMMA (/operacao), 12ª rodada na pele Duolingo (plano 5.5). A equipe Turmma cria a escola (e a rede),
   convida a primeira coordenação e acompanha o uso e o custo por escola. Não vê dado de pessoa: por isso o convite
   pede SÓ o e-mail (D76; regra 10, item 8). As escolas e as redes vêm de `dados/rede.ts`, a mesma fonte que a
   secretaria lê: a escola criada aqui aparece na /rede como "Convite enviado" assim que o convite sai.
   14ª rodada (plano ux-composicao, 1.6 e 5.2): a barra de topo própria fica; o corpo é uma página Painel (até 1200 px)
   com o cabeçalho de sempre: título "Operação", o aviso de privacidade como linha de apoio, NOVA ESCOLA à direita (o
   único botão cheio) e as abas Escolas · Uso. REVOGAR mora no ⋯ da escola. No escuro, tudo por token. */

type Aberto =
  | { tipo: 'escola'; redeId?: string }
  | { tipo: 'convite'; escola: EscolaDaOperacao; refazer: boolean }
  | { tipo: 'secretaria'; rede: Rede }
  | { tipo: 'revogar'; escola: EscolaDaOperacao }
  | { tipo: 'segundo-fator'; escola: EscolaDaOperacao }
  | { tipo: 'teto'; id: string; de: string; valor: number }

/** Um link de convite da secretaria (o produto guarda só o resumo do token). */
function tokenNovo() {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const b = new Uint8Array(22)
  try { crypto.getRandomValues(b) } catch { for (let i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256) }
  return Array.from(b, (x) => alfabeto[x % alfabeto.length]).join('')
}

export function Operacao() {
  const navegar = useNavigate()
  const [abaUrl, setAba] = useParametro('aba')
  const aba = abaUrl === 'uso' ? 'uso' : 'escolas'
  const escolas = useEscolasDaOperacao()
  const redes = useRedes()
  const [aberto, setAberto] = useState<Aberto | null>(null)
  const [anuncio, setAnuncio] = useState<string | null>(null)
  /** a escola recém-criada (pelo link): a tabela rola até ela e o aviso traz o próximo passo */
  const [criada, setCriada] = useState<string | null>(null)
  const escolaCriada = criada ? escolas.find((e) => e.slug === criada && e.coordenacao === 'sem convite') : undefined
  /** os tetos mexidos nesta visita (escola ou rede → reais por mês) */
  const [tetos, setTetos] = useState<Record<string, number>>({})
  const fechar = () => setAberto(null)

  // ?nova=1 (o fim da introdução, "Criar uma escola"): abre a janela Nova escola e tira o parâmetro da barra
  const [params, setParams] = useSearchParams()
  const novaNaBarra = params.get('nova') === '1'
  const [novaAberta, setNovaAberta] = useState(false)
  if (novaNaBarra !== novaAberta) {
    setNovaAberta(novaNaBarra)
    if (novaNaBarra) setAberto({ tipo: 'escola' })
  }
  useEffect(() => {
    if (novaNaBarra) setParams((atual) => { const p = new URLSearchParams(atual); p.delete('nova'); return p }, { replace: true })
  }, [novaNaBarra, setParams])

  const aoConvite = (acao: AcaoDeConvite, escola: EscolaDaOperacao) =>
    setAberto(acao === 'revogar' ? { tipo: 'revogar', escola } : { tipo: 'convite', escola, refazer: acao === 'refazer' })

  const tetoDaEscola = (id: string) => tetos[id] ?? tetoPadrao(id)
  const tetoDaRede = (r: Rede) => tetos[r.id] ?? escolas.filter((e) => e.redeId === r.id).reduce((s, e) => s + tetoDaEscola(e.id), 0)

  const menuDaRede = (r: Rede): ItemMenuMais[] => [
    ...(r.tipo !== 'Particular' ? [{ rotulo: 'Convidar a secretaria', icone: <Send />, aoEscolher: () => setAberto({ tipo: 'secretaria', rede: r }) }] : []),
    { rotulo: 'Teto da rede', icone: <Gauge />, aoEscolher: () => setAberto({ tipo: 'teto', id: r.id, de: r.nome, valor: tetoDaRede(r) }) },
  ]
  const menuDaEscola = (e: EscolaDaOperacao): ItemMenuMais[] => [
    // o raro mora no ⋯ (14ª rodada): revogar um convite em aberto não fica mais solto na linha
    ...(e.coordenacao === 'convite em aberto'
      ? [{ rotulo: 'Revogar o convite', icone: <Ban />, perigo: true, aoEscolher: () => aoConvite('revogar', e) }]
      : []),
    { rotulo: 'Redefinir o segundo fator', icone: <KeyRound />, desligado: e.coordenacao !== 'ativa', aoEscolher: () => setAberto({ tipo: 'segundo-fator', escola: e }) },
    { rotulo: 'Teto de IA', icone: <Gauge />, aoEscolher: () => setAberto({ tipo: 'teto', id: e.id, de: e.nome, valor: tetoDaEscola(e.id) }) },
    { rotulo: `Criada em ${e.criadaEm}`, icone: <CalendarDays />, desligado: true, aoEscolher: () => {} },
  ]

  return (
    <div className="flex h-svh min-h-0 flex-col bg-white text-tinta">
      <BarraApp
        contexto={<span className="min-w-0 truncate text-[17px] font-bold">Equipe Turmma</span>}
        acoes={
          <MenuMais rotulo="Sua conta" itens={[
            { rotulo: 'Rever a introdução', icone: <RotateCcw />, aoEscolher: () => navegar('/operacao/bem-vindo?rever=1') },
            { rotulo: 'Sair', icone: <LogOut />, aoEscolher: () => navegar('/entrar') },
          ]}
            gatilho={
              <button type="button" aria-label="Sua conta"
                className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-anil-borda bg-anil-claro text-[15px] font-bold text-anil-texto transition-[filter] duration-150 hover:brightness-95 data-[state=open]:border-azul-borda">
                OT
              </button>
            } />
        }
      />

      {/* Painel: até 1200 px, margem de 32, do topo; o cabeçalho de página com a linha de apoio e as abas */}
      <div className="flex min-h-0 flex-1 flex-col px-4 md:px-8">
        <div className="mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 flex-col pb-4 pt-4 md:pb-6 md:pt-6">
          <CabecalhoPagina titulo="Operação"
            linha={(
              <span className="flex items-start gap-2">
                <Lock aria-hidden className="mt-px size-[18px] shrink-0 text-sutil" strokeWidth={2.5} />
                A operação não vê dado de aluno nem de professor: nem nome, nem nota, nem conversa.
              </span>
            )}
            acoes={<Botao className="max-sm:hidden" icone={<Plus strokeWidth={3} />} onClick={() => setAberto({ tipo: 'escola' })}>Nova escola</Botao>}
            abas={{ abas: [{ id: 'escolas', rotulo: 'Escolas' }, { id: 'uso', rotulo: 'Uso' }], valor: aba, aoMudar: (id) => setAba(id === 'escolas' ? null : id) }} />

          {anuncio && (
            <Aviso tom="certo" titulo={anuncio} className="mt-4"
              acao={(
                <span className="flex items-center gap-2">
                  {escolaCriada && anuncio === `${escolaCriada.nome} criada.` && (
                    <Botao tamanho="p" variante="secundario" onClick={() => aoConvite('convidar', escolaCriada)}>Convidar coordenação</Botao>
                  )}
                  <BotaoIcone rotulo="Fechar aviso" onClick={() => { setAnuncio(null); setCriada(null) }}><span aria-hidden className="text-[20px] leading-none">×</span></BotaoIcone>
                </span>
              )} />
          )}

          <div role="tabpanel" className="mt-4 flex min-h-0 flex-1 flex-col">
            {aba === 'escolas'
              ? <AbaEscolas redes={redes} escolas={escolas} destaque={criada ?? undefined} aoNovaEscola={(redeId) => setAberto({ tipo: 'escola', redeId })}
                  aoConvite={aoConvite} menuDaRede={menuDaRede} menuDaEscola={menuDaEscola} />
              : <AbaUso escolas={escolas} tetos={tetos} />}
          </div>
        </div>
      </div>

      {aberto?.tipo === 'escola' && (
        <DialogoNovaEscola redes={redes} redeInicial={aberto.redeId} linksUsados={escolas.map((e) => e.slug)} aoFechar={fechar}
          aoCriar={(n) => {
            operacao.criarEscola({ nome: n.nome, slug: n.slug, cidade: n.cidade, redeId: n.redeId, novaRede: n.novaRede })
            fechar()
            setAnuncio(`${n.nome} criada.`)
            setCriada(n.slug)
          }} />
      )}
      {aberto?.tipo === 'convite' && (
        <DialogoConvite titulo="Convidar coordenação" para={aberto.escola.nome} refazer={aberto.refazer} aoFechar={fechar}
          gerar={(email) => (aberto.refazer ? operacao.refazerConvite(aberto.escola.id) : operacao.convidarCoordenacao(aberto.escola.id, email))} />
      )}
      {aberto?.tipo === 'secretaria' && (
        <DialogoConvite titulo="Convidar a secretaria" para={aberto.rede.nome} aoFechar={fechar}
          gerar={() => ({ link: `/convite?papel=rede#${tokenNovo()}`, ate: '28/09' })} />
      )}
      {aberto?.tipo === 'revogar' && (
        <DialogoRevogar escola={aberto.escola} aoFechar={fechar} aoConfirmar={() => {
          /* As escolas de sempre (a Figueira) vêm com o convite marcado na lista fixa, sem registro no estado:
             `revogarConvite` só revoga o que está registrado. Registra antes (um convite que ninguém viu) e revoga. */
          if (!aberto.escola.criada) operacao.convidarCoordenacao(aberto.escola.id, '')
          operacao.revogarConvite(aberto.escola.id)
          setAnuncio(`Convite da ${aberto.escola.nome} revogado.`)
        }} />
      )}
      {aberto?.tipo === 'segundo-fator' && (
        <DialogoConfirmar aberto aoMudar={(v) => { if (!v) fechar() }} titulo="Redefinir o segundo fator?"
          frase={`A coordenação da ${aberto.escola.nome} configura de novo no próximo acesso. A senha não muda.`}
          confirmar={{ rotulo: 'Redefinir', aoConfirmar: () => setAnuncio(`Segundo fator da ${aberto.escola.nome} redefinido.`) }} />
      )}
      {aberto?.tipo === 'teto' && (
        <DialogoTeto de={aberto.de} valorInicial={aberto.valor} aoFechar={fechar}
          aoSalvar={(v) => { setTetos((t) => ({ ...t, [aberto.id]: v })); setAnuncio(`Teto de ${aberto.de} salvo.`) }} />
      )}
    </div>
  )
}
