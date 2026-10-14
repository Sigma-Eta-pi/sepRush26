import { MotionTabs, SurfaceTransition } from "../components/motion";
import { useState } from "react";
import {
  ChatCircleTextIcon,
  CheckCircleIcon,
  LockSimpleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowLeftIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { useApp } from "../context";
import { Avatar, Badge, Button, Empty, PageHead } from "../components/ui";
import { dateLabel, findUser, roleName } from "../lib";
export default function Questions() {
  const { state: s, act, openForm, intent } = useApp();
  const [tab, setTab] = useState(intent?.tab || "all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const master = s.user.role === "master";
  const q = s.questions.find(x => x.id === selected);
  function ask() {
    openForm({
      title: "There’s no small question.",
      description:
        "Ask the class, or keep it between you and your pledge masters.",
      fields: [
        { name: "title", label: "What’s on your mind?" },
        { name: "body", label: "A little context", type: "textarea" },
        {
          name: "private",
          label: "Only me & the pledge masters",
          type: "checkbox",
          help: "Private questions never appear in the class conversation.",
        },
      ],
      submit: "Ask question",
      onSubmit: async v => {
        const created = await act(
          "question.create",
          { ...v, private: v.private === "on" },
          "Question posted"
        );
        // Land on the new conversation instead of leaving it somewhere in the list.
        if (typeof created.id === "string") setSelected(created.id);
        else {
          setTab("mine");
          setQuery("");
        }
      },
    });
  }
  const filtered = s.questions
    .filter(
      q =>
        (q.title + " " + q.body).toLowerCase().includes(query.toLowerCase()) &&
        (tab === "all" ||
          (tab === "open" && !q.resolved) ||
          (tab === "mine" && q.authorId === s.user.id) ||
          (tab === "private" && q.private))
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return (
    <>
      <PageHead
        eyebrow="A LITTLE CLARITY GOES A LONG WAY"
        title="Questions"
        description="Questions, answers, and the support to keep moving."
        action={
          <Button onClick={ask}>
            <PlusIcon size={18} />
            Ask a question
          </Button>
        }
      />
      <SurfaceTransition identity={q?.id || `questions:${tab}`}>
        {q ? (
          <>
            <button
              className="back-link"
              onClick={() => {
                setSelected(null);
                setError("");
                setReply("");
              }}
            >
              <ArrowLeftIcon size={17} />
              All questions
            </button>
            <article className="panel question-detail">
              <div className="question-flags">
                {q.private && (
                  <span className="private-label">
                    <LockSimpleIcon size={15} />
                    Private conversation
                  </span>
                )}
                <Badge status={q.resolved ? "approved" : "reported"}>
                  {q.resolved ? "Resolved" : "Open conversation"}
                </Badge>
              </div>
              <h2>{q.title}</h2>
              <div className="person">
                <Avatar user={findUser(s, q.authorId)} size="sm" />
                <span>
                  <strong>{findUser(s, q.authorId)?.name}</strong>
                  <small>{dateLabel(q.createdAt)}</small>
                </span>
              </div>
              <p className="question-body">{q.body}</p>
              {q.replies.map(r => (
                <div
                  className={`reply ${findUser(s, r.authorId)?.role === "master" ? "master-reply" : ""}`}
                  key={r.id}
                >
                  <div className="person">
                    <Avatar user={findUser(s, r.authorId)} size="sm" />
                    <span>
                      <strong>
                        {findUser(s, r.authorId)?.name}{" "}
                        <span className="role-inline">
                          {roleName(findUser(s, r.authorId)?.role || "")}
                        </span>
                      </strong>
                      <small>{dateLabel(r.createdAt)}</small>
                    </span>
                  </div>
                  <p>{r.body}</p>
                </div>
              ))}
              {!q.replies.length && (
                <div className="waiting-reply">
                  <ChatCircleTextIcon size={22} />
                  <p>
                    {master
                      ? "This question is waiting for your answer."
                      : q.authorId === s.user.id
                        ? "Your pledge masters can answer here. You can add more context anytime."
                        : "The pledge masters will answer here."}
                  </p>
                </div>
              )}
              {(master || q.authorId === s.user.id) && (
                <form
                  className="reply-form"
                  onSubmit={async e => {
                    e.preventDefault();
                    setBusy(true);
                    setError("");
                    try {
                      await act(
                        "question.reply",
                        { id: q.id, body: reply },
                        "Reply posted"
                      );
                      setReply("");
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label htmlFor="reply">
                    {master ? "A thoughtful answer" : "Add to the conversation"}
                  </label>
                  <textarea
                    id="reply"
                    required
                    maxLength={4000}
                    rows={4}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Write your reply…"
                  />
                  {error && (
                    <p className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="flex justify-between items-center gap-3">
                    <span className="muted text-xs">
                      {q.private
                        ? "Visible only to the author and pledge masters"
                        : "Visible to the class"}
                    </span>
                    <Button disabled={busy} type="submit">
                      <PaperPlaneTiltIcon size={16} />
                      {busy ? "Posting…" : "Post reply"}
                    </Button>
                  </div>
                </form>
              )}
              {master && (
                <div className="question-resolution">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      openForm({
                        title: q.resolved
                          ? "Reopen this conversation?"
                          : "Mark this question resolved?",
                        fields: [],
                        submit: q.resolved
                          ? "Reopen conversation"
                          : "Mark resolved",
                        onSubmit: () =>
                          act(
                            "question.resolve",
                            { id: q.id },
                            "Question updated"
                          ),
                      })
                    }
                  >
                    <CheckCircleIcon size={17} />
                    {q.resolved ? "Reopen question" : "Mark resolved"}
                  </Button>
                </div>
              )}
            </article>
          </>
        ) : (
          <>
            <div className="toolbar">
              <MotionTabs className="tabs">
                {[
                  ["all", "All questions"],
                  ["open", "Open"],
                  ["mine", "My questions"],
                  ["private", "Private"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={tab === id ? "active" : ""}
                    onClick={() => setTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </MotionTabs>
              <label className="search-field">
                <MagnifyingGlassIcon size={18} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  aria-label="Search questions"
                  placeholder="Find an answer…"
                />
              </label>
            </div>
            <div className="question-layout">
              <div className="panel question-list">
                {filtered.map(q => (
                  <button
                    className="question-list-item"
                    onClick={() => setSelected(q.id)}
                    key={q.id}
                  >
                    <Avatar user={findUser(s, q.authorId)} />
                    <div className="grow">
                      <div className="question-flags">
                        {q.private && (
                          <span className="private-label">
                            <LockSimpleIcon size={13} />
                            Private
                          </span>
                        )}
                        {q.resolved && (
                          <span className="success-line">
                            <CheckCircleIcon size={14} />
                            Resolved
                          </span>
                        )}
                      </div>
                      <h3>{q.title}</h3>
                      <p>{q.body}</p>
                      <span className="question-author">
                        {findUser(s, q.authorId)?.name} ·{" "}
                        {dateLabel(q.createdAt)}
                      </span>
                    </div>
                    <span className="reply-count">
                      <ChatCircleTextIcon size={18} />
                      {q.replies.length}
                    </span>
                  </button>
                ))}
                {!filtered.length && (
                  <Empty
                    title={
                      tab === "all" && !query
                        ? "Make space for a question"
                        : "No questions in this view"
                    }
                    description="Start a conversation or see every question."
                    action={
                      <>
                        {(tab !== "all" || query) && (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setTab("all");
                              setQuery("");
                            }}
                          >
                            Show all questions
                          </Button>
                        )}
                        <Button onClick={ask}>Ask a question</Button>
                      </>
                    }
                  />
                )}
              </div>
              <aside className="help-panel question-help">
                <ChatCircleTextIcon size={30} />
                <h3>You’re in good company.</h3>
                <p>
                  If you’re wondering about it, someone else probably is too.
                </p>
                <div className="help-tip">
                  <CheckCircleIcon size={18} />
                  <span>
                    Pledge masters answer and mark questions resolved.
                  </span>
                </div>
                <div className="help-tip">
                  <LockSimpleIcon size={18} />
                  <span>Personal question? Keep it private.</span>
                </div>
                <div className="help-tip">
                  <MagnifyingGlassIcon size={18} />
                  <span>Search first. Your answer may already be here.</span>
                </div>
              </aside>
            </div>
          </>
        )}
      </SurfaceTransition>
    </>
  );
}
