import { useState, useMemo } from 'react'
import {
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  Badge,
} from '@mui/material'
import { Notifications as NotificationsIcon, Check, CheckBox } from '@mui/icons-material'
import { useNotifications } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { Notification } from '@/types'

export function NotificationsDropdown() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const navigate = useNavigate()

  const unreadNotifications = notifications.filter((n) => !n.read)

  const unreadByProject = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>()
    unreadNotifications.forEach((notification) => {
      if (notification.project_id) {
        const name = notification.message?.match(/projeto "([^"]+)"/)?.[1] || 'Projeto'
        const cur = map.get(notification.project_id)
        if (cur) cur.count++
        else map.set(notification.project_id, { name, count: 1 })
      }
    })
    return Array.from(map.values())
  }, [unreadNotifications])

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {}
    const withoutProject: Notification[] = []
    notifications.forEach((notification) => {
      if (notification.project_id) {
        if (!groups[notification.project_id]) groups[notification.project_id] = []
        groups[notification.project_id].push(notification)
      } else {
        withoutProject.push(notification)
      }
    })
    return { groups, withoutProject }
  }, [notifications])

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.project_id) {
      if (!notification.read) markAsRead(notification.id)
      handleClose()
      const params = new URLSearchParams({ project: notification.project_id })
      if (notification.related_id && notification.related_type === 'todo') {
        params.set('todo', notification.related_id)
      }
      navigate(`/desenvolvimentos?${params.toString()}`)
    }
  }

  return (
    <>
      <Tooltip
        title={
          unreadCount > 0 ? (
            <Box>
              <Typography variant="body2" fontWeight={600}>Você tem {unreadCount} {unreadCount === 1 ? 'tarefa pendente' : 'tarefas pendentes'}</Typography>
              {unreadByProject.length > 0 && (
                <Box sx={{ mt: 0.5 }}>
                  {unreadByProject.slice(0, 3).map((project, idx) => (
                    <Typography key={idx} variant="caption" display="block" color="inherit" sx={{ opacity: 0.9 }}>
                      • {project.count} TO-DO(s) em {project.name}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            'Notificações'
          )
        }
      >
        <IconButton
          onClick={handleOpen}
          color={unreadCount > 0 ? 'primary' : 'default'}
          sx={{ position: 'relative' }}
          aria-label="Notificações"
          aria-controls={open ? 'notifications-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Badge badgeContent={unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : 0} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 320, maxHeight: 440 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600}>Notificações</Typography>
          {unreadNotifications.length > 0 && (
            <Button size="small" startIcon={<Check />} onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </Box>
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
              Nenhuma notificação
            </Typography>
          ) : (
            <>
              {Object.entries(groupedNotifications.groups).map(([projectId, projectNotifications]) => {
                const projectName = projectNotifications[0]?.message?.match(/projeto "([^"]+)"/)?.[1] || 'Projeto'
                return (
                  <Box key={projectId}>
                    <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                        {projectName}
                      </Typography>
                    </Box>
                    {projectNotifications.map((notification) => (
                      <MenuItem
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        sx={{ py: 1.5, bgcolor: !notification.read ? 'action.selected' : undefined }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckBox fontSize="small" color={!notification.read ? 'primary' : 'inherit'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={notification.title}
                          secondary={
                            <>
                              {notification.message && (
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {notification.message}
                                </Typography>
                              )}
                              <Typography component="span" variant="caption" color="text.secondary">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                              </Typography>
                            </>
                          }
                          primaryTypographyProps={{ fontWeight: !notification.read ? 600 : 400 }}
                        />
                        {!notification.read && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                          >
                            <Check fontSize="small" />
                          </IconButton>
                        )}
                      </MenuItem>
                    ))}
                  </Box>
                )
              })}
              {groupedNotifications.withoutProject.length > 0 && (
                <Box>
                  {groupedNotifications.withoutProject.map((notification) => (
                    <MenuItem key={notification.id} sx={{ py: 1.5, bgcolor: !notification.read ? 'action.selected' : undefined }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckBox fontSize="small" color={!notification.read ? 'primary' : 'inherit'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={notification.title}
                        secondary={
                          <>
                            {notification.message && (
                              <Typography component="span" variant="caption" color="text.secondary" display="block">
                                {notification.message}
                              </Typography>
                            )}
                            <Typography component="span" variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
                            </Typography>
                          </>
                        }
                        primaryTypographyProps={{ fontWeight: !notification.read ? 600 : 400 }}
                      />
                      {!notification.read && (
                        <IconButton size="small" onClick={() => markAsRead(notification.id)}>
                          <Check fontSize="small" />
                        </IconButton>
                      )}
                    </MenuItem>
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>
      </Menu>
    </>
  )
}
