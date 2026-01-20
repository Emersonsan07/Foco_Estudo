import { State } from '../state.js';
import { Supabase } from '../supabase-client.js';

export function renderSettings() {
    const div = document.createElement('div');
    div.className = 'fadeIn';

    async function render() {
        const { dailyGoal } = State.data;
        const client = Supabase.client;
        const { data: { user } } = await client.auth.getUser();
        const currentName = user?.user_metadata?.display_name || 'Estudante';

        div.innerHTML = `
            <div style="max-width: 500px; margin: 0 auto;">
                <h3 style="margin-bottom: var(--space-lg);">Configurações</h3>
                
                <div class="card">
                    <h4 style="margin-bottom: 16px; font-weight: 500;">Perfil</h4>
                    <div class="form-group">
                        <label class="form-label" for="profile-name">Seu Nome</label>
                        <div style="display: flex; gap: var(--space-md);">
                            <input type="text" id="profile-name" value="${currentName}" style="flex: 1;">
                            <button id="save-profile" class="btn btn-primary">
                                <i data-lucide="user-check"></i> Salvar Nome
                            </button>
                        </div>
                        <small style="color: var(--text-muted); display: block; margin-top: 8px;">
                            Nome exibido na saudação inicial.
                        </small>
                    </div>

                    <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 24px 0;">

                    <h4 style="margin-bottom: 16px; font-weight: 500;">Estudo</h4>
                    <div class="form-group">
                        <label class="form-label" for="goal-input">Meta Diária (horas)</label>
                        <div style="display: flex; gap: var(--space-md);">
                            <input type="number" id="goal-input" value="${dailyGoal}" min="1" max="24" style="flex: 1;">
                            <button id="save-settings" class="btn btn-secondary">
                                <i data-lucide="save"></i> Salvar Meta
                            </button>
                        </div>
                        <small style="color: var(--text-muted); display: block; margin-top: 8px;">
                            Sua meta de horas estudadas por dia.
                        </small>
                    </div>

                    <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 24px 0;">

                    <div style="display: flex; flex-direction: column; gap: 12px;">
                         <button id="logout-btn" class="btn" style="width: 100%; background: var(--border-subtle); color: var(--text-app);">
                            <i data-lucide="log-out"></i> Sair da Conta
                         </button>
                         
                         <button id="reset-data" class="btn btn-danger" style="width: 100%;">
                            <i data-lucide="trash-2"></i> Apagar Todos os Dados Locais
                         </button>
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();

        // Event Listeners
        div.querySelector('#save-profile').addEventListener('click', async () => {
            const newName = div.querySelector('#profile-name').value;
            const btn = div.querySelector('#save-profile');

            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader"></i> Salvando...';
            lucide.createIcons();

            const { error } = await client.auth.updateUser({
                data: { display_name: newName }
            });

            if (error) {
                alert('Erro ao atualizar nome: ' + error.message);
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="user-check"></i> Salvar Nome';
            } else {
                alert('Nome atualizado com sucesso!');
                location.reload(); // Recarrega para atualizar a saudação no header
            }
            lucide.createIcons();
        });

        div.querySelector('#save-settings').addEventListener('click', () => {
            const input = div.querySelector('#goal-input');
            const val = Number(input.value);
            if (val > 0 && val <= 24) {
                State.updateGoal(val);
                alert('Meta atualizada!');
            } else {
                alert('Por favor, insira um valor válido entre 1 e 24 horas.');
            }
        });

        div.querySelector('#logout-btn').addEventListener('click', async () => {
            if (confirm('Deseja realmente sair da conta?')) {
                await client.auth.signOut();
                location.reload();
            }
        });

        div.querySelector('#reset-data').addEventListener('click', () => {
            if (confirm('Tem certeza absoluta? Essa ação não pode ser desfeita.')) {
                localStorage.removeItem('foco_data');
                location.reload();
            }
        });
    }

    render();
    return div;
}

