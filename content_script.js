async function getLogic(text,domContent) {
  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const YOUR_API_KEY =  process.env.OPENAI_API_KEY;
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${YOUR_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `${text} : refer for response context from: ${domContent}`
          }
        ],
        stream: true,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const activeElement = document.activeElement;
    let currentPosition = activeElement.selectionStart || 0;
    let buffer = '';
    
    // Store selection info for contentEditable
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      buffer += chunk;
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (!line.trim() || line.includes('[DONE]')) continue;
        
        try {
          const cleanedLine = line.replace(/^data: /, '').trim();
          if (!cleanedLine) continue;
          
          const jsonData = JSON.parse(cleanedLine);
          const content = jsonData.choices[0]?.delta?.content;
          
          if (content) {
            if (activeElement instanceof HTMLTextAreaElement || 
                activeElement instanceof HTMLInputElement) {
              const currentValue = activeElement.value;
              activeElement.value = currentValue.slice(0, currentPosition) + 
                                   content +
                                   currentValue.slice(currentPosition);
              currentPosition += content.length;
              activeElement.selectionStart = currentPosition;
              activeElement.selectionEnd = currentPosition;
              activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            } 
            else if (activeElement.isContentEditable) {
              // Insert text without creating new nodes for each character
              const textNode = range.endContainer;
              if (textNode.nodeType === Node.TEXT_NODE) {
                const offset = range.endOffset;
                const newText = textNode.textContent.slice(0, offset) + 
                              content + 
                              textNode.textContent.slice(offset);
                textNode.textContent = newText;
                range.setStart(textNode, offset + content.length);
                range.setEnd(textNode, offset + content.length);
              } else {
                const textNode = document.createTextNode(content);
                range.insertNode(textNode);
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
              }
              selection.removeAllRanges();
              selection.addRange(range);
            }
            
            if (!/^\s+$/.test(content)) {
              await new Promise(resolve => setTimeout(resolve, 30));
            }
          }
        } catch (e) {
          continue;
        }
      }
    }
  } catch (error) {
    console.error('Stream error:', error);
    throw new Error(`Error fetching completion: ${error.message}`);
  }
}

function isEditableElement(element) {
  if (!element) return false;
  
  return element.isContentEditable || 
         element.tagName === 'TEXTAREA' || 
         element.tagName === 'INPUT' ||
         element.getAttribute('role') === 'textbox' ||
         element.getAttribute('contenteditable') === 'true';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "logInnerHTML") {
    console.log(document.body.innerText);
    sendResponse({ status: "success" });
    const innerText = document.body.innerText;
    getLogic(innerText)
      .then((result) => {
        // Send the processed result to the popup script to save in history
        chrome.runtime.sendMessage({
          action: "saveToHistory",
          summary: result,
        });
        console.log(result, "result");
      })
      .catch((error) => {
        console.error("Error processing text:", error);
      });
  }

});


// Add this event listener at the bottom of your file
document.addEventListener('keydown', (event) => {

  // Try both ways to detect Cmd+A
  if (event.key === "~") {

    
    event.preventDefault(); // Prevent default select all behavior
    
    console.log('inside logic')
    
    const handleAutofill = async () => {
      const activeElement = document.activeElement;
      if (isEditableElement(activeElement)) {
        const cursorPosition = activeElement.selectionStart;
        const textBeforeCursor = (activeElement.value || activeElement.textContent)
          .substring(0, cursorPosition);
        
        
        const domContent = document.body.innerText;
        console.log("Using innerText:", domContent); // Debug log
        
        console.log("Text before cursor:", textBeforeCursor);
        
        try {
          await getLogic(textBeforeCursor, domContent);
        } catch (error) {
          console.error('Error getting completion:', error);
        }
      }
    };

    handleAutofill().catch(console.error);
  }
});

