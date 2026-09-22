import { Link } from 'react-router-dom'
import { LogOut, Shield } from 'lucide-react'
import { Marca } from '@/components/marca/Pinta'
import { Estado, LinhaAprovacao } from '@/components/turmma/ia'
import { NotaMockup } from '@/components/turmma/tela'
import { ALUNO, ESCOLAS } from '@/dados/escola'

/* Área da família (seção 5): FASE POSTERIOR (D11). Nota, entrega e alerta, alimentados pelo motor de eventos do F13.
   Pensada primeiro para o celular: uma coluna de até 480 px. Nada que a IA produziu chega à família sem
   aprovação humana registrada (regra 70) — por isso cada item mostra quem aprovou. */

const ALERTAS = [
  { titulo: 'Entrega em atraso', texto: 'Lista de mol e massa molar, de Química. Venceu em 18/09. Ainda dá para entregar até 25/09.', por: 'Camila Souza', quando: '19/09, 9h30' },
]

const NOTAS = [
  { disciplina: 'Química', avaliacao: 'Prova de estequiometria', valor: '7,5', por: 'Camila Souza', quando: '21/09, 10h42' },
  { disciplina: 'Matemática', avaliacao: 'Avaliação de funções', valor: '8,0', por: 'Paulo Reis', quando: '16/09, 15h10' },
]

const ENTREGAS: { nome: string; disciplina: string; tipo: 'ok' | 'pendente' | 'info'; estado: string }[] = [
  { nome: 'Lista de mol e massa molar', disciplina: 'Química', tipo: 'pendente', estado: 'Em atraso' },
  { nome: 'Atividade de reagente limitante', disciplina: 'Química', tipo: 'ok', estado: 'Entregue em 17/09' },
  { nome: 'Resenha do capítulo 4', disciplina: 'Português', tipo: 'info', estado: 'Para 25/09' },
]

export function Familia() {
  return (
    <div className="min-h-svh bg-fundo">
      <div className="mx-auto w-full max-w-[480px] px-4 pb-12 pt-4">
        <header className="flex h-12 items-center"><Marca className="text-[18px]" /></header>

        <section className="mt-5">
          <h1 className="titulo-tela text-tinta">Olá, Renata.</h1>
          <p className="mt-1 text-[15px] text-sutil">Você acompanha <b className="font-semibold text-apoio">{ALUNO.nome}</b> · {ALUNO.turma} · {ESCOLAS[0].nome}</p>
        </section>

        <section aria-labelledby="f-alertas" className="mt-7">
          <h2 id="f-alertas" className="rotulo mb-2.5">Avisos da escola</h2>
          <ul className="grid gap-2.5">
            {ALERTAS.map((a) => (
              <li key={a.titulo} className="rounded-cartao border border-linha bg-superficie p-4">
                <Estado tipo="pendente">{a.titulo}</Estado>
                <p className="mt-2.5 text-base leading-snug text-tinta">{a.texto}</p>
                <LinhaAprovacao verbo="Enviado por" por={a.por} quando={a.quando} className="mt-3" />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="f-notas" className="mt-7">
          <h2 id="f-notas" className="rotulo mb-2.5">Notas</h2>
          <ul className="grid gap-2.5">
            {NOTAS.map((n) => (
              <li key={n.avaliacao} className="rounded-cartao border border-linha bg-superficie p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="min-w-0 text-base leading-snug text-tinta"><b className="font-semibold">{n.disciplina}</b><span className="block text-[15px] text-sutil">{n.avaliacao}</span></p>
                  <p className="numero-painel shrink-0 text-tinta">{n.valor}</p>
                </div>
                <LinhaAprovacao verbo="Lançada por" por={n.por} quando={n.quando} className="mt-3" />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="f-entregas" className="mt-7">
          <h2 id="f-entregas" className="rotulo mb-2.5">Entregas</h2>
          <ul className="rounded-cartao border border-linha bg-superficie px-4">
            {ENTREGAS.map((e) => (
              <li key={e.nome} className="flex min-h-[60px] items-center justify-between gap-3 border-t border-linha py-3 first:border-0">
                <p className="min-w-0 text-[15px] leading-snug text-tinta">{e.nome}<span className="block text-[13px] text-sutil">{e.disciplina}</span></p>
                <Estado tipo={e.tipo} className="shrink-0">{e.estado}</Estado>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-7 rounded-cartao bg-info-cx p-4 text-sm leading-relaxed text-info">
          Tudo que aparece aqui passou por um professor. A IA da escola prepara o trabalho, mas não lança nota e não fala com a família.
        </p>

        {/* Privacidade e Sair com o mesmo tamanho: sair nunca é mais difícil que entrar (D59). */}
        <nav aria-label="Conta" className="mt-5 grid grid-cols-2 gap-2">
          <a href="#privacidade" className="flex h-11 items-center justify-center gap-2 rounded-controle border border-borda-campo bg-superficie text-[15px] font-semibold text-tinta transition-colors duration-150 hover:bg-realce"><Shield className="size-[18px]" /> Privacidade</a>
          <Link to="/entrar" className="flex h-11 items-center justify-center gap-2 rounded-controle border border-borda-campo bg-superficie text-[15px] font-semibold text-tinta transition-colors duration-150 hover:bg-realce"><LogOut className="size-[18px]" /> Sair</Link>
        </nav>

        <NotaMockup>
          Fase posterior (D11): a área da família não está no alvo atual nem no MVP de apresentação. O motor de eventos entra no F13 e a nota oficial no F17;
          o portal e o WhatsApp vêm depois. Aplica regra 70 item 3 (nada da IA chega à família sem aprovação humana registrada), D7 e regra 60 item 11
          (o responsável vê só o próprio filho). Se o art. 24 do ECA Digital exigir conta de responsável vinculada, esta área sobe de fase — decisão em aberto.
        </NotaMockup>
      </div>
    </div>
  )
}
