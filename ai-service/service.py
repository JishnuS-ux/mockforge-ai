"""
MockForge AI – Python Generation Microservice
Handles high-scale (100k+ rows) synthetic data generation using Pandas + Faker.
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from faker import Faker
import pandas as pd
import numpy as np
import json
import os
import uuid
import zipfile
from io import BytesIO

app = Flask(__name__)
CORS(app)
fake = Faker('en_IN')

EXPORTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'exports')
os.makedirs(EXPORTS_DIR, exist_ok=True)

# ─── Field value generators ────────────────────────────────────────────────────
def generate_field_value(field: dict, parent_pools: dict) -> object:
    field_type = field.get('type', 'Text')
    constraints = field.get('constraints', {})
    name = field.get('name', '').lower()

    # FK reference
    if field.get('isForeignKey') and field.get('referencesTable') and field.get('referencesField'):
        pool = parent_pools.get(field['referencesTable'], [])
        if pool:
            import random
            selected_row = random.choice(pool)
            return selected_row.get(field['referencesField'])

    # Enum options
    options = constraints.get('options', [])
    if options:
        return np.random.choice(options)

    if field_type == 'UUID':
        return str(uuid.uuid4())
    elif field_type == 'Name':
        return fake.name()
    elif field_type == 'Email':
        return fake.email().lower()
    elif field_type == 'Phone':
        return fake.phone_number()
    elif field_type == 'Address':
        return fake.address().replace('\n', ', ')
    elif field_type == 'Boolean':
        return bool(np.random.choice([True, False]))
    elif field_type == 'Date':
        return fake.date_this_decade().isoformat()
    elif field_type == 'DateTime':
        return fake.date_time_this_decade().isoformat()
    elif field_type == 'Number':
        lo = constraints.get('min', 0)
        hi = constraints.get('max', 1000)
        return int(np.random.randint(lo, hi + 1))
    elif field_type == 'Decimal':
        lo = float(constraints.get('min', 0))
        hi = float(constraints.get('max', 10000))
        return round(float(np.random.uniform(lo, hi)), 2)
    else:
        # Text – heuristic-based
        if 'description' in name or 'notes' in name or 'comment' in name:
            return fake.sentence()
        if 'city' in name:
            return fake.city()
        if 'country' in name:
            return fake.country()
        if 'company' in name:
            return fake.company()
        if 'url' in name or 'link' in name:
            return fake.url()
        return fake.word()


def topological_sort(tables: list) -> list:
    table_map = {t['id']: t for t in tables}
    visited = set()
    result = []

    def visit(tid):
        if tid in visited:
            return
        visited.add(tid)
        table = table_map.get(tid)
        if not table:
            return
        for f in table.get('fields', []):
            if f.get('isForeignKey') and f.get('referencesTable'):
                visit(f['referencesTable'])
        result.append(table)

    for t in tables:
        visit(t['id'])
    return result


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'MockForge Python Generator'})


@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    tables = data.get('tables', [])
    job_id = data.get('jobId', str(uuid.uuid4()))

    sorted_tables = topological_sort(tables)
    generated = {}        # table_id -> list of dicts
    pk_pools = {}         # table_id -> list of pk values

    for table in sorted_tables:
        t_id = table['id']
        t_name = table['name']
        rows_count = table.get('rowsCount', 100)
        fields = table.get('fields', [])

        pk_field = next((f for f in fields if f.get('isPrimaryKey')), None)

        rows = []
        pks = []
        for _ in range(rows_count):
            row = {}
            for field in fields:
                row[field['name']] = generate_field_value(field, generated)
            rows.append(row)
            if pk_field:
                pks.append(row[pk_field['name']])

        generated[t_id] = rows
        if pks:
            pk_pools[t_id] = pks

    # Build output zip
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for table in sorted_tables:
            t_id = table['id']
            t_name = table['name']
            rows = generated.get(t_id, [])
            df = pd.DataFrame(rows)

            # CSV
            zf.writestr(f'{t_name}.csv', df.to_csv(index=False))
            # JSON
            zf.writestr(f'{t_name}.json', df.to_json(orient='records', indent=2))
            # SQL
            sql_lines = []
            cols = list(df.columns)
            for _, row in df.iterrows():
                vals = ', '.join(
                    'NULL' if pd.isna(v) else
                    str(int(v)) if isinstance(v, (int, np.integer)) else
                    str(float(v)) if isinstance(v, (float, np.floating)) else
                    f"'{str(v).replace(chr(39), chr(39)*2)}'"
                    for v in row
                )
                sql_lines.append(f"INSERT INTO `{t_name}` ({', '.join(f'`{c}`' for c in cols)}) VALUES ({vals});")
            zf.writestr(f'{t_name}.sql', '\n'.join(sql_lines))

    zip_buffer.seek(0)
    zip_path = os.path.join(EXPORTS_DIR, f'{job_id}.zip')
    with open(zip_path, 'wb') as f:
        f.write(zip_buffer.read())

    return jsonify({
        'jobId': job_id,
        'status': 'completed',
        'tablesGenerated': len(sorted_tables),
        'totalRows': sum(t.get('rowsCount', 0) for t in tables),
        'downloadPath': f'/exports/{job_id}.zip',
    })


@app.route('/preview', methods=['POST'])
def preview():
    """Return first 10 rows per table for quick preview."""
    data = request.get_json()
    tables = data.get('tables', [])
    sorted_tables = topological_sort(tables)
    generated = {}
    preview = {}

    for table in sorted_tables:
        t_id = table['id']
        t_name = table['name']
        fields = table.get('fields', [])
        rows = [
            {f['name']: generate_field_value(f, generated) for f in fields}
            for _ in range(min(10, table.get('rowsCount', 10)))
        ]
        generated[t_id] = rows
        preview[t_name] = rows

    return jsonify({'preview': preview})


if __name__ == '__main__':
    port = int(os.environ.get('PORT') or os.environ.get('PYTHON_SERVICE_PORT', 5001))
    print(f'🐍 MockForge Python Service running on http://localhost:{port}')
    app.run(host='0.0.0.0', port=port, debug=False)
