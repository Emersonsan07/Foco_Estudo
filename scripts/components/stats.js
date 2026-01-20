import { State } from '../state.js';

export function renderStats() {
    const div = document.createElement('div');
    div.className = 'fadeIn';

    const { sessions, subjects } = State.data;

    // Processar dados
    const totalSeconds = sessions.reduce((acc, s) => acc + s.duration, 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);

    // Agrupar por matéria
    const bySubject = {};
    sessions.forEach(s => {
        const subjectId = s.subject_id || s.subjectId;
        if (!bySubject[subjectId]) {
            bySubject[subjectId] = { duration: 0, questions: 0, correct: 0 };
        }
        bySubject[subjectId].duration += s.duration;
        bySubject[subjectId].questions += (s.questions || 0);
        bySubject[subjectId].correct += (s.correct || 0);
    });

    const chartData = Object.entries(bySubject).map(([id, data]) => {
        const subject = subjects.find(s => s.id == id);

        // Calcular Aproveitamento (Performance)
        const rate = data.questions > 0 ? (data.correct / data.questions) : 0;
        const rateDisplay = (rate * 100).toFixed(1);

        // Lógica de Repetição Espaçada (Simples)
        // Se rate > 0.8 -> +3 dias
        // Se rate > 0.5 -> +1 dia
        // Se rate <= 0.5 -> Revisar Hoje
        let status = 'Em dia';
        let statusColor = 'var(--color-success)';

        if (data.questions > 0) {
            if (rate <= 0.5) {
                status = 'Revisar Hoje (Baixo Desempenho)';
                statusColor = 'var(--color-danger)';
            } else if (rate <= 0.8) {
                status = 'Revisar em 1 dia';
                statusColor = 'var(--color-warning)';
            } else {
                status = 'Revisar em 3 dias';
            }
        } else {
            status = 'Novo / Sem dados';
            statusColor = 'var(--text-muted)';
        }

        return {
            name: subject ? subject.name : 'Desconhecido',
            color: subject ? subject.color : '#ccc',
            duration: data.duration,
            questions: data.questions,
            correct: data.correct,
            rate: rateDisplay,
            percent: totalSeconds > 0 ? Math.round((data.duration / totalSeconds) * 100) : 0,
            status: status,
            statusColor: statusColor,
            needsReview: rate <= 0.5 && data.questions > 0
        };
    }).sort((a, b) => b.duration - a.duration);

    // Recomendação: Matéria que precisa de revisão urgente e tem o pior aproveitamento
    const toReview = chartData.filter(d => d.needsReview);
    const recommendation = toReview.length > 0
        ? toReview.sort((a, b) => Number(a.rate) - Number(b.rate))[0]
        : null;

    div.innerHTML = `
        <div style="margin-bottom: 24px;">
            <h3>Desempenho Geral</h3>
        </div>
        
        <!-- Recomendação com base no RPS (Repetição Espaçada) -->
        ${recommendation ? `
        <div class="card" style="margin-bottom: 24px; border-left: 4px solid var(--color-danger);">
            <div style="display: flex; gap: 16px; align-items: start;">
                 <div style="background: var(--color-danger); color: white; padding: 12px; border-radius: 50%;">
                    <i data-lucide="repeat"></i>
                 </div>
                 <div>
                    <h4 style="margin-bottom: 4px;">Recomendação de Revisão (RPS)</h4>
                    <p style="color: var(--text-muted);">
                        Sua Repetição Espaçada indica que você precisa revisar <strong>${recommendation.name}</strong>.
                        <br>Aproveitamento atual: ${recommendation.rate}%.
                    </p>
                 </div>
            </div>
        </div>
        ` : ''}

        <div class="stats-grid">
            <!-- Gráfico de Distribuição + RPS -->
            <div class="card">
                <h4 class="card-title">Distribuição & Rendimento (RPS)</h4>
                <div style="margin-top: 16px; display: flex; flexDirection: column; gap: 16px;">
                    ${chartData.map(item => `
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.9rem;">
                                <span>${item.name}</span>
                                <span>${item.percent}% Tempo</span>
                            </div>
                            <div class="progress-bar" style="margin-bottom: 8px;">
                                <div class="progress-fill" style="width: ${item.percent}%; background-color: ${item.color}"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px;">
                                <span>Questões: ${item.correct}/${item.questions}</span>
                                <span>Aproveitamento: ${item.rate}%</span>
                            </div>
                            <div style="font-size: 0.8rem; font-weight: 600; color: ${item.statusColor}; text-align: right;">
                                RPS: ${item.status}
                            </div>
                        </div>
                    `).join('')}
                    ${chartData.length === 0 ? '<p style="color: var(--text-muted)">Nenhum dado registrado ainda.</p>' : ''}
                </div>
            </div>

            <!-- Resumo Numérico -->
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div class="card">
                     <div class="card-title">Total de Horas</div>
                     <div class="card-value">${totalHours}h</div>
                </div>
                <div class="card">
                     <div class="card-title">Média/Sessão</div>
                     <div class="card-value">${sessions.length ? Math.round((totalSeconds / sessions.length) / 60) : 0} min</div>
                </div>
                 <div class="card">
                     <div class="card-title">Total Sessões</div>
                     <div class="card-value">${sessions.length}</div>
                </div>
            </div>
        </div>

        <h3 style="margin: 32px 0 16px 0;">Histórico Detalhado</h3>
        <div class="card">
             <div style="max-height: 400px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted);">
                            <th style="padding: 12px;">Data</th>
                            <th style="padding: 12px;">Matéria</th>
                            <th style="padding: 12px;">Duração</th>
                            <th style="padding: 12px;">Questões</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sessions.slice().reverse().map(s => {
        const subjectId = s.subject_id || s.subjectId;
        const sub = subjects.find(sub => sub.id == subjectId);
        return `
                            <tr style="border-bottom: 1px solid var(--border-subtle);">
                                <td style="padding: 12px;">${new Date(s.date).toLocaleDateString()} ${new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td style="padding: 12px;">
                                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${sub ? sub.color : '#ccc'}; display: inline-block; margin-right: 8px;"></span>
                                    ${sub ? sub.name : 'Excluída'}
                                </td>
                                <td style="padding: 12px;">${(s.duration / 60).toFixed(1)} min</td>
                                <td style="padding: 12px;">${s.questions || 0} (${s.correct || 0})</td>
                            </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
                ${sessions.length === 0 ? '<p style="padding: 16px; text-align: center; color: var(--text-muted);">Sem registros.</p>' : ''}
             </div>
        </div>
    `;

    lucide.createIcons();
    return div;
}
