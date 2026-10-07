import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, getInitials } from '@/lib/utils'

export default function PostCard({ post }) {
  const authorName = post.author?.name || 'Deleted user'
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="line-clamp-2 text-lg leading-snug">
          <Link to={`/posts/${post.slug}`} className="after:absolute after:inset-0 hover:underline">
            {post.title}
          </Link>
        </CardTitle>
        <CardDescription>{formatDate(post.createdAt)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Avatar className="size-6">
          {post.author?.avatar && <AvatarImage src={post.author.avatar} alt={authorName} />}
          <AvatarFallback className="text-[10px]">{getInitials(authorName)}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{authorName}</span>
      </CardFooter>
    </Card>
  )
}
