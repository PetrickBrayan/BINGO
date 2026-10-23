(function () {
  const LETRAS = ['B', 'I', 'N', 'G', 'O'];
  const LETRAS_FALADAS = ['Bê', 'I', 'Ene', 'Gê', 'Ó'];
  const ALGARISMOS_POR_EXTENSO = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const TOTAL_DE_NUMEROS = 75;
  const NUMEROS_POR_LETRA = 15;
  const ANTERIORES_EXIBIDOS = 5;
  const DURACAO_DA_ROLETA_MS = 1100;
  const PASSO_DA_ROLETA_MS = 70;
  const INTERVALO_ENTRE_SORTEIOS_MS = 2500;
  const TEMPO_DOS_COMANDOS_MS = 3000;
  const TEMPO_DO_AVISO_MS = 1500;
  const VELOCIDADE_DA_VOZ = 0.8;
  const VOLUME_DA_VOZ = 1;
  const IDIOMA_DA_VOZ = 'pt-BR';
  const VOZES_PREFERIDAS = ['francisca', 'antonio', 'google', 'luciana'];
  const ESCALA_PADRAO = 0.9;
  const ESCALA_MINIMA = 0.7;
  const ESCALA_MAXIMA = 1;
  const PASSO_DA_ESCALA = 0.1;
  const NUMERO_MAXIMO_DE_CARTELA = 9999;
  const EXPRESSAO_DE_CARTELA = /^\s*#\s*(\d+)\s*$/;
  const MENSAGEM_DE_REINICIO = 'Reiniciar o bingo? Todos os números sorteados serão apagados.';

  const CHAVES = {
    sorteados: 'bingo:sorteados',
    voz: 'bingo:voz',
    tema: 'bingo:tema',
    escala: 'bingo:escala',
  };

  const tela = {
    bola: document.getElementById('bola'),
    anteriores: document.getElementById('anteriores'),
    contador: document.getElementById('contador'),
    painel: document.getElementById('painel'),
    comandos: document.getElementById('comandos'),
    conferencia: document.getElementById('conferencia'),
    campoDaConferencia: document.getElementById('campo-conferencia'),
    resultadoDaConferencia: document.getElementById('resultado-conferencia'),
    botaoConferir: document.getElementById('botao-conferir'),
    botaoFechar: document.getElementById('botao-fechar'),
  };

  const armazenamento = {
    ler(chave, padrao) {
      try {
        const valor = localStorage.getItem(chave);
        return valor === null ? padrao : JSON.parse(valor);
      } catch (erro) {
        return padrao;
      }
    },

    gravar(chave, valor) {
      try {
        localStorage.setItem(chave, JSON.stringify(valor));
      } catch (erro) {
        return;
      }
    },
  };

  function filtrarSorteadosValidos(lista) {
    if (!Array.isArray(lista)) {
      return [];
    }

    const validos = lista.filter((numero) => Number.isInteger(numero) && numero >= 1 && numero <= TOTAL_DE_NUMEROS);
    return [...new Set(validos)];
  }

  function lerEscalaSalva() {
    const escala = armazenamento.ler(CHAVES.escala, ESCALA_PADRAO);
    const valida = typeof escala === 'number' && escala >= ESCALA_MINIMA && escala <= ESCALA_MAXIMA;
    return valida ? escala : ESCALA_PADRAO;
  }

  const estado = {
    sorteados: filtrarSorteadosValidos(armazenamento.ler(CHAVES.sorteados, [])),
    sorteando: false,
    liberadoEm: 0,
    vozLigada: armazenamento.ler(CHAVES.voz, true) !== false,
    escala: lerEscalaSalva(),
  };

  let temporizadorDoAviso = null;
  let temporizadorDosComandos = null;
  let bloqueioDeTela = null;

  function indiceDaLetra(numero) {
    return Math.floor((numero - 1) / NUMEROS_POR_LETRA);
  }

  function letraDoNumero(numero) {
    return LETRAS[indiceDaLetra(numero)];
  }

  function numeroAleatorio(limite) {
    const valor = new Uint32Array(1);
    crypto.getRandomValues(valor);
    return valor[0] % limite;
  }

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

  function reiniciarAnimacao(elemento, classe) {
    elemento.classList.remove(classe);
    void elemento.offsetWidth;
    elemento.classList.add(classe);
  }

  function ultimoSorteado() {
    return estado.sorteados[estado.sorteados.length - 1];
  }

  function foiSorteado(numero) {
    return estado.sorteados.includes(numero);
  }

  function salvarSorteados() {
    armazenamento.gravar(CHAVES.sorteados, estado.sorteados);
  }

  function montarPainel() {
    LETRAS.forEach((letra, linha) => {
      const faixa = criarElemento('div', 'painel-faixa');
      faixa.dataset.letra = letra;
      faixa.append(criarElemento('div', 'painel-letra', letra));

      for (let posicao = 1; posicao <= NUMEROS_POR_LETRA; posicao++) {
        const numero = linha * NUMEROS_POR_LETRA + posicao;
        const celula = criarElemento('div', 'painel-numero', String(numero));
        celula.dataset.letra = letra;
        celula.dataset.numero = String(numero);
        faixa.append(celula);
      }

      tela.painel.append(faixa);
    });
  }

  function atualizarPainel(numeroNovo) {
    tela.painel.querySelectorAll('.painel-numero').forEach((celula) => {
      const numero = Number(celula.dataset.numero);
      celula.classList.toggle('sorteado', foiSorteado(numero));
      celula.classList.toggle('ultimo', numero === ultimoSorteado());
      celula.classList.toggle('novo', numero === numeroNovo);
    });
  }

  function exibirNumeroNaBola(numero) {
    const letra = letraDoNumero(numero);
    tela.bola.dataset.letra = letra;
    tela.bola.replaceChildren(
      criarElemento('div', 'bola-letra', letra),
      criarElemento('div', 'bola-numero', String(numero))
    );
  }

  function exibirBolaEmRepouso() {
    const texto = estado.sorteados.length >= TOTAL_DE_NUMEROS ? 'FIM' : 'BINGO';
    delete tela.bola.dataset.letra;
    tela.bola.replaceChildren(criarElemento('div', 'bola-repouso', texto));
  }

  function atualizarBola() {
    const ultimo = ultimoSorteado();

    if (ultimo) {
      exibirNumeroNaBola(ultimo);
      return;
    }

    exibirBolaEmRepouso();
  }

  function montarBolinhaAnterior(numero) {
    const bolinha = criarElemento('li');
    bolinha.dataset.letra = letraDoNumero(numero);
    bolinha.append(
      criarElemento('span', 'anterior-letra', letraDoNumero(numero)),
      criarElemento('span', 'anterior-numero', String(numero))
    );
    return bolinha;
  }

  function atualizarAnteriores() {
    const anteriores = estado.sorteados.slice(-(ANTERIORES_EXIBIDOS + 1), -1).reverse();
    tela.anteriores.replaceChildren(...anteriores.map(montarBolinhaAnterior));
  }

  function atualizarContador() {
    const total = estado.sorteados.length;
    tela.contador.textContent = total ? `${total} de ${TOTAL_DE_NUMEROS} sorteados` : '';
  }

  function desenharTudo(numeroNovo) {
    atualizarPainel(numeroNovo);

    if (!estado.sorteando) {
      atualizarBola();
    }

    atualizarAnteriores();
    atualizarContador();
  }

  function avisar(mensagem) {
    tela.contador.textContent = mensagem;
    clearTimeout(temporizadorDoAviso);
    temporizadorDoAviso = setTimeout(atualizarContador, TEMPO_DO_AVISO_MS);
  }

  const voz = {
    disponivel() {
      return 'speechSynthesis' in window;
    },

    escolherVoz() {
      const vozes = speechSynthesis
        .getVoices()
        .filter((candidata) => candidata.lang.toLowerCase().startsWith(IDIOMA_DA_VOZ.toLowerCase()));

      for (const nome of VOZES_PREFERIDAS) {
        const encontrada = vozes.find((candidata) => candidata.name.toLowerCase().includes(nome));

        if (encontrada) {
          return encontrada;
        }
      }

      return vozes[0] || null;
    },

    montarFrase(numero) {
      const partes = [LETRAS_FALADAS[indiceDaLetra(numero)], String(numero)];

      if (numero >= 10) {
        const dezena = ALGARISMOS_POR_EXTENSO[Math.floor(numero / 10)];
        const unidade = ALGARISMOS_POR_EXTENSO[numero % 10];
        partes.push(`${dezena} e ${unidade}`);
      }

      return `${partes.join('. ')}.`;
    },

    falar(numero) {
      if (!estado.vozLigada || !voz.disponivel()) {
        return;
      }

      const fala = new SpeechSynthesisUtterance(voz.montarFrase(numero));
      fala.lang = IDIOMA_DA_VOZ;
      fala.rate = VELOCIDADE_DA_VOZ;
      fala.volume = VOLUME_DA_VOZ;
      fala.voice = voz.escolherVoz();

      speechSynthesis.cancel();
      speechSynthesis.speak(fala);
    },

    repetir() {
      const ultimo = ultimoSorteado();

      if (ultimo) {
        voz.falar(ultimo);
      }
    },

    parar() {
      if (voz.disponivel()) {
        speechSynthesis.cancel();
      }
    },
  };

  function numerosRestantes() {
    const todos = Array.from({ length: TOTAL_DE_NUMEROS }, (_, posicao) => posicao + 1);
    return todos.filter((numero) => !foiSorteado(numero));
  }

  function concluirSorteio(numero) {
    estado.sorteando = false;
    estado.liberadoEm = Date.now() + INTERVALO_ENTRE_SORTEIOS_MS;
    tela.bola.classList.remove('rolando');

    estado.sorteados.push(numero);
    salvarSorteados();
    desenharTudo(numero);
    reiniciarAnimacao(tela.bola, 'aparecendo');
    voz.falar(numero);
  }

  function rolarBola(restantes, escolhido) {
    const inicio = Date.now();
    estado.sorteando = true;
    tela.bola.classList.add('rolando');

    const intervalo = setInterval(() => {
      exibirNumeroNaBola(restantes[numeroAleatorio(restantes.length)]);

      if (Date.now() - inicio < DURACAO_DA_ROLETA_MS) {
        return;
      }

      clearInterval(intervalo);
      concluirSorteio(escolhido);
    }, PASSO_DA_ROLETA_MS);
  }

  function sortear() {
    if (estado.sorteando || Date.now() < estado.liberadoEm) {
      return;
    }

    const restantes = numerosRestantes();

    if (!restantes.length) {
      exibirBolaEmRepouso();
      return;
    }

    rolarBola(restantes, restantes[numeroAleatorio(restantes.length)]);
  }

  function repetirVoz() {
    voz.repetir();
  }

  function desfazer() {
    if (estado.sorteando || !estado.sorteados.length) {
      return;
    }

    estado.sorteados.pop();
    salvarSorteados();
    voz.parar();
    desenharTudo();
  }

  function reiniciar() {
    if (estado.sorteando || !window.confirm(MENSAGEM_DE_REINICIO)) {
      return;
    }

    estado.sorteados = [];
    salvarSorteados();
    voz.parar();
    desenharTudo();
  }

  function alternarVoz() {
    estado.vozLigada = !estado.vozLigada;
    armazenamento.gravar(CHAVES.voz, estado.vozLigada);

    if (!estado.vozLigada) {
      voz.parar();
    }

    avisar(`Voz ${estado.vozLigada ? 'ligada' : 'desligada'}`);
  }

  function aplicarTema(claro) {
    document.body.classList.toggle('claro', claro);
  }

  function alternarTema() {
    const claro = !document.body.classList.contains('claro');
    aplicarTema(claro);
    armazenamento.gravar(CHAVES.tema, claro ? 'claro' : 'escuro');
  }

  function aplicarEscala() {
    document.documentElement.style.setProperty('--escala-painel', String(estado.escala));
  }

  function ajustarEscala(variacao) {
    const nova = Math.round((estado.escala + variacao) * 10) / 10;
    estado.escala = Math.min(ESCALA_MAXIMA, Math.max(ESCALA_MINIMA, nova));
    aplicarEscala();
    armazenamento.gravar(CHAVES.escala, estado.escala);
    avisar(`Tamanho dos números: ${Math.round(estado.escala * 100)}%`);
  }

  function aumentarNumeros() {
    ajustarEscala(PASSO_DA_ESCALA);
  }

  function diminuirNumeros() {
    ajustarEscala(-PASSO_DA_ESCALA);
  }

  function alternarTelaCheia() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }

    document.documentElement.requestFullscreen();
  }

  function exibirResultado(resultado) {
    tela.resultadoDaConferencia.className = `resultado ${resultado.tipo}`;
    tela.resultadoDaConferencia.textContent = resultado.mensagem;
  }

  function limparResultado() {
    tela.resultadoDaConferencia.className = 'resultado';
    tela.resultadoDaConferencia.textContent = '';
  }

  function conferirNumeros(texto) {
    const informados = [...new Set((texto.match(/\d+/g) || []).map(Number))];

    if (!informados.length) {
      return null;
    }

    const invalidos = informados.filter((numero) => numero < 1 || numero > TOTAL_DE_NUMEROS);

    if (invalidos.length) {
      return { tipo: 'erro', mensagem: `✖ Número inválido: ${invalidos.join(', ')}` };
    }

    const faltantes = informados.filter((numero) => !foiSorteado(numero)).sort((a, b) => a - b);

    if (faltantes.length) {
      return { tipo: 'erro', mensagem: `✖ Ainda não saíram: ${faltantes.join(', ')}` };
    }

    return { tipo: 'sucesso', mensagem: `✔ Todos os ${informados.length} números já saíram!` };
  }

  function conferirCartela(numeroDaCartela) {
    if (numeroDaCartela < 1 || numeroDaCartela > NUMERO_MAXIMO_DE_CARTELA) {
      return { tipo: 'erro', mensagem: '✖ Cartela inválida' };
    }

    const grade = GeradorCartela.gerar(numeroDaCartela);
    const marcada = (numero) => numero === GeradorCartela.CASA_LIVRE || foiSorteado(numero);
    const faltantes = grade.flat().filter((numero) => !marcada(numero)).sort((a, b) => a - b);
    const temLinhaCompleta = GeradorCartela.linhasPremiaveis(grade).some((linha) => linha.every(marcada));
    const prefixo = `Cartela nº ${numeroDaCartela}:`;

    if (!faltantes.length) {
      return { tipo: 'sucesso', mensagem: `✔ ${prefixo} CARTELA CHEIA!` };
    }

    if (temLinhaCompleta) {
      return {
        tipo: 'sucesso',
        mensagem: `✔ ${prefixo} tem LINHA completa (faltam ${faltantes.length} p/ cheia)`,
      };
    }

    const detalhe = faltantes.length <= 5 ? `: ${faltantes.join(', ')}` : ' números';
    return { tipo: 'erro', mensagem: `✖ ${prefixo} faltam ${faltantes.length}${detalhe}` };
  }

  function conferirTexto(texto) {
    const cartela = texto.match(EXPRESSAO_DE_CARTELA);

    if (cartela) {
      return conferirCartela(Number(cartela[1]));
    }

    return conferirNumeros(texto);
  }

  function executarConferencia() {
    const resultado = conferirTexto(tela.campoDaConferencia.value);

    if (!resultado) {
      limparResultado();
      return;
    }

    exibirResultado(resultado);
  }

  function conferenciaAberta() {
    return !tela.conferencia.hidden;
  }

  function abrirConferencia() {
    tela.conferencia.hidden = false;
    tela.campoDaConferencia.value = '';
    limparResultado();
    tela.campoDaConferencia.focus();
  }

  function fecharConferencia() {
    tela.conferencia.hidden = true;
    tela.campoDaConferencia.blur();
  }

  function tratarTeclaDaConferencia(evento) {
    if (evento.key === 'Escape') {
      fecharConferencia();
      return;
    }

    if (evento.key === 'Enter') {
      executarConferencia();
    }
  }

  function mostrarComandos() {
    document.body.classList.add('comandos-visiveis');
    clearTimeout(temporizadorDosComandos);
    temporizadorDosComandos = setTimeout(() => {
      document.body.classList.remove('comandos-visiveis');
    }, TEMPO_DOS_COMANDOS_MS);
  }

  async function manterTelaAcesa() {
    if (bloqueioDeTela || !navigator.wakeLock) {
      return;
    }

    try {
      bloqueioDeTela = await navigator.wakeLock.request('screen');
      bloqueioDeTela.addEventListener('release', () => {
        bloqueioDeTela = null;
      });
    } catch (erro) {
      bloqueioDeTela = null;
    }
  }

  function ignorarTecla() {}

  function montarAtalhos() {
    return {
      ' ': sortear,
      enter: sortear,
      pagedown: sortear,
      arrowright: sortear,
      arrowdown: sortear,
      r: repetirVoz,
      pageup: repetirVoz,
      arrowleft: repetirVoz,
      arrowup: repetirVoz,
      backspace: desfazer,
      c: abrirConferencia,
      m: alternarVoz,
      t: alternarTema,
      f: alternarTelaCheia,
      '+': aumentarNumeros,
      '=': aumentarNumeros,
      '-': diminuirNumeros,
      f5: ignorarTecla,
    };
  }

  function montarAcoesDosBotoes() {
    return {
      sortear,
      repetir: repetirVoz,
      desfazer,
      conferir: abrirConferencia,
      voz: alternarVoz,
      menos: diminuirNumeros,
      mais: aumentarNumeros,
      tema: alternarTema,
      tela: alternarTelaCheia,
      reiniciar,
    };
  }

  function registrarTeclado() {
    const atalhos = montarAtalhos();

    document.addEventListener('keydown', (evento) => {
      if (conferenciaAberta()) {
        tratarTeclaDaConferencia(evento);
        return;
      }

      if (evento.ctrlKey || evento.metaKey || evento.altKey) {
        return;
      }

      const acao = atalhos[evento.key.toLowerCase()];

      if (!acao) {
        return;
      }

      evento.preventDefault();

      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }

      if (!evento.repeat) {
        acao();
      }

      manterTelaAcesa();
    });
  }

  function registrarComandos() {
    const acoes = montarAcoesDosBotoes();

    tela.comandos.addEventListener('click', (evento) => {
      const botao = evento.target.closest('button[data-acao]');

      if (botao) {
        botao.blur();
        acoes[botao.dataset.acao]();
      }

      manterTelaAcesa();
    });

    tela.botaoConferir.addEventListener('click', executarConferencia);
    tela.botaoFechar.addEventListener('click', fecharConferencia);

    tela.conferencia.addEventListener('click', (evento) => {
      if (evento.target === tela.conferencia) {
        fecharConferencia();
      }
    });

    document.addEventListener('mousemove', mostrarComandos);
    document.addEventListener('touchstart', mostrarComandos);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        manterTelaAcesa();
      }
    });
  }

  function iniciar() {
    aplicarTema(armazenamento.ler(CHAVES.tema, 'escuro') === 'claro');
    aplicarEscala();
    montarPainel();
    desenharTudo();
    registrarTeclado();
    registrarComandos();
    mostrarComandos();
  }

  iniciar();
})();