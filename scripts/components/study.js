import { State } from '../state.js';
import { AudioSys } from '../audio.js';
import { Toast } from './toast.js';

let timerInterval = null;
let seconds = 0;
let isRunning = false;
let currentSubjectId = null;

export function renderStudy() {
    const container = document.createElement('div');

    // Obter matérias para o select
    const subjects = State.data.subjects;

    if (subjects.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; margin-top: 50px;">
                <h3>Nenhuma matéria cadastrada</h3>
                <p>Cadastre uma matéria antes de começar a estudar.</p>
                <button class="btn btn-primary" onclick="document.querySelector('[data-target=subjects]').click()" style="margin-top: 16px;">Ir para Matérias</button>
            </div>
        `;
        return container;
    }

    // Layout
    container.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto;">
            <!-- Tabs / Mode Switcher -->
            <div style="display: flex; justify-content: center; margin-bottom: 24px; gap: 12px;">
                <button id="mode-timer" class="btn btn-primary">Cronômetro</button>
                <button id="mode-manual" class="btn" style="background: transparent; border: 1px solid var(--border-subtle);">Manual</button>
            </div>

            <!-- MODE: TIMER -->
            <div id="section-timer">
                <div class="form-group">
                    <label class="form-label">Selecione a Matéria</label>
                    <select id="subject-select" style="width: 100%; padding: 12px; font-size: 1.1rem;">
                        <option value="" disabled ${!currentSubjectId ? 'selected' : ''}>Escolha o que estudar...</option>
                        ${subjects.map(s => `<option value="${s.id}" ${currentSubjectId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
                    </select>
                </div>

                <div class="timer-display" id="time-display">00:00:00</div>

                <div class="timer-controls">
                    <button id="btn-start" class="btn btn-primary" ${!currentSubjectId ? 'disabled' : ''}>
                        <i data-lucide="play"></i> Iniciar
                    </button>
                    <button id="btn-pause" class="btn" style="background: var(--border-subtle); display: none;">
                        <i data-lucide="pause"></i> Pausar
                    </button>
                    <button id="btn-stop" class="btn btn-danger" style="display: none;">
                        <i data-lucide="square"></i> Parar
                    </button>
                </div>
                
                <!-- Feedback Form (Questões) -->
                <div id="session-feedback" style="text-align: center; margin-top: 32px; display: none;" class="fadeIn">
                    <div class="card" style="text-align: left; max-width: 400px; margin: 0 auto;">
                        <h3 style="color: var(--color-success); margin-bottom: 16px; text-align: center;">Sessão Finalizada!</h3>
                        
                        <div class="form-group">
                            <label class="form-label">Questões Realizadas</label>
                            <input type="number" id="questions-total" min="0" placeholder="0" style="width: 100%;">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Acertos (opcional)</label>
                            <input type="number" id="questions-correct" min="0" placeholder="0" style="width: 100%;">
                        </div>

                        <button id="btn-save-session" class="btn btn-primary" style="width: 100%;">
                            <i data-lucide="save"></i> Salvar Sessão
                        </button>
                    </div>
                </div>
            </div>

            <!-- MODE: MANUAL -->
            <div id="section-manual" style="display: none;">
                <div class="card">
                    <h3>Registrar Sessão Offline</h3>
                    <div class="form-group">
                        <label class="form-label">Matéria</label>
                        <select id="manual-subject" style="width: 100%; padding: 10px;">
                            ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Data e Hora</label>
                        <input type="datetime-local" id="manual-date" style="width: 100%;">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Duração</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="number" id="manual-hours" placeholder="Horas" min="0" style="width: 100%;">
                            <input type="number" id="manual-minutes" placeholder="Minutos" min="0" max="59" style="width: 100%;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Questões (Opcional)</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="number" id="manual-q-total" placeholder="Total" min="0" style="width: 100%;">
                            <input type="number" id="manual-q-correct" placeholder="Acertos" min="0" style="width: 100%;">
                        </div>
                    </div>

                    <button id="btn-save-manual" class="btn btn-primary" style="width: 100%;">
                        <i data-lucide="check"></i> Registrar
                    </button>
                </div>
            </div>

        </div>
    `;

    // Elements - Timer Mode
    const select = container.querySelector('#subject-select');
    const btnStart = container.querySelector('#btn-start');
    const btnPause = container.querySelector('#btn-pause');
    const btnStop = container.querySelector('#btn-stop');
    const display = container.querySelector('#time-display');
    const feedback = container.querySelector('#session-feedback');
    const btnSave = container.querySelector('#btn-save-session');

    // Elements - Mode Switcher
    const btnModeTimer = container.querySelector('#mode-timer');
    const btnModeManual = container.querySelector('#mode-manual');
    const sectionTimer = container.querySelector('#section-timer');
    const sectionManual = container.querySelector('#section-manual');

    // Elements - Manual Mode
    const btnSaveManual = container.querySelector('#btn-save-manual');

    // Funções
    function formatTime(secs) {
        const h = Math.floor(secs / 3600).toString().padStart(2, '0');
        const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function tick() {
        seconds++;
        display.innerText = formatTime(seconds);
    }

    function start() {
        if (!currentSubjectId) return;
        isRunning = true;
        timerInterval = setInterval(tick, 1000);

        btnStart.style.display = 'none';
        btnPause.style.display = 'inline-flex';
        btnStop.style.display = 'inline-flex';
        select.disabled = true;
        feedback.style.display = 'none';

        // Bloquear troca de modo durante timer
        btnModeManual.disabled = true;
        btnModeManual.style.opacity = '0.5';
    }

    function pause() {
        isRunning = false;
        clearInterval(timerInterval);

        btnStart.style.display = 'inline-flex';
        btnStart.innerHTML = '<i data-lucide="play"></i> Continuar';
        btnPause.style.display = 'none';
        lucide.createIcons();
    }

    function stop() {
        pause();
        if (seconds > 10) {
            // Tocar som de sucesso/conclusão
            AudioSys.playComplete();

            // Mostrar formulário
            feedback.style.display = 'block';
            btnStart.style.display = 'none';
            btnStop.style.display = 'none';
            btnPause.style.display = 'none';
        } else {
            Toast.info('Sessão muito curta para ser registrada.');
            resetUI();
        }
    }

    function saveSession() {
        const totalQ = Number(container.querySelector('#questions-total').value) || 0;
        const correctQ = Number(container.querySelector('#questions-correct').value) || 0;

        if (correctQ > totalQ) {
            Toast.error('O número de acertos não pode ser maior que o total de questões.');
            return;
        }

        State.addSession({
            subjectId: currentSubjectId,
            duration: seconds,
            questions: totalQ,
            correct: correctQ
        });

        Toast.success('Sessão e dados salvos com sucesso!');
        resetUI();
    }

    function resetUI() {
        seconds = 0;
        display.innerText = formatTime(0);
        btnStart.style.display = 'inline-flex';
        btnStart.innerHTML = '<i data-lucide="play"></i> Iniciar';
        btnStart.disabled = false;
        btnStop.style.display = 'none';
        btnPause.style.display = 'none';
        feedback.style.display = 'none';
        select.disabled = false;

        // Limpar inputs
        container.querySelector('#questions-total').value = '';
        container.querySelector('#questions-correct').value = '';

        // Liberar troca de modo
        btnModeManual.disabled = false;
        btnModeManual.style.opacity = '1';

        lucide.createIcons();
    }

    // Manual Mode Logic
    function switchMode(mode) {
        if (mode === 'timer') {
            sectionTimer.style.display = 'block';
            sectionManual.style.display = 'none';
            btnModeTimer.classList.add('btn-primary');
            btnModeTimer.style.background = '';
            btnModeTimer.style.border = '';
            btnModeManual.classList.remove('btn-primary');
            btnModeManual.style.background = 'transparent';
            btnModeManual.style.border = '1px solid var(--border-subtle)';
        } else {
            sectionTimer.style.display = 'none';
            sectionManual.style.display = 'block';
            btnModeManual.classList.add('btn-primary');
            btnModeManual.style.background = '';
            btnModeManual.style.border = '';
            btnModeTimer.classList.remove('btn-primary');
            btnModeTimer.style.background = 'transparent';
            btnModeTimer.style.border = '1px solid var(--border-subtle)';

            // Set default date to now (local time compliant for datetime-local)
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            container.querySelector('#manual-date').value = now.toISOString().slice(0, 16);
        }
    }

    function saveManualSession() {
        const subjectId = container.querySelector('#manual-subject').value;
        const dateVal = container.querySelector('#manual-date').value;
        const hours = Number(container.querySelector('#manual-hours').value) || 0;
        const minutes = Number(container.querySelector('#manual-minutes').value) || 0;
        const qTotal = Number(container.querySelector('#manual-q-total').value) || 0;
        const qCorrect = Number(container.querySelector('#manual-q-correct').value) || 0;

        if (!dateVal) {
            Toast.error('Por favor, selecione uma data e hora.');
            return;
        }

        const totalDuration = (hours * 3600) + (minutes * 60);

        if (totalDuration <= 0) {
            Toast.error('A duração deve ser maior que zero.');
            return;
        }

        if (qCorrect > qTotal) {
            Toast.error('O número de acertos não pode ser maior que o total de questões.');
            return;
        }

        const dateObj = new Date(dateVal);

        State.addSession({
            subjectId: subjectId,
            duration: totalDuration,
            questions: qTotal,
            correct: qCorrect,
            date: dateObj.toISOString()
        });

        Toast.success('Sessão registrada com sucesso!');

        // Limpar formulário manual
        container.querySelector('#manual-hours').value = '';
        container.querySelector('#manual-minutes').value = '';
        container.querySelector('#manual-q-total').value = '';
        container.querySelector('#manual-q-correct').value = '';
        // Voltar para aba cronômetro? Opcional. Vamos manter na manual por facilidade de inserção em massa ou não.
    }

    // Listeners
    select.addEventListener('change', (e) => {
        currentSubjectId = e.target.value;
        btnStart.disabled = false;
    });

    btnStart.addEventListener('click', start);
    btnPause.addEventListener('click', pause);
    btnStop.addEventListener('click', stop);
    btnSave.addEventListener('click', saveSession);

    // Mode Switchers
    btnModeTimer.addEventListener('click', () => switchMode('timer'));
    btnModeManual.addEventListener('click', () => switchMode('manual'));

    // Manual Action
    btnSaveManual.addEventListener('click', saveManualSession);

    lucide.createIcons();
    return container;
}
