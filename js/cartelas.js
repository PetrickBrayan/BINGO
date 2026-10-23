(function () {
  const PRIMEIRA_CARTELA_MINIMA = 1;
  const NUMERO_MAXIMO_DE_CARTELA = 9999;
  const QUANTIDADE_MAXIMA = 500;
  const PRIMEIRA_PADRAO = 1;
  const QUANTIDADE_PADRAO = 40;
  const TITULO_PADRAO = 'Bingo';
  const LETRAS = ['B', 'I', 'N', 'G', 'O'];
  const DIGITOS_DO_NUMERO = 3;

  const campos = {
    titulo: document.getElementById('titulo'),
    primeira: document.getElementById('primeira'),
    quantidade: document.getElementById('quantidade'),
    porFolha: document.getElementById('por-folha'),
    folhas: document.getElementById('folhas'),
    botaoGerar: document.getElementById('gerar'),
    botaoImprimir: document.getElementById('imprimir'),
  };

  function criarElemento(etiqueta, classe, texto) {
    const elemento = document.createElement(etiqueta);

    if (classe) {
      elemento.className = classe;
    }

    if (texto !== undefined) {
      elemento.textContent = texto;
    }

    return elemento;
  }

  function limitar(valor, minimo, maximo, padrao) {
    const numero = parseInt(valor, 10);
    const valido = Number.isNaN(numero) ? padrao : numero;
    return Math.max(minimo, Math.min(maximo, valido));
  }

  function formatarNumeroDaCartela(numero) {
    return String(numero).padStart(DIGITOS_DO_NUMERO, '0');
  }

  function montarCasa(valor) {
    if (valor === GeradorCartela.CASA_LIVRE) {
      return criarElemento('div', 'casa livre', 'LIVRE');
    }

    return criarElemento('div', 'casa', String(valor));
  }

  function montarCartela(numero, titulo) {
    const grade = criarElemento('div', 'grade');

    LETRAS.forEach((letra) => grade.append(criarElemento('div', 'letra', letra)));
    GeradorCartela.gerar(numero).flat().forEach((valor) => grade.append(montarCasa(valor)));

    const cartela = criarElemento('article', 'cartela');
    cartela.append(
      criarElemento('h2', 'titulo', titulo),
      grade,
      criarElemento('p', 'rodape', `Cartela nº ${formatarNumeroDaCartela(numero)}`)
    );

    return cartela;
  }

  function montarFolha(cartelas) {
    const folha = criarElemento('section', 'folha');

    cartelas.forEach((cartela, posicao) => {
      if (posicao > 0) {
        folha.append(criarElemento('hr', 'corte'));
      }
      folha.append(cartela);
    });

    return folha;
  }

  function lerConfiguracao() {
    const primeira = limitar(
      campos.primeira.value,
      PRIMEIRA_CARTELA_MINIMA,
      NUMERO_MAXIMO_DE_CARTELA,
      PRIMEIRA_PADRAO
    );
    const limiteDaQuantidade = Math.min(QUANTIDADE_MAXIMA, NUMERO_MAXIMO_DE_CARTELA - primeira + 1);
    const quantidade = limitar(campos.quantidade.value, 1, limiteDaQuantidade, QUANTIDADE_PADRAO);

    return {
      titulo: campos.titulo.value.trim() || TITULO_PADRAO,
      primeira,
      quantidade,
      porFolha: campos.porFolha.value === '1' ? 1 : 2,
    };
  }

  function gerarFolhas() {
    const configuracao = lerConfiguracao();
    campos.primeira.value = configuracao.primeira;
    campos.quantidade.value = configuracao.quantidade;
    document.body.classList.toggle('uma-por-folha', configuracao.porFolha === 1);

    const numeros = Array.from(
      { length: configuracao.quantidade },
      (_, posicao) => configuracao.primeira + posicao
    );
    const folhas = [];

    for (let inicio = 0; inicio < numeros.length; inicio += configuracao.porFolha) {
      const cartelas = numeros
        .slice(inicio, inicio + configuracao.porFolha)
        .map((numero) => montarCartela(numero, configuracao.titulo));
      folhas.push(montarFolha(cartelas));
    }

    campos.folhas.replaceChildren(...folhas);
  }

  function imprimir() {
    gerarFolhas();
    window.print();
  }

  campos.botaoGerar.addEventListener('click', gerarFolhas);
  campos.botaoImprimir.addEventListener('click', imprimir);
  gerarFolhas();
})();
