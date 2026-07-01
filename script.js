// ===== DATABASE =====
let db = {
    clientes: [],
    produtos: [],
    os: [],
    vendas: [],
    config: { garantiaDias: 90 }
};

let cart = [];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateDashboard();
    renderProdutosTable();
    renderClientesTable();
    renderPDVProducts();
    renderGarantias();
    renderOSLista();
    atualizarClientesList();
    adicionarLinhaTabela();

    // Define data de hoje
    document.getElementById('os-data').value = new Date().toISOString().split('T')[0];

    // Máscaras
    document.addEventListener('input', aplicarMascaras);

    // Auto-preencher cliente
    document.getElementById('os-nome').addEventListener('change', function() {
        const nome = this.value;
        const cliente = db.clientes.find(c => c.nome.toLowerCase() === nome.toLowerCase());
        if (cliente) {
            document.getElementById('os-cpf').value = cliente.cpf || '';
            document.getElementById('os-telefone').value = cliente.telefone || '';
        }
    });
});

// ===== STORAGE =====
function loadData() {
    const saved = localStorage.getItem('caducell_db');
    if (saved) db = JSON.parse(saved);
}

function saveData() {
    localStorage.setItem('caducell_db', JSON.stringify(db));
}

// ===== NAVIGATION =====
function toggleMenu() {
    document.getElementById('nav').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageName).classList.add('active');
    document.querySelectorAll('.nav-link,.bottom-nav-item').forEach(i => i.classList.remove('active'));
    
    // Atualiza nav-link ativa
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(`'${pageName}'`)) {
            link.classList.add('active');
        }
    });
    
    // Atualiza bottom-nav ativa
    const bottomLinks = document.querySelectorAll('.bottom-nav-item');
    bottomLinks.forEach(link => {
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(`'${pageName}'`)) {
            link.classList.add('active');
        }
    });
    
    document.getElementById('nav').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');

    if (pageName === 'dashboard') updateDashboard();
    if (pageName === 'pdv') renderPDVProducts();
    if (pageName === 'os-lista') renderOSLista();
    if (pageName === 'produtos') renderProdutosTable();
    if (pageName === 'clientes') renderClientesTable();
    if (pageName === 'garantia') renderGarantias();
}

// ===== MODAL =====
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function openProdutoModal() {
    document.getElementById('produto-nome').value = '';
    document.getElementById('produto-categoria').value = '';
    document.getElementById('produto-preco').value = '';
    document.getElementById('produto-estoque').value = '';
    document.getElementById('produto-descricao').value = '';
    openModal('produto-modal');
}

function openClienteModal() {
    document.getElementById('cliente-nome').value = '';
    document.getElementById('cliente-cpf').value = '';
    document.getElementById('cliente-telefone').value = '';
    document.getElementById('cliente-email').value = '';
    document.getElementById('cliente-endereco').value = '';
    openModal('cliente-modal');
}

window.onclick = function(e) {
    if (e.target.classList.contains('modal')) e.target.classList.remove('active');
};

// ===== MÁSCARAS =====
function aplicarMascaras(e) {
    if (e.target.id === 'cliente-telefone' || e.target.id === 'os-telefone') {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length <= 11) {
            v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
            v = v.replace(/(\d)(\d{4})$/, '$1-$2');
            e.target.value = v;
        }
    }
    if (e.target.id === 'cliente-cpf' || e.target.id === 'os-cpf') {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length <= 11) {
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = v;
        }
    }
}

// ===== CLIENTES =====
function saveCliente() {
    const nome = document.getElementById('cliente-nome').value.trim();
    const cpf = document.getElementById('cliente-cpf').value;
    const telefone = document.getElementById('cliente-telefone').value;
    const email = document.getElementById('cliente-email').value;
    const endereco = document.getElementById('cliente-endereco').value;

    if (!nome || !telefone) { alert('Preencha nome e telefone!'); return; }

    db.clientes.push({
        id: Date.now(), nome, cpf, telefone, email, endereco,
        dataCadastro: new Date().toISOString()
    });
    saveData();
    closeModal('cliente-modal');
    renderClientesTable();
    atualizarClientesList();
    alert('Cliente cadastrado!');
}

function renderClientesTable() {
    const tbody = document.getElementById('clientes-table');
    if (!tbody) return;
    if (db.clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum cliente</td></tr>';
        return;
    }
    tbody.innerHTML = db.clientes.map(c => `
        <tr>
            <td>${c.nome}</td>
            <td>${c.telefone}</td>
            <td>${c.cpf || '-'}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteCliente(${c.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function deleteCliente(id) {
    if (!confirm('Excluir cliente?')) return;
    db.clientes = db.clientes.filter(c => c.id !== id);
    saveData();
    renderClientesTable();
    atualizarClientesList();
}

function searchClientes() {
    const s = document.getElementById('cliente-search').value.toLowerCase();
    document.querySelectorAll('#clientes-table tr').forEach(r => {
        r.style.display = r.textContent.toLowerCase().includes(s) ? '' : 'none';
    });
}

function atualizarClientesList() {
    const dl = document.getElementById('clientes-list');
    if (dl) dl.innerHTML = db.clientes.map(c => `<option value="${c.nome}">`).join('');
}

// ===== PRODUTOS =====
function saveProduto() {
    const nome = document.getElementById('produto-nome').value.trim();
    const categoria = document.getElementById('produto-categoria').value;
    const preco = parseFloat(document.getElementById('produto-preco').value);
    const estoque = parseInt(document.getElementById('produto-estoque').value);
    const descricao = document.getElementById('produto-descricao').value;

    if (!nome || !categoria || isNaN(preco) || isNaN(estoque)) {
        alert('Preencha todos os campos obrigatórios!'); return;
    }

    db.produtos.push({
        id: Date.now(), nome, categoria, preco, estoque, descricao,
        dataCadastro: new Date().toISOString()
    });
    saveData();
    closeModal('produto-modal');
    renderProdutosTable();
    renderPDVProducts();
    alert('Produto cadastrado!');
}

function renderProdutosTable() {
    const tbody = document.getElementById('produtos-table');
    if (!tbody) return;
    const cats = { capinha:'Capinha', película:'Película', carregador:'Carregador', cabo:'Cabo', fone:'Fone', bateria:'Bateria', tela:'Tela/Display', pecas:'Peças', acessorios:'Acessórios', celular:'Celular' };
    if (db.produtos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum produto</td></tr>';
        return;
    }
    tbody.innerHTML = db.produtos.map(p => `
        <tr>
            <td>${p.nome}</td>
            <td>${cats[p.categoria] || p.categoria}</td>
            <td>R$ ${p.preco.toFixed(2)}</td>
            <td>${p.estoque}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteProduto(${p.id})">🗑️</button></td>
        </tr>
    `).join('');
}

function deleteProduto(id) {
    if (!confirm('Excluir produto?')) return;
    db.produtos = db.produtos.filter(p => p.id !== id);
    saveData();
    renderProdutosTable();
    renderPDVProducts();
}

function searchProdutos() {
    const s = document.getElementById('produto-search').value.toLowerCase();
    document.querySelectorAll('#produtos-table tr').forEach(r => {
        r.style.display = r.textContent.toLowerCase().includes(s) ? '' : 'none';
    });
}

// ===== PDV / CARRINHO =====
function renderPDVProducts() {
    const container = document.getElementById('pdv-products');
    if (!container) return;
    const icons = { capinha:'📱', película:'🛡️', carregador:'🔌', cabo:'🔗', fone:'🎧', bateria:'🔋', tela:'📺', pecas:'⚙️', acessorios:'🎁', celular:'📱' };
    if (db.produtos.length === 0) {
        container.innerHTML = '<p class="text-center" style="grid-column:1/-1;padding:2rem;color:#4b5563;">Nenhum produto</p>';
        return;
    }
    container.innerHTML = db.produtos.filter(p => p.estoque > 0).map(p => `
        <div class="product-card" onclick="addToCart(${p.id})">
            <div class="product-image">${icons[p.categoria] || '📦'}</div>
            <div class="product-info">
                <div class="product-name">${p.nome}</div>
                <div class="product-price">R$ ${p.preco.toFixed(2)}</div>
                <div class="product-stock">Estoque: ${p.estoque}</div>
            </div>
        </div>
    `).join('');
}

function searchPDVProducts() {
    const s = document.getElementById('pdv-search').value.toLowerCase();
    document.querySelectorAll('#pdv-products .product-card').forEach(c => {
        c.style.display = c.textContent.toLowerCase().includes(s) ? '' : 'none';
    });
}

function addToCart(id) {
    const p = db.produtos.find(x => x.id === id);
    if (!p || p.estoque <= 0) { alert('Sem estoque!'); return; }
    const item = cart.find(x => x.id === id);
    if (item) {
        if (item.qty < p.estoque) item.qty++;
        else { alert('Estoque máximo!'); return; }
    } else {
        cart.push({ id: p.id, nome: p.nome, preco: p.preco, qty: 1 });
    }
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = '<p class="text-center" style="color:#4b5563;padding:2rem;">Carrinho vazio</p>';
        if (totalEl) totalEl.textContent = 'Total: R$ 0,00';
        return;
    }
    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.preco * item.qty;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nome}</div>
                    <div class="cart-item-price">R$ ${item.preco.toFixed(2)}</div>
                    <div class="cart-item-qty">
                        <button class="qty-btn" onclick="updateCartQty(${item.id},-1)">-</button>
                        <span>${item.qty}</span>
                        <button class="qty-btn" onclick="updateCartQty(${item.id},1)">+</button>
                        <button class="btn btn-sm btn-danger" style="margin-left:auto;" onclick="removeFromCart(${item.id})">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    if (totalEl) totalEl.textContent = `Total: R$ ${total.toFixed(2)}`;
}

function updateCartQty(id, change) {
    const item = cart.find(x => x.id === id);
    const p = db.produtos.find(x => x.id === id);
    if (!item || !p) return;
    const nq = item.qty + change;
    if (nq <= 0) { removeFromCart(id); return; }
    if (nq > p.estoque) { alert('Estoque máximo!'); return; }
    item.qty = nq;
    renderCart();
}

function removeFromCart(id) {
    cart = cart.filter(x => x.id !== id);
    renderCart();
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm('Limpar carrinho?')) { cart = []; renderCart(); }
}

function checkout() {
    if (cart.length === 0) { alert('Carrinho vazio!'); return; }
    let total = 0;
    const itens = cart.map(item => {
        total += item.preco * item.qty;
        const p = db.produtos.find(x => x.id === item.id);
        if (p) p.estoque -= item.qty;
        return { produtoId: item.id, nome: item.nome, qty: item.qty, preco: item.preco };
    });
    db.vendas.push({ id: Date.now(), itens, total, data: new Date().toISOString() });
    saveData();
    cart = [];
    renderCart();
    renderPDVProducts();
    renderProdutosTable();
    alert(`Venda finalizada!\nTotal: R$ ${total.toFixed(2)}`);
}

// ===== TABELA DE ITENS (BLOCO) - CORRIGIDO =====
function adicionarLinhaTabela() {
    const tbody = document.getElementById('tabela-itens');
    if (!tbody) return;
    
    const idx = tbody.rows.length;
    const tr = document.createElement('tr');
    
    // Inputs com estilos inline para garantir que sejam editáveis
    tr.innerHTML = `
        <td class="tabela-quant">
            <input type="number" min="1" value="1" class="item-quant" 
                   oninput="calcularLinha(this)" 
                   style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:2px;font-size:.9rem;text-align:center;min-height:32px;box-sizing:border-box;">
        </td>
        <td class="tabela-desc">
            <input type="text" class="item-desc" placeholder="Digite a descrição..." 
                   style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:2px;font-size:.9rem;min-height:32px;box-sizing:border-box;background:#fff;color:#1f2937;">
        </td>
        <td class="tabela-valor">
            <input type="number" step="0.01" min="0" placeholder="0,00" class="item-valor" 
                   oninput="calcularLinha(this)" 
                   style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:2px;font-size:.9rem;text-align:right;min-height:32px;box-sizing:border-box;pointer-events:auto;cursor:text;">
        </td>
        <td class="tabela-total">
            <input type="text" value="0,00" class="item-total" readonly 
                   style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:2px;font-size:.9rem;text-align:right;min-height:32px;box-sizing:border-box;background:#f3f4f6;color:#374151;font-weight:bold;">
        </td>
    `;
    tbody.appendChild(tr);
    
    // Foca no campo de descrição
    setTimeout(() => {
        const descInput = tr.querySelector('.item-desc');
        if (descInput) descInput.focus();
    }, 100);
}

// Função corrigida - recebe o elemento input diretamente
function calcularLinha(inputElement) {
    const tr = inputElement.closest('tr');
    if (!tr) return;
    
    const q = parseFloat(tr.querySelector('.item-quant').value) || 0;
    const valorRaw = tr.querySelector('.item-valor').value.replace(',', '.');
    const v = parseFloat(valorRaw) || 0;
    const total = q * v;
    
    // Formata como moeda brasileira
    tr.querySelector('.item-total').value = total.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    calcularTotalGeral();
}

function calcularTotalGeral() {
    const rows = document.getElementById('tabela-itens').rows;
    let total = 0;
    for (let r of rows) {
        const totalStr = r.querySelector('.item-total').value.replace('.', '').replace(',', '.');
        total += parseFloat(totalStr) || 0;
    }
    document.getElementById('os-valor-total').value = total.toFixed(2);
    calcularResta();
}

function calcularResta() {
    const total = parseFloat(document.getElementById('os-valor-total').value) || 0;
    const sinal = parseFloat(document.getElementById('os-sinal').value) || 0;
    document.getElementById('os-resta').value = (total - sinal).toFixed(2);
}

function getItensTabela() {
    const rows = document.getElementById('tabela-itens').rows;
    const itens = [];
    for (let r of rows) {
        const q = parseFloat(r.querySelector('.item-quant').value) || 0;
        const desc = r.querySelector('.item-desc').value.trim();
        const valorStr = r.querySelector('.item-valor').value;
        const v = parseFloat(valorStr) || 0;
        const totalStr = r.querySelector('.item-total').value.replace('.', '').replace(',', '.');
        const t = parseFloat(totalStr) || 0;
        if (desc && q > 0) {
            itens.push({ quant: q, descricao: desc, valorUnit: v, total: t });
        }
    }
    return itens;
}

function limparTabela() {
    const tbody = document.getElementById('tabela-itens');
    if (tbody) tbody.innerHTML = '';
    adicionarLinhaTabela();
    document.getElementById('os-valor-total').value = '';
    document.getElementById('os-sinal').value = '';
    document.getElementById('os-resta').value = '';
}

// ===== OS / PEDIDO / ORÇAMENTO =====
function getTipoDoc() {
    const r = document.querySelector('input[name="tipo-doc"]:checked');
    return r ? r.value : 'pedido';
}

function getCheckboxesAparelho() {
    return {
        arranhado: document.getElementById('chk-arranhado').checked,
        trincado: document.getElementById('chk-trincado').checked,
        semChip: document.getElementById('chk-sem-chip').checked,
        comChip: document.getElementById('chk-com-chip').checked,
        desbloqueado: document.getElementById('chk-desbloqueado').checked,
        semBateria: document.getElementById('chk-sem-bateria').checked,
        semCartao: document.getElementById('chk-sem-cartao').checked,
        comCartao: document.getElementById('chk-com-cartao').checked
    };
}

function salvarOS() {
    const nome = document.getElementById('os-nome').value.trim();
    const defeito = document.getElementById('os-defeito').value.trim();
    const itens = getItensTabela();

    if (!nome) { alert('Informe o nome do cliente!'); return; }
    if (itens.length === 0 && !defeito) { alert('Informe o defeito ou adicione itens!'); return; }

    const tipoDoc = getTipoDoc();
    const prazoGarantia = document.querySelector('input[name="prazo-garantia"]:checked');
    const diasGarantia = prazoGarantia ? parseInt(prazoGarantia.value) : 90;

    const os = {
        id: Date.now(),
        numero: db.os.length + 1,
        tipo: tipoDoc,
        data: document.getElementById('os-data').value || new Date().toISOString().split('T')[0],
        nome: nome,
        cpf: document.getElementById('os-cpf').value,
        telefone: document.getElementById('os-telefone').value,
        defeito: defeito,
        senhaRetirada: document.getElementById('os-senha-retirada').value,
        modelo: document.getElementById('os-modelo').value,
        imei: document.getElementById('os-imei').value,
        notaFiscal: document.querySelector('input[name="nf"]:checked')?.value || 'nao',
        garantia: document.querySelector('input[name="garantia"]:checked')?.value || 'sim',
        prazoGarantiaDias: diasGarantia,
        checkboxes: getCheckboxesAparelho(),
        itens: itens,
        valorTotal: parseFloat(document.getElementById('os-valor-total').value) || 0,
        sinal: parseFloat(document.getElementById('os-sinal').value) || 0,
        resta: parseFloat(document.getElementById('os-resta').value) || 0,
        status: 'aberto',
        dataAbertura: new Date().toISOString(),
        dataConclusao: null,
        garantiaAte: null
    };

    // Calcular garantia
    if (os.garantia === 'sim' && (tipoDoc === 'os' || tipoDoc === 'pedido')) {
        const dataFim = new Date();
        dataFim.setDate(dataFim.getDate() + diasGarantia);
        os.garantiaAte = dataFim.toISOString();
    }

    db.os.push(os);
    saveData();

    alert(`${tipoDoc === 'os' ? 'OS' : tipoDoc === 'orcamento' ? 'Orçamento' : 'Pedido'} #${os.numero} salvo!\nGarantia: ${diasGarantia} dias`);
    limparFormOS();
    updateDashboard();
}

function limparFormOS() {
    document.getElementById('os-data').value = new Date().toISOString().split('T')[0];
    document.getElementById('os-nome').value = '';
    document.getElementById('os-cpf').value = '';
    document.getElementById('os-telefone').value = '';
    document.getElementById('os-defeito').value = '';
    document.getElementById('os-senha-retirada').value = '';
    document.getElementById('os-modelo').value = '';
    document.getElementById('os-imei').value = '';
    document.getElementById('os-sinal').value = '';
    document.getElementById('os-resta').value = '';
    document.getElementById('os-valor-total').value = '';
    document.querySelector('input[name="tipo-doc"][value="pedido"]').checked = true;
    document.querySelector('input[name="nf"][value="nao"]').checked = true;
    document.querySelector('input[name="garantia"][value="sim"]').checked = true;
    document.querySelector('input[name="prazo-garantia"][value="90"]').checked = true;
    ['arranhado','trincado','sem-chip','com-chip','desbloqueado','sem-bateria','sem-cartao','com-cartao'].forEach(id => {
        const el = document.getElementById('chk-' + id);
        if (el) el.checked = false;
    });
    limparTabela();
}

function imprimirOS() {
    // Impressão direta da página nova-os (formulário ativo)
    window.print();
}

function imprimirOSModal(id) {
    // Impressão a partir do modal de visualização
    const os = db.os.find(o => o.id === id);
    if (!os) return;

    const tipoLabels = { os:'ORDEM DE SERVIÇO', pedido:'PEDIDO', orcamento:'ORÇAMENTO' };
    const chk = os.checkboxes || {};
    const chkList = [];
    if (chk.arranhado) chkList.push('Arranhado');
    if (chk.trincado) chkList.push('Trincado');
    if (chk.semChip) chkList.push('Sem Chip');
    if (chk.comChip) chkList.push('Com Chip');
    if (chk.desbloqueado) chkList.push('Desbloqueado');
    if (chk.semBateria) chkList.push('Sem Bateria');
    if (chk.semCartao) chkList.push('Sem Cartão');
    if (chk.comCartao) chkList.push('Com Cartão');

    let itensHTML = '';
    if (os.itens && os.itens.length > 0) {
        itensHTML = `
            <table style="width:100%;border-collapse:collapse;margin:.5rem 0;font-size:10pt;">
                <thead><tr style="background:#ddd;">
                    <th style="padding:4px;border:1px solid #000;width:8%">QUANT.</th>
                    <th style="padding:4px;border:1px solid #000;">DESCRIÇÃO</th>
                    <th style="padding:4px;border:1px solid #000;width:18%">VALOR UNIT.</th>
                    <th style="padding:4px;border:1px solid #000;width:18%">TOTAL</th>
                </tr></thead>
                <tbody>
                    ${os.itens.map(i => `
                        <tr>
                            <td style="padding:3px 5px;border:1px solid #999;text-align:center;">${i.quant}</td>
                            <td style="padding:3px 5px;border:1px solid #999;">${i.descricao}</td>
                            <td style="padding:3px 5px;border:1px solid #999;text-align:right;">R$ ${i.valorUnit.toFixed(2)}</td>
                            <td style="padding:3px 5px;border:1px solid #999;text-align:right;">R$ ${i.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                    ${Array(Math.max(0, 5 - os.itens.length)).fill('<tr><td style="padding:3px 5px;border:1px solid #999;">&nbsp;</td><td style="border:1px solid #999;"></td><td style="border:1px solid #999;"></td><td style="border:1px solid #999;"></td></tr>').join('')}
                </tbody>
            </table>`;
    } else {
        itensHTML = `
            <table style="width:100%;border-collapse:collapse;margin:.5rem 0;font-size:10pt;">
                <thead><tr style="background:#ddd;">
                    <th style="padding:4px;border:1px solid #000;width:8%">QUANT.</th>
                    <th style="padding:4px;border:1px solid #000;">DESCRIÇÃO</th>
                    <th style="padding:4px;border:1px solid #000;width:18%">VALOR UNIT.</th>
                    <th style="padding:4px;border:1px solid #000;width:18%">TOTAL</th>
                </tr></thead>
                <tbody>
                    ${Array(5).fill('<tr><td style="padding:8px 5px;border:1px solid #999;">&nbsp;</td><td style="border:1px solid #999;"></td><td style="border:1px solid #999;"></td><td style="border:1px solid #999;"></td></tr>').join('')}
                </tbody>
            </table>`;
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>CADU CELL - ${tipoLabels[os.tipo] || 'DOC'} #${os.numero}</title>
<style>
@page { size: A4 portrait; margin: 10mm; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; background: #fff; }
.bloco { border: 2px solid #000; padding: 10px; }
.bloco-header { display: flex; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
.bloco-logo h1 { font-size: 22pt; }
.bloco-subtitulo { background: #000; color: #fff; padding: 2px 6px; font-size: 9pt; display: inline-block; margin-top: 2px; }
.bloco-servicos { text-align: right; font-size: 9pt; font-weight: bold; line-height: 1.6; }
.linha { margin-bottom: 5px; }
.linha label { font-size: 10pt; font-weight: bold; }
.linha .val { border-bottom: 1px solid #666; display: inline-block; min-width: 200px; padding: 1px 4px; font-size: 10pt; }
.linha-dupla { display: flex; gap: 20px; }
.linha-dupla > div { flex: 1; }
.checks { border: 1px solid #666; padding: 5px; margin: 6px 0; font-size: 10pt; }
.check-item { display: inline-block; margin-right: 10px; }
.totais { margin-top: 6px; text-align: right; }
.totais p { margin-bottom: 3px; font-size: 11pt; }
.totais-total { background: #000; color: #fff; padding: 4px 8px; display: inline-block; font-weight: bold; }
.legais { border: 1px solid #ccc; padding: 5px; margin: 6px 0; font-size: 9pt; }
.legais p { margin-bottom: 3px; }
.prazos { display: flex; gap: 15px; margin: 6px 0; font-size: 10pt; font-weight: bold; }
.prazo-box { border: 1px solid #000; padding: 2px 8px; }
.prazo-box.ativo { background: #000; color: #fff; }
.obs ul { font-size: 9pt; padding-left: 15px; margin: 4px 0; }
.obs li { margin-bottom: 2px; }
.assinaturas { display: flex; gap: 30px; margin-top: 15px; }
.ass-box { flex: 1; text-align: center; font-size: 10pt; border-top: 1px solid #000; padding-top: 4px; }
.garantia-badge { background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; padding: 6px 10px; border-radius: 4px; margin-top: 8px; font-weight: bold; font-size: 10pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style>
</head>
<body>
<div class="bloco">
  <div class="bloco-header">
    <div class="bloco-logo">
      <h1>CADU CELL</h1>
      <div class="bloco-subtitulo">ASSISTÊNCIA TÉCNICA ESPECIALIZADA</div>
    </div>
    <div class="bloco-servicos">CONSERTO<br>RECUPERAÇÃO<br>ACESSÓRIOS<br>APARELHOS</div>
  </div>

  <div class="linha linha-dupla">
    <div><label>TIPO: </label> <span class="val">${tipoLabels[os.tipo] || 'DOC'} #${os.numero}</span></div>
    <div><label>DATA: </label> <span class="val">${new Date(os.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span></div>
  </div>
  <div class="linha"><label>NOME: </label> <span class="val" style="min-width:300px;">${os.nome}</span></div>
  <div class="linha linha-dupla">
    <div><label>CPF: </label> <span class="val">${os.cpf || '-'}</span></div>
    <div><label>TELEFONE: </label> <span class="val">${os.telefone || '-'}</span></div>
  </div>
  ${os.modelo ? `<div class="linha"><label>MODELO: </label> <span class="val">${os.modelo}</span></div>` : ''}
  ${os.imei ? `<div class="linha"><label>IMEI: </label> <span class="val">${os.imei}</span></div>` : ''}
  ${os.senhaRetirada ? `<div class="linha"><label>SENHA RETIRADA: </label> <span class="val">${os.senhaRetirada}</span></div>` : ''}
  ${os.defeito ? `<div class="linha"><label>DEFEITO: </label> <span class="val" style="min-width:300px;">${os.defeito}</span></div>` : ''}

  <div class="checks">
    <span class="check-item">${chk.arranhado?'☑':'☐'} ARRANHADO</span>
    <span class="check-item">${chk.trincado?'☑':'☐'} TRINCADO</span>
    <span class="check-item">${chk.semChip?'☑':'☐'} SEM CHIP</span>
    <span class="check-item">${chk.comChip?'☑':'☐'} COM CHIP</span>
    <span class="check-item">${chk.desbloqueado?'☑':'☐'} DESBLOQUEADO</span>
    <span class="check-item">${chk.semBateria?'☑':'☐'} SEM BATERIA</span>
    <span class="check-item">${chk.semCartao?'☑':'☐'} SEM CARTÃO</span>
    <span class="check-item">${chk.comCartao?'☑':'☐'} COM CARTÃO</span>
    <span class="check-item">NF: ${os.notaFiscal==='sim'?'☑ SIM':'☐ SIM ☑ NÃO'}</span>
    <span class="check-item">GARANTIA: ${os.garantia==='sim'?'☑ SIM':'☑ NÃO'}</span>
  </div>

  ${itensHTML}

  <div class="totais">
    <p><strong>SINAL:</strong> R$ ${(os.sinal||0).toFixed(2)}</p>
    <p><strong>RESTA:</strong> R$ ${(os.resta||0).toFixed(2)}</p>
    <p><span class="totais-total">VALOR TOTAL: R$ ${(os.valorTotal||0).toFixed(2)}</span></p>
  </div>

  <div class="legais">
    <p>Ao preencher esta nota, o cliente autoriza o técnico a realizar o reparo no equipamento descrito acima.</p>
    <p>⚠️ A GARANTIA PODERÁ SER INVALIDADA CASO O APARELHO ESTEJA OXIDADO OU APRESENTE OUTROS TIPOS DE PROBLEMAS.</p>
    <p>📅 CASO O APARELHO NÃO SEJA RETIRADO NO PRAZO DE 90 DIAS, O MESMO PODERÁ SER CONSIDERADO ABANDONO.</p>
  </div>

  <div class="prazos">
    <span class="prazo-box ${os.prazoGarantiaDias==7?'ativo':''}">7 DIAS</span>
    <span class="prazo-box ${os.prazoGarantiaDias==30?'ativo':''}">30 DIAS</span>
    <span class="prazo-box ${os.prazoGarantiaDias==90?'ativo':''}">90 DIAS</span>
    <span class="prazo-box ${os.prazoGarantiaDias>90?'ativo':''}">90+ DIAS</span>
  </div>

  <div class="obs">
    <ul>
      <li>A garantia cobre peças e mão de obra. NÃO COBRE quedas, água ou mau uso.</li>
      <li>Todos os serviços realizados seguem o código de defesa do consumidor.</li>
      <li>Não nos responsabilizamos por perdas, backups ou dados pessoais.</li>
      <li>Consertos em módulos de placa entram em garantia apenas se o selo de garantia estiver intacto.</li>
    </ul>
  </div>

  ${os.garantiaAte ? `<div class="garantia-badge">🛡️ Garantia até: ${new Date(os.garantiaAte).toLocaleDateString('pt-BR')} (${os.prazoGarantiaDias} dias)</div>` : ''}

  <div class="assinaturas">
    <div class="ass-box">ASS. CLIENTE</div>
    <div class="ass-box">ASS. ASSISTÊNCIA TÉCNICA</div>
  </div>
</div>
<script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }</script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=800,height=900');
    w.document.write(html);
    w.document.close();
}

// ===== LISTA OS =====
function renderOSLista() {
    const container = document.getElementById('os-lista-container');
    if (!container) return;
    if (db.os.length === 0) {
        container.innerHTML = '<p class="text-center" style="color:#4b5563;padding:2rem;">Nenhuma OS</p>';
        return;
    }
    const tipoLabels = { os:'OS', pedido:'PEDIDO', orcamento:'ORÇAMENTO' };
    const statusLabels = { 
        aberto:{t:'Aberto',c:'badge-info'}, 
        'em-andamento':{t:'Em Andamento',c:'badge-warning'}, 
        concluido:{t:'Concluído',c:'badge-success'}, 
        entregue:{t:'Entregue',c:'badge-secondary'} 
    };

    container.innerHTML = db.os.slice().reverse().map(os => {
        const st = statusLabels[os.status] || {t:os.status,c:'badge-info'};
        return `
            <div class="os-card ${os.status}">
                <div class="os-header">
                    <div>
                        <div class="os-number">${tipoLabels[os.tipo] || 'DOC'} #${os.numero}</div>
                        <div class="os-client">${os.nome}</div>
                        <div class="os-info">${os.modelo || 'Sem modelo'}</div>
                    </div>
                    <span class="badge ${st.c}">${st.t}</span>
                </div>
                <div class="os-info">
                    <div>📞 ${os.telefone}</div>
                    ${os.defeito ? `<div>🔧 ${os.defeito}</div>` : ''}
                    <div>💰 Total: R$ ${os.valorTotal.toFixed(2)}</div>
                    ${os.garantiaAte ? `<div>🛡️ Garantia até: ${new Date(os.garantiaAte).toLocaleDateString('pt-BR')}</div>` : ''}
                </div>
                <div class="os-footer">
                    <button class="btn btn-sm btn-primary" onclick="viewOS(${os.id})">👁️ Ver</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteOS(${os.id})">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function searchOS() {
    const s = document.getElementById('os-search').value.toLowerCase();
    document.querySelectorAll('#os-lista-container .os-card').forEach(c => {
        c.style.display = c.textContent.toLowerCase().includes(s) ? '' : 'none';
    });
}

function viewOS(id) {
    const os = db.os.find(o => o.id === id);
    if (!os) return;
    document.getElementById('view-os-numero').textContent = os.numero;

    const tipoLabels = { os:'ORDEM DE SERVIÇO', pedido:'PEDIDO', orcamento:'ORÇAMENTO' };
    const chk = os.checkboxes || {};
    const chkList = [];
    if (chk.arranhado) chkList.push('Arranhado');
    if (chk.trincado) chkList.push('Trincado');
    if (chk.semChip) chkList.push('Sem Chip');
    if (chk.comChip) chkList.push('Com Chip');
    if (chk.desbloqueado) chkList.push('Desbloqueado');
    if (chk.semBateria) chkList.push('Sem Bateria');
    if (chk.semCartao) chkList.push('Sem Cartão');
    if (chk.comCartao) chkList.push('Com Cartão');

    let itensHTML = '';
    if (os.itens && os.itens.length > 0) {
        itensHTML = `
            <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
                <thead><tr style="background:#1f2937;color:#fff;">
                    <th style="padding:.5rem;border:1px solid #000;">QUANT.</th>
                    <th style="padding:.5rem;border:1px solid #000;">DESCRIÇÃO</th>
                    <th style="padding:.5rem;border:1px solid #000;">VALOR UNIT.</th>
                    <th style="padding:.5rem;border:1px solid #000;">TOTAL</th>
                </tr></thead>
                <tbody>
                    ${os.itens.map(i => `
                        <tr>
                            <td style="padding:.5rem;border:1px solid #ddd;">${i.quant}</td>
                            <td style="padding:.5rem;border:1px solid #ddd;">${i.descricao}</td>
                            <td style="padding:.5rem;border:1px solid #ddd;">R$ ${i.valorUnit.toFixed(2)}</td>
                            <td style="padding:.5rem;border:1px solid #ddd;">R$ ${i.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    let content = `
        <div style="border:2px solid #000;padding:1rem;font-family:Arial;">
            <div style="display:flex;justify-content:space-between;border-bottom:3px solid #000;padding-bottom:1rem;margin-bottom:1rem;">
                <div>
                    <h1 style="margin:0;font-size:2rem;">CADU CELL</h1>
                    <p style="background:#000;color:#fff;padding:.25rem .75rem;font-size:.75rem;display:inline-block;">ASSISTÊNCIA TÉCNICA ESPECIALIZADA</p>
                </div>
                <div style="text-align:right;font-size:.8rem;font-weight:bold;">
                    <p>CONSERTO</p><p>RECUPERAÇÃO</p><p>ACESSÓRIOS</p><p>APARELHOS</p>
                </div>
            </div>
            <p><strong>Tipo:</strong> ${tipoLabels[os.tipo]}</p>
            <p><strong>Data:</strong> ${new Date(os.data).toLocaleDateString('pt-BR')}</p>
            <p><strong>Cliente:</strong> ${os.nome}</p>
            <p><strong>CPF:</strong> ${os.cpf || '-'}</p>
            <p><strong>Telefone:</strong> ${os.telefone}</p>
            ${os.modelo ? `<p><strong>Modelo:</strong> ${os.modelo}</p>` : ''}
            ${os.imei ? `<p><strong>IMEI:</strong> ${os.imei}</p>` : ''}
            ${os.senhaRetirada ? `<p><strong>Senha Retirada:</strong> ${os.senhaRetirada}</p>` : ''}
            ${os.defeito ? `<p><strong>Defeito:</strong> ${os.defeito}</p>` : ''}
            ${chkList.length > 0 ? `<p><strong>Observações:</strong> ${chkList.join(', ')}</p>` : ''}
            <p><strong>Nota Fiscal:</strong> ${os.notaFiscal === 'sim' ? 'Sim' : 'Não'}</p>
            <p><strong>Garantia:</strong> ${os.garantia === 'sim' ? 'Sim (' + os.prazoGarantiaDias + ' dias)' : 'Não'}</p>
            ${itensHTML}
            <div style="text-align:right;margin-top:1rem;">
                <p><strong>Sinal:</strong> R$ ${os.sinal.toFixed(2)}</p>
                <p><strong>Resta:</strong> R$ ${os.resta.toFixed(2)}</p>
                <p style="background:#000;color:#fff;padding:.5rem;"><strong>VALOR TOTAL: R$ ${os.valorTotal.toFixed(2)}</strong></p>
            </div>
            ${os.garantiaAte ? `<div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:1rem;border-radius:.5rem;margin-top:1rem;"><strong>🛡️ Garantia até:</strong> ${new Date(os.garantiaAte).toLocaleDateString('pt-BR')}</div>` : ''}
        </div>
    `;
    document.getElementById('os-view-content').innerHTML = content;
    openModal('os-view-modal');
    // Configura botão de impressão com o ID correto da OS
    const btnImprimir = document.getElementById('btn-imprimir-modal');
    if (btnImprimir) btnImprimir.setAttribute('onclick', `imprimirOSModal(${os.id})`);
}

function deleteOS(id) {
    if (!confirm('Excluir esta OS?')) return;
    db.os = db.os.filter(o => o.id !== id);
    saveData();
    renderOSLista();
    updateDashboard();
}

// ===== DASHBOARD =====
function updateDashboard() {
    const hoje = new Date().toDateString();
    const vendasHoje = db.vendas.filter(v => new Date(v.data).toDateString() === hoje);
    const totalVendas = vendasHoje.reduce((s, v) => s + v.total, 0);
    const elVendas = document.getElementById('stat-vendas-hoje');
    const elOS = document.getElementById('stat-os-abertas');
    const elProd = document.getElementById('stat-produtos');
    const elCli = document.getElementById('stat-clientes');
    
    if (elVendas) elVendas.textContent = `R$ ${totalVendas.toFixed(2)}`;
    if (elOS) elOS.textContent = db.os.filter(o => o.status !== 'entregue').length;
    if (elProd) elProd.textContent = db.produtos.length;
    if (elCli) elCli.textContent = db.clientes.length;

    // OS recentes
    const rec = document.getElementById('os-recentes-list');
    if (!rec) return;
    const recentes = db.os.slice(-5).reverse();
    if (recentes.length === 0) {
        rec.innerHTML = '<p class="text-center" style="color:#4b5563;padding:2rem;">Nenhuma OS</p>';
    } else {
        const tipoLabels = { os:'OS', pedido:'PEDIDO', orcamento:'ORÇ.' };
        rec.innerHTML = recentes.map(os => `
            <div class="os-card ${os.status}" style="padding:1rem;margin-bottom:.5rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <strong>${tipoLabels[os.tipo] || 'DOC'} #${os.numero}</strong> - ${os.nome}
                        <div style="font-size:.875rem;color:#4b5563;">${os.modelo || ''}</div>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="viewOS(${os.id})">Ver</button>
                </div>
            </div>
        `).join('');
    }
    renderGarantias();
}

// ===== GARANTIA =====
function renderGarantias() {
    const container = document.getElementById('garantia-list');
    if (!container) return;
    const agora = new Date();
    const ativas = db.os.filter(os => os.garantiaAte && new Date(os.garantiaAte) > agora);

    if (ativas.length === 0) {
        container.innerHTML = '<p class="text-center" style="color:#4b5563;padding:2rem;">Nenhuma garantia ativa</p>';
        return;
    }

    const tipoLabels = { os:'OS', pedido:'PEDIDO', orcamento:'ORÇ.' };
    container.innerHTML = ativas.map(os => {
        const dataFim = new Date(os.garantiaAte);
        const dias = Math.ceil((dataFim - agora) / 86400000);
        const pct = (dias / os.prazoGarantiaDias) * 100;
        let cor = '#10b981';
        if (pct < 25) cor = '#ef4444';
        else if (pct < 50) cor = '#f59e0b';
        return `
            <div class="card" style="margin-bottom:1rem;">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:.5rem;">
                    <div>
                        <strong>${tipoLabels[os.tipo] || 'DOC'} #${os.numero}</strong> - ${os.nome}
                        <div style="font-size:.875rem;color:#4b5563;">${os.modelo || ''}</div>
                    </div>
                    <span class="badge ${dias<7?'badge-danger':dias<30?'badge-warning':'badge-success'}">${dias} dias</span>
                </div>
                <div style="background:#e5e7eb;height:8px;border-radius:4px;overflow:hidden;">
                    <div style="background:${cor};height:100%;width:${Math.max(0,Math.min(100,pct))}%;"></div>
                </div>
                <div style="font-size:.75rem;color:#4b5563;margin-top:.25rem;">Vence: ${dataFim.toLocaleDateString('pt-BR')}</div>
            </div>
        `;
    }).join('');
}

// ===== RELATÓRIOS =====
function gerarRelatorio() {
    const di = document.getElementById('relatorio-data-ini').value;
    const df = document.getElementById('relatorio-data-fim').value;
    if (!di || !df) { alert('Selecione o período!'); return; }

    const ini = new Date(di);
    const fim = new Date(df); fim.setHours(23,59,59);

    const vendasP = db.vendas.filter(v => { const d = new Date(v.data); return d >= ini && d <= fim; });
    const osP = db.os.filter(os => { const d = new Date(os.dataAbertura); return d >= ini && d <= fim; });

    const totalV = vendasP.reduce((s,v) => s+v.total, 0);
    const totalOS = osP.reduce((s,o) => s+o.valorTotal, 0);

    document.getElementById('relatorio-content').innerHTML = `
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-value" style="color:#10b981;">R$ ${totalV.toFixed(2)}</div><div class="stat-label">Vendas</div></div>
            <div class="stat-card"><div class="stat-value">${vendasP.length}</div><div class="stat-label">Nº Vendas</div></div>
            <div class="stat-card"><div class="stat-value" style="color:#2563eb;">R$ ${totalOS.toFixed(2)}</div><div class="stat-label">OS</div></div>
            <div class="stat-card"><div class="stat-value">${osP.length}</div><div class="stat-label">Nº OS</div></div>
        </div>
        <p><strong>Período:</strong> ${ini.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}</p>
        <p><strong>Total Geral:</strong> R$ ${(totalV+totalOS).toFixed(2)}</p>
    `;
    document.getElementById('relatorio-result').style.display = 'block';
}

// ===== QUICK ACTION =====
function quickAction() {
    const c = prompt('1-Nova OS\n2-Nova Venda\n3-Novo Cliente\n4-Novo Produto');
    if (c==='1') showPage('nova-os');
    else if (c==='2') showPage('pdv');
    else if (c==='3') openClienteModal();
    else if (c==='4') openProdutoModal();
}