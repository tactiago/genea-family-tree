# Genea

Sua árvore genealógica, simples e gratuita. Crie e visualize a história da sua família em minutos — sem cadastro, sem complicação.

**Live**: [arvore-genea.vercel.app](https://arvore-genea.vercel.app)

---

## Galeria

### Landing page
Boas-vindas quando a árvore está vazia — explica o que é o Genea e orienta a começar.

![Landing page do Genea](src/assets/landing-page.png)

### Árvore genealógica
Visualização em árvore com pais, filhos e cônjuges conectados.

![Árvore genealógica da família Potter](src/assets/potter-family-tree.png)

### Linha do tempo
Eventos (nascimentos e falecimentos) ordenados cronologicamente.

![Linha do tempo da família](src/assets/potters-timeline.png)

### Detalhes e relações
Card expandido para adicionar pais, filhos e cônjuge a uma pessoa.

![Card de pessoa com relações](src/assets/person-relations.png)

### Formulário de edição
Dados básicos, contato, biografia e relações em abas.

![Formulário de edição de pessoa](src/assets/person-edit.png)

---

## Recursos

- **Árvore visual** — Veja sua família em formato de árvore, com layout automático
- **Linha do tempo** — Ordene os membros por período de vida
- **Lista** — Visualize todos os membros em cards
- **Importar / exportar JSON** — Guarde os dados onde quiser e evite vendor lock-in
- **Privacidade** — Tudo é processado no seu navegador; os dados ficam apenas no seu dispositivo
- **PWA-ready** — Use no celular ou no computador; alterações são salvas automaticamente

## Como rodar

```sh
npm install
npm run dev
```

A aplicação abre em `http://localhost:8080`.

## Deploy

O build estático pode ser servido em qualquer host (Vercel, Netlify, etc.):

```sh
npm run build
```

Os arquivos ficam em `dist/`.

## Tecnologias

- Vite, React, TypeScript
- Tailwind CSS, shadcn/ui
- React Flow (árvore), Recharts (gráficos)
- Framer Motion (animações)
