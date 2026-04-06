import json
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

def import_data():
    client = MongoClient(os.getenv("MONGODB_URI"))
    db = client[os.getenv("DATABASE_NAME")]
    
    with open("burgers_db.json") as f:
        data = json.load(f)
    
    db.burgers.insert_many(data)
    print("✅ Burgers imported successfully!")
    client.close()

if __name__ == "__main__":
    import_data()