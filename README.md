# Daily Diet — Projeto Fullstack

Aplicação acadêmica de controle de refeições, com API Node.js/Express, frontend React/Vite e banco SQLite.

## Requisitos
- Node.js 20.19+ (ou versão LTS compatível)
- npm
- VS Code recomendado

## Estrutura
- `backend/`: API REST, autenticação JWT e banco SQLite.
- `frontend/`: interface React.
- `docs/`: material de apoio.

## 1. Iniciar o backend
Abra um terminal na pasta `backend` e execute:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

A API ficará em `http://localhost:3333`. O banco `daily-diet.sqlite` será criado automaticamente em `backend/data/`.

## 2. Iniciar o frontend
Abra outro terminal na pasta `frontend`:

```powershell
npm install
npm run dev
```

Abra o endereço exibido pelo Vite (normalmente `http://localhost:5173`).

## 3. Como testar
1. Crie uma conta pela tela de cadastro.
2. Entre com e-mail e senha.
3. Cadastre refeições marcando se estão dentro ou fora da dieta.
4. Edite ou exclua uma refeição.
5. Consulte o painel de métricas.

## Rotas da API
Todas as rotas abaixo usam prefixo `/api`.

| Método | Rota | Acesso |
|---|---|---|
| POST | `/auth/register` | Público |
| POST | `/auth/login` | Público |
| GET | `/auth/me` | Autenticado |
| POST | `/meals` | Autenticado |
| GET | `/meals` | Autenticado |
| GET | `/meals/:id` | Autenticado |
| PUT | `/meals/:id` | Autenticado |
| DELETE | `/meals/:id` | Autenticado |
| GET | `/metrics` | Autenticado |

## Segurança e regras
- Senhas são armazenadas como hash com bcryptjs.
- O token JWT identifica o usuário autenticado.
- Cada consulta, edição e exclusão de refeição filtra pelo `user_id` do token.
- A API valida os campos essenciais e responde com códigos HTTP apropriados.

## Observação acadêmica
Este é um projeto-base funcional para estudo. Antes de publicar em produção, configure um segredo JWT forte, HTTPS, política de CORS restrita, validações adicionais, testes automatizados e estratégia de backup.
