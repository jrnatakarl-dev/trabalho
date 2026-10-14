const API_BACKEND = "http://localhost:3000/api"; // ajuste se necessário

// ---------- Catálogo de produtos (poderia vir do backend também) ----------
const PRODUTOS = [
  { id: 1, nome: "Caneca SENAI", preco: 50, descricao: "Caneca personalizada 300ml" },
  { id: 2, nome: "Camiseta Dev", preco: 120, descricao: "Camiseta 100% algodão" },
  { id: 3, nome: "Mousepad Gamer", preco: 80, descricao: "Mousepad extra grande" },
  { id: 4, nome: "Fone Bluetooth", preco: 250, descricao: "Fone sem fio com cancelamento de ruído" },
  { id: 5, nome: "Caderno Inteligente", preco: 60, descricao: "Caderno com discos e capa dura" },
  { id: 6, nome: "Garrafa Térmica", preco: 90, descricao: "Mantém a temperatura por 12h" },
];

let alunoSelecionado = null;
let saldoAtual = 0;

// ---------- Elementos DOM ----------
const selectAluno = document.getElementById("select-aluno");
const saldoSpan   = document.getElementById("saldo-atual");
const container   = document.getElementById("produtos-container");
const msgEl       = document.getElementById("mensagem");

// ---------- Inicialização ----------
async function init() {
  await carregarAlunos();
  renderizarProdutos();
}

// ---------- GET: buscar alunos e saldos ----------
async function carregarAlunos() {
  try {
    const res  = await fetch(`${API_BACKEND}/alunos`);
    const data = await res.json();

    // data.value é o objeto { "Nome": saldo, ... }
    const alunos = Object.entries(data.value);

    selectAluno.innerHTML = alunos
      .map(([nome, saldo]) => `<option value="${nome}">${nome}</option>`)
      .join("");

    // Seleciona o primeiro e atualiza o saldo
    alunoSelecionado = alunos[0][0];
    saldoAtual       = alunos[0][1];
    atualizarSaldoUI();

    selectAluno.addEventListener("change", (e) => {
      alunoSelecionado = e.target.value;
      saldoAtual       = data.value[alunoSelecionado] ?? 0;
      atualizarSaldoUI();
    });
  } catch (err) {
    console.error("Erro ao carregar alunos:", err);
    exibirMensagem("Não foi possível carregar a lista de alunos.", "erro");
  }
}

function atualizarSaldoUI() {
  saldoSpan.textContent = `Saldo: ${saldoAtual} 🪙`;
}

// ---------- Renderizar cards de produtos ----------
function renderizarProdutos() {
  container.innerHTML = PRODUTOS.map((p) => `
    <div class="card-produto">
      <h3>${p.nome}</h3>
      <p class="descricao">${p.descricao}</p>
      <p class="preco">${p.preco} 🪙</p>
      <button class="btn-comprar" data-id="${p.id}">Comprar</button>
    </div>
  `).join("");

  container.querySelectorAll(".btn-comprar").forEach((btn) => {
    btn.addEventListener("click", () => comprar(Number(btn.dataset.id)));
  });
}

// ---------- POST: enviar compra ao backend ----------
async function comprar(produtoId) {
  const produto = PRODUTOS.find((p) => p.id === produtoId);
  if (!produto) return;

  if (saldoAtual < produto.preco) {
    exibirMensagem("Saldo insuficiente!", "erro");
    return;
  }

  try {
    const res = await fetch(`${API_BACKEND}/comprar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aluno: alunoSelecionado,
        valor: produto.preco,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      exibirMensagem(data.erro || "Erro na compra.", "erro");
      return;
    }

    // Atualiza o saldo local com o novo valor devolvido pelo backend
    saldoAtual = data.novoSaldo;
    atualizarSaldoUI();
    exibirMensagem(`Compra de "${produto.nome}" realizada!`, "sucesso");
  } catch (err) {
    console.error(err);
    exibirMensagem("Falha de comunicação com o servidor.", "erro");
  }
}

// ---------- Feedback visual ----------
let timerMsg;
function exibirMensagem(texto, tipo) {
  msgEl.textContent = texto;
  msgEl.className   = `mensagem ${tipo}`;
  clearTimeout(timerMsg);
  timerMsg = setTimeout(() => {
    msgEl.className = "mensagem";
  }, 3000);
}

init();