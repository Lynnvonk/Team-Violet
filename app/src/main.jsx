import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Baby,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock,
  Flower2,
  Heart,
  Home,
  Image,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trash2,
  User,
  Users,
  WashingMachine
} from "lucide-react";
import "./styles.css";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const statusMeta = {
  Requested: { tone: "red", label: "Requested" },
  Claimed: { tone: "green", label: "Claimed" },
  Confirmed: { tone: "violet", label: "Confirmed" },
  Completed: { tone: "sage", label: "Completed" },
  Declined: { tone: "gray", label: "Declined" },
  Canceled: { tone: "gray", label: "Canceled" },
  Expired: { tone: "amber", label: "Expired" }
};

const PHOTO_BUCKET = "team-violet-photos";

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

function toDatabaseDate(value) {
  const parsed = new Date(`${value} 12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function toDisplayDate(value) {
  if (!value) return "May 22, 2026";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function rowToItem(row, memberNames) {
  const fullDate = toDisplayDate(row.scheduled_date);
  return {
    id: row.id,
    title: row.title,
    type: row.request_type,
    description: row.description || "",
    date: getShortDay(fullDate),
    fullDate,
    time: row.time_label || "Flexible time",
    window: row.window_label || "Flexible",
    status: row.status,
    requestedBy: memberNames[row.requested_by] || "Mom",
    claimedBy: row.claimed_by ? memberNames[row.claimed_by] || "" : "",
    completedBy: row.completed_by ? memberNames[row.completed_by] || "" : "",
    location: row.location || "Home",
    urgency: row.status === "Completed" ? "done" : "",
    icon: row.icon || "custom"
  };
}

function itemToRow(item, context) {
  return {
    circle_id: context.circleId,
    title: item.title,
    description: item.description,
    request_type: item.type,
    status: item.status || "Requested",
    scheduled_date: toDatabaseDate(item.fullDate),
    time_label: item.time,
    window_label: item.window || "Flexible",
    location: item.location,
    requested_by: context.memberId,
    claimed_by: item.status === "Claimed" || item.status === "Completed" ? context.memberId : null,
    completed_by: item.status === "Completed" ? context.memberId : null,
    icon: item.icon || "custom"
  };
}

function normalizeUsername(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validatePassword(value) {
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(value)) return "Password needs at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password needs at least one lowercase letter.";
  if (!/[0-9]/.test(value)) return "Password needs at least one number.";
  return "";
}

function appRedirectUrl(mode = "confirmed") {
  const url = new URL(window.location.href);
  url.hash = "";
  url.search = mode === "reset" ? "?mode=reset" : "";
  return url.toString();
}

async function loadTeamVioletData() {
  if (!supabase) {
    return { items: initialItems, context: null, profile: null, message: "Add your Supabase key to turn on syncing." };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const session = sessionData.session;
  if (!session?.user) {
    return { items: initialItems, context: null, profile: null, message: "Sign in to sync Team Violet." };
  }

  const user = session?.user;
  if (!user) throw new Error("Supabase sign-in did not return a user.");
  const metadataUsername = normalizeUsername(user.user_metadata?.username || "");
  const displayName = metadataUsername || user.user_metadata?.display_name || user.email || "Mom";

  const { data: ensuredMembership, error: ensureError } = await supabase
    .rpc("ensure_team_violet_circle", {
      circle_name: "Team Violet",
      join_code_hash_input: `team-violet-${user.id}`,
      display_name: displayName,
      username_input: metadataUsername
    })
    .single();
  if (ensureError) throw ensureError;

  const context = { circleId: ensuredMembership.circle_id, memberId: ensuredMembership.member_id };
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, email, avatar_icon")
    .eq("id", user.id)
    .maybeSingle();
  const userProfile = {
    displayName: profile?.username || profile?.display_name || displayName,
    username: profile?.username || metadataUsername || "",
    email: profile?.email || user.email || "",
    avatarIcon: profile?.avatar_icon || "violet_flower"
  };
  await seedHelpRequestsIfEmpty(context);
  const items = await fetchHelpRequests(context, userProfile.displayName);
  return { items, context, profile: userProfile, message: "Connected to Supabase." };
}

async function signInWithEmail(email, password) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) throw new Error("Enter your email and password.");
  if (!isValidEmail(cleanEmail)) throw new Error("Enter a valid email address.");

  const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
  if (error) throw error;
}

async function createAccountWithPassword({ username, email, password, confirmPassword }) {
  const cleanUsername = normalizeUsername(username);
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanUsername || !cleanEmail || !password) throw new Error("Enter a username, email, and password.");
  if (cleanUsername.length < 3) throw new Error("Username must be at least 3 characters.");
  if (!isValidEmail(cleanEmail)) throw new Error("Enter a valid email address.");
  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(passwordError);
  if (password !== confirmPassword) throw new Error("Passwords do not match.");

  const { data: isAvailable, error: usernameError } = await supabase.rpc("username_is_available", {
    username_input: cleanUsername
  });
  if (usernameError) throw usernameError;
  if (!isAvailable) throw new Error("That username is already taken. Please choose another.");

  await supabase.auth.signOut();
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      emailRedirectTo: appRedirectUrl("confirmed"),
      data: {
        username: cleanUsername,
        display_name: cleanUsername
      }
    }
  });
  if (error) throw error;
  localStorage.setItem("teamVioletLastUsername", cleanUsername);
  return {
    message: "Check your email to confirm your account.",
    signedIn: Boolean(data.session)
  };
}

async function sendPasswordReset(email) {
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) throw new Error("Enter a valid email address.");
  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: appRedirectUrl("reset")
  });
  if (error) throw error;
}

async function updateAccountEmail(email) {
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) throw new Error("Enter a valid email address.");
  const { error } = await supabase.auth.updateUser(
    { email: cleanEmail },
    { emailRedirectTo: appRedirectUrl("confirmed") }
  );
  if (error) throw error;
}

async function updateAccountPassword(password, confirmPassword) {
  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(passwordError);
  if (password !== confirmPassword) throw new Error("Passwords do not match.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

async function seedHelpRequestsIfEmpty(context) {
  const { count, error } = await supabase
    .from("help_requests")
    .select("id", { count: "exact", head: true })
    .eq("circle_id", context.circleId);
  if (error) throw error;
  if (count !== 0) return;

  const rows = initialItems.map((item) =>
    itemToRow({ ...item, status: item.status === "Completed" ? "Completed" : "Requested" }, context)
  );
  const { error: insertError } = await supabase.from("help_requests").insert(rows);
  if (insertError) throw insertError;
}

async function fetchHelpRequests(context, currentMemberName = "Mom") {
  const { data: members, error: membersError } = await supabase
    .from("circle_members")
    .select("id, display_name")
    .eq("circle_id", context.circleId);
  if (membersError) throw membersError;

  const memberNames = Object.fromEntries((members || []).map((member) => [member.id, member.display_name || "Family"]));
  memberNames[context.memberId] = currentMemberName;

  const { data, error } = await supabase
    .from("help_requests")
    .select("*")
    .eq("circle_id", context.circleId)
    .order("scheduled_date", { ascending: true });
  if (error) throw error;

  return (data || []).map((row) => rowToItem(row, memberNames));
}

async function getSignedPhotoUrl(storagePath) {
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(storagePath, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

async function fetchMemoryPhotos(context, helpRequestId) {
  if (!supabase || !context || !helpRequestId) return [];

  const { data, error } = await supabase
    .from("memory_photos")
    .select("id, storage_path, caption, created_at")
    .eq("circle_id", context.circleId)
    .eq("help_request_id", helpRequestId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return Promise.all(
    (data || []).map(async (photo) => ({
      ...photo,
      url: await getSignedPhotoUrl(photo.storage_path)
    }))
  );
}

async function uploadMemoryPhoto(file, context, helpRequest) {
  if (!supabase || !context) throw new Error("Add your Supabase key before uploading photos.");
  if (!helpRequest?.id) throw new Error("Choose a completed activity before uploading photos.");
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Please choose a photo smaller than 10 MB.");

  const safeName = file.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
  const storagePath = `${context.circleId}/${helpRequest.id}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data: photo, error: insertError } = await supabase
    .from("memory_photos")
    .insert({
      circle_id: context.circleId,
      help_request_id: helpRequest.id,
      uploaded_by: context.memberId,
      storage_bucket: PHOTO_BUCKET,
      storage_path: storagePath,
      caption: file.name
    })
    .select("id, storage_path, caption, created_at")
    .single();
  if (insertError) throw insertError;

  return { ...photo, url: await getSignedPhotoUrl(photo.storage_path) };
}

async function deleteMemoryPhoto(photo, context) {
  if (!supabase || !context) throw new Error("Add your Supabase key before deleting photos.");
  if (!photo?.id || !photo?.storage_path) throw new Error("This photo is missing its Supabase storage details.");

  const { error: rowError } = await supabase
    .from("memory_photos")
    .delete()
    .eq("id", photo.id)
    .eq("circle_id", context.circleId);
  if (rowError) throw rowError;

  const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
  if (storageError) throw storageError;
}

function formatNoteTime(value) {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) return "Just now";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function rowToNote(row, memberNames = {}) {
  return {
    id: row.id,
    body: row.body,
    author: memberNames[row.member_id] || "Mom",
    createdAt: row.created_at,
    saved: true
  };
}

async function fetchMemoryNotes(context, helpRequestId) {
  if (!supabase || !context || !helpRequestId) return [];

  const { data: members, error: membersError } = await supabase
    .from("circle_members")
    .select("id, display_name")
    .eq("circle_id", context.circleId);
  if (membersError) throw membersError;

  const memberNames = Object.fromEntries((members || []).map((member) => [member.id, member.display_name || "Family"]));

  const { data, error } = await supabase
    .from("memory_notes")
    .select("id, member_id, body, created_at")
    .eq("circle_id", context.circleId)
    .eq("help_request_id", helpRequestId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data || []).map((row) => rowToNote(row, memberNames));
}

async function createMemoryNote(body, context, helpRequest, authorName = "Mom") {
  if (!supabase || !context) throw new Error("Add your Supabase key before saving notes.");
  if (!helpRequest?.id) throw new Error("Choose a completed activity before saving notes.");

  const { data, error } = await supabase
    .from("memory_notes")
    .insert({
      circle_id: context.circleId,
      help_request_id: helpRequest.id,
      member_id: context.memberId,
      body
    })
    .select("id, member_id, body, created_at")
    .single();
  if (error) throw error;

  return rowToNote(data, { [context.memberId]: authorName });
}

async function updateMemoryNote(noteId, body, context) {
  const { data, error } = await supabase
    .from("memory_notes")
    .update({ body })
    .eq("id", noteId)
    .eq("circle_id", context.circleId)
    .select("id, member_id, body, created_at")
    .single();
  if (error) throw error;

  return rowToNote(data, { [context.memberId]: "Mom" });
}

async function deleteMemoryNote(noteId, context) {
  const { error } = await supabase.from("memory_notes").delete().eq("id", noteId).eq("circle_id", context.circleId);
  if (error) throw error;
}

const nav = [
  { id: "home", label: "Home", icon: Home },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "tasks", label: "Help Requests", icon: CheckCircle2 },
  { id: "memories", label: "Memories", icon: Image },
  { id: "account", label: "Account", icon: Settings }
];

function App() {
  const [page, setPage] = useState("home");
  const [items, setItems] = useState(initialItems);
  const [activeItemId, setActiveItemId] = useState(7);
  const [editingItemId, setEditingItemId] = useState(null);
  const [dbContext, setDbContext] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(!isSupabaseConfigured);
  const [authMode, setAuthMode] = useState("signin");
  const [connectionMessage, setConnectionMessage] = useState(
    isSupabaseConfigured ? "Connecting to Supabase..." : "Add your Supabase key to turn on syncing."
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return { month: today.getMonth(), year: today.getFullYear() };
  });
  const activeItem = items.find((item) => item.id === activeItemId) ?? items[0];

  const refreshAuthUser = useCallback(async () => {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      setAuthUser(null);
      return null;
    }
    setAuthUser(data.user);
    return data.user;
  }, []);

  const refreshTeamData = useCallback(() => {
    setIsLoadingData(true);
    return loadTeamVioletData()
      .then(({ items: loadedItems, context, profile, message }) => {
        setItems(loadedItems);
        setDbContext(context);
        setUserProfile(profile);
        setActiveItemId(loadedItems[0]?.id ?? null);
        setConnectionMessage(message);
      })
      .catch((error) => {
        setConnectionMessage(`Supabase is set up, but could not sync yet: ${error.message}`);
      })
      .finally(() => {
        setIsLoadingData(false);
      });
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;

    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;
      if (data.session?.user) {
        const { data: userData } = await supabase.auth.getUser();
        if (isMounted) setAuthUser(userData.user || data.session.user);
      }
      if (isMounted) setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("reset");
      }
      setAuthUser(session?.user || null);
      if (!session?.user) {
        setDbContext(null);
        setUserProfile(null);
        setItems(initialItems);
        setPage("home");
      }
      setAuthChecked(true);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !authUser?.email_confirmed_at) {
      setIsLoadingData(false);
      return;
    }

    let isMounted = true;

    loadTeamVioletData()
      .then(({ items: loadedItems, context, profile, message }) => {
        if (!isMounted) return;
        setItems(loadedItems);
        setDbContext(context);
        setUserProfile(profile);
        setActiveItemId(loadedItems[0]?.id ?? null);
        setConnectionMessage(message);
      })
      .catch((error) => {
        if (!isMounted) return;
        setConnectionMessage(`Supabase is set up, but could not sync yet: ${error.message}`);
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authUser?.id, authUser?.email_confirmed_at]);

  const currentUserName = userProfile?.displayName || userProfile?.username || "Mom";

  const counts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { Requested: 0, Claimed: 0, Completed: 0 }
    );
  }, [items]);

  async function updateStatus(id, status) {
    let nextItem = null;
    setItems((current) =>
      current.map((item) =>
        {
          if (item.id !== id) return item;
          nextItem = {
              ...item,
              status,
              claimedBy: status === "Claimed" ? currentUserName : status === "Requested" ? "" : item.claimedBy,
              completedBy: status === "Completed" ? item.claimedBy || currentUserName : status === "Requested" ? "" : item.completedBy,
              completedAt: status === "Completed" ? item.completedAt || new Date().toISOString() : ""
          };
          return nextItem;
        }
      )
    );

    if (supabase && dbContext && nextItem) {
      const row = itemToRow(nextItem, dbContext);
      const { error } = await supabase
        .from("help_requests")
        .update({
          status: row.status,
          claimed_by: row.claimed_by,
          completed_by: row.completed_by,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("circle_id", dbContext.circleId);
      if (error) setConnectionMessage(`Could not save status: ${error.message}`);
    }
  }

  async function deleteItem(id) {
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

    if (supabase && dbContext) {
      const { error } = await supabase.from("help_requests").delete().eq("id", id).eq("circle_id", dbContext.circleId);
      if (error) setConnectionMessage(`Could not delete request: ${error.message}`);
    }
  }

  async function saveItem(id, updates) {
    let nextItem = null;
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const statusAfterSave = updates.status ?? item.status;
        nextItem = {
          ...item,
          ...updates,
          completedAt: statusAfterSave === "Completed" ? item.completedAt || new Date().toISOString() : ""
        };
        return nextItem;
      })
    );
    setEditingItemId(null);

    if (supabase && dbContext && nextItem) {
      const { error } = await supabase
        .from("help_requests")
        .update({ ...itemToRow(nextItem, dbContext), updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("circle_id", dbContext.circleId);
      if (error) setConnectionMessage(`Could not save request: ${error.message}`);
    }
  }

  async function addItem(item) {
    const localItem = { ...item, id: Date.now(), requestedBy: currentUserName, status: "Requested", icon: item.icon || "custom", urgency: "new" };
    setItems((current) => [localItem, ...current]);

    if (supabase && dbContext) {
      const { data, error } = await supabase.from("help_requests").insert(itemToRow(localItem, dbContext)).select("*").single();
      if (error) {
        setConnectionMessage(`Could not create request: ${error.message}`);
        return;
      }
      const refreshed = await fetchHelpRequests(dbContext, currentUserName);
      setItems(refreshed);
      setActiveItemId(data.id);
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setAuthUser(null);
    setDbContext(null);
    setUserProfile(null);
    setItems(initialItems);
    setPage("home");
    setAuthMode("signin");
  }

  if (!isSupabaseConfigured) {
    return <AuthLanding mode="setup" setMode={setAuthMode} message="Add your Supabase URL and publishable key before accounts can be used." />;
  }

  if (!authChecked) {
    return <AuthLanding mode="loading" setMode={setAuthMode} message="Checking your account..." />;
  }

  if (!authUser?.email_confirmed_at) {
    return (
      <AuthLanding
        mode={authMode}
        setMode={setAuthMode}
        message={authUser ? "Check your email to confirm your account." : ""}
        onAuthChange={async () => {
          const user = await refreshAuthUser();
          if (user?.email_confirmed_at) await refreshTeamData();
        }}
      />
    );
  }

  return (
    <div className="app">
      <Header page={page} setPage={setPage} userProfile={userProfile} onSignOut={signOut} />
      <main>
        <ConnectionBanner message={connectionMessage} isLoading={isLoadingData} connected={Boolean(dbContext)} />
        {page === "home" && <HomePage onSignIn={() => setPage("account")} onCreateAccount={() => setPage("account")} />}
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
        {page === "tasks" && <TasksPage items={items} counts={counts} updateStatus={updateStatus} addItem={addItem} saveItem={saveItem} currentUserName={currentUserName} />}
        {page === "memories" && (
          <MemoriesPage
            completedItems={items.filter((item) => item.status === "Completed")}
            dbContext={dbContext}
            currentUserName={currentUserName}
            saveItem={saveItem}
          />
        )}
        {page === "account" && (
          <AccountSettingsPage
            user={authUser}
            profile={userProfile}
            onProfileChange={refreshTeamData}
            onUserChange={refreshAuthUser}
            onDeleted={signOut}
          />
        )}
      </main>
      <MobileNav page={page} setPage={setPage} />
    </div>
  );
}

function ConnectionBanner({ message, isLoading, connected }) {
  return (
    <div className={`connection-banner ${connected ? "connected" : "pending"}`} role="status">
      <span>{isLoading ? "Syncing" : connected ? "Synced" : "Local mode"}</span>
      {message}
    </div>
  );
}

function VioletFlowerIcon({ size = 34 }) {
  return (
    <span className="violet-flower-icon" style={{ width: size, height: size }} aria-hidden="true">
      <Flower2 size={Math.round(size * 0.66)} />
    </span>
  );
}

function Header({ page, setPage, userProfile, onSignOut }) {
  const displayName = userProfile?.displayName || "Account";
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
      <button className="profile-button" aria-label="Open account settings" onClick={() => setPage("account")}>
        <VioletFlowerIcon />
        <span>{displayName}</span>
      </button>
      <button className="signout-button" type="button" onClick={onSignOut} aria-label="Sign out">
        <LogOut size={18} />
      </button>
    </header>
  );
}

function AuthLanding({ mode, setMode, message, onAuthChange }) {
  return (
    <div className="app auth-app">
      <main className="auth-welcome">
        <section className="auth-welcome-copy">
          <img src="/assets/violet-logo.png" alt="" />
          <h1>Team Violet</h1>
          <p>Sign in to coordinate family help, visits, and memories.</p>
          {message && <p className="auth-message standalone">{message}</p>}
        </section>
        {mode === "setup" || mode === "loading" ? (
          <section className="auth-panel embedded">
            <h2>{mode === "setup" ? "Supabase setup needed" : "Please wait"}</h2>
            <p>{message}</p>
          </section>
        ) : (
          <AuthPanel mode={mode} setMode={setMode} onAuthChange={onAuthChange} embedded />
        )}
      </main>
    </div>
  );
}

function HomePage({ onSignIn, onCreateAccount }) {
  return (
    <section className="home-grid page-shell">
      <div className="hero-copy">
        <h1>Coordinate care, visits, and family memories with ease.</h1>
        <p>A simple way for grandparents, extended family, friends, and parents to stay connected, help out, and make memories together.</p>
        <div className="hero-actions">
          <button className="primary signup-action" onClick={onSignIn}>
            <Users size={21} />
            <span>Sign in</span>
          </button>
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

function AuthPanel({ mode, setMode, onClose, onAuthChange, embedded = false }) {
  const lastUsername = localStorage.getItem("teamVioletLastUsername") || "";
  const [form, setForm] = useState({
    username: lastUsername,
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCreateMode = mode === "create";
  const isForgotMode = mode === "forgot";
  const isResetMode = mode === "reset";

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(
      isCreateMode
        ? "Creating account..."
        : isForgotMode
          ? "Sending reset email..."
          : isResetMode
            ? "Saving new password..."
            : "Signing in..."
    );
    try {
      if (isCreateMode) {
        const result = await createAccountWithPassword(form);
        setMessage(result.message);
        if (result.signedIn && onAuthChange) await onAuthChange();
      } else if (isForgotMode) {
        await sendPasswordReset(form.email);
        setMessage("Check your email for the password reset link.");
      } else if (isResetMode) {
        await updateAccountPassword(form.password, form.confirmPassword);
        setMessage("Your password has been updated.");
        if (onAuthChange) await onAuthChange();
      } else {
        await signInWithEmail(form.email, form.password);
        setMessage("Signed in.");
        if (onAuthChange) await onAuthChange();
      }
      if (!isCreateMode && !isForgotMode && !isResetMode && onClose) onClose();
    } catch (error) {
      setMessage(friendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = isCreateMode ? "Create Account" : isForgotMode ? "Reset Password" : isResetMode ? "New Password" : "Sign in";
  const intro = isCreateMode
    ? "Choose a username, email, and strong password for Team Violet."
    : isForgotMode
      ? "Enter your email and Supabase will send a secure reset link."
      : isResetMode
        ? "Enter a new strong password for your account."
        : "Use your email and password.";

  return (
    <div className={embedded ? "" : "auth-overlay"} role="dialog" aria-modal={!embedded} aria-labelledby="auth-title">
      <section className={`auth-panel ${embedded ? "embedded" : ""}`}>
        <button className="auth-close" type="button" onClick={onClose} aria-label="Close sign in">x</button>
        <h2 id="auth-title">{title}</h2>
        <p>{intro}</p>
        <form onSubmit={submit}>
          {isCreateMode && (
          <label>
            Username
            <input
              value={form.username}
              onChange={(event) => updateField("username", event.target.value)}
              autoComplete="username"
              placeholder="mom, grandma-rose, auntie-kim"
            />
          </label>
          )}
          {!isResetMode && (
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
          )}
          {!isForgotMode && (
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              autoComplete={isCreateMode || isResetMode ? "new-password" : "current-password"}
              placeholder="At least 8 characters"
            />
          </label>
          )}
          {(isCreateMode || isResetMode) && (
            <label>
              Confirm password
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) => updateField("confirmPassword", event.target.value)}
                autoComplete="new-password"
                placeholder="Re-enter password"
              />
            </label>
          )}
          <button className="primary wide" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : isCreateMode
                ? "Create Account"
                : isForgotMode
                  ? "Send Reset Link"
                  : isResetMode
                    ? "Update Password"
                    : "Sign in"}
          </button>
        </form>
        <div className="auth-links">
          {!isResetMode && (
            <button className="auth-switch" type="button" onClick={() => setMode(isCreateMode ? "signin" : "create")}>
              {isCreateMode ? "Already have an account? Sign in" : "Create Account"}
            </button>
          )}
          {!isCreateMode && !isForgotMode && !isResetMode && (
            <button className="auth-switch" type="button" onClick={() => setMode("forgot")}>Forgot Password?</button>
          )}
          {(isForgotMode || isResetMode) && (
            <button className="auth-switch" type="button" onClick={() => setMode("signin")}>Back to Sign in</button>
          )}
        </div>
        {message && <p className="auth-message">{message}</p>}
      </section>
    </div>
  );
}

function friendlyAuthError(error) {
  const message = error?.message || "Something went wrong. Please try again.";
  if (/duplicate key|profiles_username_lower_key|already taken/i.test(message)) {
    return "That username is already taken. Please choose another.";
  }
  if (/email not confirmed/i.test(message)) return "Check your email to confirm your account before signing in.";
  if (/invalid login credentials/i.test(message)) return "The email or password is not correct.";
  return message;
}

function AccountSettingsPage({ user, profile, onProfileChange, onUserChange, onDeleted }) {
  const [username, setUsername] = useState(profile?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [passwords, setPasswords] = useState({ password: "", confirmPassword: "" });
  const [deleteText, setDeleteText] = useState("");
  const [message, setMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setUsername(profile?.username || "");
    setEmail(user?.email || "");
  }, [profile?.username, user?.email]);

  async function saveUsername(event) {
    event.preventDefault();
    const cleanUsername = normalizeUsername(username);
    if (cleanUsername.length < 3) {
      setMessage("Username must be at least 3 characters.");
      return;
    }

    setIsSavingProfile(true);
    setMessage("Saving username...");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: cleanUsername, display_name: cleanUsername, avatar_icon: "violet_flower" })
        .eq("id", user.id);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { username: cleanUsername, display_name: cleanUsername } });
      await onProfileChange();
      setMessage("Username updated.");
    } catch (error) {
      setMessage(friendlyAuthError(error));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function saveEmail(event) {
    event.preventDefault();
    setIsSavingEmail(true);
    setMessage("Sending email change confirmation...");
    try {
      await updateAccountEmail(email);
      await onUserChange();
      setMessage("Check your new email address to confirm the change.");
    } catch (error) {
      setMessage(friendlyAuthError(error));
    } finally {
      setIsSavingEmail(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setIsSavingPassword(true);
    setMessage("Updating password...");
    try {
      await updateAccountPassword(passwords.password, passwords.confirmPassword);
      setPasswords({ password: "", confirmPassword: "" });
      setMessage("Password updated.");
    } catch (error) {
      setMessage(friendlyAuthError(error));
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function deleteAccount(event) {
    event.preventDefault();
    if (deleteText !== "DELETE") {
      setMessage("Type DELETE to confirm account deletion.");
      return;
    }

    setIsDeleting(true);
    setMessage("Deleting account...");
    try {
      const { error } = await supabase.functions.invoke("delete-account", { body: { confirm: true } });
      if (error) throw error;
      await supabase.auth.signOut();
      await onDeleted();
    } catch (error) {
      setMessage(friendlyAuthError(error));
      setIsDeleting(false);
    }
  }

  return (
    <section className="page-shell account-page">
      <PageTitle icon={User} title="Account Settings" extra="Manage your Team Violet sign-in and profile." />
      <div className="account-layout">
        <section className="account-card profile-summary">
          <VioletFlowerIcon size={76} />
          <div>
            <h2>{profile?.displayName || profile?.username || "Team Violet account"}</h2>
            <p>{user?.email}</p>
          </div>
        </section>

        <form className="account-card" onSubmit={saveUsername}>
          <h2>Profile</h2>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <button className="primary" type="submit" disabled={isSavingProfile}>
            {isSavingProfile ? "Saving..." : "Save Username"}
          </button>
        </form>

        <form className="account-card" onSubmit={saveEmail}>
          <h2>Email</h2>
          <label>
            Email address
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </label>
          <button className="primary" type="submit" disabled={isSavingEmail}>
            {isSavingEmail ? "Sending..." : "Change Email"}
          </button>
        </form>

        <form className="account-card" onSubmit={savePassword}>
          <h2>Password</h2>
          <label>
            New password
            <input
              type="password"
              value={passwords.password}
              onChange={(event) => setPasswords((current) => ({ ...current, password: event.target.value }))}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))}
              autoComplete="new-password"
            />
          </label>
          <button className="primary" type="submit" disabled={isSavingPassword}>
            {isSavingPassword ? "Saving..." : "Change Password"}
          </button>
        </form>

        <form className="account-card danger-card" onSubmit={deleteAccount}>
          <h2>Delete Account</h2>
          <p>This action permanently deletes your account and cannot be undone.</p>
          <label>
            Type DELETE to confirm
            <input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} />
          </label>
          <button className="delete-option" type="submit" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Account"}
          </button>
        </form>
      </div>
      {message && <p className="account-message">{message}</p>}
    </section>
  );
}

function CalendarPage({ items, activeItem, setActiveItemId, updateStatus, deleteItem, editingItemId, setEditingItemId, saveItem, visibleMonth, setVisibleMonth }) {
  const calendarCells = getCalendarCells(visibleMonth.year, visibleMonth.month);
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(visibleMonth.year, visibleMonth.month, 1));
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
              const isSelectedDate = activeDate && activeDate.year === cell.year && activeDate.month === cell.month && activeDate.day === cell.day;
              return (
                <button
                  key={`${cell.year}-${cell.month}-${cell.day}-${index}`}
                  className={`${cell.muted ? "muted" : ""} ${isSelectedDate ? "selected-date" : ""}`}
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

function TasksPage({ items, counts, updateStatus, addItem, saveItem, currentUserName }) {
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
          {isCreating && <NewRequestForm currentUserName={currentUserName} onCancel={() => setIsCreating(false)} onCreate={(item) => { addItem(item); setFilter("Requested"); setIsCreating(false); }} />}
          <div className="tabs" role="tablist" aria-label="Task status filter">
            {["Requested", "Claimed", "Completed"].map((tab) => (
              <button key={tab} className={filter === tab ? "selected" : ""} onClick={() => setFilter(tab)}>
                {tab} <span>{tab === "Requested" ? counts.Requested : counts[tab]}</span>
              </button>
            ))}
          </div>
          <div className="task-list">
            {filtered.length ? filtered.map((item) => (
              <React.Fragment key={item.id}>
                <TaskRow item={item} updateStatus={updateStatus} onEdit={() => { setIsCreating(false); setEditingTaskId(item.id); }} />
                {editingTaskId === item.id && (
                  <TaskEditForm
                    item={item}
                    currentUserName={currentUserName}
                    onCancel={() => setEditingTaskId(null)}
                    onSave={(id, updates) => {
                      saveItem(id, updates);
                      setEditingTaskId(null);
                      setFilter(updates.status || item.status);
                    }}
                  />
                )}
              </React.Fragment>
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

function NewRequestForm({ onCancel, onCreate, currentUserName }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Meal",
    fullDate: "May 22, 2026",
    date: "Fri",
    time: "Flexible time",
    location: "Home",
    requestedBy: currentUserName,
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

function TaskEditForm({ item, onCancel, onSave, currentUserName }) {
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
    const claimedBy = form.status === "Requested" ? "" : form.claimedBy.trim() || currentUserName;
    const completedBy = form.status === "Completed" ? form.completedBy.trim() || claimedBy || currentUserName : "";
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

function taskDateTime(item) {
  const parsed = new Date(`${item?.fullDate || ""} ${item?.time || "12:00 PM"}`);
  if (Number.isNaN(parsed.getTime())) {
    const fallback = new Date(`${item?.fullDate || ""} 12:00:00`);
    return Number.isNaN(fallback.getTime()) ? 0 : fallback.getTime();
  }
  return parsed.getTime();
}

function MemoriesPage({ completedItems, dbContext, currentUserName, saveItem }) {
  const completedOptions = useMemo(
    () => [...completedItems].sort((a, b) => taskDateTime(b) - taskDateTime(a)),
    [completedItems]
  );
  const [selectedCompletedId, setSelectedCompletedId] = useState(completedOptions[0]?.id ?? "");
  const selectedCompleted = completedOptions.find((item) => String(item.id) === String(selectedCompletedId)) || completedOptions[0] || null;
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState([
    {
      id: "sample-grandma-note",
      body: "Ava loved the ducks and swings today. Such a beautiful morning together!",
      author: "Grandma Rose",
      createdAt: "2026-05-10T14:25:00",
      saved: false
    }
  ]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteDraft, setEditingNoteDraft] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({
    title: "",
    type: "",
    location: "",
    requestedBy: "",
    helper: "",
    fullDate: "",
    time: ""
  });

  useEffect(() => {
    if (!completedOptions.length) {
      setSelectedCompletedId("");
      return;
    }
    if (!completedOptions.some((item) => String(item.id) === String(selectedCompletedId))) {
      setSelectedCompletedId(completedOptions[0].id);
    }
  }, [completedOptions, selectedCompletedId]);

  useEffect(() => {
    setIsEditingActivity(false);
    setActivityForm({
      title: selectedCompleted?.title || "",
      type: selectedCompleted?.type || "",
      location: selectedCompleted?.location || "",
      requestedBy: selectedCompleted?.requestedBy || currentUserName,
      helper: selectedCompleted?.completedBy || selectedCompleted?.claimedBy || currentUserName,
      fullDate: selectedCompleted?.fullDate || "",
      time: selectedCompleted?.time || ""
    });
  }, [selectedCompleted?.id, currentUserName]);

  useEffect(() => {
    let isMounted = true;
    setPhotoMessage("");

    if (!supabase || !dbContext || !selectedCompleted?.id || typeof selectedCompleted.id !== "string") {
      setPhotos([]);
      return;
    }

    fetchMemoryPhotos(dbContext, selectedCompleted.id)
      .then((loadedPhotos) => {
        if (isMounted) setPhotos(loadedPhotos);
      })
      .catch((error) => {
        if (isMounted) setPhotoMessage(`Could not load photos: ${error.message}`);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCompleted?.id, dbContext]);

  useEffect(() => {
    let isMounted = true;
    setNoteMessage("");
    setEditingNoteId(null);
    setEditingNoteDraft("");
    setShowNoteInput(false);

    if (!supabase || !dbContext || !selectedCompleted?.id || typeof selectedCompleted.id !== "string") {
      setNotes([]);
      return;
    }

    fetchMemoryNotes(dbContext, selectedCompleted.id)
      .then((loadedNotes) => {
        if (isMounted) {
          setNotes(loadedNotes.length ? loadedNotes : []);
          setNoteMessage("");
        }
      })
      .catch((error) => {
        if (isMounted) setNoteMessage(`Could not load notes: ${error.message}`);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCompleted?.id, dbContext]);

  async function handlePhotoSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!supabase || !dbContext) {
      const localUrl = URL.createObjectURL(file);
      setPhotos((current) => [{ id: localUrl, url: localUrl, caption: file.name, localOnly: true }, ...current]);
      setPhotoMessage(
        isSupabaseConfigured
          ? "Photo selected. Enable anonymous sign-ins in Supabase before photos can be stored."
          : "Photo selected. Add your Supabase key to store photos in Supabase."
      );
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoMessage("Uploading photo...");
    try {
      const uploadedPhoto = await uploadMemoryPhoto(file, dbContext, selectedCompleted);
      setPhotos((current) => [uploadedPhoto, ...current]);
      setPhotoMessage("Photo uploaded to Supabase.");
    } catch (error) {
      setPhotoMessage(`Could not upload photo: ${error.message}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleDeletePhoto(photo) {
    setPhotoMessage("Deleting photo...");
    try {
      if (photo.localOnly) {
        URL.revokeObjectURL(photo.url);
      } else {
        await deleteMemoryPhoto(photo, dbContext);
      }
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      setPhotoMessage("Photo deleted.");
    } catch (error) {
      setPhotoMessage(`Could not delete photo: ${error.message}`);
    }
  }

  async function handleCreateNote(event) {
    event.preventDefault();
    const body = noteDraft.trim();
    if (!body) return;

    setIsSavingNote(true);
    setNoteMessage("Saving note...");
    try {
      if (supabase && dbContext) {
        const savedNote = await createMemoryNote(body, dbContext, selectedCompleted, currentUserName);
        setNotes((current) => [savedNote, ...current]);
        setNoteMessage("Note saved to Supabase.");
      } else {
        setNotes((current) => [
          { id: `local-note-${Date.now()}`, body, author: currentUserName, createdAt: new Date().toISOString(), saved: false },
          ...current
        ]);
        setNoteMessage(
          isSupabaseConfigured
            ? "Note added locally. Finish Supabase sync before notes can be stored."
            : "Note added locally. Add your Supabase key to store notes in Supabase."
        );
      }
      setNoteDraft("");
      setShowNoteInput(false);
    } catch (error) {
      setNoteMessage(`Could not save note: ${error.message}`);
    } finally {
      setIsSavingNote(false);
    }
  }

  function startEditNote(note) {
    setEditingNoteId(note.id);
    setEditingNoteDraft(note.body);
    setShowNoteInput(false);
  }

  async function handleSaveEditedNote(noteId) {
    const body = editingNoteDraft.trim();
    if (!body) return;

    setIsSavingNote(true);
    setNoteMessage("Saving changes...");
    try {
      if (supabase && dbContext && !String(noteId).startsWith("local-") && noteId !== "sample-grandma-note") {
        const updatedNote = await updateMemoryNote(noteId, body, dbContext);
        setNotes((current) => current.map((note) => (note.id === noteId ? updatedNote : note)));
        setNoteMessage("Note updated.");
      } else {
        setNotes((current) => current.map((note) => (note.id === noteId ? { ...note, body } : note)));
        setNoteMessage("Note updated locally.");
      }
      setEditingNoteId(null);
      setEditingNoteDraft("");
    } catch (error) {
      setNoteMessage(`Could not update note: ${error.message}`);
    } finally {
      setIsSavingNote(false);
    }
  }

  async function handleDeleteNote(noteId) {
    setIsSavingNote(true);
    setNoteMessage("Deleting note...");
    try {
      if (supabase && dbContext && !String(noteId).startsWith("local-") && noteId !== "sample-grandma-note") {
        await deleteMemoryNote(noteId, dbContext);
      }
      setNotes((current) => current.filter((note) => note.id !== noteId));
      setNoteMessage("Note deleted.");
    } catch (error) {
      setNoteMessage(`Could not delete note: ${error.message}`);
    } finally {
      setIsSavingNote(false);
    }
  }

  function updateActivityField(field, value) {
    setActivityForm((current) => ({ ...current, [field]: value }));
  }

  async function saveActivityDetails(event) {
    event.preventDefault();
    if (!selectedCompleted) return;
    const helper = activityForm.helper.trim() || currentUserName;
    await saveItem(selectedCompleted.id, {
      title: activityForm.title.trim() || selectedCompleted.title,
      type: activityForm.type.trim() || selectedCompleted.type,
      location: activityForm.location.trim() || selectedCompleted.location,
      requestedBy: activityForm.requestedBy.trim() || currentUserName,
      claimedBy: helper,
      completedBy: helper,
      fullDate: activityForm.fullDate.trim() || selectedCompleted.fullDate,
      date: getShortDay(activityForm.fullDate.trim()) || selectedCompleted.date,
      time: activityForm.time.trim() || selectedCompleted.time,
      status: "Completed"
    });
    setIsEditingActivity(false);
  }

  return (
    <section className="page-shell memories-page">
      <div className="memories-topline">
        <label className="completed-task-picker">
          Select Completed Task
          <select
            value={selectedCompleted?.id ?? ""}
            onChange={(event) => setSelectedCompletedId(event.target.value)}
            disabled={!completedOptions.length}
          >
            {completedOptions.length ? (
              completedOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullDate} - {item.title}
                </option>
              ))
            ) : (
              <option>No completed tasks yet</option>
            )}
          </select>
        </label>
        <div className="breadcrumbs">Shared Moments</div>
      </div>
      <div className="memory-layout">
        <div className="memory-main">
          <section className="memory-hero">
            <div>
              <h1>{selectedCompleted?.title ?? "No completed task selected"}</h1>
              <StatusBadge status="Completed" />
              <p>
                <CalendarDays size={18} /> {selectedCompleted?.fullDate ?? "Complete a task to start a memory"}
                {selectedCompleted?.time && <><Clock size={18} /> {selectedCompleted.time}</>}
              </p>
            </div>
            <div className="park-scene" aria-hidden="true">
              <img src="/assets/family.png" alt="" />
            </div>
          </section>
          <section className="photos-card">
            <h2>Photos</h2>
            <div className="photo-grid">
              {photos.map((photo) => (
                <figure className="photo-thumb" key={photo.id}>
                  <img src={photo.url} alt={photo.caption || "Uploaded family memory"} />
                  <button type="button" className="delete-photo-button" onClick={() => handleDeletePhoto(photo)} aria-label="Delete photo">
                    <Trash2 size={16} />
                  </button>
                  {photo.localOnly && <figcaption>Local preview</figcaption>}
                </figure>
              ))}
            </div>
            {photoMessage && <p className="photo-message">{photoMessage}</p>}
          </section>
          <section className="notes-card">
            <h2>Notes</h2>
            <div className="notes-list">
              {notes.map((note) => (
                <article className="note" key={note.id}>
                  {editingNoteId === note.id ? (
                    <div className="note-edit">
                      <textarea value={editingNoteDraft} onChange={(event) => setEditingNoteDraft(event.target.value)} aria-label="Edit note" autoFocus />
                      <div className="note-actions">
                        <button className="secondary small" type="button" onClick={() => handleSaveEditedNote(note.id)} disabled={isSavingNote}>Save</button>
                        <button className="ghost small" type="button" onClick={() => setEditingNoteId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p><b>{note.author}</b><small>{formatNoteTime(note.createdAt)}</small>{note.body}</p>
                  )}
                  {editingNoteId !== note.id && (
                    <div className="note-actions icon-actions">
                      <button type="button" onClick={() => startEditNote(note)} aria-label="Edit note"><Pencil size={16} /></button>
                      <button type="button" onClick={() => handleDeleteNote(note.id)} aria-label="Delete note"><Trash2 size={16} /></button>
                    </div>
                  )}
                </article>
              ))}
            </div>
            {showNoteInput && (
              <form className="note-input" onSubmit={handleCreateNote}>
                <span className="avatar">{currentUserName.slice(0, 1).toUpperCase()}</span>
                <input aria-label="Add a note" placeholder="Add a note..." value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} autoFocus />
                <button aria-label="Save note" disabled={isSavingNote || !noteDraft.trim()}><Send /></button>
              </form>
            )}
            {noteMessage && <p className="photo-message">{noteMessage}</p>}
          </section>
        </div>
        <aside className="memory-sidebar">
          <section className="details-card">
            <h2>Activity Details</h2>
            {isEditingActivity ? (
              <form className="activity-edit-form" onSubmit={saveActivityDetails}>
                <label>Title<input value={activityForm.title} onChange={(event) => updateActivityField("title", event.target.value)} /></label>
                <label>Activity Type<input value={activityForm.type} onChange={(event) => updateActivityField("type", event.target.value)} /></label>
                <label>Location<input value={activityForm.location} onChange={(event) => updateActivityField("location", event.target.value)} /></label>
                <label>Requested By<input value={activityForm.requestedBy} onChange={(event) => updateActivityField("requestedBy", event.target.value)} /></label>
                <label>Helper<input value={activityForm.helper} onChange={(event) => updateActivityField("helper", event.target.value)} /></label>
                <label>Date<input value={activityForm.fullDate} onChange={(event) => updateActivityField("fullDate", event.target.value)} /></label>
                <label>Time<input value={activityForm.time} onChange={(event) => updateActivityField("time", event.target.value)} /></label>
                <div className="panel-actions">
                  <button className="primary" type="submit">Save</button>
                  <button className="secondary" type="button" onClick={() => setIsEditingActivity(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <dl>
                  <dt>Activity Type</dt><dd>{selectedCompleted?.type ?? "Not selected"}</dd>
                  <dt>Location</dt><dd>{selectedCompleted?.location ?? "Not selected"}</dd>
                  <dt>Requested By</dt><dd>{selectedCompleted?.requestedBy || currentUserName}</dd>
                  <dt>Helper</dt><dd>{selectedCompleted?.completedBy || selectedCompleted?.claimedBy || currentUserName}</dd>
                </dl>
                <button className="secondary wide" type="button" onClick={() => setIsEditingActivity(true)} disabled={!selectedCompleted}>
                  <Pencil size={17} /> Edit Activity Details
                </button>
                <label className={`primary wide upload-action ${isUploadingPhoto ? "uploading" : ""}`}>
                  <input type="file" accept="image/*" onChange={handlePhotoSelected} disabled={isUploadingPhoto || !selectedCompleted} />
                  <Image size={18} /> {isUploadingPhoto ? "Uploading..." : "Add Photo"}
                </label>
                <button className="secondary wide" onClick={() => setShowNoteInput(true)} disabled={!selectedCompleted}>Add a Note</button>
              </>
            )}
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
  const isAssigned = item.status !== "Requested";
  const savedHelperName = item.claimedBy || item.completedBy || "";
  const helperName = savedHelperName && savedHelperName !== item.requestedBy ? savedHelperName : "Grandma Rose";
  const supportLabel = isAssigned ? "Helper" : "Requested by";
  const supportName = isAssigned ? helperName : item.requestedBy;
  return (
    <aside className="detail-panel">
      <div className="detail-date-note">{item.fullDate}</div>
      <h2>{item.title}</h2>
      <StatusBadge status={item.status} />
      <dl>
        <dt>Type</dt><dd>{item.type}</dd>
        <dt>When</dt><dd>{item.time}</dd>
        <dt>Location</dt><dd>{item.location}</dd>
        <dt>{supportLabel}</dt><dd>{supportName}</dd>
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
