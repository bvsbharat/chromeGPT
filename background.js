let currentTabId = null;
let intervalId = null;
chrome.commands.onCommand.addListener((command) => {
  if (command === "logInnerHTML") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        currentTabId = tabs[0].id;
        chrome.scripting.executeScript(
          {
            target: { tabId: currentTabId },
            func: () => {
              const text = document.body.innerText;
              return text;
            },
          },
          async (results) => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
            } else {
              const text = results[0].result;
              getLogic(text)
                .then(async (result) => {
                  // Send the processed result to the popup script to save in history
                  await saveToHistory(result);
                })
                .catch((error) => {
                  console.error("Error processing text:", error);
                });
            }
          }
        );
      }
    });
  }
});

function process() {
  console.log(document.body.innerHTML);
}

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === currentTabId) {
    clearInterval(intervalId);
    intervalId = null;
  }
});

// Function to save summary to history
async function saveToHistory(summaries) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["history"], (result) => {
      let history = result.history;
      // Ensure history is an array
      if (!Array.isArray(history)) {
        console.warn(
          "History is not an array, initializing as an empty array."
        );
        history = [];
      }
      console.log("Summaries to add:", summaries);

      // Ensure summaries is an array
      if (!Array.isArray(summaries)) {
        console.warn("Summaries is not an array, wrapping it in an array.");
        summaries = [summaries];
      }

      // Concatenate the new summaries with the existing history
      const updatedHistory = summaries.concat(history);
      console.log("Updated history:", updatedHistory);

      // Save the entire updated history
      chrome.storage.local.set({ history: updatedHistory }, () => {
        resolve();
      });
    });
  });
}

async function getLogic(text) {
  const apiUrl = "https://api.anthropic.com/v1/messages";
  const API_KEY = process.env.ANTHROPIC_API_KEY;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        messages: [
          {
            role: "user",
            content: ` Process the ${text} and solve the problem in the question asked here in JavaScript.
                      Important Rules: 
                        1. No formating like *** for explantion
                        3. Strict no to formaint like : - **Two Pointers:** 
                        2. No Reach text format

                      Example output below in javascript format:

                      \`\`\`javascript

                      /* 
                      
                      Clarify the Problem
                      - Are the two input strings guaranteed to be non-empty?
                      - Is there any limit on the length of the strings?
                      - What should be the behavior when one string is significantly longer than the other?
                      - What should be returned if both strings are empty?

                      Identify Edge Cases and Constraints
                      - Both strings are empty: If both word1 and word2 are empty, the result should be an empty string.
                      - One string is empty: If one of the strings is empty, the output should just be the other string.
                      - Unequal lengths: If word1 is shorter than word2 (or vice versa), the extra characters from the longer string should be appended at the end.

                      Brute Force Approach:
                      - Initialize an empty string to store the result.
                      - Iterate through both strings simultaneously using a loop that alternates between adding characters from word1 and word2.
                      - Handle the case where one string is longer than the other by appending the remaining characters from the longer string to the result after the loop ends.
                      - Return the final result as a single merged string. 
                      
                      */

                      function mergeAlternatelyBruteForce(word1, word2) {
                          // Initialize an empty string to store the merged result
                          let result = '';

                          // Get the lengths of both strings
                          let len1 = word1.length;
                          let len2 = word2.length;

                          // Get the length of the shorter string
                          let minLength = Math.min(len1, len2);

                          // Loop through both strings up to the length of the shorter string
                          for (let i = 0; i < minLength; i++) {
                              // Add one character from word1 followed by one from word2
                              result += word1[i];
                              result += word2[i];
                          }

                          // If word1 is longer, append the remaining characters
                          if (len1 > len2) {
                              result += word1.slice(minLength);
                          }

                          // If word2 is longer, append the remaining characters
                          if (len2 > len1) {
                              result += word2.slice(minLength);
                          }

                          // Return the final merged string
                          return result;
                      }

                      // Example 1:
                      console.log(mergeAlternatelyBruteForce("abc", "pqr")); // Output: "apbqcr"

                      // Example 2:
                      console.log(mergeAlternatelyBruteForce("ab", "pqrs")); // Output: "apbqrs"

                      /* Time and Space Complexity:
                          - Time Complexity: O(n + m), where n is the length of word1 and m is the length of word2.
                          - Space Complexity: O(n + m), since the merged result is stored in an array.

                        Conclusion:
                          - The brute force approach is simple and easy to understand. It solves the problem efficiently for moderate input sizes. Given that the time complexity is O(n + m), this brute force approach is already fairly optimal, but it can be improved slightly by using a list or array to build the result (which is more efficient than direct string concatenation in some languages like Python, though in TypeScript this difference is minimal).
                      */ 

                      /* 
                      
                      Optimized Approach:
                      - We use two pointers (indices) to traverse both strings simultaneously.
                      - In each loop iteration, we append one character from word1 and one from word2 to the result.
                      - Once one of the strings is exhausted, we append the remaining characters of the longer string.

                      Data Structures:
                      - We use an array merged to collect the characters, which will later be converted to a string.
                      - Using an array is more efficient than concatenating strings directly in each iteration. 

                      */
                     Optimized logic:\`\`\`\javascript 
                      function mergeAlternately(word1, word2) {
                          // Initialize two pointers to traverse both strings
                          let i = 0, j = 0;

                          // Array to collect the merged characters (more efficient than string concatenation)
                          let merged = [];

                          // Traverse both strings simultaneously until we reach the end of either string
                          while (i < word1.length && j < word2.length) {
                              // Append the current character from word1 and word2 alternately
                              merged.push(word1[i]);
                              merged.push(word2[j]);
                              // Move both pointers forward
                              i++;
                              j++;
                          }

                          // If there are remaining characters in word1, append them to the result
                          if (i < word1.length) {
                              merged.push(word1.slice(i));
                          }

                          // If there are remaining characters in word2, append them to the result
                          if (j < word2.length) {
                              merged.push(word2.slice(j));
                          }

                          // Convert the array back to a string and return it
                          return merged.join('');
                      }

                      // Example 1:
                      // Input: word1 = "abc", word2 = "pqr"
                      // Output: "apbqcr"
                      console.log(mergeAlternately("abc", "pqr")); // Output: "apbqcr"

                      // Example 2:
                      // Input: word1 = "ab", word2 = "pqrs"
                      // Output: "apbqrs"
                      console.log(mergeAlternately("ab", "pqrs")); // Output: "apbqrs"

                      // Explanation:
                      // Pointers (i, j): We use two pointers, i for word1 and j for word2, to iterate through both strings.
                      // Alternating Merge: In each iteration, we append one character from word1 and one from word2 to the merged array.
                      // Handling Remainder: If one string is longer than the other, we append the remaining characters from the longer string after the loop ends.

                      // Result: Finally, we join the array of characters into a single string using .join('') and return it.

                      // Time and Space Complexity:
                      // Time Complexity: O(n + m), where n is the length of word1 and m is the length of word2.
                      // Space Complexity: O(n + m), since the merged result is stored in an array.

\`\`\`
              `,
          },
        ],
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    // Return the entire content of the response
    return data.content[0].text;
  } catch (error) {
    return `Error fetching summary. Please try again. (${error.message})`;
  }
}
