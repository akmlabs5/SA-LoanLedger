import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailVerified() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-emerald-100 dark:border-emerald-900">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Email Verified Successfully!
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Your account has been verified. You can now log in to Morouna Loans.
          </p>

          {/* Call to Action */}
          <a href="https://www.akm-labs.com" className="block w-full">
            <Button
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold"
              data-testid="button-login-akmlabs"
            >
              Go to www.akm-labs.com to Login
            </Button>
          </a>

          {/* Additional Info */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            You can close this window and return to the login page.
          </p>
        </div>

        {/* Branding Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 Morouna Loans by AKM Labs. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
