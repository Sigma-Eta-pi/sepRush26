import { useEffect, useId, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  useDragControls,
} from "framer-motion";
import { Command } from "cmdk";
import { Link } from "wouter";
import {
  HouseIcon,
  UsersThreeIcon,
  HandHeartIcon,
  CalendarBlankIcon,
  CoffeeIcon,
  CheckCircleIcon,
  ChatCircleTextIcon,
  GearSixIcon,
  MagnifyingGlassIcon,
  SidebarSimpleIcon,
  CaretRightIcon,
  ArrowUpRightIcon,
  DotsThreeIcon,
  XIcon,
  SignOutIcon,
  SquaresFourIcon,
  FilesIcon,
  MegaphoneIcon,
  ListChecksIcon,
  GraduationCapIcon,
  ArrowsLeftRightIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import logo from "@/images/logo.png";
import { useAuth, canEditSite } from "@/contexts/AuthContext";
import { useApp } from "../context";
import { roleName } from "../lib";
import { navigationGroups, type NavigationItem } from "../navigation";
import type { Page } from "../types";
import { Avatar } from "./ui";
import { MotionDialog, SelectionIndicator, softSpring } from "./motion";

const icons = {
  today: HouseIcon,
  members: UsersThreeIcon,
  accountability: HandHeartIcon,
  calendar: CalendarBlankIcon,
  coffee: CoffeeIcon,
  deliverables: CheckCircleIcon,
  questions: ChatCircleTextIcon,
  settings: GearSixIcon,
  updates: MegaphoneIcon,
  "chapter-calendar": CalendarBlankIcon,
  tasks: ListChecksIcon,
  connections: ArrowsLeftRightIcon,
  alumni: GraduationCapIcon,
  docs: FilesIcon,
  admin: GearSixIcon,
};

export default function Navigation({
  children,
  onSignOut,
}: {
  children: ReactNode;
  onSignOut: () => void;
}) {
  const { state, page, navigate } = useApp();
  const auth = useAuth();
  const reduce = useReducedMotion();
  const menuDrag = useDragControls();
  const [compact, setCompact] = useState(false);
  const [overlay, setOverlay] = useState<"menu" | "search" | "account" | null>(
    null
  );
  const [chapterOpen, setChapterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const id = useId();
  const groups = navigationGroups(state.user.role, auth.user?.role);
  const items = groups.flatMap(g => g.items);
  const current = items.find(i => i.id === page);
  const chapterActive = groups
    .find(g => g.label === "Chapter tools")
    ?.items.some(i => i.id === page);
  useEffect(() => {
    if (chapterActive) setChapterOpen(true);
  }, [chapterActive]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        // Do not take focus away from a form or another native modal.
        if (document.querySelector("dialog[open]") && overlay !== "search")
          return;
        event.preventDefault();
        setQuery("");
        setOverlay(value => (value === "search" ? null : "search"));
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [overlay]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 681px)");
    const closeMobile = () => {
      if (desktop.matches)
        setOverlay(value => (value === "menu" ? null : value));
    };
    desktop.addEventListener("change", closeMobile);
    return () => desktop.removeEventListener("change", closeMobile);
  }, []);
  const go = (destination: Page) => {
    setOverlay(null);
    navigate(destination);
  };
  const search = () => {
    setQuery("");
    setOverlay("search");
  };
  function itemButton(item: NavigationItem, index = 0, stagger = false) {
    const Icon = icons[item.id] || SquaresFourIcon;
    const active = page === item.id;
    return (
      <motion.button
        key={item.id}
        className={`workspace-item ${active ? "is-current" : ""}`}
        aria-current={active ? "page" : undefined}
        title={compact ? item.label : undefined}
        onClick={() => go(item.id)}
        initial={stagger && !reduce ? { opacity: 0, x: -10 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          ...softSpring,
          delay: stagger && !reduce ? Math.min(index * 0.035, 0.18) : 0,
        }}
        whileTap={reduce ? undefined : { scale: 0.96 }}
      >
        {active && <SelectionIndicator id="workspace-selection" />}
        <Icon size={19} weight={active ? "fill" : "regular"} />
        <span className="workspace-item-label">{item.label}</span>
      </motion.button>
    );
  }
  const account = (
    <button
      className="workspace-account"
      onClick={() => setOverlay("account")}
      aria-label={`Account menu for ${state.user.name}`}
    >
      <Avatar user={state.user} />
      <span className="workspace-account-details">
        <strong>{state.user.name}</strong>
        <small>{roleName(state.user.role)}</small>
      </span>
      <DotsThreeIcon size={22} />
    </button>
  );
  return (
    <div className={`workspace-shell ${compact ? "is-compact" : ""}`}>
      <aside className="workspace-sidebar" aria-label="Chapter navigation">
        <div className="workspace-brand-row">
          <button
            className="workspace-brand"
            aria-label="Dashboard overview"
            onClick={() => go("today")}
          >
            <img src={logo} alt="" />
            <span>
              Sigma Eta Pi<small>UCSB · Epsilon</small>
            </span>
          </button>
          <button
            className="workspace-collapse"
            aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!compact}
            onClick={() => setCompact(!compact)}
          >
            <SidebarSimpleIcon size={19} />
          </button>
        </div>
        <div className="workspace-cohort">
          <span className="workspace-cohort-mark">Σ</span>
          <div>
            <strong>{state.settings.cohort}</strong>
            <small>{state.settings.term} · New members</small>
          </div>
        </div>
        <button
          className="workspace-search"
          onClick={search}
          aria-label="Search navigation"
        >
          <MagnifyingGlassIcon size={18} />
          <span>Go to…</span>
          <kbd>⌘ K</kbd>
        </button>
        <div className="workspace-nav-scroll">
          <LayoutGroup id={`${id}-desktop`}>
            <nav aria-label="Main navigation">
              {groups
                .filter(g => g.label !== "Manage")
                .map(group => (
                  <section className="workspace-group" key={group.label}>
                    {group.label === "Chapter tools" ? (
                      <>
                        <button
                          className="workspace-group-toggle"
                          aria-expanded={chapterOpen}
                          aria-controls={`${id}-chapter`}
                          onClick={() => {
                            if (compact) setCompact(false);
                            setChapterOpen(!chapterOpen);
                          }}
                          title="Chapter tools"
                        >
                          <SquaresFourIcon size={16} />
                          <span>Chapter tools</span>
                          <motion.span
                            animate={{ rotate: chapterOpen ? 90 : 0 }}
                          >
                            <CaretRightIcon size={13} />
                          </motion.span>
                        </button>
                        <AnimatePresence initial={false}>
                          {chapterOpen && !compact && (
                            <motion.div
                              id={`${id}-chapter`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={reduce ? { duration: 0 } : softSpring}
                              className="workspace-disclosure"
                            >
                              <div>
                                {group.items.map((item, index) =>
                                  itemButton(item, index, true)
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <>
                        <h2>{group.label}</h2>
                        {group.items.map(item => itemButton(item))}
                      </>
                    )}
                  </section>
                ))}
            </nav>
          </LayoutGroup>
        </div>
        <div className="workspace-sidebar-footer">
          {groups
            .find(g => g.label === "Manage")
            ?.items.map(item => itemButton(item))}
          {account}
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-breadcrumb">
            <button
              className="workspace-crumb"
              onClick={() => go("today")}
              aria-label={`${state.settings.cohort} overview`}
            >
              {state.settings.cohort}
            </button>
            <CaretRightIcon size={13} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.strong
                key={page}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.14 }}
              >
                {current?.label || "Overview"}
              </motion.strong>
            </AnimatePresence>
          </div>
          <div className="workspace-header-actions">
            <span className="workspace-role">{roleName(state.user.role)}</span>
            <button aria-label="Search navigation" onClick={search}>
              <MagnifyingGlassIcon size={19} />
            </button>
            <button
              className="workspace-mobile-menu-trigger"
              aria-label="Open menu"
              onClick={() => setOverlay("menu")}
            >
              <SquaresFourIcon size={21} />
            </button>
          </div>
        </header>
        {children}
      </div>
      <LayoutGroup id={`${id}-dock`}>
        <nav className="workspace-dock" aria-label="Quick navigation">
          {(["today", "members", "accountability", "calendar"] as Page[]).map(
            destination => {
              const item = items.find(i => i.id === destination);
              if (!item) return null;
              const Icon = icons[destination] || HouseIcon;
              return (
                <motion.button
                  key={destination}
                  onClick={() => go(destination)}
                  aria-current={page === destination ? "page" : undefined}
                  whileTap={reduce ? undefined : { scale: 0.9 }}
                >
                  {page === destination && (
                    <SelectionIndicator id="dock-selection" />
                  )}
                  <Icon
                    size={21}
                    weight={page === destination ? "fill" : "regular"}
                  />
                  <span>
                    {destination === "members"
                      ? "Chapter"
                      : destination === "accountability"
                        ? "Strikes"
                        : item.label}
                  </span>
                </motion.button>
              );
            }
          )}
          <motion.button
            onClick={() => setOverlay("menu")}
            aria-label="More navigation"
            aria-expanded={overlay === "menu"}
            whileTap={reduce ? undefined : { scale: 0.9 }}
          >
            <SquaresFourIcon size={21} />
            <span>More</span>
          </motion.button>
        </nav>
      </LayoutGroup>
      <AnimatePresence>
        {overlay === "menu" && (
          <MotionDialog
            key="menu"
            className="workspace-menu-sheet"
            dragControls={menuDrag}
            labelledBy={`${id}-menu-title`}
            onClose={() => setOverlay(null)}
          >
            <div
              className="workspace-sheet-handle"
              aria-hidden="true"
              onPointerDown={event => menuDrag.start(event)}
            />
            <div className="workspace-dialog-heading">
              <div>
                <h2 id={`${id}-menu-title`}>Your workspace</h2>
                <p>
                  {state.settings.cohort} · {roleName(state.user.role)}
                </p>
              </div>
              <button aria-label="Close menu" onClick={() => setOverlay(null)}>
                <XIcon size={21} />
              </button>
            </div>
            <LayoutGroup id={`${id}-sheet`}>
              <nav aria-label="All navigation">
                {groups.map(group => (
                  <section className="workspace-group" key={group.label}>
                    <h3>{group.label}</h3>
                    <div className="workspace-sheet-grid">
                      {group.items.map((item, i) => itemButton(item, i, true))}
                    </div>
                  </section>
                ))}
              </nav>
            </LayoutGroup>
            {account}
          </MotionDialog>
        )}
        {overlay === "search" && (
          <MotionDialog
            key="search"
            className="workspace-command"
            labelledBy={`${id}-search-title`}
            onClose={() => setOverlay(null)}
          >
            <h2 id={`${id}-search-title`} className="sr-only">
              Go to a page
            </h2>
            <Command
              label="Search navigation"
              loop
              filter={(value, search) =>
                search
                  .toLowerCase()
                  .trim()
                  .split(/\s+/)
                  .every(word => value.toLowerCase().includes(word))
                  ? 1
                  : 0
              }
            >
              <div className="workspace-command-input">
                <MagnifyingGlassIcon size={22} />
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Where would you like to go?"
                />
                <button
                  aria-label="Close search"
                  onClick={() => setOverlay(null)}
                >
                  <XIcon size={19} />
                </button>
              </div>
              <Command.List>
                <Command.Empty>
                  No matching pages. Try “coffee” or “calendar”.
                </Command.Empty>
                {groups.map(group => (
                  <Command.Group key={group.label} heading={group.label}>
                    {group.items.map(item => {
                      const Icon = icons[item.id] || SquaresFourIcon;
                      return (
                        <Command.Item
                          key={item.id}
                          value={`${item.label} ${item.hint}`}
                          onSelect={() => go(item.id)}
                        >
                          <Icon size={20} />
                          <span>
                            <strong>{item.label}</strong>
                            <small>{item.hint}</small>
                          </span>
                          <ArrowUpRightIcon size={16} />
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ))}
              </Command.List>
              <div className="workspace-command-footer">
                <span>↑ ↓ to move</span>
                <span>↵ to open</span>
                <span>esc to close</span>
              </div>
            </Command>
          </MotionDialog>
        )}
        {overlay === "account" && (
          <MotionDialog
            key="account"
            className="workspace-account-dialog"
            labelledBy={`${id}-account-title`}
            onClose={() => setOverlay(null)}
          >
            <div className="workspace-dialog-heading">
              <div>
                <h2 id={`${id}-account-title`}>{state.user.name}</h2>
                <p>{roleName(state.user.role)}</p>
              </div>
              <button
                aria-label="Close account menu"
                onClick={() => setOverlay(null)}
              >
                <XIcon size={20} />
              </button>
            </div>
            <div className="workspace-account-links">
              <button
                className="workspace-account-profile"
                onClick={() => {
                  setOverlay(null);
                  navigate("members", { action: "edit-profile" });
                }}
              >
                Edit my profile
                <UserCircleIcon size={18} />
              </button>
              <Link href="/" onClick={() => setOverlay(null)}>
                SEP website
                <ArrowUpRightIcon size={18} />
              </Link>
              <Link href="/recruitment" onClick={() => setOverlay(null)}>
                Rush & recruitment
                <ArrowUpRightIcon size={18} />
              </Link>
              {canEditSite(auth.user) && (
                <Link href="/editor" onClick={() => setOverlay(null)}>
                  Website editor
                  <ArrowUpRightIcon size={18} />
                </Link>
              )}
              <button
                onClick={() => {
                  setOverlay(null);
                  onSignOut();
                }}
              >
                Sign out
                <SignOutIcon size={18} />
              </button>
            </div>
          </MotionDialog>
        )}
      </AnimatePresence>
    </div>
  );
}
