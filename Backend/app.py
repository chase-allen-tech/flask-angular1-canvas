from flask import Flask, json, render_template, request, jsonify
from flask_cors import CORS
import sqlite3 as sql
import json

app = Flask(__name__)
CORS(app)

DB_NAME = 'appdb.sqlite'

# Execute query in DB
def execQuery(query):
    con = sql.connect(DB_NAME)
    cur = con.cursor()
    results = cur.execute(query).fetchall()
    con.commit()
    con.close()
    return results

@app.route("/")
def get(): # Get all vector data from DB
    try:
        query = "SELECT * FROM vectors";
        results = execQuery(query)
    except Exception as e:
        print(e)
    return jsonify({'data': json.dumps(results)})

@app.route("/", methods=['POST'])
def post(): # Insert new vector data to DB
    try:
        data = json.loads(request.json['data'])
        query = "INSERT INTO vectors (header, sym1, sym2, x1, y1, x2, y2) VALUES ('%s', '%s', '%s', %d, %d, %d, %d);" % (data['header'], data['sym1'], data['sym2'], data['x1'], data['y1'], data['x2'], data['y2'])
        execQuery(query)
        msg = "Record successfully added"

    except Exception as e:
        msg = "error in insert operation"
        
    return jsonify({'msg': msg})

@app.route("/", methods=["PUT"])
def put():
    try:
        data = json.loads(request.json['data'])
        query = "UPDATE vectors SET x1=%d, y1=%d, x2=%d, y2=%d WHERE sym1='%s' AND sym2='%s'" % (data['x1'], data['y1'], data['x2'], data['y2'], data['sym1'], data['sym2'])
        execQuery(query)
        msg = 'Record successfully updated'
    except Exception as e:
        msg = "error in update opration"
    return jsonify({'msg': msg})

@app.route("/<string:sym1>/<string:sym2>", methods=['DELETE'])
def delete(sym1, sym2): # Delete the current object with sym1 and sym2 identifier
    try:
        if sym2 == 'null':
            query = "DELETE FROM vectors WHERE sym1 = '%s' OR sym2 = '%s'" % (sym1, sym1)
        else:
            query = "DELETE FROM vectors WHERE sym1 = '%s' AND sym2 = '%s'" % (sym1, sym2)
        execQuery(query)
        msg = "Record successfully added"

    except Exception as e:
        msg = "error in delete operation"
        
    return jsonify({'msg': msg})

@app.route("/create")
def create(): # Create a new DB table
    try:
        query = "create table vectors(id integer primary key AUTOINCREMENT, header text not null, sym1 text, sym2 text, x1 integer, y1 integer, x2 integer, y2 integer);"
        execQuery(query)
    except Exception as e:
        print(e)
    return jsonify({'msg': "OK"})
    
if __name__ == "__main__":
     app.run()

