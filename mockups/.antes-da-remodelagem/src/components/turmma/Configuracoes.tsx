import { useMemo, useState, type ReactNode } from 'react'
import {
  Bell, Check, GraduationCap, IdCard, KeyRound, Laptop, Lock, MessageCircleQuestion, ScrollText, Search, Settings, Smartphone,
  Sparkles, X, type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { AGENTES } from '@/dados/agentes'
import { ESCOLAS, TURMAS } from '@/dados/escola'
import { cn } from '@/lib/utils'
import type { Papel } from './Casca'

/* CONFIGURAÇÕES, no modelo do ChatGPT (pedido do Gabriel, 20/09/2026): um diálogo com a lista de seções à esquerda
   (busca em cima) e, à direita, linhas de "rótulo · controle" separadas por fio.
   O que entra saiu das decisões, não de uma lista genérica de preferências:
   · Geral — aparência, tamanho do texto, idioma, e o que já vem escolhido (escola e turma, para quem tem duas escolas);
   · Notificações — o que avisa e como. O HORÁRIO não é configurável: aviso só no horário útil da escola (D59);
   · Assistente — instruções e padrões das ferramentas. Nunca texto sobre aluno (D35, D66). Busca na web não tem
     chave aqui: liga por conversa (D68);
   · Tutor nas turmas — o que é da escola aparece só para leitura (uso fora da sala, D19); o professor liga a busca em
     fontes aprovadas por turma e com prazo, se a escola liberou (D68);
   · Perfil e vínculos — o vínculo é criado pela escola; o professor só confirma (regra 60, item 8a);
   · Privacidade e dados — quem vê o quê, quem abriu o dado nominal (D45), exportar tudo em formato aberto (D63),
     pedir revisão de indicador (LGPD, art. 20);
   · Segurança e acesso — conta da escola ou senha (D48), duas etapas, aparelhos conectados;
   · Como a IA funciona aqui — o que cada agente faz sozinho, onde o dado é processado (D62), canal de denúncia (D61).
   O que NÃO existe, de propósito: plano, faturamento, crédito e consumo — o cliente é a escola, e o professor não vê
   consumo (D2, D40). */

type SecaoId = 'geral' | 'notificacoes' | 'assistente' | 'tutor' | 'perfil' | 'privacidade' | 'seguranca' | 'ia'

const SECOES: { id: SecaoId; nome: string; icone: LucideIcon; papeis: Papel[]; termos: string }[] = [
  { id: 'geral', nome: 'Geral', icone: Settings, papeis: ['professor', 'aluno', 'coordenacao'], termos: 'aparência tema texto idioma escola turma' },
  { id: 'notificacoes', nome: 'Notificações', icone: Bell, papeis: ['professor', 'coordenacao'], termos: 'aviso e-mail horário sinais correção' },
  { id: 'assistente', nome: 'Assistente', icone: Sparkles, papeis: ['professor'], termos: 'personalização instruções prova padrão exportar semana web' },
  { id: 'tutor', nome: 'Tutor nas turmas', icone: MessageCircleQuestion, papeis: ['professor'], termos: 'busca fontes fora da sala avaliação' },
  { id: 'perfil', nome: 'Perfil e vínculos', icone: IdCard, papeis: ['professor', 'coordenacao'], termos: 'nome e-mail escolas turmas vínculo' },
  { id: 'privacidade', nome: 'Privacidade e dados', icone: Lock, papeis: ['professor', 'coordenacao'], termos: 'exportar apagar histórico auditoria revisão lgpd' },
  { id: 'seguranca', nome: 'Segurança e acesso', icone: KeyRound, papeis: ['professor', 'aluno', 'coordenacao'], termos: 'senha duas etapas mfa aparelhos sair google' },
  { id: 'ia', nome: 'Como a IA funciona aqui', icone: ScrollText, papeis: ['professor', 'aluno', 'coordenacao'], termos: 'agentes autonomia modelo brasil denúncia erro' },
]

/** Uma linha: o que é, uma frase de apoio se precisar, e o controle à direita. */
function Linha({ rotulo, apoio, children, empilha = false }: { rotulo: ReactNode; apoio?: ReactNode; children?: ReactNode; empilha?: boolean }) {
  return (
    <div className={cn('flex gap-x-6 gap-y-2 border-b border-linha py-3.5 last:border-0', empilha ? 'flex-col' : 'items-center justify-between')}>
      <div className="min-w-0">
        <p className="text-sm text-tinta">{rotulo}</p>
        {apoio && <p className="mt-0.5 max-w-[60ch] text-[13px] leading-snug text-sutil">{apoio}</p>}
      </div>
      {children && <div className={cn('shrink-0', empilha && 'w-full')}>{children}</div>}
    </div>
  )
}

function Opcao({ valor, opcoes }: { valor: string; opcoes: string[] }) {
  const [v, setV] = useState(valor)
  return (
    <Select value={v} onValueChange={setV}>
      <SelectTrigger className="h-9 w-auto gap-1.5 rounded-linha border-0 bg-transparent px-2.5 text-sm font-medium text-tinta shadow-none hover:bg-realce-suave focus:ring-0"><SelectValue /></SelectTrigger>
      <SelectContent align="end" className="rounded-cartao border-0 p-1 shadow-flutua">
        {opcoes.map((o) => <SelectItem key={o} value={o} disabled={o.includes('em breve')} className="h-9 rounded-linha text-sm">{o}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function Chave({ ligada = false, fixa = false }: { ligada?: boolean; fixa?: boolean }) {
  const [v, setV] = useState(ligada)
  return <Switch checked={v} onCheckedChange={setV} disabled={fixa} className="data-[state=checked]:bg-tinta data-[state=unchecked]:bg-borda-campo" />
}

const Fixo = ({ children }: { children: ReactNode }) => <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-realce-suave px-2.5 text-xs font-medium text-apoio"><Lock className="size-3" strokeWidth={2.2} />{children}</span>
const Grupo = ({ children }: { children: ReactNode }) => <p className="rotulo pb-1 pt-5 first:pt-1">{children}</p>
const Nota = ({ children }: { children: ReactNode }) => <p className="my-2 rounded-controle bg-realce-suave px-3.5 py-2.5 text-[13px] leading-snug text-apoio">{children}</p>

function Conteudo({ secao, papel }: { secao: SecaoId; papel: Papel }) {
  const prof = papel === 'professor'
  switch (secao) {
    case 'geral': return (
      <>
        <Linha rotulo="Aparência" apoio="O tema escuro não existe: ficou de fora de propósito."><Fixo>Claro</Fixo></Linha>
        <Linha rotulo="Tamanho do texto" apoio="Vale para o sistema inteiro, inclusive o que você projeta na sala."><Opcao valor="Padrão" opcoes={['Padrão', 'Grande', 'Maior']} /></Linha>
        <Linha rotulo="Idioma"><Opcao valor="Português (Brasil)" opcoes={['Português (Brasil)']} /></Linha>
        {prof && <Linha rotulo="Escola ao abrir" apoio="Você dá aula em duas escolas. Nada de uma aparece na outra."><Opcao valor="A última que usei" opcoes={['A última que usei', ...ESCOLAS.map((e) => e.nome)]} /></Linha>}
        {prof && <Linha rotulo="Turma que já vem na caixa de pedido"><Opcao valor="A da aula de agora" opcoes={['A da aula de agora', 'A última que usei', ...TURMAS.map((t) => `${t.nome} · ${t.disciplina}`)]} /></Linha>}
        {prof && <Linha rotulo="Mostrar o resumo do dia na página inicial"><Chave ligada /></Linha>}
      </>
    )
    case 'notificacoes': return (
      <>
        <Nota><b className="font-semibold text-tinta">Aviso só chega no horário da escola</b> — das 7h às 18h, em dia letivo. Isso não se muda aqui: o produto não avisa fora de hora nem cobra uso.</Nota>
        <Grupo>{prof ? 'Do seu Assistente' : 'Do Analista'}</Grupo>
        {prof ? (
          <>
            <Linha rotulo="Correção pronta para você revisar"><Opcao valor="No sistema e por e-mail" opcoes={['No sistema e por e-mail', 'Só no sistema']} /></Linha>
            <Linha rotulo="Versão adaptada pronta"><Opcao valor="Só no sistema" opcoes={['No sistema e por e-mail', 'Só no sistema']} /></Linha>
            <Linha rotulo="Seu dia, de manhã" apoio="Aulas, avaliações e entregas em atraso, às 7h10."><Chave ligada /></Linha>
            <Linha rotulo="Entrega em atraso"><Chave ligada /></Linha>
            <Grupo>Do Tutor</Grupo>
            <Linha rotulo="Sinais da turma" apoio="Quem travou, quem pediu resposta pronta, a dúvida que se repetiu."><Opcao valor="Na hora, durante a aula" opcoes={['Na hora, durante a aula', 'Um resumo no fim do dia']} /></Linha>
            <Linha rotulo="Assunto delicado" apoio="Quando um aluno escreve algo que pede um adulto."><Fixo>Sempre na hora</Fixo></Linha>
          </>
        ) : (
          <>
            <Linha rotulo="Resumo de segunda de manhã"><Opcao valor="No sistema e por e-mail" opcoes={['No sistema e por e-mail', 'Só no sistema']} /></Linha>
            <Linha rotulo="Alerta quando um indicador passa do limite"><Chave ligada /></Linha>
            <Linha rotulo="Denúncia nova no canal da escola"><Fixo>Sempre na hora</Fixo></Linha>
          </>
        )}
        <Grupo>Para onde vai o e-mail</Grupo>
        <Linha rotulo="camila.souza@colegioaurora.example" apoio="É o e-mail do seu cadastro. Aluno não tem e-mail no sistema."><Button variant="secundario" size="sm">Trocar</Button></Linha>
      </>
    )
    case 'assistente': return (
      <>
        <Linha empilha rotulo="Instruções para o Assistente" apoio="Vale para todas as conversas: seu jeito de montar prova, o nível de dificuldade que costuma usar, o formato que prefere.">
          <Textarea rows={3} defaultValue="Minhas provas têm 10 questões, do cálculo direto ao problema com texto. Sempre com uma questão de interpretação de gráfico."
            className="min-h-[84px] rounded-controle border-borda-campo bg-superficie text-sm" />
          <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-snug text-sutil"><Lock className="mt-px size-3.5 shrink-0" />Não escreva sobre alunos aqui. O que o Assistente sabe de um aluno vem do trabalho dele, nunca de texto livre.</p>
        </Linha>
        <Grupo>Padrões das ferramentas</Grupo>
        <Linha rotulo="Questões por prova"><Opcao valor="10" opcoes={['5', '8', '10', '12', '15', '20']} /></Linha>
        <Linha rotulo="Alternativas por questão"><Opcao valor="4 (a–d)" opcoes={['4 (a–d)', '5 (a–e), como no ENEM']} /></Linha>
        <Linha rotulo="Sempre gerar com gabarito"><Chave ligada /></Linha>
        <Linha rotulo="Formato ao exportar"><Opcao valor="PDF" opcoes={['PDF', 'PowerPoint (PPTX)', 'Excel (XLSX)', 'Perguntar sempre']} /></Linha>
        <Grupo>Preparar a semana, toda segunda</Grupo>
        {TURMAS.map((t, i) => <Linha key={t.id} rotulo={`${t.nome} · ${t.disciplina}`} apoio={i === 0 ? 'Desligado, o Assistente só gera plano quando você pede.' : undefined}><Chave ligada={i === 0} /></Linha>)}
        <Grupo>Busca na web</Grupo>
        <Linha rotulo="Liga por conversa, na caixa de pedido" apoio="Não existe ligar para sempre. O que vier de fora sai rotulado e não entra na base da escola."><Fixo>Desligada por padrão</Fixo></Linha>
      </>
    )
    case 'tutor': return (
      <>
        <Nota>O Tutor é o agente dos seus alunos. Aqui você decide só o que é seu; o que é da escola aparece para leitura.</Nota>
        {TURMAS.map((t, i) => (
          <div key={t.id}>
            <Grupo>{t.nome} · {t.disciplina}</Grupo>
            <Linha rotulo="Uso fora da sala" apoio="Quem decide é a coordenação, por turma."><Fixo>{i === 3 ? 'Ligado pela escola' : 'Desligado pela escola'}</Fixo></Linha>
            <Linha rotulo="Busca em fontes aprovadas" apoio={i === 2 ? 'A escola ainda não liberou a busca nesta turma.' : 'Só em sala, só nas fontes que a escola aprovou, e desliga sozinha no prazo.'}>
              {i === 2 ? <Fixo>Não liberada</Fixo> : <span className="flex items-center gap-2">{i === 0 && <Opcao valor="Até sexta" opcoes={['Só hoje', 'Até sexta', 'Até o fim do bimestre']} />}<Chave ligada={i === 0} /></span>}
            </Linha>
            <Linha rotulo="Trava durante avaliação"><Fixo>Sempre ligada</Fixo></Linha>
          </div>
        ))}
      </>
    )
    case 'perfil': return (
      <>
        <Linha rotulo="Nome" apoio="Como aparece para a escola e para os alunos."><span className="text-sm font-medium text-tinta">Camila Souza</span></Linha>
        <Linha rotulo="Como o Assistente chama você"><Opcao valor="Camila" opcoes={['Camila', 'Professora Camila', 'Prof. Camila']} /></Linha>
        <Grupo>Seus vínculos</Grupo>
        <Nota>O vínculo é criado pela escola, pela grade que ela importou. Você só confirma — e sem vínculo confirmado ninguém vê aluno.</Nota>
        {[['Colégio Aurora', '2ºB, 2ºA e 1ºC · Química', '03/02/2026'], ['E. M. Rio Cachoeira', '9ºA · Ciências', '10/02/2026']].map(([e, t, d]) => (
          <Linha key={e} rotulo={e} apoio={t}><span className="inline-flex items-center gap-1.5 rounded-full bg-ok-cx px-2.5 py-1 text-xs font-medium text-ok"><Check className="size-3" strokeWidth={2.6} />Confirmado por você · {d}</span></Linha>
        ))}
        <Linha rotulo="Algum vínculo está errado?" apoio="Turma que não é sua, disciplina trocada, escola de que você já saiu."><Button variant="secundario" size="sm">Avisar a coordenação</Button></Linha>
      </>
    )
    case 'privacidade': return (
      <>
        <Linha rotulo="Quem vê suas conversas com o Assistente" apoio="A coordenação não tem acesso, nem com auditoria."><Fixo>Só você</Fixo></Linha>
        <Linha rotulo="Quem abriu um dado seu com nome" apoio="A coordenação vê o uso somado. Para ver o seu nome, precisa abrir com registro — e o registro aparece para você."><Button variant="secundario" size="sm">Ninguém em 2026 · ver</Button></Linha>
        <Linha rotulo="Pedir revisão de um indicador" apoio="Se um número não representa o seu trabalho."><Button variant="secundario" size="sm">Pedir revisão</Button></Linha>
        <Grupo>O que é seu, sai quando você quiser</Grupo>
        <Linha rotulo="Exportar tudo que você produziu" apoio="Provas, atividades, planos e o histórico de uso, em formato aberto."><Button variant="secundario" size="sm">Exportar</Button></Linha>
        <Linha rotulo="Apagar o histórico de conversas" apoio="O que já está salvo na biblioteca continua lá."><Button variant="perigo" size="sm">Apagar…</Button></Linha>
        <Grupo>Da escola</Grupo>
        <Linha rotulo="Aviso de privacidade e encarregado de dados" apoio="A escola é a responsável pelos dados; nós tratamos por ordem dela."><Button variant="discreto" size="sm">Abrir</Button></Linha>
      </>
    )
    case 'seguranca': return (
      <>
        <Linha rotulo="Como você entra" apoio={papel === 'aluno' ? 'Escola, matrícula e senha. Aluno não tem e-mail no sistema.' : 'Guardamos só o identificador da conta, nunca a senha dela.'}>
          {papel === 'aluno' ? <Button variant="secundario" size="sm">Trocar a senha</Button> : <span className="text-sm font-medium text-tinta">Conta Google da escola</span>}
        </Linha>
        {papel !== 'aluno' && <Linha rotulo="Verificação em duas etapas" apoio={papel === 'coordenacao' ? 'Obrigatória para a coordenação.' : 'Opcional para professor. Recomendada.'}>{papel === 'coordenacao' ? <Fixo>Sempre ligada</Fixo> : <Chave />}</Linha>}
        <Grupo>Aparelhos conectados</Grupo>
        <Linha rotulo={<span className="flex items-center gap-2"><Laptop className="size-4 text-sutil" />Computador da sala 12 · Chrome</span>} apoio="Agora · Colégio Aurora"><span className="text-xs font-medium text-ok">este aparelho</span></Linha>
        <Linha rotulo={<span className="flex items-center gap-2"><Smartphone className="size-4 text-sutil" />Celular · Safari</span>} apoio="Ontem, 19h12"><Button variant="discreto" size="sm">Sair</Button></Linha>
        <Linha rotulo="Sair de todos os aparelhos"><Button variant="secundario" size="sm">Sair de todos</Button></Linha>
      </>
    )
    case 'ia': return (
      <>
        <Nota><b className="font-semibold text-tinta">A IA prepara e avisa; a escola aprova.</b> Nada vira nota, mensagem à família ou decisão sobre aluno sem uma pessoa aprovar. E a IA pode errar: confira antes de usar com a turma.</Nota>
        <Grupo>Um agente para cada pessoa da escola</Grupo>
        {([AGENTES.assistente, AGENTES.tutor, AGENTES.analista]).map((a) => (
          <Linha key={a.id} rotulo={<span className="flex items-center gap-2"><a.icone className="size-4 text-sutil" />{a.nome} <span className="text-sutil">· {a.paraQuem.toLowerCase()}</span></span>} apoio={a.autonomia.charAt(0).toUpperCase() + a.autonomia.slice(1)}><Button variant="discreto" size="sm">O que faz sozinho</Button></Linha>
        ))}
        <Grupo>Por baixo</Grupo>
        <Linha rotulo="Onde a conversa de aluno é processada"><Fixo>No Brasil</Fixo></Linha>
        <Linha rotulo="Seu dado treina algum modelo?"><Fixo>Não</Fixo></Linha>
        <Linha rotulo="Viu a IA fazer algo errado ou inadequado?" apoio="Vai para o canal da escola, com resposta e recurso."><Button variant="secundario" size="sm">Avisar</Button></Linha>
      </>
    )
  }
}

export function Configuracoes({ papel, aberta, aoFechar }: { papel: Papel; aberta: string | null; aoFechar: () => void }) {
  const secoes = useMemo(() => SECOES.filter((s) => s.papeis.includes(papel)), [papel])
  const [atual, setAtual] = useState<SecaoId | null>(null)
  const [busca, setBusca] = useState('')
  const pedida = secoes.find((s) => s.id === aberta)?.id
  const id = atual ?? pedida ?? secoes[0].id
  const secao = secoes.find((s) => s.id === id) ?? secoes[0]
  const q = busca.trim().toLowerCase()
  const visiveis = secoes.filter((s) => !q || `${s.nome} ${s.termos}`.toLowerCase().includes(q))
  const fechar = () => { aoFechar(); setAtual(null); setBusca('') }

  return (
    <Dialog open={aberta !== null} onOpenChange={(v) => { if (!v) fechar() }}>
      <DialogContent className="flex h-[min(680px,calc(100svh-32px))] w-[calc(100vw-24px)] max-w-[940px] flex-col gap-0 overflow-hidden rounded-[24px] border-0 bg-superficie p-0 shadow-flutua sm:rounded-[24px] md:flex-row [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Configurações</DialogTitle>
        <DialogDescription className="sr-only">Preferências da sua conta na Turmma</DialogDescription>

        <nav aria-label="Seções das configurações" className="flex shrink-0 flex-col gap-2 border-b border-linha bg-lateral p-2.5 md:w-[252px] md:border-b-0 md:border-r">
          <div className="flex items-center gap-2">
            <button type="button" onClick={fechar} aria-label="Fechar as configurações" className="grid size-9 shrink-0 place-items-center rounded-linha text-sutil transition-colors duration-150 hover:bg-realce hover:text-tinta"><X className="size-[18px]" /></button>
          </div>
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-inativo" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar configurações" aria-label="Pesquisar configurações"
              className="h-9 w-full rounded-full border border-borda-campo bg-superficie pl-9 pr-3 text-[13.5px] text-tinta outline-none placeholder:text-inativo focus-visible:border-tinta" />
          </label>
          <ul className="flex gap-0.5 overflow-x-auto md:flex-col md:overflow-visible">
            {visiveis.map((s) => (
              <li key={s.id} className="shrink-0">
                <button type="button" onClick={() => setAtual(s.id)} aria-current={s.id === secao.id ? 'page' : undefined}
                  className={cn('flex h-9 w-full items-center gap-2.5 whitespace-nowrap rounded-linha px-2.5 text-left text-sm text-tinta transition-colors duration-150 hover:bg-realce', s.id === secao.id && 'bg-realce font-medium')}>
                  <s.icone className="size-[18px] shrink-0" strokeWidth={1.75} /> {s.nome}
                </button>
              </li>
            ))}
            {visiveis.length === 0 && <li className="px-2.5 py-2 text-[13px] text-sutil">Nada com esse nome.</li>}
          </ul>
          <p className="mt-auto hidden items-center gap-1.5 px-2.5 pb-1 text-xs text-inativo md:flex"><GraduationCap className="size-3.5" />Plano e cobrança são da escola.</p>
        </nav>

        <section aria-label={secao.nome} className="flex min-h-0 min-w-0 flex-1 flex-col">
          <h2 className="shrink-0 border-b border-linha px-5 pb-3.5 pt-5 font-corpo text-lg font-semibold leading-none text-tinta md:px-6">{secao.nome}</h2>
          <div key={secao.id} className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-1 md:px-6"><Conteudo secao={secao.id} papel={papel} /></div>
        </section>
      </DialogContent>
    </Dialog>
  )
}
