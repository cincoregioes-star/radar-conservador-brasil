const homePage = document.getElementById("homePage");
const areaDestaque = document.getElementById("areaDestaque");
const listaNoticias = document.getElementById("listaNoticias");
const paginaNoticia = document.getElementById("paginaNoticia");
const tickerNoticias = document.getElementById("tickerNoticias");
const menuCategorias = document.getElementById("menuCategorias");
const maisLidas = document.getElementById("maisLidas");
const listaCategorias = document.getElementById("listaCategorias");

function registrarEventoGA(nome, parametros = {}) {
  if (typeof gtag === "function") {
    gtag("event", nome, parametros);
  }
}

function misturarCategorias(noticias) {
  const grupos = {};

  noticias.forEach(n => {
    if (!grupos[n.categoria]) grupos[n.categoria] = [];
    grupos[n.categoria].push(n);
  });

  Object.keys(grupos).forEach(cat => {
    grupos[cat].sort((a, b) => new Date(b.data) - new Date(a.data));
  });

  const categoriasOrdenadas = Object.keys(grupos).sort((a, b) => grupos[b].length - grupos[a].length);
  const resultado = [];
  let adicionou = true;

  while (adicionou) {
    adicionou = false;
    categoriasOrdenadas.forEach(cat => {
      const item = grupos[cat].shift();
      if (item) {
        resultado.push(item);
        adicionou = true;
      }
    });
  }

  return resultado;
}

const noticiasDestaque = bancoNoticias
  .filter(n => n.destaque)
  .sort((a, b) => new Date(b.data) - new Date(a.data));

const noticiasComuns = bancoNoticias
  .filter(n => !n.destaque)
  .sort((a, b) => new Date(b.data) - new Date(a.data));

const noticiasOrdenadas = [
  ...noticiasDestaque,
  ...misturarCategorias(noticiasComuns)
];

let categoriaAtual = "Todas";

function formatarData(dataStr) {
  const data = new Date(dataStr + "T12:00:00");
  return data.toLocaleDateString("pt-BR");
}

function gerarCategorias() {
  const categorias = [
    "Todas",
    ...new Set(bancoNoticias.map(n => n.categoria))
  ];

  menuCategorias.innerHTML = categorias.map(cat => `
    <a href="#" class="nav-link ${cat === categoriaAtual ? "active" : ""}" data-categoria="${cat}">
      ${cat}
    </a>
  `).join("");

  listaCategorias.innerHTML = categorias
    .filter(cat => cat !== "Todas")
    .map(cat => `<li><a href="#" data-categoria="${cat}">${cat}</a></li>`)
    .join("");

  document.querySelectorAll("[data-categoria]").forEach(item => {
    item.addEventListener("click", function(e) {
      e.preventDefault();

      categoriaAtual = this.dataset.categoria;

      registrarEventoGA("clique_categoria", {
        categoria: categoriaAtual
      });

      gerarCategorias();
      renderizarHome();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function gerarTicker() {
  const titulos = noticiasOrdenadas.slice(0, 10).map(n => `<span>${n.titulo}</span>`);
  tickerNoticias.innerHTML = [...titulos, ...titulos].join("");
}

function gerarMaisLidas() {
  const topNoticias = noticiasOrdenadas.slice(0, 6);

  maisLidas.innerHTML = topNoticias.map(n => `
    <li><a href="#" data-id="${n.id}">${n.titulo}</a></li>
  `).join("");

  maisLidas.querySelectorAll("[data-id]").forEach(link => {
    link.addEventListener("click", function(e) {
      e.preventDefault();
      abrirNoticia(Number(this.dataset.id), "mais_lidas");
    });
  });
}

function obterNoticiasFiltradas() {
  if (categoriaAtual === "Todas") return noticiasOrdenadas;
  return noticiasOrdenadas.filter(n => n.categoria === categoriaAtual);
}

function renderizarHome() {
  const noticiasFiltradas = obterNoticiasFiltradas();

  if (!noticiasFiltradas.length) {
    areaDestaque.innerHTML = "";
    listaNoticias.innerHTML = "<p>Nenhuma notícia encontrada.</p>";
    return;
  }

  const noticiaDestaque = noticiasFiltradas.find(n => n.destaque) || noticiasFiltradas[0];
  const restantes = noticiasFiltradas.filter(n => n.id !== noticiaDestaque.id);

  areaDestaque.innerHTML = `
    <article class="hero-card" data-id="${noticiaDestaque.id}">
      <img src="${noticiaDestaque.imagem}" 
           alt="${noticiaDestaque.titulo}"
           style="width:100%;height:260px;object-fit:cover;border-radius:12px;">
      <div class="hero-content">
        <span class="badge">${noticiaDestaque.categoria}</span>
        <h2>${noticiaDestaque.titulo}</h2>
        <div class="meta">
          <span>${formatarData(noticiaDestaque.data)}</span>
          <span>Notícia em destaque</span>
        </div>
        <p>${noticiaDestaque.resumo}</p>
        ${noticiaDestaque.botao ? `
          <a href="${noticiaDestaque.botao.link}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;margin-top:12px;background:#071b3d;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;"
             onclick="event.stopPropagation();">${noticiaDestaque.botao.texto}</a>
        ` : ""}
      </div>
    </article>
  `;

  listaNoticias.innerHTML = restantes.map(n => `
    <article class="card" data-id="${n.id}">
      <img src="${n.imagem}" 
           alt="${n.titulo}"
           style="width:100%;height:180px;object-fit:cover;border-radius:10px;">
      <div class="card-content">
        <span class="badge">${n.categoria}</span>
        <h3>${n.titulo}</h3>
        <div class="meta">
          <span>${formatarData(n.data)}</span>
        </div>
        <p>${n.resumo}</p>
      </div>
    </article>
  `).join("");

  areaDestaque.querySelectorAll("[data-id]").forEach(card => {
    card.addEventListener("click", function() {
      abrirNoticia(Number(this.dataset.id), "destaque");
    });
  });

  listaNoticias.querySelectorAll("[data-id]").forEach(card => {
    card.addEventListener("click", function() {
      abrirNoticia(Number(this.dataset.id), "lista_noticias");
    });
  });
}

function abrirNoticia(id, origem = "desconhecida") {
  const noticia = bancoNoticias.find(n => n.id === id);
  if (!noticia) return;

  registrarEventoGA("noticia_aberta", {
    id_noticia: noticia.id,
    titulo_noticia: noticia.titulo,
    categoria_noticia: noticia.categoria,
    origem_clique: origem
  });

  const conteudoHtml = noticia.conteudo.map(p => `<p>${p}</p>`).join("");

  const imagensExtrasHtml = noticia.imagensExtras
    ? `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin:20px 0;">
        ${noticia.imagensExtras.map(img => `
          <img src="${img}" 
               alt="${noticia.titulo}"
               style="width:100%;height:220px;object-fit:cover;border-radius:12px;">
        `).join("")}
      </div>
    `
    : `<img src="${noticia.imagem}" alt="${noticia.titulo}" style="width:100%;height:260px;object-fit:cover;border-radius:12px;">`;

  const botaoHtml = noticia.botao
    ? `
      <a href="${noticia.botao.link}" target="_blank" rel="noopener noreferrer"
         style="display:inline-block;margin:12px 0 22px;background:#071b3d;color:#fff;padding:13px 20px;border-radius:10px;text-decoration:none;font-weight:800;">
        ${noticia.botao.texto}
      </a>
    `
    : "";

  paginaNoticia.innerHTML = `
    <button class="back-btn" onclick="fecharNoticia()">← Voltar</button>
    <span class="badge">${noticia.categoria}</span>
    <h1>${noticia.titulo}</h1>
    <div class="meta">
      <span>${formatarData(noticia.data)}</span>
      <span>Radar Conservador Brasil</span>
    </div>
    ${imagensExtrasHtml}
    ${botaoHtml}
    ${conteudoHtml}
  `;

  homePage.style.display = "none";
  paginaNoticia.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fecharNoticia() {
  paginaNoticia.style.display = "none";
  homePage.style.display = "grid";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function ativarRastreamentoAnuncios() {
  document.querySelectorAll("[data-anuncio]").forEach(item => {
    item.addEventListener("click", function() {
      registrarEventoGA("clique_anuncio", {
        anuncio: this.dataset.anuncio,
        link: this.href || "sem_link"
      });
    });
  });
}

window.fecharNoticia = fecharNoticia;

(function() {
  const chave = "radar_conservador_brasil_acessos";
  let acessos = parseInt(localStorage.getItem(chave) || "0", 10);
  acessos += 1;
  localStorage.setItem(chave, acessos);

  const contador = document.getElementById("contadorAcessos");
  if (contador) {
    contador.textContent = `Acessos neste dispositivo: ${acessos}`;
  }
})();

gerarCategorias();
gerarTicker();
gerarMaisLidas();
renderizarHome();
ativarRastreamentoAnuncios();