import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuContent = ({ className, ...props }: any) => (
  <DropdownMenuPrimitive.Content
    align="end"
    sideOffset={5}
    className={cn(
      "z-50 min-w-[160px] rounded-md border border-border bg-card p-1 shadow-md",
      className
    )}
    {...props}
  />
);
const DropdownMenuItem = ({ className, ...props }: any) => (
  <DropdownMenuPrimitive.Item
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground",
      className
    )}
    {...props}
  />
);
const DropdownMenuLabel = DropdownMenuPrimitive.Label;
const DropdownMenuSeparator = DropdownMenuPrimitive.Separator;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
