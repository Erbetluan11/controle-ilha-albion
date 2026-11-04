# Controle da Ilha — Albion Online

Site em Flask para controlar plantações da ilha no Albion Online.

## Funcionalidades

- Cadastro de plantios e custo das sementes
- Registro de colheita e valor vendido
- Cálculo automático de lucro ou prejuízo
- Consulta de preços pela API do Albion Online Data Project
- Comparação de lucro estimado por planta e cidade
- Gráficos de lucro por dia e por planta
- Histórico salvo em SQLite

## Instalação

```bash
pip install -r requirements.txt
python app.py
```

Abra no navegador:

```text
http://127.0.0.1:5000
```

## API utilizada

O projeto consulta a API pública do [Albion Online Data Project](https://www.albion-online-data.com/) para obter preços de mercado.
