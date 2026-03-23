// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

menuToggle.addEventListener('click', () => {
  menuToggle.classList.toggle('active');
  navLinks.classList.toggle('open');
});

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    menuToggle.classList.remove('active');
    navLinks.classList.remove('open');
  });
});

// Scroll reveal
const observerOptions = { threshold: 0.2, rootMargin: '0px' };

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      // Stagger children within the same parent
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);
      revealObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el, i) => {
  // Add stagger delay for grid children
  const parent = el.parentElement;
  if (parent) {
    const siblings = parent.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (siblings.length > 1) {
      const idx = Array.from(siblings).indexOf(el);
      el.dataset.delay = idx * 80;
    }
  }
  revealObserver.observe(el);
});

// ==========================================
// INTEGRAÇÃO COM SUPABASE E ORDENAÇÃO
// ==========================================

const SUPABASE_URL = 'https://cccsmhaiedcnzqenlpdz.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3NtaGFpZWRjbnpxZW5scGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNTk4NTksImV4cCI6MjA4OTYzNTg1OX0.Im4uBQT3siSAki58LCizckIWqQ9B-vpXfOmtvVY6RMY';

// NOVO: Variáveis para controlar a galeria
let fotosGaleriaGlobal = []; // Vai guardar a lista de todas as fotos carregadas
let currentIndexLightbox = 0; // Vai guardar o índice da foto que está no zoom

// --- NOVA FUNÇÃO: Tradutor de Datas ---
// Lê o texto (ex: "24 a 27 de Março") e transforma num número sequencial (ex: 324) para ordenar
function obterValorOrdenacao(textoData) {
  if (!textoData) return 9999; 

  // 1. Pega o primeiro número do texto (o dia de início)
  const matchDia = textoData.match(/\d+/);
  const dia = matchDia ? parseInt(matchDia[0]) : 31; 

  // 2. Procura qual é o primeiro mês que aparece no texto
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  let mesValor = 12; 
  let menorPosicao = 9999;

  meses.forEach((nomeMes, index) => {
    const posicao = textoData.indexOf(nomeMes);
    if (posicao !== -1 && posicao < menorPosicao) {
      menorPosicao = posicao;
      mesValor = index; // Associa o mês a um número de 0 a 11
    }
  });

  // 3. Cria o peso da data (Mês * 100 + Dia)
  return (mesValor * 100) + dia;
}

// --- FUNÇÃO PRINCIPAL: Buscar e Exibir ---
async function carregarCursos() {
  const grid = document.getElementById('grid-cursos');
  
  if (!grid) return; // Só executa se estiver na página certa

  // Mostra um aviso de carregamento enquanto busca os dados
  grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Buscando agenda de cursos...</p>';

  try {
    // Faz a requisição direto para a API REST do Supabase
    const url = `${SUPABASE_URL}/rest/v1/cursos?ativo=eq.true&select=*`;
    
    const resposta = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!resposta.ok) throw new Error('Falha ao buscar os dados');

    let cursos = await resposta.json();
    grid.innerHTML = ''; // Limpa o "carregando"

    // Se não tiver nenhum curso ativo no banco
    if (cursos.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Nenhum curso agendado no momento.</p>';
      return;
    }

    // 🌟 A MÁGICA DA ORDENAÇÃO: Ordena a lista do menor para o maior antes de exibir
    cursos.sort((a, b) => {
      return obterValorOrdenacao(a.data_curso) - obterValorOrdenacao(b.data_curso);
    });

    // Monta o HTML para cada curso já organizado por data cronológica
    cursos.forEach((curso, index) => {
      // Delay para a sua animação de reveal funcionar em cascata
      const delay = index * 80;
      
      const cardHTML = `
        <div class="course-card reveal visible" style="transition-delay: ${delay}ms;">
          <div class="course-header course-header-${curso.cor_header}">
            <span class="course-location">📍 ${curso.cidade_estado}</span>
            <span class="course-tag">${curso.categoria}</span>
          </div>
          <div class="course-body">
            <span class="course-date">📅 ${curso.data_curso}</span>
            <h3>${curso.titulo}</h3>
            <button onclick="abrirModal('${curso.titulo}', '${curso.link_imagem || ''}', '${curso.nome_professor || ''}', '${curso.bio_professor || ''}', '${curso.link_pdf || ''}', '${curso.link_inscricao}')" class="course-link" style="background:none; border:none; cursor:pointer; padding:0; font-family:inherit;">Saiba mais →</button>
          </div>
        </div>
      `;
      grid.innerHTML += cardHTML;
    });

  } catch (erro) {
    console.error("Erro ao carregar cursos:", erro);
    grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #e74c3c;">Não foi possível carregar a agenda no momento. Tente novamente mais tarde.</p>';
  }
}

// Executa a função assim que a página terminar de carregar
// Executa as buscas assim que a página carrega
document.addEventListener('DOMContentLoaded', () => {
  carregarCursos();
  carregarGaleria();
});

// --- FUNÇÃO DA GALERIA ---
async function carregarGaleria() {
  const grid = document.getElementById('grid-galeria');
  if (!grid) return;

  grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Buscando fotos recentes...</p>';

  try {
    // Busca na tabela galeria_fotos, da mais recente para a mais antiga
    const url = `${SUPABASE_URL}/rest/v1/galeria_fotos?select=*&order=criado_em.desc`;
    
    const resposta = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!resposta.ok) throw new Error('Falha ao buscar as fotos');

    const fotos = await resposta.json();
    fotosGaleriaGlobal = fotos;
    grid.innerHTML = ''; 

    if (fotos.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Ainda não há fotos publicadas na galeria.</p>';
      return;
    }

    // Monta o HTML de cada foto
// Monta o HTML de cada foto
    fotos.forEach((foto, index) => {
      const delay = (index % 6) * 50; // Mantém a animação rápida
      
      // Se passar da 6ª foto (índice 5), ganha a classe 'hidden-galeria' e 'extra-item'
      const isHidden = index > 5 ? 'hidden-galeria extra-item' : '';
     
      const html = `
        <div class="galeria-item reveal visible ${isHidden}" style="transition-delay: ${delay}ms;" onclick="abrirLightbox(${index})">
          <img src="${foto.url_imagem}" alt="${foto.titulo}" loading="lazy" />
          <div class="galeria-overlay">
            <h4>${foto.titulo}</h4>
          </div>
        </div>
      `;
      grid.innerHTML += html;
    });

    // Depois de colocar as fotos, vê se precisa mostrar o botão
    const divBotao = document.getElementById('galeria-actions');
    if (fotos.length > 6) {
      divBotao.style.display = 'block';
    } else {
      divBotao.style.display = 'none'; // Se tiver 6 fotos ou menos, o botão nem aparece
    }

  } catch (erro) {
    console.error("Erro na galeria:", erro);
    grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #e74c3c;">Não foi possível carregar a galeria no momento.</p>';
  }
}

// ==========================================
// CONTROLE DO MODAL "SAIBA MAIS"
// ==========================================
function abrirModal(titulo, imgUrl, nomeProf, bioProf, pdfUrl, inscricaoUrl) {
  // Preenche os dados básicos do curso
  document.getElementById('modalTitulo').innerText = titulo;
  document.getElementById('modalLink').href = inscricaoUrl;
  
  // Elementos do bloco do professor
  const profHeader = document.getElementById('modalProfHeader');
  const divider = document.getElementById('modalDivider');
  const imgEl = document.getElementById('modalImg');
  const nomeEl = document.getElementById('modalNomeProf');
  const bioEl = document.getElementById('modalBioProf');

  // Lógica inteligente: Mostra o bloco do professor apenas se houver imagem OU nome
  if (imgUrl || nomeProf) {
    profHeader.style.display = 'flex';
    divider.style.display = 'block';

    // Trata a foto
    if (imgUrl) {
      imgEl.src = imgUrl;
      imgEl.style.display = 'block';
    } else {
      imgEl.style.display = 'none'; // Esconde a imagem se não tiver, mas mantém o texto
    }

    // Trata o texto
    nomeEl.innerText = nomeProf || 'Professor(a)'; // Fallback se não tiver nome
    bioEl.innerText = bioProf || ''; // Limpa a bio se não tiver
    
    // Esconde a bio se ela estiver vazia
    bioEl.style.display = bioProf ? 'block' : 'none';

  } else {
    // Esconde todo o bloco superior se não tiver nada do professor
    profHeader.style.display = 'none';
    divider.style.display = 'none';
  }
  
  // Trata o botão da ementa (PDF)
  const btnPdf = document.getElementById('modalPdf');
  if (pdfUrl) {
    btnPdf.href = pdfUrl;
    btnPdf.style.display = 'inline-block';
  } else {
    btnPdf.style.display = 'none'; // Esconde o botão se não tiver PDF
  }
  
  // Mostra o Modal
  document.getElementById('cursoModal').classList.add('active');
}

function fecharModal() {
  document.getElementById('cursoModal').classList.remove('active');
}

// Fecha o modal se o usuário clicar fora da caixinha branca
document.getElementById('cursoModal').addEventListener('click', function(e) {
  if (e.target === this) {
    fecharModal();
  }
});

// ==========================================
// CONTROLE DO LIGHTBOX (ZOOM COM NAVEGAÇÃO)
// ==========================================

// Atualizada para receber o ÍNDICE da foto na lista global
function abrirLightbox(index) {
  if (fotosGaleriaGlobal.length === 0) return; // Segurança

  // Atualiza o índice atual
  currentIndexLightbox = index;
  const foto = fotosGaleriaGlobal[index];

  const overlay = document.getElementById('lightboxOverlay');
  const imgEl = document.getElementById('lightboxImg');
  const tituloEl = document.getElementById('lightboxTitulo');

  // Preenche os dados com base na foto global
  imgEl.src = foto.url_imagem;
  imgEl.alt = foto.titulo;
  tituloEl.innerText = foto.titulo;

  // Mostra o modal
  overlay.classList.add('active');
}

function fecharLightbox() {
  document.getElementById('lightboxOverlay').classList.remove('active');
}

// NOVA FUNÇÃO: Trata o clique nas setas (-1 para esquerda, 1 para direita)
function navegarGaleria(direcao) {
  // Impede que o modal feche (pois o clique no fundo escuro fecha)
  event.stopPropagation(); 

  // Calcula o novo índice
  let newIndex = currentIndexLightbox + direcao;

  // Lógica de Navegação Infinita (Loop)
  if (newIndex < 0) {
    newIndex = fotosGaleriaGlobal.length - 1; // Se for menor que 0, vai para a última
  } else if (newIndex >= fotosGaleriaGlobal.length) {
    newIndex = 0; // Se passar da última, volta para a primeira
  }

  // Chama a função abrirLightbox com o novo índice para atualizar a tela
  abrirLightbox(newIndex);
}

// Fecha o lightbox se o usuário clicar no fundo escuro
document.getElementById('lightboxOverlay').addEventListener('click', function(e) {
  if (e.target === this) {
    fecharLightbox();
  }
});

// NOVO (Extra de Usabilidade): Permite navegar usando as setas do teclado (Esquerda/Direita)
document.addEventListener('keydown', (e) => {
  if (document.getElementById('lightboxOverlay').classList.contains('active')) {
    if (e.key === "Escape") fecharLightbox();
    if (e.key === "ArrowLeft") navegarGaleria(-1);
    if (e.key === "ArrowRight") navegarGaleria(1);
  }
});

// ==========================================
// CONTROLE DO BOTÃO VER MAIS / VER MENOS
// ==========================================
function toggleGaleria() {
  const extraItems = document.querySelectorAll('.extra-item');
  const btn = document.getElementById('btn-toggle-galeria');
  let isShowingAll = false;

  // Verifica a primeira foto extra para saber o status atual
  if (extraItems.length > 0) {
    if (extraItems[0].classList.contains('hidden-galeria')) {
      // Estava escondido, então MOSTRA tudo
      extraItems.forEach(item => item.classList.remove('hidden-galeria'));
      btn.innerText = 'Ver menos fotos ↑';
      isShowingAll = true;
    } else {
      // Estava aparecendo, então ESCONDE as extras
      extraItems.forEach(item => item.classList.add('hidden-galeria'));
      btn.innerText = 'Ver mais fotos ↓';
      
      // Bônus de usabilidade: Rola a tela suavemente de volta para o início da galeria
      document.getElementById('galeria').scrollIntoView({ behavior: 'smooth' });
    }
  }
}
