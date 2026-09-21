# 🗺️ Mapa da Saúde de Minas Gerais

Mapa interativo dos **853 municípios de Minas Gerais** e das regionais de saúde,
para visualizar quais cidades ficam dentro do raio de abrangência de cada
regional.

## ✨ Funcionalidades

- **Todos os municípios do estado** com população do Censo 2022, microrregião e
  mesorregião.
- **7 regionais de saúde** com o seu raio de abrangência desenhado no mapa.
- **Cidades próximas**: clique numa regional ou em qualquer cidade e veja a
  lista das que caem dentro do raio, com a distância calculada por Haversine.
- **Seleção por área**: desenhe um retângulo sobre o mapa e veja todas as
  cidades contidas nele.
- **Sem dependência de rede**: os dados são embarcados na aplicação, que carrega
  instantaneamente e funciona offline.

## 🛠️ Tecnologias

- **React 19**
- **Leaflet** e **react-leaflet 5** para o mapa
- **Vite 7** como build tool
- **Vitest** para os testes
- Dados do **IBGE** (municípios e Censo 2022)

## 🚀 Como executar

Pré-requisito: **Node.js 20.19+** (ou 22.12+).

```bash
git clone https://github.com/Davi7071/Mapa-de-Minas.git
cd Mapa-de-Minas
npm install
npm run dev
```

Acesse <http://localhost:5173>.

### Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build de produção |
| `npm test` | Roda os testes |
| `npm run lint` | Roda o ESLint |
| `npm run dados` | Regenera `src/data/municipios-mg.json` |

## 📊 Os dados

`src/data/municipios-mg.json` é **versionado no repositório** e contém os 853
municípios de MG. A aplicação não faz nenhuma requisição de rede para carregá-lo.

O arquivo é gerado por `scripts/gerar-dados.mjs` (`npm run dados`), que cruza
três fontes em três requisições:

| Fonte | O que traz |
|---|---|
| IBGE — `localidades/estados/31/municipios` | nome, código, microrregião e mesorregião |
| IBGE — agregado 4709, variável 93, 2022 | população (Censo 2022) |
| [kelvins/municipios-brasileiros](https://github.com/kelvins/municipios-brasileiros) | coordenadas da sede municipal |

O script aborta se algum município ficar sem coordenada ou sem população, para
não gravar dado pela metade.

Só é preciso rodá-lo de novo quando sair um novo Censo ou estimativa
populacional, ou quando a malha municipal mudar.

> **Por que a sede e não o centroide?** A malha do IBGE traz os polígonos dos
> municípios, mas o centroide de um polígono chega a ficar 15 km da sede — o
> suficiente para mudar quais cidades entram num raio de 50–70 km.

> **Atenção ao trocar o ano.** Anos censitários usam o agregado 4709; anos não
> censitários usam o 6579 (estimativas, variável 9324). O 6579 não devolve dados
> em anos de Censo.

## 📁 Estrutura

```
Mapa-de-Minas/
├── scripts/
│   └── gerar-dados.mjs             # Gera o JSON dos municípios
├── src/
│   ├── Components/
│   │   ├── MapaComRegionais.jsx    # Componente principal do mapa
│   │   └── MapaComRegionais.css
│   ├── data/
│   │   ├── municipios-mg.json      # 853 municípios (gerado)
│   │   └── regionais.js            # Regionais de saúde e raio padrão
│   ├── lib/
│   │   ├── geo.js                  # Distância e filtros por raio/área
│   │   └── geo.test.js
│   ├── App.jsx
│   └── main.jsx
└── index.html
```

## 🎯 Como usar

1. **Clique numa regional** (marcador amarelo com "R") para ver as cidades
   dentro do seu raio de abrangência.
2. **Clique em qualquer cidade** (ponto azul) para ver as cidades num raio de
   50 km.
3. **Clique em "Desenhar Área"** e depois em dois pontos do mapa para delimitar
   um retângulo; as cidades contidas nele aparecem na lista.
4. **"Limpar"** desfaz a seleção.

## 🗺️ Regionais

Definidas em `src/data/regionais.js`, cada uma com cidade-base, coordenadas e
raio próprio (hoje 70 km):

Divinópolis · Governador Valadares · Juiz de Fora · Montes Claros ·
Poços de Caldas · Uberaba · Uberlândia

Para mudar a lista, o raio de cada regional ou o raio padrão de cidades avulsas
(`RAIO_PADRAO_KM`), edite esse arquivo.

## 🚀 Deploy

O build é um site estático em `dist/`, publicável em Vercel, Netlify, GitHub
Pages ou qualquer servidor de arquivos.

```bash
npm run build
```

## 📝 Licença

MIT — veja [LICENSE](LICENSE).
