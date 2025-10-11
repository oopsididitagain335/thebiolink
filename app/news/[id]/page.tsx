'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface NewsPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  authorName: string;
  publishedAt: string;
  likes: number;
  comments: Array<{
    id: string;
    content: string;
    author: string;
    authorName: string;
    createdAt: string;
  }>;
}

// ✅ Explicit type annotation on props — this fixes the build error
export default function NewsPostPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const [post, setPost] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailMap, setEmailMap] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/news/${id}`);
        if (!res.ok) throw new Error('Post not found');
        const data = await res.json();
        setPost(data);
      } catch (error) {
        console.error('Failed to load post', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleInteraction = async (type: 'like' | 'comment', content?: string) => {
    if (!emailMap.trim()) {
      alert('Please enter your email to interact');
      return;
    }

    try {
      const res = await fetch('/api/news/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, email: emailMap, type, content })
      });

      const updatedPost = await res.json();
      if (res.ok) {
        setPost(updatedPost);
        setEmailMap('');
      } else {
        alert(updatedPost.error || 'Action failed');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/news/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus(''), 2000);
      } catch (e) {
        alert('Failed to copy link. Please copy manually: ' + url);
      }
      document.body.removeChild(textArea);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Post not found.</div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900/20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-900/70 backdrop-blur-xl z-50 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">B</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
                BioLink
              </span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              {['/', '/news', '/pricing', '/auth/login', '/auth/signup'].map((href) => (
                <Link
                  key={href}
                  href={href}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 transition-all duration-200"
                >
                  {href === '/' && 'Home'}
                  {href === '/pricing' && 'Pricing'}
                  {href === '/auth/login' && 'Login'}
                  {href === '/auth/signup' && 'Signup'}
                </Link>
              ))}
              <Link
                href="https://discord.gg/29yDsapcXh"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-indigo-300 hover:bg-indigo-900/30 transition-all duration-200 flex items-center gap-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.198.363-.437.828-.635 1.222a18.6 18.6 0 0 0-5.487 0a12.69 12.69 0 0 0-.635-1.222a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.207-1.967a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.027-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.027.128a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.106c.36.698.772 1.362 1.206 1.967a.078.078 0 0 0 .084.028a19.839 19.839 0 0 0 6.03-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.175 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.175 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418z" />
                </svg>
                Discord
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/news" className="text-indigo-400 hover:text-indigo-300 mb-6 inline-block">
            ← Back to News
          </Link>

          <article className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden">
            {post.imageUrl && (
              <div className="w-full h-64 md:h-96 overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <header className="mb-4">
                <h1 className="text-3xl font-bold text-white">{post.title}</h1>
                <div className="text-sm text-gray-400 mt-2">
                  By {post.authorName} • {new Date(post.publishedAt).toLocaleDateString()}
                </div>
              </header>
              <div
                className="text-gray-300 leading-relaxed mb-6"
                dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
              />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  onClick={() => handleInteraction('like')}
                  className="flex items-center text-gray-300 hover:text-red-400 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill={post.likes > 0 ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  {post.likes} {post.likes === 1 ? 'Like' : 'Likes'}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center text-gray-300 hover:text-indigo-400 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                    />
                  </svg>
                  Share
                  {copyStatus && (
                    <span className="ml-2 text-green-400 text-sm">{copyStatus}</span>
                  )}
                </button>
              </div>

              {/* Comment Input */}
              <div className="mb-6">
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={emailMap}
                    onChange={(e) => setEmailMap(e.target.value)}
                    placeholder="Your email"
                    className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400"
                  />
                  <button
                    onClick={() => {
                      if (emailMap.trim()) {
                        const comment = prompt('Enter your comment:');
                        if (comment) handleInteraction('comment', comment);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg whitespace-nowrap"
                  >
                    Comment
                  </button>
                </div>
              </div>

              {/* Comments */}
              {post.comments.length > 0 && (
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-gray-300 font-medium mb-3">
                    Comments ({post.comments.length})
                  </h3>
                  <div className="space-y-3">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-700/30 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{comment.authorName}</span>
                          <span className="text-gray-400 text-sm">@{comment.author}</span>
                          <span className="text-gray-500 text-xs">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-300">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
