import { ROTULOS_DA_ADAPTACAO, TAMANHO_MAXIMO_DA_JUSTIFICATIVA, TAMANHO_MINIMO_DA_JUSTIFICATIVA, TIPOS_DE_ADAPTACAO, type Citacao } from '@educa/shared'
import { Ellipsis, Eye, FileDown, Inbox, LayoutGrid, MessageSquare, SlidersHorizontal } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { Abas } from '../componentes/Abas'
import { BarraPresa } from '../componentes/BarraPresa'
import { BarraRotulada } from '../componentes/BarraRotulada'
import { Botao } from '../componentes/Botao'
import { TAMANHOS_DE_BOTAO, VARIANTES_DE_BOTAO } from '../componentes/botao-secundario'
import { CampoLongo } from '../componentes/CampoLongo'
import { Cartao } from '../componentes/Cartao'
import { DialogoDeConfirmacao } from '../componentes/DialogoDeConfirmacao'
import { EstadoVazio } from '../componentes/estado'
import { Faixa } from '../componentes/Faixa'
import type { Aprovacao } from '../componentes/ia/aprovacao'
import { AssinaturaIA, SeloIA } from '../componentes/ia/AssinaturaIA'
import { AvatarAgente } from '../componentes/ia/AvatarAgente'
import { AvisoFila } from '../componentes/ia/AvisoFila'
import { CaixaPedido } from '../componentes/ia/CaixaPedido'
import { Escolha } from '../componentes/ia/Escolha'
import { LinhaAprovacao } from '../componentes/ia/LinhaAprovacao'
import { Conversa, MensagemIA, MensagemPessoa, Pensando } from '../componentes/ia/Mensagem'
import type { DescricaoDeFerramenta, ValoresValidados } from '../componentes/ia/motor-formulario'
import { MotorFormulario, type EstadoDoMotor } from '../componentes/ia/MotorFormulario'
import { PaginaMini } from '../componentes/ia/PaginaMini'
import { TextoDaIA } from '../componentes/ia/TextoDaIA'
import { Menu } from '../componentes/Menu'
import { NumeroPainel } from '../componentes/NumeroPainel'
import { Selecao } from '../componentes/Selecao'
import { Estado } from '../componentes/SeloDeEstado'
import { Tabela, type ColunaDaTabela } from '../componentes/Tabela'
import { CabecalhoDeSecao, Tela } from '../componentes/Tela'
import { problemaDoTexto } from '../componentes/texto-longo'
import { useTituloDaTela } from '../titulo'

/**
 * A galeria das peças do MVP de apresentação (`docs/mvp-rapido.md` 9.3): uma tela só, fora da navegação, onde cada peça
 * de `componentes/` e de `componentes/ia/` aparece nos seus estados. É nela que o Playwright prova as peças, nos
 * projetos `chromebook` e `celular` (`e2e/pecas.spec.ts`), antes de as telas existirem.
 *
 * Não chama a API e não tem sessão: tudo aqui é dado inventado, escrito neste arquivo (regra 20, item 17). O e2e roda
 * sobre o build de produção, e por isso a galeria está nele — num pedaço próprio (`galeria-*.js`), que só quem digita o
 * endereço baixa (`apps/web/nome-dos-chunks.ts`), e que só o build com `VITE_COM_GALERIA=1` leva (`src/rotas.tsx`).
 */

const QUIMICA = '0190a1b2-0000-7000-8000-000000000001'
const MATERIAIS = { [QUIMICA]: 'Química 2, cap. 7' }

const PAGINA_142: Citacao = {
  materialId: QUIMICA,
  pagina: 142,
  trecho: 'A proporção entre as quantidades de matéria de reagentes e produtos é dada pelos coeficientes da equação balanceada.',
}
const CITACOES: readonly Citacao[] = [
  PAGINA_142,
  { materialId: QUIMICA, pagina: 145, trecho: 'O reagente limitante é o que acaba primeiro e determina quanto produto se forma.' },
  { materialId: QUIMICA, pagina: 151, trecho: 'O rendimento é a razão entre a massa obtida e a massa prevista pela equação.' },
  // A mesma página citada de novo: a lista de fontes conta uma vez só.
  PAGINA_142,
]

/**
 * O texto como o modelo o devolve: com Markdown (título, negrito, lista), que a tela limpa; com uma conta, em que o
 * asterisco é conteúdo e fica; e, de propósito, com um pedaço com cara de HTML, que fica escrito.
 */
const TEXTO_DO_MODELO =
  '### Lista de estequiometria\n\n**Questão 1.** Qual a massa de CO₂ formada na queima de 24 g de carbono?\n**Questão 2.** Qual é o reagente limitante quando sobra oxigênio?\n\n- Lembre: 2 * 12 = 24 g de carbono.\n- Use <b>massa molar</b> e a proporção da equação balanceada.'

const QUANDO = '2026-09-19T13:42:00.000Z'

const TURMAS = [
  { valor: 'turma-2b', rotulo: '2ºB · Química' },
  { valor: 'turma-1a', rotulo: '1ºA · Química' },
]

/**
 * O menu de ferramenta da caixa de pedido. **A Adaptação não está aqui**: ela não nasce de um texto livre, e sim do tipo
 * de adaptação, e abre direto no `MotorFormulario` (D35, D67). Ao lado de uma caixa de texto, ela convidaria a escrever
 * sobre o aluno.
 */
const FERRAMENTAS = [
  { id: 'conversa', rotulo: 'Só conversar', descricao: 'Responde aqui, sem salvar nada', icone: MessageSquare },
  { id: 'atividade_objetiva', rotulo: 'Atividade objetiva', descricao: 'Questões com a página de cada uma', icone: LayoutGrid },
  { id: 'plano_de_aula', rotulo: 'Plano de aula', descricao: 'Objetivos, etapas e avaliação', icone: LayoutGrid },
]

const ATIVIDADE: DescricaoDeFerramenta = {
  ferramenta: 'atividade_objetiva',
  nome: 'Atividade objetiva',
  verbo: 'Gerar atividade',
  campos: [
    { tipo: 'selecao', chave: 'turmaId', rotulo: 'Turma', opcoes: TURMAS, obrigatorio: true },
    { tipo: 'texto', chave: 'tema', rotulo: 'Tema', exemplo: 'Estequiometria: reagente limitante', obrigatorio: true },
    { tipo: 'numero', chave: 'quantidade', rotulo: 'Questões', minimo: 1, maximo: 20, padrao: 10 },
  ],
}

const ADAPTACAO: DescricaoDeFerramenta = {
  ferramenta: 'adaptacao',
  nome: 'Adaptação',
  verbo: 'Gerar versão adaptada',
  campos: [
    {
      tipo: 'multipla',
      chave: 'tipos',
      rotulo: 'Tipo de adaptação',
      dica: 'Escolha o que a versão precisa ter. Não escreva nada sobre o aluno.',
      minimo: 1,
      opcoes: TIPOS_DE_ADAPTACAO.map((valor) => ({ valor, rotulo: ROTULOS_DA_ADAPTACAO[valor] })),
    },
  ],
}

const ABAS = [
  { id: 'visao-geral', rotulo: 'Visão geral' },
  { id: 'alunos', rotulo: 'Alunos', contador: 2, oQueConta: 'pedidos de nome' },
  { id: 'atividades', rotulo: 'Atividades' },
]

interface Registro {
  readonly id: string
  readonly oQue: string
  readonly funcao: 'correcao_de_objetiva' | 'adaptacao' | 'conversa_e_ferramentas'
  readonly turma: string
  readonly aprovacao: Aprovacao
}

const REGISTROS: readonly Registro[] = [
  { id: 'r1', oQue: 'Correção da lista 3', funcao: 'correcao_de_objetiva', turma: '2ºB', aprovacao: { estado: 'aprovada', por: 'Camila Souza', quando: QUANDO } },
  { id: 'r2', oQue: 'Versão com fonte ampliada', funcao: 'adaptacao', turma: '2ºB', aprovacao: { estado: 'pendente' } },
  { id: 'r3', oQue: 'Atividade de estequiometria', funcao: 'conversa_e_ferramentas', turma: '1ºA', aprovacao: { estado: 'rejeitada', por: 'Camila Souza', quando: QUANDO, motivo: 'A questão 3 não é do capítulo 7.' } },
]

const DESTAQUES = ['Ana B. · em branco', 'Caio M. · muito abaixo do histórico', 'Questão 7 · erro em 28 de 32', 'Davi R. · em branco', 'Elis T. · padrão de erro', 'Fábio L. · em branco']

function Secao({ nome, titulo, children }: { nome: string; titulo: string; children: ReactNode }) {
  return (
    <section data-galeria={nome} aria-label={titulo} className="flex min-w-0 flex-col gap-3">
      <CabecalhoDeSecao titulo={titulo} />
      {children}
    </section>
  )
}

function DemonstracaoDaCaixa({ variante }: { variante: 'completa' | 'so-texto' }) {
  const [valor, definirValor] = useState('')
  const [enviado, definirEnviado] = useState('')
  const [gerando, definirGerando] = useState(false)
  const [ferramenta, definirFerramenta] = useState('conversa')
  const [turma, definirTurma] = useState('turma-2b')
  const comuns = {
    valor,
    aoMudar: definirValor,
    aoEnviar: (texto: string) => {
      definirEnviado(texto)
      definirValor('')
      definirGerando(true)
    },
    aoParar: () => definirGerando(false),
    estado: gerando ? 'gerando' : 'pronta',
  } as const
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {variante === 'so-texto' ? (
        <CaixaPedido variante="so-texto" rotulo="Pergunta para o Tutor" exemplo="Escreva a sua dúvida" {...comuns} />
      ) : (
        <CaixaPedido
          rotulo="Pedido ao Assistente de ensino"
          exemplo="Peça uma atividade, um plano de aula…"
          {...comuns}
          esquerda={<Menu rotulo={FERRAMENTAS.find((item) => item.id === ferramenta)?.rotulo ?? 'Ferramenta'} prefixo="Ferramenta" icone={LayoutGrid} titulo="Ferramentas" itens={FERRAMENTAS} escolhido={ferramenta} aoEscolher={definirFerramenta} />}
          direita={<Selecao variante="pilula" rotulo="Turma do pedido" opcoes={TURMAS} valor={turma} aoMudar={definirTurma} />}
        />
      )}
      <p role="status" data-enviado="" className="min-h-6 text-sm break-words whitespace-pre-wrap text-sutil">
        {enviado === '' ? '' : `Enviado: ${enviado}`}
      </p>
    </div>
  )
}

function DemonstracaoDoMotor({ descricao }: { descricao: DescricaoDeFerramenta }) {
  const [estado, definirEstado] = useState<EstadoDoMotor>('formulario')
  const [pedido, definirPedido] = useState<ValoresValidados | undefined>(undefined)
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <MotorFormulario
        descricao={descricao}
        estado={estado}
        aoGerar={(valores) => {
          definirPedido(valores)
          definirEstado('gerando')
        }}
        aoCancelar={() => definirPedido(undefined)}
        aoEditar={() => definirEstado('formulario')}
      >
        <Cartao>
          <p className="text-apoio">O artefato gerado aparece aqui, com a assinatura da IA e as fontes.</p>
        </Cartao>
      </MotorFormulario>
      {estado === 'gerando' && (
        <div>
          <Botao variante="secundario" onClick={() => definirEstado('pronto')}>
            Simular a resposta
          </Botao>
        </div>
      )}
      <p data-pedido="" className="min-h-6 text-sm break-all text-sutil">
        {pedido === undefined ? '' : JSON.stringify(pedido)}
      </p>
    </div>
  )
}

type Confirmacao = 'aprovar' | 'suspender' | 'andamento' | 'falha' | 'rejeitar'

const RESUMO_DO_LOTE = [
  { rotulo: 'Atividade', valor: 'Estequiometria: lista 3' },
  { rotulo: 'Turma', valor: '2ºB' },
  { rotulo: 'Correções', valor: '32' },
] as const

function DemonstracaoDaConfirmacao() {
  const [dialogo, definirDialogo] = useState<Confirmacao | undefined>(undefined)
  const [decisao, definirDecisao] = useState('')
  const [justificativa, definirJustificativa] = useState('')
  const resultado = useRef<HTMLParagraphElement>(null)
  const aprovado = decisao === 'Aprovado'
  const fechar = () => definirDialogo(undefined)
  const decidir = (texto: string) => {
    definirDecisao(texto)
    definirDialogo(undefined)
  }
  const justificativas = { minimo: TAMANHO_MINIMO_DA_JUSTIFICATIVA, maximo: TAMANHO_MAXIMO_DA_JUSTIFICATIVA }
  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {/* Depois de aprovar, o gatilho desliga: o foco não tem como voltar para ele, e vai para o resultado. */}
        <Botao variante="oficial" disabled={aprovado} onClick={() => definirDialogo('aprovar')}>
          Aprovar 32 correções
        </Botao>
        <Botao variante="perigo" onClick={() => definirDialogo('rejeitar')}>
          Rejeitar o lote
        </Botao>
        <Botao variante="perigo" onClick={() => definirDialogo('suspender')}>
          Suspender a função
        </Botao>
        <Botao variante="secundario" onClick={() => definirDialogo('andamento')}>
          Ver a confirmação em andamento
        </Botao>
        <Botao variante="secundario" onClick={() => definirDialogo('falha')}>
          Ver a confirmação com falha
        </Botao>
      </div>
      <p ref={resultado} tabIndex={-1} role="status" data-decisao="" className="min-h-6 text-sm text-sutil">
        {decisao}
      </p>
      {(dialogo === 'aprovar' || dialogo === 'andamento' || dialogo === 'falha') && (
        <DialogoDeConfirmacao
          familia="oficial"
          titulo="Aprovar 32 correções"
          resumo={RESUMO_DO_LOTE}
          efeito="O diagnóstico por habilidade chega aos alunos da turma."
          rotuloDeConfirmar="Aprovar 32 correções"
          rotuloConfirmando="Aprovando…"
          confirmando={dialogo === 'andamento'}
          {...(dialogo === 'falha' ? { falha: 'Não foi possível aprovar. Tente de novo em instantes.' } : {})}
          aoConfirmar={() => (dialogo === 'aprovar' ? decidir('Aprovado') : undefined)}
          aoFechar={fechar}
          focoDeReserva={() => resultado.current?.focus()}
        />
      )}
      {dialogo === 'rejeitar' && (
        <DialogoDeConfirmacao
          familia="perigo"
          titulo="Rejeitar 32 correções"
          resumo={RESUMO_DO_LOTE}
          efeito="Nenhum diagnóstico chega aos alunos, e o Assistente recebe o motivo."
          rotuloDeConfirmar="Rejeitar 32 correções"
          impedido={problemaDoTexto(justificativa, justificativas) !== undefined}
          aoConfirmar={() => decidir('Rejeitado')}
          aoFechar={fechar}
        >
          <CampoLongo rotulo="Motivo da rejeição" obrigatorio dica="De 8 a 500 caracteres. O Assistente usa o motivo para refazer." valor={justificativa} aoMudar={definirJustificativa} {...justificativas} />
        </DialogoDeConfirmacao>
      )}
      {dialogo === 'suspender' && (
        <DialogoDeConfirmacao
          familia="perigo"
          titulo="Suspender a correção de objetiva"
          resumo={[{ rotulo: 'Função', valor: 'Assistente · correção de objetiva' }]}
          efeito="O Assistente para de corrigir atividades nesta escola até a função ser retomada."
          aviso="A suspensão fica na auditoria da escola."
          rotuloDeConfirmar="Suspender a função"
          aoConfirmar={() => decidir('Suspensa')}
          aoFechar={fechar}
        />
      )}
    </>
  )
}

const COLUNAS_SEM_MENU: readonly [ColunaDaTabela<Registro>, ...ColunaDaTabela<Registro>[]] = [
  { chave: 'oQue', titulo: 'O quê', celula: (registro) => registro.oQue },
  { chave: 'funcao', titulo: 'Agente e função', celula: (registro) => <AssinaturaIA funcao={registro.funcao} /> },
  { chave: 'turma', titulo: 'Turma', celula: (registro) => registro.turma },
  { chave: 'estado', titulo: 'Aprovação', celula: (registro) => <LinhaAprovacao aprovacao={registro.aprovacao} espera="Esperando o professor" /> },
]

const COLUNAS: readonly [ColunaDaTabela<Registro>, ...ColunaDaTabela<Registro>[]] = [
  ...COLUNAS_SEM_MENU,
  {
    chave: 'acoes',
    titulo: 'Ações',
    alinhamento: 'fim',
    celula: (registro) => <Menu rotulo={`Ações de ${registro.oQue}`} icone={Ellipsis} soIcone variante="discreto" alinhamento="fim" itens={[{ id: 'abrir', rotulo: 'Abrir' }, { id: 'exportar', rotulo: 'Exportar em PDF', icone: FileDown }]} aoEscolher={() => undefined} />,
  },
]

export default function Galeria() {
  useTituloDaTela('Galeria de peças')
  const [aba, definirAba] = useState('visao-geral')
  const [turma, definirTurma] = useState('')
  const [acao, definirAcao] = useState('')
  const [escolha, definirEscolha] = useState<string | undefined>(undefined)
  const [demorando, definirDemorando] = useState(false)
  const [observacao, definirObservacao] = useState('')

  return (
    <main className="min-h-screen bg-fundo text-tinta">
      <Tela comMargem titulo="Galeria de peças" objeto descricao="As peças do MVP de apresentação, com dado inventado. Não é uma tela do produto." largura="formulario">
        <Secao nome="botoes" titulo="Botões">
          {TAMANHOS_DE_BOTAO.filter((tamanho) => tamanho !== 'icone').map((tamanho) => (
            <div key={tamanho} data-tamanho={tamanho} className="flex min-w-0 flex-wrap items-center gap-3">
              {VARIANTES_DE_BOTAO.map((variante) => (
                <Botao key={variante} variante={variante} tamanho={tamanho} data-variante={variante}>
                  {variante}
                </Botao>
              ))}
            </div>
          ))}
          <div data-tamanho="desligado" className="flex min-w-0 flex-wrap items-center gap-3">
            {VARIANTES_DE_BOTAO.map((variante) => (
              <Botao key={variante} variante={variante} disabled data-variante={variante}>
                {variante}
              </Botao>
            ))}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Botao variante="perigo" cheio>
              perigo cheio
            </Botao>
            <Menu rotulo="Menu desligado" itens={[{ id: 'nada', rotulo: 'Nada' }]} aoEscolher={() => undefined} desligado />
          </div>
        </Secao>

        <Secao nome="estado" titulo="Selo de estado">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Estado familia="pendente" />
            <Estado familia="ok">Aprovado</Estado>
            <Estado familia="erro">Rejeitado</Estado>
            <Estado familia="info">Faz e avisa</Estado>
          </div>
          <Faixa icone={Eye}>Seu professor acompanha como você usa o Tutor.</Faixa>
        </Secao>

        <Secao nome="painel" titulo="Número de painel e barra">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <NumeroPainel rotulo="Gerado por IA" valor={1412} />
            <NumeroPainel rotulo="Consumo do mês" valor="61%" apoio={<BarraRotulada rotulo="Do orçamento" valor={61} />} />
          </div>
          <Cartao titulo="Acerto por habilidade" nivel={3}>
            <div className="flex min-w-0 flex-col gap-4">
              <BarraRotulada rotulo="Cálculo estequiométrico" valor={72} detalhe="EM13CNT101 · 4 questões" />
              <BarraRotulada rotulo="Hoje" valor={12} maximo={60} texto="12 de 60 perguntas" />
            </div>
          </Cartao>
          <EstadoVazio variante="tracejado" icone={Inbox} titulo="Nenhuma correção aprovada ainda" descricao="O acerto por habilidade aparece aqui depois que você aprova a correção de uma atividade da turma." />
        </Secao>

        <Secao nome="abas" titulo="Abas">
          <Abas rotulo="Seções da turma" abas={ABAS} ativa={aba} aoMudar={definirAba}>
            <p className="text-apoio">Conteúdo de {ABAS.find((item) => item.id === aba)?.rotulo}.</p>
          </Abas>
          {/* A aba ativa que não existe na lista: a primeira continua alcançável pelo Tab. */}
          <div data-abas="sem-ativa">
            <Abas rotulo="Abas com a ativa fora da lista" abas={ABAS} ativa="aba-que-sumiu" aoMudar={() => undefined}>
              <p className="text-apoio">Escolha uma aba.</p>
            </Abas>
          </div>
        </Secao>

        <Secao nome="selecao-e-menu" titulo="Seleção e menu">
          <Selecao rotulo="Turma" obrigatoria marcador="Escolha a turma" opcoes={TURMAS} valor={turma} aoMudar={definirTurma} dica="A turma em que a atividade vai ser aplicada." />
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Menu
              rotulo="Ações da atividade"
              variante="discreto"
              itens={[
                { id: 'exportar', rotulo: 'Exportar em PDF', icone: FileDown },
                { id: 'adaptar', rotulo: 'Gerar versão adaptada', icone: SlidersHorizontal },
                { id: 'aplicar', rotulo: 'Aplicar à turma', descricao: 'Só depois de aprovada', desabilitado: true },
                { id: 'excluir', rotulo: 'Excluir', perigo: true },
              ]}
              aoEscolher={definirAcao}
            />
            {/* Um botão ao lado do menu, para o e2e provar que o toque fora do menu aberto só o fecha, sem acionar o vizinho. */}
            <Botao variante="secundario" tamanho="compacto" onClick={() => definirAcao('vizinho')}>
              Vizinho
            </Botao>
            <p role="status" data-acao="" className="text-sm text-sutil">
              {acao === '' ? '' : `Escolhido: ${acao}`}
            </p>
          </div>
          <CampoLongo rotulo="Observação" dica="Até 200 caracteres." valor={observacao} aoMudar={definirObservacao} maximo={200} />
        </Secao>

        <Secao nome="confirmacao" titulo="Diálogo de confirmação">
          <DemonstracaoDaConfirmacao />
        </Secao>

        <Secao nome="selo-de-ia" titulo="Selo de IA e assinatura">
          <div className="flex min-w-0 flex-wrap items-center gap-4">
            <AvatarAgente agente="assistente_de_ensino" tamanho={48} />
            <AvatarAgente agente="tutor" tamanho={32} />
            <AvatarAgente agente="analista_de_desempenho_escolar" />
            <SeloIA />
          </div>
          <AssinaturaIA agente="assistente_de_ensino" />
          <AssinaturaIA agente="tutor" />
          <AssinaturaIA agente="analista_de_desempenho_escolar" />
          <AssinaturaIA funcao="correcao_de_objetiva" />
          <div className="flex min-w-0 flex-col items-start gap-2">
            <LinhaAprovacao aprovacao={{ estado: 'aprovada', por: 'Camila Souza', quando: QUANDO }} />
            <LinhaAprovacao aprovacao={{ estado: 'pendente' }} />
            <LinhaAprovacao aprovacao={{ estado: 'rejeitada', por: 'Camila Souza', quando: QUANDO, motivo: 'A questão 3 não é do capítulo 7.' }} />
          </div>
        </Secao>

        <Secao nome="conversa" titulo="Conversa">
          <Conversa rotulo="Conversa com o Assistente de ensino" ocupada={demorando}>
            <MensagemPessoa>monta uma atividade de estequiometria pro 2ºB, dez questões</MensagemPessoa>
            <MensagemIA agente="assistente_de_ensino">
              <Escolha
                pergunta="Posso fazer isso com a ferramenta Atividade, ou só conversar."
                opcoes={[
                  { id: 'ferramenta', titulo: 'Usar a ferramenta Atividade', descricao: 'Salva na biblioteca, liga ao 2ºB e cita a página.', icone: LayoutGrid },
                  { id: 'conversa', titulo: 'Só conversar', descricao: 'Respondo aqui, sem salvar nada.', icone: MessageSquare },
                ]}
                escolhida={escolha}
                aoEscolher={definirEscolha}
              />
            </MensagemIA>
            <MensagemIA
              agente="assistente_de_ensino"
              aprovacao={{ aprovacao: { estado: 'aprovada', por: 'Camila Souza', quando: QUANDO }, verbo: 'Aprovada por' }}
              acoes={
                <>
                  <Botao variante="discreto" tamanho="compacto">
                    Copiar
                  </Botao>
                  <Botao variante="discreto" tamanho="compacto">
                    Exportar em PDF
                  </Botao>
                </>
              }
            >
              <TextoDaIA texto={TEXTO_DO_MODELO} citacoes={CITACOES} materiais={MATERIAIS} />
            </MensagemIA>
            <AvisoFila situacao="demora" />
            <AvisoFila situacao="falha" aoTentarDeNovo={() => undefined} />
            <MensagemIA
              variante="balao"
              funcao="correcao_de_objetiva"
              aprovacao={{ aprovacao: { estado: 'pendente' } }}
              acoes={
                <Botao variante="secundario" tamanho="compacto">
                  Revisar
                </Botao>
              }
            >
              Corrigi as 32 atividades de estequiometria do 2ºB. Há 5 casos para você abrir antes de aprovar.
            </MensagemIA>
            <MensagemIA variante="balao" funcao="sinais_para_o_professor">
              Oito alunos travaram na questão 3.
            </MensagemIA>
            <Pensando agente="tutor" demorando={demorando} />
          </Conversa>
          <div>
            <Botao variante="secundario" tamanho="compacto" onClick={() => definirDemorando((estava) => !estava)}>
              Simular a demora
            </Botao>
          </div>
        </Secao>

        <Secao nome="caixa-pedido" titulo="Caixa de pedido">
          <DemonstracaoDaCaixa variante="completa" />
        </Secao>

        <Secao nome="caixa-do-aluno" titulo="Caixa de pedido do aluno">
          <DemonstracaoDaCaixa variante="so-texto" />
        </Secao>

        <Secao nome="barra-presa" titulo="Barra presa embaixo">
          {/* A lista rola dentro desta caixa, e a barra é o último filho dela: gruda no pé e não cobre o último item. */}
          <div data-rolagem="" className="flex h-64 min-w-0 flex-col overflow-y-auto rounded-cartao border border-linha px-4">
            <ul className="flex min-w-0 flex-1 flex-col gap-2 py-4">
              {DESTAQUES.map((destaque) => (
                <li key={destaque} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-controle border border-linha p-3">
                  <span className="min-w-0 break-words">{destaque}</span>
                  {/* Um controle em cada item: é o que o Tab alcança no meio da lista, atrás de onde a barra está. */}
                  <Botao variante="secundario" tamanho="compacto">
                    Abrir
                  </Botao>
                </li>
              ))}
            </ul>
            <BarraPresa rotulo="Aprovação do lote" informacao="3 de 5 destaques abertos">
              <Botao variante="perigo">Rejeitar</Botao>
              <Botao variante="oficial" disabled>
                Aprovar 32 correções
              </Botao>
            </BarraPresa>
          </div>
        </Secao>

        <Secao nome="tabela" titulo="Tabela que vira lista">
          <Tabela rotulo="O que a IA gerou e quem aprovou" colunas={COLUNAS} linhas={REGISTROS} chaveDaLinha={(registro) => registro.id} />
          {/* A mesma tabela num lugar onde não cabe: aí, e só aí, a região que rola recebe foco. */}
          <div data-tabela-estreita="" className="max-w-[280px]">
            <Tabela rotulo="Tabela que não cabe" colunas={COLUNAS_SEM_MENU} linhas={REGISTROS} chaveDaLinha={(registro) => registro.id} />
          </div>
        </Secao>

        <Secao nome="pagina-mini" titulo="Página de origem">
          <PaginaMini citacao={PAGINA_142} materiais={MATERIAIS} />
        </Secao>

        <Secao nome="motor" titulo="Motor de formulário">
          <Cartao>
            <DemonstracaoDoMotor descricao={ATIVIDADE} />
          </Cartao>
        </Secao>

        <Secao nome="motor-da-adaptacao" titulo="Motor de formulário: Adaptação">
          <Cartao>
            <DemonstracaoDoMotor descricao={ADAPTACAO} />
          </Cartao>
        </Secao>
      </Tela>
    </main>
  )
}
