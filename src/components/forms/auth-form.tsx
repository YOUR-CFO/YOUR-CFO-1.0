'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'number';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: RegExp;
    message?: string;
    minLength?: number;
    maxLength?: number;
  };
}

interface AuthFormProps {
  title: string;
  subtitle?: string;
  fields: FormField[];
  submitLabel: string;
  onSubmit: (data: Record<string, string>) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  success?: string;
  footer?: React.ReactNode;
}

export function AuthForm({
  title,
  subtitle,
  fields,
  submitLabel,
  onSubmit,
  isLoading = false,
  error,
  success,
  footer,
}: AuthFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateField = (field: FormField, value: string): string => {
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }

    if (field.validation?.minLength && value.length < field.validation.minLength) {
      return `${field.label} must be at least ${field.validation.minLength} characters`;
    }

    if (field.validation?.maxLength && value.length > field.validation.maxLength) {
      return `${field.label} must be no more than ${field.validation.maxLength} characters`;
    }

    if (field.validation?.pattern && !field.validation.pattern.test(value)) {
      return field.validation.message || `${field.label} is invalid`;
    }

    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field, formData[field.name] || '');
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);

    // If there are errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error is handled by parent component
      console.error('Form submission error:', error);
    }
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPassword(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const renderField = (field: FormField) => {
    const error = errors[field.name];
    const isPassword = field.type === 'password';
    const showPasswordToggle = showPassword[field.name];

    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        <div className="relative">
          {isPassword ? (
            <div className="relative">
              <Input
                id={field.name}
                type={showPasswordToggle ? 'text' : 'password'}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                disabled={isLoading}
                className={error ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={() => togglePasswordVisibility(field.name)}
                disabled={isLoading}
              >
                {showPasswordToggle ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : field.type === 'select' ? (
            <select
              id={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              disabled={isLoading}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : ''
              }`}
            >
              <option value="">Select {field.label.toLowerCase()}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              disabled={isLoading}
              className={error ? 'border-red-500' : ''}
            />
          )}
        </div>
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && (
          <p className="text-gray-600 mt-2">{subtitle}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(renderField)}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </form>

      {footer && (
        <div className="text-center text-sm text-gray-600">
          {footer}
        </div>
      )}
    </div>
  );
}