import { useState, useEffect } from "react";

interface TermsAcceptanceRecord {
  acceptedAt: string;
  acceptedVersion: string;
}

const TERMS_ACCEPTED_KEY = "vrnya_terms_accepted";
const CURRENT_TERMS_VERSION = "1.0.0"; // Increment when ToS changes

export const useTermsOfServiceAcceptance = () => {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has accepted ToS on mount
  useEffect(() => {
    const checkAcceptance = async () => {
      try {
        const stored = localStorage.getItem(TERMS_ACCEPTED_KEY);
        if (stored) {
          const record: TermsAcceptanceRecord = JSON.parse(stored);
          // Check if acceptance is for current version
          if (record.acceptedVersion === CURRENT_TERMS_VERSION) {
            setHasAccepted(true);
          } else {
            // ToS has been updated, clear old acceptance
            localStorage.removeItem(TERMS_ACCEPTED_KEY);
            setHasAccepted(false);
          }
        } else {
          setHasAccepted(false);
        }
      } catch (error) {
        console.error("Error checking ToS acceptance:", error);
        setHasAccepted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAcceptance();
  }, []);

  const acceptTerms = () => {
    const record: TermsAcceptanceRecord = {
      acceptedAt: new Date().toISOString(),
      acceptedVersion: CURRENT_TERMS_VERSION,
    };
    localStorage.setItem(TERMS_ACCEPTED_KEY, JSON.stringify(record));
    setHasAccepted(true);
  };

  const resetAcceptance = () => {
    localStorage.removeItem(TERMS_ACCEPTED_KEY);
    setHasAccepted(false);
  };

  return {
    hasAccepted,
    isLoading,
    acceptTerms,
    resetAcceptance,
  };
};
