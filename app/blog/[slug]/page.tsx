import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { supabase } from '../../../lib/supabaseClient';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Link from 'next/link';

export default async function Page({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Error fetching post: {error.message}</p>
          <Link
          className='text-blue-500 hover:underline mt-2 block'
          href={"/blog"}
          >Go back</Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl py-12 space-y-8 mx-2 md:mx-auto">
      <article>
        <header className="mb-8">
          <h1 className="text-5xl font-bold dark:text-gray-100 text-gray-900 mb-4">
            {post.title}
          </h1>
          {post.created_at && (
            <time className="text-gray-500 text-lg">
              {new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          )}
        </header>

        <div className="prose prose-md prose-slate max-w-none
                      prose-headings:font-bold dark:prose-headings:text-gray-100 prose-headings:text-gray-900
                      dark:prose-p:text-gray-300 prose-p:text-gray-700 prose-p:leading-relaxed
                      prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                     dark:prose-strong:text-gray-100 prose-strong:text-gray-900 prose-strong:font-semibold
                      prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-transparent prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']
                      prose-pre:bg-transparent prose-pre:p-0
                      prose-blockquote:border-l-4 prose-blockquote:text-gray-100 dark:prose-blockquote:text-gray-100 prose-blockquote:border-blue-500 dark:prose-blockquote:border-blue-400 dark:prose-blockquote:bg-gray-600 prose-blockquote:bg-gray-100 prose-blockquote:py-2 prose-blockquote:px-4
                      prose-ul:list-disc prose-ol:list-decimal
                     dark:prose-li:text-gray-300 prose-li:text-gray-700
                      prose-img:rounded-lg prose-img:shadow-lg">
          <ReactMarkdown
            components={{
              code({node, inline, className, children, ...props}: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="pre"
                    customStyle={{
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      fontSize: '0.875rem'
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}