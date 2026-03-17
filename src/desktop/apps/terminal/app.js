/** Terminal app — simple command input that displays output. */

(() => {
  AppRegistry.register({
    id: 'terminal',
    title: 'Terminal',
    icon: '⬛',
    category: 'Productivity',
    defaultSize: { w: 700, h: 450 },
    minSize: { w: 400, h: 250 },
    allowMultiple: true,

    init(contentEl) {
      contentEl.style.cssText = 'display:flex;flex-direction:column;height:100%;background:#0d1117;';

      contentEl.innerHTML = `
        <div class="term-output" style="flex:1;overflow-y:auto;padding:12px;font-family:var(--font-mono);font-size:13px;color:#c9d1d9;white-space:pre-wrap;word-break:break-all;"></div>
        <div style="display:flex;align-items:center;padding:8px 12px;border-top:1px solid #21262d;background:#161b22;">
          <span style="color:#58a6ff;font-family:var(--font-mono);font-size:13px;margin-right:8px;">$</span>
          <input type="text" class="term-input" style="flex:1;background:transparent;border:none;color:#c9d1d9;font-family:var(--font-mono);font-size:13px;outline:none;" placeholder="Type a command..." autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">
        </div>
      `;

      const output = contentEl.querySelector('.term-output');
      const input = contentEl.querySelector('.term-input');
      const history = [];
      let historyIdx = -1;

      function writeLine(text, colour) {
        const line = document.createElement('div');
        line.textContent = text;
        if (colour) line.style.color = colour;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
      }

      function writeHtml(html) {
        const line = document.createElement('div');
        line.innerHTML = html;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
      }

      writeLine('iPhone Desktop Terminal v1.0', '#58a6ff');
      writeLine('Type "help" for available commands.\n', '#8b949e');

      const commands = {
        help() {
          writeLine('Available commands:', '#58a6ff');
          writeLine('  help        — Show this help');
          writeLine('  clear       — Clear terminal');
          writeLine('  date        — Show current date/time');
          writeLine('  uptime      — Server uptime');
          writeLine('  sysinfo     — System information');
          writeLine('  ls [path]   — List files');
          writeLine('  cat <file>  — Read file contents');
          writeLine('  mkdir <dir> — Create directory');
          writeLine('  rm <path>   — Delete file/directory');
          writeLine('  echo <text> — Print text');
          writeLine('  theme       — Toggle dark/light mode');
          writeLine('  whoami      — Who are you?');
          writeLine('');
        },
        clear() {
          output.innerHTML = '';
        },
        date() {
          writeLine(new Date().toString());
        },
        async uptime() {
          try {
            const info = await DesktopAPI.getSystemInfo();
            const s = info.uptime;
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            writeLine(`Server uptime: ${h}h ${m}m ${s % 60}s`);
          } catch (err) {
            writeLine('Error: ' + err.message, '#f85149');
          }
        },
        async sysinfo() {
          try {
            const info = await DesktopAPI.getSystemInfo();
            writeLine(`Platform:    ${info.platform}`);
            writeLine(`Node:        ${info.nodeVersion}`);
            writeLine(`Memory:      ${(info.memoryUsage / 1024 / 1024).toFixed(1)} MB`);
            writeLine(`Uptime:      ${info.uptime}s`);
            if (info.storage) {
              writeLine(`Storage:     ${(info.storage.used / 1024 / 1024 / 1024).toFixed(1)} / ${(info.storage.total / 1024 / 1024 / 1024).toFixed(1)} GB`);
            }
          } catch (err) {
            writeLine('Error: ' + err.message, '#f85149');
          }
        },
        async ls(args) {
          try {
            const path = args[0] || '';
            const result = await DesktopAPI.listFiles(path);
            if (result.items.length === 0) {
              writeLine('(empty directory)');
            } else {
              for (const item of result.items) {
                const icon = item.type === 'directory' ? '📁' : '📄';
                const size = item.type === 'file' ? `  ${formatSize(item.size)}` : '';
                writeLine(`${icon} ${item.name}${size}`);
              }
            }
          } catch (err) {
            writeLine('Error: ' + err.message, '#f85149');
          }
        },
        async cat(args) {
          if (!args[0]) { writeLine('Usage: cat <file>', '#f59e0b'); return; }
          try {
            const resp = await DesktopAPI.readFile(args[0]);
            const text = await resp.text();
            writeLine(text);
          } catch (err) {
            writeLine('Error: ' + err.message, '#f85149');
          }
        },
        async mkdir(args) {
          if (!args[0]) { writeLine('Usage: mkdir <dir>', '#f59e0b'); return; }
          try {
            await DesktopAPI.createDir(args[0]);
            writeLine('Directory created: ' + args[0], '#3fb950');
          } catch (err) {
            writeLine('Error: ' + err.message, '#f85149');
          }
        },
        async rm(args) {
          if (!args[0]) { writeLine('Usage: rm <path>', '#f59e0b'); return; }
          try {
            await DesktopAPI.deleteFile(args[0]);
            writeLine('Deleted: ' + args[0], '#3fb950');
          } catch (err) {
            writeLine('Error: ' + err.message, '#f85149');
          }
        },
        echo(args) {
          writeLine(args.join(' '));
        },
        theme() {
          ThemeManager.toggle();
          writeLine('Theme toggled to: ' + ThemeManager.getMode(), '#3fb950');
        },
        whoami() {
          writeLine('iPhone Desktop user');
        },
      };

      function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
      }

      async function execute(cmdLine) {
        const parts = cmdLine.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        writeLine('$ ' + cmdLine, '#8b949e');

        if (!cmd) return;

        if (commands[cmd]) {
          await commands[cmd](args);
        } else {
          writeLine(`Command not found: ${cmd}. Type "help" for available commands.`, '#f59e0b');
        }
        writeLine('');
      }

      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          const cmd = input.value.trim();
          if (cmd) {
            history.push(cmd);
            historyIdx = history.length;
          }
          input.value = '';
          if (cmd) await execute(cmd);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (historyIdx > 0) {
            historyIdx--;
            input.value = history[historyIdx];
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIdx < history.length - 1) {
            historyIdx++;
            input.value = history[historyIdx];
          } else {
            historyIdx = history.length;
            input.value = '';
          }
        }
        e.stopPropagation();
      });

      // Focus input on click anywhere in terminal
      contentEl.addEventListener('click', () => input.focus());
      input.focus();
    },

    destroy() {},
  });
})();
