import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration } from 'react-router-dom'
import { Casca } from '@/components/turmma/Casca'
import { Mapa } from '@/areas/Mapa'
import { PecasConvite } from '@/areas/PecasConvite'
import { PecasIcones } from '@/areas/PecasIcones'
import { rotasEntrada } from '@/areas/entrada/rotas'
import { rotasProfessor } from '@/areas/professor/rotas'
import { rotasAluno } from '@/areas/aluno/rotas'
import { rotasCoordenacao } from '@/areas/coordenacao/rotas'
import { rotasOutras } from '@/areas/outras/rotas'

function Raiz() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  )
}

const router = createBrowserRouter([
  {
    element: <Raiz />,
    children: [
      { path: '/', element: <Mapa /> },
      { path: '/pecas/icones', element: <PecasIcones /> },
      { path: '/pecas/convite', element: <PecasConvite /> },
      ...rotasEntrada,
      { path: '/professor', element: <Casca papel="professor" />, children: rotasProfessor },
      { path: '/aluno', element: <Casca papel="aluno" />, children: rotasAluno },
      { path: '/coordenacao', element: <Casca papel="coordenacao" />, children: rotasCoordenacao },
      ...rotasOutras,
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
