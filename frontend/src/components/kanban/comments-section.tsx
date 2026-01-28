import { useState } from 'react'
import { Comment } from '@/types'
import { useProjectComments } from '@/hooks/use-project-comments'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Trash2, Send, Loader2, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface CommentsSectionProps {
  projectId: string
}

interface CommentItemProps {
  comment: Comment
  onDelete: (id: string) => void
}

function CommentItem({ comment, onDelete }: CommentItemProps) {
  return (
    <div className="flex gap-3 p-3 rounded-lg border bg-card">
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {comment.author_name || 'Usuário Anônimo'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(comment.id)}
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

export function CommentsSection({ projectId }: CommentsSectionProps) {
  const {
    comments,
    loading,
    createComment,
    deleteComment,
  } = useProjectComments(projectId)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      await createComment({
        project_id: projectId,
        content: newComment.trim(),
        author_name: 'Usuário', // Temporário até sistema de usuários
        author_email: null,
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
    <div className="space-y-3">
      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escreva um comentário..."
          className="min-h-[80px] resize-none"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            size="sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="group">
              <CommentItem comment={comment} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
