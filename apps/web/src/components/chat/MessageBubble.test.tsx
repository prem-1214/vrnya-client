import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MessageBubble from "../../components/chat/MessageBubble";
import type { Message } from "../../hooks/useChat";

// MessageSourceList uses electronAPI — already mocked in setup.ts

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "Here is what I found.",
    timestamp: new Date("2026-01-01T10:00:00"),
    ...overrides,
  };
}

const SOURCE = {
  name: "notes.txt",
  path: "C:\\Users\\Prem\\notes.txt",
  content: "The answer is 42.",
  similarity: 0.87,
};

describe("MessageBubble — basic rendering", () => {
  it("renders message content", () => {
    render(<MessageBubble message={makeMessage({ content: "Hello world" })} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("shows 'You' label for user messages", () => {
    render(
      <MessageBubble message={makeMessage({ role: "user", content: "Hi" })} />,
    );
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("shows 'Assistant' label for assistant messages", () => {
    render(<MessageBubble message={makeMessage()} />);
    expect(screen.getByText("Assistant")).toBeInTheDocument();
  });
});

describe("MessageBubble — sources rendering", () => {
  it("renders source file name when sources are present", () => {
    render(
      <MessageBubble
        message={makeMessage({ sources: [SOURCE] })}
        onOpenPreview={vi.fn()}
      />,
    );
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
  });

  it("renders Sources label when sources are present", () => {
    render(
      <MessageBubble
        message={makeMessage({ sources: [SOURCE] })}
        onOpenPreview={vi.fn()}
      />,
    );
    expect(screen.getByText("Sources")).toBeInTheDocument();
  });

  it("renders similarity percentage", () => {
    render(
      <MessageBubble
        message={makeMessage({ sources: [SOURCE] })}
        onOpenPreview={vi.fn()}
      />,
    );
    expect(screen.getByText("87%")).toBeInTheDocument();
  });

  it("calls onOpenPreview with correct path when Preview is clicked", () => {
    const onOpenPreview = vi.fn();
    render(
      <MessageBubble
        message={makeMessage({ sources: [SOURCE] })}
        onOpenPreview={onOpenPreview}
      />,
    );
    fireEvent.click(screen.getByTitle("Preview"));
    expect(onOpenPreview).toHaveBeenCalledWith("C:\\Users\\Prem\\notes.txt");
  });

  it("renders multiple source cards", () => {
    const sources = [
      SOURCE,
      {
        name: "readme.md",
        path: "C:\\readme.md",
        content: "Readme content",
        similarity: 0.72,
      },
    ];
    render(
      <MessageBubble
        message={makeMessage({ sources })}
        onOpenPreview={vi.fn()}
      />,
    );
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
    expect(screen.getByText("readme.md")).toBeInTheDocument();
  });

  it("does NOT render Sources section when sources is empty", () => {
    render(<MessageBubble message={makeMessage({ sources: [] })} />);
    expect(screen.queryByText("Sources")).not.toBeInTheDocument();
  });

  it("does NOT render Sources section when sources is undefined", () => {
    render(<MessageBubble message={makeMessage()} />);
    expect(screen.queryByText("Sources")).not.toBeInTheDocument();
  });
});

describe("MessageBubble — actionPath rendering", () => {
  it("renders Preview and Folder buttons for actionPath when no sources", () => {
    render(
      <MessageBubble
        message={makeMessage({ actionPath: "C:\\Users\\Prem\\new-file.txt" })}
        onOpenPreview={vi.fn()}
      />,
    );
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("Folder")).toBeInTheDocument();
  });

  it("shows filename from actionPath", () => {
    render(
      <MessageBubble
        message={makeMessage({ actionPath: "C:\\Users\\Prem\\new-file.txt" })}
        onOpenPreview={vi.fn()}
      />,
    );
    expect(screen.getByText("new-file.txt")).toBeInTheDocument();
  });

  it("does NOT render actionPath block when sources are present", () => {
    render(
      <MessageBubble
        message={makeMessage({
          actionPath: "C:\\some-file.txt",
          sources: [SOURCE],
        })}
        onOpenPreview={vi.fn()}
      />,
    );
    // Sources block renders, not the single-file action block
    expect(screen.getByText("Sources")).toBeInTheDocument();
    expect(screen.queryByText("Preview")).not.toBeInTheDocument();
  });

  it("does NOT render @@ACTION: markers in content", () => {
    render(
      <MessageBubble
        message={makeMessage({
          content: "File created. @@ACTION:C:\\file.txt@@",
        })}
      />,
    );
    expect(screen.queryByText(/@@ACTION/)).not.toBeInTheDocument();
  });
});

describe("useChat — formatAgentResponse", () => {
  // Test formatAgentResponse by importing it directly.
  // It's not exported, so we test it indirectly through the Message shape
  // that comes out of the hook. Here we test the shape parsing logic directly
  // by extracting it — if your project exports it, import it instead.

  it("handles valid AgentResult envelope", async () => {
    const { formatAgentResponse } = await import("../../hooks/useChat");

    const result = (formatAgentResponse as any)({
      text: "Here is your answer.",
      path: "C:\\file.txt",
      sources: [SOURCE],
      route: "file_question",
    });

    expect(result.content).toBe("Here is your answer.");
    expect(result.actionPath).toBe("C:\\file.txt");
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].path).toBe("C:\\Users\\Prem\\notes.txt");
  });

  it("handles plain string fallback", async () => {
    const { formatAgentResponse } = await import("../../hooks/useChat");

    const result = (formatAgentResponse as any)("plain text response");
    expect(result.content).toBe("plain text response");
    expect(result.sources).toBeUndefined();
    expect(result.actionPath).toBeUndefined();
  });

  it("handles empty array gracefully", async () => {
    const { formatAgentResponse } = await import("../../hooks/useChat");

    const result = (formatAgentResponse as any)([]);
    expect(result.content).toBe("No results found.");
  });
});
