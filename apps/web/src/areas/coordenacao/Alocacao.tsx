import {
  CodigoDeErro,
  ESTADOS_DO_PROFESSOR_ALOCAVEIS,
  NOME_DA_CONTESTACAO,
  type EstadoDeVinculo,
  type EstadoDoProfessor,
  type MotivoDeEncerramentoDeVinculo,
  type VinculoDaCoordenacao,
} from '@educa/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState, type FormEvent } from 'react'
import { Link } from 'wouter'
import { alocarProfessor, CHAVE_DA_ESTRUTURA, consultaDisciplinas, consultaTurmas, consultaVinculos } from '../../api/estrutura'
import { consultaProfessores } from '../../api/professores'
import { ROTAS_DA_COORDENACAO } from '../../caminhos'
import { Botao } from '../../componentes/Botao'
import { CLASSES_DO_LINK_SECUNDARIO } from '../../componentes/botao-secundario'
import { AlertaDaFalha, Anuncio, useEnvioUnico } from '../../componentes/dialogos'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../componentes/estado'
import { CLASSES_DO_SELETOR } from '../../componentes/seletor'
import { textoDaFalha } from '../../componentes/texto-da-falha'
import { ordenarPeloNome, ordenarTurmas, ordenarVinculos } from './ordem'
import { descricaoDoQueFalta, oQueFaltaParaAlocar, tituloDoQueFalta } from './o-que-falta-para-alocar'

/** O estado do vínculo como a coordenação o lê: quem decide agora é o professor (regra 50, item 11: em texto). */
const ESTADO_PARA_A_COORDENACAO: Readonly<Record<EstadoDeVinculo, string>> = {
  pendente: 'Esperando o professor confirmar',
  confirmado: 'Confirmado pelo professor',
  contestado: 'Contestado pelo professor',
  encerrado: 'Encerrado',
}

const MOTIVO_DO_ENCERRAMENTO: Readonly<Record<MotivoDeEncerramentoDeVinculo, string>> = {
  fim_do_ano: 'fim do ano letivo',
  desligamento: 'desligamento',
  realocacao: 'realocação',
}

/** "7ºA · Matemática", ou só a turma quando o vínculo não tem disciplina. */
function turmaEDisciplina(vinculo: VinculoDaCoordenacao): string {
  return vinculo.disciplina === undefined ? vinculo.turma.nome : `${vinculo.turma.nome} · ${vinculo.disciplina.nome}`
}

/** O `select` da alocação ocupa a coluna inteira dele. */
const CLASSES_DO_SELETOR_DA_ALOCACAO = `w-full ${CLASSES_DO_SELETOR}`

/**
 * A alocação professor × turma × disciplina (A1, 13.0; RF8; W4, "Alocação"), dentro da Estrutura. O vínculo nasce
 * `pendente` e só dá acesso à turma depois de o professor confirmar (P2); a lista diz isso em texto.
 *
 * O professor com convite em aberto já pode ser alocado (decidido pelo Joaquim em 27/09/2026): a escolha oferece os de
 * `ESTADOS_DO_PROFESSOR_ALOCAVEIS`, e quem recusa o resto é a API, com o mesmo `NAO_ENCONTRADO` do inexistente. O
 * vencido e o revogado não aparecem: a tela Professores (14.0) refaz o convite.
 *
 * Os quatro estados: carregando; erro com "Tentar de novo"; vazio, sem turma, sem disciplina ou sem professor alocável,
 * que diz o que criar primeiro e leva à tela Professores quando é o professor que falta; e com dado, a escolha e os
 * vínculos.
 */
export function Alocacao({ anoEmCurso, anuncio, aoAnunciar }: { anoEmCurso: boolean; anuncio: string; aoAnunciar: (texto: string) => void }) {
  const idDoTitulo = useId()
  const cliente = useQueryClient()
  const turmas = useQuery({ ...consultaTurmas, enabled: anoEmCurso })
  const disciplinas = useQuery(consultaDisciplinas)
  const professores = useQuery(consultaProfessores)
  const vinculos = useQuery({ ...consultaVinculos, enabled: anoEmCurso })

  const consultas = [turmas, disciplinas, professores, vinculos]
  const falhou = consultas.find((consulta) => consulta.isError)

  function conteudo() {
    if (!anoEmCurso) return <p className="text-apoio">A alocação é do ano letivo em curso. Abra o ano letivo acima.</p>
    if (falhou !== undefined)
      return (
        <EstadoErro
          erro={falhou.error}
          tentando={consultas.some((consulta) => consulta.isFetching)}
          aoTentarDeNovo={() => {
            for (const consulta of consultas) if (consulta.isError) void consulta.refetch({ cancelRefetch: false })
          }}
        />
      )
    if (turmas.data === undefined || disciplinas.data === undefined || professores.data === undefined || vinculos.data === undefined)
      return <EstadoCarregando rotulo="Carregando a alocação…" />
    const alocaveis = professores.data.itens.filter((professor) => (ESTADOS_DO_PROFESSOR_ALOCAVEIS as readonly EstadoDoProfessor[]).includes(professor.estado))
    const faltam = oQueFaltaParaAlocar({ turmas: turmas.data.itens.length, disciplinas: disciplinas.data.itens.length, professores: alocaveis.length })
    if (faltam.length > 0) {
      // O vazio diz o que falta, no título e na descrição, e não só o que a alocação precisa: com a turma criada, pedir
      // "uma turma" de novo confunde. Quando falta o professor, o caminho até a tela dele vem junto.
      return (
        <>
          <EstadoVazio titulo={tituloDoQueFalta(faltam)} descricao={descricaoDoQueFalta(faltam)} />
          {faltam.includes('professor') && (
            <div>
              <Link to={ROTAS_DA_COORDENACAO.professores} className={CLASSES_DO_LINK_SECUNDARIO}>
                Ir para Professores
              </Link>
            </div>
          )}
        </>
      )
    }
    const nomes = new Map(professores.data.itens.map((professor) => [professor.usuarioId, professor.nome]))
    const nomeDoProfessor = (vinculo: VinculoDaCoordenacao) => nomes.get(vinculo.usuarioId) ?? 'Professor'
    return (
      <>
        <FormularioDeAlocacao
          professores={ordenarPeloNome(alocaveis)}
          turmas={ordenarTurmas(turmas.data.itens)}
          disciplinas={ordenarPeloNome(disciplinas.data.itens)}
          aoAnunciar={aoAnunciar}
          recarregar={() => cliente.invalidateQueries({ queryKey: CHAVE_DA_ESTRUTURA })}
        />
        {vinculos.data.itens.length === 0 ? (
          <p className="text-apoio">Nenhum professor alocado ainda. Escolha o professor, a turma e a disciplina acima.</p>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Professores alocados">
            {ordenarVinculos(vinculos.data.itens, nomeDoProfessor).map((vinculo) => (
              <li key={vinculo.id} className="min-w-0 rounded-cartao border border-linha bg-superficie p-4">
                <p className="font-medium break-words text-tinta">{nomeDoProfessor(vinculo)}</p>
                <p className="text-sm break-words text-apoio">{turmaEDisciplina(vinculo)}</p>
                <p className={`mt-1 text-sm break-words ${vinculo.estado === 'confirmado' ? 'text-ok' : vinculo.estado === 'encerrado' ? 'text-sutil' : 'text-pendente'}`}>
                  {ESTADO_PARA_A_COORDENACAO[vinculo.estado]}
                  {vinculo.contestacao !== undefined && `: ${NOME_DA_CONTESTACAO[vinculo.contestacao]}`}
                  {vinculo.motivoEncerramento !== undefined && ` (${MOTIVO_DO_ENCERRAMENTO[vinculo.motivoEncerramento]})`}
                </p>
                {vinculo.complemento !== undefined && <p className="mt-1 text-sm break-words text-apoio">Explicação do professor: {vinculo.complemento}</p>}
              </li>
            ))}
          </ul>
        )}
      </>
    )
  }

  return (
    <section aria-labelledby={idDoTitulo} className="flex min-w-0 flex-col gap-3">
      <h2 id={idDoTitulo} className="text-lg font-semibold text-tinta">
        Alocação
      </h2>
      <Anuncio texto={anuncio} />
      {conteudo()}
    </section>
  )
}

interface PropsDoFormulario {
  readonly professores: ReadonlyArray<{ usuarioId: string; nome: string; estado: EstadoDoProfessor }>
  readonly turmas: ReadonlyArray<{ id: string; nome: string }>
  readonly disciplinas: ReadonlyArray<{ id: string; nome: string }>
  /** O anúncio da alocação feita. Cada tentativa apaga o da anterior: o que ele dizia já não é o que está acontecendo. */
  readonly aoAnunciar: (texto: string) => void
  readonly recarregar: () => unknown
}

/**
 * A escolha do professor, da turma e da disciplina, e "Alocar". O que foi escolhido fica depois de alocar, para a
 * coordenação ligar o mesmo professor a outra turma sem escolher tudo de novo.
 *
 * A escolha só vale enquanto o item está na lista: o professor cujo convite venceu ou foi revogado com a tela aberta sai
 * da escolha quando a lista recarrega, e o "Alocar" seguinte pede a escolha de novo, em vez de mandar quem a API acabou
 * de recusar.
 */
function FormularioDeAlocacao({ professores, turmas, disciplinas, aoAnunciar, recarregar }: PropsDoFormulario) {
  const [usuarioId, definirUsuarioId] = useState('')
  const [turmaId, definirTurmaId] = useState('')
  const [disciplinaId, definirDisciplinaId] = useState('')
  const [faltando, definirFaltando] = useState(false)
  const escolhido = {
    usuarioId: professores.some((professor) => professor.usuarioId === usuarioId) ? usuarioId : '',
    turmaId: turmas.some((turma) => turma.id === turmaId) ? turmaId : '',
    disciplinaId: disciplinas.some((disciplina) => disciplina.id === disciplinaId) ? disciplinaId : '',
  }
  const campos = { professor: useId(), turma: useId(), disciplina: useId(), dica: useId() }
  const { enviar, mutacao } = useEnvioUnico({
    mutationFn: alocarProfessor,
    onSuccess: (vinculo) => {
      const professor = professores.find((opcao) => opcao.usuarioId === vinculo.usuarioId)?.nome ?? 'o professor'
      aoAnunciar(`Alocação feita: ${professor} em ${turmaEDisciplina(vinculo)}. A turma abre depois que quem foi alocado confirmar.`)
    },
    onSettled: recarregar,
  })

  function alocar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    aoAnunciar('')
    const completo = escolhido.usuarioId !== '' && escolhido.turmaId !== '' && escolhido.disciplinaId !== ''
    definirFaltando(!completo)
    if (completo) enviar({ ...escolhido, papel: 'professor' })
  }

  const falha = mutacao.isError
    ? textoDaFalha(mutacao.error, {
        [CodigoDeErro.CONFLITO]: 'Este professor já está alocado nesta turma e nesta disciplina.',
        [CodigoDeErro.NAO_ENCONTRADO]: 'O professor, a turma ou a disciplina mudou enquanto você escolhia. A tela foi atualizada: confira e tente de novo.',
      })
    : undefined

  return (
    <form onSubmit={alocar} noValidate className="flex min-w-0 flex-col gap-4 rounded-cartao border border-linha bg-superficie p-4">
      <p id={campos.dica} className="text-sm text-apoio">
        O professor com o convite em aberto já pode ser alocado. A turma só abre para ele depois que ele aceitar o convite e confirmar.
      </p>
      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={campos.professor} className="font-medium">
            Professor
          </label>
          <select id={campos.professor} aria-describedby={campos.dica} value={escolhido.usuarioId} onChange={(evento) => definirUsuarioId(evento.target.value)} className={CLASSES_DO_SELETOR_DA_ALOCACAO}>
            <option value="">Escolha o professor</option>
            {professores.map((professor) => (
              <option key={professor.usuarioId} value={professor.usuarioId}>
                {professor.estado === 'pendente' ? `${professor.nome} (convite em aberto)` : professor.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={campos.turma} className="font-medium">
            Turma
          </label>
          <select id={campos.turma} value={escolhido.turmaId} onChange={(evento) => definirTurmaId(evento.target.value)} className={CLASSES_DO_SELETOR_DA_ALOCACAO}>
            <option value="">Escolha a turma</option>
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={campos.disciplina} className="font-medium">
            Disciplina
          </label>
          <select id={campos.disciplina} value={escolhido.disciplinaId} onChange={(evento) => definirDisciplinaId(evento.target.value)} className={CLASSES_DO_SELETOR_DA_ALOCACAO}>
            <option value="">Escolha a disciplina</option>
            {disciplinas.map((disciplina) => (
              <option key={disciplina.id} value={disciplina.id}>
                {disciplina.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Um aviso por vez: sem a escolha completa nada foi enviado, e a falha do envio anterior já não vale. */}
      {faltando ? <AlertaDaFalha texto="Escolha o professor, a turma e a disciplina." /> : falha !== undefined && <AlertaDaFalha texto={falha} />}
      <div>
        <Botao type="submit" disabled={mutacao.isPending}>
          {mutacao.isPending ? 'Alocando…' : 'Alocar'}
        </Botao>
      </div>
    </form>
  )
}
