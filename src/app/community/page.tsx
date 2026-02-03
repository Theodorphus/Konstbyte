"use client";

import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Post {
  id: string;
  content: string;
  likes: number;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    email: string;
  };
  comments?: Comment[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [postComments, setPostComments] = useState<{ [key: string]: Comment[] }>({});

  useEffect(() => {
    fetchPosts();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data?.user?.id || null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setIsPosting(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPost })
      });

      if (response.ok) {
        const post = await response.json();
        setPosts([post, ...posts]);
        setNewPost('');
        setShowForm(false);
      } else if (response.status === 401) {
        alert('Du måste vara inloggad för att skapa inlägg');
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Idag';
    if (diffDays === 1) return 'Igår';
    return `${diffDays} dagar sedan`;
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(posts.map(p => 
          p.id === postId ? { ...p, likes: data.likes } : p
        ));
      } else if (response.status === 401) {
        alert('Du måste vara inloggad för att gilla inlägg');
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta inlägg?')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      } else {
        alert('Kunde inte ta bort inlägget');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Ett fel inträffade');
    }
  };

  const toggleComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!postComments[postId]) {
        await fetchComments(postId);
      }
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (response.ok) {
        const comments = await response.json();
        setPostComments(prev => ({ ...prev, [postId]: comments }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleComment = async (postId: string) => {
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
      console.error('Error creating comment:', error);
      alert('Misslyckades att skapa kommentar');
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna kommentar?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPostComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
        }));
      } else {
        alert('Misslyckades att ta bort kommentar');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Misslyckades att ta bort kommentar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Community</h1>
        <Button 
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Avbryt' : 'Skapa inlägg'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Dela dina tankar med communityn..."
                className="w-full p-3 border rounded text-sm"
                rows={4}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={isPosting}>
                  {isPosting ? 'Publicerar...' : 'Publicera'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Avbryt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center text-slate-600">
            Laddar inlägg...
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-slate-600">Inga inlägg ännu. Var först att dela något!</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setShowForm(true)}>Skapa första inlägget</Button>
              <Button variant="outline" asChild>
                <Link href="/auth/register">Gå med i communityn</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Link href={`/users/${post.author.id}`} className="flex items-center gap-3 hover:bg-slate-50 rounded p-1 -m-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
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
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {post.content}
                </p>
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
                  <button className="hover:text-slate-700">Dela</button>
                </div>

                {/* Comments Section */}
                {expandedPost === post.id && (
                  <div className="pt-4 border-t space-y-3">
                    {/* Comment Input */}
                    {currentUserId && (
                      <div className="flex gap-2">
                        <Input
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({
                            ...prev,
                            [post.id]: e.target.value
                          }))}
                          placeholder="Skriv en kommentar..."
                          className="flex-1 text-sm"
                          onKeyDown={(e) => {
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

                    {/* Comments List */}
                    <div className="space-y-2">
                      {postComments[post.id]?.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-2">
                          Inga kommentarer ännu. Var först att kommentera!
                        </p>
                      )}
                      {postComments[post.id]?.map((comment) => (
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
