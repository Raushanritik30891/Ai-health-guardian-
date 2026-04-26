import csv
import sqlite3
import os

# Paths
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
csv_path = os.path.join(base_dir, "datasets", "Disease and symptoms dataset.csv")
db_path = os.path.join(base_dir, "datasets", "symptoms.db")

def process():
    print(f"Reading CSV: {csv_path}")
    if not os.path.exists(csv_path):
        print("Error: CSV not found!")
        return

    # Connect to SQLite
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Drop existing table
    cursor.execute("DROP TABLE IF EXISTS symptom_map")
    
    # Read header
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
    
    # Create table based on header
    # columns[0] is diseases, others are symptoms
    safe_header = [h.replace(" ", "_").replace(".", "_").replace("-", "_") for h in header]
    columns = [f'"{h}" INTEGER' for h in safe_header]
    columns[0] = f'"{safe_header[0]}" TEXT'
    
    create_sql = f"CREATE TABLE symptom_map ({', '.join(columns)})"
    cursor.execute(create_sql)
    
    # Insert data
    print("Inserting data (this might take a minute)...")
    insert_sql = f"INSERT INTO symptom_map VALUES ({', '.join(['?' for _ in header])})"
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader) # skip header
        
        batch = []
        count = 0
        for row in reader:
            if not row: continue
            # Convert binary symptoms to int
            processed_row = [row[0]] + [int(x) if x.strip() else 0 for x in row[1:]]
            batch.append(processed_row)
            
            if len(batch) >= 10000:
                cursor.executemany(insert_sql, batch)
                conn.commit()
                count += len(batch)
                print(f"Inserted {count} rows...")
                batch = []
        
        if batch:
            cursor.executemany(insert_sql, batch)
            conn.commit()
            count += len(batch)
    
    # Add indexes for key symptoms if possible, but there are 400+
    # Better to create a summary view or just index the diseases
    cursor.execute("CREATE INDEX idx_disease ON symptom_map(diseases)")
    
    print(f"Successfully processed {count} records into {db_path}")
    conn.close()

if __name__ == "__main__":
    process()
