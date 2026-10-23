(function () {
  const PRIMEIRA_CARTELA_MINIMA = 1;
  const NUMERO_MAXIMO_DE_CARTELA = 9999;
  const QUANTIDADE_MAXIMA = 500;
  const PRIMEIRA_PADRAO = 1;
  const QUANTIDADE_PADRAO = 40;
  const TITULO_PADRAO = 'Bingo';
  const LETRAS = ['B', 'I', 'N', 'G', 'O'];
  const DIGITOS_DO_NUMERO = 3;
  const LARGURA_DA_FOLHA_EM_PIXELS = 794;
  const MARGEM_DA_PREVIA_EM_PIXELS = 24;
  const CHAVE_DAS_PREFERENCIAS = 'bingo:cartelas';

  const campos = {
    formulario: document.getElementById('formulario'),
    titulo: document.getElementById('titulo'),
    subtitulo: document.getElementById('subtitulo'),
    primeira: document.getElementById('primeira'),
    quantidade: document.getElementById('quantidade'),
    porFolha: document.getElementById('por-folha'),
    cor: document.getElementById('cor'),
    nome: document.getElementById('nome'),
    resumo: document.getElementById('resumo'),
    folhas: document.getElementById('folhas'),
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

  function pluralizar(quantidade, singular, plural) {
    return `${quantidade} ${quantidade === 1 ? singular : plural}`;
  }

  function lerPreferencias() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_DAS_PREFERENCIAS)) || {};
    } catch (erro) {
      return {};
    }
  }

  function salvarPreferencias() {
    const preferencias = {
      titulo: campos.titulo.value,
      subtitulo: campos.subtitulo.value,
      porFolha: campos.porFolha.value,
      cor: campos.cor.value,
      nome: campos.nome.checked,
    };

    try {
      localStorage.setItem(CHAVE_DAS_PREFERENCIAS, JSON.stringify(preferencias));
    } catch (erro) {
      return;
    }
  }

  function aplicarPreferencias() {
    const preferencias = lerPreferencias();

    if (typeof preferencias.titulo === 'string') {
      campos.titulo.value = preferencias.titulo;
    }

    if (typeof preferencias.subtitulo === 'string') {
      campos.subtitulo.value = preferencias.subtitulo;
    }

    if (preferencias.porFolha === '1' || preferencias.porFolha === '2') {
      campos.porFolha.value = preferencias.porFolha;
    }

    if (preferencias.cor === 'colorida' || preferencias.cor === 'preto-e-branco') {
      campos.cor.value = preferencias.cor;
    }

    campos.nome.checked = preferencias.nome === true;
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
      subtitulo: campos.subtitulo.value.trim(),
      primeira,
      quantidade,
      porFolha: campos.porFolha.value === '1' ? 1 : 2,
      preto: campos.cor.value === 'preto-e-branco',
      comNome: campos.nome.checked,
    };
  }

  function montarCasa(valor) {
    if (valor !== GeradorCartela.CASA_LIVRE) {
      return criarElemento('div', 'casa', String(valor));
    }

    const casa = criarElemento('div', 'casa livre');
    casa.append(criarElemento('span', 'livre-estrela', '★'), criarElemento('span', 'livre-texto', 'LIVRE'));
    return casa;
  }

  function montarLetra(letra) {
    const elemento = criarElemento('div', 'letra', letra);
    elemento.dataset.letra = letra;
    return elemento;
  }

  function montarCabecalho(configuracao) {
    const cabecalho = criarElemento('header', 'cartela-cabecalho');
    cabecalho.append(criarElemento('h2', 'titulo', configuracao.titulo));

    if (configuracao.subtitulo) {
      cabecalho.append(criarElemento('p', 'subtitulo', configuracao.subtitulo));
    }

    return cabecalho;
  }

  function montarRodape(numero, configuracao) {
    const rodape = criarElemento('footer', 'cartela-rodape');
    rodape.append(criarElemento('p', 'numero-da-cartela', `Cartela nº ${formatarNumeroDaCartela(numero)}`));

    if (configuracao.comNome) {
      rodape.append(criarElemento('p', 'campo-nome', 'Nome:'));
    }

    return rodape;
  }

  function montarCartela(numero, configuracao) {
    const grade = criarElemento('div', 'grade');

    LETRAS.forEach((letra) => grade.append(montarLetra(letra)));
    GeradorCartela.gerar(numero).flat().forEach((valor) => grade.append(montarCasa(valor)));

    const cartela = criarElemento('article', 'cartela');
    cartela.append(montarCabecalho(configuracao), grade, montarRodape(numero, configuracao));
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

  function atualizarResumo(configuracao, totalDeFolhas) {
    const ultima = configuracao.primeira + configuracao.quantidade - 1;
    const faixa = `nº ${formatarNumeroDaCartela(configuracao.primeira)} a ${formatarNumeroDaCartela(ultima)}`;

    campos.resumo.textContent = [
      pluralizar(configuracao.quantidade, 'cartela', 'cartelas'),
      pluralizar(totalDeFolhas, 'folha', 'folhas'),
      faixa,
    ].join(' · ');
  }

  function gerarFolhas() {
    const configuracao = lerConfiguracao();
    document.body.classList.toggle('uma-por-folha', configuracao.porFolha === 1);
    document.body.classList.toggle('preto-e-branco', configuracao.preto);

    const numeros = Array.from(
      { length: configuracao.quantidade },
      (_, posicao) => configuracao.primeira + posicao
    );
    const folhas = [];

    for (let inicio = 0; inicio < numeros.length; inicio += configuracao.porFolha) {
      const cartelas = numeros
        .slice(inicio, inicio + configuracao.porFolha)
        .map((numero) => montarCartela(numero, configuracao));
      folhas.push(montarFolha(cartelas));
    }

    campos.folhas.replaceChildren(...folhas);
    atualizarResumo(configuracao, folhas.length);
  }

  function corrigirCampos() {
    const configuracao = lerConfiguracao();
    campos.primeira.value = configuracao.primeira;
    campos.quantidade.value = configuracao.quantidade;
    gerarFolhas();
  }

  function ajustarEscalaDaPrevia() {
    const disponivel = window.innerWidth - MARGEM_DA_PREVIA_EM_PIXELS;
    const escala = Math.min(1, disponivel / LARGURA_DA_FOLHA_EM_PIXELS);
    document.documentElement.style.setProperty('--escala-da-previa', String(escala));
  }

  function imprimir() {
    corrigirCampos();
    window.print();
  }

  function aoAlterarCampo() {
    salvarPreferencias();
    gerarFolhas();
  }

  campos.formulario.addEventListener('submit', (evento) => evento.preventDefault());
  campos.formulario.addEventListener('input', aoAlterarCampo);
  campos.formulario.addEventListener('change', () => {
    salvarPreferencias();
    corrigirCampos();
  });
  campos.botaoImprimir.addEventListener('click', imprimir);
  window.addEventListener('resize', ajustarEscalaDaPrevia);

  aplicarPreferencias();
  ajustarEscalaDaPrevia();
  gerarFolhas();
})();