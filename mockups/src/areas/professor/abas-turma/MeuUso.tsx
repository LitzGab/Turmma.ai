import { CheckCheck, ShieldCheck, Sparkles, Undo2, Users } from 'lucide-react'
import { LinhaBarra, MetricaT, ValorT } from '@/components/turmma/painel'
import { BotaoT, CartaoT, tipo, VazioT } from '@/components/turmma/teachy'

/* "MEU USO" — o espelho do próprio professor (D45, D64): o que ele gerou, o que usou com turma, o que aprovou, e
   quem abriu o dado dele com nome. É do professor e não de uma turma, então mora na LISTA de turmas: o botão "Meu uso"
   troca a grade de cartões por este conteúdo, com "‹ Turmas" para voltar (Turmas.tsx).
   OITAVA RODADA (20/09/2026, "ctrl c e ctrl v da Teachy"): o conteúdo é o mesmo; a pele passou a ser a da área — os
   quatro números nos cartões de métrica de 112 px (os mesmos da Visão Geral), os dois blocos em cartão de canto 12 com
   título em Quicksand, o botão de canto 8. Saíram a faixa de números de contorno único e o botão em pílula.
   É um bloco de altura natural: quem rola é a área da lista. */

const MAIS_USADO = [['Prova', 5], ['Atividade e lista', 4], ['Plano de aula', 3], ['Adaptação', 2]] as const

export function MeuUso() {
  return (
    <div className="grid gap-4">
      <CartaoT className="flex items-start gap-3">
        <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-caramelo" strokeWidth={2} />
        <p className="min-w-0 text-pretty text-[14px] leading-6 text-apoio">
          <b className="font-teachy font-bold text-tinta">Este painel é seu primeiro.</b> A coordenação vê o uso de IA por série e disciplina, somado ao de outros professores. Para ver o seu nome,
          ela precisa abrir com registro em auditoria, e o registro aparece aqui embaixo. Suas conversas com o Assistente ela nunca vê.
          Não usar a ferramenta não gera indicador, alerta nem meta.
        </p>
      </CartaoT>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricaT icone={Sparkles} rotulo="Gerados em setembro"><ValorT valor="14" linhas={['provas, atividades', 'e planos']} /></MetricaT>
        <MetricaT icone={Users} rotulo="Usados com turma"><ValorT valor="11" linhas={['de 14', 'atribuídos ou exportados']} /></MetricaT>
        <MetricaT icone={CheckCheck} rotulo="Entregas aprovadas"><ValorT valor="9" linhas={['correções e', 'versões adaptadas']} /></MetricaT>
        <MetricaT icone={Undo2} rotulo="Entregas rejeitadas"><ValorT valor="1" linhas={['gabarito trocado', 'em 10/09']} /></MetricaT>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <CartaoT>
          <h2 className={tipo.aba}>O que você mais usou</h2>
          <p className={tipo.apoio}>Artefatos gerados por ferramenta, em setembro</p>
          <ul className="mt-2 divide-y divide-linha">
            {MAIS_USADO.map(([n, v]) => <LinhaBarra key={n} nome={n} valor={v} sufixo="" proporcao={(v / 5) * 100} />)}
          </ul>
        </CartaoT>

        <CartaoT className="flex flex-col">
          <h2 className={tipo.aba}>Quem abriu seu dado com nome</h2>
          <p className={tipo.apoio}>Toda abertura nominal fica registrada, e você vê aqui</p>
          <VazioT tracejado className="mt-4 flex-1 justify-center py-6" titulo="Ninguém abriu em 2026" texto="Quando a coordenação abrir um indicador com o seu nome, aparece aqui: quem, quando e por quê." />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 flex-1 basis-[220px] text-[12px] leading-4 text-sutil">Achou que um número não representa seu trabalho? Você pode pedir revisão.</p>
            <BotaoT variante="contorno" tamanho="m">Pedir revisão de um indicador</BotaoT>
          </div>
        </CartaoT>
      </div>
    </div>
  )
}
