import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge-2'
import { Marca } from '@/components/marca/Pinta'

/* O mapa das telas. Não é tela do produto: é o índice de quem está revisando ou apresentando os mockups.
   Dois roteiros no alto, na ordem em que se demonstra: a escola do zero ao primeiro aluno (o caminho que o produto
   real já faz, 04/10/2026) e a IA supervisionada em sala. Nos roteiros a etiqueta diz QUEM faz o passo; nos blocos
   de baixo, onde a tela entra no planejamento. */

type Linha = { para: string; nome: string; oque: string; onde: string }
type Bloco = { titulo: string; apoio: string; linhas: Linha[] }

const ROTEIRO_ESCOLA: Linha[] = [
  { para: '/operacao', nome: '1 · A Turmma cria a rede e a escola', oque: 'Prefeitura ou colégio, a escola com endereço próprio e o convite da primeira coordenadora. A operação não vê dado de pessoa', onde: 'Turmma' },
  { para: '/coordenacao/estrutura', nome: '2 · A coordenação monta a escola', oque: 'O roteiro em sete passos: ano letivo, séries, disciplinas, turmas, listas, professores e alocação', onde: 'Coordenação' },
  { para: '/coordenacao/estrutura/turmas/au-3a', nome: '3 · Sobe a lista de nomes do 3ºA', oque: 'Cola ou envia o CSV com nome e matrícula; a prévia aponta o CPF e a matrícula repetida antes de gravar', onde: 'Coordenação' },
  { para: '/coordenacao/professores', nome: '4 · Cadastra o professor e copia o convite', oque: 'Nome e e-mail; o link aparece uma vez, vale sete dias e entra uma vez só', onde: 'Coordenação' },
  { para: '/convite#t9KQ2xLmP4aR', nome: '5 · O professor aceita o convite', oque: 'Cria a senha; quem já tem conta em outra escola só aceita', onde: 'Professor' },
  { para: '/professor/turmas', nome: '6 · Confirma ou contesta as turmas', oque: 'A turma só abre depois que ele confirma; o motivo da contestação volta para a coordenação', onde: 'Professor' },
  { para: '/professor/turmas/2b?aba=alunos', nome: '7 · Gera o acesso da turma', oque: '“Adicionar”: link e código com validade, projetar na sala, WhatsApp sem nome de aluno, gerar novo e revogar', onde: 'Professor' },
  { para: '/e/colegio-aurora/turma', nome: '8 · O aluno pede o próprio nome', oque: 'Código K7M2 QX9B; escolhe o nome entre os livres (Giovana Teles, matrícula 2026-0444) e cria a senha. Sem e-mail, CPF nem foto', onde: 'Aluno' },
  { para: '/professor/turmas/2b?aba=alunos', nome: '9 · Uma pessoa aprova', oque: 'O professor marca os pedidos que conferiu; não existe “aprovar todos”. A coordenação também decide, com auditoria', onde: 'Professor' },
  { para: '/e/colegio-aurora', nome: '10 · O aluno entra na escola', oque: 'Escola + matrícula + senha, ou a conta Google ou Microsoft da escola', onde: 'Aluno' },
]

const ROTEIRO: Linha[] = [
  { para: '/entrar', nome: '0 · Os três papéis entram', oque: 'Entrada dividida, sem "Cadastre-se"; a coordenação passa pelo segundo fator', onde: 'A1' },
  { para: '/coordenacao/estrutura', nome: '1 · Coordenação mostra a escola montada', oque: 'Estrutura e Material com licença ingerido', onde: 'A1 · A2' },
  { para: '/professor', nome: '2 · Professora pede uma prova', oque: 'Home → o chat pergunta → cartão da ferramenta → página citada → versão adaptada → aprova', onde: 'A2' },
  { para: '/professor/time/assistente', nome: '2 · O Assistente abriu o dia', oque: 'Seu time nunca aparece vazio', onde: 'A2' },
  { para: '/aluno/atividades/estequiometria', nome: '3 · Aluno responde a atividade', oque: 'Objetiva no navegador, resposta salva a cada questão', onde: 'A3' },
  { para: '/aluno', nome: '3 · Aluno abre o Tutor', oque: 'Tenta arrancar a resposta; o Tutor recusa, conduz, cita a página e lembra do que ele errou', onde: 'A4' },
  { para: '/professor/time/tutor', nome: '4 · O Tutor avisa que oito travaram', oque: 'Sinal, não conversa; a correção espera', onde: 'A4' },
  { para: '/professor/aprovar', nome: '4 · Abre os destaques e aprova', oque: 'O botão oficial só libera com os destaques abertos; fica o registro da validação', onde: 'A3' },
  { para: '/professor/turmas/2b?aba=sala', nome: '4 · Vê cada aluno na sala', oque: 'Minhas turmas · 2ºB · a aba Sala', onde: 'A3' },
  { para: '/coordenacao', nome: '5 · Coordenação abre a governança', oque: 'O que a IA gerou e quem aprovou, os agentes, o consumo e o resumo do Analista', onde: 'A5' },
]

const BLOCOS: Bloco[] = [
  { titulo: 'Entrada e fundamentos', apoio: 'A porta e a prancha de design', linhas: [
    { para: '/entrar', nome: 'Entrar', oque: 'Aluno pela conta da escola ou matrícula; professor e coordenação por convite', onde: 'A1' },
    { para: '/entrar/verificacao', nome: 'Segundo fator', oque: 'MFA obrigatório da coordenação', onde: 'A1' },
    { para: '/e/colegio-aurora', nome: 'Entrada da escola', oque: 'O endereço da escola: matrícula e senha, ou a conta da escola; e o caminho da primeira vez', onde: 'A1' },
    { para: '/e/colegio-aurora/turma', nome: 'Página da turma', oque: 'O aluno digita o código, escolhe o nome livre, informa a matrícula e cria a senha; o pedido espera uma pessoa', onde: 'A1' },
    { para: '/convite#t9KQ2xLmP4aR', nome: 'Convite do professor', oque: 'Aceitar e criar a senha; o link inválido diz a quem pedir', onde: 'A1' },
    { para: '/fundamentos', nome: 'Fundamentos visuais', oque: 'Branco, preto e laranja; a fonte do sistema; botões em pílula; os agentes; o selo de IA', onde: 'Design' },
  ] },
  { titulo: 'Professor', apoio: 'Home é o chat com o Assistente de ensino', linhas: [
    { para: '/professor', nome: 'Home · Nova conversa', oque: 'Uma pergunta centralizada, a caixa de pedido, a linha do dia e "Esperando você" logo abaixo', onde: 'A2' },
    { para: '/professor/conversa', nome: 'Conversa', oque: 'A pergunta da D18, cartão de ferramenta, resposta com página citada, fontes, Adaptação por tipo', onde: 'A2' },
    { para: '/professor/ferramentas', nome: 'Ferramentas e Biblioteca', oque: 'Catálogo de 17 no desenho da Teachy (busca larga, favoritas, cartões com estrela) e a Biblioteca com a miniatura do documento real', onde: 'A2 · F7' },
    { para: '/professor/ferramentas/plano', nome: 'Ferramenta pelo motor (Plano de aula)', oque: 'O formulário em grupos (para quem, o quê, como, mais opções), conferido contra a Teachy, com "como vai sair" ao lado', onde: 'A2' },
    { para: '/professor/ferramentas/prova', nome: 'Ferramenta Prova', oque: 'O mesmo formulário do cartão da conversa', onde: 'A2' },
    { para: '/professor/ferramentas/adaptacao', nome: 'Ferramenta Adaptação', oque: 'Lista fechada de tipos; nenhum campo em que caiba um diagnóstico', onde: 'A2' },
    { para: '/professor/ferramentas/redacao', nome: 'Redação e discursiva', oque: 'Rubrica, lote e correção cega. A IA não corrige nem sugere nota', onde: 'F7' },
    { para: '/professor/biblioteca/prova-estequiometria', nome: 'Artefato', oque: 'A prova salva: questões, gabarito, versão adaptada, exportar', onde: 'A2' },
    { para: '/professor/calendario', nome: 'Calendário', oque: 'Mês, semana e dia no desenho da Teachy: uma linha por evento no mês, cartões empilhados na semana', onde: 'F8' },
    { para: '/professor/time', nome: 'Seu time', oque: 'Um agente por pessoa, em formato de conversa: o agente manda mensagem, a professora responde, e o que espera fica preso no alto', onde: 'A2 · A4' },
    { para: '/professor/aprovar', nome: 'Aprovar', oque: 'A ação que não pode virar clique reflexo', onde: 'A3' },
    { para: '/professor/turmas', nome: 'Minhas turmas', oque: 'As turmas em cartões e Meu uso', onde: 'A3 · F6' },
    { para: '/professor/turmas/2b', nome: 'Turma aberta', oque: 'Visão geral, Sala (uma carteira por aluno), Atividades, Notas, Frequência, Ranking de participação e Tutor; e o convite de alunos', onde: 'A3 · proposta' },
    { para: '/professor/sala', nome: 'Modo sala', oque: 'Sinal, não conversa', onde: 'F10' },
  ] },
  { titulo: 'Aluno', apoio: 'A mesma casca, mais calma', linhas: [
    { para: '/aluno', nome: 'Tutor', oque: 'Faixa fixa de aviso, caixa só de texto, uso do dia, e os quatro estados', onde: 'A4' },
    { para: '/aluno/atividades', nome: 'Atividades e provas', oque: 'O que o professor atribuiu', onde: 'A3' },
    { para: '/aluno/atividades/estequiometria', nome: 'Responder atividade', oque: 'Objetiva, com resposta salva a cada item', onde: 'A3' },
    { para: '/aluno/prova', nome: 'Prova online', oque: 'O aviso sobre sair da aba antes de começar; queda de rede não perde resposta', onde: 'F6' },
    { para: '/aluno/desempenho', nome: 'Meu desempenho', oque: 'Só do próprio aluno, sem média da turma', onde: 'F9' },
    { para: '/aluno/memoria', nome: 'O que o Tutor sabe de mim', oque: 'A memória do trabalho, com contestação', onde: 'A4 · F9' },
    { para: '/aluno/avisar', nome: 'Avisar um adulto', oque: 'O canal de notificação do ECA Digital', onde: 'F9' },
    { para: '/aluno/privacidade', nome: 'Privacidade', oque: 'Em linguagem de 11 anos', onde: 'F9' },
  ] },
  { titulo: 'Coordenação', apoio: 'Abre em Governança: é a tela que fecha a venda', linhas: [
    { para: '/coordenacao', nome: 'Governança', oque: 'O que a IA gerou e quem aprovou, com o número; consumo; nominal só com auditoria', onde: 'A5' },
    { para: '/coordenacao/analista', nome: 'Analista', oque: 'Resumo de segunda e alertas, em agregado', onde: 'A5' },
    { para: '/coordenacao/agentes', nome: 'Agentes', oque: 'O que cada um faz sozinho, o que espera aprovação e o que nunca faz', onde: 'A5' },
    { para: '/coordenacao/estrutura', nome: 'Estrutura', oque: 'O roteiro de montagem, turmas, ano letivo, alocação, grade e conta da escola', onde: 'A1 · F2' },
    { para: '/coordenacao/estrutura/turmas/2b', nome: 'Lista da turma', oque: 'Nomes com matrícula e situação, colar com prévia linha a linha, e os pedidos de nome com auditoria', onde: 'A1' },
    { para: '/coordenacao/professores', nome: 'Professores', oque: 'Cadastro com convite de cópia única; refazer e revogar', onde: 'A1' },
    { para: '/coordenacao/material', nome: 'Material', oque: 'Fontes com titularidade e licença; recusa sem licença', onde: 'A2 · F4' },
    { para: '/coordenacao/adaptacoes', nome: 'Adaptações', oque: 'A adaptação necessária, nunca o diagnóstico', onde: 'F12' },
    { para: '/coordenacao/conformidade', nome: 'Conformidade', oque: 'O dossiê da escola em um lugar', onde: 'F12' },
    { para: '/coordenacao/denuncias', nome: 'Denúncias', oque: 'O canal de notificação de violação', onde: 'F12' },
    { para: '/coordenacao/auditoria', nome: 'Auditoria', oque: 'Quem gerou, quem aprovou e quando, para qualquer item', onde: 'F12' },
    { para: '/coordenacao/exportar', nome: 'Exportar', oque: 'Dado e artefato em formato aberto, a qualquer momento', onde: 'F12' },
    { para: '/coordenacao/configuracoes', nome: 'Configurações', oque: 'Política do Tutor, modo casa por turma, fontes aprovadas, retenção', onde: 'F9 · F12' },
  ] },
  { titulo: 'Operação Turmma', apoio: 'A equipe Turmma, sem dado de pessoa', linhas: [
    { para: '/operacao', nome: 'Escolas', oque: 'Rede, escola, endereço e o convite da primeira coordenadora', onde: 'A0' },
    { para: '/operacao?aba=uso', nome: 'Uso', oque: 'Uso e custo de IA por escola, com o teto de cada uma', onde: 'A0' },
  ] },
  { titulo: 'Rede e família', apoio: 'Fases posteriores, com o lugar reservado', linhas: [
    { para: '/rede', nome: 'Rede', oque: 'Consolidado por escola, sempre em agregado', onde: 'F14' },
    { para: '/familia', nome: 'Família', oque: 'Nota, entrega e alerta, no celular', onde: 'Depois' },
  ] },
]

function Lista({ linhas }: { linhas: Linha[] }) {
  return (
    <ul className="divide-y divide-linha overflow-hidden rounded-cartao border border-linha bg-superficie">
      {linhas.map((l) => (
        <li key={l.para + l.nome}>
          <Link to={l.para} className="group flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-realce">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold leading-snug text-tinta">{l.nome}</span>
              <span className="block text-sm leading-snug text-sutil">{l.oque}</span>
            </span>
            <Badge variant={/^A\d|^Turmma$|^Coordenação$|^Professor$|^Aluno$/.test(l.onde) ? 'pendente' : 'ia'} size="md" className="shrink-0 font-semibold">{l.onde}</Badge>
            <ArrowRight className="size-4 shrink-0 text-sutil transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function Mapa() {
  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-10 md:px-8 md:pt-14">
      <Marca className="text-[22px]" />
      <h1 className="mt-8 max-w-[20ch] text-[clamp(28px,3.8vw,40px)] font-semibold leading-[1.1] tracking-[-0.02em] text-tinta">
        A interface inteira, antes de construir.
      </h1>
      <p className="mt-4 max-w-[68ch] text-[17px] leading-relaxed text-apoio">
        A versão final do Turmma, tela por tela, no <b className="font-semibold text-tinta">sistema de design do ChatGPT</b> com as três cores da marca — branco, preto e o laranja da pinta.
        Nada aqui fala com servidor, e todo dado é sintético: o Colégio Aurora e a E. M. Rio Cachoeira não existem.
        O primeiro roteiro é o caminho que o produto já faz de verdade, da escola vazia ao primeiro aluno; o segundo, a IA supervisionada em sala.
      </p>

      <section className="mt-12">
        <h2 className="titulo-tela text-tinta">Roteiro 1 · A escola do zero ao primeiro aluno</h2>
        <p className="mb-4 mt-1 text-[15px] text-sutil">Quem cria, quem confirma e quem aprova, em dez passos. Nenhum aluno entra sem uma pessoa aprovar, e o aluno não tem e-mail, CPF nem foto no sistema.</p>
        <Lista linhas={ROTEIRO_ESCOLA} />
      </section>

      <section className="mt-12">
        <h2 className="titulo-tela text-tinta">Roteiro 2 · A IA supervisionada em sala</h2>
        <p className="mb-4 mt-1 text-[15px] text-sutil">Da prova pedida ao chat até a governança da coordenação. Uns quinze minutos.</p>
        <Lista linhas={ROTEIRO} />
      </section>

      <div className="mt-14 grid gap-x-8 gap-y-12 lg:grid-cols-2">
        {BLOCOS.map((b) => (
          <section key={b.titulo} className={b.linhas.length > 9 ? 'lg:row-span-2' : undefined}>
            <h2 className="titulo-tela text-tinta">{b.titulo}</h2>
            <p className="mb-4 mt-1 text-[15px] text-sutil">{b.apoio}</p>
            <Lista linhas={b.linhas} />
          </section>
        ))}
      </div>
    </main>
  )
}
