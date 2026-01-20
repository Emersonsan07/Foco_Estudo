import { Supabase } from '../supabase-client.js';

export function renderAuth() {
    let isLoginMode = true;
    const container = document.createElement('div');
    container.className = 'fadeIn';

    // UI Centralizada
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.height = '100vh';
    container.style.background = 'hsl(var(--bg-app))';

    function updateUI() {
        container.innerHTML = `
            <div class="card" style="width: 100%; max-width: 400px; padding: 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 class="logo typing-effect" style="font-size: 2.5rem; padding-right: 10px;">Foco.</h1>
                    <p id="auth-subtitle" style="color: var(--text-muted); margin-top: 8px;">${isLoginMode ? 'Entre para sincronizar seus estudos.' : 'Crie sua conta para começar.'}</p>
                </div>

                <form id="auth-form" style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="dynamic-input-group" id="name-group" style="display: ${isLoginMode ? 'none' : 'block'};">
                        <input type="text" id="name" ${isLoginMode ? '' : 'required'} placeholder=" ">
                        <label for="name">Nome</label>
                    </div>

                    <div class="dynamic-input-group">
                        <input type="email" id="email" required placeholder=" ">
                        <label for="email">E-mail</label>
                    </div>
                    
                    <div class="dynamic-input-group">
                        <input type="password" id="password" required placeholder=" ">
                        <label for="password">Senha</label>
                    </div>

                    <div id="auth-error" style="color: var(--color-danger); font-size: 0.9rem; display: none;"></div>

                    <button type="submit" class="btn btn-primary" id="btn-submit">
                        ${isLoginMode ? 'Entrar' : 'Criar Conta'}
                    </button>
                </form>
                
                <div style="margin-top: 24px; text-align: center; font-size: 0.9rem; color: var(--text-muted);">
                    <p>
                        ${isLoginMode ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
                        <button id="toggle-auth" style="background: none; border: none; color: var(--color-primary); cursor: pointer; font-weight: 500; text-decoration: underline; padding: 0 4px;">
                            ${isLoginMode ? 'Criar agora' : 'Fazer login'}
                        </button>
                    </p>
                </div>
            </div>
        `;

        setupListeners();
    }

    function setupListeners() {
        const form = container.querySelector('#auth-form');
        const nameInput = container.querySelector('#name');
        const emailInput = container.querySelector('#email');
        const passInput = container.querySelector('#password');
        const errorDisplay = container.querySelector('#auth-error');
        const btnSubmit = container.querySelector('#btn-submit');
        const toggleBtn = container.querySelector('#toggle-auth');

        toggleBtn.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            updateUI();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const password = passInput.value;

            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Processando...';
            errorDisplay.style.display = 'none';

            const client = Supabase.client;

            if (isLoginMode) {
                // Login
                const { data, error } = await client.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    showError(error.message);
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = 'Entrar';
                } else {
                    window.location.reload();
                }
            } else {
                // Cadastro
                const name = nameInput.value;
                const { data, error } = await client.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            display_name: name
                        }
                    }
                });

                if (error) {
                    showError(error.message);
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = 'Criar Conta';
                } else {
                    alert('Cadastro realizado! Verifique seu e-mail para confirmar (se necessário) e faça login.');
                    isLoginMode = true;
                    updateUI();
                }
            }
        });

        function showError(msg) {
            errorDisplay.textContent = msg;
            errorDisplay.style.display = 'block';
        }
    }

    updateUI();
    return container;
}

