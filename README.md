# Nosso Diário

Site estático (sem banco de dados) com tema de pergaminho/livro antigo,
efeito de virar página, e um sumário que marca com um selo "novo" as
anotações feitas nos últimos 7 dias.

## Arquivos

- `index.html` — estrutura da página (não precisa mexer nisso no dia a dia)
- `style.css` — visual (cores, fontes, animação da página)
- `script.js` — lógica do livro (não precisa mexer nisso no dia a dia)
- `entries.js` — **é aqui que você escreve.** Cada anotação do diário é um
  objeto nessa lista.

## Como adicionar uma nova anotação

Abra `entries.js` e adicione um bloco no final da lista `DIARY_ENTRIES`:

```js
{
  date: "2026-07-26",       // formato AAAA-MM-DD
  title: "Título do dia",
  content: [
    "Primeiro parágrafo.",
    "Segundo parágrafo, se quiser."
  ]
},
```

Salve o arquivo. A anotação:
- aparece automaticamente no Sumário (segunda página do livro), em ordem
  de data;
- ganha um selinho dourado **"novo"** no sumário durante 7 dias
  (dá pra mudar isso em `script.js`, na constante `NEW_BADGE_DAYS`, lá
  no topo do arquivo);
- vira uma página nova do livro, entre o sumário e a página final
  (a última página do livro é sempre a surpresa com o lacre de cera).

Não existe banco de dados: as anotações ficam guardadas dentro do próprio
código. Isso quer dizer que, para o namoro... digo, para o site, ver uma
anotação nova, você precisa subir a alteração de novo para o Vercel
(fazer o deploy de novo) depois de editar o arquivo.

## Como colocar no ar (Vercel)

**Opção mais simples — sem instalar nada, pelo site:**
1. Crie uma conta em https://vercel.com (pode entrar com GitHub, Google etc).
2. Suba esta pasta para um repositório no GitHub (crie um repositório novo
   e arraste os arquivos, ou use o GitHub Desktop).
3. No painel do Vercel, clique em **Add New → Project**, selecione o
   repositório e clique em **Deploy**. Não precisa configurar nada —
   é um site estático puro (HTML/CSS/JS), o Vercel detecta sozinho.
4. Toda vez que você editar `entries.js` e enviar (`git push`) a mudança
   para o GitHub, o Vercel atualiza o site sozinho.

**Opção pela linha de comando, se preferir:**
```bash
npm install -g vercel
cd diario
vercel        # primeira vez, segue as perguntas
vercel --prod # toda vez que quiser publicar uma atualização
```

## Personalizar

- Nome na capa: procure `Nosso Diário` e `para Tatiane` dentro de
  `script.js`, na função `buildCoverPage()`.
- Cores do pergaminho, tinta e cera: topo de `style.css`, dentro de
  `:root { ... }`.
- Fontes: trocadas no `<link>` do Google Fonts dentro de `index.html`.
