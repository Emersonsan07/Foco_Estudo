import { State } from '../state.js';

export function renderSubjects() {
    const container = document.createElement('div');

    function render() {
        const { subjects } = State.data;

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h3>Matérias Cadastradas</h3>
                <button id="btn-add-subject" class="btn btn-primary">
                    <i data-lucide="plus"></i> Nova Matéria
                </button>
            </div>

            <div class="subjects-list">
                ${subjects.map(subject => `
                    <div class="card subject-card" style="--subject-color: ${subject.color}">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <h4 style="font-size: 1.2rem; margin-bottom: 8px;">${subject.name}</h4>
                            <button class="btn-icon delete-subject" data-id="${subject.id}" style="color: var(--text-muted);">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                        
                        <!-- Barra de Progresso Topics -->
                        ${renderProgressBar(subject)}

                        <div style="margin-top: 16px;">
                            <button class="btn btn-sm btn-outline view-topics" data-id="${subject.id}" style="width: 100%; border: 1px solid var(--border-subtle); padding: 8px; border-radius: 8px;">
                                Ver Tópicos
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Hooks
        container.querySelector('#btn-add-subject').addEventListener('click', promptNewSubject);

        container.querySelectorAll('.delete-subject').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Tem certeza? Isso apagará o histórico desta matéria.')) {
                    State.deleteSubject(Number(btn.dataset.id));
                    render();
                }
            });
        });

        // Tópicos (Edital Verticalizado)
        container.querySelectorAll('.view-topics').forEach(btn => {
            btn.addEventListener('click', () => openTopicsModal(Number(btn.dataset.id)));
        });

        lucide.createIcons();
    }

    render();
    return container;
}

function renderProgressBar(subject) {
    if (!subject.topics || subject.topics.length === 0) return '<small style="color:var(--text-muted)">Sem tópicos</small>';

    const total = subject.topics.length;
    const completed = subject.topics.filter(t => t.completed).length;
    const percent = Math.round((completed / total) * 100);

    return `
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px;">
            <span>Progresso</span>
            <span>${percent}%</span>
        </div>
        <div class="progress-bar" style="height: 6px;">
            <div class="progress-fill" style="width: ${percent}%"></div>
        </div>
    `;
}

function promptNewSubject() {
    const name = prompt('Nome da Matéria:');
    if (!name) return;

    const colors = ['#6347ff', '#ff47cc', '#00cc88', '#ffaa00', '#ff4444', '#00aaff'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    State.addSubject({ name, color });
    const routerBtn = document.querySelector('[data-target="subjects"]');
    if (routerBtn) routerBtn.click();
}

function openTopicsModal(subjectId) {
    const subject = State.data.subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const modalId = 'topics-modal';
    let modal = document.getElementById(modalId);

    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal-overlay open';

    function renderContent() {
        return `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${subject.name} - Tópicos</h3>
                <button id="close-modal" class="btn-icon"><i data-lucide="x"></i></button>
            </div>
            
            <div class="form-group" style="display: flex; gap: 8px;">
                <input type="text" id="new-topic-input" placeholder="Novo tópico..." style="flex: 1;">
                <button id="add-topic-btn" class="btn btn-primary"><i data-lucide="plus"></i></button>
            </div>

            <div style="max-height: 300px; overflow-y: auto;">
                ${subject.topics.map(topic => `
                    <div style="display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid var(--border-subtle);">
                        <!-- Botoes de Ordem -->
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                            <button class="btn-move" data-id="${topic.id}" data-dir="-1" style="font-size: 0.6rem; padding: 2px; cursor: pointer;">▲</button>
                            <button class="btn-move" data-id="${topic.id}" data-dir="1" style="font-size: 0.6rem; padding: 2px; cursor: pointer;">▼</button>
                        </div>
                        
                        <input type="checkbox" class="topic-check" data-id="${topic.id}" ${topic.completed ? 'checked' : ''}>
                        <span style="${topic.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${topic.name}</span>
                    </div>
                `).join('')}
                ${subject.topics.length === 0 ? '<p style="color: var(--text-muted); text-align: center;">Nenhum tópico cadastrado.</p>' : ''}
            </div>
        </div>
       `;
    }

    modal.innerHTML = renderContent();
    document.body.appendChild(modal);
    lucide.createIcons();

    // Funcao auxiliar para anexar eventos (para poder chamar novamente apos render)
    function attachEvents() {
        // Fechar
        modal.querySelector('#close-modal').addEventListener('click', () => modal.remove());

        // Adicionar novo
        const addBtn = modal.querySelector('#add-topic-btn');
        const input = modal.querySelector('#new-topic-input');

        // Prevenir multiplos listeners se chamar attachEvents varias vezes:
        // A melhor forma em Vanilla simples eh recriar o elemento ou usar onclick.
        // Vamos usar onclick para simplificar ou clonar.

        // REFACTOR: Para simplificar, quando re-renderizamos, re-chamamos openTopicsModal
        // Entao aqui so precisamos dos eventos iniciais.

        addBtn.onclick = () => {
            if (input.value.trim()) {
                State.addTopic(subjectId, input.value.trim());
                modal.remove();
                openTopicsModal(subjectId);
            }
        };

        // Move events
        modal.querySelectorAll('.btn-move').forEach(btn => {
            btn.onclick = () => {
                const topicId = Number(btn.dataset.id);
                const dir = Number(btn.dataset.dir);
                State.moveTopic(subjectId, topicId, dir);
                modal.remove();
                openTopicsModal(subjectId);
            };
        });

        // Checkbox events
        modal.querySelectorAll('.topic-check').forEach(chk => {
            chk.onchange = (e) => {
                State.toggleTopic(subjectId, Number(e.target.dataset.id));
                const span = e.target.nextElementSibling;
                if (e.target.checked) {
                    span.style.textDecoration = 'line-through';
                    span.style.color = 'var(--text-muted)';
                } else {
                    span.style.textDecoration = 'none';
                    span.style.color = 'inherit';
                }
                // Refresh background view
                const routerBtn = document.querySelector('[data-target="subjects"]');
                if (routerBtn) routerBtn.click();
            };
        });
    }

    attachEvents();
}
