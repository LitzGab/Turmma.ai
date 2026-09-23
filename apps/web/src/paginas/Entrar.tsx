import { CodigoDeErro, mensagemDaEntrada, TAMANHO_MAXIMO_EMAIL, TAMANHO_MAXIMO_SENHA } from '@educa/shared'
import { useId, useState, type FormEvent } from 'react'
import { useLocation } from 'wouter'
import { ErroDaApi } from '../api/cliente'
import { avisoDaEntrada, entrarPorEmail, saidaPendente } from '../api/sessao'
import { Botao } from '../componentes/Botao'
import { ROTA_DA_ETAPA } from '../caminhos'

/** A mensagem que a tela mostra para uma falha da entrada, sempre pelo código e nunca pelo status (regra 50, item 12). */
function mensagemDaFalha(erro: unknown): string {
  return erro instanceof ErroDaApi ? mensagemDaEntrada(erro.codigo, erro.esperaSegundos) : mensagemDaEntrada(CodigoDeErro.ERRO_INTERNO)
}

/**
 * A entrada da equipe por e-mail e senha (RF6). Coluna única a partir de 360 px, rótulo visível em cada campo e
 * botão principal de 44 px (regra 50, itens 2a e 11).
 *
 * Os quatro estados aqui são três: carregando é o "Entrando…" do botão, que também cobre o 503 do semáforo repetido
 * pela web; erro é a mensagem que diz o que fazer; e "com dado" é ter entrado. Não há estado vazio: o formulário é a
 * própria tela, e nada é buscado antes de a pessoa enviá-lo.
 */
export function Entrar() {
  const [, navegar] = useLocation()
  const [email, definirEmail] = useState('')
  const [senha, definirSenha] = useState('')
  const [entrando, definirEntrando] = useState(false)
  const [falha, definirFalha] = useState<unknown>(undefined)
  const campoEmail = useId()
  const campoSenha = useId()

  async function enviar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    if (entrando) return
    definirEntrando(true)
    definirFalha(undefined)
    try {
      const resposta = await entrarPorEmail({ email, senha })
      // A senha sai da memória da tela assim que a resposta chega, em qualquer etapa.
      definirSenha('')
      // Sem `replace`: o Voltar do navegador leva à entrada, que com sessão aberta devolve à área autenticada.
      navegar(ROTA_DA_ETAPA[resposta.etapa])
    } catch (erro) {
      definirFalha(erro)
    } finally {
      definirEntrando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <p className="mx-auto max-w-5xl px-4 py-3 text-lg font-semibold sm:px-6">Educa.ia</p>
      </header>
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-6 sm:px-6">
        <h1 className="text-xl font-semibold sm:text-2xl">Entrar</h1>
        {/* A saída que a API não confirmou não pode passar por saída feita: o cookie de renovação ainda vale, e quem
            ficar neste computador volta à sessão anterior. */}
        {saidaPendente() && (
          <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
            Não foi possível encerrar a sessão anterior neste computador. Entre e saia de novo, ou feche o navegador
            antes de deixar a máquina.
          </p>
        )}
        {/* O que trouxe a pessoa de volta para cá: o segundo fator que gastou o desafio, ou o convite aceito por uma
            conta que já existe. Vive só em memória, como o aviso de saída não confirmada. */}
        {avisoDaEntrada() !== undefined && (
          <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
            {avisoDaEntrada()}
          </p>
        )}
        <p className="text-slate-700">Use o e-mail e a senha que a sua escola cadastrou.</p>
        <form className="flex flex-col gap-4" onSubmit={(evento) => void enviar(evento)}>
          <div className="flex flex-col gap-1">
            <label htmlFor={campoEmail} className="font-medium">
              E-mail
            </label>
            <input
              id={campoEmail}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={TAMANHO_MAXIMO_EMAIL}
              value={email}
              onChange={(evento) => definirEmail(evento.target.value)}
              className="min-h-11 rounded-md border border-slate-400 bg-white px-3 py-2 text-base"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={campoSenha} className="font-medium">
              Senha
            </label>
            <input
              id={campoSenha}
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              maxLength={TAMANHO_MAXIMO_SENHA}
              value={senha}
              onChange={(evento) => definirSenha(evento.target.value)}
              className="min-h-11 rounded-md border border-slate-400 bg-white px-3 py-2 text-base"
            />
          </div>
          {falha !== undefined && (
            <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
              {mensagemDaFalha(falha)}
            </p>
          )}
          <Botao type="submit" disabled={entrando} className="w-full">
            {entrando ? 'Entrando…' : 'Entrar'}
          </Botao>
          {/* O "Entrando…" também é anunciado a quem usa leitor de tela: no 503 da rajada das 7h30 a espera passa de um segundo. */}
          <span role="status" className="sr-only">
            {entrando ? 'Entrando…' : ''}
          </span>
        </form>
      </main>
    </div>
  )
}
