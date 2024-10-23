function getSelectedText() {
  return window.getSelection().toString();
}

// Function to get the full page content if no text is selected
async function getFullPageContent(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => document.body.innerText,
  });
  if (chrome.runtime.lastError || !result) {
    return "";
  }
  return result.result;
}

// Function to get the summary from OpenAI API

// Function to get the API key from storage
async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["apiKey"], (result) => {
      resolve(result.apiKey);
    });
  });
}

// Function to format text into paragraphs
function formatText(text) {
  const bulletPoints = text
    .split("\n")
    .map((line) => `<li>${line.trim()}</li>`)
    .join("");
  return `<ul>${bulletPoints}</ul>`;
}

// Function to save summary to history
async function saveToHistory(summary) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["history"], (result) => {
      const history = result.history || [];
      history.unshift(summary);
      if (history.length > 10) history.pop();
      chrome.storage.local.set({ history: history }, () => {
        resolve();
      });
    });
  });
}

// Function to display history
function displayHistory(page = 1, itemsPerPage = 5) {
  chrome.storage.local.get(["history"], (result) => {
    const history = result.history || [];
    const historyDiv = document.getElementById("history");
    if (!historyDiv) {
      console.error("History div not found");
      return;
    }

    const totalPages = Math.ceil(history.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, history.length);
    const paginatedHistory = history.slice(start, end);

    console.log(`Page: ${page}, Total Pages: ${totalPages}, History Length: ${history.length}`);


    historyDiv.innerHTML =
      "<table><thead><tr><th>Code</th><th>Logic</th></tr></thead><tbody></tbody></table>";
    const tbody = historyDiv.querySelector("tbody");


    paginatedHistory.forEach((item, index) => {
      const codeBlockMatch = item.match(/Optimized logic:```javascript ([\s\S]*?)```/);
      const codeBlock = codeBlockMatch ? codeBlockMatch[1].trim() : "";
      const remainingText = item.replace(/```javascript[\s\S]*?```/, "").trim();

      const row = document.createElement("tr");
      row.classList.add("expanded");
      row.innerHTML = `
       <td>
         <div class="summary-container">
          <div class="summary">
          
            <button class="delete-btn" data-index="${
              start + index
            }">Delete</button>
             <div class="explain-logic"></div>
          </div>
        </div>
        </td>
      `;

      const summaryCell = row.querySelector(".summary-container");
      const codeBlockDiv = summaryCell.querySelector(".code-block");
      const explainLogic = summaryCell.querySelector(".explain-logic");

      // const editor = CodeMirror(codeBlockDiv, {
      //   value: codeBlock,
      //   mode: "javascript",
      //   theme: "dracula",
      //   indentUnit: 20,
      //   tabSize: 10,
      //   lineWrapping: true,
      //   lint: true,
      //   indentWithTabs: true,
      // });

      // editor.setSize(600, 200);

      // setTimeout(function () {
      //   editor.refresh(); // Refresh after a small delay
      // }, 100); // Delay in milliseconds

      const explain = CodeMirror(explainLogic, {
        value: item,
        mode: "markdown",
        theme: "dracula",
        indentUnit: 20,
        tabSize: 10,
        lineWrapping: true,
        lint: true,
        indentWithTabs: true,
      });

      explain.setSize(600, 900);

      setTimeout(function () {
        explain.refresh(); // Refresh after a small delay
      }, 100); // Delay in milliseconds

      const deleteButton = row.querySelector(".delete-btn");
      if (deleteButton) {
        deleteButton.addEventListener("click", async (event) => {
          event.stopPropagation();
          await deleteFromHistory(start + index);
          displayHistory(page, itemsPerPage);
        });
      } else {
        console.error("Delete button not found");
      }

      tbody.appendChild(row);
    });

     // Create a pagination div
     const paginationDiv = document.createElement("div");
     paginationDiv.classList.add("pagination-controls");
 
     const prevButton = document.createElement("button");
     prevButton.innerText = "Previous";
     prevButton.disabled = page <= 1;
     prevButton.addEventListener("click", () => displayHistory(page - 1, itemsPerPage));
     paginationDiv.appendChild(prevButton);
 
     const nextButton = document.createElement("button");
     nextButton.innerText = "Next";
     nextButton.disabled = page >= totalPages;
     nextButton.addEventListener("click", () => displayHistory(page + 1, itemsPerPage));
     paginationDiv.appendChild(nextButton);
 
     // Append the pagination div to the historyDiv
     historyDiv.appendChild(paginationDiv);
  });
}

// Function to delete an item from history
async function deleteFromHistory(index) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["history"], (result) => {
      const history = result.history || [];
      history.splice(index, 1);
      // Save back to local storage
      chrome.storage.local.set({ history: history }, () => {
        resolve();
      });
    });
  });
}

// Event listener for DOM content loaded
document.addEventListener("DOMContentLoaded", () => {
  displayHistory();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.history) {
    displayHistory();
  }
});

// can we added a logic to trigger displayHistory(); when chrome.storage.local.get updated ? 