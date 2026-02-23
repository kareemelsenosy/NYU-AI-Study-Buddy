import { ChatSession, Message } from '@/types';
import { getChatSession } from './chat-history';
import { formatDate } from './utils';

export async function exportChatToText(sessionId: string): Promise<string> {
  const session = await getChatSession(sessionId);
  if (!session) return '';

  let text = `NYU AI Study Buddy - Chat Export\n`;
  text += `Title: ${session.title}\n`;
  text += `Created: ${formatDate(session.createdAt)}\n`;
  text += `Last Updated: ${formatDate(session.updatedAt)}\n`;
  text += `Total Messages: ${session.messages.length}\n`;
  text += `\n${'='.repeat(60)}\n\n`;

  session.messages.forEach((message, index) => {
    text += `[${message.role.toUpperCase()}] - ${formatDate(message.timestamp)}\n`;
    text += `${message.content}\n`;
    text += `\n${'-'.repeat(60)}\n\n`;
  });

  return text;
}

export async function downloadChatAsText(sessionId: string): Promise<void> {
  const text = await exportChatToText(sessionId);
  const session = await getChatSession(sessionId);
  if (!session) return;

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadChatAsJSON(sessionId: string): Promise<void> {
  const session = await getChatSession(sessionId);
  if (!session) return;

  const json = JSON.stringify(session, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function printChat(sessionId: string): Promise<void> {
  const session = await getChatSession(sessionId);
  if (!session) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print this chat');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${session.title} - NYU AI Study Buddy</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
          .header { border-bottom: 2px solid #57068C; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { color: #57068C; margin: 0; }
          .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
          .message.user { background-color: #57068C; color: white; margin-left: 20%; }
          .message.assistant { background-color: #f3f4f6; border: 1px solid #e5e7eb; margin-right: 20%; }
          .message-header { font-weight: bold; margin-bottom: 8px; font-size: 0.9em; opacity: 0.8; }
          .message-content { white-space: pre-wrap; }
          @media print { body { margin: 0; padding: 10px; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${session.title}</h1>
          <p>Created: ${formatDate(session.createdAt)} | Last Updated: ${formatDate(session.updatedAt)}</p>
          <p>Total Messages: ${session.messages.length}</p>
        </div>
        ${session.messages.map(message => `
          <div class="message ${message.role}">
            <div class="message-header">${message.role === 'user' ? 'You' : 'AI Assistant'} - ${formatDate(message.timestamp)}</div>
            <div class="message-content">${escapeHtml(message.content)}</div>
          </div>
        `).join('')}
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); }, 250);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
