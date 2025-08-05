
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { isValidEmail } from '../utils/crm-operations';

interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  isEmail?: boolean;
  isNumber?: boolean;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean;
  errorMessage?: string;
}

interface ValidationConfig {
  [key: string]: FieldValidation;
}

export const useFormOperations = <T extends Record<string, any>>(
  initialValues: T,
  validationConfig: ValidationConfig = {}
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Handle input change
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;
    
    // Handle different input types
    if (type === 'number') {
      processedValue = value === '' ? '' : Number(value);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    
    setValues(prev => ({ ...prev, [name]: processedValue }));
    setIsDirty(true);
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);
  
  // Set a specific field value programmatically
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear error when field is set
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);
  
  // Handle blur event for immediate validation
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Validate field on blur if it has validation rules
    if (validationConfig[name]) {
      const validation = validationConfig[name];
      const error = validateField(name, value, validation);
      
      if (error) {
        setErrors(prev => ({ ...prev, [name]: error }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  }, [validationConfig]);
  
  // Validate a single field
  const validateField = (field: string, value: any, rules: FieldValidation): string | null => {
    if (rules.required && (!value && value !== false && value !== 0)) {
      return rules.errorMessage || `Ce champ est obligatoire`;
    }
    
    if (value !== null && value !== undefined) {
      const strValue = String(value);
      
      if (rules.minLength && strValue.length < rules.minLength) {
        return rules.errorMessage || `Minimum ${rules.minLength} caractères requis`;
      }
      
      if (rules.maxLength && strValue.length > rules.maxLength) {
        return rules.errorMessage || `Maximum ${rules.maxLength} caractères autorisés`;
      }
      
      if (rules.pattern && !rules.pattern.test(strValue)) {
        return rules.errorMessage || `Format invalide`;
      }
      
      if (rules.isEmail && !isValidEmail(strValue)) {
        return rules.errorMessage || `Email invalide`;
      }
      
      if (rules.isNumber) {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return rules.errorMessage || `Veuillez entrer un nombre valide`;
        }
        
        if (rules.min !== undefined && numValue < rules.min) {
          return rules.errorMessage || `La valeur minimale est ${rules.min}`;
        }
        
        if (rules.max !== undefined && numValue > rules.max) {
          return rules.errorMessage || `La valeur maximale est ${rules.max}`;
        }
      }
      
      if (rules.custom && !rules.custom(value)) {
        return rules.errorMessage || `Valeur invalide`;
      }
    }
    
    return null;
  };
  
  // Validate all form fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    // Validate each field with configured rules
    Object.entries(validationConfig).forEach(([field, rules]) => {
      const error = validateField(field, values[field], rules);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [values, validationConfig]);
  
  // Handle form submission
  const handleSubmit = useCallback((
    onSubmit: (values: T) => void | Promise<void>
  ) => async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    setIsSubmitting(true);
    
    // Validate all fields
    const isValid = validateForm();
    
    if (isValid) {
      try {
        await onSubmit(values);
        setIsDirty(false);
      } catch (error) {
        console.error('Form submission error:', error);
        toast.error('Erreur lors de l\'envoi du formulaire');
      }
    } else {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      
      // Focus the first field with error
      if (formRef.current) {
        const firstErrorField = Object.keys(errors)[0];
        const element = formRef.current.elements.namedItem(firstErrorField);
        if (element && 'focus' in element) {
          (element as HTMLElement).focus();
        }
      }
    }
    
    setIsSubmitting(false);
  }, [values, errors, validateForm]);
  
  // Reset form to initial or specific values
  const resetForm = useCallback((newValues?: T) => {
    setValues(newValues || initialValues);
    setErrors({});
    setIsDirty(false);
  }, [initialValues]);
  
  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    formRef,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    resetForm,
    validateForm,
    validateField
  };
};

export default useFormOperations;
