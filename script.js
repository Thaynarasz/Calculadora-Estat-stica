// Funções de um script antigo, movidas para cá para manter tudo organizado.
var gk_isXlsx = false;
var gk_xlsxFileLookup = {};
var gk_fileData = {};
function filledCell(cell) {
    return cell !== '' && cell != null;
}
function loadFileData(filename) {
    if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
        try {
            var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
            var firstSheetName = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[firstSheetName];
            var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
            var filteredData = jsonData.filter(row => row.some(filledCell));
            var headerRowIndex = filteredData.findIndex((row, index) =>
                row.filter(filledCell).length >= filteredData[index + 1]?.filter(filledCell).length
            );
            if (headerRowIndex === -1 || headerRowIndex > 25) {
                headerRowIndex = 0;
            }
            var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex));
            csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
            return csv;
        } catch (e) {
            console.error(e);
            return "";
        }
    }
    return gk_fileData[filename] || "";
}

// --- LÓGICA DA CALCULADORA ---

function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(tab).classList.add('active');
    document.querySelector(`button[onclick="showTab('${tab}')"]`).classList.add('active');
}

function addRowDiscreto() {
    const tbody = document.getElementById('table-discreto').getElementsByTagName('tbody')[0];
    const row = tbody.insertRow();
    row.innerHTML = `
        <td><input type="number" class="value-discreto"></td>
        <td><input type="number" class="fi-discreto" value="1" oninput="updateFacPos('discreto')"></td>
        <td><span class="fac-pos"></span></td>
        <td><span class="fac-pos"></span></td>
        <td><button onclick="removeRow(this, 'discreto')">Remover</button></td>
    `;
}

function addRowClasses() {
    const tbody = document.getElementById('table-classes').getElementsByTagName('tbody')[0];
    const row = tbody.insertRow();
    row.innerHTML = `
        <td><input type="number" class="liminf-classes" oninput="autoFillClasses()"></td>
        <td><input type="number" class="limsup-classes" oninput="autoFillClasses()"></td>
        <td><input type="number" class="fi-classes" oninput="updateFacPos('classes')"></td>
        <td><span class="fac-pos"></span></td>
        <td><span class="fac-pos"></span></td>
        <td><button onclick="removeRow(this, 'classes')">Remover</button></td>
    `;
}

function removeRow(button, type) {
    // Remove a linha e atualiza fac/pos da tabela correta
    const row = button.parentNode.parentNode;
    const tbody = row.parentNode;
    tbody.removeChild(row);

    // Se o tipo não foi informado, tente detectar pela tabela pai
    if (!type) {
        const table = button.closest('table');
        if (table && table.id) {
            if (table.id.indexOf('discreto') !== -1) type = 'discreto';
            else if (table.id.indexOf('classes') !== -1) type = 'classes';
        }
    }

    if (type) updateFacPos(type);
}

function clearTable(type) {
    const tbody = document.getElementById(`table-${type}`).getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    if (type === 'discreto') addRowDiscreto();
    if (type === 'classes') addRowClasses();
    // Limpa também o resultado anterior
    document.getElementById(`resultado-${type}`).innerText = '';
}

function roundToTwo(num) {
    // Adiciona Number.EPSILON para lidar com imprecisões de ponto flutuante
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

// --- FUNÇÕES RESTAURADAS ---

function updateFacPos(type) {
    const table = document.getElementById(`table-${type}`).getElementsByTagName('tbody')[0];
    const rows = table.rows;
    let cumulativeFac = 0;

    for (let i = 0; i < rows.length; i++) {
        const fiInput = rows[i].cells[type === 'discreto' ? 1 : 2].querySelector('input');
        const fi = parseInt(fiInput.value) || 0;
        
        cumulativeFac += fi;
        
        rows[i].cells[type === 'discreto' ? 2 : 3].querySelector('span').textContent = cumulativeFac;

        if (type === 'discreto') {
            const startPos = cumulativeFac - fi + 1;
            rows[i].cells[3].querySelector('span').textContent = `${startPos} - ${cumulativeFac}`;
        } else { // classes
            const limInf = parseFloat(rows[i].cells[0].querySelector('input').value) || 0;
            const limSup = parseFloat(rows[i].cells[1].querySelector('input').value) || 0;
            const pmi = (limInf + limSup) / 2;
            rows[i].cells[4].querySelector('span').textContent = roundToTwo(pmi);
        }
    }
}

function autoFillClasses() {
    const rows = document.getElementById('table-classes').getElementsByTagName('tbody')[0].rows;
    if (rows.length < 2) return;

    const firstLimInf = parseFloat(rows[0].cells[0].querySelector('input').value);
    const firstLimSup = parseFloat(rows[0].cells[1].querySelector('input').value);

    if (isNaN(firstLimInf) || isNaN(firstLimSup) || firstLimSup <= firstLimInf) return;
    
    const amplitude = firstLimSup - firstLimInf;

    for (let i = 1; i < rows.length; i++) {
        const prevLimSup = parseFloat(rows[i - 1].cells[1].querySelector('input').value);
        rows[i].cells[0].querySelector('input').value = prevLimSup;
        rows[i].cells[1].querySelector('input').value = prevLimSup + amplitude;
    }
    updateFacPos('classes');
}

function quickInsertDiscreto() {
    const input = document.getElementById('quick-input-discreto').value.trim();
    if (!input) return;

    const values = input.split(/[, ]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    if (values.length === 0) return;
    
    const freqMap = {};
    values.forEach(val => {
        freqMap[val] = (freqMap[val] || 0) + 1;
    });

    const tbody = document.getElementById('table-discreto').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; // Limpa a tabela antes de adicionar as novas linhas

    const uniqueSortedValues = Object.keys(freqMap).map(Number).sort((a, b) => a - b);

    uniqueSortedValues.forEach(value => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><input type="number" class="value-discreto" value="${value}"></td>
            <td><input type="number" class="fi-discreto" value="${freqMap[value]}" oninput="updateFacPos('discreto')"></td>
            <td><span class="fac-pos"></span></td>
            <td><span class="fac-pos"></span></td>
            <td><button onclick="removeRow(this, 'discreto')">Remover</button></td>
        `;
    });

    updateFacPos('discreto');
    document.getElementById('quick-input-discreto').value = '';
}

function quickInsertClasses() {
    const input = document.getElementById('quick-input-classes').value.trim();
    if (!input) return;

    const tbody = document.getElementById('table-classes').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    const parts = input.split(/[, ]+/);

    if (input.includes(':')) {
        parts.forEach(part => {
            const [limInf, limSup] = part.split(':').map(Number);
            if (!isNaN(limInf) && !isNaN(limSup)) {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td><input type="number" class="liminf-classes" value="${limInf}" oninput="autoFillClasses()"></td>
                    <td><input type="number" class="limsup-classes" value="${limSup}" oninput="autoFillClasses()"></td>
                    <td><input type="number" class="fi-classes" oninput="updateFacPos('classes')"></td>
                    <td><span class="fac-pos"></span></td>
                    <td><span class="fac-pos"></span></td>
                    <td><button onclick="removeRow(this, 'classes')">Remover</button></td>
                `;
            }
        });
    } else {
        const values = parts.map(Number).filter(v => !isNaN(v));
        for (let i = 0; i < values.length - 1; i++) {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td><input type="number" class="liminf-classes" value="${values[i]}" oninput="autoFillClasses()"></td>
                <td><input type="number" class="limsup-classes" value="${values[i+1]}" oninput="autoFillClasses()"></td>
                <td><input type="number" class="fi-classes" oninput="updateFacPos('classes')"></td>
                <td><span class="fac-pos"></span></td>
                <td><span class="fac-pos"></span></td>
                <td><button onclick="removeRow(this, 'classes')">Remover</button></td>
            `;
        }
    }
    autoFillClasses();
    document.getElementById('quick-input-classes').value = '';
}

// Atualiza automaticamente os campos Fi na tabela discreta com base nas ocorrências
function autoCalculateFi() {
    const tbody = document.getElementById('table-discreto').getElementsByTagName('tbody')[0];
    const rows = tbody.rows;
    const freq = {};

    // Conta ocorrências pelos valores informados
    for (let i = 0; i < rows.length; i++) {
        const valInput = rows[i].cells[0].querySelector('input');
        const val = parseFloat(valInput.value);
        if (!isNaN(val)) {
            freq[val] = (freq[val] || 0) + 1;
        }
    }

    // Atualiza os campos Fi correspondentes
    for (let i = 0; i < rows.length; i++) {
        const valInput = rows[i].cells[0].querySelector('input');
        const fiInput = rows[i].cells[1].querySelector('input');
        const val = parseFloat(valInput.value);
        if (!isNaN(val)) {
            fiInput.value = freq[val] || 0;
        } else {
            fiInput.value = '';
        }
    }

    updateFacPos('discreto');
}

// --- FUNÇÕES DE CÁLCULO (COMUNICAÇÃO COM PYTHON) ---

async function calcularDiscreto() {
    const resultadoDiv = document.getElementById('resultado-discreto');
    resultadoDiv.innerText = 'Calculando...';

    const unidade = document.getElementById('unidade-discreto').value.trim();
    const rows = document.getElementById('table-discreto').getElementsByTagName('tbody')[0].rows;
    let dadosParaEnviar = [];
    for (let i = 0; i < rows.length; i++) {
        const valor = parseFloat(rows[i].cells[0].querySelector('input').value);
        const fi = parseInt(rows[i].cells[1].querySelector('input').value);
        if (!isNaN(valor) && !isNaN(fi) && fi > 0) {
            dadosParaEnviar.push({ 'valor': valor, 'fi': fi });
        }
    }

    if (dadosParaEnviar.length === 0) {
        resultadoDiv.innerText = 'Por favor, insira dados válidos na tabela.';
        return;
    }

    const opcoes = {
        media: document.getElementById('media-discreto').checked,
        mediana: document.getElementById('mediana-discreto').checked,
        moda: document.getElementById('moda-discreto').checked,
        variancia: document.getElementById('variancia-discreto').checked,
        desvio: document.getElementById('desvio-discreto').checked,
        cv: document.getElementById('cv-discreto').checked
    };

    try {
        const response = await fetch('/calcular-discreto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dados: dadosParaEnviar,
                opcoes: opcoes,
                unidade: unidade
            }),
        });
        const resultados = await response.json();
        
        let resultadoHTML = '';
        const ordem = ['media', 'mediana', 'moda', 'variancia', 'desvio', 'cv'];
        ordem.forEach(key => {
            if (resultados[key]) {
                resultadoHTML += resultados[key] + '\n';
            }
        });
        resultadoDiv.innerText = resultadoHTML || 'Nenhum resultado para exibir.';

    } catch (error) {
        resultadoDiv.innerText = 'Ocorreu um erro ao conectar com o servidor.';
        console.error('Erro:', error);
    }
}

async function calcularClasses() {
    const resultadoDiv = document.getElementById('resultado-classes');
    resultadoDiv.innerText = 'Calculando...';

    const unidade = document.getElementById('unidade-classes').value.trim();
    const rows = document.getElementById('table-classes').getElementsByTagName('tbody')[0].rows;
    let dadosParaEnviar = [];
    for (let i = 0; i < rows.length; i++) {
        const limInf = parseFloat(rows[i].cells[0].querySelector('input').value);
        const limSup = parseFloat(rows[i].cells[1].querySelector('input').value);
        const fi = parseInt(rows[i].cells[2].querySelector('input').value);

        if (!isNaN(limInf) && !isNaN(limSup) && !isNaN(fi) && fi > 0 && limInf < limSup) {
            dadosParaEnviar.push({ 'limInf': limInf, 'limSup': limSup, 'fi': fi });
        }
    }

    if (dadosParaEnviar.length === 0) {
        resultadoDiv.innerText = 'Por favor, insira dados válidos na tabela.';
        return;
    }

    const opcoes = {
        media: document.getElementById('media-classes').checked,
        variancia: document.getElementById('variancia-classes').checked,
        desvio: document.getElementById('desvio-classes').checked,
        cv: document.getElementById('cv-classes').checked,
        moda_bruta: document.getElementById('moda-bruta').checked,
        moda_czuber: document.getElementById('moda-czuber').checked
    };

    try {
        const response = await fetch('/calcular-classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dados: dadosParaEnviar,
                opcoes: opcoes,
                unidade: unidade
            }),
        });

        const resultados = await response.json();

        let resultadoHTML = '';
        const ordem = ['media', 'variancia', 'desvio', 'cv', 'moda_bruta', 'moda_czuber'];
        ordem.forEach(key => {
            if (resultados[key]) {
                resultadoHTML += resultados[key] + '\n';
            }
        });
        resultadoDiv.innerText = resultadoHTML || 'Nenhum resultado para exibir.';

    } catch (error) {
        resultadoDiv.innerText = 'Ocorreu um erro ao conectar com o servidor.';
        console.error('Erro:', error);
    }
}