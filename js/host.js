'use strict';

const tabs = [...document.querySelectorAll('[role="tab"]')];

function activateTab(tab) {
  for (const candidate of tabs) {
    const selected = candidate === tab;
    candidate.setAttribute('aria-selected', String(selected));
    candidate.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(candidate.getAttribute('aria-controls'));
    panel.hidden = !selected;
    if (selected) {
      const frame = panel.querySelector('iframe');
      if (frame.dataset.src) {
        frame.src = frame.dataset.src;
        delete frame.dataset.src;
      }
    }
  }
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    switch (event.key) {
      case 'ArrowRight': next = tabs[(index + 1) % tabs.length]; break;
      case 'ArrowLeft': next = tabs[(index + tabs.length - 1) % tabs.length]; break;
      case 'Home': next = tabs[0]; break;
      case 'End': next = tabs[tabs.length - 1]; break;
      default: return;
    }
    event.preventDefault();
    activateTab(next);
    next.focus();
  });
});

activateTab(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0]);

ProjectTransfer.receive(
  source => source === document.querySelector('#editorPanel iframe').contentWindow,
  async payload => {
    const tab = document.getElementById('translatorTab');
    activateTab(tab);
    return ProjectTransfer.send(document.querySelector('#translatorPanel iframe').contentWindow, payload);
  }
);