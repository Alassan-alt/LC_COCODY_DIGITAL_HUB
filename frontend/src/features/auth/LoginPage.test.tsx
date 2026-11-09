import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { LoginPage } from "./LoginPage";

vi.mock("../../services/api", () => ({
  api: { post: vi.fn() },
}));

function renderLoginPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
  useAuthStore.getState().clearAuth();
});

describe("LoginPage", () => {
  it("valide les champs requis avant l'appel API", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(await screen.findByText(/email invalide/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("stocke l'utilisateur et le token en cas de succès", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: { id: "1", email: "admin@lccocody.local", role: "SUPER_ADMIN", isActive: true },
          token: "fake-jwt-token",
        },
      },
    });

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), "admin@lccocody.local");
    await user.type(screen.getByLabelText(/mot de passe/i), "Password-123!");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe("fake-jwt-token");
    });
    expect(useAuthStore.getState().user?.email).toBe("admin@lccocody.local");
  });

  it("affiche une erreur en cas d'identifiants invalides", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("Unauthorized"));

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), "admin@lccocody.local");
    await user.type(screen.getByLabelText(/mot de passe/i), "mauvais-mot-de-passe");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(await screen.findByText(/email ou mot de passe incorrect/i)).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
