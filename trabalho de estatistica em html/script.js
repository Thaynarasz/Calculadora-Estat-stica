let calculationType = '';
const resultsDiv = document.getElementById('results');

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add-row-btn').addEventListener('click', addRow);
    document.getElementById('calculate-btn').addEventListener('click', calculate);
    addRow(); // Adiciona a primeira linha de dados ao carregar
    
    // Adiciona o listener de 'paste' para a tabela
    document.querySelector('#data-table tbody').addEventListener('paste', handlePaste);
});

function showCalculator(type) {
    calculationType = type;
    document.getElementById('initial-choice').classList.add('hidden');
    document.getElementById('calculator-main').classList.remove('hidden');
    
    const title = type === 'discreto' ? 'Cálculo Discreto' : 'Cálculo em Classe';
    document.getElementById('calc-title').textContent = title;
}

function addRow() {
    const tableBody = document.querySelector('#data-table tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="number" class="fi-input"></td>
        <td><input type="number" class="xi-input"></td>
    `;
    tableBody.appendChild(newRow);
}

function handlePaste(event) {
    event.preventDefault(); // Previne o comportamento padrão de colar
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('text');
    const rows = pastedData.split(/\r?\n/).filter(row => row.trim() !== '');

    const tableBody = document.querySelector('#data-table tbody');
    const existingRows = tableBody.querySelectorAll('tr');

    rows.forEach((row, rowIndex) => {
        const columns = row.split(/\s+|\t|,/); // Divide por espaço, tab ou vírgula
        if (columns.length < 2) return;

        let fi = columns[0].trim();
        let xi = columns[1].trim();

        if (rowIndex < existingRows.length) {
            // Se já existir uma linha, preenche os inputs
            const inputs = existingRows[rowIndex].querySelectorAll('input');
            if (inputs.length >= 2) {
                inputs[0].value = fi;
                inputs[1].value = xi;
            }
        } else {
            // Se não, adiciona uma nova linha e preenche
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="number" class="fi-input" value="${fi}"></td>
                <td><input type="number" class="xi-input" value="${xi}"></td>
            `;
            tableBody.appendChild(newRow);
        }
    });
}

function calculate() {
    const fiInputs = Array.from(document.querySelectorAll('.fi-input'));
    const xiInputs = Array.from(document.querySelectorAll('.xi-input'));
    resultsDiv.innerHTML = '';

    const data = [];
    let isValid = true;
    for (let i = 0; i < fiInputs.length; i++) {
        const fi = parseInt(fiInputs[i].value);
        const xi = parseFloat(xiInputs[i].value);

        if (isNaN(xi) || isNaN(fi) || fi < 0) {
            isValid = false;
            break;
        }
        data.push({ fi, xi });
    }

    if (!isValid) {
        resultsDiv.innerHTML = '<p style="color: red;">Por favor, preencha todos os campos com números válidos e frequências não negativas.</p>';
        return;
    }

    const selectedOptions = Array.from(document.querySelectorAll('input[name="calc-option"]:checked')).map(cb => cb.value);

    if (selectedOptions.length === 0) {
        resultsDiv.innerHTML = '<p style="color: red;">Selecione pelo menos uma opção de cálculo.</p>';
        return;
    }

    const sumFi = data.reduce((sum, item) => sum + item.fi, 0);
    const sumXiFi = data.reduce((sum, item) => sum + (item.xi * item.fi), 0);
    const mean = sumXiFi / sumFi;

    const calculationResults = {};

    if (selectedOptions.includes('mean')) {
        calculationResults.mean = mean;
    }

    if (selectedOptions.includes('mode')) {
        const sortedByFi = data.sort((a, b) => b.fi - a.fi);
        const maxFi = sortedByFi[0].fi;
        const modes = sortedByFi.filter(item => item.fi === maxFi).map(item => item.xi);
        calculationResults.mode = modes.join(', ');
    }
    
    if (selectedOptions.includes('median')) {
        const medianPosition = sumFi / 2;
        let cumulativeFi = 0;
        let medianValue = 0;
        
        const sortedData = [...data].sort((a, b) => a.xi - b.xi);
        for(const item of sortedData) {
            cumulativeFi += item.fi;
            if (cumulativeFi >= medianPosition) {
                medianValue = item.xi;
                break;
            }
        }
        calculationResults.median = medianValue;
    }

    if (selectedOptions.includes('variance') || selectedOptions.includes('stdDev')) {
        const squaredDifferences = data.map(item => item.fi * Math.pow(item.xi - mean, 2));
        const sumOfSquaredDifferences = squaredDifferences.reduce((sum, current) => sum + current, 0);
        const variance = sumOfSquaredDifferences / (sumFi - 1);
        
        if (selectedOptions.includes('variance')) {
            calculationResults.variance = variance;
        }
        if (selectedOptions.includes('stdDev')) {
            calculationResults.stdDev = Math.sqrt(variance);
        }
    }

    // Exibir os resultados na mesma tela
    resultsDiv.innerHTML += '<p style="font-weight: bold; margin-bottom: 10px;">Cálculos selecionados:</p>';
    for (const key in calculationResults) {
        const title = {
            'mean': 'Média',
            'mode': 'Moda',
            'median': 'Mediana',
            'stdDev': 'Desvio Padrão',
            'variance': 'Variância'
        }[key];
        const value = key === 'mode' ? calculationResults[key] : calculationResults[key].toFixed(2);
        resultsDiv.innerHTML += `<p><strong>${title}:</strong> ${value}</p>`;
    }
}