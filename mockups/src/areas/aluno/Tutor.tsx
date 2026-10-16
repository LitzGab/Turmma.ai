import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { BoasVindas } from '@/components/duo'
import { useAlunoAtual } from '@/dados/sessao'
import { useTarefa, useTutorTravado } from '@/dados/avaliacoes'
import { ConversaTutor, InicioDescansando, motivoDoTravado } from './_conversa-tutor'

/* O INÍCIO DO ALUNO (/aluno e /aluno/c/:id), 14ª rodada, 05/10/2026 (plano ux-composicao, 1.2 e 5.1). "Toda essa área
   precisa ser dedicada para os chats, assim como é uma IA": o Início é só a conversa com o Tutor. As tarefas moram
   em Tarefas (com o número azul do que está Para fazer na lateral).
   · Conversa vazia (ConversaVazia), 15ª rodada: como nas IAs, a saudação "Oi, Lucas" (h1) com a onça pequena ao lado,
     "Qual é a sua dúvida?" embaixo, a caixa na coluna de 768, 4 sugestões e o aviso numa linha pequena e cinza.
   · A primeira pergunta cria a conversa e leva a /aluno/c/:id; INÍCIO sempre volta à caixa vazia.
   · Quando o Tutor não atende (prova aberta, fora da aula, limite do dia, escola pausou), a onça dorme no MESMO lugar,
     com uma frase na primeira pessoa e um botão (sem outro caminho, VER MINHAS TAREFAS: nunca uma tela sem saída).
   · Nada de colega, ranking, ponto, sequência, meta ou número subindo (regra 50, item 9; D59). */

type Estado = { frase: string; botao?: { rotulo: string; para: string }; apoio?: string }
const TAREFAS = { rotulo: 'Ver minhas tarefas', para: '/aluno/tarefas' }

export function Tutor() {
  const { id } = useParams()
  const { key } = useLocation()
  const [params] = useSearchParams()
  const travado = useTutorTravado()
  const aluno = useAlunoAtual()
  const assunto = params.get('assunto') ?? undefined
  const pedido = params.get('estado')

  // o estado que toma o lugar da caixa: o do endereço (?estado=, para o Mapa) ou o de verdade (prova, pausa)
  let estado: Estado | null = null
  const provaPedida = travado?.motivo === 'prova' ? travado.tarefaId : 'prova-estequiometria'
  const provaChegou = !!useTarefa(provaPedida)
  if (pedido === 'prova') estado = provaChegou
    ? motivoDoTravado({ motivo: 'prova', tarefaId: provaPedida })
    // a prova ainda não foi enviada: a onça não promete uma prova que não existe
    : { frase: 'Hoje não tem prova aberta.', apoio: 'Na prova, eu descanso. Quando a professora mandar uma, ela aparece nas suas tarefas.', botao: { rotulo: 'Ver as tarefas', para: '/aluno/tarefas' } }
  else if (pedido === 'fora') estado = { frase: 'Volto na próxima aula.', apoio: 'Fora do horário de aula, eu descanso. Suas tarefas continuam em Tarefas.', botao: TAREFAS }
  else if (pedido === 'limite') estado = { frase: 'Por hoje é isso. Amanhã eu volto.', apoio: 'Suas tarefas continuam em Tarefas.', botao: TAREFAS }
  else if (travado && !id) estado = motivoDoTravado(travado)
  // a onça dormindo nunca deixa o aluno sem saída: sem outro caminho, o botão leva às tarefas (um botão só)
  if (estado && !estado.botao) estado = { ...estado, botao: TAREFAS }

  if (estado) {
    return (
      <InicioDescansando frase={estado.frase} botao={estado.botao} apoio={estado.apoio} />
    )
  }

  // INÍCIO sempre volta à caixa vazia (a chave da navegação recomeça a tela)
  const chave = id ? `c-${id}` : `inicio-${assunto ?? ''}-${key}`
  return (
    <ConversaTutor key={chave} conversaId={id} assunto={assunto}
      vazio={id ? undefined : { topo: <BoasVindas agente="tutor" titulo={`Oi, ${aluno.primeiro}`} subtitulo="Qual é a sua dúvida?" /> }} />
  )
}
