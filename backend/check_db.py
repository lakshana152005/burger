import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["burger_db"]
    
    print("=" * 60)
    print("📋 ALL COLLECTIONS IN burger_db:")
    print("=" * 60)
    collections = await db.list_collection_names()
    for c in collections:
        count = await db[c].count_documents({})
        print(f"  📁 {c} — {count} document(s)")
    
    print("\n" + "=" * 60)
    print("📬 CONTACT MESSAGES (saved from the website form):")
    print("=" * 60)
    messages = await db["contact_messages"].find().to_list(100)
    if messages:
        for m in messages:
            m.pop("_id", None)
            print(f"  Name: {m.get('name')}")
            print(f"  Email: {m.get('email')}")
            print(f"  Message: {m.get('message')}")
            print(f"  Received At: {m.get('received_at')}")
            print("  " + "-" * 40)
    else:
        print("  (No messages yet)")
    
    client.close()

asyncio.run(main())
