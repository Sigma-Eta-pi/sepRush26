import type { Field, Makeup } from "./types";
import { useApp } from "./context";
import { todayInput, tomorrowInput, toISO } from "./lib";
export function useStrikeActions() {
  const { state: s, act, openForm } = useApp();
  const master = s.user.role === "master";
  function report(pledgeId?: string) {
    openForm({
      title: master ? "Issue a strike" : "Report a strike",
      description: master
        ? "This strike will be recorded and counted immediately. The pledge can view it and add a response."
        : "Reports are reviewed by a pledge master before they count. Explain what happened clearly and respectfully.",
      fields: [
        {
          name: "pledgeId",
          label: "Pledge",
          type: "select",
          value: pledgeId,
          options: s.users
            .filter(u => u.role === "pledge")
            .map(u => ({ value: u.id, label: u.name })),
        },
        {
          name: "date",
          label: "Date of incident",
          type: "date",
          value: todayInput(),
        },
        { name: "reason", label: "What happened?", type: "textarea" },
        {
          name: "points",
          label: master ? "Strike points" : "Requested strike points",
          type: "number",
          value: 1,
          min: 1,
          max: 3,
        },
      ],
      submit: master ? "Issue strike" : "Send for review",
      onSubmit: v =>
        act(
          "strike.report",
          v,
          master ? "Strike issued" : "Report sent to pledge masters"
        ),
    });
  }
  function assignmentOptions() {
    return s.users
      .filter(u => u.role === "pledge" && !u.archived)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(u => ({ value: u.id, label: u.name }));
  }
  function assign(task: Makeup) {
    const options = assignmentOptions();
    openForm({
      title: "Assign makeup",
      description: options.length
        ? task.title
        : "Add pledges to the chapter before assigning a task.",
      fields: options.length
        ? [
            {
              name: "pledgeId",
              label: "Pledge",
              type: "select",
              options,
            },
          ]
        : [],
      submit: options.length ? "Assign makeup" : "Got it",
      info: !options.length,
      onSubmit: options.length
        ? v => act("makeup.assign", { id: task.id, ...v }, "Makeup assigned")
        : async () => {},
    });
  }
  function offer() {
    openForm({
      title: master ? "Create a makeup task" : "Request a makeup task",
      description: master
        ? "Assign this task to a pledge, or leave it available for anyone to claim. Credit applies only after completed work is linked to an approved strike."
        : "Offer help with your own chapter work. A pledge master approves the task and its credit before anyone claims it.",
      fields: [
        ...(master
          ? [
              {
                name: "pledgeId",
                label: "Assign to",
                type: "select",
                value: "anyone",
                options: [
                  { value: "anyone", label: "Anyone can claim" },
                  ...assignmentOptions(),
                ],
                help: "You can assign work before a strike exists. Link an approved strike when awarding credit.",
              } as Field,
            ]
          : []),
        { name: "title", label: "What do you need help with?" },
        {
          name: "description",
          label: "Clear instructions & what done looks like",
          type: "textarea",
        },
        {
          name: "dueAt",
          label: "Due",
          type: "datetime-local",
          value: tomorrowInput(),
        },
        {
          name: "credit",
          label: "Strike credit",
          type: "number",
          value: 1,
          min: 1,
          max: 3,
        },
      ],
      submit: master ? "Create makeup" : "Request approval",
      onSubmit: v =>
        act(
          "makeup.offer",
          {
            ...v,
            pledgeId: v.pledgeId === "anyone" ? undefined : v.pledgeId,
            dueAt: toISO(v.dueAt),
          },
          master
            ? v.pledgeId && v.pledgeId !== "anyone"
              ? "Makeup assigned"
              : "Makeup opportunity published"
            : "Proposal sent for approval"
        ),
    });
  }
  return { report, offer, assign };
}
