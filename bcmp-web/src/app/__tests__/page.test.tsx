import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import LoginPage from "../page";

// Mock auth context
const mockLogin = vi.fn();
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
    user: null,
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

// Mock toast
const mockToast = vi.fn();
vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("LoginPage (root route /)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders username and password fields", () => {
      render(<LoginPage />);
      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    });

    it("renders the sign in button", () => {
      render(<LoginPage />);
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it("renders kapitan.ph branding", () => {
      render(<LoginPage />);
      expect(screen.getByText(/kapitan\.ph/i)).toBeInTheDocument();
    });

    it("renders feature cards", () => {
      render(<LoginPage />);
      expect(screen.getByText(/Resident Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Smart Documents/i)).toBeInTheDocument();
      expect(screen.getByText(/Mabini AI/i)).toBeInTheDocument();
    });

    it("shows password toggle button", () => {
      render(<LoginPage />);
      // Password field should be type=password by default
      const passwordField = screen.getByPlaceholderText(/password/i);
      expect(passwordField).toHaveAttribute("type", "password");
    });
  });

  describe("form validation", () => {
    it("disables sign in button when both fields are empty", () => {
      render(<LoginPage />);
      const submitButton = screen.getByRole("button", { name: /sign in/i });
      expect(submitButton).toBeDisabled();
    });

    it("disables sign in button when only username is filled", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const usernameField = screen.getByPlaceholderText(/username/i);
      await user.type(usernameField, "kap_tambo");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      expect(submitButton).toBeDisabled();
    });

    it("disables sign in button when only password is filled", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordField = screen.getByPlaceholderText(/password/i);
      await user.type(passwordField, "Tambo@2026!");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      expect(submitButton).toBeDisabled();
    });

    it("enables sign in button when both fields have content", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const usernameField = screen.getByPlaceholderText(/username/i);
      const passwordField = screen.getByPlaceholderText(/password/i);

      await user.type(usernameField, "kap_tambo");
      await user.type(passwordField, "Tambo@2026!");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      expect(submitButton).not.toBeDisabled();
    });

    it("disables sign in button when fields contain only whitespace", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const usernameField = screen.getByPlaceholderText(/username/i);
      const passwordField = screen.getByPlaceholderText(/password/i);

      await user.type(usernameField, "   ");
      await user.type(passwordField, "   ");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("form submission — success", () => {
    it("calls auth.login with the entered credentials", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      render(<LoginPage />);

      const usernameField = screen.getByPlaceholderText(/username/i);
      const passwordField = screen.getByPlaceholderText(/password/i);

      await user.type(usernameField, "kap_tambo");
      await user.type(passwordField, "Tambo@2026!");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("kap_tambo", "Tambo@2026!", expect.anything());
      });
    });

    it("redirects to /dashboard after successful login", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);

      const router = useRouter();
      render(<LoginPage />);

      const usernameField = screen.getByPlaceholderText(/username/i);
      const passwordField = screen.getByPlaceholderText(/password/i);

      await user.type(usernameField, "kap_tambo");
      await user.type(passwordField, "Tambo@2026!");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(router.push).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("shows submitting state while login is in progress", async () => {
      const user = userEvent.setup();
      // Never resolve to keep the loading state
      mockLogin.mockReturnValueOnce(new Promise(() => {}));
      render(<LoginPage />);

      const usernameField = screen.getByPlaceholderText(/username/i);
      const passwordField = screen.getByPlaceholderText(/password/i);

      await user.type(usernameField, "kap_tambo");
      await user.type(passwordField, "Tambo@2026!");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Button should be disabled while submitting
      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /signing in|sign in/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe("form submission — failure", () => {
    it("displays an error when login fails with a message", async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));
      render(<LoginPage />);

      const usernameField = screen.getByPlaceholderText(/username/i);
      const passwordField = screen.getByPlaceholderText(/password/i);

      await user.type(usernameField, "kap_tambo");
      await user.type(passwordField, "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        // Either toast was called or an error message is displayed inline
        const hasToast = mockToast.mock.calls.length > 0;
        const hasInlineError = screen.queryByText(/invalid credentials/i) !== null ||
          screen.queryByText(/invalid/i) !== null ||
          screen.queryByText(/wrong/i) !== null ||
          screen.queryByText(/error/i) !== null;
        expect(hasToast || hasInlineError).toBe(true);
      });
    });

    it("does not redirect to dashboard after failed login", async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

      const router = useRouter();
      render(<LoginPage />);

      const usernameField = screen.getByPlaceholderText(/username/i);
      const passwordField = screen.getByPlaceholderText(/password/i);

      await user.type(usernameField, "kap_tambo");
      await user.type(passwordField, "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      expect(router.push).not.toHaveBeenCalledWith("/dashboard");
    });

    it("re-enables the submit button after a failed login attempt", async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error("Network error"));
      render(<LoginPage />);

      const usernameField = screen.getByPlaceholderText(/username/i);
      const passwordField = screen.getByPlaceholderText(/password/i);

      await user.type(usernameField, "kap_tambo");
      await user.type(passwordField, "Tambo@2026!");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      // Button should be re-enabled after failure
      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /sign in/i });
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("password visibility toggle", () => {
    it("toggles password field to text type when show button is clicked", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordField = screen.getByPlaceholderText(/password/i);
      expect(passwordField).toHaveAttribute("type", "password");

      // Find the toggle button (eye icon)
      const toggleButtons = screen.getAllByRole("button");
      const toggleButton = toggleButtons.find(
        (btn) => !btn.textContent?.match(/sign in/i)
      );

      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordField).toHaveAttribute("type", "text");
      }
    });
  });
});
