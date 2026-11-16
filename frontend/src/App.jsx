import { useEffect, useMemo, useState } from 'react';
import { Activity, Apple, Plus, Pencil, Trash2, LogOut, Utensils, X, CheckCircle2, Eye } from 'lucide-react';
import { api, getMealById } from './api';

const emptyForm = () => ({
  name: '', description: '',
  dateTime: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
  isOnDiet: true
});

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('daily-diet-token') || '');
  const [user, setUser] = useState(null);
  const [meals, setMeals] = useState([]);
  const [metrics, setMetrics] = useState({ totalMeals: 0, mealsOnDiet: 0, mealsOffDiet: 0, bestOnDietSequence: 0 });
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState({ name: '', email: '', password: '' });
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para guardar a refeição que será visualizada
  const [selectedMeal, setSelectedMeal] = useState(null);

  // Função que busca a refeição pelo ID
  async function handleViewMeal(id) {
    try {
      const data = await api(`/meals/${id}`, { token });
      setSelectedMeal(data.meal);
    } catch (err) {
      alert("Erro ao buscar detalhes da refeição.");
    }
  }

  async function refresh(currentToken = token) {
    const [mealData, metricData, userData] = await Promise.all([
      api('/meals', { token: currentToken }),
      api('/metrics', { token: currentToken }),
      api('/auth/me', { token: currentToken })
    ]);
    setMeals(mealData.meals);
    setMetrics(metricData.metrics);
    setUser(userData.user);
  }

  useEffect(() => {
    if (token) refresh(token).catch(() => logout());
  }, [token]);

  function logout() {
    localStorage.removeItem('daily-diet-token');
    setToken('');
    setUser(null);
    setMeals([]);
  }

  async function submitAuth(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const data = await api(endpoint, { method: 'POST', body: JSON.stringify(auth) });
      localStorage.setItem('daily-diet-token', data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm());
    setError('');
    setShowForm(true);
  }

  function startEdit(meal) {
    setEditingId(meal.id);
    setForm({
      name: meal.name,
      description: meal.description,
      dateTime: meal.dateTime.slice(0, 16),
      isOnDiet: meal.isOnDiet
    });
    setError('');
    setShowForm(true);
  }

  async function saveMeal(event) {
    event.preventDefault();
    setError('');
    try {
      const path = editingId ? `/meals/${editingId}` : '/meals';
      await api(path, {
        token,
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(form)
      });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteMeal(id) {
    if (!window.confirm('Deseja realmente excluir esta refeição?')) return;
    try {
      await api(`/meals/${id}`, { token, method: 'DELETE' });
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const groupedMeals = useMemo(() => meals, [meals]);

  if (!token || !user) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-mark"><Apple size={27} /></div>
          <p className="eyebrow">SUA ROTINA, COM MAIS EQUILÍBRIO</p>
          <h1>Daily Diet</h1>
          <p className="muted">Acompanhe suas refeições e construa hábitos melhores.</p>
          <form onSubmit={submitAuth} className="stack">
            {authMode === 'register' && <label>Nome<input required value={auth.name} onChange={e => setAuth({ ...auth, name: e.target.value })} placeholder="Seu nome" /></label>}
            <label>E-mail<input required type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="voce@email.com" /></label>
            <label>Senha<input required minLength="6" type="password" value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder="Mínimo de 6 caracteres" /></label>
            {error && <p className="error">{error}</p>}
            <button className="primary" disabled={loading}>{loading ? 'Aguarde...' : authMode === 'login' ? 'Entrar' : 'Criar minha conta'}</button>
          </form>
          <button className="text-button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}>
            {authMode === 'login' ? 'Ainda não tem conta? Cadastre-se' : 'Já tem uma conta? Entrar'}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark small"><Apple size={20} /></span> Daily Diet</a>
        <div className="user-area"><span>Olá, <strong>{user.name}</strong></span><button className="icon-button" title="Sair" onClick={logout}><LogOut size={18} /></button></div>
      </header>

      <section className="welcome">
        <div><p className="eyebrow">VISÃO GERAL</p><h1>Seu diário alimentar</h1><p className="muted">Pequenas escolhas constroem grandes resultados.</p></div>
        <button className="primary add-button" onClick={startNew}><Plus size={18} /> Nova refeição</button>
      </section>

      <section className="metrics-grid">
        <Metric icon={<Utensils />} label="Refeições registradas" value={metrics.totalMeals} />
        <Metric icon={<CheckCircle2 />} label="Dentro da dieta" value={metrics.mealsOnDiet} tone="green" />
        <Metric icon={<Activity />} label="Fora da dieta" value={metrics.mealsOffDiet} tone="orange" />
        <Metric icon={<Apple />} label="Maior sequência na dieta" value={metrics.bestOnDietSequence} suffix=" refeições" />
      </section>

      <section className="list-section">
        <div className="section-heading"><div><p className="eyebrow">HISTÓRICO</p><h2>Suas refeições</h2></div><span className="count">{meals.length} registros</span></div>
        {error && <p className="error">{error}</p>}
        {groupedMeals.length === 0 ? (
          <div className="empty-state"><div className="empty-icon"><Utensils size={26} /></div><h3>Nenhuma refeição por aqui</h3><p className="muted">Comece registrando sua primeira refeição.</p><button className="secondary" onClick={startNew}>Adicionar refeição</button></div>
        ) : (
          <div className="meal-list">
            {groupedMeals.map(meal => (
              <article className="meal-card" key={meal.id}>
                <div className="meal-symbol"><Utensils size={19} /></div>
                <div className="meal-info"><h3>{meal.name}</h3><p>{meal.description || 'Sem descrição'}</p><time>{new Date(meal.dateTime).toLocaleString('pt-BR')}</time></div>
                <span className={`status ${meal.isOnDiet ? 'good' : 'bad'}`}><i />{meal.isOnDiet ? 'Dentro da dieta' : 'Fora da dieta'}</span>
                
                {/* AQUI ESTÃO OS BOTÕES COM O NOVO BOTÃO DE VISUALIZAR INCLUÍDO */}
                <div className="meal-actions">
                  <button className="icon-button" title="Visualizar" onClick={() => handleViewMeal(meal.id)}><Eye size={17} /></button>
                  <button className="icon-button" title="Editar" onClick={() => startEdit(meal)}><Pencil size={17} /></button>
                  <button className="icon-button danger" title="Excluir" onClick={() => deleteMeal(meal.id)}><Trash2 size={17} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* FORMULÁRIO DE CRIAR/EDITAR */}
      {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
        <section className="modal">
          <div className="modal-heading"><div><p className="eyebrow">{editingId ? 'ATUALIZAÇÃO' : 'NOVO REGISTRO'}</p><h2>{editingId ? 'Editar refeição' : 'Adicionar refeição'}</h2></div><button className="icon-button" onClick={() => setShowForm(false)}><X /></button></div>
          <form onSubmit={saveMeal} className="stack">
            <label>Nome da refeição<input required maxLength="100" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Almoço" /></label>
            <label>Descrição<textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descreva o que você comeu..." rows="3" /></label>
            <label>Data e hora<input required type="datetime-local" value={form.dateTime} onChange={e => setForm({ ...form, dateTime: e.target.value })} /></label>
            <fieldset><legend>Está dentro da dieta?</legend><div className="choice-row">
              <label className={`choice ${form.isOnDiet ? 'selected' : ''}`}><input type="radio" checked={form.isOnDiet} onChange={() => setForm({ ...form, isOnDiet: true })} /> Sim, dentro</label>
              <label className={`choice ${!form.isOnDiet ? 'selected' : ''}`}><input type="radio" checked={!form.isOnDiet} onChange={() => setForm({ ...form, isOnDiet: false })} /> Não, fora</label>
            </div></fieldset>
            {error && <p className="error">{error}</p>}
            <div className="modal-actions"><button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancelar</button><button className="primary">{editingId ? 'Salvar alterações' : 'Salvar refeição'}</button></div>
          </form>
        </section>
      </div>}

      {/* JANELA DE DETALHES DA REFEIÇÃO (MODAL DE VISUALIZAÇÃO) */}
      {selectedMeal && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedMeal(null); }}>
          <section className="modal">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">DETALHES</p>
                <h2>Informações da Refeição</h2>
              </div>
              <button className="icon-button" onClick={() => setSelectedMeal(null)}><X /></button>
            </div>
            <div className="stack" style={{ marginTop: '1rem' }}>
              <p><strong>Nome:</strong> {selectedMeal.name}</p>
              <p><strong>Descrição:</strong> {selectedMeal.description || 'Nenhuma descrição informada.'}</p>
              <p><strong>Data e Hora:</strong> {new Date(selectedMeal.dateTime).toLocaleString('pt-BR')}</p>
              <p><strong>Status:</strong> {selectedMeal.isOnDiet ? 'Dentro da dieta 🥗' : 'Fora da dieta 🍔'}</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Metric({ icon, label, value, tone = '', suffix = '' }) {
  return <article className={`metric-card ${tone}`}><div className="metric-icon">{icon}</div><p>{label}</p><strong>{value}<small>{suffix}</small></strong></article>;
}