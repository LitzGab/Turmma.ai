import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Aviso, CampoSenha, CascaPublica, Titulo, useTituloDaAba } from './_casca'

/* O aceite do convite do professor (`/convite#token`), do produto real. A coordenação copiou o link (que aparece
   uma vez só) e mandou à pessoa. O token vem depois do `#` e sai da barra ao abrir, para não ficar no histórico.
   No mockup:
     /convite                              → endereço incompleto (sem token)
     /convite#vencido                      → convite que não vale mais (vencido, revogado ou já usado)
     /convite#qualquer-outra-coisa         → convite válido, conta nova: cria a senha
     /convite?conta=existente#token        → quem já tem conta em outra escola: só aceita
   Depois de entrar, o professor confirma (ou contesta) as turmas em Turmas (D3). */

type Situacao = 'incompleto' | 'vencido' | 'valido'
const ESPERA_MS = 600

export function AceitarConvite() {
  const local = useLocation()
  const navegar = useNavigate()
  useTituloDaAba('Convite')

  // Lido uma vez, ao abrir: depois o `#` sai da barra.
  const [situacao] = useState<Situacao>(() => {
    const token = local.hash.slice(1)
    return !token ? 'incompleto' : token === 'vencido' ? 'vencido' : 'valido'
  })
  const contaExistente = new URLSearchParams(local.search).get('conta') === 'existente'
  const [conferindo, setConferindo] = useState(true)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (local.hash) navegar({ pathname: local.pathname, search: local.search }, { replace: true })
  }, [local.hash, local.pathname, local.search, navegar])
  useEffect(() => {
    const t = window.setTimeout(() => setConferindo(false), ESPERA_MS)
    return () => window.clearTimeout(t)
  }, [])

  const rodape = situacao === 'valido' && !conferindo ? 'Colégio Aurora · Joinville, SC' : undefined

  if (conferindo) {
    return (
      <CascaPublica>
        <div role="status" className="flex items-center gap-3 text-base text-sutil">
          <Spinner className="size-5" role="presentation" aria-hidden aria-label={undefined} /> Conferindo o convite…
        </div>
      </CascaPublica>
    )
  }

  if (situacao !== 'valido') {
    return (
      <CascaPublica>
        <div className="animate-entra">
          <Titulo titulo="Convite" />
          <Aviso tipo="erro" className="mt-6">
            {situacao === 'incompleto'
              ? 'O endereço do convite está incompleto. Abra o link inteiro que a escola enviou, ou peça um convite novo.'
              : 'Este convite não vale mais. Peça outro à coordenação da sua escola.'}
          </Aviso>
          <p className="mt-6 text-[15px] leading-snug text-sutil">Já aceitou o convite? Entre com o seu e-mail e a sua senha.</p>
          <Button asChild variant="secundario" className="mt-3 h-12 w-full"><Link to="/entrar">Entrar</Link></Button>
        </div>
      </CascaPublica>
    )
  }

  const definir = (e: React.FormEvent) => {
    e.preventDefault()
    if (senha.length < 8) { setErro(senha ? 'A senha precisa de pelo menos 8 caracteres.' : 'Crie uma senha.'); return }
    navegar('/entrar', { state: { aviso: 'Senha criada. Entre com o seu e-mail e a senha que você acabou de criar.' } })
  }

  return (
    <CascaPublica rodape={rodape}>
      <div className="animate-entra">
        <Titulo titulo={<>Você foi convidado para entrar em <strong className="font-semibold">Colégio Aurora</strong>.</>}
          linha={contaExistente ? 'Você já tem conta no Turmma. Aceite para o Colégio Aurora entrar na sua conta.' : 'Crie a senha que você vai usar para entrar.'} />

        {contaExistente ? (
          <Button className="mt-7 h-12 w-full"
            onClick={() => navegar('/entrar', { state: { aviso: 'Convite aceito. Entre com a sua conta de sempre: o Colégio Aurora aparece no seletor de escola.' } })}>
            Aceitar o convite
          </Button>
        ) : (
          <form className="mt-7 grid gap-5" onSubmit={definir} noValidate>
            <CampoSenha rotulo="Senha nova" value={senha} autoComplete="new-password" autoFocus
              onChange={(e) => { setSenha(e.target.value); setErro('') }}
              erro={erro} dica="Pelo menos 8 caracteres. Use uma frase que só você saiba." />
            <Button type="submit" className="h-12 w-full">Definir a senha e continuar</Button>
          </form>
        )}
        <p className="mt-6 text-[15px] leading-snug text-sutil">Depois de entrar, confirme as turmas em que a coordenação alocou você.</p>
      </div>
    </CascaPublica>
  )
}
