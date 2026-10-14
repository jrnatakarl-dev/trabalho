import express from "express";
import cors from "cors";

const app  = express();
const PORT = 3000;

const API_EXTERNA = "https://onlinestorage.you.tec.br/api/getkey/senai/coins";

app.use(cors());
app.use(express.json());

// ----------------------------------------------------------------
// GET /api/alunos → repassa os dados da API externa
// ----------------------------------------------------------------
app.get("/api/alunos", async (req, res) => {
  try {
    const resposta = await fetch(API_EXTERNA);
    if (!resposta.ok) throw new Error("Falha ao buscar dados externos");

    const dados = await resposta.json();
    res.json(dados);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao consultar a API externa." });
  }
});

// ----------------------------------------------------------------
// POST /api/comprar → subtrai pontos e atualiza a API externa
// Body esperado: { "aluno": "Nome do Aluno", "valor": 50 }
// ----------------------------------------------------------------
app.post("/api/comprar", async (req, res) => {
  const { aluno, valor } = req.body;

  if (!aluno || typeof valor !== "number" || valor <= 0) {
    return res.status(400).json({ erro: "Dados inválidos." });
  }

  try {
    // 1) Busca o estado atual na API externa
    const respGet = await fetch(API_EXTERNA);
    if (!respGet.ok) throw new Error("Erro ao ler dados externos");

    const dados = await respGet.json();
    const saldos = dados.value; // { "Nome": saldo, ... }

    if (!(aluno in saldos)) {
      return res.status(404).json({ erro: "Aluno não encontrado." });
    }

    const saldoAtual = saldos[aluno];

    // 2) Verifica se há saldo suficiente
    if (saldoAtual < valor) {
      return res.status(400).json({ erro: "Saldo insuficiente." });
    }

    // 3) Subtrai o valor
    saldos[aluno] = saldoAtual - valor;

    // 4) Envia o objeto `value` atualizado via POST para a API externa
    //    (ajuste o corpo conforme a API realmente esperar)
    const respPost = await fetch(API_EXTERNA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: saldos }),
    });

    if (!respPost.ok) {
      const texto = await respPost.text();
      throw new Error(`Falha no POST externo: ${texto}`);
    }

    // 5) Devolve o novo saldo para o front‑end
    res.json({
      mensagem: "Compra efetuada com sucesso.",
      novoSaldo: saldos[aluno],
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro interno ao processar a compra." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});