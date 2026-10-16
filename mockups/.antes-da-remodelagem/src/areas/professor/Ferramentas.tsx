import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PeleTeachy } from '@/components/turmma/teachy'
import { NotaMockup, Tela } from '@/components/turmma/tela'
import { cn } from '@/lib/utils'
import { abaGatilho, abasLista } from './_pecas'
import { useBiblioteca } from './Biblioteca'
import { useCatalogo } from './Catalogo'

/* FERRAMENTAS: a casca das duas abas. Quem desenha cada uma é `Catalogo.tsx` e `Biblioteca.tsx`.

   OITAVA RODADA (20/09/2026) — a aba "Ferramentas" é CÓPIA do modal "Criar mais com IA" da Teachy (o Gabriel, vendo a
   sétima: "eu quero um ctrl c e ctrl v da Teachy"). Aqui é página, não modal: o QUADRO ocupa a área útil inteira, sem
   a `Tela` e sem margem — CABEÇALHO de 88 px (respiro 24 × 32, vão 8, fio de 2 px embaixo) com o título, a busca
   enorme e, no fim, onde a Teachy tem o X, o seletor [Ferramentas | Biblioteca]; embaixo o CORPO, com a lista de
   256 px e o conteúdo, que rola POR DENTRO (a página não rola). Saiu da sétima rodada a linha única de 36 px com as
   abas à esquerda e a busca ao lado, e a página sem título.
   O quadro é um contêiner (`@container`): quando ele tem menos de 720 px (celular, ou janela pequena com a lateral
   aberta) o cabeçalho quebra — o seletor em cima, no mesmo lugar em que fica na Biblioteca, depois o título e a busca
   embaixo — e a lista de categorias vira uma fileira que rola de lado.
   A aba "Biblioteca" NÃO mudou: continua na `Tela`, com a linha de controles de 36 px (as abas e a barra do
   `useBiblioteca`) e a grade de miniaturas. `?aba=biblioteca` continua valendo (Artefato.tsx volta por ele); a
   categoria escolhida no catálogo mora em `?cat=`. */

export function Ferramentas() {
  const [params, setParams] = useSearchParams()
  const aba = params.get('aba') === 'biblioteca' ? 'biblioteca' : 'ferramentas'
  const catalogo = useCatalogo()
  const biblioteca = useBiblioteca()

  const seletor = (className?: string) => (
    <TabsList className={cn(abasLista, className)}>
      <TabsTrigger value="ferramentas" className={abaGatilho}>Ferramentas</TabsTrigger>
      <TabsTrigger value="biblioteca" className={abaGatilho}>Biblioteca</TabsTrigger>
    </TabsList>
  )

  return (
    <Tabs value={aba} onValueChange={(v) => setParams(v === 'biblioteca' ? { aba: 'biblioteca' } : {}, { replace: true })}>
      {aba === 'ferramentas' ? (
        <PeleTeachy className="@container flex h-[calc(100svh-56px)] min-h-0 flex-col bg-superficie md:h-svh">
          <header className="flex shrink-0 flex-wrap items-center gap-2 border-b-2 border-linha px-4 py-3 @min-[720px]:h-[88px] @min-[720px]:flex-nowrap @min-[720px]:px-8 @min-[720px]:py-0">
            {catalogo.titulo}
            {catalogo.busca}
            {seletor('order-first shrink-0 @min-[720px]:order-none')}
          </header>
          <TabsContent value="ferramentas" className="mt-0 flex min-h-0 flex-1 flex-col @min-[720px]:flex-row">{catalogo.corpo}</TabsContent>
        </PeleTeachy>
      ) : (
        <Tela titulo="Ferramentas" acoes={<>{seletor()}{biblioteca.barra}</>}>
          <TabsContent value="biblioteca" className="mt-0">{biblioteca.conteudo}</TabsContent>
        </Tela>
      )}
      <NotaMockup>
        F7. No roteiro estão prova, atividade e lista, plano de aula e sequência, Adaptação, material didático, apresentação, simulado ENEM, correção de
        objetiva e redação e discursiva (D67). As OITO novas — planejamento do período, projeto, plano de recuperação, mapa mental, roteiro de
        experimento, avaliação diagnóstica, proposta de redação e importar prova — são proposta do mockup: P22 em docs/pendencias-dos-mockups.md.
        A Biblioteca ficou como aba daqui porque a lateral do professor é decidida e não tem esse item.
      </NotaMockup>
    </Tabs>
  )
}
