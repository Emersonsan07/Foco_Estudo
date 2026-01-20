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

    // Sidebar Toggle
    // Sidebar Toggle (Desktop)
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Mobile Sidebar Toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const overlay = document.querySelector('.sidebar-overlay');

    function closeMobileSidebar() {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
    }

    if (mobileToggle && sidebar && overlay) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.add('mobile-open');
            overlay.classList.add('active');
        });

        overlay.addEventListener('click', closeMobileSidebar);

        // Close when clicking nav items on mobile
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    closeMobileSidebar();
                }
            });
        });
    }

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

        // Personalizar Saudação
        const userName = session.user.user_metadata?.display_name || 'Estudante';
        const greetingEl = document.querySelector('.greeting');
        const avatarEl = document.querySelector('.avatar');

        if (greetingEl) greetingEl.textContent = `Olá, ${userName}`;
        if (avatarEl) avatarEl.textContent = userName.charAt(0).toUpperCase();

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
