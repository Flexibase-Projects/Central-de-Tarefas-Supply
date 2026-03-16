import { useState } from 'react'
import { Box, TextField, Button, Typography, Avatar, IconButton, CircularProgress } from '@mui/material'
import { Send, Trash2 } from '@/components/ui/icons'
import { Comment } from '@/types'
import { useProjectComments } from '@/hooks/use-project-comments'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { TierBadge } from '@/components/gamification/TierBadge'

interface CommentsSectionProps {
  projectId: string
}

interface CommentItemProps {
  comment: Comment
  onDelete: (id: string) => void
}

function CommentItem({ comment, onDelete }: CommentItemProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        p: 1.5,
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
          <Typography variant="body2" fontWeight={500}>
            {comment.author_name || 'Usuário Anônimo'}
          </Typography>
          {comment.author_level != null && comment.author_level > 0 && (
            <TierBadge level={comment.author_level} size="xs" />
          )}
          <Typography variant="caption" color="text.secondary">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {comment.content}
        </Typography>
      </Box>
      <IconButton size="small" onClick={() => onDelete(comment.id)}>
        <Trash2 size={16} />
      </IconButton>
    </Box>
  )
}

export function CommentsSection({ projectId }: CommentsSectionProps) {
  const { comments, loading, createComment, deleteComment } = useProjectComments(projectId)
  const { currentUser } = useAuth()
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      await createComment({
        project_id: projectId,
        content: newComment.trim(),
        author_name: currentUser?.name || 'Usuário Anônimo',
        author_email: currentUser?.email || null,
      })
      setNewComment('')
    } catch (error) {
      console.error('Error creating comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteComment(id)
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box>
        <TextField
          multiline
          minRows={3}
          fullWidth
          size="small"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escreva um comentário..."
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Send />}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 400, overflowY: 'auto' }}>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} onDelete={handleDelete} />
          ))}
        </Box>
      )}
    </Box>
  )
}
