from flask import Flask, render_template, request, jsonify
import math
from collections import Counter

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calcular-discreto', methods=['POST'])
def calcular_discreto_api():
    dados_front = request.get_json()
    dados_calculo = dados_front.get('dados')
    opcoes = dados_front.get('opcoes')
    unidade = dados_front.get('unidade', '')

    if not dados_calculo:
        return jsonify({'erro': 'Dados inválidos'}), 400

    # Recria a lista de dados brutos a partir dos valores e frequências
    dados = []
    for item in dados_calculo:
        # Usamos .get() com um valor padrão para evitar erros se a chave não existir
        valor = item.get('valor')
        fi = item.get('fi', 0)
        if valor is not None:
            dados.extend([valor] * fi)
    
    if not dados:
        return jsonify({'info': 'Nenhum dado válido para calcular.'})

    total_fi = len(dados)
    resultados = {}
    media = sum(dados) / total_fi if total_fi > 0 else 0

    if opcoes.get('media'):
        resultados['media'] = f"Média: {media:.2f} {unidade}"

    if opcoes.get('mediana'):
        sorted_dados = sorted(dados)
        mid = total_fi // 2
        if total_fi % 2 == 0:
            mediana = (sorted_dados[mid - 1] + sorted_dados[mid]) / 2
        else:
            mediana = sorted_dados[mid]
        resultados['mediana'] = f"Mediana: {mediana:.2f} {unidade}"
    
    if opcoes.get('moda'):
        if total_fi > 0:
            counts = Counter(dados)
            max_freq = max(counts.values())
            # A moda só existe se algum valor se repete
            if max_freq > 1 and len(counts) < total_fi:
                moda_list = [key for key, value in counts.items() if value == max_freq]
                # Converte para string para o join funcionar com números
                moda_str = ', '.join(map(str, sorted(moda_list)))
                resultados['moda'] = f"Moda: {moda_str} {unidade}"
            else:
                 resultados['moda'] = "Moda: Amodal (sem valor mais frequente)"
        else:
            resultados['moda'] = "Moda: (sem dados)"

    # --- BLOCO CORRIGIDO ---
    # CORREÇÃO: A chave é 'desvio', como vem do Javascript
    if opcoes.get('variancia') or opcoes.get('desvio') or opcoes.get('cv'):
        # CÁLCULO CORRETO: Usando n-1 no denominador para variância de amostra, que é o mais comum.
        if total_fi > 1:
            variancia = sum((x - media) ** 2 for x in dados) / (total_fi - 1)
        else:
            variancia = 0
            
        if opcoes.get('variancia'):
            resultados['variancia'] = f"Variância: {variancia:.2f} {unidade}²"
        
        desvio = math.sqrt(variancia)
        if opcoes.get('desvio'):
            resultados['desvio'] = f"Desvio Padrão: {desvio:.2f} {unidade}"
        
        if opcoes.get('cv'):
            cv = (desvio / abs(media)) * 100 if media != 0 else 0
            resultados['cv'] = f"Coeficiente de Variação: {cv:.2f}%"
    
    return jsonify(resultados)


@app.route('/calcular-classes', methods=['POST'])
def calcular_classes_api():
    dados_front = request.get_json()
    dados_calculo = dados_front.get('dados')
    opcoes = dados_front.get('opcoes')
    unidade = dados_front.get('unidade', '')

    if not dados_calculo:
        return jsonify({'erro': 'Dados inválidos'}), 400

    lim_infs = [item['limInf'] for item in dados_calculo]
    lim_sups = [item['limSup'] for item in dados_calculo]
    freqs = [item['fi'] for item in dados_calculo]
    
    midpoints = [(li + ls) / 2 for li, ls in zip(lim_infs, lim_sups)]
    total_freq = sum(freqs)
    
    if total_freq == 0:
        return jsonify({'info': 'Nenhum dado válido para calcular.'})

    resultados = {}
    media = sum(pmi * fi for pmi, fi in zip(midpoints, freqs)) / total_freq

    if opcoes.get('media'):
        resultados['media'] = f"Média: {media:.2f} {unidade}"

    # --- BLOCO CORRIGIDO ---
    if opcoes.get('variancia') or opcoes.get('desvio') or opcoes.get('cv'):
        # Para dados agrupados, usamos a variância populacional (n no denominador)
        variancia = sum(fi * (pmi - media) ** 2 for pmi, fi in zip(midpoints, freqs)) / total_freq
            
        if opcoes.get('variancia'):
            resultados['variancia'] = f"Variância: {variancia:.2f} {unidade}²"
        
        desvio = math.sqrt(variancia)
        if opcoes.get('desvio'):
            # CORREÇÃO: A chave é 'desvio'
            resultados['desvio'] = f"Desvio Padrão: {desvio:.2f} {unidade}"
        
        if opcoes.get('cv'):
            cv = (desvio / abs(media)) * 100 if media != 0 else 0
            resultados['cv'] = f"Coeficiente de Variação: {cv:.2f}%"

    if opcoes.get('moda_bruta'):
        max_freq = max(freqs)
        modal_classes = [f"{lim_infs[i]}-{lim_sups[i]}" for i, fi in enumerate(freqs) if fi == max_freq]
        resultados['moda_bruta'] = f"Moda Bruta: {', '.join(modal_classes)}"

    if opcoes.get('moda_czuber'):
        max_freq = max(freqs)
        idx_list = [i for i, f in enumerate(freqs) if f == max_freq]
        
        # Só calcula se for unimodal e não for a primeira nem a última classe
        if len(idx_list) == 1 and 0 < idx_list[0] < len(freqs) - 1:
            idx = idx_list[0]
            L = lim_infs[idx]
            h = lim_sups[idx] - lim_infs[idx]
            f_ant = freqs[idx - 1]
            f_post = freqs[idx + 1]
            f_mod = freqs[idx]
            denominador = (f_mod - f_ant) + (f_mod - f_post)
            if denominador != 0:
                moda_czuber = L + ((f_mod - f_ant) / denominador) * h
                resultados['moda_czuber'] = f"Moda de Czuber: {moda_czuber:.2f} {unidade}"
            else:
                resultados['moda_czuber'] = "Moda de Czuber: Não aplicável (divisão por zero)"
        else:
            resultados['moda_czuber'] = "Moda de Czuber: Não aplicável (bimodal/amodal ou nos extremos)"

    return jsonify(resultados)

if __name__ == '__main__':
    app.run(debug=True)