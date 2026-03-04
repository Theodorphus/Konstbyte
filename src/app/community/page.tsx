"use client";

import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import StatusCard from '../../components/StatusCard';
import { PageHeader } from '../../components/PageHeader';

interface Author {
  id: string;
    name: string | null;
    image: string | null;
    email: string;
}

interface Comment {
        id: string;
        content: string;
        createdAt: string;
  author: Author;
}

interface Post {
  id: string;
  content: string;
  likes: number;
  createdAt: string;
  author: Author;
  comments?: Comment[];
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('sv-SE');
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<{ [key: string]: Comment[] }>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    // Optionally fetch user info here, setCurrentUserId(...)
    // Se detta som pseudo-inloggning/placeholder
    setCurrentUserId("current-user-id"); // <- Anpassa till faktisk user-id
  }, []);

  async function fetchPosts() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      alert("Kunde inte hämta inlägg!");
    }
    setIsLoading(false);
  }

  async function handleLike(postId: string) {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setPosts(posts.map(p => p.id === postId ? { ...p, likes: data.likes } : p));
      } else if (response.status === 401) {
        alert('Du måste vara inloggad för att gilla inlägg');
      }
    } catch (error) {
      alert('Kunde inte gilla inlägg');
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Är du säker på att du vill ta bort detta inlägg?')) return;
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      } else {
        alert('Misslyckades att ta bort inlägg');
      }
    } catch (error) {
      alert('Misslyckades att ta bort inlägg');
    }
  }

  async function toggleComments(postId: string) {
    if (!postComments[postId]) {
      try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        if (response.ok) {
          const comments = await response.json();
          setPostComments(prev => ({ ...prev, [postId]: comments }));
        }
      } catch (error) {
        alert('Kunde inte hämta kommentarer');
      }
    }
    setExpandedPost(prev => prev === postId ? null : postId);
  }

  async function handleComment(postId: string) {
    const content = commentInputs[postId];
    if (!content || content.trim().length === 0) return;
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() })
      });
      if (response.ok) {
        const newComment = await response.json();
        setPostComments(prev => ({
                            ...prev,
          [postId]: [newComment, ...(prev[postId] || [])]
        }));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      } else if (response.status === 401) {
        alert('Du måste vara inloggad för att kommentera');
      }
    } catch (error) {
      alert('Misslyckades att skapa kommentar');
    }
  }

  async function handleDeleteComment(commentId: string, postId: string) {
    if (!confirm('Är du säker på att du vill ta bort denna kommentar?')) return;
    try {
      const response = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (response.ok) {
        setPostComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
        }));
      } else {
        alert('Misslyckades att ta bort kommentar');
      }
    } catch (error) {
      alert('Misslyckades att ta bort kommentar');
    }
  }

  async function handlePostSubmit(e: React.FormEvent) {
                              e.preventDefault();
    if (!postContent.trim()) return;
    setIsPosting(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: postContent.trim() })
      });
      if (response.ok) {
        const newPost = await response.json();
        setPosts([newPost, ...posts]);
        setPostContent('');
      } else if (response.status === 401) {
        alert('Du måste vara inloggad för att skriva inlägg');
                            }
    } catch {
      alert('Misslyckades att publicera inlägg');
    }
    setIsPosting(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <PageHeader title="Community" />
      <Card className="mb-4">
        <CardContent>
          <form onSubmit={handlePostSubmit} className="flex flex-col gap-2">
            <Input
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder="Skriv ett nytt inlägg..."
              disabled={isPosting}
              required
                        />
            <Button type="submit" disabled={isPosting || !postContent.trim()}>
              {isPosting ? 'Publicerar...' : '✨ Publicera inlägg'}
            </Button>
          </form>
              </CardContent>
            </Card>

      {isLoading ? (
        <StatusCard message="Laddar inlägg..." icon="⏳" />
      ) : posts.length === 0 ? (
        <StatusCard
          icon="💬"
          title="Inga inlägg ännu"
          message="Var först att dela något i communityt."
        />
      ) : (
        <div className="grid gap-4">
          {posts.map(post => (
            <Card key={post.id}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Link href={`/users/${post.author.id}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-400 text-white font-semibold">
                      {post.author.name?.[0]?.toUpperCase() || post.author.email[0].toUpperCase()}
    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        {post.author.name || 'Anonym användare'}
                      </div>
                      <div className="text-xs text-slate-500">
                        Medlem · {formatTime(post.createdAt)}
                      </div>
                    </div>
                  </Link>
                  {currentUserId === post.author.id && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-xs text-red-600 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded"
                    >
                      Ta bort
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.content}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="hover:text-slate-700 flex items-center gap-1 transition-colors"
                  >
                    👍 {post.likes}
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="hover:text-slate-700 flex items-center gap-1 transition-colors"
                  >
                    💬 Kommentera {postComments[post.id] ? `(${postComments[post.id].length})` : ''}
                  </button>
                </div>
                {expandedPost === post.id && (
                  <div className="pt-4 border-t space-y-3">
                    {currentUserId && (
                      <div className="flex gap-2">
                        <Input
                          value={commentInputs[post.id] || ''}
                          onChange={e =>
                            setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))
}
                          placeholder="Skriv en kommentar..."
                          className="flex-1 text-sm"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleComment(post.id);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleComment(post.id)}
                          disabled={!commentInputs[post.id]?.trim()}
                        >
                          Skicka
                        </Button>
                      </div>
                    )}
                    <div className="space-y-2">
                      {postComments[post.id]?.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-2">
                          Inga kommentarer ännu. Var först att kommentera!
                        </p>
                      )}
                      {postComments[post.id]?.map(comment => (
                        <div key={comment.id} className="bg-slate-50 rounded p-3 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-xs">
                                {comment.author.name || 'Anonym'}
                              </span>
                              <span className="text-xs text-slate-400">
                                · {formatTime(comment.createdAt)}
                              </span>
                            </div>
                            {currentUserId === comment.author.id && (
                              <button
                                onClick={() => handleDeleteComment(comment.id, post.id)}
                                className="text-xs text-red-600 hover:text-red-700"
                              >
                                Ta bort
                              </button>
                            )}
                          </div>
                          <p className="text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

