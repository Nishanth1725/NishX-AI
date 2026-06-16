import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownMessage({ content }) {
  if (!content) return null;

  return (
    <div className="chat-markdown min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-cyan underline underline-offset-2 hover:text-neon-blue"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-2 max-w-full overflow-x-auto rounded-lg border border-white/10">
              <table className="min-w-full text-left text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="border-b border-white/10 bg-white/5">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 font-medium text-slate-300">{children}</th>,
          td: ({ children }) => <td className="border-t border-white/5 px-3 py-2 text-slate-400">{children}</td>,
          code: ({ inline, className, children }) => {
            if (inline) {
              return (
                <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-neon-cyan">
                  {children}
                </code>
              );
            }
            return (
              <code className={`block overflow-x-auto font-mono text-xs text-slate-200 ${className || ""}`}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-2 max-h-64 max-w-full overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 last:mb-0">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-neon-cyan/40 pl-3 text-slate-400 italic">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => <h1 className="mb-2 text-base font-bold text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 text-sm font-bold text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold text-white">{children}</h3>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
