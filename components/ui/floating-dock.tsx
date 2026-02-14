import { cn } from "../../lib/utils";
import { IconLayoutNavbarCollapse, IconTrash } from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";

export interface FloatingDockItem {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  isLocked?: boolean;
  badge?: number | boolean;
  secondaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  type?: 'item' | 'divider';
}

export const FloatingDock = ({
  items,
  desktopClassName,
  showLabels = false,
}: {
  items: FloatingDockItem[];
  desktopClassName?: string;
  showLabels?: boolean;
}) => {
  return (
    <FloatingDockDesktop items={items} className={desktopClassName} showLabels={showLabels} />
  );
};

const FloatingDockDesktop = ({
  items,
  className,
  showLabels,
}: {
  items: FloatingDockItem[];
  className?: string;
  showLabels?: boolean;
}) => {
  let mouseY = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseY.set(e.clientY)}
      onMouseLeave={() => mouseY.set(Infinity)}
      className={cn(
        "mx-auto flex flex-col h-fit items-center gap-2 rounded-2xl w-full",
        className,
      )}
    >
      {items.map((item, idx) => (
        item.type === 'divider' ? (
          <div key={`divider-${idx}`} className="w-full px-2 my-1">
            <div className="h-px w-full border-t border-dashed border-zinc-200 dark:border-zinc-800/50" />
          </div>
        ) : (
          <IconContainer mouseY={mouseY} key={item.title} showLabels={showLabels} {...item} />
        )
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseY,
  title,
  icon,
  onClick,
  isActive,
  isLocked,
  showLabels,
  badge,
  secondaryAction
}: FloatingDockItem & { mouseY: MotionValue; showLabels?: boolean }) {
  let ref = useRef<HTMLDivElement>(null);

  let distance = useTransform(mouseY, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  // Base width changes based on showLabels - animate smoothly between collapsed (36) and expanded (44)
  let baseWidth = showLabels ? 44 : 36;
  let widthTransform = useTransform(distance, [-100, 0, 100], [36, baseWidth + 16, 36]);
  let heightTransform = useTransform(distance, [-100, 0, 100], [36, baseWidth + 16, 36]);

  let widthTransformIcon = useTransform(distance, [-100, 0, 100], [18, 26, 18]);
  let heightTransformIcon = useTransform(
    distance,
    [-100, 0, 100],
    [18, 26, 18],
  );

  // Use spring with different configs based on showLabels state
  let width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  let height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  let widthIcon = useSpring(widthTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });
  let heightIcon = useSpring(heightTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });

  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex items-center w-full group/btn relative">
      <motion.div 
        className={cn(
          "flex items-center w-full outline-none",
          showLabels ? "gap-3 justify-start" : "justify-center"
        )}
        layout
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <motion.div
          ref={ref}
          layout
          style={{ width, height }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={isLocked ? undefined : onClick}
          className={cn(
            "relative flex aspect-square items-center justify-center rounded-full shrink-0 cursor-pointer",
            isActive 
              ? "bg-[#FF4F01] text-white shadow-lg shadow-[#FF4F01]/30" 
              : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 shadow-sm hover:shadow-md",
            isLocked && "opacity-40 cursor-not-allowed"
          )}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <AnimatePresence mode="wait">
            {hovered && !showLabels && (
              <motion.div
                initial={{ opacity: 0, x: 10, y: "-50%", scale: 0.8 }}
                animate={{ opacity: 1, x: 50, y: "-50%", scale: 1 }}
                exit={{ opacity: 0, x: 10, y: "-50%", scale: 0.8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute left-0 top-1/2 w-fit rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold whitespace-pre text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white z-[100] shadow-xl flex flex-col gap-1 min-w-[80px]"
              >
                <span>{title}</span>
                {secondaryAction && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            secondaryAction.onClick();
                        }}
                        className="flex items-center gap-1.5 text-[9px] text-rose-500 hover:text-rose-600 border-t border-zinc-500/10 pt-1 mt-1 font-black uppercase tracking-widest pointer-events-auto"
                    >
                        {secondaryAction.icon || <IconTrash size={10} />}
                        {secondaryAction.label}
                    </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            style={{ width: widthIcon, height: heightIcon }}
            className="flex items-center justify-center"
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {icon}
          </motion.div>
          {badge && (
              <div className={cn(
                  "absolute -top-1 -right-1 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950",
                  typeof badge === 'number' ? "w-4 h-4 text-white text-[8px] font-bold" : "w-2.5 h-2.5 animate-pulse"
              )}>
                  {typeof badge === 'number' ? badge : null}
              </div>
          )}
        </motion.div>
        <AnimatePresence mode="wait">
          {showLabels && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex-1 flex items-center justify-between min-w-0 pr-2 overflow-hidden"
            >
              <span className={cn(
                "text-xs font-bold truncate transition-colors whitespace-nowrap",
                isActive ? "text-[#FF4F01]" : "text-zinc-500 group-hover/btn:text-zinc-800 dark:group-hover/btn:text-zinc-200"
              )}>
                {title}
              </span>
              {secondaryAction && hovered && (
                  <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={(e) => {
                          e.stopPropagation();
                          secondaryAction.onClick();
                      }}
                      className="p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0"
                      title={secondaryAction.label}
                  >
                      <IconTrash size={12} />
                  </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
