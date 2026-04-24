import { Head, ViteReactSSG } from "vite-react-ssg";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useLocation, Link, NavLink, Navigate, useNavigate, useParams, Outlet } from "react-router-dom";
import { useQuery, useQueryClient, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { useSensors, useSensor, PointerSensor, TouchSensor, DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
const client = axios.create({
  baseURL: "http://localhost:4000",
  withCredentials: true
});
let accessToken = null;
const setAccessToken = (token) => {
  accessToken = token;
};
client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const csrfToken = localStorage.getItem("csrfToken") || document.cookie.split("; ").find((c) => c.startsWith("csrfToken="))?.split("=")[1];
        const { data } = await axios.post(
          `${"http://localhost:4000"}/api/auth/refresh`,
          {},
          { withCredentials: true, headers: { "x-csrf-token": csrfToken } }
        );
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(original);
      } catch {
        setAccessToken(null);
        window.dispatchEvent(new Event("auth:logout"));
      }
    }
    return Promise.reject(error);
  }
);
const AuthContext = createContext(null);
function parseToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}
function getCsrfToken() {
  return localStorage.getItem("csrfToken") || document.cookie.split("; ").find((c) => c.startsWith("csrfToken="))?.split("=")[1];
}
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const csrfToken = getCsrfToken();
    if (!csrfToken) {
      setLoading(false);
      return;
    }
    client.post("/api/auth/refresh", {}, { headers: { "x-csrf-token": csrfToken } }).then(({ data }) => {
      setAccessToken(data.accessToken);
      setUser(parseToken(data.accessToken));
    }).catch(() => {
    }).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setAccessToken(null);
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);
  const register = async (email, password) => {
    await client.post("/api/auth/register", { email, password });
  };
  const login = async (email, password) => {
    const { data } = await client.post("/api/auth/login", { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    if (data.csrfToken) localStorage.setItem("csrfToken", data.csrfToken);
    return data.user;
  };
  const logout = async () => {
    await client.post("/api/auth/logout");
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("csrfToken");
  };
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value: { user, loading, login, logout, register }, children });
}
function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
const linkClass = ({ isActive }) => isActive ? "font-serif text-sm tracking-wide text-imperial-gold" : "font-serif text-sm tracking-wide text-imperial-muted hover:text-imperial-gold transition-colors";
function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  const close = () => setOpen(false);
  const navLinks = [
    { to: "/books", label: "Books" },
    { to: "/series", label: "Series" },
    { to: "/authors", label: "Authors" },
    { to: "/primarchs", label: "Primarchs" }
  ];
  return /* @__PURE__ */ jsxs("header", { className: "bg-imperial-bg-mid border-b border-imperial-border relative z-40", children: [
    /* @__PURE__ */ jsxs("nav", { className: "max-w-6xl mx-auto px-4 py-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "font-serif text-xl text-imperial-gold tracking-wide", children: "Librarium" }),
      /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-6 text-sm", children: [
        navLinks.map(({ to, label }) => /* @__PURE__ */ jsx(NavLink, { to, className: linkClass, children: label }, to)),
        user ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(NavLink, { to: "/profile", className: linkClass, children: "Profile" }),
          user.role === "admin" && /* @__PURE__ */ jsx(NavLink, { to: "/admin", className: linkClass, children: "Admin" }),
          /* @__PURE__ */ jsx("span", { className: "w-px h-4 bg-imperial-border" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: logout,
              className: "font-serif text-sm tracking-wide text-imperial-muted hover:text-imperial-gold transition-colors",
              children: "Logout"
            }
          )
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(NavLink, { to: "/login", className: linkClass, children: "Login" }),
          /* @__PURE__ */ jsx(
            NavLink,
            {
              to: "/register",
              className: "font-serif text-sm tracking-wide border border-imperial-gold text-imperial-gold px-4 py-1.5 hover:bg-imperial-gold hover:text-imperial-bg transition-all",
              children: "Register"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: "md:hidden flex flex-col gap-1.5 p-1",
          onClick: () => setOpen(true),
          "aria-label": "Open menu",
          children: [
            /* @__PURE__ */ jsx("span", { className: "w-5 h-px bg-imperial-muted block" }),
            /* @__PURE__ */ jsx("span", { className: "w-5 h-px bg-imperial-muted block" }),
            /* @__PURE__ */ jsx("span", { className: "w-5 h-px bg-imperial-muted block" })
          ]
        }
      )
    ] }),
    open && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 bg-imperial-bg flex flex-col px-8 py-6 animate-fade-in", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-12", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", onClick: close, className: "font-serif text-2xl text-imperial-gold tracking-wide", children: "Librarium" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: close,
            className: "text-imperial-muted hover:text-imperial-gold text-2xl leading-none transition-colors",
            children: "✕"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("nav", { className: "flex flex-col", children: [
        navLinks.map(({ to, label }) => /* @__PURE__ */ jsx(
          NavLink,
          {
            to,
            onClick: close,
            className: ({ isActive }) => `font-serif text-3xl py-4 border-b border-imperial-border transition-colors ${isActive ? "text-imperial-gold" : "text-imperial-light/40 hover:text-imperial-light"}`,
            children: label
          },
          to
        )),
        user && /* @__PURE__ */ jsx(
          NavLink,
          {
            to: "/profile",
            onClick: close,
            className: ({ isActive }) => `font-serif text-3xl py-4 border-b border-imperial-border transition-colors ${isActive ? "text-imperial-gold" : "text-imperial-light/40 hover:text-imperial-light"}`,
            children: "Profile"
          }
        ),
        user?.role === "admin" && /* @__PURE__ */ jsx(
          NavLink,
          {
            to: "/admin",
            onClick: close,
            className: ({ isActive }) => `font-serif text-3xl py-4 border-b border-imperial-border transition-colors ${isActive ? "text-imperial-gold" : "text-imperial-light/40 hover:text-imperial-light"}`,
            children: "Admin"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-auto flex items-center gap-6 text-sm", children: user ? /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            logout();
            close();
          },
          className: "font-serif text-sm tracking-wide text-imperial-muted hover:text-imperial-gold transition-colors",
          children: "Logout"
        }
      ) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Link, { to: "/login", onClick: close, className: "font-serif text-sm tracking-wide text-imperial-muted hover:text-imperial-gold transition-colors", children: "Login" }),
        /* @__PURE__ */ jsx(Link, { to: "/register", onClick: close, className: "font-serif text-sm tracking-wide border border-imperial-gold text-imperial-gold px-4 py-1.5 hover:bg-imperial-gold hover:text-imperial-bg transition-all", children: "Register" })
      ] }) })
    ] })
  ] });
}
const SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/AleksandarRadivojevic1",
    icon: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "w-5 h-5", children: /* @__PURE__ */ jsx("path", { d: "M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" }) })
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/aleksandar-radivojevic",
    icon: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "w-5 h-5", children: /* @__PURE__ */ jsx("path", { d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" }) })
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/acko___/",
    icon: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "w-5 h-5", children: /* @__PURE__ */ jsx("path", { d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" }) })
  }
];
function Footer() {
  return /* @__PURE__ */ jsx("footer", { className: "border-t border-imperial-border mt-auto", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 py-10", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-8", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-serif text-xl text-imperial-gold tracking-wide mb-1", children: "Librarium" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-imperial-muted tracking-widest uppercase", children: "Chronicles of the Warhammer Universe" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4", children: SOCIALS.map(({ label, href, icon }) => /* @__PURE__ */ jsx(
        "a",
        {
          href,
          target: "_blank",
          rel: "noopener noreferrer",
          "aria-label": label,
          className: "text-imperial-muted hover:text-imperial-gold transition-colors",
          children: icon
        },
        label
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1 h-px bg-imperial-border" }),
      /* @__PURE__ */ jsx("span", { className: "text-imperial-gold/30 text-xs tracking-widest", children: "✦" }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 h-px bg-imperial-border" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-xs text-imperial-muted/50 leading-relaxed", children: [
      "Fan portfolio project. Not affiliated with Games Workshop.",
      " ",
      "Warhammer is a trademark of Games Workshop Ltd."
    ] })
  ] }) });
}
function VerificationBanner() {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  if (!user || user.isVerified) return null;
  const resend = async () => {
    setLoading(true);
    try {
      await client.post("/api/auth/resend-verification", { email: user.email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "bg-imperial-gold/10 border-b border-imperial-gold/30 px-4 py-2.5 animate-slide-down", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap", children: [
    /* @__PURE__ */ jsxs("p", { className: "text-sm text-imperial-light/80", children: [
      /* @__PURE__ */ jsx("span", { className: "text-imperial-gold font-serif", children: "Verify your email" }),
      " ",
      "— check your inbox to activate your account."
    ] }),
    sent ? /* @__PURE__ */ jsx("span", { className: "text-xs text-imperial-gold/70 font-serif", children: "Sent — check your inbox." }) : /* @__PURE__ */ jsx(
      "button",
      {
        onClick: resend,
        disabled: loading,
        className: "text-xs font-serif tracking-widest uppercase text-imperial-gold hover:underline disabled:opacity-50 shrink-0",
        children: loading ? "Sending..." : "Resend Email"
      }
    )
  ] }) });
}
function Spinner() {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-center items-center py-20 gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative w-12 h-12", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full border border-imperial-gold/20 animate-ping" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full border-2 border-imperial-gold/10 border-t-imperial-gold animate-spin" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-[18px] rounded-full bg-imperial-gold/60" })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "font-serif text-xs text-imperial-gold/50 tracking-[0.3em] uppercase animate-pulse", children: "Loading" })
  ] });
}
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return /* @__PURE__ */ jsx(Spinner, {});
  if (!user) return /* @__PURE__ */ jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
  return children;
}
function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return /* @__PURE__ */ jsx(Spinner, {});
  if (!user || user.role !== "admin") return /* @__PURE__ */ jsx(Navigate, { to: "/", replace: true });
  return children;
}
function useFeatured() {
  return useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data } = await client.get("/api/featured");
      return data;
    }
  });
}
function BookCard({ book, compact = false }) {
  return /* @__PURE__ */ jsxs(Link, { to: `/books/${book.slug}`, className: "card flex flex-col group", children: [
    /* @__PURE__ */ jsx("div", { className: "aspect-[2/3] bg-imperial-bg-mid overflow-hidden", children: book.coverImage ? /* @__PURE__ */ jsx(
      "img",
      {
        src: book.coverImage,
        alt: book.title,
        className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      }
    ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-imperial-muted text-sm", children: "No cover" }) }),
    /* @__PURE__ */ jsxs("div", { className: `flex flex-col gap-1 ${compact ? "p-2" : "p-3"}`, children: [
      /* @__PURE__ */ jsx("h3", { className: `font-serif text-imperial-gold leading-tight line-clamp-2 ${compact ? "text-xs" : "text-sm"}`, children: book.title }),
      !compact && book.author && /* @__PURE__ */ jsx("p", { className: "text-xs text-imperial-muted", children: book.author.name }),
      !compact && book.series && /* @__PURE__ */ jsx("span", { className: "text-xs border border-imperial-gold/30 text-imperial-gold/70 px-2 py-0.5 rounded-full self-start", children: book.series.name })
    ] })
  ] });
}
const CARD_GAP = 16;
function FeaturedCarousel({ books }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const checkScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };
  useEffect(() => {
    checkScroll();
    const el = trackRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [books]);
  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.offsetWidth ?? 200;
    el.scrollBy({ left: dir * (cardWidth + CARD_GAP), behavior: "smooth" });
  };
  if (!books.length) return null;
  const showArrows = books.length > 5;
  return /* @__PURE__ */ jsxs("section", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl", children: "Featured" }),
      showArrows && /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => scroll(-1),
            disabled: !canScrollLeft,
            className: "w-8 h-8 flex items-center justify-center border border-imperial-border text-imperial-muted hover:text-imperial-gold hover:border-imperial-gold disabled:opacity-30 transition-colors",
            "aria-label": "Scroll left",
            children: "←"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => scroll(1),
            disabled: !canScrollRight,
            className: "w-8 h-8 flex items-center justify-center border border-imperial-border text-imperial-muted hover:text-imperial-gold hover:border-imperial-gold disabled:opacity-30 transition-colors",
            "aria-label": "Scroll right",
            children: "→"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        ref: trackRef,
        className: `flex gap-4 overflow-x-auto scrollbar-hide pb-1 ${showArrows ? "snap-x snap-mandatory" : "flex-wrap"}`,
        children: books.map((book) => /* @__PURE__ */ jsx(
          "div",
          {
            className: "snap-start shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)]",
            children: /* @__PURE__ */ jsx(BookCard, { book })
          },
          book.slug
        ))
      }
    )
  ] });
}
const SITE_NAME = "Librarium";
const SITE_URL = "https://librarium40k.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION = "Browse the chronicles of the Warhammer universe — books, series, primarchs, and the authors who shaped the lore.";
function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  jsonLd
}) {
  const { pathname } = useLocation();
  const url = canonical ?? `${SITE_URL}${pathname}`;
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Warhammer Book Library`;
  const ldJson = jsonLd && JSON.stringify(jsonLd).replace(/</g, "\\u003c");
  return /* @__PURE__ */ jsxs(Head, { children: [
    /* @__PURE__ */ jsx("title", { children: fullTitle }),
    /* @__PURE__ */ jsx("meta", { name: "description", content: description }),
    /* @__PURE__ */ jsx("link", { rel: "canonical", href: url }),
    noindex && /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex, nofollow" }),
    /* @__PURE__ */ jsx("meta", { property: "og:type", content: type }),
    /* @__PURE__ */ jsx("meta", { property: "og:url", content: url }),
    /* @__PURE__ */ jsx("meta", { property: "og:title", content: fullTitle }),
    /* @__PURE__ */ jsx("meta", { property: "og:description", content: description }),
    /* @__PURE__ */ jsx("meta", { property: "og:image", content: image }),
    /* @__PURE__ */ jsx("meta", { property: "og:site_name", content: SITE_NAME }),
    /* @__PURE__ */ jsx("meta", { property: "og:locale", content: "en_US" }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:card", content: "summary_large_image" }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: fullTitle }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: description }),
    /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: image }),
    ldJson && /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: ldJson })
  ] });
}
function HeroBanner() {
  return /* @__PURE__ */ jsxs("section", { className: "relative text-center py-28 mb-12 overflow-hidden", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0",
        style: {
          backgroundImage: `
            repeating-linear-gradient(45deg, rgba(201,168,76,0.05) 0px, rgba(201,168,76,0.05) 1px, transparent 1px, transparent 40px),
            repeating-linear-gradient(-45deg, rgba(201,168,76,0.05) 0px, rgba(201,168,76,0.05) 1px, transparent 1px, transparent 40px)
          `
        }
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0",
        style: { background: "radial-gradient(ellipse at center, transparent 30%, #111318 100%)" }
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute bottom-0 left-0 right-0 h-24",
        style: { background: "linear-gradient(to bottom, transparent, #111318)" }
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 animate-fade-in-up", children: [
      /* @__PURE__ */ jsx("p", { className: "text-imperial-muted text-xs tracking-widest uppercase mb-5", children: "In the grim darkness of the far future" }),
      /* @__PURE__ */ jsx("h1", { className: "text-5xl md:text-7xl mb-6 leading-none tracking-widest font-black", children: "Librarium" }),
      /* @__PURE__ */ jsx("p", { className: "text-imperial-light/60 max-w-lg mx-auto mb-8 text-base leading-relaxed", children: "Browse the chronicles of the Warhammer Universe - books, series, primarchs, and the authors who shaped the lore." }),
      /* @__PURE__ */ jsx(Link, { to: "/books", className: "btn-gold text-sm px-10 py-3", children: "Browse the Library" })
    ] })
  ] });
}
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Librarium",
  alternateName: "Librarium — Warhammer Book Library",
  url: "https://librarium40k.com",
  description: "A reference catalog of Warhammer 40,000 and Horus Heresy novels, series, authors, and Primarchs."
};
function Home() {
  const { data: featured = [], isLoading } = useFeatured();
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(SEO, { jsonLd: websiteJsonLd }),
    /* @__PURE__ */ jsx(HeroBanner, {}),
    isLoading ? /* @__PURE__ */ jsx(Spinner, {}) : /* @__PURE__ */ jsx(FeaturedCarousel, { books: featured })
  ] });
}
function useBooks(params = {}) {
  return useQuery({
    queryKey: ["books", params],
    queryFn: async () => {
      const { data } = await client.get("/api/books", { params });
      return data;
    }
  });
}
function useBook(slug) {
  return useQuery({
    queryKey: ["book", slug],
    queryFn: async () => {
      const { data } = await client.get(`/api/books/${slug}`);
      return data;
    },
    enabled: !!slug
  });
}
function useRelatedBooks(slug) {
  return useQuery({
    queryKey: ["book", slug, "related"],
    queryFn: async () => {
      const { data } = await client.get(`/api/books/${slug}/related`);
      return data;
    },
    enabled: !!slug
  });
}
const ERAS = [
  "Horus Heresy",
  "32nd Millennium",
  "41st Millennium",
  "42nd Millennium",
  "Age of Sigmar",
  "Old World"
];
function Select({ value, onChange, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsx(
      "select",
      {
        className: "input appearance-none pr-8 cursor-pointer font-serif text-imperial-gold",
        value,
        onChange,
        children
      }
    ),
    /* @__PURE__ */ jsx("span", { className: "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-imperial-muted text-xs", children: "▾" })
  ] });
}
function FilterSidebar({ filters, onChange }) {
  const handle = (key) => (e) => onChange({ ...filters, [key]: e.target.value, page: 1 });
  return /* @__PURE__ */ jsxs("aside", { className: "w-full md:w-56 shrink-0 flex flex-col gap-4", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "label block mb-1", children: "Search" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "input font-serif text-imperial-gold placeholder:text-imperial-gold/30",
          placeholder: "Title or keyword...",
          value: filters.search ?? "",
          onChange: handle("search")
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "label block mb-1", children: "Era" }),
      /* @__PURE__ */ jsxs(Select, { value: filters.era ?? "", onChange: handle("era"), children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "All eras" }),
        ERAS.map((era) => /* @__PURE__ */ jsx("option", { value: era, children: era }, era))
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "label block mb-1", children: "Sort by" }),
      /* @__PURE__ */ jsxs(Select, { value: filters.sort ?? "", onChange: handle("sort"), children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "Order in series" }),
        /* @__PURE__ */ jsx("option", { value: "title", children: "Title" }),
        /* @__PURE__ */ jsx("option", { value: "pages", children: "Pages" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("button", { className: "btn-outline text-sm mt-2", onClick: () => onChange({ page: 1 }), children: "Clear filters" })
  ] });
}
function EmptyState({ icon, title, message, action }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center gap-4", children: [
    icon && /* @__PURE__ */ jsx("span", { className: "text-imperial-gold/30", children: icon }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "font-serif text-lg text-imperial-muted mb-1", children: title }),
      message && /* @__PURE__ */ jsx("p", { className: "text-sm text-imperial-muted/60 max-w-xs mx-auto", children: message })
    ] }),
    action
  ] });
}
function Books() {
  const [filters, setFilters] = useState({ page: 1 });
  const { data, isLoading, isFetching, isPreviousData } = useBooks(filters);
  const books = data?.results ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / 48) : 1;
  const page = filters.page ?? 1;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Books",
        description: "Complete catalog of Warhammer 40,000 and Horus Heresy novels — browse hundreds of books by author, series, faction, and setting."
      }
    ),
    /* @__PURE__ */ jsx("h1", { className: "text-3xl mb-8", children: "Books" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-8", children: [
      /* @__PURE__ */ jsx(FilterSidebar, { filters, onChange: setFilters }),
      /* @__PURE__ */ jsx("div", { className: "flex-1", children: isLoading || isFetching ? /* @__PURE__ */ jsx(Spinner, {}) : books.length === 0 ? /* @__PURE__ */ jsx(
        EmptyState,
        {
          icon: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", className: "w-10 h-10", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" }) }),
          title: "No books found",
          message: "Try adjusting your filters or search term."
        }
      ) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4", children: [
          books.map((book, i) => /* @__PURE__ */ jsx(
            "div",
            {
              className: "animate-fade-in-up",
              style: { animationDelay: `${i * 30}ms` },
              children: /* @__PURE__ */ jsx(BookCard, { book })
            },
            book.slug
          )),
          Array.from({ length: (4 - books.length % 4) % 4 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "hidden lg:block" }, `filler-${i}`))
        ] }),
        totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "flex justify-center gap-3 mt-8", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn-outline px-4 py-1.5 text-sm disabled:opacity-40",
              disabled: page <= 1,
              onClick: () => setFilters((f) => ({ ...f, page: f.page - 1 })),
              children: "Previous"
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "text-imperial-muted self-center text-sm", children: [
            page,
            " / ",
            totalPages
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn-outline px-4 py-1.5 text-sm disabled:opacity-40",
              disabled: page >= totalPages,
              onClick: () => setFilters((f) => ({ ...f, page: f.page + 1 })),
              children: "Next"
            }
          )
        ] })
      ] }) })
    ] })
  ] });
}
function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data } = await client.get("/api/user/favorites");
      return data;
    }
  });
}
function useAddFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookSlug) => client.post("/api/user/favorites", { bookSlug }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] })
  });
}
function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug) => client.delete(`/api/user/favorites/${slug}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] })
  });
}
function useReadingList() {
  return useQuery({
    queryKey: ["reading-list"],
    queryFn: async () => {
      const { data } = await client.get("/api/user/reading-list");
      return data;
    }
  });
}
function useAddToReadingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, status }) => client.post("/api/user/reading-list", { bookSlug: slug, status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-list"] })
  });
}
function useUpdateReadingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, status }) => client.patch(`/api/user/reading-list/${slug}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-list"] })
  });
}
function useRemoveFromReadingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug) => client.delete(`/api/user/reading-list/${slug}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-list"] })
  });
}
function RelatedGroup({ title, books }) {
  if (!books?.length) return null;
  const ref = useRef(null);
  const scroll = (dir) => {
    ref.current?.scrollBy({ left: dir * 176, behavior: "smooth" });
  };
  return /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsx("p", { className: "label", children: title }),
      books.length > 3 && /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => scroll(-1),
            className: "w-7 h-7 flex items-center justify-center border border-imperial-border text-imperial-muted hover:border-imperial-gold hover:text-imperial-gold transition-colors",
            "aria-label": "Scroll left",
            children: "‹"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => scroll(1),
            className: "w-7 h-7 flex items-center justify-center border border-imperial-border text-imperial-muted hover:border-imperial-gold hover:text-imperial-gold transition-colors",
            "aria-label": "Scroll right",
            children: "›"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        ref,
        className: "flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth",
        style: { scrollSnapType: "x mandatory" },
        children: books.slice(0, 6).map((book) => /* @__PURE__ */ jsx(
          "div",
          {
            className: "w-36 shrink-0",
            style: { scrollSnapAlign: "start" },
            children: /* @__PURE__ */ jsx(BookCard, { book, compact: true })
          },
          book.slug
        ))
      }
    )
  ] });
}
function RelatedBooks({ data }) {
  if (!data?.sameSeries?.length && !data?.relatedByPrimarch?.length) return null;
  return /* @__PURE__ */ jsxs("section", { className: "mt-12 pt-8 border-t border-imperial-border", children: [
    /* @__PURE__ */ jsx(RelatedGroup, { title: "More from this series", books: data.sameSeries }),
    /* @__PURE__ */ jsx(RelatedGroup, { title: "Related by primarch", books: data.relatedByPrimarch })
  ] });
}
function BackButton() {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: () => navigate(-1),
      className: "text-imperial-muted hover:text-imperial-gold text-sm transition-colors mb-6 flex items-center gap-2",
      children: "← Back"
    }
  );
}
const truncate$3 = (s, n = 155) => !s ? null : s.length > n ? s.slice(0, n).trim() + "…" : s;
const slugFrom$3 = (url) => url?.split("/").at(-1);
const STATUSES$1 = [
  { value: "want-to-read", label: "Want to Read" },
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" }
];
function BookActions({ slug }) {
  const { data: favorites = [] } = useFavorites();
  const { data: readingList = [] } = useReadingList();
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const addToList = useAddToReadingList();
  const updateStatus = useUpdateReadingStatus();
  const removeFromList = useRemoveFromReadingList();
  const isFav = favorites.some((f) => f.bookSlug === slug);
  const listEntry = readingList.find((item) => item.bookSlug === slug);
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-imperial-border", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => isFav ? removeFav.mutate(slug) : addFav.mutate(slug),
        disabled: addFav.isPending || removeFav.isPending,
        className: `flex items-center gap-2 text-sm transition-colors ${isFav ? "text-imperial-gold" : "text-imperial-muted hover:text-imperial-gold"}`,
        children: [
          /* @__PURE__ */ jsx("span", { className: "text-lg leading-none", children: isFav ? "♥" : "♡" }),
          isFav ? "Favorited" : "Add to Favorites"
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "w-px h-5 bg-imperial-border" }),
    listEntry ? /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: STATUSES$1.map(({ value, label }) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => value === listEntry.status ? removeFromList.mutate(slug) : updateStatus.mutate({ slug, status: value }),
        className: `text-xs px-3 py-1.5 rounded-full border transition-colors ${listEntry.status === value ? "border-imperial-gold text-imperial-gold bg-imperial-gold/10" : "border-imperial-border text-imperial-muted hover:border-imperial-gold/50 hover:text-imperial-light"}`,
        children: label
      },
      value
    )) }) : /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => addToList.mutate({ slug, status: "want-to-read" }),
        disabled: addToList.isPending,
        className: "text-xs px-4 py-1.5 rounded-full border border-imperial-border text-imperial-muted hover:border-imperial-gold hover:text-imperial-gold transition-colors tracking-wide uppercase",
        children: "+ Add to Reading List"
      }
    )
  ] });
}
function BookDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: book, isLoading, isError } = useBook(slug);
  const { data: related } = useRelatedBooks(slug);
  if (isLoading) return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SEO, {}),
    /* @__PURE__ */ jsx(Spinner, {})
  ] });
  if (isError) return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SEO, { title: "Book not found", noindex: true }),
    /* @__PURE__ */ jsx("p", { className: "text-imperial-muted", children: "Book not found." })
  ] });
  const seoTitle = `${book.title}${book.author?.name ? ` by ${book.author.name}` : ""}`;
  const seoDescription = truncate$3(book.description) ?? `${book.title}${book.author?.name ? ` by ${book.author.name}` : ""}${book.series?.name ? `, part of the ${book.series.name} series` : ""} — a Warhammer novel from Black Library.`;
  const bookUrl = `https://librarium40k.com/books/${slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Book",
      name: book.title,
      url: bookUrl,
      inLanguage: "en",
      bookFormat: "https://schema.org/Paperback",
      publisher: { "@type": "Organization", name: "Black Library" },
      ...book.author?.name && {
        author: { "@type": "Person", name: book.author.name }
      },
      ...book.coverImage && { image: book.coverImage },
      ...book.series?.name && {
        isPartOf: { "@type": "BookSeries", name: book.series.name }
      },
      ...book.pages && { numberOfPages: book.pages },
      ...book.description && { description: book.description }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Books", item: "https://librarium40k.com/books" },
        { "@type": "ListItem", position: 2, name: book.title }
      ]
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto animate-fade-in", children: [
    /* @__PURE__ */ jsx(SEO, { title: seoTitle, description: seoDescription, type: "article", jsonLd }),
    /* @__PURE__ */ jsx(BackButton, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-8 mb-10", children: [
      /* @__PURE__ */ jsx("div", { className: "w-40 md:w-56 shrink-0", children: book.coverImage ? /* @__PURE__ */ jsx(
        "img",
        {
          src: book.coverImage,
          alt: book.title,
          className: "w-full rounded border border-imperial-border shadow-lg"
        }
      ) : /* @__PURE__ */ jsx("div", { className: "aspect-[2/3] bg-imperial-bg-light rounded border border-imperial-border flex items-center justify-center text-imperial-muted text-sm", children: "No cover" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("p", { className: "label text-xs mb-2", children: "Book" }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl mb-3 leading-tight", children: book.title }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-x-4 gap-y-1 mb-4 text-sm", children: [
          book.author && /* @__PURE__ */ jsxs("span", { className: "text-imperial-muted", children: [
            "by",
            " ",
            /* @__PURE__ */ jsx(Link, { to: `/authors/${slugFrom$3(book.author.url)}`, className: "text-imperial-gold hover:underline", children: book.author.name })
          ] }),
          book.series && /* @__PURE__ */ jsx("span", { className: "text-imperial-muted", children: /* @__PURE__ */ jsx(Link, { to: `/series/${slugFrom$3(book.series.url)}`, className: "text-imperial-gold hover:underline", children: book.series.name }) })
        ] }),
        (book.setting?.era || book.pages) && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mb-5", children: [
          book.setting?.era && /* @__PURE__ */ jsxs("span", { className: "text-xs px-2.5 py-1 rounded-full border border-imperial-border text-imperial-muted", children: [
            book.setting.era,
            book.setting.millennium && ` · ${book.setting.millennium}`
          ] }),
          book.pages && /* @__PURE__ */ jsxs("span", { className: "text-xs px-2.5 py-1 rounded-full border border-imperial-border text-imperial-muted", children: [
            book.pages,
            " pages"
          ] })
        ] }),
        book.description && /* @__PURE__ */ jsx("p", { className: "text-imperial-light/80 leading-relaxed mb-6 text-sm border-l-2 border-imperial-gold/30 pl-4", children: book.description }),
        book.factions?.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "label mb-2", children: "Factions" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: book.factions.map((f) => /* @__PURE__ */ jsx(
            "span",
            {
              className: "border border-imperial-border text-imperial-muted text-xs px-3 py-1 rounded-full",
              children: f.name
            },
            f.slug
          )) })
        ] }),
        book.primarchs?.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "label mb-2", children: "Primarchs" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: book.primarchs.map((p) => /* @__PURE__ */ jsx(
            Link,
            {
              to: `/primarchs/${slugFrom$3(p.url)}`,
              className: "border border-imperial-gold/30 text-imperial-gold/70 text-xs px-3 py-1 rounded-full hover:border-imperial-gold transition-colors",
              children: p.name
            },
            p.url
          )) })
        ] }),
        user && /* @__PURE__ */ jsx(BookActions, { slug })
      ] })
    ] }),
    /* @__PURE__ */ jsx(RelatedBooks, { data: related })
  ] });
}
function useAuthors(params = {}) {
  return useQuery({
    queryKey: ["authors", params],
    queryFn: async () => {
      const { data } = await client.get("/api/authors", { params });
      return data;
    }
  });
}
function useAuthor(slug) {
  return useQuery({
    queryKey: ["author", slug],
    queryFn: async () => {
      const { data } = await client.get(`/api/authors/${slug}`);
      return data;
    },
    enabled: !!slug
  });
}
function Authors() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useAuthors({ page });
  const authors = data?.results ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / 50) : 1;
  if (isLoading || isFetching) return /* @__PURE__ */ jsx(Spinner, {});
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Authors",
        description: "Black Library authors who shaped the Warhammer universe — Dan Abnett, Graham McNeill, Aaron Dembski-Bowden, Guy Haley, James Swallow, and more."
      }
    ),
    /* @__PURE__ */ jsx("h1", { className: "text-3xl mb-8 animate-fade-in", children: "Authors" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4", children: authors.map((author, i) => /* @__PURE__ */ jsxs(
      Link,
      {
        to: `/authors/${author.slug}`,
        className: "card p-4 flex gap-4 items-start group hover:border-imperial-gold/40 transition-colors animate-fade-in-up",
        style: { animationDelay: `${i * 30}ms` },
        children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 shrink-0 rounded-full overflow-hidden bg-imperial-bg-mid border border-imperial-border group-hover:border-imperial-gold/40 transition-colors", children: author.image ? /* @__PURE__ */ jsx(
            "img",
            {
              src: author.image,
              alt: author.name,
              className: "w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            }
          ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-imperial-muted text-xs", children: "?" }) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-serif text-lg text-imperial-gold mb-1", children: author.name }),
            author.bio && /* @__PURE__ */ jsx("p", { className: "text-sm text-imperial-muted line-clamp-2", children: author.bio })
          ] })
        ]
      },
      author.slug
    )) }),
    totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "flex justify-center gap-3 mt-8", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "btn-outline px-4 py-1.5 text-sm disabled:opacity-40",
          disabled: page <= 1,
          onClick: () => setPage((p) => p - 1),
          children: "Previous"
        }
      ),
      /* @__PURE__ */ jsxs("span", { className: "text-imperial-muted self-center text-sm", children: [
        page,
        " / ",
        totalPages
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "btn-outline px-4 py-1.5 text-sm disabled:opacity-40",
          disabled: page >= totalPages,
          onClick: () => setPage((p) => p + 1),
          children: "Next"
        }
      )
    ] })
  ] });
}
const slugFrom$2 = (url) => url?.split("/").at(-1);
const truncate$2 = (s, n = 155) => !s ? null : s.length > n ? s.slice(0, n).trim() + "…" : s;
function AuthorDetail() {
  const { slug } = useParams();
  const { data: author, isLoading, isError } = useAuthor(slug);
  if (isLoading) return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SEO, {}),
    /* @__PURE__ */ jsx(Spinner, {})
  ] });
  if (isError) return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SEO, { title: "Author not found", noindex: true }),
    /* @__PURE__ */ jsx("p", { className: "text-imperial-muted", children: "Author not found." })
  ] });
  const books = author?.books ?? [];
  const seoDescription = truncate$2(author.bio) ?? `${author.name} — Warhammer author at Black Library${books.length ? `. Browse ${books.length} books.` : "."}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: author.name,
      url: `https://librarium40k.com/authors/${slug}`,
      jobTitle: "Author",
      worksFor: { "@type": "Organization", name: "Black Library" },
      ...author.bio && { description: author.bio },
      ...author.image && { image: author.image }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Authors", item: "https://librarium40k.com/authors" },
        { "@type": "ListItem", position: 2, name: author.name }
      ]
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto animate-fade-in", children: [
    /* @__PURE__ */ jsx(SEO, { title: author.name, description: seoDescription, type: "profile", jsonLd }),
    /* @__PURE__ */ jsx(BackButton, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-6 items-start mb-10 pb-8 border-b border-imperial-border", children: [
      /* @__PURE__ */ jsx("div", { className: "w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-full overflow-hidden bg-imperial-bg-mid border border-imperial-border", children: author.image ? /* @__PURE__ */ jsx(
        "img",
        {
          src: author.image,
          alt: author.name,
          className: "w-full h-full object-contain"
        }
      ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-imperial-muted text-sm", children: "?" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsx("p", { className: "label text-xs", children: "Author" }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl leading-tight", children: author.name }),
        author.bio && /* @__PURE__ */ jsx("p", { className: "text-imperial-light/70 leading-relaxed mt-1 text-sm", children: author.bio })
      ] })
    ] }),
    books.length > 0 && /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl mb-4", children: "Books" }),
      /* @__PURE__ */ jsx("ul", { className: "flex flex-col gap-2", children: books.map((book, i) => /* @__PURE__ */ jsx(
        "li",
        {
          className: "animate-fade-in-up",
          style: { animationDelay: `${i * 40}ms` },
          children: /* @__PURE__ */ jsxs(
            Link,
            {
              to: `/books/${slugFrom$2(book.url)}`,
              className: "card px-4 py-3 flex items-center justify-between hover:border-imperial-gold/50 transition-colors group",
              children: [
                /* @__PURE__ */ jsx("span", { className: "text-imperial-light group-hover:text-imperial-gold transition-colors", children: book.title }),
                /* @__PURE__ */ jsx("span", { className: "text-imperial-muted text-sm group-hover:text-imperial-gold transition-colors", children: "→" })
              ]
            }
          )
        },
        book.url
      )) })
    ] })
  ] });
}
function useSeriesList(params = {}) {
  return useQuery({
    queryKey: ["series", params],
    queryFn: async () => {
      const { data } = await client.get("/api/series", { params });
      return data;
    }
  });
}
function useSeries(slug) {
  return useQuery({
    queryKey: ["series", slug],
    queryFn: async () => {
      const { data } = await client.get(`/api/series/${slug}`);
      return data;
    },
    enabled: !!slug
  });
}
function Series() {
  const { data, isLoading } = useSeriesList();
  const series = data?.results ?? [];
  if (isLoading) return /* @__PURE__ */ jsx(Spinner, {});
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "Series",
        description: "Warhammer book series and recommended reading orders — the Horus Heresy, Gaunt's Ghosts, Ultramarines, Eisenhorn, and more."
      }
    ),
    /* @__PURE__ */ jsx("h1", { className: "text-3xl mb-8 animate-fade-in", children: "Series" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4", children: series.map((s, i) => /* @__PURE__ */ jsxs(
      Link,
      {
        to: `/series/${s.slug}`,
        className: "card p-5 flex flex-col gap-3 group hover:border-imperial-gold/40 transition-colors animate-fade-in-up",
        style: { animationDelay: `${i * 30}ms` },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-serif text-lg text-imperial-gold leading-tight", children: s.name }),
            s.era && /* @__PURE__ */ jsx("span", { className: "text-xs shrink-0 px-2 py-0.5 rounded-full border border-imperial-border text-imperial-muted", children: s.era })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-imperial-muted/40 text-xs tracking-widest group-hover:text-imperial-gold/50 transition-colors", children: "View series →" })
        ]
      },
      s.slug
    )) })
  ] });
}
const slugFrom$1 = (url) => url?.split("/").at(-1);
const truncate$1 = (s, n = 155) => !s ? null : s.length > n ? s.slice(0, n).trim() + "…" : s;
function SeriesDetail() {
  const { slug } = useParams();
  const { data: series, isLoading, isError } = useSeries(slug);
  if (isLoading) return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SEO, {}),
    /* @__PURE__ */ jsx(Spinner, {})
  ] });
  if (isError) return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SEO, { title: "Series not found", noindex: true }),
    /* @__PURE__ */ jsx("p", { className: "text-imperial-muted", children: "Series not found." })
  ] });
  const books = series?.books ?? [];
  const seoDescription = truncate$1(series.description) ?? `${series.name}${series.era ? ` — a ${series.era} era Warhammer series` : " — a Warhammer book series"}${books.length ? `, ${books.length} books.` : "."}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BookSeries",
      name: series.name,
      url: `https://librarium40k.com/series/${slug}`,
      publisher: { "@type": "Organization", name: "Black Library" },
      ...series.description && { description: series.description },
      ...books.length && { numberOfItems: books.length }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Series", item: "https://librarium40k.com/series" },
        { "@type": "ListItem", position: 2, name: series.name }
      ]
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto animate-fade-in", children: [
    /* @__PURE__ */ jsx(SEO, { title: series.name, description: seoDescription, type: "article", jsonLd }),
    /* @__PURE__ */ jsx(BackButton, {}),
    /* @__PURE__ */ jsxs("div", { className: "mb-10 pb-8 border-b border-imperial-border", children: [
      /* @__PURE__ */ jsx("p", { className: "label text-xs mb-2", children: "Series" }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl mb-3", children: series.name }),
      series.era && /* @__PURE__ */ jsx("span", { className: "inline-block text-xs px-2.5 py-1 rounded-full border border-imperial-border text-imperial-muted uppercase tracking-widest mb-4", children: series.era }),
      series.description && /* @__PURE__ */ jsx("p", { className: "text-imperial-light/70 leading-relaxed text-sm border-l-2 border-imperial-gold/30 pl-4", children: series.description })
    ] }),
    books.length > 0 && /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl mb-4", children: "Books in this Series" }),
      /* @__PURE__ */ jsx("ul", { className: "flex flex-col gap-2", children: books.map((book, i) => /* @__PURE__ */ jsx(
        "li",
        {
          className: "animate-fade-in-up",
          style: { animationDelay: `${i * 40}ms` },
          children: /* @__PURE__ */ jsxs(
            Link,
            {
              to: `/books/${slugFrom$1(book.url)}`,
              className: "card px-4 py-3 flex items-center gap-4 hover:border-imperial-gold/50 transition-colors group",
              children: [
                book.order != null && /* @__PURE__ */ jsxs("span", { className: "text-imperial-muted text-sm w-6 shrink-0 font-serif", children: [
                  book.order,
                  "."
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-imperial-light flex-1 group-hover:text-imperial-gold transition-colors", children: book.title }),
                /* @__PURE__ */ jsx("span", { className: "text-imperial-muted text-sm group-hover:text-imperial-gold transition-colors", children: "→" })
              ]
            }
          )
        },
        book.url
      )) })
    ] })
  ] });
}
function usePrimarchs(params = {}) {
  return useQuery({
    queryKey: ["primarchs", params],
    queryFn: async () => {
      const { data } = await client.get("/api/primarchs", { params });
      return data;
    }
  });
}
function usePrimarch(slug) {
  return useQuery({
    queryKey: ["primarch", slug],
    queryFn: async () => {
      const { data } = await client.get(`/api/primarchs/${slug}`);
      return data;
    },
    enabled: !!slug
  });
}
const alignmentStyle = {
  Loyalist: "border-imperial-gold/60 text-imperial-gold",
  Traitor: "border-red-800/60 text-red-400"
};
function PrimarchCard({ primarch }) {
  const style = alignmentStyle[primarch.alignment] ?? "border-imperial-border text-imperial-muted";
  return /* @__PURE__ */ jsxs(Link, { to: `/primarchs/${primarch.slug}`, className: `card flex flex-col border ${style} group overflow-hidden`, children: [
    /* @__PURE__ */ jsx("div", { className: "aspect-[3/2] bg-imperial-bg-mid overflow-hidden", children: primarch.image ? /* @__PURE__ */ jsx(
      "img",
      {
        src: primarch.image,
        alt: primarch.name,
        className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      }
    ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-imperial-muted text-sm", children: "No image" }) }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 flex flex-col gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-serif text-lg leading-tight", children: primarch.name }),
        /* @__PURE__ */ jsx("span", { className: `text-xs shrink-0 px-2 py-0.5 rounded-full border ${style}`, children: primarch.alignment ?? "Unknown" })
      ] }),
      primarch.legion && /* @__PURE__ */ jsx("p", { className: "text-sm text-imperial-muted", children: primarch.legion }),
      primarch.status && /* @__PURE__ */ jsx("p", { className: "text-xs text-imperial-muted opacity-70", children: primarch.status })
    ] })
  ] });
}
const ALIGNMENTS = ["", "Loyalist", "Traitor"];
const theme = {
  Loyalist: {
    border: "border-imperial-gold/40",
    badge: "border-imperial-gold/60 text-imperial-gold",
    accent: "bg-imperial-gold",
    gradient: "from-imperial-gold/20 to-transparent",
    label: "text-imperial-gold/50"
  },
  Traitor: {
    border: "border-red-800/40",
    badge: "border-red-800/60 text-red-400",
    accent: "bg-red-600",
    gradient: "from-red-900/30 to-transparent",
    label: "text-red-400/50"
  }
};
const fallbackTheme = {
  border: "border-imperial-border",
  badge: "border-imperial-border text-imperial-muted",
  accent: "bg-imperial-muted",
  label: "text-imperial-muted/50"
};
function HeroPrimarch({ primarch }) {
  const t = theme[primarch.alignment] ?? fallbackTheme;
  return /* @__PURE__ */ jsxs(
    Link,
    {
      to: `/primarchs/${primarch.slug}`,
      className: `group relative flex flex-col md:flex-row overflow-hidden rounded border ${t.border} bg-imperial-bg-mid mb-8 animate-fade-in`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-center px-8 py-10 md:py-14 md:w-1/2 gap-4 z-10", children: [
          /* @__PURE__ */ jsx("p", { className: `text-xs tracking-widest uppercase font-serif ${t.label}`, children: "Primarch" }),
          /* @__PURE__ */ jsx("h2", { className: "text-4xl md:text-5xl leading-none tracking-wide", children: primarch.name }),
          primarch.legion && /* @__PURE__ */ jsx("p", { className: "font-serif text-imperial-gold/70 text-lg tracking-wide", children: primarch.legion }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-2", children: [
            /* @__PURE__ */ jsx("span", { className: `${t.accent} w-6 h-px` }),
            /* @__PURE__ */ jsx("span", { className: `text-xs px-2.5 py-1 rounded-full border ${t.badge}`, children: primarch.alignment ?? "Unknown" }),
            primarch.status && /* @__PURE__ */ jsx("span", { className: "text-xs text-imperial-muted opacity-70", children: primarch.status })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-imperial-muted/60 mt-2 group-hover:text-imperial-muted transition-colors", children: "View details →" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:w-1/2 aspect-[4/3] md:aspect-auto md:min-h-[340px] overflow-hidden relative", children: [
          primarch.image ? /* @__PURE__ */ jsx(
            "img",
            {
              src: primarch.image,
              alt: primarch.name,
              className: "w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            }
          ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-imperial-muted text-sm bg-imperial-bg", children: "No image" }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute inset-y-0 left-0 w-24 hidden md:block",
              style: { background: "linear-gradient(to right, #1a1c23, transparent)" }
            }
          )
        ] })
      ]
    }
  );
}
function FaceoffHero({ primarch }) {
  const t = theme[primarch.alignment] ?? fallbackTheme;
  return /* @__PURE__ */ jsxs(
    Link,
    {
      to: `/primarchs/${primarch.slug}`,
      className: `group relative flex-1 overflow-hidden rounded border ${t.border} bg-imperial-bg-mid min-h-[360px] flex flex-col animate-fade-in`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-hidden relative", children: [
          primarch.image ? /* @__PURE__ */ jsx(
            "img",
            {
              src: primarch.image,
              alt: primarch.name,
              className: "w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500",
              style: { minHeight: "260px" }
            }
          ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full min-h-[260px] flex items-center justify-center text-imperial-muted text-sm bg-imperial-bg", children: "No image" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 bottom-0 h-3/4", style: { background: "linear-gradient(to top, #0d0f14 0%, #0d0f14cc 40%, transparent 100%)" } })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative px-6 pb-6 pt-2 -mt-20 z-10 flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsx("p", { className: `text-xs tracking-widest uppercase font-serif ${t.label}`, children: primarch.alignment }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl leading-tight tracking-wide text-imperial-light drop-shadow-lg", children: primarch.name }),
          primarch.legion && /* @__PURE__ */ jsx("p", { className: "text-sm font-serif text-imperial-light/70", children: primarch.legion }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
            /* @__PURE__ */ jsx("span", { className: `${t.accent} w-4 h-px` }),
            primarch.status && /* @__PURE__ */ jsx("span", { className: "text-xs text-imperial-light/50", children: primarch.status })
          ] })
        ] })
      ]
    }
  );
}
function Primarchs() {
  const [alignment, setAlignment] = useState("");
  const { data, isLoading } = usePrimarchs(alignment ? { alignment } : {});
  const primarchs = data?.results ?? [];
  if (isLoading) return /* @__PURE__ */ jsx(Spinner, {});
  const isAll = alignment === "";
  const loyalistHero = isAll ? primarchs.find((p) => p.alignment === "Loyalist") : null;
  const traitorHero = isAll ? primarchs.find((p) => p.alignment === "Traitor") : null;
  const heroSlugs = new Set([loyalistHero?.slug, traitorHero?.slug].filter(Boolean));
  const [singleHero, ...rest] = isAll ? [] : primarchs;
  const gridPrimarchs = isAll ? primarchs.filter((p) => !heroSlugs.has(p.slug)) : rest;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      SEO,
      {
        title: "The Primarchs",
        description: "The twenty Primarchs of the Emperor's legions — their legions, alignments, and fates across the Horus Heresy and the 41st Millennium."
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl", children: "Primarchs" }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: ALIGNMENTS.map((a) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setAlignment(a),
          className: alignment === a ? "btn-gold text-sm px-4 py-1.5" : "btn-outline text-sm px-4 py-1.5",
          children: a || "All"
        },
        a || "all"
      )) })
    ] }),
    isAll && (loyalistHero || traitorHero) && /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 mb-8", children: [
      loyalistHero && /* @__PURE__ */ jsx(FaceoffHero, { primarch: loyalistHero }),
      traitorHero && /* @__PURE__ */ jsx(FaceoffHero, { primarch: traitorHero })
    ] }),
    !isAll && singleHero && /* @__PURE__ */ jsx(HeroPrimarch, { primarch: singleHero }),
    gridPrimarchs.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4", children: gridPrimarchs.map((p, i) => /* @__PURE__ */ jsx(
      "div",
      {
        className: "animate-fade-in-up",
        style: { animationDelay: `${i * 40}ms` },
        children: /* @__PURE__ */ jsx(PrimarchCard, { primarch: p })
      },
      p.slug
    )) })
  ] });
}
const slugFrom = (url) => url?.split("/").at(-1);
const truncate = (s, n = 155) => !s ? null : s.length > n ? s.slice(0, n).trim() + "…" : s;
const alignmentTheme = {
  Loyalist: {
    border: "border-imperial-gold/40",
    badge: "border-imperial-gold/60 text-imperial-gold",
    accent: "bg-imperial-gold",
    label: "text-imperial-gold/50"
  },
  Traitor: {
    border: "border-red-800/40",
    badge: "border-red-800/60 text-red-400",
    accent: "bg-red-600",
    label: "text-red-400/50"
  }
};
const fallback = {
  border: "border-imperial-border",
  badge: "border-imperial-border text-imperial-muted",
  accent: "bg-imperial-muted",
  label: "text-imperial-muted/50"
};
function PrimarchDetail() {
  const { slug } = useParams();
  const { data: primarch, isLoading, isError } = usePrimarch(slug);
  if (isLoading) return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SEO, {}),
    /* @__PURE__ */ jsx(Spinner, {})
  ] });
  if (isError) return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SEO, { title: "Primarch not found", noindex: true }),
    /* @__PURE__ */ jsx("p", { className: "text-imperial-muted", children: "Primarch not found." })
  ] });
  const books = primarch?.books ?? [];
  const t = alignmentTheme[primarch.alignment] ?? fallback;
  const seoTitle = primarch.legion ? `${primarch.name} — ${primarch.legion}` : primarch.name;
  const seoDescription = truncate(primarch.fate) ?? `${primarch.name}${primarch.legion ? `, Primarch of the ${primarch.legion}` : ""}${primarch.alignment ? ` (${primarch.alignment})` : ""} — Warhammer 40k and Horus Heresy lore.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Primarchs", item: "https://librarium40k.com/primarchs" },
      { "@type": "ListItem", position: 2, name: primarch.name }
    ]
  };
  return /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto animate-fade-in", children: [
    /* @__PURE__ */ jsx(SEO, { title: seoTitle, description: seoDescription, type: "profile", jsonLd }),
    /* @__PURE__ */ jsx(BackButton, {}),
    /* @__PURE__ */ jsxs("div", { className: `relative flex flex-col md:flex-row overflow-hidden rounded border ${t.border} bg-imperial-bg-mid mb-10`, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-center px-8 py-10 md:py-16 md:w-1/2 gap-4 z-10", children: [
        /* @__PURE__ */ jsx("p", { className: `text-xs tracking-widest uppercase font-serif ${t.label}`, children: "Primarch" }),
        /* @__PURE__ */ jsx("h1", { className: "text-4xl md:text-5xl leading-none tracking-wide", children: primarch.name }),
        primarch.legion && /* @__PURE__ */ jsx("p", { className: "font-serif text-imperial-gold/70 text-xl tracking-wide", children: primarch.legion }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 mt-1", children: [
          /* @__PURE__ */ jsx("span", { className: `${t.accent} w-6 h-px` }),
          primarch.alignment && /* @__PURE__ */ jsx("span", { className: `text-xs px-2.5 py-1 rounded-full border ${t.badge}`, children: primarch.alignment }),
          primarch.status && /* @__PURE__ */ jsx("span", { className: "text-xs px-2.5 py-1 rounded-full border border-imperial-border text-imperial-muted", children: primarch.status })
        ] }),
        primarch.fate && /* @__PURE__ */ jsx("p", { className: "text-sm text-imperial-muted/70 italic mt-2 leading-relaxed border-l-2 border-imperial-gold/20 pl-4", children: primarch.fate })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "md:w-1/2 aspect-[4/3] md:aspect-auto md:min-h-[380px] overflow-hidden relative", children: [
        primarch.image ? /* @__PURE__ */ jsx(
          "img",
          {
            src: primarch.image,
            alt: primarch.name,
            className: "w-full h-full object-cover object-top"
          }
        ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center text-imperial-muted text-sm bg-imperial-bg", children: "No image" }),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute inset-y-0 left-0 w-24 hidden md:block",
            style: { background: "linear-gradient(to right, #1a1c23, transparent)" }
          }
        )
      ] })
    ] }),
    books.length > 0 && /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl mb-4", children: "Featured In" }),
      /* @__PURE__ */ jsx("ul", { className: "flex flex-col gap-2", children: books.map((book, i) => /* @__PURE__ */ jsx(
        "li",
        {
          className: "animate-fade-in-up",
          style: { animationDelay: `${i * 40}ms` },
          children: /* @__PURE__ */ jsxs(
            Link,
            {
              to: `/books/${slugFrom(book.url)}`,
              className: "card px-4 py-3 flex items-center justify-between hover:border-imperial-gold/50 transition-colors group",
              children: [
                /* @__PURE__ */ jsx("span", { className: "text-imperial-light group-hover:text-imperial-gold transition-colors", children: book.title }),
                /* @__PURE__ */ jsx("span", { className: "text-imperial-muted text-sm group-hover:text-imperial-gold transition-colors", children: "→" })
              ]
            }
          )
        },
        book.url
      )) })
    ] })
  ] });
}
function AuthLayout({ title, eyebrow, flip = false, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-[calc(100vh-57px)] flex flex-col md:flex-row", children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `relative flex items-center justify-center md:w-2/5 overflow-hidden
                    h-40 md:h-auto bg-imperial-bg-mid
                    order-first ${flip ? "md:order-last" : "md:order-first"}`,
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute inset-0",
              style: {
                backgroundImage: `
              repeating-linear-gradient(45deg, rgba(201,168,76,0.06) 0px, rgba(201,168,76,0.06) 1px, transparent 1px, transparent 32px),
              repeating-linear-gradient(-45deg, rgba(201,168,76,0.06) 0px, rgba(201,168,76,0.06) 1px, transparent 1px, transparent 32px)
            `
              }
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute inset-0",
              style: { background: "radial-gradient(ellipse at center, transparent 20%, #16191f 90%)" }
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 text-center px-6", children: [
            /* @__PURE__ */ jsx("p", { className: "font-serif text-2xl md:text-3xl text-imperial-gold tracking-widest", children: "Librarium" }),
            /* @__PURE__ */ jsx("p", { className: "hidden md:block text-xs text-imperial-muted tracking-widest uppercase mt-2", children: "Chronicles of the Warhammer Universe" })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: `flex-1 flex items-center justify-center px-8 py-12
                    ${flip ? "md:order-first" : "md:order-last"}`,
        children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm", children: [
          eyebrow && /* @__PURE__ */ jsx("p", { className: "text-xs text-imperial-muted tracking-widest uppercase mb-2", children: eyebrow }),
          /* @__PURE__ */ jsx("h1", { className: "text-3xl mb-8", children: title }),
          children
        ] })
      }
    )
  ] });
}
function PasswordInput({ value, onChange, required, placeholder }) {
  const [visible, setVisible] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        className: "input w-full pr-10",
        type: visible ? "text" : "password",
        required,
        placeholder,
        value,
        onChange
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setVisible((v) => !v),
        className: "absolute right-3 top-1/2 -translate-y-1/2 text-imperial-muted hover:text-imperial-gold transition-colors",
        tabIndex: -1,
        "aria-label": visible ? "Hide password" : "Show password",
        children: visible ? /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: [
          /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.95 9.95 0 016.375 2.325M15 12a3 3 0 11-6 0 3 3 0 016 0z" }),
          /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 3l18 18" })
        ] }) : /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: [
          /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }),
          /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })
        ] })
      }
    )
  ] });
}
function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? "/";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handle = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs(AuthLayout, { title: "Login", eyebrow: "Welcome back", children: [
    /* @__PURE__ */ jsx(SEO, { title: "Sign In", noindex: true }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label block mb-1", children: "Email" }),
        /* @__PURE__ */ jsx("input", { className: "input", type: "email", required: true, value: form.email, onChange: handle("email") })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label block mb-1", children: "Password" }),
        /* @__PURE__ */ jsx(PasswordInput, { required: true, value: form.password, onChange: handle("password") }),
        /* @__PURE__ */ jsx("div", { className: "text-right mt-1", children: /* @__PURE__ */ jsx(Link, { to: "/forgot-password", className: "text-xs text-imperial-muted hover:text-imperial-gold transition-colors", children: "Forgot password?" }) })
      ] }),
      location.state?.message && /* @__PURE__ */ jsx("p", { className: "text-imperial-gold/80 text-sm", children: location.state.message }),
      error && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-sm", children: error }),
      /* @__PURE__ */ jsx("button", { className: "btn-gold mt-2", type: "submit", disabled: loading, children: loading ? "Entering..." : "Enter the Librarium" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-imperial-muted text-sm mt-6", children: [
      "No account?",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/register", className: "text-imperial-gold hover:underline", children: "Register" })
    ] })
  ] });
}
function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const handle = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  if (done) {
    return /* @__PURE__ */ jsxs(AuthLayout, { title: "Check your inbox", eyebrow: "Almost there", flip: true, children: [
      /* @__PURE__ */ jsx(SEO, { title: "Check your inbox", noindex: true }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 animate-fade-in", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-imperial-light/80 text-sm leading-relaxed", children: [
          "A verification link has been sent to",
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-imperial-gold font-serif", children: form.email }),
          ". Click it to activate your account and enter the Librarium."
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-imperial-muted text-xs", children: "Didn't receive it? Check your spam folder." }),
        /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-imperial-gold hover:underline text-sm mt-2", children: "Back to Login" })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs(AuthLayout, { title: "Create Account", eyebrow: "Join the Librarium", flip: true, children: [
    /* @__PURE__ */ jsx(SEO, { title: "Create Account", noindex: true }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label block mb-1", children: "Email" }),
        /* @__PURE__ */ jsx("input", { className: "input", type: "email", required: true, value: form.email, onChange: handle("email") })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label block mb-1", children: "Password" }),
        /* @__PURE__ */ jsx(PasswordInput, { required: true, value: form.password, onChange: handle("password") })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label block mb-1", children: "Confirm Password" }),
        /* @__PURE__ */ jsx(PasswordInput, { required: true, value: form.confirm, onChange: handle("confirm") })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-sm", children: error }),
      /* @__PURE__ */ jsx("button", { className: "btn-gold mt-2", type: "submit", disabled: loading, children: loading ? "Creating account..." : "Join the Librarium" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-imperial-muted text-sm mt-6", children: [
      "Already have an account?",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-imperial-gold hover:underline", children: "Login" })
    ] })
  ] });
}
function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post("/api/auth/forgot-password", { email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs(AuthLayout, { title: "Forgot Password", eyebrow: "Reset your access", children: [
    /* @__PURE__ */ jsx(SEO, { title: "Forgot Password", noindex: true }),
    sent ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 animate-fade-in", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-imperial-light/80 text-sm leading-relaxed", children: [
        "If an account exists for ",
        /* @__PURE__ */ jsx("span", { className: "text-imperial-gold", children: email }),
        ", a reset link has been dispatched. Check your inbox."
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-imperial-gold hover:underline text-sm", children: "Back to Login" })
    ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-imperial-muted text-sm", children: "Enter your email and we'll send you a link to reset your password." }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label block mb-1", children: "Email" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "input font-serif text-imperial-gold placeholder:text-imperial-gold/30",
            type: "email",
            required: true,
            value: email,
            onChange: (e) => setEmail(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsx("button", { className: "btn-gold mt-2", type: "submit", disabled: loading, children: loading ? "Sending..." : "Send Reset Link" }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-imperial-muted text-sm", children: /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-imperial-gold hover:underline", children: "Back to Login" }) })
    ] })
  ] });
}
function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handle = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await client.post("/api/auth/reset-password", { token, password: form.password });
      navigate("/login", { state: { message: "Password reset successfully. You can now log in." } });
    } catch (err) {
      setError(err.response?.data?.error ?? "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs(AuthLayout, { title: "Reset Password", eyebrow: "Set new access codes", children: [
    /* @__PURE__ */ jsx(SEO, { title: "Reset Password", noindex: true }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label block mb-1", children: "New Password" }),
        /* @__PURE__ */ jsx(PasswordInput, { required: true, value: form.password, onChange: handle("password") })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label block mb-1", children: "Confirm Password" }),
        /* @__PURE__ */ jsx(PasswordInput, { required: true, value: form.confirm, onChange: handle("confirm") })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-sm", children: error }),
      /* @__PURE__ */ jsx("button", { className: "btn-gold mt-2", type: "submit", disabled: loading, children: loading ? "Resetting..." : "Set New Password" })
    ] })
  ] });
}
function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    client.get(`/api/auth/verify/${token}`).then(() => setStatus("success")).catch(() => setStatus("error"));
  }, [token]);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex items-center justify-center bg-imperial-bg px-4", children: [
    /* @__PURE__ */ jsx(SEO, { title: "Verify Email", noindex: true }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl mb-4", children: "Librarium" }),
      status === "loading" && /* @__PURE__ */ jsx(Spinner, {}),
      status === "success" && /* @__PURE__ */ jsxs("div", { className: "animate-fade-in flex flex-col items-center gap-4", children: [
        /* @__PURE__ */ jsx("p", { className: "label", children: "Email Verified" }),
        /* @__PURE__ */ jsx("p", { className: "text-imperial-light/70 text-sm", children: "Your account is now active. You may enter the Librarium." }),
        /* @__PURE__ */ jsx(Link, { to: "/login", className: "btn-gold px-8 py-3 mt-2", children: "Enter the Librarium" })
      ] }),
      status === "error" && /* @__PURE__ */ jsxs("div", { className: "animate-fade-in flex flex-col items-center gap-4", children: [
        /* @__PURE__ */ jsx("p", { className: "label text-red-400", children: "Link Invalid or Expired" }),
        /* @__PURE__ */ jsx("p", { className: "text-imperial-light/70 text-sm", children: "This verification link has expired or already been used." }),
        /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-imperial-gold hover:underline text-sm", children: "Back to Login" })
      ] })
    ] })
  ] });
}
const STATUSES = [
  { value: "want-to-read", label: "Want to Read" },
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" }
];
function BookTitle({ slug }) {
  const { data: book } = useBook(slug);
  return /* @__PURE__ */ jsx(Fragment, { children: book?.title ?? slug });
}
function FavoritesSection() {
  const { data: favorites = [], isLoading } = useFavorites();
  const remove = useRemoveFavorite();
  if (isLoading) return /* @__PURE__ */ jsx(Spinner, {});
  return /* @__PURE__ */ jsxs("section", { className: "mb-10", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl mb-4", children: "Favorites" }),
    favorites.length === 0 ? /* @__PURE__ */ jsx(
      EmptyState,
      {
        icon: "♡",
        title: "No favorites yet",
        message: "Browse the library and mark books you love.",
        action: /* @__PURE__ */ jsx(Link, { to: "/books", className: "text-xs font-serif tracking-widest uppercase text-imperial-gold hover:underline", children: "Browse Books" })
      }
    ) : /* @__PURE__ */ jsx("ul", { className: "flex flex-col gap-2", children: favorites.map((fav) => /* @__PURE__ */ jsxs("li", { className: "card px-4 py-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(Link, { to: `/books/${fav.bookSlug}`, className: "text-imperial-gold hover:underline", children: /* @__PURE__ */ jsx(BookTitle, { slug: fav.bookSlug }) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => remove.mutate(fav.bookSlug),
          className: "text-imperial-muted hover:text-red-400 text-sm transition-colors shrink-0 ml-4",
          children: "Remove"
        }
      )
    ] }, fav.bookSlug)) })
  ] });
}
function ReadingListSection() {
  const { data: list = [], isLoading } = useReadingList();
  const updateStatus = useUpdateReadingStatus();
  const remove = useRemoveFromReadingList();
  if (isLoading) return /* @__PURE__ */ jsx(Spinner, {});
  return /* @__PURE__ */ jsxs("section", { children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl mb-4", children: "Reading List" }),
    list.length === 0 ? /* @__PURE__ */ jsx(
      EmptyState,
      {
        icon: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", className: "w-10 h-10", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" }) }),
        title: "Reading list is empty",
        message: "Add books to track what you're reading or want to read.",
        action: /* @__PURE__ */ jsx(Link, { to: "/books", className: "text-xs font-serif tracking-widest uppercase text-imperial-gold hover:underline", children: "Browse Books" })
      }
    ) : /* @__PURE__ */ jsx("ul", { className: "flex flex-col gap-2", children: list.map((item) => /* @__PURE__ */ jsxs("li", { className: "card px-4 py-3 flex flex-col gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(Link, { to: `/books/${item.bookSlug}`, className: "text-imperial-gold hover:underline", children: /* @__PURE__ */ jsx(BookTitle, { slug: item.bookSlug }) }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => remove.mutate(item.bookSlug),
            className: "text-imperial-muted hover:text-red-400 text-sm transition-colors shrink-0 ml-4",
            children: "Remove"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: STATUSES.map(({ value, label }) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => updateStatus.mutate({ slug: item.bookSlug, status: value }),
          className: `text-xs px-3 py-1.5 rounded-full border transition-colors ${item.status === value ? "border-imperial-gold text-imperial-gold bg-imperial-gold/10" : "border-imperial-border text-imperial-muted hover:border-imperial-gold/50 hover:text-imperial-light"}`,
          children: label
        },
        value
      )) })
    ] }, item.bookSlug)) })
  ] });
}
const RANK = {
  admin: "Commissar of the Imperium",
  user: "Soldier of the Imperium"
};
function Profile() {
  const { user } = useAuth();
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto animate-fade-in", children: [
    /* @__PURE__ */ jsx("p", { className: "label mb-2", children: RANK[user?.role] ?? "Soldier of the Imperium" }),
    /* @__PURE__ */ jsx("h1", { className: "text-3xl mb-2", children: "Profile" }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-10 pb-6 border-b border-imperial-border", children: [
      /* @__PURE__ */ jsx("span", { className: "text-imperial-gold/40 text-xs", children: "✦" }),
      /* @__PURE__ */ jsx("p", { className: "text-imperial-gold/70 text-sm font-serif tracking-wide", children: user?.email }),
      /* @__PURE__ */ jsx("span", { className: "text-imperial-gold/40 text-xs", children: "✦" }),
      /* @__PURE__ */ jsx("span", { className: "text-xs font-serif tracking-widest uppercase text-imperial-muted/60", children: user?.role })
    ] }),
    /* @__PURE__ */ jsx(FavoritesSection, {}),
    /* @__PURE__ */ jsx(ReadingListSection, {})
  ] });
}
function useFeaturedAdmin() {
  return useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data } = await client.get("/api/featured");
      return data;
    }
  });
}
function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await client.get("/api/admin/stats");
      return data;
    }
  });
}
function useAddFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookSlug, order }) => client.post("/api/admin/featured", { bookSlug, order }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["featured"] })
  });
}
function useRemoveFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.delete(`/api/admin/featured/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["featured"] })
  });
}
function useReorderFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids) => client.put("/api/admin/featured/reorder", { ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["featured"] })
  });
}
function StatCard({ label, value }) {
  return /* @__PURE__ */ jsxs("div", { className: "card px-5 py-4 flex flex-col gap-1", children: [
    /* @__PURE__ */ jsx("span", { className: "text-3xl font-bold text-imperial-gold", children: value ?? "—" }),
    /* @__PURE__ */ jsx("span", { className: "text-xs text-imperial-muted uppercase tracking-widest", children: label })
  ] });
}
function TopBooksList({ title, books }) {
  if (!books?.length) return null;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h3", { className: "label mb-3", children: title }),
    /* @__PURE__ */ jsx("ol", { className: "flex flex-col gap-1.5", children: books.map((book, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-sm", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-imperial-muted w-4 text-right shrink-0", children: [
        i + 1,
        "."
      ] }),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: `/books/${book.bookSlug}`,
          className: "text-imperial-gold hover:underline flex-1 truncate",
          children: book.bookSlug
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "text-imperial-muted shrink-0", children: book.count })
    ] }, book.bookSlug)) })
  ] });
}
function Dashboard() {
  const { data: stats, isLoading } = useAdminStats();
  if (isLoading) return /* @__PURE__ */ jsx(Spinner, {});
  const { totals, statusBreakdown = {}, topFavorited = [], topReadingList = [] } = stats ?? {};
  return /* @__PURE__ */ jsxs("section", { className: "mb-12", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl mb-4", children: "Overview" }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8", children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Users", value: totals?.users }),
      /* @__PURE__ */ jsx(StatCard, { label: "Favorites", value: totals?.favorites }),
      /* @__PURE__ */ jsx(StatCard, { label: "Reading List", value: totals?.readingList }),
      /* @__PURE__ */ jsx(StatCard, { label: "Want to Read", value: statusBreakdown["want-to-read"] ?? 0 }),
      /* @__PURE__ */ jsx(StatCard, { label: "Reading", value: statusBreakdown["reading"] ?? 0 }),
      /* @__PURE__ */ jsx(StatCard, { label: "Completed", value: statusBreakdown["completed"] ?? 0 })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsx(TopBooksList, { title: "Most Favorited", books: topFavorited }),
      /* @__PURE__ */ jsx(TopBooksList, { title: "Most Added to Reading List", books: topReadingList })
    ] })
  ] });
}
function SortableItem({ book, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.featuredId
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return /* @__PURE__ */ jsxs(
    "li",
    {
      ref: setNodeRef,
      style,
      className: "card px-4 py-3 flex items-center gap-4 touch-none",
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            ...attributes,
            ...listeners,
            className: "text-imperial-muted hover:text-imperial-gold cursor-grab active:cursor-grabbing p-1 -ml-1",
            "aria-label": "Drag to reorder",
            children: "⠿"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "flex-1 text-imperial-gold", children: book.title ?? book.slug ?? book.bookSlug }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onRemove(book.featuredId),
            className: "text-imperial-muted hover:text-red-400 text-sm transition-colors shrink-0",
            children: "Remove"
          }
        )
      ]
    }
  );
}
function Admin() {
  const { data: featured = [], isLoading } = useFeaturedAdmin();
  const add = useAddFeatured();
  const remove = useRemoveFeatured();
  const reorder = useReorderFeatured();
  const [slug, setSlug] = useState("");
  const [addError, setAddError] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );
  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError("");
    try {
      await add.mutateAsync({ bookSlug: slug.trim(), order: featured.length });
      setSlug("");
    } catch (err) {
      setAddError(err.response?.data?.error ?? "Failed to add book");
    }
  };
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = featured.findIndex((b) => b.featuredId === active.id);
    const newIndex = featured.findIndex((b) => b.featuredId === over.id);
    const reordered = arrayMove(featured, oldIndex, newIndex);
    reorder.mutate(reordered.map((b) => b.featuredId));
  };
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto", children: [
    /* @__PURE__ */ jsx(SEO, { title: "Admin", noindex: true }),
    /* @__PURE__ */ jsx("h1", { className: "text-3xl mb-2", children: "Admin" }),
    /* @__PURE__ */ jsx("p", { className: "text-imperial-muted mb-10", children: "Manage featured books and monitor app activity." }),
    /* @__PURE__ */ jsx(Dashboard, {}),
    /* @__PURE__ */ jsx("hr", {}),
    /* @__PURE__ */ jsxs("section", { className: "mb-10 mt-10", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl mb-4", children: "Add Featured Book" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleAdd, className: "flex gap-3", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "input flex-1",
            placeholder: "Book slug (e.g. horus-rising)",
            value: slug,
            onChange: (e) => setSlug(e.target.value),
            required: true
          }
        ),
        /* @__PURE__ */ jsx("button", { className: "btn-gold whitespace-nowrap", type: "submit", disabled: add.isPending, children: add.isPending ? "Adding..." : "Add" })
      ] }),
      addError && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-sm mt-2", children: addError })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl mb-4", children: "Current Featured Books" }),
      isLoading ? /* @__PURE__ */ jsx(Spinner, {}) : featured.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: "✦", title: "No featured books yet", message: "Add a book slug above to feature it on the homepage." }) : /* @__PURE__ */ jsx(DndContext, { sensors, collisionDetection: closestCenter, onDragEnd: handleDragEnd, children: /* @__PURE__ */ jsx(
        SortableContext,
        {
          items: featured.map((b) => b.featuredId),
          strategy: verticalListSortingStrategy,
          children: /* @__PURE__ */ jsx("ul", { className: "flex flex-col gap-2", children: featured.map((book) => /* @__PURE__ */ jsx(
            SortableItem,
            {
              book,
              onRemove: (id) => remove.mutate(id)
            },
            book.featuredId
          )) })
        }
      ) })
    ] })
  ] });
}
function NotFound() {
  return /* @__PURE__ */ jsxs("div", { className: "max-w-xl mx-auto text-center py-24 animate-fade-in", children: [
    /* @__PURE__ */ jsx(SEO, { title: "Page Not Found", noindex: true }),
    /* @__PURE__ */ jsx("p", { className: "label text-xs mb-4", children: "404" }),
    /* @__PURE__ */ jsx("h1", { className: "text-4xl mb-4 leading-none tracking-wide", children: "Lost to the Warp" }),
    /* @__PURE__ */ jsx("p", { className: "text-imperial-muted mb-8 text-sm leading-relaxed", children: "The Codex holds no record of this page. It may have been purged, renamed, or never existed." }),
    /* @__PURE__ */ jsx(Link, { to: "/", className: "btn-gold text-sm px-8 py-3", children: "Return to the Librarium" })
  ] });
}
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1e3 * 60 * 5,
      retry: 1
    }
  }
});
function Layout() {
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx(VerificationBanner, {}),
    /* @__PURE__ */ jsx(Outlet, {}),
    /* @__PURE__ */ jsx(Footer, {})
  ] }) }) });
}
function AuthWrapper() {
  return /* @__PURE__ */ jsx("main", { className: "flex-1 flex flex-col", children: /* @__PURE__ */ jsx(Outlet, {}) });
}
function ContentWrapper() {
  return /* @__PURE__ */ jsx("main", { className: "flex-1 max-w-6xl mx-auto w-full px-4 py-8", children: /* @__PURE__ */ jsx(Outlet, {}) });
}
const API = "https://warhammer-books-api.onrender.com/api/v1";
async function fetchAllSlugs(endpoint) {
  const slugs = [];
  let url = `${API}${endpoint}?page=1`;
  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    const json = await res.json();
    slugs.push(...(json.results ?? []).map((r) => r.slug).filter(Boolean));
    url = json.next ? new URL(json.next, API).toString() : null;
  }
  return slugs;
}
const staticPaths = (prefix, endpoint) => async () => {
  try {
    const slugs = await fetchAllSlugs(endpoint);
    console.log(`[ssg] ${endpoint} → ${slugs.length} paths`);
    return slugs.map((s) => `${prefix}/${s}`);
  } catch (err) {
    console.warn(`[ssg] failed to fetch ${endpoint}: ${err.message}`);
    return [];
  }
};
const routes = [
  {
    path: "/",
    element: /* @__PURE__ */ jsx(Layout, {}),
    children: [
      {
        element: /* @__PURE__ */ jsx(AuthWrapper, {}),
        children: [
          { path: "login", element: /* @__PURE__ */ jsx(Login, {}) },
          { path: "register", element: /* @__PURE__ */ jsx(Register, {}) },
          { path: "forgot-password", element: /* @__PURE__ */ jsx(ForgotPassword, {}) },
          { path: "reset-password/:token", element: /* @__PURE__ */ jsx(ResetPassword, {}) },
          { path: "verify/:token", element: /* @__PURE__ */ jsx(VerifyEmail, {}) }
        ]
      },
      {
        element: /* @__PURE__ */ jsx(ContentWrapper, {}),
        children: [
          { index: true, element: /* @__PURE__ */ jsx(Home, {}) },
          { path: "books", element: /* @__PURE__ */ jsx(Books, {}) },
          {
            path: "books/:slug",
            element: /* @__PURE__ */ jsx(BookDetail, {}),
            getStaticPaths: staticPaths("books", "/books")
          },
          { path: "authors", element: /* @__PURE__ */ jsx(Authors, {}) },
          {
            path: "authors/:slug",
            element: /* @__PURE__ */ jsx(AuthorDetail, {}),
            getStaticPaths: staticPaths("authors", "/authors")
          },
          { path: "series", element: /* @__PURE__ */ jsx(Series, {}) },
          {
            path: "series/:slug",
            element: /* @__PURE__ */ jsx(SeriesDetail, {}),
            getStaticPaths: staticPaths("series", "/series")
          },
          { path: "primarchs", element: /* @__PURE__ */ jsx(Primarchs, {}) },
          {
            path: "primarchs/:slug",
            element: /* @__PURE__ */ jsx(PrimarchDetail, {}),
            getStaticPaths: staticPaths("primarchs", "/primarchs")
          },
          { path: "profile", element: /* @__PURE__ */ jsx(RequireAuth, { children: /* @__PURE__ */ jsx(Profile, {}) }) },
          { path: "admin", element: /* @__PURE__ */ jsx(RequireAdmin, { children: /* @__PURE__ */ jsx(Admin, {}) }) },
          { path: "404", element: /* @__PURE__ */ jsx(NotFound, {}) },
          { path: "*", element: /* @__PURE__ */ jsx(NotFound, {}) }
        ]
      }
    ]
  }
];
const createRoot = ViteReactSSG({ routes });
export {
  createRoot
};
