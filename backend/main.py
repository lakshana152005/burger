from __future__ import annotations
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# ── Load environment variables from .env ──────────────────────────────────────
load_dotenv()

MONGODB_URI   = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "burger_db")

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Burger API",
    description="🍔 A FastAPI backend connected to MongoDB for the Burger Landing Page",
    version="2.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── MongoDB client (created once at startup) ──────────────────────────────────
client: AsyncIOMotorClient = None
db = None

@app.on_event("startup")
async def startup_db():
    """Connect to MongoDB and seed initial data when the server starts."""
    global client, db
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DATABASE_NAME]

    # ── Seed initial burgers if collection is empty ───────────────────────────
    collection = db["burgers"]
    count = await collection.count_documents({})
    if count == 0:
        initial_burgers = [
            {"id": 1, "name": "Zingy Burger",    "description": "Juicy beef patty with lettuce and tomato",          "price": 9.99,  "image": "/images/b1.png", "category": "Classic"},
            {"id": 2, "name": "Veg Burger",       "description": "Classic burger with double cheddar",                 "price": 11.99, "image": "/images/b2.png", "category": "Vegan"},
            {"id": 3, "name": "Bacon Burger",     "description": "Beef patty topped with crispy bacon",               "price": 12.99, "image": "/images/b3.png", "category": "Gourmet"},
            {"id": 4, "name": "Triple Truffle",   "description": "Triple beef patty with luxury black truffle sauce",  "price": 18.99, "image": "/images/b1.png", "category": "Gourmet"},
        ]
        await collection.insert_many(initial_burgers)
        print(f"✅ Seeded {len(initial_burgers)} burgers into MongoDB.")
    else:
        print(f"✅ MongoDB connected — {count} burger(s) already in collection.")

    # ── Seed hero content ─────────────────────────────────────────────────────
    hero_col = db["hero"]
    if await hero_col.count_documents({}) == 0:
        await hero_col.insert_one({
            "title_line1":    "It's Finger",
            "title_line2":    "Lickin' Good!",
            "description":    "Experience the perfect harmony of premium Wagyu beef, artisanal brioche, and our secret signature sauces. Crafted for true burger enthusiasts.",
            "review_count":   "500+",
            "delivery_time":  "15-20 Min",
            "categories":     ["Gourmet", "Classic", "Vegan"],
        })
        print("✅ Seeded hero content into MongoDB.")

    # ── Seed story content ────────────────────────────────────────────────────
    story_col = db["story"]
    if await story_col.count_documents({}) == 0:
        await story_col.insert_one({
            "title_main":       "The Secret",
            "title_highlight":  "Ingredients",
            "description":      "Founded in 2012, BURGERLAB began with a simple mission: to redefine the classic American burger.",
            "years_experience": "12+",
            "items": [
                {"title": "Premium Sourcing", "desc": "Every patty is 100% grass-fed Wagyu beef, hand-picked from the finest farms."},
                {"title": "Artisanal Baking", "desc": "Our signature brioche buns are baked fresh every morning at 4:30 AM."},
            ],
        })
        print("✅ Seeded story content into MongoDB.")

    # ── Seed contact info ─────────────────────────────────────────────────────
    contact_col = db["contact_info"]
    if await contact_col.count_documents({}) == 0:
        await contact_col.insert_one({
            "address": "Thiagaraj Nagar, Chennai",
            "phone":   "+91 9876543210",
            "email":   "hello@burgerlab.com",
        })
        print("✅ Seeded contact info into MongoDB.")

@app.on_event("shutdown")
async def shutdown_db():
    """Close the MongoDB connection when the server shuts down."""
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed.")

# ── Helper: strip MongoDB's _id field ─────────────────────────────────────────
def doc_serial(doc: dict) -> dict:
    """Convert MongoDB document to a plain dict (remove _id)."""
    doc.pop("_id", None)
    return doc

# ── Pydantic Models ───────────────────────────────────────────────────────────
class Burger(BaseModel):
    id: Optional[int] = None
    name: str
    description: str
    price: float
    image: str
    category: Optional[str] = "Gourmet"

class Hero(BaseModel):
    title_line1: str
    title_line2: str
    description: str
    review_count: str
    delivery_time: str
    categories: List[str]

class StoryItem(BaseModel):
    title: str
    desc: str

class Story(BaseModel):
    title_main: str
    title_highlight: str
    description: str
    years_experience: str
    items: List[StoryItem]

class ContactInfo(BaseModel):
    address: str
    phone: str
    email: str

class ContactMessage(BaseModel):
    name: str
    email: str
    message: str

# ── BURGER ROUTES ─────────────────────────────────────────────────────────────

@app.get("/burgers", response_model=List[Burger], tags=["Burgers"])
@app.get("/burger",  response_model=List[Burger], tags=["Burgers"])
async def get_burgers():
    """Get all burgers from MongoDB."""
    collection = db["burgers"]
    burgers = await collection.find().to_list(length=100)
    return [doc_serial(b) for b in burgers]


@app.post("/burgers", response_model=Burger, tags=["Burgers"])
@app.post("/burger",  response_model=Burger, tags=["Burgers"])
async def create_burger(burger: Burger):
    """Add a new burger to MongoDB."""
    collection = db["burgers"]

    # Auto-generate integer ID (max existing + 1)
    last = await collection.find_one(sort=[("id", -1)])
    burger.id = (last["id"] + 1) if last else 1

    burger_dict = burger.model_dump()
    await collection.insert_one(burger_dict)
    return doc_serial(burger_dict)


@app.put("/burgers/{burger_id}",        response_model=Burger, tags=["Burgers"])
@app.put("/burger/{burger_id}",         response_model=Burger, tags=["Burgers"])
@app.post("/burger/update/{burger_id}", response_model=Burger, tags=["Burgers"])
async def update_burger(burger_id: int, updated_burger: Burger):
    """Update an existing burger in MongoDB by its integer ID."""
    collection = db["burgers"]
    burger_dict = updated_burger.model_dump()
    burger_dict["id"] = burger_id

    result = await collection.find_one_and_replace(
        {"id": burger_id},
        burger_dict,
        return_document=True,
    )
    if result is None:
        raise HTTPException(status_code=404, detail=f"Burger with id={burger_id} not found")
    return doc_serial(result)


@app.delete("/burgers/{burger_id}", tags=["Burgers"])
@app.delete("/burger/{burger_id}",  tags=["Burgers"])
@app.post("/burger/delete/{burger_id}", tags=["Burgers"])
async def delete_burger(burger_id: int):
    """Delete a burger from MongoDB by its integer ID."""
    collection = db["burgers"]
    result = await collection.delete_one({"id": burger_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Burger with id={burger_id} not found")
    return {"status": "success", "message": f"Burger {burger_id} deleted"}


# ── CONTENT ROUTES (now powered by MongoDB) ──────────────────────────────────

@app.get("/hero", response_model=Hero, tags=["Content"])
async def get_hero():
    """Get hero section content from MongoDB."""
    doc = await db["hero"].find_one()
    if not doc:
        raise HTTPException(status_code=404, detail="Hero content not found")
    return doc_serial(doc)

@app.get("/story", response_model=Story, tags=["Content"])
async def get_story():
    """Get story section content from MongoDB."""
    doc = await db["story"].find_one()
    if not doc:
        raise HTTPException(status_code=404, detail="Story content not found")
    return doc_serial(doc)

@app.get("/contact-info", response_model=ContactInfo, tags=["Content"])
async def get_contact_info():
    """Get contact info from MongoDB."""
    doc = await db["contact_info"].find_one()
    if not doc:
        raise HTTPException(status_code=404, detail="Contact info not found")
    return doc_serial(doc)

@app.post("/contact", tags=["Contact Messages"])
async def receive_contact(msg: ContactMessage):
    """Save a contact message to MongoDB."""
    from datetime import datetime
    message_dict = msg.model_dump()
    message_dict["received_at"] = datetime.now().isoformat()
    await db["contact_messages"].insert_one(message_dict)
    print(f"📬 Message from {msg.name} ({msg.email}): {msg.message}")
    return {"status": "success", "message": "Thank you for reaching out!"}

@app.get("/contact-messages", tags=["Contact Messages"])
async def get_contact_messages():
    """Get all contact messages from MongoDB."""
    messages = await db["contact_messages"].find().to_list(length=100)
    return [doc_serial(m) for m in messages]

@app.get("/", tags=["Root"])
async def root():
    return {"message": "🍔 Welcome to Burger API — powered by FastAPI + MongoDB"}

# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
