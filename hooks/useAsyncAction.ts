import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

interface UseAsyncActionOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * Hook pour gérer les actions asynchrones avec loading state + toast automatique.
 *
 * Usage :
 *   const [execute, loading] = useAsyncAction(async () => {
 *     await updateMarket(id, data);
 *   }, { successMessage: "Marché mis à jour.", errorMessage: "Erreur de mise à jour." });
 *
 *   <button onClick={execute} disabled={loading}>Sauvegarder</button>
 */
export function useAsyncAction(
  action: () => Promise<void>,
  options: UseAsyncActionOptions = {}
): [() => Promise<void>, boolean] {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const execute = useCallback(async () => {
    setLoading(true);
    try {
      await action();
      if (options.successMessage) toast.success(options.successMessage);
      options.onSuccess?.();
    } catch (error) {
      toast.error(options.errorMessage || "Une erreur est survenue.");
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [action, options.successMessage, options.errorMessage, toast]);

  return [execute, loading];
}
