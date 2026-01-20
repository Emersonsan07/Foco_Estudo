import { Supabase } from '../supabase-client.js';

export function renderAuth() {
    const container = document.createElement('div');
    container.className = 'fadeIn';

    // UI Centralizada
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.height = '100vh';
    container.style.background = 'hsl(var(--bg-app))';

    container.innerHTML = `
        <div class="card" style="width: 100%; max-width: 400px; padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 class="logo" style="font-size: 2rem;">Foco.</h1>
                <p style="color: var(--text-muted);">Entre para sincronizar seus estudos.</p>
            </div>

            <form id="auth-form" style="display: flex; flex-direction: column; gap: 16px;">
                <div class="form-group">
                    <label class="form-label">E-mail</label>
                    <input type="email" id="email" required placeholder="seu@email.com" style="width: 100%;">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Senha</label>
                    <input type="password" id="password" required placeholder="******" style="width: 100%;">
                </div>

                <div id="auth-error" style="color: var(--color-danger); font-size: 0.9rem; display: none;"></div>

                <button type="submit" class="btn btn-primary" id="btn-submit">
                    Entrar / Cadastrar
                </button>
            </form>
            
            <div style="margin-top: 16px; text-align: center; font-size: 0.8rem; color: var(--text-muted);">
                <p>Se não tiver conta, criaremos uma automaticamente.</p>
            </div>
        </div>
    `;

    const form = container.querySelector('#auth-form');
    const emailInput = container.querySelector('#email');
    const passInput = container.querySelector('#password');
    const errorDisplay = container.querySelector('#auth-error');
    const btnSubmit = container.querySelector('#btn-submit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passInput.value;

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Processando...';
        errorDisplay.style.display = 'none';

        const client = Supabase.client;

        // Tentar Login primeiro
        let { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            // Se falhar, tentar cadastro (Sign Up)
            if (error.message.includes('Invalid login credentials') || error.message.includes('not found')) {
                const signUp = await client.auth.signUp({
                    email,
                    password
                });

                if (signUp.error) {
                    showError(signUp.error.message);
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = 'Entrar / Cadastrar';
                } else {
                    alert('Cadastro realizado! Verifique seu e-mail para confirmar (se necessário) ou entre novamente.');
                    // Em alguns casos o Auto Confirm está ligado, então o login já valeria.
                    // Mas vamos pedir para tentar entrar.
                    window.location.reload();
                }
            } else {
                showError(error.message);
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Entrar / Cadastrar';
            }
        } else {
            // Sucesso no Login
            window.location.reload(); // Recarrega para iniciar a App (App.js vai verificar sessão)
        }
    });

    function showError(msg) {
        errorDisplay.textContent = msg;
        errorDisplay.style.display = 'block';
    }

    return container;
}
