import { State } from '../state.js';

export function renderSettings() {
    const div = document.createElement('div');
    div.className = 'fadeIn';

    function render() {
        const { dailyGoal } = State.data;

        div.innerHTML = `
            <div style="max-width: 500px; margin: 0 auto;">
                <h3 style="margin-bottom: var(--space-lg);">Configurações</h3>
                
                <div class="card">
                    <div class="form-group">
                        <label class="form-label" for="goal-input">Meta Diária de Estudos (horas)</label>
                        <div style="display: flex; gap: var(--space-md);">
                            <input type="number" id="goal-input" value="${dailyGoal}" min="1" max="24" style="flex: 1;">
                            <button id="save-settings" class="btn btn-primary">
                                <i data-lucide="save"></i> Salvar
                            </button>
                        </div>
                        <small style="color: var(--text-muted); display: block; margin-top: 8px;">
                            Defina quantas horas você planeja estudar por dia para calcular seu progresso.
                        </small>
                    </div>

                    <hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 24px 0;">

                    <div class="form-group">
                         <label class="form-label">Dados</label>
                         <button id="reset-data" class="btn btn-danger" style="width: 100%;">
                            <i data-lucide="trash-2"></i> Apagar Todos os Dados
                         </button>
                         <small style="color: var(--text-muted); display: block; margin-top: 8px;">
                            Atenção: Isso excluirá todas as matérias e histórico de sessões permanentemente.
                        </small>
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();

        // Event Listeners
        div.querySelector('#save-settings').addEventListener('click', () => {
            const input = div.querySelector('#goal-input');
            const val = Number(input.value);
            if (val > 0 && val <= 24) {
                State.updateGoal(val);
                alert('Configurações salvas!');
            } else {
                alert('Por favor, insira um valor válido entre 1 e 24 horas.');
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
