from flask import Flask, render_template, request, redirect, url_for, jsonify
import sqlite3
from datetime import datetime
from collections import defaultdict
import requests

app = Flask(__name__)
DB = "ilha.db"

CIDADES = [
    "Thetford", "Fort Sterling", "Lymhurst", "Bridgewatch",
    "Martlock", "Caerleon", "Brecilien", "Black Market"
]

PLANTAS = [
    {"seed": "T1_FARM_CARROT_SEED", "crop": "T1_CARROT", "nome": "Cenoura", "rendimento": 18},
    {"seed": "T2_FARM_BEAN_SEED", "crop": "T2_BEANS", "nome": "Feijão", "rendimento": 12},
    {"seed": "T3_FARM_WHEAT_SEED", "crop": "T3_WHEAT", "nome": "Trigo", "rendimento": 9},
    {"seed": "T4_FARM_TURNIP_SEED", "crop": "T4_TURNIP", "nome": "Nabo", "rendimento": 9},
    {"seed": "T4_FARM_BURDOCK_SEED", "crop": "T4_BURDOCK", "nome": "Bardana", "rendimento": 9},
    {"seed": "T5_FARM_CABBAGE_SEED", "crop": "T5_CABBAGE", "nome": "Repolho", "rendimento": 9},
    {"seed": "T5_FARM_TEASEL_SEED", "crop": "T5_TEASEL", "nome": "Cardo-dragão", "rendimento": 9},
    {"seed": "T6_FARM_POTATO_SEED", "crop": "T6_POTATO", "nome": "Batata", "rendimento": 9},
]


def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con


def criar_tabelas():
    with db() as con:
        con.execute("""
        CREATE TABLE IF NOT EXISTS plantios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            semente TEXT,
            nome TEXT,
            quantidade INTEGER,
            custo_total REAL,
            cidade TEXT,
            data TEXT,
            colhido INTEGER DEFAULT 0,
            vendido REAL DEFAULT 0,
            finalizado INTEGER DEFAULT 0
        )
        """)


def preco_api(item_id, cidade):
    url = f"https://west.albion-online-data.com/api/v2/stats/prices/{item_id}"
    try:
        r = requests.get(url, params={"locations": cidade}, timeout=10)
        r.raise_for_status()
        dados = r.json()
        for d in dados:
            if d.get("city") == cidade:
                return {
                    "venda": d.get("sell_price_min") or 0,
                    "compra": d.get("buy_price_max") or 0
                }
    except Exception:
        pass
    return {"venda": 0, "compra": 0}


@app.route("/")
def index():
    with db() as con:
        plantios = con.execute(
            "SELECT * FROM plantios ORDER BY id DESC"
        ).fetchall()

        lucro_total = con.execute(
            "SELECT COALESCE(SUM(vendido - custo_total), 0) FROM plantios WHERE finalizado = 1"
        ).fetchone()[0]

        investido = con.execute(
            "SELECT COALESCE(SUM(custo_total), 0) FROM plantios"
        ).fetchone()[0]

        recebido = con.execute(
            "SELECT COALESCE(SUM(vendido), 0) FROM plantios"
        ).fetchone()[0]

    return render_template(
        "index.html",
        plantios=plantios,
        lucro_total=lucro_total,
        investido=investido,
        recebido=recebido
    )


@app.route("/novo", methods=["GET", "POST"])
def novo():
    if request.method == "POST":
        semente = request.form["semente"]
        nome = request.form["nome"]
        quantidade = int(request.form["quantidade"])
        custo_unitario = float(request.form["custo_unitario"])
        cidade = request.form["cidade"]

        with db() as con:
            con.execute(
                """INSERT INTO plantios
                (semente, nome, quantidade, custo_total, cidade, data)
                VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    semente, nome, quantidade,
                    quantidade * custo_unitario, cidade,
                    datetime.now().strftime("%d/%m/%Y %H:%M")
                )
            )
        return redirect(url_for("index"))

    return render_template("plantio_novo.html", plantas=PLANTAS, cidades=CIDADES)


@app.route("/colher/<int:id>", methods=["GET", "POST"])
def colher(id):
    with db() as con:
        plantio = con.execute(
            "SELECT * FROM plantios WHERE id = ?", (id,)
        ).fetchone()

    if request.method == "POST":
        colhido = int(request.form["colhido"])
        preco_unitario = float(request.form["preco_unitario"])

        with db() as con:
            con.execute(
                """UPDATE plantios
                SET colhido = ?, vendido = ?, finalizado = 1
                WHERE id = ?""",
                (colhido, colhido * preco_unitario, id)
            )
        return redirect(url_for("index"))

    return render_template("colheita.html", plantio=plantio)


@app.route("/excluir/<int:id>")
def excluir(id):
    with db() as con:
        con.execute("DELETE FROM plantios WHERE id = ?", (id,))
    return redirect(url_for("index"))


@app.route("/precos")
def precos():
    cidade = request.args.get("cidade", "Fort Sterling")
    resultados = []

    for p in PLANTAS:
        semente = preco_api(p["seed"], cidade)
        recurso = preco_api(p["crop"], cidade)

        custo = semente["venda"]
        receita = recurso["venda"] * p["rendimento"]
        lucro = receita - custo

        resultados.append({
            "nome": p["nome"],
            "semente": semente["venda"],
            "recurso": recurso["venda"],
            "rendimento": p["rendimento"],
            "receita": receita,
            "lucro": lucro
        })

    resultados.sort(key=lambda x: x["lucro"], reverse=True)

    return render_template(
        "precos.html",
        resultados=resultados,
        cidade=cidade,
        cidades=CIDADES
    )


@app.route("/api/graficos")
def api_graficos():
    with db() as con:
        plantios = con.execute(
            "SELECT nome, data, custo_total, vendido, finalizado FROM plantios"
        ).fetchall()

    lucro_por_dia = defaultdict(float)
    lucro_por_planta = defaultdict(float)
    custo_por_planta = defaultdict(float)
    receita_por_planta = defaultdict(float)

    for p in plantios:
        data = (p["data"] or "").split(" ")[0]
        lucro = (p["vendido"] or 0) - (p["custo_total"] or 0)

        if p["finalizado"]:
            lucro_por_dia[data] += lucro

        lucro_por_planta[p["nome"]] += lucro
        custo_por_planta[p["nome"]] += p["custo_total"] or 0
        receita_por_planta[p["nome"]] += p["vendido"] or 0

    dias = sorted(lucro_por_dia.keys())

    return jsonify({
        "dias": dias,
        "lucro_por_dia": [lucro_por_dia[d] for d in dias],
        "plantas": list(lucro_por_planta.keys()),
        "lucro_por_planta": list(lucro_por_planta.values()),
        "custo_por_planta": list(custo_por_planta.values()),
        "receita_por_planta": list(receita_por_planta.values())
    })


if __name__ == "__main__":
    criar_tabelas()
    app.run(debug=True)
