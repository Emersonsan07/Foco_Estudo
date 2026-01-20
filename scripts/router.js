export const Router = {
    routes: {},

    init(routes) {
        this.routes = routes;

        // Event Listeners para navegação
        document.querySelectorAll('[data-target]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Encontrar o botão (mesmo se clicou no ícone)
                const targetBtn = e.target.closest('[data-target]');
                const targetId = targetBtn.dataset.target;
                this.navigate(targetId);
            });
        });

        // Carregar view inicial (padrão: dashboard)
        this.navigate('dashboard');
    },

    navigate(routeId) {
        // Atualizar estado visual dos botões
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.target === routeId) {
                btn.classList.add('active');
            }
        });

        // Ocultar views antigas
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = ''; // Limpa o conteúdo atual

        // Carregar nova view
        if (this.routes[routeId]) {
            // Atualizar título
            const titles = {
                dashboard: 'Dashboard',
                subjects: 'Matérias',
                study: 'Sessão de Estudo',
                stats: 'Estatísticas',
                settings: 'Configurações'
            };
            document.getElementById('page-title').innerText = titles[routeId] || 'Foco';

            // Executar renderizador da rota
            const viewElement = this.routes[routeId]();
            contentArea.appendChild(viewElement);
        }
    }
};
