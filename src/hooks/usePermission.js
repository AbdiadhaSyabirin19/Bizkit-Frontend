import { useAuth } from '../context/AuthContext'

export const usePermission = () => {
  const { user } = useAuth()
  const permissions = user?.role?.permissions || user?.role?.Permissions

  const can = (module, action) => {
    if (!user?.role) return false
    if (!permissions) return false
    const modulePerms = permissions[module] || []
    return modulePerms.includes(action)
  }

  const canView = (module) => can(module, 'view')

  const canAny = (module) => {
    if (!user?.role) return false
    if (!permissions) return false
    return (permissions[module] || []).length > 0
  }

  return { can, canView, canAny, permissions }
}