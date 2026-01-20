import { State } from '../state.js';
import { AudioSys } from '../audio.js';

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
            <div class="form-group">
                <label class="form-label">Selecione a Matéria</label>
                <select id="subject-select" style="width: 100%; padding: 12px; font-size: 1.1rem;">
                    <option value="" disabled selected>Escolha o que estudar...</option>
                    ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                </select>
            </div>

            <div class="timer-display" id="time-display">00:00:00</div>

            <div class="timer-controls">
                <button id="btn-start" class="btn btn-primary" disabled>
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
    `;

    // Elements
    const select = container.querySelector('#subject-select');
    const btnStart = container.querySelector('#btn-start');
    const btnPause = container.querySelector('#btn-pause');
    const btnStop = container.querySelector('#btn-stop');
    const display = container.querySelector('#time-display');
    const feedback = container.querySelector('#session-feedback');
    const btnSave = container.querySelector('#btn-save-session');

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
            alert('Sessão muito curta para ser registrada.');
            resetUI();
        }
    }

    function saveSession() {
        const totalQ = Number(container.querySelector('#questions-total').value) || 0;
        const correctQ = Number(container.querySelector('#questions-correct').value) || 0;

        if (correctQ > totalQ) {
            alert('O número de acertos não pode ser maior que o total de questões.');
            return;
        }

        State.addSession({
            subjectId: currentSubjectId,
            duration: seconds,
            questions: totalQ,
            correct: correctQ
        });

        alert('Sessão e dados salvos com sucesso!');
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

        lucide.createIcons();
    }

    // Listeners
    select.addEventListener('change', (e) => {
        currentSubjectId = Number(e.target.value);
        btnStart.disabled = false;
    });

    btnStart.addEventListener('click', start);
    btnPause.addEventListener('click', pause);
    btnStop.addEventListener('click', stop);
    btnSave.addEventListener('click', saveSession);

    lucide.createIcons();
    return container;
}
