const $ = (selector) => document.querySelector(selector);
let state;
let draggedId = null;

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 1800);
}

function render(nextState) {
  state = nextState;
  $('#displayUrl').textContent = state.displayUrl;
  $('#itemCount').textContent = `${state.items.length}件`;
  $('#emptyState').hidden = state.items.length > 0;
  $('#items').replaceChildren(...state.items.map((item) => {
    const li = document.createElement('li');
    li.className = `item${item.id === state.currentId ? ' active' : ''}`;
    li.draggable = true;
    li.dataset.id = item.id;
    const handle = document.createElement('span'); handle.className = 'drag-handle'; handle.textContent = '⠿';
    const info = document.createElement('div');
    const name = document.createElement('div'); name.className = 'item-name'; name.textContent = item.name;
    const meta = document.createElement('div'); meta.className = 'item-meta'; meta.innerHTML = `${item.id === state.currentId ? '<span class="status-dot"></span>表示中 · ' : ''}${item.type === 'video' ? '動画' : '画像'}`;
    info.append(name, meta);
    const remove = document.createElement('button'); remove.className = 'remove'; remove.textContent = '削除';
    remove.addEventListener('click', (event) => { event.stopPropagation(); window.obsFrame.removeItem(item.id); });
    li.addEventListener('click', () => window.obsFrame.selectItem(item.id));
    li.addEventListener('dragstart', () => { draggedId = item.id; });
    li.addEventListener('dragover', (event) => event.preventDefault());
    li.addEventListener('drop', (event) => {
      event.preventDefault();
      if (!draggedId || draggedId === item.id) return;
      const ids = state.items.map((entry) => entry.id);
      ids.splice(ids.indexOf(draggedId), 1);
      ids.splice(ids.indexOf(item.id), 0, draggedId);
      window.obsFrame.reorderItems(ids);
    });
    li.append(handle, info, remove);
    return li;
  }));
}

$('#browseButton').addEventListener('click', () => window.obsFrame.chooseFiles());
$('#copyUrl').addEventListener('click', async () => { await navigator.clipboard.writeText(state.displayUrl); toast('URLをコピーしました'); });
$('#clearButton').addEventListener('click', () => window.obsFrame.clearDisplay());
$('#previousButton').addEventListener('click', () => window.obsFrame.advance(-1));
$('#nextButton').addEventListener('click', () => window.obsFrame.advance(1));

const dropZone = $('#dropZone');
for (const eventName of ['dragenter', 'dragover']) dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add('dragging'); });
for (const eventName of ['dragleave', 'drop']) dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove('dragging'); });
dropZone.addEventListener('drop', (event) => { if (event.dataTransfer.files.length) window.obsFrame.addDroppedFiles([...event.dataTransfer.files]); });

$('#settingsButton').addEventListener('click', () => {
  $('#widthInput').value = state.width; $('#heightInput').value = state.height;
  $('#durationInput').value = state.imageDuration; $('#transitionInput').value = state.transitionMs;
  $('#autoInput').checked = state.autoAdvance; $('#loopInput').checked = state.loopPlaylist;
  $('#mutedInput').checked = state.muted; $('#volumeInput').value = state.volume;
  $('#volumeValue').textContent = `${Math.round(state.volume * 100)}%`;
  $('#settingsDialog').showModal();
});
$('#volumeInput').addEventListener('input', () => { $('#volumeValue').textContent = `${Math.round($('#volumeInput').value * 100)}%`; });
$('#saveSettings').addEventListener('click', (event) => {
  event.preventDefault();
  window.obsFrame.updateSettings({
    width: Number($('#widthInput').value), height: Number($('#heightInput').value),
    imageDuration: Number($('#durationInput').value), transitionMs: Number($('#transitionInput').value),
    autoAdvance: $('#autoInput').checked, loopPlaylist: $('#loopInput').checked,
    muted: $('#mutedInput').checked, volume: Number($('#volumeInput').value)
  });
  $('#settingsDialog').close(); toast('設定を保存しました');
});

window.obsFrame.onStateChanged(render);
window.obsFrame.getState().then(render);
