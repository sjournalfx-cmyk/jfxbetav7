import { cn } from "@/lib/utils";
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
  mobileClassName,
  showLabels = false,
}: {
  items: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
  showLabels?: boolean;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} showLabels={showLabels} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const visibleItems = items.filter(i => i.type !== 'divider');

  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2"
          >
            {visibleItems.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: {
                    delay: idx * 0.05,
                  },
                }}
                transition={{ delay: (visibleItems.length - 1 - idx) * 0.05 }}
              >
                <button
                  onClick={item.onClick}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-900 relative",
                    item.isActive && "bg-[#FF4F01] text-white",
                    item.isLocked && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="h-4 w-4">{item.icon}</div>
                  {item.badge && (
                    <div className={cn(
                        "absolute -top-1 -right-1 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950",
                        typeof item.badge === 'number' ? "w-4 h-4 text-white text-[7px] font-bold" : "w-2.5 h-2.5 animate-pulse"
                    )}>
                        {typeof item.badge === 'number' ? item.badge : null}
                    </div>
                  )}
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-800"
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      </button>
    </div>
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
        "mx-auto hidden flex-col h-fit items-center gap-2 rounded-2xl md:flex w-full",
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

  let widthTransform = useTransform(distance, [-100, 0, 100], [36, 52, 36]);
  let heightTransform = useTransform(distance, [-100, 0, 100], [36, 52, 36]);

  let widthTransformIcon = useTransform(distance, [-100, 0, 100], [18, 26, 18]);
  let heightTransformIcon = useTransform(
    distance,
    [-100, 0, 100],
    [18, 26, 18],
  );

  let width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  let height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  let widthIcon = useSpring(widthTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });
  let heightIcon = useSpring(heightTransformIcon, { mass: 0.1, stiffness: 150, damping: 12 });

  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex items-center w-full group/btn relative">
      <button 
        onClick={isLocked ? undefined : onClick} 
        className={cn(
          "flex items-center w-full outline-none transition-all duration-300",
          showLabels ? "gap-3 justify-start" : "justify-center"
        )}
      >
        <motion.div
          ref={ref}
          style={{ width, height }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={cn(
            "relative flex aspect-square items-center justify-center rounded-full transition-colors shrink-0",
            isActive 
              ? "bg-[#FF4F01] text-white shadow-lg shadow-[#FF4F01]/30" 
              : "bg-gray-100 dark:bg-neutral-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
            isLocked && "opacity-40 cursor-not-allowed"
          )}
        >
          <AnimatePresence>
            {hovered && !showLabels && (
              <motion.div
                initial={{ opacity: 0, x: 10, y: "-50%" }}
                animate={{ opacity: 1, x: 50, y: "-50%" }}
                exit={{ opacity: 0, x: 10, y: "-50%" }}
                className="absolute left-0 top-1/2 w-fit rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-bold whitespace-pre text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white z-[100] shadow-xl flex flex-col gap-1 min-w-[80px]"
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
        {showLabels && (
          <div className="flex-1 flex items-center justify-between min-w-0 pr-2">
            <span className={cn(
              "text-xs font-bold truncate transition-colors",
              isActive ? "text-[#FF4F01]" : "text-zinc-500 group-hover/btn:text-zinc-800 dark:group-hover/btn:text-zinc-200"
            )}>
              {title}
            </span>
            {secondaryAction && hovered && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        secondaryAction.onClick();
                    }}
                    className="p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors shrink-0"
                    title={secondaryAction.label}
                >
                    <IconTrash size={12} />
                </button>
            )}
          </div>
        )}
      </button>
    </div>
  );
}
