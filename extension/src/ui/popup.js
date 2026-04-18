function sendMessage(message) {
  if (globalThis.browser?.runtime) {
    return globalThis.browser.runtime.sendMessage(message);
  }

  return new Promise((resolve, reject) => {
    globalThis.chrome.runtime.sendMessage(message, (response) => {
      const error = globalThis.chrome?.runtime?.lastError;
      if (error) {
        reject(error);
        return;
      }
      resolve(response);
    });
  });
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function formatCost(value) {
  return `$${(Number(value) || 0).toFixed(4)}`;
}

function renderSession(session) {
  if (!session) {
    return "No active session";
  }

  return `${formatNumber(session.messages)} msgs • ${formatNumber(session.tokens)} tok • ${formatCost(
    session.cost
  )}`;
}

function renderStats(stats) {
  document.getElementById("totalMessages").textContent = formatNumber(stats.lifetime.total.messages);
  document.getElementById("totalTokens").textContent = formatNumber(stats.lifetime.total.tokens);
  document.getElementById("totalCost").textContent = formatCost(stats.lifetime.total.cost);

  document.getElementById("chatgptSession").textContent = renderSession(stats.sessions.chatgpt);
  document.getElementById("claudeSession").textContent = renderSession(stats.sessions.claude);

  const rows = Object.entries(stats.lifetime.platforms)
    .map(([platform, values]) => {
      return `
        <tr>
          <td>${platform}</td>
          <td>${formatNumber(values.messages)}</td>
          <td>${formatNumber(values.tokens)}</td>
          <td>${formatCost(values.cost)}</td>
        </tr>
      `;
    })
    .join("");

  document.getElementById("platformRows").innerHTML = rows;
}

async function refresh() {
  const response = await sendMessage({ type: "GET_STATS" });
  if (!response?.ok || !response.stats) {
    throw new Error(response?.error || "Failed to load usage stats.");
  }

  renderStats(response.stats);
}

async function reset() {
  const response = await sendMessage({ type: "RESET_USAGE" });
  if (!response?.ok || !response.stats) {
    throw new Error(response?.error || "Failed to reset stats.");
  }

  renderStats(response.stats);
}

document.getElementById("resetButton").addEventListener("click", () => {
  reset().catch((error) => {
    console.error(error);
  });
});

refresh().catch((error) => {
  console.error(error);
});
