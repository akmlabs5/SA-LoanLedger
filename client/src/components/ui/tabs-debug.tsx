import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const [debugInfo, setDebugInfo] = React.useState<string[]>([]);
  
  const logEvent = (eventType: string) => {
    const timestamp = new Date().toISOString().split('T')[1];
    const info = `${timestamp} - ${eventType}`;
    console.log(`[TAB DEBUG] ${info}`, props.value);
    setDebugInfo(prev => [...prev.slice(-4), info]);
  };

  return (
    <div className="relative">
      <TabsPrimitive.Trigger
        ref={ref}
        onPointerDown={(e) => {
          logEvent('pointerdown');
          props.onPointerDown?.(e);
        }}
        onPointerUp={(e) => {
          logEvent('pointerup');
          props.onPointerUp?.(e);
        }}
        onClick={(e) => {
          logEvent('click');
          props.onClick?.(e);
        }}
        onTouchStart={(e) => {
          logEvent('touchstart');
          props.onTouchStart?.(e);
        }}
        onTouchEnd={(e) => {
          logEvent('touchend');
          props.onTouchEnd?.(e);
        }}
        onMouseDown={(e) => {
          logEvent('mousedown');
          props.onMouseDown?.(e);
        }}
        onMouseUp={(e) => {
          logEvent('mouseup');
          props.onMouseUp?.(e);
        }}
        onFocus={(e) => {
          logEvent('focus');
          props.onFocus?.(e);
        }}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm touch-manipulation cursor-pointer",
          className
        )}
        {...props}
      />
      {/* Debug overlay */}
      {debugInfo.length > 0 && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-black/90 text-white text-xs rounded z-50 min-w-[200px] max-w-[300px]">
          <div className="font-bold mb-1">Event Log ({props.value}):</div>
          {debugInfo.map((info, i) => (
            <div key={i} className="font-mono text-[10px]">{info}</div>
          ))}
        </div>
      )}
    </div>
  );
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
