import React, { useState, useEffect } from "react";
import { Trash2, Edit2, Save, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  listMemories,
  deleteMemory,
  updateMemory,
  type MemoryItem,
} from "../api/client";
import PageShell from "../components/layout/PageShell";

export const MemoryBrowserPage: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    loadMemories();
  }, []);

  useEffect(() => {
    filterMemories();
  }, [memories, selectedCategory, searchQuery]);

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const data = await listMemories();
      setMemories(data || []);
    } catch (error) {
      console.error("Failed to load memories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMemories = () => {
    let filtered = memories;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((m) => m.memory_type === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.memory_key.toLowerCase().includes(query) ||
          m.memory_value.toLowerCase().includes(query),
      );
    }

    setFilteredMemories(filtered);
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm("Delete this memory?")) return;

    try {
      await deleteMemory(id);
      setMemories(memories.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Failed to delete memory:", error);
      alert("Failed to delete memory");
    }
  };

  const handleEditMemory = (memory: MemoryItem) => {
    setEditingId(memory.id);
    setEditValue(memory.memory_value);
  };

  const handleSaveMemory = async (id: string) => {
    if (!editValue.trim()) {
      alert("Memory value cannot be empty");
      return;
    }

    try {
      const updated = await updateMemory(id, editValue.trim());
      setMemories(
        memories.map((m) =>
          m.id === id ? { ...m, memory_value: updated.memory_value } : m,
        ),
      );
      setEditingId(null);
    } catch (error) {
      console.error("Failed to update memory:", error);
      alert("Failed to update memory");
    }
  };

  const categories = Array.from(new Set(memories.map((m) => m.memory_type)));
  const totalMemories = memories.length;
  const selectedCount = selectedCategory
    ? memories.filter((m) => m.memory_type === selectedCategory).length
    : totalMemories;

  return (
    <PageShell title="Memory Browser">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">My Memories</h1>
          <p className="text-muted-foreground">
            {isLoading
              ? "Loading memories..."
              : `${totalMemories} memories stored`}
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                !selectedCategory
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All ({totalMemories})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat} ({memories.filter((m) => m.memory_type === cat).length})
              </button>
            ))}
          </div>
        )}

        {/* Memory List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading memories...</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {memories.length === 0
                ? "No memories stored yet"
                : "No memories match your search"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredMemories.map((memory) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-lg border border-input bg-card hover:bg-card/80 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                        {memory.memory_key}
                      </h3>

                      {editingId === memory.id ? (
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-2 rounded border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm break-words">
                          {memory.memory_value}
                        </p>
                      )}

                      <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="px-2 py-1 rounded bg-muted/50">
                          {memory.memory_type}
                        </span>
                        <span>
                          {new Date(memory.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {editingId === memory.id ? (
                        <>
                          <button
                            onClick={() => handleSaveMemory(memory.id)}
                            className="p-2 rounded hover:bg-muted transition-colors text-green-600 hover:text-green-700"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 rounded hover:bg-muted transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditMemory(memory)}
                            className="p-2 rounded hover:bg-muted transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMemory(memory.id)}
                            className="p-2 rounded hover:bg-muted transition-colors text-destructive hover:text-destructive/80"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Summary */}
        {filteredMemories.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Showing {filteredMemories.length} of {selectedCount} memories
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default MemoryBrowserPage;
