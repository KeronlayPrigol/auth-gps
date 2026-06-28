# AuthGPS — Sistema de Acesso por Localização e IP

## O que é este sistema?

O **AuthGPS** é um sistema de login com dupla verificação de segurança. Antes de permitir o acesso, ele verifica **duas coisas**:

1. **Localização GPS** — O usuário está fisicamente no local autorizado? (ex: dentro do escritório)
2. **Endereço IP** — A conexão vem de uma rede autorizada? (ex: rede interna da empresa)

Só quem passa nas verificações consegue fazer login.

---

## Como funciona na prática?

```
Usuário clica em "Entrar"
         ↓
Sistema verifica: Onde você está? (GPS)
Sistema verifica: De qual rede você está conectado? (IP)
         ↓
✓ Passou nas verificações → Acesso liberado (token gerado)
✗ Falhou em alguma → Acesso negado (mostra qual verificação falhou)
```

---

## Pré-requisitos (o que precisa estar instalado)

- **Node.js** versão 18 ou superior → [nodejs.org](https://nodejs.org)
- **Yarn** (gerenciador de pacotes) → instalar com: `npm install -g yarn`

Para verificar se já estão instalados, abra o terminal e rode:
```bash
node --version
yarn --version
```

---

## Como instalar e rodar

### 1. Instalar as dependências

Na pasta raiz do projeto, rode:
```bash
yarn install
```

### 2. Configurar as variáveis de ambiente (opcional)

Crie um arquivo chamado `.env` dentro de `packages/backend/` com o conteúdo abaixo. Se não criar, o sistema usa os valores padrão.

```env
# Porta do servidor (padrão: 3001)
PORT=3001

# Chave secreta para gerar os tokens de acesso
JWT_SECRET=minha-chave-secreta

# Coordenadas do local autorizado (latitude e longitude)
ALLOWED_LAT=-27.03171092
ALLOWED_LNG=-50.91163717

# Raio de tolerância em metros (padrão: 50 metros)
ALLOWED_RADIUS_METERS=50

# IPs permitidos, separados por vírgula (padrão: localhost)
ALLOWED_IPS=127.0.0.1,::1,::ffff:127.0.0.1

# Modo de autenticação (ver explicação abaixo)
AUTH_MODE=BOTH
```

### 3. Rodar o sistema

Abra **dois terminais**:

**Terminal 1 — Backend (servidor)**
```bash
cd packages/backend
yarn dev
```
Você verá algo como:
```
🔒 AuthGPS Backend → http://localhost:3001
📍 Zona permitida: -27.03171092, -50.91163717 (raio: 50m)
🌐 IPs permitidos: 127.0.0.1, ::1
🔑 Modo: BOTH
```

**Terminal 2 — Frontend (interface visual)**
```bash
cd packages/frontend
yarn dev
```
Você verá algo como:
```
  VITE v5.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

### 4. Abrir no navegador

Acesse: **http://localhost:5173**

> O navegador pode pedir permissão para acessar a localização. Clique em **Permitir**.

---

## Como usar a interface

A tela é dividida em duas partes:

- **Esquerda (barra lateral)**: painel de controle com verificações e configurações
- **Direita**: mapa mostrando sua localização e a zona autorizada

### Painel "Verificações de Segurança"

Mostra em tempo real:
- **Endereço IP**: seu IP atual e se está na lista de permitidos (✓ OK ou ✗ Negado)
- **Localização GPS**: sua distância até o ponto autorizado (✓ OK ou ✗ Negado)

### Painel "Zona de Teste" (⚙)

Permite mudar o ponto de localização autorizado sem reiniciar o sistema.

- **Latitude / Longitude**: coordenadas do ponto central da zona
- **Raio (metros)**: distância máxima permitida a partir do ponto central
- **"Usar minha posição"**: define o ponto como onde você está agora
- **"Aplicar"**: salva as alterações imediatamente

> **Exemplo de teste**: Clique em "Usar minha posição" e depois "Aplicar". Agora a zona estará centralizada onde você está. Clique em "Entrar" — o GPS deve passar.

### Painel "IPs Permitidos" (🌐)

Permite ver e editar a lista de IPs autorizados sem reiniciar o sistema.

- A lista mostra todos os IPs que podem fazer login
- Seu IP atual aparece marcado com **(você)** em verde
- **"Adicionar meu IP"**: adiciona seu IP atual à lista com um clique
- **"✕"**: remove um IP da lista
- Campo de texto: adicione qualquer IP manualmente e clique em "Adicionar"

> **Exemplo de teste**: Remova seu IP da lista e tente fazer login — será negado. Adicione de volta — funcionará.

### Botão "Entrar"

Executa o login com as verificações ativas. O resultado aparece:
- **Verde**: acesso liberado
- **Vermelho**: acesso negado, com explicação

---

## Modos de autenticação (`AUTH_MODE`)

| Modo     | Descrição |
|----------|-----------|
| `BOTH`   | Precisa passar **nas duas** verificações (GPS e IP). **Padrão.** |
| `GPS`    | Só verifica localização. IP é ignorado. |
| `IP`     | Só verifica o IP. GPS é ignorado. |
| `EITHER` | Passa se **qualquer uma** das verificações for aprovada. |

Para mudar o modo, edite o arquivo `.env` e reinicie o backend.

---

## Estrutura dos arquivos

```
auth-gps/
├── packages/
│   ├── backend/              ← Servidor (lógica das regras)
│   │   └── src/
│   │       ├── index.ts      ← Ponto de entrada, inicia o servidor
│   │       ├── config.ts     ← Configurações (porta, zona, IPs, modo)
│   │       ├── routes/
│   │       │   └── auth.ts   ← Regras de login, verificação de IP e GPS
│   │       └── utils/
│   │           └── distance.ts ← Cálculo de distância entre dois pontos
│   │
│   └── frontend/             ← Interface visual (o que o usuário vê)
│       └── src/
│           ├── App.tsx       ← Tela principal, conecta todos os componentes
│           ├── services/
│           │   └── api.ts    ← Comunicação com o servidor
│           └── components/
│               ├── StatusPanel.tsx ← Painel de verificações (IP e GPS)
│               ├── MapView.tsx     ← Mapa interativo
│               ├── ZoneConfig.tsx  ← Painel de configuração da zona GPS
│               ├── IPConfig.tsx    ← Painel de configuração de IPs
│               └── LoginForm.tsx   ← Botão de login e mensagens
```

---

## Modificações comuns

### Mudar o local autorizado permanentemente

Edite o arquivo `packages/backend/.env`:
```env
ALLOWED_LAT=-23.5505   # Latitude do ponto (ex: São Paulo)
ALLOWED_LNG=-46.6333   # Longitude do ponto
ALLOWED_RADIUS_METERS=100  # Raio em metros
```
Reinicie o backend (`Ctrl+C` e `yarn dev` novamente).

> **Como pegar as coordenadas de um local?** Abra o Google Maps, clique com o botão direito no local desejado e copie as coordenadas que aparecem.

### Adicionar IPs permanentemente

Edite o arquivo `packages/backend/.env`:
```env
ALLOWED_IPS=127.0.0.1,::1,192.168.1.50,10.0.0.1
```
Os IPs são separados por vírgula, sem espaços.

### Mudar o modo de autenticação

```env
AUTH_MODE=GPS     # Só GPS (ignora IP)
AUTH_MODE=IP      # Só IP (ignora GPS)
AUTH_MODE=EITHER  # Qualquer um dos dois basta
AUTH_MODE=BOTH    # Precisa dos dois (padrão)
```

---

## Perguntas frequentes

**Por que meu GPS não aparece?**
O navegador precisa de permissão. Clique no cadeado na barra de endereço do navegador → Permissões do site → Localização → Permitir.

**O mapa não carregou.**
Verifique se você tem conexão com a internet. O mapa usa o OpenStreetMap que requer internet.

**O backend não inicia.**
Verifique se a porta 3001 não está sendo usada por outro programa. Você pode mudar a porta no `.env`: `PORT=3002`.

**Aparece "Erro de conexão com o servidor".**
O backend precisa estar rodando. Verifique o Terminal 1 e reinicie com `yarn dev` se necessário.

**Testei e o login foi negado mesmo estando no local certo.**
Verifique o painel "IPs Permitidos" — seu IP precisa estar na lista se o `AUTH_MODE` for `BOTH` ou `IP`. Clique em "Adicionar meu IP" para liberar.
