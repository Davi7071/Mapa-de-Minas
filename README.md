# 🗺️ Mapa da Saúde de Minas Gerais

Um sistema interativo de mapeamento geográfico que permite visualizar e analisar as regionais de Minas Gerais, incluindo cidades próximas e informações demográficas.

## ✨ Funcionalidades

### 🎯 Principais
- **Mapa Interativo**: Visualização geográfica completa do estado de Minas Gerais
- **Regionais**: 7 regionais estratégicas marcadas no mapa
- **Cidades Próximas**: Sistema de busca automática de cidades próximas a cada regional
- **Informações Demográficas**: População e dados das cidades
- **Interface Responsiva**: Funciona em desktop e dispositivos móveis

### 🎮 Interatividade
- **Clique nas Regionais**: Selecione uma regional para ver cidades próximas
- **Círculo de Abrangência**: Visualização do raio de cobertura de cada regional
- **Painéis Informativos**: Dados detalhados em tempo real
- **Marcadores Dinâmicos**: Diferentes tipos de marcadores para cidades e regionais

## 🛠️ Tecnologias Utilizadas

- **React 18** - Framework principal
- **Leaflet** - Biblioteca de mapas interativos
- **Vite** - Build tool e servidor de desenvolvimento
- **CSS3** - Estilização responsiva
- **IBGE API** - Dados oficiais de municípios brasileiros

## 🚀 Como Executar

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/mapa-saude-mg.git
cd mapa-saude-mg
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute o projeto**
```bash
npm run dev
```

4. **Acesse no navegador**
```
http://localhost:5173
```

## 📁 Estrutura do Projeto

```
mapa-saude-mg/
├── src/
│   ├── Components/
│   │   ├── MapaComRegionais.jsx    # Componente principal do mapa
│   │   └── MapaComRegionais.css    # Estilos do mapa
│   ├── data/
│   │   └── regionais.js            # Dados das regionais de saúde
│   ├── services/
│   │   └── ibgeService.js          # Serviços de API do IBGE
│   ├── App.jsx                     # Componente raiz
│   └── main.jsx                    # Ponto de entrada
├── public/                         # Arquivos estáticos
├── package.json                    # Dependências e scripts
└── README.md                       # Este arquivo
```

## 🎯 Como Usar

### Visualização Geral
1. Abra o sistema no navegador
2. O mapa carrega automaticamente com todas as cidades de Minas Gerais
3. As regionais de saúde aparecem como marcadores amarelos com "R"

### Interação com Regionais
1. **Clique em uma regional** (marcador amarelo)
2. Um círculo azul aparece mostrando a área de abrangência
3. As cidades próximas são destacadas automaticamente
4. O painel lateral mostra informações detalhadas

### Informações Disponíveis
- **Nome da Regional**: Identificação da regional de saúde
- **Cidade Base**: Cidade principal da regional
- **Cidades Próximas**: Lista de cidades dentro do raio de cobertura
- **População**: Dados demográficos das cidades
- **Distância**: Cálculo automático de distâncias

## 📊 Dados Incluídos

### Regionais
- **Belo Horizonte** - Regional Metropolitana
- **Montes Claros** - Regional Norte
- **Governador Valadares** - Regional Vale do Rio Doce
- **Juiz de Fora** - Regional Zona da Mata
- **Uberlândia** - Regional Triângulo Norte
- **Uberaba** - Regional Triângulo Sul
- **Divinópolis** - Regional Centro

### Cidades (73+)
- Todas as principais cidades de Minas Gerais
- Coordenadas geográficas precisas
- Dados de população atualizados
- Informações de microrregião e mesorregião

## 🔧 Configuração

### Variáveis de Ambiente
```bash
# Não são necessárias variáveis de ambiente para execução local
# As APIs utilizadas são públicas e não requerem autenticação
```

### Personalização
- **Raio de Cobertura**: Ajuste em `src/Components/MapaComRegionais.jsx`
- **Estilos**: Modifique `src/Components/MapaComRegionais.css`
- **Dados**: Atualize `src/data/regionais.js`

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm run build
# Conecte seu repositório ao Vercel
```

### Netlify
```bash
npm run build
# Faça upload da pasta dist/
```

### GitHub Pages
```bash
npm run build
# Configure GitHub Actions para deploy automático
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

**Desenvolvido com ❤️ para a saúde pública de Minas Gerais**
