import { useState, useCallback } from 'react';
import { validateAndSanitizeForm, validateForm } from '@/lib/validation';
import { z } from 'zod';

export const useFormValidation = <T>(schema: z.ZodSchema<T>, initialData: any) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback((data: any) => {
    const result = validateAndSanitizeForm(schema, data);
    if (result.success) {
      setErrors({});
      return { success: true, data: result.data };
    } else {
      setErrors(result.errors || {});
      return { success: false, errors: result.errors };
    }
  }, [schema]);

  const validateField = useCallback((field: string, value: any) => {
    const fieldSchema = schema.shape[field];
    if (fieldSchema) {
      try {
        fieldSchema.parse(value);
        setErrors(prev => ({ ...prev, [field]: '' }));
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessage = error.errors[0]?.message || 'Valor inválido';
          setErrors(prev => ({ ...prev, [field]: errorMessage }));
          return false;
        }
      }
    }
    return true;
  }, [schema]);

  const touchField = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validate,
    validateField,
    touchField,
    reset,
    hasErrors: Object.keys(errors).some(key => errors[key]),
  };
};