import type { Makeup, Strike } from "./types";

export function strikeSlots(
  strikes: Strike[],
  makeups: Makeup[],
  pledgeId: string
) {
  return strikes
    .filter(
      strike => strike.pledgeId === pledgeId && strike.status === "approved"
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id)
    )
    .flatMap(strike => {
      const credit = Math.min(
        strike.points,
        makeups
          .filter(
            task =>
              task.strikeId === strike.id &&
              task.pledgeId === strike.pledgeId &&
              task.status === "approved"
          )
          .reduce((total, task) => total + task.credit, 0)
      );
      return Array.from({ length: strike.points }, (_, point) => ({
        strike,
        point: point + 1,
        madeUp: point < credit,
      }));
    });
}
