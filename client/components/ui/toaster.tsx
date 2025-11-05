import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import React from "react"; // Import React for Fragment

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      <ToastViewport>
        {/* The ToastViewport expects a single child, so wrap the mapped toasts in a React.Fragment */}
        <React.Fragment>
          {toasts.map(function ({ id, title, description, action, ...props }) {
            return (
              <Toast key={id} {...props}>
                <div className="flex items-center justify-between w-full">
                  <div className="grid gap-1">
                    {title && <ToastTitle>{title}</ToastTitle>}
                    {description && (
                      <ToastDescription>{description}</ToastDescription>
                    )}
                  </div>
                  {action}
                  <ToastClose />
                </div>
              </Toast>
            );
          })}
        </React.Fragment>
      </ToastViewport>
    </ToastProvider>
  );
}