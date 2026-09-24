import {
  AVISO_DO_CONVITE_PARA_CONTA_EXISTENTE,
  CodigoDeErro,
  mensagemDoConvite,
  TAMANHO_MAXIMO_SENHA,
  TAMANHO_MAXIMO_TOKEN_DE_CONVITE,
  TAMANHO_MINIMO_SENHA_NOVA,
} from '@educa/shared'
import { useEffect, useState, type FormEvent } from 'react'
import { useLocation } from 'wouter'
import { aceitarConvite, consultarConvite } from '../api/convite'
import { ErroDaApi } from '../api/cliente'
import { definirAvisoDaEntrada } from '../api/sessao'
import { ROTAS } from '../caminhos'
import { Botao } from '../componentes/Botao'
import { Campo } from '../componentes/Campo'
import { CascaPublica } from '../componentes/CascaPublica'
import { EstadoCarregando } from '../componentes/estado'

/**
 * O token do convite, lido do fragmento `#` e tirado da barra antes de qualquer chamada (regra 20, item 8; Tech Spec,
 * seção 5, "Convite").
 *
 * O fragmento nunca é mandado ao servidor pelo navegador, e por isso é onde o token do link vive; mas ele fica no
 * histórico do computador da escola, e é isso que o `history.replaceState` resolve. O token some da barra, do botão
 * Voltar e de qualquer captura de tela feita depois.
 */
function tokenDoFragmento(): string | undefined {
  const bruto = window.location.hash.replace(/^#/, '')
  const token = decodeURIComponent(bruto).trim()
  return token === '' || token.length > TAMANHO_MAXIMO_TOKEN_DE_CONVITE ? undefined : token
}

/** Tira o fragmento da barra, sem recarregar e sem entrada nova no histórico. */
function apagarFragmentoDaBarra(): void {
  if (window.location.hash !== '') window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

type Etapa =
  | { readonly nome: 'sem-token' }
  | { readonly nome: 'consultando'; readonly token: string }
  | { readonly nome: 'confirmar'; readonly token: string; readonly escolaNome: string }
  | { readonly nome: 'definir-senha'; readonly token: string; readonly escolaNome: string }
  | { readonly nome: 'invalido'; readonly codigo: CodigoDeErro }

/**
 * O aceite do convite do primeiro coordenador (RF1, RF12, RF20), em três passos:
 *
 * 1. **consultar**, que mostra o nome da escola que convida e nada da pessoa;
 * 2. **aceitar sem senha**, que a API recusa com `ENTRADA_INVALIDA` quando a conta é nova, **sem gastar o convite**,
 *    ou aceita e responde `entrar` quando a conta já existe;
 * 3. **aceitar com a senha nova**, só no caso da conta nova, que leva à configuração do segundo fator.
 *
 * Quem já tem conta (trabalha em outra escola cliente) nunca vê campo de senha nova: o link não troca a senha de uma
 * conta existente, e o que falta é entrar com a senha que ela já tem.
 */
export function Convite() {
  const [, navegar] = useLocation()
  // O token é lido na primeira renderização, e o efeito tira o fragmento da barra antes de qualquer chamada sair.
  const [token] = useState(tokenDoFragmento)
  const [etapa, definirEtapa] = useState<Etapa>(token === undefined ? { nome: 'sem-token' } : { nome: 'consultando', token })
  const [aceitando, definirAceitando] = useState(false)
  const [falha, definirFalha] = useState<unknown>(undefined)

  useEffect(() => {
    apagarFragmentoDaBarra()
    if (token === undefined) return undefined
    let atual = true
    consultarConvite(token).then(
      (resposta) => atual && definirEtapa({ nome: 'confirmar', token, escolaNome: resposta.escolaNome }),
      (erro: unknown) => atual && definirEtapa({ nome: 'invalido', codigo: erro instanceof ErroDaApi ? erro.codigo : CodigoDeErro.ERRO_INTERNO }),
    )
    return () => {
      atual = false
    }
  }, [token])

  /** O aceite, com ou sem a senha nova. Sem senha é o que descobre, sem gastar o convite, se a conta já existe. */
  async function aceitar(token: string, escolaNome: string, senha?: string): Promise<void> {
    if (aceitando) return
    definirAceitando(true)
    definirFalha(undefined)
    try {
      const resposta = await aceitarConvite(senha === undefined ? { token } : { token, senha })
      if (resposta.etapa === 'entrar') {
        // O bilhete ficou na memória desta aba e vai no próximo login por e-mail: é ele que ativa o acesso à escola
        // que convidou, depois da senha e do segundo fator que a conta já tem.
        definirAvisoDaEntrada(AVISO_DO_CONVITE_PARA_CONTA_EXISTENTE)
        navegar(ROTAS.entrar, { replace: true })
        return
      }
      navegar(ROTAS.configurarMfa, { replace: true })
    } catch (erro) {
      // Conta nova: a API recusa o aceite sem senha e não gasta o convite. Agora dá para pedir a senha com segurança.
      if (senha === undefined && erro instanceof ErroDaApi && erro.codigo === CodigoDeErro.ENTRADA_INVALIDA) {
        definirEtapa({ nome: 'definir-senha', token, escolaNome })
        return
      }
      definirFalha(erro)
    } finally {
      definirAceitando(false)
    }
  }

  if (etapa.nome === 'consultando') {
    return (
      <CascaPublica titulo="Convite">
        <EstadoCarregando rotulo="Conferindo o convite…" />
      </CascaPublica>
    )
  }

  if (etapa.nome === 'sem-token' || etapa.nome === 'invalido') {
    return (
      <CascaPublica titulo="Convite">
        <p role="alert" className="rounded-controle border border-pendente bg-pendente-cx p-4 text-pendente">
          {etapa.nome === 'sem-token'
            ? 'O endereço do convite está incompleto. Abra o link inteiro que a escola enviou, ou peça um convite novo.'
            : mensagemDoConvite(etapa.codigo)}
        </p>
      </CascaPublica>
    )
  }

  return (
    <CascaPublica titulo="Convite">
      <p className="text-apoio">
        Você foi convidado para a coordenação de <span className="font-medium text-tinta">{etapa.escolaNome}</span>.
      </p>
      {falha !== undefined && (
        <p role="alert" className="rounded-controle border border-erro bg-erro-cx p-4 text-erro">
          {falha instanceof ErroDaApi ? mensagemDoConvite(falha.codigo) : mensagemDoConvite(CodigoDeErro.ERRO_INTERNO)}
        </p>
      )}
      {etapa.nome === 'confirmar' ? (
        <>
          <Botao onClick={() => void aceitar(etapa.token, etapa.escolaNome)} disabled={aceitando} className="w-full">
            {aceitando ? 'Aceitando…' : 'Aceitar o convite'}
          </Botao>
          <span role="status" className="sr-only">
            {aceitando ? 'Aceitando…' : ''}
          </span>
        </>
      ) : (
        <SenhaNova
          escolaNome={etapa.escolaNome}
          aceitando={aceitando}
          aoEnviar={(senha) => void aceitar(etapa.token, etapa.escolaNome, senha)}
        />
      )}
    </CascaPublica>
  )
}

/** A senha nova, pedida só depois de a API dizer que a conta é nova. */
function SenhaNova({ escolaNome, aceitando, aoEnviar }: { escolaNome: string; aceitando: boolean; aoEnviar: (senha: string) => void }) {
  const [senha, definirSenha] = useState('')

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    aoEnviar(senha)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={enviar}>
      <p className="text-apoio">Defina a senha que você vai usar em {escolaNome}. Depois dela, você configura o segundo fator.</p>
      <Campo
        rotulo="Senha nova"
        dica={`Pelo menos ${String(TAMANHO_MINIMO_SENHA_NOVA)} caracteres. Use uma frase que só você saiba.`}
        name="senha"
        type="password"
        autoComplete="new-password"
        required
        minLength={TAMANHO_MINIMO_SENHA_NOVA}
        maxLength={TAMANHO_MAXIMO_SENHA}
        value={senha}
        onChange={(evento) => definirSenha(evento.target.value)}
      />
      <Botao type="submit" disabled={aceitando} className="w-full">
        {aceitando ? 'Salvando…' : 'Definir a senha e continuar'}
      </Botao>
      <span role="status" className="sr-only">
        {aceitando ? 'Salvando…' : ''}
      </span>
    </form>
  )
}
