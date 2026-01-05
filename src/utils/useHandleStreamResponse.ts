import * as React from "react";

function useHandleStreamResponse({ onChunk, onFinish }: { onChunk: (chunk: string) => void, onFinish: (content: string) => void }) {
  const handleStreamResponse = React.useCallback(
    async (response: Response) => {
      if (response.body) {
        const reader = response.body.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let content = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              onFinish(content);
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            content += chunk;
            onChunk(content);
          }
        }
      }
    },
    [onChunk, onFinish],
  );
  const handleStreamResponseRef = React.useRef(handleStreamResponse);
  React.useEffect(() => {
    handleStreamResponseRef.current = handleStreamResponse;
  }, [handleStreamResponse]);
  return React.useCallback(
    (response: Response) => handleStreamResponseRef.current(response),
    [],
  );
}

export default useHandleStreamResponse;
