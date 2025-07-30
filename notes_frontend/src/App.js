import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

// Fake unique ID generator for notes (replace with uuid or backend id in production)
const generateId = () => "_" + Math.random().toString(36).substr(2, 9);

// Initial demo categories for sidebar (users may add in the future)
// These can be loaded/managed via backend/database in production
const defaultCategories = [
  { id: "all", name: "All Notes" },
  { id: "work", name: "Work" },
  { id: "personal", name: "Personal" },
];

// PUBLIC_INTERFACE
function App() {
  // Notes: {id, title, body, category, updated}
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [theme] = useState("light"); // Light theme only as requested

  // Load notes/categories from localStorage or API on mount
  useEffect(() => {
    // Replace with backend fetch if persistent API/database exists
    const savedNotes = JSON.parse(localStorage.getItem("notesapp-notes") || "[]");
    const savedCategories = JSON.parse(localStorage.getItem("notesapp-categories") || "null");
    setNotes(savedNotes);
    if (savedCategories) setCategories(savedCategories);
    // Set initial theme
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist notes and categories to localStorage to simulate CRUD ("backend")
  useEffect(() => {
    localStorage.setItem("notesapp-notes", JSON.stringify(notes));
  }, [notes]);
  useEffect(() => {
    localStorage.setItem("notesapp-categories", JSON.stringify(categories));
  }, [categories]);

  // -- CRUD LOGIC --

  // PUBLIC_INTERFACE
  function createNote(categoryId) {
    const note = {
      id: generateId(),
      title: "",
      body: "",
      category: categoryId === "all" ? categories[1]?.id || "work" : categoryId,
      updated: Date.now()
    };
    setNotes([note, ...notes]);
    setSelectedNoteId(note.id);
    setShowNoteEditor(true);
  }

  // PUBLIC_INTERFACE
  function updateNote(noteId, data) {
    setNotes(notes =>
      notes.map(n =>
        n.id === noteId
          ? { ...n, ...data, updated: Date.now() }
          : n
      )
    );
  }

  // PUBLIC_INTERFACE
  function deleteNote(noteId) {
    setNotes(notes => notes.filter(n => n.id !== noteId));
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
      setShowNoteEditor(false);
    }
  }

  // PUBLIC_INTERFACE
  function addCategory(newCatName) {
    const exists = categories.some(
      c => c.name.toLowerCase() === newCatName.trim().toLowerCase()
    );
    if (exists || !newCatName.trim()) return false;
    const newCat = { id: generateId(), name: newCatName.trim() };
    setCategories([...categories, newCat]);
    return true;
  }

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = notes;
    if (activeCategory !== "all")
      filtered = filtered.filter(n => n.category === activeCategory);
    if (searchTerm)
      filtered = filtered.filter(n =>
        `${n.title} ${n.body}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    // Sort: latest first
    return filtered.sort((a, b) => b.updated - a.updated);
  }, [notes, activeCategory, searchTerm]);

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  // PUBLIC_INTERFACE
  function handleSelectNote(noteId) {
    setSelectedNoteId(noteId);
    setShowNoteEditor(true);
  }

  // PUBLIC_INTERFACE
  function handleCloseEditor() {
    setShowNoteEditor(false);
    setSelectedNoteId(null);
  }

  // --- Category label for a note ---
  function getCategoryLabel(catId) {
    return categories.find(c => c.id === catId)?.name || "Category";
  }

  // -- Render --

  return (
    <div className="notesapp-root">
      <TopNavBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <div className="main-layout">
        <Sidebar
          categories={categories}
          setActiveCategory={setActiveCategory}
          activeCategory={activeCategory}
          onAddCategory={addCategory}
        />
        <main className="main-content">
          <div className="notes-list-header">
            <h2>
              {categories.find(c => c.id === activeCategory)?.name || "All Notes"}
            </h2>
            <button
              className="btn btn-primary"
              onClick={() => createNote(activeCategory)}
            >
              + New Note
            </button>
          </div>
          <NotesList
            notes={filteredNotes}
            onSelect={handleSelectNote}
            selectedId={selectedNoteId}
            getCategoryLabel={getCategoryLabel}
            onDelete={deleteNote}
          />
        </main>
        {showNoteEditor && selectedNote ? (
          <NoteEditorModal
            note={selectedNote}
            categories={categories}
            onClose={handleCloseEditor}
            onSave={updateNote}
            onDelete={deleteNote}
          />
        ) : null}
      </div>
    </div>
  );
}

// --- Top Navigation Bar ---
function TopNavBar({ searchTerm, setSearchTerm }) {
  return (
    <header className="navbar">
      <div className="navbar-title">📝 Minimal Notes</div>
      <input
        className="search-input"
        type="search"
        placeholder="Search notes..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        aria-label="Search notes"
      />
      {/* Placeholder for profile/settings menu, etc. */}
    </header>
  );
}

// --- Sidebar for Categories ---
function Sidebar({ categories, setActiveCategory, activeCategory, onAddCategory }) {
  const [adding, setAdding] = useState(false);
  const [catInput, setCatInput] = useState("");

  // PUBLIC_INTERFACE
  function handleAddCategory(e) {
    e.preventDefault();
    if (onAddCategory(catInput)) {
      setCatInput("");
      setAdding(false);
    }
  }

  return (
    <nav className="sidebar" aria-label="Note Categories">
      <ul>
        {categories.map(cat => (
          <li
            key={cat.id}
            className={cat.id === activeCategory ? "active" : ""}
            tabIndex={0}
            onClick={() => setActiveCategory(cat.id)}
            onKeyPress={e => {
              if (e.key === "Enter") setActiveCategory(cat.id);
            }}
          >
            {cat.name}
          </li>
        ))}
      </ul>
      {adding ? (
        <form className="add-category-form" onSubmit={handleAddCategory}>
          <input
            type="text"
            autoFocus
            value={catInput}
            onChange={e => setCatInput(e.target.value)}
            placeholder="Category name"
            maxLength={18}
          />
          <button type="submit" className="btn btn-secondary btn-small">
            Add
          </button>
          <button
            type="button"
            className="btn btn-accent btn-small"
            onClick={() => setAdding(false)}
            tabIndex={-1}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button className="btn btn-secondary btn-small add-cat-btn" onClick={() => setAdding(true)}>
          + Category
        </button>
      )}
    </nav>
  );
}

// --- Notes List ---
function NotesList({ notes, onSelect, selectedId, getCategoryLabel, onDelete }) {
  if (!notes.length) {
    return <div className="notes-empty">No notes found.</div>;
  }
  return (
    <ul className="notes-list" aria-label="Notes List">
      {notes.map(note => (
        <li
          key={note.id}
          className={`note-list-item${note.id === selectedId ? " selected" : ""}`}
          tabIndex={0}
          onClick={() => onSelect(note.id)}
          onKeyPress={e => e.key === "Enter" && onSelect(note.id)}
        >
          <div className="note-meta">
            <span className="note-title">{note.title || <em>Untitled</em>}</span>
            <span className="note-date">
              {new Date(note.updated).toLocaleDateString()} {new Date(note.updated).toLocaleTimeString()}
            </span>
          </div>
          <span className="category-badge">{getCategoryLabel(note.category)}</span>
          <button
            className="btn btn-accent btn-tiny"
            title="Delete note"
            onClick={e => {
              e.stopPropagation();
              onDelete(note.id);
            }}
          >🗑️</button>
        </li>
      ))}
    </ul>
  );
}

// --- Note Editor Modal ---
function NoteEditorModal({ note, categories, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [category, setCategory] = useState(note.category);

  // Save on Ctrl+S, close on Esc
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave(note.id, { title, body, category });
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [title, body, category, note.id]);

  // PUBLIC_INTERFACE
  function handleSave(e) {
    e.preventDefault();
    onSave(note.id, { title, body, category });
    onClose();
  }

  // PUBLIC_INTERFACE
  function handleDelete() {
    if (window.confirm("Delete this note?")) {
      onDelete(note.id);
      onClose();
    }
  }

  return (
    <div className="modal-overlay" role="dialog" tabIndex={-1}>
      <div className="note-editor">
        <form onSubmit={handleSave}>
          <div className="modal-header">
            <input
              className="note-title-input"
              value={title}
              placeholder="Title"
              autoFocus
              onChange={e => setTitle(e.target.value)}
              maxLength={60}
            />
            <select
              className="note-category-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option value={cat.id} key={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="note-body-input"
            rows={10}
            placeholder="Write your note..."
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={2000}
          />
          <div className="modal-footer">
            <button className="btn btn-primary" type="submit">
              Save
            </button>
            <button
              className="btn btn-accent"
              type="button"
              onClick={handleDelete}
            >
              Delete
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
