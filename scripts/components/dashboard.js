import { State } from '../state.js';

export function renderDashboard() {
    const div = document.createElement('div');
    div.className = 'dashboard-container fadeIn';

    function update() {
        const { subjects, sessions, dailyGoal } = State.data;

        // Cálculos
        const totalSessions = sessions.length;
        const totalTimeSeconds = sessions.reduce((acc, s) => acc + s.duration, 0);
        const totalHours = Math.floor(totalTimeSeconds / 3600);
        const totalMinutes = Math.floor((totalTimeSeconds % 3600) / 60);

        // Calcular progresso diário
        const today = new Date().toISOString().split('T')[0];
        const todaysSeconds = sessions
            .filter(s => s.date.startsWith(today))
            .reduce((acc, s) => acc + s.duration, 0);

        const goalSeconds = dailyGoal * 3600;
        const progressPercent = Math.min(100, Math.round((todaysSeconds / goalSeconds) * 100));

        div.innerHTML = `
            <div class="dashboard-grid">
                <!-- Card Meta Diária -->
                <div class="card">
                    <div class="card-title"><i data-lucide="target"></i> Meta Diária</div>
                    <div class="card-value">${progressPercent}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <small style="color: var(--text-muted); display: block; margin-top: 8px">
                        ${Math.floor(todaysSeconds / 60)} / ${dailyGoal * 60} minutos
                    </small>
                </div>

                <!-- Card Total Estudado -->
                <div class="card">
                    <div class="card-title"><i data-lucide="clock"></i> Tempo Total</div>
                    <div class="card-value">${totalHours}h ${totalMinutes}m</div>
                </div>

                <!-- Card Sessões -->
                <div class="card">
                    <div class="card-title"><i data-lucide="book"></i> Sessões</div>
                    <div class="card-value">${totalSessions}</div>
                </div>
            </div>

            <!-- Gráfico Simples (Barras CSS) -->
            <h3>Atividade Recente</h3>
            <div class="card" style="margin-top: 16px;">
                <p style="color: var(--text-muted)">Histórico de sessões aparecerá aqui.</p>
                ${renderRecentSessions(sessions, subjects)}
            </div>
        `;

        lucide.createIcons();
    }

    // Render inicial
    update();

    // Inscrever para atualizações (simples re-render)
    // Nota: Em uma app complexa faríamos diff, aqui replace é ok
    // State.subscribe(update); // TODO: Implementar limpeza de listener

    return div;
}

function renderRecentSessions(sessions, subjects) {
    if (sessions.length === 0) return '';

    const recent = sessions.slice(-5).reverse();
    return `
        <ul style="list-style: none; margin-top: 16px;">
            ${recent.map(session => {
        const subject = subjects.find(s => s.id == (session.subject_id || session.subjectId));
        const color = subject ? subject.color : 'var(--text-muted)';
        const name = subject ? subject.name : 'Matéria Excluída';
        const date = new Date(session.date).toLocaleDateString('pt-BR');
        const duration = Math.round(session.duration / 60);

        return `
                <li style="padding: 8px 0; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between;">
                    <span style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${color}"></span>
                        ${name}
                    </span>
                    <span style="color: var(--text-muted)">${duration} min • ${session.questions || 0} itens • ${date}</span>
                </li>
                `;
    }).join('')}
        </ul>
    `;
}
