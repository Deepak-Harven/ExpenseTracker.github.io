from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
import csv
from datetime import datetime

app = Flask(__name__)
# Enable CORS so our frontend (running on port 8000 or directly from file) can communicate with this API
CORS(app) 

DB_NAME = 'expenses.db'

# Database Initialization
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Create the transactions table if it doesn't exist
    c.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            amount REAL NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# Run initialization when the script starts
init_db()

# --- API ENDPOINTS ---

# 1. GET ALL TRANSACTIONS
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('SELECT id, text, amount FROM transactions')
    rows = c.fetchall()
    conn.close()
    
    # Format the rows into a list of dictionaries
    transactions = []
    for row in rows:
        transactions.append({
            'id': row[0],
            'text': row[1],
            'amount': row[2]
        })
    
    return jsonify(transactions)

# 2. ADD A NEW TRANSACTION
@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.get_json()
    
    # Validate the incoming data
    if not data or not 'text' in data or not 'amount' in data:
        return jsonify({'error': 'Please provide text and amount'}), 400
        
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Insert the new data into the database
    c.execute('INSERT INTO transactions (text, amount) VALUES (?, ?)', (data['text'], data['amount']))
    conn.commit()
    # Get the ID of the newly created transaction
    new_id = c.lastrowid
    conn.close()
    
    # Return the created object back to the frontend
    return jsonify({
        'id': new_id,
        'text': data['text'],
        'amount': data['amount']
    }), 201

# 3. DELETE A TRANSACTION
@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Delete the transaction with the matching ID
    c.execute('DELETE FROM transactions WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

# --- REPORTS ENDPOINTS (CSV) ---
CSV_FILE = 'reports.csv'

@app.route('/api/reports', methods=['GET'])
def get_reports():
    reports = []
    if os.path.exists(CSV_FILE):
        with open(CSV_FILE, mode='r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Convert strings back to numbers for the frontend
                row['income'] = float(row['income'])
                row['expense'] = float(row['expense'])
                row['balance'] = float(row['balance'])
                reports.append(row)
    return jsonify(reports)

@app.route('/api/reports', methods=['POST'])
def add_report():
    data = request.get_json()
    if not data or not 'name' in data or not 'type' in data:
        return jsonify({'error': 'Please provide a name and type'}), 400
        
    file_exists = os.path.exists(CSV_FILE)
    
    report = {
        'id': str(int(datetime.now().timestamp())),
        'name': data['name'],
        'type': data['type'],
        'income': data.get('income', 0),
        'expense': data.get('expense', 0),
        'balance': data.get('balance', 0),
        'descriptions': data.get('descriptions', '')
    }
    
    with open(CSV_FILE, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'name', 'type', 'income', 'expense', 'balance', 'descriptions'])
        if not file_exists:
            writer.writeheader()  # Write the column names if it's a new file
        writer.writerow(report)
        
    return jsonify(report), 201

@app.route('/api/reports/<id>', methods=['DELETE'])
def delete_report(id):
    if not os.path.exists(CSV_FILE):
        return jsonify({'error': 'No reports found'}), 404
        
    updated_reports = []
    deleted = False
    
    with open(CSV_FILE, mode='r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['id'] != id:
                updated_reports.append(row)
            else:
                deleted = True
                
    if deleted:
        with open(CSV_FILE, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['id', 'name', 'type', 'income', 'expense', 'balance', 'descriptions'])
            writer.writeheader()
            writer.writerows(updated_reports)
            
    return jsonify({'success': deleted})

if __name__ == '__main__':
    # Run the server on port 5000
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, port=5000)
