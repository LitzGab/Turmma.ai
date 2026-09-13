// Modelo de segredo commitado por engano. O teste do gitleaks troca __SEGREDO_FALSO__ por um
// token no formato do GitHub, gerado aleatório na hora, e commita o resultado num repositório
// temporário. O valor nunca é gravado aqui: um token fixo neste arquivo seria, ele mesmo, um
// segredo commitado, e o push para o GitHub seria bloqueado.
export const clienteDoServico = {
  baseUrl: 'https://api.github.com',
  token: '__SEGREDO_FALSO__',
}
