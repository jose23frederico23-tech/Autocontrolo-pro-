// BANCO DE DADOS SIMULADO 
function carregarDados(chave, padrao) {
    try {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : padrao;
    } catch (e) {
        console.error(`Erro ao carregar ${chave}, resetando dados.`, e);
        return padrao;
    }
}

let usuarios = carregarDados('autocontrole_usuarios', []);
let registros = carregarDados('autocontrole_registros', []);
let metas = carregarDados('autocontrole_metas', []);
let reflexoes = carregarDados('autocontrole_reflexoes', []);
let logs = carregarDados('autocontrole_logs', []);

// Usuário atual logado
let usuarioAtual = carregarDados('autocontrole_usuario_atual', null);

// Funções auxiliares de segurança
function codificarSenha(senha) { return btoa(senha); }
function decodificarSenha(senhaCodificada) { return atob(senhaCodificada); }
function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// Função auxiliar para mensagens
function mostrarMensagem(elementId, tipo, texto) {
    const div = document.getElementById(elementId);
    if (div) {
        div.className = `auth-message ${tipo}`;
        div.textContent = texto;
    }
}

// Inicialização do adm
function inicializarSistema(){
    if (usuarios.length === 0) {
        // Criar usuário admin
        usuarios.push({
            id: 1,
            nome: 'ARMINDO',
            email: 'armindo@gmail.com',
            senha: codificarSenha('admin123'), // Senha codificada
            tipo: 'admin',
            dataCadastro: new Date().toISOString(),
            ultimoAcesso: null,
        });
        salvarDados();
    }
    
    // Se já tiver usuário logado, mostrar sistema
    if (usuarioAtual) {
        mostrarSistemaPrincipal();
    }
}

function salvarDados() {
    localStorage.setItem('autocontrole_usuarios', JSON.stringify(usuarios));
    localStorage.setItem('autocontrole_registros', JSON.stringify(registros));
    localStorage.setItem('autocontrole_metas', JSON.stringify(metas));
    localStorage.setItem('autocontrole_reflexoes', JSON.stringify(reflexoes));
    localStorage.setItem('autocontrole_logs', JSON.stringify(logs));
    if (usuarioAtual) {
        localStorage.setItem('autocontrole_usuario_atual', JSON.stringify(usuarioAtual));
    } else {
        localStorage.removeItem('autocontrole_usuario_atual');
    }
}

function adicionarLog(usuario, acao) {
    logs.unshift({
        usuario: usuario,
        acao: acao,
        data: new Date().toISOString(),
        ip: '127.0.0.1' // IP ajustado para um formato válido
    });
    if (logs.length > 100) logs.pop();
    salvarDados();
}

function formatarData(dataISO) {
    if (!dataISO) return 'Nunca';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
}

// ========== AUTENTICAÇÃO ==========
function mudarAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.formato').forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelector('.menu-s').classList.add('active');
        document.getElementById('login').classList.add('active');
    } else if (tab === 'cadastro') {
        document.querySelectorAll('.menu-s')[1].classList.add('active');
        document.getElementById('cadastro').classList.add('active');
    } else {
        document.querySelectorAll('.menu-s')[2].classList.add('active');
        document.getElementById('recuperar').classList.add('active');
    }
}

function fazerLogin(){
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    
    if (!email || !senha){
        mostrarMensagem('loginMessage', 'error', 'Preencha tudo agora');
        return;
    }
    
    const senhaCodificada = codificarSenha(senha);
    const usuario = usuarios.find(u => u.email === email && u.senha === senhaCodificada);
    
    if (usuario) {
        usuario.ultimoAcesso = new Date().toISOString();
        usuarioAtual = usuario; // Corrigido de ',' para ';'
        adicionarLog(usuario.nome, 'Login realizado'); // salvarDados já está dentro de adicionarLog
        mostrarSistemaPrincipal();
    } else {
        mostrarMensagem('loginMessage', 'error', 'E-mail ou senha inválidos!');
    }
}

function fazerCadastro() {
    const nome = document.getElementById('cadastroNome').value;
    const email = document.getElementById('cadastroEmail').value;
    const senha = document.getElementById('cadastroSenha').value;
    const confirmar = document.getElementById('cadastroConfirmarSenha').value;
    
    if (!nome || !email || !senha || !confirmar) {
        mostrarMensagem('cadastroMessage', 'error', 'Preencha todos os campos!');
        return;
    }
    
    if (senha !== confirmar) {
        mostrarMensagem('cadastroMessage', 'error', 'As senhas não coincidem!');
        return;
    }
    
    if (senha.length < 3) {
        mostrarMensagem('cadastroMessage', 'error', 'A senha deve ter pelo menos 3 caracteres!');
        return;
    }
    
    if (usuarios.some(u => u.email === email)) {
        mostrarMensagem('cadastroMessage', 'error', 'Este e-mail já está cadastrado!');
        return;
    }
    
    // Corrigido: calcular o maior ID existente para evitar duplicatas ao excluir usuários
    const maiorId = usuarios.reduce((max, u) => (u.id > max ? u.id : max), 0);
    
    const novoUsuario = {
        id: maiorId + 1,
        nome: nome,
        email: email,
        senha: codificarSenha(senha), // Senha codificada
        tipo: 'usuario',
        dataCadastro: new Date().toISOString(),
        ultimoAcesso: new Date().toISOString()
    };
    
    usuarios.push(novoUsuario);
    usuarioAtual = novoUsuario;
    adicionarLog(novoUsuario.nome, 'Cadastro realizado');
    
    mostrarMensagem('cadastroMessage', 'success', 'Cadastro realizado com sucesso!');
    
    // Limpar campos após cadastro
    document.getElementById('cadastroNome').value = '';
    document.getElementById('cadastroEmail').value = '';
    document.getElementById('cadastroSenha').value = '';
    document.getElementById('cadastroConfirmarSenha').value = '';

    setTimeout(() => {
        mostrarSistemaPrincipal();
    }, 1500);
}

function recuperarSenha() {
    const email = document.getElementById('recuperarEmail').value;
    const usuario = usuarios.find(u => u.email === email);
    
    if (usuario) {
        mostrarMensagem('recuperarMessage', 'success', `Instruções enviadas para ${email} (senha: ${decodificarSenha(usuario.senha)})`);
    } else {
        mostrarMensagem('recuperarMessage', 'error', 'E-mail não encontrado!');
    }
}

function fazerLogout() {
    adicionarLog(usuarioAtual.nome, 'Logout realizado');
    usuarioAtual = null;
    // salvarDados já é chamado dentro do adicionarLog
    
    document.getElementById('mainSystem').style.display = 'none';
    document.getElementById('authContainer').style.display = 'block';
    
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginSenha').value = '';
}

function mostrarSistemaPrincipal() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('mainSystem').style.display = 'block';
    document.getElementById('userNameDisplay').textContent = usuarioAtual.nome;
    
    const adminBtn = document.querySelector('.admin-btn');
    if (usuarioAtual.tipo === 'admin') {
        adminBtn.style.display = 'inline-block';
    } else {
        adminBtn.style.display = 'none';
    }
    
    atualizarInterface();
}

// ========== PERFIL DO USUÁRIO ==========
function mostrarPerfil() {
    document.getElementById('perfilNome').value = usuarioAtual.nome;
    document.getElementById('perfilEmail').value = usuarioAtual.email;
    document.getElementById('perfilSenhaAtual').value = '';
    document.getElementById('perfilNovaSenha').value = '';
    document.getElementById('perfilConfirmarSenha').value = '';
    document.getElementById('perfilModal').classList.add('active');
}

function fecharModalPerfil() {
    document.getElementById('perfilModal').classList.remove('active');
}

function salvarPerfil() {
    const nome = document.getElementById('perfilNome').value;
    const email = document.getElementById('perfilEmail').value;
    const senhaAtual = document.getElementById('perfilSenhaAtual').value;
    const novaSenha = document.getElementById('perfilNovaSenha').value;
    const confirmarSenha = document.getElementById('perfilConfirmarSenha').value;
    
    if (!nome || !email) {
        alert('Nome e e-mail são obrigatórios!');
        return;
    }
    
    if (email !== usuarioAtual.email && usuarios.some(u => u.email === email)) {
        alert('Este e-mail já está em uso!');
        return;
    }
    
    if (novaSenha || confirmarSenha) {
        if (codificarSenha(senhaAtual) !== usuarioAtual.senha) { // Comparando senhas codificadas
            alert('Senha atual incorreta!');
            return;
        }
        
        if (novaSenha !== confirmarSenha) {
            alert('Nova senha e confirmação não coincidem!');
            return;
        }
        
        if (novaSenha.length < 3) {
            alert('A nova senha deve ter pelo menos 3 caracteres!');
            return;
        }
        
        usuarioAtual.senha = codificarSenha(novaSenha); // Salvando nova senha codificada
    }
    
    usuarioAtual.nome = nome;
    usuarioAtual.email = email;
    
    const index = usuarios.findIndex(u => u.id === usuarioAtual.id);
    if (index !== -1) {
        usuarios[index] = usuarioAtual;
    }
    
    adicionarLog(usuarioAtual.nome, 'Perfil atualizado');
    document.getElementById('userNameDisplay').textContent = usuarioAtual.nome;
    fecharModalPerfil();
    alert('Perfil atualizado com sucesso!');
}

// ========== FUNÇÕES DO ADMIN ==========
function abrirModalAdmin() {
    if (usuarioAtual.tipo !== 'admin') {
        alert('Acesso negado! Apenas administradores podem acessar esta área.');
        return;
    }
    document.getElementById('adminModal').classList.add('active');
    document.getElementById('adminSenha').value = '';
}

function fecharModalAdmin() {
    document.getElementById('adminModal').classList.remove('active');
}

function fazerLoginAdmin() {
    const senha = document.getElementById('adminSenha').value;
    
    if (senha === '209723') {
        fecharModalAdmin();
        mostrarPainelAdmin();
        adicionarLog('Admin', 'Login no painel admin');
    } else {
        alert('Senha incorreta!');
    }
}

function mostrarPainelAdmin() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.style.display = 'none';
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById('tab-admin').classList.add('active');
    
    atualizarPainelAdmin();
}

function logoutAdmin() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.style.display = 'block'; // Nota: se o CSS original usar flex/inline-block, pode ser necessário ajustar aqui no futuro
    });
    
    mudarAba('registro', event); // repassando o event
    adicionarLog('Admin', 'Logout do painel admin');
}

function atualizarPainelAdmin() {
    document.getElementById('adminTotalUsuarios').textContent = usuarios.length;
    document.getElementById('adminTotalRegistros').textContent = registros.length;
    document.getElementById('adminTotalMetas').textContent = metas.length;
    document.getElementById('adminTotalReflexoes').textContent = reflexoes.length;
    
    let tbody = document.getElementById('tabelaUsuarios');
    tbody.innerHTML = '';
    
    usuarios.forEach(usuario => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${usuario.id}</td>
            <td>${escaparHTML(usuario.nome)}</td>
            <td>${escaparHTML(usuario.email)}</td>
            <td>${formatarData(usuario.dataCadastro)}</td>
            <td>${formatarData(usuario.ultimoAcesso)}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editarUsuario(${usuario.id})">Editar</button>
                <button class="action-btn delete-btn" onclick="deletarUsuario(${usuario.id})">Excluir</button>
                <button class="action-btn" style="background: #48bb78;" onclick="resetarSenha(${usuario.id})">Resetar Senha</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    let logsTbody = document.getElementById('tabelaLogs');
    logsTbody.innerHTML = '';
    
    logs.slice(0, 20).forEach(log => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escaparHTML(log.usuario)}</td>
            <td>${formatarData(log.data)}</td>
            <td>${escaparHTML(log.acao)}</td>
            <td>${log.ip}</td>
        `;
        logsTbody.appendChild(tr);
    });
}

function editarUsuario(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (usuario) {
        const novoNome = prompt('Novo nome:', usuario.nome);
        const novoEmail = prompt('Novo email:', usuario.email);
        if (novoNome && novoEmail) {
            usuario.nome = novoNome;
            usuario.email = novoEmail;
            
            // Sincronizar se o admin estiver editando a si mesmo
            if (usuarioAtual.id === id) {
                usuarioAtual.nome = novoNome;
                usuarioAtual.email = novoEmail;
                document.getElementById('userNameDisplay').textContent = novoNome;
            }
            
            adicionarLog('Admin', `Editou usuário ${usuario.nome}`);
            atualizarPainelAdmin();
        }
    }
}

function resetarSenha(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (usuario && confirm(`Resetar senha do usuário ${usuario.nome} para "111222"?`)) {
        usuario.senha = codificarSenha('111222'); // Senha resetada codificada
        adicionarLog('Admin', `Resetou senha do usuário ${usuario.nome}`);
        atualizarPainelAdmin();
        alert('Senha resetada para: 111222');
    }
}

function deletarUsuario(id) {
    if (id === usuarioAtual.id) {
        alert('Você não pode excluir seu próprio usuário!');
        return;
    }
    
    const usuario = usuarios.find(u => u.id === id);
    if (usuario && confirm(`Tem certeza que deseja excluir ${usuario.nome}?`)) {
        usuarios = usuarios.filter(u => u.id !== id);
        registros = registros.filter(r => r.usuarioId !== id);
        metas = metas.filter(m => m.usuarioId !== id);
        reflexoes = reflexoes.filter(r => r.usuarioId !== id);
        
        adicionarLog('Admin', `Excluiu usuário ${usuario.nome}`);
        atualizarPainelAdmin();
    }
}

// ========== FUNÇÕES DO SISTEMA PRINCIPAL ==========
function mudarAba(aba, event) { // Adicionado 'event' como parâmetro para evitar erro em navegadores strict
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) event.target.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${aba}`).classList.add('active');
    
    if (aba === 'registro') {
        listarRegistros();
    } else if (aba === 'metas') {
        listarMetas();
    } else if (aba === 'historico') {
        atualizarHistorico();
    }
}

function salvarRegistro() {
    const hoje = new Date().toISOString().split('T')[0];
    let registroHoje = registros.find(r => r.data === hoje && r.usuarioId === usuarioAtual.id);
    
    const novoRegistro = {
        id: Date.now(),
        usuarioId: usuarioAtual.id,
        data: hoje,
        humor: document.getElementById('humor').value,
        horasSono: document.getElementById('sono').value,
        atividades: document.getElementById('atividades').value,
        notas: document.getElementById('notas').value
    };
    
    if (registroHoje) {
        Object.assign(registroHoje, novoRegistro);
    } else {
        registros.push(novoRegistro);
    }
    
    adicionarLog(usuarioAtual.nome, 'Registro diário salvo');
    alert('Registro salvo com sucesso!');
    
    document.getElementById('atividades').value = '';
    document.getElementById('notas').value = '';
    
    listarRegistros();
}

function listarRegistros() {
    const lista = document.getElementById('listaRegistros');
    const registrosUsuario = registros
        .filter(r => r.usuarioId === usuarioAtual.id)
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, 7);
    
    lista.innerHTML = '';
    
    if (registrosUsuario.length === 0) {
        lista.innerHTML = '<p>Nenhum registro encontrado.</p>';
        return;
    }
    
    registrosUsuario.forEach(reg => {
        let card = document.createElement('div');
        card.className = 'registro-card';
        card.innerHTML = `
            <h3>${new Date(reg.data).toLocaleDateString('pt-BR')}</h3>
            <p><strong>Humor:</strong> ${escaparHTML(reg.humor)}</p>
            <p><strong>Sono:</strong> ${escaparHTML(reg.horasSono)}h</p>
            <p><strong>Atividades:</strong> ${escaparHTML(reg.atividades) || 'Não informado'}</p>
            <p><strong>Notas:</strong> ${escaparHTML(reg.notas) || 'Não informado'}</p>
        `;
        lista.appendChild(card);
    });
}

function criarMeta() {
    const descricao = document.getElementById('metaDescricao').value;
    const dias = document.getElementById('metaDias').value;
    
    if (!descricao) {
        alert('Digite uma descrição para a meta!');
        return;
    }
    
    const novaMeta = {
        id: Date.now(),
        usuarioId: usuarioAtual.id,
        descricao: descricao,
        progresso: 0,
        diasTotais: parseInt(dias),
        diasCompletos: 0,
        ativa: true,
        dataCriacao: new Date().toISOString()
    };
    
    metas.push(novaMeta);
    adicionarLog(usuarioAtual.nome, 'Criou nova meta');
    
    document.getElementById('metaDescricao').value = '';
    alert('Meta criada com sucesso!');
    listarMetas();
}

function atualizarProgressoMeta(id) {
    const meta = metas.find(m => m.id === id);
    if (meta) {
        let novoProgresso = prompt('Novo progresso (0-100):', meta.progresso);
        if (novoProgresso !== null) {
            novoProgresso = parseInt(novoProgresso);
            if (novoProgresso >= 0 && novoProgresso <= 100) {
                meta.progresso = novoProgresso;
                // Corrigido: Cálculo dos dias completos agora faz sentido matematicamente
                meta.diasCompletos = Math.floor((novoProgresso / 100) * meta.diasTotais);
                
                if (novoProgresso === 100) {
                    meta.ativa = false;
                    alert('Meta concluída!');
                }
                
                adicionarLog(usuarioAtual.nome, `Atualizou meta: ${meta.descricao}`);
                listarMetas();
            } else {
                alert('Progresso deve estar entre 0 à 100%');
            }
        }
    }
}

function listarMetas() {
    const lista = document.getElementById('listaMetas');
    const metasAtivas = metas.filter(m => m.usuarioId === usuarioAtual.id && m.ativa);
    
    lista.innerHTML = '';
    
    if (metasAtivas.length === 0) {
        lista.innerHTML = '<p>Nenhuma meta ativa.</p>';
        return;
    }
    
    metasAtivas.forEach(meta => {
        let card = document.createElement('div');
        card.className = 'meta-card';
        card.innerHTML = `
            <h3>${escaparHTML(meta.descricao)}</h3>
            <p>Dias totais: ${meta.diasTotais} | Dias completos: ${meta.diasCompletos}</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${meta.progresso}%">${meta.progresso}%</div>
            </div>
            <button class="btn-primary" onclick="atualizarProgressoMeta(${meta.id})" style="margin-top: 10px;">Atualizar Progresso</button>
        `;
        lista.appendChild(card);
    });
}

function atualizarHistorico() {
    const registrosUsuario = registros.filter(r => r.usuarioId === usuarioAtual.id);
    const metasUsuario = metas.filter(m => m.usuarioId === usuarioAtual.id);
    const metasConcluidas = metasUsuario.filter(m => !m.ativa).length;
    
    const totalSono = registrosUsuario.reduce((acc, r) => acc + parseInt(r.horasSono || 0), 0);
    const mediaSono = registrosUsuario.length > 0 ? (totalSono / registrosUsuario.length).toFixed(1) : 0;
    
    document.getElementById('totalRegistros').textContent = registrosUsuario.length;
    document.getElementById('metasConcluidas').textContent = metasConcluidas;
    document.getElementById('mediaSono').textContent = mediaSono + 'h';
    
    const linhaTempo = document.getElementById('linhaTempo');
    linhaTempo.innerHTML = '';
    
    const ultimosRegistros = registrosUsuario
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, 10);
    
    ultimosRegistros.forEach(reg => {
        let div = document.createElement('div');
        div.className = 'registro-card';
        div.innerHTML = `
            <h3>${new Date(reg.data).toLocaleDateString('pt-BR')}</h3>
            <p>Humor: ${escaparHTML(reg.humor)} | Sono: ${escaparHTML(reg.horasSono)}h</p>
        `;
        linhaTempo.appendChild(div);
    });
}

function salvarGratidao() {
    const gratidao1 = document.getElementById('gratidao1').value;
    const gratidao2 = document.getElementById('gratidao2').value;
    const gratidao3 = document.getElementById('gratidao3').value;
    
    if (!gratidao1 && !gratidao2 && !gratidao3) { // Validação adicionada
        alert('Preencha pelo menos um campo de gratidão!');
        return;
    }

    const reflexao = {
        id: Date.now(),
        usuarioId: usuarioAtual.id,
        tipo: 'gratidao',
        conteudo: [gratidao1, gratidao2, gratidao3],
        data: new Date().toISOString()
    };
    
    reflexoes.push(reflexao);
    adicionarLog(usuarioAtual.nome, 'Registrou gratidão');
    
    document.getElementById('gratidao1').value = '';
    document.getElementById('gratidao2').value = '';
    document.getElementById('gratidao3').value = '';
    
    alert('Gratidão registrada!');
}

function salvarAutoavaliacao() {
    const nota = document.getElementById('notaDia').value;
    const aprendizado = document.getElementById('aprendizado').value;
    
    if (!aprendizado) { // Validação adicionada
        alert('Escreva o que você aprendeu hoje!');
        return;
    }

    const reflexao = {
        id: Date.now(),
        usuarioId: usuarioAtual.id,
        tipo: 'autoavaliacao',
        nota: nota,
        aprendizado: aprendizado,
        data: new Date().toISOString()
    };
    
    reflexoes.push(reflexao);
    adicionarLog(usuarioAtual.nome, 'Fez autoavaliação');
    
    document.getElementById('notaDia').value = '5';
    document.getElementById('aprendizado').value = '';
    
    alert('Autoavaliação salva!');
}

function atualizarInterface() {
    if (usuarioAtual) {
        listarRegistros();
        listarMetas();
        atualizarHistorico();
    }
}