export const API_BASE_URL = "http://localhost:8000";

export interface Burger {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
}

export interface Hero {
    title_line1: string;
    title_line2: string;
    description: string;
    review_count: string;
    delivery_time: string;
    categories: string[];
}

export interface StoryItem {
    title: string;
    desc: string;
}

export interface Story {
    title_main: string;
    title_highlight: string;
    description: string;
    years_experience: string;
    items: StoryItem[];
}

export interface ContactInfo {
    address: string;
    phone: string;
    email: string;
}

export interface ContactMessage {
    name: string;
    email: string;
    message: string;
}

export async function getBurgers(): Promise<Burger[]> {
    const response = await fetch(`${API_BASE_URL}/burgers`);
    if (!response.ok) {
        throw new Error("Failed to fetch burgers");
    }
    return response.json();
}

export async function getHero(): Promise<Hero> {
    const response = await fetch(`${API_BASE_URL}/hero`);
    if (!response.ok) {
        throw new Error("Failed to fetch hero content");
    }
    return response.json();
}

export async function getStory(): Promise<Story> {
    const response = await fetch(`${API_BASE_URL}/story`);
    if (!response.ok) {
        throw new Error("Failed to fetch story content");
    }
    return response.json();
}

export async function getContactInfo(): Promise<ContactInfo> {
    const response = await fetch(`${API_BASE_URL}/contact-info`);
    if (!response.ok) {
        throw new Error("Failed to fetch contact info");
    }
    return response.json();
}

export async function createBurger(burger: Omit<Burger, 'id'>): Promise<Burger> {
    const response = await fetch(`${API_BASE_URL}/burger`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...burger, id: 0 }),
    });
    if (!response.ok) {
        throw new Error("Failed to create burger");
    }
    return response.json();
}

export async function sendContactMessage(msg: ContactMessage): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(msg),
    });
    if (!response.ok) {
        throw new Error("Failed to send message");
    }
    return response.json();
}

export async function updateBurger(id: number, burger: Burger): Promise<Burger> {
    const response = await fetch(`${API_BASE_URL}/burgers/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(burger),
    });
    if (!response.ok) {
        throw new Error("Failed to update burger");
    }
    return response.json();
}

export async function deleteBurger(id: number): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/burgers/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete burger");
    }
    return response.json();
}
