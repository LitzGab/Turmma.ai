import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessageLoading } from '@/components/ui/message-loading'
import { Marca, Pinta, PintaTurma } from '@/components/marca/Pinta'
import { AssinaturaIA, AvatarAgente, ChipFonte, ChipWeb, Contador, Estado, LinhaAprovacao, SeloIA } from '@/components/turmma/ia'
import { Cartao } from '@/components/turmma/tela'
import { LISTA_AGENTES } from '@/dados/agentes'
import { TURMAS } from '@/dados/escola'
import { cn } from '@/lib/utils'

/* A prancha dos fundamentos, para ver em vez de ler — na pele nova: sistema de design do ChatGPT,
   com branco, preto e o laranja da pinta. */

const CORES: { grupo: string; itens: [string, string, string][] }[] = [
  { grupo: 'Branco — as superfícies', itens: [
    ['fundo · superficie', '#FFFFFF', 'Fundo do app, cartão, caixa de pedido, campo'], ['lateral', '#F9F9F9', 'Fundo da lateral'],
    ['realce-suave · creme', '#F4F4F4', 'Hover, bolha de quem escreve, aviso permanente'], ['realce', '#ECECEC', 'Item selecionado da lateral'],
    ['linha', '#E8E8E8', 'Divisor e borda de cartão (preto a 10%)'], ['borda-campo', '#D9D9D9', 'Borda de campo e de botão secundário (preto a 15%)'],
  ] },
  { grupo: 'Preto — o texto e a decisão', itens: [
    ['tinta · noite', '#0D0D0D', 'Texto principal e o botão oficial'], ['apoio', '#424242', 'Texto de apoio'],
    ['sutil', '#5D5D5D', 'Metadado, placeholder, rótulo de grupo'], ['inativo', '#8F8F8F', 'Controle desabilitado, ícone apagado'],
  ] },
  { grupo: 'Laranja — a única cor, a da pinta', itens: [
    ['caramelo', '#E8732E', 'A pinta, o botão primário e o enviar — com texto preto em cima'], ['caramelo-claro', '#EE8747', 'Hover do primário'],
    ['caramelo-fundo', '#D4651F', 'Pressionado'], ['caramelo-texto', '#B4520F', 'Laranja como texto, quando precisa'],
    ['pendente-cx', '#FDF0E8', '"Esperando você": a pendência é laranja'],
  ] },
]

const TIPOS: [string, string, string][] = [
  ['Pergunta da Home', 'Sistema 400 · clamp(24, 3vw, 28) / 1,25', 'saudacao'],
  ['Título de tela', 'Sistema 600 · 22 / 1,25', 'titulo-tela'],
  ['Título de cartão', 'Sistema 600 · 16 / 1,35', 'text-base font-semibold leading-snug'],
  ['Número de painel', 'Sistema 600 · 28 / 1 · tabular', 'numero-painel'],
  ['Corpo', 'Sistema 400 · 16 / 1,5', 'text-base'],
  ['Interface', 'Sistema 400–500 · 14 / 1,45', 'text-sm'],
  ['Rótulo de grupo', 'Sistema 500 · 13 · cinza, sem caixa-alta', 'rotulo'],
]

function Secao({ n, titulo, apoio, children }: { n: string; titulo: string; apoio?: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <p className="rotulo">{n}</p>
      <h2 className="mt-1.5 text-[22px] font-semibold leading-tight tracking-[-0.015em] text-tinta">{titulo}</h2>
      {apoio && <p className="mb-5 mt-1.5 max-w-[72ch] text-[15px] text-sutil">{apoio}</p>}
      <div className={apoio ? '' : 'mt-5'}>{children}</div>
    </section>
  )
}

export function Fundamentos() {
  const [rodada, setRodada] = useState(0)
  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-8 md:px-8 md:pt-12">
      <Link to="/" className="inline-flex h-9 items-center gap-1.5 rounded-linha pr-2 text-sm font-medium text-apoio hover:text-tinta"><ArrowLeft className="size-4" /> Mapa das telas</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(28px,3.6vw,36px)] font-semibold leading-[1.1] tracking-[-0.02em] text-tinta">Fundamentos visuais</h1>
          <p className="mt-3 max-w-[64ch] text-[17px] text-sutil">O sistema de design do ChatGPT, com três cores e mais nenhuma: branco, preto e o laranja da pinta. As peças continuam vindo do 21st.dev.</p>
        </div>
        <Marca className="text-[26px]" />
      </div>

      <Secao n="9.1" titulo="Cor" apoio="Medido no tema claro do ChatGPT. O preto fica com o texto e com a decisão oficial; o laranja aparece pouco — a pinta, a ação primária, o enviar e o que está esperando você.">
        <div className="grid gap-8">
          {CORES.map((g) => (
            <div key={g.grupo}>
              <p className="rotulo mb-3">{g.grupo}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {g.itens.map(([nome, hex, uso]) => (
                  <div key={nome} className="overflow-hidden rounded-cartao border border-linha bg-superficie">
                    <div className="h-16 border-b border-linha" style={{ background: hex }} />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-tinta">{nome}</p>
                      <p className="text-xs tabular-nums text-sutil">{hex}</p>
                      <p className="mt-1 text-xs leading-snug text-apoio">{uso}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="rotulo mb-3">Estado — cada família é um fundo e um texto, e nunca é só cor</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Estado tipo="pendente" size="lg">Esperando você</Estado>
              <Estado tipo="ok" size="lg">Aprovado</Estado>
              <Estado tipo="erro" size="lg">Rejeitado</Estado>
              <Estado tipo="info" size="lg">Seu professor acompanha</Estado>
              <SeloIA />
              <ChipFonte pagina={142} />
              <ChipWeb dominio="ibge.gov.br" />
              <Contador n={3} />
            </div>
          </div>
        </div>
      </Secao>

      <Secao n="9.2" titulo="Tipografia" apoio="A fonte do ChatGPT é a do próprio sistema: SF Pro no Mac, Segoe UI no Windows. Zero KB de fonte para baixar. A Fustat fica só no logotipo.">
        <div className="divide-y divide-linha rounded-cartao border border-linha bg-superficie">
          {TIPOS.map(([papel, medida, classe]) => (
            <div key={papel} className="grid items-baseline gap-x-6 gap-y-1 p-4 md:grid-cols-[220px_1fr]">
              <div><p className="text-sm font-semibold text-tinta">{papel}</p><p className="text-xs text-sutil">{medida}</p></div>
              <p className={cn('text-tinta', classe)}>{papel === 'Número de painel' ? '412 · 6,4 · 61%' : 'O que vamos preparar hoje?'}</p>
            </div>
          ))}
        </div>
      </Secao>

      <Secao n="9.3" titulo="Forma e elevação" apoio="Linha fina e quase nenhuma sombra. Botão é pílula; a caixa de pedido tem canto de 28 px e a sombra suave do ChatGPT.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[['10 px', 'item de menu', 'rounded-linha'], ['12 px', 'campo', 'rounded-controle'], ['16 px', 'cartão, menu, diálogo', 'rounded-cartao'], ['28 px', 'caixa de pedido', 'rounded-caixa']].map(([px, uso, c]) => (
            <div key={px} className={cn('grid h-28 content-end border border-borda-campo bg-superficie p-3', c)}>
              <p className="text-sm font-semibold text-tinta">{px}</p><p className="text-xs leading-snug text-sutil">{uso}</p>
            </div>
          ))}
          <div className="grid h-28 content-end rounded-cartao bg-superficie p-3 shadow-flutua">
            <p className="text-sm font-semibold text-tinta">Flutua</p><p className="text-xs leading-snug text-sutil">menu, dica, diálogo, aviso</p>
          </div>
        </div>
      </Secao>

      <Secao n="11.1" titulo="Botões" apoio="Cinco variantes, todas em pílula. No máximo um primário (laranja) por tela; o oficial é o único preto cheio, de propósito — é o que combate o clique reflexo.">
        <div className="grid gap-3 md:grid-cols-5">
          {([['primario', 'Gerar prova', 'A ação da tela'], ['oficial', 'Aprovar lote', 'Só decisão oficial'], ['secundario', 'Só conversar', 'A alternativa'], ['discreto', 'Copiar', 'Ação de linha'], ['perigo', 'Rejeitar…', 'Rejeitar, excluir, revogar']] as const).map(([v, texto, uso]) => (
            <Cartao key={v} className="grid gap-3">
              <p className="rotulo">{v}</p>
              <Button variant={v} className="w-full">{texto}</Button>
              <Button variant={v} className="w-full" disabled>Inativo</Button>
              <p className="text-xs text-sutil">{uso}</p>
            </Cartao>
          ))}
        </div>
      </Secao>

      <Secao n="9.7" titulo="Os agentes: um por pessoa da escola" apoio="Identidade de função, nunca de pessoa: sem rosto, sem foto, sem nome próprio. Quem conversa tem cor cheia — o Assistente em preto, o Tutor no laranja; quem trabalha nos bastidores é um círculo cinza com o ícone da função.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LISTA_AGENTES.map((a) => (
            <Cartao key={a.id} className="grid gap-3">
              <div className="flex items-end gap-3">
                <AvatarAgente id={a.id} tamanho={48} /><AvatarAgente id={a.id} tamanho={32} /><AvatarAgente id={a.id} tamanho={24} />
                <span className="ml-auto text-xs tabular-nums text-sutil">{a.ladrilho}</span>
              </div>
              <div>
                <p className="text-base font-semibold leading-snug text-tinta">{a.nome}</p>
                <p className="text-sm text-sutil">Para: {a.paraQuem.toLowerCase()} · {a.autonomia}</p>
              </div>
            </Cartao>
          ))}
        </div>
      </Secao>

      <Secao n="11.3" titulo="A IA sempre assina" apoio="Avatar do agente, nome da função, selo IA, a fonte com página e, depois de aprovada, quem aprovou. Nunca um texto solto na tela.">
        <Cartao className="grid gap-3">
          <AssinaturaIA id="assistente" />
          <p className="text-base leading-[1.6] text-tinta">A proporção entre reagentes e produtos vem dos coeficientes da equação balanceada <ChipFonte pagina={142} />. Segundo dado de fora, a produção nacional cresceu no período <ChipWeb dominio="ibge.gov.br" />.</p>
          <LinhaAprovacao className="w-fit" />
        </Cartao>
      </Secao>

      <Secao n="9.6" titulo="A marca na interface" apoio="A pinta não gira, não estica e não vira indicador de carregamento. Cada turma tem a pinta dela.">
        <div className="flex flex-wrap items-center gap-5">
          <Pinta className="h-12 w-12 text-caramelo" rotulo="Pinta Turmma" />
          <img src="/marca/turmma-icone.svg" alt="Ícone do aplicativo" className="h-12 w-12" />
          <span className="h-10 w-px bg-linha" />
          {TURMAS.map((t) => (
            <span key={t.id} className="flex items-center gap-2 text-sm font-medium text-tinta"><PintaTurma turma={t.nome} className="h-9 w-9" /> {t.nome}</span>
          ))}
        </div>
      </Secao>

      <Secao n="9.5" titulo="Movimento" apoio="Quase nenhum, como no ChatGPT: uma entrada curta de opacidade e os três pontos de quem está trabalhando. Na área do aluno, nem isso.">
        <div className="grid gap-3 md:grid-cols-3">
          <Cartao titulo="Estado · 150 ms"><Button variant="secundario">Passe o mouse e pressione</Button></Cartao>
          <Cartao titulo="Entrada · 420 ms" acao={<Button variant="discreto" size="sm" onClick={() => setRodada((r) => r + 1)}><RotateCw /> Repetir</Button>}>
            <p key={rodada} className="saudacao animate-entra text-tinta">Bom dia, Camila.</p>
          </Cartao>
          <Cartao titulo="Trabalho acontecendo"><span className="inline-flex h-10 items-center text-sutil"><MessageLoading /></span></Cartao>
        </div>
      </Secao>
    </main>
  )
}
