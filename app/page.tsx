"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Star, ChevronRight, Clock, MapPin, Mail, Phone, MessageSquare, Send, Pencil, Trash2, X, Plus, Trash } from "lucide-react";
import { getBurgers, getHero, getStory, getContactInfo, sendContactMessage, updateBurger, deleteBurger, createBurger, Burger, Hero, Story, ContactInfo } from "@/lib/api";

const HomePage = () => {
  const [burgers, setBurgers] = useState<Burger[]>([]);
  const [hero, setHero] = useState<Hero | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingBurger, setEditingBurger] = useState<Burger | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingBurgerId, setDeletingBurgerId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBurger, setNewBurger] = useState<Omit<Burger, 'id'>>({
    name: "",
    description: "",
    price: 0,
    image: "/images/b1.png",
    category: "Gourmet"
  });

  // Filter state
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Cart state
  const [cart, setCart] = useState<{ burger: Burger, quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error", message: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [burgersData, heroData, storyData, contactInfoData] = await Promise.all([
          getBurgers(),
          getHero(),
          getStory(),
          getContactInfo()
        ]);
        setBurgers(burgersData);
        setHero(heroData);
        setStory(storyData);
        setContactInfo(contactInfoData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSubmitStatus(null);
    try {
      const response = await sendContactMessage(formData);
      setSubmitStatus({ type: "success", message: response.message });
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      setSubmitStatus({ type: "error", message: "Failed to send message. Please try again." });
    } finally {
      setSending(false);
    }
  };

  const handleUpdateBurger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBurger) return;
    try {
      const updated = await updateBurger(editingBurger.id, editingBurger);
      setBurgers(burgers.map(b => b.id === updated.id ? updated : b));
      setIsEditModalOpen(false);
      setEditingBurger(null);
    } catch (error) {
      console.error("Error updating burger:", error);
    }
  };

  const handleDeleteBurger = async () => {
    if (deletingBurgerId === null) return;
    try {
      await deleteBurger(deletingBurgerId);
      setBurgers(burgers.filter(b => b.id !== deletingBurgerId));
      setIsDeleteModalOpen(false);
      setDeletingBurgerId(null);
    } catch (error) {
      console.error("Error deleting burger:", error);
    }
  };

  const handleCreateBurger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createBurger(newBurger);
      setBurgers([...burgers, created]);
      setIsAddModalOpen(false);
      setNewBurger({ name: "", description: "", price: 0, image: "/images/b1.png", category: "Gourmet" });
    } catch (error) {
      console.error("Error creating burger:", error);
    }
  };

  const addToCart = (burger: Burger) => {
    setCart(prev => {
      const existing = prev.find(item => item.burger.id === burger.id);
      if (existing) {
        return prev.map(item => item.burger.id === burger.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { burger, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.burger.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.burger.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = useMemo(() => cart.reduce((total, item) => total + (item.burger.price * item.quantity), 0), [cart]);

  const filteredBurgers = useMemo(() => {
    if (activeCategory === "All") return burgers;
    return burgers.filter(b => b.category === activeCategory);
  }, [burgers, activeCategory]);

  const categories = ["All", ...(hero?.categories || ["Gourmet", "Classic", "Vegan"])];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-3xl font-bold italic tracking-tighter">
            BURGER<span className="text-orange-500">LAB.</span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm uppercase tracking-widest font-medium">
            <a href="#menu" className="hover:text-orange-500 transition-colors">Menu</a>
            <a href="#story" className="hover:text-orange-500 transition-colors">Our Story</a>
            <a href="#contact" className="hover:text-orange-500 transition-colors">Contact</a>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className={`text-[10px] px-3 py-1 rounded-full border border-white/20 transition-all ${isAdmin ? 'bg-orange-500 text-white border-transparent' : 'text-gray-400 hover:text-white'}`}
            >
              ADMIN MODE
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-orange-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
            <button className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95">
              ORDER NOW
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-7xl lg:text-8xl font-black leading-tight italic uppercase">
              {hero?.title_line1 || "Bite into"} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
                {hero?.title_line2 || "Pure Bliss"}
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-400 max-w-lg leading-relaxed">
              {hero?.description || "Experience the perfect harmony of premium Wagyu beef, artisanal brioche, and our secret signature sauces. Crafted for true burger enthusiasts."}
            </p>
            <div className="mt-10 flex flex-wrap gap-6">
              <a href="#menu" className="flex items-center space-x-3 bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:translate-y-[-2px]">
                <span>EXPLORE MENU</span>
                <ChevronRight size={20} />
              </a>
              <div className="flex items-center space-x-4 px-6 border-l border-white/10">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-black overflow-hidden relative">
                      <Image src={`/images/t${i}.jpg`} alt="customer" fill className="object-cover" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center text-orange-500">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <p className="text-sm font-medium">{hero?.review_count || "500+"} Happy Reviews</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 drop-shadow-[0_35px_35px_rgba(255,165,0,0.3)]">
              <Image
                src="/images/b1.png"
                alt="Main Burger"
                width={800}
                height={800}
                className="w-full h-auto animate-float"
                priority
              />
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-10 right-10 bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 z-20 hidden md:block">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-500/20 p-2 rounded-lg">
                  <Clock className="text-orange-500" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Fast Delivery</p>
                  <p className="font-bold">{hero?.delivery_time || "15-20 Min"}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-20 px-6 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-5xl font-black italic uppercase italic">Popular Picks</h2>
              <p className="mt-4 text-gray-400">Hand-picked favorites from our gourmet collection</p>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {isAdmin && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-full flex items-center gap-2 font-bold transition-all whitespace-nowrap"
                >
                  <Plus size={20} />
                  <span>ADD BURGER</span>
                </button>
              )}
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-2 rounded-full border transition-all whitespace-nowrap ${activeCategory === category
                    ? 'bg-orange-500 border-transparent font-bold'
                    : 'bg-white/5 border-white/10 hover:border-orange-500/50 text-gray-400 hover:text-white'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[400px] bg-white/5 animate-pulse rounded-[2.5rem]" />
              ))
            ) : filteredBurgers.length > 0 ? (
              filteredBurgers.map((burger, idx) => (
                <motion.div
                  key={burger.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative bg-[#151515] p-6 rounded-[2.5rem] border border-white/5 hover:border-orange-500/30 transition-all flex flex-col"
                >
                  <div className="relative h-48 mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Image
                      src={burger.image}
                      alt={burger.name}
                      fill
                      className="object-contain"
                    />
                    <div className="absolute bottom-0 left-0">
                      <span className="bg-orange-500 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                        {burger.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold italic uppercase">{burger.name}</h3>
                    <p className="mt-2 text-gray-400 text-sm line-clamp-2">{burger.description}</p>
                    {isAdmin && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBurger(burger);
                            setIsEditModalOpen(true);
                          }}
                          className="flex-1 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white py-2 rounded-xl text-xs font-bold transition-all border border-blue-500/20 flex items-center justify-center gap-2"
                        >
                          <Pencil size={14} />
                          EDIT
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingBurgerId(burger.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-2 rounded-xl text-xs font-bold transition-all border border-red-500/20 flex items-center justify-center gap-2"
                        >
                          <Trash2 size={14} />
                          DELETE
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-3xl font-black text-orange-500">${burger.price}</span>
                    <button
                      onClick={() => addToCart(burger)}
                      className="bg-orange-500 hover:bg-white hover:text-orange-500 p-3 rounded-2xl transition-all shadow-lg shadow-orange-500/20"
                    >
                      <ShoppingCart size={24} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-2xl text-gray-500 italic">No burgers found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0d0d0d] border-l border-white/10 z-[101] flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black italic uppercase">Your <span className="text-orange-500">Cart</span></h3>
                  <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{cart.length} ITEMS SELECTED</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {cart.length > 0 ? (
                  cart.map((item) => (
                    <motion.div
                      key={item.burger.id}
                      layout
                      className="flex gap-4 p-4 bg-white/5 rounded-[1.5rem] border border-white/5"
                    >
                      <div className="relative w-20 h-20 bg-white/5 rounded-xl flex-shrink-0">
                        <Image src={item.burger.image} alt={item.burger.name} fill className="object-contain p-2" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold italic uppercase text-sm">{item.burger.name}</h4>
                          <button onClick={() => removeFromCart(item.burger.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                            <Trash size={16} />
                          </button>
                        </div>
                        <p className="text-orange-500 font-black mt-1">${item.burger.price}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => updateQuantity(item.burger.id, -1)}
                            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                          >
                            -
                          </button>
                          <span className="font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.burger.id, 1)}
                            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                    <ShoppingCart size={64} />
                    <p className="text-xl italic font-medium">Your cart is empty</p>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-white/10 space-y-6">
                <div className="flex justify-between items-end">
                  <p className="text-gray-400 uppercase tracking-widest text-xs">Total Amount</p>
                  <p className="text-4xl font-black text-orange-500">${cartTotal.toFixed(2)}</p>
                </div>
                <button
                  disabled={cart.length === 0}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:grayscale py-5 rounded-2xl font-bold text-lg transition-all transform active:scale-95"
                >
                  CHECKOUT NOW
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      {isEditModalOpen && editingBurger && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#151515] w-full max-w-xl rounded-[2.5rem] border border-white/10 overflow-hidden"
          >
            <div className="p-8 flex items-center justify-between border-b border-white/10">
              <h3 className="text-3xl font-black italic uppercase">Edit <span className="text-orange-500">Burger</span></h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateBurger} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Burger Name</label>
                  <input
                    type="text"
                    value={editingBurger.name}
                    onChange={(e) => setEditingBurger({ ...editingBurger, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                  <select
                    value={editingBurger.category}
                    onChange={(e) => setEditingBurger({ ...editingBurger, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500/50 transition-colors appearance-none"
                  >
                    {hero?.categories?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={editingBurger.description}
                  onChange={(e) => setEditingBurger({ ...editingBurger, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500/50 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingBurger.price}
                  onChange={(e) => setEditingBurger({ ...editingBurger, price: parseFloat(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>
              <button className="w-full bg-orange-500 hover:bg-orange-600 py-5 rounded-2xl font-bold text-lg transition-all">
                SAVE CHANGES
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#151515] w-full max-w-xl rounded-[2.5rem] border border-white/10 overflow-hidden"
          >
            <div className="p-8 flex items-center justify-between border-b border-white/10">
              <h3 className="text-3xl font-black italic uppercase">Add <span className="text-orange-500">New Burger</span></h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateBurger} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Burger Name</label>
                  <input
                    type="text"
                    value={newBurger.name}
                    onChange={(e) => setNewBurger({ ...newBurger, name: e.target.value })}
                    placeholder="e.g. Monster Mac"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                  <select
                    value={newBurger.category}
                    onChange={(e) => setNewBurger({ ...newBurger, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500/50 transition-colors appearance-none"
                  >
                    {hero?.categories?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={newBurger.description}
                  onChange={(e) => setNewBurger({ ...newBurger, description: e.target.value })}
                  placeholder="Describe your masterpiece..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500/50 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBurger.price}
                  onChange={(e) => setNewBurger({ ...newBurger, price: parseFloat(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>
              <button className="w-full bg-orange-500 hover:bg-orange-600 py-5 rounded-2xl font-bold text-lg transition-all">
                ADD TO MENU
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#151515] w-full max-w-sm rounded-[2.5rem] border border-white/10 p-10 text-center"
          >
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <Trash2 size={40} />
            </div>
            <h3 className="text-2xl font-black italic uppercase mb-4">Are you Sure?</h3>
            <p className="text-gray-400 mb-8">This action is permanent and cannot be undone.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 py-4 rounded-2xl font-bold transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteBurger}
                className="flex-1 bg-red-500 hover:bg-red-600 py-4 rounded-2xl font-bold transition-all"
              >
                DELETE
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Story Section */}
      <section id="story" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-orange-500/5 to-transparent -z-10" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-[3rem] overflow-hidden border border-white/10 aspect-[4/5]">
              <Image
                src="/images/story.png"
                alt="Our Story"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-[#1a1a1a] p-8 rounded-3xl border border-white/10 hidden md:block">
              <p className="text-4xl font-black text-orange-500">{story?.years_experience || "12+"}</p>
              <p className="text-sm uppercase tracking-widest opacity-60">Years of Perfection</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl font-black italic uppercase">{story?.title_main || "The Secret"} <br /><span className="text-orange-500">{story?.title_highlight || "Ingredients"}</span></h2>
            <p className="mt-8 text-xl text-gray-400 leading-relaxed">
              {story?.description || "Founded in 2012, BURGERLAB began with a simple mission: to redefine the classic American burger. We believe that fine dining isn't just for white tablecloths."}
            </p>
            <div className="mt-12 space-y-8">
              {story?.items.map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Star className="text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{item.title}</h4>
                    <p className="text-gray-400 mt-2">{item.desc}</p>
                  </div>
                </div>
              )) || [
                { title: "fresh baking", desc: "Every patty is 100% grass-fed Wagyu beef, hand-picked from the finest farms." },
                { title: "Artisanal Baking", desc: "Our signature brioche buns are baked fresh every morning at 4:30 AM." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Star className="text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{item.title}</h4>
                    <p className="text-gray-400 mt-2">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-[#151515] p-12 rounded-[3rem] border border-white/5"
            >
              <h2 className="text-5xl font-black italic uppercase">Let&apos;s <span className="text-orange-500">Connect</span></h2>
              <form className="mt-10 space-y-6" onSubmit={handleContactSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500/50 transition-colors w-full"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500/50 transition-colors w-full"
                  />
                </div>
                <div className="relative">
                  <MessageSquare className="absolute top-4 right-4 text-white/20" size={20} />
                  <textarea
                    rows={4}
                    placeholder="Your Message"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500/50 transition-colors w-full resize-none"
                  ></textarea>
                </div>
                <button
                  disabled={sending}
                  className="w-full bg-orange-500 hover:bg-orange-600 py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <span>{sending ? "SENDING..." : "SEND MESSAGE"}</span>
                  <Send size={20} />
                </button>
                {submitStatus && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-center font-medium ${submitStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {submitStatus.message}
                  </motion.p>
                )}
              </form>
            </motion.div>

            <div className="flex flex-col justify-center space-y-12">
              <div className="space-y-4">
                <h3 className="text-3xl font-bold">Find Us</h3>
                <p className="text-gray-400 max-w-sm">We&apos;re located in the heart of the city, ready to serve you the best burgers in town.</p>
              </div>

              <div className="space-y-8">
                {[
                  { icon: MapPin, title: "Location", value: contactInfo?.address || "123 Gourmet Ave, Food City" },
                  { icon: Phone, title: "Phone", value: contactInfo?.phone || "+1 (555) 123-4567" },
                  { icon: Mail, title: "Email", value: contactInfo?.email || "hello@burgerlab.com" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center border border-white/10 text-orange-500">
                      <item.icon size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 uppercase tracking-widest">{item.title}</p>
                      <p className="text-xl font-bold mt-1">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
