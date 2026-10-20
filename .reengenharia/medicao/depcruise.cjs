// Configuração de MEDIÇÃO da reengenharia (Etapa 4), fora do package.json. Não é trava: vira trava só na
// Etapa 7.6, se aprovada, com a dependência registrada em DECISOES.md.
// Uso (o depcruise precisa achar o typescript ao lado dele; npx puro não acha, ver LINHA-DE-BASE.md):
//   npm i --prefix <scratch>/dc --no-audit --no-fund dependency-cruiser@18.7.0 typescript@6.0.3
//   <scratch>/dc/node_modules/.bin/depcruise --config .reengenharia/medicao/depcruise.cjs --output-type json apps packages
module.exports = {
  forbidden: [
    { name: 'sem-ciclo', severity: 'error', from: {}, to: { circular: true } },
    { name: 'pacote-nao-importa-app', severity: 'error', from: { path: '^packages/' }, to: { path: '^apps/' } },
    {
      name: 'web-nao-importa-backend',
      severity: 'error',
      from: { path: '^apps/web/' },
      to: { path: '^(apps/(api|worker|realtime|despachante)|packages/nucleo)/' },
    },
    {
      name: 'producao-nao-importa-teste',
      severity: 'error',
      from: { path: '^(apps|packages)/[^/]+/src/', pathNot: '(\\.test\\.tsx?$|__fixtures__/)' },
      to: { path: '(/test/|__fixtures__/|\\.test\\.tsx?$)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(node_modules|/dist/)' }, // medido só em apps e packages
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      conditionNames: ['source', 'import', 'node', 'default'],
      exportsFields: ['exports'],
      mainFields: ['module', 'main', 'types'],
    },
  },
}
