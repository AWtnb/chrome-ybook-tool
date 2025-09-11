'use strict';

import { Payload, Message, MessageType, from5code } from './helper';
import { FILLER } from './pageParser';

const requestToActiveTab = (msgType: MessageType) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab.id) {
      return;
    }
    const m: Message = {
      to: 'contentScript',
      type: msgType,
      payload: null,
    };
    chrome.tabs.sendMessage(tab.id, m);
  });
};

requestToActiveTab('slack-slash-command');
requestToActiveTab('x-post-content');
requestToActiveTab('x-tree-content');
requestToActiveTab('x-juhan-content');
requestToActiveTab('meta-content');
requestToActiveTab('threads-content');
requestToActiveTab('genpon');
requestToActiveTab('hasso');
requestToActiveTab('general-info');
requestToActiveTab('minimal-info');

const insertPreview = (msgType: MessageType, payload: Payload) => {
  const elem = document.getElementById(msgType);
  const pre = document.createElement('pre');
  pre.classList.add('preview');
  const c = document.createElement('code');
  c.innerText = payload.content;
  pre.appendChild(c);
  elem?.insertAdjacentElement('beforebegin', pre);
};

const clearCopyStatus = () => {
  Array.from(
    document.querySelectorAll<HTMLElement>('button.with-copy')
  ).forEach((elem) => {
    elem.classList.remove('finished');
  });
};

type copyFinishedCallback = () => void;

const copyText = (text: string, callback: copyFinishedCallback) => {
  clearCopyStatus();
  navigator.clipboard.writeText(text).then(callback, () => {
    console.log('failed to copy:', text);
  });
};

const setupButton = (
  msgType: MessageType,
  payload: Payload
): HTMLElement | null => {
  const b = document.getElementById(msgType);
  if (!b) {
    return null;
  }
  if (payload.enabled) {
    b.removeAttribute('disabled');
  }
  return b;
};

document
  .getElementById('juhan-count')
  ?.addEventListener('change', (event: Event) => {
    const v = (event.target as HTMLInputElement).value;
    document.getElementById('x-juhan-content')!.setAttribute('juhan-count', v);
  });

const YCODE_INPUT = document.getElementById('ybook-code') as HTMLInputElement;
YCODE_INPUT.focus();

const jumpByCode = () => {
  const url = `https://www.yuhikaku.co.jp/books/detail/${from5code(
    YCODE_INPUT.value
  )}`;
  window.open(url, '_blank');
};
YCODE_INPUT.onkeydown = (ev: KeyboardEvent) => {
  if (ev.key == 'Enter') {
    jumpByCode();
  }
};

document.getElementById('jump-button')?.addEventListener('click', jumpByCode);

chrome.runtime.onMessage.addListener((msg: Message) => {
  if (msg.to !== 'popup' || !msg.payload) {
    return;
  }
  const payload: Payload = msg.payload;

  if (msg.type === 'slack-slash-command') {
    const button = setupButton(msg.type, payload);
    button?.addEventListener('click', () => {
      copyText(payload.content, () => {
        const url = 'https://digi-yuhi.slack.com/archives/C03HZP034P5';
        window.open(url, '_blank');
      });
    });
    insertPreview(msg.type, payload);
    return;
  }

  if (msg.type === 'x-post-content') {
    const intent = `https://x.com/intent/post?text=${encodeURIComponent(
      payload.content
    )}&isbn=${payload.params[0]}`;
    const button = setupButton(msg.type, payload);
    button?.addEventListener('click', () => {
      window.open(intent, '_blank');
    });
    insertPreview(msg.type, payload);
    return;
  }

  if (msg.type === 'x-tree-content') {
    const button = setupButton(msg.type, payload);
    button?.addEventListener('click', () => {
      copyText(payload.content, () => {
        button?.classList.add('finished');
      });
    });
    insertPreview(msg.type, payload);
    return;
  }

  if (msg.type === 'meta-content') {
    const button = setupButton(msg.type, payload);
    button?.addEventListener('click', () => {
      copyText(payload.content, () => {
        const url =
          'https://business.facebook.com/latest/composer?ref=biz_web_content_manager_published_posts&asset_id=101509805373062&context_ref=POSTS&business_id=114292853233117';
        window.open(url, '_blank');
      });
    });
    insertPreview(msg.type, payload);
    return;
  }

  if (msg.type === 'threads-content') {
    const button = setupButton(msg.type, payload);
    button?.addEventListener('click', () => {
      copyText(payload.content, () => {
        const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(
          payload.content
        )}`;
        window.open(url, '_blank');
      });
    });
    return;
  }

  if (msg.type === 'x-juhan-content') {
    const button = setupButton(msg.type, payload);
    button?.setAttribute('content', payload.content);
    if (payload.enabled) {
      document.getElementById('juhan-count')!.removeAttribute('disabled');
    }
    button?.addEventListener('click', () => {
      const content = button?.getAttribute('content') || '';
      const count = String(button?.getAttribute('juhan-count') || 2);
      const intent = `https://x.com/intent/post?text=${encodeURIComponent(
        content.replace(FILLER, count)
      )}`;
      window.open(intent, '_blank');
    });
    return;
  }

  if (
    msg.type === 'genpon' ||
    msg.type === 'hasso' ||
    msg.type === 'general-info' ||
    msg.type === 'minimal-info'
  ) {
    const button = setupButton(msg.type, payload);
    button?.addEventListener('click', () => {
      copyText(payload.content, () => {
        button?.classList.add('finished');
      });
    });
    return;
  }
});
