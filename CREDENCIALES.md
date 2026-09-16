# 🔐 Credenciales de Acceso a NexaAdmin

Este documento contiene las contraseñas predeterminadas del sistema y los accesos de emergencia. **Por favor, mantén este archivo seguro o bórralo una vez hayas memorizado las credenciales.**

## 👤 Usuarios del Sistema

| Perfil / Nombre | Usuario (Login) | Contraseña | Rol / Permisos | Notas |
| :--- | :--- | :--- | :--- | :--- |
| **Soporte / Administrador** | `admin` | **`Nexa.2026`** | `Desarrollador` (Acceso Total) | Perfil maestro por defecto. Tiene acceso a configuración, auditoría y todos los módulos. |
| *(Tus otros empleados)* | *(Definido por ti)* | *(Definido por ti)* | `Caja`, `Bodega`, etc. | Puedes crearlos desde el módulo "Gestión de Usuarios". |

---

## 🆘 Clave Maestra de Emergencia (Modo Rescate)

Al ser NexaAdmin un software 100% local (sin conexión a servidores externos), si algún usuario cambia las contraseñas y olvida el acceso, el sistema quedaría bloqueado. 

Para evitar perder la información de tu empresa, he programado una **Clave de Rescate**.

| Uso | Contraseña Maestra | Instrucciones |
| :--- | :--- | :--- |
| **Desbloqueo de Emergencia** | **`NEXA_RESCUE_999`** | Si te quedas por fuera, en la pantalla de Login selecciona cualquier usuario y escribe esta clave exacta. Te dejará entrar sin importar qué contraseña tenga realmente ese usuario. |

> **Recomendación:** Una vez dentro del sistema con el usuario `admin`, ve al módulo **Usuarios y Accesos**, crea los perfiles de tu equipo (Cajeros, Vendedores) y asígnales sus propias claves.
