import { E2eSetupBanner as E2eSetupBannerView } from "@rede-enois/design-system/domain";

import { authApi } from "@/lib/api/auth";
import { generateAndUpload, restoreFromBackup } from "@/lib/e2e/key-manager";

/**
 * Banner no topo do chat quando E2E não está configurado.
 * - Usuário com senha: pede a senha pra gerar/restaurar keypair.
 * - Usuário OAuth sem senha: pede pra definir uma senha primeiro.
 */
export function E2eSetupBanner({
  hasPassword,
  onSetupComplete,
}: {
  hasPassword: boolean;
  onSetupComplete: () => void;
}) {
  const finish = () => {
    onSetupComplete();
    return true;
  };

  return (
    <E2eSetupBannerView
      hasPassword={hasPassword}
      onSetupWithPassword={(password) =>
        restoreFromBackup(password)
          .catch(() => generateAndUpload(password))
          .then(finish, () => false)
      }
      onDefinePassword={(newPassword) =>
        authApi
          .changePassword({ currentPassword: "", newPassword })
          .then(() => generateAndUpload(newPassword))
          .then(finish, () => false)
      }
    />
  );
}
