import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Baby,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock,
  Heart,
  Home,
  Image,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Sprout,
  Users,
  WashingMachine
} from "lucide-react";
import "./styles.css";

const statusMeta = {
  Requested: { tone: "red", label: "Requested" },
  Claimed: { tone: "green", label: "Claimed" },
  Confirmed: { tone: "violet", label: "Confirmed" },
  Completed: { tone: "sage", label: "Completed" },
  Declined: { tone: "gray", label: "Declined" },
  Canceled: { tone: "gray", label: "Canceled" },
  Expired: { tone: "amber", label: "Expired" }
};

const initialItems = [
  {
    id: 1,
    title: "Meal Drop-off",
    type: "Meal",
    description: "Help with dinner this week.",
    date: "Wed",
    fullDate: "May 14, 2026",
    time: "5:30 PM",
    window: "Fixed time",
    status: "Requested",
    requestedBy: "Mom",
    claimedBy: "",
    location: "Front porch",
    urgency: "in 12d",
    icon: "meal"
  },
  {
    id: 2,
    title: "Grocery Run",
    type: "Groceries",
    description: "Pick up a few groceries.",
    date: "Thu",
    fullDate: "May 15, 2026",
    time: "Morning",
    window: "Flexible",
    status: "Requested",
    requestedBy: "Mom",
    claimedBy: "",
    location: "Riverside Market",
    urgency: "in 13d",
    icon: "groceries"
  },
  {
    id: 3,
    title: "Laundry Help",
    type: "Laundry",
    description: "Fold and put away.",
    date: "Fri",
    fullDate: "May 16, 2026",
    time: "Flexible time",
    window: "Flexible",
    status: "Requested",
    requestedBy: "Mom",
    claimedBy: "",
    location: "Home",
    urgency: "in 14d",
    icon: "laundry"
  },
  {
    id: 4,
    title: "Child Care",
    type: "Child care",
    description: "Watch Ava after school.",
    date: "Mon",
    fullDate: "May 19, 2026",
    time: "3:30 PM",
    window: "Fixed time",
    status: "Claimed",
    requestedBy: "Mom",
    claimedBy: "Grandma Rose",
    location: "Home",
    urgency: "in 17d",
    icon: "child"
  },
  {
    id: 5,
    title: "Light Cleaning",
    type: "Cleaning",
    description: "Kitchen and common areas.",
    date: "Tue",
    fullDate: "May 20, 2026",
    time: "Flexible time",
    window: "Flexible",
    status: "Requested",
    requestedBy: "Mom",
    claimedBy: "",
    location: "Home",
    urgency: "in 18d",
    icon: "cleaning"
  },
  {
    id: 7,
    title: "Visit Request from Grandma Rose",
    type: "Visit",
    description: "Grandma Rose would like to spend time together.",
    date: "Sun",
    fullDate: "May 18, 2026",
    time: "2:00 PM",
    window: "Fixed time",
    status: "Requested",
    requestedBy: "Grandma Rose",
    claimedBy: "",
    location: "Home",
    urgency: "in 16d",
    icon: "visit"
  },
  {
    id: 6,
    title: "Saturday Park Visit",
    type: "Outing",
    description: "Ava loved the ducks and swings today.",
    date: "Sat",
    fullDate: "May 10, 2026",
    time: "10:00 AM - 12:00 PM",
    window: "Confirmed window",
    status: "Completed",
    requestedBy: "Mom",
    claimedBy: "Grandma Rose",
    completedBy: "Grandma Rose",
    location: "Riverside Park",
    urgency: "done",
    icon: "outing"
  }
];

const nav = [
  { id: "home", label: "Home", icon: Home },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "tasks", label: "Help Requests", icon: CheckCircle2 },
  { id: "memories", label: "Memories", icon: Image }
];

function App() {
  const [page, setPage] = useState("home");
  const [items, setItems] = useState(initialItems);
  const [activeItemId, setActiveItemId] = useState(7);
  const [editingItemId, setEditingItemId] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return { month: today.getMonth(), year: today.getFullYear() };
  });
  const activeItem = items.find((item) => item.id === activeItemId) ?? items[0];

  const counts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { Requested: 0, Claimed: 0, Completed: 0 }
    );
  }, [items]);

  function updateStatus(id, status) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              claimedBy: status === "Claimed" ? "Grandma Rose" : status === "Requested" ? "" : item.claimedBy,
              completedBy: status === "Completed" ? item.claimedBy || "Grandma Rose" : status === "Requested" ? "" : item.completedBy
            }
          : item
      )
    );
  }

  function deleteItem(id) {
    setItems((current) => {
      const next = current.filter((item) => item.id !== id);
      if (activeItemId === id) {
        setActiveItemId(next[0]?.id ?? null);
      }
      if (editingItemId === id) {
        setEditingItemId(null);
      }
      return next;
    });
  }

  function saveItem(id, updates) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    setEditingItemId(null);
  }

  function addItem(item) {
    setItems((current) => [{ ...item, id: Date.now(), status: "Requested", icon: item.icon || "custom", urgency: "new" }, ...current]);
  }

  return (
    <div className="app">
      <Header page={page} setPage={setPage} />
      <main>
        {page === "home" && <HomePage counts={counts} setPage={setPage} items={items} updateStatus={updateStatus} />}
        {page === "calendar" && (
          <CalendarPage
            items={items}
            activeItem={activeItem}
            setActiveItemId={setActiveItemId}
            updateStatus={updateStatus}
            deleteItem={deleteItem}
            editingItemId={editingItemId}
            setEditingItemId={setEditingItemId}
            saveItem={saveItem}
            visibleMonth={visibleMonth}
            setVisibleMonth={setVisibleMonth}
          />
        )}
        {page === "tasks" && <TasksPage items={items} counts={counts} updateStatus={updateStatus} addItem={addItem} saveItem={saveItem} />}
        {page === "memories" && <MemoriesPage completed={items.find((item) => item.status === "Completed")} />}
      </main>
      <MobileNav page={page} setPage={setPage} />
    </div>
  );
}

function Header({ page, setPage }) {
  return (
    <header className="site-header">
      <div className="brand">
        <img src="/assets/violet-logo.png" alt="" />
        <div>
          <strong>Team Violet</strong>
          <span>Many hands make work light.</span>
        </div>
      </div>
      <nav aria-label="Primary navigation">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => setPage(item.id)}>
              <Icon size={21} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <button className="profile-button" aria-label="Open parent profile">
        <span className="avatar">M</span>
        <span>Mom</span>
      </button>
    </header>
  );
}

function HomePage({ setPage }) {
  return (
    <section className="home-grid page-shell">
      <div className="hero-copy">
        <h1>Coordinate care, visits, and family memories with ease.</h1>
        <p>A simple way for grandparents, extended family, friends, and parents to stay connected, help out, and make memories together.</p>
        <div className="hero-actions">
          <button className="primary" onClick={() => setPage("tasks")}><Users size={20} /> Create Family Circle</button>
          <button className="secondary" onClick={() => setPage("calendar")}><Mail size={20} /> Explore as Guest</button>
        </div>
      </div>
      <div className="hero-art">
        <img src="/assets/family.png" alt="Illustration of a family holding their newborn" />
      </div>
      <div className="feature-row">
        <div className="feature-card visit-card">
          <CalendarDays />
          <h2>Plan gentle visits</h2>
        </div>
        <div className="feature-card sage help-card">
          <Heart />
          <h2>Coordinate help</h2>
        </div>
        <div className="feature-card memory-card">
          <Camera />
          <h2>Save family moments</h2>
        </div>
      </div>
    </section>
  );
}

function CalendarPage({ items, activeItem, setActiveItemId, updateStatus, deleteItem, editingItemId, setEditingItemId, saveItem, visibleMonth, setVisibleMonth }) {
  const calendarCells = getCalendarCells(visibleMonth.year, visibleMonth.month);
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(visibleMonth.year, visibleMonth.month, 1));
  const today = new Date();
  const isCurrentVisibleMonth = today.getFullYear() === visibleMonth.year && today.getMonth() === visibleMonth.month;
  const activeDate = activeItem ? parseCareDate(activeItem.fullDate) : null;

  function moveMonth(offset) {
    setVisibleMonth((current) => {
      const next = new Date(current.year, current.month + offset, 1);
      return { month: next.getMonth(), year: next.getFullYear() };
    });
    setEditingItemId(null);
  }

  function eventsForCell(cell) {
    return items.filter((item) => {
      const parsed = parseCareDate(item.fullDate);
      return parsed && parsed.year === cell.year && parsed.month === cell.month && parsed.day === cell.day;
    });
  }

  function handleSave(id, updates) {
    saveItem(id, updates);
    const parsed = parseCareDate(updates.fullDate);
    if (parsed) {
      setVisibleMonth({ month: parsed.month, year: parsed.year });
    }
  }

  return (
    <section className="page-shell calendar-page">
      <PageTitle icon={CalendarDays} title="Calendar / Visits" />
      <div className="calendar-layout">
        <div className="calendar-card">
          <div className="calendar-heading">
            <button aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft /></button>
            <h2>{monthLabel}</h2>
            <button aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight /></button>
          </div>
          <div className="calendar-grid labels">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid month" role="grid" aria-label="May 2026 care calendar">
            {calendarCells.map((cell, index) => {
              const events = eventsForCell(cell);
              const isToday = isCurrentVisibleMonth && !cell.muted && cell.day === today.getDate();
              const isSelectedDate = activeDate && activeDate.year === cell.year && activeDate.month === cell.month && activeDate.day === cell.day;
              return (
                <button
                  key={`${cell.year}-${cell.month}-${cell.day}-${index}`}
                  className={`${isToday ? "today" : ""} ${cell.muted ? "muted" : ""} ${isSelectedDate ? "selected-date" : ""}`}
                  onClick={() => { if (events[0]) { setActiveItemId(events[0].id); setEditingItemId(null); } }}
                  aria-label={`${cell.muted ? "Adjacent month" : monthLabel} ${cell.day}${events[0] ? `, ${events.map((event) => event.title).join(", ")}` : ""}`}
                >
                  <span>{cell.day}</span>
                  {events.map((event) => <small key={event.id} className={`event ${statusMeta[event.status]?.tone}`}>{event.time} {event.title}</small>)}
                </button>
              );
            })}
          </div>
        </div>
        {editingItemId === activeItem?.id ? (
          <EditPanel item={activeItem} onCancel={() => setEditingItemId(null)} onSave={handleSave} onDelete={() => { deleteItem(activeItem.id); setEditingItemId(null); }} />
        ) : (
          <DetailPanel item={activeItem} onEdit={() => setEditingItemId(activeItem.id)} />
        )}
      </div>
    </section>
  );
}

function getCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return {
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      muted: date.getMonth() !== month
    };
  });
}

function parseCareDate(value) {
  const parsed = new Date(`${value} 12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return { day: parsed.getDate(), month: parsed.getMonth(), year: parsed.getFullYear() };
}

function getShortDay(value) {
  const parsed = new Date(`${value} 12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", { weekday: "short" });
}

function TasksPage({ items, counts, updateStatus, addItem, saveItem }) {
  const [filter, setFilter] = useState("Requested");
  const [isCreating, setIsCreating] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const editingTask = items.find((item) => item.id === editingTaskId);
  const filtered = items.filter((item) => {
    if (filter === "Requested") return item.status === "Requested";
    if (filter === "Claimed") return item.status === "Claimed";
    return item.status === "Completed";
  });
  return (
    <section className="page-shell task-page">
      <div className="task-header">
        <PageTitle title="Help Requests" extra="Request help when you need it. Family can claim tasks to support you." />
      </div>
      <div className="task-layout">
        <div>
          {isCreating && <NewRequestForm onCancel={() => setIsCreating(false)} onCreate={(item) => { addItem(item); setFilter("Requested"); setIsCreating(false); }} />}
          {editingTask && (
            <TaskEditForm
              item={editingTask}
              onCancel={() => setEditingTaskId(null)}
              onSave={(id, updates) => {
                saveItem(id, updates);
                setEditingTaskId(null);
                setFilter(updates.status || editingTask.status);
              }}
            />
          )}
          <div className="tabs" role="tablist" aria-label="Task status filter">
            {["Requested", "Claimed", "Completed"].map((tab) => (
              <button key={tab} className={filter === tab ? "selected" : ""} onClick={() => setFilter(tab)}>
                {tab} <span>{tab === "Requested" ? counts.Requested : counts[tab]}</span>
              </button>
            ))}
          </div>
          <div className="task-list">
            {filtered.length ? filtered.map((item) => (
              <TaskRow key={item.id} item={item} updateStatus={updateStatus} onEdit={() => { setIsCreating(false); setEditingTaskId(item.id); }} />
            )) : <EmptyState />}
          </div>
        </div>
        <aside className="summary-stack">
          <button className="primary new-request-side" onClick={() => { setEditingTaskId(null); setIsCreating(true); }}><Plus size={20} /> New Request</button>
          <div className="summary-card">
            <h2>Spread the word</h2>
            <p>Email the requested tasks to your family circle to claim</p>
            <button className="notify-button wide"><Mail size={17} /> Notify Group</button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function NewRequestForm({ onCancel, onCreate }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Meal",
    fullDate: "May 22, 2026",
    date: "Fri",
    time: "Flexible time",
    location: "Home",
    requestedBy: "Mom",
    window: "Flexible",
    icon: "meal"
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const title = form.title.trim() || "New Help Request";
    const description = form.description.trim() || "Add request details.";
    onCreate({ ...form, title, description, date: getShortDay(form.fullDate) || form.date, claimedBy: "", completedBy: "" });
  }

  return (
    <section className="new-request-panel">
      <h2>New Request</h2>
      <form onSubmit={submit}>
        <label>Title<input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Meal prep, groceries, or visit" /></label>
        <label>Description<textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="What would help?" /></label>
        <div className="form-grid">
          <label>Type<select value={form.type} onChange={(event) => updateField("type", event.target.value)}>{["Meal", "Groceries", "Laundry", "Cleaning", "Child care", "Visit", "Outing", "Custom"].map((type) => <option key={type}>{type}</option>)}</select></label>
          <label>Date<input value={form.fullDate} onChange={(event) => updateField("fullDate", event.target.value)} /></label>
          <label>Time<input value={form.time} onChange={(event) => updateField("time", event.target.value)} /></label>
        </div>
        <label>Location<input value={form.location} onChange={(event) => updateField("location", event.target.value)} /></label>
        <div className="panel-actions">
          <button className="primary" type="submit">Create Request</button>
          <button className="secondary" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}

function TaskEditForm({ item, onCancel, onSave }) {
  const [form, setForm] = useState({
    title: item.title,
    description: item.description,
    type: item.type,
    fullDate: item.fullDate,
    date: item.date,
    time: item.time,
    location: item.location,
    requestedBy: item.requestedBy,
    claimedBy: item.claimedBy || "",
    completedBy: item.completedBy || "",
    status: item.status,
    window: item.window || "Flexible"
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const claimedBy = form.status === "Requested" ? "" : form.claimedBy.trim();
    const completedBy = form.status === "Completed" ? form.completedBy.trim() || claimedBy : "";
    onSave(item.id, {
      ...form,
      title: form.title.trim() || item.title,
      description: form.description.trim() || item.description,
      date: getShortDay(form.fullDate) || form.date,
      claimedBy,
      completedBy
    });
  }

  return (
    <section className="new-request-panel edit-request-panel">
      <h2>Edit Request</h2>
      <form onSubmit={submit}>
        <label>Title<input value={form.title} onChange={(event) => updateField("title", event.target.value)} /></label>
        <label>Description<textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} /></label>
        <div className="form-grid">
          <label>Type<select value={form.type} onChange={(event) => updateField("type", event.target.value)}>{["Meal", "Groceries", "Laundry", "Cleaning", "Child care", "Visit", "Outing", "Custom"].map((type) => <option key={type}>{type}</option>)}</select></label>
          <label>Status<select value={form.status} onChange={(event) => updateField("status", event.target.value)}>{["Requested", "Claimed", "Completed"].map((status) => <option key={status}>{status}</option>)}</select></label>
          <label>Date<input value={form.fullDate} onChange={(event) => updateField("fullDate", event.target.value)} /></label>
          <label>Day<input value={form.date} onChange={(event) => updateField("date", event.target.value)} /></label>
        </div>
        <div className="form-grid">
          <label>Time<input value={form.time} onChange={(event) => updateField("time", event.target.value)} /></label>
          <label>Location<input value={form.location} onChange={(event) => updateField("location", event.target.value)} /></label>
          <label>Requested by<input value={form.requestedBy} onChange={(event) => updateField("requestedBy", event.target.value)} /></label>
          <label>Window<input value={form.window} onChange={(event) => updateField("window", event.target.value)} /></label>
        </div>
        <div className="form-grid two">
          <label>Claimed by<input value={form.claimedBy} onChange={(event) => updateField("claimedBy", event.target.value)} placeholder="Who is claiming this?" /></label>
          <label>Completed by<input value={form.completedBy} onChange={(event) => updateField("completedBy", event.target.value)} placeholder="Who completed this?" /></label>
        </div>
        <div className="panel-actions">
          <button className="primary" type="submit">Save Changes</button>
          <button className="secondary" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}

function MemoriesPage({ completed }) {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);

  return (
    <section className="page-shell memories-page">
      <div className="breadcrumbs">Shared Moments - Activity Details</div>
      <div className="memory-layout">
        <div className="memory-main">
          <section className="memory-hero">
            <div className="icon-bubble sage"><Sprout /></div>
            <div>
              <h1>Saturday Park Visit</h1>
              <StatusBadge status="Completed" />
              <p><CalendarDays size={18} /> May 10, 2026 <Clock size={18} /> 10:00 AM - 12:00 PM</p>
            </div>
            <div className="park-scene" aria-hidden="true"><span>🌳</span><span>🪁</span><span>☁</span></div>
          </section>
          <section className="photos-card">
            <h2>Photos</h2>
            <div className="photo-grid">
              {showPhotoUpload ? (
                <label className="photo-upload">
                  <input type="file" accept="image/*" />
                  <Image size={24} />
                  <span>Choose Photo</span>
                </label>
              ) : (
                <button className="add-photo" onClick={() => setShowPhotoUpload(true)}><Plus /> Add Photo</button>
              )}
            </div>
          </section>
          <section className="notes-card">
            <h2>Notes</h2>
            <div className="note">
              <span className="avatar rose">GR</span>
              <p><b>Grandma Rose</b><small>May 10 at 2:25 PM</small>Ava loved the ducks and swings today. Such a beautiful morning together!</p>
              <Heart className="heart" fill="currentColor" />
            </div>
            {showNoteInput && <div className="note-input"><span className="avatar">M</span><input aria-label="Add a note" placeholder="Add a note..." autoFocus /><button aria-label="Send note"><Send /></button></div>}
          </section>
        </div>
        <aside className="memory-sidebar">
          <section className="details-card">
            <h2>Activity Details</h2>
            <dl>
              <dt>Activity Type</dt><dd>{completed?.type ?? "Outing"}</dd>
              <dt>Location</dt><dd>{completed?.location ?? "Riverside Park"}</dd>
              <dt>Requested By</dt><dd>Mom</dd>
              <dt>Help Provided By</dt><dd>Grandma Rose</dd>
            </dl>
            <button className="primary wide" onClick={() => setShowPhotoUpload(true)}><Image size={18} /> Add Photo</button>
            <button className="secondary wide" onClick={() => setShowNoteInput(true)}>Add a Note</button>
          </section>
          <section className="encourage-card">
            <img src="/assets/family.png" alt="" />
            <h2>You're doing great!</h2>
            <p>Helping hands, moments and memories.</p>
            <Heart fill="currentColor" />
          </section>
        </aside>
      </div>
    </section>
  );
}

function PageTitle({ icon: Icon, title, extra }) {
  return (
    <div className="page-title">
      {Icon && <span className="title-icon"><Icon /></span>}
      <div>
        <h1>{title}</h1>
        {extra && <p>{extra}</p>}
      </div>
    </div>
  );
}

function TaskRow({ item, updateStatus, onEdit, compact = false }) {
  if (!item) return null;
  const Icon = getItemIcon(item.icon);
  const claimedBy = item.status !== "Completed" ? item.claimedBy?.trim() : "";
  const completedBy = item.status === "Completed" ? item.completedBy?.trim() : "";
  return (
    <article className={`task-row ${compact ? "compact" : ""}`}>
      <span className={`item-icon ${item.icon}`}><Icon size={24} /></span>
      <div className="task-copy">
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        {(claimedBy || completedBy) && (
          <div className="person-lines">
            {claimedBy && <span className="person-claimed">Claimed by {claimedBy}</span>}
            {completedBy && <span className="person-completed">Completed by {completedBy}</span>}
          </div>
        )}
        <strong>{item.date} · {item.fullDate} · {item.time} <em>{item.urgency}</em></strong>
      </div>
      <select
        className={`row-status ${statusMeta[item.status]?.tone || "gray"}`}
        aria-label={`${item.title} status`}
        value={item.status}
        onChange={(event) => updateStatus(item.id, event.target.value)}
      >
        <option>Requested</option>
        <option>Claimed</option>
        <option>Completed</option>
      </select>
      {!compact && <button className="edit-row-button" onClick={onEdit} aria-label={`Edit ${item.title}`}><Pencil size={17} /> Edit</button>}
    </article>
  );
}

function DetailPanel({ item, onEdit }) {
  if (!item) {
    return (
      <aside className="detail-panel">
        <h2>No item selected</h2>
        <p>Select a calendar item to view details.</p>
      </aside>
    );
  }
  return (
    <aside className="detail-panel">
      <div className="detail-date-note">Details: {item.fullDate}</div>
      <h2>{item.title}</h2>
      <StatusBadge status={item.status} />
      <p className="detail-description">{item.description}</p>
      <dl>
        <dt>Type</dt><dd>{item.type}</dd>
        <dt>When</dt><dd>{item.time}</dd>
        <dt>Location</dt><dd>{item.location}</dd>
        <dt>Requested by</dt><dd>{item.requestedBy}</dd>
      </dl>
      <div className="panel-actions">
        <button className="secondary" onClick={onEdit}>Edit Details</button>
      </div>
    </aside>
  );
}

function EditPanel({ item, onCancel, onSave, onDelete }) {
  const [form, setForm] = useState({
    title: item.title,
    description: item.description,
    type: item.type,
    status: item.status,
    fullDate: item.fullDate,
    time: item.time,
    location: item.location,
    requestedBy: item.requestedBy,
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave(item.id, form);
  }

  return (
    <aside className="detail-panel edit-panel">
      <h2>Edit Details</h2>
      <form onSubmit={submit}>
        <label>
          Title
          <input value={form.title} onChange={(event) => updateField("title", event.target.value)} />
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} />
        </label>
        <label>
          Type
          <select value={form.type} onChange={(event) => updateField("type", event.target.value)}>
            {["Meal", "Groceries", "Laundry", "Cleaning", "Child care", "Visit", "Outing", "Custom"].map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
            {["Requested", "Claimed", "Completed"].map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label>
          Date
          <input value={form.fullDate} onChange={(event) => updateField("fullDate", event.target.value)} />
        </label>
        <label>
          Time
          <input value={form.time} onChange={(event) => updateField("time", event.target.value)} />
        </label>
        <label>
          Location
          <input value={form.location} onChange={(event) => updateField("location", event.target.value)} />
        </label>
        <label>
          Requested by
          <input value={form.requestedBy} onChange={(event) => updateField("requestedBy", event.target.value)} />
        </label>
        <div className="panel-actions">
          <button className="primary" type="submit">Save Changes</button>
          <button className="delete-option" type="button" onClick={onDelete}>Delete</button>
          <button className="secondary" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </aside>
  );
}

function StatusBadge({ status }) {
  const tone = status === "Flexible" ? "blue" : statusMeta[status]?.tone || "gray";
  return <span className={`status ${tone}`}>{status}</span>;
}

function SummaryLine({ label, value, tone }) {
  return <p className="summary-line"><span className={`dot ${tone}`}></span>{label}<b>{value}</b></p>;
}

function EmptyState() {
  return (
    <div className="empty-state">
      <CircleHelp />
      <h2>No matching requests</h2>
      <p>Try another status filter or create a new help request.</p>
    </div>
  );
}

function MobileNav({ page, setPage }) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {nav.map((item) => {
        const Icon = item.icon;
        return <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => setPage(item.id)}><Icon /><span>{item.label}</span></button>;
      })}
      <button className="add"><Plus /><span>Add</span></button>
    </nav>
  );
}

function getItemIcon(icon) {
  return {
    meal: Baby,
    groceries: ShoppingCart,
    laundry: WashingMachine,
    child: Users,
    cleaning: Sparkles,
    outing: MapPin
    ,visit: Mail
    ,custom: CircleHelp
  }[icon] || ShieldCheck;
}

createRoot(document.getElementById("root")).render(<App />);
