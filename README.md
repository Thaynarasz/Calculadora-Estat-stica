# Calculadora Estatística

Pequena aplicação Flask para calcular medidas estatísticas (média, mediana, moda, variância, desvio padrão, coeficiente de variação) para dados discretos e agrupados em classes.

Arquivos principais:
- `app.py` - servidor Flask com endpoints `/calcular-discreto` e `/calcular-classes`.
- `templates/index.html` - interface web com formulário e tabelas para entrada de dados.
- `static/script.js` - lógica cliente (manipulação da tabela, cálculo de frequência e envio via fetch para o backend).

Como rodar localmente:

1. Crie um ambiente virtual (recomendado):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Instale dependências:

```powershell
pip install -r requirements.txt
```

3. Execute a aplicação:

```powershell
python app.py
```

4. Abra o navegador em `http://127.0.0.1:5000`.

Notas sobre alterações recentes:
- Adicionada `autoCalculateFi()` em `static/script.js` para atualizar automaticamente as frequências (Fi) quando valores discretos são editados.
- `removeRow(button, type)` foi tornado mais robusto para atualizar Fac/Pos depois da remoção.
- Correções nas linhas criadas dinamicamente para garantir que o botão "Remover" passe o tipo corretamente (`discreto` ou `classes`).

Se quiser, posso ajudar a adicionar este projeto ao seu repositório GitHub — veja as instruções abaixo.

Como enviar para o GitHub (passos locais):

1. Se ainda não, instale o Git no Windows: https://git-scm.com/download/win
2. No terminal (PowerShell), inicialize o repositório, adicione e comite:

```powershell
cd "c:\Users\Thayn\OneDrive\Área de Trabalho\CALCULADORA ESTATISTICA"
git init
git add .
git commit -m "Initial commit - Calculadora Estatística"
```

3. Crie um repositório no GitHub (pelo site) e copie o remote URL (HTTPS ou SSH). Em seguida conecte e faça push:

```powershell
# Exemplo HTTPS
git remote add origin https://github.com/SEU_USUARIO/NOME_REPO.git
git branch -M main
git push -u origin main
```

Se preferir, me diga o nome do repositório e o seu usuário GitHub e eu gero os comandos exatos para você.
