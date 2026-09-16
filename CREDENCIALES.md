# 🔐 Credenciales de Acceso a NexaAdmin

Este documento contiene las contraseñas predeterminadas del sistema y los accesos de emergencia. **Por favor, mantén este archivo seguro o bórralo una vez hayas memorizado las credenciales.**

He simplificado la lista de usuarios. El sistema ahora cuenta estrictamente con estas 3 cuentas optimizadas:

## 👤 Usuarios del Sistema

| Perfil / Nombre | Usuario (Login) | Contraseña | Rol / Permisos | Notas |
| :--- | :--- | :--- | :--- | :--- |
| **Desarrollador Master** | `admin` | **`Nexa.2026`** | `Desarrollador` | Perfil maestro por defecto. Acceso total y libre. |
| **Gerente General** | `gerente` | **`1234`** | `Gerente` | Acceso financiero y administrativo. No puede borrar base de datos. |
| **Vendedor Principal** | `vendedor` | **`1234`** | `Vendedor` / `Caja` | Solo acceso al Punto de Venta (POS) y visualización. |

> *(Nota: Si escribes parte del usuario en el login, el sistema te sugerirá autocompletarlo).*

---

## 🆘 Clave Maestra de Emergencia (Modo Rescate)

Al ser NexaAdmin un software 100% local (sin conexión a servidores externos), si algún usuario cambia las contraseñas y olvida el acceso, el sistema quedaría bloqueado. 

Para evitar perder la información de tu empresa, he programado una **Clave de Rescate**.

| Uso | Contraseña Maestra | Instrucciones |
| :--- | :--- | :--- |
| **Desbloqueo de Emergencia** | **`NEXA_RESCUE_999`** | Si te quedas por fuera, escribe el usuario admin (o gerente) y en la contraseña usa esta clave exacta. Te forzará la entrada al sistema. |
