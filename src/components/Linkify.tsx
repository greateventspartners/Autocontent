import React from "react";

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

export default function Linkify({ children }: { children: string }) {
  const parts = children.split(URL_REGEX);

  return (
    <>
      {parts.map((part, i) =>
        URL_REGEX.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80 break-all"
          >
            {part}
          </a>
        ) : (
          part
        )
      )}
    </>
  );
}
