const GeradorCartela = (function () {
  const COLUNAS = 5;
  const LINHAS = 5;
  const NUMEROS_POR_COLUNA = 15;
  const COLUNA_CENTRAL = 2;
  const LINHA_CENTRAL = 2;
  const CASA_LIVRE = 0;
  const MULTIPLICADOR_DA_SEMENTE = 2654435761;
  const MISTURA_DA_SEMENTE = 0x9e3779b9;
  const DESCARTES_INICIAIS = 8;
  const INCREMENTO_DO_SORTEADOR = 0x6d2b79f5;
  const LIMITE_DO_SORTEADOR = 4294967296;

  function criarSorteadorComSemente(semente) {
    let estado = semente;

    return function proximoNumero() {
      estado = (estado + INCREMENTO_DO_SORTEADOR) | 0;
      let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / LIMITE_DO_SORTEADOR;
    };
  }

  function criarSemente(numeroDaCartela) {
    return (Math.imul(numeroDaCartela, MULTIPLICADOR_DA_SEMENTE) ^ MISTURA_DA_SEMENTE) >>> 0;
  }

  function embaralhar(lista, sortear) {
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(sortear() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
  }

  function gerarColuna(indice, sortear) {
    const primeiroNumero = indice * NUMEROS_POR_COLUNA + 1;
    const faixa = Array.from({ length: NUMEROS_POR_COLUNA }, (_, posicao) => primeiroNumero + posicao);
    const ehColunaCentral = indice === COLUNA_CENTRAL;
    const quantidade = ehColunaCentral ? LINHAS - 1 : LINHAS;
    const escolhidos = embaralhar(faixa, sortear)
      .slice(0, quantidade)
      .sort((a, b) => a - b);

    if (ehColunaCentral) {
      escolhidos.splice(LINHA_CENTRAL, 0, CASA_LIVRE);
    }

    return escolhidos;
  }

  function gerar(numeroDaCartela) {
    const sortear = criarSorteadorComSemente(criarSemente(numeroDaCartela));

    for (let i = 0; i < DESCARTES_INICIAIS; i++) {
      sortear();
    }

    const colunas = Array.from({ length: COLUNAS }, (_, indice) => gerarColuna(indice, sortear));
    return Array.from({ length: LINHAS }, (_, linha) => colunas.map((coluna) => coluna[linha]));
  }

  function linhasPremiaveis(grade) {
    const indices = Array.from({ length: COLUNAS }, (_, indice) => indice);
    const verticais = indices.map((coluna) => grade.map((linha) => linha[coluna]));
    const diagonais = [
      indices.map((i) => grade[i][i]),
      indices.map((i) => grade[i][COLUNAS - 1 - i]),
    ];

    return [...grade, ...verticais, ...diagonais];
  }

  return { gerar, linhasPremiaveis, CASA_LIVRE };
})();