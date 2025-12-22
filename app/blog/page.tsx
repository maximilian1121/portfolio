import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

type Post = {
  id: string | number;
  title: string;
  created_at: string | Date;
  content: string;
  slug: string;
};

interface BlogPageProps {
  searchParams?: Promise<{ page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const page = parseInt(params?.page || '1', 10);
  const perPage = 10;

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data: posts, count } = await supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .neq("slug", "test")
    .order('created_at', { ascending: false })
    .range(from, to);

  const pageCount = Math.ceil((count ?? 0) / perPage);

  return (
    <div className="max-w-3xl py-12 space-y-8 mx-2 md:mx-auto">
      {posts?.map((post: Post) => (
        <div key={post.id} className="p-4 border rounded-md hover:shadow-lg transition">
          <h2 className="text-xl font-semibold dark:text-gray-300 text-gray-900">{post.title}</h2>
          <p className="text-gray-500 mb-2">
            {new Date(post.created_at).toDateString()}
          </p>
          <div className="line-clamp-3 dark:text-gray-300 text-gray-900">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
          <Link href={`/blog/${post.slug}`} className="text-blue-500 hover:underline mt-2 block">
            Read more
          </Link>
        </div>
      ))}

      <div className="flex gap-3 justify-center items-center dark:text-gray-300">
        {page > 1 && (
          <Link
            href={`/blog?page=${page - 1}`}
            className="h-10 px-4 flex items-center justify-center bg-gray-700 text-gray-900 rounded-md cursor-pointer"
          >
            Previous
          </Link>
        )}

        <span>
          Page {page} of {pageCount}
        </span>

        {page < pageCount && (
          <Link
            href={`/blog?page=${page + 1}`}
            className="h-10 px-4 flex items-center justify-center bg-gray-700 text-gray-900 cursor-pointer"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}