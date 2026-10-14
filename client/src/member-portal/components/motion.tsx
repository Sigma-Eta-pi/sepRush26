import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type ReactElement,
  type HTMLAttributes,
} from "react";
import {
  LayoutGroup,
  MotionConfig,
  motion,
  useIsPresent,
  useReducedMotion,
  type DragControls,
} from "framer-motion";

// One motion language. Springs carry velocity through interrupted interactions.
export const fluidSpring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 30,
  mass: 0.8,
};
export const softSpring = {
  type: "spring" as const,
  stiffness: 340,
  damping: 32,
  mass: 0.8,
};
export function PortalMotion({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={fluidSpring}>
      {children}
    </MotionConfig>
  );
}
export function SurfaceTransition({
  children,
  className = "",
  identity,
}: {
  children: ReactNode;
  className?: string;
  identity: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={identity}
      className={`motion-surface ${className}`}
      initial={reduce ? false : { opacity: 0, y: 18, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...softSpring, opacity: { duration: 0.24 } }}
    >
      {children}
    </motion.div>
  );
}
export function SelectionIndicator({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      className={`selection-indicator ${className}`}
      layoutId={reduce ? undefined : id}
      transition={fluidSpring}
    />
  );
}

// Keep existing button semantics and labels; only the selection surface moves.
export function MotionTabs({
  children,
  className = "tabs",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const id = useId();
  function decorate(nodes: ReactNode): ReactNode {
    return Children.map(nodes, node => {
      if (!isValidElement(node)) return node;
      const child = node as ReactElement<{
        children?: ReactNode;
        className?: string;
        "aria-pressed"?: boolean;
        "aria-selected"?: boolean;
        role?: string;
      }>;
      if (child.type === Fragment)
        return cloneElement(child, {}, decorate(child.props.children));
      if (child.type !== "button") return child;
      const active =
        child.props["aria-selected"] ||
        /\b(active|selected)\b/.test(child.props.className || "");
      return cloneElement(
        child,
        child.props.role === "tab" ? {} : { "aria-pressed": !!active },
        active && <SelectionIndicator id="selected" />,
        <span className="motion-tab-label">{child.props.children}</span>
      );
    });
  }
  return (
    <LayoutGroup id={id}>
      <div {...props} className={`${className} motion-tabs`}>
        {decorate(children)}
      </div>
    </LayoutGroup>
  );
}

let modalCount = 0;
let originalOverflow = "";
export function MotionDialog({
  children,
  className = "",
  onClose,
  labelledBy,
  busy = false,
  dismissOutside = true,
  dragControls,
}: {
  children: ReactNode;
  className?: string;
  onClose: () => void;
  labelledBy: string;
  busy?: boolean;
  dismissOutside?: boolean;
  dragControls?: DragControls;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const present = useIsPresent();
  const reduce = useReducedMotion();
  const sheet = className.includes("workspace-menu-sheet");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const opener = document.activeElement as HTMLElement | null;
    el.showModal();
    if (modalCount++ === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      el.close();
      if (--modalCount === 0) {
        document.body.style.overflow = originalOverflow;
        // Removal occurs after exit; the native dialog may already be detached.
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      }
    };
  }, []);
  return (
    <motion.dialog
      ref={ref}
      drag={dragControls && !reduce ? "y" : false}
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.3 }}
      onDragEnd={(_, info) => {
        if (!busy && present && (info.offset.y > 45 || info.velocity.y > 450))
          onClose();
      }}
      className={`modal fluid-dialog ${className}`}
      aria-labelledby={labelledBy}
      aria-busy={busy || undefined}
      data-exiting={!present || undefined}
      initial={
        reduce
          ? false
          : {
              opacity: 0,
              x: 0,
              y: sheet ? 90 : 18,
              scale: sheet ? 1 : 0.96,
            }
      }
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={
        reduce
          ? { opacity: 0 }
          : {
              opacity: 0,
              x: 0,
              y: sheet ? 70 : 10,
              scale: sheet ? 1 : 0.985,
            }
      }
      transition={{ ...softSpring, opacity: { duration: reduce ? 0 : 0.14 } }}
      onClickCapture={e => {
        if (!present) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onSubmitCapture={e => {
        if (!present) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onCancel={e => {
        e.preventDefault();
        if (!busy && present) onClose();
      }}
      onClick={e => {
        if (e.target !== e.currentTarget || busy || !present || !dismissOutside)
          return;
        const box = e.currentTarget.getBoundingClientRect();
        // Native dialogs retarget backdrop clicks. Padding inside is not a dismissal.
        if (
          e.clientX < box.left ||
          e.clientX > box.right ||
          e.clientY < box.top ||
          e.clientY > box.bottom
        )
          onClose();
      }}
    >
      {children}
    </motion.dialog>
  );
}
