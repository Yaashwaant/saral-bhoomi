
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Info, AlertOctagon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  icon?: boolean;
  size?: 'default' | 'large';
}

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  icon = true,
  size = 'default'
}: ConfirmDialogProps) => {
  const getIconByVariant = () => {
    switch (variant) {
      case 'destructive':
        return <AlertOctagon className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };
  
  const getButtonStyle = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return '';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent 
        className={cn(
          "sm:max-w-[425px]",
          size === 'large' && "sm:max-w-[550px]"
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {icon && getIconByVariant()}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={getButtonStyle()}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
