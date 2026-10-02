import type { ProfessorDaEscola } from '@educa/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { consultaProfessores, mutacaoDoCadastroDeProfessor, mutacaoDoRefazerConviteDoProfessor, revogarConviteDoProfessor } from '../../api/professores'
import { aoTrocarDeSessao } from '../../api/sessao'
import { Botao } from '../../componentes/Botao'
import { CLASSES_DO_BOTAO_PERIGO, CLASSES_DO_BOTAO_SECUNDARIO } from '../../componentes/botao-secundario'
import { Dialogo } from '../../componentes/Dialogo'
import { useDialogoDaTela } from '../../componentes/dialogo-aberto'
import { DialogoDeConviteNovo, DialogoDeConviteRefeito } from '../../componentes/DialogoDoConvite'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { useTituloDaTela } from '../../titulo'
import {
  acoesDoConviteDeProfessor,
  falhaDoCadastroDeProfessor,
  falhaDoRefazerConviteDeProfessor,
  pedidoDeProfessor,
  temHomonimo,
  TEXTO_DA_VALIDADE_DO_CONVITE,
  TEXTO_DO_ESTADO_DO_PROFESSOR,
  TEXTO_DO_LINK_UMA_VEZ,
  TEXTO_DO_NOME_REPETIDO,
  TEXTOS_DO_CONVITE_QUE_MUDOU,
} from './convite-de-professor'
import { Anuncio, ConfirmacaoDePerigo } from './dialogos'
import { ordenarPeloNome } from './ordem'
import { AvisoDeListaIncompleta, Linha } from './pecas-da-lista'

/** Os diálogos da tela, um por vez. O refazer e o revogar levam o professor da linha, fotografado na abertura. */
type TipoDeDialogo = 'cadastrar' | 'refazer' | 'revogar'
type ProfessorDaLinha = Pick<ProfessorDaEscola, 'usuarioId' | 'nome'>

/** A etapa do link e a pergunta de fechar, com quem entra pelo convite da coordenação. */
const TEXTOS_DO_LINK = { validade: TEXTO_DA_VALIDADE_DO_CONVITE, quemEntra: 'a pessoa convidada' } as const

/**
 * A quem mandar o link, na etapa do link: a pessoa, pelo nome que a coordenação digitou. No cadastro vai também o e-mail
 * com que ela entra, que a tela do convite e a entrada não dizem; no refazer não vai, porque a lista não traz e-mail.
 */
function mandeOLinkA(nome: string, email?: string) {
  return (
    <>
      Mande o link a <span className="font-medium text-tinta wrap-anywhere">{nome}</span>
      {email !== undefined && (
        <>
          , que entra com o e-mail <span className="font-medium text-tinta wrap-anywhere">{email}</span>
        </>
      )}
      .
    </>
  )
}

/**
 * Professores (A1, 14.0; `docs/interface.md` 3 e 11.1; RF6): a coordenação cadastra o professor com o nome e o e-mail de
 * login, copia o link do convite, que aparece uma vez, e refaz ou revoga o convite em aberto. Não há envio de e-mail: o
 * link sai da escola pela mão da coordenação.
 *
 * Os quatro estados (W4): carregando; erro com "Tentar de novo"; vazio, "Nenhum professor ainda", com o Cadastrar; e com
 * dado, a lista pelo nome, com o estado do convite em texto e só as ações que o estado permite (as matrizes de
 * `@educa/shared`, as mesmas do servidor). A lista não traz e-mail nem diz se a conta do e-mail já existia (E11).
 *
 * O diálogo do convite é o de `componentes/DialogoDoConvite.tsx`, o mesmo da operação: o link vive só na mutação da
 * abertura que o pediu, sai do cache ao fechar (`gcTime: 0` e `reset()`), e fechar sem copiar pergunta antes. Quando a
 * sessão desta aba deixa de ser a mesma — venceu, ou outra pessoa entrou —, o diálogo aberto sai com o link: ele é
 * credencial do professor, e não fica na tela atrás do login por cima (regra 20, item 8).
 */
export function Professores() {
  useTituloDaTela('Professores')
  const cliente = useQueryClient()
  const professores = useQuery(consultaProfessores)
  const dialogo = useDialogoDaTela<TipoDeDialogo, ProfessorDaLinha>()
  const aberta = dialogo.aberta
  const fechar = dialogo.fechar
  // O professor da linha, fotografado na abertura: os diálogos de refazer e de revogar só existem com ele.
  const alvo = aberta?.alvo
  const [anuncio, definirAnuncio] = useState('')
  const idDoTitulo = useId()
  const tituloDaTela = useRef<HTMLHeadingElement>(null)
  const tituloDaLista = useRef<HTMLHeadingElement>(null)

  const recarregar = useCallback(() => cliente.invalidateQueries({ queryKey: consultaProfessores.queryKey }), [cliente])
  // O foco quando o botão que abriu o diálogo saiu da tela: o "Cadastrar" do vazio, ou a ação que o estado novo não tem.
  // Sem a lista na tela (a releitura caiu com ela ainda vazia), vai para o título da tela, e não para o `body`.
  const focarNaLista = useCallback(() => (tituloDaLista.current ?? tituloDaTela.current)?.focus(), [])

  useEffect(() => aoTrocarDeSessao(fechar), [fechar])

  /** Abrir um diálogo apaga o anúncio da ação anterior: o que ele dizia já não é o que a pessoa está fazendo. */
  function abrir(tipo: TipoDeDialogo, professor?: ProfessorDaLinha): void {
    definirAnuncio('')
    dialogo.abrir(tipo, professor)
  }

  const dados = professores.data
  const erroDaLeitura = <EstadoErro erro={professores.error} tentando={professores.isFetching} aoTentarDeNovo={() => void professores.refetch({ cancelRefetch: false })} />

  return (
    <section className="flex min-w-0 flex-col gap-6" aria-labelledby={idDoTitulo}>
      <h1 ref={tituloDaTela} id={idDoTitulo} tabIndex={-1} className="sr-only">
        Professores
      </h1>

      {professores.isPending ? (
        <EstadoCarregando rotulo="Carregando os professores…" />
      ) : dados === undefined ? (
        erroDaLeitura
      ) : dados.itens.length === 0 ? (
        // A releitura que cai com a lista ainda vazia (logo depois do primeiro cadastro) não afirma o vazio: a lista de
        // antes já não vale, e "Nenhum professor ainda" negaria o cadastro que acabou de acontecer.
        professores.isError ? (
          erroDaLeitura
        ) : (
          <EstadoVazio
            titulo="Nenhum professor ainda"
            descricao="Cadastre cada professor com o nome e o e-mail dele. O link do convite aparece uma vez, para você copiar e mandar; a pessoa abre o link e cria a senha."
            acao={{ rotulo: 'Cadastrar professor', aoAcionar: () => abrir('cadastrar') }}
          />
        )
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 ref={tituloDaLista} tabIndex={-1} className="text-lg font-semibold text-tinta">
              Professores da escola
            </h2>
            <Botao onClick={() => abrir('cadastrar')}>Cadastrar professor</Botao>
          </div>
          <Anuncio texto={anuncio} />
          {professores.isError && erroDaLeitura}
          <ul className="flex flex-col gap-3" aria-label="Professores da escola">
            {ordenarPeloNome(dados.itens).map((professor) => (
              <Linha key={professor.usuarioId} titulo={professor.nome} detalhe={TEXTO_DO_ESTADO_DO_PROFESSOR[professor.estado]}>
                {acoesDoConviteDeProfessor(professor.estado).map((acao) =>
                  acao === 'refazer' ? (
                    <button key={acao} type="button" onClick={() => abrir('refazer', professor)} className={CLASSES_DO_BOTAO_SECUNDARIO}>
                      Refazer<span className="sr-only"> o convite de {professor.nome}</span>
                    </button>
                  ) : (
                    <button key={acao} type="button" onClick={() => abrir('revogar', professor)} className={CLASSES_DO_BOTAO_PERIGO}>
                      Revogar<span className="sr-only"> o convite de {professor.nome}</span>
                    </button>
                  ),
                )}
              </Linha>
            ))}
          </ul>
          <AvisoDeListaIncompleta completa={dados.completa} />
        </>
      )}

      {/* O cadastro e o refazer não fecham sozinhos: a resposta deles só preenche o diálogo que a pediu. */}
      {aberta?.tipo === 'cadastrar' && (
        <DialogoDeConviteNovo
          key={aberta.numero}
          Moldura={Dialogo}
          titulo="Cadastrar professor"
          apresentacao="O nome e o e-mail com que a pessoa vai entrar. Você copia o link do convite e manda a ela, que cria a senha ao abrir."
          rotulos={{ nome: 'Nome do professor', email: 'E-mail do professor' }}
          validar={pedidoDeProfessor}
          tituloDaRevisao="Confira antes de cadastrar"
          resumo={(pedido) => [
            { rotulo: 'Nome do professor', valor: pedido.nome },
            { rotulo: 'E-mail', valor: pedido.email },
          ]}
          avisos={[TEXTO_DA_VALIDADE_DO_CONVITE, TEXTO_DO_LINK_UMA_VEZ]}
          avisosDoPedido={(pedido) => (temHomonimo(dados?.itens ?? [], pedido.nome) ? [TEXTO_DO_NOME_REPETIDO] : [])}
          acao={{ confirmar: 'Cadastrar e gerar o link', confirmando: 'Cadastrando…', anuncio: 'Cadastrando o professor…' }}
          // A lista muda, dê certo ou não. As opções são as de `api/professores.ts`, sem nada por cima: é lá que o
          // `gcTime: 0` tira o token do cache.
          mutacao={mutacaoDoCadastroDeProfessor(recarregar)}
          falha={falhaDoCadastroDeProfessor}
          mandePara={(pedido) => mandeOLinkA(pedido.nome, pedido.email)}
          link={TEXTOS_DO_LINK}
          aoFechar={fechar}
          focoDeReserva={focarNaLista}
        />
      )}
      {aberta?.tipo === 'refazer' && alvo !== undefined && (
        <DialogoDeConviteRefeito
          key={aberta.numero}
          Moldura={Dialogo}
          titulo="Refazer o convite"
          confirmacao={
            <>
              Um link novo para <span className="font-medium text-tinta wrap-anywhere">{alvo.nome}</span>. O link mandado antes para de valer na hora.
            </>
          }
          avisos={[TEXTO_DA_VALIDADE_DO_CONVITE, TEXTO_DO_LINK_UMA_VEZ]}
          acao={{ confirmar: 'Refazer convite', confirmando: 'Refazendo…', anuncio: 'Refazendo o convite…' }}
          mutacao={mutacaoDoRefazerConviteDoProfessor(alvo.usuarioId, recarregar)}
          falha={falhaDoRefazerConviteDeProfessor}
          mandePara={mandeOLinkA(alvo.nome)}
          link={TEXTOS_DO_LINK}
          aoFechar={fechar}
          focoDeReserva={focarNaLista}
        />
      )}
      {aberta?.tipo === 'revogar' && alvo !== undefined && (
        <ConfirmacaoDePerigo
          key={aberta.numero}
          titulo="Revogar o convite"
          texto={
            <>
              O convite de <span className="font-medium text-tinta wrap-anywhere">{alvo.nome}</span> deixa de valer na hora: o link mandado não entra mais. As
              turmas já alocadas a essa pessoa continuam esperando. Para convidar de novo, cadastre o mesmo e-mail.
            </>
          }
          rotuloDaAcao="Revogar convite"
          rotuloEmAndamento="Revogando…"
          acao={() => revogarConviteDoProfessor(alvo.usuarioId)}
          aoFechar={fechar}
          aoConcluir={() => {
            definirAnuncio(`Convite de ${alvo.nome} revogado.`)
            dialogo.fecharSeAinda(aberta)
          }}
          aoTerminar={recarregar}
          textosDaFalha={TEXTOS_DO_CONVITE_QUE_MUDOU}
          focoDeReserva={focarNaLista}
        />
      )}
    </section>
  )
}
