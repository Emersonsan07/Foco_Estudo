import { Supabase } from './supabase-client.js';

export const State = {
    data: {
        subjects: [],
        sessions: [],
        dailyGoal: 3,
        user: null
    },
    userId: null,
    listeners: [],

    async init(uid) {
        this.userId = uid;
        await this.fetchData();
    },

    async fetchData() {
        const client = Supabase.client;

        // 1. Matérias e Tópicos
        const { data: subjects, error: subjError } = await client
            .from('subjects')
            .select(`*, topics (*)`)
            .order('created_at', { ascending: true });

        if (subjects) {
            subjects.forEach(s => {
                if (s.topics) {
                    s.topics.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                }
            });
        }
        if (subjError) console.error('Error fetching subjects:', subjError);

        // 2. Sessões
        const { data: sessions, error: sessError } = await client
            .from('sessions')
            .select('*')
            .order('date', { ascending: true });

        if (sessError) console.error('Error fetching sessions:', sessError);

        // 3. Perfil do Usuário
        const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', this.userId)
            .single();

        if (profile) {
            this.data.dailyGoal = profile.daily_goal || 3;
        } else {
            // Se não tem perfil, cria um padrão (lazy creation)
            this.data.dailyGoal = 3;
            // Tenta criar silenciosamente
            await client.from('profiles').insert({ id: this.userId, daily_goal: 3 });
        }

        this.data.subjects = subjects || [];
        this.data.sessions = sessions || [];

        this.notify();
    },

    subscribe(listener) {
        this.listeners.push(listener);
    },

    notify() {
        this.listeners.forEach(fn => fn(this.data));
    },

    // --- Actions (Async) ---

    async addSubject(subject) {
        const client = Supabase.client;
        const { data, error } = await client
            .from('subjects')
            .insert({ ...subject, user_id: this.userId })
            .select()
            .single();

        if (!error && data) {
            data.topics = [];
            this.data.subjects.push(data);
            this.notify();
        } else {
            alert('Erro ao criar matéria: ' + error.message);
        }
    },

    async deleteSubject(id) {
        const client = Supabase.client;
        const { error } = await client
            .from('subjects')
            .delete()
            .eq('id', id);

        if (!error) {
            this.data.subjects = this.data.subjects.filter(s => s.id !== id);
            this.notify();
        }
    },

    async addSession(session) {
        const client = Supabase.client;
        const dbSession = {
            ...session,
            user_id: this.userId,
            date: new Date().toISOString()
        };

        // Fix: JS camelCase to DB snake_case
        if (dbSession.subjectId) {
            dbSession.subject_id = dbSession.subjectId;
            delete dbSession.subjectId;
        }

        const { data, error } = await client
            .from('sessions')
            .insert(dbSession)
            .select()
            .single();

        if (!error && data) {
            this.data.sessions.push(data);
            this.notify();
        }
    },

    async updateGoal(hours) {
        this.data.dailyGoal = hours;
        this.notify();

        const client = Supabase.client;
        const { error } = await client
            .from('profiles')
            .upsert({
                id: this.userId,
                daily_goal: hours,
                updated_at: new Date()
            });

        if (error) console.error('Erro ao salvar meta:', error);
    },

    // Topics Actions
    async addTopic(subjectId, topicName) {
        const client = Supabase.client;
        /*
         * Pega o maior order_index atual para adicionar no final
         */
        const subject = this.data.subjects.find(s => s.id === subjectId);
        let maxOrder = 0;
        if (subject && subject.topics && subject.topics.length > 0) {
            maxOrder = Math.max(...subject.topics.map(t => t.order_index || 0));
        }

        const { data, error } = await client
            .from('topics')
            .insert({
                subject_id: subjectId,
                name: topicName,
                completed: false,
                order_index: maxOrder + 1
            })
            .select()
            .single();

        if (!error && data) {
            if (subject) {
                if (!subject.topics) subject.topics = [];
                subject.topics.push(data);
                this.notify();
            }
        }
    },

    async toggleTopic(subjectId, topicId) {
        const subject = this.data.subjects.find(s => s.id === subjectId);
        if (subject) {
            const topic = subject.topics.find(t => t.id === topicId);
            if (topic) {
                const newState = !topic.completed;
                topic.completed = newState;
                this.notify();

                const client = Supabase.client;
                const { error } = await client
                    .from('topics')
                    .update({ completed: newState })
                    .eq('id', topicId);

                if (error) {
                    topic.completed = !newState;
                    this.notify();
                    alert('Erro ao atualizar tópico');
                }
            }
        }
    },

    async moveTopic(subjectId, topicId, direction) {
        const subject = this.data.subjects.find(s => s.id === subjectId);
        if (!subject || !subject.topics) return;

        const index = subject.topics.findIndex(t => t.id === topicId);
        if (index === -1) return;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= subject.topics.length) return;

        // Swap local
        const temp = subject.topics[index];
        subject.topics[index] = subject.topics[newIndex];
        subject.topics[newIndex] = temp;

        // Re-indexar localmente
        subject.topics.forEach((t, i) => t.order_index = i);

        this.notify();

        // Persistir no Supabase (Atualiza os dois envolvidos)
        const client = Supabase.client;
        const t1 = subject.topics[index];
        const t2 = subject.topics[newIndex];

        await Promise.all([
            client.from('topics').update({ order_index: t1.order_index }).eq('id', t1.id),
            client.from('topics').update({ order_index: t2.order_index }).eq('id', t2.id)
        ]);
    }
};
