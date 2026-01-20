import { ThemeManager } from './theme.js';
import { State } from './state.js';
import { Router } from './router.js';
import { Supabase } from './supabase-client.js';

// Importar componentes
import { renderAuth } from './components/auth.js';
import { renderDashboard } from './components/dashboard.js';
import { renderSubjects } from './components/subjects.js';
import { renderStudy } from './components/study.js';
import { renderStats } from './components/stats.js';
import { renderSettings } from './components/settings.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar Ícones e Tema (sempre necessários)
    lucide.createIcons();
    ThemeManager.init();

    // Verificar Sessão Supabase
    const client = Supabase.client;
    const { data: { session } } = await client.auth.getSession();

    if (!session) {
        // Se não logado, renderizar tela de Auth
        document.getElementById('app').innerHTML = ''; // Limpa layout padrão
        document.getElementById('app').appendChild(renderAuth());
    } else {
        // Se logado, Inicializar Dados e Rotas
        console.log('User logged in:', session.user.email);

        await State.init(session.user.id);

        Router.init({
            dashboard: renderDashboard,
            subjects: renderSubjects,
            study: renderStudy,
            stats: renderStats,
            settings: renderSettings
        });
    }
});
