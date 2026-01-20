import { State } from '../state.js';
import { Toast } from './toast.js';

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
                                <i data-lucide="list"></i> Edital Verticalizado
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
                    State.deleteSubject(btn.dataset.id);
                    render();
                }
            });
        });

        // Tópicos (Edital Verticalizado)
        container.querySelectorAll('.view-topics').forEach(btn => {
            btn.addEventListener('click', () => openTopicsModal(btn.dataset.id));
        });

        lucide.createIcons();
    }

    render();
    return container;
}

function renderProgressBar(subject) {
    if (!subject.topics || subject.topics.length === 0) return '<small style="color:var(--text-muted)">Sem conteúdo cadastrado</small>';

    const total = subject.topics.length;
    const completed = subject.topics.filter(t => t.completed).length;
    const percent = Math.round((completed / total) * 100);

    return `
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px;">
            <span>Progresso do Edital</span>
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
                <h3>${subject.name} - Edital / Conteúdo</h3>
                <button id="close-modal" class="btn-icon"><i data-lucide="x"></i></button>
            </div>
            
            <div class="form-group" style="display: flex; gap: 8px;">
                <input type="text" id="new-topic-input" placeholder="Adicionar tópico do edital..." style="flex: 1;">
                <button id="add-topic-btn" class="btn btn-primary"><i data-lucide="plus"></i></button>
            </div>

            <div style="max-height: 400px; overflow-y: auto;">
                ${subject.topics.map(topic => `
                    <div style="padding: 8px; border-bottom: 1px solid var(--border-subtle);">
                        <!-- Topic Header -->
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                <button class="btn-move" data-id="${topic.id}" data-dir="-1" style="font-size: 0.6rem; padding: 2px; cursor: pointer;">▲</button>
                                <button class="btn-move" data-id="${topic.id}" data-dir="1" style="font-size: 0.6rem; padding: 2px; cursor: pointer;">▼</button>
                            </div>
                            
                            <input type="checkbox" class="topic-check" data-id="${topic.id}" ${topic.completed ? 'checked' : ''}>
                            <span class="topic-name" style="font-weight: 600; flex: 1; ${topic.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${topic.name}</span>
                            
                            <button class="btn-icon add-subitem-btn" data-topic-id="${topic.id}" title="Adicionar Sub-item">
                                <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i>
                            </button>
                        </div>

                        <!-- Subitems List -->
                        <div class="subitems-list" style="padding-left: 32px; border-left: 2px solid var(--border-subtle); margin-left: 12px;">
                            ${(topic.subitems || []).map(sub => `
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                    <input type="checkbox" class="subitem-check" data-topic-id="${topic.id}" data-id="${sub.id}" ${sub.completed ? 'checked' : ''}>
                                    <span style="font-size: 0.9rem; flex: 1; ${sub.completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${sub.name}</span>
                                    <button class="btn-icon delete-subitem" data-topic-id="${topic.id}" data-id="${sub.id}" style="color: var(--color-danger); opacity: 0.5;">
                                        <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
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

    // Event Delegation Simplificado para lidar com re-renders se necessário
    // Mas aqui vamos usar uma estrategia simples de re-criar events
    function attachEvents() {
        modal.querySelector('#close-modal').onclick = () => modal.remove();

        // Add Topic
        const addBtn = modal.querySelector('#add-topic-btn');
        const input = modal.querySelector('#new-topic-input');

        addBtn.onclick = () => {
            if (input.value.trim()) {
                State.addTopic(subjectId, input.value.trim());
                modal.remove();
                openTopicsModal(subjectId); // Re-open to refresh
            }
        };

        // Topic Actions
        modal.querySelectorAll('.btn-move').forEach(btn => {
            btn.onclick = () => {
                const topicId = btn.dataset.id;
                const dir = Number(btn.dataset.dir);
                State.moveTopic(subjectId, topicId, dir);
                modal.remove(); openTopicsModal(subjectId);
            };
        });

        modal.querySelectorAll('.topic-check').forEach(chk => {
            chk.onchange = (e) => {
                State.toggleTopic(subjectId, e.target.dataset.id);
                const span = e.target.closest('div').querySelector('.topic-name');
                if (e.target.checked) {
                    span.style.textDecoration = 'line-through';
                    span.style.color = 'var(--text-muted)';
                } else {
                    span.style.textDecoration = 'none';
                    span.style.color = 'inherit';
                }
                const routerBtn = document.querySelector('[data-target="subjects"]');
                if (routerBtn) routerBtn.click();
            };
        });

        // --- Subitem Actions ---

        // Add Subitem (Prompt Simples)
        modal.querySelectorAll('.add-subitem-btn').forEach(btn => {
            btn.onclick = async () => {
                const topicId = btn.dataset.topicId;
                const name = prompt('Nome do sub-item / checklist:');
                if (name) {
                    try {
                        const originalContent = btn.innerHTML;
                        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i>'; // Spinner
                        btn.disabled = true;

                        await State.addSubitem(topicId, name);
                        modal.remove();
                        openTopicsModal(subjectId);
                    } catch (err) {
                        console.error(err);
                        Toast.error('Erro ao adicionar. Verifique se criou a tabela no Supabase.');
                        btn.disabled = false;
                        btn.innerHTML = '<i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i>';
                        lucide.createIcons();
                    }
                }
            };
        });

        // Toggle Subitem
        modal.querySelectorAll('.subitem-check').forEach(chk => {
            chk.onchange = (e) => {
                const topicId = e.target.dataset.topicId;
                const subId = e.target.dataset.id;
                State.toggleSubitem(topicId, subId);

                const span = e.target.nextElementSibling;
                if (e.target.checked) {
                    span.style.textDecoration = 'line-through';
                    span.style.color = 'var(--text-muted)';
                } else {
                    span.style.textDecoration = 'none';
                    span.style.color = 'inherit';
                }
            };
        });

        // Delete Subitem
        modal.querySelectorAll('.delete-subitem').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('Excluir este sub-item?')) {
                    try {
                        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i>';
                        btn.disabled = true;
                        lucide.createIcons();

                        await State.deleteSubitem(btn.dataset.topicId, btn.dataset.id);
                        modal.remove();
                        openTopicsModal(subjectId);
                    } catch (err) {
                        Toast.error('Erro ao excluir subitem.');
                    }
                }
            };
        });
    }

    attachEvents();
}
